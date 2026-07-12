import os
import threading
from contextlib import contextmanager

from fastapi import HTTPException

# llama.cpp (via llama-cpp-python) and the ONNX embedding session are not
# safe for concurrent calls on the same model instance — a burst of
# overlapping requests (e.g. a chat reply still streaming while a
# vocabulary-recommendation batch fires off /v1/embed and
# /v1/vocabulary/explain calls) crashed the process during Stage 6
# development. FastAPI's sync `def` routes run in a threadpool, so without
# this lock those calls really do run concurrently. Since this is a single
# CPU-bound model anyway, there's no throughput lost by serializing access.
INFERENCE_LOCK = threading.Lock()

# How long a request waits for the model to become free before giving up and
# returning "busy" (HTTP 503). The point is to SHED load rather than build an
# unbounded backlog: a wedged service (a chat reply generating while dozens of
# queued voice turns piled up behind a blocking lock) once climbed to 9 GB /
# 11k CPU-seconds and pushed time-to-first-token to ~70 s. Failing fast with a
# clear "busy" lets the client show a wait indicator and retry instead.
BUSY_TIMEOUT_S = float(os.environ.get("AI_BUSY_TIMEOUT", "2.0"))


@contextmanager
def inference_slot(timeout: float = BUSY_TIMEOUT_S):
    """Acquire the inference lock or raise HTTP 503 "busy".

    Use in place of ``with INFERENCE_LOCK:`` for request handlers so a second
    concurrent inference call is rejected quickly rather than queued. For the
    streaming chat endpoint the lock is managed manually (acquired in the route,
    released in the generator's ``finally``) because a StreamingResponse holds
    it for the whole reply.
    """
    if not INFERENCE_LOCK.acquire(timeout=timeout):
        raise HTTPException(status_code=503, detail="AI is busy, please wait")
    try:
        yield
    finally:
        INFERENCE_LOCK.release()
