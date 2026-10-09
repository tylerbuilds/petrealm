import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPECIES, ITEMS, createState, adopt, advanceTime, care, purchase,
  claimDaily, claimGameReward, validateState, parseSave, serialiseSave,
} from '../src/model.js';

const START = Date.parse('2026-10-09T12:00:00.000Z');
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const pet = () => adopt(createState(START), 'Fern', 'mossling', START);

test('fresh saves offer three original species, starter coins and independent inventory', () => {
  const first = createState(START);
  const second = createState(START);
  assert.deepEqual(Object.keys(SPECIES), ['mossling', 'emberkit', 'moonfin']);
  assert.equal(first.wallet, 120);
  assert.equal(first.pet, null);
  assert.deepEqual(first.inventory, { berry: 3, acorn: 2, ribbon: 1 });
  assert.equal(validateState(first), true);
  first.inventory.berry = 0;
  assert.equal(second.inventory.berry, 3);
  assert.throws(() => createState(NaN), /Time/);
});

test('adoption normalises names, records an achievement and never mutates the input', () => {
  const original = createState(START);
  const before = serialiseSave(original);
  const result = adopt(original, '  Fe\u0301rn  ', 'emberkit', START);
  assert.equal(result.pet.name, 'Férn');
  assert.equal(result.pet.species, 'emberkit');
  assert.deepEqual(result.achievements, ['first-friend']);
  assert.equal(serialiseSave(original), before);
  assert.throws(() => adopt(result, 'Other', 'moonfin', START), /already has/);
  assert.throws(() => adopt(original, '', 'mossling', START), /Pet name/);
  assert.throws(() => adopt(original, 'Bad\nName', 'mossling', START), /Pet name/);
  assert.throws(() => adopt(original, 'Fern', '__proto__', START), /species/);
});

test('offline decay is deterministic, bounded at 72 hours, and applied only once', () => {
  const original = pet();
  const next = advanceTime(original, START + 2 * HOUR);
  assert.deepEqual(next.pet.stats, { satiety: 79, happiness: 76, energy: 83 });
  assert.deepEqual(original.pet.stats, { satiety: 85, happiness: 80, energy: 85 });
  const farFuture = advanceTime(original, START + 365 * DAY);
  assert.deepEqual(farFuture.pet.stats, { satiety: 0, happiness: 0, energy: 13 });
  assert.deepEqual(advanceTime(farFuture, START + 365 * DAY), farFuture);
  assert.deepEqual(advanceTime(next, START - DAY), next);
  assert.equal(advanceTime(createState(START), START + HOUR).lastUpdated, START + HOUR);
});

test('food is consumed, stats are capped, and care achievements reflect actual actions', () => {
  let state = advanceTime(pet(), START + 10 * HOUR);
  state = care(state, 'feed', 'berry', state.lastUpdated);
  assert.deepEqual(state.pet.stats, { satiety: 77, happiness: 66, energy: 75 });
  assert.equal(state.inventory.berry, 2);
  state = care(state, 'feed', 'acorn', state.lastUpdated);
  assert.deepEqual(state.pet.stats, { satiety: 89, happiness: 69, energy: 87 });
  state = care(state, 'feed', 'berry', state.lastUpdated);
  assert.equal(state.pet.stats.satiety, 100);
  assert.equal(state.counts.feeds, 3);
  assert.ok(state.achievements.includes('well-fed'));
  const before = serialiseSave(state);
  assert.throws(() => care(state, 'feed', 'ribbon', state.lastUpdated), /sunberry/);
  assert.equal(serialiseSave(state), before);
  state.inventory.acorn = 0;
  assert.throws(() => care(state, 'feed', 'acorn', state.lastUpdated), /no honey acorn/);
  assert.throws(() => care(createState(START), 'rest', undefined, START), /Adopt/);
});

test('ribbon play is reusable but requires enough energy; rest restores energy', () => {
  let state = pet();
  const ribbonCount = state.inventory.ribbon;
  for (let round = 0; round < 7; round += 1) state = care(state, 'play', 'ribbon', START);
  assert.equal(state.inventory.ribbon, ribbonCount);
  assert.equal(state.pet.stats.energy, 1);
  assert.equal(state.pet.stats.happiness, 100);
  assert.throws(() => care(state, 'play', 'ribbon', START), /needs a rest/);
  state = care(state, 'rest', undefined, START);
  assert.equal(state.pet.stats.energy, 31);
  assert.ok(state.achievements.includes('playmate'));
  assert.ok(state.achievements.includes('sweet-dreams'));
  assert.throws(() => care(state, 'rest', 'berry', START), /does not use/);
  state.inventory.ribbon = 0;
  assert.throws(() => care(state, 'play', 'ribbon', START), /need a rainbow/);
});

test('shop prices come only from fixed item definitions and overspending fails atomically', () => {
  const original = createState(START);
  const state = purchase(original, 'berry', START);
  assert.equal(state.wallet, 120 - ITEMS.berry.price);
  assert.equal(state.inventory.berry, 4);
  assert.equal(original.wallet, 120);
  assert.ok(state.achievements.includes('shopper'));
  const broke = { ...state, wallet: 0 };
  const before = serialiseSave(broke);
  assert.throws(() => purchase(broke, 'ribbon', START), /35 pebbles/);
  assert.equal(serialiseSave(broke), before);
  assert.throws(() => purchase(state, 'constructor', START), /Choose an item/);
  const full = structuredClone(state);
  full.inventory.berry = 999;
  assert.throws(() => purchase(full, 'berry', START), /inventory is full/);
});

test('daily reward is once per UTC day, including a timezone-independent boundary', () => {
  const late = Date.parse('2026-10-09T23:59:59.000Z');
  const state = claimDaily(createState(late), late);
  assert.equal(state.wallet, 160);
  assert.equal(state.daily.lastClaimDay, '2026-10-09');
  assert.throws(() => claimDaily(state, late), /already collected/);
  assert.throws(() => claimDaily(state, late - DAY), /already collected/);
  const next = claimDaily(state, late + 1000);
  assert.equal(next.wallet, 200);
  assert.equal(next.daily.lastClaimDay, '2026-10-10');
  assert.equal(next.counts.dailyClaims, 2);
});

test('game payouts enforce score, per-round and daily caps, with a new UTC day reset', () => {
  let state = claimGameReward(pet(), 99, START);
  assert.equal(state.wallet, 159);
  assert.equal(state.game.earned, 39);
  state = claimGameReward(state, 100, START);
  state = claimGameReward(state, 100, START);
  state = claimGameReward(state, 100, START);
  assert.equal(state.wallet, 240);
  assert.equal(state.game.earned, 120);
  const cappedWallet = state.wallet;
  const cappedGames = state.counts.games;
  state = claimGameReward(state, 100, START);
  assert.equal(state.wallet, cappedWallet);
  assert.equal(state.game.earned, 120);
  assert.equal(state.counts.games, cappedGames + 1);
  assert.equal(state.pet.stats.happiness, 95);
  state = claimGameReward(state, 100, START - DAY);
  assert.equal(state.wallet, cappedWallet);
  assert.equal(state.game.earned, 120);
  state = claimGameReward(state, 100, START + DAY);
  assert.equal(state.game.earned, 40);
  assert.equal(state.wallet, 280);
  for (const score of [-1, 101, NaN, Infinity, 4.5, '100']) {
    assert.throws(() => claimGameReward(pet(), score, START), /Game score/);
  }
  const zero = claimGameReward(pet(), 0, START);
  assert.equal(zero.game.earned, 0);
  assert.equal(zero.counts.games, 1);
  assert.equal(zero.pet.stats.happiness, 83);
  assert.ok(zero.achievements.includes('game-on'));
  for (let round = 0; round < 20; round += 1) state = claimGameReward(state, 0, START + DAY);
  assert.equal(state.pet.stats.happiness, 100);
  assert.equal(state.wallet, 280);
});

test('25 care actions earn devoted-carer only at the actual threshold', () => {
  let state = pet();
  for (let count = 0; count < 24; count += 1) state = care(state, 'rest', undefined, START);
  assert.ok(!state.achievements.includes('devoted-carer'));
  state = care(state, 'rest', undefined, START);
  assert.ok(state.achievements.includes('devoted-carer'));
});

test('save round trips preserve all state and return independent objects', () => {
  const original = claimDaily(care(pet(), 'play', 'ribbon', START), START);
  const loaded = parseSave(serialiseSave(original));
  assert.deepEqual(loaded, original);
  loaded.inventory.berry = 0;
  loaded.pet.stats.satiety = 0;
  assert.equal(original.inventory.berry, 3);
  assert.equal(original.pet.stats.satiety, 81);
});

test('strict imports reject unknown fields, versions, invalid stats and inventory without changing a save', () => {
  const original = pet();
  const before = serialiseSave(original);
  const cases = [
    [(state) => { state.version = 2; }, /Unsupported save version/],
    [(state) => { state.surprise = true; }, /unknown fields/],
    [(state) => { delete state.wallet; }, /missing/],
    [(state) => { state.inventory.berry = -1; }, /quantity/],
    [(state) => { state.inventory.unknown = 1; }, /unknown fields/],
    [(state) => { state.pet.stats.satiety = 101; }, /satiety/],
    [(state) => { state.pet.stats.energy = null; }, /energy/],
    [(state) => { state.pet.species = 'neopet'; }, /species/],
    [(state) => { state.achievements.push('first-friend'); }, /duplicates/],
    [(state) => { state.counts.adoptions = 2; }, /Adoption count/],
    [(state) => { state.daily.lastClaimDay = '2026-02-30'; }, /valid UTC date/],
    [(state) => { state.game.earned = 121; }, /Daily game rewards/],
    [(state) => { state.pet.adoptedAt = START + 1; }, /after the saved time/],
  ];
  for (const [change, pattern] of cases) {
    const invalid = structuredClone(original);
    change(invalid);
    assert.throws(() => parseSave(JSON.stringify(invalid)), pattern);
  }
  assert.throws(() => validateState({ ...original, wallet: Infinity }), /Pebble balance/);
  assert.throws(() => validateState({ ...original, lastUpdated: NaN }), /Saved time/);
  assert.equal(serialiseSave(original), before);
});

test('imports reject duplicate keys, escaped duplicate keys, invalid JSON and oversized files', () => {
  const text = serialiseSave(pet());
  assert.throws(() => parseSave(text.replace('"wallet": 120', '"wallet": 120, "wallet": 50')), /duplicate field/);
  assert.throws(() => parseSave(text.replace('"wallet": 120', '"wallet": 120, "wall\\u0065t": 50')), /duplicate field/);
  assert.throws(() => parseSave(text.replace('"satiety": 85', '"satiety": 85, "satiety": 20')), /duplicate field/);
  assert.throws(() => parseSave('{broken'), /not valid JSON/);
  assert.throws(() => parseSave(' '.repeat(32_769)), /too large/);
  assert.throws(() => parseSave('🌿'.repeat(9000)), /too large/);
  assert.throws(() => parseSave('null'), /must be an object/);
  assert.throws(() => parseSave('[]'), /must be an object/);
  assert.throws(() => parseSave(`${'['.repeat(10_000)}0${']'.repeat(10_000)}`), /must be an object/);
});

test('save parser handles quotes, backslashes and punctuation in valid names', () => {
  for (const name of ['Fern "Junior"', 'Fern\\', 'Fern {},[]:']) {
    const state = adopt(createState(START), name, 'moonfin', START);
    assert.deepEqual(parseSave(serialiseSave(state)), state);
  }
});

test('duplicate-key scanner bounds hidden nesting before the call stack can overflow', () => {
  const text = serialiseSave(pet());
  const hiddenWallet = (depth) => text.replace('"wallet": 120', `"wallet": ${'['.repeat(depth)}0${']'.repeat(depth)}, "wallet": 120`);
  // Root object is level 0; fifteen wallet arrays leave their scalar at level 16.
  assert.throws(() => parseSave(hiddenWallet(15)), /duplicate field/);
  assert.throws(() => parseSave(hiddenWallet(16)), /nested too deeply.*16 levels/);
  const malicious = hiddenWallet(10_000);
  assert.ok(new TextEncoder().encode(malicious).length < 32_768);
  assert.throws(() => parseSave(malicious), /nested too deeply/);
});
