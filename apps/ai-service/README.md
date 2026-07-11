# AI Service (Stage 4 + 5)

FastAPI service wrapping a local llama.cpp model for conversation practice and grammar-mistake explanations. See [docs/07-stage4-plan.md](../../docs/07-stage4-plan.md) and [docs/08-stage5-plan.md](../../docs/08-stage5-plan.md) for the design rationale.

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

## Config

- `AI_MODEL_PATH` — path to the GGUF model file.
- `AI_CONTEXT_SIZE` — context window size in tokens (default 4096).
