# Sunshine Math Quest: completion and enhancement plan

Planning date: 5 October 2026 (Malaysia). Baseline: v0.4.0, deployed on Cloudflare Pages. This is a proposed delivery plan, not a record of completed features.

Implementation update, 5 October 2026: v0.5 pilot features and v0.5.1 six-digit codes are delivered. v0.6 route, construction, Guardian, keepsake and ledger changes are documented in [V06_RELEASE.md](V06_RELEASE.md). Teacher content sign-off and real-device pilot observations remain pending. This roadmap retains its original planning estimates below.

## 1. Define what we are completing

**First finish v1.0: a polished, teacher-reviewed Form 4 adventure with five distinct regions and one connected finale.** Students should understand how to play, see mathematics change the world, recover from mistakes, replay without losing earlier evidence, and share useful results with their teacher.

**Then expand to a Form 4/5 Mathematics and Additional Mathematics platform.** A playable chapter and complete curriculum coverage are different milestones. Keep a published coverage matrix so the menu never implies that a short mission covers an entire chapter.

Retain HTML/CSS/JavaScript/Canvas and Cloudflare Pages. Add modules where new features need boundaries. A framework rewrite is not a prerequisite. Students keep a guest play option throughout the roadmap.

## 2. Verified starting point and gaps

| Area | Already delivered | Next gap to close |
| --- | --- | --- |
| Adventure | Movement, touch controls, assistance, five chapter routes, three-stage chapter Guardians, connected Supply Run | Region-specific layouts, clearer story, onboarding, richer consequences |
| Mathematics | 90 bilingual chapter task versions across original/B/C sets; five connected finale checks | Reviewed learning-standard mapping, broader skills, misconception feedback and fresh transfer tasks |
| Learning evidence | Independent first answers, hints, attempts, XP, local CSV and JSON export | Review queue and preserved run history; changing sets currently replaces the current route's evidence |
| Classroom | Configurable local mission codes/links and answer previews | Class result aggregation and distinct assignment instances |
| Reliability | Local saves, migrations, storage-error fallback; 49 unit tests and 40 browser groups passed at deployment | Real-device pilot, slow-network recovery and release checks |
| Hosting | GitHub repository and live Cloudflare Pages deployment | Push-triggered deployment has not been verified; check GitHub app access |
| Online services | None required for current play | Accounts, cross-device sync and online teacher results are a separate phase |

Do not count original/B/C number changes as three different learning objectives. Existing tests establish software behavior, not classroom learning outcomes. CSS already respects reduced motion; review Canvas effects separately.

Live site: https://sunshine-quest.pages.dev/?view=regions

Source: https://github.com/auchooiyee/sunshine-quest

Deployment setup and outstanding automatic-update check: [DEPLOYMENT.md](../DEPLOYMENT.md).

## 3. Release sequence

These estimates are planning ranges for one developer using existing assets, with a teacher available to review content. They exclude waiting for classroom feedback and account access. Re-estimate after the first sprint.

| Release | Deliverable | Estimated development effort | Exit condition |
| --- | --- | --- | --- |
| v0.5 | Classroom pilot readiness | 5–8 working days | A student can start, complete a short mission, recover a save and export a report on target devices |
| v0.6 | Distinct adventure regions | 8–12 working days | Each region has its own route, meaningful mathematical world effect and chapter-specific Guardian behavior |
| v0.7 | Learning and teacher tools | 7–10 working days | Practice retains earlier evidence; teacher can combine class CSVs and identify questions needing support |
| v1.0 | Reviewed classroom release | 3–5 working days plus pilot/review | Content sign-off, real-device acceptance, pilot fixes and verified production release |
| v1.1+ | Course expansion | Estimate by approved content batch | Every published objective has bilingual reviewed tasks and a validated interaction |
| Optional online phase | Workers + D1 classroom accounts | Scope after pilot | Secure class access, reliable sync, conflict handling and useful teacher results |

The first four releases total approximately 23–35 developer days, not a promised calendar deadline. Curriculum expansion and the online phase are additional work. Small useful improvements can ship before the whole release is complete.

## 4. v0.5 — Make classroom entry reliable

1. Add a short skippable onboarding mission: move, interact, try an answer, use a hint, see a world effect. Provide keyboard and touch wording, and make instructions reopenable.
2. Give the entry screen clear actions: Continue adventure, Choose a region and Join teacher mission. Preserve the selected language and assistance setting. Show only playable courses as launch options.
3. Replace a failed-load dead end with Retry and useful progress/error feedback. Load course content on demand as the catalog grows. A missing optional region must not unnecessarily prevent an available region from starting.
4. Make save status and export recovery understandable. Preserve the current behavior when storage is unavailable; do not silently discard a damaged save before offering recovery where feasible.
5. Review touch target spacing, mathematical input keyboards, modal scrolling, focus return, portrait/landscape resizing, graph labels and Canvas motion settings.
6. Check automatic deployment access. Until it is verified, use the documented manual Git-sourced deployment process.
7. Correct old documentation that says the game has not been hosted. Prepare a one-page teacher launch guide and a structured pilot observation sheet.

Acceptance: a first-time learner reaches the first mathematical action with at most one facilitator prompt during the pilot; retry after an interrupted load works; backgrounding/reloading does not lose the most recently confirmed answer; an assignment link opens the intended configuration on another device.

Device matrix: Windows Chrome/Edge, at least one real Android phone with Chrome, and at least one real iPhone/iPad with Safari. Check school Wi-Fi and a slow connection. Record actual devices and observed results; emulation does not fill these slots.

## 5. v0.6 — Make the five regions feel different

Use a shared story: restore the forest's transport, signals and supply network. Give each region a named objective and a short NPC briefing. Keep dialogue skippable and make essential information available in the mission journal.

| Region | Proposed environmental enhancement | Mathematical action | Guardian encounter |
| --- | --- | --- | --- |
| Quadratic Forest | Broken river crossing, variable arches and clearance markers | Place anchors, inspect a graph, build an arch under constraints | Reconfigure an arch/trajectory for a new span and clearance |
| Inequality Canyon | Visible boundary zones, routes and movable platforms | Select coordinates satisfying every restriction | Find safe locations as a clearly stated constraint changes |
| Motion Highway | Delivery route, stops, destination markers and a synchronized graph | Predict and adjust a journey from gradients and areas | Meet distance/time conditions, then explain the resulting motion |
| Probability Lake | Signal crystals, bag contents and a visible branching diagram | Build a sample space or probability strategy | Compare two strategies and justify the correct probabilities |
| Finance Camp | Inventory, supply requirements, savings goal and visible purchases | Revise a feasible budget using explicit prices and constraints | Adapt the supply plan after a stated change in the scenario |

Each region should include a recognizable entrance, an exploration route, a mathematical construction, a Guardian encounter and a restored-state payoff. Add at most one optional side mission per region for this release. Use checkpoints to avoid repeating long travel after a mistake.

Guardian phases should reuse the region's interactive model. Preserve pause while reading or calculating, always-available hints, and action assistance. Do not use random outcomes to grade probability reasoning or mandatory response speed to grade mathematics.

Rewards: completion badges, visible camp restoration and a small cosmetic collection. Keep XP separate from learning evidence. Reward a new validated accomplishment once; repeated attempts must not inflate independent performance.

Finale enhancement: make earlier choices easier to inspect in the supply manifest and explain why the budget changes. Replaying a plan should make alternative valid strategies visible without presenting one example as the only correct answer.

Acceptance: every model change is reflected consistently in question text, graph, world object and saved state. Each region can be completed through displayed controls, including with assistance. Students in the pilot can explain what their mathematics changed in the world.

## 6. v0.7 — Improve feedback, replay and teacher evidence

6 October delivery: v0.7.0 implements bounded run archives, separate next-set review checks, conservative condition feedback, v2 CSVs, local multi-file class summaries, roster comparison and lesson-instance links while preserving six-digit configuration codes. See [V07_RELEASE.md](V07_RELEASE.md). Structurally different difficulty groups, broader reviewed skill/misconception metadata and new transfer/finale review content remain open; the roadmap below is not a claim that every item has shipped.

### Student learning

- Add skill tags and misconception codes to authored tasks. Give targeted feedback such as a boundary being excluded or a draw changing the denominator. Fall back to a general hint if the reason cannot be inferred reliably.
- Keep three hint levels: direction, intermediate step and worked support. Record support use independently from eventual completion.
- Add a Review mistakes queue. Follow a supported solution with a fresh task for the same objective; distinguish the fresh attempt from a retry of the original question.
- Start with teacher-selectable Foundation, Standard and Challenge task groups. Do not label simple numerical changes as increased difficulty. Challenge tasks should add reasoning, representation changes or connected decisions.
- Archive a completed run before starting a new set. Introduce run IDs and bounded local history, with export before pruning. Preserve old progress through a migration; do not manufacture historical attempts that were never saved.
- Report observable states such as Practising, Completed with support and Independently demonstrated. Any stronger mastery rule must state its evidence requirement and be reviewed by the teacher; badges and XP are not SPM grades.

### Teacher tools without requiring accounts

- Accept multiple game-generated CSV reports into a local class summary page. Parse the exact versioned schema, validate imported data, deduplicate by assignment/run/task, and render all imported text safely.
- Add an explicit assignment instance ID and optional due-date label. Two lessons with identical chapter settings must be distinguishable. Old configuration codes remain supported and are labeled as legacy where identity is missing.
- Show submitted learners, missing reports relative to an optional teacher-entered roster, task completion, hint use, first-answer evidence and commonly missed tasks. Without a roster, do not infer who is absent.
- Export a class summary. Clearly identify the current local CSV reports as student-submitted evidence, since local files are editable.
- Keep teacher previews and full worked solutions available for lesson preparation. A hidden teacher button is not an access-control system, and the client-side game remains unsuitable for secure high-stakes assessment.

Acceptance: replay never overwrites an earlier retained run; import/export round-trips maintain evidence; duplicate imports do not double-count; old saves and task links still load; a teacher can summarize a pilot class without manually opening every CSV.

## 7. Curriculum completion and expansion

Build a coverage register before promising chapter completion. For every learning objective record course, form, chapter, standard identifier, prerequisite, task IDs, interaction, difficulty rationale, English/BM review status and reviewer/date. Confirm the school's adopted curriculum documents and assessment requirements.

Reference baseline: KPM's [Mathematics Form 4–5 DSKP, 2018](https://bukuteksdigital.my/wp-content/uploads/2020/06/DSKP-MATEMATIK-Tingkatan-4-DAN-Tingkatan-5-KSSM.pdf). This is a KPM document hosted by a third party; it does not by itself verify all current school requirements. A school-maintained [Additional Mathematics curriculum document index](https://sites.google.com/moe-dl.edu.my/kurikulumsmksg/bidang-sains-matematik/panitia-matematik-tambahan/add-math-dskp-dan-rpt) is a retrieval starting point, not evidence that this game's future tasks have been aligned.

Proposed order, subject to that mapping:

1. **Deepen the current five Form 4 topics.** Fill identified learning-objective gaps and create fresh transfer tasks. Review existing original/B/C tasks before expanding their volume.
2. **Add Form 5 Mathematics starter regions.** Begin with Variation, Matrices and Transformations because they support visible parameter and coordinate interactions. Deliver one complete region at a time with a short classroom mission and chapter challenge.
3. **Complete remaining Mathematics coverage.** Add the remaining Form 4 and Form 5 objectives in teacher-priority batches. Candidate mechanics include number-base machines, logic circuits, set sorting, network routing, data exploration and explicit financial scenarios. Audit gaps within existing regions as well as missing chapter names.
4. **Add a separate Additional Mathematics route.** Begin with Functions and Quadratic Functions, then build Form 5 Differentiation/Integration interactions after the required prerequisites. Candidate mechanics include function composition machines, inverse mappings, tangent controls and accumulated-area models.
5. **Expand the remaining Add Maths topics and mixed revision.** SPM-style practice uses reviewed task designs and transparent marking logic. Publish a coverage checklist; do not claim exam equivalence from a game score.

For each learning objective, aim for an introductory interaction, independent practice and a fresh application in a changed context. Set question counts after the coverage audit. One engine may serve several objectives, while a new interaction requires code as well as question data.

Before adding multiple subjects, introduce a course catalog and namespaced progress identifiers: course/form/region/content-version/run. Legacy Form 4 IDs must migrate safely. Show Mathematics and Additional Mathematics as separate choices; neither should be locked behind completion of the other.

## 8. Optional Workers + D1 phase

Start when the teacher needs automatic collection or students need to continue across devices. If classroom feedback identifies this as the main obstacle, move this phase ahead of content expansion, after v1.0 reliability and the run/assignment model are stable.

- Keep static assets on Pages; route authenticated API calls through Workers and store class/assignment/progress records in D1.
- Use an established authentication approach selected for the school's account situation. D1 is the database, not an authentication service. A learner code alone must not grant access to private results.
- Define teacher/class membership and student-owned records on the server. Do not trust a teacher role, score or ownership claim sent by the browser.
- Sync completed answers and checkpoints, not every animation frame or the current 2.5-second local autosave. Use idempotent attempt IDs, a local retry queue and explicit sync status.
- Preserve conflicting runs separately; do not let a stale device silently overwrite newer work. Keep guest/local play useful during network failures.
- For online learning records, validate supported answers and progression on the server before accepting authoritative scores. Local imported history should retain its student-submitted label.
- Include class data export, bounded retention, backup/restore and account recovery appropriate to the pilot. Monitor real request/storage usage before estimating scale or cost.

Acceptance: a student resumes on a second device; retries do not duplicate XP or records; offline work syncs once; students cannot read another learner's records; a teacher sees only authorized classes; stale client versions fail safely.

## 9. Technical priorities and boundaries

Keep the existing simulation. Extract app responsibilities as a feature requires them: navigation/onboarding, challenge UI, history/review, teacher reports and later sync. Avoid a broad rewrite before shipping improvements.

Keep authored source templates, generated question JSON, graph models and validators consistent. Validate ranges, answer existence, accepted alternatives, units, rounding and translations. Prefer structured inputs before attempting general free-form algebra equivalence. Add Maths work must explicitly distinguish radians/degrees and exact/numerical answers where appropriate.

Add a simple CI check for tests and a static build. Preserve existing regression tests and add tests for new state transitions, history migrations, reporting identities and network recovery. Use screenshots for visible changes and actual devices for touch/browser acceptance.

PWA/offline installation follows evidence of a connectivity need. If added, cache a named content version, provide an update prompt and prevent a stale question bank from loading against an incompatible validator. Do not describe localStorage as offline hosting.

Defer real-time multiplayer, public leaderboards, free-form AI grading, a large equipment economy and a complete art replacement. Reassess after students can finish and explain the core missions reliably.

## 10. Pilot and v1.0 release gate

Recruit 5–10 students with varied confidence for a 10–15 minute assigned mission. The teacher records: time to first challenge, navigation interventions, mathematical misunderstandings, hint usefulness, device issues, completion and one short explanation of a world effect. Use pseudonymous learner codes for the pilot files.

Provisional usability target: at least 80% complete the assigned short route within 15 minutes with at most one navigation prompt. Treat this small sample as a usability signal, not proof of learning effectiveness. A fresh follow-up task checks whether the student can apply the idea beyond the remembered answer.

v1.0 is ready when:

- All published original/B/C/finale tasks have recorded mathematical and BM review.
- No known incorrect grading, progression blocker, save-loss bug or inaccessible required control remains.
- The target real-device matrix has recorded passes and fixes.
- A first-time student can complete the short route and the teacher can collect usable evidence.
- The five regions have distinct routes and visible mathematical consequences.
- Existing saves and classroom codes migrate or fail with a clear recovery path.
- Tests/build pass for the release commit; the production URL is checked after deployment.
- The coverage register states precisely what is taught and what remains planned.

## 11. First implementation sprint

| Order | Task | Concrete output |
| --- | --- | --- |
| 1 | Reconcile release/docs and automatic deployment access | Accurate status page and verified deployment process |
| 2 | Onboarding and return-to-game navigation | Skippable guide and reliable Continue/Join actions |
| 3 | Loading recovery and mobile interaction fixes | Retry flow; usable dialogs and controls on target layouts |
| 4 | Pilot and content-review materials | Teacher quick start, coverage register and observation sheet |
| 5 | Preview release and focused verification | v0.5 candidate, migration checks and device checklist |

Begin with this sprint. Develop the distinct-region designs while teacher review and device observations are collected. Incorporate that evidence before finalizing v0.6 scope.
