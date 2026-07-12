# Stage 18 Implementation Plan — Writing Module

## Objective

Add a writing-practice module where every exercise is scaffolded (topic, difficulty, target vocabulary, grammar focus, word-count target, hints) rather than a blank page, and the AI analyzes the student's submission across multiple dimensions and produces a model answer — per the master brief.

## 1. Hybrid analysis: LanguageTool (deterministic) + LLM (higher-level)

The brief's list of writing analyses splits cleanly into two kinds:
- **Concrete, mechanical errors** (grammar, spelling, punctuation) — best done deterministically. This **reuses LanguageTool** (`languageToolClient.check`, built in Stage 5 for conversation grammar) on the submitted essay, giving exact original→correction pairs with rule categories. No new work, and far more reliable than asking a 1.5B model to find every error.
- **Higher-level judgment** (overall assessment, vocabulary/coherence quality, strengths, actionable suggestions, a model answer) — this is what the LLM is actually good at. A new AI service endpoint `POST /v1/writing/analyze` handles it, with the same lenient marker-based parsing (`OVERALL:`/`GRAMMAR:`/`VOCABULARY:`/`COHERENCE:`/`STRENGTHS:`/`IMPROVEMENTS:`/`MODEL:`) used across the other AI features. Scores are parsed leniently (extract the first number, clamp 0–100, default 60 if unparseable).

The route combines both into one `WritingFeedback`. If LanguageTool is down, it degrades gracefully to LLM-only feedback (empty mistakes list) rather than failing — verified by a test.

## 2. Backend

- `writing/prompts.ts` — 4 curated, scaffolded prompts (A1–B2), each with `prompt`, `targetVocabulary`, `grammarFocus`, `wordCountTarget`, `hints`.
- `writing_submissions` table — stores the student's text, the three dimension scores inline (for cheap progress queries), and the full `WritingFeedback` JSON (for re-display).
- `writing/aiWritingClient.ts` — object-wrapped client (swappable in tests).
- Routes: `GET /writing/prompts`, `GET /writing/prompts/:id`, `POST /writing/prompts/:id/submit` (LanguageTool + LLM → combined feedback, persisted), `GET /writing/progress` (submission history + average score).

## 3. Desktop UI

New "✍️ Writing" tab. Prompt cards → a prompt detail with the full scaffolding (prompt text, grammar focus, target vocabulary, word-count target, hints), a textarea with a **live word counter**, and a "Get AI feedback" button. The feedback view shows: overall assessment, a scores table (grammar/vocabulary/coherence/word-count), strengths & suggestions lists, a **grammar & spelling issues** list (LanguageTool's original→correction pairs, reusing the correction-item styling from the conversation view), and the **model answer**.

## Testing / verification

1. AI service: `tests/test_writing_analysis.py` (4 cases — prompt construction, well-formed parse, score extraction/clamping, garbled fallback). Full AI-service suite: 32/32 passing.
2. Backend: `routes/writing.test.ts` (6 cases — prompt list hides scaffolding, detail exposes it, submit returns combined LanguageTool+AI feedback and persists it, graceful degradation when LanguageTool throws, 404/400 validation, auth). Full backend suite: 82/82 passing.
3. **Real end-to-end** through the actual UI + full stack (backend + LanguageTool + AI service): opened the Writing tab (4 prompts), opened "My Family" (scaffolding rendered: grammar focus, 3 hints, 50-word target), typed an essay containing the misspelling "recieve", watched the live word counter (20 words), submitted, and confirmed the feedback panel rendered with the LLM's overall assessment + scores + strengths + suggestions + model answer, and **LanguageTool's real "recieve → receive (Possible Typo)"** correction listed. Progress endpoint reflected the submission (1 total, avg score, "My Family" title resolved).
   - Small-model note: the 1.5B dev model returned middling dimension scores (50/50/50) — usable but not finely calibrated, the same documented small-model limitation as prior stages; a production model is the real fix. The concrete grammar/spelling correction (the most important part for a learner) is fully reliable because it comes from LanguageTool, not the LLM.

## Git commit information

- Commit message: `Stage 18: Writing module completed`
- Tag: `v1.6.0`

## Explicitly deferred

- Sentence-by-sentence inline feedback anchored to positions in the student's text — the current feedback is per-essay plus a flat list of LanguageTool corrections; positional inline highlighting is a UI enhancement, not a new capability.
- Teacher-authored writing prompts — like the other modules' curated content, prompts are developer-maintained; a teacher-content-management stage would cover all modules at once.
