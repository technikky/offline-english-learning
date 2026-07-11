# Stage 8 Implementation Plan — Student analytics

## Objectives

Aggregate data already captured in Stages 3–7 (conversations, messages, grammar mistakes, vocabulary notebook) into a per-student analytics view, reused for both the student's own progress screen and a teacher's per-student drilldown — one aggregation service, two consumers, matching the roadmap's explicit "reusing the same analytics service" instruction.

## What's aggregated (and what's a documented estimate)

- **Total conversations / total messages** — exact counts, no estimation needed.
- **Practice frequency** — conversation count per day over the last 30 days, from `conversations.created_at`.
- **Estimated practice time** — for each conversation, the span between its first and last message timestamp, summed across all conversations. This is a proxy, not a tracked session duration (there's no explicit "session start/end" event anywhere in the system) — documented as an estimate, consistent with how the Stage 4 difficulty heuristic and Stage 7 assignment-completion heuristic are both openly approximate rather than silently treated as ground truth.
- **Grammar weaknesses** — mistake count grouped by `grammar_mistakes.category` (Stage 5's LanguageTool categories: Grammar, Miscellaneous, Punctuation, etc.), most-frequent first — directly answers the brief's "weak grammar topics."
- **Vocabulary growth** — cumulative count of `vocabulary_notebook` entries over time (one point per day an entry was added), giving a growth curve without needing new schema.
- **Estimated CEFR level** — reuses the Stage 4 `estimateDifficultyLevel` heuristic unchanged; analytics is a consumer of it, not a second implementation.

## Backend

- `src/analytics/aggregate.ts` — one function, `getStudentAnalytics(studentId)`, used by both routes below. No duplicate logic between the student-facing and teacher-facing endpoints.
- `GET /analytics/me` — any authenticated student, their own data.
- `GET /analytics/students/:id` — teacher-only; ownership-checked by confirming the student is in one of the teacher's classes (via `class_students`), not just "any student ID."

## Desktop UI

- **Student**: a "Progress" panel added to the existing sidebar (below the vocabulary notebook), showing estimated level, totals, a simple CSS-bar practice-frequency strip, and a grammar-weakness list — no charting library added; div-width bars are enough for this data shape and keep the dependency footprint at zero, consistent with the project's existing "no unnecessary complexity" bar (Stage 6 made the same call vendoring `sqlite-vec`).
- **Teacher**: clicking a roster row (previously inert) opens that student's analytics inline in the class detail view, reusing the same rendering code as the student's own panel via a shared render function.

## Testing procedure

1. Backend unit tests: aggregation correctness against seeded conversations/messages/mistakes/vocabulary (known counts in, known shape out), and ownership denial when a teacher requests a student not in any of their classes.
2. Manual end-to-end: as the Stage 7 student/teacher pair, generate a bit more activity (a conversation with a mistake, a notebook word), confirm `/analytics/me` reflects it, then confirm the teacher's drilldown for that same student shows identical numbers.

## Documentation update

This file, `CHANGELOG.md`/`README.md` current-stage pointer.

## Git commit information

- Commit message: `Stage 08: Student analytics completed`
- Tag: `v0.8.0`

## Explicitly deferred to later stages

- Class-wide ranking/comparison views (the brief's "Class ranking" under Teacher Dashboard) — this stage is per-student drilldown; a roster-wide comparison view is a natural Stage 12 (or dashboard-polish) follow-up once there's demand for it, not silently dropped.
- Historical trend charts beyond 30 days / richer visualization — deferred until real usage data exists to justify the added complexity.
