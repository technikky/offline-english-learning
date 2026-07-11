# Stage 5 Implementation Plan — Grammar correction engine

## Objectives

1. Deterministic grammar-error detection via a fully offline LanguageTool server (tenses, articles, prepositions, subject-verb agreement, word order, punctuation, etc. — matches the brief's requirement list directly).
2. LLM-generated, learner-friendly explanations and examples for a specific detected mistake, on demand ("explain this mistake" — the AI Tutor entry point from the original requirements).
3. Inline correction UI in the desktop conversation view.

## Why LanguageTool + LLM, not LLM-only

Per [docs/02-technology-selection.md](02-technology-selection.md): LanguageTool is a mature, fully offline, rule-based grammar engine — it catches high-confidence error categories fast and cheaply (no LLM inference cost per message), and its output includes a stable `rule.id`/`rule.category` that's useful for analytics later (Stage 8: "weak grammar topics"). The LLM's job is narrower and better suited to it: turning "subject-verb agreement, rule ID X" into a beginner-friendly explanation with an example — something rule-based systems can't do well, and something that doesn't need to happen on every message (only when a student asks "why is this wrong?").

## Architecture

```
Student message
      │
      ▼
Backend: POST /conversations/:id/messages (existing Stage 4 route, extended)
      │
      ├──► LanguageTool server (local HTTP, 127.0.0.1:8081/v2/check) — synchronous,
      │     runs before the AI reply streaming starts. Fast (rule-based, no LLM).
      │     Detected mistakes are persisted to `grammar_mistakes` and sent to the
      │     client as the first NDJSON line of the same response stream, ahead of
      │     the AI reply's token lines — no extra request needed for the common case.
      │
      └──► AI Service /v1/chat (existing Stage 4 streaming reply, unchanged)

Later, on demand ("explain this mistake"):
Backend: POST /grammar/explain { mistakeId }
      │
      └──► AI Service POST /v1/grammar/explain (new, non-streaming — an
            explanation is a short, single response; streaming a paragraph
            token-by-token isn't worth the added client complexity here).
```

## LanguageTool

- Vendored as a standalone server JAR under `offline-sdk/build-tools/languagetool/` (gitignored — large binary, same policy as the AI models and Node/Android SDKs).
- Run locally: `java -cp languagetool-server.jar org.languagetool.server.HTTPServer --port 8081`. No network access required once downloaded; ships its own English rule data.
- Backend calls `GET/POST http://127.0.0.1:8081/v2/check?language=en-US&text=...` and maps LanguageTool's `matches[]` (offset, length, message, replacements, rule.id, rule.description, rule.category.name) into our own `GrammarMistake` shape.

## Database schema addition

- `grammar_mistakes`: id, message_id (FK messages.id), original_text, corrected_text, rule_id, rule_description, category, explanation (nullable — filled in lazily by `/grammar/explain`), example (nullable), created_at.

Explanation/example are nullable and populated on demand rather than eagerly for every mistake on every message — most detected mistakes are never clicked into, so generating an LLM explanation for all of them would be wasted inference work on CPU hardware.

## Backend routes

- `POST /conversations/:id/messages` (extended) — after inserting the user's message, runs it through LanguageTool, persists any mistakes against that message, and writes them as the first NDJSON line (`{"grammarMistakes": [...]}`) before proceeding with the existing AI reply stream.
- `POST /grammar/explain` — body `{ mistakeId }`. Ownership-checked (the mistake must belong to a message in one of the caller's own conversations). Calls the AI Service, persists the returned explanation/example onto the `grammar_mistakes` row (so re-opening the same correction later doesn't re-run inference), and returns them.

## AI Service

- `POST /v1/grammar/explain` — body `{ originalText, correctedText, ruleDescription, difficultyLevel }`. Non-streaming; returns `{ explanation, example }`. Prompted to explain "step by step, using beginner-friendly language" (matching the original brief's AI Grammar Tutor wording) and to keep the explanation short.
- The LLM output isn't strictly-parseable JSON (small local models are unreliable at that), so the service asks for two clearly delimited sections in the prompt and splits on markers, falling back to returning the whole response as `explanation` with an empty `example` if the markers aren't found — a deliberately forgiving parse rather than a brittle one that 500s on minor format drift.

## Desktop UI

- User message bubbles that had detected mistakes get a small inline "N grammar note(s)" affordance underneath, listing original → corrected text per mistake.
- Each listed mistake has an "Explain" button. Clicking it calls `/grammar/explain` and expands to show the explanation + example once it returns (a brief loading state in between — this one call is not streamed, per the AI Service design above).

## Testing procedure

1. Backend unit tests inject a fake LanguageTool client (a plain function returning canned matches) so grammar-check logic and persistence are tested without needing a live Java process — fast and deterministic, same reasoning as Stage 4's decision not to unit-test the live AI streaming path.
2. Manual end-to-end: start LanguageTool + AI service + backend, send a message with a deliberate grammar mistake in a conversation, confirm the mistake is detected and returned inline, click "explain", confirm a real LLM-generated explanation and example come back and are visible in the desktop UI.

## Documentation update

This file, `CHANGELOG.md`/`README.md` current-stage pointer, `offline-sdk/build-tools/README.md` updated with the vendored LanguageTool version, and `scripts/start-dev.*` updated to also launch the LanguageTool server.

## Git commit information

- Commit message: `Stage 05: Grammar correction engine completed`
- Tag: `v0.5.0`

## Explicitly deferred to later stages

- "Related grammar lessons" surfaced alongside a correction (needs a lesson-content model that doesn't exist yet) — Stage 6/7 territory once vocabulary/lesson content exists.
- Grammar-mistake analytics (weak/strong topics per student) — Stage 8, once there's enough persisted `grammar_mistakes` data and a UI to show trends.
- Android inline grammar UI — Stage 4 already deferred Android's conversation UI; grammar correction follows the same client once that catch-up work happens.
- Writing-practice-specific grammar checks (essay/email/diary modes) — Stage 9 (Writing Practice per the newer requirements doc's backlog).
