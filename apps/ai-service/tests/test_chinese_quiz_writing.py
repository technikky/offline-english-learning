"""Stage 31: Chinese quiz generation and Chinese writing feedback.

Pure prompt-building, no model required.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.prompts import build_quiz_prompt, build_writing_analysis_prompt


def _system(messages):
    return messages[0]["content"]


# --- quizzes ---


def test_english_quiz_is_unchanged_and_is_the_default():
    default = _system(build_quiz_prompt("grammar", "B1"))
    explicit = _system(build_quiz_prompt("grammar", "B1", "english"))
    assert default == explicit
    assert "English quiz writer" in default
    assert "SIMPLIFIED" not in default


def test_chinese_quiz_is_written_in_mandarin():
    prompt = _system(build_quiz_prompt("grammar", "B1", "chinese"))
    assert "Chinese quiz writer" in prompt
    assert "SIMPLIFIED characters" in prompt
    # Pinyin is required so a learner can read the options at all.
    assert "pinyin" in prompt.lower()
    # True/False must stay in English or the parser can't match the answer.
    assert "TRUE and FALSE" in prompt


def test_chinese_grammar_category_targets_chinese_grammar():
    prompt = _system(build_quiz_prompt("grammar", "B1", "chinese"))
    # Chinese grammar is measure words and particles, not articles and tenses.
    assert "measure words" in prompt
    assert "articles" not in prompt


def test_characters_category_exists_only_for_chinese():
    chinese = _system(build_quiz_prompt("characters", "A2", "chinese"))
    assert "radicals" in chinese
    # English has no such category, so it falls back to grammar guidance.
    english = _system(build_quiz_prompt("characters", "A2", "english"))
    assert "radicals" not in english


def test_everyday_chinese_category_is_recognised():
    prompt = _system(build_quiz_prompt("everyday_chinese", "A2", "chinese"))
    assert "everyday Chinese" in prompt


# --- writing feedback ---


def test_english_writing_feedback_is_unchanged_and_is_the_default():
    default = _system(build_writing_analysis_prompt("Prompt", "Text", "B1"))
    explicit = _system(build_writing_analysis_prompt("Prompt", "Text", "B1", "english"))
    assert default == explicit
    assert "English writing teacher" in default


def test_chinese_writing_feedback_targets_chinese_mistakes():
    prompt = _system(
        build_writing_analysis_prompt("写你的家", "我家有三口人。", "A1", "chinese")
    )
    assert "Chinese (Mandarin) writing teacher" in prompt
    # Feedback is in English so a beginner can read it...
    assert "FEEDBACK IN ENGLISH" in prompt
    # ...but the model answer must be in Chinese.
    assert "IN CHINESE" in prompt
    # The mistakes that actually matter in Chinese.
    assert "measure words" in prompt
    assert "de (的/得/地)" in prompt


def test_chinese_writing_prompt_keeps_the_required_response_markers():
    prompt = _system(
        build_writing_analysis_prompt("写你的家", "我家有三口人。", "A1", "chinese")
    )
    # The parser is marker-based; missing markers would break feedback entirely.
    for marker in (
        "OVERALL:",
        "GRAMMAR:",
        "VOCABULARY:",
        "COHERENCE:",
        "STRENGTHS:",
        "IMPROVEMENTS:",
        "MODEL:",
    ):
        assert marker in prompt


def test_chinese_writing_prompt_includes_the_level_and_the_student_text():
    messages = build_writing_analysis_prompt("写你的家", "我家有三口人。", "A1", "chinese")
    assert "CEFR A1" in messages[0]["content"]
    assert "我家有三口人。" in messages[1]["content"]
