"""Strip chain-of-thought ``<think>...</think>`` blocks from model output.

Qwen3 models (added in Stage 24 as a selectable larger model) are *hybrid
reasoning* models: by default they emit a ``<think> ... </think>`` block of
private reasoning before the actual answer. That reasoning must never reach the
student (it would pollute conversation replies) nor the marker-based parsers
used by the grammar/reading/writing/quiz endpoints.

Qwen2.5 (the default 1.5B model) never emits these tags, so every function here
is a transparent no-op for it -- the stripping is safe to apply unconditionally
to all model output regardless of which model the admin has selected.
"""
import re

_THINK_OPEN = "<think>"
_THINK_CLOSE = "</think>"
# Non-greedy, dot-matches-newline: remove complete think blocks anywhere.
_THINK_BLOCK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)


def strip_think_blocks(text: str) -> str:
    """Remove ``<think>...</think>`` blocks from a complete (non-streamed) reply.

    Handles the normal closed block, and the degenerate case where generation
    was cut off *inside* an unclosed think block (drop from ``<think>`` on).
    """
    cleaned = _THINK_BLOCK_RE.sub("", text)
    # An unterminated think block (hit the token limit mid-reasoning): drop
    # everything from the dangling <think> onward.
    open_idx = cleaned.find(_THINK_OPEN)
    if open_idx != -1:
        cleaned = cleaned[:open_idx]
    return cleaned.strip()


class ThinkFilter:
    """Stateful, streaming-safe stripper for token-by-token generation.

    Feed each token to :meth:`feed`; it yields only the content that lies
    *outside* a leading think block. A reply either starts (after optional
    whitespace) with ``<think>`` -- in which case everything up to and
    including ``</think>`` is suppressed -- or it does not, in which case all
    tokens pass through unchanged. ``<think>`` only carries reasoning semantics
    at the very start of a reply, so we only need to detect it there.
    """

    def __init__(self) -> None:
        # "detect" -> undecided (buffering the head); "suppress" -> inside the
        # think block; "passthrough" -> emit everything from here on.
        self._state = "detect"
        self._buffer = ""
        # After a think block closes, swallow the blank line(s) it left behind
        # until the first real character of the reply arrives.
        self._strip_leading = False

    def _passthrough(self, text: str) -> str:
        if self._strip_leading:
            text = text.lstrip()
            if text:
                self._strip_leading = False
        return text

    def feed(self, token: str) -> str:
        if self._state == "passthrough":
            return self._passthrough(token)

        self._buffer += token

        if self._state == "detect":
            stripped = self._buffer.lstrip()
            if stripped == "":
                # Only whitespace so far; keep waiting, emit nothing yet.
                return ""
            if stripped.startswith(_THINK_OPEN):
                # A think block is beginning. Drop the leading whitespace and
                # the opening tag, keep the remainder for close-tag scanning.
                self._state = "suppress"
                self._buffer = stripped[len(_THINK_OPEN):]
                # fall through to suppress handling below
            elif _THINK_OPEN.startswith(stripped):
                # Still a possible prefix of "<think>" (e.g. "<th"): wait.
                return ""
            else:
                # Definitely not a think block: flush everything.
                self._state = "passthrough"
                out = self._buffer
                self._buffer = ""
                return self._passthrough(out)

        if self._state == "suppress":
            close_idx = self._buffer.find(_THINK_CLOSE)
            if close_idx == -1:
                return ""  # still inside the think block
            # Found the close tag: emit whatever follows it, swallowing the
            # blank line(s) between </think> and the reply (which may span into
            # later tokens, hence the _strip_leading latch).
            self._state = "passthrough"
            self._strip_leading = True
            remainder = self._buffer[close_idx + len(_THINK_CLOSE):]
            self._buffer = ""
            return self._passthrough(remainder)

        return ""

    def flush(self) -> str:
        """Return any content still buffered once the stream ends.

        Relevant only if the reply was pure whitespace, or an unterminated
        think block was never closed (nothing to emit in that case).
        """
        if self._state == "passthrough":
            out = self._buffer
            self._buffer = ""
            return out
        # "detect" with only whitespace, or "suppress" never closed: nothing
        # legitimate to emit.
        self._buffer = ""
        return ""
