# AI Service (Stage 4)

FastAPI service wrapping a local llama.cpp model for conversation practice. See [docs/07-stage4-plan.md](../../docs/07-stage4-plan.md) for the design rationale.

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

## Config

- `AI_MODEL_PATH` — path to the GGUF model file.
- `AI_CONTEXT_SIZE` — context window size in tokens (default 4096).
