# Stage 14 Implementation Plan — Grammar Learning Module

## Objectives

Build a complete grammar learning system per the master development brief: a curated curriculum (beginner/intermediate/advanced), each topic with an explanation, examples, and AI-generated interactive exercises, graded automatically, with per-topic and overall progress tracking.

## 1. Curriculum: curated, not AI-generated

`apps/backend/src/grammar/curriculum.ts` ships 9 topics (4 beginner, 3 intermediate, 2 advanced) as a static, in-code array — deliberately **not** a DB table and **not** AI-generated. Rationale: the explanation and examples are the foundational content a student reads first; a 1.5B local model's occasional unreliability (see §4) is an acceptable cost for a *practice exercise* a student can just regenerate, but not for the core teaching text itself. Adding more topics later is purely additive (append to the array) — no migration needed. This mirrors the same "curate the reliable part, generate the varied part" split the codebase already uses for vocabulary (Stage 6: cached AI explanation) and conversations (Stage 13: curated scenario + AI-generated dialogue).

Beginner: Present Simple, Past Simple, Articles, Prepositions of Time/Place.
Intermediate: Present Perfect, Passive Voice, Conditionals (1st/2nd).
Advanced: Modal Verbs of Deduction, Relative Clauses.

## 2. Exercise generation and grading

- New AI service endpoint `POST /v1/grammar/exercise` (`topicTitle`, `topicExplanation`, `difficultyLevel`, `exerciseType`) generates one fresh multiple-choice or fill-in-the-blank exercise per request, using the topic's own `cefrLevel` as the difficulty (not the student's overall estimated level — a beginner topic should stay beginner-phrased regardless of the student's general level, since the topic itself defines what's being tested). Same lenient marker-based parsing pattern (`QUESTION:`/`OPTIONS:`/`ANSWER:`/`EXPLANATION:`) as grammar/vocabulary explain, for the same reason: a small local model isn't reliable at strict JSON.
- Grading is exact-match (case-insensitive, trimmed) on the client's submitted answer vs. the AI-generated correct answer — deliberately simple rather than a fuzzy/semantic match, since both exercise types (multiple choice, fill-in-blank) have one unambiguous correct string.
- `grammar_exercise_attempts` table persists every attempt (topic, exercise type, question, correct/student answers, correctness) for progress tracking. `topicId` is plain text referencing `curriculum.ts`'s ids, not a DB foreign key, since the curriculum isn't a table.

## 3. Progress tracking

`GET /grammar/progress` returns per-topic attempts/correct/accuracy plus an overall accuracy and total-attempts count, computed on the fly from `grammar_exercise_attempts` (same "aggregate on read, don't pre-compute" pattern as Stage 8's `getStudentAnalytics`). The topic list UI shows each topic's accuracy as a progress bar.

## 4. Real finding: small-model exercise quality

Verified end-to-end against the live AI service (not just unit tests): generated a real multiple-choice exercise ("She ___ to work at 7 AM every day.") and the 1.5B model produced options `["works", "work", "works", "works"]` — the correct answer duplicated three times instead of three genuinely distinct wrong options. The exercise was still gradable and pedagogically valid (the student picks the right form), but the distractor quality is weak. This is a real, observed limitation of the dev-time 1.5B model (`docs/02-technology-selection.md` already documents `AI_MODEL_PATH` as swappable for a larger production model) rather than a bug in the prompt/parser — recorded here rather than silently accepted. A future mitigation without waiting for a bigger model: post-process to deduplicate options and pad with the same word conjugated differently, or regenerate once if duplicate options are detected. Not implemented this stage to avoid over-engineering around a single small-model's behavior before it's clear how the production-sized model performs here.

## 5. Desktop UI

New "📘 Grammar" tab alongside the existing "💬 Conversation" tab in the student's main panel (a small tab strip, not a full navigation redesign — that's explicitly deferred to a later UI-redesign stage per the master brief). Topic list as a card grid grouped implicitly by level badge, with a progress bar per topic. Clicking a topic shows explanation + examples + a practice panel (exercise-type selector, "New exercise" button, question rendering — buttons for multiple-choice, a text input for fill-blank — and inline correct/incorrect feedback with the AI's explanation).

## Testing / verification procedure

1. AI service: `tests/test_grammar_exercise.py` (5 cases) covering prompt construction for both exercise types and parser behavior (well-formed multiple-choice, well-formed fill-blank, missing-markers fallback). Full AI-service suite: 20/20 passing.
2. Backend: `routes/grammarLessons.test.ts` (7 cases) covering topic listing (summary excludes explanation/examples), topic detail, 404 for unknown topic, AI-backed exercise generation (faked client), correct/incorrect submission grading (case-insensitive), progress aggregation, and auth requirement. Full backend suite: 58/58 passing.
3. **Real end-to-end verification** via the actual desktop UI (not just curl): logged in as a student, opened the Grammar tab, saw all 9 topics with progress badges, opened "Present Simple Tense", generated a real exercise from the live LLM, clicked an answer, and confirmed correct grading + explanation feedback rendered, then confirmed `/grammar/progress` reflected the new attempt (100% accuracy, 1 attempt).

## Documentation update

This file, `CHANGELOG.md`/`README.md`.

## Git commit information

- Commit message: `Stage 14: Grammar learning module completed`
- Tag: `v1.2.0`

## Explicitly deferred to later stages

- Teacher-side grammar content management (the master brief's Teacher Panel section lists "Grammar" among content teachers manage) — the curriculum is currently developer-maintained code, not a teacher-editable CMS; revisit if/when non-developer content editing becomes a real requirement.
- Speaking/writing exercises tied to grammar topics — intentionally reusing the existing conversation-practice and grammar-mistake-correction pipelines rather than building a parallel one, per the "avoid duplicated AI implementations" principle; a topic-linked "practice this in conversation" entry point is a natural, low-cost follow-up once Reading/Writing modules exist.
- Exercise-option quality mitigation (§4) — deferred pending real-world testing with a production-sized model.
