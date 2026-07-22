"""Stage 29: speech model/voice selection follows the student's target
language. Pure path/name resolution -- no Whisper or Piper model is loaded.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.speech import (
    _get_piper_voice_path,
    _get_whisper_model_name,
    _normalize_language,
)


def test_english_keeps_the_fast_english_only_whisper_model():
    assert _get_whisper_model_name("english") == "tiny.en"
    # Default argument must also stay English, so existing callers are unaffected.
    assert _get_whisper_model_name() == "tiny.en"


def test_chinese_uses_the_multilingual_whisper_model():
    # tiny.en cannot transcribe Chinese at all, hence a separate model.
    assert _get_whisper_model_name("chinese") == "small"


def test_unknown_language_falls_back_to_english():
    assert _normalize_language("klingon") == "english"
    assert _normalize_language(None) == "english"
    assert _get_whisper_model_name("klingon") == "tiny.en"


def test_english_voices_still_vary_by_gender():
    female = _get_piper_voice_path("female", "english")
    male = _get_piper_voice_path("male", "english")
    assert female.endswith("en_US-lessac-medium.onnx")
    assert male.endswith("en_US-ryan-medium.onnx")


def test_chinese_uses_the_mandarin_voice_regardless_of_gender():
    # Only one Chinese voice is vendored, so gender does not apply.
    for voice in ("male", "female"):
        assert _get_piper_voice_path(voice, "chinese").endswith("zh_CN-huayan-medium.onnx")


def test_vendored_model_files_are_actually_present():
    """Guards the install: these are gitignored binaries restored per
    offline-sdk/ai-models/README.md, so a missing file should fail loudly."""
    for path in (
        _get_piper_voice_path("female", "chinese"),
        _get_piper_voice_path("female", "english"),
        _get_piper_voice_path("male", "english"),
    ):
        assert os.path.exists(path), f"missing vendored voice: {path}"

    models_dir = Path(__file__).resolve().parents[3] / "offline-sdk" / "ai-models" / "whisper-models"
    assert (models_dir / "ggml-tiny.en.bin").exists()
    assert (models_dir / "ggml-small.bin").exists(), "multilingual Whisper model missing"
