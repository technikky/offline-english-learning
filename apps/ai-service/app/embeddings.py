import os
from fastembed import TextEmbedding

DEFAULT_CACHE_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "..",
    "offline-sdk",
    "ai-models",
    "fastembed-cache",
)

_embedding_model: TextEmbedding | None = None


def get_cache_dir() -> str:
    return os.environ.get("EMBEDDING_CACHE_DIR", DEFAULT_CACHE_DIR)


def load_embedding_model() -> TextEmbedding:
    global _embedding_model
    if _embedding_model is None:
        os.makedirs(get_cache_dir(), exist_ok=True)
        _embedding_model = TextEmbedding(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            cache_dir=get_cache_dir(),
        )
    return _embedding_model


def embed_text(text: str) -> list[float]:
    model = load_embedding_model()
    return list(model.embed([text]))[0].tolist()


def is_embedding_model_loaded() -> bool:
    return _embedding_model is not None
