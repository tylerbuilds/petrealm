/** A deterministic, clock-free little adventure. Runs are mutable and never persisted. */
export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 640;
export const LEVELS = Object.freeze([
  Object.freeze({ id: 'broadroot', title: 'Broadroot Rush', subtitle: 'Curl through the roots. Dash past the swinging brambles.', parSeconds: 35, colour: '#8aaa64' }),
  Object.freeze({ id: 'dryfoot', title: 'Brook Skip', subtitle: 'Find the crossings. Slip past the muddy currents.', parSeconds: 32, colour: '#6ba9a6' }),
  Object.freeze({ id: 'alderwater', title: 'Lantern Trail', subtitle: 'Follow the glow. Time your dash through the ripples.', parSeconds: 35, colour: '#8d96be' }),
]);
export const TIMING_LIMIT_SECONDS = 4;
export const TIMING_FEEDBACK_SECONDS = .65;
export const MAX_MISSES = 3;
const timingDifficulty = Object.freeze({
  broadroot: { width: .20, speed: .8 },
  dryfoot: { width: .18, speed: .9 },
  alderwater: { width: .15, speed: 1 },
});
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const wall = (x, y, w, h, kind = 'root') => ({ x, y, w, h, kind });
const layouts = {
  broadroot: {
    start: [75, 560], goal: [882, 75], secret: [72, 73],
    walls: [wall(0, 455, 754, 34), wall(204, 300, 756, 34), wall(0, 147, 754, 34)],
    seeds: [[190, 560], [560, 535], [858, 420], [455, 395], [88, 250], [425, 230], [850, 205], [520, 70]],
    hazards: [
      { x: 804, y: 390, axis: 'y', range: 53, period: 3.3, radius: 24, kind: 'bramble' },
      { x: 145, y: 340, axis: 'x', range: 45, period: 3.8, radius: 23, kind: 'bramble' },
      { x: 802, y: 174, axis: 'y', range: 55, period: 3, radius: 25, kind: 'bramble' },
    ],
  },
  dryfoot: {
    start: [73, 556], goal: [890, 72], secret: [489, 558],
    walls: [
      wall(270, 0, 90, 125, 'water'), wall(270, 205, 90, 235, 'water'), wall(270, 525, 90, 115, 'water'),
      wall(575, 0, 94, 280, 'water'), wall(575, 365, 94, 275, 'water'),
      wall(765, 260, 110, 40, 'stone'),
    ],
    seeds: [[155, 488], [315, 481], [453, 384], [466, 163], [180, 156], [625, 322], [786, 415], [843, 164]],
    hazards: [
      { x: 315, y: 481, axis: 'x', range: 55, period: 3.8, radius: 22, kind: 'mud' },
      { x: 623, y: 322, axis: 'y', range: 24, period: 2.8, radius: 24, kind: 'mud' },
      { x: 805, y: 155, axis: 'x', range: 66, period: 4.4, radius: 26, kind: 'mud' },
    ],
  },
  alderwater: {
    start: [76, 565], goal: [878, 76], secret: [77, 79],
    walls: [wall(240, 260, 115, 380, 'water'), wall(480, 0, 108, 395, 'water'), wall(730, 300, 100, 340, 'water'), wall(28, 181, 111, 33, 'stone')],
    seeds: [[157, 414], [199, 205], [419, 157], [422, 443], [637, 499], [665, 267], [868, 247], [798, 111]],
    hazards: [
      { x: 301, y: 194, axis: 'x', range: 23, period: 3.6, radius: 33, kind: 'ripple', pulse: 3.1 },
      { x: 536, y: 451, axis: 'y', range: 17, period: 4.2, radius: 36, kind: 'ripple', pulse: 3.6 },
      { x: 776, y: 240, axis: 'x', range: 25, period: 3.8, radius: 32, kind: 'ripple', pulse: 2.9 },
    ],
  },
};

export function createRun(levelId, options = {}) {
  const level = LEVELS.find(candidate => candidate.id === levelId);
  if (!level) throw new Error('Choose a known hedge path.');
  const layout = layouts[levelId];
  const seed = Number.isSafeInteger(options.seed) ? options.seed >>> 0 : 1;
  return {
    level: level.id, assist: options.assist === true, elapsed: 0, collected: 0, bumps: 0,
    start: { x: layout.start[0], y: layout.start[1] },
    finished: false, failed: false, result: null, challenge: null, misses: 0, perfects: 0,
    timingPhase: 0, trailElapsed: 0, stopHeld: false,
    banner: 'Stop the spark in the green to earn 5 glowseeds. Three misses end the run.',
    player: { x: layout.start[0], y: layout.start[1], radius: 15, facing: 'right', dashTime: 0, cooldown: 0, slowTime: 0, invincibleTime: 0, directionX: 1, directionY: 0 },
    walls: layout.walls.map(item => ({ ...item })),
    seeds: layout.seeds.map(([x, y], index) => ({ id: `seed-${index + 1}`, x, y, collected: false })),
    goal: { x: layout.goal[0], y: layout.goal[1], radius: 30, open: false },
    secret: { x: layout.secret[0], y: layout.secret[1], collected: false },
    hazards: layout.hazards.map((item, index) => ({ ...item, id: `hazard-${index + 1}`, originX: item.x, originY: item.y, phase: ((seed + index * 37) % 97) / 97 * Math.PI * 2, active: true })),
    effects: [], nextEffect: 1, dashHeld: false,
  };
}
function effect(run, type, x, y) {
  run.effects.push({ id: run.nextEffect++, type, x, y, life: type === 'finish' ? 1.2 : .7 });
}
function collides(player, obstacle) {
  const x = clamp(player.x, obstacle.x, obstacle.x + obstacle.w);
  const y = clamp(player.y, obstacle.y, obstacle.y + obstacle.h);
  return Math.hypot(player.x - x, player.y - y) < player.radius;
}
function movePlayer(run, dx, dy) {
  const player = run.player;
  // Small independent axis steps prevent tunnelling, and make sliding along roots forgiving.
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 5));
  for (let step = 0; step < count; step++) {
    const previousX = player.x;
    player.x = clamp(player.x + dx / count, player.radius + 4, WORLD_WIDTH - player.radius - 4);
    if (run.walls.some(item => collides(player, item))) player.x = previousX;
    const previousY = player.y;
    player.y = clamp(player.y + dy / count, player.radius + 4, WORLD_HEIGHT - player.radius - 4);
    if (run.walls.some(item => collides(player, item))) player.y = previousY;
  }
}

function startChallenge(run, seed) {
  const index = run.seeds.indexOf(seed);
  const width = run.assist ? .27 : timingDifficulty[run.level].width;
  const centre = [.57, .72, .43, .64, .36, .76, .52, .67][index];
  run.timingPhase = 0;
  run.player.dashTime = 0;
  run.challenge = {
    seedId: seed.id, position: 0, targetStart: centre - width / 2, targetEnd: centre + width / 2,
    perfectStart: centre - width * .14, perfectEnd: centre + width * .14,
    remaining: TIMING_LIMIT_SECONDS, status: 'active', feedbackRemaining: 0,
  };
  run.banner = 'Stop the spark inside the green. Aim for the bright centre!';
}
function resolveChallenge(run, stopped) {
  const challenge = run.challenge;
  const hit = stopped && challenge.position >= challenge.targetStart && challenge.position <= challenge.targetEnd;
  if (hit) {
    const seed = run.seeds.find(item => item.id === challenge.seedId);
    const perfect = challenge.position >= challenge.perfectStart && challenge.position <= challenge.perfectEnd;
    challenge.status = perfect ? 'perfect' : 'hit';
    seed.collected = true;
    run.collected++;
    if (perfect) run.perfects++;
    run.goal.open = run.collected >= 5;
    effect(run, 'seed', seed.x, seed.y);
    run.banner = perfect ? 'Perfect stop! A glowseed earned.' : 'Nice stop! A glowseed earned.';
  } else {
    challenge.status = 'miss';
    run.misses++;
    effect(run, 'bump', run.player.x, run.player.y);
    run.banner = stopped ? 'Outside the green. Watch the next pass.' : 'Time ran out. Catch the next spark.';
    if (run.misses >= MAX_MISSES) {
      run.failed = true;
      run.finished = true;
      run.banner = 'Three missed sparks. Try again — each run is a fresh start.';
    }
  }
  challenge.feedbackRemaining = TIMING_FEEDBACK_SECONDS;
}
function advanceChallenge(run, stopPressed, delta) {
  const challenge = run.challenge;
  if (challenge.status !== 'active') {
    challenge.feedbackRemaining = Math.max(0, challenge.feedbackRemaining - delta);
    if (challenge.feedbackRemaining === 0) {
      if (challenge.status === 'miss') startChallenge(run, run.seeds.find(item => item.id === challenge.seedId));
      else run.challenge = null;
    }
    return;
  }
  // Judge the marker that was displayed when input arrived, before advancing it.
  // This keeps timing consistent across frame rates and makes the boundary inclusive.
  if (stopPressed) {
    resolveChallenge(run, true);
    return;
  }
  challenge.remaining = Math.max(0, challenge.remaining - delta);
  if (challenge.remaining <= 1e-9) {
    challenge.remaining = 0;
    resolveChallenge(run, false);
    return;
  }
  const speed = run.assist ? .6 : timingDifficulty[run.level].speed;
  run.timingPhase = (run.timingPhase + speed * delta) % 2;
  challenge.position = run.timingPhase <= 1 ? run.timingPhase : 2 - run.timingPhase;
}

/** Advance at most 50 ms. Call only while visible/unpaused; no wall-clock time is read. */
export function stepRun(run, input = {}, dt = 0) {
  if (run.finished) return run;
  const delta = Number.isFinite(dt) ? clamp(dt, 0, .05) : 0;
  if (!delta) return run;
  const player = run.player;
  run.elapsed += delta;
  const stopPressed = input.stop === true && !run.stopHeld;
  run.stopHeld = input.stop === true;
  run.effects = run.effects.map(item => ({ ...item, life: item.life - delta })).filter(item => item.life > 0);
  if (run.challenge) {
    run.dashHeld = input.dash === true;
    advanceChallenge(run, stopPressed, delta);
    return run;
  }
  run.trailElapsed += delta;
  player.cooldown = Math.max(0, player.cooldown - delta);
  player.dashTime = Math.max(0, player.dashTime - delta);
  player.slowTime = Math.max(0, player.slowTime - delta);
  player.invincibleTime = Math.max(0, player.invincibleTime - delta);
  let x = Number.isFinite(input.x) ? clamp(input.x, -1, 1) : 0;
  let y = Number.isFinite(input.y) ? clamp(input.y, -1, 1) : 0;
  const magnitude = Math.hypot(x, y);
  if (magnitude > 1) { x /= magnitude; y /= magnitude; }
  if (magnitude > .05) {
    player.directionX = x / Math.hypot(x, y); player.directionY = y / Math.hypot(x, y);
    if (Math.abs(x) > .05) player.facing = x < 0 ? 'left' : 'right';
  }
  const dash = input.dash === true;
  if (dash && !run.dashHeld && player.cooldown === 0) {
    player.dashTime = .23; player.cooldown = run.assist ? .7 : 1.1; player.slowTime = 0;
    effect(run, 'dash', player.x, player.y);
  }
  run.dashHeld = dash;
  const dashing = player.dashTime > 0;
  const speed = dashing ? 370 : player.slowTime > 0 ? 72 : 138;
  movePlayer(run, (dashing ? player.directionX : x) * speed * delta, (dashing ? player.directionY : y) * speed * delta);
  for (const hazard of run.hazards) {
    const wave = Math.sin(run.trailElapsed * Math.PI * 2 / hazard.period + hazard.phase);
    hazard.x = hazard.originX + (hazard.axis === 'x' ? wave * hazard.range : 0);
    hazard.y = hazard.originY + (hazard.axis === 'y' ? wave * hazard.range : 0);
    hazard.active = !hazard.pulse || ((run.trailElapsed + hazard.phase) % hazard.pulse) / hazard.pulse < .52;
    if (hazard.active && !dashing && player.invincibleTime === 0 && distance(player, hazard) < player.radius + hazard.radius * (run.assist ? .55 : 1)) {
      player.slowTime = run.assist ? .3 : .75; player.invincibleTime = 1.4; run.bumps++;
      effect(run, 'bump', player.x, player.y);
      run.banner = 'A little wobble! Dash slips past the next one.';
    }
  }
  for (const seed of run.seeds) {
    if (!seed.collected && distance(player, seed) <= (run.assist ? 40 : 28)) {
      startChallenge(run, seed);
      return run;
    }
  }
  if (!run.secret.collected && distance(player, run.secret) <= (run.assist ? 40 : 28)) {
    run.secret.collected = true; effect(run, 'secret', run.secret.x, run.secret.y);
    run.banner = 'A hidden keepsake! It is coming home with you.';
  }
  run.goal.open = run.collected >= 5;
  if (run.goal.open && distance(player, run.goal) < player.radius + run.goal.radius) {
    const timeMs = Math.round(run.elapsed * 1000);
    const par = LEVELS.find(item => item.id === run.level).parSeconds;
    run.finished = true;
    run.result = Object.freeze({ level: run.level, stars: 1 + Number(run.collected === 8) + Number(timeMs <= par * 1000), seeds: run.collected, secret: run.secret.collected, timeMs, bumps: run.bumps, assist: run.assist });
    run.banner = 'Home with a pocketful of light.'; effect(run, 'finish', player.x, player.y);
  }
  return run;
}
