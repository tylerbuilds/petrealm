import { SPECIES, ITEMS, createState, adopt, advanceTime, care, purchase, claimDaily, claimGameReward, parseSave, serialiseSave } from './model.js';
import { creature, gardenArt, marketArt } from './art.js';
import { withSaveLock } from './persistence.js';

const SAVE_KEY = 'petrealm.save.v1';
const BACKUP_KEY = 'petrealm.backup.v1';
const WORLD_KEY = 'petrealm.world-generation.v1';
const $ = (selector) => document.querySelector(selector);
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);
let state = createState(Date.now());
let currentArea = 'garden';
let selectedSpecies = 'mossling';
let recoveryRaw = null;
let persistenceAvailable = true;
let durableBaseRaw = null;
let dirtyMemory = false;
let toastTimer;
let game = null;
let animationFrame;
const itemSymbols = { berry: '❦', acorn: '♧', ribbon: '∞' };
const itemDescriptions = { berry: 'A sweet, sun-ripened snack. +22 fullness, +6 happiness.', acorn: 'A hearty woodland nibble. +12 fullness, +12 energy, +3 happiness.', ribbon: 'A reusable toy for a joyful wiggle. +20 happiness, −12 energy, −4 fullness.' };
const milestones = [
  ['first-friend', 'A new friend', '♡', 'Adopt your first companion'],
  ['well-fed', 'Kind heart', '❦', 'Feed your companion a snack'],
  ['playmate', 'Playmates', '∞', 'Play with your companion'],
  ['shopper', 'Market regular', '⌂', 'Buy an item at the market'],
  ['game-on', 'Stargazer', '✧', 'Complete a round in Starlight glen'],
];

function toast(message) {
  $('#toast').textContent = !persistenceAvailable && !/storage|export/i.test(message) ? `${message} Export a save to keep your world.` : message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500);
}
function persist() {
  if (recoveryRaw !== null) return;
  try {
    const raw = serialiseSave(state);
    localStorage.setItem(SAVE_KEY, raw);
    durableBaseRaw = raw; dirtyMemory = false;
    persistenceAvailable = true;
    $('#save-location').textContent = 'Saved on this device';
    $('#save-location').classList.remove('unsaved');
    return true;
  } catch {
    dirtyMemory = true; persistenceAvailable = false;
    $('#save-location').textContent = 'Unsaved · export to keep your world';
    $('#save-location').classList.add('unsaved');
    toast('Browser storage is unavailable. Export a save to keep your world.');
    return false;
  }
}
function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function stopGame() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
  game = null;
}
function petIdentity(pet) {
  return pet ? JSON.stringify([pet.name, pet.species, pet.adoptedAt]) : '';
}
function readCurrentWorld() {
  const raw = readLocal(SAVE_KEY);
  if (dirtyMemory) {
    if (raw !== durableBaseRaw) throw new Error('Another tab saved a different world while your changes were unsaved. Export your unsaved world, then reload to use the newer saved world.');
    return state;
  }
  if (raw !== null) {
    try { state = parseSave(raw); }
    catch (error) { enterRecovery(raw, error.message); throw error; }
  }
  durableBaseRaw = raw;
  if (recoveryRaw !== null) throw new Error('Resolve the saved-world recovery screen before changing your world.');
  return state;
}
function renderCurrentWorld() {
  // A care/shop action in another tab must not destroy a live game animation.
  if (game) renderProfile(); else render();
}
async function update(action, message) {
  try {
    await withSaveLock(() => {
      readCurrentWorld();
      state = action(state);
      persist(); renderCurrentWorld();
    });
    if (message) toast(message);
  } catch (error) { toast(error.message); }
}
function restoreRaw(key, raw) {
  if (raw === null) localStorage.removeItem(key); else localStorage.setItem(key, raw);
}
// Called only inside the mutex. Explicit replacements first retain the freshest
// saved world, then mark a new generation so old games cannot reward that world.
function replaceWorld(next, previousRaw) {
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
    if (!persist()) throw new Error('Could not save the replacement world. The current saved world has not been replaced.');
  } catch (error) {
    state = oldState; recoveryRaw = oldRecovery;
    dirtyMemory = oldDirty; durableBaseRaw = oldBase;
    try {
      if (backupWritten) restoreRaw(BACKUP_KEY, oldBackup);
      if (generationWritten) restoreRaw(WORLD_KEY, oldGeneration);
    } catch {
      if (oldBackup !== null) download(oldBackup, 'petrealm-backup-recovery.json');
      throw new Error('Browser recovery writes failed. Your current saved world was not replaced; the previous backup has been downloaded when present.');
    }
    const reason = !backupWritten ? 'Cannot keep a recovery backup in this browser. Your current saved world has not been replaced.' : error.message;
    throw new Error(`${reason} Export your world or free browser storage and try again.`);
  }
  stopGame(); render();
}
function mood() {
  if (!state.pet) return 'A friend is waiting to meet you.';
  const { satiety, happiness, energy } = state.pet.stats;
  if (satiety < 30) return 'A little hungry. A snack would be lovely.';
  if (energy < 25) return 'Ready for a quiet moment and a cosy nap.';
  if (happiness < 35) return 'Some company would brighten their day.';
  return 'Feeling loved. Life is pretty lovely here.';
}
function renderProfile() {
  const pet = state.pet;
  $('#wallet').textContent = state.wallet;
  $('#pet-profile').innerHTML = pet ? `<div class="profile-line"><div class="pet-avatar">${creature(pet.species)}</div><div><h2 id="companion-name">${escape(pet.name)}</h2><p>${escape(SPECIES[pet.species].name)} · Your forever friend</p></div></div>` : `<div class="profile-line"><div class="pet-avatar">${creature('mossling')}</div><div><h2>A friend awaits</h2><p>A little companion to call your own</p></div></div>`;
  $('#stats').innerHTML = ['satiety', 'happiness', 'energy'].map((stat) => {
    const value = pet ? Math.round(pet.stats[stat]) : 0;
    return `<div class="stat ${stat}"><div class="stat-label"><span>${{satiety:'Fullness',happiness:'Happiness',energy:'Energy'}[stat]}</span><span id="stat-${stat}">${value} / 100</span></div><div class="stat-track" role="progressbar" aria-label="${stat}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><div class="stat-fill" style="width:${value}%"></div></div></div>`;
  }).join('');
  $('#pet-mood').textContent = mood();
  $('#inventory').innerHTML = Object.entries(ITEMS).map(([id, item]) => `<div class="inventory-item"><span class="item-symbol ${id}" aria-hidden="true">${itemSymbols[id]}</span><span>${escape(item.name)}</span><span id="inventory-${id}" class="inventory-count">${state.inventory[id]}</span></div>`).join('');
  const claimed = state.daily.lastClaimDay !== null && state.daily.lastClaimDay >= day();
  $('#daily-reward').disabled = claimed || !pet;
  $('#daily-reward').textContent = claimed ? 'Gift collected. See you tomorrow ♡' : "Collect today's gift ↗";
  const achieved = state.achievements.filter((id) => milestones.some(([milestone]) => milestone === id));
  $('#milestone-count').textContent = `${achieved.length} / ${milestones.length} collected`;
  $('#achievements').innerHTML = milestones.map(([id, label, symbol, description]) => `<div class="achievement ${achieved.includes(id) ? 'unlocked' : ''}" title="${escape(description)}${achieved.includes(id) ? ' · Collected!' : ''}"><div class="achievement-icon" aria-hidden="true">${symbol}</div><span>${label}</span><span class="visually-hidden">${achieved.includes(id) ? 'Collected' : description}</span></div>`).join('');
}
function garden() {
  const name = state.pet?.name || 'Your new friend';
  return `<section class="scene-card" aria-label="Sunmeadow garden">${gardenArt()}<div class="scene-top"><span class="location-marker">⌂ &nbsp; Sunmeadow garden</span><span class="scene-time">A GOOD DAY TO GROW</span></div><div class="pet-scene"><span class="pet-bubble">${state.pet ? (state.pet.stats.satiety < 30 ? 'Is it snack time yet?' : 'My favourite place is with you.') : 'Shall we be friends?'}</span><div class="scene-creature">${creature(state.pet?.species)}</div></div><div class="scene-bottom"><div><h2>${escape(name)}'s happy place</h2><p>A small patch of magic. Entirely yours.</p></div><span class="scene-badge">✿ &nbsp; Home, sweet home</span></div></section><section class="card care-panel"><div class="section-heading"><h2>A little care goes a long way</h2><p>Make their day a little brighter</p></div><div class="care-buttons"><button id="feed-berry" class="care-action" ${!state.pet || !state.inventory.berry ? 'disabled' : ''}><span class="action-icon" aria-hidden="true">❦</span><span><strong>Share a berry</strong><small>+22 fullness · ${state.inventory.berry} left</small></span></button><button id="care-play" class="care-action" ${!state.pet || !state.inventory.ribbon || state.pet.stats.energy < 12 ? 'disabled' : ''}><span class="action-icon" aria-hidden="true">∞</span><span><strong>Play together</strong><small>+20 joy · −12 energy</small></span></button><button id="care-rest" class="care-action" ${!state.pet ? 'disabled' : ''}><span class="action-icon" aria-hidden="true">☾</span><span><strong>Take a cosy nap</strong><small>+30 energy · −5 fullness</small></span></button></div><div class="care-extra"><button id="feed-acorn" class="text-button" ${!state.pet || !state.inventory.acorn ? 'disabled' : ''}>Or share an acorn · +12 fullness · ${state.inventory.acorn} left ↗</button></div></section>`;
}
function market() {
  return `<section class="market-banner"><p class="eyebrow">SIMPLE TREASURES. HAPPY COMPANIONS.</p><h2>Welcome to Market lane.</h2><p>Good things come in little parcels. Pick up a treat for the friend back home.</p>${marketArt()}</section><section class="market-grid" aria-label="Market shop">${Object.entries(ITEMS).map(([id, item]) => `<article class="card shop-item"><div class="shop-art" aria-hidden="true">${itemSymbols[id]}</div><h3>${escape(item.name)}</h3><p>${itemDescriptions[id]}</p><button data-buy="${id}" class="button dark-button" ${!state.pet || state.wallet < item.price ? 'disabled' : ''}>Buy for ${item.price} pebbles <span aria-hidden="true">↗</span></button></article>`).join('')}</section><p class="market-note">Every price is fixed. Your ribbon lasts forever. Food is used one snack at a time.</p>`;
}
function glen() {
  const dailyEarned = state.game.day === day(Math.max(Date.now(), state.lastUpdated)) ? state.game.earned : 0;
  return `<section class="glen-card"><div class="glen-moon" aria-hidden="true"></div><p class="eyebrow">WHEN THE LITTLE LIGHTS COME OUT</p><h2>A dance with fireflies.</h2><p class="glen-description">Catch a little light at just the right moment. Good timing turns into pocket money.</p><div class="game-frame"><div class="game-labels"><span id="game-attempt">10 catches to make</span><span id="game-score">Score 0 / 100</span><span id="game-timer">30 seconds</span></div><div class="game-track" aria-label="Firefly timing track"><div class="catch-zone"></div><span id="firefly" class="firefly" aria-hidden="true"></span></div><div class="game-controls"><p>Press Space or Catch when the firefly reaches the golden patch. Closer to the centre earns more.</p><button id="game-start" class="button glen-button" ${!state.pet ? 'disabled' : ''}>Start a round ✧</button><button id="game-catch" class="button glen-button" hidden>Catch the light ✧</button></div><p id="game-feedback" class="game-feedback" role="status">A quiet moment. A quick little catch.</p></div></section><section class="card glen-rules"><div class="section-heading"><h2>Small sparks, lovely rewards</h2><span id="game-daily-earned">${dailyEarned} / 120 pebbles today</span></div><p>Ten catches. Thirty seconds. Each catch earns up to ten points for timing. A perfect round earns 40 pebbles; up to 120 pebbles can be earned each UTC day. Play as often as you like after the limit, for the joy of it.</p><p>Your companion gets a little happiness with every completed round. Leaving the glen ends an unfinished round without a reward.</p></section>`;
}
function render() {
  renderProfile();
  document.querySelectorAll('.nav-button').forEach((button) => { button.classList.toggle('active', button.dataset.area === currentArea); button.setAttribute('aria-current', button.dataset.area === currentArea ? 'page' : 'false'); });
  const headings = { garden:['Good things grow here.','A softer sort of adventure. Take a breath, and stay a while.'], market:['Little treats. Big happy feelings.','Follow the winding path to something lovely.'], glen:['There is magic after sundown.','A glimmer, a little game, and a pocketful of possibility.'] };
  $('#page-title').textContent = headings[currentArea][0];
  $('#page-subtitle').textContent = headings[currentArea][1];
  $('#area-content').innerHTML = { garden, market, glen }[currentArea]();
}
function changeArea(area) {
  if (!['garden','market','glen'].includes(area)) return;
  stopGame(); currentArea = area; render();
  history.replaceState(null, '', `#${area}`);
}
function selectSpecies() {
  $('#species-options').innerHTML = Object.entries(SPECIES).map(([id, species]) => `<button type="button" data-species="${id}" class="species-button ${id === selectedSpecies ? 'selected' : ''}" aria-pressed="${id === selectedSpecies}">${creature(id)}<strong>${escape(species.name)}</strong><small>${escape(species.description)}</small></button>`).join('');
}
function showAdoption() {
  selectSpecies();
  if (!$('#adoption-dialog').open) $('#adoption-dialog').showModal();
  setTimeout(() => $('#pet-name').focus(), 40);
}
async function beginGame() {
  if (game || currentArea !== 'glen') return;
  try {
    await withSaveLock(() => {
      readCurrentWorld();
      if (!state.pet || game || currentArea !== 'glen') return;
      render();
      game = { started:performance.now(), lastCatch:0, score:0, attempts:0, position:0.5, speed:1.6, seed:Math.random() * Math.PI * 2,
        generation:readLocal(WORLD_KEY), pet:petIdentity(state.pet) };
      $('#game-start').hidden = true; $('#game-catch').hidden = false;
      $('#game-catch').focus();
      $('#game-feedback').textContent = 'Watch the light. Catch it in the golden centre.';
      animateGame();
    });
  } catch (error) { toast(error.message); }
}
function animateGame() {
  if (!game) return;
  const elapsed = (performance.now() - game.started) / 1000;
  game.position = .5 + .43 * Math.sin(elapsed * game.speed * Math.PI + game.seed);
  $('#firefly').style.left = `${game.position * 100}%`;
  $('#game-timer').textContent = `${Math.max(0, 30 - Math.floor(elapsed))} seconds`;
  if (elapsed >= 30) { endGame(); return; }
  animationFrame = requestAnimationFrame(animateGame);
}
function catchLight() {
  if (!game) return;
  const now = performance.now();
  if (now - game.lastCatch < 350) return;
  game.lastCatch = now;
  const distance = Math.abs(game.position - .5);
  const points = Math.max(0, Math.round(10 * (1 - distance / .12)));
  game.score += points; game.attempts += 1;
  $('#game-score').textContent = `Score ${game.score} / 100`;
  $('#game-attempt').textContent = `${10 - game.attempts} catches left`;
  $('#game-feedback').textContent = points >= 8 ? `A lovely catch! +${points} points` : points > 0 ? `A little spark! +${points} points` : 'Just missed. Breathe, and try the next one.';
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
      if (completed.generation !== readLocal(WORLD_KEY) || completed.pet !== petIdentity(state.pet)) {
        throw new Error('Your saved world was replaced in another tab. This old round has ended without a reward.');
      }
      const oldWallet = state.wallet;
      state = claimGameReward(state, completed.score, Date.now());
      earned = state.wallet - oldWallet;
      persist(); render();
    });
    if (currentArea === 'glen') {
      $('#game-score').textContent = `Score ${completed.score} / 100`;
      $('#game-attempt').textContent = 'Round complete';
      $('#game-feedback').textContent = `${completed.score} points · ${earned} pebbles earned. ${earned === 0 && completed.score > 0 ? 'Daily reward limit reached. ' : ''}A little brighter already.`;
    }
    toast(`Round complete! ${earned} pebbles found in the glen.`);
  } catch (error) { render(); toast(error.message); }
}

function readLocal(key) {
  try { return localStorage.getItem(key); } catch { persistenceAvailable = false; return null; }
}
function enterRecovery(raw, message) {
  recoveryRaw = raw;
  stopGame();
  $('#adoption-dialog').close(); $('#save-dialog').close();
  $('#recovery-message').textContent = message;
  if (!$('#recovery-dialog').open) $('#recovery-dialog').showModal();
}
async function importFile(file, errorSelector) {
  if (!file) return;
  try {
    if (file.size > 32768) throw new Error('This save is too large. Petrealm saves must be no larger than 32 KiB.');
    const raw = await file.text();
    const restored = parseSave(raw);
    await withSaveLock(() => {
      const previous = readLocal(SAVE_KEY) ?? serialiseSave(state);
      // Back up the latest durable world after file reading, including invalid
      // recovery text, rather than a stale snapshot from before the await.
      replaceWorld(advanceTime(restored, Date.now()), previous);
      $('#recovery-dialog').close(); $('#save-dialog').close();
      if (!state.pet) showAdoption();
    });
    toast('Your world is home. Save imported successfully.');
  } catch (error) { $(errorSelector).textContent = error.message; }
}

$('#adoption-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = $('#pet-name').value.trim();
  const species = selectedSpecies;
  try {
    await withSaveLock(() => {
      readCurrentWorld();
      state = adopt(state, name, species, Date.now());
      persist(); render(); $('#adoption-dialog').close();
    });
    toast(`Welcome home, ${state.pet.name}. Your adventure starts here.`);
  } catch (error) { $('#adoption-error').textContent = error.message; }
});
$('#adoption-dialog').addEventListener('cancel', (event) => { if (!state.pet) event.preventDefault(); });
$('#recovery-dialog').addEventListener('cancel', (event) => event.preventDefault());
$('#daily-reward').addEventListener('click', () => update((s) => claimDaily(s, Date.now()), 'A little daily delight! 40 pebbles added to your satchel.'));
function openSaves() {
  if (game) { stopGame(); render(); toast('Your unfinished round has ended. No reward was claimed.'); }
  $('#save-error').textContent = '';
  const hasBackup = readLocal(BACKUP_KEY) !== null;
  $('#restore-backup').disabled = !hasBackup;
  $('#export-backup').disabled = !hasBackup;
  $('#save-dialog').showModal();
}
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
    toast('A little world, safely packed.');
  } catch (error) { $('#save-error').textContent = error.message; }
});
$('#import-save').addEventListener('change', (event) => { importFile(event.target.files[0], '#save-error'); event.target.value = ''; });
$('#recovery-import').addEventListener('change', (event) => { importFile(event.target.files[0], '#recovery-error'); event.target.value = ''; });
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
      $('#save-dialog').close(); if (!state.pet) showAdoption();
    });
    toast('Previous save restored. Your other world is now the backup.');
  } catch (error) { $('#save-error').textContent = error.message; }
});
$('#download-recovery').addEventListener('click', () => download(recoveryRaw || '', 'petrealm-recovery-original.json'));
$('#start-fresh').addEventListener('click', async () => {
  try {
    await withSaveLock(() => {
      const latestRaw = readLocal(SAVE_KEY);
      if (latestRaw !== recoveryRaw) throw new Error('This world changed in another tab. Reopen it before choosing to start fresh.');
      replaceWorld(createState(Date.now()), latestRaw ?? recoveryRaw ?? '');
      $('#recovery-dialog').close(); showAdoption();
    });
  } catch (error) { $('#recovery-error').textContent = error.message; }
});
document.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target || target.disabled) return;
  if (target.dataset.area) changeArea(target.dataset.area);
  if (target.dataset.species) { selectedSpecies = target.dataset.species; selectSpecies(); }
  if (target.dataset.buy) update((s) => purchase(s, target.dataset.buy, Date.now()), `${ITEMS[target.dataset.buy].name} tucked into your satchel.`);
  if (target.id === 'feed-berry') update((s) => care(s, 'feed', 'berry', Date.now()), 'A sweet little snack. Fullness +22, happiness +6.');
  if (target.id === 'feed-acorn') update((s) => care(s, 'feed', 'acorn', Date.now()), 'A hearty little treat. Fullness +12, energy +12, happiness +3.');
  if (target.id === 'care-play') update((s) => care(s, 'play', 'ribbon', Date.now()), 'A very good wiggle. Happiness +20, energy −12, fullness −4.');
  if (target.id === 'care-rest') update((s) => care(s, 'rest', undefined, Date.now()), 'A cosy nap. Energy +30, fullness −5, happiness +3.');
  if (target.id === 'game-start') beginGame();
  if (target.id === 'game-catch') catchLight();
});
document.addEventListener('keydown', (event) => {
  if (game && event.code === 'Space' && !document.querySelector('dialog[open]')) { event.preventDefault(); if (!event.repeat) catchLight(); }
});
window.addEventListener('storage', async (event) => {
  if (![SAVE_KEY, WORLD_KEY].includes(event.key)) return;
  try {
    await withSaveLock(() => {
      // Queued events can contain an old value. Always read the current saved
      // snapshot under the same mutex used by writers.
      const raw = readLocal(SAVE_KEY);
      if (dirtyMemory) {
        if (raw !== durableBaseRaw) {
          stopGame(); render();
          toast('Another tab saved a newer world. Your unsaved world is preserved here: export it before reloading.');
        }
        return;
      }
      if (raw === null) return;
      const updated = parseSave(raw);
      durableBaseRaw = raw;
      if (game && (game.generation !== readLocal(WORLD_KEY) || game.pet !== petIdentity(updated.pet))) stopGame();
      state = advanceTime(updated, Date.now()); recoveryRaw = null;
      $('#recovery-dialog').close(); renderCurrentWorld();
      if (state.pet) $('#adoption-dialog').close(); else showAdoption();
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
currentArea = ['garden','market','glen'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'garden';
try {
  await withSaveLock(() => {
    const saved = readLocal(SAVE_KEY);
    durableBaseRaw = saved;
    if (saved !== null) {
      try { state = advanceTime(parseSave(saved), Date.now()); }
      catch (error) { enterRecovery(saved, error.message); }
    }
    render();
    if (recoveryRaw === null) { persist(); if (!state.pet) showAdoption(); }
  });
} catch (error) {
  render(); toast(error.message);
  if (!state.pet) showAdoption();
}
if (!persistenceAvailable) setTimeout(() => toast('Storage is unavailable. Export a save to keep your world.'), 200);
