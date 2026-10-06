# MathWithCYE · Sunshine Math Quest

A playable Form 4 Mathematics adventure built on the original Sunshine Forest Canvas game. Version 0.8 adds Foundation and Challenge missions across all five regions, with 60 new bilingual task versions and extra reasoning checks. Run history, review checks, lesson links and class CSV summaries remain available. English/BM, six-digit classroom codes, three question sets per chapter, local saves and CSV reports are supported.

## Run locally

Requires Node.js 20 or newer. No npm install or Python is required for the game.

```powershell
npm start
```

Run this command from the repository directory. Open http://127.0.0.1:4173 in a browser. Use HTTP rather than opening index.html as a file. The server binds only to your computer. If the port is occupied, set `PORT` to a free port.

## Deploy

Student link: [Play Sunshine Math Quest](https://sunshine-quest.pages.dev/?view=regions). Cloudflare Pages is configured for this repository's `main` branch. Automatic updates still need GitHub installation access checked and a successful push-triggered build verified; see [DEPLOYMENT.md](DEPLOYMENT.md).

This repository is prepared for Cloudflare Pages. Run `npm run build` to create the public `dist` directory. Use `npm run build` as the Pages build command and `dist` as the output directory. See [DEPLOYMENT.md](DEPLOYMENT.md) for Git integration and update instructions.

## Play

**How to play** opens a skippable three-step practice guide: move an explorer, build an example bridge and learn how hints/saving work. Its practice answers never change expedition XP or learning evidence. Reopen it from the header whenever no other dialog is open. The region map has direct Continue/Begin and Join teacher mission actions.

If lessons or artwork fail to load, use **Try loading again** after checking the connection. Requests have deadlines and successful resources are reused on retry. Existing saves are not written during incomplete loading. An unreadable save is protected until you explicitly confirm **Use this new save**; **Download original save** preserves the raw file first. While protection is active, new play remains in memory and can be exported from the journal.

For classroom trials, use [PILOT_QUICK_START.md](docs/PILOT_QUICK_START.md), which includes a lesson flow, observation sheet and real-device checklist. [CONTENT_REVIEW_REGISTER.md](docs/CONTENT_REVIEW_REGISTER.md) lists all 155 authored task versions for review. The guide example also needs teacher review.

- A/D or arrows: move. Space, W or up: jump.
- J or left click: collect materials / defend against ordinary mushrooms.
- 1/2: choose Solver / Collector. E: open the nearby math station.
- Touch controls are available on phones and tablets.
- Choose a region opens the five chapter routes and final mission; each keeps its own progress.
- Adventure assistance reduces action damage and travels to the current unlocked checkpoint. It does not solve mathematics.

| Route | Form 4 chapter | Mathematical action | World effect |
|---|---|---|---|
| Quadratic Forest | 1 | Roots, vertex, constrained arch design | Visible bridge with collision surfaces |
| Inequality Canyon | 6 | Feasible integer coordinates; strict boundaries | Route marker and landing platform follow your coordinates |
| Motion Highway | 7 | Gradients, areas, two-stage speed plans | A moving, rideable cart follows your plan |
| Probability Lake | 9 | Replacement, conditional branches, combined events | Red/blue crystal configuration follows the chosen bag |
| Finance Camp | 10 | Savings goals, monthly balance, constrained budgets | Supply crates, lights and savings reflect your budget |

Each route has three stations and three Guardian checks, worth 450 XP. Route, delivery and budget tasks accept multiple valid plans. Melee attacks cannot bypass the Guardian's mathematics. Motion previews run without advancing the adventure simulation.

All dialogs pause movement, enemies and adventure time. Incorrect mathematics does not cost hearts. Three hints are available from the start. Optional tools use collected materials.

## Sunshine Supply Run

The final expedition connects five decisions: build an 8 m bridge, choose a feasible route, program the cart, calculate signal probabilities, and purchase camp supplies. Valid earlier answers set later models and prompts. Route coordinates determine distance, fees and token counts; the chosen exact speed plan determines the delivery fee. All charges are deducted from the RM360 starting budget before the camp purchase.

For example, route `(2, 2)` requires 32 m of travel and issues 2 red and 2 blue tokens. A plan of 4 s at 5 m/s followed by 6 s at 2 m/s leaves RM217 for camp. Different valid plans can leave different budgets. The supply manifest records charges, supplies, protected savings and unallocated money. Completed world objects remain visible together.

Complete all six checks in each of the five chapter routes to unlock the formal final expedition, worth a separate 500 XP. To try it immediately, choose **Try as a practice mission** on its region card. Practice uses an isolated local class save and does not unlock or overwrite formal progress. Teacher mode can also create its five-stage mission.

## Question sets and replay

Each Standard chapter has its original six tasks and two additional six-task sets: Practice B and Practice C. This adds 60 bilingual task versions, giving 90 chapter task versions and five connected finale stages. These finite authored sets change mathematical data, diagrams, hints and example answers together. They cover the same selected learning goals; they do not add full-chapter coverage.

In the Learning journal, **Try another question set** cycles Original → B → C → Original after confirmation. It archives the current run before starting the next set. Up to 20 earlier runs are retained, including attempts, hints and review checks. When full, export and explicitly clear earlier runs before replaying. Other routes keep their progress. **Restart** resets the current route while retaining its selected set. Completion and XP are based only on the current run. A restarted prerequisite must be completed again to enter the formal finale.

Question-set identity is saved with drafts, hints and attempts. Refreshing, switching language or exporting/importing JSON retains the same mathematics. Old saves keep the original tasks. Class missions use the teacher's chosen set; students cannot cycle it from the journal. The connected finale retains its existing scenario and answer-dependent questions.

## Teacher mode

**Task group** selects Foundation, Standard or Challenge. Foundation uses simpler representations or fewer decisions; Challenge combines a main answer with a comparison, an extra condition or a checking calculation. Both new groups have three checks, Original/B sets and separate local mission saves. Standard retains the existing Original/B/C three- or six-check adventures. Hints are available in every group, and Guided is a separate support setting. All new content is marked teacher-review pending. See [the group comparison](docs/V08_RELEASE.md).

Select a chapter, its question set, and three stations or all six checks; or choose the final expedition with all five connected decisions. Choose independent or guided practice, adventure assistance, and the starting language. Expand the answer preview to inspect tasks and one example solution. For the finale, the example follows a complete connected plan; students' different choices change later questions. Generate a six-digit task code and mission link; students can paste either into the region map's Join mission form.

Guided missions automatically show the first hint and therefore do not count as independent first answers. Three-station missions finish before the Guardian. Codes configure local practice and remain six digits. A code-only mission resumes the shared configuration save. Each generated lesson link additionally carries a separate lesson ID and optional due-date label; use that link for the whole class to distinguish lessons with identical settings. These links do not create online rooms, logins or automatic result collection. Restart from the learning journal for a fresh practice run.

Students must first open their own copy of the game. A localhost link works only on that computer; a publicly usable link requires a hosted copy. The current local server does not provide cross-device classroom hosting. The task code is portable between accessible copies of this version.

## Review and class reports

The journal offers a separate different-number check after a completed answer used hints or retries. It uses the next authored question set for the same objective. Results persist without changing the original answer, adventure XP or gates. These finite sets may have been seen previously; they are not new learning objectives. Finale review is not yet included.

Teachers can import multiple student CSVs from Teacher mode. Students must supply a learner code before exporting. The summary retains the newest snapshot per learner/lesson/run/task, separates review checks, lists submitted learners, and optionally compares a roster within the selected lesson scope. Task cards show runs, started/completed tasks, independent first answers, hint use and runs with misses, sorted by misses. Export the summary before closing the page; imported reports are held in memory only.

CSV version 2 includes current and archived runs, review checks, run IDs, lesson identities, due labels and skill tags. Version 1 imports remain supported, with a warning that separate historical runs cannot be reconstructed. Local files are editable student-submitted evidence.

## Evidence and saves

The journal separates adventure XP from independent first answers and completion with support or retries. There are 155 authored task versions across Standard, Foundation, Challenge and the finale, covering selected parts of five chapters. They do not certify full-chapter mastery, PBD levels or SPM performance.

Expeditions use the existing `mathwithcye-sunshine-quest-v1` storage key. Previous saves migrate in place to schema 2 / content 5, preserving valid completed mathematics, drafts, hints and materials. Each region has separate math and adventure state. New classroom codes contain exactly six digits, including a checksum to reject typing errors. Every supported combination of chapter, task group, question set, length, support, assistance and language has one code; choosing the same settings gives the same code. Existing long codes and mission links still work and use the same classroom save as their short equivalent. Different configurations retain separate saves. Finale restoration validates each completed step against the restored earlier answers, so inconsistent downstream answers do not unlock later stages. Unknown question-set identifiers cannot restore completed evidence under another set.

Export all visited regions or the current class mission as JSON. M1, M2 and current progress exports can be imported after confirmation. Import targets the appropriate expedition or class save. Restarting a region or the finale leaves the other regions intact. No account or automatic upload is involved.

If storage is blocked or full, the current session remains playable, including region switching, and the page reports that saving is unavailable. Export to keep a copy. Clearing browser data removes local saves; localStorage does not provide offline hosting.

The Learning journal's **Export learning CSV** exports one row per task in each retained current or archived run, plus any started review checks. It covers visited expedition routes, or only the configured class mission. It includes set identity, completion status, attempts, hints, independent first-answer evidence, XP, answer drafts and UTC timestamps. An optional player-entered learner code helps teachers identify files. CSV is a local learning report; JSON remains the restore format. See `docs/LEARNING_CSV_GUIDE.md` for columns and interpretation.

## Verification

```powershell
npm test
```

75 tests cover the 16 upstream engine regressions, M1/M2/finale progression, all 60 additional task versions, multiple valid answers, storage and set restoration, mission-code validation/isolation, report evidence, CSV quoting, and applied cart/platform behavior.

For browser checks, keep the server running and provide Playwright plus installed Chrome. Set `PLAYWRIGHT_PACKAGE` to the installed package directory if it is not locally resolvable:

```powershell
npm run test:browser
```

`tests/browser-smoke.mjs` has 10 baseline flow groups; `browser-expedition.mjs` has 12; `browser-finale.mjs` has 10. `browser-practice.mjs` adds 8 groups covering set replay, all 60 additional task versions, teacher-set selection, JSON recovery, CSV evidence/scope and phone reports. `browser-pilot.mjs` adds 7 groups for the isolated tutorial, direct Continue/Join, loading retries, protected damaged saves and phone layouts. `browser-codes.mjs` covers 4 short-code and compatibility groups; `browser-adventures.mjs` adds 6 region, construction and restoration groups. These 57 groups form the regression baseline. `browser-learning.mjs` adds six groups for review persistence, archive/export recovery, CSV aggregation, lesson identity and phone layouts. `browser-levels.mjs` adds eight groups covering all 60 new task versions, teacher settings, extra-answer grading, group-specific review/export and BM phones. Reports and screenshots are saved under Git-ignored `artifacts/`.

Six-digit code verification: all 408 supported configurations (248 original and 160 new) round-trip without collisions; single-digit errors and adjacent digit swaps are rejected. `tests/browser-codes.mjs` covers teacher copying, phone entry and legacy-link save continuity.

Content and BM wording await teacher review. Chrome desktop and mobile emulation are verified; real Android/iOS and classroom observations remain pending. See `docs/TEACHER_REVIEW_GUIDE.md`.

See [v0.8 release notes](docs/V08_RELEASE.md) for task groups, [v0.7 notes](docs/V07_RELEASE.md) for learning tools; [v0.6 notes](docs/V06_RELEASE.md) document the adventure regions.

## Source structure

- `engine.js`, `balance.js`: original simulation and balance; optional math mode adds route gates, a bridge, moving cart/platforms and Guardian protection.
- `src/forest-renderer.js`: original forest rendering plus stations, barriers and answer-driven objects.
- `app.js`, `index.html`, `quest.css`: interaction, local mission setup and modal lifecycle.
- `config/adventures.js`: route geometry, environmental palettes and bilingual guide/Guardian identity.
- `src/missions/constructions.js`, `src/ui/region-scenery.js`: validated world constructions, exact summaries and Canvas scenery.
- `config/worlds.js`, `config/finale.js`: chapter-route catalog and bilingual region/finale narrative.
- `data/mathematics/f4/`: `bab01`, `bab06`, `bab07`, `bab09`, `bab10`, `finale` JSON tasks.
- `scripts/curriculum-templates.mjs`: shared authored templates for the four applied chapters.
- `scripts/build-curriculum.mjs`: rebuilds those four base banks and all five chapters' B/C sets.
- `scripts/build-variants.mjs`: authored finite set parameters and quadratic variants; running it refreshes B/C sets in all five banks while retaining their base tasks. Update template/parameter sources alongside JSON edits. Rebuilding was checked to produce identical content.
- `scripts/build-finale.mjs`: authored final mission content; update it alongside `finale.json`. `src/missions/finale.js` resolves later questions and the manifest from validated earlier answers.
- `src/math/`: quadratic and applied mathematics validation.
- `src/math/variants.js`: stable question-set selection and restoration.
- `src/learning/report.js`: validated per-task report rows and UTF-8 CSV export.
- `src/ui/applied-graph.js`: inequality, motion, probability and budget models.
- `src/missions/`: ordered checks, application effects and versioned local assignments.
- `src/storage/save-store.js`: branded multi-region saves, migration and recovery.
- `locales/`: English/BM interface text.

Teacher review, real-device pilots, further learning targets, Form 5 and Additional Mathematics remain in the roadmap. Cloudflare deployment instructions are in DEPLOYMENT.md.

## Attribution and permissions

Adapted from [july-lyan/yoyo-sunshine-forest](https://github.com/july-lyan/yoyo-sunshine-forest), upstream commit `607dba8`. Original engine, balancing, animation data, forest rendering and included visual assets remain attributable to that project. Its original README is preserved as `UPSTREAM_README.md`.

The original repository has not selected a general open-source licence; its README invites personal learning/modification and does not grant general commercial rights. This adaptation does not grant new rights to upstream code or assets. Confirm required permissions before public or commercial distribution.

Curriculum scope references the KPM KSSM Mathematics Form 4–5 DSKP (2018), [publicly hosted original document](https://bukuteksdigital.my/wp-content/uploads/2020/06/DSKP-MATEMATIK-Tingkatan-4-DAN-Tingkatan-5-KSSM.pdf). Confirm the school's adopted version and specific learning standards during teacher review.

Authoring: `npm run build:levels` regenerates the Foundation/Challenge packs from `scripts/build-levels.mjs`. Runtime deployment uses the committed JSON files; the source generator is not published.
