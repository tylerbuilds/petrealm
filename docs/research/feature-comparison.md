# Petrealm / Neopets next-wave comparison

Final frozen local comparison All **121** original reference rows remain present. The final classification is **10 implemented local equivalents, 20 partial and 91 missing**, compared with the sealed 0.2 snapshot's 8/19/94. Authenticated Neopets behaviour was not exercised; original algorithms are not established. Only the seven bank/quest rows were reassessed.

| Requirement | 0.2 | Next-wave mapping | Delivered local behaviour and limits |
|---|---|---|---|
| Bank | Partial | Local equivalent | Deposits/withdrawals, four original explicit savings tiers and once-per-UTC-day interest credited to savings, with claim markers/counters and atomic caps. Current source bank catalogue, formula, timing, transaction-order eligibility and server authority remain unknown/different. |
| Daily objectives | Partial | Partial | Five actual feed/play/shop/game/rest objectives; a free Lodge parcel adds a sixth. Wheels, grooming, rotating assignment/prize pools and source catalogue remain absent. |
| Individual claims | Local equivalent | Local equivalent | Explicit once-only daily and lasting rewards; claimed IDs distinguish objective progress from paid rewards. Source reward catalogue and authenticated settlement remain unknown. |
| Daily refresh | Partial | Partial | UTC rollover expires unfinished objectives and preserves lifetime history. NST and four NeoPass-linked tasks are absent. |
| Seven-day streak | Missing | Local equivalent | Any five distinct individual claims unlock an explicit 40-pebble day gift; seven consecutive claims atomically award the seventh gift plus150 original pebbles once. A missed completion breaks the streak. Source prize pools, NST, rerolls and streak-save tickets remain gaps. |
| Premium extra quest | Missing | Partial | Free local Explorer Lodge adds one original parcel objective. Paid active eligibility, subscription renewal/expiry, same-type source task catalogue and authenticated account allocation remain absent. |
| Premium five-of-six qualification | Missing | Partial | Any five distinct local claims qualify, including the sixth parcel task; four cannot qualify and the sixth cannot replay completion. Paid Premium eligibility, source catalogue and authenticated server settlement remain absent. |

The four savings names, balance thresholds, rates, integer ceiling and reward amounts are independently chosen Petrealm rules. Interest is `ceil(balance × annual basis points / 3,650,000)` with a positive balance, explicit UTC claim and no missed-day accrual. These are not recovered Neopets algorithms. The existing source inventory and official links are preserved unchanged; additional official source metadata is provided separately without raw response bodies.

## Current evidence

Recorded execution reports **44/44 Node tests**, **10 matching model assertions** and **21 matching transaction VM assertions**. The unit receipt matches all seven runtime files and all four test files; its package/version metadata drift is recorded separately. VM checks use queued WebLocks/localStorage stubs and do not qualify browser layout or macOS.

Stored Linux browser receipts report **18 core checks** and **12 bank/quest checks**. Core proof matches this source snapshot; bank/quest proof matches this source snapshot. Bank/quest QA performs real UI actions and firefly completions across a **synthetic seven-day UTC clock**; it does not prove seven elapsed real days or the original server clock. The coordinator freeze matches those hashes. Current macOS proof is pending; sealed 0.2 proof is historical.

Normal-use UI proof records **10 checks** and matches this source snapshot. New-panel layout proof records **8 checks** and matches this source snapshot. Core, bank/quests, UI and panels are all required for final sealing; a passing stale-CSS receipt cannot satisfy that gate.

Additional source-matching receipts record **5 map-geometry checks**, **5 legacy-file checks**, **5 unadopted-save migration checks**, **5 storage-quota checks** and **3 built-application smoke checks**. Each receipt's own hash, source-match flag and scope remain separate from the feature classifications.

The other 114 classifications are retained. Their delivered code/test anchors are refreshed to this worktree, and old receipts are explicitly labelled historical. Accounts, player shops, trades, auctions, social services, NC funding/commerce, paid subscriptions, original catalogues and exact authenticated behaviour remain outside the local implementation.

No application, tests, browsers, services or providers were launched by this research comparison. Preserved historical files and artefact validation are evidence of the mapping; publishing, deployment and platform qualification require their own receipts.
