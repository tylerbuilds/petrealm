# Petrealm

![Original Petrealm screenshot](docs/screenshots/desktop.png)

[Try the live demo](https://tylerbuilds.github.io/petrealm/) · [Linux/macOS checks](https://github.com/tylerbuilds/petrealm/actions/workflows/verify.yml)

A little world of your own. Raise a family of original companions, dress them, complete quests, save your pebbles and take on friendly arena challenges. Two interactive games reward timing and memory.

Petrealm is a dependency-free, local-first browser game. Its expanded release implements original local equivalents of pet care, collecting, shops, quests, customisation, banking and battles described by Neopets' public pages, using independently written rules, an original interface and original vector artwork. It is not affiliated with Neopets and does not include its code, species, artwork, names or fictional currency.

## Run on Linux or macOS

Install Node.js **22.19+ or 24.11+**, then:

```sh
git clone https://github.com/tylerbuilds/petrealm.git
cd petrealm
npm start
```

Open **http://localhost:4203** in a modern browser. No npm install is needed to run the app; it has no runtime dependencies. Browser verification uses Playwright as a development dependency. The same Node commands work on Linux and macOS. A modern browser with JavaScript, local storage and native `<dialog>` support is required. Open through the server, not directly as a `file://` document.

```sh
npm test           # Pure state, economy, time and import invariants
npm run build      # Produce the static site in dist/
npm run preview    # Serve dist/ on http://localhost:4203
```

The coordinating workflow records actual platform and browser checks in the research/runtime receipts. Portable code and a CI configuration do not on their own establish that a macOS run has passed.

## Play

1. Choose a **Mossling**, **Emberkit** or **Moonfin**, then name your friend. Adopt more companions and switch the active friend in the garden.
2. Keep each friend's fullness, happiness and energy healthy with snacks, play and rest. Care builds experience; every 100 XP raises a level, up to level 20.
3. Buy food, reusable toys, visible head/neck accessories, battle potions and expansion deeds at Market lane. Deposit spare pebbles in the Pebble Keep and withdraw them when needed.
4. Open **World & quests** for the illustrated map and journal. Complete a daily three-feed objective or lasting family, game and battle objectives, then claim their rewards once.
5. Collect the 40-pebble daily gift. Explorer Lodge mode is also free: it adds seven companion spaces and a daily parcel. Up to twelve earned expansion deeds can bring the roster to 26.
6. Play **Firefly flight** by catching the moving light in the golden centre, or **Memory meadow** by matching six shuffled pairs. Scores determine payments; both games share a daily reward cap.
7. Visit the **Training grove**. Attack, guard or use a potion in saved turn-based matches. Win earlier challenges and grow your level to unlock later rivals. A first victory pays once; replay still earns experience.
8. Dress the active companion in the garden. One purchased accessory copy cannot be worn by two friends at once, and equipment affects newly started arena matches.
9. Use the save button to export your world, restore a backup or download the exact original version 1 save after migration.

Your game is saved in this browser, with no account, backend, network calls, telemetry or paid services. Clearing browser storage can remove your game; export a save first. Invalid stored saves open a recovery screen which keeps the original. Imports are strictly validated before replacing the current world; the previous save is retained as a local recovery backup. Storage failures produce a persistent unsaved indicator. Import is refused when a recovery backup cannot be written.

This is a single-player local game. Same-origin tabs serialise world mutations with Web Locks, or an IndexedDB transaction fallback, and read the latest saved state before each action. Importing or restoring a replacement world abandons an older unfinished game. Failed saves keep your in-memory progress available for export; a newer conflicting saved world blocks further mutations until you export or reload. It has no anti-cheat, server economy or clock authority; editing a local save or advancing the device clock is within the player's control.

## Delivered scope and parity gaps

A five-location illustrated map connects **Sunmeadow garden**, **Market lane**, **Pebble Keep**, **Starlight glen** and **Training grove**. The release includes multiple independent companions, seven original supplies, visible wardrobes, bank transfers, daily and lasting quests, experience, three progressive arena rivals, two interactive games and a free Explorer Lodge mode. Original inline SVG illustrations are in [`src/art.js`](src/art.js); immutable game rules are in [`src/model.js`](src/model.js).

Version 2 saves strictly migrate accepted version 1 worlds, retaining the original text before any overwrite. Existing pets, stats, money, supplies, counts, achievements and daily/game histories survive migration. New systems start empty; no progress is invented. All write paths retain the multi-tab mutex and recovery safeguards.

The [free and Premium parity ledger](docs/parity-ledger.md) and [all-tier source comparison](docs/research/feature-comparison.md) record delivered behaviour, sources and remaining or unknown features. This is a playable local reconstruction of selected feature categories. It does not provide full Neopets service parity: online accounts, player shops, trading, auctions, PvP, forums, remote sync, the large item/species/game catalogue and many specific Premium perks remain absent. The daily Lodge parcel and earned expansion prices are original choices; no subscription or paid entitlement service is claimed.

Game balance, quest/battle rules, migration and storage behaviour are documented in [`docs/game-rules.md`](docs/game-rules.md). The initial public-surface investigation is retained in [`docs/research/feature-map.md`](docs/research/feature-map.md). Research uses the [REA](https://github.com/morluto/rea) toolkit starred by tylerbuilds; sanitised capture provenance and denied-access limits are in [`rea-provenance.md`](docs/research/rea-provenance.md) and [`rea-findings.json`](docs/research/rea-findings.json).

## Development

- `src/model.js`: immutable rules, validation and JSON import/export. Every action returns a new state or throws a helpful error.
- `src/app.js`: coordinated local persistence, migration, accessible dialogs, navigation and two interactive games.
- `src/views.js`: connected care, shop, bank, quest, Lodge and arena interfaces.
- `src/art.js`: original creature, landscape and shop vectors.
- `tests/model.test.js`, `tests/parity-model.test.js`: meaningful migration, economy, resource, time and reward invariants using Node's built-in test runner.
- `scripts/serve.mjs`, `scripts/build.mjs`: dependency-free development and static build utilities.

Changes should preserve saved worlds, keep all assets original, and disclose any new network or account behaviour before introducing it. Contributions and forks are welcome under the [MIT licence](LICENSE).

## Browser verification

The runtime has no package dependencies. To run the development browser checks, install the pinned tools and Chromium:

```sh
npm ci
npx playwright install chromium
npm run build
npm run test:browser
```

Linux runners may need `npx playwright install --with-deps chromium` for browser system libraries. `BROWSER_EXECUTABLE=/path/to/chrome npm run test:browser` uses an existing browser. The GitHub workflow runs model tests, a static build and real browser edit/persistence/export checks on both Ubuntu and macOS, then publishes the static demo only after both pass.

[REA investigation provenance](docs/research/rea-provenance.md) records public observations, receipt digests and explicit research limits.
