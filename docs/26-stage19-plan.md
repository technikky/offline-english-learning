# Stage 19 Implementation Plan — Quiz Generator Module

## Objective

Add an AI quiz generator: pick a category and difficulty, get an auto-generated multi-question quiz with mixed question types, auto-graded with per-question explanations, and progress tracking — per the master brief.

## 1. Design: server-side quiz instances so answers aren't leaked

Unlike Stage 14's single grammar exercise (where the client held the answer, acceptable for a one-shot practice item), a quiz is a set of graded questions, so leaking answers to the client would let a student see them before answering. Instead:

- `POST /quiz/generate` asks the AI for a `QUIZ_QUESTION_COUNT` (5)-question quiz on a category+difficulty, **stores the full questions (with answers + explanations) server-side** in a new `quiz_instances` table keyed by a generated UUID, and returns only the student-facing view (question + options, **no correctAnswer/explanation**).
- `POST /quiz/:quizId/submit` loads the stored quiz, grades the submitted answers server-side (case-insensitive exact match, same as the other modules), records the score on the instance, and only *now* returns per-question correctness, the correct answers, and explanations.
- Ownership is enforced: a student can't submit another student's quiz (returns 404) — covered by a test.

This is the same "generate fresh, don't cache per-topic" model as grammar exercises (quizzes should vary), but with server-side answer custody added because grading integrity matters for a quiz.

## 2. Question types

The AI generates a **mix of multiple-choice and true/false** (true/false is modeled as multiple-choice with `True, False` options, so one grading path handles both). Categories: Grammar, Vocabulary, Everyday English. Difficulty is any CEFR level. The prompt uses per-question numbered markers (`Q1_TYPE`/`Q1`/`Q1_OPTIONS`/`Q1_ANSWER`/`Q1_EXPLANATION` …) — the same reliable format as the reading-comprehension generator — and the parser skips any question that fails to parse rather than failing the whole quiz.

## 3. Backend

- `quiz/aiQuizClient.ts` — object-wrapped client + category validation.
- `quiz_instances` table (id, studentId, category, difficulty, questionsJson, score nullable-until-graded).
- Routes: `POST /quiz/generate`, `POST /quiz/:quizId/submit`, `GET /quiz/progress` (recent graded quizzes + average score).

## 4. Desktop UI

New "❓ Quiz" tab. A setup panel (category + difficulty selectors, "Generate quiz" button) and a "Recent quizzes" summary. Generating shows the quiz as radio-button questions; "Submit quiz" grades it and annotates each question green/red with the correct answer and explanation inline, shows the score, and offers "New quiz".

## Testing / verification

1. AI service: `tests/test_quiz.py` (4 cases — prompt has all question slots, mixed-type parse, skipping incomplete questions, empty fallback). Full AI-service suite: 36/36 passing.
2. Backend: `routes/quiz.test.ts` (5 cases — generate hides answers, invalid category rejected, submit grades + reveals answers/explanations + updates progress, cannot submit another student's quiz, auth). Full backend suite: 87/87 passing.
3. **Real end-to-end**: via curl, generated a grammar A2 quiz (5 real questions, confirmed `correctAnswer` was **not** in the client payload), submitted answers, got graded 60% (3/5) with correct answers + explanations revealed and progress recorded. Via the real UI, generated a vocabulary A2 quiz (5 questions rendered), answered and submitted, and confirmed all 5 questions got correct/incorrect styling + explanations, a "Score: 60% (3/5)" summary, and the "New quiz" flow.
   - Small-model note: the 1.5B dev model sometimes embeds option letters (A/B/C/D) into the question text with `A,B,C,D` as the OPTIONS — gradeable but slightly awkward phrasing. Same documented small-model limitation; a production model is the real fix.

## Git commit information

- Commit message: `Stage 19: Quiz generator module completed`
- Tag: `v1.7.0`

## Explicitly deferred

- Question types beyond multiple-choice/true-false (fill-in-blank, matching, ordering) — MC/TF cover automatic-grading reliably; open-ended types need fuzzy grading already partly available (`scoreTextSimilarity`) and can be added incrementally.
- Reading/Listening/Speaking-specific quiz types (with an embedded passage/audio) — these would compose this quiz engine with the Reading/Listening modules; deferred to keep scope focused.
- A persistent question bank with de-duplication/spaced selection — quizzes are generated fresh each time; a curated bank is a larger content-management effort.
