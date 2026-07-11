# Stage 7 Implementation Plan — Teacher dashboard

## Objectives

1. Class roster viewing (Stage 3 already has class creation + student registration; this stage adds listing/viewing).
2. Assignment creation and per-student completion tracking.
3. Review of flagged grammar mistakes across a class.
4. Local report generation (CSV + PDF export — no external service, matching the offline-first constraint).

## Scope decisions

- **Assignments are scenario-based practice targets, not a full homework/grading system.** An assignment is "practice a `daily` conversation before <date>," not an essay/quiz submission-and-grading pipeline (that's the newer requirements doc's much larger "Homework" section — Quiz Generator and graded submissions are explicitly out of scope here and tracked in the backlog in `docs/03-roadmap.md`). Completion is inferred from whether the student has started a conversation with the assignment's scenario after the assignment was created — a v1 heuristic, not a submission record, consistent with how Stage 4's difficulty heuristic and Stage 6's recommendation heuristic are both scoped.
- **Reports are CSV + PDF, generated on request, not scheduled/emailed.** CSV needs no new dependency (hand-rolled, trivial format). PDF uses `pdfkit` (pure JS, no native bindings, bundles its own fonts) — a legitimate small addition, not a heavy new subsystem.
- **Mistake review reads existing `grammar_mistakes` data** (Stage 5) joined across a class's students — no new mistake-tracking schema needed.

## Database schema addition

- `assignments`: id, class_id, teacher_id, title, description, scenario, due_date, created_at.

## Backend routes (all `requireRole("teacher")`, ownership-checked against the class)

- `GET /teacher/classes` — the calling teacher's classes.
- `GET /teacher/classes/:id` — class detail + roster (students registered via `class_students`).
- `POST /teacher/classes/:id/assignments` — body `{ title, description, scenario, dueDate }`.
- `GET /teacher/classes/:id/assignments` — assignments with per-student completion (`{ studentId, completed }[]`) computed via the heuristic above.
- `GET /teacher/classes/:id/mistakes` — recent `grammar_mistakes` rows for the class's students, joined with student name and the rule involved, most recent first.
- `GET /teacher/classes/:id/report.csv` — one row per student: display name, email, conversation count, grammar mistake count, vocabulary notebook size, estimated CEFR level (reusing the Stage 4 heuristic).
- `GET /teacher/classes/:id/report.pdf` — the same data as a simple formatted PDF page (table), for a teacher who wants something printable rather than a spreadsheet.

## Desktop UI

The existing desktop app is built around the student conversation-practice flow. Stage 7 adds a **separate Teacher Dashboard view**, shown instead of the student chat UI when the logged-in user's role is `teacher`:

- Class list (existing classes + a "create class" form, finally giving the Stage 3 `POST /teacher/classes` backend route a UI).
- Selecting a class shows: roster (with an "add student" form, using the existing Stage 3 registration route), assignments (list + create form with completion checkmarks per student), a mistake-review feed, and "Download CSV report" / "Download PDF report" buttons.
- Admin and student roles are unaffected — an admin still has no dedicated UI yet (Stage 12), and a student still sees the Stage 4–6 conversation/vocabulary UI.

## Testing procedure

1. Backend unit tests: roster listing, assignment creation + completion heuristic (a student who started a matching-scenario conversation after the assignment vs. one who didn't), mistake-review ownership (a teacher can't see another teacher's class), CSV report content shape.
2. Manual end-to-end: as a teacher, create a class, register a student, create an assignment, have the student (via a second login) start a conversation with a grammar mistake in the assigned scenario, confirm the assignment shows completed and the mistake appears in the review feed, download both report formats and inspect them.

## Documentation update

This file, `CHANGELOG.md`/`README.md` current-stage pointer.

## Git commit information

- Commit message: `Stage 07: Teacher dashboard completed`
- Tag: `v0.7.0`

## Explicitly deferred to later stages

- Full homework submission/grading and the Quiz Generator (backlog item from the newer requirements doc — a genuinely separate subsystem).
- Class-ranking/progress-chart visualizations beyond the CSV/PDF report — Stage 8 (Student analytics) is where richer aggregate views belong.
- Admin-facing class/teacher oversight UI — Stage 12.
