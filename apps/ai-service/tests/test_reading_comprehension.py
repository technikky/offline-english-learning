"""Tests for the Stage 15 reading-comprehension prompt/parser in app/prompts.py."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.prompts import (
    build_reading_comprehension_prompt,
    parse_reading_comprehension_response,
)


def test_build_reading_comprehension_prompt_includes_passage_and_difficulty():
    messages = build_reading_comprehension_prompt("Once upon a time...", "A2")
    assert messages[1]["content"] == "Passage:\nOnce upon a time..."
    assert "CEFR A2" in messages[0]["content"]
    assert "Q4:" in messages[0]["content"]


def test_parse_well_formed_response_with_all_four_questions():
    raw = (
        "SUMMARY: A short story about a trip to the market.\n"
        "VOCABULARY: market, vendor, bargain, fresh, crowded\n"
        "Q1: Where did the story take place?\n"
        "OPTIONS1: a market, a school, a hospital, an airport\n"
        "ANSWER1: a market\n"
        "Q2: What did the vendor sell?\n"
        "OPTIONS2: fruit, cars, books, clothes\n"
        "ANSWER2: fruit\n"
        "Q3: How did the buyer feel?\n"
        "OPTIONS3: happy, angry, bored, scared\n"
        "ANSWER3: happy\n"
        "Q4: What time did the market close?\n"
        "OPTIONS4: 6pm, 9am, noon, midnight\n"
        "ANSWER4: 6pm"
    )
    result = parse_reading_comprehension_response(raw)
    assert result["summary"] == "A short story about a trip to the market."
    assert result["vocabularyWords"] == ["market", "vendor", "bargain", "fresh", "crowded"]
    assert len(result["questions"]) == 4
    assert result["questions"][0]["question"] == "Where did the story take place?"
    assert result["questions"][0]["options"] == ["a market", "a school", "a hospital", "an airport"]
    assert result["questions"][0]["correctAnswer"] == "a market"
    assert result["questions"][3]["correctAnswer"] == "6pm"


def test_parse_response_with_missing_question_skips_it_gracefully():
    raw = (
        "SUMMARY: A short passage.\n"
        "VOCABULARY: one, two\n"
        "Q1: First question?\n"
        "OPTIONS1: a, b, c, d\n"
        "ANSWER1: a\n"
    )
    result = parse_reading_comprehension_response(raw)
    assert len(result["questions"]) == 1
    assert result["questions"][0]["correctAnswer"] == "a"


def test_parse_completely_unstructured_response_falls_back_gracefully():
    result = parse_reading_comprehension_response("just some plain text")
    assert result["summary"] == "just some plain text"
    assert result["vocabularyWords"] == []
    assert result["questions"] == []
