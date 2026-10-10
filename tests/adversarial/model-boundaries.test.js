import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, adopt, purchase, startBattle, battleAction, parseSave, serialiseSave,
  validateState, advanceTime, claimDaily, claimGameReward, deposit, withdraw,
  selectPet, readActivePet, startTrail, trailEncounter, chooseTrail,
} from '../../src/model.js';
import { getTrailScene, findForApproach, knackChoice } from '../../src/trails.js';
import { renderGarden, renderMarket, renderRealm, renderArena, renderGlen } from '../../src/views.js';
import { renderTrails } from '../../src/trail-views.js';

const NOW = Date.parse('2026-10-10T12:00:00Z');
const friend = (name = 'Fern') => adopt(createState(NOW), name, 'mossling', NOW);
const raw = (state) => JSON.stringify(state);
function unchangedAfterReject(state, action, pattern) {
  const before = raw(state);
  assert.throws(() => action(state), pattern);
  assert.equal(raw(state), before);
}

test('regression: a dew potion at full battle HP must not consume it or take a turn', () => {
  // The visible potion button is disabled at full HP. A stale tab must obey the
  // same rule after the fresh save is read rather than waste the consumable.
  const state = startBattle(purchase(friend(), 'potion', NOW), 'ashgrub', NOW);
  unchangedAfterReject(state, (current) => battleAction(current, 'potion', NOW), /full|does not need/i);
});

test('regression: bidi direction overrides cannot disguise a companion name', () => {
  // These invisible controls can reverse the name, battle notes and headings.
  // Joiners used by ordinary scripts and emoji remain available.
  for (const code of [0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069]) {
    unchangedAfterReject(createState(NOW), (state) => adopt(state, `Fern${String.fromCodePoint(code)}x`, 'mossling', NOW), /hidden characters/);
  }
  assert.equal(readActivePet(friend('👩‍🚀 Fern')).name, '👩‍🚀 Fern');
});

test('regression: inherited catalogue keys and malformed route inputs return no option', () => {
  for (const route of ['__proto__', 'constructor', 'toString', '', null, {}, []]) {
    assert.equal(getTrailScene(route, 0, 0), null);
    assert.equal(findForApproach(route, 0, 'observe'), null);
  }
  for (const nature of ['__proto__', 'constructor', 'toString', null, {}, []]) assert.equal(knackChoice(nature), null);
  for (const index of [-1, 3, NaN, Infinity, '0', {}, [], true]) {
    assert.equal(getTrailScene('whisperwood', index, 0), null);
    assert.equal(getTrailScene('whisperwood', 0, index), null);
    assert.equal(findForApproach('whisperwood', index, 'observe'), null);
  }
  for (const kind of ['__proto__', 'constructor', {}, [], null]) assert.equal(findForApproach('whisperwood', 0, kind), null);
});

test('all user strings stay inert in each real world view and arena notes', () => {
  const name = '<svg/onload=alert(1)>';
  let state = friend(name);
  for (const render of [renderGarden, renderMarket, renderRealm, renderArena, renderGlen, renderTrails]) {
    const html = render(state);
    assert.doesNotMatch(html, /<svg\/onload=|<script\b/i);
    if (render !== renderRealm) assert.ok(html.includes('&lt;svg/onload=alert(1)&gt;'));
  }
  state = startBattle(state, 'ashgrub', NOW);
  state.battle.log = ['</p><img src=x onerror=alert(1)>', '../../../etc/passwd', '$(' + 'touch /tmp/fictional)'];
  assert.equal(validateState(state), true);
  const html = renderArena(state);
  assert.doesNotMatch(html, /<img src=x|<\/p><img|<script\b/i);
  assert.match(html, /&lt;\/p&gt;&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('corrupt imports, prototype pollution keys and duplicate friend IDs never mutate the input world', () => {
  const state = adopt(friend(), 'Cinder', 'emberkit', NOW);
  const before = raw(state);
  const duplicate = structuredClone(state); duplicate.pets[1].id = 'pet-1';
  const bad = [before.slice(0, -10), before + 'garbage', before.replace('"wallet":120', '"wallet":"120"'), raw(duplicate),
    before.replace('"wallet":120', '"wallet":120,"__proto__":{"polluted":true}'),
    before.replace('"inventory":{', '"inventory":{"berry":0,'),
    before.replace('"pets":[', '"pets":[null,'),
  ];
  for (const text of bad) assert.throws(() => parseSave(text));
  assert.equal(raw(state), before);
  assert.equal(Object.prototype.polluted, undefined);
});

test('oversize and deeply nested saves fail safely before any state replacement', () => {
  const state = friend();
  assert.throws(() => parseSave(' '.repeat(100_001)), /too large/);
  const nested = '['.repeat(2000) + '0' + ']'.repeat(2000);
  assert.throws(() => parseSave(raw(state).replace('"wallet":120', `"wallet":${nested}`)), /whole number/);
  const wrong = structuredClone(state); wrong.pets = Array(100_000).fill(state.pets[0]);
  Object.defineProperty(wrong.pets, 0, { get() { throw new Error('oversized roster was traversed'); } });
  assert.throws(() => validateState(wrong), /room for up to/);
});

test('type-confused amounts, timestamps and identifiers fail atomically', () => {
  const state = friend();
  for (const amount of [null, undefined, true, '1', [], {}, NaN, Infinity, -Infinity, -1, 0, 0.1, Number.MAX_SAFE_INTEGER]) {
    unchangedAfterReject(state, (current) => deposit(current, amount, NOW));
    unchangedAfterReject(state, (current) => withdraw(current, amount, NOW));
  }
  for (const time of [null, true, '0', [], {}, NaN, Infinity, -1, 253402300800000]) {
    unchangedAfterReject(state, (current) => advanceTime(current, time));
  }
  for (const id of ['__proto__', 'constructor', null, [], {}]) unchangedAfterReject(state, (current) => selectPet(current, id, NOW));
});

test('clock rollback cannot replay rewards after a forward UTC boundary or add decay twice', () => {
  const epoch = adopt(createState(0), 'Dawn', 'moonfin', 0);
  let state = claimDaily(epoch, 0);
  state = claimDaily(state, 86_400_000);
  const before = raw(state);
  for (const time of [0, 1, 86_399_999, 86_400_000]) unchangedAfterReject(state, (current) => claimDaily(current, time), /already collected/);
  assert.equal(raw(advanceTime(state, 0)), before);
  const late = advanceTime(state, 253402300799999);
  assert.equal(late.lastUpdated, 253402300799999);
  assert.equal(readActivePet(late).stats.energy, 0);
  assert.equal(raw(advanceTime(late, 253402300799999)), raw(late));
});

test('a deterministic burst of 1500 interleaved transfers and game settlements remains bounded and serialisable', () => {
  let state = friend();
  let seed = 0x72af1189;
  for (let step = 0; step < 1500; step++) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    const mode = (seed >>> 0) % 3;
    const total = state.wallet + state.bank.balance;
    if (mode === 0 && state.wallet) state = deposit(state, 1 + ((seed >>> 3) % state.wallet), NOW);
    else if (mode === 1 && state.bank.balance) state = withdraw(state, 1 + ((seed >>> 3) % state.bank.balance), NOW);
    else state = claimGameReward(state, (seed >>> 0) % 101, NOW, (step % 2) ? 'memory' : 'firefly');
    assert.ok(state.wallet + state.bank.balance >= total);
    assert.ok(state.wallet + state.bank.balance <= 240);
    assert.ok(state.game.earned <= 120);
    assert.ok(readActivePet(state).xp <= 1999);
    if (step % 100 === 0) assert.deepEqual(parseSave(serialiseSave(state)), state);
  }
  assert.deepEqual(parseSave(serialiseSave(state)), state);
});

test('overlapping trail choices settle once and retain the awarded find after malformed replay', () => {
  let state = startTrail(friend(), 'whisperwood', NOW);
  const id = state.trails.active.id;
  for (let step = 0; step < 3; step++) {
    const choice = trailEncounter(state).choices[0].id;
    state = chooseTrail(state, id, step, choice, NOW);
    unchangedAfterReject(state, (current) => chooseTrail(current, id, step, choice, NOW), /already made|already ended/);
  }
  assert.equal(state.pets[0].trail.trips, 1);
  assert.equal(state.trails.collection.length, 1);
  assert.deepEqual(parseSave(serialiseSave(state)), state);
});

test('previously valid direction-control names remain playable across v1/v2/v3 imports without renaming', () => {
  // A stricter new-adoption rule must not strand an existing world in recovery.
  const current = friend(); current.pets[0].name = 'F\u202Eern';
  const previous = structuredClone(current); previous.version = 2; delete previous.trails;
  for (const pet of previous.pets) delete pet.trail;
  const old = { version: 1, pet: { name: current.pets[0].name, species: 'mossling', adoptedAt: NOW, stats: { ...current.pets[0].stats } },
    wallet: 120, inventory: { berry: 3, acorn: 2, ribbon: 1 }, lastUpdated: NOW,
    daily: { lastClaimDay: null }, game: { day: null, earned: 0 },
    counts: { adoptions: 1, feeds: 0, plays: 0, rests: 0, purchases: 0, dailyClaims: 0, games: 0 }, achievements: ['first-friend'] };
  for (const saved of [old, previous, current]) {
    const before = raw(saved);
    const imported = parseSave(before);
    assert.equal(readActivePet(imported).name, current.pets[0].name);
    assert.equal(readActivePet(parseSave(serialiseSave(imported))).name, current.pets[0].name);
    assert.equal(raw(saved), before);
  }
});
