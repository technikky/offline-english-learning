"""Tests for the Stage 24 think-block stripping (Qwen3 reasoning output)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.reasoning import strip_think_blocks, ThinkFilter


def _run_stream(tokens):
    """Feed tokens through a ThinkFilter and return the concatenated output."""
    f = ThinkFilter()
    out = "".join(f.feed(t) for t in tokens)
    return out + f.flush()


def test_strip_removes_a_leading_think_block():
    text = "<think>\nLet me plan the reply.\n</think>\n\nHello there!"
    assert strip_think_blocks(text) == "Hello there!"


def test_strip_is_a_noop_without_think_tags():
    text = "Hello there, how are you today?"
    assert strip_think_blocks(text) == "Hello there, how are you today?"


def test_strip_drops_an_unterminated_think_block():
    # Generation cut off mid-reasoning (hit the token limit).
    text = "<think>\nStill reasoning and never finished"
    assert strip_think_blocks(text) == ""


def test_strip_removes_a_think_block_between_content():
    text = "A<think>reasoning</think>B"
    assert strip_think_blocks(text) == "AB"


def test_stream_suppresses_think_then_emits_reply():
    tokens = ["<think>", "\nreason", " more", "</think>", "\n\n", "Hi", " there"]
    assert _run_stream(tokens) == "Hi there"


def test_stream_passthrough_when_no_think_block():
    tokens = ["Hello", ", ", "friend", "!"]
    assert _run_stream(tokens) == "Hello, friend!"


def test_stream_handles_think_tag_split_across_tokens():
    # The opening tag arrives one character at a time.
    tokens = ["<", "th", "ink", ">", "x", "</think>", "Answer"]
    assert _run_stream(tokens) == "Answer"


def test_stream_emits_nothing_for_pure_think_block():
    tokens = ["<think>", "only reasoning", "</think>"]
    assert _run_stream(tokens) == ""


def test_stream_does_not_swallow_leading_less_than_that_is_not_think():
    tokens = ["<3 ", "coding"]
    assert _run_stream(tokens) == "<3 coding"
