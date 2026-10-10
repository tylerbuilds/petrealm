import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPECIES, PERSONALITIES, MAX_XP, createState, adopt, care, claimDaily, claimGameReward,
  trainPet, growPet, growthProgress, readActivePet, selectPet, startBattle, battleAction, claimQuest,
  purchase, equipAccessory, setMembership, useExpansion, migrateState, parseSave,
  serialiseSave, validateState,
} from '../src/model.js';
import { creature } from '../src/art.js';
import { renderGarden, renderArena } from '../src/views.js';

const NOW = Date.parse('2026-10-10T12:00:00.000Z');
const friend = (id = 'briarhare', personality) => adopt(createState(NOW), 'Pip 🌿', id, NOW, personality);
const bytes = (state) => serialiseSave(state);
function readyFriend(id = 'briarhare') {
  let state = friend(id);
  state = care(state, 'feed', SPECIES[id].favourite || 'berry', NOW);
  state = care(state, 'play', 'ribbon', NOW);
  state = care(state, 'rest', undefined, NOW);
  state = claimDaily(state, NOW);
  for (const mode of ['firefly', 'memory', 'firefly']) state = claimGameReward(state, 100, NOW, mode);
  for (const quest of ['daily-play', 'daily-rest', 'daily-game']) state = claimQuest(state, quest, NOW);
  while (readActivePet(state).level < 3) {
    state = trainPet(state, NOW);
    state = care(state, 'rest', undefined, NOW);
  }
  return state;
}

test('every animal and monster adopts, earns its practice money, grows and completes a saved arena match', () => {
  for (const species of Object.values(SPECIES)) {
    let state = readyFriend(species.id);
    const before = structuredClone(state);
    assert.equal(growthProgress(state).ready, true, species.name);
    state = growPet(state, NOW);
    assert.equal(state.wallet, before.wallet - 60);
    assert.equal(readActivePet(state).xp, before.pets[0].xp + 40);
    assert.equal(readActivePet(state).personality, species.personality);
    assert.equal(readActivePet(state).journey.growth, 1);
    state = purchase(state, 'leafcap', NOW);
    state = equipAccessory(state, 'leafcap', 'head', NOW);
    state = startBattle(state, 'ashgrub', NOW);
    state = battleAction(state, 'attack', NOW);
    state = parseSave(bytes(state));
    while (state.battle.status === 'active') state = battleAction(state, 'attack', NOW);
    assert.equal(state.battle.status, 'won');
    assert.equal(state.battleWins.ashgrub, true);
    assert.deepEqual(parseSave(bytes(state)), state);
  }
});

test('personality and favourite snacks produce exact small care bonuses, with neutral legacy defaults', () => {
  for (const species of Object.values(SPECIES)) {
    for (const personality of Object.keys(PERSONALITIES)) {
      for (const food of ['berry', 'acorn']) {
        const original = friend(species.id, personality);
        original.pets[0].stats.happiness = 10;
        const next = care(original, 'feed', food, NOW);
        const base = food === 'berry' ? 6 : 3;
        const favourite = species.favourite === food ? 3 + (personality === 'curious' ? 2 : 0) : 0;
        assert.equal(readActivePet(next).stats.happiness, 10 + base + favourite);
        assert.equal(readActivePet(original).stats.happiness, 10);
      }
      const original = friend(species.id, personality);
      original.pets[0].stats.happiness = 10;
      assert.equal(readActivePet(care(original, 'play', 'ribbon', NOW)).stats.happiness, 30 + (personality === 'spirited' ? 3 : 0));
      assert.equal(readActivePet(care(original, 'rest', undefined, NOW)).stats.happiness, 13 + (personality === 'gentle' ? 3 : 0));
    }
  }
});

test('care milestones belong to the active friend and cannot be borrowed from another companion', () => {
  let state = readyFriend();
  state = adopt(state, 'New friend', 'gloomdrop', NOW);
  assert.deepEqual(readActivePet(state).journey, { feeds: 0, plays: 0, rests: 0, trainings: 0, growth: 0 });
  state.pets[1].xp = 200; state.pets[1].level = 3;
  const before = bytes(state);
  assert.throws(() => growPet(state, NOW), /Share a meal/);
  assert.equal(bytes(state), before);
  state = selectPet(state, 'pet-1', NOW);
  assert.equal(growthProgress(state).ready, true);
  assert.equal(readActivePet(growPet(state, NOW)).journey.growth, 1);
});

test('a first bloom has exact one-time costs and benefits and cannot replay after reload or clock rollback', () => {
  const original = readyFriend('cloudmoth');
  const after = growPet(original, NOW);
  assert.equal(after.wallet, original.wallet - 60);
  assert.equal(after.pets[0].xp, original.pets[0].xp + 40);
  assert.equal(after.pets[0].stats.energy, Math.min(100, original.pets[0].stats.energy + 10));
  assert.equal(after.pets[0].stats.happiness, Math.min(100, original.pets[0].stats.happiness + 10));
  assert.equal(original.pets[0].journey.growth, 0);
  const loaded = parseSave(bytes(after));
  for (const time of [NOW, NOW - 86_400_000, NOW + 86_400_000]) assert.throws(() => growPet(loaded, time), /already marked/);
  const beforeTraining = structuredClone(loaded);
  const trained = trainPet(loaded, NOW);
  assert.equal(trained.wallet, loaded.wallet - 20);
  assert.equal(trained.pets[0].xp, loaded.pets[0].xp + 24);
  assert.equal(trained.pets[0].journey.trainings, loaded.pets[0].journey.trainings + 1);
  assert.deepEqual(loaded, beforeTraining);
});

test('practice and growth reject unavailable resources, live matches and saturated counters atomically', () => {
  for (const mutate of [(s) => { s.wallet = 19; }, (s) => { s.pets[0].stats.energy = 11.99; }, (s) => { s.pets[0].xp = MAX_XP; s.pets[0].level = 20; }, (s) => { s.pets[0].journey.trainings = 1_000_000_000; }]) {
    const original = friend(); mutate(original); const before = bytes(original);
    assert.throws(() => trainPet(original, NOW)); assert.equal(bytes(original), before);
  }
  const ready = readyFriend(); ready.wallet = 59; const before = bytes(ready);
  assert.throws(() => growPet(ready, NOW), /60 pebbles/); assert.equal(bytes(ready), before);
  const match = startBattle(readyFriend(), 'ashgrub', NOW); const snapshot = bytes(match);
  for (const action of [trainPet, growPet]) { assert.throws(() => action(match, NOW), /Finish the current arena/); assert.equal(bytes(match), snapshot); }
  const almost = friend(); almost.pets[0].xp = MAX_XP - 2; almost.pets[0].level = 20;
  assert.equal(readActivePet(trainPet(almost, NOW)).xp, MAX_XP);
});

test('older v2 worlds retain every original field and active arena snapshot without fabricated individual history', () => {
  let original = readyFriend('mossling');
  original = purchase(original, 'leafcap', NOW);
  original = equipAccessory(original, 'leafcap', 'head', NOW);
  original = startBattle(original, 'ashgrub', NOW);
  original.version = 2;
  delete original.trails; delete original.companionship;
  for (const pet of original.pets) { delete pet.personality; delete pet.journey; delete pet.trail; }
  const raw = JSON.stringify(original); const migrated = parseSave(raw);
  assert.equal(JSON.stringify(original), raw);
  for (const key of Object.keys(original)) {
    if (!['pets', 'version'].includes(key)) assert.deepEqual(migrated[key], original[key], key);
  }
  assert.equal(migrated.version, 3);
  for (const [key, value] of Object.entries(original.pets[0])) assert.deepEqual(migrated.pets[0][key], value, key);
  assert.equal(migrated.pets[0].personality, 'steady');
  assert.deepEqual(migrated.pets[0].journey, { feeds: 0, plays: 0, rests: 0, trainings: 0, growth: 0 });
  assert.deepEqual(migrateState(migrated), migrated);
  assert.equal(battleAction(migrated, 'attack', NOW).battle.power, original.battle.power);
});

test('strict imports reject partial or impossible companion metadata and leave the world unchanged', () => {
  const original = friend(); const before = bytes(original);
  for (const change of [(p) => { delete p.journey; }, (p) => { delete p.personality; }, (p) => { p.personality = '__proto__'; }, (p) => { p.journey.extra = 1; }, (p) => { p.journey.feeds = 0.5; }, (p) => { p.journey.growth = 2; }, (p) => { p.journey.growth = 1; }, (p) => { p.journey.feeds = 1; }]) {
    const invalid = structuredClone(original); change(invalid.pets[0]); assert.throws(() => parseSave(JSON.stringify(invalid)));
  }
  assert.throws(() => adopt(original, 'Oops', 'briarhare', NOW, 'constructor'), /available personalities/);
  assert.equal(bytes(original), before);
});

test('the full 26-friend enriched Unicode world remains inside the established 32 KiB save bound', () => {
  let state = setMembership(createState(NOW), 'explorer', NOW); state.wallet = 10000;
  for (let i = 0; i < 12; i += 1) state = useExpansion(purchase(state, 'lodge-deed', NOW), NOW);
  const species = Object.keys(SPECIES);
  for (let i = 0; i < 26; i += 1) state = adopt(state, '🌿'.repeat(24), species[i % species.length], NOW, 'spirited');
  for (const pet of state.pets) {
    pet.xp = 1999; pet.level = 20;
    pet.journey = { feeds: 38_461_538, plays: 38_461_538, rests: 38_461_538, trainings: 1_000_000_000, growth: 1 };
  }
  for (const key of ['feeds', 'plays', 'rests']) state.counts[key] = 999_999_988;
  state.achievements = ['first-friend', 'well-fed', 'playmate', 'sweet-dreams', 'shopper', 'devoted-carer'];
  assert.equal(validateState(state), true);
  const raw = bytes(state); assert.ok(new TextEncoder().encode(raw).length < 32768);
  assert.deepEqual(parseSave(raw), state);
  assert.throws(() => adopt(state, 'Overflow', 'kilnback', NOW), /lodge is full/);
});

test('grown species and wardrobe remain visible in the garden, family and actual battle view', () => {
  for (const species of Object.keys(SPECIES)) {
    let state = growPet(readyFriend(species), NOW);
    const plain = creature(species); const grown = creature(species, 'Grown companion', {}, true);
    assert.notEqual(grown, plain); assert.match(grown, /data-growth="bloomed"/);
    assert.doesNotMatch(grown, /(?:href=|<foreignObject|<script)/);
    assert.match(renderGarden(state), new RegExp(`data-creature="${species}" data-growth="bloomed"`));
    state = purchase(state, 'leafcap', NOW); state = equipAccessory(state, 'leafcap', 'head', NOW);
    state = startBattle(state, 'ashgrub', NOW);
    assert.match(renderArena(state), new RegExp(`data-creature="${species}" data-growth="bloomed"`));
    assert.match(creature(species, 'Dressed companion', readActivePet(state).wearing, true), /fill="#57754d"/);
  }
});
