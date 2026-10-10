/** Versioned local save lifecycle. Generation changes identify explicit world replacements. */
import { createHedgeState, validateHedgeState, parseHedgeSave, serialiseHedgeSave, HEDGE_SAVE_KEY } from './hedge-model.js';
import { withSaveLock } from './hedge-persistence.js';
export const HEDGE_BACKUP_KEY = 'under-the-hedge.backup.v1';
const unavailable = 'Your browser could not save. This session can continue; download a save to keep these changes.';
const conflict = 'This world changed in another tab. Reload before replacing or changing it.';
function store() { const storage = globalThis.localStorage; if (!storage) throw new Error(unavailable); return storage; }
function fail(message) { throw new Error(message); }
function generation() { return globalThis.crypto?.randomUUID?.() || `hedge-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`; }
function decode(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 160000) fail('This stored world is not a readable Under the Hedge save.');
  let envelope; try { envelope = JSON.parse(raw); } catch { fail('The stored world could not be read. Its original data has been kept.'); }
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope) || Object.keys(envelope).length !== 3 || envelope.format !== 1 || typeof envelope.generation !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(envelope.generation) || !Object.hasOwn(envelope,'state')) fail('The stored world format is not supported. Its original data has been kept.');
  // Strict state parser checks duplicate keys inside state, too; first reject
  // duplicate envelope keys before taking JSON.parse's last-value semantics.
  rejectDuplicateEnvelopeKeys(raw);
  const state = parseHedgeSave(JSON.stringify(envelope.state));
  return { state, generation:envelope.generation, raw, blocked:false, unsaved:false, error:null };
}
function rejectDuplicateEnvelopeKeys(text) {
  let position = 0;
  function space() { while (/\s/u.test(text[position] ?? '') && position < text.length) position += 1; }
  function string() {
    const start = position++;
    while (position < text.length) {
      const character = text[position++];
      if (character === '\\') position += 1;
      else if (character === '"') return JSON.parse(text.slice(start, position));
    }
  }
  function value(depth = 0) {
    space();
    if (depth > 14) fail(`This save has too many layers of details. The limit is ${14} levels.`);
    if (text[position] === '{') {
      position += 1;
      space();
      const keys = new Set();
      while (text[position] !== '}') {
        space();
        const key = string();
        if (keys.has(key)) fail(`This save lists “${key}” twice. Keep one copy of that detail and try again.`);
        keys.add(key);
        space();
        position += 1; // colon, already validated by JSON.parse
        value(depth + 1);
        space();
        if (text[position] !== ',') break;
        position += 1;
      }
      position += 1;
    } else if (text[position] === '[') {
      position += 1;
      space();
      while (text[position] !== ']') {
        value(depth + 1);
        space();
        if (text[position] !== ',') break;
        position += 1;
      }
      position += 1;
    } else if (text[position] === '"') string();
    else while (position < text.length && !/[\s,}\]]/u.test(text[position])) position += 1;
  }
  value();
}

function envelopeRaw(state, id) { const validated = parseHedgeSave(serialiseHedgeSave(state)); return JSON.stringify({format:1,generation:id,state:validated}); }
export function loadHedgeWorld() {
  let raw;
  try { raw=store().getItem(HEDGE_SAVE_KEY); }
  catch { return {state:createHedgeState(),generation:null,raw:null,blocked:false,unsaved:true,unavailable:true,error:unavailable}; }
  if(raw===null) return {state:createHedgeState(),generation:null,raw:null,blocked:false,unsaved:false,error:null};
  try {return decode(raw);} catch(error) {return {state:createHedgeState(),generation:null,raw,blocked:true,unsaved:false,error:error.message};}
}
function readCurrent(storage) {
  const raw=storage.getItem(HEDGE_SAVE_KEY);
  if(raw===null) return {state:null,generation:null,raw:null,blocked:false};
  try{return decode(raw);}catch(error){return {state:null,generation:null,raw,blocked:true,error:error.message};}
}
function checkedResult(operation,state) {
  const next=operation(structuredClone(state));
  if(next && typeof next.then==='function') fail('Save operations must finish synchronously.');
  validateHedgeState(next); serialiseHedgeSave(next); return next;
}
function memoryResult(observed,operation,message=unavailable) {
  if(observed.blocked) fail('Your saved world needs recovery first. Import a valid save; the unreadable original will be backed up.');
  return {...observed,state:checkedResult(operation,observed.state),unsaved:true,error:message};
}
export async function mutateHedgeWorld(observed,operation) {
  let entered=false;
  try {
    return await withSaveLock(()=>{
      entered=true;
      let storage,current;
      try {storage=store();current=readCurrent(storage);} catch {return memoryResult(observed,operation);}
      if(observed.blocked || current.blocked) fail('Your saved world needs recovery first. Import a valid save; the unreadable original will be backed up.');
      if(current.generation!==observed.generation || (observed.unsaved && current.raw!==observed.raw)) fail(conflict);
      const basis=observed.unsaved || !current.state ? observed.state : current.state;
      const next=checkedResult(operation,basis), id=current.generation || generation();
      const raw=envelopeRaw(next,id);
      try { storage.setItem(HEDGE_SAVE_KEY,raw); }
      catch {return {state:next,generation:current.generation,raw:current.raw,blocked:false,unsaved:true,error:unavailable};}
      return {state:next,generation:id,raw,blocked:false,unsaved:false,error:null};
    });
  } catch(error) {
    if(entered) throw error;
    // With no safe mutex, never write. An exportable local session remains useful.
    return memoryResult(observed,operation,error.message || unavailable);
  }
}
function replace(storage,observed,state) {
  const currentRaw=storage.getItem(HEDGE_SAVE_KEY);
  if(currentRaw!==observed.raw) fail(conflict);
  const previousBackup=storage.getItem(HEDGE_BACKUP_KEY);
  const id=generation(),raw=envelopeRaw(state,id);
  // A valid new world must not consume the sole recovery copy on a failed write.
  try {
    if(currentRaw!==null) storage.setItem(HEDGE_BACKUP_KEY,currentRaw);
    storage.setItem(HEDGE_SAVE_KEY,raw);
  } catch(error) {
    try {if(previousBackup===null)storage.removeItem(HEDGE_BACKUP_KEY);else storage.setItem(HEDGE_BACKUP_KEY,previousBackup);}catch {/* Original world remains untouched; surface the failure. */}
    fail('The replacement could not be saved. Your current world has not changed.');
  }
  return {state:structuredClone(state),generation:id,raw,blocked:false,unsaved:false,error:null};
}
export async function importHedgeWorld(observed,rawPureState) {
  const state=parseHedgeSave(rawPureState);
  return withSaveLock(()=>replace(store(),observed,state));
}
export async function restoreHedgeBackup(observed) {
  return withSaveLock(()=>{
    const storage=store(),backup=storage.getItem(HEDGE_BACKUP_KEY);
    if(backup===null) fail('There is no previous world to restore yet.');
    let previous;
    try {previous=decode(backup);} catch {fail('The previous copy is unreadable. It has been kept for recovery.');}
    return replace(storage,observed,previous.state);
  });
}
