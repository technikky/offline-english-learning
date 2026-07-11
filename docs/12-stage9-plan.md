# Stage 9 Implementation Plan — Speech recognition and pronunciation

## Objectives

1. Speech-to-text (STT) so students can speak instead of type in a conversation.
2. Text-to-speech (TTS) so students can hear correct pronunciation.
3. A pronunciation-practice mode: record → transcribe → compare against a target phrase → feedback.

## Technology: same shape as Stage 6, feasibility-checked before committing

Both `pywhispercpp` (Python bindings for whisper.cpp, matching the architecture doc's named technology exactly) and `piper-tts` (official Piper Python package) installed cleanly via **prebuilt wheels** for this Python/Windows combination — no compilation, no PyTorch pulled in (Piper depends on `onnxruntime`, already installed since Stage 6). This was verified before writing this plan, the same feasibility-first approach Stage 6 used for `fastembed`. Both models (Whisper `tiny.en`, ~77MB; Piper `en_US-lessac-medium`, ~60MB) were downloaded and load successfully.

- **STT**: `pywhispercpp`, model `tiny.en` — English-only, smallest Whisper size, appropriate for short conversational utterances and pronunciation-practice phrases on CPU-only school hardware. Larger Whisper sizes are a config change (model name), not a code change, exactly like the LLM and embedding model swaps in earlier stages.
- **TTS**: `piper-tts`, voice `en_US-lessac-medium` — a natural-sounding, medium-quality voice sized for CPU inference speed.

## AI Service additions

- `POST /v1/speech/transcribe` — body `{ audioBase64 }` (WAV, any sample rate/channel count). **Design correction made during development**: the original plan assumed the desktop client would produce exactly 16kHz WAV so the server could skip resampling — but `pywhispercpp`'s own loader hard-rejects anything that isn't already 16kHz, and browser recording APIs (`MediaRecorder`) don't reliably produce WAV at a guaranteed rate at all. Rather than push a fragile format requirement onto every client, the server resamples internally (numpy linear interpolation, mono-mixed if stereo) before handing samples to Whisper — verified via a real TTS→STT round trip through the actual HTTP endpoints, including with 22050Hz source audio. Returns `{ transcript }`.
- `POST /v1/speech/synthesize` — body `{ text }`. Returns `{ audioBase64 }` (WAV). Kept as a JSON response (not a raw audio stream) for symmetry with transcribe and because a single pronunciation-practice phrase is short enough that streaming isn't worth the added client complexity — same reasoning Stage 5/6 used for non-streaming explain endpoints.
- Both wrapped in the same `INFERENCE_LOCK` from Stage 6 — Whisper and Piper are both CPU-bound single-instance models with the same concurrency hazard that crashed the process in Stage 6.

## Backend

- `src/speech/aiSpeechClient.ts` — object-wrapped client (same pattern as `aiVocabClient`/`aiExplainClient`) for `transcribe`/`synthesize`, swappable in tests.
- `POST /speech/transcribe` and `POST /speech/synthesize` — thin proxies to the AI service, authenticated, no ownership concerns (stateless operations, nothing persisted by these alone).
- `POST /pronunciation/practice` — body `{ targetPhrase, audioBase64 }`. Transcribes the recording, computes a word-level accuracy score (normalized word-overlap ratio between the transcript and the target phrase — a v1 heuristic, not a phoneme-level pronunciation scorer, which would need a very different kind of model entirely), and returns `{ transcript, accuracyScore, feedback }`. Persists to a new `pronunciation_results` table (named directly after the original requirements' database design list) so this data is available to Stage 8's analytics aggregation later without a schema change.
- Conversation voice input reuses `POST /speech/transcribe` directly from the desktop client — recording a message and transcribing it before sending doesn't need a dedicated conversation-specific endpoint.

## Database schema addition

- `pronunciation_results`: id, student_id, target_phrase, transcript, accuracy_score, created_at.

## Desktop UI

- **Conversation view**: a mic button next to the message composer. Uses the renderer's `MediaRecorder` API to record from the default input device, sends the recording to `/speech/transcribe`, and fills the message input with the transcript for the student to review/edit before sending — voice is an input method, not a silent auto-send, so mistakes in transcription don't silently become the "sent" message.
- **New Pronunciation Practice panel** (sidebar, student view): a text field for the target phrase (free text — no curated phrase bank needed for this stage), a record button, and a "Listen" button (calls `/speech/synthesize` and plays the returned audio) so the student can hear the correct pronunciation before or after attempting it. After recording, shows the transcript, an accuracy score, and brief feedback.

## Testing procedure

1. Backend unit tests: pronunciation accuracy scoring (exact match, partial match, no match) with the AI speech client faked — same pattern as every AI-backed route in Stages 4–6.
2. Manual end-to-end: record a real short phrase through the desktop app, confirm a real Whisper transcript comes back, confirm Piper audio plays back correctly, and confirm the pronunciation-practice score reflects an intentionally-mispronounced/misspoken attempt vs. a correct one.

## Documentation update

This file, `CHANGELOG.md`/`README.md` current-stage pointer, `apps/ai-service/README.md` for the two new endpoints, `offline-sdk/ai-models/README.md` for the vendored Whisper/Piper models.

## Git commit information

- Commit message: `Stage 09: Speech recognition and pronunciation completed`
- Tag: `v0.9.0`

## Explicitly deferred to later stages

- Phoneme-level pronunciation scoring (stress/rhythm/intonation from the newer requirements doc) — a genuinely different, more specialized model/approach than word-overlap accuracy; flagged as backlog, not silently downgraded.
- A curated phrase bank / reading-practice passages (Stage 9's roadmap scope is speech recognition and pronunciation, not the separate "Reading Practice" backlog item).
- Feeding `pronunciation_results` into the Stage 8 analytics view — the schema is ready for it, but wiring it into the aggregation and UI is a follow-up once there's enough real usage data to make it worth displaying.
- Android voice input — same "Android client is a catch-up item" note carried since Stage 4.
