"""Tests for app/model.py's model-path resolution (Stage 12 admin model
management). Doesn't touch load_model()/Llama itself -- no GGUF needed."""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import model


def test_get_model_path_falls_back_to_env_var_when_no_selection_file(monkeypatch, tmp_path):
    monkeypatch.setattr(model, "MODEL_SELECTION_PATH", str(tmp_path / "does-not-exist.json"))
    monkeypatch.setenv("AI_MODEL_PATH", "/some/env/path.gguf")
    assert model.get_model_path() == "/some/env/path.gguf"


def test_get_model_path_uses_selection_file_when_present_and_file_exists(monkeypatch, tmp_path):
    real_model_file = tmp_path / "chosen.gguf"
    real_model_file.write_text("fake gguf contents")

    selection_file = tmp_path / "ai-model-config.json"
    selection_file.write_text(json.dumps({"modelPath": str(real_model_file)}))

    monkeypatch.setattr(model, "MODEL_SELECTION_PATH", str(selection_file))
    monkeypatch.setenv("AI_MODEL_PATH", "/some/env/path.gguf")

    assert model.get_model_path() == str(real_model_file)


def test_get_model_path_ignores_selection_file_pointing_at_a_missing_file(monkeypatch, tmp_path):
    selection_file = tmp_path / "ai-model-config.json"
    selection_file.write_text(json.dumps({"modelPath": str(tmp_path / "missing.gguf")}))

    monkeypatch.setattr(model, "MODEL_SELECTION_PATH", str(selection_file))
    monkeypatch.setenv("AI_MODEL_PATH", "/some/env/path.gguf")

    assert model.get_model_path() == "/some/env/path.gguf"


def test_get_model_path_ignores_malformed_selection_file(monkeypatch, tmp_path):
    selection_file = tmp_path / "ai-model-config.json"
    selection_file.write_text("not valid json{{{")

    monkeypatch.setattr(model, "MODEL_SELECTION_PATH", str(selection_file))
    monkeypatch.setenv("AI_MODEL_PATH", "/some/env/path.gguf")

    assert model.get_model_path() == "/some/env/path.gguf"
