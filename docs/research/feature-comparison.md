# Petrealm / Neopets final comparison

All **121** public-reference requirements are mapped: **8 implemented local equivalents, 19 partial and 94 missing**. Every row preserves its official sources, documented tier, concrete acceptance criteria and prerequisites. Implementation and verification remain separate. Authenticated Neopets gameplay was not exercised and algorithm equivalence is not established.

This refresh binds the frozen **0.2** working tree checked at **2026-10-09T22:45:51.609161+00:00**, with HEAD `d67ccc6e4c183a85b1b5e8909e59bbbbba62b556`. It preserves the earlier detailed comparison unchanged. The source remains an uncommitted snapshot; a future commit, hosted demo or macOS run needs its own receipt.

## Delivered and remaining scope

The eight local equivalents cover seven free pet slots, feeding, bounded hunger decay without death, the owned-item inventory, explicit once-only quest claims, a chooser with two original games, accessory application/removal and a free-to-play baseline. Partial implementations include creation of original pets, extra capacity, local shops/wallet/bank, saved NPC battle rounds, XP growth, daily quests, game rewards and the original world map. Polished UI adds original item vectors, all five visible mobile destinations, an adjacent compact companion profile and preserved keyboard focus.

Accounts, remote saves, player shops, trading, auctions and social systems remain missing. A shared economy needs account-bound ledgers and ownership, atomic two-party exchange, escrow, bid reservation/refunds and timed settlement. Browser tabs share one local world rather than separate authenticated accounts.

Of **31 Premium-only requirements**, one is partial and 30 are missing. Explorer mode is a free local toggle; it does not provide paid subscription entitlements, renewal/expiry, the sixth daily task, extra score submissions, monthly cookies/goodie bags, lab uses, scratchcards, species changes, retired challengers, search perks or the other documented Premium benefits. Its daily berry/pebble parcel is an original local reward.

Of **19 NC-only requirements**, one is partial and 18 are missing. Earned pebble deeds add permanent slots; matching the documented 26-slot arithmetic does not establish NC purchase fulfilment. NC funding/wallets, catalogue try-on/cart/orders, gift boxes, NC transfer restrictions and styling services are absent.

Quest parity still needs five/six regular daily tasks, NeoPass tasks, NST resets, weekly streaks/prizes and rerolls. Banking has no daily interest or rate-tier claim ledger. Combat has attack/guard/potion rounds against three original rivals, without two-weapon turns, PvP, difficulty variants, arena item drops or timed/paid stat training. Pound pools/transfers, hotel feeding, item storage, collections, layered species-compatible wardrobes and the broader original world/game catalogue remain gaps.

## Verification

The fresh Linux Chrome deep runtime receipt finished at **2026-10-09T22:39:01.973Z**, passes **18/18** named checks and matches all **seven** frozen implementation hashes. It exercises populated legacy migration, multi-pet care, equipment state, explicit quest claims, bank conservation, saved battles, actual memory-game completion, exports/imports, storage failure and concurrent browser tabs. Its mobile check now includes actual care/focus, one companion profile across mobile/tablet/desktop changes, visible destinations, item vectors, save export/import and adoption-dialog focus. Map-node clicks and current firefly completion are not independently proved; wardrobe checks assert saved equipment/Take off UI rather than a direct changed-vector comparison.

Saved unit execution records **30/30** passing tests: 14 model, 15 parity model and one static-server security test. The execution receipt hashes four polished UI files; model/test/server hashes are separately pinned by this comparison, so those logs do not independently prove the entire execution input hash set. A matching **4-check** focus/reparenting review uses topology stubs rather than Chrome layout.

The earlier **8-check** targeted domain receipt still matches the unchanged model. The refreshed **14-check** concurrency receipt now matches all five frozen app/model/art/persistence/views hashes. It exercises transaction and recovery behaviour in Node VM contexts using queued WebLocks and localStorage stubs; it does not qualify browser layout or macOS. The preceding evidence snapshot is preserved separately. Current macOS gameplay proof was not found. Original authenticated runtime and exact algorithms remain unverified.

No application, tests, browser or services were launched by this read-only refresh. Final artefact validation and the sanitised public handoff are separate from publishing or deployment.
