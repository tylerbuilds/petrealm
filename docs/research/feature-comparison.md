# Bank and quest feature comparison: 0.3 snapshot

This is the comparison recorded for Petrealm 0.3. All **121** reference rows were kept. The result was **10 working local equivalents, 20 partial features and 91 missing features**, compared with 8/19/94 in the saved 0.2 snapshot. Only the seven bank and quest rows were reassessed. No authenticated Neopets play or original algorithms were verified.

| Requirement | 0.2 | Next-wave mapping | Delivered local behaviour and limits |
|---|---|---|---|
| Bank | Partial | Local equivalent | Deposits/withdrawals, four original explicit savings tiers and once-per-UTC-day interest credited to savings, with claim markers/counters and atomic caps. Current source bank catalogue, formula, timing, transaction-order eligibility and server authority remain unknown/different. |
| Daily objectives | Partial | Partial | Five actual feed/play/shop/game/rest objectives; a free Lodge parcel adds a sixth. Wheels, grooming, rotating assignment/prize pools and source catalogue remain absent. |
| Individual claims | Local equivalent | Local equivalent | Explicit once-only daily and lasting rewards; claimed IDs distinguish objective progress from paid rewards. Source reward catalogue and authenticated settlement remain unknown. |
| Daily refresh | Partial | Partial | UTC rollover expires unfinished objectives and preserves lifetime history. NST and four NeoPass-linked tasks are absent. |
| Seven-day streak | Missing | Local equivalent | Any five distinct individual claims unlock an explicit 40-pebble day gift; seven consecutive claims atomically award the seventh gift plus150 original pebbles once. A missed completion breaks the streak. Source prize pools, NST, rerolls and streak-save tickets remain gaps. |
| Premium extra quest | Missing | Partial | Free local Explorer Lodge adds one original parcel objective. Paid active eligibility, subscription renewal/expiry, same-type source task catalogue and authenticated account allocation remain absent. |
| Premium five-of-six qualification | Missing | Partial | Any five distinct local claims qualify, including the sixth parcel task; four cannot qualify and the sixth cannot replay completion. Paid Premium eligibility, source catalogue and authenticated server settlement remain absent. |

Petrealm’s four savings names, thresholds, rates, rounding and rewards were chosen independently. Interest is `ceil(balance × annual basis points / 3,650,000)`, collected explicitly once per UTC day with a positive balance. Missed days do not add interest. This is not a recovered Neopets formula. The earlier inventory and official links were kept unchanged; extra source metadata was recorded separately without raw response bodies.

## Checks recorded for this snapshot

The recorded runs passed **44/44 Node tests**, **10 model assertions** and **21 app transaction assertions**. The unit-test receipt matched all seven runtime files and four test files; a separate note records its package/version metadata drift. The transaction tests used queued WebLocks and localStorage stubs. They did not test browser layout or macOS.

Linux browser receipts passed **18 core checks** and **12 bank/quest checks**, both matching this snapshot’s files. The bank/quest tests used real interface actions and firefly rounds over a controlled seven-day UTC clock. They did not prove seven elapsed days or the target’s server clock. The coordinator’s frozen files matched those receipts. macOS proof was still pending at the time; 0.2 results described the earlier release.

Layout receipts passed **10 general UI checks** and **8 bank/quest panel checks**, using the same files. Core play, bank/quests, UI and panels were all required before final approval. A passing receipt from an older CSS file could not replace a current check.

Other matching receipts passed **5 map-geometry checks**, **5 older-file checks**, **5 unadopted-save migration checks**, **5 storage-quota checks** and **3 production-build smoke checks**. Each receipt records its own hash, scope and file match; those check counts are separate from the feature classifications.

The other 114 classifications were kept. Their code and test references were updated, while older receipts were labelled as history. Accounts, player shops, trades, auctions, social features, Neocash purchases, paid subscriptions, original catalogues and exact authenticated behaviour remained outside the local game.

This comparison itself launched no app, tests, browser, service or provider. It checked the recorded mapping and files. Publication, deployment and platform runs needed separate receipts. [Checks by release](../verification.md) records later work.
