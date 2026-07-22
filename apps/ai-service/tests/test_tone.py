"""Stage 30: Mandarin tone scoring.

These use synthetic signals with a *known* pitch trajectory, so the DSP is
verified deterministically without loading Whisper or Piper. Each test pins one
of the claims the scorer makes.
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.tone import (
    compare_contours,
    dtw_mean_distance,
    extract_pitch_contour,
    score_from_distance,
    to_semitones,
)

SR = 16000


def synth(f0_start: float, f0_end: float, seconds: float = 0.8, sr: int = SR) -> np.ndarray:
    """A voiced-sounding tone gliding from f0_start to f0_end.

    Harmonics are included so autocorrelation behaves like it does on speech.
    """
    n = int(sr * seconds)
    t_f0 = np.linspace(f0_start, f0_end, n)
    phase = 2 * np.pi * np.cumsum(t_f0) / sr
    return 0.6 * np.sin(phase) + 0.3 * np.sin(2 * phase) + 0.1 * np.sin(3 * phase)


def test_extracts_a_steady_pitch_accurately():
    contour = extract_pitch_contour(synth(200, 200), SR)
    voiced = contour[contour > 0]
    assert len(voiced) > 10
    assert abs(float(np.median(voiced)) - 200.0) < 5.0


def test_tracks_a_rising_pitch():
    contour = extract_pitch_contour(synth(120, 240), SR)
    voiced = contour[contour > 0]
    first, last = voiced[: len(voiced) // 4], voiced[-len(voiced) // 4 :]
    assert float(np.median(last)) > float(np.median(first)) * 1.5


def test_silence_yields_no_voiced_frames():
    contour = extract_pitch_contour(np.zeros(SR), SR)
    assert len(contour[contour > 0]) == 0


def test_semitone_normalisation_removes_absolute_pitch():
    # The same melody an octave apart must normalise to the same semitones --
    # this is what makes a male learner comparable to the female TTS voice.
    low = to_semitones(extract_pitch_contour(synth(110, 220), SR))
    high = to_semitones(extract_pitch_contour(synth(220, 440), SR))
    assert len(low) > 10 and len(high) > 10
    assert abs(float(np.mean(low)) - float(np.mean(high))) < 1.0


def test_dtw_of_identical_sequences_is_zero():
    a = np.array([0.0, 1.0, 2.0, 3.0])
    assert dtw_mean_distance(a, a.copy()) == 0.0


def test_dtw_handles_different_lengths():
    a = np.array([0.0, 1.0, 2.0, 3.0])
    slow = np.array([0.0, 0.0, 1.0, 1.0, 2.0, 2.0, 3.0, 3.0])
    assert dtw_mean_distance(a, slow) < 0.2


def test_score_mapping_is_monotonic_and_bounded():
    assert score_from_distance(0.0) == 100
    assert score_from_distance(1.0) == 100
    assert 0 < score_from_distance(4.0) < 100
    assert score_from_distance(20.0) == 0
    assert score_from_distance(float("inf")) == 0


def test_matching_contours_score_high():
    learner = extract_pitch_contour(synth(120, 240), SR)
    reference = extract_pitch_contour(synth(120, 240), SR)
    result = compare_contours(learner, reference)
    assert result["confident"] is True
    assert result["toneScore"] >= 85


def test_opposite_contours_score_low():
    rising = extract_pitch_contour(synth(120, 260), SR)
    falling = extract_pitch_contour(synth(260, 120), SR)
    result = compare_contours(rising, falling)
    assert result["confident"] is True
    assert result["toneScore"] < 60, "a rising tone said as a falling tone must be penalised"


def test_a_male_learner_matching_a_female_reference_still_scores_high():
    # Same shape, one octave lower -- the core fairness claim of the scorer.
    learner = extract_pitch_contour(synth(110, 220), SR)
    reference = extract_pitch_contour(synth(220, 440), SR)
    result = compare_contours(learner, reference)
    assert result["toneScore"] >= 85


def test_a_slower_learner_still_scores_high():
    # Same melody, spoken more slowly -- DTW should absorb the rate difference.
    learner = extract_pitch_contour(synth(120, 240, seconds=1.4), SR)
    reference = extract_pitch_contour(synth(120, 240, seconds=0.7), SR)
    result = compare_contours(learner, reference)
    assert result["toneScore"] >= 85


def test_too_little_voiced_audio_is_reported_as_not_confident():
    # A silent recording is a microphone problem, not a tone mistake, so it must
    # not be reported as "0% tone accuracy".
    reference = extract_pitch_contour(synth(120, 240), SR)
    result = compare_contours(np.zeros(50), reference)
    assert result["confident"] is False
    assert "couldn't hear enough" in result["feedback"].lower()
