import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPECIES, MAX_XP, TRAIL_ROUTES, TRAIL_TREASURES, createState, adopt, selectPet,
  readActivePet, care, purchase, trainPet, claimDaily, claimGameReward,
  startBattle, battleAction, setMembership, useExpansion, validateState, migrateState,
  parseSave, serialiseSave, startTrail, chooseTrail, leaveTrail, displayTreasure,
  trailProgress, trailEncounter,
} from '../src/model.js';
import { PERSONALITY_APPROACHES, findForApproach } from '../src/trails.js';

const NOW = Date.parse('2026-10-10T12:00:00.000Z');
const bytes = (state) => JSON.stringify(state);
const friend = (personality = 'steady', species = 'mossling') => adopt(createState(NOW), 'Fern', species, NOW, personality);
function complete(state, routeId = 'whisperwood', choose = (scene) => scene.choices[0]) {
  let next = startTrail(state, routeId, NOW);
  for (let step = 0; step < 3; step += 1) next = chooseTrail(next, next.trails.active.id, step, choose(trailEncounter(next), next).id, NOW);
  return next;
}
function rejectedWithoutChange(state, operation, pattern) {
  const before = bytes(state);
  assert.throws(() => operation(state), pattern);
  assert.equal(bytes(state), before);
}

test('an outing is three actual choices, pays its fixed cost once and settles only on completion', () => {
  const original = friend(); const before = bytes(original);
  let state = startTrail(original, 'whisperwood', NOW);
  assert.equal(bytes(original), before);
  assert.equal(state.version, 3);
  assert.equal(readActivePet(state).stats.energy, 79);
  assert.equal(readActivePet(state).stats.satiety, 83);
  assert.deepEqual(readActivePet(state).trail, { trips: 0, bond: 0 });
  assert.deepEqual(state.trails.collection, []);
  const id = state.trails.active.id;
  for (let step = 0; step < 2; step += 1) {
    const scene = trailEncounter(state);
    assert.equal(scene.choices.length, 2);
    assert.equal(new Set(scene.choices.map((choice) => choice.outcome)).size, 2);
    const selected = scene.choices[0];
    state = chooseTrail(state, id, step, selected.id, NOW);
    assert.equal(trailEncounter(state).previousOutcome, selected.outcome);
    assert.equal(readActivePet(state).xp, 0);
    assert.deepEqual(state.trails.collection, []);
  }
  state = chooseTrail(state, id, 2, 'observe', NOW);
  assert.equal(state.trails.active, null);
  assert.equal(state.trails.last.treasureId, 'fern-flute');
  assert.equal(state.trails.last.newFind, true);
  assert.equal(state.trails.last.xpGain, 12);
  assert.deepEqual(readActivePet(state).trail, { trips: 1, bond: 2 });
  assert.equal(readActivePet(state).stats.happiness, 90);
  assert.equal(state.wallet, original.wallet);
  for (const key of ['counts', 'quests', 'questLog', 'bank', 'game', 'inventory']) assert.deepEqual(state[key], original[key], key);
  assert.equal(trailProgress(state).routes.find((route) => route.id === 'glowpool').ready, true);
});

test('different real approaches change reactions, the find and the personality bond bonus', () => {
  const cautious = complete(friend(), 'whisperwood', (scene) => scene.choices.find((choice) => choice.id === 'observe') ?? scene.choices[0]);
  const bold = complete(friend(), 'whisperwood', (scene) => scene.choices.find((choice) => choice.id === 'brave' || choice.id === 'explore'));
  assert.equal(cautious.trails.last.bondGain, 2);
  assert.equal(bold.trails.last.bondGain, 1);
  assert.equal(cautious.trails.last.treasureId, 'fern-flute');
  assert.equal(bold.trails.last.treasureId, 'seed-lantern');
  assert.notDeepEqual(cautious.trails.last.choices, bold.trails.last.choices);
  for (const [personality, preferred] of Object.entries(PERSONALITY_APPROACHES)) {
    const state = complete(friend(personality), 'whisperwood', (scene) => scene.choices.find((choice) => choice.kind === preferred) ?? scene.choices[0]);
    assert.equal(state.trails.last.bondGain, 2, personality);
    assert.equal(trailProgress(state).preferred, preferred);
  }
});

test('repeat visits change stories, duplicate finds still bond, and all nine treasures are playable discoveries', () => {
  let state = friend();
  const titles = [];
  for (let visit = 0; visit < 3; visit += 1) {
    state = startTrail(state, 'whisperwood', NOW);
    titles.push(trailEncounter(state).title);
    for (let step = 0; step < 3; step += 1) state = chooseTrail(state, state.trails.active.id, step, trailEncounter(state).choices[0].id, NOW);
  }
  assert.equal(new Set(titles).size, 3);
  const bondBefore = readActivePet(state).trail.bond;
  state = complete(state);
  assert.equal(state.trails.last.newFind, false);
  assert.equal(readActivePet(state).trail.bond, bondBefore + state.trails.last.bondGain);
  for (const routeId of Object.keys(TRAIL_ROUTES)) {
    for (let visit = 0; visit < 12 && !TRAIL_ROUTES[routeId].treasures.every((id) => state.trails.collection.includes(id)); visit += 1) {
      state = care(state, 'rest', null, NOW);
      state = complete(state, routeId, (scene, current) => {
        if (scene.step < 2) return scene.choices.find((choice) => choice.kind === 'observe') ?? scene.choices[0];
        return scene.choices.find((choice) => !current.trails.collection.includes(findForApproach(routeId, current.trails.active.variant, choice.kind))) ?? scene.choices[0];
      });
    }
    assert.ok(TRAIL_ROUTES[routeId].treasures.every((id) => state.trails.collection.includes(id)), routeId);
  }
  assert.equal(state.trails.collection.length, 9);
  assert.equal(validateState(state), true);
  assert.deepEqual(parseSave(serialiseSave(state)), state);
});

test('bond belongs to each companion, unlocks routes and adds a usable personality knack', () => {
  let state = complete(complete(friend('gentle')));
  assert.equal(readActivePet(state).trail.bond, 4);
  assert.equal(trailProgress(state).knack, true);
  state = startTrail(state, 'windridge', NOW);
  const scene = trailEncounter(state);
  assert.equal(scene.choices.length, 3);
  assert.equal(scene.choices[2].id, 'knack');
  assert.equal(scene.choices[2].kind, 'help');
  for (let step = 0; step < 3; step += 1) state = chooseTrail(state, state.trails.active.id, step, 'knack', NOW);
  assert.equal(state.trails.last.bondGain, 2);
  assert.equal(state.trails.last.treasureId, findForApproach('windridge', 2, 'help'));
  const experienced = readActivePet(state).id;
  state = adopt(state, 'New friend', 'emberkit', NOW, 'curious');
  assert.deepEqual(readActivePet(state).trail, { trips: 0, bond: 0 });
  assert.equal(trailProgress(state).knack, false);
  assert.equal(trailProgress(state).routes.find((route) => route.id === 'windridge').unlocked, false);
  rejectedWithoutChange(state, (current) => startTrail(current, 'glowpool', NOW), /Build 2 bond/);
  state = selectPet(state, experienced, NOW);
  assert.equal(trailProgress(state).routes.every((route) => route.unlocked), true);
});

test('saved outings resume exactly, and stale steps, double completion and old run IDs fail atomically', () => {
  let state = startTrail(friend(), 'whisperwood', NOW);
  const first = state.trails.active.id;
  state = chooseTrail(state, first, 0, 'help', NOW);
  const resumed = parseSave(serialiseSave(state));
  assert.deepEqual(resumed, state);
  assert.equal(trailEncounter(resumed).previousOutcome, trailEncounter(state).previousOutcome);
  rejectedWithoutChange(resumed, (current) => chooseTrail(current, first, 0, 'explore', NOW), /already made/);
  state = chooseTrail(resumed, first, 1, 'observe', NOW);
  state = chooseTrail(state, first, 2, 'observe', NOW);
  rejectedWithoutChange(state, (current) => chooseTrail(current, first, 2, 'observe', NOW), /already ended/);
  rejectedWithoutChange(state, (current) => leaveTrail(current, first, NOW), /already ended/);
  state = startTrail(state, 'glowpool', NOW);
  assert.ok(state.trails.active.id > first);
  rejectedWithoutChange(state, (current) => chooseTrail(current, first, 0, 'help', NOW), /already ended/);
  rejectedWithoutChange(state, (current) => chooseTrail(current, state.trails.active.id, 0.5, 'help', NOW), /whole number/);
  rejectedWithoutChange(state, (current) => chooseTrail(current, state.trails.active.id, 0, 'knack', NOW), /shown/);
});

test('heading home never refunds the cost or grants an unfinished reward', () => {
  const original = friend();
  let state = startTrail(original, 'whisperwood', NOW);
  state = chooseTrail(state, state.trails.active.id, 0, 'help', NOW);
  const id = state.trails.active.id;
  state = leaveTrail(state, id, NOW);
  assert.equal(state.trails.active, null);
  assert.equal(state.trails.last, null);
  assert.deepEqual(state.trails.collection, []);
  assert.deepEqual(readActivePet(state).trail, { trips: 0, bond: 0 });
  assert.equal(readActivePet(state).xp, 0);
  assert.equal(readActivePet(state).stats.energy, original.pets[0].stats.energy - 6);
  assert.equal(readActivePet(state).stats.satiety, original.pets[0].stats.satiety - 2);
  rejectedWithoutChange(state, (current) => leaveTrail(current, id, NOW), /already ended/);
  const restarted = startTrail(state, 'whisperwood', NOW);
  assert.equal(restarted.trails.active.variant, 0);
  assert.equal(restarted.trails.active.id, id + 1);
});

test('an outing keeps its companion while the existing care, economy and games stay usable', () => {
  let state = adopt(friend(), 'Bramble', 'briarhare', NOW);
  state = startTrail(state, 'whisperwood', NOW);
  rejectedWithoutChange(state, (current) => selectPet(current, 'pet-1', NOW), /Finish your current trail/);
  rejectedWithoutChange(state, (current) => adopt(current, 'Other', 'mossling', NOW), /Finish your current trail/);
  rejectedWithoutChange(state, (current) => startBattle(current, 'ashgrub', NOW), /Finish your current trail/);
  const run = structuredClone(state.trails.active);
  state = care(state, 'feed', 'berry', NOW);
  state = care(state, 'rest', null, NOW);
  state = purchase(state, 'acorn', NOW);
  state = trainPet(state, NOW);
  state = claimDaily(state, NOW);
  state = claimGameReward(state, 100, NOW, 'memory');
  assert.deepEqual(state.trails.active, run);
  assert.deepEqual(readActivePet(state).trail, { trips: 0, bond: 0 });
  assert.equal(validateState(state), true);
  const arena = startBattle(friend(), 'ashgrub', NOW);
  rejectedWithoutChange(arena, (current) => startTrail(current, 'whisperwood', NOW), /Finish the current arena/);
});

test('display places move only discovered treasures, persist and never create duplicate props or rewards', () => {
  let state = complete(friend());
  const id = state.trails.collection[0];
  state = displayTreasure(state, id, 0, NOW);
  assert.deepEqual(state.trails.display, [id, null, null]);
  state = displayTreasure(state, id, 2, NOW);
  assert.deepEqual(state.trails.display, [null, null, id]);
  const before = bytes(state);
  assert.equal(bytes(displayTreasure(state, id, 2, NOW)), before);
  assert.deepEqual(parseSave(serialiseSave(state)), state);
  rejectedWithoutChange(state, (current) => displayTreasure(current, 'wind-chime', 1, NOW), /found on an outing/);
  rejectedWithoutChange(state, (current) => displayTreasure(current, id, 3, NOW), /whole number/);
  rejectedWithoutChange(state, (current) => displayTreasure(current, id, 0.5, NOW), /whole number/);
  const cleared = displayTreasure(state, null, 2, NOW);
  assert.deepEqual(cleared.trails.display, [null, null, null]);
  assert.deepEqual(cleared.pets, state.pets);
  assert.deepEqual(cleared.trails.collection, state.trails.collection);
});

test('v2 migration keeps every old value and adds zero outing history without mutating original bytes', () => {
  let current = claimGameReward(care(friend('curious', 'cloudmoth'), 'feed', 'acorn', NOW), 100, NOW, 'memory');
  current = startBattle(current, 'ashgrub', NOW);
  const old = structuredClone(current);
  old.version = 2; delete old.trails; delete old.companionship;
  for (const pet of old.pets) delete pet.trail;
  const raw = `${JSON.stringify(old, null, 4)}\n`;
  assert.equal(validateState(old), true);
  const next = parseSave(raw);
  assert.equal(next.version, 3);
  for (const [key, value] of Object.entries(old)) {
    if (key === 'version') continue;
    if (key === 'pets') for (const [index, pet] of value.entries()) for (const [field, previous] of Object.entries(pet)) assert.deepEqual(next.pets[index][field], previous, field);
    else assert.deepEqual(next[key], value, key);
  }
  assert.deepEqual(next.pets[0].trail, { trips: 0, bond: 0 });
  assert.deepEqual(next.trails, { sequence: 0, collection: [], display: [null, null, null], active: null, last: null });
  assert.equal(`${JSON.stringify(old, null, 4)}\n`, raw);
  assert.deepEqual(migrateState(next), next);
  const disguised = structuredClone(next); disguised.version = 2;
  assert.throws(() => validateState(disguised), /missing or aren’t recognised/);
});

test('strict v3 imports reject missing, invented, partial, unavailable and inconsistent outing history', () => {
  const initial = friend();
  const completeState = complete(initial);
  const active = chooseTrail(startTrail(completeState, 'glowpool', NOW), 2, 0, 'help', NOW);
  const mutations = [
    [initial, (state) => { delete state.trails; }],
    [initial, (state) => { delete state.pets[0].trail; }],
    [initial, (state) => { state.trails.sequence = 0.5; }],
    [initial, (state) => { state.trails.collection = ['fern-flute']; }],
    [initial, (state) => { state.trails.display = [null, null]; }],
    [completeState, (state) => { state.trails.collection.push(state.trails.collection[0]); }],
    [completeState, (state) => { state.trails.display = ['fern-flute', 'fern-flute', null]; }],
    [completeState, (state) => { state.trails.last.bondGain = 1; }],
    [completeState, (state) => { state.trails.last.treasureId = 'pond-crown'; }],
    [completeState, (state) => { state.trails.last.xpGain = 13; }],
    [completeState, (state) => { state.trails.last.xpGain = 0; }],
    [completeState, (state) => { state.pets[0].trail.bond = 3; }],
    [active, (state) => { state.trails.active.id = 1; }],
    [active, (state) => { state.trails.sequence = 1; state.trails.active.id = 1; }],
    [active, (state) => { state.trails.active.variant = 0; }],
    [active, (state) => { state.trails.active.step = 2; }],
    [active, (state) => { state.trails.active.choices = ['knack']; }],
    [active, (state) => { state.trails.active.routeId = 'windridge'; }],
    [active, (state) => { state.trails.active.petId = 'pet-2'; }],
  ];
  for (const [source, change] of mutations) {
    const invalid = structuredClone(source); change(invalid);
    assert.throws(() => parseSave(bytes(invalid)));
    assert.equal(validateState(source), true);
  }
});

test('resource, integer and counter boundaries reject before any cost, while capped XP reports actual gain', () => {
  for (const [energy, fullness] of [[9.999, 85], [85, 1.999]]) {
    const state = friend(); state.pets[0].stats.energy = energy; state.pets[0].stats.satiety = fullness;
    assert.equal(trailProgress(state).routes[0].ready, false);
    rejectedWithoutChange(state, (current) => startTrail(current, 'whisperwood', NOW), /needs/);
  }
  const exact = friend(); exact.pets[0].stats.energy = 10; exact.pets[0].stats.satiety = 2;
  const started = startTrail(exact, 'whisperwood', NOW);
  assert.equal(readActivePet(started).stats.energy, 4);
  assert.equal(readActivePet(started).stats.satiety, 0);
  const fullSequence = friend(); fullSequence.trails.sequence = 1_000_000_000;
  rejectedWithoutChange(fullSequence, (current) => startTrail(current, 'whisperwood', NOW), /journal is full/);
  const saturated = complete(friend());
  saturated.pets[0].trail = { trips: 999_999_999, bond: 999_999_999 };
  saturated.trails.sequence = 1_000_000_000;
  saturated.trails.last.id = 999_999_999;
  saturated.trails.last.variant = 2;
  saturated.trails.last.choices = ['explore', 'brave', 'observe'];
  saturated.trails.last.treasureId = 'seed-lantern';
  saturated.trails.last.bondGain = 2;
  saturated.trails.collection = ['seed-lantern'];
  assert.equal(validateState(saturated), true);
  rejectedWithoutChange(saturated, (current) => startTrail(current, 'whisperwood', NOW), /journal is full/);
  const nearXp = friend(); nearXp.pets[0].xp = MAX_XP - 3; nearXp.pets[0].level = 20;
  let completed = complete(nearXp);
  assert.equal(readActivePet(completed).xp, MAX_XP);
  assert.equal(completed.trails.last.xpGain, 3);
  completed = complete(completed);
  assert.equal(completed.trails.last.xpGain, 0);
  assert.equal(readActivePet(completed).xp, MAX_XP);
});

test('the largest Unicode family and bounded trail records remain inside 32 KiB', () => {
  let state = setMembership(createState(NOW), 'explorer', NOW); state.wallet = 10000;
  for (let index = 0; index < 12; index += 1) state = useExpansion(purchase(state, 'lodge-deed', NOW), NOW);
  for (let index = 0; index < 26; index += 1) state = adopt(state, '🌿'.repeat(24), Object.keys(SPECIES)[index % 9], NOW, 'spirited');
  state = startBattle(state, 'ashgrub', NOW);
  while (state.battle.status === 'active') state = battleAction(state, 'attack', NOW);
  state.battle.log = Array.from({ length: 8 }, () => '界'.repeat(160));
  for (const pet of state.pets) {
    pet.xp = MAX_XP; pet.level = 20;
    pet.stats = { satiety: 99.12345678901234, happiness: 99.12345678901234, energy: 99.12345678901234 };
    pet.journey = { feeds: 38_461_538, plays: 38_461_538, rests: 38_461_538, trainings: 1_000_000_000, growth: 1 };
    pet.trail = { trips: 38_461_538, bond: 76_923_076 };
  }
  for (const key of ['feeds', 'plays', 'rests']) state.counts[key] = 999_999_988;
  state.achievements = ['first-friend', 'well-fed', 'playmate', 'sweet-dreams', 'shopper', 'devoted-carer'];
  state.trails = { sequence: 999_999_999, collection: Object.keys(TRAIL_TREASURES), display: ['seed-lantern', 'glass-pebble', 'wind-chime'],
    active: { id: 999_999_999, petId: 'pet-26', routeId: 'windridge', variant: 2, step: 2, choices: ['knack', 'knack'] },
    last: { id: 999_999_998, petId: 'pet-26', routeId: 'windridge', variant: 1, choices: ['help', 'observe', 'brave'], treasureId: 'cloud-kite', newFind: false, bondGain: 2, xpGain: 0 } };
  const raw = serialiseSave(state);
  assert.ok(new TextEncoder().encode(raw).length <= 32768);
  assert.deepEqual(parseSave(raw), state);
  assert.equal(state.trails.active.choices.length, 2);
  assert.equal(state.trails.last.choices.length, 3);
  assert.equal(state.trails.collection.length, 9);
});
