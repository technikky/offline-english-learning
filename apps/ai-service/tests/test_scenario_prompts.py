"""Tests for the Stage 13 scenario/system-prompt assembly in app/prompts.py."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.prompts import (
    SCENARIO_PROMPTS,
    PEDAGOGY_INSTRUCTIONS,
    build_system_prompt,
)


def test_every_scenario_has_a_nonempty_prompt():
    assert len(SCENARIO_PROMPTS) == 21
    for scenario, text in SCENARIO_PROMPTS.items():
        assert isinstance(text, str)
        assert len(text.strip()) > 0, f"scenario {scenario!r} has an empty prompt"


def test_build_system_prompt_includes_scenario_difficulty_and_pedagogy():
    prompt = build_system_prompt("restaurant", "B1")
    assert SCENARIO_PROMPTS["restaurant"] in prompt
    assert "CEFR B1" in prompt
    assert PEDAGOGY_INSTRUCTIONS in prompt


def test_build_system_prompt_falls_back_to_free_talk_for_unknown_scenario():
    prompt = build_system_prompt("not_a_real_scenario", "B1")
    assert SCENARIO_PROMPTS["free_talk"] in prompt


def test_build_system_prompt_falls_back_to_b1_for_unknown_difficulty():
    prompt = build_system_prompt("free_talk", "not_a_real_level")
    assert "CEFR B1" in prompt
