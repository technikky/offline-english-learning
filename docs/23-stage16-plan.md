# Stage 16 Implementation Plan — AI conversation avatar + voice selection

## Objective

Display an AI avatar that "conducts" the free-dialogue conversation, speaking the AI's replies aloud, with the avatar's gender matching the selected voice: a **male avatar when the male voice is selected, a female avatar when the female voice is selected**.

## 1. A second (male) voice had to be vendored

The system previously had exactly one TTS voice: `en_US-lessac-medium` (female, Piper, from Stage 9). "Voice selection" didn't exist as a concept anywhere. So the first real piece of work was vendoring a male voice — `en_US-ryan-medium` (male, Piper, `en_US`, medium quality, 22050 Hz), downloaded from the same public Piper voices repository the original female voice came from. Both `.onnx` files are ~60 MB, gitignored like every other vendored binary; `offline-sdk/ai-models/piper-voices/README.md` (now tracked — the gitignore was narrowed from ignoring the whole `piper-voices/` directory to ignoring only `*.onnx`/`*.onnx.json`, so the README survives) documents both voices and how to re-download them.

Verified the male voice is a genuinely different model, not an accidental duplicate of the female one: different MD5, and a real synthesis round-trip produced audibly different audio (male 49920 frames vs female 57856 frames for the same sentence).

## 2. AI service: multi-voice synthesis

`app/speech.py` previously loaded a single global `PiperVoice`. Now it lazily loads and caches **one voice per gender** (`_piper_voices` dict), resolving the path via `_get_piper_voice_path(voice)` — female (lessac) is the default, male (ryan) when requested, each overridable by its own env var (`PIPER_VOICE_PATH` / `PIPER_VOICE_PATH_MALE`). Both fit in memory alongside the LLM. `synthesize_speech(text, voice)` and the `/v1/speech/synthesize` schema/route gained a `voice: "male" | "female"` field (defaulting to female, so every pre-existing caller keeps working unchanged).

## 3. Backend: forward the voice

`SynthesizeRequest` (shared types) gained an optional `voice?: VoiceGender`. The `/speech/synthesize` route normalizes it (anything that isn't exactly `"male"` falls back to `"female"`) and forwards it through `aiSpeechClient.synthesize(text, voice)`. No new route, no schema table — voice is a per-request parameter, not stored state.

## 4. Desktop: avatar, voice selector, and auto-speak

- **Voice selector** (`#voiceSelect`, female/male) and a **"Speak replies aloud"** toggle (`#autoSpeakToggle`, on by default) added to the conversation sidebar.
- **AI avatar** shown at the top of the conversation panel: two inline SVGs (`AVATAR_SVGS.male` / `.female`) — inline, not image files, since the app is fully offline and self-contained. Each SVG has an `.avatar-mouth` element the CSS animates. Changing the voice selector instantly swaps the avatar and its caption ("Your AI partner (male/female voice)").
- **The avatar "conducts" the conversation**: after each AI reply finishes streaming, `speakAsAvatar(replyText)` synthesizes it in the selected voice and plays it, adding a `.speaking` CSS class that bobs the avatar and animates its mouth for exactly the duration of playback (`playBase64Wav` now resolves on the audio's `ended` event). If the "Speak replies aloud" toggle is off, this is a silent no-op — the text reply is unaffected.
- The male/female voice choice was also threaded into the two other existing "Listen" buttons (pronunciation practice, reading passage) for system-wide consistency, so one setting controls all TTS.

**Scope note — why the avatar shows for all conversation scenarios, not only literal "Free Talk":** the request said "during free dialogue." The conversation module *is* the free-dialogue feature (all 21 scenarios are open-ended spoken practice sharing one UI). Restricting the avatar to only the `free_talk` scenario would be an arbitrary, worse experience, so the avatar appears whenever a conversation is active. This is called out rather than silently interpreted.

## Testing / verification procedure

1. AI service: `tests/test_voice_selection.py` (4 cases) — female is the default, male resolves to ryan, unknown gender falls back to female, env vars override. Plus a real synthesis round-trip confirming both voices load and produce distinct audio. Full AI-service suite: 28/28.
2. Backend: `routes/speech.test.ts` gained 2 cases — the selected voice (male) is forwarded to the speech client, and an unknown voice value falls back to female (the default case is also now asserted). Full backend suite passes.
3. **Real end-to-end verification** through the actual desktop UI with the full stack (backend + AI service + LanguageTool) running:
   - Confirmed the female avatar renders by default and the male avatar (distinct SVG + caption) appears the instant the voice selector is switched to male, and back.
   - Confirmed the full backend→AI voice path produces distinct real audio per gender (female 143 KB vs male 122 KB base64 for the same sentence).
   - Confirmed `speakAsAvatar` fires a `/speech/synthesize` call carrying the correct `voice` param (`"male"` when male selected, `"female"` when female selected — captured the actual request bodies), applies the `.speaking` animation class during playback, and removes it when playback ends.
   - **Known preview-only limitation**: the in-app preview browser doesn't consume the conversation route's *hijacked streaming NDJSON* response body, so the auto-speak-after-a-live-reply couldn't be watched fire in the preview browser specifically. The streaming conversation path itself is verified working via curl (Stage 13) and runs in the real Electron Chromium normally; the avatar-speak function it calls is directly verified above. This is the same class of environment limitation as the long-standing "can't screenshot the live Electron window" note.

## Documentation update

This file, `piper-voices/README.md`, `apps/ai-service/README.md` (voice config), `CHANGELOG.md`/`README.md`.

## Git commit information

- Commit message: `Stage 16: AI conversation avatar with male/female voice selection`
- Tag: `v1.4.0`

## Explicitly deferred

- Lip-sync to actual phonemes / a talking-head video avatar — the current mouth animation is a simple time-based bob for the duration of speech, not phoneme-accurate; a richer avatar (e.g. viseme-driven) is a large, separate effort with little pedagogical payoff at this stage.
- More than two voices / accent selection — Piper has many voices; the feature models gender (male/female) because that's what was asked. Adding more is purely additive (drop in another `.onnx`, extend the `VoiceGender` type and `AVATAR_SVGS` map).
- Per-user default voice preference persisted server-side — currently the selection is a per-session UI choice, not saved to the user's profile.
