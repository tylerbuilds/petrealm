import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, QUESTS, OPPONENTS, MAX_XP, XP_PER_LEVEL,
  createState, adopt, readActivePet, selectPet, advanceTime, care, purchase,
  deposit, withdraw, equipAccessory, claimQuest, questProgress, claimGameReward,
  startBattle, battleAction, setMembership, claimLodgeParcel, useExpansion,
  petCapacity, levelForXp, parseSave, serialiseSave, validateState, migrateState,
} from '../src/model.js';

const NOW = Date.parse('2026-10-09T12:00:00.000Z');
const DAY = 86_400_000;
const pet = () => adopt(createState(NOW), 'Fern', 'mossling', NOW);

function legacySave() {
  return {
    version: 1,
    pet: { name: 'Fern', species: 'mossling', adoptedAt: NOW - DAY, stats: { satiety: 70, happiness: 60, energy: 50 } },
    wallet: 91,
    inventory: { berry: 1, acorn: 0, ribbon: 1 },
    lastUpdated: NOW,
    daily: { lastClaimDay: '2026-10-09' },
    game: { day: '2026-10-09', earned: 60 },
    counts: { adoptions: 1, feeds: 2, plays: 1, rests: 3, purchases: 1, dailyClaims: 1, games: 2 },
    achievements: ['first-friend', 'well-fed', 'playmate', 'sweet-dreams', 'shopper', 'daily-visitor', 'game-on'],
  };
}

function winBattle(state, id = 'ashgrub') {
  let next = startBattle(state, id, state.lastUpdated);
  while (next.battle.status === 'active') next = battleAction(next, 'attack', next.lastUpdated);
  assert.equal(next.battle.status, 'won');
  return next;
}

test('exact v1 saves migrate without changing their economy, activity, clock or pet stats', () => {
  const old = legacySave();
  const before = JSON.stringify(old);
  const next = parseSave(JSON.stringify(old));
  assert.equal(next.version, 2);
  assert.equal(next.wallet, old.wallet);
  assert.equal(next.lastUpdated, old.lastUpdated);
  assert.deepEqual(readActivePet(next).stats, old.pet.stats);
  assert.equal(readActivePet(next).adoptedAt, old.pet.adoptedAt);
  assert.equal(readActivePet(next).name, old.pet.name);
  assert.equal(readActivePet(next).xp, 0);
  assert.equal(readActivePet(next).level, 1);
  for (const [id, value] of Object.entries(old.inventory)) assert.equal(next.inventory[id], value);
  for (const [id, value] of Object.entries(old.counts)) assert.equal(next.counts[id], value);
  assert.deepEqual(next.daily, old.daily);
  assert.equal(next.game.earned, old.game.earned);
  assert.equal(next.game.rounds.firefly, 2);
  assert.deepEqual(next.achievements, old.achievements);
  assert.deepEqual(next.membership, { tier: 'free', lastParcelDay: null });
  assert.equal(next.quests.daily.feeds, 0, 'old feeds do not invent today’s quest progress');
  assert.equal(JSON.stringify(old), before);
  assert.equal(JSON.parse(serialiseSave(old)).version, 2);
  assert.deepEqual(migrateState(next), next);
  const empty = legacySave();
  empty.pet = null;
  empty.counts = { adoptions: 0, feeds: 0, plays: 0, rests: 0, purchases: 0, dailyClaims: 0, games: 0 };
  empty.daily.lastClaimDay = null;
  empty.game = { day: null, earned: 0 };
  empty.achievements = [];
  assert.deepEqual(parseSave(JSON.stringify(empty)).pets, []);
  const invalid = legacySave();
  invalid.inventory.leafcap = 1;
  assert.throws(() => parseSave(JSON.stringify(invalid)), /unknown fields/);
});

test('the roster follows free/explorer capacities, has stable IDs and independent active care', () => {
  let state = pet();
  state = adopt(state, 'Cinder', 'emberkit', NOW);
  assert.equal(state.activePetId, 'pet-2');
  const beforeFirst = { ...state.pets[0].stats };
  state = care(state, 'feed', 'berry', NOW);
  assert.deepEqual(state.pets[0].stats, beforeFirst);
  assert.equal(state.pets[1].stats.satiety, 100);
  state = selectPet(state, 'pet-1', NOW);
  assert.equal(readActivePet(state).name, 'Fern');
  assert.throws(() => selectPet(state, 'pet-99', NOW), /adopted companions/);
  for (let index = 3; index <= 7; index += 1) state = adopt(state, `Friend ${index}`, 'moonfin', NOW);
  assert.equal(petCapacity(state), 7);
  assert.throws(() => adopt(state, 'Too many', 'mossling', NOW), /lodge is full/);
  state = setMembership(state, 'explorer', NOW);
  for (let index = 8; index <= 14; index += 1) state = adopt(state, `Friend ${index}`, 'mossling', NOW);
  assert.equal(petCapacity(state), 14);
  assert.throws(() => adopt(state, 'Too many', 'mossling', NOW), /lodge is full/);
  assert.throws(() => setMembership(state, 'free', NOW), /current lodge capacity/);
  const decayed = advanceTime(state, NOW + 3_600_000);
  for (let index = 0; index < state.pets.length; index += 1) {
    assert.equal(decayed.pets[index].stats.energy, state.pets[index].stats.energy - 1);
  }
  assert.deepEqual(parseSave(serialiseSave(state)), state);
});

test('lodge parcels are once per UTC day and cannot be replayed by changing membership', () => {
  assert.throws(() => claimLodgeParcel(createState(NOW), NOW), /Join the explorer/);
  let state = setMembership(createState(NOW), 'explorer', NOW);
  state = claimLodgeParcel(state, NOW);
  assert.equal(state.wallet, 140);
  assert.equal(state.inventory.berry, 4);
  assert.equal(state.counts.lodgeParcels, 1);
  assert.throws(() => claimLodgeParcel(state, NOW), /already collected/);
  state = setMembership(state, 'free', NOW);
  state = setMembership(state, 'explorer', NOW);
  assert.throws(() => claimLodgeParcel(state, NOW - DAY), /already collected/);
  state = parseSave(serialiseSave(state));
  assert.throws(() => claimLodgeParcel(state, NOW), /already collected/);
  state = claimLodgeParcel(state, NOW + DAY);
  assert.equal(state.wallet, 160);
  assert.equal(state.inventory.berry, 5);
  assert.equal(state.counts.lodgeParcels, 2);
  assert.throws(() => setMembership(state, 'premium', NOW), /free or explorer/);
});

test('expansion deeds use the fixed shop price, are consumed, and permit at most 26 companions', () => {
  let state = setMembership(pet(), 'explorer', NOW);
  assert.equal(ITEMS['lodge-deed'].price, 250);
  assert.throws(() => purchase(state, 'lodge-deed', NOW), /250 pebbles/);
  assert.throws(() => useExpansion(state, NOW), /Buy a lodge deed/);
  // A high-balance imported save represents prior play; expansion behaviour is
  // still tested through the real shop deduction and consumable action.
  state.wallet = 4000;
  for (let index = 0; index < 12; index += 1) {
    state = purchase(state, 'lodge-deed', NOW);
    state = useExpansion(state, NOW);
  }
  assert.equal(state.wallet, 1000);
  assert.equal(state.inventory['lodge-deed'], 0);
  assert.equal(state.expansions, 12);
  assert.equal(state.counts.expansionsUsed, 12);
  assert.equal(petCapacity(state), 26);
  assert.throws(() => useExpansion(state, NOW), /maximum 12/);
  for (let index = 2; index <= 26; index += 1) state = adopt(state, `Pet ${index}`, 'moonfin', NOW);
  assert.equal(state.pets[25].id, 'pet-26');
  assert.throws(() => adopt(state, 'Overflow', 'moonfin', NOW), /lodge is full/);
  assert.deepEqual(parseSave(serialiseSave(state)), state);
});

test('accessory ownership and slots are enforced across companions without consuming owned copies', () => {
  let state = purchase(pet(), 'leafcap', NOW);
  state = equipAccessory(state, 'leafcap', 'head', NOW);
  assert.equal(readActivePet(state).wearing.head, 'leafcap');
  assert.equal(state.inventory.leafcap, 1);
  assert.throws(() => equipAccessory(state, 'leafcap', 'neck', NOW), /neck slot/);
  assert.throws(() => equipAccessory(state, 'ribbon', 'head', NOW), /head slot/);
  state = adopt(state, 'Cinder', 'emberkit', NOW);
  const before = serialiseSave(state);
  assert.throws(() => equipAccessory(state, 'leafcap', 'head', NOW), /another copy/);
  assert.equal(serialiseSave(state), before);
  state = selectPet(state, 'pet-1', NOW);
  state = equipAccessory(state, null, 'head', NOW);
  state = selectPet(state, 'pet-2', NOW);
  state = equipAccessory(state, 'leafcap', 'head', NOW);
  assert.equal(state.pets[0].wearing.head, null);
  assert.equal(state.pets[1].wearing.head, 'leafcap');
  assert.equal(state.inventory.leafcap, 1);
});

test('bank transfers conserve pebbles and reject invalid or unavailable amounts atomically', () => {
  const original = createState(NOW);
  let state = deposit(original, 50, NOW);
  assert.equal(original.wallet, 120);
  assert.deepEqual([state.wallet, state.bank.balance], [70, 50]);
  state = withdraw(state, 20, NOW);
  assert.deepEqual([state.wallet, state.bank.balance], [90, 30]);
  assert.equal(state.wallet + state.bank.balance, 120);
  assert.equal(state.counts.bankDeposits, 1);
  assert.equal(state.counts.bankWithdrawals, 1);
  const before = serialiseSave(state);
  for (const amount of [0, -1, 0.5, NaN, Infinity, '1']) {
    assert.throws(() => deposit(state, amount, NOW), /Deposit/);
    assert.throws(() => withdraw(state, amount, NOW), /Withdrawal/);
  }
  assert.throws(() => deposit(state, 91, NOW), /wallet/);
  assert.throws(() => withdraw(state, 31, NOW), /bank/);
  assert.equal(serialiseSave(state), before);
  state = deposit(state, 90, NOW);
  assert.throws(() => purchase(state, 'berry', NOW), /12 pebbles/);
});

test('daily feast uses real feeds on the current UTC day and rewards once per day', () => {
  let state = pet();
  assert.throws(() => claimQuest(state, 'daily-feast', NOW), /Complete the quest/);
  for (let index = 0; index < 3; index += 1) state = care(state, 'feed', 'berry', NOW);
  assert.deepEqual(questProgress(state, 'daily-feast', NOW), { id: 'daily-feast', progress: 3, target: 3, ready: true, claimed: false, reward: 25, xp: 10 });
  state = claimQuest(state, 'daily-feast', NOW);
  assert.equal(state.wallet, 145);
  assert.equal(readActivePet(state).xp, 22);
  assert.throws(() => claimQuest(state, 'daily-feast', NOW), /already claimed/);
  assert.throws(() => claimQuest(state, 'daily-feast', NOW - DAY), /already claimed/);
  state = advanceTime(state, NOW + DAY);
  assert.equal(questProgress(state, 'daily-feast', NOW + DAY).progress, 0);
  assert.equal(questProgress(state, 'daily-feast', NOW + DAY).claimed, false);
  state = purchase(state, 'berry', NOW + DAY);
  state = care(state, 'feed', 'acorn', NOW + DAY);
  state = care(state, 'feed', 'acorn', NOW + DAY);
  state = care(state, 'feed', 'berry', NOW + DAY);
  state = claimQuest(state, 'daily-feast', NOW + DAY);
  assert.equal(state.counts.questsClaimed, 2);
});

test('permanent quests enforce thresholds and preserve their claim ledger through save reloads', () => {
  let state = pet();
  assert.throws(() => claimQuest(state, 'growing-family', NOW), /Complete the quest/);
  state = adopt(state, 'Cinder', 'emberkit', NOW);
  state = claimQuest(state, 'growing-family', NOW);
  assert.equal(state.wallet, 150);
  state = claimGameReward(state, 0, NOW, 'firefly');
  state = claimGameReward(state, 0, NOW, 'memory');
  assert.throws(() => claimQuest(state, 'game-explorer', NOW), /Complete the quest/);
  state = claimGameReward(state, 0, NOW, 'memory');
  state = claimQuest(state, 'game-explorer', NOW);
  state = winBattle(state);
  state = claimQuest(state, 'arena-debut', NOW);
  assert.deepEqual([...state.quests.claimed].sort(), ['arena-debut', 'game-explorer', 'growing-family']);
  state = parseSave(serialiseSave(state));
  for (const id of state.quests.claimed) assert.throws(() => claimQuest(state, id, NOW + DAY), /already claimed/);
  assert.equal(state.counts.questsClaimed, 3);
  assert.throws(() => questProgress(state, 'invented', NOW), /available quest/);
  assert.equal(Object.keys(QUESTS).length, 4);
});

test('both mini-games share a single payout cap while maintaining separate completion counts', () => {
  let state = pet();
  for (const type of ['firefly', 'memory', 'firefly', 'memory']) state = claimGameReward(state, 100, NOW, type);
  assert.equal(state.wallet, 240);
  assert.equal(state.game.earned, 120);
  assert.deepEqual(state.game.rounds, { firefly: 2, memory: 2 });
  assert.equal(state.counts.games, 4);
  assert.equal(readActivePet(state).xp, 20);
  assert.throws(() => claimGameReward(state, 100, NOW, 'invented'), /mini-game/);
  state = claimGameReward(state, 100, NOW + DAY, 'memory');
  assert.equal(state.wallet, 280);
  assert.deepEqual(state.game.rounds, { firefly: 2, memory: 3 });
});

test('experience derives levels and saturates at the final level without altering another pet', () => {
  assert.equal(XP_PER_LEVEL, 100);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(MAX_XP), 20);
  assert.throws(() => levelForXp(MAX_XP + 1), /Experience/);
  let state = adopt(pet(), 'Cinder', 'emberkit', NOW);
  for (let index = 0; index < 50; index += 1) state = care(state, 'rest', undefined, NOW);
  assert.equal(readActivePet(state).xp, 100);
  assert.equal(readActivePet(state).level, 2);
  assert.equal(state.pets[0].xp, 0);
  readActivePet(state).xp = 1998;
  readActivePet(state).level = 20;
  state = care(state, 'rest', undefined, NOW);
  assert.equal(readActivePet(state).xp, MAX_XP);
  assert.equal(readActivePet(state).level, 20);
});

test('arena turns are deterministic, saved mid-battle, and settle first-victory rewards once', () => {
  const original = pet();
  let state = startBattle(original, 'ashgrub', NOW);
  assert.equal(readActivePet(state).stats.energy, 75);
  assert.equal(readActivePet(original).stats.energy, 85);
  const twin = battleAction(state, 'attack', NOW);
  state = battleAction(state, 'attack', NOW);
  assert.deepEqual(state, twin);
  assert.deepEqual([state.battle.petHp, state.battle.opponentHp], [33, 20]);
  state = parseSave(serialiseSave(state));
  state = battleAction(state, 'attack', NOW);
  state = battleAction(state, 'attack', NOW);
  assert.equal(state.battle.status, 'won');
  assert.equal(state.wallet, 145);
  assert.equal(readActivePet(state).xp, 20);
  assert.equal(state.battleWins.ashgrub, true);
  assert.equal(state.counts.battleWins, 1);
  assert.throws(() => battleAction(state, 'attack', NOW), /Start an arena battle/);
  state = parseSave(serialiseSave(state));
  state = winBattle(state);
  assert.equal(state.wallet, 145);
  assert.equal(readActivePet(state).xp, 25);
  assert.equal(state.counts.battleWins, 2);
});

test('arena progression needs both experience and earlier victories', () => {
  let state = pet();
  assert.throws(() => startBattle(state, 'stonebeak', NOW), /Reach level 3/);
  for (let index = 0; index < 40; index += 1) state = claimGameReward(state, 0, NOW);
  assert.equal(readActivePet(state).level, 3);
  assert.throws(() => startBattle(state, 'stonebeak', NOW), /earlier opponents/);
  state = winBattle(state, 'ashgrub');
  state = winBattle(state, 'stonebeak');
  assert.equal(state.wallet, 185);
  assert.throws(() => startBattle(state, 'frostwisp', NOW), /Reach level 5/);
  while (readActivePet(state).level < 5) state = care(state, 'rest', undefined, NOW);
  state = winBattle(state, 'frostwisp');
  assert.equal(state.wallet, 245);
  assert.deepEqual(state.battleWins, { ashgrub: true, stonebeak: true, frostwisp: true });
  assert.equal(OPPONENTS.frostwisp.hp, 70);
});

test('arena guards reduce incoming damage, potions consume inventory, and defeat pays no reward', () => {
  let state = purchase(pet(), 'potion', NOW);
  state = startBattle(state, 'ashgrub', NOW);
  state = battleAction(state, 'guard', NOW);
  assert.deepEqual([state.battle.petHp, state.battle.opponentHp], [36, 28]);
  state = battleAction(state, 'potion', NOW);
  assert.equal(state.inventory.potion, 0);
  assert.equal(state.battle.petHp, 32);
  assert.equal(state.battle.opponentHp, 28);
  const before = serialiseSave(state);
  assert.throws(() => battleAction(state, 'potion', NOW), /no dew potion/);
  assert.equal(serialiseSave(state), before);
  while (state.battle.status === 'active') state = battleAction(state, 'guard', NOW);
  assert.equal(state.battle.status, 'lost');
  assert.equal(state.wallet, 102);
  assert.equal(state.counts.battleWins, 0);
  assert.equal(state.battleWins.ashgrub, false);
  assert.equal(validateState(parseSave(serialiseSave(state))), true);
});

test('active battles block pet changes and terminal snapshots reject inconsistent imports', () => {
  let state = adopt(pet(), 'Cinder', 'emberkit', NOW);
  state = startBattle(state, 'ashgrub', NOW);
  for (const action of [
    () => selectPet(state, 'pet-1', NOW),
    () => adopt(state, 'Third', 'moonfin', NOW),
    () => care(state, 'rest', undefined, NOW),
    () => claimGameReward(state, 0, NOW),
    () => equipAccessory(state, null, 'head', NOW),
    () => claimQuest(state, 'growing-family', NOW),
    () => setMembership(state, 'explorer', NOW),
    () => useExpansion(state, NOW),
  ]) assert.throws(action, /Finish the current arena battle/);
  while (state.battle.status === 'active') state = battleAction(state, 'attack', NOW);
  const corrupt = (change, pattern) => {
    const bad = structuredClone(state);
    change(bad);
    assert.throws(() => parseSave(JSON.stringify(bad)), pattern);
  };
  corrupt((bad) => { bad.battle.status = 'active'; }, /Active battle/);
  corrupt((bad) => { bad.battle.petHp = 1000; }, /Companion HP/);
  corrupt((bad) => { bad.battle.petMaxHp = 1000; }, /maximum HP/);
  corrupt((bad) => { bad.battleWins.ashgrub = false; }, /victory/);
  corrupt((bad) => { bad.counts.battleWins = 0; }, /victory count/);
  corrupt((bad) => { bad.battle.opponentId = 'fake'; }, /opponent/);
  corrupt((bad) => { bad.battle.opponentId = ['ashgrub']; }, /opponent/);
  corrupt((bad) => { bad.battle.turn = 1; }, /number of turns/);
  corrupt((bad) => { bad.pets[0].level = 10; }, /level does not match/);
  corrupt((bad) => { bad.pets[0].wearing.head = ['leafcap']; }, /head slot/);
  corrupt((bad) => { bad.pets[0].id = 'pet-2'; }, /unique and ordered/);
  corrupt((bad) => { bad.game.rounds.firefly = 1; }, /round counts/);
});

test('a failed arena settlement leaves the original battle and balance intact', () => {
  let state = startBattle(pet(), 'ashgrub', NOW);
  state = battleAction(state, 'attack', NOW);
  state = battleAction(state, 'attack', NOW);
  state.wallet = 999_999_990;
  const before = serialiseSave(state);
  assert.throws(() => battleAction(state, 'attack', NOW), /Pebble balance/);
  assert.equal(serialiseSave(state), before);
  assert.equal(state.battle.status, 'active');
  assert.equal(state.battleWins.ashgrub, false);
});
