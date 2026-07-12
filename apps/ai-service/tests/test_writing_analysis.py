"""Tests for the Stage 18 writing-analysis prompt/parser in app/prompts.py."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.prompts import build_writing_analysis_prompt, parse_writing_analysis_response


def test_build_prompt_includes_prompt_text_and_difficulty():
    messages = build_writing_analysis_prompt("Describe your hometown.", "I live in a big city.", "B1")
    system = messages[0]["content"]
    user = messages[1]["content"]
    assert "CEFR B1" in system
    assert "Describe your hometown." in user
    assert "I live in a big city." in user


def test_parse_well_formed_response():
    raw = (
        "OVERALL: A solid response with clear ideas.\n"
        "GRAMMAR: 80\n"
        "VOCABULARY: 75\n"
        "COHERENCE: 85\n"
        "STRENGTHS: Clear structure; good use of examples\n"
        "IMPROVEMENTS: Vary sentence length; use more linking words\n"
        "MODEL: My hometown is a lively city with much to offer."
    )
    result = parse_writing_analysis_response(raw)
    assert result["overall"] == "A solid response with clear ideas."
    assert result["grammarScore"] == 80
    assert result["vocabularyScore"] == 75
    assert result["coherenceScore"] == 85
    assert result["strengths"] == ["Clear structure", "good use of examples"]
    assert result["improvements"] == ["Vary sentence length", "use more linking words"]
    assert result["modelAnswer"].startswith("My hometown")


def test_parse_scores_clamp_and_extract_numbers():
    raw = "OVERALL: ok.\nGRAMMAR: 95/100\nVOCABULARY: about 200\nCOHERENCE: none\nSTRENGTHS: a\nIMPROVEMENTS: b\nMODEL: c"
    result = parse_writing_analysis_response(raw)
    assert result["grammarScore"] == 95
    assert result["vocabularyScore"] == 100  # 200 clamped to 100
    assert result["coherenceScore"] == 60  # no number -> default


def test_parse_garbled_response_falls_back():
    result = parse_writing_analysis_response("total nonsense with no markers")
    assert result["overall"] == "total nonsense with no markers"
    assert result["grammarScore"] == 60
    assert result["strengths"] == []
    assert result["modelAnswer"] == ""
