/** Bounded, authored companion memories. Everything stays in the local save. */
import { TRAIL_ROUTES, TRAIL_TREASURES } from './trails.js';

export const EXPEDITION_INTENTS = Object.freeze({
  notice: Object.freeze({ id: 'notice', name: 'Notice something small', description: 'Follow a sound, a sparkle or an interesting leaf.', axis: 'curiosity' }),
  help: Object.freeze({ id: 'help', name: 'Lend a little paw', description: 'Make the day gentler for a woodland neighbour.', axis: 'kindness' }),
  brave: Object.freeze({ id: 'brave', name: 'Try something new', description: 'Take one small, brave step.', axis: 'courage' }),
});
export const EXPEDITION_ROUTES = Object.freeze(Object.fromEntries(Object.values(TRAIL_ROUTES).map((route, index) => [route.id,
  Object.freeze({ id: route.id, name: route.name, description: route.description, theme: route.theme, durationMs: [120_000, 300_000, 600_000][index] })])));
export const FIRST_EXPEDITION_MS = 30_000;
export const MEMORY_LIMIT = 3;
export const AXES = Object.freeze(['curiosity', 'kindness', 'courage']);

export function freshCompanion(pet) {
  const care = pet.journey ?? {};
  return { petId: pet.id, curiosity: Math.min(100, care.plays ?? 0), kindness: Math.min(100, (care.feeds ?? 0) + (care.rests ?? 0)),
    courage: Math.min(100, care.trainings ?? 0), trips: 0, memories: [] };
}
export function freshCompanionship(pets = []) {
  return { version: 1, sequence: 0, profiles: pets.map(freshCompanion), collection: [], active: null, last: null };
}
export function learnFrom(state, petId, axis, amount = 1) {
  const profile = state.companionship.profiles.find((entry) => entry.petId === petId);
  profile[axis] = Math.min(100, profile[axis] + amount);
}
export function expeditionTreasure(routeId, intent, variant) {
  return TRAIL_ROUTES[routeId].treasures[(Object.keys(EXPEDITION_INTENTS).indexOf(intent) + variant) % 3];
}

const places = {
  whisperwood: {
    notice: ['heard a fern whistling the same three notes', 'found a beetle painting tiny dots on a mushroom', 'watched sunlight turn a seedpod into a lantern'],
    help: ['lifted a twig so a snail could get home', 'held a leaf umbrella over a beetle’s picnic', 'untangled a seed lantern for a fieldmouse'],
    brave: ['introduced themself to a choir of woodbeetles', 'crossed a tiny stream on a sturdy fallen branch', 'followed a new path to a clearing full of fireflies'],
  },
  glowpool: {
    notice: ['noticed that the pond’s stars were actually silver fish', 'listened to a reed answer the wind in a lower voice', 'counted the circles made by one small raindrop'],
    help: ['retrieved a frog captain’s missing paddle', 'freed a floating garden from a branch', 'held a reed ring steady for the pond-weaver'],
    brave: ['tried a little reed boat for the first time', 'hummed along with the waterbeetles under the bridge', 'followed the stepping stones to a luminous inlet'],
  },
  windridge: {
    notice: ['spotted a cloud shaped just like a sleeping friend', 'found a hollow twig that sang in the breeze', 'watched a golden flower turn towards the sun'],
    help: ['freed a mouse’s kite from a thorn', 'repaired a neighbour’s windbell with a careful knot', 'returned three feathers to a nest-builder'],
    brave: ['held a cloud kite as it caught the wind', 'sang a new tune from the sheltered hilltop', 'tried the winding path to a valley of cloud shadows'],
  },
};
const speciesTouches = {
  mossling: 'A new leaf unfurled with the telling.', emberkit: 'Their warm glow flickered with delight.', moonfin: 'Little ripples danced around them as they remembered.',
  briarhare: 'Their long ears bounced at the best part.', pebblepup: 'Their tail thumped out a happy little rhythm.', cloudmoth: 'Their velvet wings fluttered as they told it.',
  kilnback: 'A copper glow warmed their clay shell.', gloomdrop: 'Tiny star-flecks sparkled in their inky coat.', thistlehorn: 'Their wildflower mane bobbed with pride.',
};
const natures = { steady: 'taking their time and noticing the familiar', gentle: 'making room for quieter friends', curious: 'following one more interesting question', spirited: 'giving new things an enthusiastic try' };
const careTouches = { feeds: 'They remembered your shared snacks and saved a little something for home.', plays: 'A turn in the path reminded them of your ribbon games.', rests: 'They found a quiet resting place, just like your cosy corner at home.', trainings: 'A little practice together had made this new step feel possible.' };

export function describeMemory(pet, memory) {
  const treasureId = expeditionTreasure(memory.routeId, memory.intent, memory.variant);
  return { id: memory.id, title: `${pet.name} at ${TRAIL_ROUTES[memory.routeId].name}`, at: memory.at,
    treasureId,
    text: `${pet.name} ${places[memory.routeId][memory.intent][memory.variant]}. ${speciesTouches[pet.species]} ${memory.care ? careTouches[memory.care] : `They made their own way, ${natures[pet.personality]}.`} They brought home a ${TRAIL_TREASURES[treasureId].name.toLowerCase()}.` };
}

export function getExpeditionStatus(state, now = Date.now()) {
  const run = state.companionship?.active ?? null;
  if (!run) return { status: 'idle', run: null, pet: null, route: null, remainingMs: 0, readyAt: null };
  const clock = Number.isSafeInteger(now) ? Math.max(state.lastUpdated, now) : state.lastUpdated;
  const remainingMs = Math.max(0, run.readyAt - clock);
  return { status: remainingMs ? 'away' : 'ready', run, pet: state.pets.find((pet) => pet.id === run.petId),
    route: EXPEDITION_ROUTES[run.routeId], remainingMs, readyAt: run.readyAt };
}

export function readCompanionStory(state, petId = state.activePetId) {
  const pet = state.pets?.find((entry) => entry.id === petId);
  if (!pet) return { axes: { curiosity: 0, kindness: 0, courage: 0 }, heading: 'A friendship waiting to happen', biography: '', greeting: 'There is a little room here for someone new.', memories: [], completedTrips: 0, collection: [] };
  const profile = state.companionship?.profiles.find((entry) => entry.petId === pet.id) ?? freshCompanion(pet);
  const dominant = AXES.reduce((best, axis) => profile[axis] > profile[best] ? axis : best, 'curiosity');
  const learned = { curiosity: 'learning to notice little wonders', kindness: 'learning how much a small kindness can mean', courage: 'finding courage in small steps' };
  const greeting = { curiosity: 'I wonder what we’ll notice next. Shall we take our time?', kindness: 'There’s room beside me. I saved you the cosy bit.', courage: 'I think I could try something new today. Something little.' };
  return { axes: Object.fromEntries(AXES.map((axis) => [axis, profile[axis]])),
    heading: profile[dominant] ? `${pet.name} is ${learned[dominant]}` : `Getting to know ${pet.name}`,
    biography: `${pet.name} feels most like themself when ${natures[pet.personality]}. ${profile[dominant] ? `Your time together is helping them grow in ${dominant}.` : 'Every shared snack, quiet rest and little adventure becomes part of your friendship.'} Their personality and memories stay with them whenever you take a break.`,
    greeting: profile[dominant] ? greeting[dominant] : 'Hello, you. We can make this place our own, one little moment at a time.',
    memories: [...profile.memories].reverse().map((memory) => describeMemory(pet, memory)), completedTrips: profile.trips,
    collection: [...(state.companionship?.collection ?? [])] };
}

export function readReturnWelcome(savedLastUpdated, now = Date.now()) {
  const awayMs = Number.isSafeInteger(savedLastUpdated) && Number.isSafeInteger(now) ? Math.max(0, now - savedLastUpdated) : 0;
  return { awayMs, message: awayMs >= 86_400_000 ? 'Welcome home. Your companions are just as you left them, with your friendship and keepsakes kept safe.' : 'A little time together, at your own pace.' };
}

/** Strict optional extension: legacy v3 records remain readable, unknown fields do not. */
export function validateCompanionship(state, { record, integer, timestamp, fail, maxCounter }) {
  const journal = state.companionship;
  if (journal === undefined) return;
  record(journal, ['version', 'sequence', 'profiles', 'collection', 'active', 'last'], 'Companionship');
  if (journal.version !== 1) fail('This companionship journal needs version 1.');
  integer(journal.sequence, 0, maxCounter, 'Expeditions started');
  if (!Array.isArray(journal.profiles) || journal.profiles.length !== state.pets.length || new Set(journal.profiles.map((p) => p?.petId)).size !== state.pets.length) fail('Keep one companionship profile for each friend.');
  if (!Array.isArray(journal.collection) || journal.collection.length > 9 || new Set(journal.collection).size !== journal.collection.length || journal.collection.some((id) => typeof id !== 'string' || !Object.hasOwn(TRAIL_TREASURES, id))) fail('Keep each recognised expedition keepsake only once.');
  const validateMemory = (memory, pet, label) => {
    record(memory, ['id', 'routeId', 'intent', 'variant', 'at', 'care'], label);
    integer(memory.id, 1, journal.sequence, 'Memory number');
    if (typeof memory.routeId !== 'string' || typeof memory.intent !== 'string' || !Object.hasOwn(EXPEDITION_ROUTES, memory.routeId) || !Object.hasOwn(EXPEDITION_INTENTS, memory.intent)) fail('Choose a recognised expedition route and intention.');
    integer(memory.variant, 0, 2, 'Memory variation');
    if (!journal.collection.includes(expeditionTreasure(memory.routeId, memory.intent, memory.variant))) fail('An expedition memory needs its matching keepsake.');
    timestamp(memory.at, 'Memory time');
    if (memory.at < pet.adoptedAt || memory.at > state.lastUpdated) fail('A memory needs a time between adoption and this save.');
    if (memory.care !== null && !['feeds', 'plays', 'rests', 'trainings'].includes(memory.care)) fail('This memory needs a recognised shared activity.');
    if (memory.care && !pet.journey[memory.care]) fail('This memory recalls a shared activity that has not happened.');
  };
  let trips = 0;
  const memoryIds = new Set();
  for (const profile of journal.profiles) {
    record(profile, ['petId', ...AXES, 'trips', 'memories'], 'Companion memories');
    const pet = state.pets.find((entry) => entry.id === profile.petId);
    if (!pet) fail('A companionship profile needs its adopted friend.');
    for (const axis of AXES) integer(profile[axis], 0, 100, `Learned ${axis}`);
    integer(profile.trips, 0, maxCounter, 'Completed expeditions');
    trips += profile.trips;
    if (!Array.isArray(profile.memories) || profile.memories.length !== Math.min(MEMORY_LIMIT, profile.trips)) fail('Keep the latest three memories for each companion.');
    let previousId = 0;
    let previousTime = pet.adoptedAt;
    for (const [index, memory] of profile.memories.entries()) {
      validateMemory(memory, pet, 'Companion memory');
      if (memory.id <= previousId || memory.at < previousTime || memoryIds.has(memory.id) || memory.variant !== (profile.trips - profile.memories.length + index) % 3) fail('Companion memories need their original order and variation.');
      memoryIds.add(memory.id); previousId = memory.id; previousTime = memory.at;
    }
  }
  if (journal.sequence !== trips + Number(journal.active !== null) || journal.collection.length > trips || (trips === 0) !== (journal.last === null) || (trips === 0) !== (journal.collection.length === 0)) fail('The expedition totals, memories and keepsakes do not match.');
  if ([...memoryIds].some((id) => id > trips)) fail('A memory needs a completed expedition.');
  if (journal.last !== null) {
    record(journal.last, ['petId', 'memory'], 'Last expedition');
    const profile = journal.profiles.find((entry) => entry.petId === journal.last.petId);
    if (!profile || !profile.memories.length) fail('The last expedition needs its matching companion memory.');
    validateMemory(journal.last.memory, state.pets.find((pet) => pet.id === profile.petId), 'Last expedition memory');
    if (Object.keys(profile.memories.at(-1)).some((key) => profile.memories.at(-1)[key] !== journal.last.memory[key]) || journal.last.memory.id !== trips) fail('The last expedition needs its matching companion memory.');
  }
  if (journal.active !== null) {
    const run = journal.active;
    record(run, ['id', 'petId', 'routeId', 'intent', 'variant', 'startedAt', 'readyAt'], 'Expedition');
    integer(run.id, 1, maxCounter, 'Expedition number');
    const pet = state.pets.find((entry) => entry.id === run.petId);
    const profile = journal.profiles.find((entry) => entry.petId === run.petId);
    if (!pet || typeof run.routeId !== 'string' || typeof run.intent !== 'string' || !Object.hasOwn(EXPEDITION_ROUTES, run.routeId) || !Object.hasOwn(EXPEDITION_INTENTS, run.intent) || run.id !== journal.sequence || run.variant !== profile.trips % 3) fail('The current expedition needs its original friend, route and intention.');
    timestamp(run.startedAt, 'Expedition departure'); timestamp(run.readyAt, 'Expedition return');
    if (run.startedAt < pet.adoptedAt || run.startedAt > state.lastUpdated || (journal.last && run.startedAt < journal.last.memory.at) || run.readyAt - run.startedAt !== (run.id === 1 ? FIRST_EXPEDITION_MS : EXPEDITION_ROUTES[run.routeId].durationMs)) fail('The expedition dates do not match its route.');
  }
}
