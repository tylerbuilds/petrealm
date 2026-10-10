# Checks by release

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
