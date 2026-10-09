# Public-surface feature map

Research date: 2026-10-09. This file records the initial v1 investigation. Current free and Premium feature delivery is tracked in [the version 2 parity ledger](../parity-ledger.md). This document separates observations of official public pages from implementation decisions. No authenticated account access, private API access, source recovery or original asset copying was performed.

## Sources and observations

| Source | Observation | Access and limit |
| --- | --- | --- |
| [About Neopets](https://portal.neopets.com/about-neopets) | The official overview describes browser-based virtual pets, adoption, care, customisation, item collecting, mini-games, shops and exploration of multiple lands. | Public page fetched successfully. This is an overview, not evidence of exact UI controls or game rules. |
| [Explore Neopia](https://portal.neopets.com/explore-neopia) | A public catalogue separates pets, lands and characters. Pet entries have distinct illustrations and descriptive personalities. | Public text fetched successfully. Species names, artwork and world lore were observed for category structure only and were not reused. |
| [Help Centre](https://portal.neopets.com/support) | The official portal links separate help centres for the classic browser game and other services. | Public page fetched successfully. It does not establish in-game care or economy mechanics. |
| [Market bazaar](https://www.neopets.com/market_bazaar.phtml) | No direct observation was obtained through the text browser. | Fetch returned HTTP 403. Shop prices, inventory flows and authenticated behaviour remain unverified. |

## Independently implemented behaviour

| Publicly described category | Petrealm implementation | Evidence classification |
| --- | --- | --- |
| Adopt a pet | One of three original SVG companions, with a player-selected name | Category observed; selection, limit, art and naming rules are original implementation decisions |
| Pet care | Fullness, happiness and energy; snacks, ribbon play and rest | Category observed; all numeric stats, costs and decay rules are original/inferred prototype choices |
| Collect items and visit shops | Three original fixed-price supplies, a wallet and bounded inventory | Category observed; no exact price or shop-flow parity verified |
| Play mini-games | Original interactive timing game with visible scoring and capped rewards | Category observed; mechanic, art, payouts and limits are original |
| Explore lands | Garden, market and glen with different activities and original landscapes | Multiple-land category observed; this three-area world is original |
| Customisation, stories and social play | Not implemented | Explicit initial-release gaps |
| Daily rewards and achievements | Original daily gift and activity milestones | Product inference; not established by the fetched public overview |
| Persistence and offline decay | Validated local saves, backups and bounded stat changes | Product inference; no claim to match the source service |

## REA workflow and limits

The coordinating task retrieved the user's [REA](https://github.com/morluto/rea) tool repository, pinned initially at `6ce3288`, to investigate anonymous public surfaces. This implementation is grounded in the public categories above and independently written behaviour. The coordinating agent owns REA runtime captures and their actual receipts; this feature map does not claim a capture succeeded unless its separate receipt says so.

A useful next research pass would observe anonymous pet-creation, shop, inventory and game pages wherever they are openly accessible, recording screenshots and transition descriptions. Account-only flows remain gaps until the operator expressly authorises account use. Exact parity, backend behaviour, network APIs, player shops, wardrobe, combat, quests and multiplayer are outside this initial build.
