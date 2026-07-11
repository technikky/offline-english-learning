"""Tests for the lenient marker-based response parsers in app/prompts.py.

These are pure functions with no model dependency, unlike the rest of the
service (which needs a real GGUF/ONNX/Whisper/Piper asset loaded) -- the
natural place for automated tests. See docs/14-stage11-plan.md.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.prompts import parse_grammar_explain_response, parse_vocabulary_explain_response


def test_parse_grammar_explain_well_formed():
    raw = "EXPLANATION: You need the past tense here.\nEXAMPLE: She walked to school."
    explanation, example = parse_grammar_explain_response(raw)
    assert explanation == "You need the past tense here."
    assert example == "She walked to school."


def test_parse_grammar_explain_missing_markers_falls_back_to_raw_text():
    raw = "This sentence just needs the past tense."
    explanation, example = parse_grammar_explain_response(raw)
    assert explanation == raw
    assert example == ""


def test_parse_grammar_explain_handles_extra_whitespace_and_multiline():
    raw = (
        "EXPLANATION:   The verb agreement is wrong here.\n"
        "It should match the subject.\n"
        "EXAMPLE:   They play soccer every day.  "
    )
    explanation, example = parse_grammar_explain_response(raw)
    assert explanation == "The verb agreement is wrong here.\nIt should match the subject."
    assert example == "They play soccer every day."


def test_parse_vocabulary_explain_well_formed():
    raw = (
        "DEFINITION: A feeling of great happiness.\n"
        "EXAMPLE: She felt joy when she saw her family.\n"
        "SYNONYMS: happiness, delight, bliss\n"
        "ANTONYMS: sadness, sorrow\n"
        "CEFR: B1"
    )
    result = parse_vocabulary_explain_response(raw)
    assert result["definition"] == "A feeling of great happiness."
    assert result["example"] == "She felt joy when she saw her family."
    assert result["synonyms"] == ["happiness", "delight", "bliss"]
    assert result["antonyms"] == ["sadness", "sorrow"]
    assert result["cefrLevel"] == "B1"


def test_parse_vocabulary_explain_none_lists_and_invalid_cefr_defaults_to_b1():
    raw = (
        "DEFINITION: A rare word.\n"
        "EXAMPLE: It is used rarely.\n"
        "SYNONYMS: none\n"
        "ANTONYMS: none\n"
        "CEFR: not-a-level"
    )
    result = parse_vocabulary_explain_response(raw)
    assert result["synonyms"] == []
    assert result["antonyms"] == []
    assert result["cefrLevel"] == "B1"


def test_parse_vocabulary_explain_missing_all_markers_falls_back_to_raw_text():
    raw = "Just some unstructured text with no markers at all."
    result = parse_vocabulary_explain_response(raw)
    assert result["definition"] == raw
    assert result["example"] == ""
    assert result["synonyms"] == []
    assert result["antonyms"] == []
    assert result["cefrLevel"] == "B1"


def test_parse_vocabulary_explain_cefr_case_insensitive():
    raw = "DEFINITION: X.\nEXAMPLE: Y.\nSYNONYMS: none\nANTONYMS: none\nCEFR: c2"
    result = parse_vocabulary_explain_response(raw)
    assert result["cefrLevel"] == "C2"
