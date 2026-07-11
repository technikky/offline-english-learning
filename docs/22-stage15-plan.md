# Stage 15 Implementation Plan — Reading Module

## Objectives

Build a complete reading practice system per the master development brief — previously non-existent in this project. Passages across CEFR levels, vocabulary highlights, comprehension questions, a summary, audio playback, and progress tracking.

## 1. Passages: curated, not AI-generated

`apps/backend/src/reading/passages.ts` ships 5 curated passages, one per rough CEFR band (A1 "A Day at the Park", A2 "The New Neighbor", B1 "The Rise of Working From Home", B2 "The Power of Habits", C1 "The Ethics of Artificial Intelligence") — same rationale as Stage 14's grammar curriculum: reliable, level-appropriate reading text matters more than variety for the core content a student reads. Static in-code array, not a DB table; adding more passages later is purely additive.

## 2. Comprehension generation: AI-generated and cached (not regenerated per read)

- New AI service endpoint `POST /v1/reading/comprehension` (`passageContent`, `cefrLevel`) generates a summary, 5-8 vocabulary words, and exactly 4 multiple-choice comprehension questions in one call, using a numbered-marker format (`Q1:`/`OPTIONS1:`/`ANSWER1:` through `Q4`) rather than an open-ended "repeat this format" instruction, since a small local model follows explicit numbered markers more reliably than a repeated free-form block.
- **Deliberately different caching behavior from Stage 14's grammar exercises**: a reading comprehension quiz should stay the *same* every time a given passage is read (by the same or a different student), unlike a grammar drill which should vary each attempt for practice value. `reading_comprehension_cache` stores the generated package keyed by `passageId`, generated once on first request and reused after that (`reading/comprehension.ts`'s `getOrCreateComprehension()`), mirroring the Stage 6 vocabulary-caching pattern.
- Grading is exact-match (case-insensitive, trimmed) per question, same reasoning as Stage 14.

## 3. Audio playback: reused, not rebuilt

The "Listen to passage" button calls the **existing** `POST /speech/synthesize` route (Piper TTS, built in Stage 9) directly with the passage's full text — no new AI service or backend endpoint needed for this at all. This is exactly the payoff of Stage 4's "AI Architecture: avoid duplicated implementations" principle: a capability built for one module (pronunciation practice) was reusable as-is for an unrelated one (reading) with zero new code beyond the button and its click handler.

## 4. Progress tracking

`reading_results` persists each submission (score, correct count, total questions) per student per passage. `GET /reading/progress` returns, per passage the student has attempted, their best score and attempt count, plus an overall average score across all attempts — same "aggregate on read" pattern as Stage 8/14.

## 5. Real finding: small-model output quality (consistent with Stage 14)

Verified end-to-end against the live AI service: generated comprehension for "A Day at the Park" (A1) produced a real summary and 4 real questions, but with the same class of quality issue observed in Stage 14 — one question's options included a duplicate ("reads a book" appeared twice among the 4 options) and the vocabulary list included nearly every content word in the passage rather than a curated subset of 5-8. Both are gradeable/usable, not broken, but reflect the dev-time 1.5B model's limits at following "pick N interesting items" instructions precisely. Same conclusion as Stage 14: a production-sized model (already documented as a config swap via `AI_MODEL_PATH`) is the real fix, not a parser change.

## 6. Desktop UI

New "📖 Reading" tab, the third alongside "💬 Conversation" and "📘 Grammar" (the same small tab-strip pattern from Stage 14, not a new navigation paradigm). Passage list as cards (reusing the `.grammar-topic-card`/`.topic-progress-bar` styles from Stage 14 rather than inventing new ones) showing CEFR level, reading time, and best score. Passage detail view: full text, a "Listen to passage" button, AI summary, clickable vocabulary chips that add the word directly to the student's existing vocabulary notebook (reusing Stage 6's `addWordToNotebook()`, not a new lookup path), and a comprehension quiz with radio-button questions and a submit button showing the score.

## Testing / verification procedure

1. AI service: `tests/test_reading_comprehension.py` (4 cases) covering prompt construction and parser behavior (well-formed 4-question response, a response missing later questions degrading gracefully to fewer questions rather than failing, and a completely unstructured fallback). Full AI-service suite: 24/24 passing.
2. Backend: `routes/reading.test.ts` (6 cases) covering passage listing (summary excludes content), passage detail with AI generation **and cache-hit verification** (second request doesn't call the AI service again), 404 for unknown passage, scoring (both a fully-correct and a partially-correct submission), and auth requirement. Full backend suite: 64/64 passing.
3. **Real end-to-end verification** via the actual desktop UI: logged in as a student, opened the Reading tab, saw all 5 passages with level/time badges, opened "A Day at the Park", confirmed the real AI-generated summary/vocabulary/4 questions rendered, clicked "Listen to passage" and confirmed a real `POST /speech/synthesize` call succeeded (200 OK), answered the questions and submitted, got a real score (75%, 3/4 correct), and confirmed `/reading/progress` reflected it (best score 75, 1 attempt).

## Documentation update

This file, `CHANGELOG.md`/`README.md`.

## Git commit information

- Commit message: `Stage 15: Reading module completed`
- Tag: `v1.3.0`

## Explicitly deferred to later stages

- Sentence-level AI explanation on demand (the master brief's "sentence explanation" feature) — vocabulary-word explanation already exists via the notebook click-through; a dedicated "explain this sentence" interaction is a small, natural follow-up once there's a concrete UI pattern to hang it on (e.g. text selection), not added speculatively this stage.
- Word-level inline translation (vs. definition) — the existing vocabulary pipeline gives English definitions, not translations into the student's native language; would require knowing the student's native language, which isn't currently modeled anywhere in the system.
- Teacher-uploaded reading passages — like Stage 14's grammar curriculum, content is currently developer-maintained; revisit alongside a broader teacher-content-management stage if needed.
