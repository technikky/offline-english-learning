# Stage 29 Implementation Plan — Chinese speech (listening + pronunciation)

## Objective

Complete the Chinese language support started in Stage 28 by unblocking the two things that genuinely required new vendored models: **Chinese listening** and **Chinese speech input** (pronunciation practice / voice conversation). With this stage, Chinese is a full four-skill language on the platform rather than read-and-type only.

## Vendored assets (approved and downloaded)

| File | Size | Source | Why |
|---|---|---|---|
| `whisper-models/ggml-small.bin` | 466 MB | `ggerganov/whisper.cpp` (Hugging Face) | The bundled `ggml-tiny.en` is **English-only** and cannot transcribe Chinese at all. `small` is multilingual. |
| `piper-voices/zh_CN-huayan-medium.onnx` (+ `.onnx.json`) | 61 MB | `rhasspy/piper-voices` (Hugging Face) | The only bundled voices were `en_US`; Chinese TTS needs a Mandarin voice. |

Both are **gitignored** like every other vendored model, and both READMEs now document the exact restore commands so an offline install can rebuild them. `small` was chosen over `base` because tone accuracy matters far more for Mandarin ASR than for English.

## Design decisions

### English pays nothing

Whisper models are cached **per language and loaded lazily**: English keeps using the small, fast `tiny.en` it always has, and the 466 MB multilingual model is only loaded if someone actually speaks Chinese. The English model is even constructed exactly as before (no `language` argument) so its behaviour is bit-for-bit unchanged; only the Chinese path pins `language="zh"`, which stops the multilingual model mis-detecting short utterances. Model names are overridable via `WHISPER_MODEL` / `WHISPER_MODEL_MULTILINGUAL`.

Piper voices are cached per key, with Chinese keyed separately — only one Mandarin voice is vendored, so the male/female avatar choice does not apply to Chinese speech.

### Two latent bugs this stage had to fix

Adding Chinese exposed two places where the existing code was silently English-only. Both would have made Chinese *appear* to work while always producing wrong results:

1. **Scoring always returned 0 for Chinese.** `normalizeWords()` strips everything outside `[a-z0-9'\s]`, so every Chinese character was discarded and the token list came out empty — meaning pronunciation scoring and listening dictation would score a *perfect* Chinese answer as 0. Fixed with a language-aware `normalizeTokens()`: English keeps word tokens; Chinese is compared **character by character**, which is also the correct granularity (one hanzi ≈ one syllable/morpheme). Punctuation is excluded from Chinese tokens, so the half-width/full-width comma differences Whisper produces don't penalise a learner.
2. **Dictation saw a whole clip as one sentence.** `splitIntoSentences()` split on a terminator *followed by whitespace*; Chinese uses full-width `。！？` and no spaces. Now split directly after Chinese terminators as well. English behaviour is unchanged because those characters never occur in English text.

### Content

`chinese/clips.ts` adds three curated Mandarin listening scripts (A1 自我介绍, A2 问路, B1 春节), synthesized on demand by the new voice, with AI-generated comprehension questions cached exactly like the English clips. They are appended as `listening` lessons to the first three Chinese course units.

## Architecture changes

- **AI service**: `speech.py` gained per-language Whisper model and Piper voice resolution; `transcribe_audio(...)` and `synthesize_speech(...)` take a language; `TranscribeRequest`/`SynthesizeRequest` gained `targetLanguage`.
- **Backend**: `aiSpeechClient` forwards `targetLanguage`; `/speech/*` and listening dictation derive it **server-side** from the authenticated user, so no client change was needed to make speech follow the learner's language.
- **Content catalogs**: `listListeningClips(language)`; `getListeningClip` searches both catalogs (ids stay globally unique, per the Stage 28 rule).
- **Desktop**: switching language now also reloads listening clips.

## Testing procedure

- **Real model round-trip** (the verification that matters): synthesized `你好，我叫李明。我是学生。` with the new Piper voice → 2.37 s WAV @ 22050 Hz → transcribed back with multilingual Whisper → `你好,我叫李明,我是学生。`, **100% hanzi overlap**. Both new assets provably work end to end.
- **English regression**: both English voices still synthesize and `tiny.en` still transcribes correctly.
- **Backend** (`speech/chineseSimilarity.test.ts`, 8): documents that the English tokenizer discards Chinese; Chinese tokenizes per character; English tokenization unchanged; an identical Chinese utterance scores 100 (not 0); scoring degrades sensibly; pronunciation scoring returns a real score — and explicitly asserts the *old* behaviour (0) when the language argument is omitted; Chinese and English sentence splitting.
- **AI service** (`tests/test_speech_language.py`, 6): English keeps `tiny.en` (including via the default argument), Chinese selects the multilingual model, unknown languages fall back to English, English voices still vary by gender, Chinese ignores gender — plus a guard asserting the vendored files are actually present on disk, so a broken install fails loudly.
- Full suites: **backend 147 tests passing** (+8), **AI service 59 pytest passing** (+6); backend `tsc` clean; types build clean; `renderer.js` passes `node --check`.

## Still outstanding for Chinese

Chinese writing prompts and quiz categories (still English-specific), an HSK vocabulary seed, CJK font bundling (renders fine on Windows via system fonts), UI translation, and HSK 5–6 content. Tone-contour pronunciation scoring — comparing pitch shape rather than characters — remains the real upgrade for Mandarin pronunciation, and is a larger piece of work.

## Git

- Commit: `Stage 29: Chinese speech (listening + pronunciation)`
- Tag: `v1.17.0`
- CHANGELOG entry added.
