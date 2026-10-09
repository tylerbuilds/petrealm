# Release verification

The 0.3.0 source was checked on Fedora with Node.js 24.14.0 and system Chrome. **44 Node tests**, **18 existing browser workflow checks** and **12 bank/quest browser checks** passed against recorded source hashes, with no uncaught page or console errors or unrelated failed requests.

The new checks exercise original savings tiers, explicit daily interest, six local Lodge objectives and seven actual daily completion cycles, including replay prevention, missed-day reset and save/export round-trips. A synthetic UTC clock supplies each day's date; care, purchases, game completion and reward claims use actual UI actions. Independent model and application-handler checks cover resource limits, old saves and concurrent mutations.

A ten-check UI pass covers keyboard controls, desktop, tablet, 390px and 320px layouts. Eight additional panel checks and five map checks cover the bank and quest panels, including 44px phone/tablet controls and viewport overflow. Screenshot review checks the original illustrated identity, readable text and control placement. A separate text-only enlargement simulation is not native browser zoom or a complete accessibility certification. [Desktop](screenshots/desktop.png) and [mobile](screenshots/mobile.png) captures use synthetic example content; the new [bank](screenshots/bank.png) and [quest journal](screenshots/quests-mobile.png) retain that visual identity.

The world remains single-player and browser-local. Its economy and UTC quest rules are original. Server accounts, player trading, auctions, billing, paid Premium entitlement and original Neopets gameplay are not qualified.

The [Linux/macOS workflow](https://github.com/tylerbuilds/petrealm/actions/workflows/verify.yml) runs the current commit's Node tests, production build, real Chromium browser smoke and static-server checks on Ubuntu and macOS. GitHub Pages publication requires both platform jobs to pass. Its exact commit run status is the authority for remote qualification; local checks do not substitute for a macOS run. These are browser apps, with no native installer.

[All-tier feature comparison](research/feature-comparison.md) records delivered workflows, explicit gaps, primary sources and sanitised proof metadata. Original authenticated target behaviour and proprietary algorithm equivalence remain unverified. No full commercial feature parity is claimed.
