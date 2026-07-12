# Stage 21 Implementation Plan — Hands-free voice conversation mode

## Objective

When a topic is selected and **Start conversation** is pressed, the student can talk to the AI partner in **two modes**:

- **Text mode** (unchanged): type a message and press Send.
- **Voice mode** (new): a real-time, back-and-forth spoken conversation with **no Send button** — the app listens, detects when the student stops speaking, transcribes, sends, and speaks the reply, then automatically starts listening again. This mimics a natural human conversation and is fully hands-free.

## 1. Reuse, don't rebuild

Everything the voice loop needs already existed from earlier stages:

- **STT** — `POST /speech/transcribe` (Whisper) from Stage 9, plus the `audioBufferToWav` / `arrayBufferToBase64` renderer helpers.
- **TTS** — `speakAsAvatar(text)` from Stage 16 (Piper, male/female voice selectable), with the animated avatar.
- **Chat** — the existing streaming `sendMessage` flow.

Stage 21 is therefore almost entirely a **desktop-renderer** feature: a voice-activity-detection (VAD) state machine that orchestrates those pieces. No backend or AI-service changes were required.

## 2. The voice-mode state machine

A single `voiceMode` controller object drives a `setInterval` tick (60 ms). States:

- **`listening`** — mic is open; each tick computes the RMS of the mic signal (Web Audio `AnalyserNode` + `getByteTimeDomainData`). Speech is considered *started* once RMS crosses `VAD_RMS_THRESHOLD` (0.045) for at least `VAD_MIN_SPEECH_MS` (400 ms), and *ended* once the signal stays below the threshold for `VAD_SILENCE_MS` (1200 ms) of trailing silence.
- **`processing`** — on end-of-speech the recorded utterance is decoded → WAV → base64 → transcribed → sent as a chat message. During this state the mic is ignored so the pipeline isn't re-triggered by room noise.
- **`speaking`** — the AI reply is spoken via `speakAsAvatar(..., force=true)`. The mic is still ignored here, which is the key trick: **the AI's own voice is never recorded** as if it were the student.
- Back to **`listening`** (`resumeListening`) once the reply finishes, closing the loop.

To make voice mode reuse the normal send path, `sendMessage` was refactored to delegate to `sendMessageContent(content, { forceSpeak })`, which returns the reply text; `finishUtterance` calls the same function so text and voice share one code path.

## 3. UI

- A **Voice mode** toggle button + status line (`#voiceModeBar` / `#voiceModeBtn` / `#voiceModeStatus`) in the composer. Toggling on requests mic permission and starts the loop; toggling off (or leaving the conversation / logging out) calls `stopVoiceMode`, which stops the interval, the recorder, and releases the mic stream.
- The status line reflects the current state ("Listening…", "Thinking…", "Speaking…") so the hands-free user can follow the turn-taking without touching the keyboard.

## 4. Verification & known limitation

- The build compiles and the non-voice chat path (shared `sendMessageContent`) is exercised by the existing conversation flow.
- **Live mic-driven turn-taking cannot be automated** — the headless/automated browser has no microphone, so the VAD loop can't be driven in CI. This is an inherent limitation of the test environment, not a defect. The loop was validated by construction (state transitions, mic gating during `processing`/`speaking`) and is exercised manually in the Electron app.
