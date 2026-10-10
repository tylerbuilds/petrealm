/** Original, finite adventure stories. No timers, chance purchases or remote state. */
export const PERSONALITY_APPROACHES = Object.freeze({ steady: 'observe', gentle: 'help', curious: 'explore', spirited: 'brave' });
export const APPROACH_NAMES = Object.freeze({ observe: 'Notice small things', help: 'Lend a paw', explore: 'Follow your curiosity', brave: 'Try something bold' });
const choice = (id, label, outcome) => Object.freeze({ id, kind: id, label, outcome });
const scene = (title, text, first, second) => Object.freeze({ title, text, choices: Object.freeze([first, second]) });

export const TRAIL_TREASURES = Object.freeze({
  'fern-flute': Object.freeze({ id: 'fern-flute', routeId: 'whisperwood', name: 'Fern flute', description: 'A curled fern that whistles when the breeze passes.', hint: 'Listen for the quiet notes in Whisperwood.' }),
  'button-mushroom': Object.freeze({ id: 'button-mushroom', routeId: 'whisperwood', name: 'Button mushroom', description: 'A tiny spotted mushroom with a perfectly round cap.', hint: 'Use your friend’s knack at the last stop in Whisperwood. Try it on different outings.' }),
  'seed-lantern': Object.freeze({ id: 'seed-lantern', routeId: 'whisperwood', name: 'Seed lantern', description: 'A hollow seedpod holding a soft, friendly glow.', hint: 'Try a new path through the trees.' }),
  'ripple-shell': Object.freeze({ id: 'ripple-shell', routeId: 'glowpool', name: 'Ripple shell', description: 'A shell whose rings look like a whole pond in miniature.', hint: 'Look closely at the edges of Glowpool.' }),
  'glass-pebble': Object.freeze({ id: 'glass-pebble', routeId: 'glowpool', name: 'Glass pebble', description: 'A smooth blue stone that catches the underwater light.', hint: 'Use your friend’s knack at the last stop in Glowpool. Try it on different outings.' }),
  'pond-crown': Object.freeze({ id: 'pond-crown', routeId: 'glowpool', name: 'Pond crown', description: 'A little crown woven from reeds and floating flowers.', hint: 'Follow the lights beyond the familiar bank.' }),
  'cloud-kite': Object.freeze({ id: 'cloud-kite', routeId: 'windridge', name: 'Cloud kite', description: 'A leaf-and-thread kite shaped like a sleepy cloud.', hint: 'Watch how the wind changes on the ridge.' }),
  'wind-chime': Object.freeze({ id: 'wind-chime', routeId: 'windridge', name: 'Wind chime', description: 'Three hollow twigs that sing a clear little tune.', hint: 'Use your friend’s knack at the last stop in Windridge. Try it on different outings.' }),
  sunwheel: Object.freeze({ id: 'sunwheel', routeId: 'windridge', name: 'Sunwheel', description: 'A golden flower-wheel that turns without a sound.', hint: 'There is more than one way to reach a high place.' }),
});

export const TRAIL_ROUTES = Object.freeze({
  whisperwood: Object.freeze({ id: 'whisperwood', name: 'Whisperwood', bond: 0, theme: 'woodland', description: 'Small rustles, shy neighbours and secret paths.', treasures: Object.freeze(['fern-flute', 'button-mushroom', 'seed-lantern']), variants: Object.freeze([
    Object.freeze([
      scene('A rustle under the fern', 'A little snail is stuck behind a fallen twig. A narrow path disappears beside it.', choice('help', 'Lift the twig for the snail', 'The snail uncurls and shows you a sheltered way between the roots.'), choice('explore', 'Follow the narrow path', 'You find a tunnel of fern leaves. Your companion checks that the snail has a clear way out.')),
      scene('The hollow-tree knock', 'Three soft knocks come from a hollow tree. Your companion tilts their head.', choice('observe', 'Listen and knock back', 'A woodbeetle answers with a tiny rhythm. Together you remember its tune.'), choice('brave', 'Peek through the hollow', 'Your companion leads the way. Inside, the beetles have built a whole little hall.')),
      scene('The whispering clearing', 'The trees open around a ring of seedpods. Something shines beneath the leaves.', choice('observe', 'Follow the quiet rustling', 'You notice a small trail of fallen seeds and find a woodland keepsake.'), choice('explore', 'Take the winding path', 'A new corner of the clearing holds a keepsake for your meadow.')),
    ]),
    Object.freeze([
      scene('The leaf-boat crossing', 'A line of ants is trying to cross a shallow puddle on a leaf.', choice('help', 'Steady their leaf boat', 'The ants reach the far bank and wave their feelers in thanks.'), choice('brave', 'Find a stepping-stone route', 'Your companion tests the stones and shows everyone a safe crossing.')),
      scene('Something in the canopy', 'A bright feather drifts from above. The branches sound like a little orchestra.', choice('observe', 'Watch the branches sway', 'You spot a nest of windbells. Your companion listens without disturbing it.'), choice('explore', 'Follow the drifting feather', 'The feather leads to a sunny nook you have never visited.')),
      scene('The mushroom picnic', 'A shy beetle has laid out berry cups beside a circle of mushrooms.', choice('help', 'Set out one more berry cup', 'The beetle makes room for you and offers a small woodland keepsake.'), choice('brave', 'Introduce your companion', 'Your companion steps into the circle. Soon everyone is sharing stories and a keepsake.')),
    ]),
    Object.freeze([
      scene('The lost woodland note', 'A folded leaf is caught in a bramble. Its writing points towards a tiny treehouse.', choice('explore', 'Read the leaf map', 'The map reveals a new path with pebble arrows and soft moss.'), choice('help', 'Deliver the folded note', 'The treehouse owner is delighted. They mark a safe path for your return.')),
      scene('A shadow with whiskers', 'Two whiskers peek out from a root arch, then disappear.', choice('observe', 'Sit quietly beside the arch', 'A fieldmouse comes out to say hello. Your companion gives them plenty of space.'), choice('brave', 'Offer a friendly greeting', 'The mouse answers your cheerful hello and invites you to see their root garden.')),
      scene('The firefly lantern tree', 'Seedpods glow along the lowest branch. A breeze plays a soft tune through them.', choice('observe', 'Trace the tune along the branch', 'Your companion notices the pod singing a different note. A keepsake waits below it.'), choice('help', 'Untangle a dangling seedpod', 'The lights sway freely again. A woodland friend leaves you a keepsake.')),
    ]),
  ]) }),
  glowpool: Object.freeze({ id: 'glowpool', name: 'Glowpool', bond: 2, theme: 'water', description: 'A moonlit pool with reed boats and lights below the surface.', treasures: Object.freeze(['ripple-shell', 'glass-pebble', 'pond-crown']), variants: Object.freeze([
    Object.freeze([
      scene('The reed-boat dock', 'A reed boat bobs against a root. Its little frog captain has dropped their paddle.', choice('help', 'Reach down for the paddle', 'The frog catches your paw and hauls the paddle back aboard. You get a friendly river salute.'), choice('explore', 'Look for a fallen reed', 'Your companion finds a straight reed. The captain has a brand-new paddle.')),
      scene('Lights beneath the water', 'Little lights gather under a lily leaf. One slips away into a dark channel.', choice('observe', 'Watch the lights make patterns', 'You notice that the lights dance around a bed of smooth stones.'), choice('brave', 'Follow along the bank', 'Your companion leads you safely around the channel to a luminous little inlet.')),
      scene('The ripple garden', 'Ripples cross in a sheltered cove, drawing circles around something bright.', choice('observe', 'Wait for the ripples to settle', 'The water clears and reveals a pool keepsake beside your paws.'), choice('explore', 'Search the little inlet', 'Behind the reeds, you find a pool keepsake waiting in the shallows.')),
    ]),
    Object.freeze([
      scene('A tangled floating garden', 'A raft of tiny flowers has become caught on a branch.', choice('help', 'Free the flower raft', 'The raft turns gently and floats into open water, leaving a trail of petals.'), choice('brave', 'Guide it around the branch', 'Your companion finds a firm stepping stone and nudges the raft towards the bank.')),
      scene('The upside-down stars', 'The pond reflects stars even though the sun is still out.', choice('observe', 'Look beneath the reflection', 'The stars are tiny silver fish! Your companion watches them weave together.'), choice('explore', 'Follow the silver trail', 'The fish lead you around a bend to a bank of blue waterflowers.')),
      scene('The reed-weaver’s workshop', 'A frog is weaving rings from reeds. One keeps slipping out of shape.', choice('help', 'Hold the ring steady', 'The frog finishes their work and offers you a pool keepsake.'), choice('brave', 'Try weaving a ring together', 'Your companion holds one end while you turn the reeds. A pool keepsake is yours.')),
    ]),
    Object.freeze([
      scene('The lily-leaf map', 'A snail has scratched a spiral map on a lily leaf.', choice('explore', 'Try the spiral path', 'The map takes you past hidden watersteps into a quiet cove.'), choice('help', 'Carry the map to the bank', 'The snail can read it from dry ground now. They point out a special place to look.')),
      scene('The deep-water song', 'A low humming sound rises from a hollow reed.', choice('observe', 'Hum the note back', 'The reed answers in a higher voice. Your companion has found the pool’s echo.'), choice('brave', 'Peer into the reed tunnel', 'A family of waterbeetles is rehearsing a song. They invite you to listen.')),
      scene('The shining stepping stones', 'One stone glows brighter than its neighbours. Tiny waves wash around it.', choice('observe', 'Notice where the waves meet', 'A pool keepsake rolls gently into the space between two stones.'), choice('help', 'Clear leaves from the shallows', 'The little waterway runs freely, revealing a pool keepsake.')),
    ]),
  ]) }),
  windridge: Object.freeze({ id: 'windridge', name: 'Windridge', bond: 4, theme: 'sky', description: 'High grassy paths, cloud shadows and a friendly, singing breeze.', treasures: Object.freeze(['cloud-kite', 'wind-chime', 'sunwheel']), variants: Object.freeze([
    Object.freeze([
      scene('The runaway cloud kite', 'A mouse’s little kite has caught on a low thorn branch.', choice('help', 'Untangle the kite string', 'The mouse reels in their kite. Your companion gets a turn holding the spool.'), choice('explore', 'Find a way around the thorn', 'A path behind the branch lets you lift the kite free without a scratch.')),
      scene('The wind’s little footprints', 'The grass bends in patches, as though an invisible friend is walking ahead.', choice('observe', 'Watch the grass bend', 'Your companion learns where the wind slows down. You find a calm place to stand.'), choice('brave', 'Follow to the next rise', 'You reach the rise together. A whole valley of cloud shadows opens below.')),
      scene('The cloud-shadow lookout', 'A cloud shaped like your companion drifts across a sunny ledge.', choice('observe', 'Wait for the shadow to pass', 'A ridge keepsake catches the sunlight as the shadow moves away.'), choice('explore', 'Take the path round the ledge', 'The path curls into a sheltered hollow with a ridge keepsake inside.')),
    ]),
    Object.freeze([
      scene('The windbell repair', 'A hanging twig has slipped from a neighbour’s windbell.', choice('help', 'Tie the twig back in place', 'The windbell sings again. Your companion remembers its clear little tune.'), choice('brave', 'Test a new knot together', 'Your companion holds the cord steady. Your knot keeps the twig secure.')),
      scene('The moving cloud island', 'A cloud shadow makes a tiny island on the hilltop.', choice('observe', 'Watch its shape change', 'The island becomes a rabbit, then a leaf. Your companion spots a hidden dip in the grass.'), choice('explore', 'Walk along the shadow’s edge', 'The edge leads to a ring of flowers sheltered from the wind.')),
      scene('The hilltop workshop', 'A pair of mice are making something that turns in the breeze.', choice('help', 'Hold their flower wheel steady', 'They finish the wheel and share a ridge keepsake with you.'), choice('brave', 'Try the first turn together', 'Your companion gives the wheel a gentle push. The mice cheer and offer a keepsake.')),
    ]),
    Object.freeze([
      scene('The feather trail', 'Three feathers lie in a line pointing away from the usual path.', choice('explore', 'Follow the feather trail', 'The feathers guide you to a sheltered ridge path with a wonderful view.'), choice('help', 'Return the feathers to a nest', 'The nest-builder thanks you and points to a sunny place just ahead.')),
      scene('The ridge’s secret whistle', 'Air whistles through a gap between two old stones.', choice('observe', 'Listen for the changing note', 'Your companion notices how one little leaf changes the whole song.'), choice('brave', 'Sing along with the ridge', 'Your voices join the wind. A pair of distant birds sings back.')),
      scene('The golden flower circle', 'A circle of yellow flowers nods in time with the breeze.', choice('observe', 'Watch the flowers turn', 'One flower points towards a ridge keepsake nestled in the grass.'), choice('help', 'Lift a fallen flower stalk', 'The circle stands tall again, and a ridge keepsake comes into view.')),
    ]),
  ]) }),
});

export function getTrailScene(routeId, variant, step) {
  return TRAIL_ROUTES[routeId]?.variants[variant]?.[step] ?? null;
}

export function findForApproach(routeId, variant, kind) {
  const index = { observe: 0, help: 1, explore: 2, brave: 2 }[kind];
  return index === undefined ? null : TRAIL_ROUTES[routeId]?.treasures[(index + variant) % 3] ?? null;
}

export function knackChoice(personality) {
  const kind = PERSONALITY_APPROACHES[personality];
  if (!kind) return null;
  const wording = {
    observe: ['Let your friend notice a small detail', 'Your companion spots a detail you had missed. You follow their quiet lead and discover a different way through.'],
    help: ['Let your friend lend a gentle paw', 'Your companion notices who needs a little help. Together you make the path kinder and find a new way through.'],
    explore: ['Let your friend follow a hunch', 'Your companion follows an intriguing little clue. You trust their curiosity and discover a different way through.'],
    brave: ['Let your friend try something bold', 'Your companion takes a careful first step. You follow their courage and discover a different way through.'],
  }[kind];
  return { id: 'knack', kind, label: wording[0], outcome: wording[1] };
}
