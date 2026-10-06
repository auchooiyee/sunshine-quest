# v0.8 — Foundation, Standard and Challenge missions

6 October 2026 (Malaysia). This continues the learning-content work from v0.7. It is a prototype content release; teacher mathematics/BM review and physical-device classroom pilots remain necessary before v1.0.

## Start a mission

Open **Teacher mode → Task group**. Anyone using the guest game can use this selector; no teacher account is required.

- **Foundation:** three checks, Original or B. Simpler representations, fewer constraints or fixed choices reduce the demands of the task itself.
- **Standard:** existing adventures, Original/B/C, three or six checks. Existing codes and saves keep this behavior.
- **Challenge:** three checks, Original or B. The main answer must satisfy an additional comparison or decision condition, and an extra calculation must also be correct.

All groups allow hints and optional Guided practice. Hint use remains separate from the task group. Short group missions earn 250 XP, keep separate class saves and do not unlock the formal finale or expedition keepsakes. The five-step finale remains its existing Standard mission.

Choose a group, region and set, inspect the teacher answer preview, then generate a six-digit code or lesson link. The six-digit code now includes the group. Lesson links additionally identify a particular lesson and retain the optional due label.

## Structural differences

| Region | Foundation | Challenge |
| --- | --- | --- |
| Quadratics | Read roots from factors, read vertex form, complete a supplied height relation | Distinguish roots from span; calculate off-centre clearance; check quarter-span height after designing an arch |
| Inequalities | One boundary, then two restrictions | Compare three surveyed routes, apply every boundary, choose the cheapest permitted option and calculate its cost; an excluded boundary can rule out the cheapest candidate |
| Motion | Single moving section, one area, fixed first-stage duration | Compare moving/average speed including rests, combine area with whole-journey average, meet distance and delivery-fee constraints |
| Probability | Conditional next-draw probability only, with/without replacement | Compare combined probabilities under replacement changes; use the designed bag to calculate a different event |
| Finance | One expense, an exact-month goal, fixed supply quantities | Justify full-month rounding by a shortfall, choose a sufficient spending cut, maximise savings after stated essentials |

These are authored differences within selected Form 4 topics, not declarations of full chapter coverage or SPM difficulty equivalence. Route comparisons are among three listed candidates, not a claim to teach the complete Additional Mathematics linear-programming syllabus. Financial examples use fictional amounts and no current tax/insurance rules.

The new batch contains **60 bilingual task versions**: five regions × two groups × two sets × three tasks. Together with 90 existing Standard chapter versions and five finale checks, the total is **155**. A second numerical set is practice on the same objective, not another objective. All new rows are listed as Pending in [CONTENT_REVIEW_REGISTER.md](CONTENT_REVIEW_REGISTER.md).

## Evidence, feedback and compatibility

- Missing extra fields are incomplete input and do not count as a valid attempt. A submitted wrong check or unmet decision condition counts as a wrong attempt and awards no completion/XP.
- World constructions are derived only after all parts validate. Hints and correct checking calculations remain in saved drafts and reports.
- Supported answers lead to a separate review check in the same group, using its other set. Review does not change original evidence or earn extra XP.
- Group identity is encoded in `question_set` (`foundation-v1`, `foundation-b-v1`, `challenge-v1`, `challenge-b-v1`) and the mission code. CSV schema 2 remains supported; class-summary cards display the group. JSON, archives and lesson links retain the same identity.
- The original 248 configuration codes keep their meanings. A reserved new range adds 160 configurations, all six digits with the existing checksum. Unsupported task counts, sets and finale/group combinations are rejected.
- Standard data and its three sets remain intact. The save schema/content version remains 2/5; group information lives in the validated assignment and versioned question-set identity.
- Authored skill tags, difficulty rationale and candidate misconception tags accompany the new tasks. Candidate tags describe review targets; they are not automatic diagnoses of students.

## Verification and next gate

The automated release checks cover every new example against independent calculations, correct-main/wrong-evidence failures, cost/fee/savings constraints, code round trips, separate group recovery, reviews, histories, exports and teacher summaries. Browser coverage solves all 60 versions through visible controls and includes BM phone emulation. The existing adventure regression suite is retained.

Teacher sign-off and real Android/iOS testing have not been performed by these automated checks. Next: use [PILOT_QUICK_START.md](PILOT_QUICK_START.md) for a small classroom pilot, record curriculum standards and maths/BM review, then fix observed issues before declaring v1.0. New finale-review scenarios, Form 5 and Additional Mathematics remain later content work.
