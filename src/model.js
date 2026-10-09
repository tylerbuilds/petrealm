/** Original, local-only pet game rules. No network, browser or clock dependencies. */
export const SPECIES = Object.freeze({
  mossling: Object.freeze({ id: 'mossling', name: 'Mossling', description: 'A gentle woodland friend with a leafy crest.' }),
  emberkit: Object.freeze({ id: 'emberkit', name: 'Emberkit', description: 'A curious little companion with a warm glow.' }),
  moonfin: Object.freeze({ id: 'moonfin', name: 'Moonfin', description: 'A dreamy tide dweller who follows the stars.' }),
});

export const ITEMS = Object.freeze({
  berry: Object.freeze({ id: 'berry', name: 'Sunberry', price: 12, description: 'A sweet snack: +22 fullness, +6 happiness.' }),
  acorn: Object.freeze({ id: 'acorn', name: 'Honey acorn', price: 8, description: 'A hearty snack: +12 fullness, +12 energy, +3 happiness.' }),
  ribbon: Object.freeze({ id: 'ribbon', name: 'Rainbow ribbon', price: 35, description: 'A reusable toy: +20 happiness, costs 12 energy.' }),
});

const HOUR = 3_600_000;
const MAX_TIMESTAMP = 253_402_300_799_999;
const MAX_COUNTER = 1_000_000_000;
const MAX_SAVE_BYTES = 32_768;
const MAX_JSON_DEPTH = 16;
const STATE_KEYS = ['version', 'pet', 'wallet', 'inventory', 'lastUpdated', 'daily', 'game', 'counts', 'achievements'];
const COUNT_KEYS = ['adoptions', 'feeds', 'plays', 'rests', 'purchases', 'dailyClaims', 'games'];
const ACHIEVEMENT_RULES = Object.freeze([
  ['first-friend', (counts) => counts.adoptions >= 1],
  ['well-fed', (counts) => counts.feeds >= 1],
  ['playmate', (counts) => counts.plays >= 1],
  ['sweet-dreams', (counts) => counts.rests >= 1],
  ['shopper', (counts) => counts.purchases >= 1],
  ['daily-visitor', (counts) => counts.dailyClaims >= 1],
  ['game-on', (counts) => counts.games >= 1],
  ['devoted-carer', (counts) => counts.feeds + counts.plays + counts.rests >= 25],
]);

function fail(message) {
  throw new Error(message);
}

function record(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    fail(`${label} must be an object.`);
  }
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) {
    fail(`${label} has missing or unknown fields. Expected: ${keys.join(', ')}.`);
  }
  if (Reflect.ownKeys(value).length !== actual.length) fail(`${label} contains unsupported fields.`);
}

function integer(value, minimum, maximum, label) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    fail(`${label} must be a whole number from ${minimum} to ${maximum}.`);
  }
}

function timestamp(value, label = 'Time') {
  integer(value, 0, MAX_TIMESTAMP, label);
}

function dayFor(time) {
  return new Date(time).toISOString().slice(0, 10);
}

function checkDay(value, label) {
  if (value === null) return;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)
      || !Number.isFinite(Date.parse(`${value}T00:00:00.000Z`))
      || dayFor(Date.parse(`${value}T00:00:00.000Z`)) !== value
      || value < '1970-01-01') {
    fail(`${label} must be a valid UTC date or null.`);
  }
}

function checkName(name) {
  if (typeof name !== 'string' || name !== name.trim() || [...name].length < 1 || [...name].length > 24
      || /[\u0000-\u001f\u007f-\u009f]/u.test(name)) {
    fail('Pet name must contain 1–24 characters, without control characters or surrounding spaces.');
  }
}

function earnedAchievements(counts) {
  return ACHIEVEMENT_RULES.filter(([, earned]) => earned(counts)).map(([id]) => id);
}

/** Validate the complete versioned schema; throws a helpful error, never replaces a save. */
export function validateState(state) {
  record(state, STATE_KEYS, 'Save');
  if (state.version !== 1) fail('Unsupported save version. Petrealm currently supports version 1.');
  timestamp(state.lastUpdated, 'Saved time');
  integer(state.wallet, 0, MAX_COUNTER, 'Pebble balance');
  record(state.inventory, Object.keys(ITEMS), 'Inventory');
  for (const id of Object.keys(ITEMS)) integer(state.inventory[id], 0, 999, `${ITEMS[id].name} quantity`);
  record(state.counts, COUNT_KEYS, 'Activity counts');
  for (const key of COUNT_KEYS) integer(state.counts[key], 0, MAX_COUNTER, `${key} count`);
  if (state.pet !== null) {
    record(state.pet, ['name', 'species', 'adoptedAt', 'stats'], 'Pet');
    checkName(state.pet.name);
    if (typeof state.pet.species !== 'string' || !Object.hasOwn(SPECIES, state.pet.species)) fail('Unknown pet species.');
    timestamp(state.pet.adoptedAt, 'Adoption time');
    if (state.pet.adoptedAt > state.lastUpdated) fail('Adoption time cannot be after the saved time.');
    record(state.pet.stats, ['satiety', 'happiness', 'energy'], 'Pet stats');
    for (const [key, value] of Object.entries(state.pet.stats)) {
      if (!Number.isFinite(value) || value < 0 || value > 100) fail(`${key} must be a finite number from 0 to 100.`);
    }
  }
  if (state.counts.adoptions !== (state.pet ? 1 : 0)) fail('Adoption count does not match the pet.');
  if (!state.pet && (state.counts.feeds || state.counts.plays || state.counts.rests || state.counts.games)) {
    fail('Pet activity requires an adopted pet.');
  }
  record(state.daily, ['lastClaimDay'], 'Daily reward');
  checkDay(state.daily.lastClaimDay, 'Daily reward date');
  if ((state.daily.lastClaimDay === null) !== (state.counts.dailyClaims === 0)) fail('Daily reward history is inconsistent.');
  record(state.game, ['day', 'earned'], 'Game reward');
  checkDay(state.game.day, 'Game reward date');
  integer(state.game.earned, 0, 120, 'Daily game rewards');
  if (state.game.day === null && state.game.earned !== 0) fail('Game rewards need a UTC date.');
  if ((state.game.day === null) !== (state.counts.games === 0)) fail('Game reward history is inconsistent.');
  const savedDay = dayFor(state.lastUpdated);
  if ((state.daily.lastClaimDay && state.daily.lastClaimDay > savedDay)
      || (state.game.day && state.game.day > savedDay)) fail('Reward dates cannot be after the saved time.');
  if (!Array.isArray(state.achievements) || state.achievements.length > ACHIEVEMENT_RULES.length
      || new Set(state.achievements).size !== state.achievements.length) {
    fail('Achievements must be a list without duplicates.');
  }
  const expected = earnedAchievements(state.counts);
  if (state.achievements.length !== expected.length || state.achievements.some((id) => !expected.includes(id))) {
    fail('Achievements do not match the activity counts.');
  }
  return true;
}

function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

function finish(state) {
  state.achievements = earnedAchievements(state.counts);
  validateState(state);
  return state;
}

function requirePet(state) {
  if (!state.pet) fail('Adopt a companion before taking this action.');
}

function requireItem(id) {
  if (typeof id !== 'string' || !Object.hasOwn(ITEMS, id)) fail('Choose an item from the shop.');
}

function changeStats(state, changes) {
  for (const [key, amount] of Object.entries(changes)) {
    state.pet.stats[key] = Math.max(0, Math.min(100, state.pet.stats[key] + amount));
  }
}

/** Construct a new save. Callers may inject a timestamp for repeatable tests. */
export function createState(now = Date.now()) {
  timestamp(now);
  return {
    version: 1,
    pet: null,
    wallet: 120,
    inventory: { berry: 3, acorn: 2, ribbon: 1 },
    lastUpdated: now,
    daily: { lastClaimDay: null },
    game: { day: null, earned: 0 },
    counts: { adoptions: 0, feeds: 0, plays: 0, rests: 0, purchases: 0, dailyClaims: 0, games: 0 },
    achievements: [],
  };
}

/** Apply at most 72 hours of decay; never move the save clock backwards. */
export function advanceTime(state, now = Date.now()) {
  validateState(state);
  timestamp(now);
  const next = clone(state);
  const effectiveTime = Math.max(now, next.lastUpdated);
  const elapsedHours = Math.min(72, (effectiveTime - next.lastUpdated) / HOUR);
  if (next.pet) changeStats(next, { satiety: -3 * elapsedHours, happiness: -2 * elapsedHours, energy: -elapsedHours });
  next.lastUpdated = effectiveTime;
  return next;
}

export function adopt(state, name, species, now = Date.now()) {
  const next = advanceTime(state, now);
  if (next.pet) fail('This save already has a companion.');
  if (typeof name !== 'string') fail('Give your companion a name.');
  const cleanName = name.trim().normalize('NFC');
  checkName(cleanName);
  if (typeof species !== 'string' || !Object.hasOwn(SPECIES, species)) fail('Choose one of the three available species.');
  next.pet = { name: cleanName, species, adoptedAt: next.lastUpdated, stats: { satiety: 85, happiness: 80, energy: 85 } };
  next.counts.adoptions = 1;
  return finish(next);
}

export function care(state, action, itemId, now = Date.now()) {
  const next = advanceTime(state, now);
  requirePet(next);
  if (action === 'feed') {
    if (!['berry', 'acorn'].includes(itemId)) fail('Feed your companion a sunberry or honey acorn.');
    if (next.inventory[itemId] < 1) fail(`You have no ${ITEMS[itemId].name.toLowerCase()} left. Visit the shop.`);
    next.inventory[itemId] -= 1;
    changeStats(next, itemId === 'berry' ? { satiety: 22, happiness: 6 } : { satiety: 12, happiness: 3, energy: 12 });
    next.counts.feeds += 1;
  } else if (action === 'play') {
    if (itemId !== 'ribbon') fail('Choose the rainbow ribbon to play.');
    if (next.inventory.ribbon < 1) fail('You need a rainbow ribbon. Visit the shop.');
    if (next.pet.stats.energy < 12) fail('Your companion needs a rest before playing.');
    changeStats(next, { happiness: 20, energy: -12, satiety: -4 });
    next.counts.plays += 1;
  } else if (action === 'rest') {
    if (itemId !== undefined && itemId !== null) fail('Rest does not use an item.');
    changeStats(next, { energy: 30, satiety: -5, happiness: 3 });
    next.counts.rests += 1;
  } else fail('Unknown care action. Choose feed, play or rest.');
  return finish(next);
}

export function purchase(state, itemId, now = Date.now()) {
  const next = advanceTime(state, now);
  requireItem(itemId);
  if (next.wallet < ITEMS[itemId].price) fail(`You need ${ITEMS[itemId].price} pebbles to buy a ${ITEMS[itemId].name.toLowerCase()}.`);
  if (next.inventory[itemId] >= 999) fail('Your inventory is full for this item.');
  next.wallet -= ITEMS[itemId].price;
  next.inventory[itemId] += 1;
  next.counts.purchases += 1;
  return finish(next);
}

export function claimDaily(state, now = Date.now()) {
  const next = advanceTime(state, now);
  const day = dayFor(next.lastUpdated);
  if (next.daily.lastClaimDay === day) fail('You have already collected today’s 40-pebble reward. Come back tomorrow (UTC).');
  next.daily.lastClaimDay = day;
  next.wallet += 40;
  next.counts.dailyClaims += 1;
  return finish(next);
}

/** Score is 0–100. Reward is at most 40 per round and 120 per UTC day. */
export function claimGameReward(state, score, now = Date.now()) {
  const next = advanceTime(state, now);
  requirePet(next);
  integer(score, 0, 100, 'Game score');
  const day = dayFor(next.lastUpdated);
  if (next.game.day !== day) next.game = { day, earned: 0 };
  const reward = Math.min(40, Math.floor(score * 0.4), 120 - next.game.earned);
  next.game.earned += reward;
  next.wallet += reward;
  next.counts.games += 1;
  changeStats(next, { happiness: 3 });
  return finish(next);
}

// JSON.parse accepts duplicate keys. Inspect valid JSON tokens so a malformed
// hand-edited save cannot silently overwrite data during import.
function rejectDuplicateKeys(text) {
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
    if (depth > MAX_JSON_DEPTH) fail(`Save is nested too deeply. The limit is ${MAX_JSON_DEPTH} levels.`);
    if (text[position] === '{') {
      position += 1;
      space();
      const keys = new Set();
      while (text[position] !== '}') {
        space();
        const key = string();
        if (keys.has(key)) fail(`Save contains the duplicate field “${key}”. Remove the duplicate and try again.`);
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

export function parseSave(text) {
  if (typeof text !== 'string') fail('Choose a JSON save file.');
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) fail('Save file is too large. The limit is 32 KiB.');
  let state;
  try { state = JSON.parse(text); }
  catch { fail('Save file is not valid JSON. Your current companion has not been changed.'); }
  validateState(state);
  // Validate the shallow schema before scanning: even a small file can contain
  // thousands of nested arrays, which should produce a save error, not overflow.
  rejectDuplicateKeys(text);
  return clone(state);
}

export function serialiseSave(state) {
  validateState(state);
  const text = `${JSON.stringify(state, null, 2)}\n`;
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) fail('Save is too large to export.');
  return text;
}
