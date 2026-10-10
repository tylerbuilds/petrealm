/** Original, local-only pet game rules. No network, browser or clock dependencies. */
export const SPECIES = Object.freeze({
  mossling: Object.freeze({ id: 'mossling', name: 'Mossling', kind: 'woodland spirit', description: 'A gentle woodland friend with a leafy crest.', trait: 'Patient keeper of tiny gardens', favourite: null, personality: 'steady' }),
  emberkit: Object.freeze({ id: 'emberkit', name: 'Emberkit', kind: 'hearth spirit', description: 'A curious little companion with a warm glow.', trait: 'Finds wonder in the smallest sparks', favourite: null, personality: 'steady' }),
  moonfin: Object.freeze({ id: 'moonfin', name: 'Moonfin', kind: 'tide spirit', description: 'A dreamy tide dweller who follows the stars.', trait: 'Dreams in ripples and constellations', favourite: null, personality: 'steady' }),
  briarhare: Object.freeze({ id: 'briarhare', name: 'Briarhare', kind: 'animal', description: 'A long-eared pathfinder with a seed-soft tail.', trait: 'A quick-footed collector of fallen seeds', favourite: 'acorn', personality: 'spirited' }),
  pebblepup: Object.freeze({ id: 'pebblepup', name: 'Pebblepup', kind: 'animal', description: 'A floppy-eared friend with paws made for wandering.', trait: 'Keeps your place beside the warmest stone', favourite: 'berry', personality: 'gentle' }),
  cloudmoth: Object.freeze({ id: 'cloudmoth', name: 'Cloudmoth', kind: 'animal', description: 'A velvet-winged wanderer of the evening flowers.', trait: 'Reads the wind with feathery antennae', favourite: 'acorn', personality: 'curious' }),
  kilnback: Object.freeze({ id: 'kilnback', name: 'Kilnback', kind: 'monster', description: 'A little clay giant carrying the warmth of a hearth.', trait: 'A sturdy soul with a copper-bright heart', favourite: 'acorn', personality: 'steady' }),
  gloomdrop: Object.freeze({ id: 'gloomdrop', name: 'Gloomdrop', kind: 'monster', description: 'An inky puddle of kindness with a sky full of flecks.', trait: 'Finds shy little lights in the deepest shade', favourite: 'berry', personality: 'gentle' }),
  thistlehorn: Object.freeze({ id: 'thistlehorn', name: 'Thistlehorn', kind: 'monster', description: 'A shaggy, horned rambler with a wildflower mane.', trait: 'Small in stature, enormous in courage', favourite: 'berry', personality: 'spirited' }),
});

export const PERSONALITIES = Object.freeze({
  steady: Object.freeze({ id: 'steady', name: 'Steady', description: 'An easy-going friend who enjoys your usual care.' }),
  gentle: Object.freeze({ id: 'gentle', name: 'Gentle', description: 'Cosy naps bring 3 extra happiness.' }),
  curious: Object.freeze({ id: 'curious', name: 'Curious', description: 'Their favourite snack brings 2 extra happiness.' }),
  spirited: Object.freeze({ id: 'spirited', name: 'Spirited', description: 'Ribbon play brings 3 extra happiness.' }),
});
export const TRAINING_COST = 20;
export const GROWTH_COST = 60;
const JOURNEY_KEYS = ['feeds', 'plays', 'rests', 'trainings', 'growth'];
const freshJourney = () => ({ feeds: 0, plays: 0, rests: 0, trainings: 0, growth: 0 });

export const ITEMS = Object.freeze({
  berry: Object.freeze({ id: 'berry', name: 'Sunberry', price: 12, description: 'A sweet snack: +22 fullness, +6 happiness.' }),
  acorn: Object.freeze({ id: 'acorn', name: 'Honey acorn', price: 8, description: 'A hearty snack: +12 fullness, +12 energy, +3 happiness.' }),
  ribbon: Object.freeze({ id: 'ribbon', name: 'Rainbow ribbon', price: 35, description: 'A reusable toy: +20 happiness, costs 12 energy.' }),
  leafcap: Object.freeze({ id: 'leafcap', name: 'Leaf cap', price: 45, slot: 'head', description: 'A woodland cap: +2 arena attack.' }),
  moonscarf: Object.freeze({ id: 'moonscarf', name: 'Moon scarf', price: 55, slot: 'neck', description: 'A soft lunar scarf: blocks 2 arena damage.' }),
  potion: Object.freeze({ id: 'potion', name: 'Dew potion', price: 18, description: 'Restore 22 HP during an arena turn.' }),
  'lodge-deed': Object.freeze({ id: 'lodge-deed', name: 'Lodge deed', price: 250, description: 'Consume to add one permanent companion slot (up to 12).' }),
});

export const QUESTS = Object.freeze({
  'daily-feast': Object.freeze({ id: 'daily-feast', name: 'Three square meals', description: 'Feed any companions three times today (UTC).', target: 3, reward: 25, xp: 10, type: 'daily' }),
  'daily-play': Object.freeze({ id: 'daily-play', name: 'A ribbon and a wiggle', description: 'Play with a companion today.', target: 1, reward: 10, xp: 5, type: 'daily' }),
  'daily-market': Object.freeze({ id: 'daily-market', name: 'Something for the satchel', description: 'Buy one supply at Market lane today.', target: 1, reward: 10, xp: 5, type: 'daily' }),
  'daily-game': Object.freeze({ id: 'daily-game', name: 'A little spark of play', description: 'Finish either mini-game today, at any score.', target: 1, reward: 15, xp: 5, type: 'daily' }),
  'daily-rest': Object.freeze({ id: 'daily-rest', name: 'A moment under the leaves', description: 'Give a companion a cosy nap today.', target: 1, reward: 10, xp: 5, type: 'daily' }),
  'daily-parcel': Object.freeze({ id: 'daily-parcel', name: 'A note from the Lodge', description: 'Collect today’s Explorer Lodge parcel.', target: 1, reward: 10, xp: 5, type: 'daily', explorer: true }),
  'growing-family': Object.freeze({ id: 'growing-family', name: 'A growing family', description: 'Adopt two companions.', target: 2, reward: 30, xp: 10, type: 'permanent' }),
  'arena-debut': Object.freeze({ id: 'arena-debut', name: 'Arena debut', description: 'Win an arena battle.', target: 1, reward: 40, xp: 10, type: 'permanent' }),
  'game-explorer': Object.freeze({ id: 'game-explorer', name: 'Game explorer', description: 'Complete three mini-game rounds.', target: 3, reward: 30, xp: 10, type: 'permanent' }),
});

/** Original game savings rules, not the source service's rates or account names. */
export const BANK_TIERS = Object.freeze({
  seedling: Object.freeze({ id: 'seedling', name: 'Seedling saver', minimum: 0, basisPoints: 500 }),
  sapling: Object.freeze({ id: 'sapling', name: 'Sapling keeper', minimum: 1000, basisPoints: 750 }),
  canopy: Object.freeze({ id: 'canopy', name: 'Canopy keeper', minimum: 10000, basisPoints: 1000 }),
  grove: Object.freeze({ id: 'grove', name: 'Old grove trust', minimum: 100000, basisPoints: 1250 }),
});
export const QUEST_DAY_REWARD = 40;
export const QUEST_WEEK_REWARD = 150;
const DAILY_QUEST_IDS = Object.keys(QUESTS).filter((id) => QUESTS[id].type === 'daily');
const DAILY_PROGRESS = { 'daily-play': 'plays', 'daily-market': 'purchases', 'daily-game': 'games', 'daily-rest': 'rests', 'daily-parcel': 'parcels' };

export const OPPONENTS = Object.freeze({
  ashgrub: Object.freeze({ id: 'ashgrub', name: 'Ashgrub', level: 1, hp: 30, attack: 7, reward: 25, xp: 20 }),
  stonebeak: Object.freeze({ id: 'stonebeak', name: 'Stonebeak', level: 3, hp: 48, attack: 10, reward: 40, xp: 30 }),
  frostwisp: Object.freeze({ id: 'frostwisp', name: 'Frostwisp', level: 5, hp: 70, attack: 13, reward: 60, xp: 45 }),
});

const HOUR = 3_600_000;
const DAY = 86_400_000;
const MAX_TIMESTAMP = 253_402_300_799_999;
const MAX_COUNTER = 1_000_000_000;
const MAX_SAVE_BYTES = 32_768;
const MAX_JSON_DEPTH = 16;
const LEGACY_STATE_KEYS = ['version', 'pet', 'wallet', 'inventory', 'lastUpdated', 'daily', 'game', 'counts', 'achievements'];
const LEGACY_COUNT_KEYS = ['adoptions', 'feeds', 'plays', 'rests', 'purchases', 'dailyClaims', 'games'];
const STATE_KEYS = ['version', 'pets', 'activePetId', 'wallet', 'bank', 'inventory', 'lastUpdated', 'daily', 'game', 'counts', 'achievements', 'quests', 'battle', 'battleWins', 'membership', 'expansions'];
const COUNT_KEYS = [...LEGACY_COUNT_KEYS, 'battleWins', 'bankDeposits', 'bankWithdrawals', 'accessoriesEquipped', 'questsClaimed', 'lodgeParcels', 'expansionsUsed'];
const LEGACY_ITEMS = ['berry', 'acorn', 'ribbon'];
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

function record(value, keys, label, optional = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    fail(`${label} must be an object.`);
  }
  const actual = Object.keys(value);
  if (keys.some((key) => !actual.includes(key)) || actual.some((key) => !keys.includes(key) && !optional.includes(key))) {
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

function previousDay(day) {
  return dayFor(Date.parse(`${day}T00:00:00.000Z`) - DAY);
}

function freshQuestLog(daily) {
  return { day: daily.day, progress: { plays: 0, purchases: 0, games: 0, rests: 0, parcels: 0 },
    claimed: daily.claimed ? ['daily-feast'] : [], lastCompletionDay: null, streak: 0,
    completedDays: 0, weeklyRewards: 0, lastWeeklyDay: null };
}

function freshBank(balance = 0) {
  return { balance, tier: 'seedling', lastInterestDay: null, interestClaims: 0, interestEarned: 0 };
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
function validateLegacyState(state) {
  record(state, LEGACY_STATE_KEYS, 'Save');
  if (state.version !== 1) fail('Unsupported save version. Petrealm currently supports version 1.');
  timestamp(state.lastUpdated, 'Saved time');
  integer(state.wallet, 0, MAX_COUNTER, 'Pebble balance');
  record(state.inventory, LEGACY_ITEMS, 'Inventory');
  for (const id of LEGACY_ITEMS) integer(state.inventory[id], 0, 999, `${ITEMS[id].name} quantity`);
  record(state.counts, LEGACY_COUNT_KEYS, 'Activity counts');
  for (const key of LEGACY_COUNT_KEYS) integer(state.counts[key], 0, MAX_COUNTER, `${key} count`);
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

export const XP_PER_LEVEL = 100;
export const MAX_XP = 1999;

export function levelForXp(xp) {
  integer(xp, 0, MAX_XP, 'Experience');
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function readActivePet(state) {
  if (state.version === 1) return state.pet;
  return state.pets.find((pet) => pet.id === state.activePetId) ?? null;
}

export function petCapacity(state) {
  return 7 + (state.membership?.tier === 'explorer' ? 7 : 0) + (state.expansions ?? 0);
}

function permanentProgress(state, id) {
  if (id === 'growing-family') return state.counts.adoptions;
  if (id === 'arena-debut') return state.counts.battleWins;
  if (id === 'game-explorer') return state.counts.games;
  return id === 'daily-feast' ? state.quests.daily.feeds : state.questLog.progress[DAILY_PROGRESS[id]];
}

function validateV2State(state) {
  record(state, STATE_KEYS, 'Save', ['questLog']);
  timestamp(state.lastUpdated, 'Saved time');
  integer(state.wallet, 0, MAX_COUNTER, 'Pebble balance');
  const bankFields = ['tier', 'lastInterestDay', 'interestClaims', 'interestEarned'];
  record(state.bank, ['balance'], 'Bank', bankFields);
  integer(state.bank.balance, 0, MAX_COUNTER, 'Bank balance');
  if (state.wallet + state.bank.balance > MAX_COUNTER) fail('Combined wallet and bank balance is too large.');
  if (bankFields.some((key) => Object.hasOwn(state.bank, key))) {
    record(state.bank, ['balance', ...bankFields], 'Bank');
    if (typeof state.bank.tier !== 'string' || !Object.hasOwn(BANK_TIERS, state.bank.tier)) fail('Choose an available bank tier.');
    checkDay(state.bank.lastInterestDay, 'Interest date');
    integer(state.bank.interestClaims, 0, MAX_COUNTER, 'Interest claims');
    integer(state.bank.interestEarned, 0, MAX_COUNTER, 'Interest earned');
    if ((state.bank.lastInterestDay === null) !== (state.bank.interestClaims === 0)
        || state.bank.interestEarned < state.bank.interestClaims
        || (state.bank.interestClaims === 0 && state.bank.interestEarned !== 0)) fail('Bank interest history is inconsistent.');
    if (state.bank.lastInterestDay && state.bank.lastInterestDay > dayFor(state.lastUpdated)) fail('Interest date cannot be after the saved time.');
  }
  record(state.inventory, Object.keys(ITEMS), 'Inventory');
  for (const id of Object.keys(ITEMS)) integer(state.inventory[id], 0, 999, `${ITEMS[id].name} quantity`);
  record(state.counts, COUNT_KEYS, 'Activity counts');
  for (const key of COUNT_KEYS) integer(state.counts[key], 0, MAX_COUNTER, `${key} count`);
  record(state.membership, ['tier', 'lastParcelDay'], 'Membership');
  if (!['free', 'explorer'].includes(state.membership.tier)) fail('Choose free or explorer membership.');
  checkDay(state.membership.lastParcelDay, 'Lodge parcel date');
  if ((state.membership.lastParcelDay === null) !== (state.counts.lodgeParcels === 0)) fail('Lodge parcel history is inconsistent.');
  if (state.membership.lastParcelDay && state.membership.lastParcelDay > dayFor(state.lastUpdated)) fail('Lodge parcel date cannot be after the saved time.');
  integer(state.expansions, 0, 12, 'Lodge expansions');
  if (state.expansions !== state.counts.expansionsUsed) fail('Lodge expansion count is inconsistent.');
  if (!Array.isArray(state.pets) || state.pets.length > petCapacity(state)) fail(`This membership supports at most ${petCapacity(state)} companions.`);
  const equipped = { leafcap: 0, moonscarf: 0 };
  for (const [index, pet] of state.pets.entries()) {
    record(pet, ['id', 'name', 'species', 'adoptedAt', 'stats', 'wearing', 'xp', 'level'], 'Pet', ['personality', 'journey']);
    if (pet.id !== `pet-${index + 1}`) fail('Pet IDs must be unique and ordered by adoption.');
    checkName(pet.name);
    if (typeof pet.species !== 'string' || !Object.hasOwn(SPECIES, pet.species)) fail('Unknown pet species.');
    timestamp(pet.adoptedAt, 'Adoption time');
    if (pet.adoptedAt > state.lastUpdated || (index > 0 && pet.adoptedAt < state.pets[index - 1].adoptedAt)) {
      fail('Adoption time cannot be after the saved time or before an earlier companion.');
    }
    record(pet.stats, ['satiety', 'happiness', 'energy'], 'Pet stats');
    for (const [key, value] of Object.entries(pet.stats)) {
      if (!Number.isFinite(value) || value < 0 || value > 100) fail(`${key} must be a finite number from 0 to 100.`);
    }
    integer(pet.xp, 0, MAX_XP, 'Experience');
    if (pet.level !== levelForXp(pet.xp)) fail('Pet level does not match experience.');
    if (Object.hasOwn(pet, 'personality') || Object.hasOwn(pet, 'journey')) {
      if (typeof pet.personality !== 'string' || !Object.hasOwn(PERSONALITIES, pet.personality)) fail('Choose an available companion personality.');
      record(pet.journey, JOURNEY_KEYS, 'Companion journey');
      for (const key of JOURNEY_KEYS) integer(pet.journey[key], 0, key === 'growth' ? 1 : MAX_COUNTER, `Companion ${key}`);
      if (pet.journey.growth && (pet.level < 3 || ['feeds', 'plays', 'rests'].some((key) => pet.journey[key] < 1))) fail('Companion growth needs level 3 and a meal, play and rest.');
    }
    record(pet.wearing, ['head', 'neck'], 'Pet clothing');
    for (const slot of ['head', 'neck']) {
      const id = pet.wearing[slot];
      if (id !== null && (typeof id !== 'string' || !Object.hasOwn(ITEMS, id) || ITEMS[id].slot !== slot)) fail(`Choose an accessory for the ${slot} slot.`);
      if (id !== null) equipped[id] += 1;
    }
  }
  for (const key of ['feeds', 'plays', 'rests']) {
    if (state.pets.reduce((total, pet) => total + (pet.journey?.[key] ?? 0), 0) > state.counts[key]) fail(`Companion ${key} exceed the recorded activity.`);
  }
  for (const [id, quantity] of Object.entries(equipped)) {
    if (quantity > state.inventory[id]) fail('Equipped accessories exceed the copies in your inventory.');
  }
  if (state.counts.adoptions !== state.pets.length) fail('Adoption count does not match the companions.');
  if (state.pets.length === 0 ? state.activePetId !== null : !state.pets.some((pet) => pet.id === state.activePetId)) {
    fail('Active companion must refer to an adopted pet.');
  }
  if (!state.pets.length && (state.counts.feeds || state.counts.plays || state.counts.rests || state.counts.games
      || state.counts.battleWins || state.counts.accessoriesEquipped || state.counts.questsClaimed)) fail('Pet activity requires an adopted pet.');
  record(state.daily, ['lastClaimDay'], 'Daily reward');
  checkDay(state.daily.lastClaimDay, 'Daily reward date');
  if ((state.daily.lastClaimDay === null) !== (state.counts.dailyClaims === 0)) fail('Daily reward history is inconsistent.');
  record(state.game, ['day', 'earned', 'rounds'], 'Game reward');
  checkDay(state.game.day, 'Game reward date');
  integer(state.game.earned, 0, 120, 'Daily game rewards');
  if (state.game.day === null && state.game.earned !== 0) fail('Game rewards need a UTC date.');
  if ((state.game.day === null) !== (state.counts.games === 0)) fail('Game reward history is inconsistent.');
  record(state.game.rounds, ['firefly', 'memory'], 'Game rounds');
  for (const id of ['firefly', 'memory']) integer(state.game.rounds[id], 0, MAX_COUNTER, `${id} rounds`);
  if (state.game.rounds.firefly + state.game.rounds.memory !== state.counts.games) fail('Game round counts are inconsistent.');
  const savedDay = dayFor(state.lastUpdated);
  if ((state.daily.lastClaimDay && state.daily.lastClaimDay > savedDay) || (state.game.day && state.game.day > savedDay)) {
    fail('Reward dates cannot be after the saved time.');
  }
  if (!Array.isArray(state.achievements) || new Set(state.achievements).size !== state.achievements.length) fail('Achievements must be a list without duplicates.');
  const expected = earnedAchievements(state.counts);
  if (state.achievements.length !== expected.length || state.achievements.some((id) => !expected.includes(id))) fail('Achievements do not match the activity counts.');
  record(state.quests, ['daily', 'claimed'], 'Quests');
  record(state.quests.daily, ['day', 'feeds', 'claimed'], 'Daily quest');
  checkDay(state.quests.daily.day, 'Daily quest date');
  if (state.quests.daily.day !== savedDay) fail('Daily quest date must match the saved UTC day.');
  integer(state.quests.daily.feeds, 0, MAX_COUNTER, 'Daily feeds');
  if (state.quests.daily.feeds > state.counts.feeds) fail('Daily feeds exceed the total feed count.');
  if (typeof state.quests.daily.claimed !== 'boolean' || (state.quests.daily.claimed && state.quests.daily.feeds < 3)) fail('Daily quest claim does not match its progress.');
  if (!Array.isArray(state.quests.claimed) || state.quests.claimed.length > 3 || new Set(state.quests.claimed).size !== state.quests.claimed.length) fail('Quest claims must be a list without duplicates.');
  for (const id of state.quests.claimed) {
    if (typeof id !== 'string' || !Object.hasOwn(QUESTS, id) || QUESTS[id].type !== 'permanent' || permanentProgress(state, id) < QUESTS[id].target) fail('Quest claim does not match a completed quest.');
  }
  if (state.counts.questsClaimed < state.quests.claimed.length + Number(state.quests.daily.claimed)) fail('Quest claim count is inconsistent.');
  if (Object.hasOwn(state, 'questLog')) {
    const log = state.questLog;
    record(log, ['day', 'progress', 'claimed', 'lastCompletionDay', 'streak', 'completedDays', 'weeklyRewards', 'lastWeeklyDay'], 'Quest log');
    checkDay(log.day, 'Quest log date');
    if (log.day !== savedDay) fail('Quest log date must match the saved UTC day.');
    record(log.progress, ['plays', 'purchases', 'games', 'rests', 'parcels'], 'Quest progress');
    for (const [key, value] of Object.entries(log.progress)) {
      integer(value, 0, MAX_COUNTER, `Daily ${key}`);
      if (value > state.counts[key === 'parcels' ? 'lodgeParcels' : key]) fail(`Daily ${key} exceed the lifetime count.`);
    }
    if (!Array.isArray(log.claimed) || log.claimed.length > 6 || new Set(log.claimed).size !== log.claimed.length) fail('Daily quest claims must be a list without duplicates.');
    for (const id of log.claimed) {
      if (typeof id !== 'string' || !DAILY_QUEST_IDS.includes(id) || permanentProgress(state, id) < QUESTS[id].target) fail('Daily quest claim does not match its completed objective.');
    }
    if (log.claimed.includes('daily-feast') !== state.quests.daily.claimed) fail('Daily feast claim history is inconsistent.');
    if (state.counts.questsClaimed < state.quests.claimed.length + log.claimed.length) fail('Quest claim count is inconsistent.');
    checkDay(log.lastCompletionDay, 'Quest completion date');
    checkDay(log.lastWeeklyDay, 'Weekly quest date');
    integer(log.streak, 0, 7, 'Quest streak');
    integer(log.completedDays, 0, MAX_COUNTER, 'Completed quest days');
    integer(log.weeklyRewards, 0, MAX_COUNTER, 'Weekly quest rewards');
    if ((log.lastCompletionDay === null) !== (log.completedDays === 0)
        || (log.lastWeeklyDay === null) !== (log.weeklyRewards === 0)
        || log.weeklyRewards > Math.floor(log.completedDays / 7)
        || log.completedDays * 5 > state.counts.questsClaimed) fail('Quest completion history is inconsistent.');
    if ((log.lastCompletionDay && log.lastCompletionDay > savedDay)
        || (log.lastWeeklyDay && (!log.lastCompletionDay || log.lastWeeklyDay > log.lastCompletionDay))) fail('Quest reward dates cannot be after the saved history.');
    if (log.streak > 0 && (!log.lastCompletionDay || log.lastCompletionDay < previousDay(savedDay)
        || log.streak > log.completedDays)) fail('Quest streak does not match its completion history.');
    if (log.lastCompletionDay === savedDay && (log.claimed.length < 5 || log.streak === 0)) fail('Today’s quest completion needs five claimed objectives.');
    if (log.streak === 7 && log.lastWeeklyDay !== log.lastCompletionDay) fail('A seventh quest day needs its weekly reward history.');
  }
  record(state.battleWins, Object.keys(OPPONENTS), 'Arena victories');
  for (const won of Object.values(state.battleWins)) if (typeof won !== 'boolean') fail('Arena victory markers must be true or false.');
  if ((state.battleWins.stonebeak && !state.battleWins.ashgrub) || (state.battleWins.frostwisp && !state.battleWins.stonebeak)) fail('Arena victories must follow opponent progression.');
  const firstWins = Object.values(state.battleWins).filter(Boolean).length;
  if (firstWins > state.counts.battleWins || ((firstWins === 0) !== (state.counts.battleWins === 0))) fail('Arena victory count is inconsistent.');
  if (state.battle !== null) {
    const battle = state.battle;
    record(battle, ['opponentId', 'petId', 'status', 'turn', 'petLevel', 'petHp', 'petMaxHp', 'opponentHp', 'opponentMaxHp', 'power', 'defence', 'log'], 'Battle');
    if (typeof battle.opponentId !== 'string' || !Object.hasOwn(OPPONENTS, battle.opponentId)) fail('Unknown arena opponent.');
    const opponent = OPPONENTS[battle.opponentId];
    const pet = state.pets.find((entry) => entry.id === battle.petId);
    if (!pet) fail('Battle companion is missing.');
    integer(battle.petLevel, opponent.level, pet.level, 'Battle level');
    const previous = Object.keys(OPPONENTS)[Object.keys(OPPONENTS).indexOf(opponent.id) - 1];
    if (previous && !state.battleWins[previous]) fail('Battle opponent has not been unlocked.');
    if (battle.petMaxHp !== 36 + battle.petLevel * 4 || battle.opponentMaxHp !== opponent.hp) fail('Battle maximum HP does not match its participants.');
    integer(battle.petHp, 0, battle.petMaxHp, 'Companion HP');
    integer(battle.opponentHp, 0, opponent.hp, 'Opponent HP');
    integer(battle.turn, 0, 40, 'Battle turn');
    if (![8 + battle.petLevel * 2, 10 + battle.petLevel * 2].includes(battle.power) || ![0, 2].includes(battle.defence)) fail('Battle equipment bonuses are invalid.');
    if (opponent.hp - battle.opponentHp > battle.turn * battle.power) fail('Opponent HP is inconsistent with the number of turns.');
    if (!['active', 'won', 'lost'].includes(battle.status)) fail('Unknown battle status.');
    if (battle.status === 'active' && (battle.petHp === 0 || battle.opponentHp === 0 || battle.turn >= 40 || state.activePetId !== battle.petId)) fail('Active battle has inconsistent health, turn or companion.');
    if (battle.status === 'won' && (battle.opponentHp !== 0 || battle.petHp === 0 || battle.turn === 0 || !state.battleWins[opponent.id])) fail('Won battle does not match health and victory history.');
    if (battle.status === 'lost' && (battle.opponentHp === 0 || battle.turn === 0 || (battle.petHp !== 0 && battle.turn !== 40))) fail('Lost battle does not match health and turn.');
    if (battle.turn === 0 && (battle.petHp !== battle.petMaxHp || battle.opponentHp !== opponent.hp)) fail('A new battle must begin at full HP.');
    if (!Array.isArray(battle.log) || battle.log.length < 1 || battle.log.length > 8 || battle.log.some((line) => typeof line !== 'string' || line.length > 160 || /[\u0000-\u001f\u007f-\u009f]/u.test(line))) fail('Battle log is invalid.');
  }
  return true;
}

export function validateState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) fail('Save must be an object.');
  if (state.version === 1) return validateLegacyState(state);
  if (state.version === 2) return validateV2State(state);
  fail('Unsupported save version. Petrealm supports versions 1 and 2.');
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
  const pet = readActivePet(state);
  if (!pet) fail('Adopt a companion before taking this action.');
  return pet;
}

function requireItem(id) {
  if (typeof id !== 'string' || !Object.hasOwn(ITEMS, id)) fail('Choose an item from the shop.');
}

function changeStats(pet, changes) {
  for (const [key, amount] of Object.entries(changes)) {
    pet.stats[key] = Math.max(0, Math.min(100, pet.stats[key] + amount));
  }
}

function gainXp(pet, amount) {
  pet.xp = Math.min(MAX_XP, pet.xp + amount);
  pet.level = levelForXp(pet.xp);
}

function requireNoBattle(state) {
  if (state.battle?.status === 'active') fail('Finish the current arena battle before taking this action.');
}

/** Construct a new save. Callers may inject a timestamp for repeatable tests. */
export function createState(now = Date.now()) {
  timestamp(now);
  return {
    version: 2,
    pets: [],
    activePetId: null,
    wallet: 120,
    bank: freshBank(),
    inventory: { berry: 3, acorn: 2, ribbon: 1, leafcap: 0, moonscarf: 0, potion: 0, 'lodge-deed': 0 },
    lastUpdated: now,
    daily: { lastClaimDay: null },
    game: { day: null, earned: 0, rounds: { firefly: 0, memory: 0 } },
    counts: Object.fromEntries(COUNT_KEYS.map((id) => [id, 0])),
    achievements: [],
    quests: { daily: { day: dayFor(now), feeds: 0, claimed: false }, claimed: [] },
    questLog: freshQuestLog({ day: dayFor(now), claimed: false }),
    battle: null,
    battleWins: { ashgrub: false, stonebeak: false, frostwisp: false },
    membership: { tier: 'free', lastParcelDay: null },
    expansions: 0,
  };
}

/** Validate and migrate v1 without changing its economy, clock or companion stats. */
export function migrateState(state) {
  validateState(state);
  if (state.version === 2) {
    const next = clone(state);
    if (!Object.hasOwn(next.bank, 'tier')) next.bank = freshBank(next.bank.balance);
    if (!Object.hasOwn(next, 'questLog')) next.questLog = freshQuestLog(next.quests.daily);
    for (const pet of next.pets) {
      if (!Object.hasOwn(pet, 'personality')) { pet.personality = 'steady'; pet.journey = freshJourney(); }
    }
    validateState(next);
    return next;
  }
  const next = createState(state.lastUpdated);
  next.wallet = state.wallet;
  next.inventory = { ...next.inventory, ...state.inventory };
  next.counts = { ...next.counts, ...state.counts };
  next.achievements = [...state.achievements];
  next.daily = clone(state.daily);
  next.game = { ...clone(state.game), rounds: { firefly: state.counts.games, memory: 0 } };
  if (state.pet) {
    next.pets = [{ ...clone(state.pet), id: 'pet-1', wearing: { head: null, neck: null }, xp: 0, level: 1, personality: 'steady', journey: freshJourney() }];
    next.activePetId = 'pet-1';
  }
  validateState(next);
  return next;
}

/** Apply at most 72 hours of decay; never move the save clock backwards. */
export function advanceTime(state, now = Date.now()) {
  timestamp(now);
  const next = migrateState(state);
  const effectiveTime = Math.max(now, next.lastUpdated);
  const elapsedHours = Math.min(72, (effectiveTime - next.lastUpdated) / HOUR);
  for (const pet of next.pets) changeStats(pet, { satiety: -3 * elapsedHours, happiness: -2 * elapsedHours, energy: -elapsedHours });
  next.lastUpdated = effectiveTime;
  if (next.quests.daily.day !== dayFor(effectiveTime)) next.quests.daily = { day: dayFor(effectiveTime), feeds: 0, claimed: false };
  if (next.questLog.day !== dayFor(effectiveTime)) {
    const old = next.questLog;
    next.questLog = { ...freshQuestLog(next.quests.daily), lastCompletionDay: old.lastCompletionDay,
      streak: old.lastCompletionDay === previousDay(dayFor(effectiveTime)) && old.streak < 7 ? old.streak : 0,
      completedDays: old.completedDays, weeklyRewards: old.weeklyRewards, lastWeeklyDay: old.lastWeeklyDay };
  }
  return next;
}

export function adopt(state, name, species, now = Date.now(), personality = undefined) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  if (next.pets.length >= petCapacity(next)) fail(`Your lodge is full at ${petCapacity(next)} companions. Try explorer membership or a lodge expansion.`);
  if (typeof name !== 'string') fail('Give your companion a name.');
  const cleanName = name.trim().normalize('NFC');
  checkName(cleanName);
  if (typeof species !== 'string' || !Object.hasOwn(SPECIES, species)) fail('Choose an available companion species.');
  const nature = personality === undefined ? SPECIES[species].personality : personality;
  if (typeof nature !== 'string' || !Object.hasOwn(PERSONALITIES, nature)) fail('Choose an available companion personality.');
  const id = `pet-${next.pets.length + 1}`;
  next.pets.push({ id, name: cleanName, species, adoptedAt: next.lastUpdated, stats: { satiety: 85, happiness: 80, energy: 85 }, wearing: { head: null, neck: null }, xp: 0, level: 1, personality: nature, journey: freshJourney() });
  next.activePetId = id;
  next.counts.adoptions += 1;
  return finish(next);
}

export function selectPet(state, petId, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  if (!next.pets.some((pet) => pet.id === petId)) fail('Choose one of your adopted companions.');
  next.activePetId = petId;
  return finish(next);
}

export function setMembership(state, tier, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  if (!['free', 'explorer'].includes(tier)) fail('Choose free or explorer membership.');
  next.membership.tier = tier;
  if (next.pets.length > petCapacity(next)) fail('This family needs its current lodge capacity. Keep explorer membership or add expansions before downgrading.');
  return finish(next);
}

export function claimLodgeParcel(state, now = Date.now()) {
  const next = advanceTime(state, now);
  if (next.membership.tier !== 'explorer') fail('Join the explorer lodge before collecting a parcel.');
  const day = dayFor(next.lastUpdated);
  if (next.membership.lastParcelDay === day) fail('You have already collected today’s lodge parcel. Return tomorrow (UTC).');
  next.membership.lastParcelDay = day;
  next.wallet += 20;
  next.inventory.berry += 1;
  next.counts.lodgeParcels += 1;
  next.questLog.progress.parcels += 1;
  return finish(next);
}

export function useExpansion(state, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  if (next.expansions >= 12) fail('Your lodge already has its maximum 12 expansions.');
  if (next.inventory['lodge-deed'] < 1) fail('Buy a lodge deed in the shop before adding a slot.');
  next.inventory['lodge-deed'] -= 1;
  next.expansions += 1;
  next.counts.expansionsUsed += 1;
  return finish(next);
}

export function care(state, action, itemId, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  const pet = requirePet(next);
  if (action === 'feed') {
    if (!['berry', 'acorn'].includes(itemId)) fail('Feed your companion a sunberry or honey acorn.');
    if (next.inventory[itemId] < 1) fail(`You have no ${ITEMS[itemId].name.toLowerCase()} left. Visit the shop.`);
    next.inventory[itemId] -= 1;
    changeStats(pet, itemId === 'berry' ? { satiety: 22, happiness: 6 } : { satiety: 12, happiness: 3, energy: 12 });
    if (SPECIES[pet.species].favourite === itemId) changeStats(pet, { happiness: 3 + (pet.personality === 'curious' ? 2 : 0) });
    pet.journey.feeds += 1;
    next.counts.feeds += 1;
    next.quests.daily.feeds += 1;
    gainXp(pet, 4);
  } else if (action === 'play') {
    if (itemId !== 'ribbon') fail('Choose the rainbow ribbon to play.');
    if (next.inventory.ribbon < 1) fail('You need a rainbow ribbon. Visit the shop.');
    if (pet.stats.energy < 12) fail('Your companion needs a rest before playing.');
    changeStats(pet, { happiness: 20, energy: -12, satiety: -4 });
    if (pet.personality === 'spirited') changeStats(pet, { happiness: 3 });
    pet.journey.plays += 1;
    next.counts.plays += 1;
    next.questLog.progress.plays += 1;
    gainXp(pet, 6);
  } else if (action === 'rest') {
    if (itemId !== undefined && itemId !== null) fail('Rest does not use an item.');
    changeStats(pet, { energy: 30, satiety: -5, happiness: 3 });
    if (pet.personality === 'gentle') changeStats(pet, { happiness: 3 });
    pet.journey.rests += 1;
    next.counts.rests += 1;
    next.questLog.progress.rests += 1;
    gainXp(pet, 2);
  } else fail('Unknown care action. Choose feed, play or rest.');
  return finish(next);
}

/** Paid practice uses the same earned wallet and bounded experience as care. */
export function trainPet(state, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  const pet = requirePet(next);
  if (pet.xp >= MAX_XP) fail('Your companion has reached level 20. Enjoy the arena and your garden together.');
  if (next.wallet < TRAINING_COST) fail(`Practice costs ${TRAINING_COST} pebbles. Earn some through games, quests or daily gifts.`);
  if (pet.stats.energy < 12) fail('Your companion needs 12 energy for practice. Give them a nap first.');
  next.wallet -= TRAINING_COST;
  changeStats(pet, { energy: -12, satiety: -4 });
  pet.journey.trainings += 1;
  gainXp(pet, pet.journey.growth ? 24 : 18);
  return finish(next);
}

export function growthProgress(state) {
  const pet = readActivePet(state);
  const journey = pet?.journey ?? freshJourney();
  const grown = journey.growth === 1;
  const cared = ['feeds', 'plays', 'rests'].every((key) => journey[key] > 0);
  return { grown, cared, ready: Boolean(pet && !grown && pet.level >= 3 && cared && state.wallet >= GROWTH_COST && state.battle?.status !== 'active'), cost: GROWTH_COST };
}

/** A permanent, explicit milestone. No repeat currency or experience grant. */
export function growPet(state, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  const pet = requirePet(next);
  if (pet.journey.growth) fail('Your companion has already marked their first bloom.');
  if (pet.level < 3) fail('Reach level 3 before marking your companion’s first bloom.');
  if (['feeds', 'plays', 'rests'].some((key) => pet.journey[key] < 1)) fail('Share a meal, ribbon play and a nap with this companion before their first bloom.');
  if (next.wallet < GROWTH_COST) fail(`A first bloom costs ${GROWTH_COST} pebbles. Earn some through games, quests or daily gifts.`);
  next.wallet -= GROWTH_COST;
  pet.journey.growth = 1;
  gainXp(pet, 40);
  changeStats(pet, { happiness: 10, energy: 10 });
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
  next.questLog.progress.purchases += 1;
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
export function claimGameReward(state, score, now = Date.now(), type = 'firefly') {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  const pet = requirePet(next);
  integer(score, 0, 100, 'Game score');
  if (!['firefly', 'memory'].includes(type)) fail('Choose the firefly or memory mini-game.');
  const day = dayFor(next.lastUpdated);
  if (next.game.day !== day) { next.game.day = day; next.game.earned = 0; }
  const reward = Math.min(40, Math.floor(score * 0.4), 120 - next.game.earned);
  next.game.earned += reward;
  next.wallet += reward;
  next.counts.games += 1;
  next.questLog.progress.games += 1;
  next.game.rounds[type] += 1;
  changeStats(pet, { happiness: 3 });
  gainXp(pet, 5);
  return finish(next);
}

export function deposit(state, amount, now = Date.now()) {
  const next = advanceTime(state, now);
  integer(amount, 1, MAX_COUNTER, 'Deposit');
  if (amount > next.wallet) fail('You do not have enough pebbles in your wallet.');
  next.wallet -= amount;
  next.bank.balance += amount;
  next.counts.bankDeposits += 1;
  return finish(next);
}

export function withdraw(state, amount, now = Date.now()) {
  const next = advanceTime(state, now);
  integer(amount, 1, MAX_COUNTER, 'Withdrawal');
  if (amount > next.bank.balance) fail('You do not have enough pebbles in your bank.');
  next.bank.balance -= amount;
  next.wallet += amount;
  next.counts.bankWithdrawals += 1;
  return finish(next);
}

export function bankInterest(state, now = Date.now()) {
  const next = advanceTime(state, now);
  const tier = BANK_TIERS[next.bank.tier];
  const amount = Math.ceil(next.bank.balance * tier.basisPoints / 3_650_000);
  const day = dayFor(next.lastUpdated);
  const claimed = next.bank.lastInterestDay === day;
  return { day, tier, amount, claimed, ready: amount > 0 && !claimed
    && next.wallet + next.bank.balance + amount <= MAX_COUNTER };
}

export function upgradeBankTier(state, tierId, now = Date.now()) {
  const next = advanceTime(state, now);
  const ids = Object.keys(BANK_TIERS);
  if (typeof tierId !== 'string' || !Object.hasOwn(BANK_TIERS, tierId)) fail('Choose an available bank tier.');
  if (ids.indexOf(tierId) <= ids.indexOf(next.bank.tier)) fail('Choose a higher savings tier.');
  if (next.bank.balance < BANK_TIERS[tierId].minimum) fail(`Save ${BANK_TIERS[tierId].minimum} pebbles in the bank to unlock this tier.`);
  next.bank.tier = tierId;
  return finish(next);
}

export function claimBankInterest(state, now = Date.now()) {
  const next = advanceTime(state, now);
  const offer = bankInterest(next, next.lastUpdated);
  if (offer.claimed) fail('You have already collected today’s interest. Return tomorrow (UTC).');
  if (offer.amount === 0) fail('Deposit at least one pebble before collecting interest.');
  if (!offer.ready) fail('Collecting interest would exceed the combined wallet and bank limit. Spend some pebbles first.');
  next.bank.balance += offer.amount;
  next.bank.lastInterestDay = offer.day;
  next.bank.interestClaims += 1;
  next.bank.interestEarned += offer.amount;
  return finish(next);
}

export function equipAccessory(state, itemId, slot, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  const pet = requirePet(next);
  if (!['head', 'neck'].includes(slot)) fail('Choose the head or neck clothing slot.');
  if (itemId !== null) {
    requireItem(itemId);
    if (ITEMS[itemId].slot !== slot) fail(`Choose an accessory for the ${slot} slot.`);
    const inUse = next.pets.filter((entry) => entry.id !== pet.id && entry.wearing[slot] === itemId).length;
    if (next.inventory[itemId] <= inUse) fail('Buy another copy before dressing this companion.');
  }
  if (pet.wearing[slot] === itemId) return next;
  pet.wearing[slot] = itemId;
  if (itemId !== null) next.counts.accessoriesEquipped += 1;
  return finish(next);
}

export function questProgress(state, questId, now = Date.now()) {
  const next = advanceTime(state, now);
  if (typeof questId !== 'string' || !Object.hasOwn(QUESTS, questId)) fail('Choose an available quest.');
  const quest = QUESTS[questId];
  const progress = permanentProgress(next, questId);
  const claimed = quest.type === 'daily' ? next.questLog.claimed.includes(questId) : next.quests.claimed.includes(questId);
  const available = !quest.explorer || next.membership.tier === 'explorer';
  return { id: questId, progress, target: quest.target, ready: available && progress >= quest.target && !claimed, claimed, reward: quest.reward, xp: quest.xp };
}

export function dailyQuestIds(state) {
  return DAILY_QUEST_IDS.filter((id) => !QUESTS[id].explorer || state.membership.tier === 'explorer');
}

export function questDayProgress(state, now = Date.now()) {
  const next = advanceTime(state, now);
  const log = next.questLog;
  const day = dayFor(next.lastUpdated);
  const claimed = log.lastCompletionDay === day;
  const nextStreak = log.lastCompletionDay === previousDay(day) && log.streak > 0 && log.streak < 7 ? log.streak + 1 : 1;
  const weeklyReward = nextStreak === 7 ? QUEST_WEEK_REWARD : 0;
  return { day, claimedQuests: log.claimed.length, required: 5, claimed, streak: log.streak,
    nextStreak, reward: QUEST_DAY_REWARD, weeklyReward, completedDays: log.completedDays,
    weeklyRewards: log.weeklyRewards, ready: !claimed && log.claimed.length >= 5
      && next.wallet + next.bank.balance + QUEST_DAY_REWARD + weeklyReward <= MAX_COUNTER };
}

export function claimQuestDay(state, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  requirePet(next);
  const offer = questDayProgress(next, next.lastUpdated);
  if (offer.claimed) fail('You have already collected today’s quest completion gift. Return tomorrow (UTC).');
  if (offer.claimedQuests < 5) fail('Claim five distinct daily quest rewards before completing the day.');
  if (!offer.ready) fail('The quest completion gift would exceed the combined wallet and bank limit. Spend some pebbles first.');
  next.wallet += offer.reward + offer.weeklyReward;
  next.questLog.lastCompletionDay = offer.day;
  next.questLog.streak = offer.nextStreak;
  next.questLog.completedDays += 1;
  if (offer.weeklyReward) {
    next.questLog.lastWeeklyDay = offer.day;
    next.questLog.weeklyRewards += 1;
  }
  return finish(next);
}

export function claimQuest(state, questId, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  const pet = requirePet(next);
  if (QUESTS[questId]?.explorer && next.membership.tier !== 'explorer') fail('Join the Explorer Lodge to claim this extra daily quest.');
  const progress = questProgress(next, questId, next.lastUpdated);
  if (progress.claimed) fail('You have already claimed this quest reward.');
  if (!progress.ready) fail('Complete the quest objective before claiming its reward.');
  if (QUESTS[questId].type === 'daily') {
    next.questLog.claimed.push(questId);
    if (questId === 'daily-feast') next.quests.daily.claimed = true;
  }
  else next.quests.claimed.push(questId);
  next.wallet += progress.reward;
  next.counts.questsClaimed += 1;
  gainXp(pet, progress.xp);
  return finish(next);
}

export function startBattle(state, opponentId, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  const pet = requirePet(next);
  if (typeof opponentId !== 'string' || !Object.hasOwn(OPPONENTS, opponentId)) fail('Choose an available arena opponent.');
  const opponent = OPPONENTS[opponentId];
  const previous = Object.keys(OPPONENTS)[Object.keys(OPPONENTS).indexOf(opponentId) - 1];
  if (pet.level < opponent.level || (previous && !next.battleWins[previous])) fail(`Reach level ${opponent.level} and defeat earlier opponents to unlock ${opponent.name}.`);
  if (pet.stats.energy < 10) fail('Your companion needs at least 10 energy to enter the arena.');
  changeStats(pet, { energy: -10 });
  const hp = 36 + pet.level * 4;
  next.battle = { opponentId, petId: pet.id, status: 'active', turn: 0, petLevel: pet.level, petHp: hp, petMaxHp: hp, opponentHp: opponent.hp, opponentMaxHp: opponent.hp, power: 8 + pet.level * 2 + (pet.wearing.head === 'leafcap' ? 2 : 0), defence: pet.wearing.neck === 'moonscarf' ? 2 : 0, log: [`${pet.name} faces ${opponent.name}.`] };
  return finish(next);
}

export function battleAction(state, action, now = Date.now()) {
  const next = advanceTime(state, now);
  const battle = next.battle;
  if (!battle || battle.status !== 'active') fail('Start an arena battle before taking a turn.');
  if (!['attack', 'guard', 'potion'].includes(action)) fail('Choose attack, guard or potion.');
  const pet = requirePet(next);
  const opponent = OPPONENTS[battle.opponentId];
  let damage = 0;
  if (action === 'potion') {
    if (next.inventory.potion < 1) fail('You have no dew potion. Buy one in the shop.');
    next.inventory.potion -= 1;
    const healed = Math.min(22, battle.petMaxHp - battle.petHp);
    battle.petHp += healed;
    battle.log.push(`Dew potion restores ${healed} HP.`);
  } else {
    damage = action === 'guard' ? 2 + Math.floor(battle.petLevel / 2) : battle.power;
    battle.opponentHp = Math.max(0, battle.opponentHp - damage);
    battle.log.push(`${action === 'guard' ? 'Guarding strike' : 'Attack'} deals ${damage} damage.`);
  }
  battle.turn += 1;
  if (battle.opponentHp === 0) {
    battle.status = 'won';
    const firstWin = !next.battleWins[opponent.id];
    next.battleWins[opponent.id] = true;
    next.counts.battleWins += 1;
    next.wallet += firstWin ? opponent.reward : 0;
    gainXp(pet, firstWin ? opponent.xp : 5);
    changeStats(pet, { happiness: 8 });
    battle.log.push(firstWin ? `Victory! ${opponent.reward} pebbles and ${opponent.xp} XP.` : 'Victory! 5 XP. First-victory pebbles were already collected.');
  } else {
    const raw = opponent.attack + ((battle.turn - 1) % 3);
    const incoming = Math.max(1, (action === 'guard' ? Math.ceil(raw / 2) : raw) - battle.defence);
    battle.petHp = Math.max(0, battle.petHp - incoming);
    battle.log.push(`${opponent.name} deals ${incoming} damage.`);
    if (battle.petHp === 0 || battle.turn >= 40) {
      battle.status = 'lost';
      changeStats(pet, { happiness: -5 });
      battle.log.push(battle.turn >= 40 && battle.petHp > 0 ? 'The arena closes after 40 turns. Rest and try again.' : 'Defeat. Rest and try again.');
    }
  }
  battle.log = battle.log.slice(-8);
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
  return migrateState(state);
}

export function serialiseSave(state) {
  const next = migrateState(state);
  const text = `${JSON.stringify(next, null, 2)}\n`;
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) fail('Save is too large to export.');
  return text;
}
