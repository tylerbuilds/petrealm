import { SPECIES, PERSONALITIES, readActivePet, trailProgress, trailEncounter } from './model.js';
import { TRAIL_ROUTES, TRAIL_TREASURES } from './trails.js';
import { creature } from './art.js';
import { guideArt } from './world-art.js';
import { treasureArt, trailScenery } from './trail-art.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const approachVerbs = {observe:'notice small things',help:'lend a paw',explore:'follow their curiosity',brave:'try something bold'};
const slots = ['By the pond', 'At the treehouse', 'Beside the path'];
const portrait = (pet) => creature(pet?.species || 'mossling', pet ? `${SPECIES[pet.species].name}, ${pet.journey?.growth ? 'first bloom' : 'young companion'}` : 'A Petrealm companion', pet?.wearing || {}, Boolean(pet?.journey?.growth));

export function meadowTreasures(state) {
  const displayed = state.trails?.display || [];
  if (!displayed.some(Boolean)) return '';
  return `<div class="meadow-treasures" aria-label="Treasures in your meadow">${displayed.map((id, slot) => id ? `<button data-area="trails" data-treasure-select="${id}" class="meadow-treasure" aria-label="${escape(TRAIL_TREASURES[id].name)}, ${slots[slot].toLowerCase()}. Change meadow display">${treasureArt(id, TRAIL_TREASURES[id].name)}<span>${slots[slot]}</span></button>` : `<span class="meadow-treasure empty"><span class="empty-treasure" aria-hidden="true">✿</span><span>${slots[slot]}</span></span>`).join('')}</div>`;
}

function displayChoices(state, selected) {
  if (!selected || !state.trails.collection.includes(selected)) return '';
  const find = TRAIL_TREASURES[selected];
  return `<section class="treasure-placement" id="treasure-placement" aria-label="Display your treasure"><div class="placement-find">${treasureArt(selected, find.name)}<div><h3>Where shall ${escape(find.name.toLowerCase())} go?</h3><p>Choose a meadow spot. Replaced treasures stay in your journal.</p></div></div><div class="treasure-spots">${slots.map((name, index) => `<button id="treasure-slot-${index}" data-display-treasure="${selected}" data-display-slot="${index}" class="button secondary-button" aria-pressed="${state.trails.display[index] === selected}">${name}<small>${state.trails.display[index] ? escape(TRAIL_TREASURES[state.trails.display[index]].name) : 'An empty spot'}</small></button>`).join('')}</div><button data-area="garden" class="text-button">Go see your meadow →</button></section>`;
}

function journal(state, selected, open) {
  return `<details id="trail-journal" class="trail-journal" ${open || selected ? 'open' : ''}><summary id="trail-journal-summary">Your field journal <span>${state.trails.collection.length} / 9 finds</span></summary><div class="journal-pages"><p>Every treasure has a place to find it. Try another way through a trail; your friend's knack opens another choice.</p>${displayChoices(state, selected)}${Object.values(TRAIL_ROUTES).map((route) => `<section class="journal-route"><h3>${escape(route.name)}</h3><div class="journal-finds">${route.treasures.map((id) => {
    const find = TRAIL_TREASURES[id];
    const found = state.trails.collection.includes(id);
    const displayed = state.trails.display.indexOf(id);
    return `<article class="journal-find ${found ? 'found' : 'unfound'}">${treasureArt(found ? id : '', found ? find.name : 'An undiscovered treasure')}<div><h4>${found ? escape(find.name) : 'Something to discover'}</h4><p>${escape(found ? find.description : find.hint)}</p>${found ? `<button data-treasure-select="${id}" class="text-button">${displayed >= 0 ? `Shown ${slots[displayed].toLowerCase()} · move it` : 'Show in your meadow'} →</button>` : ''}</div></article>`;
  }).join('')}</div></section>`).join('')}<div class="journal-display"><h3>Your meadow spots</h3>${state.trails.display.map((id, index) => `<div><span>${slots[index]}: ${id ? escape(TRAIL_TREASURES[id].name) : 'ready for a find'}</span>${id ? `<button data-display-slot="${index}" data-clear-treasure class="text-button" aria-label="Put ${escape(TRAIL_TREASURES[id].name)} back in your journal">Put away</button>` : ''}</div>`).join('')}</div></div></details>`;
}

function trailResult(state) {
  const result = state.trails.last;
  if (!result || result.petId !== state.activePetId) return '';
  const pet = readActivePet(state);
  const find = TRAIL_TREASURES[result.treasureId];
  const finalEncounter = trailEncounter({...state, trails:{...state.trails, active:{id:result.id,petId:result.petId,routeId:result.routeId,variant:result.variant,step:2,choices:result.choices.slice(0,2)}}});
  const reaction = finalEncounter.choices.find((choice) => choice.id === result.choices[2])?.outcome;
  return `<section class="trail-discovery" aria-labelledby="trail-result-title"><div class="discovery-art">${treasureArt(result.treasureId, find.name)}</div><div><p class="eyebrow">Last completed outing · ${result.newFind ? 'A NEW DISCOVERY!' : 'A FAMILIAR FIND, A NEW ADVENTURE'}</p><h2 id="trail-result-title" tabindex="-1">${escape(find.name)}</h2>${reaction ? `<p class="trail-reaction">${escape(pet.name)}: ${escape(reaction)}</p>` : ''}<p>${escape(find.description)}</p><p class="trail-reward">${escape(pet.name)} grew closer to you. +${result.bondGain} bond · +${result.xpGain} XP · up to 10 happiness</p><button data-treasure-select="${result.treasureId}" class="button dark-button">Show in meadow →</button></div></section>`;
}

export function renderTrails(state, selected = null, journalOpen = false) {
  const progress = trailProgress(state);
  const pet = readActivePet(state);
  const name = pet?.name || 'Your companion';
  const encounter = state.trails.active ? trailEncounter(state) : null;
  const bondCopy = pet ? `${name} and you: ${progress.bond} bond, ${progress.trips} ${progress.trips === 1 ? 'outing' : 'outings'} together.` : 'Meet a companion, then take the first path together.';
  const knackCopy = progress.knack ? `${name}'s ${PERSONALITIES[pet.personality].name.toLowerCase()} knack is ready. Look for a third approach on each trail.` : `At 3 bond, ${name} can use a special knack on the trail.`;
  if (encounter) {
    const run = state.trails.active;
    return `<section class="trail-play" aria-label="Trail adventure"><div class="trail-topline"><button data-area="garden" class="text-button">← Meadow · trail stays saved</button><span>${escape(encounter.route.name)} · ${run.step + 1} / 3</span></div><div class="trail-stage ${run.routeId}">${trailScenery(run.routeId, run.variant)}<div class="trail-companion">${portrait(pet)}<span>${escape(name)} is exploring with you</span></div><div class="trail-landmark">${treasureArt(encounter.route.treasures[(run.variant + run.step) % 3], 'A little wonder along the path')}</div></div><div class="trail-story">${encounter.previousOutcome ? `<p class="trail-reaction" id="trail-reaction" role="status">${escape(name)}: ${escape(encounter.previousOutcome)}</p>` : ''}<p class="eyebrow">${escape(PERSONALITIES[pet.personality].name)} FRIEND · ${progress.bond} BOND</p><h2 id="trail-encounter-title" tabindex="-1">${escape(encounter.title)}</h2><p>${escape(encounter.text)}</p><p class="trail-friend-hint">${escape(name)} likes to ${approachVerbs[progress.preferred]}. ${progress.knack ? 'Their knack gives you another way.' : 'Choose what feels right to you.'}</p><div class="trail-choices">${encounter.choices.map((choice) => `<button data-trail-choice="${choice.id}" data-trail-run="${run.id}" data-trail-step="${run.step}" class="trail-choice ${choice.id === 'knack' ? 'knack-choice' : ''}"><strong>${choice.id === 'knack' ? `${escape(name)}’s knack: ` : ''}${escape(choice.label)}</strong><span>${choice.kind === progress.preferred ? 'Your friend enjoys this approach · can earn +1 bond' : 'Try a different way through'}</span></button>`).join('')}</div><div class="trail-leave"><p>Finished outings earn up to 12 XP, 10 happiness and 1–2 bond. There’s no rush.</p><button id="trail-leave" data-trail-run="${run.id}" data-trail-step="${run.step}" class="text-button">Head home early · no find or reward</button><small>The 6 Energy and 2 Fullness used to set out stay spent.</small></div></div></section>${journal(state, selected, journalOpen)}`;
  }
  return `${trailResult(state)}<section class="trail-map" aria-labelledby="trail-map-title"><div class="trail-map-heading">${guideArt()}<div><p class="eyebrow">LET’S TAKE THE LITTLE PATH</p><h2 id="trail-map-title" tabindex="-1">What’s around the bend?</h2><p>${escape(bondCopy)}</p><p class="trail-bond-hint">${escape(knackCopy)}</p></div></div><p class="trail-cost" id="trail-cost"><strong>Setting out uses 6 Energy + 2 Fullness.</strong> Your friend needs at least 10 Energy and 2 Fullness. Nap in the meadow whenever you like. A trail stays saved if you visit another place.</p><div class="trail-routes">${progress.routes.map((route) => `<div class="trail-route ${route.id}"><div class="route-window">${trailScenery(route.id, progress.trips % 3)}</div><h3>${escape(route.name)}</h3><p>${escape(route.description)}</p><button data-trail-start="${route.id}" class="button ${route.ready ? 'dark-button' : 'secondary-button'}" ${route.ready ? '' : 'disabled'}>${route.unlocked ? `Explore ${escape(route.name)} →` : `${escape(name)} needs ${route.bond} bond`}</button><p class="route-requirement">${route.ready ? 'Three choices. A little surprise.' : escape(route.reason)}</p></div>`).join('')}</div><button data-area="garden" data-scroll-target="companion-dock" class="text-button">Back for a treat or nap →</button></section>${journal(state, selected, journalOpen)}`;
}
