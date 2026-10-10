import { SPECIES, PERSONALITIES, ITEMS, createState, adopt, advanceTime, care, purchase, claimDaily, claimGameReward, parseSave, serialiseSave, readActivePet, selectPet, deposit, withdraw, equipAccessory, claimQuest, startBattle, battleAction, petCapacity, setMembership, claimLodgeParcel, useExpansion, claimBankInterest, upgradeBankTier, claimQuestDay, trainPet, growPet, startTrail, chooseTrail, leaveTrail, displayTreasure, startExpedition, claimExpedition, getExpeditionStatus } from './model.js';
import { creature, gardenArt } from './art.js';
import { guideArt, hudIcon, meadowDetails, placeArt } from './world-art.js';
import { WORLD_ART_KEY, createWorldArtController } from './world-theme.js';
import { withSaveLock } from './persistence.js';
import { renderGarden, renderMarket, renderRealm, renderArena, renderGlen, itemSymbols, battleActive } from './views.js';
import { renderTrails } from './trail-views.js';
import { renderCompanionJournal } from './companion-views.js';
import { companionKeepsake, companionPortrait } from './companion-export.js';

const SAVE_KEY = 'petrealm.save.v1';
const BACKUP_KEY = 'petrealm.backup.v1';
const WORLD_KEY = 'petrealm.world-generation.v1';
const MIGRATION_KEY = 'petrealm.migration-original.v1';
const MIGRATION_V2_KEY = 'petrealm.migration-original.v2';
const $ = (selector) => document.querySelector(selector);
const companionCard = $('.companion');
const companionSidebar = $('.side-column');
const compactWorld = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 800px)') : null;
document.querySelectorAll('[data-hud-icon]').forEach((node) => { node.innerHTML = hudIcon(node.dataset.hudIcon); });
$('#welcome-guide').innerHTML = guideArt();
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);
let state = createState(Date.now());
let currentArea = 'garden';
let selectedSpecies = 'mossling';
let selectedPersonality = 'steady';
let adoptionStartedCount = 0;
let adoptionGeneration = 0;
let marketFilter = 'all';
let gameMode = 'firefly';
let relaxedMemory = true;
let journalViewGeneration = 0;
let returnVisit = null;
let memoryTimer;
let memoryFlipTimer;
let recoveryRaw = null;
let persistenceAvailable = true;
let durableBaseRaw = null;
let stateGeneration = null;
let dirtyMemory = false;
let pendingMigrationRaw = null;
let pendingV2MigrationRaw = null;
let exportedV2OriginalRaw = null;
let selectedTreasure = null;
let trailJournalOpen = false;
let trailViewGeneration = 0;
let toastTimer;
let importGeneration = 0;
let game = null;
let animationFrame;
let worldArtUiGeneration = 0;
let worldArtBusy = false;
let worldArtWarning = null;
const failedWorldArtSources = { meadow:null, place:null };
const worldArt = createWorldArtController({ onChange: (pictures) => {
  applyWorldArt(pictures);
  renderWorldArtSettings(pictures);
} });
worldArtWarning = worldArt.restore().warning;
const milestones = [
  ['first-friend', 'A new friend', '♡', 'Meet your first friend'],
  ['well-fed', 'Kind heart', '❦', 'Share a snack with your friend'],
  ['playmate', 'Playmates', '∞', 'Play together'],
  ['shopper', 'Market regular', '⌂', 'Buy an item at the market'],
  ['game-on', 'Stargazer', '✧', 'Finish a game in Starlight glen'],
];

function toast(message) {
  $('#toast').textContent = !persistenceAvailable && !/storage|export/i.test(message) ? `${message} Download a save file to keep your world.` : message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500);
}
function applyWorldArt(pictures = worldArt.getState()) {
  for (const [slot, selector] of [['meadow','.scene-card'],['place','.place-arrival']]) {
    const scene = $(selector);
    if (!scene) continue;
    scene.querySelector(':scope > .personal-scenery')?.remove();
    if (failedWorldArtSources[slot] !== pictures[slot]?.src) failedWorldArtSources[slot] = null;
    const picture = pictures[slot]?.src === failedWorldArtSources[slot] ? null : pictures[slot];
    scene.classList.toggle('has-world-art', Boolean(picture));
    if (!picture) continue;
    const backdrop = document.createElement('div');
    backdrop.className = 'personal-scenery';
    backdrop.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.alt = '';
    image.onerror = () => {
      if (backdrop.isConnected) reportWorldArtFailure(slot, picture.src);
    };
    image.src = picture.src;
    image.style.objectFit = picture.fit;
    backdrop.append(image);
    scene.prepend(backdrop);
  }
}
function reportWorldArtFailure(slot, src) {
  if (worldArt.getState()[slot]?.src !== src || failedWorldArtSources[slot] === src) return;
  failedWorldArtSources[slot] = src;
  worldArtWarning = 'Your picture could not be opened. Petrealm scenery is back. Choose another picture or use Petrealm scenery.';
  applyWorldArt();
  renderWorldArtSettings();
  if ($('#world-art-dialog').open) {
    $('#world-art-error').textContent = worldArtWarning;
    $('#world-art-status').textContent = '';
  } else toast('Your scenery picture could not be opened. Petrealm scenery is back. Open Scenery to choose another.');
}
function renderWorldArtSettings(pictures = worldArt.getState()) {
  for (const slot of ['meadow','place']) {
    const picture = pictures[slot];
    if (failedWorldArtSources[slot] !== picture?.src) failedWorldArtSources[slot] = null;
    const usable = picture && picture.src !== failedWorldArtSources[slot];
    let preview = $(`#world-art-preview-${slot}`);
    preview.hidden = !usable;
    $(`#world-art-original-${slot}`).hidden = Boolean(usable);
    if (usable) {
      if (preview.getAttribute('src') !== picture.src) {
        const fresh = document.createElement('img');
        fresh.id = preview.id;
        fresh.alt = preview.alt;
        fresh.onerror = () => { if (fresh.isConnected) reportWorldArtFailure(slot, picture.src); };
        fresh.src = picture.src;
        preview.replaceWith(fresh);
        preview = fresh;
      }
      preview.style.objectFit = picture.fit;
    } else { preview.onerror = null; preview.removeAttribute('src'); }
    const fit = $(`#world-art-fit-${slot}`);
    fit.value = picture?.fit || 'cover';
    fit.disabled = !usable || worldArtBusy;
    $(`#world-art-clear-${slot}`).disabled = !picture;
    $(`#choose-world-art-${slot}`).disabled = worldArtBusy;
  }
  $('#world-art-dialog').setAttribute('aria-busy', String(worldArtBusy));
}
function cancelWorldArtChoice() {
  worldArt.cancel();
  worldArtUiGeneration += 1;
  worldArtBusy = false;
  for (const slot of ['meadow','place']) $(`#world-art-${slot}`).value = '';
  renderWorldArtSettings();
  $('#world-art-status').textContent = '';
}
function openWorldArt() {
  trailViewGeneration += 1;
  if (game) { stopGame(); render(); toast('This round ended before you finished, so it earned no reward.'); }
  cancelWorldArtChoice();
  const result = worldArt.reload();
  worldArtWarning = result.warning || (Object.values(failedWorldArtSources).some(Boolean) ? worldArtWarning : null);
  $('#world-art-error').textContent = worldArtWarning || '';
  $('#world-art-original-meadow').innerHTML = gardenArt() + meadowDetails();
  $('#world-art-original-place').innerHTML = placeArt('market');
  renderWorldArtSettings();
  if (!$('#world-art-dialog').open) $('#world-art-dialog').showModal();
}
async function chooseWorldArt(slot, file) {
  if (!file || !$('#world-art-dialog').open) return;
  const generation = ++worldArtUiGeneration;
  worldArtBusy = true;
  $('#world-art-error').textContent = '';
  $('#world-art-status').textContent = 'Making room for your picture…';
  renderWorldArtSettings();
  try {
    const result = await worldArt.choose(slot, file);
    if (generation !== worldArtUiGeneration || !$('#world-art-dialog').open) return;
    if (result.status === 'saved') {
      worldArtWarning = null;
      $('#world-art-status').textContent = 'Saved on this device. Your new scenery is ready.';
    } else $('#world-art-status').textContent = '';
  } catch (error) {
    if (generation !== worldArtUiGeneration || !$('#world-art-dialog').open) return;
    $('#world-art-error').textContent = error.message;
    $('#world-art-status').textContent = '';
  } finally {
    if (generation === worldArtUiGeneration) {
      worldArtBusy = false;
      renderWorldArtSettings();
    }
  }
}
$('#world-art-button').addEventListener('click', openWorldArt);
$('#close-world-art').addEventListener('click', () => $('#world-art-dialog').close());
$('#world-art-dialog').addEventListener('close', cancelWorldArtChoice);
$('#world-art-dialog').addEventListener('cancel', cancelWorldArtChoice);
for (const slot of ['meadow','place']) {
  $(`#choose-world-art-${slot}`).addEventListener('click', () => $(`#world-art-${slot}`).click());
  $(`#world-art-${slot}`).addEventListener('change', (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    chooseWorldArt(slot, file);
  });
  $(`#world-art-clear-${slot}`).addEventListener('click', () => {
    cancelWorldArtChoice();
    $('#world-art-error').textContent = '';
    try { worldArt.clear(slot); $('#world-art-status').textContent = 'Petrealm scenery is back.'; }
    catch (error) { $('#world-art-error').textContent = error.message; }
  });
  $(`#world-art-fit-${slot}`).addEventListener('change', (event) => {
    const fit = event.target.value;
    cancelWorldArtChoice();
    $('#world-art-error').textContent = '';
    try { worldArt.setFit(slot, fit); $('#world-art-status').textContent = 'Picture fit saved on this device.'; }
    catch (error) { renderWorldArtSettings(); $('#world-art-error').textContent = error.message; }
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') cancelWorldArtChoice();
});
window.addEventListener('pagehide', cancelWorldArtChoice);
function retainMigrationOriginal() {
  if (pendingMigrationRaw === null && pendingV2MigrationRaw === null) return;
  // Keep legacy text separately: a later import or backup swap must not destroy
  // the unique pre-migration original. Any failure prevents a SAVE overwrite.
  for (const [key, raw] of [[MIGRATION_KEY, pendingMigrationRaw], [MIGRATION_V2_KEY, pendingV2MigrationRaw]]) {
    if (raw === null) continue;
    // A version-specific original remains available after later imports.
    const retained = readLocal(key);
    if (key === MIGRATION_V2_KEY && retained !== null && retained !== raw) {
      throw new Error('An original version 2 save is already kept here. Open Save to download this world’s original, then finish the upgrade. Your saved world hasn’t changed.');
    }
    if (key === MIGRATION_KEY || retained === null) localStorage.setItem(key, raw);
    if (readLocal(key) !== raw) throw new Error('We couldn’t keep the original save. Download it from Save before replacing this world.');
    if (readLocal(BACKUP_KEY) === null) {
      try { localStorage.setItem(BACKUP_KEY, raw); }
      catch { /* The independent migration original is already retained. */ }
    }
  }
  pendingMigrationRaw = null;
  pendingV2MigrationRaw = null;
}
function persist() {
  if (recoveryRaw !== null) return;
  try {
    const raw = serialiseSave(state);
    retainMigrationOriginal();
    localStorage.setItem(SAVE_KEY, raw);
    durableBaseRaw = raw; dirtyMemory = false; stateGeneration = readLocal(WORLD_KEY);
    persistenceAvailable = true;
    $('#save-location').textContent = 'Saved on this device';
    $('#save-location').classList.remove('unsaved');
    return true;
  } catch (error) {
    dirtyMemory = true; persistenceAvailable = false;
    $('#save-location').textContent = 'Not saved: download a copy';
    $('#save-location').classList.add('unsaved');
    toast(/original.*save|original version 2/i.test(error.message) ? error.message : 'Your browser’s storage couldn’t keep this save. Download a save file to keep your world.');
    return false;
  }
}
function download(text, filename, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function stopGame() {
  clearInterval(memoryTimer); clearTimeout(memoryFlipTimer);
  memoryTimer = undefined; memoryFlipTimer = undefined;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
  game = null;
}
function petIdentity(pet) {
  return pet ? JSON.stringify([pet.id, pet.name, pet.species, pet.adoptedAt]) : '';
}
function readCurrentWorld() {
  const raw = readLocal(SAVE_KEY);
  if (dirtyMemory) {
    if (raw !== durableBaseRaw) throw new Error('Another tab saved a different world. Open Save to download your unsaved changes before reloading.');
    return state;
  }
  if (raw === null && durableBaseRaw !== null) {
    // A deleted save is a change from another tab, not a new browser visit.
    // Keep this tab's world available for export without silently recreating it.
    dirtyMemory = true; persistenceAvailable = false;
    stopGame();
    $('#save-location').textContent = 'Not saved: download a copy';
    $('#save-location').classList.add('unsaved');
    renderCurrentWorld();
    throw new Error('Another tab removed your saved world. Download a copy from Save before reloading.');
  }
  if (raw !== null) {
    try {
      state = parseSave(raw);
      stateGeneration = readLocal(WORLD_KEY);
      if (JSON.parse(raw).version === 1) pendingMigrationRaw = raw;
      if (JSON.parse(raw).version === 2) pendingV2MigrationRaw = raw;
    }
    catch (error) { enterRecovery(raw, error.message); throw error; }
  }
  durableBaseRaw = raw;
  if (recoveryRaw !== null) throw new Error('Choose what to do on the save recovery screen first.');
  return state;
}
function renderCurrentWorld() {
  // A care/shop action in another tab must not destroy a live game animation.
  if (game) renderProfile(); else render();
}
async function update(action, message) {
  const generation = stateGeneration;
  try {
    await withSaveLock(() => {
      readCurrentWorld();
      if (generation !== readLocal(WORLD_KEY)) {
        renderCurrentWorld();
        throw new Error('Another tab changed your world. Check this world and choose again.');
      }
      state = action(state);
      persist(); renderCurrentWorld();
    });
    if (message) toast(message);
  } catch (error) { toast(error.message); }
}
function updateObservedPet(action, message) {
  const observed = petIdentity(readActivePet(state));
  const generation = stateGeneration;
  return update((fresh) => {
    if (observed !== petIdentity(readActivePet(fresh)) || generation !== readLocal(WORLD_KEY)) {
      renderCurrentWorld();
      throw new Error('Another tab changed your world or friend. Check your friend and choose again.');
    }
    return action(fresh);
  }, message);
}
function updateTrailAction(action, focusId, message) {
  const observed = petIdentity(readActivePet(state));
  const generation = stateGeneration;
  const viewGeneration = trailViewGeneration;
  let applied = false;
  return update((fresh) => {
    if (observed !== petIdentity(readActivePet(fresh)) || generation !== readLocal(WORLD_KEY)
        || viewGeneration !== trailViewGeneration || currentArea !== 'trails' || document.querySelector('dialog[open]')) {
      renderCurrentWorld();
      throw new Error('Your friend, world or trail changed. Open the trail and choose again.');
    }
    const next = action(fresh);
    applied = true;
    return next;
  }, message).then(() => {
    if (!applied || currentArea !== 'trails') return;
    const feedback = document.getElementById(focusId);
    feedback?.focus({preventScroll:true});
    const bounds = feedback?.getBoundingClientRect?.();
    if (bounds && (bounds.top < 16 || bounds.bottom > window.innerHeight - 16)) {
      const reveal = focusId === 'trail-result-title' ? feedback.closest('.trail-discovery') || feedback : feedback;
      reveal.scrollIntoView({block:'nearest', behavior:'auto'});
    }
  });
}
function restoreRaw(key, raw) {
  if (raw === null) localStorage.removeItem(key); else localStorage.setItem(key, raw);
}
// Called only inside the mutex. Explicit replacements first retain the freshest
// saved world, then mark a new generation so old games cannot reward that world.
function replaceWorld(next, previousRaw) {
  retainMigrationOriginal();
  if (dirtyMemory) { readCurrentWorld(); previousRaw = serialiseSave(state); }
  const oldDirty = dirtyMemory;
  const oldBase = durableBaseRaw;
  const oldBackup = readLocal(BACKUP_KEY);
  const oldGeneration = readLocal(WORLD_KEY);
  const oldState = state;
  const oldRecovery = recoveryRaw;
  let backupWritten = false;
  let generationWritten = false;
  try {
    localStorage.setItem(BACKUP_KEY, previousRaw);
    backupWritten = true;
    localStorage.setItem(WORLD_KEY, crypto.randomUUID());
    generationWritten = true;
    state = next; recoveryRaw = null;
    if (!persist()) throw new Error('We couldn’t save this world. Your previous saved world is still here.');
  } catch (error) {
    state = oldState; recoveryRaw = oldRecovery;
    dirtyMemory = oldDirty; durableBaseRaw = oldBase;
    try {
      if (backupWritten) restoreRaw(BACKUP_KEY, oldBackup);
      if (generationWritten) restoreRaw(WORLD_KEY, oldGeneration);
    } catch {
      if (oldBackup !== null) download(oldBackup, 'petrealm-backup-recovery.json');
      throw new Error('We couldn’t finish restoring this world. Your saved world hasn’t changed. If there was a previous backup, it has been downloaded.');
    }
    const reason = !backupWritten ? 'We couldn’t keep a backup, so your saved world hasn’t changed.' : error.message;
    throw new Error(`${reason} Download your world, or free some browser storage and try again.`);
  }
  returnVisit = null;
  stopGame(); render();
}
function mood() {
  if (!readActivePet(state)) return 'A friend is waiting to meet you.';
  const { satiety, happiness, energy } = readActivePet(state).stats;
  if (satiety < 30) return 'Ready for a snack.';
  if (energy < 25) return 'Sleepy. Time for a cosy nap?';
  if (happiness < 35) return 'Ready to play together.';
  return 'Happy to be here with you.';
}
function renderProfile() {
  const pet = readActivePet(state);
  $('#wallet').textContent = state.wallet;
  $('#pet-profile').innerHTML = pet ? `<div class="profile-line"><div class="pet-avatar">${creature(pet.species, `${SPECIES[pet.species].name}, ${pet.journey.growth ? 'first bloom' : 'young companion'}`, pet.wearing, Boolean(pet.journey.growth))}</div><div><h2 id="companion-name">${escape(pet.name)}</h2><p>${escape(SPECIES[pet.species].name)} · ${PERSONALITIES[pet.personality].name}${pet.journey.growth ? ' · First bloom' : ''}</p><div class="level-line"><span class="level-badge" id="pet-level">Level ${pet.level}</span><span class="experience-track"><span style="width:${pet.level >= 20 ? 100 : pet.xp % 100}%"></span></span><span id="pet-xp">${pet.xp} XP</span></div></div></div>` : `<div class="profile-line"><div class="pet-avatar">${creature('mossling')}</div><div><h2>Who shall we meet?</h2><p>Choose a friend to explore with</p></div></div>`;
  $('#stats').innerHTML = ['satiety', 'happiness', 'energy'].map((stat) => {
    const value = pet ? Math.round(pet.stats[stat]) : 0;
    return `<div class="stat ${stat}"><div class="stat-label"><span>${{satiety:'Fullness',happiness:'Happiness',energy:'Energy'}[stat]}</span><span id="stat-${stat}">${value} / 100</span></div><div class="stat-track" role="progressbar" aria-label="${{satiety:'Fullness',happiness:'Happiness',energy:'Energy'}[stat]}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><div class="stat-fill" style="width:${value}%"></div></div></div>`;
  }).join('');
  $('#pet-mood').textContent = mood();
  $('#inventory').innerHTML = Object.entries(ITEMS).map(([id, item]) => `<div class="inventory-item"><span class="item-symbol ${id}" aria-hidden="true">${itemSymbols[id]}</span><span>${escape(item.name)}</span><span id="inventory-${id}" class="inventory-count">${state.inventory[id]}</span></div>`).join('');
  const claimed = state.daily.lastClaimDay !== null && state.daily.lastClaimDay >= day();
  $('#daily-reward').disabled = claimed || !pet;
  $('#daily-reward').textContent = claimed ? 'Gift opened ✓' : "Open today’s gift · 40 pebbles";
  const achieved = state.achievements.filter((id) => milestones.some(([milestone]) => milestone === id));
  $('#milestone-count').textContent = `${achieved.length} / ${milestones.length} collected`;
  $('#achievements').innerHTML = milestones.map(([id, label, symbol, description]) => `<div class="achievement ${achieved.includes(id) ? 'unlocked' : ''}" title="${escape(description)}${achieved.includes(id) ? ' · Collected!' : ''}"><div class="achievement-icon" aria-hidden="true">${symbol}</div><span>${label}</span><span class="visually-hidden">${achieved.includes(id) ? 'Collected' : description}</span></div>`).join('');
}
function garden() { return renderGarden(state); }
function market() { return renderMarket(state,marketFilter); }
function glen() { return renderGlen(state,gameMode,relaxedMemory); }
function realm() { return renderRealm(state); }
function arena() { return renderArena(state); }
function positionCompanion() {
  const dock = $('#companion-dock');
  if (currentArea === 'garden' && dock) {
    dock.append(companionCard);
    companionCard.classList.add('inline-companion');
  } else {
    companionSidebar.prepend(companionCard);
    companionCard.classList.remove('inline-companion');
  }
}
compactWorld?.addEventListener('change', positionCompanion);
function render() {
  const journalDetails = [...document.querySelectorAll('#area-content details[id]:not(#trail-journal)')].map(node => [node.id, node.open]);
  const selectedRoute = document.querySelector('[name="expedition-route"]:checked')?.value;
  const selectedIntent = document.querySelector('[name="expedition-intent"]:checked')?.value;
  const growthOpen = $('#growth-disclosure')?.open;
  const friendOpen = $('#friends')?.open;
  const wardrobeOpen = $('#wardrobe')?.open;
  if ($('#trail-journal')) trailJournalOpen = $('#trail-journal').open;
  if (selectedTreasure && !state.trails?.collection.includes(selectedTreasure) && !state.companionship?.collection.includes(selectedTreasure)) selectedTreasure = null;
  const bankDraft = $('#bank-amount')?.value;
  const bankTierDraft = $('#bank-tier')?.value;
  const focused = document.activeElement;
  const focusedId = focused?.id;
  const focusedRadio = focused?.matches('input[type=radio][name]') ? { name:focused.name, value:focused.value } : null;
  const focusedInArea = Boolean(focused?.closest('#area-content'));
  const focusedAction = focusedInArea && !focusedId ? Array.from(focused.attributes || [])
    .filter((attribute) => attribute.name.startsWith('data-') && !(attribute.name === 'data-equip' && focused.dataset.slot))
    .map((attribute) => `[${attribute.name}="${CSS.escape(attribute.value)}"]`).join('') : '';
  // Keep the one live profile outside the area being replaced. On small
  // screens it sits between the garden scene and care, beside its actions.
  companionSidebar.prepend(companionCard);
  renderProfile();
  document.querySelectorAll('.nav-button').forEach((button) => { button.classList.toggle('active', button.dataset.area === currentArea); button.setAttribute('aria-current', button.dataset.area === currentArea ? 'page' : 'false'); });
  document.body.dataset.place = currentArea;
  const headings = { garden:['Sunmeadow','Share a snack, play together or follow a trail.'], market:['Market lane','Choose a snack or an outfit for your friend.'], glen:['Starlight glen','Catch a firefly or find the matching flowers.'], realm:['Explore Petrealm','Choose somewhere to go or something to try.'], arena:['Training grove','Practise with your friend or try a match.'], trails:['The little trails','Explore with your friend and bring a treasure home.'], journal:['Our field journal','Little adventures. A friend with stories of their own.'] };
  $('#page-title').textContent = headings[currentArea][0];
  $('#page-subtitle').textContent = headings[currentArea][1];
  $('#area-content').innerHTML = currentArea === 'journal' ? renderCompanionJournal(state, Date.now()) : currentArea === 'trails' ? renderTrails(state, selectedTreasure, trailJournalOpen) : { garden, market, glen, realm, arena }[currentArea]();
  applyWorldArt();
  positionCompanion();
  for (const [id, open] of journalDetails) { const detail = document.getElementById(id); if (detail?.tagName === 'DETAILS') detail.open = open; }
  for (const [name, value] of [['expedition-route', selectedRoute], ['expedition-intent', selectedIntent]]) {
    if (value) { const input = document.querySelector(`[name="${name}"][value="${CSS.escape(value)}"]`); if (input) input.checked = true; }
  }
  if (returnVisit && currentArea === 'garden') {
    const greeting = document.createElement('section');
    greeting.className = 'return-visit'; greeting.setAttribute('aria-label', 'Welcome back');
    const title = document.createElement('h2'); title.textContent = 'Your meadow kept your place.';
    const story = document.createElement('p'); story.textContent = returnVisit;
    const dismiss = document.createElement('button'); dismiss.id = 'dismiss-return'; dismiss.className = 'text-button'; dismiss.textContent = 'Hello again →';
    greeting.append(title, story, dismiss); $('#area-content').prepend(greeting);
  }
  if (growthOpen !== undefined && $('#growth-disclosure')) $('#growth-disclosure').open = growthOpen;
  if (friendOpen !== undefined && $('#friends')) $('#friends').open = friendOpen;
  if (wardrobeOpen !== undefined && $('#wardrobe')) $('#wardrobe').open = wardrobeOpen;
  if (bankDraft !== undefined && $('#bank-amount')) $('#bank-amount').value = bankDraft;
  const bankTier = $('#bank-tier');
  if (bankTierDraft && bankTier && Array.from(bankTier.options).some((option) => option.value === bankTierDraft && !option.disabled)) bankTier.value = bankTierDraft;
  const restoredFocus = focusedInArea ? focusedId ? document.getElementById(focusedId)
    : focusedRadio ? document.querySelector(`input[name="${CSS.escape(focusedRadio.name)}"][value="${CSS.escape(focusedRadio.value)}"]`)
    : focusedAction ? document.querySelector(`#area-content button${focusedAction}`) : null : null;
  if (restoredFocus && !restoredFocus.disabled) restoredFocus.focus({preventScroll:true});
  else if (focusedInArea && focusedId === 'pet-grow') $('#growth-disclosure summary')?.focus({preventScroll:true});
  else if (focusedInArea) $('#area-content').focus({preventScroll:true});
}
function changeArea(area) {
  if (!['garden','market','glen','realm','arena','trails','journal'].includes(area)) return;
  cancelWorldArtChoice();
  if ($('#world-art-dialog').open) $('#world-art-dialog').close();
  const movedFromWorld = Boolean(document.activeElement?.closest('#area-content'));
  stopGame(); trailViewGeneration += 1; journalViewGeneration += 1; currentArea = area; render();
  if (movedFromWorld) { $('#area-content').focus({preventScroll:true}); $('#page-title').scrollIntoView({block:'start', behavior:'instant'}); }
  history.replaceState(null, '', `#${area}`);
}
function selectSpecies() {
  const focusedSpecies = document.activeElement?.dataset?.species;
  $('#species-options').innerHTML = Object.entries(SPECIES).map(([id, species]) => `<button type="button" data-species="${id}" class="species-button ${id === selectedSpecies ? 'selected' : ''}" aria-pressed="${id === selectedSpecies}">${creature(id, species.name)}<span class="species-kind">${escape(species.kind)}</span><strong>${escape(species.name)}</strong><span class="species-chosen">${id === selectedSpecies ? 'Chosen ✓' : 'Meet this friend'}</span></button>`).join('');
  renderAdoptionPreview();
  if (focusedSpecies) $(`#species-options [data-species="${focusedSpecies}"]`)?.focus({preventScroll:true});
}
function renderAdoptionPreview() {
  const species = SPECIES[selectedSpecies];
  $('#adoption-preview').innerHTML = `<div class="adoption-portrait">${creature(selectedSpecies, species.name)}</div><div><p class="eyebrow">YOUR NEW ${escape(species.kind.toUpperCase())}</p><h3 id="adoption-species-name">${escape(species.name)}</h3><p>${escape(species.description)}</p><p class="species-trait">${escape(species.trait)}</p><p class="species-favourite">${species.favourite ? `Loves ${escape(ITEMS[species.favourite].name.toLowerCase())} · +3 extra happiness` : 'Enjoys both snacks equally'}</p></div>`;
  $('#pet-personality').innerHTML = Object.values(PERSONALITIES).map((personality) => `<option value="${personality.id}" ${personality.id === selectedPersonality ? 'selected' : ''}>${personality.name}</option>`).join('');
  $('#personality-description').textContent = PERSONALITIES[selectedPersonality].description;
}
function showAdoption() {
  if ($('#adoption-dialog').open) return;
  adoptionGeneration += 1;
  cancelWorldArtChoice();
  if ($('#world-art-dialog').open) $('#world-art-dialog').close();
  adoptionStartedCount = state.pets.length;
  selectedPersonality = SPECIES[selectedSpecies].personality;
  $('#pet-name').value = '';
  $('#adoption-error').textContent = '';
  $('#close-adoption').hidden = !readActivePet(state);
  selectSpecies();
  if (!$('#adoption-dialog').open) $('#adoption-dialog').showModal();
  setTimeout(() => $('#species-options [data-species]')?.focus(), 40);
}
async function beginGame() {
  if (game || currentArea !== 'glen' || gameMode !== 'firefly') return;
  try {
    await withSaveLock(() => {
      readCurrentWorld();
      if (!readActivePet(state) || battleActive(state) || game || currentArea !== 'glen' || gameMode !== 'firefly') return;
      render();
      game = { kind:'firefly', started:performance.now(), lastCatch:0, score:0, attempts:0, position:0.5, speed:1.6, seed:Math.random() * Math.PI * 2,
        generation:readLocal(WORLD_KEY), pet:petIdentity(readActivePet(state)) };
      $('#game-start').hidden = true; $('#game-catch').hidden = false;
      $('#game-catch').focus();
      $('#game-feedback').textContent = 'Press Catch when the firefly reaches the golden patch.';
      animateGame();
    });
  } catch (error) { toast(error.message); }
}
function animateGame() {
  if (!game || game.kind !== 'firefly') return;
  const elapsed = (performance.now() - game.started) / 1000;
  game.position = .5 + .43 * Math.sin(elapsed * game.speed * Math.PI + game.seed);
  $('#firefly').style.left = `${game.position * 100}%`;
  $('#game-timer').textContent = `${Math.max(0, 30 - Math.floor(elapsed))} seconds`;
  if (elapsed >= 30) { endGame(); return; }
  animationFrame = requestAnimationFrame(animateGame);
}
function catchLight() {
  if (!game || game.kind !== 'firefly') return;
  const now = performance.now();
  if (now - game.lastCatch < 350) return;
  game.lastCatch = now;
  const distance = Math.abs(game.position - .5);
  const points = Math.max(0, Math.round(10 * (1 - distance / .12)));
  game.score += points; game.attempts += 1;
  $('#game-score').textContent = `Score ${game.score} / 100`;
  $('#game-attempt').textContent = `${10 - game.attempts} catches left`;
  $('#game-feedback').textContent = points >= 8 ? `Great catch! +${points} points` : points > 0 ? `Caught it! +${points} points` : 'Missed it. Try the next one!';
  game.speed += .06;
  if (game.attempts >= 10) endGame();
}
async function endGame() {
  if (!game) return;
  const completed = game;
  stopGame();
  try {
    let earned = 0;
    await withSaveLock(() => {
      readCurrentWorld();
      if (completed.generation !== readLocal(WORLD_KEY) || completed.pet !== petIdentity(readActivePet(state))) {
        throw new Error('Another tab changed your world or friend. This round ended without a reward.');
      }
      const oldWallet = state.wallet;
      state = claimGameReward(state, completed.score, Date.now(), completed.kind);
      earned = state.wallet - oldWallet;
      persist(); render();
    });
    if (currentArea === 'glen' && gameMode === 'firefly' && completed.kind === 'firefly') {
      $('#game-score').textContent = `Score ${completed.score} / 100`;
      $('#game-attempt').textContent = 'Round complete';
      $('#game-feedback').textContent = `${completed.score} points · ${earned} pebbles earned. ${earned === 0 && completed.score > 0 ? 'You’ve earned today’s game pebbles. ' : ''}You can play again for Happiness and XP.`;
    }
    if (currentArea === 'glen' && gameMode === 'memory' && completed.kind === 'memory') {
      $('#memory-feedback').textContent = `${completed.matches} pairs in ${completed.moves} turns · score ${completed.score} / 100 · ${earned} pebbles earned.`;
    }
    if (currentArea === 'glen') document.getElementById(completed.kind === 'memory' ? 'memory-start' : 'game-start')?.focus({preventScroll:true});
    toast(`Round finished! ${earned} pebbles earned.`);
  } catch (error) { render(); toast(error.message); }
}

const memorySymbols = ['✿','☀','☾','❧','✦','♧'];
const memoryLabels = ['flower','sun','moon','leaf','star','clover'];
async function beginMemory() {
  if (game || currentArea !== 'glen' || gameMode !== 'memory') return;
  try {
    await withSaveLock(() => {
      readCurrentWorld();
      if (!readActivePet(state) || battleActive(state) || game || currentArea !== 'glen' || gameMode !== 'memory') return;
      render();
      const cards = Array.from({length:12},(_,index) => index % 6);
      for (let index = cards.length-1; index > 0; index--) {
        const random = new Uint32Array(1); crypto.getRandomValues(random);
        const other = random[0] % (index+1);
        [cards[index],cards[other]] = [cards[other],cards[index]];
      }
      game = {kind:'memory',started:performance.now(),cards,flipped:[],matched:[],matches:0,moves:0,score:0,
        generation:readLocal(WORLD_KEY),pet:petIdentity(readActivePet(state)),relaxed:relaxedMemory};
      $('#memory-start').disabled = true;
      updateMemoryBoard();
      $('#memory-feedback').textContent = 'Find the matching flowers.';
      document.querySelector('[data-memory-index="0"]')?.focus();
      if (!game.relaxed) memoryTimer = setInterval(() => {
        if (!game || game.kind !== 'memory') return;
        const remaining = Math.max(0,75-Math.floor((performance.now()-game.started)/1000));
        $('#memory-timer').textContent = `${remaining} seconds`;
        if (remaining === 0) { game.score = game.matches*10; endGame(); }
      },250);
    });
  } catch (error) { toast(error.message); }
}
function updateMemoryBoard() {
  if (!game || game.kind !== 'memory') return;
  document.querySelectorAll('[data-memory-index]').forEach((tile) => {
    const index = Number(tile.dataset.memoryIndex);
    const matched = game.matched.includes(index);
    const visible = matched || game.flipped.includes(index);
    tile.disabled = false;
    tile.setAttribute('aria-disabled', String(matched || game.flipped.includes(index) || game.flipped.length >= 2));
    tile.classList.toggle('face-up',visible);
    tile.classList.toggle('matched',matched);
    tile.textContent = visible ? memorySymbols[game.cards[index]] : '❀';
    tile.setAttribute('aria-label', visible ? `${memoryLabels[game.cards[index]]}${matched ? ', matched' : ''}` : `Hidden card ${index+1}`);
  });
  $('#memory-moves').textContent = `${game.moves} ${game.moves === 1 ? 'turn' : 'turns'}`;
  $('#memory-matches').textContent = `${game.matches} / 6 pairs`;

}
function flipMemory(index) {
  if (!game || game.kind !== 'memory' || !Number.isInteger(index) || index < 0 || index > 11
      || game.flipped.length >= 2 || game.flipped.includes(index) || game.matched.includes(index)) return;
  if (!game.relaxed && performance.now()-game.started >= 75000) { game.score = game.matches*10; endGame(); return; }
  game.flipped.push(index);
  $('#memory-feedback').textContent = `Card ${index + 1}: ${memoryLabels[game.cards[index]]}. Choose another card.`;
  if (game.flipped.length === 2) {
    game.moves += 1;
    const [first,second] = game.flipped;
    if (game.cards[first] === game.cards[second]) {
      game.matched.push(first,second); game.flipped = []; game.matches += 1;
      $('#memory-feedback').textContent = `Two ${memoryLabels[game.cards[index]]} cards. A match! Find the next pair.`;
      if (game.matches === 6) { game.score = Math.max(0,100-2*(game.moves-6)); endGame(); return; }
    } else {
      $('#memory-feedback').textContent = `${memoryLabels[game.cards[first]]} and ${memoryLabels[game.cards[second]]}. Different flowers; try another pair.`;
      memoryFlipTimer = setTimeout(() => {
        if (!game || game.kind !== 'memory') return;
        game.flipped = []; updateMemoryBoard();
      },1500);
    }
  }
  updateMemoryBoard();
}

function readLocal(key) {
  try { return localStorage.getItem(key); } catch { persistenceAvailable = false; return null; }
}
function enterRecovery(raw, message) {
  recoveryRaw = raw;
  stopGame();
  cancelWorldArtChoice();
  if ($('#world-art-dialog').open) $('#world-art-dialog').close();
  $('#adoption-dialog').close(); $('#save-dialog').close();
  $('#recovery-message').textContent = message;
  if (!$('#recovery-dialog').open) $('#recovery-dialog').showModal();
}
async function importFile(file, errorSelector) {
  if (!file) return;
  const intent = ++importGeneration;
  const generation = stateGeneration;
  try {
    if (file.size > 32768) throw new Error('This save file is too big. Choose a Petrealm save of 32 KiB or less.');
    let raw;
    try { raw = await file.text(); }
    catch { throw new Error('This save file could not be opened. Your current world has not changed.'); }
    if (intent !== importGeneration) return;
    const restored = parseSave(raw);
    await withSaveLock(() => {
      if (intent !== importGeneration) return;
      if (generation !== readLocal(WORLD_KEY)) throw new Error('Another tab changed your world while the file opened. Choose your save file again.');
      const previous = readLocal(SAVE_KEY) ?? serialiseSave(state);
      // Back up the latest durable world after file reading, including invalid
      // recovery text, rather than a stale snapshot from before the await.
      retainMigrationOriginal();
      replaceWorld(advanceTime(restored, Date.now()), previous);
      $('#recovery-dialog').close(); $('#save-dialog').close();
      if (!readActivePet(state)) showAdoption();
    });
    if (intent !== importGeneration) return;
    toast('Your world is back. Carry on exploring!');
  } catch (error) { if (intent === importGeneration) $(errorSelector).textContent = error.message; }
}

$('#adoption-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = $('#pet-name').value.trim();
  const species = selectedSpecies;
  const personality = selectedPersonality;
  const count = adoptionStartedCount;
  const intent = adoptionGeneration;
  const generation = stateGeneration;
  try {
    await withSaveLock(() => {
      readCurrentWorld();
      if (!$('#adoption-dialog').open || intent !== adoptionGeneration || state.pets.length !== count || generation !== readLocal(WORLD_KEY)) {
        throw new Error('Your family changed while you chose this friend. Open the meadow and choose again.');
      }
      state = adopt(state, name, species, Date.now(), personality);
      if (count === 0) currentArea = 'garden';
      persist(); render(); $('#adoption-dialog').close();
    });
    toast(`Welcome home, ${readActivePet(state).name}. Let’s explore!`);
  } catch (error) { $('#adoption-error').textContent = error.message; }
});
$('#pet-personality').addEventListener('change', () => {
  selectedPersonality = $('#pet-personality').value;
  $('#personality-description').textContent = PERSONALITIES[selectedPersonality].description;
});
$('#close-adoption').addEventListener('click', () => { if (readActivePet(state)) $('#adoption-dialog').close(); });
$('#adoption-dialog').addEventListener('cancel', (event) => { if (!readActivePet(state)) event.preventDefault(); });
$('#recovery-dialog').addEventListener('cancel', (event) => event.preventDefault());
$('#daily-reward').addEventListener('click', () => update((s) => claimDaily(s, Date.now()), 'Mallow sent you 40 pebbles. What will you spend them on?'));
function openSaves() {
  trailViewGeneration += 1;
  if (game) { stopGame(); render(); toast('This round ended before you finished, so it earned no reward.'); }
  $('#save-error').textContent = '';
  const hasBackup = readLocal(BACKUP_KEY) !== null;
  $('#restore-backup').disabled = !hasBackup;
  $('#export-backup').disabled = !hasBackup;
  $('#export-original').disabled = pendingMigrationRaw === null && readLocal(MIGRATION_KEY) === null;
  $('#export-original-v2').disabled = pendingV2MigrationRaw === null && readLocal(MIGRATION_V2_KEY) === null;
  $('#export-earlier-v2').hidden = pendingV2MigrationRaw === null || readLocal(MIGRATION_V2_KEY) === null || readLocal(MIGRATION_V2_KEY) === pendingV2MigrationRaw;
  $('#finish-upgrade-section').hidden = $('#export-earlier-v2').hidden;
  $('#finish-v2-upgrade').disabled = pendingV2MigrationRaw === null || exportedV2OriginalRaw !== pendingV2MigrationRaw;
  $('#save-dialog').showModal();
}
function openSatchel() {
  trailViewGeneration += 1;
  if (game) { stopGame(); render(); toast('This round ended before you finished, so it earned no reward.'); }
  if (!$('#satchel-dialog').open) $('#satchel-dialog').showModal();
}
$('#satchel-button').addEventListener('click', openSatchel);
$('#close-satchel').addEventListener('click', () => $('#satchel-dialog').close());
$('#save-button').addEventListener('click', openSaves);
$('#footer-save').addEventListener('click', openSaves);
$('#close-save').addEventListener('click', () => $('#save-dialog').close());
$('#export-save').addEventListener('click', async () => {
  try {
    await withSaveLock(() => {
      if (!dirtyMemory) { readCurrentWorld(); state = advanceTime(state, Date.now()); persist(); }
      // Dirty RAM can always be exported, including when another tab saved a
      // newer world. Export never discards it or overwrites that newer world.
      download(serialiseSave(state), `petrealm-${day()}.json`);
    });
    toast('Your save file is ready. Keep it somewhere you can find it.');
  } catch (error) { $('#save-error').textContent = error.message; }
});
$('#import-save').addEventListener('change', (event) => { importFile(event.target.files[0], '#save-error'); event.target.value = ''; });
$('#recovery-import').addEventListener('change', (event) => { importFile(event.target.files[0], '#recovery-error'); event.target.value = ''; });
$('#export-original').addEventListener('click', () => {
  const raw = pendingMigrationRaw ?? readLocal(MIGRATION_KEY);
  if (raw === null) { $('#save-error').textContent = 'There’s no original version 1 save in this browser.'; return; }
  download(raw,'petrealm-original-version-1.json');
});
$('#export-original-v2').addEventListener('click', () => {
  const raw = pendingV2MigrationRaw ?? readLocal(MIGRATION_V2_KEY);
  if (raw === null) { $('#save-error').textContent = 'There’s no original version 2 save in this browser.'; return; }
  download(raw, 'petrealm-original-version-2.json');
  if (raw === pendingV2MigrationRaw) {
    exportedV2OriginalRaw = raw;
    $('#finish-v2-upgrade').disabled = false;
  }
});
$('#export-earlier-v2').addEventListener('click', () => {
  const raw = readLocal(MIGRATION_V2_KEY);
  if (raw !== null) download(raw, 'petrealm-earlier-original-version-2.json');
});
$('#finish-v2-upgrade').addEventListener('click', async () => {
  const original = exportedV2OriginalRaw;
  const generation = stateGeneration;
  try {
    await withSaveLock(() => {
      readCurrentWorld();
      if (original === null || pendingV2MigrationRaw !== original || readLocal(SAVE_KEY) !== original
          || generation !== readLocal(WORLD_KEY)) throw new Error('Your saved world changed. Download its new original before finishing the upgrade.');
      // This explicit action follows the original's native download. Keep the
      // first protected original and occupied recovery backup unchanged.
      pendingV2MigrationRaw = null;
      if (!persist()) {
        pendingV2MigrationRaw = original;
        throw new Error('This world still couldn’t be saved. Your original and backups are unchanged. Download your world, or free some browser storage and try again.');
      }
      exportedV2OriginalRaw = null;
      render();
      $('#finish-upgrade-section').hidden = true;
      $('#export-earlier-v2').hidden = true;
      $('#save-error').textContent = 'Your world is ready to play. Your original save files and previous backup have been kept.';
    });
  } catch (error) { $('#save-error').textContent = error.message; }
});
$('#export-backup').addEventListener('click', () => {
  const raw = readLocal(BACKUP_KEY);
  if (raw === null) { $('#save-error').textContent = 'There is no previous backup in this browser.'; return; }
  download(raw, 'petrealm-previous-backup.json');
});
$('#restore-backup').addEventListener('click', async () => {
  try {
    await withSaveLock(() => {
      const raw = readLocal(BACKUP_KEY);
      if (!raw) throw new Error('There is no previous backup in this browser.');
      const restored = advanceTime(parseSave(raw), Date.now());
      readCurrentWorld();
      replaceWorld(restored, readLocal(SAVE_KEY) ?? serialiseSave(state));
      $('#save-dialog').close(); if (!readActivePet(state)) showAdoption();
    });
    toast('Your previous world is back. The world you left is now your backup.');
  } catch (error) { $('#save-error').textContent = error.message; }
});
$('#download-recovery').addEventListener('click', () => download(recoveryRaw || '', 'petrealm-recovery-original.json'));
$('#start-fresh').addEventListener('click', async () => {
  try {
    await withSaveLock(() => {
      const latestRaw = readLocal(SAVE_KEY);
      if (latestRaw !== recoveryRaw) throw new Error('Another tab changed this world. Reopen it before starting a new one.');
      replaceWorld(createState(Date.now()), latestRaw ?? recoveryRaw ?? '');
      $('#recovery-dialog').close(); showAdoption();
    });
  } catch (error) { $('#recovery-error').textContent = error.message; }
});
async function updateJournal(action, message, focusId = 'expedition-status-title') {
  const view = journalViewGeneration;
  let applied = false;
  await updateObservedPet((fresh) => {
    if (view !== journalViewGeneration || currentArea !== 'journal' || document.querySelector('dialog[open]')) {
      throw new Error('Your journal changed. Open it and choose again.');
    }
    const next = action(fresh); applied = true; return next;
  }, message);
  if (applied && currentArea === 'journal') {
    const feedback = document.getElementById(focusId) ?? $('#expedition-status-title');
    feedback?.focus({preventScroll:true});
    feedback?.scrollIntoView({block:'nearest', behavior:'instant'});
  }
}
document.addEventListener('submit', (event) => {
  if (event.target.id !== 'expedition-form') return;
  event.preventDefault();
  const data = new FormData(event.target);
  const route = data.get('expedition-route');
  const intent = data.get('expedition-intent');
  updateJournal((fresh) => startExpedition(fresh, route, intent, Date.now()), 'A little adventure has begun. The story will keep until you’re ready.');
});
document.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target || target.disabled) return;
  if (target.id === 'dismiss-return') { returnVisit = null; render(); $('#area-content').focus({preventScroll:true}); }
  if (target.dataset.claimExpedition !== undefined) {
    const expected = Number(target.dataset.claimExpedition);
    updateJournal((fresh) => claimExpedition(fresh, Date.now(), expected), 'A new story to keep. Their find is in your trail collection.', 'latest-memory-title');
  }
  if (target.dataset.exportCompanion !== undefined || target.dataset.exportPortrait !== undefined) {
    const pet = readActivePet(state);
    if (!pet) return;
    const portraitOnly = target.dataset.exportPortrait !== undefined;
    download(portraitOnly ? companionPortrait(state) : companionKeepsake(state), `petrealm-companion-${pet.id}.${portraitOnly ? 'svg' : 'html'}`, portraitOnly ? 'image/svg+xml' : 'text/html');
    toast(portraitOnly ? 'Your companion’s portrait is ready to keep.' : 'Their illustrated story is ready to keep or print.');
  }
  if (target.dataset.openSatchel !== undefined) openSatchel();
  if (target.dataset.area) {
    if ($('#satchel-dialog').open) $('#satchel-dialog').close();
    changeArea(target.dataset.area);
    if (target.dataset.scrollBank) { $('#bank')?.scrollIntoView({block:'start'}); $('#bank-amount')?.focus({preventScroll:true}); }
  }
  if (target.dataset.scrollTarget) {
    const destination = document.getElementById(target.dataset.scrollTarget);
    if (destination) {
      if (destination.tagName === 'DETAILS') destination.open = true;
      destination.scrollIntoView({block:'start'});
      const focusTarget = destination.querySelector('summary, button');
      focusTarget?.focus({preventScroll:true});
    }
  }
  if (target.dataset.treasureSelect) {
    selectedTreasure = target.dataset.treasureSelect;
    trailJournalOpen = true;
    render();
    $('#treasure-placement')?.scrollIntoView({block:'center'});
    $('#treasure-slot-0')?.focus({preventScroll:true});
  }
  if (target.dataset.trailStart) {
    const route = target.dataset.trailStart;
    updateTrailAction((s) => startTrail(s, route, Date.now()), 'trail-encounter-title');
  }
  if (target.dataset.trailChoice) {
    const run = Number(target.dataset.trailRun);
    const step = Number(target.dataset.trailStep);
    const choice = target.dataset.trailChoice;
    updateTrailAction((s) => chooseTrail(s, run, step, choice, Date.now()), step === 2 ? 'trail-result-title' : 'trail-encounter-title');
  }
  if (target.id === 'trail-leave') {
    const run = Number(target.dataset.trailRun);
    const step = Number(target.dataset.trailStep);
    updateTrailAction((s) => {
      if (s.trails.active?.step !== step) throw new Error('Another tab continued your trail. Read the next part before heading home.');
      return leaveTrail(s, run, Date.now());
    }, 'trail-map-title', 'Back home. This outing earned no reward, but you’ve kept your earlier finds and bond.');
  }
  if (target.dataset.displaySlot !== undefined) {
    const slot = Number(target.dataset.displaySlot);
    const treasure = target.dataset.clearTreasure !== undefined ? null : target.dataset.displayTreasure;
    const display = JSON.stringify(state.trails.display);
    updateTrailAction((s) => {
      if (JSON.stringify(s.trails.display) !== display) throw new Error('Another tab moved your meadow treasures. Choose a spot again.');
      return displayTreasure(s, treasure, slot, Date.now());
    }, treasure ? `treasure-slot-${slot}` : 'trail-journal-summary', treasure ? 'Your treasure is in the meadow. Go and see!' : 'Back in your journal. The treasure is still yours.');
  }
  if (target.id === 'adopt-another') {
    if (state.pets.length < petCapacity(state) && !battleActive(state)) showAdoption();
  }
  if (target.dataset.petId) update((s) => selectPet(s,target.dataset.petId,Date.now()), 'Your chosen friend is ready to play.');
  if (target.dataset.equip) updateObservedPet((s) => equipAccessory(s,target.dataset.equip === 'none' ? null : target.dataset.equip,target.dataset.slot,Date.now()), target.dataset.equip === 'none' ? 'Outfit taken off. Another friend can wear it now.' : 'Your friend is wearing their new outfit.');
  if (target.dataset.shopFilter) { marketFilter = target.dataset.shopFilter; render(); }
  if (target.id === 'bank-deposit' || target.id === 'bank-withdraw') {
    const amount = Number($('#bank-amount').value);
    const operation = target.id === 'bank-deposit' ? deposit : withdraw;
    update((s) => operation(s,amount,Date.now()), target.id === 'bank-deposit' ? `${amount} pebbles tucked safely away.` : `${amount} pebbles returned to your pocket.`);
  }
  if (target.id === 'bank-interest') update((s) => claimBankInterest(s,Date.now()), 'Today’s interest is in your savings.');
  if (target.id === 'bank-upgrade') {
    const tier = $('#bank-tier').value;
    update((s) => upgradeBankTier(s,tier,Date.now()), 'Your savings account is upgraded. You keep this rate when you take pebbles out.');
  }
  if (target.dataset.claimQuest) updateObservedPet((s) => claimQuest(s,target.dataset.claimQuest,Date.now()), 'Quest gift collected! Your pebbles and XP have been added.');
  if (target.id === 'quest-day-complete') updateObservedPet((s) => claimQuestDay(s,Date.now()), 'You’ve collected today’s quest gift. Every seven completed days earn a bonus; breaks are welcome.');
  if (target.dataset.battleStart) updateObservedPet((s) => startBattle(s,target.dataset.battleStart,Date.now()), 'Your match has started. Choose your first move.');
  if (target.dataset.battleAction) {
    const observedBattle = JSON.stringify(state.battle);
    updateObservedPet((s) => {
      if (JSON.stringify(s.battle) !== observedBattle) throw new Error('Another tab took an arena turn. Read the match and choose your next move.');
      return battleAction(s,target.dataset.battleAction,Date.now());
    });
  }
  if (target.dataset.gameMode) { stopGame(); gameMode = target.dataset.gameMode; render(); }
  if (target.id === 'memory-pace') { stopGame(); relaxedMemory = !relaxedMemory; render(); }
  if (target.id === 'memory-start') beginMemory();
  if (target.dataset.memoryIndex !== undefined) flipMemory(Number(target.dataset.memoryIndex));
  if (target.id === 'lodge-membership') {
    const tier = state.membership.tier === 'explorer' ? 'free' : 'explorer';
    update((s) => setMembership(s,tier,Date.now()), tier === 'explorer' ? 'Welcome to the Explorer Lodge. There’s room for seven more friends.' : 'You’ve left the Lodge. Your friends and progress stay with you.');
  }
  if (target.id === 'lodge-parcel') update((s) => claimLodgeParcel(s,Date.now()), 'Your Lodge parcel has arrived: 20 pebbles and a sunberry.');
  if (target.id === 'use-expansion') update((s) => useExpansion(s,Date.now()), 'There’s room for one more friend in your meadow.');
  if (target.dataset.species) { selectedSpecies = target.dataset.species; selectedPersonality = SPECIES[selectedSpecies].personality; selectSpecies(); }
  if (target.id === 'pet-train') updateObservedPet((s) => trainPet(s, Date.now()), 'Practice finished. Your friend earned XP.');
  if (target.id === 'pet-grow') updateObservedPet((s) => growPet(s, Date.now()), 'Your friend has bloomed! They have a new look and earn more XP from practice.');
  if (target.dataset.buy) update((s) => purchase(s, target.dataset.buy, Date.now()), `${ITEMS[target.dataset.buy].name} tucked into your satchel.`);
  if (target.id === 'feed-berry') updateObservedPet((s) => care(s, 'feed', 'berry', Date.now()), 'Berry eaten! Your friend feels fuller and happier.');
  if (target.id === 'feed-acorn') updateObservedPet((s) => care(s, 'feed', 'acorn', Date.now()), 'Acorn eaten! Your friend feels fuller, happier and more energetic.');
  if (target.id === 'care-play') updateObservedPet((s) => care(s, 'play', 'ribbon', Date.now()), 'That was fun! Ribbon play brought Happiness and used some Energy.');
  if (target.id === 'care-rest') updateObservedPet((s) => care(s, 'rest', undefined, Date.now()), 'Nap finished. Your friend has more Energy and Happiness.');
  if (target.id === 'game-start') beginGame();
  if (target.id === 'game-catch') catchLight();
});
document.addEventListener('keydown', (event) => {
  if (game?.kind === 'firefly' && event.code === 'Space' && !document.querySelector('dialog[open]')
      && (event.target === document.body || event.target.id === 'game-catch' || event.target.closest('.game-track'))) { event.preventDefault(); if (!event.repeat) catchLight(); }
});
window.addEventListener('storage', async (event) => {
  if (event.key === WORLD_ART_KEY || event.key === null) {
    cancelWorldArtChoice();
    worldArtWarning = worldArt.reload().warning || (Object.values(failedWorldArtSources).some(Boolean) ? worldArtWarning : null);
    if ($('#world-art-dialog').open) {
      $('#world-art-error').textContent = worldArtWarning || '';
      $('#world-art-status').textContent = worldArtWarning ? '' : 'Scenery updated from another tab.';
    }
    if (event.key === WORLD_ART_KEY) return;
  }
  if (event.key !== null && ![SAVE_KEY, WORLD_KEY].includes(event.key)) return;
  try {
    await withSaveLock(() => {
      // Queued events can contain an old value. Always read the current saved
      // snapshot under the same mutex used by writers.
      const raw = readLocal(SAVE_KEY);
      if (dirtyMemory) {
        if (raw !== durableBaseRaw) {
          stopGame(); render();
          toast('Another tab saved a newer world. Download your unsaved world from Save before reloading.');
        }
        return;
      }
      if (raw === null) { readCurrentWorld(); return; }
      const updated = parseSave(raw);
      durableBaseRaw = raw;
      if (game && (game.generation !== readLocal(WORLD_KEY) || game.pet !== petIdentity(readActivePet(updated)) || battleActive(updated))) stopGame();
      state = advanceTime(updated, Date.now()); stateGeneration = readLocal(WORLD_KEY); recoveryRaw = null;
      $('#recovery-dialog').close(); renderCurrentWorld();
      if (readActivePet(state)) {
        if ($('#adoption-dialog').open && (state.pets.length !== adoptionStartedCount || state.pets.length >= petCapacity(state) || battleActive(state))) $('#adoption-dialog').close();
      } else showAdoption();
    });
  } catch (error) {
    const raw = readLocal(SAVE_KEY);
    if (raw !== null) enterRecovery(raw, error.message); else toast(error.message);
  }
});
setInterval(async () => {
  if (recoveryRaw !== null || game) return;
  try {
    await withSaveLock(() => {
      if (recoveryRaw !== null || game) return;
      readCurrentWorld(); state = advanceTime(state, Date.now()); persist(); render();
    });
  } catch (error) { toast(error.message); }
}, 60000);
let observedOutingStatus = '';
setInterval(() => {
  if (recoveryRaw !== null || game || document.visibilityState === 'hidden') return;
  const outing = getExpeditionStatus(state, Date.now());
  const identity = `${outing.run?.id ?? ''}:${outing.status}`;
  if (observedOutingStatus && identity !== observedOutingStatus && ['garden','journal'].includes(currentArea)) render();
  observedOutingStatus = identity;
  const remaining = document.getElementById('expedition-countdown');
  if (remaining && outing.status === 'away') {
    const seconds = Math.max(1, Math.ceil(outing.remainingMs / 1000));
    remaining.textContent = `A story in about ${seconds < 60 ? `${seconds} seconds` : `${Math.ceil(seconds / 60)} minutes`}`;
  }
}, 1000);
window.addEventListener('hashchange', () => {
  const destination = location.hash.slice(1);
  if (['garden','market','glen','realm','arena','trails','journal'].includes(destination) && destination !== currentArea) changeArea(destination);
});
currentArea = ['garden','market','glen','realm','arena','trails','journal'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'garden';
try {
  await withSaveLock(() => {
    const saved = readLocal(SAVE_KEY);
    durableBaseRaw = saved;
    stateGeneration = readLocal(WORLD_KEY);
    if (saved !== null) {
      try {
        const prior = parseSave(saved);
        state = advanceTime(prior, Date.now());
        if (Date.now() - prior.lastUpdated >= 6 * 60 * 60 * 1000 && readActivePet(prior)) {
          const friend = readActivePet(prior);
          const outing = getExpeditionStatus(state, Date.now());
          returnVisit = outing.status === 'ready' ? `${outing.pet.name} has a story waiting in your journal. There is no rush to open it. Your friends and progress are just as you left them.` : `${friend.name} saved the sunny spot for you. All your friends, finds and progress are here. Settle in whenever you’re ready.`;
        }
        if (JSON.parse(saved).version === 1) pendingMigrationRaw = saved;
        if (JSON.parse(saved).version === 2) pendingV2MigrationRaw = saved;
      }
      catch (error) { enterRecovery(saved, error.message); }
    }
    render();
    if (recoveryRaw === null) { if (!dirtyMemory) persist(); if (!readActivePet(state)) showAdoption(); }
  });
} catch (error) {
  render(); toast(error.message);
  if (!readActivePet(state)) showAdoption();
}
if (!persistenceAvailable) setTimeout(() => toast('Your browser’s storage couldn’t keep this save. Download a save file to keep your world.'), 200);
