"""Tests for the Stage 16 male/female voice-path resolution in app/speech.py.
Doesn't load the actual Piper models -- only checks path selection."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import speech


def test_female_is_the_default_voice():
    default_path = speech._get_piper_voice_path()
    assert default_path.endswith("en_US-lessac-medium.onnx")
    assert default_path == speech._get_piper_voice_path("female")


def test_male_voice_resolves_to_ryan():
    assert speech._get_piper_voice_path("male").endswith("en_US-ryan-medium.onnx")


def test_unknown_voice_falls_back_to_female():
    assert speech._get_piper_voice_path("nonbinary-robot") == speech._get_piper_voice_path("female")


def test_env_var_overrides(monkeypatch):
    monkeypatch.setenv("PIPER_VOICE_PATH_MALE", "/custom/male.onnx")
    monkeypatch.setenv("PIPER_VOICE_PATH", "/custom/female.onnx")
    assert speech._get_piper_voice_path("male") == "/custom/male.onnx"
    assert speech._get_piper_voice_path("female") == "/custom/female.onnx"
