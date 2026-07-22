# Stage 25 Implementation Plan — Spaced-repetition vocabulary review (SRS)

## Objective

Take the vocabulary notebook from a passive saved-word list to an active **spaced-repetition** system, so students actually *retain* the words they save on the road from beginner to advanced. Long-term vocabulary growth is the single biggest lever for reaching an advanced level, and spaced repetition is the proven, fully-offline mechanism for it. This is the first item of "Tier 1" from the platform gap analysis (it needs no new AI models or vendored assets — pure application code).

## Design decision: SM-2, computed offline

The scheduler is the classic **SM-2** algorithm (the math behind Anki and most flashcard apps). It is chosen over newer models (FSRS, etc.) because it ships zero trained parameters, runs in a few lines of arithmetic, and is entirely offline — a perfect fit for this project's constraints. It lives in a **pure, DB-free module** (`apps/backend/src/vocabulary/srs.ts`) so it can be unit-tested in isolation and swapped later without touching callers, which depend only on the `SrsState` shape.

Learners grade recall with four Anki-style buttons — **Again / Hard / Good / Easy** — mapped to SM-2 quality grades 1/3/4/5. "Again" is a lapse: the streak resets, the card returns tomorrow, and (if it had already been learned) a lapse is counted. Passing grades advance the interval (1 day → 6 days → `interval × easeFactor`), with the ease factor floored at the SM-2 minimum of 1.3.

## Architecture changes

### Schema (`db/schema.ts`, `db/client.ts`)

Six columns added to `vocabulary_notebook`, all with defaults so a freshly-saved word is **due immediately** and enters the queue at once:

| column | type | default | meaning |
|---|---|---|---|
| `repetitions` | INTEGER | 0 | consecutive successful recalls (SM-2 `n`) |
| `ease_factor` | REAL | 2.5 | SM-2 `EF`, never below 1.3 |
| `interval_days` | INTEGER | 0 | current inter-repetition interval |
| `lapses` | INTEGER | 0 | lifetime times forgotten after learning |
| `due_at` | TEXT | current_timestamp | when the card next comes up |
| `last_reviewed_at` | TEXT | null | last graded time |

**Migration for existing DBs** follows the established additive-migration pattern in `runMigrations()`. SQLite's `ALTER TABLE ADD COLUMN` forbids a `current_timestamp` default, so `due_at` is added nullable and backfilled from `created_at` — which makes every previously-saved word due for review immediately, the behaviour we want the first time SRS is switched on. Each `ALTER` is guarded by a `PRAGMA table_info` check, so it is idempotent. Validated against a real SQLite file simulating a pre-Stage-25 DB.

### Routes (`routes/vocabulary.ts`)

- `GET /vocabulary/review/queue?limit=` — cards due now (`due_at <= now`), oldest-due first (default limit 20, capped at 100).
- `GET /vocabulary/review/stats` — `{ due, learning, mature, total }` powering the "Review (N due)" tab badge and the queue summary.
- `POST /vocabulary/review/:id` — body `{ rating }`; applies the scheduler, recomputes `due_at = now + intervalDays`, persists, returns the new schedule. Ownership-checked (a student can only grade their own card → 404 otherwise); unknown rating → 400.
- The existing `GET`/`POST /vocabulary/notebook` responses now embed the `srs` schedule (with a server-computed `due` flag) in every `NotebookEntryDto`.

UTC timestamp handling matches SQLite's `current_timestamp` format (`YYYY-MM-DD HH:MM:SS`) produced from JS, so due-date comparisons are consistent regardless of which clock wrote a row.

### Shared types (`packages/types`)

`ReviewRating`, `SrsScheduleDto`, `SubmitReviewRequest/Response`, `ReviewStatsResponse`, `ReviewQueueResponse`; `NotebookEntryDto` gains a required `srs` field.

### Desktop UI (`apps/desktop/src`)

A new **🔁 Review** main tab with a due-count badge. It shows the queue summary, a "Start review" button, and a flashcard flow: word shown first (active recall), "Show answer" reveals the definition/example/synonyms, then the four colour-coded rating buttons schedule the card and advance. The badge refreshes on login, after saving/removing a word, and after a review session.

## Testing procedure

- **Scheduler unit tests** (`vocabulary/srs.test.ts`, 8): first-graduation, the fixed 1→6-day steps, `interval × EF` growth, lapse reset + counting, no-lapse-on-never-learned, ease up/down on easy/hard, EF clamped at 1.3, and interval monotonicity for a steady learner.
- **Route tests** (`routes/vocabulary.test.ts`, +2): a newly-saved word is immediately due → appears in queue + stats → grading "good" moves it out of the queue; invalid rating → 400; cross-student grade → 404.
- **Migration**: validated on a real SQLite file created with the old notebook shape — all columns added, defaults correct, `due_at` backfilled from `created_at`.
- Full backend suite: **109 tests passing**; backend `tsc` and the types package both build clean; `renderer.js` passes `node --check`.

## Git

- Commit: `Stage 25: Spaced-repetition vocabulary review (SRS)`
- Tag: `v1.13.0`
- CHANGELOG entry added.
