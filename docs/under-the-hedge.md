# Under the Hedge

**Update:** the [playable adventures revision](playable-adventures.md) adds direct movement, dashing, trail challenges and home-building rewards. The opening below remains an optional quieter story; new players can play immediately.

A companion learns how to notice a small living world, and brings that history home.

This first playable develops the direction in Tyler’s supplied *Under the Hedge: research and development recommendation*, dated 10 October 2026. It gives the former Petrealm project a focused new experience: one Rillum, one home, three local routes and four recurring neighbours. **Under the Hedge is a working title.** The supplied research raises naming associations and calls for professional clearance; this implementation does not establish commercial clearance or a public launch.

## Start with the doorway

Name your Rillum, or keep **Fen**, and choose river, clay or stone colouring with speckles, a pale belly or tail markings. These are appearance choices, without rarity or progression advantages. Name and appearance can be changed later through **Save → Name & appearance**, preserving the companion’s story.

The opening adventure, **A Place for Someone Wet**, begins with a home that is already safe. Investigate the smooth stone or rustling reeds; discover why Pell needs a dry place to sit; choose a sheltered or waterside route; then decide what interests Fen about a curved seed case. Both routes succeed. The seed case can float, make a hollow knock or fit into a sheltered hollow.

Completing the opening gives the home a visitor seat, its first returning stone and a find with a recorded origin. The choices remain in the journal. The first surface response is deliberately described as a small response, rather than proof that a permanent personality has already formed.

## Four places in the interface

| Place | What to do |
| --- | --- |
| **Home** | Follow the opening, welcome an outing home, see developing interests and place finds. |
| **Paths** | Choose a local route and its weather, then prepare one outing. Follow the Alderwater question when ready. |
| **Journal** | Read recorded events, export the journal and save the companion’s portrait. |
| **Neighbours** | Revisit conversations with creatures you have met on the paths. |

The home has three places for finds: the **memory alcove**, **dry threshold** and **washing hollow**. Moving an object records what Fen did and retains where the object came from. The dry threshold leaves space for visitors.

## Go out, come home

Finish the visitor seat before taking an outing. The first prepared outing takes **30 seconds**, whichever route you choose. Later outings take two minutes at **Broadroot Wood**, three at **Dryfoot Crossing**, and five at **Alderwater**.

Choose **A calm day** or **After rain** before departure. This is an expedition condition you control; it does not depend on real weather or the time of day. There is one prepared outing at a time. It becomes ready while you are away, and its return waits until you choose to welcome Fen home.

There is no hunger decay, missed-day penalty, expiring return, daily streak or spending requirement in this experience. Waiting longer does not damage the companion or take away a discovery. Timers provide a short pause between departure and return; they do not create a deadline. Neighbour conversations and home arrangements wait while Fen is away.

| Route | Who notices it differently | What changes through revisiting |
| --- | --- | --- |
| **Broadroot Wood** | Dindle remembers the old passage; Ossel listens to its supports and water. | Dindle starts asking what the path is like now. Ossel learns why a sound can belong to its original place. |
| **Dryfoot Crossing** | Pell tests vibration; Fen notices shallow currents. | Directions accommodate different bodies. A raised dry way and a low waterside way can both be useful. |
| **Alderwater** | Mallow recognises water movement and a thread of warmth. | A light on the far bank becomes a saved question, an investigation and a complete answer. |

The Alderwater mystery advances across visits. After the first two discoveries, the Paths page explains what to prepare: visit Broadroot and Dryfoot, then take a **calm Alderwater outing**. No seasonal window or real evening is required. Rainy outings still return a story; the longer investigation remains available.

<details>
<summary>The mystery’s answer — story spoiler</summary>

The flowers respond to still warmth, not specifically to sleeping creatures. A warm seep touches a root in a dry hollow on the far bank. Fen and Mallow reach it by the shore, using the earlier route knowledge. The discovery becomes a dependable shared stopping place, and a fallen seed comes home without a promise that it will glow elsewhere. Later visits allow Mallow to choose a favourite bay of its own.

</details>

## What is stronger about this direction

The new entry point concentrates the project’s companion, exploration and keepsake work around a clear question: **what has this particular creature noticed, and how has it changed its home?** The previous Petrealm world remains separately accessible.

| Product improvement | Implemented expression | Limit of the claim |
| --- | --- | --- |
| **A clear first story** | The opening connects a surface choice, another creature’s needs, a journey and a changed home. | It is an authored introduction; player comprehension still needs observation. |
| **Preferences with consequences** | Repeated water, sound or shelter experiences establish interests. Learned interests change the return’s home reaction; the seed case’s first use follows the player’s choice. | These are explicit rules and authored variations, not machine learning or unrestricted creature autonomy. |
| **Memory grounded in actions** | Journal entries record actual choices, departures, collected returns, conversations, placements and renaming. Finds keep their origin and first recorded reaction. | The save retains the most recent **100 events**, plus persistent finds and progression. Export the journal periodically to keep older entries. |
| **Welcoming return** | A prepared outing waits, the home is safe and unfinished chapters remain available. | This implements the design principle; it does not demonstrate long-term retention. |
| **Bodies that matter** | Rillum cheek folds and webbed hindfeet, Tuffet folding ears and Limmer fans and balancing tails influence stories and portraits. | The prototype uses illustrated poses, rather than a simulated ecology or fully animated locomotion. |
| **A sustainable amount of authored variation** | Three routes reuse weather, visit state, learned interests and mystery chapters to vary returns. | Repeated visits can repeat prose. There is no claim of unlimited content. |
| **Personal objects without an economy** | Seven find types have places, reactions and uses. Returning resonant wood to its setting remains part of the recorded story. | There is no trading, resale value, rarity ladder or player economy. |

The research supports investigating responsiveness, individuality and readable character design. It does not prove this implementation will create years of attachment. Useful next observations are whether players can describe Fen beyond its appearance, remember a particular incident and explain why an object belongs where they placed it.

## Keep your story

The world saves in the current browser. **Save → Download save** produces a versioned JSON file for backup or transfer to another browser or device. **Restore an Under the Hedge save** replaces this browser’s current world after confirmation and keeps its previous stored world as a backup. **Restore previous backup** swaps back to that retained copy.

The journal export is a standalone HTML document containing the portrait, established preferences and retained events. The portrait export is a standalone SVG. Neither is a playable save: keep the JSON file to resume play.

If the browser cannot save, the interface reports that the session is unsaved and offers a file export. If an existing saved world is unreadable, recovery keeps the original available to download. Tabs on the same browser origin coordinate changes; an explicit world replacement requires a stale tab to reload before it can replace that world again. There is no cloud account or automatic device synchronisation.

**Visit your previous Petrealm world**, in the Save panel, opens `previous-world.html`. Its existing save remains separate. Old companions are not automatically rewritten as Rillums, and Petrealm exports cannot be imported as Under the Hedge saves.

## Sound, illustration and scope

Brook ambience is optional and starts off. The sound control enables or mutes it, and the page pauses it while hidden. Discoveries involving sound or colour are described in text; the Alderwater clue does not require hearing audio or spotting a small glowing pixel.

The first playable contains one playable Rillum, four neighbours, three routes, home placement, the completed opening and an answer to the Alderwater mystery. The four neighbours are Pell and Ossel, both Limmers; Dindle, a Tuffet; and Mallow, another Rillum. Tuffets and Limmers are illustrated supporting characters, not additional playable families.

Seasonal simulation, further playable families, additional mystery arcs, freeform building, multiplayer, open chat, monetisation and live events are outside this implementation. Choosing rainy weather does not constitute a season system. The new local application is not evidence of a public deployment.

The [art production record](research/hedge-art-production.md) describes the original editable creature art and generated environment images. The [audio production record](research/hedge-audio-production.md) records the ElevenLabs prompt and provider receipts. This guide describes the implemented design; release verification belongs to the final QA receipts.
