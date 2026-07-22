"""Stage 30: Mandarin tone scoring by pitch-contour comparison.

Why this exists: pronunciation scoring until now compared *characters* — if a
learner said 妈 (mā) with a falling tone and Whisper still transcribed 妈, they
scored 100% despite being clearly wrong to a native ear. Tone IS the phoneme in
Mandarin, so it has to be scored from the audio, not the transcript.

Approach: extract the learner's fundamental-frequency (F0) contour and compare
its *shape* against a reference contour, which we get for free by synthesizing
the same phrase with the vendored Mandarin Piper voice.

Three normalisations make that comparison fair:
  1. **Semitones relative to the speaker's own median pitch** — a male learner
     at ~110 Hz and the female TTS voice at ~210 Hz have completely different
     absolute pitch, but the same tone *shape*. Comparing raw Hz would score
     every male learner near zero.
  2. **Dynamic time warping** — learners speak slower or faster than the TTS,
     so the contours are aligned rather than compared frame-to-frame.
  3. **Voiced frames only** — silence and consonants carry no pitch.

Implemented in pure numpy (already a dependency) rather than pulling in
librosa/torch/scipy, which would add hundreds of megabytes to the vendored
offline SDK for one feature.
"""
from __future__ import annotations

import numpy as np

# Human speech F0 bounds. Wide enough for a low male voice up to a child's.
F0_MIN_HZ = 70.0
F0_MAX_HZ = 400.0

FRAME_SECONDS = 0.040
HOP_SECONDS = 0.010

# Autocorrelation peak / zero-lag ratio below which a frame is called unvoiced.
VOICING_THRESHOLD = 0.30
# Frames quieter than this fraction of the clip's peak RMS are treated as silence.
SILENCE_RMS_RATIO = 0.10

# Below this many voiced frames we refuse to score rather than emit a bogus number.
MIN_VOICED_FRAMES = 8


def _frame_f0(frame: np.ndarray, sample_rate: int) -> float:
    """Estimates F0 for one frame by normalized autocorrelation.

    Returns 0.0 for unvoiced/silent frames.
    """
    frame = frame - frame.mean()
    energy = float(np.sqrt(np.mean(frame**2)))
    if energy <= 0.0:
        return 0.0

    corr = np.correlate(frame, frame, mode="full")[len(frame) - 1 :]
    zero_lag = corr[0]
    if zero_lag <= 0:
        return 0.0

    min_lag = max(1, int(sample_rate / F0_MAX_HZ))
    max_lag = min(len(corr) - 1, int(sample_rate / F0_MIN_HZ))
    if max_lag <= min_lag:
        return 0.0

    window = corr[min_lag : max_lag + 1]
    peak_index = int(np.argmax(window))
    peak_lag = min_lag + peak_index
    if corr[peak_lag] / zero_lag < VOICING_THRESHOLD:
        return 0.0

    return float(sample_rate) / float(peak_lag)


def extract_pitch_contour(samples: np.ndarray, sample_rate: int) -> np.ndarray:
    """Frame-wise F0 in Hz. Unvoiced/silent frames are 0.0."""
    samples = np.asarray(samples, dtype=np.float64)
    frame_length = int(FRAME_SECONDS * sample_rate)
    hop_length = int(HOP_SECONDS * sample_rate)
    if frame_length <= 0 or hop_length <= 0 or len(samples) < frame_length:
        return np.zeros(0)

    starts = range(0, len(samples) - frame_length + 1, hop_length)
    frames = [samples[s : s + frame_length] for s in starts]
    if not frames:
        return np.zeros(0)

    rms = np.array([np.sqrt(np.mean(f**2)) for f in frames])
    peak_rms = rms.max() if len(rms) else 0.0
    silence_floor = peak_rms * SILENCE_RMS_RATIO

    contour = np.zeros(len(frames))
    for i, frame in enumerate(frames):
        if rms[i] < silence_floor:
            continue
        contour[i] = _frame_f0(frame, sample_rate)
    return contour


def to_semitones(contour: np.ndarray) -> np.ndarray:
    """Voiced frames converted to semitones relative to the speaker's own median.

    This is what makes a male learner comparable to the female reference voice:
    it removes absolute pitch, keeping only the shape of the melody.
    """
    voiced = contour[contour > 0]
    if len(voiced) == 0:
        return np.zeros(0)
    median = float(np.median(voiced))
    if median <= 0:
        return np.zeros(0)
    return 12.0 * np.log2(voiced / median)


# How far the DTW path may stray from the diagonal, as a fraction of the longer
# sequence (a Sakoe-Chiba band). Without this, unconstrained warping can stretch
# a rising contour onto a falling one and report a deceptively small distance --
# which is exactly what made the first version of this scorer unable to tell a
# tone error from a correct utterance.
DTW_BAND_FRACTION = 0.2

# Tone is carried more by the *direction* of pitch movement than by absolute
# height, so the frame-to-frame slope is included as a second feature and
# weighted up. This is what actually separates a rising from a falling tone.
DELTA_WEIGHT = 4.0


def contour_features(semitones: np.ndarray) -> np.ndarray:
    """Per-frame features: pitch height plus weighted pitch slope."""
    semitones = np.asarray(semitones, dtype=np.float64)
    if semitones.ndim != 1 or len(semitones) == 0:
        return np.zeros((0, 2))
    delta = np.diff(semitones, prepend=semitones[0])
    return np.column_stack([semitones, delta * DELTA_WEIGHT])


def dtw_mean_distance(
    a: np.ndarray, b: np.ndarray, band_fraction: float = DTW_BAND_FRACTION
) -> float:
    """Mean per-step distance along the optimal band-constrained DTW alignment.

    Accepts 1-D sequences or 2-D feature matrices (frames x features).
    Dividing the total cost by the path length keeps the result independent of
    utterance length, so a long phrase isn't penalised versus a short one.
    """
    a = np.asarray(a, dtype=np.float64)
    b = np.asarray(b, dtype=np.float64)
    if a.ndim == 1:
        a = a.reshape(-1, 1)
    if b.ndim == 1:
        b = b.reshape(-1, 1)
    if len(a) == 0 or len(b) == 0:
        return float("inf")

    n, m = len(a), len(b)
    band = max(1, int(round(band_fraction * max(n, m))))

    cost = np.full((n + 1, m + 1), np.inf)
    steps = np.zeros((n + 1, m + 1))
    cost[0, 0] = 0.0

    for i in range(1, n + 1):
        # Only evaluate cells within the band around the diagonal.
        centre = int(round(i * m / n))
        lo = max(1, centre - band)
        hi = min(m, centre + band)
        local = np.linalg.norm(b[lo - 1 : hi] - a[i - 1], axis=1)
        for offset, j in enumerate(range(lo, hi + 1)):
            prev_options = (cost[i - 1, j], cost[i, j - 1], cost[i - 1, j - 1])
            best = int(np.argmin(prev_options))
            prev_cost = prev_options[best]
            if not np.isfinite(prev_cost):
                continue
            prev_steps = (steps[i - 1, j], steps[i, j - 1], steps[i - 1, j - 1])[best]
            cost[i, j] = local[offset] + prev_cost
            steps[i, j] = prev_steps + 1

    total_steps = steps[n, m]
    if total_steps <= 0 or not np.isfinite(cost[n, m]):
        return float("inf")
    return float(cost[n, m] / total_steps)


# Calibrated against measured distances between Mandarin phrases synthesized
# with the vendored voice (see docs/37-stage30-plan.md):
#   identical utterance            ~0.8
#   one syllable's tone wrong      ~1.7   (真 minimal pair 买 mǎi / 卖 mài)
#   entirely different phrase      ~4.3-4.9
#   severe tone contrast           ~7.1   (妈 mā / 马 mǎ, level vs dipping)
# NOTE: these come from synthesized reference pairs. Real learner recordings are
# noisier, so a correct human utterance will sit somewhat above the 0.8 floor --
# the thresholds should be re-tuned once real classroom recordings exist.
PERFECT_DISTANCE = 1.0
ZERO_DISTANCE = 6.0


def score_from_distance(mean_semitone_distance: float) -> int:
    """Maps mean aligned pitch deviation to a 0-100 score.

    Linear between PERFECT_DISTANCE (100) and ZERO_DISTANCE (0).
    """
    if not np.isfinite(mean_semitone_distance):
        return 0
    span = ZERO_DISTANCE - PERFECT_DISTANCE
    scaled = 1.0 - max(0.0, mean_semitone_distance - PERFECT_DISTANCE) / span
    return int(max(0, min(100, round(scaled * 100))))


def compare_contours(learner: np.ndarray, reference: np.ndarray) -> dict:
    """Scores a learner's pitch contour against a reference contour.

    Returns `confident=False` (rather than a misleading 0) when there simply
    isn't enough voiced audio to judge — a silent or noise-only recording is a
    recording problem, not a tone mistake.
    """
    learner_semitones = to_semitones(learner)
    reference_semitones = to_semitones(reference)

    if len(learner_semitones) < MIN_VOICED_FRAMES:
        return {
            "toneScore": 0,
            "confident": False,
            "learnerVoicedFrames": int(len(learner_semitones)),
            "referenceVoicedFrames": int(len(reference_semitones)),
            "meanSemitoneDistance": 0.0,
            "feedback": (
                "We couldn't hear enough voiced speech to judge your tones. "
                "Record again, a little louder and closer to the microphone."
            ),
        }

    if len(reference_semitones) < MIN_VOICED_FRAMES:
        return {
            "toneScore": 0,
            "confident": False,
            "learnerVoicedFrames": int(len(learner_semitones)),
            "referenceVoicedFrames": int(len(reference_semitones)),
            "meanSemitoneDistance": 0.0,
            "feedback": "Could not build a reference pronunciation for this phrase.",
        }

    distance = dtw_mean_distance(
        contour_features(learner_semitones), contour_features(reference_semitones)
    )
    score = score_from_distance(distance)

    if score >= 85:
        feedback = "Your tones closely matched the reference. Well done!"
    elif score >= 65:
        feedback = "Mostly good tones, with some drift. Listen again and copy the rise and fall."
    elif score >= 40:
        feedback = (
            "Your tones differed noticeably from the reference. Try exaggerating "
            "the rises and falls — in Mandarin the tone changes the meaning."
        )
    else:
        feedback = (
            "The pitch of your speech didn't follow the reference. Play the model "
            "audio, hum the melody first, then say the words with that melody."
        )

    return {
        "toneScore": score,
        "confident": True,
        "learnerVoicedFrames": int(len(learner_semitones)),
        "referenceVoicedFrames": int(len(reference_semitones)),
        "meanSemitoneDistance": round(float(distance), 3),
        "feedback": feedback,
    }
