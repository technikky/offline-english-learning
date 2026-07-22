# Stage 26 Implementation Plan — Adaptive CEFR placement test

## Objective

Give every learner a real **starting level** instead of the system's old hardcoded assumption of B1. Until now, `estimateDifficultyLevel()` fell back to B1 for anyone without chat history, so a true beginner and a near-advanced learner began identically. A short **adaptive placement test** assesses a learner in about a minute and stores the result, which then seeds conversation difficulty (and, in a later stage, the structured curriculum path). This is the second "Tier 1" item from the platform gap analysis — pure application code, no new AI models or vendored assets. See [[advanced-proficiency-roadmap]] equivalent in `docs/32-stage25-plan.md`'s roadmap context.

## Design

### Adaptive staircase (pure, offline)

`apps/backend/src/placement/staircase.ts` is a dependency-free **up/down staircase**: the learner is served one block of questions per CEFR rung, starting at **B1** (mid-scale). Passing a rung (`≥ 2` of `3` correct) moves them up a level; failing moves them down. The test concludes the moment it would revisit an already-tested rung (i.e. the boundary between a passed and a failed level is found), or when a level is topped out (C2) / floored (A1). The result is the **highest rung passed** (A1 if none). This converges in ~2–4 blocks rather than testing all six levels. Kept DB/HTTP-free so it is unit-tested in isolation.

### Curated item bank

`apps/backend/src/placement/items.ts` — a static, curated bank of CEFR-tagged multiple-choice items (grammar/usage), at least `BLOCK_SIZE` (3) per level A1–C2. Curated for the same reason as the grammar curriculum and reading passages (Stages 14/15): a placement test must be reliable and consistently level-appropriate, which a small local model can't guarantee per run. Since the staircase never revisits a rung, no item is shown twice in one test. Easily extended by appending items.

### Server-driven session (answers never leave the server)

Mirrors the quiz pattern (Stage 19): correct answers are graded **server-side** and never sent to the client. A new `placement_sessions` table holds the staircase `state_json` and the current block's `served_item_ids_json`, so the server grades against exactly what it served. One in-progress session per student (a fresh start clears any abandoned one).

Routes (`routes/placement.ts`):
- `POST /placement/start` → creates a session, returns the first block (B1) as `{ sessionId, level, blockNumber, items:[{id,question,options}] }`.
- `POST /placement/:sessionId/answer` (body `{ answers: {itemId: choice} }`) → grades the block, advances the staircase; returns either `{ complete:false, block }` (next rung) or `{ complete:true, resultLevel }`. On completion it writes `placement_level` + `placement_completed_at` to the user. Bogus/foreign session → 404; malformed body → 400.
- `GET /placement/status` → `{ placementLevel, completedAt }` for the sidebar.

### Schema

- `users`: `placement_level TEXT`, `placement_completed_at TEXT` (both nullable; additive migration in `runMigrations()`).
- New `placement_sessions` table (created via `CREATE TABLE IF NOT EXISTS`).

### Seeding difficulty

`conversations/difficulty.ts` now seeds from the placement level when a student has no message history yet, replacing the hardcoded B1 default. Once real conversation history exists, the existing sentence-length/diversity heuristic still takes over.

### Desktop UI

A **"My level"** sidebar section shows the assessed level (or "Not assessed yet") with a Take/Retake button. The test runs in a modal: one block of radio-button questions at a time, "Submit answers" advances or finishes, and the result shows the CEFR level with a friendly label. Status refreshes on login and after completion.

## Testing procedure

- **Staircase unit tests** (`placement/staircase.test.ts`, 7): start at B1, up on pass / down on fail, boundary detection (pass B1 → fail B2 ⇒ B1), top-out at C2, floor at A1, fail-B1-then-pass-A2 ⇒ A2, and immutability after completion.
- **Route tests** (`routes/placement.test.ts`, 5): full all-correct run ⇒ C2 (and persisted to the user + `/status`), all-wrong ⇒ A1, pass-B1/fail-B2 ⇒ B1, `/status` null before taking, bogus session ⇒ 404. Answer keys are built from the item bank so the test tracks the real content.
- **Migration** validated on a real SQLite file with a pre-existing `users` table (columns added nullable; `placement_sessions` created and insertable).
- Full backend suite: **121 tests passing**; backend `tsc` clean; types build clean; `renderer.js` passes `node --check`.

## Git

- Commit: `Stage 26: Adaptive CEFR placement test`
- Tag: `v1.14.0`
- CHANGELOG entry added.
