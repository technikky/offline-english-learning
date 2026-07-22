# Stage 27 Implementation Plan — Structured curriculum path

## Objective

Turn the eight practice modules from an **à-la-carte set of exercises** into an ordered **route from beginner to advanced**. Until now a student could open Grammar, Reading, Listening, etc. in any order with no sense of sequence, prerequisites, or "what next" — the single biggest structural gap between "a collection of good activities" and "a system that takes a beginner to advanced". This is the third and final "Tier 1" item from the platform gap analysis, and it consumes the Stage 26 placement level to decide where a learner starts.

## Design decision: a read-time overlay, not a new content system

The curriculum adds **ordering and progression on top of existing content** — it does not duplicate or replace it. Two consequences shape the whole design:

1. **Lessons reference existing content by id.** A lesson is `{ type, refId, title }` where `refId` is an existing grammar topic id, reading passage id, listening clip id, writing prompt id, conversation scenario, or quiz category. Nothing is copied.
2. **No new tables.** Completion is *derived at read time* from the per-module result tables (the same philosophy as the Stage 22 history view). Finishing an activity in its own module automatically ticks it off in the path — no double bookkeeping, no "mark complete" wiring in every module, and existing student progress counts retroactively.

### Course structure (`curriculum/course.ts`)

One curated course, `English: A1 to C1`, with five units — one per CEFR level — each sequencing that level's grammar, reading, listening, writing, conversation and quiz work:

| Unit | Level | Lessons |
|---|---|---|
| Everyday Basics | A1 | 7 |
| Getting Around | A2 | 7 |
| Expressing Yourself | B1 | 7 |
| Nuance & Argument | B2 | 7 |
| Mastery | C1 | 4 |

Curated/static for the same reason as the grammar curriculum and passages (Stages 14/15): the *sequence* is a pedagogical decision that should be deliberate and reliable. Extending the path is appending to this file.

### Completion rules (`curriculum/progress.ts`)

| Lesson type | Counts as complete when |
|---|---|
| grammar | the topic has ≥1 **correct** exercise attempt |
| reading | a `reading_results` row exists for the passage |
| listening | a `listening_results` row exists for the clip |
| writing | a `writing_submissions` row exists for the prompt |
| quiz | a **graded** quiz (`score` not null) exists in that category |
| conversation | the student has sent ≥1 user message in that scenario |

Six `SELECT DISTINCT` queries per request regardless of course size, then set-membership per lesson.

`buildCurriculum(sets, placementLevel)` is a **pure** function (no DB) that annotates the course, computes per-unit and overall counts, and picks `recommendedUnitId`: the first unfinished unit at or above the placement level, falling back to any unfinished unit, then the placement-level unit, then the first unit.

### Route

`GET /curriculum` → `{ courseTitle, units[], placementLevel, recommendedUnitId, completedLessons, totalLessons }`.

### Desktop UI

A new **🗺️ Path** tab (placed first) showing an overall progress bar, each unit with its CEFR badge and `done/total` count, a **START HERE** marker on the recommended unit, and lessons as tickable steps. Clicking a lesson **deep-links straight into that activity** — `openGrammarTopic` / `openReadingPassage` / `openListeningClip` / `openWritingPrompt` for content modules, and preselecting the scenario/category dropdown for conversation and quizzes.

## Known limitations (deliberate, documented)

- **Quiz completion is by category, not per unit.** There are only three quiz categories across five units, so completing e.g. a Grammar quiz ticks the quiz lesson in every unit that uses that category. Making this per-unit would require quizzes to record which unit they belong to.
- **The C1 unit is thinner (4 lessons)** because no C1 listening clip or writing prompt exists yet. Adding that content and appending two lessons extends the path with no other change — this is a content gap, not a structural one.
- The path is **advisory, not locking**: units aren't gated, so a learner can jump ahead. This is intentional for a school setting where teachers direct the order.

## Testing procedure

- **Reference integrity** (`curriculum/course.test.ts`, 3): every lesson's `refId` resolves against the real content modules (`getGrammarTopic`, `getReadingPassage`, `getListeningClip`, `getWritingPrompt`, `ALL_SCENARIOS`, `QUIZ_CATEGORIES`) — a typo or deleted passage fails the suite instead of shipping a dead lesson; lesson ids unique; units in ascending CEFR order with unique ids and no empty unit.
- **Progress/recommendation** (`curriculum/progress.test.ts`, 5, pure): empty progress totals, recommendation with and without a placement level, completing a unit advances the recommendation, and the fallback when the placement-level unit is already finished.
- **End-to-end derivation** (`routes/curriculum.test.ts`, 4): a fresh student sees everything incomplete; inserting a `reading_results` row and a graded quiz ticks exactly those lessons; an **ungraded** quiz does not count; the placement level seeds `recommendedUnitId`.
- Full backend suite: **133 tests passing**; backend `tsc` clean; types build clean; `renderer.js` passes `node --check`.
- **Live boot**: the real server was started against a throwaway DB and `GET /curriculum` returned **401** unauthenticated (route registered and reachable, vs 404 for an unknown path), with `/health` reporting `dbConnected: true` — confirming registration through `server.ts` and that migrations run on a fresh database.

## Git

- Commit: `Stage 27: Structured curriculum path`
- Tag: `v1.15.0`
- CHANGELOG entry added.
