/** Pure, immutable Under the Hedge rules. Clocks are supplied; absence has no penalty. */
import { APPEARANCES, HOME_SPOTS, ROUTES, NEIGHBOURS, FIND_DETAILS, openingScene, preferenceText } from './hedge-content.js';
export { APPEARANCES, HOME_SPOTS, ROUTES, NEIGHBOURS, FIND_DETAILS } from './hedge-content.js';
export const HEDGE_SAVE_KEY = 'under-the-hedge.save.v1';
export const HEDGE_BRAND = 'under-the-hedge';
export const HEDGE_VERSION = 1;
export const FIRST_OUTING_MS = 30000;
export const HISTORY_LIMIT = 100;
export const MAX_TIMESTAMP = 253402300799999;
const MAX_COUNTER = 1000000000;
const MAX_SAVE_BYTES = 150000;
const steps = ['surface', 'custom', 'route', 'notice', 'complete'];
const interests = ['water', 'sound', 'shelter'];
const neighbourIds = NEIGHBOURS.map(x => x.id);
const routeIds = ROUTES.map(x => x.id);
const spots = HOME_SPOTS.map(x => x.id);
const error = message => { throw new Error(message); };
function assert(condition, message = 'This is not a valid Under the Hedge save. Try another file.') { if (!condition) error(message); }
function obj(value, keys) { assert(value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value))); assert(Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k))); }
function integer(value, maximum = MAX_COUNTER) { assert(Number.isSafeInteger(value) && value >= 0 && value <= maximum); }
function timestamp(value) { integer(value, MAX_TIMESTAMP); }
function string(value, max = 1200) { assert(typeof value === 'string' && [...value].length <= max && !/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(value)); }
function nameCheck(value) { string(value, 24); assert(value.trim().length > 0 && value === value.trim(), 'Choose a name between 1 and 24 characters.'); }
function appearanceCheck(value) { obj(value, ['colour', 'marking']); assert(APPEARANCES.colours.some(x => x.id === value.colour) && APPEARANCES.markings.some(x => x.id === value.marking), 'Choose one of the available colours and markings.'); }
function clock(now) { timestamp(now); return now; }
function copy(state, now) { validateHedgeState(state); clock(now); const next = structuredClone(state); next.updatedAt = Math.max(now, state.updatedAt); return finish(next); }
function begun(state) { assert(state.companion, 'Give your companion a name first.'); }
function atHome(state) { begun(state); assert(!state.outing, 'Your companion is out on the path. Its discoveries will wait for you.'); }
function finish(state) { validateHedgeState(state); return state; }
function seq(state) { assert(state.sequence < MAX_COUNTER, 'This journal is full. Export it to keep your story safe.'); return ++state.sequence; }
function event(state, type, place, text, details = {}) {
  const entry = { id: `event-${seq(state)}`, type, at: state.updatedAt, place, text, findId: null, neighbour: null, disposition: null, ...details };
  state.events.push(entry); state.events = state.events.slice(-HISTORY_LIMIT); return entry;
}
function learn(state, id) { state.preferences[id] = Math.min(MAX_COUNTER, state.preferences[id] + 1); }
function meet(state, id) { state.neighbours[id] = Math.min(MAX_COUNTER, state.neighbours[id] + 1); }
function find(state, kind, place, reaction, neighbour) {
  const old = state.finds.find(item => item.kind === kind);
  if (old) return old;
  const result = { id: `find-${seq(state)}`, kind, name: FIND_DETAILS[kind].name, place, reaction, neighbour, disposition: 'alcove', at: state.updatedAt };
  state.finds.push(result); return result;
}
export function createHedgeState(now = Date.now()) {
  clock(now);
  return { brand: HEDGE_BRAND, version: HEDGE_VERSION, createdAt: now, updatedAt: now, sequence: 0, companion: null,
    opening: { step: 'surface', surface: null, route: null, interest: null },
    home: { visitorSeat: false, returningStones: 0 }, outing: null, completedOutings: 0,
    routeVisits: { broadroot: 0, dryfoot: 0, alderwater: 0 }, preferences: { water: 0, sound: 0, shelter: 0 },
    neighbours: { pell: 0, dindle: 0, mallow: 0, ossel: 0 }, mystery: { chapter: 0, resolved: false }, finds: [], events: [],
  };
}
export function validateHedgeState(state) {
  obj(state, ['brand','version','createdAt','updatedAt','sequence','companion','opening','home','outing','completedOutings','routeVisits','preferences','neighbours','mystery','finds','events']);
  assert(state.brand === HEDGE_BRAND && state.version === HEDGE_VERSION, 'Choose an Under the Hedge version 1 save. Your old Petrealm save stays separate.');
  timestamp(state.createdAt); timestamp(state.updatedAt); assert(state.updatedAt >= state.createdAt); integer(state.sequence); integer(state.completedOutings);
  if (state.companion !== null) { obj(state.companion, ['name','appearance']); nameCheck(state.companion.name); appearanceCheck(state.companion.appearance); }
  obj(state.opening, ['step','surface','route','interest']); assert(steps.includes(state.opening.step));
  assert([null,'stone','reeds'].includes(state.opening.surface)); assert([null,'sheltered','waterside'].includes(state.opening.route)); assert([null,...interests].includes(state.opening.interest));
  const usedSequences = new Set();
  function identifier(value, prefix) {
    assert(typeof value === 'string' && new RegExp(`^${prefix}-[1-9][0-9]*$`).test(value));
    const number = Number(value.slice(prefix.length + 1)); integer(number); assert(number <= state.sequence && !usedSequences.has(number)); usedSequences.add(number); return number;
  }
  const stage = steps.indexOf(state.opening.step);
  assert((stage > 0) === (state.opening.surface !== null)); assert((stage >= 3) === (state.opening.route !== null)); assert((stage === 4) === (state.opening.interest !== null));
  obj(state.home, ['visitorSeat','returningStones']); assert(typeof state.home.visitorSeat === 'boolean'); integer(state.home.returningStones); assert(state.home.visitorSeat === (stage === 4)); assert(state.home.returningStones === state.completedOutings + (stage === 4 ? 1 : 0));
  obj(state.routeVisits, routeIds); routeIds.forEach(id => integer(state.routeVisits[id])); assert(routeIds.reduce((sum,id) => sum + state.routeVisits[id], 0) === state.completedOutings);
  obj(state.preferences, interests); interests.forEach(id => integer(state.preferences[id]));
  obj(state.neighbours, neighbourIds); neighbourIds.forEach(id => integer(state.neighbours[id]));
  obj(state.mystery, ['chapter','resolved']); integer(state.mystery.chapter, 3); assert(typeof state.mystery.resolved === 'boolean' && state.mystery.resolved === (state.mystery.chapter === 3)); assert(state.mystery.chapter <= state.routeVisits.alderwater);
  if (state.outing !== null) {
    obj(state.outing, ['id','route','condition','startedAt','readyAt']); identifier(state.outing.id, 'outing'); assert(routeIds.includes(state.outing.route) && ['calm','rainy'].includes(state.outing.condition)); timestamp(state.outing.startedAt); timestamp(state.outing.readyAt);
    assert(state.outing.startedAt >= state.createdAt && state.outing.startedAt <= state.updatedAt && state.outing.readyAt > state.outing.startedAt);
    const duration = state.completedOutings === 0 ? FIRST_OUTING_MS : ROUTES.find(r => r.id === state.outing.route).duration;
    assert(state.outing.readyAt - state.outing.startedAt === duration && stage === 4);
  }
  assert(Array.isArray(state.finds) && state.finds.length <= Object.keys(FIND_DETAILS).length);
  const findIds = new Set(), kinds = new Set();
  for (const item of state.finds) {
    obj(item,['id','kind','name','place','reaction','neighbour','disposition','at']); identifier(item.id, 'find'); assert(!findIds.has(item.id)); findIds.add(item.id);
    assert(Object.hasOwn(FIND_DETAILS,item.kind) && !kinds.has(item.kind)); kinds.add(item.kind); assert(item.name === FIND_DETAILS[item.kind].name); string(item.place,80); string(item.reaction); assert(neighbourIds.includes(item.neighbour)); assert(spots.includes(item.disposition)); timestamp(item.at); assert(item.at >= state.createdAt && item.at <= state.updatedAt);
  }
  assert(Array.isArray(state.events) && state.events.length <= HISTORY_LIMIT);
  let previousTime = state.createdAt, previousId = 0;
  for (const entry of state.events) {
    obj(entry,['id','type','at','place','text','findId','neighbour','disposition']); const id = identifier(entry.id, 'event'); assert(id > previousId && id <= state.sequence); previousId = id;
    assert(['begin','surface','custom','route','opening','depart','return','place','neighbour','rename'].includes(entry.type)); timestamp(entry.at); assert(entry.at >= previousTime && entry.at <= state.updatedAt); previousTime = entry.at; string(entry.place,80); string(entry.text); assert(entry.findId === null || findIds.has(entry.findId)); assert(entry.neighbour === null || neighbourIds.includes(entry.neighbour)); assert(entry.disposition === null || spots.includes(entry.disposition));
  }
  for (const item of state.finds) assert(Number(item.id.slice(5)) <= state.sequence);
  if (!state.companion) assert(stage === 0 && state.sequence === 0 && !state.outing && state.events.length === 0 && state.finds.length === 0 && state.completedOutings === 0 && Object.values(state.neighbours).every(v => v === 0) && Object.values(state.preferences).every(v => v === 0));
  if (stage < 4) assert(state.finds.length === 0 && state.completedOutings === 0);
  if (stage === 4) assert(kinds.has('seed-case') && state.neighbours.pell > 0);
  return state;
}
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
    if (depth > 12) error(`This save has too many layers of details. The limit is ${12} levels.`);
    if (text[position] === '{') {
      position += 1;
      space();
      const keys = new Set();
      while (text[position] !== '}') {
        space();
        const key = string();
        if (keys.has(key)) error(`This save lists “${key}” twice. Keep one copy of that detail and try again.`);
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

export function parseHedgeSave(raw) {
  assert(typeof raw === 'string' && new TextEncoder().encode(raw).length <= MAX_SAVE_BYTES, 'That save file is too large. Choose an Under the Hedge export.');
  let parsed; try { parsed = JSON.parse(raw); } catch { error('That file is not readable JSON. Choose an Under the Hedge export.'); }
  rejectDuplicateKeys(raw); validateHedgeState(parsed); return structuredClone(parsed);
}
export function serialiseHedgeSave(state) { validateHedgeState(state); const raw = JSON.stringify(state, null, 2); assert(new TextEncoder().encode(raw).length <= MAX_SAVE_BYTES, 'This save is too large to export safely.'); return raw; }
export function beginHedge(state, name = 'Fen', appearance = { colour:'river', marking:'speckles' }, now = Date.now()) {
  const next = copy(state, now); assert(!next.companion, 'Your companion already has a home.'); assert(typeof name === 'string', 'Give your companion a name.'); name = name.trim().normalize('NFC'); nameCheck(name); appearanceCheck(appearance); next.companion = { name, appearance: structuredClone(appearance) };
  event(next,'begin','Bramble Fold',`${name} settles into a dry sleeping chamber beneath the roots. A shallow washing hollow waits beside the entrance. Home is already safe.`); return finish(next);
}
export function renameCompanion(state, name, appearance = state.companion?.appearance, now = Date.now()) {
  const next = copy(state, now); begun(next); assert(typeof name === 'string', 'Give your companion a name.'); name = name.trim().normalize('NFC'); nameCheck(name); appearanceCheck(appearance); const old = next.companion.name; next.companion = { name, appearance: structuredClone(appearance) };
  event(next,'rename','Bramble Fold',old === name ? `${name} has a new arrangement of colours and markings.` : `${old} is now called ${name}. The same companion, with the same shared history.`); return finish(next);
}
export function investigateSurface(state, surface, now = Date.now()) {
  const next = copy(state,now); atHome(next); assert(next.opening.step === 'surface', 'That first investigation is already remembered.'); assert(['stone','reeds'].includes(surface), 'Choose the smooth stone or rustling reeds.'); next.opening.surface = surface; next.opening.step = 'custom';
  event(next,'surface','Bramble Fold',surface === 'stone' ? `${next.companion.name} tests the smooth stone with both forepaws, then rests a cheek fold beside its cool edge. One small response; there is much more to discover.` : `${next.companion.name} holds still beside the reeds. Its pleated cheek folds spread as the stems move. One small response; there is much more to discover.`); return finish(next);
}
export function chooseOpening(state, choice, expectedStep, now = Date.now()) {
  const next = copy(state,now); atHome(next); assert(next.opening.step === expectedStep, 'This part of the story has already moved on.'); const name = next.companion.name;
  if (expectedStep === 'custom') { assert(['leave-room','ask-pell'].includes(choice), 'Choose a place for a visitor.'); next.opening.step = 'route'; meet(next,'pell'); event(next,'custom','Bramble Fold',choice === 'ask-pell' ? `Pell checks where its dark forefeet can rest. ${name} leaves a dry patch with enough room for Pell’s balancing tail.` : `${name} leaves a dry patch beside the wet threshold. Pell calls it “leaving the dry bit”: a welcome that fits somebody else.`,{neighbour:'pell'}); }
  else if (expectedStep === 'route') { assert(['sheltered','waterside'].includes(choice), 'Choose either way to Dryfoot.'); next.opening.route = choice; next.opening.step = 'notice'; event(next,'route','Dryfoot Crossing',`${name} takes the ${choice === 'sheltered' ? 'sheltered root' : 'open waterside'} path. New growth has altered the passage. Pell waits while ${name} finds a way through.`,{neighbour:'pell'}); }
  else if (expectedStep === 'notice') {
    assert(interests.includes(choice), 'Choose what catches your companion’s attention.'); next.opening.step = 'complete'; next.opening.interest = choice; next.home.visitorSeat = true; next.home.returningStones = 1; learn(next,choice);
    const reaction = ({water:'The seed case floats towards the same quiet corner. Both forepaws inspect the corner afterwards.',sound:'The seed case makes a low knock against a root. Pell suggests it could announce a visitor.',shelter:'The seed case settles neatly in a sheltered hollow, just out of the draught.'})[choice];
    const item = find(next,'seed-case','Dryfoot Crossing',reaction,'pell'); item.disposition = choice === 'water' ? 'washing-hollow' : choice === 'sound' ? 'threshold' : 'alcove';
    event(next,'opening','Bramble Fold',`${name} brings back loose bark and a curved seed case by the ${next.opening.route} route. ${reaction} The dry visitor seat is finished. “You have left rather a lot,” Pell says. ${name} moves a reed bundle aside. Pell sits. “Yes. That is better.” The first returning stone is turned.`,{findId:item.id,neighbour:'pell',disposition:item.disposition});
  } else error('Choose one of the current story options.');
  return finish(next);
}
export function startOuting(state, route, condition = 'calm', now = Date.now()) {
  const next = copy(state,now); atHome(next); assert(next.opening.step === 'complete', 'Finish the visiting place before taking another path.'); const detail = ROUTES.find(r => r.id === route); assert(detail && ['calm','rainy'].includes(condition), 'Choose a local path and its weather.');
  const duration = next.completedOutings === 0 ? FIRST_OUTING_MS : detail.duration; assert(next.updatedAt <= MAX_TIMESTAMP - duration, 'The device date is too far ahead to begin a walk.');
  next.outing = {id:`outing-${seq(next)}`,route,condition,startedAt:next.updatedAt,readyAt:next.updatedAt+duration};
  event(next,'depart',detail.name,`${next.companion.name} sets out for ${detail.name} in ${condition === 'calm' ? 'calm weather' : 'light rain'}. There is a dependable way home. This prepared outing will wait until you return.`); return finish(next);
}
function returningStory(state, route, condition) {
  const name = state.companion.name, revisiting = state.routeVisits[route] > 0;
  const wet = condition === 'rainy' ? 'Rain draws little rings around each root. ' : 'The air is still enough to notice the smallest movements. ';
  if (route === 'broadroot') {
    meet(state,'dindle'); meet(state,'ossel'); learn(state,'shelter'); if (revisiting) learn(state,'sound');
    return {kind:revisiting?'fern-curl':'root-marker',place:'Broadroot Wood',neighbour:'dindle',reaction:revisiting?'The answering sound returns only when the fallen wood rests beside moving water.':'A notched piece of fallen bark marks a hollow where the wind drops away.',text:wet+(revisiting ? `Dindle asks ${name} what the path is like now. Ossel puts its resonant wood back beside the brook: the sound returns. ${name} leaves it where it belongs and brings home a fallen fern curl. Ossel waits for the whole sound before speaking.` : `Dindle remembers an open path, but fern growth has narrowed it. ${name} finds a sheltered gap by testing it with both forepaws. Ossel taps a fallen branch and shows how the quiet hollow changes its sound. They leave the branch in place. A loose notched bark piece comes home as a tactile route marker.`)};
  }
  if (route === 'dryfoot') {
    meet(state,'pell'); learn(state,'sound');
    return {kind:revisiting?'reed-ring':'brook-pebble',place:'Dryfoot Crossing',neighbour:'pell',reaction:revisiting?'A loose reed ring trembles where the breeze reaches the dry threshold.':'A grooved pebble is easy to recognise with both forepaws.',text:wet+(revisiting ? `Pell asks ${name} to help mark two ways across: a low waterside route and a raised dry one. Neither is the right route for every body. ${name} recognises the brook’s knock beneath the roots and finds a loose reed ring beside the raised path.` : `Pell checks the crossing by its vibrations. ${name} feels the shallower current with its cheek folds. Their directions now say who each route suits. A loose grooved pebble comes home; Pell keeps its feet dry and nobody needs to become braver.`)};
  }
  meet(state,'mallow'); learn(state,'water');
  if (state.mystery.chapter === 0) { state.mystery.chapter = 1; return {kind:'alder-leaf',place:'Alderwater',neighbour:'mallow',reaction:'The fallen leaf turns slowly in a narrow thread of warmer water.',text:wet+`${name} follows Mallow along the sheltered shore. A faint light hangs above the far bank. Nearby flowers brighten after Mallow rests beneath them. “Someone asleep over there?” Mallow wonders. ${name} watches an alder leaf turn in a warm thread of water. The question is saved for another outing.`}; }
  if (state.mystery.chapter === 1) { state.mystery.chapter = 2; return {kind:'alder-leaf',place:'Alderwater',neighbour:'mallow',reaction:'A warm current reaches the bank even when no creature is resting there.',text:wet+`The far-bank light is still there, but ${name} sees no visitor. Mallow follows a narrow warm current with one forepaw. “Perhaps resting is only part of it.” They choose a shore approach with places to stop. Broadroot’s root marker and Pell’s crossing directions will help; a calm outing can follow the bank without swimming across.`}; }
  if (!state.mystery.resolved && state.routeVisits.broadroot > 0 && state.routeVisits.dryfoot > 0 && condition === 'calm') {
    state.mystery.chapter = 3; state.mystery.resolved = true;
    return {kind:'flower-seed',place:'The Far Bank',neighbour:'mallow',reaction:'The flowers respond to still warmth, not specifically to a sleeper. A warm seep feeds the root.',text:`Using the notched bark to remember the sheltered route and Pell’s directions for the crossing, ${name} and Mallow follow the shore with resting stops. Above the waterline they find a dry hollow with spaces for different bodies. No one is sleeping there. A warm seep touches a root; the flowers above it shine. They respond to still warmth, not to sleepers. “But you can understand why they might,” says Mallow. They have found a dependable stopping place. A fallen seed comes home, with no promise that it will glow elsewhere.`};
  }
  if (state.mystery.resolved) return {kind:'alder-leaf',place:'Alderwater',neighbour:'mallow',reaction:'Mallow chooses its own favourite bay, with a dry place beside the shallows.',text:wet+`Mallow asks ${name} to lead this time. They pause at a bay with a low warm root and room for dry feet. Mallow chooses it for itself. The far-bank flowers have an explanation now; the water still has small things worth noticing. A fallen leaf turns once, then comes to rest.`};
  return {kind:'alder-leaf',place:'Alderwater',neighbour:'mallow',reaction:'The warm current remains a useful clue; the shore route will wait.',text:wet+`${name} and Mallow revisit the near-shore flowers. The warm current is still there. ${condition === 'rainy' ? 'They leave the longer shore investigation for a chosen calm outing.' : 'They decide to learn the Broadroot approach and Pell’s crossing directions before following the longer shore.'} There is no deadline. An alder leaf comes home from the familiar bay.`};
}
export function collectOuting(state, expectedId, now = Date.now()) {
  const next = copy(state,now); begun(next); assert(next.outing && next.outing.id === expectedId, 'That outing has already been welcomed home.'); assert(next.updatedAt >= next.outing.readyAt, 'Your companion is still on the path. There is no need to hurry.');
  const {route,condition} = next.outing; const story = returningStory(next,route,condition);
  // Repeated experience affects what the same find means, without ranking traits.
  const learned = interests.filter(id => next.preferences[id] >= 2).sort((a,b) => next.preferences[b] - next.preferences[a])[0];
  if (learned) {
    const response = ({water:`${next.companion.name} carries it to the washing hollow first, watching how the surface moves around it.`,sound:`${next.companion.name} tries a gentle tap against a root, then pauses for the answering sound before settling it down.`,shelter:`${next.companion.name} finds a still pocket beside the alcove and tests the resting place with both forepaws.`})[learned];
    story.text += ` Back home, ${response}`;
    story.reaction += ` ${response}`;
  }
  const item = find(next,story.kind,story.place,story.reaction,story.neighbour);
  assert(next.completedOutings < MAX_COUNTER - 1, 'This journal is full. Export it to keep your story safe.'); next.completedOutings++; next.routeVisits[route]++; next.home.returningStones++; next.outing = null;
  event(next,'return',story.place,story.text,{findId:item.id,neighbour:story.neighbour,disposition:item.disposition}); return finish(next);
}
export function placeFind(state, findId, spot, now = Date.now()) {
  const next = copy(state,now); atHome(next); const item = next.finds.find(x => x.id === findId); assert(item && spots.includes(spot), 'Choose a remembered find and a place at home.'); assert(item.disposition !== spot, 'That find is already in this place.'); item.disposition = spot;
  const action = spot === 'washing-hollow' ? 'tests it with both forepaws beside the shallow water' : spot === 'threshold' ? 'sets it by the entrance, leaving the visitor’s dry bit clear' : 'settles it into the quiet memory alcove';
  event(next,'place','Bramble Fold',`${next.companion.name} ${action}. The ${item.name.toLowerCase()} still carries its story from ${item.place}.`,{findId:item.id,disposition:spot}); return finish(next);
}
export function speakToNeighbour(state, id, now = Date.now()) {
  const next = copy(state,now); atHome(next); assert(neighbourIds.includes(id) && next.neighbours[id] > 0, 'Meet this neighbour on a path first.'); const name = next.companion.name; let text;
  if(id === 'pell') text = next.home.visitorSeat ? `Pell sits on the dry visitor seat, its balancing tail clear of the washing hollow. “Yes. This works for my feet.” ${name} leaves the reed bundle where they moved it together.` : 'Pell points out the dry bit beside the threshold. “Leave enough room for somebody else’s feet.”';
  if(id === 'dindle') text = next.routeVisits.broadroot > 1 ? `“What is the path like now?” Dindle asks ${name}. This time it waits for the answer before describing the old route.` : `Dindle remembers the gap ${name} found at Broadroot. “I shall have to change my directions.” One broad ear folds before the other.`;
  if(id === 'ossel') text = next.routeVisits.broadroot > 1 ? `Ossel invites ${name} to listen beside the brook. The resonant wood has stayed where they put it back. “Better here,” it says, and lets the next sound finish.` : `Ossel taps the threshold before coming close. “Next time, listen before lifting anything. I am trying to remember that myself.”`;
  if(id === 'mallow') text = next.mystery.resolved ? `Mallow rests one forepaw beside the washing hollow. “Still warmth,” it says. “We mistook a condition for a visitor.” The shared stopping place on the far bank is part of both their maps now.` : `Mallow pauses, one forepaw dipping. “That thread of warmer water. I keep thinking about it.” The saved question can wait for another walk.`;
  meet(next,id); event(next,'neighbour','Bramble Fold',text,{neighbour:id}); return finish(next);
}
export function readHedgeView(state, now = Date.now()) {
  validateHedgeState(state); clock(now); now = Math.max(now, state.updatedAt); const name = state.companion?.name || 'Fen';
  const preferences = interests.filter(id => state.preferences[id] >= 2).map(id => ({id,label:({water:'Small water movements',sound:'Hollow sounds',shelter:'Sheltered resting places'})[id],text:preferenceText(id,name)}));
  return { name, scene:openingScene(state), ready:!!state.outing && now >= state.outing.readyAt, remainingMs:state.outing ? Math.max(0,state.outing.readyAt-now) : 0,
    routes:ROUTES.map(route => ({...route,duration:state.completedOutings === 0 ? FIRST_OUTING_MS : route.duration,visits:state.routeVisits[route.id]})), preferences,
    latestEvent:state.events.at(-1) || null,
    greeting:state.outing ? (now >= state.outing.readyAt ? `${name} has a story waiting. Welcome it home whenever you like.` : `${name} is following a familiar way home. Its discoveries will wait.`) : state.companion ? `${name} is safe at home. There is room to notice something small.` : 'A small life, just beyond the familiar.',
    mystery:state.mystery.resolved ? 'The flowers respond to still warmth. A warm seep keeps the far-bank root glowing; nobody needs to be asleep there.' : state.mystery.chapter === 2 ? 'Follow the Broadroot and Dryfoot paths, then choose a calm Alderwater outing to investigate the far bank.' : state.mystery.chapter === 1 ? 'A light on the far shore. Return to Alderwater when you feel like following the warm current.' : null,
  };
}
