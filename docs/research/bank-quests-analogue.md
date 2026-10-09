# Bank interest and daily Quest Log analogue

Reference documentation checked on 10 October 2026. This records the agreed Petrealm 0.3 rules and the public Neopets facts that informed them. The Neopets account flows were not exercised. Implementation and browser qualification are separate checks; this document alone is not a runtime parity receipt.

## Documented Neopets behaviour

| Target fact | Official source and publication date | Boundary of this observation |
| --- | --- | --- |
| Five regular Daily Quests are supplied each day. The current count FAQ also lists four separate NeoPass quests. Refresh happens at midnight NST. | [Daily quest counts](https://classic.support.neopets.com/hc/en-us/articles/37421912061197-How-many-quests-do-I-get-every-day), 17 June 2025. | Petrealm's five/six daily-objective analogue does not implement the separate NeoPass quests. UTC is its own reset rule. |
| Premium adds a sixth Daily Quest. | [Premium Daily Quest perk](https://classic.support.neopets.com/hc/en-us/articles/35347436781581-What-is-the-Premium-Daily-Quest-perk), 26 March 2025. | The target entitlement and reward catalogue were not inspected. Explorer Lodge is a local Petrealm option. |
| Five completed Daily Quests qualify for the weekly streak; the Premium quest can be one of those five. | [Required count](https://classic.support.neopets.com/hc/en-us/articles/35347487740941-Do-I-have-to-complete-all-6-Daily-Quests-to-earn-my-weekly-streak) and [Premium quest qualification](https://classic.support.neopets.com/hc/en-us/articles/35347494525581-Do-the-Premium-Daily-Quests-count-towards-completing-my-weekly-streak), 26 March 2025. | This supports any five of six rather than requiring all five standard quests plus the extra quest. |
| An objective is fully completed only after its reward is claimed in the Quest Log or side panel. | [Reward claiming](https://classic.support.neopets.com/hc/en-us/articles/20688745132045-I-did-what-the-quest-asked-but-didn-t-get-my-reward-What-gives), 24 October 2023. | Completion progress and claimed progress must remain distinct. |
| Receiving the daily completion reward for seven consecutive days earns a further reward. | [Daily and weekly rewards](https://classic.support.neopets.com/hc/en-us/articles/20688749710093-Do-I-get-something-if-I-finish-all-of-my-quests), 24 October 2023. | Exact live daily/weekly button ordering and reward values were not observed. |
| Unfinished quests are discarded at refresh. | [Unfinished quests](https://classic.support.neopets.com/hc/en-us/articles/20688677148813-Do-I-keep-my-unfinished-quests-when-I-receive-new-ones), 24 October 2023. | Imported old task progress must not become a fresh day's completed tasks. |
| Quest categories include item purchases, mini-games, wheels and pet care. Premium uses the same categories as regular Daily Quests. | [Quest types](https://classic.support.neopets.com/hc/en-us/articles/20688690683021-What-types-of-quests-can-I-get), 24 October 2023, and [Premium quest types](https://classic.support.neopets.com/hc/en-us/articles/35347502875021-What-kinds-of-quests-will-appear-as-Premium-Daily-Quests), 26 March 2025. | Petrealm's five fixed tasks and parcel task are original allocations, not recovered target assignments. |
| Streak-save tickets can restore the previous weekly Quest Log day. They do not replay missed daily quests. A player declining the save starts a new streak that day. | [Saving a streak](https://classic.support.neopets.com/hc/en-us/articles/34106193279629-What-happens-once-I-decide-to-save-my-Quest-Log-streak), [no missed-quest replay](https://classic.support.neopets.com/hc/en-us/articles/34106262659597-Can-I-replay-any-daily-quests-I-missed-if-I-use-a-Streak-Save-Ticket), and [declining the save](https://classic.support.neopets.com/hc/en-us/articles/34106239341837-My-Quest-Log-streak-broke-and-I-don-t-want-to-save-it-But-I-m-X-days-into-the-next-week-If-I-choose-not-to-save-my-streak-will-I-start-in-the-middle-of-the-week-or-will-a-new-week-start-for-me), 6 February 2025. | Petrealm does not provide streak-save tickets or the target save/decline interstitial. |

The National Neopian Bank has daily interest. An [official staff response in Neopian Times issue 1029](https://www.neopets.com/ntimes/index.phtml?issue=1029&section=editorial) addresses an incorrect interest-log message in March 2025. The reported message refers to depositing or withdrawing before collection; the current exact transaction-order restriction was not exercised. A [historical staff explanation in issue 291](https://www.neopets.com/ntimes/index.phtml?issue=291&section=editorial) calculates daily interest from an annual rate over 365 days and uses a 12.5% Ultimate Riches example. That historical example does not establish the current tier catalogue, thresholds, rounding, balance caps or eligibility rules. The current [bank page](https://www.neopets.com/bank.phtml) returned HTTP 403 during anonymous research; no access bypass was attempted.

## Original Petrealm bank rules

All names, thresholds and the four-tier arrangement below are Petrealm design choices. They are not a reconstruction of the target's present bank configuration. Rates are annual; interest is a daily whole-pebble amount.

| Account | Minimum bank balance for an explicit upgrade | Annual rate | Basis points |
| --- | ---: | ---: | ---: |
| Seedling saver | 0 | 5% | 500 |
| Sapling keeper | 1,000 | 7.5% | 750 |
| Canopy keeper | 10,000 | 10% | 1,000 |
| Old grove trust | 100,000 | 12.5% | 1,250 |

The player must explicitly choose a higher account while the current bank balance meets its threshold. An attained tier remains after withdrawal. No automatic upgrade or downgrade occurs.

Daily interest is `ceil(bank balance × annual basis points / 3,650,000)`. A positive bank balance is required. For example, 1,000 pebbles at Sapling keeper produces 1 pebble; 100,000 at Old grove trust produces 35. The player explicitly collects it once per UTC day, and the award goes into the bank. Missed days do not accrue interest. Deposits, withdrawals and account upgrades cannot reopen an already collected day; unlike the unverified target ordering restriction, a transfer before an otherwise eligible collection does not prohibit it.

A collection that would take the combined wallet and bank balance above one billion pebbles is rejected atomically. Rejection must preserve both balances and the collection marker, allowing a later eligible retry after spending. Successful collection updates the balance and same-day claim marker together.

## Original Petrealm daily and weekly rules

Each UTC day has five distinct local objectives:

| Objective | Required successful actions |
| --- | ---: |
| Feed companions | 3 |
| Play with a companion | 1 |
| Buy an item | 1 |
| Complete a mini-game | 1 |
| Rest a companion | 1 |

Explorer Lodge adds a sixth objective: collect that day's Lodge parcel once. Its reward is an original local perk. A parcel already collected that day cannot be replayed by leaving and rejoining the Lodge.

Every quest requires its own explicit reward claim after meeting the objective. Any five distinct claimed daily quests unlock a separate **Collect daily reward** action worth 40 pebbles. Four claimed quests do not qualify. With Explorer Lodge, the parcel quest can replace any one of the other five; claiming all six does not produce another daily completion reward.

Seven consecutive UTC days with a successful explicit daily-completion claim add a 150-pebble weekly bonus. The seventh day's 40-pebble reward and 150-pebble bonus are one atomic award. A successful seventh claim completes that cycle; the next eligible day begins the next seven-day cycle. Repeating a claim, refreshing, switching companions or toggling Lodge membership cannot award either bonus again for the same day.

At rollover, unclaimed daily progress and rewards expire. A missed daily-completion claim breaks the consecutive cycle, even if the player performed the objectives. There is no catch-up for past dates. The world keeps its saved time monotonic so moving the device clock backwards cannot reopen a day already passed in that world.

The device clock and save files remain under the player's control. These rules are a local single-player ledger, not a trusted server economy or an anti-cheat guarantee against editing or replacing local files. State transitions must use Petrealm's existing shared write lock so concurrent tabs do not independently claim the same stored reward.

## Qualification and remaining gaps

Useful checks cover explicit claims versus objectives, every qualifying five-of-six combination, four-of-six rejection, same-day replay, concurrent tabs, midnight rollover, a missed day, seven consecutive days, the next cycle, clock rollback, capacity rejection and a retry without partial rewards. Bank checks additionally cover threshold upgrades, retained tiers after withdrawal, positive-balance rounding, zero balance, first-day collection, transfer-before/after collection and maximum combined balance. Existing saved worlds must retain their money, companions and previously recorded reward markers during migration.

This wave addresses local daily interest, five/six daily objectives and an explicit seven-day cycle. NST timing, separate NeoPass quests, rotating quest/prize pools, rerolls, streak-save tickets, the full bank account catalogue and current target transaction ordering remain different or unverified. Neopets subscription verification, account-backed balances and authenticated runtime parity remain outside this local implementation.
