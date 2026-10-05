# v0.7 — Learning history and classroom reports

Release date: 6 October 2026 (Malaysia). This is the first delivery of the roadmap's learning-and-teacher-tools stage. It retains the existing 90 chapter task versions and five connected finale checks.

## Student journal

- Starting another set or restarting archives any existing answer, draft, hint and review evidence. Each route run has a stable ID; archives retain the learner code entered at the time of archiving. Map XP and restoration objects still reflect the current run.
- The browser retains up to 20 earlier runs. It refuses a further archive when full. **Export and clear earlier runs** requires explicit confirmation and initiates a full JSON backup download before clearing history. Keep the downloaded file; browser data can be cleared independently of the game.
- A completed answer with hints or retries enters **Revisit supported answers**. The separate check uses the next authored set for the same task. Drafts, attempts and hints resume after reload. Review checks do not change the original evidence, gates, rewards or world objects.
- Original/B/C are finite, different-number variants. A review question might have appeared in an earlier run; successful review is not a claim of unseen transfer or full chapter mastery. The connected finale has no review variant yet.
- Feedback identifies directly observable excluded boundaries, failed constraints, incorrect bag totals and overspending. Other answers retain general feedback and three hints. CSV skill tags derive from task kinds; a comprehensive authored misconception taxonomy is still pending.

## Teacher workflow

1. Choose the existing chapter, set, task count, assistance and language settings. Optionally enter a due-date or lesson label.
2. Generate the mission. **Six-digit codes remain six digits** and still encode settings. Every generated **lesson link** also contains a new lesson ID. Share the same link with the whole class to distinguish this lesson from another using identical settings. Code-only entry has no separate lesson identity. The label is descriptive; there is no deadline enforcement.
3. Ask students to enter pseudonymous learner codes in their journals, export their CSVs and send the files through the school's usual collection channel. No automatic upload or account system is added.
4. Open Teacher mode → **Class report summary** and import the files together. Choose a lesson/configuration filter. Optionally paste one roster code per line to identify missing reports within that scope.
5. Review task cards, sorted by runs with misses. Counts are task-run observations, not unique learners: runs, started, completed, independent first answers, used hints, and had at least one wrong attempt. Review checks are grouped separately from adventure runs.
6. Export the task summary before closing/reloading the page. Imported reports and the roster live only in page memory. Submitted-learner and missing-roster lists are shown on screen; the summary CSV exports task aggregates.

CSV v2 adds run IDs, current/archive/review labels, assignment instances, due labels, skill tags, review source-run IDs and migration flags. The importer accepts exact v1/v2 headers, validates field shapes and evidence consistency, and retains the newest exported snapshot for each learner/lesson/run/region/set/task. Imported text is rendered as text, and exported cells retain spreadsheet-formula protection. Invalid batches leave the previously imported reports intact. Limits: 1 MB per file, 20 files per batch, 20,000 retained rows.

Legacy v1 CSVs cannot identify distinct past runs, and code-only missions cannot identify separate lessons. These limitations are displayed when present. Student files remain editable practice evidence, not verified assessment results.

## Compatibility and verification

Save schema remains 2; content version advances to 5. Content versions 1–4 still load. Migrated runs are marked as migrated; their start timestamp is the migration time, not an invented historical start. Existing six-digit and original long configuration links retain their old local storage identity. Lesson links use separate keys and survive JSON export/import. Archived evidence and review records are included in both learning CSV and progress JSON exports.

Validation: 68 unit tests, including all 90 chapter task versions' review counterparts, history limits, migrations, CSV validation/deduplication, lesson identities and conservative feedback. Browser verification covers the existing 57 groups plus six new history/review/teacher-tool groups, including phone emulation. Real Android/iOS testing and teacher mathematics/BM sign-off remain pending.

## Remaining stage work

- Author and review actual Foundation, Standard and Challenge task groups with structural differences. Existing number variants are not relabeled as difficulty levels.
- Expand reviewed skill/misconception metadata and add fresh reasoning/representation tasks, including a connected finale review.
- Complete teacher content/BM review and classroom/real-device pilots before calling the game v1.0.
- Accounts, automatic collection, D1 sync, Form 5 and Additional Mathematics remain later phases.
