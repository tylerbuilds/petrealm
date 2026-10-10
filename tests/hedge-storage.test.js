import test from 'node:test';
import assert from 'node:assert/strict';
import {loadHedgeWorld,mutateHedgeWorld,importHedgeWorld,restoreHedgeBackup,HEDGE_BACKUP_KEY} from '../src/hedge-storage.js';
import {createHedgeState,beginHedge,investigateSurface,serialiseHedgeSave,HEDGE_SAVE_KEY} from '../src/hedge-model.js';
function fixture() {
  const data=new Map(); let failKey=null, lockTail=Promise.resolve();
  const storage={getItem:key=>data.get(key)??null,setItem(key,value){if(key===failKey)throw new Error('Quota');data.set(key,value);},removeItem:key=>data.delete(key)};
  Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true});
  Object.defineProperty(globalThis,'navigator',{value:{locks:{request(name,options,fn){assert.equal(name,'under-the-hedge:save-v1');const job=lockTail.then(fn);lockTail=job.catch(()=>{});return job;}}},configurable:true});
  return {data,storage,fail:key=>{failKey=key;}};
}
const begin=s=>beginHedge(s,'Fen',{colour:'river',marking:'speckles'},s.updatedAt);
const replacement=name=>{const s=createHedgeState();return serialiseHedgeSave(beginHedge(s,name,undefined,s.updatedAt));};
test('save lifecycle creates stable generations and accepts latest same-generation operations',async()=>{
  const f=fixture(),fresh=loadHedgeWorld();assert.equal(fresh.raw,null);assert.equal(fresh.generation,null);
  const first=await mutateHedgeWorld(fresh,begin);assert(first.generation);assert.equal(loadHedgeWorld().state.companion.name,'Fen');
  const second=await mutateHedgeWorld(first,s=>investigateSurface(s,'stone',s.updatedAt));
  assert.equal(first.generation,second.generation);
  const latest=await mutateHedgeWorld(first,s=>{assert.equal(s.opening.step,'custom');return s;});assert.equal(latest.generation,first.generation);
  assert.deepEqual(JSON.parse(f.data.get(HEDGE_SAVE_KEY)).state,second.state);
});
test('two initial tabs and stale replacement tabs cannot overwrite a new generation',async()=>{
  fixture();const a=loadHedgeWorld(),b=loadHedgeWorld();const saved=await mutateHedgeWorld(a,begin);
  await assert.rejects(mutateHedgeWorld(b,begin),/another tab/);
  const replaced=await importHedgeWorld(saved,replacement('Puddle'));
  await assert.rejects(mutateHedgeWorld(saved,s=>s),/another tab/);
  assert.notEqual(replaced.generation,saved.generation);
});
test('quota failures preserve exact bytes while memory-only actions continue and can recover',async()=>{
  const f=fixture();let s=await mutateHedgeWorld(loadHedgeWorld(),begin);const old=s.raw;
  f.fail(HEDGE_SAVE_KEY);s=await mutateHedgeWorld(s,x=>investigateSurface(x,'reeds',x.updatedAt));
  assert.equal(s.unsaved,true);assert.equal(f.data.get(HEDGE_SAVE_KEY),old);assert.equal(s.raw,old);
  s=await mutateHedgeWorld(s,x=>{assert.equal(x.opening.step,'custom');return x;});assert.equal(s.unsaved,true);
  f.fail(null);s=await mutateHedgeWorld(s,x=>x);assert.equal(s.unsaved,false);assert.equal(loadHedgeWorld().state.opening.step,'custom');
});
test('unsaved work cannot overwrite a concurrent same-generation change',async()=>{
  const f=fixture();const s=await mutateHedgeWorld(loadHedgeWorld(),begin);
  f.fail(HEDGE_SAVE_KEY);const unsaved=await mutateHedgeWorld(s,x=>investigateSurface(x,'stone',x.updatedAt));
  f.fail(null);await mutateHedgeWorld(s,x=>investigateSurface(x,'reeds',x.updatedAt));
  await assert.rejects(mutateHedgeWorld(unsaved,x=>x),/another tab/);
});
test('corruption blocks ordinary writes but a valid import preserves the exact corrupt original',async()=>{
  const f=fixture();f.data.set(HEDGE_SAVE_KEY,'{bad json');const observed=loadHedgeWorld();assert.equal(observed.blocked,true);
  await assert.rejects(mutateHedgeWorld(observed,begin),/recovery/);assert.equal(f.data.get(HEDGE_SAVE_KEY),'{bad json');
  const repaired=await importHedgeWorld(observed,replacement('Fen'));assert.equal(repaired.blocked,false);assert.equal(f.data.get(HEDGE_BACKUP_KEY),'{bad json');
  await assert.rejects(restoreHedgeBackup(repaired),/unreadable/);assert.equal(f.data.get(HEDGE_BACKUP_KEY),'{bad json');
});
test('imports use exact raw observations, create recoverable backups and restore swaps safely',async()=>{
  const f=fixture();const first=await mutateHedgeWorld(loadHedgeWorld(),begin);const latest=await mutateHedgeWorld(first,s=>investigateSurface(s,'stone',s.updatedAt));
  await assert.rejects(importHedgeWorld(first,replacement('Wrong')),/another tab/);
  const imported=await importHedgeWorld(latest,replacement('Puddle'));assert.equal(f.data.get(HEDGE_BACKUP_KEY),latest.raw);
  const restored=await restoreHedgeBackup(imported);assert.equal(restored.state.companion.name,'Fen');assert.equal(restored.state.opening.surface,'stone');assert.equal(f.data.get(HEDGE_BACKUP_KEY),imported.raw);
  assert.notEqual(restored.generation,latest.generation);
});
test('failed replacement rolls back the backup and never touches current save',async()=>{
  const f=fixture();const first=await mutateHedgeWorld(loadHedgeWorld(),begin);f.data.set(HEDGE_BACKUP_KEY,'previous recovery bytes');
  f.fail(HEDGE_SAVE_KEY);await assert.rejects(importHedgeWorld(first,replacement('Puddle')),/could not be saved/);
  assert.equal(f.data.get(HEDGE_SAVE_KEY),first.raw);assert.equal(f.data.get(HEDGE_BACKUP_KEY),'previous recovery bytes');
});
test('unavailable storage or mutex permits exportable memory play without unsafe writes',async()=>{
  const f=fixture();Object.defineProperty(globalThis,'localStorage',{get(){throw new Error('Denied');},configurable:true});
  const loaded=loadHedgeWorld();assert.equal(loaded.unsaved,true);const memory=await mutateHedgeWorld(loaded,begin);assert.equal(memory.state.companion.name,'Fen');assert.equal(memory.unsaved,true);
  fixture();Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});Object.defineProperty(globalThis,'indexedDB',{value:undefined,configurable:true});
  const local=await mutateHedgeWorld(loadHedgeWorld(),begin);assert.equal(local.unsaved,true);assert.equal(localStorage.getItem(HEDGE_SAVE_KEY),null);
});
test('invalid operations/imports and duplicate or overnested stored JSON never overwrite data',async()=>{
  const f=fixture();const s=await mutateHedgeWorld(loadHedgeWorld(),begin);
  await assert.rejects(mutateHedgeWorld(s,x=>({...x,version:999})));await assert.rejects(importHedgeWorld(s,'{"version":1}'));assert.equal(f.data.get(HEDGE_SAVE_KEY),s.raw);
  f.data.set(HEDGE_SAVE_KEY,s.raw.replace('"version":2','"version":2,"version":2'));assert.equal(loadHedgeWorld().blocked,true);
  f.data.set(HEDGE_SAVE_KEY,s.raw.replace('"format":1','"format":1,"format":1'));assert.equal(loadHedgeWorld().blocked,true);
  f.data.set(HEDGE_SAVE_KEY,'['.repeat(50)+'0'+']'.repeat(50));assert.equal(loadHedgeWorld().blocked,true);
});
