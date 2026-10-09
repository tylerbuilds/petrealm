# Initial verification

The initial Linux build was checked with Node.js 24.14.0. All 14 model tests passed and the static build completed. Independent system-Chromium browser checks passed 17 checks, including the interactive timing game, care/economy, save/import/export/recovery, failed-save progress and two-tab mutations. A separate five-check browser suite exercised real two-tab IndexedDB fallback by disabling Web Locks in both tabs. Both suites reported zero page, console or failed-request errors.

Eleven independent controlled app checks also verified concurrent mutation composition, stale events, backups, dirty progress and abandoned game generations. Desktop and mobile screenshots show the original application.

[The live GitHub workflow](https://github.com/tylerbuilds/petrealm/actions/workflows/verify.yml) is the current authority for platform checks. It runs model tests, builds and real built-app browser smoke on Ubuntu and macOS. The public demo deploys after both platforms pass.

Neopets main-site and portal browser access was denied. Official public overview categories informed independently designed mechanics; no playable Neopets runtime or private backend was recovered. See [research provenance](research/rea-provenance.md).
