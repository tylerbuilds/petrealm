# Petrealm version 3 rules and save contract

These are original game rules. They are not recovered Neopets algorithms, assets or balances. The source-linked free/Premium comparison and remaining gaps are in [the parity ledger](parity-ledger.md).

## Companions and space

A new world starts with 120 pebbles, three sunberries, two honey acorns and one rainbow ribbon. Adoption is free. Each friend has a stable ID, original species, name, care stats, wardrobe and experience. Switching the active companion determines who receives care, game happiness and quest experience. Offline decay applies to every companion.

Standard mode has seven spaces. Explorer Lodge mode adds seven more. Both are free in Petrealm. Each 250-pebble expansion deed must be purchased and then used; using it consumes the deed and permanently adds one space. At most twelve deeds may be used, making the maximum capacity 26. Returning to standard mode is refused when the remaining spaces cannot hold the current roster; no friend is silently removed. There is no release, transfer, account or subscription service in this build.

Names accept 1–24 Unicode characters, are trimmed and NFC-normalised, and cannot contain control characters. Newly adopted friends start at 85 fullness, 80 happiness, 85 energy and zero XP.

The roster contains three original spirits, three animals and three monsters. [The companion guide](companions.md) lists their names, traits, food preferences and personalities. Each new species has a favourite snack giving +3 happiness. Curious adds a further +2 on that favourite; Gentle adds +3 to rest happiness; Spirited adds +3 to play happiness. Steady is neutral. The original three species have no food bonus, preserving their existing behaviour. Stats remain bounded at 100.

Each companion independently tracks fresh feeds, plays, rests, practices and one first-bloom marker. Care counters increment only after a successful action; sums cannot exceed the world's recorded feed/play/rest totals. An unsuccessful action changes neither inventory, money, stats, XP nor milestones.

## Care, supplies and bank

Every stat stays between 0 and 100. Prices are fixed in the model.

| Action or item | Price | Effect |
| --- | ---: | --- |
| Sunberry | 12 pebbles | Consumed; +22 fullness, +6 happiness, +4 XP |
| Honey acorn | 8 pebbles | Consumed; +12 fullness, +12 energy, +3 happiness, +4 XP |
| Rainbow ribbon | 35 pebbles | Reusable; play gives +20 happiness, −12 energy, −4 fullness, +6 XP |
| Rest | Free | +30 energy, +3 happiness, −5 fullness, +2 XP |
| Leaf cap | 45 pebbles | Head accessory; +2 attack in a newly started arena match |
| Moon scarf | 55 pebbles | Neck accessory; blocks 2 incoming arena damage |
| Dew potion | 18 pebbles | Consumed in an arena turn; restores up to 22 HP |
| Lodge expansion deed | 250 pebbles | Consumed by Use deed; adds one companion space, at most twelve |

Ribbon play requires at least 12 energy. Clothing stays in inventory when equipped, but purchased copies limit how many companions can wear it at once. Taking it off makes that copy available to another friend. Equipping cannot alter a live arena match.

Purchases reject insufficient funds, unknown items or inventory at 999 copies before changing anything. Bank deposit/withdraw accepts positive whole amounts only and conserves wallet plus bank total. Neither balance may be negative or exceed one billion. There are no fees, resale, scarcity or player trades. Interest follows the original local rules below.

## Original savings tiers and daily interest

| Savings account | Bank balance required to upgrade | Annual game rate |
| --- | ---: | ---: |
| Seedling saver | 0 | 5% |
| Sapling keeper | 1,000 | 7.5% |
| Canopy keeper | 10,000 | 10% |
| Old grove trust | 100,000 | 12.5% |

An upgrade is explicit, requires the current deposited balance and can only move to a higher tier. The selected tier stays after withdrawals. These account names, thresholds and rates are original Petrealm game rules, with no real-money service.

Click Collect interest to credit `ceil(bank balance × annual basis points / 3,650,000)` pebbles to the bank once per UTC date. A zero balance cannot claim. The current balance and tier determine the offer; depositing or withdrawing before an eligible claim is allowed. Transfers, upgrades, reloads and clock rollback cannot reopen a collected date. Missed days do not accrue interest. A claim that would take combined wallet and bank money above one billion is rejected without changing money or claim history; spending creates room for a retry. Interest amounts and lifetime claim/earned counters remain bounded whole numbers.

## Time and experience

Each elapsed hour decreases fullness by 3, happiness by 2 and energy by 1. Fractional hours count. A time update applies at most 72 hours, floors every stat at zero, then advances the saved timestamp. Reload does not reapply the same elapsed period. Clock rollback never adds stats or moves saved time backwards.

Companions cannot die or disappear from low stats. Rest remains available outside a match. Every 100 XP raises a level. XP caps at 1,999 and level 20. Care, games, quests and victories award experience; switching companions keeps their progress independent. The player controls the device clock and local files; this is not a server-owned anti-cheat economy.

Training grove practice costs 20 wallet pebbles, 12 energy and four fullness. It grants 18 XP, or 24 after a first bloom, subject to the XP cap. Insufficient wallet money/energy, an active match, a saturated practice counter or level 20 rejects the whole action. Savings are not silently withdrawn.

A first bloom is explicit and permanent. The active friend must reach level 3, have at least one newly tracked feed, play and rest, and have 60 wallet pebbles available. It costs 60 pebbles and grants 40 XP, ten happiness and ten energy, subject to their caps. The first-bloom marker changes that species' original portrait and future practice benefit. Repeat attempts, reloads and clock rollback cannot grant a second bloom. Growth does not change an arena snapshot; both practice and growth are refused during an active match.

## Daily gifts, Lodge and quests

The standard gift is 40 pebbles once per UTC date. An Explorer Lodge parcel adds 20 pebbles and one sunberry once per UTC date. Its claim date survives leaving/rejoining, preventing a same-day second parcel.

| Daily quest | Requirement on the current UTC day | Reward |
| --- | --- | --- |
| Three square meals | Feed companions three times | 25 pebbles + 10 XP |
| A ribbon and a wiggle | Play with a companion | 10 pebbles + 5 XP |
| Something for the satchel | Buy a supply | 10 pebbles + 5 XP |
| A little spark of play | Finish either mini-game, at any score | 15 pebbles + 5 XP |
| A moment under the leaves | Rest a companion | 10 pebbles + 5 XP |
| A note from the Lodge | Collect the Explorer parcel; available in free local Lodge mode | 10 pebbles + 5 XP |

Each objective has its own explicit once-only reward claim. Actual successful actions build its progress; completing an objective without claiming it does not qualify for the day gift. Any five distinct claimed tasks unlock an explicit 40-pebble daily completion gift. Explorer's sixth task can replace any of the others among those five. Claiming all six does not pay another completion gift, and changing membership does not erase or replay a paid task.

Seven consecutive UTC dates with a successful daily-completion claim add a 150-pebble weekly gift. It pays atomically with the seventh day's 40 pebbles; the next day begins a fresh seven-day cycle. This is a rolling streak, independent of calendar weeks. Daily claims reset at midnight UTC. Unclaimed objectives and gifts expire, and missing the day-completion claim breaks the streak even if the objectives were performed. Lifetime completion and weekly-reward history remain. There is no catch-up or streak-save ticket. The saved world clock never moves backwards, so rollback cannot reopen an expired or paid date. Money-limit failures preserve the current claims and progress for an eligible retry.

| Lasting quest | Requirement | Reward, once per world |
| --- | --- | --- |
| A growing family | Adopt two companions | 30 pebbles + 10 XP |
| Arena debut | Win one arena battle | 40 pebbles + 10 XP |
| Game explorer | Complete three mini-game rounds | 30 pebbles + 10 XP |

Quest XP goes to the active companion. An active arena match must finish before a quest or day-completion claim. Bank interest, ordinary gifts and Lodge parcels remain economy-only actions. The day/week rewards above are Petrealm choices; the target's reward catalogue and NST timing are not reproduced.

## Two interactive games

**Firefly flight:** a light moves with the browser animation clock. Click Catch or press Space to sample its position. The centre is 50% of track width; maximum scoring distance is 12%. Each accepted catch scores `max(0, round(10 × (1 − distance / 0.12)))`. Ten catches or thirty seconds end the round. Catches require at least 350 ms between them, and speed increases slightly.

**Memory meadow:** twelve shuffled cards contain six matching pairs. Turn over two at a time. Mismatches stay visible for 650 ms before hiding. Finding all six pairs scores `max(0, 100 − 2 × (turns − 6))`. The round lasts at most 75 seconds; timeout scores ten points per matched pair, up to 50 for an incomplete board. This is a real interactive matching mechanic, not a random prize button.

Each completed round gives +3 happiness, +5 XP and `floor(score × 0.4)` pebbles. Scores must be whole values 0–100. Payment caps at 40 per round and 120 shared across both games per UTC day. After that cap, rounds still count and award happiness/XP but pay zero.

Changing area/game, opening the save manager, changing active companion elsewhere, starting a match elsewhere or replacing the world abandons an unfinished round. Finished rewards read the latest shared state under the save mutex; an old world generation cannot pay into an imported replacement. No browser mutex is held while a game animates.

## Arena progression

| Rival | Required level | HP | Base attack | First victory | Victory XP |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ashgrub | 1 | 30 | 7 | 25 pebbles | 20 |
| Stonebeak | 3 | 48 | 10 | 40 pebbles | 30 |
| Frostwisp | 5 | 70 | 13 | 60 pebbles | 45 |

An opponent after the first also requires the previous opponent's first victory. Entry costs 10 energy. Companion HP starts at `36 + level × 4`; attack is `8 + level × 2`, plus a leaf cap's bonus. Guard deals `2 + floor(level / 2)` damage and halves the incoming base attack, rounded up. A potion restores HP and consumes a turn. A rival's attack adds a repeating 0, 1, 2 bonus by turn; scarf defence is then subtracted, with at least one damage remaining.

Victory settles the first-win ledger, pebbles, XP and +8 happiness atomically. Repeat wins give 5 XP and zero pebbles. Defeat gives −5 happiness and no reward. Matches close after 40 turns. The snapshot persists HP, participant, equipment-derived power/defence, turn, status and recent log, so reload continues the same match. Terminal snapshots cannot be used for another reward action.

An active match prevents changing companions, adoption, care, games, clothing, membership, expansion use or XP-bearing quest claims. Shops, bank and economy-only daily parcels remain usable. These are local single-player battles; there is no PvP or remote challenger service.

## The little trails

Three routes unlock per companion at bond 0/2/4. An outing costs 6 Energy and 2 Fullness once and requires at least 10 Energy and 2 Fullness. Three actual choices complete it; earlier steps do not reward. Completed outings add up to 12 XP, up to 10 Happiness and 1 bond (2 if at least one selected approach matches personality). No pebbles, inventory supplies, daily quest counts or game-cap records change. At bond 3 an actual third personality-knack choice becomes available. Completed outings cycle three story variants; the final approach plus variant deterministically selects one of the route's three original treasures.

`pet.trail` contains completed `trips` and `bond`; `trails` keeps a bounded sequence, up to nine unique discoveries, exactly three display positions, one active outing and one most recent result. Displaying, moving or putting away discoveries never rewards or loses ownership. There are no timed rewards, reset, cooldown or missed-day penalties. The exact player-facing rules and four personality approaches are in [The little trails](little-trails.md).

The active outing persists its friend, route, variant, run ID, expected step and selected approaches. Choices require the displayed run and step, so simultaneous or replayed answers cannot skip scenes or settle twice. Abandonment keeps the initial resource cost and grants nothing. Active outings prevent companion switching, adoption and arena entry; existing care, shops, training, growth, games and claims remain usable. All mutations retain the shared save lock and fresh-state read. Trail callbacks also require the observed companion, world generation and live trail view; leaving that view or opening a dialog invalidates a queued callback. Display edits refuse a stale meadow arrangement. Progress remains bounded, and resource/counter failures reject before any cost.

## Save migration, coordination and recovery

The existing keys `petrealm.save.v1` and `petrealm.backup.v1` remain in use so installed worlds are found. Their JSON version is now 3; accepted version 1 and 2 imports migrate before play. `petrealm.world-generation.v1` marks explicit replacements, not normal actions.

Version 1 imports are first validated against their original complete schema, then migrated. The existing companion becomes `pet-1`; stats, wallet, original supplies, reward history, counts and achievements are retained. New systems start empty, without invented XP or battle history. An automatic first load retains the original v1 text separately at `petrealm.migration-original.v1` before persisting v3; the save manager can download it. This original survives later ordinary backup swaps. A failed original-retention write blocks every later save overwrite until retention succeeds, keeping the original durable world and the in-memory migration available for export.

Older version 2 saves may omit the complete new bank metadata and quest-log record. Validation accepts that older schema, then initialises Seedling saver and empty interest/streak history. An already paid same-day daily feast stays paid and its feed progress stays intact; the other new task counters start at zero. Money, companions, original progress and lasting claims are unchanged. Partial new metadata, unknown tiers, unearned/duplicate daily claims, future reward dates, inconsistent streaks and invalid counters are rejected.

In accepted older version 2 files, per-pet `personality` and `journey` are optional together for earlier files; `journey` contains `feeds`, `plays`, `rests`, `trainings` (bounded whole counters) and `growth` (zero or one). If absent, migration adds Steady and all-zero milestones without assigning old shared care history. Original pet fields, monetary and reward ledgers, battle snapshots and timestamps remain exact. Partial, unknown, non-integer or inconsistent companion metadata is refused. Practice and bloom capture the visible companion identity and world generation before awaiting the existing save mutex; a different fresh active friend or replaced world causes a fresh render and an explanatory no-charge refusal. Same-friend concurrent purchases and practices still compose from the latest saved state.

Version 3 requires the complete new trail records. Version 1 and 2 migrations add zero trips/bond and an empty journal, without fabricating individual play history or changing older field values. The first version 2 raw original is separately retained at `petrealm.migration-original.v2` and read back exactly before any automatic v3 overwrite. Existing v1 migration originals remain separate. Older 0.5 writers reject v3, rather than applying an unsupported world.

If a different version 2 original and an earlier backup are already protected, migration refuses to overwrite either original or primary save. Current migration/progress stays in RAM and is exactly exportable. Save downloads the pending original and separately offers the earlier original. An explicit **I've kept the original · finish upgrade** action follows that native download: it checks the same exact durable original and world generation under the lock, then saves current v3 progress while retaining the earlier original and backup. A changed world refuses; a failed save reinstates pending original retention and keeps durable bytes unchanged. No unbounded migration archive is created.

Files are limited to 32 KiB. Validation rejects unknown/missing fields, unsupported versions, duplicate keys, excessive nesting, invalid finite numbers/dates, mismatched pet IDs/levels, excess worn copies, bank bounds, inconsistent quest claims, impossible battle health/status/progression and duplicate reward markers. A failed import leaves the current world unchanged. Explicit replacement first retains the freshest world (or dirty in-memory world when appropriate) as a backup; failed replacement writes roll back backup/generation changes. Recovery keeps the original invalid text available for download, valid import or explicit Start fresh. The save manager can download invalid prior backup text without trying to apply it.

All writers, including bank, quests, battles, care, migration, timer updates and replacements, use the same exclusive Web Lock or IndexedDB read/write transaction fallback and read current stored state inside it. Queued storage events re-read current data. Failed save writes retain all in-memory actions while the durable base is unchanged. If another tab saves a conflicting world, further mutations are refused and the unsaved world remains exportable without overwriting the newer save. There is no cloud sync or server authority.
