import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, WORLD_WIDTH, WORLD_HEIGHT, createRun, stepRun } from '../src/hedge-play-engine.js';

const walk = (run, x, y) => {
  let frames = 0;
  while (!run.finished && Math.hypot(x - run.player.x, y - run.player.y) > 7) {
    const dx = x - run.player.x, dy = y - run.player.y, d = Math.hypot(dx, dy);
    stepRun(run, { x: dx / d, y: dy / d }, .05);
    assert(++frames < 1000, `Cannot reach ${x},${y} from ${run.player.x},${run.player.y} in ${run.level}`);
  }
};
const routes = {
  broadroot: [[190,560],[560,535],[858,535],[858,420],[455,395],[100,395],[88,250],[425,230],[850,230],[850,205],[806,100],[520,70],[72,73],[882,75]],
  dryfoot: [[155,488],[315,481],[453,481],[489,558],[453,384],[466,163],[180,156],[466,163],[466,322],[625,322],[720,322],[786,415],[899,415],[899,164],[843,164],[890,72]],
  alderwater: [[157,414],[170,145],[77,79],[199,145],[199,205],[419,157],[419,443],[637,499],[665,267],[868,247],[798,111],[878,76]],
};

test('three distinct, fresh deterministic courses reject unknown paths', () => {
  assert.equal(LEVELS.length, 3);
  for (const level of LEVELS) {
    const one = createRun(level.id, { seed: 8 });
    assert.deepEqual(one, createRun(level.id, { seed: 8 }));
    assert.equal(one.seeds.length, 8);
    one.walls[0].x = 9999;
    assert.notEqual(createRun(level.id).walls[0].x, 9999);
  }
  assert.throws(() => createRun('missing'));
});

test('every seed, optional secret and exit can be reached by ordinary movement on every course', () => {
  for (const level of LEVELS) {
    const run = createRun(level.id);
    for (const [x,y] of routes[level.id]) walk(run,x,y);
    assert.equal(run.finished, true, level.id);
    assert.equal(run.result.seeds,8,level.id);
    assert.equal(run.result.secret,true,level.id);
    assert(run.result.timeMs < 90000, `${level.id} took ${run.result.timeMs}ms`);
    assert.equal(run.result.stars, 2 + Number(run.result.timeMs <= level.parSeconds * 1000));
    assert.equal(Object.isFrozen(run.result), true);
  }
});

test('idle time never moves Fen, collects progress, or ends a run', () => {
  const run = createRun('broadroot');
  const start = {x:run.player.x,y:run.player.y};
  for(let i=0;i<2400;i++) stepRun(run,{},.05);
  assert.equal(run.player.x,start.x); assert.equal(run.player.y,start.y);
  assert.equal(run.collected,0); assert.equal(run.finished,false);
  assert(Math.abs(run.elapsed-120)<1e-7);
});

test('diagonals have equal speed, analog input is proportional, and malformed input cannot poison the run', () => {
  const horizontal=createRun('broadroot'), diagonal=createRun('broadroot');
  stepRun(horizontal,{x:1},.05); stepRun(diagonal,{x:1,y:1},.05);
  assert(Math.abs(Math.hypot(diagonal.player.x-75,diagonal.player.y-560)-(horizontal.player.x-75))<1e-8);
  const analog=createRun('broadroot'); stepRun(analog,{x:.5},.05);
  assert(Math.abs(analog.player.x-75-(horizontal.player.x-75)/2)<1e-8);
  stepRun(analog,{x:Infinity,y:NaN},NaN);
  assert(Number.isFinite(analog.player.x)); assert.equal(analog.elapsed,.05);
});

test('frame clamping prevents background leaps and zero or negative delta leaves state untouched', () => {
  const run=createRun('broadroot'); stepRun(run,{x:1},60);
  assert.equal(run.elapsed,.05); assert(run.player.x<83);
  const snapshot=structuredClone(run);
  stepRun(run,{x:1,dash:true},0); stepRun(run,{x:1,dash:true},-1);
  assert.deepEqual(run,snapshot);
});

test('dash is edge-triggered, bounded by cooldown, and never tunnels through solid roots or world edges', () => {
  const run=createRun('broadroot');
  for(let i=0;i<60;i++) stepRun(run,{x:-1,dash:true},.05);
  assert.equal(run.effects.filter(e=>e.type==='dash').length,0);
  assert.equal(run.player.x,19); assert.equal(run.player.cooldown,0);
  stepRun(run,{y:-1,dash:false},.05); stepRun(run,{y:-1,dash:true},.05);
  assert(run.player.dashTime>0);
  for(let i=0;i<120;i++) stepRun(run,{y:-1,dash:i%24===0},.05);
  assert(run.player.y>=504,`Root crossing at ${run.player.y}`);
  assert(run.player.x>=run.player.radius && run.player.x<=WORLD_WIDTH-run.player.radius);
  assert(run.player.y>=run.player.radius && run.player.y<=WORLD_HEIGHT-run.player.radius);
});

test('hazards slow briefly, dash avoids them, and gentle mode reduces their contact area', () => {
  const encounter=(assist=false,dash=false)=>{
    const run=createRun('broadroot',{assist});
    run.hazards=[{id:'test',x:90,y:560,originX:90,originY:560,axis:'x',range:0,period:3,radius:24,phase:0,kind:'bramble',active:true}];
    stepRun(run,{x:1,dash},.05); return run;
  };
  const bumped=encounter(); assert.equal(bumped.bumps,1); assert(bumped.player.slowTime>0);
  bumped.hazards=[]; for(let i=0;i<30;i++)stepRun(bumped,{},.05);
  assert.equal(bumped.player.slowTime,0);
  assert.equal(encounter(false,true).bumps,0);
  assert(encounter(true).player.slowTime<encounter().player.slowTime);
});

test('exit stays closed without five seeds and completed runs cannot change their result', () => {
  const closed=createRun('broadroot'); closed.player.x=closed.goal.x;closed.player.y=closed.goal.y;
  stepRun(closed,{},.05);assert.equal(closed.finished,false);assert.equal(closed.goal.open,false);
  const complete=createRun('broadroot');for(const [x,y] of routes.broadroot)walk(complete,x,y);
  const snapshot=structuredClone(complete);
  for(let i=0;i<50;i++)stepRun(complete,{x:1,dash:true},.05);
  assert.deepEqual(complete,snapshot);
});

test('fixed inputs and seed reproduce motion, pickup and hazard timing exactly', () => {
  const one=createRun('dryfoot',{seed:71}),two=createRun('dryfoot',{seed:71});
  for(let i=0;i<900;i++){
    const input={x:Math.sin(i/100),y:Math.cos(i/80),dash:i%29===0};
    stepRun(one,input,1/60);stepRun(two,input,1/60);
  }
  assert.deepEqual(one,two);
});

test('stars distinguish a gentle finish, a quick finish and a complete collection without requiring the secret', () => {
  const earlyRoute = [...routes.broadroot.slice(0,10),[850,80],[882,75]];
  const slow=createRun('broadroot');
  for(let i=0;i<800;i++)stepRun(slow,{},.05);
  for(const [x,y]of earlyRoute)walk(slow,x,y);
  assert.equal(slow.result.stars,1);assert.equal(slow.result.seeds,7);assert.equal(slow.result.secret,false);
  const quick=createRun('broadroot');for(const[x,y]of earlyRoute)walk(quick,x,y);
  assert.equal(quick.result.stars,2);assert.equal(quick.result.seeds,7);
  const full=createRun('broadroot');
  for(const[x,y]of [...routes.broadroot.slice(0,12),[882,75]])walk(full,x,y);
  assert.equal(full.result.stars,3);assert.equal(full.result.seeds,8);assert.equal(full.result.secret,false);
});
