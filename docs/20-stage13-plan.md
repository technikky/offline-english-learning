# Stage 13 Implementation Plan — Conversation Module Redesign

## Objectives

The first stage of the post-v1.0.0 "AI English Tutor platform" roadmap (see the master development brief this stage responds to). Marked highest priority: replace the conversation module's small, generic scenario list with a rich set of topic-grounded scenarios, and make the AI behave like an active tutor during the conversation rather than just a scripted character.

## 1. Scenario set: from 7 generic modes to 21 topic-grounded ones

Previously: `free_talk`, `role_play`, `interview`, `business`, `travel`, `daily`, `debate` — several of these (`interview`, `business`, `daily`) were themes rather than concrete situations, giving the LLM little to ground a scene in.

New set (`packages/types/src/index.ts`'s `Scenario` union, `SCENARIO_LABELS`, `ALL_SCENARIOS`):
- **General open-ended modes** (kept as-is): `free_talk`, `role_play`, `debate`.
- **Topic-grounded scenarios** (new or renamed for consistency): `travel`, `airport`, `restaurant`, `business_meeting` (was `business`), `job_interview` (was `interview`), `shopping`, `technology`, `sports`, `movies`, `daily_life` (was `daily`), `hospital`, `hotel`, `school`, `university`, `coffee_shop`, `emergency`, `family`, `culture`.

**Deviation, documented rather than silently made**: renaming `interview`→`job_interview`, `business`→`business_meeting`, `daily`→`daily_life` is a breaking change for any previously-stored conversation/assignment rows using the old names. Accepted because there's no real school deployment yet (this is pre-first-rollout), and the `scenario` column is plain SQLite `TEXT` with no `CHECK` constraint — old rows still load fine, they just fall back to the AI service's default (`free_talk`) prompt if ever replayed, which is a cosmetic gap, not a crash.

**Deduplication**: `VALID_SCENARIOS` was previously defined twice (identically) in `routes/conversations.ts` and `routes/assignments.ts`. Consolidated into `conversations/scenarios.ts`'s `isValidScenario()`, backed by the shared `ALL_SCENARIOS` list from `packages/types` — one source of truth instead of two arrays that could drift out of sync.

## 2. AI service: pedagogical system prompt

`apps/ai-service/app/prompts.py` gets a new `PEDAGOGY_INSTRUCTIONS` block, appended to every scenario's system prompt (not scenario-specific — it's the tutoring behavior that should apply regardless of topic):

- Keep the conversation going: ask a genuine follow-up question based on what the student just said, at least every other turn.
- Reference earlier parts of the same conversation when relevant (the message history is already passed to the model in full each turn — this instructs the model to actually *use* it, not just receive it).
- Natural correction via recasting: model the correct grammar in the AI's own reply rather than lecturing, since LanguageTool + the existing "explain this mistake" flow already gives the student an explicit correction separately — the two shouldn't duplicate.
- Introduce one useful new word/phrase when a natural opportunity comes up, showing its meaning through context rather than a dictionary aside.
- Encourage longer answers: if the student's reply is short, ask something that invites elaboration.
- Vary sentence structure so the student sees a range of natural English rather than repetitive phrasing.

Each of the 21 scenarios also got a rewritten, more concrete prompt (a real cast of characters and situation — e.g. `restaurant` now specifies "greet, take the order, answer menu questions, handle the bill", not just "helping the student practice everyday conversation").

## 3. Difficulty tier display names

The master brief asks for "Beginner / Elementary / Intermediate / Upper Intermediate / Advanced / Native-like" difficulty tiers. Rather than rearchitecting the difficulty system, these map exactly 1:1 onto the CEFR levels (A1–C2) already threaded through the whole system since Stage 4 (the difficulty-estimation heuristic, the AI service's `DIFFICULTY_INSTRUCTIONS`, analytics' `estimatedLevel`). Added `CEFR_LABELS` (`packages/types`) as a pure display-label mapping — CEFR remains the internal representation everywhere; only the student/teacher-facing UI shows the friendly name (`A1 — Beginner`, etc. in the progress panel).

## 4. Desktop UI

- Conversation-start and assignment-creation scenario dropdowns updated to the full 21-option list with friendly labels.
- Student/teacher progress panel now shows `<CEFR> — <friendly name>` for estimated level via a small `formatCefrLevel()` helper (duplicated from `packages/types`' `CEFR_LABELS` since `renderer.js` is a plain script tag, not bundled against the shared types package — same reasoning as the rest of the desktop app's architecture).

## Testing / verification procedure

1. AI service: `tests/test_scenario_prompts.py` (new, 4 cases) — every one of the 21 scenarios has a non-empty prompt, `build_system_prompt()` includes the scenario text/difficulty/pedagogy block, and falls back correctly for unknown scenario/difficulty strings. Full AI-service suite: 15/15 passing.
2. Backend: `conversations/scenarios.test.ts` (new, 3 cases) covering the shared `isValidScenario()` — accepts every current scenario, rejects unknown strings, explicitly rejects the renamed legacy names (`interview`/`business`/`daily`). Existing tests referencing the old `"daily"` scenario string through the actual HTTP route (`conversations.test.ts`, `assignments.test.ts`) updated to `"daily_life"`; tests that insert directly into the DB as fixtures (bypassing route validation) were left alone since the DB column itself has no constraint. Full backend suite: 51/51 passing.
3. **Real end-to-end verification** (not just unit tests): started the full stack via `scripts/run.bat`, created a real student account, started a `restaurant` conversation, and exchanged two real turns with the live LLM. Confirmed: the AI stayed in character as a restaurant server, asked genuine follow-up questions ("What size would you like your pizza? ... regular or diet?"), and the full conversation history persisted and reloaded correctly via `GET /conversations/:id`.

## Documentation update

This file, `CHANGELOG.md`/`README.md`, `apps/ai-service/README.md`'s scenario reference (if any).

## Git commit information

- Commit message: `Stage 13: Conversation module redesign completed`
- Tag: `v1.1.0`

## Explicitly deferred to later stages

- Grammar Learning Module, Reading Module, Listening Module, Writing Module, expanded Vocabulary features (flashcards/spaced repetition), phoneme-level Pronunciation, Quiz Generator, and Multi-Tenant architecture — all named in the master brief, all real, separately-scoped stages of their own rather than being compressed into this one. Tracked as Stage 14+.
