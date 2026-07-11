import threading

# llama.cpp (via llama-cpp-python) and the ONNX embedding session are not
# safe for concurrent calls on the same model instance — a burst of
# overlapping requests (e.g. a chat reply still streaming while a
# vocabulary-recommendation batch fires off /v1/embed and
# /v1/vocabulary/explain calls) crashed the process during Stage 6
# development. FastAPI's sync `def` routes run in a threadpool, so without
# this lock those calls really do run concurrently. Since this is a single
# CPU-bound model anyway, there's no throughput lost by serializing access.
INFERENCE_LOCK = threading.Lock()
