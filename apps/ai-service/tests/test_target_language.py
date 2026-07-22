"""Stage 28: the conversation system prompt adapts to the student's target
language, so the same Qwen model acts as an English tutor or a Mandarin
Chinese tutor. Pure prompt-building, no model needed.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.prompts import build_system_prompt, build_chinese_language_instructions


def test_english_is_the_default_and_is_unchanged():
    prompt = build_system_prompt("free_talk", "B1")
    assert "Mandarin Chinese" not in prompt
    assert "Adapt your English to the student's level" in prompt


def test_explicit_english_matches_the_default():
    assert build_system_prompt("travel", "A2") == build_system_prompt(
        "travel", "A2", None, "english"
    )


def test_chinese_switches_the_tutor_to_mandarin():
    prompt = build_system_prompt("free_talk", "B1", None, "chinese")
    assert "Mandarin Chinese" in prompt
    assert "SIMPLIFIED characters" in prompt
    # Pinyin is non-negotiable: a beginner can't read hanzi yet.
    assert "pinyin" in prompt.lower()
    assert "Never reply only in English." in prompt


def test_chinese_prompt_maps_cefr_to_the_hsk_band():
    assert "HSK 1" in build_chinese_language_instructions("A1")
    assert "HSK 3" in build_chinese_language_instructions("B1")
    assert "HSK 6" in build_chinese_language_instructions("C2")


def test_chinese_prompt_falls_back_for_an_unknown_level():
    assert "HSK 3" in build_chinese_language_instructions("not-a-level")


def test_chinese_still_honours_a_teacher_custom_topic():
    prompt = build_system_prompt(
        "free_talk", "A2", "You are a market vendor in Beijing.", "chinese"
    )
    assert "market vendor in Beijing" in prompt
    assert "Mandarin Chinese" in prompt
