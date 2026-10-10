# Initial feature research

Research date: 2026-10-09. This is the initial version 1 investigation, not a list of today’s features. See [the feature comparison](../parity-ledger.md) for later work. The table separates what official public pages showed from Petrealm’s own design choices. The research used no authenticated accounts or private APIs and recovered no source code or original assets.

## Sources and observations

| Source | Observation | Access and limit |
| --- | --- | --- |
| [About Neopets](https://portal.neopets.com/about-neopets) | The official overview describes browser-based virtual pets, adoption, care, customisation, item collecting, mini-games, shops and exploration of multiple lands. | Public page fetched successfully. This is an overview, not evidence of exact UI controls or game rules. |
| [Explore Neopia](https://portal.neopets.com/explore-neopia) | A public catalogue separates pets, lands and characters. Pet entries have distinct illustrations and descriptive personalities. | Public text fetched successfully. Species names, artwork and world lore were observed for category structure only and were not reused. |
| [Help Centre](https://portal.neopets.com/support) | The official portal links separate help centres for the classic browser game and other services. | Public page fetched successfully. It does not establish in-game care or economy mechanics. |
| [Market bazaar](https://www.neopets.com/market_bazaar.phtml) | No direct observation was obtained through the text browser. | Fetch returned HTTP 403. Shop prices, inventory flows and authenticated behaviour remain unverified. |

## What the first version built

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

The project retrieved [morluto’s REA toolkit](https://github.com/morluto/rea), initially pinned at `6ce3288`, to inspect anonymous public pages. Petrealm used the categories above to design its own game. The coordinator kept the REA captures and receipts separately. This feature map does not count a capture as successful unless its receipt confirms it.

The next research step proposed for this initial build was to inspect openly accessible creation, shop, inventory and game pages, with screenshots and notes about each action. Account-only flows needed the operator’s explicit permission. Exact feature parity, backend behaviour, network APIs, player shops, outfits, combat, quests and multiplayer were outside that first build.
