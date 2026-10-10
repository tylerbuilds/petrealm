import test from 'node:test';
import {LEVELS} from '../src/hedge-play-engine.js';
import assert from 'node:assert/strict';
import {createHedgeState,beginHedge,investigateSurface,chooseOpening,startOuting,beginPlayRun,completePlayRun,abandonPlayRun,buildHedgeDecoration,readPlayProgress,parseHedgeSave,serialiseHedgeSave,validateHedgeState,DECORATIONS,HEDGE_VERSION} from '../src/hedge-model.js';
const NOW = 1791662400000;
const begun = () => beginHedge(createHedgeState(NOW),'Fen',undefined,NOW);
const result = (level='broadroot',overrides={}) => {
  const value = {level,seeds:6,secret:false,timeMs:30000,bumps:2,assist:false,...overrides};
  return {...value,stars:overrides.stars ?? 1 + Number(value.seeds === 8) + Number(value.timeMs <= LEVELS.find(item=>item.id === level).parSeconds * 1000)};
};
function clear(state,level='broadroot',overrides={}) {
  const pending=beginPlayRun(state,level,overrides.assist ?? false,state.updatedAt+1);
  return completePlayRun(pending,pending.play.active.id,result(level,overrides),pending.updatedAt+50000);
}
function legacy(state) { const original=structuredClone(state); delete original.play; original.version=1; return original; }

test('first playable begins as soon as a companion exists, with no prose or waiting prerequisite',()=>{
  assert.throws(()=>beginPlayRun(createHedgeState(NOW),'broadroot',false,NOW));
  const state=begun(), before=structuredClone(state);
  assert.equal(state.opening.step,'surface');
  assert.deepEqual(readPlayProgress(state).levels.map(level=>level.unlocked),[true,false,false]);
  assert.throws(()=>beginPlayRun(state,'dryfoot',false,NOW));
  const pending=beginPlayRun(state,'broadroot',false,NOW);
  assert.equal(pending.play.active.level,'broadroot'); assert.deepEqual(state,before);
});

test('three real clears unlock routes and visible milestone decorations in order',()=>{
  let state=clear(begun());
  assert.deepEqual(readPlayProgress(state).levels.map(level=>level.unlocked),[true,true,false]);
  assert.deepEqual(state.play.decorations,['fern-arch']); assert.equal(state.play.equipped.root,'fern-arch');
  assert.equal(state.neighbours.dindle,1); assert.equal(state.preferences.shelter,1); assert.equal(state.play.seeds,6);
  assert.equal(state.events.at(-1).type,'play'); assert.match(state.events.at(-1).text,/gathering 6 fallen seeds/);
  state=clear(state,'dryfoot',{stars:3,seeds:8,secret:true}); state=clear(state,'alderwater',{assist:true});
  assert.deepEqual(readPlayProgress(state).levels.map(level=>level.unlocked),[true,true,true]);
  assert.deepEqual(state.play.equipped,{root:'fern-arch',riverside:'pebble-stack',canopy:'glow-petals'});
  assert.equal(state.neighbours.pell,1); assert.equal(state.neighbours.mallow,1); assert.equal(readPlayProgress(state).stars,7);
  assert.equal(state.play.claimed.length,3); assert.match(state.events.at(-1).text,/gentle mode/);
  assert.deepEqual(parseHedgeSave(serialiseHedgeSave(state)),state);
});

test('retrying is free and a result can only claim the latest saved attempt once',()=>{
  const state=begun(), first=beginPlayRun(state,'broadroot',false,NOW);
  const retry=beginPlayRun(first,'broadroot',false,NOW+1);
  assert.throws(()=>completePlayRun(retry,first.play.active.id,result(),NOW+2));
  const won=completePlayRun(retry,retry.play.active.id,result(),NOW+50000);
  assert.throws(()=>completePlayRun(won,retry.play.active.id,result(),NOW+60000));
  assert.equal(won.play.seeds,6); assert.equal(won.play.best.broadroot.clears,1);
  const abandoned=abandonPlayRun(beginPlayRun(won,'broadroot',true,NOW+60000),NOW+60001);
  assert.equal(abandoned.play.active,null); assert.equal(abandoned.play.seeds,6);
  assert.deepEqual(abandoned.play.best,won.play.best);
});

test('replays keep independent bests and discoveries while rewarding the actual seeds once',()=>{
  let state=clear(begun(),'broadroot',{stars:3,seeds:8,secret:true,timeMs:35000});
  state=clear(state,'broadroot',{stars:1,seeds:5,secret:false,timeMs:50000});
  assert.deepEqual(state.play.best.broadroot,{clears:2,stars:3,seeds:8,secret:true,timeMs:35000});
  assert.equal(state.play.seeds,13); assert.equal(state.play.decorations.length,1); assert.equal(state.neighbours.dindle,1);
  state=clear(state,'broadroot',{stars:2,seeds:5,timeMs:30000});
  assert.equal(state.play.best.broadroot.timeMs,30000); assert.equal(state.preferences.shelter,3);
});

test('home builds deduct exact cost once and switching an owned decoration costs nothing',()=>{
  const state=clear(begun());
  const built=buildHedgeDecoration(state,'moss-patch','root',state.updatedAt);
  assert.equal(built.play.seeds,2); assert.equal(built.play.equipped.root,'moss-patch');
  const switched=buildHedgeDecoration(built,'fern-arch','root',built.updatedAt);
  const again=buildHedgeDecoration(switched,'moss-patch','root',built.updatedAt);
  assert.equal(again.play.seeds,2); assert.equal(again.play.decorations.filter(id=>id==='moss-patch').length,1);
  assert.deepEqual(buildHedgeDecoration(again,'moss-patch','root',again.updatedAt),again);
  assert.throws(()=>buildHedgeDecoration(state,'moss-patch','canopy',state.updatedAt));
  assert.throws(()=>buildHedgeDecoration(state,'reed-chimes','canopy',state.updatedAt));
  let poor=clear(clear(clear(begun(),'broadroot',{seeds:5}),'dryfoot',{seeds:5}),'alderwater',{seeds:5});
  poor=buildHedgeDecoration(poor,'moss-patch','root',poor.updatedAt); poor=buildHedgeDecoration(poor,'reed-chimes','canopy',poor.updatedAt);
  assert.throws(()=>buildHedgeDecoration(poor,'ripple-ring','riverside',poor.updatedAt)); assert.equal(poor.play.seeds,5);
});

test('strict version1 migration preserves every old field and keeps live prepared outings safe',()=>{
  let state=investigateSurface(begun(),'stone',NOW);
  state=chooseOpening(state,'leave-room','custom',NOW); state=chooseOpening(state,'waterside','route',NOW); state=chooseOpening(state,'water','notice',NOW);
  state=startOuting(state,'alderwater','calm',NOW);
  const old=legacy(state), raw=JSON.stringify(old), migrated=parseHedgeSave(raw);
  assert.equal(migrated.version,HEDGE_VERSION); assert.deepEqual(legacy(migrated),old); assert.equal(JSON.stringify(old),raw);
  const played=clear(migrated); assert.deepEqual(played.outing,migrated.outing); assert.deepEqual(played.finds,migrated.finds);
  assert.equal(played.play.best.broadroot.clears,1); assert.deepEqual(parseHedgeSave(serialiseHedgeSave(played)),played);
  for (const mutate of [s=>{s.home.returningStones=999;},s=>{s.extra=true;},s=>{s.play={};},s=>{s.events[0].type='play';}]) {
    const bad=structuredClone(old); mutate(bad); assert.throws(()=>parseHedgeSave(JSON.stringify(bad)));
  }
});

test('malformed result shapes and impossible rewards cannot change a pending ticket',()=>{
  const pending=beginPlayRun(begun(),'broadroot',false,NOW), before=structuredClone(pending);
  for (const invalid of [result('dryfoot'),result('broadroot',{stars:0}),result('broadroot',{stars:4}),result('broadroot',{stars:3,seeds:5,timeMs:50000}),result('broadroot',{stars:1,seeds:8,timeMs:30000}),result('broadroot',{seeds:0}),result('broadroot',{seeds:4}),result('broadroot',{timeMs:0}),result('broadroot',{seeds:9}),result('broadroot',{seeds:-1}),result('broadroot',{assist:true}),result('broadroot',{secret:'yes'}),result('broadroot',{timeMs:Infinity}),result('broadroot',{bumps:-1}),{...result(),extra:1}]) {
    assert.throws(()=>completePlayRun(pending,pending.play.active.id,invalid,NOW+50000));
  }
  assert.deepEqual(pending,before); assert.throws(()=>beginPlayRun(pending,'broadroot','yes',NOW));
});

test('version2 imports reject impossible unlocks, duplicates, malformed active tickets and out-of-range stats',()=>{
  const good=clear(begun());
  for(const mutate of [
    s=>{s.play.extra=true;},s=>{s.play.seeds=10000;},s=>{s.play.best.broadroot.stars=4;},s=>{s.play.best.dryfoot.secret=true;},
    s=>{s.play.decorations.push('moss-patch','moss-patch');},s=>{s.play.decorations=[];},s=>{s.play.equipped.root='ripple-ring';},
    s=>{s.play.claimed.push(s.play.claimed[0]);},s=>{s.play.claimed=['run-999999'];},
    s=>{s.play.active={id:s.play.claimed[0],level:'broadroot',assist:false,startedAt:NOW};},
    s=>{s.play.active={id:`run-${s.sequence}`,level:'alderwater',assist:false,startedAt:NOW};},
    s=>{s.play.best.broadroot.timeMs=-1;},s=>{s.play.best.broadroot.timeMs=0;},s=>{s.play.best.broadroot.seeds=4;},s=>{s.play.best.broadroot.stars=3;},s=>{s.play.best.broadroot.clears=1.5;},
  ]) {const bad=structuredClone(good);mutate(bad);assert.throws(()=>parseHedgeSave(JSON.stringify(bad)));}
});

test('long replay histories remain bounded and the seed bank caps without overflow',()=>{
  let state=clear(begun()); state.play.seeds=9998; validateHedgeState(state);
  for(let i=0;i<45;i++) state=clear(state,'broadroot',{seeds:8});
  assert.equal(state.play.seeds,9999); assert.equal(state.play.claimed.length,40); assert(state.events.length<=100);
  assert.equal(state.play.best.broadroot.clears,46); assert.equal(state.play.decorations.length,1);
  assert.deepEqual(parseHedgeSave(serialiseHedgeSave(state)),state);
});
