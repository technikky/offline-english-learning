"""Tests for the Stage 14 grammar-exercise prompt/parser in app/prompts.py."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.prompts import build_grammar_exercise_prompt, parse_grammar_exercise_response


def test_build_grammar_exercise_prompt_multiple_choice_includes_options_format():
    messages = build_grammar_exercise_prompt(
        "Present Simple", "Used for habits and facts.", "A2", "multiple_choice"
    )
    system_text = messages[0]["content"]
    assert "Present Simple" in system_text
    assert "OPTIONS:" in system_text
    assert "CEFR A2" in system_text


def test_build_grammar_exercise_prompt_fill_blank_omits_options_format():
    messages = build_grammar_exercise_prompt(
        "Past Simple", "Used for completed past actions.", "B1", "fill_blank"
    )
    system_text = messages[0]["content"]
    assert "OPTIONS:" not in system_text


def test_parse_multiple_choice_response_well_formed():
    raw = (
        "QUESTION: She ____ to school every day.\n"
        "OPTIONS: go, goes, going, gone\n"
        "ANSWER: goes\n"
        "EXPLANATION: Third-person singular present simple takes -s."
    )
    result = parse_grammar_exercise_response(raw, "multiple_choice")
    assert result["question"] == "She ____ to school every day."
    assert result["options"] == ["go", "goes", "going", "gone"]
    assert result["correctAnswer"] == "goes"
    assert "present simple" in result["explanation"].lower()


def test_parse_fill_blank_response_well_formed():
    raw = (
        "QUESTION: Yesterday, I ____ (walk) to the store.\n"
        "ANSWER: walked\n"
        "EXPLANATION: Past simple regular verbs add -ed."
    )
    result = parse_grammar_exercise_response(raw, "fill_blank")
    assert result["question"] == "Yesterday, I ____ (walk) to the store."
    assert result["options"] == []
    assert result["correctAnswer"] == "walked"


def test_parse_response_missing_markers_falls_back_gracefully():
    result = parse_grammar_exercise_response("some unstructured garbage", "fill_blank")
    assert result["correctAnswer"] == ""
    assert result["question"]
