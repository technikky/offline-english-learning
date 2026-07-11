# offline-sdk/ai-models

Vendored GGUF models for the AI Service ([apps/ai-service](../../apps/ai-service)).

## Currently vendored (dev-time)

- `qwen2.5-1.5b-instruct-q4_k_m.gguf` (~1.1GB, Stage 4) — Qwen2.5-1.5B-Instruct, quantized Q4_K_M. Not committed to git (see root `.gitignore`); downloaded from Hugging Face (`Qwen/Qwen2.5-1.5B-Instruct-GGUF`).
- `fastembed-cache/` (~90MB, Stage 6) — `all-MiniLM-L6-v2` ONNX embedding model, downloaded automatically by `fastembed` on first use (see [apps/ai-service/app/embeddings.py](../../apps/ai-service/app/embeddings.py)) into this folder rather than the default OS temp/user cache, so it's vendored alongside the LLM instead of scattered across the machine. Also gitignored.
- `whisper-models/ggml-tiny.en.bin` (~77MB, Stage 9) — Whisper `tiny.en`, downloaded automatically by `pywhispercpp` on first use. Gitignored.
- `piper-voices/en_US-lessac-medium.onnx` (+ `.onnx.json`, ~63MB, Stage 9) — downloaded via `python -m piper.download_voices en_US-lessac-medium --download-dir offline-sdk/ai-models/piper-voices`. Gitignored.

**This is a development-time model choice, not the final production sizing.** [docs/02-technology-selection.md](../../docs/02-technology-selection.md) specifies a 7–8B instruction-tuned model for real classroom deployment; see [docs/07-stage4-plan.md](../../docs/07-stage4-plan.md) for why a much smaller model was used to build and verify the pipeline in this session, and how swapping the production model is a config change (`AI_MODEL_PATH` env var), not a code change.

## Restoring the dev model on a fresh clone

```
curl -L -o offline-sdk/ai-models/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf
```

## For a genuinely offline school install

As with `offline-sdk/node/` and `offline-sdk/build-tools/`, the real vendoring/restore script (Stage 10 deliverable) downloads the chosen production GGUF model(s) once on a machine with internet access and stores them for offline installers — large binaries are never committed as git blobs.
