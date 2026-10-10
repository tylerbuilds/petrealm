# Bank and quest rules: 0.3 research

Public documentation was checked on 10 October 2026. This page records the Petrealm 0.3 rules and the Neopets articles used while designing them. No Neopets account flows were tested. The sources explain the design; they do not prove the local app passed a browser test.

## What the public Neopets articles say

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

## Petrealm’s bank rules

The names, thresholds and four account tiers below are Petrealm’s own design. They do not reproduce the target’s current bank setup. Rates are yearly game rates; daily interest is a whole number of pebbles.

| Account | Minimum bank balance for an explicit upgrade | Annual rate | Basis points |
| --- | ---: | ---: | ---: |
| Seedling saver | 0 | 5% | 500 |
| Sapling keeper | 1,000 | 7.5% | 750 |
| Canopy keeper | 10,000 | 10% | 1,000 |
| Old grove trust | 100,000 | 12.5% | 1,250 |

Choose a higher account when the bank holds enough pebbles. Once opened, that tier stays available even if you withdraw money. The account does not upgrade or downgrade itself.

Daily interest is `ceil(bank balance × annual basis points / 3,650,000)`. The bank must hold at least one pebble. For example, 1,000 pebbles at Sapling keeper earns 1; 100,000 at Old grove trust earns 35. Collect interest once per UTC day to add it to savings. Missed days do not build up interest. Depositing, withdrawing or upgrading cannot claim the same day again. You can transfer before collecting that day’s interest; the target’s exact transfer-order rule was not verified.

If collection would take the wallet and bank above one billion pebbles in total, it stops without changing either balance or marking the day as claimed. The player can spend some pebbles and try again. A successful claim saves the new balance and claim date together.

## Petrealm’s daily and weekly quests

Each UTC day has five different tasks:

| Objective | Required successful actions |
| --- | ---: |
| Feed companions | 3 |
| Play with a companion | 1 |
| Buy an item | 1 |
| Complete a mini-game | 1 |
| Rest a companion | 1 |

Explorer Lodge adds a sixth task: collect that day’s parcel. The parcel is an original local reward. Leaving and rejoining the Lodge cannot collect it again that day.

Finish a task, then collect its quest gift. Collecting any five different daily quest gifts opens a separate **Collect daily reward** action worth 40 pebbles. Four gifts are not enough. Lodge members can use the parcel quest in place of one other task. Collecting all six does not earn the daily bonus twice.

Collect the daily bonus on seven UTC days in a row to earn another 150 pebbles. On day seven, the 40-pebble daily gift and 150-pebble bonus are saved together. That finishes the cycle; the next eligible day starts a new one. Repeating a click, refreshing, switching friends or changing Lodge membership cannot claim either bonus twice that day.

At midnight UTC, unfinished daily progress and uncollected gifts expire. Missing the daily bonus starts the seven-day count over, even if the tasks were done. Past days cannot be collected later. Saved world time never moves backwards, so turning back the device clock cannot reopen a day that world has already passed.

Players control their device clock and save files. This is a local single-player game, so it does not promise to prevent edited or replaced saves. Writes use Petrealm’s shared lock: tabs take turns updating the same world instead of each paying the same reward.

## Checks and missing features

Quest tests need to distinguish doing a task from collecting its gift. They cover every five-of-six combination, rejection at four, duplicate clicks, other tabs, midnight, missed days, seven-day completion, the next cycle, clock rollback, limits and a retry that leaves no partial reward. Bank tests also cover upgrade thresholds, tiers after withdrawal, rounding, zero balance, first collection, transfers before and after collection, and the combined money limit. Older saves must keep their money, friends and claimed rewards.

Petrealm 0.3 added local daily interest, five or six daily quests and a seven-day bonus. NST timing, separate NeoPass quests, changing task and prize pools, rerolls, streak-save tickets, the full bank catalogue and the target’s current transfer-order rule were missing or unverified. The local game does not provide Neopets subscription checks or server-held account balances.
