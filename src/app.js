import { SPECIES, PERSONALITIES, ITEMS, createState, adopt, advanceTime, care, purchase, claimDaily, claimGameReward, parseSave, serialiseSave, readActivePet, selectPet, deposit, withdraw, equipAccessory, claimQuest, startBattle, battleAction, petCapacity, setMembership, claimLodgeParcel, useExpansion, claimBankInterest, upgradeBankTier, claimQuestDay, trainPet, growPet } from './model.js';
import { creature } from './art.js';
import { withSaveLock } from './persistence.js';
import { renderGarden, renderMarket, renderRealm, renderArena, renderGlen, itemSymbols, battleActive } from './views.js';

const SAVE_KEY = 'petrealm.save.v1';
const BACKUP_KEY = 'petrealm.backup.v1';
const WORLD_KEY = 'petrealm.world-generation.v1';
const MIGRATION_KEY = 'petrealm.migration-original.v1';
const $ = (selector) => document.querySelector(selector);
const companionCard = $('.companion');
const companionSidebar = $('.side-column');
const compactWorld = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 800px)') : null;
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);
let state = createState(Date.now());
let currentArea = 'garden';
let selectedSpecies = 'mossling';
let selectedPersonality = 'steady';
let adoptionStartedCount = 0;
let marketFilter = 'all';
let gameMode = 'firefly';
let memoryTimer;
let memoryFlipTimer;
let recoveryRaw = null;
let persistenceAvailable = true;
let durableBaseRaw = null;
let stateGeneration = null;
let dirtyMemory = false;
let pendingMigrationRaw = null;
let toastTimer;
let game = null;
let animationFrame;
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
function retainMigrationOriginal() {
  if (pendingMigrationRaw === null) return;
  // Keep legacy text separately: a later import or backup swap must not destroy
  // the unique pre-migration original. Any failure prevents a SAVE overwrite.
  localStorage.setItem(MIGRATION_KEY,pendingMigrationRaw);
  if (readLocal(BACKUP_KEY) === null) {
    try { localStorage.setItem(BACKUP_KEY,pendingMigrationRaw); }
    catch { /* The independent migration original is already retained. */ }
  }
  pendingMigrationRaw = null;
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
    if (raw !== durableBaseRaw) throw new Error('Another tab saved a different world while your changes were unsaved. Export your unsaved world, then reload to use the newer saved world.');
    return state;
  }
  if (raw !== null) {
    try {
      state = parseSave(raw);
      stateGeneration = readLocal(WORLD_KEY);
      if (JSON.parse(raw).version === 1) pendingMigrationRaw = raw;
    }
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
function updateObservedPet(action, message) {
  const observed = petIdentity(readActivePet(state));
  const generation = stateGeneration;
  return update((fresh) => {
    if (observed !== petIdentity(readActivePet(fresh)) || generation !== readLocal(WORLD_KEY)) {
      renderCurrentWorld();
      throw new Error('Your world or active companion changed in another tab. Choose your friend again before practising or marking a bloom.');
    }
    return action(fresh);
  }, message);
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
  if (!readActivePet(state)) return 'A friend is waiting to meet you.';
  const { satiety, happiness, energy } = readActivePet(state).stats;
  if (satiety < 30) return 'A little hungry. A snack would be lovely.';
  if (energy < 25) return 'Ready for a quiet moment and a cosy nap.';
  if (happiness < 35) return 'Some company would brighten their day.';
  return 'Feeling loved. Life is pretty lovely here.';
}
function renderProfile() {
  const pet = readActivePet(state);
  $('#wallet').textContent = state.wallet;
  $('#pet-profile').innerHTML = pet ? `<div class="profile-line"><div class="pet-avatar">${creature(pet.species, `${SPECIES[pet.species].name}, ${pet.journey.growth ? 'first bloom' : 'young companion'}`, pet.wearing, Boolean(pet.journey.growth))}</div><div><h2 id="companion-name">${escape(pet.name)}</h2><p>${escape(SPECIES[pet.species].name)} · ${PERSONALITIES[pet.personality].name}${pet.journey.growth ? ' · First bloom' : ''}</p><div class="level-line"><span class="level-badge" id="pet-level">Level ${pet.level}</span><span class="experience-track"><span style="width:${pet.level >= 20 ? 100 : pet.xp % 100}%"></span></span><span id="pet-xp">${pet.xp} XP</span></div></div></div>` : `<div class="profile-line"><div class="pet-avatar">${creature('mossling')}</div><div><h2>A friend awaits</h2><p>A little companion to call your own</p></div></div>`;
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
function garden() { return renderGarden(state); }
function market() { return renderMarket(state,marketFilter); }
function glen() { return renderGlen(state,gameMode); }
function realm() { return renderRealm(state); }
function arena() { return renderArena(state); }
function positionCompanion() {
  if (!compactWorld) return;
  const carePanel = currentArea === 'garden' && compactWorld.matches ? $('.care-panel') : null;
  if (carePanel) {
    carePanel.before(companionCard);
    companionCard.classList.add('inline-companion');
  } else {
    companionSidebar.prepend(companionCard);
    companionCard.classList.remove('inline-companion');
  }
}
compactWorld?.addEventListener('change', positionCompanion);
function render() {
  const growthOpen = $('#growth-disclosure')?.open;
  const bankDraft = $('#bank-amount')?.value;
  const bankTierDraft = $('#bank-tier')?.value;
  const focused = document.activeElement;
  const focusedId = focused?.id;
  const focusedInArea = Boolean(focused?.closest('#area-content'));
  const focusedAction = focusedInArea && !focusedId ? Array.from(focused.attributes || [])
    .filter((attribute) => attribute.name.startsWith('data-') && !(attribute.name === 'data-equip' && focused.dataset.slot))
    .map((attribute) => `[${attribute.name}="${CSS.escape(attribute.value)}"]`).join('') : '';
  // Keep the one live profile outside the area being replaced. On small
  // screens it sits between the garden scene and care, beside its actions.
  if (compactWorld) companionSidebar.prepend(companionCard);
  renderProfile();
  document.querySelectorAll('.nav-button').forEach((button) => { button.classList.toggle('active', button.dataset.area === currentArea); button.setAttribute('aria-current', button.dataset.area === currentArea ? 'page' : 'false'); });
  const headings = { garden:['Good things grow here.','A softer sort of adventure. Take a breath, and stay a while.'], market:['Little treats. Big happy feelings.','Follow the winding path to something lovely.'], glen:['There is magic after sundown.','A glimmer, a little game, and a pocketful of possibility.'], realm:['The next path is yours to choose.','A small map, a growing journal, and room for more friends.'], arena:['Brave hearts grow together.','Friendly challenges, thoughtful turns, and a little more courage.'] };
  $('#page-title').textContent = headings[currentArea][0];
  $('#page-subtitle').textContent = headings[currentArea][1];
  $('#area-content').innerHTML = { garden, market, glen, realm, arena }[currentArea]();
  positionCompanion();
  if (growthOpen !== undefined && $('#growth-disclosure')) $('#growth-disclosure').open = growthOpen;
  if (bankDraft !== undefined && $('#bank-amount')) $('#bank-amount').value = bankDraft;
  const bankTier = $('#bank-tier');
  if (bankTierDraft && bankTier && Array.from(bankTier.options).some((option) => option.value === bankTierDraft && !option.disabled)) bankTier.value = bankTierDraft;
  const restoredFocus = focusedInArea ? focusedId ? document.getElementById(focusedId)
    : focusedAction ? document.querySelector(`#area-content button${focusedAction}`) : null : null;
  if (restoredFocus && !restoredFocus.disabled) restoredFocus.focus({preventScroll:true});
  else if (focusedInArea && focusedId === 'pet-grow') $('#growth-disclosure summary')?.focus({preventScroll:true});
}
function changeArea(area) {
  if (!['garden','market','glen','realm','arena'].includes(area)) return;
  stopGame(); currentArea = area; render();
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
  adoptionStartedCount = state.pets.length;
  selectedPersonality = SPECIES[selectedSpecies].personality;
  $('#pet-name').value = '';
  $('#adoption-error').textContent = '';
  $('#close-adoption').hidden = !readActivePet(state);
  selectSpecies();
  if (!$('#adoption-dialog').open) $('#adoption-dialog').showModal();
  setTimeout(() => $('#pet-name').focus(), 40);
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
      $('#game-feedback').textContent = 'Watch the light. Catch it in the golden centre.';
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
      if (completed.generation !== readLocal(WORLD_KEY) || completed.pet !== petIdentity(readActivePet(state))) {
        throw new Error('Your saved world was replaced in another tab. This old round has ended without a reward.');
      }
      const oldWallet = state.wallet;
      state = claimGameReward(state, completed.score, Date.now(), completed.kind);
      earned = state.wallet - oldWallet;
      persist(); render();
    });
    if (currentArea === 'glen' && gameMode === 'firefly' && completed.kind === 'firefly') {
      $('#game-score').textContent = `Score ${completed.score} / 100`;
      $('#game-attempt').textContent = 'Round complete';
      $('#game-feedback').textContent = `${completed.score} points · ${earned} pebbles earned. ${earned === 0 && completed.score > 0 ? 'Daily reward limit reached. ' : ''}A little brighter already.`;
    }
    if (currentArea === 'glen' && gameMode === 'memory' && completed.kind === 'memory') {
      $('#memory-feedback').textContent = `${completed.matches} pairs in ${completed.moves} turns · score ${completed.score} / 100 · ${earned} pebbles earned.`;
    }
    toast(`Round complete! ${earned} pebbles found in the glen.`);
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
        generation:readLocal(WORLD_KEY),pet:petIdentity(readActivePet(state))};
      $('#memory-start').disabled = true;
      updateMemoryBoard();
      $('#memory-feedback').textContent = 'Find two little wonders that bloom together.';
      memoryTimer = setInterval(() => {
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
    tile.disabled = matched || game.flipped.includes(index) || game.flipped.length >= 2;
    tile.classList.toggle('face-up',visible);
    tile.classList.toggle('matched',matched);
    tile.textContent = visible ? memorySymbols[game.cards[index]] : '❀';
    tile.setAttribute('aria-label', visible ? `${memoryLabels[game.cards[index]]}${matched ? ', matched' : ''}` : `Hidden card ${index+1}`);
  });
  $('#memory-moves').textContent = `${game.moves} turns`;
  $('#memory-matches').textContent = `${game.matches} / 6 pairs`;
}
function flipMemory(index) {
  if (!game || game.kind !== 'memory' || !Number.isInteger(index) || index < 0 || index > 11
      || game.flipped.length >= 2 || game.flipped.includes(index) || game.matched.includes(index)) return;
  if (performance.now()-game.started >= 75000) { game.score = game.matches*10; endGame(); return; }
  game.flipped.push(index);
  if (game.flipped.length === 2) {
    game.moves += 1;
    const [first,second] = game.flipped;
    if (game.cards[first] === game.cards[second]) {
      game.matched.push(first,second); game.flipped = []; game.matches += 1;
      $('#memory-feedback').textContent = 'A lovely pair! Keep those little places in mind.';
      if (game.matches === 6) { game.score = Math.max(0,100-2*(game.moves-6)); endGame(); return; }
    } else {
      $('#memory-feedback').textContent = 'Different little wonders. Remember where they grow.';
      memoryFlipTimer = setTimeout(() => {
        if (!game || game.kind !== 'memory') return;
        game.flipped = []; updateMemoryBoard();
      },650);
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
      if (!readActivePet(state)) showAdoption();
    });
    toast('Your world is home. Save imported successfully.');
  } catch (error) { $(errorSelector).textContent = error.message; }
}

$('#adoption-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = $('#pet-name').value.trim();
  const species = selectedSpecies;
  const personality = selectedPersonality;
  try {
    await withSaveLock(() => {
      readCurrentWorld();
      state = adopt(state, name, species, Date.now(), personality);
      persist(); render(); $('#adoption-dialog').close();
    });
    toast(`Welcome home, ${readActivePet(state).name}. Your adventure starts here.`);
  } catch (error) { $('#adoption-error').textContent = error.message; }
});
$('#pet-personality').addEventListener('change', () => {
  selectedPersonality = $('#pet-personality').value;
  $('#personality-description').textContent = PERSONALITIES[selectedPersonality].description;
});
$('#close-adoption').addEventListener('click', () => { if (readActivePet(state)) $('#adoption-dialog').close(); });
$('#adoption-dialog').addEventListener('cancel', (event) => { if (!readActivePet(state)) event.preventDefault(); });
$('#recovery-dialog').addEventListener('cancel', (event) => event.preventDefault());
$('#daily-reward').addEventListener('click', () => update((s) => claimDaily(s, Date.now()), 'A little daily delight! 40 pebbles added to your satchel.'));
function openSaves() {
  if (game) { stopGame(); render(); toast('Your unfinished round has ended. No reward was claimed.'); }
  $('#save-error').textContent = '';
  const hasBackup = readLocal(BACKUP_KEY) !== null;
  $('#restore-backup').disabled = !hasBackup;
  $('#export-backup').disabled = !hasBackup;
  $('#export-original').disabled = pendingMigrationRaw === null && readLocal(MIGRATION_KEY) === null;
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
$('#export-original').addEventListener('click', () => {
  const raw = pendingMigrationRaw ?? readLocal(MIGRATION_KEY);
  if (raw === null) { $('#save-error').textContent = 'No original version 1 migration save is available in this browser.'; return; }
  download(raw,'petrealm-original-version-1.json');
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
  if (target.dataset.area) {
    changeArea(target.dataset.area);
    if (target.dataset.scrollBank) $('#bank')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  if (target.id === 'adopt-another') {
    if (state.pets.length < petCapacity(state) && !battleActive(state)) showAdoption();
  }
  if (target.dataset.petId) update((s) => selectPet(s,target.dataset.petId,Date.now()), 'A different little friend, the same lovely home.');
  if (target.dataset.equip) update((s) => equipAccessory(s,target.dataset.equip === 'none' ? null : target.dataset.equip,target.dataset.slot,Date.now()), target.dataset.equip === 'none' ? 'A little outfit change. Accessory returned to the wardrobe.' : 'Looking lovely! Accessory equipped.');
  if (target.dataset.shopFilter) { marketFilter = target.dataset.shopFilter; render(); }
  if (target.id === 'bank-deposit' || target.id === 'bank-withdraw') {
    const amount = Number($('#bank-amount').value);
    const operation = target.id === 'bank-deposit' ? deposit : withdraw;
    update((s) => operation(s,amount,Date.now()), target.id === 'bank-deposit' ? `${amount} pebbles tucked safely away.` : `${amount} pebbles returned to your pocket.`);
  }
  if (target.id === 'bank-interest') update((s) => claimBankInterest(s,Date.now()), 'A little growth. Today’s interest is saved in the Pebble Keep.');
  if (target.id === 'bank-upgrade') {
    const tier = $('#bank-tier').value;
    update((s) => upgradeBankTier(s,tier,Date.now()), 'Your savings have a new home. This tier stays yours after withdrawals.');
  }
  if (target.dataset.claimQuest) update((s) => claimQuest(s,target.dataset.claimQuest,Date.now()), 'A little quest, completed. Gift and experience collected!');
  if (target.id === 'quest-day-complete') update((s) => claimQuestDay(s,Date.now()), 'Today’s quest gift is collected. Seven days in a row earn an extra weekly gift.');
  if (target.dataset.battleStart) update((s) => startBattle(s,target.dataset.battleStart,Date.now()), 'A friendly challenge begins. Choose your first move.');
  if (target.dataset.battleAction) update((s) => battleAction(s,target.dataset.battleAction,Date.now()));
  if (target.dataset.gameMode) { stopGame(); gameMode = target.dataset.gameMode; render(); }
  if (target.id === 'memory-start') beginMemory();
  if (target.dataset.memoryIndex !== undefined) flipMemory(Number(target.dataset.memoryIndex));
  if (target.id === 'lodge-membership') {
    const tier = state.membership.tier === 'explorer' ? 'free' : 'explorer';
    update((s) => setMembership(s,tier,Date.now()), tier === 'explorer' ? 'Welcome to the Explorer Lodge. Seven extra companion spaces are yours.' : 'Standard mode restored. Your family and progress are kept.');
  }
  if (target.id === 'lodge-parcel') update((s) => claimLodgeParcel(s,Date.now()), 'A Lodge parcel! 20 pebbles and a sunberry added to your satchel.');
  if (target.id === 'use-expansion') update((s) => useExpansion(s,Date.now()), 'A little more room for wonder. One permanent companion space added.');
  if (target.dataset.species) { selectedSpecies = target.dataset.species; selectedPersonality = SPECIES[selectedSpecies].personality; selectSpecies(); }
  if (target.id === 'pet-train') updateObservedPet((s) => trainPet(s, Date.now()), 'A good practice, safely learned. Your companion’s experience has grown.');
  if (target.id === 'pet-grow') updateObservedPet((s) => growPet(s, Date.now()), 'Their first bloom! A new look, and a little more wisdom for future practice.');
  if (target.dataset.buy) update((s) => purchase(s, target.dataset.buy, Date.now()), `${ITEMS[target.dataset.buy].name} tucked into your satchel.`);
  if (target.id === 'feed-berry') update((s) => care(s, 'feed', 'berry', Date.now()), 'A sweet snack shared. Their fullness and happiness are brighter.');
  if (target.id === 'feed-acorn') update((s) => care(s, 'feed', 'acorn', Date.now()), 'A hearty snack shared. A little more fullness, energy and happiness.');
  if (target.id === 'care-play') update((s) => care(s, 'play', 'ribbon', Date.now()), 'A very good wiggle. Happier, and ready for a little rest.');
  if (target.id === 'care-rest') update((s) => care(s, 'rest', undefined, Date.now()), 'A cosy nap. Rested, happy, and ready for the next little adventure.');
  if (target.id === 'game-start') beginGame();
  if (target.id === 'game-catch') catchLight();
});
document.addEventListener('keydown', (event) => {
  if (game?.kind === 'firefly' && event.code === 'Space' && !document.querySelector('dialog[open]')) { event.preventDefault(); if (!event.repeat) catchLight(); }
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
currentArea = ['garden','market','glen','realm','arena'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'garden';
try {
  await withSaveLock(() => {
    const saved = readLocal(SAVE_KEY);
    durableBaseRaw = saved;
    stateGeneration = readLocal(WORLD_KEY);
    if (saved !== null) {
      try {
        state = advanceTime(parseSave(saved), Date.now());
        if (JSON.parse(saved).version === 1) pendingMigrationRaw = saved;
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
if (!persistenceAvailable) setTimeout(() => toast('Storage is unavailable. Export a save to keep your world.'), 200);
