import os
from llama_cpp import Llama

DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "..",
    "offline-sdk",
    "ai-models",
    "qwen2.5-1.5b-instruct-q4_k_m.gguf",
)

_llm: Llama | None = None


def get_model_path() -> str:
    return os.environ.get("AI_MODEL_PATH", DEFAULT_MODEL_PATH)


def load_model() -> Llama:
    global _llm
    if _llm is None:
        _llm = Llama(
            model_path=get_model_path(),
            n_ctx=int(os.environ.get("AI_CONTEXT_SIZE", "4096")),
            verbose=False,
        )
    return _llm


def is_model_loaded() -> bool:
    return _llm is not None
