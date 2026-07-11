# Stage 4 Implementation Plan — AI conversation engine

## Objectives

1. Stand up the AI Service Layer (Python + FastAPI) from the architecture doc, running a local LLM via llama.cpp.
2. Conversation/Message schema in the backend, with scenario presets and a difficulty-adaptation heuristic.
3. A real, streaming chat experience in the desktop app.

## Model choice for this stage (dev-time decision, not final production sizing)

[02-technology-selection.md](02-technology-selection.md) specifies a 7–8B instruction-tuned GGUF model for production (sized for real classroom CPU inference quality). This development machine and session are optimized for proving the pipeline correctly and quickly, not for evaluating conversation quality at production scale, so Stage 4 vendors a much smaller model instead:

- **Qwen2.5-1.5B-Instruct, GGUF Q4_K_M** (~1 GB) — small enough to download and run inference on CPU within this session, still a genuine instruction-tuned chat model (not a stub/mock), so everything built against it (prompt templates, streaming, history handling) carries over unchanged when swapped for a larger model.
- The AI Service's model path is a config value (`AI_MODEL_PATH` env var), not a code path — swapping to Llama-3.1-8B-Instruct or Qwen2.5-7B-Instruct GGUF for a real deployment is a file swap plus a config change, per the "AI model replacement" extensibility hook in the architecture doc. This is recorded here explicitly so it isn't mistaken for the final model choice later.

## AI Service (Python + FastAPI)

- `apps/ai-service`: FastAPI app wrapping `llama-cpp-python` (`Llama` class, CPU inference).
- `GET /health` — model loaded status.
- `POST /v1/chat` — body: `{ messages: [{role, content}], scenario, difficultyLevel }`. Streams newline-delimited JSON (NDJSON): a line per generated token `{"token": "..."}`, then a final `{"done": true, "fullText": "..."}`. NDJSON over HTTP chunked transfer was chosen over SSE because both the Node backend (proxy) and the eventual Flutter client can parse "one JSON object per line" trivially without an SSE client library.
- System prompt is assembled server-side from `scenario` (one of the presets below) and `difficultyLevel` (a CEFR band), so scenario/difficulty logic lives in one place rather than being duplicated per client.

## Scenario presets

`free_talk`, `role_play`, `interview`, `business`, `travel`, `daily`, `debate` — matches the brief's conversation-mode list. Each maps to a system-prompt template in the AI service (e.g. "You are conducting a mock job interview in English..."). Storytelling/IELTS/TOEFL/TOEIC-style modes from the newer requirements doc are additive presets for a later stage, not needed to prove the pipeline.

## Difficulty-adaptation heuristic (v1)

A CEFR-band estimate (`A1`–`C2`) computed from a student's own message history (not stored as a separate persisted field yet — computed on demand per conversation turn):

- Average words per sentence and vocabulary diversity (unique words / total words) across the student's last ~20 messages.
- Mapped to a band via fixed thresholds (short sentences + low diversity → A1/A2; longer, more varied → B1/B2; long and diverse → C1/C2).
- Fed into the AI service's system prompt ("respond using vocabulary and sentence complexity appropriate for a {level} English learner").

This is explicitly a v1 heuristic — a real implementation would fold in grammar-error frequency (Stage 5) and vocabulary-notebook data (Stage 6) once they exist. Recorded here so the crudeness is a known, intentional starting point rather than an oversight.

## Backend schema additions

- `conversations`: id, student_id, scenario, created_at.
- `messages`: id, conversation_id, role (`user`|`assistant`), content, created_at.

## Backend routes

- `POST /conversations` (any authenticated role) — create a conversation for the caller with a chosen scenario.
- `GET /conversations/:id` — full message history; 404s if the conversation isn't the caller's (ownership check; teacher/admin cross-user visibility is a Stage 7/8 concern).
- `POST /conversations/:id/messages` — takes the student's new message, computes the difficulty heuristic from their history, calls the AI Service's `/v1/chat` with full conversation history + system prompt, **streams the NDJSON response straight through to the client** while buffering it server-side, and once the stream ends persists both the user message and the full assistant reply to `messages`.

## Desktop client

- A scenario picker + chat log replaces the Stage 3 profile-only view once logged in.
- Sends messages via `fetch` to the streaming endpoint and reads the response body as a `ReadableStream`, decoding and appending NDJSON token lines to the chat log as they arrive — a real token-by-token streaming UI, not a spinner-then-dump.

## Testing procedure

1. AI service: start it standalone, `curl` `/health` and a raw `/v1/chat` call, confirm streamed tokens arrive incrementally (visible via `curl --no-buffer`).
2. Backend: unit tests for conversation creation/ownership (mocking the AI service call isn't necessary for the ownership/ persistence logic tests; a lightweight fake AI service or a short-circuited test path is used to keep tests fast and offline-safe).
3. Manual end-to-end: log in on desktop, start a `free_talk` conversation, send a message, watch tokens stream in, refresh and confirm history persisted.

## Documentation update

This file, plus `CHANGELOG.md`/`README.md` current-stage pointer, and an `offline-sdk/ai-models/README.md` update documenting the vendored model and the production-swap path.

## Git commit information

- Commit message: `Stage 04: AI conversation engine completed`
- Tag: `v0.4.0`

## Explicitly deferred to later stages

- Grammar correction (Stage 5) — this stage's AI replies are conversational only, not corrective.
- Vocabulary notebook integration into the difficulty heuristic (Stage 6).
- IELTS/TOEFL/TOEIC/Storytelling/Teacher-mode scenario presets from the newer requirements doc (backlog, see `docs/03-roadmap.md`).
- Android streaming chat UI — Stage 4 scope per the roadmap is the desktop client; Android gets conversation UI when its own stage revisits it (tracked as a follow-up, not silently dropped).
- Swapping to the production-sized 7–8B model — a config change, deliberately not done in this dev session (see model choice above).
