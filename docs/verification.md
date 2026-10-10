# Release verification

## 0.5 illustrated consumer world

The current local source passed **53 Node tests**, a production build and **59 actual Chromium checks** on Fedora with Node.js 24.14.0 and system Chrome. A separate public production-build browser smoke also passed; its three receipt checks cover execution and source/script stability, not three additional user workflows. The browser total is 50 first-play checks plus nine returning-world checks. It includes viewport, focus, persistence and source-stability assertions; it is not a claim of 59 distinct games or user workflows.

A fresh player selects and names an original companion, enters Sunmeadow, shares treats, plays and rests. The checks open the Satchel and mailbox, collect the 40-pebble gift exactly once, buy an outfit at its fixed price, finish both mini-games, collect an earned quest gift, practise at the exact cost and download a save. A real reload retains the same friend, personality, outfit, money and progress. The HUD and illustrated signposts route to the actual meadow, market, glen, map/notebook and training systems.

Desktop, tablet, 390px and 320px checks cover first adoption, the playable meadow, every place and the Satchel. On phones, local dialog scrolling reaches the last companion and adoption action, and one short page scroll reaches immediate care. Escape returns focus from the Satchel to its opener; outfit and Friends shortcuts open and focus their destination. Focused Friends, Dress up and bloom summaries retain focus and open state through three actual second-tab care saves and browser storage redraws. On 320px and 390px screens, measured care-meter tracks share the same baseline.

The returning-world checks load a populated earlier world with a grown Thistlehorn and a deliberately labelled 24-character fixture name. All original save semantics remain intact. Across the four sizes, the full grown silhouette, quote, wrapped name and path signs remain separate. The original nine species, eighteen young/bloomed forms, wardrobe art, immutable rules and persistence module retain the exact accepted 0.4 bytes.

The final local browser receipts report no uncaught page errors, console errors or failed requests, and confirm that their complete runtime source maps remained stable. Tests use synthetic local worlds and actual browser actions; narrow viewport checks do not establish physical touch-device testing or a complete accessibility certification. Local Chromium proof does not establish a macOS run or hosted deployment. The exact commit's [Linux/macOS workflow](https://github.com/tylerbuilds/petrealm/actions/workflows/verify.yml) remains the authority for remote platform and publication status.

Independent visual review accepted 44 actual current-source browser images and a separate original-world asset study, with no remaining material finding in the reviewed normal-size layouts. These image reviews are separate from the browser check total. [Meadow](screenshots/world-0.5.png), [phone meadow](screenshots/world-mobile-0.5.png) and [world map](screenshots/world-map-0.5.png) show synthetic example worlds. [The player guide](explore-petrealm.md) explains the actual controls and paths. This is an original single-player local world. No online accounts, shared economy, external calls or full Neopets service parity are claimed.

## Previous 0.4 companions and growth

The 0.4 source passed **16 actual Chromium workflow checks** on Fedora with Node.js 24.14.0. All nine species were selected, named, assigned a personality, adopted, cared for and reloaded through the UI. Distinct rendered portraits were checked, with an independently reviewed original-art contact sheet covering eighteen young and bloomed forms.

The runtime checks earn first bloom through paid practice and the companion's own care, then verify the changed portrait, stronger future practice, wardrobes and arena. Native two-tab checks queue a different active companion before Practice and Bloom: the stale action refuses before charging. Actual exported backups round-trip, and an earlier populated 0.3 world preserves money, bank, supplies and histories with neutral new companion defaults. No page errors, console errors or failed requests occurred.

Desktop, tablet, 390px and 320px captures cover the gallery and earned garden outcome. The last gallery choice and adoption action remain reachable on a 320px phone. [Meet the companions](screenshots/adoption-0.4.png), [phone adoption](screenshots/adoption-mobile-0.4.png) and [earned bloom](screenshots/growth-0.4.png) and [phone garden](screenshots/growth-mobile-0.4.png) use synthetic local worlds. The [companion guide](companions.md) gives exact care and growth rules.

The exact commit's [Linux/macOS workflow](https://github.com/tylerbuilds/petrealm/actions/workflows/verify.yml) is the authority for platform, built-browser and deployment status. Publication requires both platform jobs to pass. The earlier broad parity inventory remains a dated 0.3 snapshot; this release adds playable original local systems rather than an online service catalogue.

## Previous 0.3 qualification

The 0.3.0 source was checked on Fedora with Node.js 24.14.0 and system Chrome. **44 Node tests**, **18 existing browser workflow checks** and **12 bank/quest browser checks** passed against recorded source hashes, with no uncaught page or console errors or unrelated failed requests.

The new checks exercise original savings tiers, explicit daily interest, six local Lodge objectives and seven actual daily completion cycles, including replay prevention, missed-day reset and save/export round-trips. A synthetic UTC clock supplies each day's date; care, purchases, game completion and reward claims use actual UI actions. Independent model and application-handler checks cover resource limits, old saves and concurrent mutations.

A ten-check UI pass covers keyboard controls, desktop, tablet, 390px and 320px layouts. Eight additional panel checks and five map checks cover the bank and quest panels, including 44px phone/tablet controls and viewport overflow. Screenshot review checks the original illustrated identity, readable text and control placement. A separate text-only enlargement simulation is not native browser zoom or a complete accessibility certification. [Desktop](screenshots/desktop.png) and [mobile](screenshots/mobile.png) captures use synthetic example content; the new [bank](screenshots/bank.png) and [quest journal](screenshots/quests-mobile.png) retain that visual identity.

The world remains single-player and browser-local. Its economy and UTC quest rules are original. Server accounts, player trading, auctions, billing, paid Premium entitlement and original Neopets gameplay are not qualified.

The [Linux/macOS workflow](https://github.com/tylerbuilds/petrealm/actions/workflows/verify.yml) runs the current commit's Node tests, production build, real Chromium browser smoke and static-server checks on Ubuntu and macOS. GitHub Pages publication requires both platform jobs to pass. Its exact commit run status is the authority for remote qualification; local checks do not substitute for a macOS run. These are browser apps, with no native installer.

[All-tier feature comparison](research/feature-comparison.md) records delivered workflows, explicit gaps, primary sources and sanitised proof metadata. Original authenticated target behaviour and proprietary algorithm equivalence remain unverified. No full commercial feature parity is claimed.
