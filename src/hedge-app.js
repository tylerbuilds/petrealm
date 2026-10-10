import { beginHedge, investigateSurface, chooseOpening, startOuting, collectOuting, placeFind, speakToNeighbour, renameCompanion, readHedgeView, serialiseHedgeSave, HEDGE_SAVE_KEY } from './hedge-model.js';
import { loadHedgeWorld, mutateHedgeWorld, importHedgeWorld, restoreHedgeBackup } from './hedge-storage.js';
import { renderHedgeHome, renderHedgeWelcome, renderHedgePaths, renderHedgeJournal, renderHedgeNeighbours, hedgeSymbol } from './hedge-views.js';
import { familyCreature } from './hedge-art.js';
import { beginPlayRun, completePlayRun, abandonPlayRun, buildHedgeDecoration, DECORATIONS } from './hedge-model.js';
import { renderPlayHub, renderWorkshop, renderHomeDecorations } from './hedge-adventure-views.js';
import { mountHedgePlay } from './hedge-play.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let world = loadHedgeWorld(), busy = false;
let lastReady = false, soundEnabled = false, customiseGeneration = null;
let game = null, soundContext = null;
const content = $('#hedge-content'), saveDialog = $('#hedge-save-dialog');
const audio = new Audio(new URL('../public/audio/hedge/hedgerow-brook.mp3', import.meta.url));
audio.loop = true; audio.preload = 'none'; audio.volume = .8;
document.querySelectorAll('[data-symbol]').forEach(node => { node.innerHTML = hedgeSymbol(node.dataset.symbol); });
const route = () => ['play','home','paths','journal','neighbours'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'play';
let announcementTimer;
function announce(message) { clearTimeout(announcementTimer); $('#hedge-status').textContent = message; if(!world.unsaved) announcementTimer=setTimeout(()=>{$('#hedge-status').textContent='';},6500); }
function discardGame() { game?.controller.destroy(); game=null; }
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
  if (game) {
    game.controller.pause();
    game.element.remove();
    if(world.blocked || world.generation !== game.generation || (!game.finished && state.play.active?.id !== game.id)) discardGame();
  }
  content.classList.toggle('hedge-content--playing',route()==='play' && !!game);
  if (world.blocked) {
    content.innerHTML = '<section class="hedge-story-card"><p class="hedge-eyebrow">Your original is still here</p><h1 id="hedge-view-title" tabindex="-1">Let’s keep this safe.</h1><p>We couldn’t open the saved world. Keep its original file, or restore a working Under the Hedge save.</p><button class="hedge-button" data-action="open-save">Open save recovery</button></section>';
  } else {
    const views = {play:renderPlayHub,home:renderHedgeHome,paths:renderHedgePaths,journal:renderHedgeJournal,neighbours:renderHedgeNeighbours};
    if(state.companion && route()==='play' && game) { content.replaceChildren(game.element); }
    else content.innerHTML = state.companion ? views[route()](state) : renderHedgeWelcome(state);
    if(state.companion && route()==='home') {
      $('.hedge-home-scene')?.insertAdjacentHTML('beforeend',renderHomeDecorations(state));
      $('.hedge-home-grid')?.insertAdjacentHTML('afterend',renderWorkshop(state));
      content.insertAdjacentHTML('afterbegin','<a class="adventure-play-link" href="#play"><span><strong>Ready for a real adventure?</strong>Move, dash and find things for your hideout.</span><span aria-hidden="true">↗</span></a>');
    }
  }
  document.querySelectorAll('.hedge-nav a').forEach(a => {
    if (a.hash === `#${route()}`) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  lastReady = !!state?.outing && readHedgeView(state).ready;
  saveStatus();
  if (focus) $('#hedge-story-title, #hedge-view-title')?.focus({preventScroll:true});
}
function gameSound(kind) {
  if(!soundEnabled) return;
  try {
    soundContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if(soundContext.state==='suspended') soundContext.resume().catch(()=>{});
    const oscillator=soundContext.createOscillator(), gain=soundContext.createGain(), at=soundContext.currentTime;
    oscillator.type='sine';oscillator.frequency.setValueAtTime(({seed:660,pickup:660,dash:280,secret:880,finish:1046,bump:130})[kind] || 440,at);
    oscillator.frequency.exponentialRampToValueAtTime(kind==='dash'?460:330,at+.14);
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.055,at+.01);gain.gain.exponentialRampToValueAtTime(.0001,at+.2);
    oscillator.connect(gain);gain.connect(soundContext.destination);oscillator.start(at);oscillator.stop(at+.22);
  } catch { /* Sound remains optional. */ }
}
async function startGame(level,assist=false) {
  if(busy || world.blocked || !world.state.companion) return;
  busy=true;
  try {
    world=await mutateHedgeWorld(world,state=>beginPlayRun(state,level,assist));
    discardGame();
    const ticket=world.state.play.active, element=document.createElement('div');
    element.className='hedge-play-mount';
    // Update the route without triggering a second render that would pause a new run.
    history.replaceState(null,'','#play');content.replaceChildren(element);content.classList.add('hedge-content--playing');
    const session={id:ticket.id,generation:world.generation,level,assist,element,finished:false,controller:null};
    game=session;
    session.controller=mountHedgePlay(element,{level,assist,companion:world.state.companion,onSound:gameSound,
      onComplete:result=>finishGame(session,result),
      onRetrySave:result=>finishGame(session,result,true),
      onReplay:()=>{if(!busy)startGame(level,assist);},
      onHome:()=>{if(!busy)location.hash='home';},
      onExit:async()=>{
        if(busy)return;busy=true;
        try { if(!session.finished)world=await mutateHedgeWorld(world,state=>abandonPlayRun(state));discardGame();render(true); }
        catch(error){announce(error.message);}
        finally{busy=false;}
      },
    });
    document.querySelectorAll('.hedge-nav a').forEach(a=>{if(a.hash==='#play')a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    saveStatus();announce(world.unsaved?'This visit isn’t saved. Keep a file before closing.':'');window.scrollTo({top:0,behavior:'instant'});
  } catch(error) {announce(error.message);render();}
  finally{busy=false;}
}
async function finishGame(session,result,retry=false) {
  if(game!==session || busy || (session.finished && !retry)) return;
  session.finished=true;busy=true;
  const previous=world;
  session.controller?.setSaveStatus('pending','Keeping your discoveries…');
  try {
    world=await mutateHedgeWorld(previous,state=>completePlayRun(state,session.id,result));
    const newlyOwned=world.state.play.decorations.filter(id=>!previous.state.play.decorations.includes(id));
    const details=newlyOwned.map(id=>DECORATIONS.find(item=>item.id===id)?.name).filter(Boolean);
    session.controller?.setSaveStatus('saved',world.unsaved?'Kept for this visit. Download a save before closing.':`${result.seeds} glowseeds brought home.${details.length?` ${details.join(', ')} unlocked!`:''}`);
    saveStatus();
  } catch(error) {
    session.controller?.setSaveStatus('error',`${error.message} Your earlier progress is safe.`);
    announce(error.message);
  } finally{busy=false;}
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
  const story = `<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(view.name)} · Under the Hedge</title><style>body{max-width:760px;margin:50px auto;padding:24px;background:#f8f6ee;color:#293930;font:17px/1.8 Georgia,serif}svg{width:240px}h1{font-size:44px}article{border-top:1px solid #c8cebb;padding:24px 0}small{color:#58634e}p{white-space:pre-line}</style><body>${portrait()}<h1>${esc(view.name)}’s journal</h1><p>A Rillum at Bramble Fold. ${state.home.returningStones + Object.values(state.play.best).reduce((sum,trail)=>sum+trail.clears,0)} journeys brought home.</p>${view.preferences.map(p=>`<p>${esc(p.text)}</p>`).join('')}${[...state.events].reverse().map(event=>`<article><small>${esc(event.place)} · ${new Date(event.at).toISOString().slice(0,10)}</small><p>${esc(event.text)}</p></article>`).join('')}<footer>Under the Hedge · Your remembered moments, kept with you.</footer></body></html>`;
  download(story,'journal.html','text/html;charset=utf-8');
}
function openSave() { game?.controller.pause(); saveStatus(); if (!saveDialog.open) saveDialog.showModal(); }
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
  if(await act(state=>beginHedge(state,fields.get('name'),{colour:fields.get('colour'),marking:fields.get('marking')}))) await startGame('broadroot');
});
content.addEventListener('input',event=>{
  const form=event.target.closest('#hedge-welcome-form'); if (!form) return;
  const fields=new FormData(form);
  $('#hedge-welcome-portrait').innerHTML=familyCreature('rillum',{name:fields.get('name'),tone:fields.get('colour'),marking:fields.get('marking'),pose:'greet'});
});
content.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const {action,choice,step,id,spot,neighbour,route:selectedRoute}=button.dataset;
  if(action==='play-run') { await startGame(button.dataset.level,$('#hedge-play-assist')?.checked || false); return; }
  if(action==='build-decoration') { await act(state=>buildHedgeDecoration(state,button.dataset.decoration,spot),'Your hideout has a new look.'); $('#hedge-workshop')?.scrollIntoView({block:'start',behavior:'instant'}); return; }
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
  world=loadHedgeWorld();
  if(game && !world.blocked && game.generation===world.generation && (game.finished || world.state.play.active?.id===game.id)) {saveStatus();return;}
  render(); announce('Updated from your other tab.');
});
setInterval(()=>{
  if (document.hidden || busy || (game && route()==='play') || !world.state?.outing) return;
  const ready=readHedgeView(world.state).ready;
  if (ready !== lastReady) {render();announce(`${world.state.companion.name} is ready to come home. This moment will wait.`);}
},1000);
render();
if(world.blocked) openSave();
