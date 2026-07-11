"""Ad-hoc benchmark for Stage 10's performance pass — not part of the test
suite, just a way to record a real tokens/sec baseline on this machine for
the thread-count decision in docs/13-stage10-plan.md. Run manually:

    .venv/Scripts/python.exe scripts/benchmark.py
"""

import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from llama_cpp import Llama

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "offline-sdk", "ai-models",
    "qwen2.5-1.5b-instruct-q4_k_m.gguf",
)
PROMPT = [{"role": "user", "content": "Describe your ideal weekend in a few sentences."}]


def run(n_threads: int) -> float:
    llm = Llama(model_path=MODEL_PATH, n_ctx=2048, n_threads=n_threads, verbose=False)
    start = time.time()
    result = llm.create_chat_completion(messages=PROMPT, max_tokens=150)
    elapsed = time.time() - start
    completion_tokens = result["usage"]["completion_tokens"]
    tokens_per_sec = completion_tokens / elapsed
    print(f"n_threads={n_threads}: {completion_tokens} tokens in {elapsed:.2f}s = {tokens_per_sec:.2f} tok/s")
    return tokens_per_sec


if __name__ == "__main__":
    cpu_count = os.cpu_count() or 4
    print(f"Detected {cpu_count} logical cores")
    run(4)
    run(cpu_count)
