# AI Service (Stage 4 + 5 + 6 + 9)

FastAPI service wrapping a local llama.cpp model for conversation practice, grammar-mistake explanations, vocabulary lookups/embeddings, and speech recognition/synthesis. See [docs/07-stage4-plan.md](../../docs/07-stage4-plan.md), [docs/08-stage5-plan.md](../../docs/08-stage5-plan.md), [docs/09-stage6-plan.md](../../docs/09-stage6-plan.md), and [docs/12-stage9-plan.md](../../docs/12-stage9-plan.md) for the design rationale.

**Concurrency note**: every route that touches the LLM or the embedding model acquires a single process-wide lock (`app/inference_lock.py`) before doing so. FastAPI's sync `def` routes run in a threadpool, so without this lock, overlapping requests (e.g. a chat reply still streaming while a vocabulary-recommendation batch fires off several `/v1/embed`/`/v1/vocabulary/explain` calls) really do hit the same llama.cpp/ONNX session concurrently — this crashed the process during Stage 6 development. Since it's a single CPU-bound model anyway, serializing access costs no real throughput.

## Setup

```
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
```

The Stage 4 dev model (Qwen2.5-1.5B-Instruct, GGUF Q4_K_M, ~1GB) is expected at
`offline-sdk/ai-models/qwen2.5-1.5b-instruct-q4_k_m.gguf` (relative to the repo root).
Override with the `AI_MODEL_PATH` env var to point at a different (e.g. production-sized)
GGUF file without any code changes.

## Run

```
.venv/Scripts/uvicorn app.main:app --host 127.0.0.1 --port 8100
```

## Endpoints

- `GET /health` — `{ "status": "ok", "modelLoaded": true }`
- `POST /v1/chat` — body `{ messages: [{role, content}], scenario, difficultyLevel }`, streams newline-delimited JSON: one `{"token": "..."}` line per generated token, then a final `{"done": true, "fullText": "..."}` line.
- `POST /v1/grammar/explain` — body `{ originalText, correctedText, ruleDescription, difficultyLevel }`, non-streaming (a short explanation doesn't need token-by-token delivery). Returns `{ explanation, example }`. Parses the model's `EXPLANATION:`/`EXAMPLE:`-marked output leniently rather than requiring strict JSON, since small local models aren't reliable at that.
- `POST /v1/embed` — body `{ text }`. Returns `{ embedding: number[] }` (384-dim, `all-MiniLM-L6-v2` via `fastembed`/ONNX runtime — no PyTorch dependency).
- `POST /v1/vocabulary/explain` — body `{ word, difficultyLevel }`. Non-streaming. Returns `{ definition, example, synonyms: string[], antonyms: string[], cefrLevel }`, same lenient marker-based parsing as grammar/explain.
- `POST /v1/speech/transcribe` — body `{ audioBase64 }` (WAV, any sample rate — resampled to 16kHz server-side via numpy before Whisper, see `app/speech.py`). Returns `{ transcript }` via `pywhispercpp` (`tiny.en`).
- `POST /v1/speech/synthesize` — body `{ text }`. Returns `{ audioBase64 }` (WAV) via `piper-tts` (`en_US-lessac-medium`).

## Config

- `AI_MODEL_PATH` — path to the GGUF model file.
- `AI_CONTEXT_SIZE` — context window size in tokens (default 4096).
- `EMBEDDING_CACHE_DIR` — where the ONNX embedding model is cached (default `offline-sdk/ai-models/fastembed-cache/`).
- `WHISPER_MODEL` — Whisper model size (default `tiny.en`).
- `PIPER_VOICE_PATH` — path to the Piper `.onnx` voice file (default `offline-sdk/ai-models/piper-voices/en_US-lessac-medium.onnx`).
