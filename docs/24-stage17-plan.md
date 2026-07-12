# Stage 17 Implementation Plan — Listening Module

## Objective

Add a complete listening-practice module: audio clips at CEFR levels, playback controls (speed, loop), comprehension questions, and dictation practice, with progress tracking — fully offline.

## 1. Design decision: TTS-generated audio, not uploaded audio files

The master brief lists teacher-uploaded MP3/WAV/FLAC/OGG/AAC as one vision for listening material. Doing that fully offline is a real problem: it needs audio storage, and decoding MP3/FLAC/OGG/AAC requires codecs the project doesn't bundle (and some carry licensing constraints). Instead, the module reuses what the system already has: **a listening "clip" is a curated text script whose audio is synthesized on the client via the existing Piper TTS** (`/speech/synthesize`, Stage 9) — which also means the Stage 16 male/female voice selection applies to listening for free. This is fully offline, needs no codecs or file storage, and lets the same script drive comprehension, dictation, and audio from one source of truth. Teacher-uploaded audio files are documented as deferred rather than silently dropped.

## 2. Heavy reuse (the "avoid duplicated AI implementations" principle)

- **Comprehension generation**: reuses the reading module's `aiReadingClient.generateComprehension(text, cefr)` unchanged — it's a generic (text → summary + vocabulary + 4 questions) generator, not reading-specific. The naming is slightly reading-flavored; a full rename to a neutral `aiComprehensionClient` was skipped to avoid churning Stage 15's tests, with this note as the record of the compromise. Listening caches the result in its own `listening_comprehension_cache` table (same consistent-per-clip caching rationale as reading).
- **Dictation scoring**: the word-level Levenshtein similarity that powered pronunciation scoring (Stage 9) was extracted into a shared `speech/textSimilarity.ts` (`scoreTextSimilarity`), now used by both `scorePronunciation` and listening dictation — one implementation, two callers, instead of a copy.
- **Audio playback + voice**: `/speech/synthesize` reused directly; no new AI-service endpoint.

## 3. Backend

- `listening/clips.ts` — 4 curated scripts (A1–B2), each with a transcript and an `estimatedSeconds` guide; `splitIntoSentences()` for dictation.
- `listening_comprehension_cache` + `listening_results` tables (mirroring reading's two).
- Routes: `GET /listening/clips`, `GET /listening/clips/:id` (lazy-generates + caches comprehension, returns transcript + sentences + questions), `POST /listening/clips/:id/submit` (scores comprehension, persists), `POST /listening/dictation/check` (scores one typed sentence, not persisted — it's practice), `GET /listening/progress`.

## 4. Desktop UI

New "🎧 Listening" tab (fourth in the row). Clip cards with progress bars. Clip detail has three panels:
- **Audio**: Play button, a speed selector (0.75x–1.5x, via `audio.playbackRate`), a loop toggle (`audio.loop`), and a hidden-by-default "Show transcript" (listen first, reveal only if needed).
- **Comprehension check**: radio-button questions, submit → score.
- **Dictation practice**: play one sentence at a time (its own TTS), type what you hear, "Check" (word-level accuracy + the correct sentence revealed), "Next sentence".

## Testing / verification

1. Backend: `routes/listening.test.ts` (6 cases — clip list hides transcript, detail returns transcript/sentences/questions and caches (no second AI call on repeat), 404, comprehension scoring + progress, dictation similarity, auth) and `speech/textSimilarity.test.ts` (4 cases). Full backend suite: 76/76 passing. The pronunciation-scoring refactor is behavior-preserving (its 5 tests still pass).
2. AI service: unchanged (listening reuses the existing reading comprehension endpoint) — 28 pytest tests still pass.
3. **Real end-to-end** through the actual UI + live stack: opened the Listening tab (all 4 clips render with progress), opened "A Morning Routine" (real AI comprehension generated + cached: 4 questions, 7 dictation sentences), confirmed full-clip Play and per-sentence dictation Play each synthesize the exact expected text (200 OK), dictation scored a typed attempt at 88% with the correct sentence revealed, speed/loop controls present, and (via curl) comprehension submit scored 100% (4/4) with progress updated to best-score 100.
   - Note: the in-app preview browser aggressively caches `index.html`; loading the new markup required serving from a fresh port. Same preview-environment quirk noted in prior stages, not a code issue.

## Git commit information

- Commit message: `Stage 17: Listening module completed`
- Tag: `v1.5.0`

## Explicitly deferred

- Teacher-uploaded audio files (MP3/FLAC/OGG/AAC) — needs codec/storage infrastructure that conflicts with the offline constraint; the TTS-from-script approach covers the pedagogy without it. A teacher could add a clip today by adding a script to `clips.ts`; a teacher-facing script upload UI is the natural next step if desired.
- Shadowing mode (repeat-after-the-speaker with recording) — a natural combination of the existing dictation audio + the pronunciation recorder, deferred to keep this stage focused.
