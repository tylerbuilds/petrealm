import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, adopt, care, selectPet, advanceTime, startExpedition, claimExpedition, getExpeditionStatus,
  readCompanionStory, readReturnWelcome, serialiseSave, parseSave, validateState, EXPEDITION_ROUTES, TRAIL_TREASURES,
  setMembership, purchase, useExpansion, SPECIES, startBattle, battleAction, startTrail, displayTreasure, trailProgress } from '../src/model.js';
const NOW = Date.UTC(2026, 9, 10, 12);
const DAY = 86_400_000;
const friend = () => adopt(createState(NOW), 'Clover', 'mossling', NOW);
function returned(state, route = 'whisperwood', intent = 'notice') {
  const away = startExpedition(state, route, intent, state.lastUpdated);
  return claimExpedition(away, away.companionship.active.readyAt, away.companionship.active.id);
}
function rejectsUnchanged(state, operation) {
  const before = structuredClone(state);
  assert.throws(() => operation(state));
  assert.deepEqual(state, before);
}

test('first wander is free, all routes open, exact return boundary and no expiry after years', () => {
  for (const route of Object.keys(EXPEDITION_ROUTES)) {
    const original = friend(); original.pets[0].stats.energy = 0;
    let away = startExpedition(original, route, 'help', NOW);
    assert.equal(away.wallet, original.wallet);
    assert.deepEqual(away.pets, original.pets);
    assert.equal(away.companionship.active.readyAt, NOW + 30_000);
    assert.equal(getExpeditionStatus(away, NOW + 29_999).status, 'away');
    rejectsUnchanged(away, (s) => claimExpedition(s, NOW + 29_999, 1));
    assert.equal(getExpeditionStatus(away, NOW + 30_000).status, 'ready');
    away = parseSave(serialiseSave(away));
    const home = claimExpedition(away, NOW + 365 * DAY, 1);
    assert.equal(home.companionship.profiles[0].kindness, 3);
    assert.equal(home.companionship.profiles[0].trips, 1);
    assert.deepEqual(home.pets, original.pets);
    assert.equal(home.companionship.collection.length, 1);
    rejectsUnchanged(home, (s) => claimExpedition(s, home.lastUpdated, 1));
    const second = startExpedition(home, route, 'brave', home.lastUpdated);
    assert.equal(second.companionship.active.readyAt - home.lastUpdated, EXPEDITION_ROUTES[route].durationMs);
    rejectsUnchanged(second, (s) => claimExpedition(s, second.companionship.active.readyAt, 1));
  }
});

test('one global wander persists exactly and returns to its original companion after a switch', () => {
  let state = adopt(friend(), 'Ember', 'emberkit', NOW);
  state = selectPet(state, 'pet-1', NOW);
  state = startExpedition(state, 'windridge', 'brave', NOW);
  rejectsUnchanged(state, (s) => startExpedition(s, 'glowpool', 'help', NOW));
  state = selectPet(state, 'pet-2', NOW);
  assert.deepEqual(parseSave(serialiseSave(state)), state);
  const home = claimExpedition(state, NOW + 30_000, 1);
  assert.equal(home.activePetId, 'pet-2');
  assert.equal(readCompanionStory(home, 'pet-1').axes.courage, 3);
  assert.equal(readCompanionStory(home, 'pet-2').axes.courage, 0);
  assert.match(readCompanionStory(home, 'pet-1').memories[0].text, /Clover/);
});

test('learned traits respond permanently to real care and authors recall species and shared history', () => {
  let state = care(friend(), 'feed', 'berry', NOW);
  state = care(state, 'play', 'ribbon', NOW);
  state = care(state, 'rest', undefined, NOW);
  const before = readCompanionStory(state);
  assert.deepEqual(before.axes, { curiosity: 1, kindness: 2, courage: 0 });
  state = returned(state, 'glowpool', 'help');
  const story = readCompanionStory(state);
  assert.match(story.memories[0].text, /new leaf|shared snacks/);
  assert.equal(story.axes.kindness, 5);
  assert.deepEqual(readCompanionStory(advanceTime(state, NOW + 10 * 365 * DAY)), story);
  assert.match(readReturnWelcome(NOW, NOW + 365 * DAY).message, /Welcome home/);
  assert.equal(readReturnWelcome(NOW, NOW - DAY).awayMs, 0);
});

test('all keepsakes are discoverable, repeat finds stay unique, and new finds decorate the existing meadow', () => {
  let state = friend();
  for (const route of Object.keys(EXPEDITION_ROUTES)) for (let index = 0; index < 3; index += 1) state = returned(state, route, 'notice');
  assert.equal(state.companionship.collection.length, 9);
  assert.equal(readCompanionStory(state).memories.length, 3);
  assert.equal(readCompanionStory(state).completedTrips, 9);
  state = displayTreasure(state, 'wind-chime', 1, state.lastUpdated);
  assert.equal(state.trails.display[1], 'wind-chime');
  assert.equal(trailProgress(state).collection.length, 9);
  state = returned(state);
  assert.equal(state.companionship.collection.length, 9);
  assert.equal(state.companionship.profiles[0].trips, 10);
  assert.deepEqual(parseSave(serialiseSave(state)), state);
});

test('legacy v3 migration keeps old values and derives only supported care traits', () => {
  const original = care(friend(), 'play', 'ribbon', NOW);
  delete original.companionship;
  const imported = parseSave(JSON.stringify(original));
  const { companionship, ...previous } = imported;
  assert.deepEqual(previous, original);
  assert.equal(companionship.sequence, 0);
  assert.equal(companionship.profiles[0].curiosity, 1);
  assert.deepEqual(companionship.profiles[0].memories, []);
  assert.equal(validateState(original), true);
});

test('optional extension rejects forged counters, coercible identifiers, duplicates and impossible dates', () => {
  const active = startExpedition(friend(), 'whisperwood', 'notice', NOW);
  const completed = returned(friend());
  const cases = [
    [active, (s) => { s.companionship.extra = true; }],
    [active, (s) => { s.companionship.version = 2; }],
    [active, (s) => { s.companionship.active.routeId = ['whisperwood']; }],
    [active, (s) => { s.companionship.active.intent = ['notice']; }],
    [active, (s) => { s.companionship.active.readyAt += 1; }],
    [active, (s) => { s.companionship.active.petId = 'pet-99'; }],
    [active, (s) => { s.companionship.sequence = 2; }],
    [active, (s) => { s.companionship.profiles[0].curiosity = 101; }],
    [active, (s) => { s.companionship.profiles.push(s.companionship.profiles[0]); }],
    [completed, (s) => { s.companionship.collection.push(s.companionship.collection[0]); }],
    [completed, (s) => { s.companionship.profiles[0].memories[0].intent = ['notice']; }],
    [completed, (s) => { s.companionship.profiles[0].memories[0].at = NOW - 1; }],
    [completed, (s) => { s.companionship.last.memory.care = 'feeds'; }],
    [completed, (s) => { s.companionship.profiles[0].trips += 1; }],
  ];
  for (const [source, corrupt] of cases) {
    const invalid = structuredClone(source); corrupt(invalid);
    assert.throws(() => parseSave(JSON.stringify(invalid)));
  }
  for (const invalid of [null, [], {}, '__proto__', 'constructor']) rejectsUnchanged(friend(), (s) => startExpedition(s, invalid, 'notice', NOW));
  rejectsUnchanged(active, (s) => claimExpedition(s, NaN, 1));
  rejectsUnchanged(friend(), (s) => startExpedition(s, 'whisperwood', 'notice', 253402300799999));
});

test('battle and guided trail guard departure; absence and care still work during a wander', () => {
  rejectsUnchanged(startBattle(friend(), 'ashgrub', NOW), (s) => startExpedition(s, 'whisperwood', 'notice', NOW));
  rejectsUnchanged(startTrail(friend(), 'whisperwood', NOW), (s) => startExpedition(s, 'whisperwood', 'notice', NOW));
  const away = startExpedition(friend(), 'whisperwood', 'notice', NOW);
  const rested = care(away, 'rest', undefined, NOW);
  assert.equal(readCompanionStory(rested).axes.kindness, 1);
  assert.equal(getExpeditionStatus(advanceTime(rested, NOW + 30_000), NOW).status, 'ready');
});

test('26 Unicode companions with full memories and the largest arena log export within 32 KiB', (t) => {
  let state = setMembership(createState(NOW), 'explorer', NOW); state.wallet = 10000;
  for (let index = 0; index < 12; index += 1) state = useExpansion(purchase(state, 'lodge-deed', NOW), NOW);
  for (let index = 0; index < 26; index += 1) {
    state = adopt(state, '🌿'.repeat(24), Object.keys(SPECIES)[index % 9], state.lastUpdated);
    for (let trip = 0; trip < 4; trip += 1) state = returned(state, 'whisperwood', 'notice');
  }
  state = startBattle(state, 'ashgrub', state.lastUpdated);
  while (state.battle.status === 'active') state = battleAction(state, 'attack', state.lastUpdated);
  state.battle.log = Array.from({ length: 8 }, () => '界'.repeat(160));
  state = advanceTime(state, 253_402_300_199_999);
  for (const pet of state.pets) {
    pet.species = 'thistlehorn'; pet.personality = 'spirited'; pet.adoptedAt = state.lastUpdated;
    pet.xp = 1999; pet.level = 20;
    pet.stats = { satiety: 0.0000012345678901234567, happiness: 0.0000012345678901234567, energy: 0.0000012345678901234567 };
    pet.journey = { feeds: 38_461_538, plays: 38_461_538, rests: 38_461_538, trainings: 1_000_000_000, growth: 1 };
    pet.trail = { trips: 38_461_538, bond: 76_923_076 };
  }
  for (const key of ['feeds', 'plays', 'rests']) state.counts[key] = 999_999_988;
  state.achievements = ['first-friend', 'well-fed', 'playmate', 'sweet-dreams', 'shopper', 'devoted-carer'];
  state.trails = { sequence: 999_999_999, collection: Object.keys(TRAIL_TREASURES), display: ['seed-lantern', 'glass-pebble', 'wind-chime'],
    active: { id: 999_999_999, petId: 'pet-26', routeId: 'windridge', variant: 2, step: 2, choices: ['knack', 'knack'] },
    last: { id: 999_999_998, petId: 'pet-26', routeId: 'windridge', variant: 1, choices: ['help', 'observe', 'brave'], treasureId: 'cloud-kite', newFind: false, bondGain: 2, xpGain: 0 } };
  state.companionship.collection = Object.keys(TRAIL_TREASURES);
  state.companionship.sequence = 999_999_988;
  for (const [index, profile] of state.companionship.profiles.entries()) {
    profile.trips = 38_461_538;
    profile.curiosity = 100; profile.kindness = 100; profile.courage = 100;
    for (const [offset, memory] of profile.memories.entries()) {
      memory.id = (index + 1) * profile.trips - 2 + offset;
      memory.variant = (profile.trips - 3 + offset) % 3;
      memory.at = state.lastUpdated;
      memory.care = 'trainings';
    }
  }
  state.companionship.last = { petId: 'pet-26', memory: { ...state.companionship.profiles.at(-1).memories.at(-1) } };
  state.companionship.sequence += 1;
  state.companionship.active = { id: state.companionship.sequence, petId: 'pet-26', routeId: 'whisperwood', intent: 'notice', variant: 2,
    startedAt: state.lastUpdated, readyAt: state.lastUpdated + EXPEDITION_ROUTES.whisperwood.durationMs };
  const text = serialiseSave(state);
  assert.ok(new TextEncoder().encode(text).length <= 32768);
  t.diagnostic(`Full companion and trail journal: ${new TextEncoder().encode(text).length} bytes of 32768.`);
  assert.deepEqual(parseSave(text), state);
  assert.ok(state.companionship.profiles.every((profile) => profile.memories.length === 3));
});
