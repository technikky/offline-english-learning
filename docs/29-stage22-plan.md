# Stage 22 Implementation Plan — Learning history view

## Objective

Give every student one place to see **everything they have practiced** across all modules — a single, chronological learning history — per the brief's "there must be a feature to view learning history."

## 1. Aggregation, not a new table

The platform already records each module's activity in its own table (conversations, grammar attempts, reading/listening/writing submissions, quiz instances, pronunciation results). Rather than duplicate that into a history table, Stage 22 introduces a read-time **aggregator**:

`apps/backend/src/history/aggregate.ts` → `getLearningHistory(studentId, limit = 100)`:

- Queries the seven per-module sources for the student.
- Maps each row into a common `LearningHistoryEntry` — `{ type, title, detail, score | null, createdAt }` — using the existing label/lookup helpers (`getGrammarTopic`, `getReadingPassage`, `getListeningClip`, `getWritingPrompt`, `SCENARIO_LABELS`, `QUIZ_CATEGORY_LABELS`) so each entry has a human-readable title.
- Merges all entries, sorts by `createdAt` descending, and computes `averageScore` over **scored** entries only (ungraded items such as an in-progress conversation or an ungraded quiz are counted in `totalActivities` but excluded from the average).

Returns `{ entries, totalActivities, averageScore }`.

## 2. Route

`GET /history` (authenticated) → `getLearningHistory(request.authUser.sub)`. Students see only their own history (scoped by the authenticated user id); no parameters, no cross-user access.

## 3. Types

`packages/types`: `LearningActivityType`, `LearningHistoryEntry`, `LearningHistoryResponse`.

## 4. Desktop

New **📜 History** tab: a summary line (total activities + average score) and a data-table of *When / Activity / Detail / Score*, one row per entry with a per-type icon (`HISTORY_TYPE_ICONS`). Loaded on demand with a refresh button.

## 5. Verification

- Unit tests (`history.test.ts`, 4): empty history; merge across modules with newest-first ordering and a correct average that excludes an ungraded quiz; per-student isolation; auth 401.
- Live: with a fresh student who had started one conversation, `GET /history` returned `totalActivities: 1` (the conversation, unscored → `averageScore: 0`), and `GET /history` without a token returned 401.
