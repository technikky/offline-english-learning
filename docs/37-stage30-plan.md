# Stage 30 Implementation Plan — Mandarin tone scoring

## Objective

Close the biggest remaining quality gap in Chinese pronunciation. Until now, pronunciation was scored by comparing the **transcript** to the target text. In Mandarin that is not pronunciation scoring at all: if a learner says 妈 (mā, high level) with a falling tone and Whisper still transcribes 妈, they score 100% while being clearly wrong to a native ear. **Tone is the phoneme in Mandarin**, so it has to be scored from the audio.

## Approach: compare pitch contours against the voice we already ship

The reference contour is obtained by **synthesizing the same phrase with the vendored Mandarin Piper voice**. This is the key idea — it needs no extra model and no annotated tone corpus, because the TTS voice we already bundle *is* the native model to imitate.

Three normalisations make the comparison fair:

1. **Semitones relative to the speaker's own median pitch.** A male learner at ~110 Hz and the female TTS voice at ~210 Hz have completely different absolute pitch but the same tone *shape*. Comparing raw Hz would score every male learner near zero.
2. **Dynamic time warping.** Learners speak slower or faster than the TTS, so contours are aligned rather than compared frame-by-frame.
3. **Voiced frames only.** Silence and unvoiced consonants carry no pitch.

### Implemented in pure numpy — no new vendored wheels

The venv has numpy but no scipy/librosa/torch. Rather than adding hundreds of megabytes to the offline SDK for one feature, pitch detection (autocorrelation with a voicing threshold) and DTW are implemented directly in numpy — about 150 lines in `app/tone.py`, fully unit-tested.

## The first version did not work, and how it was fixed

The initial implementation (plain DTW on the raw semitone contour, score mapped over a 1–7 semitone range) produced **useless discrimination** when tested on real audio:

| case | first version | after fix |
|---|---|---|
| identical utterance | 100 | 100 |
| one syllable's tone wrong (买 mǎi → 卖 mài) | **97** | **39** |
| severe tone contrast (妈 mā vs 马 mǎ) | — | 0 |
| completely different phrase | 86 | 13 |

Everything scored high, so the feedback would have been worthless. Two real defects:

1. **Unconstrained DTW can warp a rising contour onto a falling one**, stretching the alignment until the distance is small. Fixed with a **Sakoe-Chiba band** (`DTW_BAND_FRACTION = 0.2`) limiting how far the path may stray from the diagonal.
2. **The score mapping was calibrated on synthetic sine glides**, whose distances are far larger than real speech ever produces. Real contours are compressed, so the useful range was squashed at the top.

A third change did most of the discriminating work: **including the frame-to-frame pitch slope as a second, weighted feature** (`DELTA_WEIGHT = 4.0`). Tone is carried more by the *direction* of pitch movement than by absolute height, so DTW now runs over `[semitone, Δsemitone × 4]`.

The score mapping was then **recalibrated against measured distances** between real synthesized phrases (identical ≈ 0.8, one wrong tone ≈ 1.7–4.1, wrong phrase ≈ 4.3–5.3, severe tone contrast ≈ 7.1–8.4), giving `PERFECT_DISTANCE = 1.0`, `ZERO_DISTANCE = 6.0`.

## Score stability

Piper synthesis is not bit-identical between runs, and the metric is sensitive enough that this moved scores noticeably. Since "I said it the same way and got a different score" destroys trust in the feedback, **reference contours are cached per phrase** (bounded at 256 entries). Verified: the same recording scored three times now returns exactly the same score. This also saves a ~1 s synthesis per attempt.

## Honest limitations

- **Calibration is based on synthesized reference pairs**, not real learner recordings. A real human saying it correctly is noisier than TTS, so the thresholds should be re-tuned once classroom recordings exist. This is documented in the constants themselves.
- **Scoring is whole-phrase, not per-syllable.** One wrong tone in a three-syllable phrase is diluted by the two correct ones. Per-syllable tone identification would need forced alignment of characters to audio — a substantially bigger piece of work.
- **Tone is reported alongside, not merged into, the accuracy score**, so a student can see which of the two they missed rather than getting one blended number.
- A recording with too little voiced audio returns `confident: false` with a "record again" message, and is **not stored as a score** — a silent microphone is a recording problem, not a 0% tone attempt.

## Architecture changes

- **AI service**: new `app/tone.py` (pitch extraction, semitone normalisation, banded DTW, scoring); `score_tone()` in `speech.py` with a bounded reference-contour cache; new `POST /v1/speech/tone`.
- **Backend**: `aiSpeechClient.scoreTone()`; `/pronunciation/practice` requests tone **only for Chinese** and treats failure as non-fatal (the transcript-based score still returns); new nullable `pronunciation_results.tone_score` (additive migration).
- **Desktop**: the pronunciation result panel shows a separate "Tone: N%" block with its own feedback when present.

## Testing procedure

- **DSP unit tests** (`tests/test_tone.py`, 12) on synthetic signals with a known pitch trajectory — deterministic, no models. They pin each claim: steady pitch is measured accurately; a rising glide is tracked; silence yields no voiced frames; **an octave-shifted melody normalises to the same semitones** (the male-learner-vs-female-reference fairness claim); DTW is zero for identical sequences and tolerant of different lengths; the score mapping is monotonic and bounded; matching contours score ≥85; **opposite contours score <60**; a male learner and a slower learner both still score ≥85; too little voiced audio reports `confident: false`.
- **Real-audio verification** (the check that actually caught the bug): synthesized Mandarin minimal pairs and scored them — correct 100, one wrong tone 39, severe tone contrast 0, wrong phrase 13.
- **Stability**: the same recording scored three times returns an identical score.
- **Backend route tests** (`routes/speech.test.ts`, +4): English does **not** request tone scoring; Chinese returns and persists it; a low-confidence result is stored as `null` rather than 0; and an AI-service failure still returns a 200 with the transcript-based score.
- Full suites: **backend 151 tests passing** (+4), **AI service 71 pytest passing** (+12); backend `tsc` clean; types build clean; `renderer.js` passes `node --check`.

## Git

- Commit: `Stage 30: Mandarin tone scoring`
- Tag: `v1.18.0`
- CHANGELOG entry added.
