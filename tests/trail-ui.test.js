import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, adopt, startTrail, chooseTrail, trailEncounter, displayTreasure, parseSave, serialiseSave, selectPet, leaveTrail } from '../src/model.js';
import { TRAIL_TREASURES } from '../src/trails.js';
import { renderGarden, renderRealm } from '../src/views.js';
import { renderTrails } from '../src/trail-views.js';
import { treasureArt, trailScenery } from '../src/trail-art.js';

const now = Date.UTC(2026, 9, 10, 12);
const friend = () => adopt(createState(now), 'Bramble', 'thistlehorn', now, 'spirited');
function finish(state) {
  let next = startTrail(state, 'whisperwood', now);
  for (let step = 0; step < 3; step += 1) {
    const encounter = trailEncounter(next);
    const choice = encounter.choices.find((entry) => entry.kind === 'brave') || encounter.choices[0];
    next = chooseTrail(next, next.trails.active.id, step, choice.id, now);
  }
  return next;
}

test('the first trail shows entry resources before its actionable route, and no locked knack', () => {
  const html = renderTrails(friend());
  assert.ok(html.indexOf('id="trail-cost"') < html.indexOf('data-trail-start="whisperwood"'));
  assert.match(html, /at least 10 Energy and 2 Fullness/);
  assert.match(html, /data-trail-start="glowpool"[^>]*disabled/);
  assert.doesNotMatch(html, /data-trail-choice="knack"/);
  assert.match(renderGarden(friend()), /data-area="trails" class="path-sign"/);
  assert.match(renderRealm(friend()), /Explore the little trails/);
});

test('saved encounter choices retain their exact run/step and chosen reaction through render', () => {
  let state = startTrail(friend(), 'whisperwood', now);
  const first = trailEncounter(state).choices[0];
  state = chooseTrail(state, state.trails.active.id, 0, first.id, now);
  state = parseSave(serialiseSave(state));
  const html = renderTrails(state);
  assert.match(html, /data-trail-run="1" data-trail-step="1"/);
  assert.ok(html.includes(first.outcome));
  assert.match(html, /Bramble likes to try something bold/);
  assert.match(html, /Head home early · no find or reward/);
  assert.match(html, /6 Energy and 2 Fullness used to set out stay spent/);
});

test('the final chosen outcome precedes its discovery and actual capped experience is truthful', () => {
  let state = friend();
  state.pets[0].xp = 1999; state.pets[0].level = 20;
  state = finish(state);
  const final = trailEncounter({...state, trails:{...state.trails, active:{...state.trails.last, step:2, choices:state.trails.last.choices.slice(0,2)}}});
  const reaction = final.choices.find((choice) => choice.id === state.trails.last.choices[2]).outcome;
  const html = renderTrails(state);
  assert.ok(html.includes(reaction));
  assert.ok(html.indexOf(reaction) < html.indexOf('class="trail-reward"'));
  assert.match(html, /\+0 XP · up to 10 happiness/);
  assert.match(html, /Show in meadow/);
  const last = structuredClone(state.trails.last);
  state = startTrail(state, 'whisperwood', now);
  state = leaveTrail(state, state.trails.active.id, now);
  assert.deepEqual(state.trails.last, last);
  assert.match(renderTrails(state), /Last completed outing · A NEW DISCOVERY!/);
});

test('discovered objects actually enter the saved meadow while unfound objects stay hinted in journal', () => {
  let state = finish(friend());
  const id = state.trails.last.treasureId;
  assert.doesNotMatch(renderGarden(state), /class="meadow-treasures"/);
  state = displayTreasure(state, id, 0, now);
  const restored = parseSave(serialiseSave(state));
  assert.match(renderGarden(restored), /class="meadow-treasures"/);
  assert.ok(renderGarden(restored).includes(`data-treasure-select="${id}"`));
  assert.match(renderTrails(restored, id, true), /Replaced treasures stay in your journal/);
  assert.match(renderTrails(restored), /Something to discover/);
  state = displayTreasure(restored, null, 0, now);
  assert.deepEqual(state.trails.collection, [id]);
  assert.doesNotMatch(renderGarden(state), /class="meadow-treasures"/);
});

test('friend-specific route and knack controls survive switching without borrowing another bond', () => {
  let state = finish(finish(friend()));
  state = adopt(state, 'Puddle', 'gloomdrop', now, 'gentle');
  assert.match(renderTrails(state), /Puddle needs 2 bond/);
  state = selectPet(state, 'pet-1', now);
  assert.doesNotMatch(renderTrails(state), /data-trail-start="glowpool"[^>]*disabled/);
  state = startTrail(state, 'whisperwood', now);
  assert.match(renderTrails(state), /data-trail-choice="knack"/);
  assert.match(renderTrails(state), /Bramble’s knack/);
});

test('new scenery and treasure drawings have distinct original geometries', () => {
  const ids = ['fern-flute','button-mushroom','seed-lantern','ripple-shell','glass-pebble','pond-crown','cloud-kite','wind-chime','sunwheel'];
  assert.equal(new Set(ids.map((id) => treasureArt(id, 'Same label'))).size, 9);
  assert.equal(new Set(['whisperwood','glowpool','windridge'].flatMap((id) => [0,1,2].map((variant) => trailScenery(id, variant)))).size, 9);
  for (const id of ids) assert.match(treasureArt(id), /focusable="false"/);
  for (const id of ['button-mushroom', 'glass-pebble', 'wind-chime']) {
    assert.match(TRAIL_TREASURES[id].hint, /knack at the final/);
    assert.match(TRAIL_TREASURES[id].hint, /different outings/);
  }
});
