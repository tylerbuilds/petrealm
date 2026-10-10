# Petrealm rules and save files

These are Petrealm’s own rules. The [feature comparison](parity-ledger.md) explains how they differ from Neopets and links to the public sources.

## Companions and space

A new world starts with 120 pebbles, three sunberries, two honey acorns and one rainbow ribbon. Adoption is free. Each friend keeps their own name, species, care, outfit, XP and bond. Your chosen friend receives care, game Happiness and quest XP. Time away does not reduce care, bond, traits or earned progress.

Your meadow starts with seven spaces. Joining the free Explorer Lodge adds seven more. Buy a 250-pebble expansion deed, then use it to add one permanent space. Each deed is used up. You can use up to twelve, for a maximum of 26 friends. You can’t leave the Lodge if the remaining spaces would be too few. Friends aren’t removed to make room. There’s no release, transfer, account or subscription service.

Names can have 1 to 24 Unicode characters, with no control characters. Spaces at the ends are removed and equivalent Unicode spellings are normalised. New friends start with 85 Fullness, 80 Happiness, 85 Energy and zero XP.

There are three spirits, three animals and three monsters. [Meet the companions](companions.md) for their names, traits and favourite snacks. A favourite snack gives 3 extra Happiness. Curious adds 2 more for that snack, Gentle adds 3 to nap Happiness, and Spirited adds 3 to ribbon-play Happiness. Steady has the usual care effects. Mossling, Emberkit and Moonfin have no favourite-food bonus. Stats stop at 100.

Each friend records their own meals, ribbon plays, naps, practices and first bloom. Only successful care counts, and individual counts can’t add up to more than the world’s care totals. Failed actions leave supplies, pebbles, stats, XP and progress unchanged.

## Care, supplies and bank

Stats stay between 0 and 100. The table shows the fixed prices and usual effects; personality and favourite-snack bonuses apply on top.

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

Ribbon play needs at least 12 Energy. Outfits stay in your supplies while worn. Each copy can be worn by one friend at a time, so take it off before sharing it. You can’t change outfits during a match.

You can’t buy an unknown item, buy without enough pebbles or hold more than 999 copies. Moving pebbles between your pocket and savings needs a positive whole amount and keeps the total unchanged. Balances can’t go below zero or above one billion. There are no fees, resale, scarcity or player trades.

## Original savings tiers and daily interest

| Savings account | Bank balance required to upgrade | Annual game rate |
| --- | ---: | ---: |
| Seedling saver | 0 | 5% |
| Sapling keeper | 1,000 | 7.5% |
| Canopy keeper | 10,000 | 10% |
| Old grove trust | 100,000 | 12.5% |

Choose an upgrade when your savings meet its minimum. You can only move to a higher account. You keep its rate when you take pebbles out. The account names, amounts and rates are original game rules; no real money is involved.

Collect interest once each UTC day. The amount is `ceil(bank balance × annual basis points / 3,650,000)`, added to savings. You need a positive balance. Moving pebbles or upgrading before collection can change the offer. Moving them afterwards, reloading or turning the clock back won’t give a second collection. Missed days don’t save up interest. If the reward would take your pocket and savings above one billion, nothing changes. Spend some pebbles and try again. Interest totals and claim counts stay within their whole-number limits.

## Time and experience

Elapsed time advances the saved clock and daily reward dates, but never reduces Fullness, Happiness or Energy. Activities can still spend energy or fullness at their stated costs. Turning the clock back cannot reopen claimed days or advance an expedition before its saved return time.

Low stats won’t make your friends die or disappear. They can nap outside a match. Every 100 XP raises a level, up to level 20 and 1,999 XP. Care, games, quests and wins give XP. Each friend keeps their own progress. The clock and save files belong to the player; these are local game rules, not a server-run economy.

Practice costs 20 pocket pebbles, 12 Energy and 4 Fullness. It gives up to 18 XP, or 24 after blooming. You need enough pocket pebbles and Energy, must finish any match first, and can’t practise at the maximum XP or practice count. The game won’t take money from savings to cover the cost.

Choose to bloom once your friend reaches level 3 and has shared a meal, ribbon play and nap. It costs 60 pocket pebbles and happens once per friend. Blooming gives a new look, up to 40 XP, 10 Happiness and 10 Energy, then makes future practice give more XP. Stats and XP still stop at their limits. You can’t practise or bloom during a match.

## Daily gifts, Lodge and quests

Mallow sends 40 pebbles once each UTC day. Explorer Lodge members can also collect 20 pebbles and one sunberry. Leaving and rejoining the Lodge won’t give a second parcel that day.

| Daily quest | Requirement on the current UTC day | Reward |
| --- | --- | --- |
| Three square meals | Feed companions three times | 25 pebbles + 10 XP |
| A ribbon and a wiggle | Play with a companion | 10 pebbles + 5 XP |
| Something for the satchel | Buy a supply | 10 pebbles + 5 XP |
| A little spark of play | Finish either mini-game, at any score | 15 pebbles + 5 XP |
| A moment under the leaves | Rest a companion | 10 pebbles + 5 XP |
| A note from the Lodge | Collect the Explorer parcel; available in free local Lodge mode | 10 pebbles + 5 XP |

After doing a daily quest, collect its gift. Collect any five different daily quest gifts to unlock a 40-pebble bonus. The Lodge’s sixth quest can replace one of the other five. Collecting all six won’t give another bonus. Joining or leaving the Lodge won’t erase a collected gift or let you collect it again.

Every seven completed quest days earn an extra 150 pebbles alongside the seventh 40-pebble gift. Days need not be consecutive: time away keeps the accumulated completion count. Older worlds retain completed-day totals and rewards already paid; the new cycle follows that lifetime total. At midnight UTC, unfinished daily tasks and uncollected daily gifts reset. Turning the clock back won’t reopen a finished day. If there’s no room for a reward, it stays unclaimed and nothing is partly paid.

| Lasting quest | Requirement | Reward, once per world |
| --- | --- | --- |
| A growing family | Adopt two companions | 30 pebbles + 10 XP |
| Arena debut | Win one arena battle | 40 pebbles + 10 XP |
| Game explorer | Complete three mini-game rounds | 30 pebbles + 10 XP |

Quest XP goes to your chosen friend. Finish a match before collecting a quest or daily quest bonus. Interest, Mallow’s gift and Lodge parcels can still be collected during a match because they don’t give XP. These rewards and UTC resets are Petrealm rules; Neopets uses different rewards and NST timing.

## Two interactive games

**Firefly flight:** catch the moving light by pressing **Catch the light** or Space. Points depend on how close it is to the centre of the track. The scoring range is 12% of the track on either side of the centre, at 50%. Each catch scores `max(0, round(10 × (1 − distance / 0.12)))`. Ten catches or thirty seconds end the round. Catches must be at least 350 ms apart, and the light speeds up a little each time.

**Memory meadow:** turn over twelve shuffled cards to find six pairs. A mismatch stays visible for 1.5 seconds before hiding; each revealed card is also named in the status text. Finding all six scores `max(0, 100 − 2 × (turns − 6))`. There is no timer by default. The optional timed challenge lasts up to 75 seconds. If its timer runs out, each matched pair gives ten points, up to 50 on an unfinished board.

Each finished round gives 3 Happiness, 5 XP and `floor(score × 0.4)` pebbles. Scores are whole numbers from 0 to 100. You can earn up to 40 pebbles per round and 120 across both games each UTC day. After that, finished rounds still count and give Happiness and XP.

Changing place or game, opening Save, choosing another friend in a different tab, starting a match elsewhere or restoring another world ends an unfinished round. A finished round uses the latest saved world before paying its reward. A round from a replaced world can’t pay into the new one. Other tabs can save while a game is moving.

## Arena progression

| Rival | Required level | HP | Base attack | First victory | Victory XP |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ashgrub | 1 | 30 | 7 | 25 pebbles | 20 |
| Stonebeak | 3 | 48 | 10 | 40 pebbles | 30 |
| Frostwisp | 5 | 70 | 13 | 60 pebbles | 45 |

Win against the previous rival before trying the next. Entry uses 10 Energy. Your friend starts with `36 + level × 4` HP and `8 + level × 2` attack, plus the leaf cap bonus. Guard does `2 + floor(level / 2)` damage and halves the rival’s hit, rounded up. A potion restores HP and uses a turn. The rival’s attack adds a repeating 0, 1, 2 bonus, then the scarf blocks 2 damage. At least one damage gets through.

A first win records the win, gives the rival’s pebbles and XP, and adds 8 Happiness together. Later wins give 5 XP and no pebbles. Losing removes 5 Happiness and gives no reward. Matches end after 40 turns. The save keeps HP, friend, outfit effects, turn, result and recent messages, so reloading resumes the same match. A finished match can’t pay again.

During a match, keep the same friend, outfit and Lodge membership. Finish before adopting, caring, playing mini-games, using a deed or collecting an XP reward. Shops, savings and gifts without XP stay available. These are single-player matches; there’s no PvP or online challenger.

## The little trails

Whisperwood opens at zero bond, Glowpool at 2 and Windridge at 4 for each friend. Starting an outing uses 6 Energy and 2 Fullness, and needs at least 10 Energy and 2 Fullness. Make all three choices to finish. Early choices give no reward; finishing gives up to 12 XP, 10 Happiness and 1 bond. Choose a personality-favourite approach at least once for 2 bond instead. Outings don’t change pebbles, supplies, daily quest counts or game limits. At 3 bond, the friend’s knack adds a third choice. Completed outings cycle three stories. The final choice and story select one of that route’s three treasures.

`pet.trail` saves completed `trips` and `bond`. `trails` keeps a sequence number, up to nine different finds, three display spots, one unfinished outing and one last result. Moving or putting away a find keeps it yours and gives no extra reward. There are no trail timers, resets, cooldowns or missed-day penalties. [The little trails](little-trails.md) explains the choices and costs for players.

An unfinished outing saves its friend, route, story, run ID, expected step and choices. Each answer must match that run and step, so duplicate clicks can’t skip a scene or pay twice. Heading home early keeps the starting cost and earns nothing. Finish or leave before switching friends, adopting or starting a match. Care, shopping, practice, blooming, games and gifts stay available. A queued choice is refused if its friend, world or trail view changed, or a dialog opened. A display change is refused if another tab moved the treasures. Resource or counter limits are checked before a cost is taken.

## Companion stories and expeditions

Care and exploration teach three bounded tendencies: curiosity (ribbon play), kindness (feeding and resting), and courage (practice). Completed guided trails add two to the final choice’s tendency; expedition intentions add three. Each tendency stops at 100 and never decays. Existing individual care records initialise the corresponding tendencies when an older world opens. The original chosen personality, species, art and growth remain intact.

A world can have one asynchronous expedition underway. Start with a recognised route and one of `notice`, `help` or `brave`. Finish a current guided trail or arena match before departing. Departure is free and does not lock care, other friends or play. All three routes are open. The first expedition in the world takes 30 seconds; subsequent Whisperwood, Glowpool and Windridge expeditions take 2, 5 and 10 minutes respectively.

Returns have no expiry. Claiming checks the saved return time and run ID, awards the departing friend once, adds three to the chosen tendency, and records a deterministic story and a route keepsake. Stories combine destination, intention, one of three variations, species and shared care (or original personality). Expeditions award no currency, XP or competitive advantage. Repeated keepsakes remain a single collection entry. Both expedition and guided-trail finds can be shown in the three meadow display spots.

Each friend retains the latest three structured expedition memories plus lifetime completed trips and learned tendencies. Earlier narrative pages roll off as new ones arrive; collected treasures and earned traits remain. Keep a favourite biography as an offline HTML keepsake, or download their current SVG portrait. Neither replaces the JSON world backup.

## Save migration, coordination and recovery

The browser still uses `petrealm.save.v1` and `petrealm.backup.v1` to find installed worlds. Their JSON save version is 3, with a strictly validated optional `companionship.version: 1` extension. Older v3 files receive that extension on opening; earlier app releases cannot read the expanded saves. Keep a save copy before downgrading the app. Accepted version 1 and 2 files are upgraded before play. `petrealm.world-generation.v1` changes when a world is replaced, not after ordinary actions.

Version 1 files are checked against their original schema before upgrading. Their companion becomes `pet-1`, keeping stats, pebbles, supplies, gifts, care counts and achievements. New systems start empty. Before an automatic overwrite, the current v1 text is kept at `petrealm.migration-original.v1` and can be downloaded from Save. Ordinary backup swaps leave it there, though a different v1 upgrade can replace that v1 original. If the original can’t be kept, the saved world stays unchanged and the unsaved upgrade can be downloaded.

Some older version 2 files have no bank details or quest log. They start with Seedling saver and empty interest and seven-day counts. A collected same-day meal quest stays collected, and its feed progress stays saved. Other new task counts start at zero. Existing pebbles, friends, progress and lasting gifts stay unchanged. Partial records, unknown tiers, duplicate or unearned gifts, future claim dates and inconsistent counts are refused.

Older version 2 files may also lack `personality` and `journey`. These are accepted together or added together: Steady and zero individual care, practice and bloom records. Existing personalities and care records stay intact. The new counters are whole numbers within their limits, and `growth` is zero or one. Partial or inconsistent records are refused. Practice and Bloom check that the friend and world still match what you chose before a queued action runs. A changed target refreshes the screen without charging. Actions for the same friend still use the newest saved balances.

Version 3 needs complete trail records. Older files gain zero trips and bond and an empty journal without changing their older fields. Before an automatic v2 overwrite, its exact text is kept at `petrealm.migration-original.v2` and read back to check it. The first v2 original stays protected; the v1 original is separate. Older 0.5 apps refuse version 3 saves.

If an earlier v2 original is already kept, a different v2 world won’t overwrite it or the current save. The new progress stays in memory and can be downloaded. Save offers this world’s original and the earlier one separately. After downloading and checking the file, **I’ve kept the original · finish upgrade** checks the same saved text and world before saving the new v3 progress. The earlier original and backup stay intact. If the world changed, the action is refused. If saving fails, the pending original and saved bytes stay intact. This doesn’t create an ever-growing archive.

Save files can be up to 32 KiB. Larger populated worlds use compact JSON when indentation would exceed the limit. Checks refuse missing or extra fields, unsupported versions, duplicate keys, too much nesting, invalid numbers or dates, mismatched IDs or levels, too many worn copies, invalid balances or gifts, impossible match results and repeated reward records. Failed imports leave the world unchanged. Restoring first keeps the newest world as a backup, including unsaved progress when appropriate. If a write fails, backup and world-marker changes are rolled back. A broken original remains available to download, replace with another save or leave for a fresh world. Broken backup text can also be downloaded without restoring it.

Every save action uses the same browser lock, or an IndexedDB transaction when Web Locks aren’t available, and reads the latest stored world before writing. This includes care, games, quests, matches, upgrades, timers and replacements. Storage events also read current data rather than applying an old event. If saving fails, changes stay in memory while the saved world is unchanged. If another tab then saves a different world, further changes are blocked until you download or reload; the unsaved world remains downloadable. There’s no cloud sync or server clock.