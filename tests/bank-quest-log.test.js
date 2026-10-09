import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BANK_TIERS, QUEST_DAY_REWARD, QUEST_WEEK_REWARD, createState, adopt, care,
  purchase, claimGameReward, claimQuest, questProgress, dailyQuestIds,
  questDayProgress, claimQuestDay, deposit, withdraw, bankInterest,
  upgradeBankTier, claimBankInterest, advanceTime, setMembership, claimLodgeParcel,
  parseSave, serialiseSave, validateState,
} from '../src/model.js';

const NOW = Date.parse('2026-10-10T12:00:00.000Z');
const DAY = 86_400_000;
const companion = (now = NOW) => adopt(createState(now), 'Férn 🌿', 'mossling', now);
const dailyIds = ['daily-feast', 'daily-play', 'daily-market', 'daily-game', 'daily-rest'];

function objectives(state, now) {
  let next = care(state, 'rest', undefined, now);
  next = care(next, 'play', 'ribbon', now);
  for (let index = 0; index < 3; index += 1) {
    if (!next.inventory.berry) next = purchase(next, 'berry', now);
    next = care(next, 'feed', 'berry', now);
  }
  next = purchase(next, 'acorn', now);
  return claimGameReward(next, 0, now, 'memory');
}

function completedDay(state, now) {
  let next = objectives(state, now);
  for (const id of dailyIds) next = claimQuest(next, id, now);
  return claimQuestDay(next, now);
}

function bankWorld(balance, tier = 'seedling') {
  const state = createState(NOW);
  state.wallet = 0;
  state.bank.balance = balance;
  state.bank.tier = tier;
  validateState(state);
  return state;
}

test('original savings upgrades require deposited funds and persist after withdrawals', () => {
  let state = createState(NOW);
  state.wallet = 10000;
  const before = serialiseSave(state);
  assert.throws(() => upgradeBankTier(state, 'sapling', NOW), /Save 1000/);
  assert.equal(serialiseSave(state), before);
  state = deposit(state, 1000, NOW);
  state = upgradeBankTier(state, 'sapling', NOW);
  assert.equal(state.bank.tier, 'sapling');
  assert.equal(BANK_TIERS.sapling.basisPoints, 750);
  state = withdraw(state, 1000, NOW);
  assert.equal(state.bank.tier, 'sapling');
  assert.equal(bankInterest(state, NOW).amount, 0);
  assert.throws(() => claimBankInterest(state, NOW), /Deposit at least one/);
  for (const id of ['seedling', 'sapling']) assert.throws(() => upgradeBankTier(state, id, NOW), /higher/);
  for (const id of ['constructor', '__proto__', 'unknown']) assert.throws(() => upgradeBankTier(state, id, NOW), /available/);
  state = deposit(state, 10000, NOW);
  state = upgradeBankTier(state, 'canopy', NOW);
  assert.equal(state.bank.tier, 'canopy');
  assert.deepEqual(parseSave(serialiseSave(state)), state);
});

test('daily interest uses the declared ceiling formula and credits bank, not wallet', () => {
  for (const [balance, amount] of [[0, 0], [1, 1], [7299, 1], [7300, 1], [7301, 2]]) {
    const state = bankWorld(balance);
    assert.equal(bankInterest(state, NOW).amount, amount);
    if (balance === 0) continue;
    const next = claimBankInterest(state, NOW);
    assert.equal(next.bank.balance, balance + amount);
    assert.equal(next.wallet, 0);
    assert.equal(next.bank.interestEarned, amount);
    assert.equal(next.bank.interestClaims, 1);
    assert.equal(state.bank.balance, balance);
    assert.equal(next.bank.lastInterestDay, '2026-10-10');
  }
  for (const tier of Object.values(BANK_TIERS)) {
    const state = bankWorld(100000, tier.id);
    assert.equal(bankInterest(state, NOW).amount, Math.ceil(100000 * tier.basisPoints / 3650000));
  }
});

test('interest claim cannot replay after transfer, tier upgrade, reload or clock rollback', () => {
  let state = bankWorld(100000);
  state = claimBankInterest(state, NOW);
  state = withdraw(state, 10, NOW);
  state = deposit(state, 10, NOW);
  state = upgradeBankTier(state, 'grove', NOW);
  state = parseSave(serialiseSave(state));
  const before = serialiseSave(state);
  assert.equal(bankInterest(state, NOW).claimed, true);
  assert.throws(() => claimBankInterest(state, NOW), /already collected/);
  assert.throws(() => claimBankInterest(state, NOW - DAY), /already collected/);
  assert.equal(serialiseSave(state), before);
  const tomorrow = claimBankInterest(state, NOW + DAY);
  assert.equal(tomorrow.bank.interestClaims, 2);
  assert.equal(tomorrow.bank.lastInterestDay, '2026-10-11');
  const muchLater = claimBankInterest(tomorrow, NOW + 30 * DAY);
  assert.equal(muchLater.bank.interestClaims, 3, 'missed dates do not accrue rewards');
});

test('interest is eligible at the exact UTC year boundary and rejects the combined cap atomically', () => {
  const end = Date.parse('2026-12-31T23:59:59.999Z');
  let state = createState(end);
  state = deposit(state, 100, end);
  state = claimBankInterest(state, end);
  state = claimBankInterest(state, end + 1);
  assert.equal(state.bank.lastInterestDay, '2027-01-01');
  assert.equal(state.bank.interestClaims, 2);
  const capped = bankWorld(10);
  capped.wallet = 999999990;
  const before = serialiseSave(capped);
  assert.equal(bankInterest(capped, NOW).ready, false);
  assert.throws(() => claimBankInterest(capped, NOW), /combined wallet and bank limit/);
  assert.equal(serialiseSave(capped), before);
  const spent = purchase(capped, 'berry', NOW);
  assert.equal(claimBankInterest(spent, NOW).bank.balance, 11);
});

test('five distinct daily objectives require real actions and explicit individual claims', () => {
  const original = companion();
  assert.deepEqual(dailyQuestIds(original), dailyIds);
  assert.throws(() => claimQuestDay(original, NOW), /five distinct/);
  let state = objectives(original, NOW);
  for (const id of dailyIds) {
    assert.equal(questProgress(state, id, NOW).ready, true);
    assert.equal(questProgress(state, id, NOW).claimed, false);
  }
  assert.equal(questDayProgress(state, NOW).claimedQuests, 0);
  assert.throws(() => claimQuestDay(state, NOW), /five distinct/);
  for (const id of dailyIds.slice(0, 4)) state = claimQuest(state, id, NOW);
  assert.equal(questDayProgress(state, NOW).ready, false);
  assert.throws(() => claimQuestDay(state, NOW), /five distinct/);
  state = claimQuest(state, 'daily-rest', NOW);
  const wallet = state.wallet;
  state = claimQuestDay(state, NOW);
  assert.equal(state.wallet, wallet + QUEST_DAY_REWARD);
  assert.equal(state.questLog.streak, 1);
  assert.equal(state.questLog.completedDays, 1);
  assert.equal(state.questLog.lastCompletionDay, '2026-10-10');
  assert.equal(original.questLog.claimed.length, 0);
  assert.throws(() => claimQuestDay(state, NOW), /already collected/);
});

test('the free local Lodge sixth objective may replace any other daily task among the five', () => {
  let state = setMembership(companion(), 'explorer', NOW);
  assert.equal(dailyQuestIds(state).length, 6);
  state = care(state, 'rest', undefined, NOW);
  state = care(state, 'play', 'ribbon', NOW);
  state = purchase(state, 'acorn', NOW);
  state = claimGameReward(state, 0, NOW, 'firefly');
  state = claimLodgeParcel(state, NOW);
  for (const id of ['daily-play', 'daily-market', 'daily-game', 'daily-rest', 'daily-parcel']) state = claimQuest(state, id, NOW);
  assert.equal(questProgress(state, 'daily-feast', NOW).progress, 0);
  assert.equal(questDayProgress(state, NOW).ready, true);
  state = claimQuestDay(state, NOW);
  state = setMembership(state, 'free', NOW);
  assert.equal(dailyQuestIds(state).length, 5);
  assert.equal(state.questLog.claimed.length, 5, 'downgrading does not erase a paid sixth quest');
  state = setMembership(state, 'explorer', NOW);
  assert.throws(() => claimQuest(state, 'daily-parcel', NOW), /already claimed/);
  assert.throws(() => claimLodgeParcel(state, NOW), /already collected/);
  assert.throws(() => claimQuestDay(state, NOW), /already collected/);
  const standard = companion();
  assert.throws(() => claimQuest(standard, 'daily-parcel', NOW), /Join the Explorer/);
});

test('seven consecutive claimed days pay one weekly bonus and a new cycle starts next day', () => {
  let state = companion();
  for (let index = 0; index < 7; index += 1) {
    const now = NOW + index * DAY;
    state = objectives(state, now);
    for (const id of dailyIds) state = claimQuest(state, id, now);
    const before = state.wallet;
    assert.equal(questDayProgress(state, now).weeklyReward, index === 6 ? QUEST_WEEK_REWARD : 0);
    state = claimQuestDay(state, now);
    assert.equal(state.wallet - before, QUEST_DAY_REWARD + (index === 6 ? QUEST_WEEK_REWARD : 0));
    assert.equal(state.questLog.streak, index + 1);
    assert.throws(() => claimQuestDay(state, now), /already collected/);
    state = parseSave(serialiseSave(state));
  }
  assert.equal(state.questLog.completedDays, 7);
  assert.equal(state.questLog.weeklyRewards, 1);
  assert.equal(state.questLog.lastWeeklyDay, '2026-10-16');
  assert.throws(() => claimQuestDay(state, NOW), /already collected/);
  state = advanceTime(state, NOW + 7 * DAY);
  assert.equal(state.questLog.streak, 0);
  assert.equal(state.questLog.weeklyRewards, 1);
  state = completedDay(state, NOW + 7 * DAY);
  assert.equal(state.questLog.streak, 1);
  assert.equal(state.questLog.completedDays, 8);
  assert.equal(state.questLog.weeklyRewards, 1);
});

test('every five-of-six Lodge selection qualifies, and the sixth reward cannot replay day completion', () => {
  const available = [...dailyIds, 'daily-parcel'];
  for (const omitted of available) {
    let state = setMembership(companion(), 'explorer', NOW);
    state = objectives(state, NOW);
    state = claimLodgeParcel(state, NOW);
    for (const id of available.filter((id) => id !== omitted)) state = claimQuest(state, id, NOW);
    assert.equal(questDayProgress(state, NOW).claimedQuests, 5, omitted);
    state = claimQuestDay(state, NOW);
    state = claimQuest(state, omitted, NOW);
    assert.equal(state.questLog.claimed.length, 6);
    assert.equal(state.questLog.completedDays, 1);
    assert.throws(() => claimQuestDay(state, NOW), /already collected/);
  }
});

test('a missed daily-completion claim breaks the rolling streak without erasing lifetime history', () => {
  let state = completedDay(companion(), NOW);
  state = objectives(state, NOW + DAY);
  for (const id of dailyIds) state = claimQuest(state, id, NOW + DAY);
  state = advanceTime(state, NOW + 2 * DAY);
  assert.equal(state.questLog.streak, 0);
  assert.equal(state.questLog.claimed.length, 0);
  assert.equal(state.questLog.completedDays, 1);
  assert.throws(() => claimQuestDay(state, NOW + DAY), /five distinct/);
  state = completedDay(state, NOW + 2 * DAY);
  assert.equal(state.questLog.streak, 1);
  assert.equal(state.questLog.completedDays, 2);
  assert.equal(state.questLog.weeklyRewards, 0);
});

test('midnight discards unfinished objectives without paying or moving time backwards', () => {
  const late = Date.parse('2028-02-28T23:59:59.999Z');
  let state = objectives(companion(late), late);
  state = claimQuest(state, 'daily-feast', late);
  const wallet = state.wallet;
  state = advanceTime(state, late + 1);
  assert.equal(state.questLog.day, '2028-02-29');
  assert.equal(state.questLog.claimed.length, 0);
  assert.equal(state.quests.daily.feeds, 0);
  assert.deepEqual(state.questLog.progress, { plays: 0, purchases: 0, games: 0, rests: 0, parcels: 0 });
  assert.equal(state.wallet, wallet);
  assert.deepEqual(advanceTime(state, late - DAY), state);
  assert.throws(() => claimQuest(state, 'daily-feast', late), /Complete the quest/);
});

test('old v2 saves preserve paid feast, balances and all history without inventing a streak', () => {
  let state = objectives(companion(), NOW);
  state = claimQuest(state, 'daily-feast', NOW);
  state = deposit(state, 20, NOW);
  const old = structuredClone(state);
  old.bank = { balance: old.bank.balance };
  delete old.questLog;
  const original = JSON.stringify(old, null, 4) + '\n';
  assert.equal(validateState(old), true);
  const next = parseSave(original);
  for (const key of Object.keys(old).filter((key) => key !== 'bank')) assert.deepEqual(next[key], old[key]);
  assert.equal(next.bank.balance, old.bank.balance);
  assert.equal(next.bank.tier, 'seedling');
  assert.equal(next.bank.lastInterestDay, null);
  assert.deepEqual(next.questLog.claimed, ['daily-feast']);
  assert.deepEqual(next.questLog.progress, { plays: 0, purchases: 0, games: 0, rests: 0, parcels: 0 });
  assert.equal(next.questLog.completedDays, 0);
  assert.equal(next.questLog.streak, 0);
  assert.throws(() => claimQuest(next, 'daily-feast', NOW), /already claimed/);
  assert.equal(JSON.stringify(old, null, 4) + '\n', original);
  assert.deepEqual(parseSave(serialiseSave(next)), next);
});

test('new optional records reject partial, forged, future and duplicate reward fields', () => {
  const valid = companion();
  const changes = [
    (state) => { delete state.bank.interestClaims; },
    (state) => { state.bank.tier = 'unknown'; },
    (state) => { state.bank.interestClaims = 0.5; },
    (state) => { state.bank.lastInterestDay = '2026-10-11'; state.bank.interestClaims = 1; state.bank.interestEarned = 1; },
    (state) => { state.questLog.progress.rests = 1; },
    (state) => { state.questLog.day = '2026-10-11'; },
    (state) => { state.questLog.claimed = ['daily-rest', 'daily-rest']; },
    (state) => { state.questLog.claimed = ['daily-market']; },
    (state) => { state.questLog.streak = 1; },
    (state) => { state.questLog.completedDays = 1; },
    (state) => { state.questLog.weeklyRewards = 1; },
    (state) => { state.questLog.extra = true; },
  ];
  const before = serialiseSave(valid);
  for (const change of changes) {
    const invalid = structuredClone(valid);
    change(invalid);
    assert.throws(() => parseSave(JSON.stringify(invalid)));
  }
  assert.equal(serialiseSave(valid), before);
});

test('daily and seventh-day bonuses fail atomically at the combined resource limit', () => {
  let state = objectives(companion(), NOW);
  for (const id of dailyIds) state = claimQuest(state, id, NOW);
  state.wallet = 999999961;
  const before = serialiseSave(state);
  assert.equal(questDayProgress(state, NOW).ready, false);
  assert.throws(() => claimQuestDay(state, NOW), /combined wallet and bank limit/);
  assert.equal(serialiseSave(state), before);
  state = companion();
  for (let index = 0; index < 6; index += 1) state = completedDay(state, NOW + index * DAY);
  state = objectives(state, NOW + 6 * DAY);
  for (const id of dailyIds) state = claimQuest(state, id, NOW + 6 * DAY);
  state.wallet = 999999811;
  const weekBefore = serialiseSave(state);
  assert.throws(() => claimQuestDay(state, NOW + 6 * DAY), /combined wallet and bank limit/);
  assert.equal(serialiseSave(state), weekBefore);
  state.wallet -= 1;
  state = claimQuestDay(state, NOW + 6 * DAY);
  assert.equal(state.wallet, 1000000000);
  assert.equal(state.questLog.weeklyRewards, 1);
});

test('the expanded bounded save still holds the full original Unicode roster', () => {
  let state = setMembership(companion(), 'explorer', NOW);
  state.expansions = 12;
  state.counts.expansionsUsed = 12;
  for (let index = 1; index < 26; index += 1) state = adopt(state, '🌿'.repeat(24), 'moonfin', NOW);
  state = completedDay(state, NOW);
  state.bank.balance = 100000;
  state = upgradeBankTier(state, 'grove', NOW);
  state = claimBankInterest(state, NOW);
  const text = serialiseSave(state);
  assert.ok(new TextEncoder().encode(text).length < 32768);
  assert.deepEqual(parseSave(text), state);
});
