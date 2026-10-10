import test from 'node:test';
import assert from 'node:assert/strict';
import { createHedgeState, beginHedge, investigateSurface, chooseOpening, startOuting, collectOuting, placeFind, speakToNeighbour, renameCompanion, readHedgeView, validateHedgeState, parseHedgeSave, serialiseHedgeSave, FIRST_OUTING_MS, MAX_TIMESTAMP, HISTORY_LIMIT, HEDGE_SAVE_KEY } from '../src/hedge-model.js';
const NOW = 1791662400000;
const appearance = {colour:'river',marking:'speckles'};
function started() { return beginHedge(createHedgeState(NOW),'Fen',appearance,NOW); }
function opened(route='sheltered',interest='water') {
  let s=investigateSurface(started(),'stone',NOW);
  s=chooseOpening(s,'ask-pell','custom',NOW);
  s=chooseOpening(s,route,'route',NOW);
  return chooseOpening(s,interest,'notice',NOW);
}
function visit(state,route,condition='calm') { const departing=startOuting(state,route,condition,state.updatedAt); return collectOuting(departing,departing.outing.id,departing.outing.readyAt); }

test('new namespace and strict brand keep original Petrealm saves separate',()=>{
  assert.equal(HEDGE_SAVE_KEY,'under-the-hedge.save.v1');
  assert.throws(()=>parseHedgeSave(JSON.stringify({version:1,pets:[]})));
  assert.deepEqual(parseHedgeSave(serialiseHedgeSave(createHedgeState(NOW))),createHedgeState(NOW));
});
test('a safe home already exists and the initial observation does not assign personality',()=>{
  const before=started(); const s=investigateSurface(before,'reeds',NOW+1);
  assert.equal(before.opening.step,'surface'); assert.equal(s.opening.step,'custom');
  assert.deepEqual(s.preferences,{water:0,sound:0,shelter:0});
  assert.equal(readHedgeView(s,NOW+1).preferences.length,0);
  assert.match(before.events[0].text,/Home is already safe/);
  validateHedgeState(s);
});
test('all opening routes and interests succeed with material home changes',()=>{
  for(const route of ['waterside','sheltered']) for(const interest of ['water','sound','shelter']) {
    const s=opened(route,interest); validateHedgeState(s);
    assert.equal(s.opening.step,'complete'); assert.equal(s.home.visitorSeat,true); assert.equal(s.home.returningStones,1);
    assert.equal(s.finds.length,1); assert.equal(s.finds[0].place,'Dryfoot Crossing'); assert.equal(s.finds[0].neighbour,'pell');
    assert.match(s.events.at(-1).text,new RegExp(route)); assert.equal(readHedgeView(s,NOW).preferences.length,0);
  }
});
test('saved story stages wait indefinitely and stale choices cannot progress twice',()=>{
  let s=investigateSurface(started(),'stone',NOW);
  const saved=parseHedgeSave(serialiseHedgeSave(s));
  s=chooseOpening(saved,'leave-room','custom',NOW+365*86400000);
  assert.equal(s.opening.step,'route'); assert.throws(()=>chooseOpening(s,'leave-room','custom',s.updatedAt));
  assert.throws(()=>chooseOpening(s,'invalid','route',s.updatedAt));
  assert.deepEqual(saved.preferences,{water:0,sound:0,shelter:0});
});
test('only one free outing prepares; first takes 30 seconds and late returns never expire',()=>{
  const s=opened(); const d=startOuting(s,'broadroot','rainy',NOW);
  assert.equal(d.outing.readyAt-NOW,FIRST_OUTING_MS);
  assert.throws(()=>startOuting(d,'dryfoot','calm',NOW));
  assert.throws(()=>collectOuting(d,d.outing.id,d.outing.readyAt-1));
  assert.throws(()=>collectOuting(d,'outing-wrong',d.outing.readyAt));
  const late=collectOuting(d,d.outing.id,NOW+3650*86400000);
  assert.equal(late.home.returningStones,2); assert.equal(late.completedOutings,1);
  assert.throws(()=>collectOuting(late,d.outing.id,late.updatedAt)); validateHedgeState(late);
  assert.equal(startOuting(late,'broadroot','calm',late.updatedAt).outing.readyAt-late.updatedAt,120000);
  assert.equal(startOuting(late,'dryfoot','calm',late.updatedAt).outing.readyAt-late.updatedAt,180000);
  assert.equal(startOuting(late,'alderwater','calm',late.updatedAt).outing.readyAt-late.updatedAt,300000);
});
test('observations accumulate, all four neighbours are met, repeat visits tell a different actual story',()=>{
  let s=visit(opened(),'broadroot');
  assert.equal(s.neighbours.dindle,1); assert.equal(s.neighbours.ossel,1);
  assert.match(s.events.at(-1).text,/leave the branch in place/);
  s=visit(s,'broadroot'); assert.match(s.events.at(-1).text,/puts its resonant wood back/);
  assert(readHedgeView(s,s.updatedAt).preferences.some(p=>p.id==='shelter'));
  s=visit(s,'alderwater'); assert.equal(s.neighbours.mallow,1); assert.equal(s.neighbours.pell,1);
  validateHedgeState(s);
});
test('same seed case has a meaningful use based on attention and can be rearranged',()=>{
  const water=opened('sheltered','water'); const sound=opened('sheltered','sound');
  assert.equal(water.finds[0].kind,sound.finds[0].kind);
  assert.equal(water.finds[0].disposition,'washing-hollow'); assert.equal(sound.finds[0].disposition,'threshold');
  const moved=placeFind(water,water.finds[0].id,'alcove',NOW);
  assert.equal(water.finds[0].disposition,'washing-hollow'); assert.equal(moved.finds[0].disposition,'alcove');
  assert.equal(moved.events.at(-1).findId,water.finds[0].id); assert.equal(moved.events.at(-1).disposition,'alcove');
  assert.equal(moved.finds[0].reaction,water.finds[0].reaction); validateHedgeState(moved);
});
test('neighbours have no invented shared memory before being met',()=>{
  const s=opened(); assert.throws(()=>speakToNeighbour(s,'mallow',NOW)); assert.throws(()=>speakToNeighbour(s,'dindle',NOW));
  const pell=speakToNeighbour(s,'pell',NOW); assert.match(pell.events.at(-1).text,/dry visitor seat/);
  const d=visit(s,'broadroot'); const talked=speakToNeighbour(d,'dindle',d.updatedAt); assert.match(talked.events.at(-1).text,/gap Fen found/);
});
test('the Alderwater mystery has a concrete saved resolution using selectable conditions',()=>{
  let s=visit(opened(),'alderwater'); assert.equal(s.mystery.chapter,1);
  s=visit(s,'alderwater'); assert.equal(s.mystery.chapter,2);
  s=visit(s,'alderwater'); assert.equal(s.mystery.chapter,2); // preparation waits
  s=visit(s,'broadroot'); s=visit(s,'dryfoot'); s=visit(s,'alderwater','rainy'); assert.equal(s.mystery.resolved,false);
  s=visit(parseHedgeSave(serialiseHedgeSave(s)),'alderwater','calm'); assert.equal(s.mystery.resolved,true);
  assert.equal(s.events.at(-1).place,'The Far Bank'); assert.match(s.events.at(-1).text,/still warmth, not to sleepers/);
  assert.equal(s.finds.find(f=>f.kind==='flower-seed').place,'The Far Bank');
  s=visit(s,'alderwater'); assert.match(s.events.at(-1).text,/Mallow chooses it for itself/); validateHedgeState(s);
});
test('read views and long absences make no state mutations or decay',()=>{
  const s=opened(); const original=serialiseHedgeSave(s);
  readHedgeView(s,NOW+100*365*86400000); assert.equal(serialiseHedgeSave(s),original);
  const d=startOuting(s,'alderwater','calm',NOW); const old=serialiseHedgeSave(d);
  assert.equal(readHedgeView(d,NOW+100*365*86400000).ready,true); assert.equal(serialiseHedgeSave(d),old);
});
test('appearance and rename preserve the same companion and historical names',()=>{
  const s=opened(); const n=renameCompanion(s,'Puddle',{colour:'clay',marking:'tail'},NOW);
  assert.equal(n.companion.name,'Puddle'); assert.match(n.events[0].text,/Fen/); assert.equal(n.finds.length,s.finds.length);
  assert.deepEqual(n.preferences,s.preferences); assert.throws(()=>renameCompanion(n,' ',appearance,NOW));
  assert.throws(()=>renameCompanion(n,'Fen',{colour:'rare-gold',marking:'tail'},NOW)); validateHedgeState(n);
});
test('history is bounded while objects keep their original provenance',()=>{
  let s=opened(); const original=structuredClone(s.finds[0]);
  for(let i=0;i<150;i++) s=speakToNeighbour(s,'pell',NOW+i);
  assert.equal(s.events.length,HISTORY_LIMIT); assert.deepEqual(s.finds[0],original);
  assert.deepEqual(parseHedgeSave(serialiseHedgeSave(s)),s);
});
test('invalid imports reject prototype fields, future versions, malformed counters, links and impossible stages',()=>{
  const base=opened();
  for(const mutate of [
    s=>{s.version=2;},s=>{s.extra=true;},s=>{s.preferences.water=-1;},s=>{s.preferences.sound=Infinity;},
    s=>{s.opening.step='surface';},s=>{s.home.returningStones=99;},s=>{s.updatedAt=MAX_TIMESTAMP+1;},
    s=>{s.companion.appearance.colour='gold';},s=>{s.finds[0].at=NOW+1;},s=>{s.finds[0].disposition='sold';},
    s=>{s.events[0].findId='not-found';},s=>{s.events[0].neighbour='stranger';},s=>{s.events[1].id=s.events[0].id;},
    s=>{s.mystery.resolved=true;},s=>{s.finds.push(structuredClone(s.finds[0]));},s=>{s.companion.name='';},
  ]) {const s=structuredClone(base);mutate(s);assert.throws(()=>validateHedgeState(s));}
  assert.throws(()=>parseHedgeSave('{"__proto__":{"polluted":true}}'));
  assert.throws(()=>parseHedgeSave(' '.repeat(150001)));
  assert.throws(()=>parseHedgeSave('{broken'));
  assert.throws(()=>parseHedgeSave('[]'));
  assert.throws(()=>parseHedgeSave('null'));
});
test('time overflow, rollback, stale identifiers and arbitrary action inputs fail without mutation',()=>{
  const base=opened(); const frozen=serialiseHedgeSave(base);
  assert.throws(()=>startOuting(base,'alderwater','calm',MAX_TIMESTAMP));
  assert.equal(startOuting(base,'alderwater','calm',NOW-1).outing.startedAt,NOW);
  assert.throws(()=>startOuting(base,'__proto__','calm',NOW));
  assert.throws(()=>startOuting(base,'alderwater','snow',NOW));
  assert.throws(()=>placeFind(base,'bad','alcove',NOW));
  assert.throws(()=>collectOuting(base,'outing-0',NOW));
  assert.equal(serialiseHedgeSave(base),frozen);
  const trip=startOuting(base,'dryfoot','calm',NOW);
  const invalid=structuredClone(trip);invalid.outing.readyAt++;assert.throws(()=>validateHedgeState(invalid));
});

test('imports reject duplicate keys, excessive depth, invisible controls and reused sequence IDs',()=>{
  const base=opened();
  assert.throws(()=>parseHedgeSave(serialiseHedgeSave(base).replace('"version": 1','"version": 1, "version": 1')),/twice/);
  assert.throws(()=>parseHedgeSave('['.repeat(14)+'0'+']'.repeat(14)),/layers/);
  assert.throws(()=>beginHedge(createHedgeState(NOW),'Fen\u202e',appearance,NOW));
  assert.throws(()=>beginHedge(createHedgeState(NOW),'Fe\u000an',appearance,NOW));
  const trip=startOuting(base,'broadroot','calm',NOW);
  trip.outing.id='outing-'+base.finds[0].id.slice(5);
  assert.throws(()=>validateHedgeState(trip));
  trip.outing.id='outing-999999'; assert.throws(()=>validateHedgeState(trip));
});
test('names count Unicode code points; clock corrections preserve access and actual elapsed readiness',()=>{
  const s=beginHedge(createHedgeState(NOW),'🦔'.repeat(24),appearance,NOW);
  validateHedgeState(s);
  assert.throws(()=>beginHedge(createHedgeState(NOW),'🦔'.repeat(25),appearance,NOW));
  const d=startOuting(opened(),'broadroot','calm',NOW-5000);
  assert.equal(d.outing.startedAt,NOW);
  assert.throws(()=>collectOuting(d,d.outing.id,NOW-10000));
  const moved=placeFind(opened(),opened().finds[0].id,'alcove',NOW-5000);
  assert.equal(moved.updatedAt,NOW);
});

test('learned experience changes a later shared find without changing its value or access',()=>{
  let water=visit(opened('sheltered','water'),'alderwater');
  let shelter=visit(visit(opened('sheltered','shelter'),'broadroot'),'broadroot');
  water=visit(water,'dryfoot'); shelter=visit(shelter,'dryfoot');
  const waterFind=water.finds.find(f=>f.kind==='brook-pebble');
  const shelterFind=shelter.finds.find(f=>f.kind==='brook-pebble');
  assert.equal(waterFind.name,shelterFind.name);
  assert.match(waterFind.reaction,/washing hollow first/);
  assert.match(shelterFind.reaction,/still pocket beside the alcove/);
  assert.equal(waterFind.place,shelterFind.place);
});
