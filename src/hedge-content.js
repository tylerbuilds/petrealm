/** Authored, original fiction for the Under the Hedge first playable. */
export const APPEARANCES = Object.freeze({
  colours: [{ id: 'river', name: 'River blue', hex: '#759b99' }, { id: 'clay', name: 'Warm clay', hex: '#bd9274' }, { id: 'stone', name: 'Pebble grey', hex: '#97968d' }],
  markings: [{ id: 'speckles', name: 'Pale speckles' }, { id: 'belly', name: 'Soft belly' }, { id: 'tail', name: 'Tail bands' }],
});
export const HOME_SPOTS = Object.freeze([
  { id: 'alcove', name: 'Memory alcove', description: 'A quiet place for things with a story.' },
  { id: 'threshold', name: 'Dry threshold', description: 'Leave room for a visitor beside it.' },
  { id: 'washing-hollow', name: 'Washing hollow', description: 'A shallow pool for a closer investigation.' },
]);
export const ROUTES = Object.freeze([
  { id: 'broadroot', name: 'Broadroot Wood', duration: 120000, description: 'Fern corridors, folded roots and a sound that belongs to its place.', neighbour: 'dindle', interest: 'shelter', icon: 'leaf' },
  { id: 'dryfoot', name: 'Dryfoot Crossing', duration: 180000, description: 'Different feet need different ways across the brook.', neighbour: 'pell', interest: 'sound', icon: 'stone' },
  { id: 'alderwater', name: 'Alderwater', duration: 300000, description: 'A sheltered shore path, slow water and a light on the far bank.', neighbour: 'mallow', interest: 'water', icon: 'water' },
]);
export const NEIGHBOURS = Object.freeze([
  { id: 'pell', name: 'Pell', family: 'Limmer', description: 'Checks where your feet actually reach. Keeps its own feet dry.', quote: 'The stone is quite sound. The water around it is less committed.' },
  { id: 'dindle', name: 'Dindle', family: 'Tuffet', description: 'Remembers the old paths. Is learning to ask what they are like now.', quote: 'Yes, there was a path. I did not say it was still there.' },
  { id: 'mallow', name: 'Mallow', family: 'Rillum', description: 'Knows everyone’s favourite bay. Has been meaning to choose its own.', quote: 'I know where everyone likes to stop. I have been meaning to choose somewhere.' },
  { id: 'ossel', name: 'Ossel', family: 'Limmer', description: 'Listens with one creased fan. Some sounds are better left where they belong.', quote: 'It made a better noise before I collected it.' },
]);
export const FIND_DETAILS = Object.freeze({
  'seed-case': { name: 'Curved seed case', description: 'Light enough to float; hollow enough to knock against a root.' },
  'root-marker': { name: 'Notched fallen bark', description: 'A tactile reminder of the sheltered way through Broadroot.' },
  'fern-curl': { name: 'Fallen fern curl', description: 'Its dry curve remembers the shape of a resting hollow.' },
  'brook-pebble': { name: 'Brook-smoothed pebble', description: 'A shallow groove makes this stone recognisable by touch.' },
  'reed-ring': { name: 'Loose reed ring', description: 'It catches the smallest movements of air beside the doorway.' },
  'alder-leaf': { name: 'Fallen alder leaf', description: 'It turned in the warm thread of water near the lake shore.' },
  'flower-seed': { name: 'Fallen lantern seed', description: 'Found beside the warm seep. It does not promise to glow at home.' },
});
export function openingScene(state) {
  const name = state.companion?.name || 'Fen';
  const common = { title: 'A Place for Someone Wet' };
  switch (state.opening.step) {
    case 'surface': return { ...common, text: `${name} already has a dry sleeping chamber, a washing hollow and a way up the bank. At the entrance, two things ask for a closer look.`, choices: [
      { id: 'stone', label: 'A smooth stone', description: 'Test its cool surface with both forepaws.' },
      { id: 'reeds', label: 'Rustling reeds', description: 'Hold still and feel the little movements.' },
    ] };
    case 'custom': return { ...common, text: `Pell taps the root before arriving. Its tail curls around a support. “A wet threshold is quite nice for you. Some of us need a dry bit.” ${name} looks at the space beside the doorway.`, choices: [
      { id: 'leave-room', label: 'Leave room for a visitor', description: 'A dry patch, with space for a tail.' },
      { id: 'ask-pell', label: 'Ask where Pell would sit', description: 'Let a different body help decide.' },
    ] };
    case 'route': return { ...common, text: 'Pell knows two ways to find loose bark at Dryfoot Crossing. New growth has changed the old passage. Either route will get you there and safely home.', choices: [
      { id: 'sheltered', label: 'Under the roots', description: 'An enclosed path with fern-soft shade.' },
      { id: 'waterside', label: 'Beside the brook', description: 'An open path with shallow water close by.' },
    ] };
    case 'notice': return { ...common, text: `${name} finds a gap ${state.opening.route === 'sheltered' ? 'beneath the new roots' : 'between the shallows and a bent alder'}. There is loose bark for a dry seat, and a curved seed case. Pell waits for ${name} to examine it first.`, choices: [
      { id: 'water', label: 'See how it floats', description: 'The case turns towards the same quiet corner.' },
      { id: 'sound', label: 'Try its hollow knock', description: 'A root gives the little case a low voice.' },
      { id: 'shelter', label: 'Set it in a snug hollow', description: 'It fits where the wind cannot reach.' },
    ] };
    default: return { ...common, text: 'The dry visitor seat is ready. Pell has tried it. The first returning stone lies beside the doorway. There are other paths whenever you feel like going.', choices: [] };
  }
}
export function preferenceText(id, name) {
  return ({ water: `${name} has started looking for the small movements in shallow water.`, sound: `${name} returns to hollow sounds, and pauses to listen before moving things.`, shelter: `${name} notices where roots hold the air still, and chooses a place to settle.` })[id];
}
