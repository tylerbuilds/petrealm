import { beginHedge, investigateSurface, chooseOpening, startOuting, collectOuting, placeFind, speakToNeighbour, renameCompanion, readHedgeView, serialiseHedgeSave, HEDGE_SAVE_KEY } from './hedge-model.js';
import { loadHedgeWorld, mutateHedgeWorld, importHedgeWorld, restoreHedgeBackup } from './hedge-storage.js';
import { renderHedgeHome, renderHedgeWelcome, renderHedgePaths, renderHedgeJournal, renderHedgeNeighbours, hedgeSymbol } from './hedge-views.js';
import { familyCreature } from './hedge-art.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let world = loadHedgeWorld(), busy = false;
let lastReady = false, soundEnabled = false, customiseGeneration = null;
const content = $('#hedge-content'), saveDialog = $('#hedge-save-dialog');
const audio = new Audio(new URL('../public/audio/hedge/hedgerow-brook.mp3', import.meta.url));
audio.loop = true; audio.preload = 'none'; audio.volume = .8;
document.querySelectorAll('[data-symbol]').forEach(node => { node.innerHTML = hedgeSymbol(node.dataset.symbol); });
const route = () => ['home','paths','journal','neighbours'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
function announce(message) { $('#hedge-status').textContent = message; }
function saveStatus() {
  $('#hedge-save-state').textContent = world.blocked ? 'Save needs attention' : world.unsaved ? 'Not saved · keep a file' : world.generation ? 'Saved in this browser' : 'Your own little world';
  $('#hedge-save-error').textContent = world.error?.message || world.error || '';
  $('#hedge-export-original').hidden = !world.blocked || !world.raw;
  $('#hedge-export-save').disabled = !!world.blocked;
  for (const id of ['hedge-export-story','hedge-export-portrait','hedge-customise']) $(`#${id}`).disabled = !world.state?.companion || world.blocked;
  let backup = null; try { backup = localStorage.getItem('under-the-hedge.backup.v1'); } catch {}
  $('#hedge-restore-backup').disabled = !backup;
  $('#hedge-export-backup').disabled = !backup;
}
function render(focus = false) {
  const state = world.state;
  if (world.blocked) {
    content.innerHTML = '<section class="hedge-story-card"><p class="hedge-eyebrow">Your original is still here</p><h1 id="hedge-view-title" tabindex="-1">Let’s keep this safe.</h1><p>We couldn’t open the saved world. Keep its original file, or restore a working Under the Hedge save.</p><button class="hedge-button" data-action="open-save">Open save recovery</button></section>';
  } else {
    const views = {home:renderHedgeHome,paths:renderHedgePaths,journal:renderHedgeJournal,neighbours:renderHedgeNeighbours};
    content.innerHTML = state.companion ? views[route()](state) : renderHedgeWelcome(state);
  }
  document.querySelectorAll('.hedge-nav a').forEach(a => {
    if (a.hash === `#${route()}`) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  lastReady = !!state?.outing && readHedgeView(state).ready;
  saveStatus();
  if (focus) $('#hedge-story-title, #hedge-view-title')?.focus({preventScroll:true});
}
async function act(operation, message = '') {
  if (busy) return false;
  const observed = world;
  busy = true;
  try {
    world = await mutateHedgeWorld(observed, operation);
    render(true);
    announce(world.unsaved ? 'Your changes are here for this visit. Download a save to keep them.' : message || 'A moment kept in your journal.');
    return true;
  } catch (error) {
    if (!world.unsaved) world = loadHedgeWorld();
    render(); announce(error.message);
    return false;
  } finally { busy = false; }
}
function download(text, suffix, type = 'text/plain;charset=utf-8') {
  const name = (world.state?.companion?.name || 'hedge').replace(/[^\p{L}\p{N}_-]/gu,'-').slice(0,48) || 'hedge';
  const url = URL.createObjectURL(new Blob([text], {type}));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name}-${suffix}`;
  document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function portrait() {
  const pet = world.state.companion;
  return familyCreature('rillum',{name:pet.name,tone:pet.appearance.colour,marking:pet.appearance.marking,pose:'familiar'});
}
function exportPortrait() { if (world.state.companion) download(portrait(),'portrait.svg','image/svg+xml'); }
function exportStory() {
  if (!world.state.companion) return;
  const state = world.state, view = readHedgeView(state);
  const story = `<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(view.name)} · Under the Hedge</title><style>body{max-width:760px;margin:50px auto;padding:24px;background:#f8f6ee;color:#293930;font:17px/1.8 Georgia,serif}svg{width:240px}h1{font-size:44px}article{border-top:1px solid #c8cebb;padding:24px 0}small{color:#58634e}p{white-space:pre-line}</style><body>${portrait()}<h1>${esc(view.name)}’s journal</h1><p>A Rillum at Bramble Fold. ${state.home.returningStones} journeys brought home.</p>${view.preferences.map(p=>`<p>${esc(p.text)}</p>`).join('')}${[...state.events].reverse().map(event=>`<article><small>${esc(event.place)} · ${new Date(event.at).toISOString().slice(0,10)}</small><p>${esc(event.text)}</p></article>`).join('')}<footer>Under the Hedge · Your remembered moments, kept with you.</footer></body></html>`;
  download(story,'journal.html','text/html;charset=utf-8');
}
function openSave() { saveStatus(); if (!saveDialog.open) saveDialog.showModal(); }
$('#hedge-save-button').addEventListener('click',openSave);
$('#hedge-save-close').addEventListener('click',()=>saveDialog.close());
$('#hedge-export-save').addEventListener('click',()=>{ try { download(serialiseHedgeSave(world.state),'world.json','application/json'); } catch(error) { $('#hedge-save-error').textContent=error.message; } });
$('#hedge-export-original').addEventListener('click',()=>download(world.raw,'unopened-save.json','application/json'));
$('#hedge-export-backup').addEventListener('click',()=>{
  try { const raw = localStorage.getItem('under-the-hedge.backup.v1'); if (raw) { let portable = raw; try { portable = serialiseHedgeSave(JSON.parse(raw).state); } catch {} download(portable,'previous-save.json','application/json'); } } catch(error) { $('#hedge-save-error').textContent=error.message; }
});
$('#hedge-export-story').addEventListener('click',exportStory);
$('#hedge-export-portrait').addEventListener('click',exportPortrait);
$('#hedge-import-save').addEventListener('change',async event=>{
  const file = event.target.files[0], observed = world; event.target.value = '';
  if (!file || busy) return;
  if (file.size > 150000) { $('#hedge-save-error').textContent='This save file is too large.'; return; }
  if (!confirm('Restore this world? Your current saved world will be kept as the previous backup.')) return;
  busy = true;
  try { world = await importHedgeWorld(observed,await file.text()); render(); announce('Your world has been restored.'); }
  catch(error) { $('#hedge-save-error').textContent=error.message; }
  finally { busy = false; }
});
$('#hedge-restore-backup').addEventListener('click',async()=>{
  if (busy || !confirm('Return to the previous backup? The current save will become your backup.')) return;
  const observed = world; busy = true;
  try { world = await restoreHedgeBackup(observed); render(); announce('Your previous world has been restored.'); }
  catch(error) { $('#hedge-save-error').textContent=error.message; }
  finally { busy = false; }
});
$('#hedge-customise').addEventListener('click',()=>{
  const pet=world.state.companion; if (!pet) return; customiseGeneration=world.generation;
  $('#hedge-edit-name').value=pet.name; $('#hedge-edit-colour').value=pet.appearance.colour; $('#hedge-edit-marking').value=pet.appearance.marking;
  $('#hedge-customise-error').textContent=''; $('#hedge-customise-dialog').showModal();
});
$('#hedge-customise-close').addEventListener('click',()=>$('#hedge-customise-dialog').close());
$('#hedge-customise-form').addEventListener('submit',async event=>{
  event.preventDefault();
  if (customiseGeneration !== world.generation) { $('#hedge-customise-error').textContent='Your world changed in another tab. Close these details and open them again.'; return; }
  const fields = new FormData(event.target);
  if (await act(state=>renameCompanion(state,fields.get('name'),{colour:fields.get('colour'),marking:fields.get('marking')}))) $('#hedge-customise-dialog').close();
  else $('#hedge-customise-error').textContent=$('#hedge-status').textContent;
});
content.addEventListener('submit',async event=>{
  if (event.target.id !== 'hedge-welcome-form') return;
  event.preventDefault(); const fields = new FormData(event.target);
  await act(state=>beginHedge(state,fields.get('name'),{colour:fields.get('colour'),marking:fields.get('marking')}));
});
content.addEventListener('input',event=>{
  const form=event.target.closest('#hedge-welcome-form'); if (!form) return;
  const fields=new FormData(form);
  $('#hedge-welcome-portrait').innerHTML=familyCreature('rillum',{name:fields.get('name'),tone:fields.get('colour'),marking:fields.get('marking'),pose:'greet'});
});
content.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const {action,choice,step,id,spot,neighbour,route:selectedRoute}=button.dataset;
  const weather=$('input[name="outing-condition"]:checked')?.value || 'calm';
  const operations={surface:s=>investigateSurface(s,choice),opening:s=>chooseOpening(s,choice,step),'start-outing':s=>startOuting(s,selectedRoute,weather),'collect-outing':s=>collectOuting(s,id),'place-find':s=>placeFind(s,id,spot),speak:s=>speakToNeighbour(s,neighbour)};
  if (operations[action]) await act(operations[action]);
  else if (action==='export-biography') exportStory();
  else if (action==='export-portrait') exportPortrait();
  else if (action==='open-save') openSave();
});
function soundLabel() {
  $('#hedge-sound').setAttribute('aria-pressed',String(soundEnabled));
  $('#hedge-sound').setAttribute('aria-label',`Turn brook sounds ${soundEnabled?'off':'on'}`);
  $('#hedge-sound').textContent=soundEnabled?'Sound on':'Sound off';
}
$('#hedge-sound').addEventListener('click',async()=>{
  soundEnabled=!soundEnabled; soundLabel();
  if (!soundEnabled) audio.pause();
  else try { await audio.play(); } catch { soundEnabled=false; soundLabel(); announce('The brook sounds couldn’t play. Try again when you’re ready.'); }
});
document.addEventListener('visibilitychange',()=>{
  if (document.hidden) audio.pause();
  else if(soundEnabled) audio.play().catch(()=>{soundEnabled=false;soundLabel();});
});
addEventListener('hashchange',()=>{render(true);window.scrollTo({top:0,behavior:'instant'});});
addEventListener('storage',event=>{
  if (event.key !== HEDGE_SAVE_KEY && event.key !== null) return;
  if (world.unsaved) { announce('Another tab changed the saved world. Keep a file of this visit before reloading.'); return; }
  world=loadHedgeWorld(); render(); announce('Updated from your other tab.');
});
setInterval(()=>{
  if (document.hidden || busy || !world.state?.outing) return;
  const ready=readHedgeView(world.state).ready;
  if (ready !== lastReady) {render();announce(`${world.state.companion.name} is ready to come home. This moment will wait.`);}
},1000);
render();
if(world.blocked) openSave();
