"""Tests for the Stage 19 quiz prompt/parser in app/prompts.py."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.prompts import build_quiz_prompt, parse_quiz_response, QUIZ_QUESTION_COUNT


def test_build_prompt_includes_category_and_difficulty_and_all_slots():
    messages = build_quiz_prompt("vocabulary", "A2")
    system = messages[0]["content"]
    assert "CEFR A2" in system
    assert "vocabulary" in system.lower()
    assert f"Q{QUIZ_QUESTION_COUNT}_TYPE:" in system


def test_parse_mixed_quiz():
    raw = (
        "Q1_TYPE: multiple_choice\n"
        "Q1: She ____ to work.\n"
        "Q1_OPTIONS: go, goes, going, gone\n"
        "Q1_ANSWER: goes\n"
        "Q1_EXPLANATION: Third person singular.\n"
        "Q2_TYPE: true_false\n"
        "Q2: 'Happy' is an adjective.\n"
        "Q2_OPTIONS: True, False\n"
        "Q2_ANSWER: True\n"
        "Q2_EXPLANATION: It describes a noun.\n"
        "Q3_TYPE: multiple_choice\n"
        "Q3: The opposite of 'hot' is ____.\n"
        "Q3_OPTIONS: warm, cold, cool, mild\n"
        "Q3_ANSWER: cold\n"
        "Q3_EXPLANATION: Antonym.\n"
        "Q4_TYPE: true_false\n"
        "Q4: 'Run' is a noun only.\n"
        "Q4_OPTIONS: True, False\n"
        "Q4_ANSWER: False\n"
        "Q4_EXPLANATION: It is also a verb.\n"
        "Q5_TYPE: multiple_choice\n"
        "Q5: Choose the correct article: ___ apple.\n"
        "Q5_OPTIONS: a, an, the, some\n"
        "Q5_ANSWER: an\n"
        "Q5_EXPLANATION: Vowel sound."
    )
    result = parse_quiz_response(raw)
    assert len(result["questions"]) == 5
    assert result["questions"][0]["type"] == "multiple_choice"
    assert result["questions"][0]["options"] == ["go", "goes", "going", "gone"]
    assert result["questions"][0]["correctAnswer"] == "goes"
    assert result["questions"][1]["type"] == "true_false"
    assert result["questions"][1]["options"] == ["True", "False"]
    assert result["questions"][3]["correctAnswer"] == "False"


def test_parse_skips_incomplete_questions():
    raw = (
        "Q1_TYPE: multiple_choice\nQ1: A question?\nQ1_OPTIONS: a, b, c, d\nQ1_ANSWER: a\nQ1_EXPLANATION: x.\n"
        "Q2_TYPE: multiple_choice\nQ2: \nQ2_OPTIONS: \nQ2_ANSWER: \nQ2_EXPLANATION: \n"
    )
    result = parse_quiz_response(raw)
    assert len(result["questions"]) == 1


def test_parse_empty_returns_no_questions():
    assert parse_quiz_response("garbage") == {"questions": []}
