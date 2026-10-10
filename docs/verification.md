# Checks by release

## 0.11 timing challenges — Fedora verification, 10 October 2026

`npm test` passed **212 tests**, including 19 engine tests. The static build and complete built-app browser suite passed. The original worlds, save recovery and app-boundary checks remain included.

The new browser checks deliberately stopped outside the target, waited for a timeout and held Space. Three misses ended the attempt without seed rewards or a trail unlock. Retrying started a fresh run. An active challenge preserved its marker and countdown while paused. Real keyboard and browser touch input caught seeds; every seed and secret was then collected on all three trails, with rewards and records surviving reload. The 320px and 390px timing cards and Stop buttons were reachable. No result or player position was injected.

Deterministic engine runs used movement, dashing and successful timed stops to earn all eight seeds, a secret and three stars on every course: 33.98s, 24.33s and 21.24s respectively. Existing par times and save validation rules remain unchanged. Ordinary timing windows last roughly 250ms, 200ms and 150ms per pass; gentle mode widens this to 450ms. These values describe rules, not measured age suitability.

The actual private Tailnet HTTP preview also passed movement, compulsory timing, an early-stop miss without rewards, older-save migration and reload. Seven served files matched canonical hashes. [Preview receipt](research/hedge-challenge-preview-verification.json).

[The receipt](research/hedge-challenge-verification.json) includes browser outcomes and source hashes. [Phone timing](screenshots/hedge-timing-mobile.png) shows the actual challenge interface. The browser used controlled animation time with genuine input events. This verifies the rules and controls, not human reaction times or enjoyment. No child playtest or physical device test is claimed.

## 0.10 playable adventures — Fedora verification, 10 October 2026

`npm test` passed **203 tests**. A fresh static build and the complete `npm run test:browser` suite passed, including the previous Petrealm game, its ten application-boundary scenarios, the earlier Hedge story and the new direct-control adventures.

Real browser keyboard input completed all three trails with all eight glowseeds and each secret. Rewards, trail unlocks, personal bests and purchased home decorations survived reload. No completion result or player position was injected. Controlled browser time accelerated the runs. Separate pointer input reached all 30 seed, secret and finish destinations across the three courses; this exposed and fixed tap routes accidentally crossing the open finish before reaching the selected seed.

Movement, dashing, touch contact/release, explicit pause, the focus-loss handler, a simulated hidden document and navigation away from the game were checked. Paused and detached games stopped requesting animation frames; returning to Play preserved the run. Phone checks at 390px and 320px verified no horizontal overflow and reachable movement and completion controls. There were zero browser errors and zero external requests.

[The machine-readable receipt](research/hedge-play-verification.json) records course results, saved progress, mobile measurements and source hashes. [Desktop](screenshots/hedge-play.png) and [phone](screenshots/hedge-play-mobile.png) are actual browser captures. Full evidence remains in `test-results/browser-smoke/hedge-play/`.

The canonical private Tailnet preview also passed real keyboard movement, version 1 save migration and reload checks. Existing companion, home and journal data were preserved. Seven served application files matched canonical source hashes. This HTTP origin used IndexedDB because native Web Locks were unavailable. [Preview receipt](research/hedge-play-preview-verification.json).

These are synthetic browser journeys on Fedora, Node.js 25.6.1 and Chromium 156.0.8078.4. They verify functioning play, not enjoyment, age suitability or retention. No child playtest, physical phone test, new macOS CI run or public deployment is claimed. The three courses are fixed layouts; [the play guide](playable-adventures.md) describes their scope and save behaviour.

## 0.9 Under the Hedge — Fedora verification, 10 October 2026

`npm test` passed **184 tests** with no failures. The static build and complete `npm run test:browser` suite passed, including the previous Petrealm world and its ten application-boundary scenarios. After the final Under the Hedge visual and customisation refinements, its expanded acceptance suite was run again against a fresh `dist/` build and passed.

Actual browser journeys completed the opening and seven timed outings, visited all four neighbours, moved a find, followed the rainy and calm Alderwater variants and reached the mystery’s answer. The first outing took 30 seconds on a controlled clock. Native-lock races proved that two tabs collect a return only once and a queued pre-import action cannot alter the replacement world. Corrupt stored bytes remained intact until deliberate recovery; a failed storage write kept the unsaved companion exportable. JSON save, illustrated HTML journal and SVG portrait downloads succeeded, and import/backup restore round-tripped the state. Previous Petrealm save bytes stayed unchanged.

Sound playback began only after its toggle and paused when toggled off. There were zero browser runtime/console errors and zero external requests. Desktop and 390px/320px captures were reviewed, including the welcome and all four pages. A maximum-length name fitted all four pages at 320px. Keyboard opening activation worked. Name and appearance edits preserved history through reload; a stale customisation dialogue could not overwrite a newly imported world. Find placement changes the corresponding object in the home scene.

The canonical Fedora preview was also opened through its actual Tailnet HTTP address. With secure-context Web Locks unavailable, its IndexedDB fallback serialised two queued return claims into one recorded return. Reload retained the state, and five served application files matched canonical source hashes. This verifies the served origin from Fedora; a physical Mac or phone was not tested. [Preview receipt](research/hedge-preview-verification.json).

The [machine-readable receipt](research/hedge-verification.json) includes final source hashes and the case results. [Desktop](screenshots/hedge-home.png) and [phone](screenshots/hedge-mobile.png) images are browser captures. Full local evidence is in `test-results/hedge-final/`; earlier whole-app evidence is in `test-results/browser-smoke/`. These are synthetic test worlds on Fedora, Node.js 25.6.1 and Chromium 156.0.8078.4. No physical phone test, new macOS CI run, public deployment, retention study or audio listening/seam certification is claimed.

## 0.8 companion experience — Fedora verification, 10 October 2026

`npm test` passed **150 tests**, followed by a successful static build and the full `npm run test:browser` suite on Fedora, Node.js 25.6.1 and Playwright Chromium 156.0.8078.4. The original gameplay, scenery and ten application-boundary checks remain included.

The new built-app checks adopted a friend, chose an expedition, reloaded while away, advanced a controlled clock beyond the return time and queued simultaneous claims from two tabs. Only one story and keepsake were granted. A later outing returned to its original friend while a different companion was selected; both ownership and the visible return survived reload. HTML biography and SVG portrait downloads succeeded. Expedition choice and radio focus survived the one-minute autosave. Memory meadow completed after more than 90 seconds in untimed mode; keyboard card play and Space navigation were exercised.

Desktop and 390px/320px mobile captures were reviewed. Page overflow and clipped destination names were checked separately. The run recorded no browser errors. A maximum populated model fixture with 26 Unicode-named companions, 78 memories, long timestamps, large counters and existing match/trail records round-tripped within **30,605 of 32,768 bytes**.

The [machine-readable receipt](research/companion-verification.json) records checks and source hashes. Generated screenshots and downloads are in `test-results/browser-smoke/companion-experience/`. These are synthetic local test worlds. No physical device test, new macOS CI run, public deployment or retention study is claimed.


For remote results, check the [Linux/macOS workflow](https://github.com/tylerbuilds/petrealm/actions/workflows/verify.yml) for the exact release commit. It runs Node tests, builds, Chromium smoke and static-server checks on Ubuntu and macOS. Both platform jobs must pass before Pages publication. Local results alone do not prove a macOS run or a working hosted site. Petrealm runs in a browser, has no native installer and does not claim to reproduce the full Neopets service.

## 0.6.1 wording update

All **71 existing Node tests** and the build passed on Fedora with Node.js 24.14.0. Fresh Chrome checks covered adopting a friend, finishing an outing, bringing a find home, saving and reloading. Separate checks deliberately damaged a save to test the recovery instructions and downloads. All **15 browser checks** passed.

The [trail](screenshots/trails-0.6.1.png) and [phone discovery](screenshots/discovery-mobile-0.6.1.png) captures show the revised words. The game rules and save format are the same. Earlier results below describe their own releases.

## 0.6 little trails

The 0.6 source passed **71 Node tests** on Fedora with Node.js 24.14.0: 53 earlier checks, 12 trail-state scenarios and six rendering checks. They test completion, changing encounters, finds, each friend’s bond and knack, saved outings, stale choices, duplicate rewards, heading home early, display ownership, version 3 migration, resource and XP limits, and the 32 KiB save limit for a full family. These tests run in Node, separately from browser play.

Fresh-profile Chrome tests passed **311 named checks** across 32 local receipts: 83 first-play, returning-world and personality checks; 32 viewport checks; 19 checks using a real earlier save with a grown friend; 13 layout checks using separately prepared model states; 23 catalogue checks; 138 controlled save-recovery and race checks; and three production-build smoke checks. This total includes repeated checks of files, layouts and saves. It does not mean 311 different games or player journeys. The storage failures and same-origin older-client tests were deliberately set up.

One friend adopted through the game finished **27 outings and 81 browser choices**, tried all **54 ordinary catalogue choices**, and earned all **nine finds**, including those that need a knack. Each of the four personalities earned its preferred-approach bonus and unlocked a usable knack. New and returning worlds finished an outing, displayed its find and resumed after reload while keeping earlier care, outfits, balances and claimed rewards. The production-build smoke test also checked an earned outing, a reload between choices, a newly opened route and a saved meadow display.

Desktop, tablet, 390px and 320px checks covered routes, encounters, discoveries, the journal and meadow displays. After the final phone choice, the treasure art, label, name, reaction, reward and **Show in meadow** button were visible together, without a test scroll reset. In one 320px encounter, the first 23px of the previous reaction sat above the viewport. A short upward scroll revealed it without changing the outing. Not every previous reaction is shown in full automatically. Grown friends, a test name of 24 characters and three meadow finds kept clear, separate space.

All 12 app files matched the version served to the browser and stayed unchanged during the checks. There were no uncaught page errors, console errors, failed requests, external calls or API calls. The tests used prepared worlds and fresh browser profiles. They did not test physical touch devices, certify full accessibility or measure how long people keep playing.

[Trail](screenshots/trails-0.6.png), [phone discovery](screenshots/discovery-mobile-0.6.png), [field journal](screenshots/journal-0.6.png) and [meadow display](screenshots/meadow-0.6.png) are unedited browser captures from that release. [The trail guide](little-trails.md) explains play and older-save recovery.

## 0.5 illustrated world

The 0.5 source passed **53 Node tests**, a production build and **59 Chromium checks** on Fedora with Node.js 24.14.0 and system Chrome. Those 59 checks comprise 50 first-play checks and nine returning-world checks, including layout, focus, saving and file stability. A separate production-build browser smoke test passed three checks of execution and file/script stability. These counts are checks, not separate games or player journeys.

A new player chose and named a friend, entered Sunmeadow, shared treats, played and rested. The tests opened the Satchel and mailbox, collected the 40-pebble gift once, bought an outfit at its fixed price, finished both games, collected an earned quest gift, practised at the stated cost and downloaded a save. Reload kept the same friend, personality, outfit, money and progress. The top controls and illustrated signs opened the meadow, market, glen, map/notebook and training.

Desktop, tablet, 390px and 320px checks covered adoption, the meadow, every place and the Satchel. On phones, scrolling inside the adoption dialog reached the last friend and adoption button; a short page scroll reached care. Escape closed the Satchel and returned focus to its opener. Friends and outfit shortcuts opened and focused their destinations. Friends, Dress up and bloom summaries kept their focus and open state through three real care saves in another tab. The care meters lined up at both phone widths.

Returning-world tests used a populated earlier save with a grown Thistlehorn and a 24-character test name. Saved values stayed intact. The full creature, quote, wrapped name and signs remained separate at all four sizes. The nine species, eighteen young/bloomed forms, outfit art, game rules and save module kept the accepted 0.4 file contents.

There were no uncaught page errors, console errors or failed requests, and the app files stayed unchanged. Prepared local worlds and real browser actions were used. These checks did not test physical touch devices or certify full accessibility.

A separate visual review checked 44 browser images and an original-world art study, with no material layout issue left in the reviewed sizes. Image reviews are not part of the browser check total. [Meadow](screenshots/world-0.5.png), [phone meadow](screenshots/world-mobile-0.5.png) and [world map](screenshots/world-map-0.5.png) show prepared example worlds. [The player guide](explore-petrealm.md) explains the controls. There are no online accounts, shared economy or external calls.

## 0.4 companions and growth

The 0.4 source passed **16 Chromium workflow checks** on Fedora with Node.js 24.14.0. All nine species were chosen, named, given a personality, adopted, cared for and reloaded through the interface. The checks compared their rendered portraits. A separate art review covered all eighteen young and bloomed forms.

Browser play earned a first bloom through paid practice and that friend’s own care, then checked the changed portrait, stronger practice, outfits and arena. Two-tab tests changed the active friend while Practice or Bloom was queued. Each stale action stopped before charging. Downloaded saves restored correctly. A populated 0.3 save kept its money, bank, supplies and histories, with neutral defaults for the new companion fields. There were no page errors, console errors or failed requests.

Desktop, tablet, 390px and 320px captures covered adoption and earned growth. The last friend and adoption button remained reachable at 320px. [Adoption](screenshots/adoption-0.4.png), [phone adoption](screenshots/adoption-mobile-0.4.png), [bloom](screenshots/growth-0.4.png) and [phone garden](screenshots/growth-mobile-0.4.png) show prepared local worlds. [Meet the companions](companions.md) explains the rules.

The feature inventory is a dated 0.3 snapshot; 0.4 added original local play rather than the target’s online catalogue.

## 0.3 bank and quests

The 0.3 source was checked on Fedora with Node.js 24.14.0 and system Chrome. **44 Node tests**, **18 existing browser checks** and **12 bank/quest browser checks** passed against recorded file hashes. There were no uncaught page or console errors or unrelated failed requests.

The new checks covered savings tiers, daily interest, six local Lodge objectives and seven daily quest-completion cycles, including duplicate claims, a missed day and save/download restoration. A controlled UTC clock supplied the dates; care, purchases, game completion and claims used real interface actions. This did not mean seven real days had elapsed. Separate model and app-handler tests checked resource limits, older saves and changes from more than one tab.

Ten UI checks covered keyboard controls and desktop, tablet, 390px and 320px layouts. Eight panel checks and five map checks covered bank and quests, 44px phone/tablet controls and page overflow. Screenshot review checked the original art, text and button placement. A text-enlargement simulation was separate from native browser zoom and did not certify full accessibility. [Desktop](screenshots/desktop.png), [mobile](screenshots/mobile.png), [bank](screenshots/bank.png) and [quest notebook](screenshots/quests-mobile.png) show prepared examples.

Petrealm’s economy and UTC quest rules are original and local to the browser. Server accounts, trading, auctions, billing, paid Premium access and exact Neopets gameplay were not tested as delivered features.

[The dated feature comparison](research/feature-comparison.md) lists what worked, what was missing and which public sources were used. Authenticated target behaviour and proprietary algorithms remained unverified.
