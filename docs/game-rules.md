# Petrealm rules and save contract

These are original prototype rules, not recovered Neopets mechanics.

## Starting world

A new save starts with 120 pebbles, three sunberries, two honey acorns and one rainbow ribbon. Adoption is free and permanent within that save. A newly adopted companion starts at 85 fullness, 80 happiness and 85 energy. Names accept 1–24 Unicode characters, are trimmed and NFC-normalised, and cannot contain control characters.

Every stat is a finite value bounded between 0 and 100. Time is injected into the pure model so tests can examine exact boundaries.

## Care and economy

| Action or item | Price | Effect |
| --- | ---: | --- |
| Sunberry | 12 pebbles | Consumed; +22 fullness, +6 happiness |
| Honey acorn | 8 pebbles | Consumed; +12 fullness, +12 energy, +3 happiness |
| Rainbow ribbon | 35 pebbles | Reusable; play gives +20 happiness, −12 energy, −4 fullness |
| Rest | Free | +30 energy, +3 happiness, −5 fullness |
| Daily gift | Free | +40 pebbles, once per UTC date |
| Completed firefly round | Free | +3 happiness; `floor(score × 0.4)` pebbles, subject to the daily cap |

Ribbon play requires at least 12 energy. Prices are read from fixed model definitions; insufficient funds, missing supplies or inventory at 999 items reject the whole action without changing the original state. Wallets cannot be negative. This simple economy deliberately has no scarcity, resale or trading.

## Passing time

For every elapsed hour, fullness decreases by 3, happiness by 2 and energy by 1. Fractional hours count. Each time update applies at most 72 hours of decay, floors each stat at zero, and advances the saved timestamp to the current time. Reloading does not apply the same elapsed time twice. A clock moving backwards never moves saved time backwards or adds stats.

Stats cannot kill or remove a companion. Rest is always available. This is a gentle local game; absence does not destroy a saved world.

## Firefly flight

The browser renders a moving light with `requestAnimationFrame`. A click or Space press samples its position. The centre is at 50% of the track; the maximum scoring distance is 12% of track width. Score per catch is `max(0, round(10 × (1 − distance / 0.12)))`. Ten accepted catches, or thirty seconds, finish a round. Catches have a 350 ms minimum interval. Speed increases slightly after each catch.

The pure model accepts a whole-number round score between 0 and 100. Reward is capped at 40 per round and 120 per UTC date. After that limit, rounds still increase happiness and activity counts but pay zero. Changing area or receiving another tab's save update abandons an unfinished round without payment. No automatic random prize button substitutes for playing the game.

This is client-side entertainment. Score and clock authority are not protected against a player modifying their own browser or save file.

## Progress

The model grants eight achievements based on actual activity counts: adoption, first feed, first play, first rest, first shop purchase, first daily gift, first game, and 25 total care actions. The interface's five milestone slots display adoption, feed, play, purchase and game. Counts and achievements are included in the save and checked for consistency during import.

## Persistence

Local storage uses `petrealm.save.v1` and `petrealm.backup.v1`. Exports are plain JSON with an explicit `version: 1`. Import limits files to 32 KiB and rejects unsupported versions, unknown or missing fields, malformed dates, non-finite or out-of-range numbers, unknown species/items, duplicate keys, excess nesting and inconsistent activity/achievement data.

A failed import leaves the current world unchanged. A successful import writes the previous world as a local recovery backup before replacing it. Restore swaps the current and backup saves. If a stored save fails validation, the recovery dialog preserves its original text, offers a download or valid import, and only starts fresh after an explicit button click. The save manager can download the previous backup as its original text, even when it contains invalid data; invalid backups cannot be restored as a valid world.

The footer reports when browser persistence fails. Export is available for an in-memory world. Same-origin tabs serialise mutations using Web Locks or a synchronous operation within an IndexedDB readwrite transaction. Each writer rereads the latest saved world, and stale storage events reread current storage. Replacement worlds invalidate older game rounds. A failed write keeps dirty in-memory progress; if another tab changes its durable base, further mutations pause while the in-memory world remains exportable. There is no remote sync or automatic cloud backup.
