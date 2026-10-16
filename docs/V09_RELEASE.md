# v0.9 — Scenic trails and sword encounters

11 October 2026 (Malaysia). This update expands the adventure layer while retaining the existing curriculum, mission codes and local learning records.

- Five region treatments add waterfall ruins, canyon banners, windmills, a moonlit crystal lake and a lantern market. Each route names three stretches of its trail. Region cards preview the scenery and resident creatures.
- Moss slimes leap towards the explorer. Amber beetles signal a charge, commit to its direction, then recover. Lake wisps hover and aim glowing projectiles. Each region mixes these with the existing hopper and spore creatures.
- Hold **J**, the canvas, or **Strike** for a three-part sword combo. The third hit is a longer power thrust with two extra damage. Waiting more than 1.1 seconds between attacks resets the chain. Axe harvesting retains its original yields.
- **K / Shift** or the touch **Dash** button gives a brief invulnerable dodge with a 1.15-second recharge. Dashing respects locked boundaries and cannot cancel an active attack or hurt animation.
- A sword's impact disperses projectiles within its forward range. Damage numbers, sword trails, monster names and attack warnings make encounters readable. Reduced-motion preferences suppress decorative animation and dash afterimages.
- Stable enemy slots and matching health totals retain old saves, including defeated enemies. Combat does not award mathematics XP or bypass Guardian checks. Dialogs pause combat and its timers.

## Verification

`npm test`: 84 passing tests (75 existing, 9 new combat tests). `npm run build` creates the static deployment directory. Browser checks cover scene selection, a successful probability answer, keyboard sword combos, dash controls, save reload and English/BM mobile layouts. These checks do not replace a physical-device or classroom pilot.
