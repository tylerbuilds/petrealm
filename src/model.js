/** Original, local-only pet game rules. No network, browser or clock dependencies. */
import { TRAIL_ROUTES, TRAIL_TREASURES, PERSONALITY_APPROACHES, getTrailScene, findForApproach, knackChoice } from './trails.js';
import { EXPEDITION_ROUTES, EXPEDITION_INTENTS, FIRST_EXPEDITION_MS, MEMORY_LIMIT, freshCompanion, freshCompanionship, learnFrom, expeditionTreasure, validateCompanionship } from './companionship.js';

export { TRAIL_ROUTES, TRAIL_TREASURES } from './trails.js';
export { EXPEDITION_ROUTES, EXPEDITION_INTENTS, getExpeditionStatus, readCompanionStory, readReturnWelcome } from './companionship.js';

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
  steady: Object.freeze({ id: 'steady', name: 'Steady', description: 'A calm friend who likes a familiar routine.' }),
  gentle: Object.freeze({ id: 'gentle', name: 'Gentle', description: 'A cosy nap adds 3 extra happiness.' }),
  curious: Object.freeze({ id: 'curious', name: 'Curious', description: 'A favourite snack adds 2 extra happiness.' }),
  spirited: Object.freeze({ id: 'spirited', name: 'Spirited', description: 'Playing with the ribbon adds 3 extra happiness.' }),
});
export const TRAINING_COST = 20;
export const GROWTH_COST = 60;
const JOURNEY_KEYS = ['feeds', 'plays', 'rests', 'trainings', 'growth'];
const freshJourney = () => ({ feeds: 0, plays: 0, rests: 0, trainings: 0, growth: 0 });
const freshPetTrail = () => ({ trips: 0, bond: 0 });
const freshTrails = () => ({ sequence: 0, collection: [], display: [null, null, null], active: null, last: null });

export const ITEMS = Object.freeze({
  berry: Object.freeze({ id: 'berry', name: 'Sunberry', price: 12, description: 'A sweet snack that adds 22 fullness and 6 happiness.' }),
  acorn: Object.freeze({ id: 'acorn', name: 'Honey acorn', price: 8, description: 'A hearty snack that adds 12 fullness, 12 energy and 3 happiness.' }),
  ribbon: Object.freeze({ id: 'ribbon', name: 'Rainbow ribbon', price: 35, description: 'A ribbon you can use again. Playing adds 20 happiness and uses 12 energy.' }),
  leafcap: Object.freeze({ id: 'leafcap', name: 'Leaf cap', price: 45, slot: 'head', description: 'A woodland cap that adds 2 to your arena attack.' }),
  moonscarf: Object.freeze({ id: 'moonscarf', name: 'Moon scarf', price: 55, slot: 'neck', description: 'A soft scarf that blocks 2 damage on each arena turn.' }),
  potion: Object.freeze({ id: 'potion', name: 'Dew potion', price: 18, description: 'Restore up to 22 HP on your arena turn.' }),
  'lodge-deed': Object.freeze({ id: 'lodge-deed', name: 'Lodge deed', price: 250, description: 'Make room for one more companion. You can use up to 12 deeds.' }),
});

export const QUESTS = Object.freeze({
  'daily-feast': Object.freeze({ id: 'daily-feast', name: 'Three square meals', description: 'Give your companions three meals today. The day resets at midnight UTC.', target: 3, reward: 25, xp: 10, type: 'daily' }),
  'daily-play': Object.freeze({ id: 'daily-play', name: 'A ribbon and a wiggle', description: 'Play with a companion today.', target: 1, reward: 10, xp: 5, type: 'daily' }),
  'daily-market': Object.freeze({ id: 'daily-market', name: 'Something for the satchel', description: 'Buy something at Market lane today.', target: 1, reward: 10, xp: 5, type: 'daily' }),
  'daily-game': Object.freeze({ id: 'daily-game', name: 'A little spark of play', description: 'Finish either mini-game today. Any score counts.', target: 1, reward: 15, xp: 5, type: 'daily' }),
  'daily-rest': Object.freeze({ id: 'daily-rest', name: 'A moment under the leaves', description: 'Give a companion a cosy nap today.', target: 1, reward: 10, xp: 5, type: 'daily' }),
  'daily-parcel': Object.freeze({ id: 'daily-parcel', name: 'A note from the Lodge', description: 'Collect today’s Explorer Lodge parcel.', target: 1, reward: 10, xp: 5, type: 'daily', explorer: true }),
  'growing-family': Object.freeze({ id: 'growing-family', name: 'A growing family', description: 'Adopt two companions.', target: 2, reward: 30, xp: 10, type: 'permanent' }),
  'arena-debut': Object.freeze({ id: 'arena-debut', name: 'Arena debut', description: 'Win an arena battle.', target: 1, reward: 40, xp: 10, type: 'permanent' }),
  'game-explorer': Object.freeze({ id: 'game-explorer', name: 'Game explorer', description: 'Finish three mini-game rounds.', target: 3, reward: 30, xp: 10, type: 'permanent' }),
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
    fail(`Petrealm can’t read the ${label} details in this save. Try another save file.`);
  }
  const actual = Object.keys(value);
  if (keys.some((key) => !actual.includes(key)) || actual.some((key) => !keys.includes(key) && !optional.includes(key))) {
    fail(`Petrealm can’t read the ${label} details in this save. Try another save file. Some details are missing or aren’t recognised: ${keys.join(', ')}.`);
  }
  if (Reflect.ownKeys(value).length !== actual.length) fail(`The ${label} details include something Petrealm can’t read. Try another save file.`);
}

function integer(value, minimum, maximum, label) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    fail(`${label} needs a whole number from ${minimum} to ${maximum}.`);
  }
}

function timestamp(value, label = 'Time') {
  integer(value, 0, MAX_TIMESTAMP, label);
}

function dayFor(time) {
  return new Date(time).toISOString().slice(0, 10);
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
    fail(`The ${label} needs a real UTC date, or null if it hasn’t happened yet.`);
  }
}

function checkName(name, newName = false) {
  if (typeof name !== 'string' || name !== name.trim() || [...name].length < 1 || [...name].length > 24
      || /[\u0000-\u001f\u007f-\u009f]/u.test(name)
      || (newName && /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(name))) {
    fail('Pet name needs 1 to 24 characters. Leave out hidden characters and spaces at either end.');
  }
}

function earnedAchievements(counts) {
  return ACHIEVEMENT_RULES.filter(([, earned]) => earned(counts)).map(([id]) => id);
}

/** Validate the complete versioned schema; throws a helpful error, never replaces a save. */
function validateLegacyState(state) {
  record(state, LEGACY_STATE_KEYS, 'Save');
  if (state.version !== 1) fail('Petrealm can’t open this save version. This older format needs version 1.');
  timestamp(state.lastUpdated, 'Saved time');
  integer(state.wallet, 0, MAX_COUNTER, 'Pebble balance');
  record(state.inventory, LEGACY_ITEMS, 'Inventory');
  for (const id of LEGACY_ITEMS) integer(state.inventory[id], 0, 999, `${ITEMS[id].name} quantity`);
  record(state.counts, LEGACY_COUNT_KEYS, 'Activity counts');
  for (const key of LEGACY_COUNT_KEYS) integer(state.counts[key], 0, MAX_COUNTER, `${key} count`);
  if (state.pet !== null) {
    record(state.pet, ['name', 'species', 'adoptedAt', 'stats'], 'Pet');
    checkName(state.pet.name);
    if (typeof state.pet.species !== 'string' || !Object.hasOwn(SPECIES, state.pet.species)) fail('This save names a species Petrealm doesn’t recognise.');
    timestamp(state.pet.adoptedAt, 'Adoption time');
    if (state.pet.adoptedAt > state.lastUpdated) fail('The adoption date is later than the save date. Check the dates in this save.');
    record(state.pet.stats, ['satiety', 'happiness', 'energy'], 'Pet stats');
    for (const [key, value] of Object.entries(state.pet.stats)) {
      if (!Number.isFinite(value) || value < 0 || value > 100) fail(`The ${key} value in this save needs a number from 0 to 100.`);
    }
  }
  if (state.counts.adoptions !== (state.pet ? 1 : 0)) fail('The adoption total in this save doesn’t match your companion.');
  if (!state.pet && (state.counts.feeds || state.counts.plays || state.counts.rests || state.counts.games)) {
    fail('This save records companion activities without an adopted companion.');
  }
  record(state.daily, ['lastClaimDay'], 'Daily reward');
  checkDay(state.daily.lastClaimDay, 'Daily reward date');
  if ((state.daily.lastClaimDay === null) !== (state.counts.dailyClaims === 0)) fail('The daily reward dates and totals in this save don’t match.');
  record(state.game, ['day', 'earned'], 'Game reward');
  checkDay(state.game.day, 'Game reward date');
  integer(state.game.earned, 0, 120, 'Daily game rewards');
  if (state.game.day === null && state.game.earned !== 0) fail('The game rewards in this save need their UTC date.');
  if ((state.game.day === null) !== (state.counts.games === 0)) fail('The game reward dates and totals in this save don’t match.');
  const savedDay = dayFor(state.lastUpdated);
  if ((state.daily.lastClaimDay && state.daily.lastClaimDay > savedDay)
      || (state.game.day && state.game.day > savedDay)) fail('A reward date is later than the save date. Check the dates in this save.');
  if (!Array.isArray(state.achievements) || state.achievements.length > ACHIEVEMENT_RULES.length
      || new Set(state.achievements).size !== state.achievements.length) {
    fail('Keep each achievement only once in this save’s list.');
  }
  const expected = earnedAchievements(state.counts);
  if (state.achievements.length !== expected.length || state.achievements.some((id) => !expected.includes(id))) {
    fail('The achievements in this save don’t match the activities recorded.');
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
  if (state.wallet + state.bank.balance > MAX_COUNTER) fail('Your wallet and bank together can hold up to 1,000,000,000 pebbles.');
  if (bankFields.some((key) => Object.hasOwn(state.bank, key))) {
    record(state.bank, ['balance', ...bankFields], 'Bank');
    if (typeof state.bank.tier !== 'string' || !Object.hasOwn(BANK_TIERS, state.bank.tier)) fail('Choose one of the available savings tiers.');
    checkDay(state.bank.lastInterestDay, 'Interest date');
    integer(state.bank.interestClaims, 0, MAX_COUNTER, 'Interest claims');
    integer(state.bank.interestEarned, 0, MAX_COUNTER, 'Interest earned');
    if ((state.bank.lastInterestDay === null) !== (state.bank.interestClaims === 0)
        || state.bank.interestEarned < state.bank.interestClaims
        || (state.bank.interestClaims === 0 && state.bank.interestEarned !== 0)) fail('The interest dates and totals in this save don’t match.');
    if (state.bank.lastInterestDay && state.bank.lastInterestDay > dayFor(state.lastUpdated)) fail('The interest date is later than the save date. Check the dates in this save.');
  }
  record(state.inventory, Object.keys(ITEMS), 'Inventory');
  for (const id of Object.keys(ITEMS)) integer(state.inventory[id], 0, 999, `${ITEMS[id].name} quantity`);
  record(state.counts, COUNT_KEYS, 'Activity counts');
  for (const key of COUNT_KEYS) integer(state.counts[key], 0, MAX_COUNTER, `${key} count`);
  record(state.membership, ['tier', 'lastParcelDay'], 'Membership');
  if (!['free', 'explorer'].includes(state.membership.tier)) fail('Choose free or explorer membership for your lodge.');
  checkDay(state.membership.lastParcelDay, 'Lodge parcel date');
  if ((state.membership.lastParcelDay === null) !== (state.counts.lodgeParcels === 0)) fail('The parcel dates and totals in this save don’t match.');
  if (state.membership.lastParcelDay && state.membership.lastParcelDay > dayFor(state.lastUpdated)) fail('The parcel date is later than the save date. Check the dates in this save.');
  integer(state.expansions, 0, 12, 'Lodge expansions');
  if (state.expansions !== state.counts.expansionsUsed) fail('The lodge’s extra rooms don’t match the deeds used in this save.');
  if (!Array.isArray(state.pets) || state.pets.length > petCapacity(state)) fail(`Your lodge has room for up to ${petCapacity(state)} companions.`);
  const equipped = { leafcap: 0, moonscarf: 0 };
  for (const [index, pet] of state.pets.entries()) {
    record(pet, ['id', 'name', 'species', 'adoptedAt', 'stats', 'wearing', 'xp', 'level'], 'Pet', ['personality', 'journey']);
    if (pet.id !== `pet-${index + 1}`) fail('The companions in this save need separate numbers in adoption order.');
    checkName(pet.name);
    if (typeof pet.species !== 'string' || !Object.hasOwn(SPECIES, pet.species)) fail('This save names a species Petrealm doesn’t recognise.');
    timestamp(pet.adoptedAt, 'Adoption time');
    if (pet.adoptedAt > state.lastUpdated || (index > 0 && pet.adoptedAt < state.pets[index - 1].adoptedAt)) {
      fail('The adoption dates in this save need to follow adoption order and be no later than the save date.');
    }
    record(pet.stats, ['satiety', 'happiness', 'energy'], 'Pet stats');
    for (const [key, value] of Object.entries(pet.stats)) {
      if (!Number.isFinite(value) || value < 0 || value > 100) fail(`The ${key} value in this save needs a number from 0 to 100.`);
    }
    integer(pet.xp, 0, MAX_XP, 'Experience');
    if (pet.level !== levelForXp(pet.xp)) fail('Your companion’s level doesn’t match their XP in this save.');
    if (Object.hasOwn(pet, 'personality') || Object.hasOwn(pet, 'journey')) {
      if (typeof pet.personality !== 'string' || !Object.hasOwn(PERSONALITIES, pet.personality)) fail('Choose one of the available personalities for your companion.');
      record(pet.journey, JOURNEY_KEYS, 'Companion care history');
      for (const key of JOURNEY_KEYS) integer(pet.journey[key], 0, key === 'growth' ? 1 : MAX_COUNTER, `Companion ${key}`);
      if (pet.journey.growth && (pet.level < 3 || ['feeds', 'plays', 'rests'].some((key) => pet.journey[key] < 1))) fail('A first bloom needs level 3, a meal, ribbon play and a nap with this companion.');
    }
    record(pet.wearing, ['head', 'neck'], 'Pet clothing');
    for (const slot of ['head', 'neck']) {
      const id = pet.wearing[slot];
      if (id !== null && (typeof id !== 'string' || !Object.hasOwn(ITEMS, id) || ITEMS[id].slot !== slot)) fail(`Choose something for your companion’s ${slot}.`);
      if (id !== null) equipped[id] += 1;
    }
  }
  for (const key of ['feeds', 'plays', 'rests']) {
    if (state.pets.reduce((total, pet) => total + (pet.journey?.[key] ?? 0), 0) > state.counts[key]) fail(`The companion ${key} total is higher than the total recorded in this save.`);
  }
  for (const [id, quantity] of Object.entries(equipped)) {
    if (quantity > state.inventory[id]) fail('Your companions are wearing more copies of an accessory than you own.');
  }
  if (state.counts.adoptions !== state.pets.length) fail('The adoption total in this save doesn’t match your companions.');
  if (state.pets.length === 0 ? state.activePetId !== null : !state.pets.some((pet) => pet.id === state.activePetId)) {
    fail('Choose an adopted companion as your current friend in this save.');
  }
  if (!state.pets.length && (state.counts.feeds || state.counts.plays || state.counts.rests || state.counts.games
      || state.counts.battleWins || state.counts.accessoriesEquipped || state.counts.questsClaimed)) fail('This save records companion activities without an adopted companion.');
  record(state.daily, ['lastClaimDay'], 'Daily reward');
  checkDay(state.daily.lastClaimDay, 'Daily reward date');
  if ((state.daily.lastClaimDay === null) !== (state.counts.dailyClaims === 0)) fail('The daily reward dates and totals in this save don’t match.');
  record(state.game, ['day', 'earned', 'rounds'], 'Game reward');
  checkDay(state.game.day, 'Game reward date');
  integer(state.game.earned, 0, 120, 'Daily game rewards');
  if (state.game.day === null && state.game.earned !== 0) fail('The game rewards in this save need their UTC date.');
  if ((state.game.day === null) !== (state.counts.games === 0)) fail('The game reward dates and totals in this save don’t match.');
  record(state.game.rounds, ['firefly', 'memory'], 'Game rounds');
  for (const id of ['firefly', 'memory']) integer(state.game.rounds[id], 0, MAX_COUNTER, `${id} rounds`);
  if (state.game.rounds.firefly + state.game.rounds.memory !== state.counts.games) fail('The mini-game totals in this save don’t match the rounds recorded.');
  const savedDay = dayFor(state.lastUpdated);
  if ((state.daily.lastClaimDay && state.daily.lastClaimDay > savedDay) || (state.game.day && state.game.day > savedDay)) {
    fail('A reward date is later than the save date. Check the dates in this save.');
  }
  if (!Array.isArray(state.achievements) || new Set(state.achievements).size !== state.achievements.length) fail('Keep each achievement only once in this save’s list.');
  const expected = earnedAchievements(state.counts);
  if (state.achievements.length !== expected.length || state.achievements.some((id) => !expected.includes(id))) fail('The achievements in this save don’t match the activities recorded.');
  record(state.quests, ['daily', 'claimed'], 'Quests');
  record(state.quests.daily, ['day', 'feeds', 'claimed'], 'Daily quest');
  checkDay(state.quests.daily.day, 'Daily quest date');
  if (state.quests.daily.day !== savedDay) fail('The daily quests need to share the save’s UTC date.');
  integer(state.quests.daily.feeds, 0, MAX_COUNTER, 'Daily feeds');
  if (state.quests.daily.feeds > state.counts.feeds) fail('Today’s meals in this save are higher than the total meals recorded.');
  if (typeof state.quests.daily.claimed !== 'boolean' || (state.quests.daily.claimed && state.quests.daily.feeds < 3)) fail('The daily quest reward in this save needs a finished quest.');
  if (!Array.isArray(state.quests.claimed) || state.quests.claimed.length > 3 || new Set(state.quests.claimed).size !== state.quests.claimed.length) fail('Keep each quest reward only once in this save’s list.');
  for (const id of state.quests.claimed) {
    if (typeof id !== 'string' || !Object.hasOwn(QUESTS, id) || QUESTS[id].type !== 'permanent' || permanentProgress(state, id) < QUESTS[id].target) fail('A quest reward in this save doesn’t have a matching finished quest.');
  }
  if (state.counts.questsClaimed < state.quests.claimed.length + Number(state.quests.daily.claimed)) fail('The quest reward total in this save doesn’t match the rewards listed.');
  if (Object.hasOwn(state, 'questLog')) {
    const log = state.questLog;
    record(log, ['day', 'progress', 'claimed', 'lastCompletionDay', 'streak', 'completedDays', 'weeklyRewards', 'lastWeeklyDay'], 'Quest journal');
    checkDay(log.day, 'Quest journal date');
    if (log.day !== savedDay) fail('The quest journal needs to share the save’s UTC date.');
    record(log.progress, ['plays', 'purchases', 'games', 'rests', 'parcels'], 'Quest progress');
    for (const [key, value] of Object.entries(log.progress)) {
      integer(value, 0, MAX_COUNTER, `Daily ${key}`);
      if (value > state.counts[key === 'parcels' ? 'lodgeParcels' : key]) fail(`Today’s ${key} in this save are higher than the total recorded.`);
    }
    if (!Array.isArray(log.claimed) || log.claimed.length > 6 || new Set(log.claimed).size !== log.claimed.length) fail('Keep each daily quest reward only once in this save’s list.');
    for (const id of log.claimed) {
      if (typeof id !== 'string' || !DAILY_QUEST_IDS.includes(id) || permanentProgress(state, id) < QUESTS[id].target) fail('A daily quest reward in this save doesn’t have a matching finished task.');
    }
    if (log.claimed.includes('daily-feast') !== state.quests.daily.claimed) fail('The meal quest reward records in this save don’t match.');
    if (state.counts.questsClaimed < state.quests.claimed.length + log.claimed.length) fail('The quest reward total in this save doesn’t match the rewards listed.');
    checkDay(log.lastCompletionDay, 'Quest completion date');
    checkDay(log.lastWeeklyDay, 'Weekly quest date');
    integer(log.streak, 0, 7, 'Quest streak');
    integer(log.completedDays, 0, MAX_COUNTER, 'Completed quest days');
    integer(log.weeklyRewards, 0, MAX_COUNTER, 'Weekly quest rewards');
    if ((log.lastCompletionDay === null) !== (log.completedDays === 0)
        || (log.lastWeeklyDay === null) !== (log.weeklyRewards === 0)
        || log.weeklyRewards > Math.floor(log.completedDays / 7)
        || log.completedDays * 5 > state.counts.questsClaimed) fail('The finished quest days and reward totals in this save don’t match.');
    if ((log.lastCompletionDay && log.lastCompletionDay > savedDay)
        || (log.lastWeeklyDay && (!log.lastCompletionDay || log.lastWeeklyDay > log.lastCompletionDay))) fail('A quest reward date is later than its finished quest day in this save.');
    if (log.streak > 0 && (!log.lastCompletionDay || log.streak > log.completedDays)) fail('The quest day progress in this save doesn’t match the days finished.');
    if (log.lastCompletionDay === savedDay && (log.claimed.length < 5 || log.streak === 0)) fail('Finish five different daily quests and collect their rewards for today’s gift.');
    if (log.streak === 7 && log.lastWeeklyDay !== log.lastCompletionDay) fail('This save’s seventh quest day needs its weekly reward record.');
  }
  record(state.battleWins, Object.keys(OPPONENTS), 'Arena victories');
  for (const won of Object.values(state.battleWins)) if (typeof won !== 'boolean') fail('Each arena win in this save needs true or false.');
  if ((state.battleWins.stonebeak && !state.battleWins.ashgrub) || (state.battleWins.frostwisp && !state.battleWins.stonebeak)) fail('The arena wins in this save need to follow the opponents’ order.');
  const firstWins = Object.values(state.battleWins).filter(Boolean).length;
  if (firstWins > state.counts.battleWins || ((firstWins === 0) !== (state.counts.battleWins === 0))) fail('The arena win total in this save doesn’t match the opponents beaten.');
  if (state.battle !== null) {
    const battle = state.battle;
    record(battle, ['opponentId', 'petId', 'status', 'turn', 'petLevel', 'petHp', 'petMaxHp', 'opponentHp', 'opponentMaxHp', 'power', 'defence', 'log'], 'Battle');
    if (typeof battle.opponentId !== 'string' || !Object.hasOwn(OPPONENTS, battle.opponentId)) fail('This save names an arena opponent Petrealm doesn’t recognise.');
    const opponent = OPPONENTS[battle.opponentId];
    const pet = state.pets.find((entry) => entry.id === battle.petId);
    if (!pet) fail('The companion from this arena match is missing from the save.');
    integer(battle.petLevel, opponent.level, pet.level, 'Battle level');
    const previous = Object.keys(OPPONENTS)[Object.keys(OPPONENTS).indexOf(opponent.id) - 1];
    if (previous && !state.battleWins[previous]) fail('Beat the earlier arena opponent before this match.');
    if (battle.petMaxHp !== 36 + battle.petLevel * 4 || battle.opponentMaxHp !== opponent.hp) fail('The starting HP in this save doesn’t match the arena opponents.');
    integer(battle.petHp, 0, battle.petMaxHp, 'Companion HP');
    integer(battle.opponentHp, 0, opponent.hp, 'Opponent HP');
    integer(battle.turn, 0, 40, 'Battle turn');
    if (![8 + battle.petLevel * 2, 10 + battle.petLevel * 2].includes(battle.power) || ![0, 2].includes(battle.defence)) fail('The arena attack and defence in this save don’t match the equipment.');
    if (opponent.hp - battle.opponentHp > battle.turn * battle.power) fail('The opponent’s HP in this save doesn’t match the turns played.');
    if (!['active', 'won', 'lost'].includes(battle.status)) fail('Petrealm can’t tell whether this saved arena match is ongoing, won or lost.');
    if (battle.status === 'active' && (battle.petHp === 0 || battle.opponentHp === 0 || battle.turn >= 40 || state.activePetId !== battle.petId)) fail('The ongoing arena match’s HP, turns or companion don’t match in this save.');
    if (battle.status === 'won' && (battle.opponentHp !== 0 || battle.petHp === 0 || battle.turn === 0 || !state.battleWins[opponent.id])) fail('This save’s arena win doesn’t match its HP and win record.');
    if (battle.status === 'lost' && (battle.opponentHp === 0 || battle.turn === 0 || (battle.petHp !== 0 && battle.turn !== 40))) fail('This save’s arena loss doesn’t match its HP and turns.');
    if (battle.turn === 0 && (battle.petHp !== battle.petMaxHp || battle.opponentHp !== opponent.hp)) fail('Both arena opponents need full HP at the start of a match.');
    if (!Array.isArray(battle.log) || battle.log.length < 1 || battle.log.length > 8 || battle.log.some((line) => typeof line !== 'string' || line.length > 160 || /[\u0000-\u001f\u007f-\u009f]/u.test(line))) fail('Petrealm can’t read the arena notes in this save.');
  }
  return true;
}

function trailChoices(routeId, variant, step, pet) {
  const scene = getTrailScene(routeId, variant, step);
  if (!scene) return [];
  return [...scene.choices, ...(pet.trail.bond >= 3 ? [knackChoice(pet.personality)] : [])];
}

function validateTrailChoices(choices, length, run, pet, label, finished = false) {
  if (!Array.isArray(choices) || choices.length !== length) fail(`The ${label} in this save needs exactly ${length} choices.`);
  for (const [step, id] of choices.entries()) {
    if (typeof id !== 'string' || !trailChoices(run.routeId, run.variant, step, pet).some((entry) => entry.id === id)) fail(`The ${label} in this save includes a choice that wasn’t offered.`);
    if (finished && id === 'knack' && pet.trail.bond - run.bondGain < 3) fail('Your friend needs three bond before using their knack on an outing.');
  }
}

function validateV3State(state) {
  record(state, [...STATE_KEYS, 'questLog', 'trails'], 'Save', ['companionship']);
  if (!Array.isArray(state.pets)) fail('Petrealm needs a list of companions in this save.');
  // Check the absolute roster bound before visiting entries. The v2 rules below
  // then enforce the smaller capacity for this world's membership and rooms.
  if (state.pets.length > 26) fail('Your lodge has room for up to 26 companions.');
  for (const pet of state.pets) record(pet, ['id', 'name', 'species', 'adoptedAt', 'stats', 'wearing', 'xp', 'level', 'personality', 'journey', 'trail'], 'Pet');
  // Reuse the unchanged v2 rules after removing only the explicit new fields.
  const { trails, companionship, ...previous } = state;
  validateV2State({ ...previous, version: 2, pets: state.pets.map(({ trail, ...pet }) => pet) });
  validateCompanionship(state, { record, integer, timestamp, fail, maxCounter: MAX_COUNTER });
  record(state.bank, ['balance', 'tier', 'lastInterestDay', 'interestClaims', 'interestEarned'], 'Bank');
  let trips = 0;
  for (const pet of state.pets) {
    record(pet.trail, ['trips', 'bond'], 'Companion trail');
    integer(pet.trail.trips, 0, MAX_COUNTER, 'Completed outings');
    integer(pet.trail.bond, pet.trail.trips, Math.min(MAX_COUNTER, pet.trail.trips * 2), 'Companion bond');
    trips += pet.trail.trips;
  }
  record(trails, ['sequence', 'collection', 'display', 'active', 'last'], 'Trail journal');
  integer(trails.sequence, 0, MAX_COUNTER, 'Outings started');
  if (trips > trails.sequence) fail('This save has more finished outings than outings started.');
  if (!Array.isArray(trails.collection) || trails.collection.length > 9 || new Set(trails.collection).size !== trails.collection.length) fail('This save can list up to nine different treasures, with each one listed once.');
  for (const id of trails.collection) {
    if (typeof id !== 'string' || !Object.hasOwn(TRAIL_TREASURES, id)) fail('This save names a treasure Petrealm doesn’t recognise.');
    const route = TRAIL_ROUTES[TRAIL_TREASURES[id].routeId];
    if (!state.pets.some((pet) => pet.trail.bond >= route.bond + 1)) fail('A treasure needs a finished outing on a path your companion has opened.');
  }
  if (trails.collection.length > trips || (trips === 0 ? trails.collection.length !== 0 || trails.last !== null : trails.collection.length === 0 || trails.last === null)) fail('The treasures in this save don’t match the finished outings.');
  if (!Array.isArray(trails.display) || trails.display.length !== 3) fail('Your meadow has exactly three treasure places.');
  const shown = trails.display.filter((id) => id !== null);
  if (new Set(shown).size !== shown.length || shown.some((id) => !trails.collection.includes(id) && !companionship?.collection.includes(id))) fail('Show each treasure once, and choose ones you’ve already found.');
  for (const [label, run] of [['Current outing', trails.active], ['Last outing', trails.last]]) {
    if (run === null) continue;
    const finished = label === 'Last outing';
    record(run, ['id', 'petId', 'routeId', 'variant', ...(finished ? ['choices', 'treasureId', 'newFind', 'bondGain', 'xpGain'] : ['step', 'choices'])], label);
    integer(run.id, 1, trails.sequence, `${label} number`);
    if (typeof run.routeId !== 'string' || !Object.hasOwn(TRAIL_ROUTES, run.routeId)) fail('Choose one of the open trails.');
    integer(run.variant, 0, 2, 'Trail variation');
    const pet = state.pets.find((entry) => entry.id === run.petId);
    if (!pet) fail('The friend from this outing is missing from the save.');
    if (pet.trail.bond < TRAIL_ROUTES[run.routeId].bond + Number(finished)) fail('This friend hasn’t opened that trail yet.');
    if (finished) {
      integer(run.bondGain, 1, 2, 'Outing bond');
      integer(run.xpGain, 0, 12, 'Outing experience');
      if (pet.xp < run.xpGain || (run.xpGain < 12 && pet.xp !== MAX_XP)) fail('The outing’s XP in this save doesn’t match your friend’s XP.');
      if (run.id < trips || pet.trail.trips < 1 || run.variant !== (pet.trail.trips - 1) % 3 || pet.trail.bond < run.bondGain) fail('The last outing in this save doesn’t match your friend’s adventures.');
      validateTrailChoices(run.choices, 3, run, pet, label, true);
      const kinds = run.choices.map((id, step) => id === 'knack' ? PERSONALITY_APPROACHES[pet.personality] : getTrailScene(run.routeId, run.variant, step).choices.find((entry) => entry.id === id).kind);
      if (run.bondGain !== 1 + Number(kinds.includes(PERSONALITY_APPROACHES[pet.personality]))) fail('The outing’s bond in this save doesn’t match the choices made.');
      if (run.treasureId !== findForApproach(run.routeId, run.variant, kinds[2]) || !trails.collection.includes(run.treasureId)) fail('The outing’s treasure in this save doesn’t match the final choice.');
      if (typeof run.newFind !== 'boolean' || (run.newFind && trails.collection.at(-1) !== run.treasureId) || (!run.newFind && trips === 1)) fail('The newly found treasure doesn’t match this save’s journal.');
    } else {
      integer(run.step, 0, 2, 'Outing step');
      if (run.id !== trails.sequence || trips >= trails.sequence || pet.trail.trips >= MAX_COUNTER || pet.trail.bond > MAX_COUNTER - 2 || run.variant !== pet.trail.trips % 3 || run.petId !== state.activePetId || state.battle?.status === 'active' || (trails.last && run.id <= trails.last.id)) fail('This save’s current outing doesn’t match your friend or their adventures.');
      validateTrailChoices(run.choices, run.step, run, pet, label);
    }
  }
  return true;
}

export function validateState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) fail('Petrealm can’t read this save. Choose a Petrealm save file.');
  if (state.version === 1) return validateLegacyState(state);
  if (state.version === 2) return validateV2State(state);
  if (state.version === 3) return validateV3State(state);
  fail('Petrealm can’t open this save version. Try a save with version 1, 2 or 3.');
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
  if (!pet) fail('Adopt a companion first, then you can do this together.');
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
  if (state.battle?.status === 'active') fail('Finish the current arena battle first.');
}

function requireNoTrail(state) {
  if (state.trails?.active) fail('Finish your current trail or head home before choosing another friend or entering the arena.');
}

/** Construct a new save. Callers may inject a timestamp for repeatable tests. */
export function createState(now = Date.now()) {
  timestamp(now);
  return {
    version: 3,
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
    trails: freshTrails(),
    companionship: freshCompanionship(),
  };
}

/** Migrate old saves without changing their economy, clock, care or companion history. */
export function migrateState(state) {
  validateState(state);
  if (state.version === 2 || state.version === 3) {
    const next = clone(state);
    next.version = 3;
    if (!Object.hasOwn(next.bank, 'tier')) next.bank = freshBank(next.bank.balance);
    if (!Object.hasOwn(next, 'questLog')) next.questLog = freshQuestLog(next.quests.daily);
    for (const pet of next.pets) {
      if (!Object.hasOwn(pet, 'personality')) { pet.personality = 'steady'; pet.journey = freshJourney(); }
      if (!Object.hasOwn(pet, 'trail')) pet.trail = freshPetTrail();
    }
    if (!Object.hasOwn(next, 'trails')) next.trails = freshTrails();
    if (!Object.hasOwn(next, 'companionship')) next.companionship = freshCompanionship(next.pets);
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
    next.pets = [{ ...clone(state.pet), id: 'pet-1', wearing: { head: null, neck: null }, xp: 0, level: 1, personality: 'steady', journey: freshJourney(), trail: freshPetTrail() }];
    next.activePetId = 'pet-1';
    next.companionship = freshCompanionship(next.pets);
  }
  validateState(next);
  return next;
}

/** Absence never changes companions. Advance calendar rewards without moving backwards. */
export function advanceTime(state, now = Date.now()) {
  timestamp(now);
  const next = migrateState(state);
  const effectiveTime = Math.max(now, next.lastUpdated);
  next.lastUpdated = effectiveTime;
  if (next.quests.daily.day !== dayFor(effectiveTime)) next.quests.daily = { day: dayFor(effectiveTime), feeds: 0, claimed: false };
  if (next.questLog.day !== dayFor(effectiveTime)) {
    const old = next.questLog;
    next.questLog = { ...freshQuestLog(next.quests.daily), lastCompletionDay: old.lastCompletionDay,
      streak: old.streak,
      completedDays: old.completedDays, weeklyRewards: old.weeklyRewards, lastWeeklyDay: old.lastWeeklyDay };
  }
  return next;
}

export function adopt(state, name, species, now = Date.now(), personality = undefined) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  requireNoTrail(next);
  if (next.pets.length >= petCapacity(next)) fail(`Your lodge is full at ${petCapacity(next)} companions. Add a room or choose explorer membership to make more space.`);
  if (typeof name !== 'string') fail('Give your companion a name.');
  const cleanName = name.trim().normalize('NFC');
  // Keep previously valid saved names intact while refusing invisible direction
  // overrides in a new name. All saved names remain escaped when rendered.
  checkName(cleanName, true);
  if (typeof species !== 'string' || !Object.hasOwn(SPECIES, species)) fail('Choose one of the available companion species.');
  const nature = personality === undefined ? SPECIES[species].personality : personality;
  if (typeof nature !== 'string' || !Object.hasOwn(PERSONALITIES, nature)) fail('Choose one of the available personalities for your companion.');
  const id = `pet-${next.pets.length + 1}`;
  next.pets.push({ id, name: cleanName, species, adoptedAt: next.lastUpdated, stats: { satiety: 85, happiness: 80, energy: 85 }, wearing: { head: null, neck: null }, xp: 0, level: 1, personality: nature, journey: freshJourney(), trail: freshPetTrail() });
  next.companionship.profiles.push(freshCompanion(next.pets.at(-1)));
  next.activePetId = id;
  next.counts.adoptions += 1;
  return finish(next);
}

export function selectPet(state, petId, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  requireNoTrail(next);
  if (!next.pets.some((pet) => pet.id === petId)) fail('Choose one of your adopted companions.');
  next.activePetId = petId;
  return finish(next);
}

export function setMembership(state, tier, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  if (!['free', 'explorer'].includes(tier)) fail('Choose free or explorer membership for your lodge.');
  next.membership.tier = tier;
  if (next.pets.length > petCapacity(next)) fail('Your family needs enough room for every companion. Keep explorer membership, or add enough rooms before choosing free membership.');
  return finish(next);
}

export function claimLodgeParcel(state, now = Date.now()) {
  const next = advanceTime(state, now);
  if (next.membership.tier !== 'explorer') fail('Join the explorer lodge to collect its daily parcel.');
  const day = dayFor(next.lastUpdated);
  if (next.membership.lastParcelDay === day) fail('You’ve already collected today’s lodge parcel. Another arrives after midnight UTC.');
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
  if (next.expansions >= 12) fail('Your lodge already has its maximum 12 extra rooms.');
  if (next.inventory['lodge-deed'] < 1) fail('Buy a lodge deed at Market lane to make room for another companion.');
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
    if (next.inventory[itemId] < 1) fail(`You have no ${ITEMS[itemId].name.toLowerCase()} left. Find more at Market lane.`);
    next.inventory[itemId] -= 1;
    changeStats(pet, itemId === 'berry' ? { satiety: 22, happiness: 6 } : { satiety: 12, happiness: 3, energy: 12 });
    if (SPECIES[pet.species].favourite === itemId) changeStats(pet, { happiness: 3 + (pet.personality === 'curious' ? 2 : 0) });
    pet.journey.feeds += 1;
    next.counts.feeds += 1;
    next.quests.daily.feeds += 1;
    gainXp(pet, 4);
  } else if (action === 'play') {
    if (itemId !== 'ribbon') fail('Choose the rainbow ribbon to play.');
    if (next.inventory.ribbon < 1) fail('You need a rainbow ribbon. Find one at Market lane.');
    if (pet.stats.energy < 12) fail('Your companion needs a rest before playing. A nap will help them reach 12 energy.');
    changeStats(pet, { happiness: 20, energy: -12, satiety: -4 });
    if (pet.personality === 'spirited') changeStats(pet, { happiness: 3 });
    pet.journey.plays += 1;
    next.counts.plays += 1;
    next.questLog.progress.plays += 1;
    gainXp(pet, 6);
  } else if (action === 'rest') {
    if (itemId !== undefined && itemId !== null) fail('A nap does not use an item. Put the snack away for later.');
    changeStats(pet, { energy: 30, satiety: -5, happiness: 3 });
    if (pet.personality === 'gentle') changeStats(pet, { happiness: 3 });
    pet.journey.rests += 1;
    next.counts.rests += 1;
    next.questLog.progress.rests += 1;
    gainXp(pet, 2);
  } else fail('Choose a meal, ribbon play or a nap.');
  learnFrom(next, pet.id, action === 'play' ? 'curiosity' : 'kindness');
  return finish(next);
}

/** Paid practice uses the same earned wallet and bounded experience as care. */
export function trainPet(state, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  const pet = requirePet(next);
  if (pet.xp >= MAX_XP) fail('Your companion has reached level 20. Keep exploring, playing and enjoying the meadow together.');
  if (next.wallet < TRAINING_COST) fail(`Practice costs ${TRAINING_COST} pebbles. Games, quests and daily gifts can help you earn them.`);
  if (pet.stats.energy < 12) fail('Your companion needs 12 energy for practice. Give them a nap first.');
  next.wallet -= TRAINING_COST;
  changeStats(pet, { energy: -12, satiety: -4 });
  pet.journey.trainings += 1;
  learnFrom(next, pet.id, 'courage');
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
  if (next.wallet < GROWTH_COST) fail(`A first bloom costs ${GROWTH_COST} pebbles. Games, quests and daily gifts can help you earn them.`);
  next.wallet -= GROWTH_COST;
  pet.journey.growth = 1;
  gainXp(pet, 40);
  changeStats(pet, { happiness: 10, energy: 10 });
  return finish(next);
}

/** Read-only helpers never advance a clock or award anything. */
export function trailProgress(state) {
  const pet = readActivePet(state);
  const history = pet?.trail ?? freshPetTrail();
  const journal = state.trails ?? freshTrails();
  const preferred = PERSONALITY_APPROACHES[pet?.personality ?? 'steady'];
  const routes = Object.values(TRAIL_ROUTES).map((route) => {
    const unlocked = Boolean(pet && history.bond >= route.bond);
    let reason = '';
    if (!pet) reason = 'Adopt a companion to explore together.';
    else if (!unlocked) reason = `Earn ${route.bond - history.bond} more bond with ${pet.name} to open this path.`;
    else if (journal.active) reason = 'Finish this outing or head home first.';
    else if (state.battle?.status === 'active') reason = 'Finish the arena battle first.';
    else if (history.trips >= MAX_COUNTER || history.bond > MAX_COUNTER - 2 || journal.sequence >= MAX_COUNTER) reason = 'Your trail journal is full.';
    else if (pet.stats.energy < 10) reason = 'Share a nap first. Outings need 10 energy to begin.';
    else if (pet.stats.satiety < 2) reason = 'Share a snack first. Outings need 2 fullness to begin.';
    return { ...route, unlocked, ready: reason === '', reason };
  });
  return { pet, ...history, preferred, knack: Boolean(pet && history.bond >= 3), routes,
    collection: [...new Set([...journal.collection, ...(state.companionship?.collection ?? [])])], display: [...journal.display], active: journal.active, last: journal.last };
}

export function trailEncounter(state) {
  const run = state.trails?.active;
  if (!run) return null;
  const pet = state.pets.find((entry) => entry.id === run.petId);
  const scene = getTrailScene(run.routeId, run.variant, run.step);
  if (!pet || !scene) return null;
  const previousChoice = run.step > 0 ? trailChoices(run.routeId, run.variant, run.step - 1, pet).find((entry) => entry.id === run.choices[run.step - 1]) : null;
  return { route: TRAIL_ROUTES[run.routeId], variant: run.variant, step: run.step,
    title: scene.title, text: scene.text, choices: trailChoices(run.routeId, run.variant, run.step, pet), previousOutcome: previousChoice?.outcome ?? null };
}

/** Starting spends care resources once. No reward is earned by waiting. */
export function startTrail(state, routeId, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  requireNoTrail(next);
  const pet = requirePet(next);
  if (typeof routeId !== 'string' || !Object.hasOwn(TRAIL_ROUTES, routeId)) fail('Choose one of the open trails.');
  const route = TRAIL_ROUTES[routeId];
  if (pet.trail.bond < route.bond) fail(`Build ${route.bond} bond with ${pet.name} to open ${route.name}.`);
  if (pet.stats.energy < 10) fail('Your companion needs 10 energy to begin an outing. Share a nap first.');
  if (pet.stats.satiety < 2) fail('Your companion needs 2 fullness to begin an outing. Share a snack first.');
  if (pet.trail.trips >= MAX_COUNTER || pet.trail.bond > MAX_COUNTER - 2 || next.trails.sequence >= MAX_COUNTER) fail('Your trail journal is full. Download your save to keep a copy.');
  changeStats(pet, { energy: -6, satiety: -2 });
  next.trails.sequence += 1;
  next.trails.active = { id: next.trails.sequence, petId: pet.id, routeId, variant: pet.trail.trips % 3, step: 0, choices: [] };
  return finish(next);
}

function requireTrailRun(state, runId) {
  integer(runId, 1, MAX_COUNTER, 'Outing number');
  const run = state.trails.active;
  if (!run || run.id !== runId) fail('This outing has already ended or changed. Open the trail to see where you are now.');
  if (run.petId !== state.activePetId) fail('This outing belongs to a different companion.');
  return run;
}

/** Run and step are observed by the UI, then checked against the fresh locked save. */
export function chooseTrail(state, runId, expectedStep, choiceId, now = Date.now()) {
  const next = advanceTime(state, now);
  const run = requireTrailRun(next, runId);
  integer(expectedStep, 0, 2, 'Outing step');
  if (run.step !== expectedStep) fail('That choice was already made in another tab. Read the next part of your story.');
  const pet = requirePet(next);
  const selected = trailChoices(run.routeId, run.variant, run.step, pet).find((entry) => entry.id === choiceId);
  if (!selected) fail('Choose one of the options shown for this part of the trail.');
  run.choices.push(choiceId);
  if (run.step < 2) {
    run.step += 1;
    return finish(next);
  }
  const kinds = run.choices.map((id, step) => trailChoices(run.routeId, run.variant, step, pet).find((entry) => entry.id === id).kind);
  const bondGain = 1 + Number(kinds.includes(PERSONALITY_APPROACHES[pet.personality]));
  const treasureId = findForApproach(run.routeId, run.variant, selected.kind);
  const newFind = !next.trails.collection.includes(treasureId);
  if (newFind) next.trails.collection.push(treasureId);
  pet.trail.trips += 1;
  pet.trail.bond += bondGain;
  const xpGain = Math.min(12, MAX_XP - pet.xp);
  gainXp(pet, xpGain);
  changeStats(pet, { happiness: 10 });
  next.trails.last = { id: run.id, petId: pet.id, routeId: run.routeId, variant: run.variant,
    choices: [...run.choices], treasureId, newFind, bondGain, xpGain };
  next.trails.active = null;
  learnFrom(next, pet.id, selected.kind === 'help' ? 'kindness' : selected.kind === 'brave' ? 'courage' : 'curiosity', 2);
  return finish(next);
}

/** A free, asynchronous wander. Return stories never expire and belong to the departing pet. */
export function startExpedition(state, routeId, intent, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  requireNoTrail(next);
  const pet = requirePet(next);
  if (next.companionship.active) fail('A companion already has a story on the way. Welcome them home before another wander.');
  if (typeof routeId !== 'string' || !Object.hasOwn(EXPEDITION_ROUTES, routeId)
      || typeof intent !== 'string' || !Object.hasOwn(EXPEDITION_INTENTS, intent)) fail('Choose a place and a little intention for this wander.');
  const journal = next.companionship;
  if (journal.sequence >= MAX_COUNTER) fail('Your expedition journal is full. Download your save to keep a copy.');
  const duration = journal.sequence === 0 ? FIRST_EXPEDITION_MS : EXPEDITION_ROUTES[routeId].durationMs;
  if (next.lastUpdated > MAX_TIMESTAMP - duration) fail('This expedition would return beyond the supported calendar.');
  const profile = journal.profiles.find((entry) => entry.petId === pet.id);
  journal.sequence += 1;
  journal.active = { id: journal.sequence, petId: pet.id, routeId, intent, variant: profile.trips % 3,
    startedAt: next.lastUpdated, readyAt: next.lastUpdated + duration };
  return finish(next);
}

export function claimExpedition(state, now = Date.now(), expectedId = undefined) {
  const next = advanceTime(state, now);
  const journal = next.companionship;
  const run = journal.active;
  if (!run || (expectedId !== undefined && expectedId !== run.id)) fail('That expedition has already been welcomed home, or a new one has started.');
  if (next.lastUpdated < run.readyAt) fail('Your companion is still gathering a little story. There is no need to hurry.');
  const pet = next.pets.find((entry) => entry.id === run.petId);
  const profile = journal.profiles.find((entry) => entry.petId === pet.id);
  const treasureId = expeditionTreasure(run.routeId, run.intent, run.variant);
  const shared = ['feeds', 'plays', 'rests', 'trainings'].reduce((best, key) => pet.journey[key] > (best ? pet.journey[best] : 0) ? key : best, null);
  const memory = { id: run.id, routeId: run.routeId, intent: run.intent, variant: run.variant, at: next.lastUpdated, care: shared };
  profile.trips += 1;
  profile.memories.push(memory);
  profile.memories = profile.memories.slice(-MEMORY_LIMIT);
  learnFrom(next, pet.id, EXPEDITION_INTENTS[run.intent].axis, 3);
  if (!journal.collection.includes(treasureId)) journal.collection.push(treasureId);
  journal.last = { petId: pet.id, memory: { ...memory } };
  journal.active = null;
  return finish(next);
}

/** Heading home keeps the start cost; unfinished stories grant no rewards. */
export function leaveTrail(state, runId, now = Date.now()) {
  const next = advanceTime(state, now);
  requireTrailRun(next, runId);
  next.trails.active = null;
  return finish(next);
}

export function displayTreasure(state, treasureId, slot, now = Date.now()) {
  const next = advanceTime(state, now);
  integer(slot, 0, 2, 'Meadow treasure place');
  if (treasureId !== null && (typeof treasureId !== 'string' || (!next.trails.collection.includes(treasureId) && !next.companionship.collection.includes(treasureId)))) fail('Choose a treasure you’ve found on an outing.');
  // Moving a displayed keepsake clears its previous place instead of duplicating it.
  next.trails.display = next.trails.display.map((id, index) => index === slot ? treasureId : id === treasureId && treasureId !== null ? null : id);
  return finish(next);
}

export function purchase(state, itemId, now = Date.now()) {
  const next = advanceTime(state, now);
  requireItem(itemId);
  if (next.wallet < ITEMS[itemId].price) fail(`You need ${ITEMS[itemId].price} pebbles to buy a ${ITEMS[itemId].name.toLowerCase()}.`);
  if (next.inventory[itemId] >= 999) fail('Your inventory is full for this item. You can hold up to 999.');
  next.wallet -= ITEMS[itemId].price;
  next.inventory[itemId] += 1;
  next.counts.purchases += 1;
  next.questLog.progress.purchases += 1;
  return finish(next);
}

export function claimDaily(state, now = Date.now()) {
  const next = advanceTime(state, now);
  const day = dayFor(next.lastUpdated);
  if (next.daily.lastClaimDay === day) fail('You’ve already collected today’s 40-pebble gift. The next one is ready after midnight UTC.');
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
  if (amount > next.wallet) fail('There aren’t enough pebbles in your wallet for that deposit.');
  next.wallet -= amount;
  next.bank.balance += amount;
  next.counts.bankDeposits += 1;
  return finish(next);
}

export function withdraw(state, amount, now = Date.now()) {
  const next = advanceTime(state, now);
  integer(amount, 1, MAX_COUNTER, 'Withdrawal');
  if (amount > next.bank.balance) fail('There aren’t enough pebbles in your bank for that withdrawal.');
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
  if (typeof tierId !== 'string' || !Object.hasOwn(BANK_TIERS, tierId)) fail('Choose one of the available savings tiers.');
  if (ids.indexOf(tierId) <= ids.indexOf(next.bank.tier)) fail('Choose a higher savings tier than the one you have now.');
  if (next.bank.balance < BANK_TIERS[tierId].minimum) fail(`Save ${BANK_TIERS[tierId].minimum} pebbles in the bank to unlock this tier.`);
  next.bank.tier = tierId;
  return finish(next);
}

export function claimBankInterest(state, now = Date.now()) {
  const next = advanceTime(state, now);
  const offer = bankInterest(next, next.lastUpdated);
  if (offer.claimed) fail('You’ve already collected today’s interest. You can collect again after midnight UTC.');
  if (offer.amount === 0) fail('Deposit at least one pebble before collecting interest.');
  if (!offer.ready) fail('This interest would put your wallet and bank over their shared 1,000,000,000-pebble limit. Spend some pebbles first.');
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
  if (!['head', 'neck'].includes(slot)) fail('Choose something for your companion’s head or neck.');
  if (itemId !== null) {
    requireItem(itemId);
    if (ITEMS[itemId].slot !== slot) fail(`Choose something for your companion’s ${slot}.`);
    const inUse = next.pets.filter((entry) => entry.id !== pet.id && entry.wearing[slot] === itemId).length;
    if (next.inventory[itemId] <= inUse) fail('Another friend is wearing that one. Buy another copy at Market lane for this companion.');
  }
  if (pet.wearing[slot] === itemId) return next;
  pet.wearing[slot] = itemId;
  if (itemId !== null) next.counts.accessoriesEquipped += 1;
  return finish(next);
}

export function questProgress(state, questId, now = Date.now()) {
  const next = advanceTime(state, now);
  if (typeof questId !== 'string' || !Object.hasOwn(QUESTS, questId)) fail('Choose one of the available quests.');
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
  const nextStreak = log.completedDays % 7 + 1;
  const weeklyReward = nextStreak === 7 ? QUEST_WEEK_REWARD : 0;
  const completedInCycle = log.completedDays === 0 ? 0 : (log.completedDays - 1) % 7 + 1;
  return { day, claimedQuests: log.claimed.length, required: 5, claimed, streak: completedInCycle,
    nextStreak, reward: QUEST_DAY_REWARD, weeklyReward, completedDays: log.completedDays,
    weeklyRewards: log.weeklyRewards, ready: !claimed && log.claimed.length >= 5
      && next.wallet + next.bank.balance + QUEST_DAY_REWARD + weeklyReward <= MAX_COUNTER };
}

export function claimQuestDay(state, now = Date.now()) {
  const next = advanceTime(state, now);
  requireNoBattle(next);
  requirePet(next);
  const offer = questDayProgress(next, next.lastUpdated);
  if (offer.claimed) fail('You’ve already collected today’s quest gift. You can earn another after midnight UTC.');
  if (offer.claimedQuests < 5) fail('Finish five different daily quests and collect their rewards before collecting the day’s gift.');
  if (!offer.ready) fail('This quest gift would put your wallet and bank over their shared 1,000,000,000-pebble limit. Spend some pebbles first.');
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
  if (QUESTS[questId]?.explorer && next.membership.tier !== 'explorer') fail('Join the Explorer Lodge for this extra daily quest.');
  const progress = questProgress(next, questId, next.lastUpdated);
  if (progress.claimed) fail('You’ve already claimed this quest reward.');
  if (!progress.ready) fail('Complete the quest first, then collect its reward.');
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
  requireNoTrail(next);
  const pet = requirePet(next);
  if (typeof opponentId !== 'string' || !Object.hasOwn(OPPONENTS, opponentId)) fail('Choose one of the available arena opponents.');
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
  if (!['attack', 'guard', 'potion'].includes(action)) fail('Choose Attack, Guard or a dew potion.');
  const pet = requirePet(next);
  const opponent = OPPONENTS[battle.opponentId];
  let damage = 0;
  if (action === 'potion') {
    if (next.inventory.potion < 1) fail('You have no dew potion. Find one at Market lane.');
    if (battle.petHp >= battle.petMaxHp) fail('Your companion already has full HP. Keep the potion for later.');
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
    battle.log.push(firstWin ? `You won! ${opponent.reward} pebbles and ${opponent.xp} XP.` : 'You won! 5 XP. You already collected this opponent’s first-win pebbles.');
  } else {
    const raw = opponent.attack + ((battle.turn - 1) % 3);
    const incoming = Math.max(1, (action === 'guard' ? Math.ceil(raw / 2) : raw) - battle.defence);
    battle.petHp = Math.max(0, battle.petHp - incoming);
    battle.log.push(`${opponent.name} deals ${incoming} damage.`);
    if (battle.petHp === 0 || battle.turn >= 40) {
      battle.status = 'lost';
      changeStats(pet, { happiness: -5 });
      battle.log.push(battle.turn >= 40 && battle.petHp > 0 ? 'The arena closes after 40 turns. Rest and try again.' : 'Your friend needs a break. Share a nap and try again.');
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
    if (depth > MAX_JSON_DEPTH) fail(`This save has too many layers of details. The limit is ${MAX_JSON_DEPTH} levels.`);
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

export function parseSave(text) {
  if (typeof text !== 'string') fail('Choose a Petrealm save file ending in .json.');
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) fail('This save file is too large. Choose a file up to 32 KiB.');
  let state;
  try { state = JSON.parse(text); }
  catch { fail('Petrealm can’t read this file as a save. Your current companion is unchanged.'); }
  validateState(state);
  // Validate the shallow schema before scanning: even a small file can contain
  // thousands of nested arrays, which should produce a save error, not overflow.
  rejectDuplicateKeys(text);
  return migrateState(state);
}

export function serialiseSave(state) {
  const next = migrateState(state);
  let text = `${JSON.stringify(next, null, 2)}\n`;
  // Larger families keep the same schema in compact JSON, within the original import bound.
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) text = `${JSON.stringify(next)}\n`;
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) fail('This save is too large to download. Petrealm saves need to fit within 32 KiB.');
  return text;
}
