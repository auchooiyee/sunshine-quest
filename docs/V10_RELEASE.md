# v0.10 — Gather materials, upgrade your weapons

16 October 2026 (Malaysia).

Swords and axes now have four levels: Wooden, Stone, Reinforced and Crystal. Open **Workshop** beside the equipment buttons to view the full progression, current materials, exact shortages and before/after statistics. Upgrade at base camp or the chapter workbench; inspect equipment anywhere. Upgrades equip the improved weapon automatically and save immediately.

| Upgrade | Sword cost (wood / stone) | Sword damage | Axe cost (wood / stone) | Hits per rock |
| --- | --- | --- | --- | --- |
| Lv.1 Wooden | Starting equipment | 2 | Starting equipment | 3 |
| Lv.2 Stone | 6 / 6 | 5 | 4 / 4 | 2 |
| Lv.3 Reinforced | 8 / 4 | 7 | 6 / 3 | 2 |
| Lv.4 Crystal | 10 / 6 | 9 | 8 / 4 | 1 |

Costs are incremental. Each weapon must progress through every level separately. Attack intervals also improve: sword 0.55 → 0.50 → 0.44 → 0.38 seconds; axe 0.75 → 0.65 → 0.56 → 0.46 seconds. Stone and higher axes clear a wood pile in one hit. Reinforced and Crystal equipment gain gold/cyan effects. Mathematics XP and Guardian validation remain separate from combat damage.

Three additional stone deposits appear along chapter adventures. Collecting all seven wood piles, five deposits and both platform stone rewards yields 56 wood and 36 stone: enough for both weapon tracks and both shields (56 wood / 35 stone). Nodes pay only once. Existing mined deposits retain their state; new deposits are added to older saves. The original non-mathematics forest retains its original two deposits.

Existing stone weapons restore as Lv.2. Higher levels use the existing upgrade flags in the version-2 world save; no storage-key migration is needed. Invalid flags or broken prerequisite chains cannot skip levels. Each region and class mission retains its own equipment and materials; restarting its run resets its adventure equipment as before.

## Verification

- `npm test`: 92 passing tests, including eight equipment tests for order, exact costs, duplicate prevention, insufficient materials, workbench location, actual damage and harvesting, paused-swing consistency, save/restart/migration and the complete gathering economy.
- `npm run build`: static deployment output builds successfully.
- Browser checks: existing saved materials used to upgrade a sword to Lv.2; physically mining an added deposit enabled Lv.3; axe upgraded independently to Lv.2. Material totals, disabled shortage buttons, save reload and narrow-screen English/BM layout were checked successfully.

The previous classroom content-review and real-device pilot requirements still apply.
