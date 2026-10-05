# v0.6 — Distinct adventure regions

Release date: 5 October 2026. Continues the five Form 4 routes and connected finale. The curriculum still contains 90 chapter task versions and five finale checks; this release expands their adventure presentation, not the curriculum coverage.

## Play the new regions

| Region | Route and environment | Mathematical construction | Guardian |
| --- | --- | --- | --- |
| Quadratic Forest | River crossing and arched decks | Anchors, clearance beacons and two separately scaled bridges | Archkeeper: new roots, signal point and final arch |
| Inequality Canyon | Terraces and survey platforms | Every validated point creates a platform; valid integer landing locations are shown | Boundary Sentinel: changed restrictions and excluded boundaries |
| Motion Highway | Delivery rail and station platforms | Reading displays and two independently driven carts, with synchronized time/distance displays | Transit Keeper: new journey and delivery conditions |
| Probability Lake | Lake, reeds and signal docks | Deterministic branch diagrams, exact probability fractions and chosen crystal counts | Signal Oracle: new bag contents and event |
| Finance Camp | Supply tents and storage terraces | Savings displays, purchased supplies, lamps and separate unspent/savings totals | Quartermaster: revised budget and supply requirements |

Open the named guide's briefing on the introduction screen, or read it again in the journal. **What you changed** below the game records each validated construction. After a successful answer, **See the change in the world** returns to the route; interact again to continue the next Guardian phase.

After a delivery plan is accepted, **Replay delivery carts** restarts the journeys without changing answers, attempts or XP. Cart motion pauses during mathematics and resumes from a saved time on reload or a region return. In an older save without a cart clock, the accepted plan is restored and its animation starts from the beginning.

Adventure rescue returns to the last restored checkpoint. Assistance still offers direct travel to the next station. No calculation requires a timed response, and probability success is never random.

## Restoration and finale

Completing six expedition checks adds the region's keepsake to the journal and displays a restoration decoration at its base camp. The collection reflects the currently retained expedition runs. Restarting a region or changing its set starts that region's restoration again; permanent run history remains scheduled for v0.7. Short teacher missions do not award expedition collection items.

The finale's expandable **Your choices and costs** ledger shows the actual span, route coordinates, delivery settings, issued tokens and supplies, with the calculations behind each charge. Several valid plans remain possible. The ledger preserves its expanded state while the game updates.

## Compatibility and verification

Verified locally: 59 unit tests and all 57 browser groups passed. The static build publishes 59 runtime files.

- Existing progress, six-digit codes, long legacy codes, imports and learning CSVs remain supported.
- Constructions and rewards rebuild from validated quest answers. World save flags cannot grant restored mathematical work.
- Region layouts keep stable resource/enemy/reward identifiers. Existing materials, equipment and collected platform rewards are retained.
- Save schema 2 / content 4 remains valid; optional cart animation records are additive and matched against the accepted plan.
- Five new unit-test groups cover every original/B/C construction, route gates, scaled bridge collisions, multiple carts, save clocks and checkpoint rescue.
- Six new browser groups cover all five regions through displayed controls, Guardian inspection, restoration collection, save recovery, and a BM phone mission with reduced motion.
- New briefing translations and teaching content still require teacher review. Chrome phone emulation does not replace actual Android/iOS classroom testing.

No optional side missions were added in this release. Teacher learning evidence/history improvements are the next v0.7 workstream.
