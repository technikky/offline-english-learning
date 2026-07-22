# offline-sdk/ai-models

Vendored GGUF models for the AI Service ([apps/ai-service](../../apps/ai-service)).

## Currently vendored

- `qwen2.5-1.5b-instruct-q4_k_m.gguf` (~1.1GB, Stage 4) — Qwen2.5-1.5B-Instruct, quantized Q4_K_M. **Default model** (fast, low-RAM; good for building/verifying the pipeline and for modest hardware). Not committed to git (see root `.gitignore`); downloaded from Hugging Face (`Qwen/Qwen2.5-1.5B-Instruct-GGUF`).
- `qwen3-8b-instruct-q4_k_m.gguf` (~5.0GB, Stage 24) — Qwen3-8B, quantized Q4_K_M. **Production-sized model** matching the 7–8B target in [docs/02-technology-selection.md](../../docs/02-technology-selection.md); noticeably stronger replies at the cost of more RAM and slower generation. Gitignored. An admin selects it in the desktop admin console (Model management) — see "Choosing between models" below. Qwen3 is a *hybrid reasoning* model that emits a leading `<think>…</think>` block; the AI service strips that automatically ([apps/ai-service/app/reasoning.py](../../apps/ai-service/app/reasoning.py)), so replies and structured outputs are clean regardless of which model is active.
- `fastembed-cache/` (~90MB, Stage 6) — `all-MiniLM-L6-v2` ONNX embedding model, downloaded automatically by `fastembed` on first use (see [apps/ai-service/app/embeddings.py](../../apps/ai-service/app/embeddings.py)) into this folder rather than the default OS temp/user cache, so it's vendored alongside the LLM instead of scattered across the machine. Also gitignored.
- `whisper-models/ggml-tiny.en.bin` (~77MB, Stage 9) — Whisper `tiny.en`, English-only. Used for all English speech input. Downloaded automatically by `pywhispercpp` on first use. Gitignored.
- `whisper-models/ggml-small.bin` (~466MB, Stage 29) — Whisper `small`, **multilingual**. Required for Chinese speech input; `tiny.en` cannot transcribe Chinese at all. Loaded lazily, so English-only deployments never pay its memory cost. Gitignored; restore with:

```
curl -L -o offline-sdk/ai-models/whisper-models/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

  Override the model names with the `WHISPER_MODEL` (English) and `WHISPER_MODEL_MULTILINGUAL` (Chinese) env vars.
- `piper-voices/en_US-lessac-medium.onnx` (+ `.onnx.json`, ~63MB, Stage 9) — downloaded via `python -m piper.download_voices en_US-lessac-medium --download-dir offline-sdk/ai-models/piper-voices`. Gitignored.

The 1.5B model was chosen to build and verify the pipeline (see [docs/07-stage4-plan.md](../../docs/07-stage4-plan.md)); the 8B is the production-sized option from [docs/02-technology-selection.md](../../docs/02-technology-selection.md). Both are now vendored so a deployment can pick the right one for its hardware.

## Choosing between models

An admin selects the active model in the desktop **admin console → Model management**, which lists every `.gguf` in this folder and writes the choice to `data/ai-model-config.json`. The AI service reads that file on startup (ahead of the `AI_MODEL_PATH` env var), so **restart the AI service after switching** — a single in-memory llama.cpp instance can't be hot-swapped safely mid-request. See [docs/31-stage24-plan.md](../../docs/31-stage24-plan.md).

## Restoring the models on a fresh clone

```
# Default (1.5B, ~1.1GB)
curl -L -o offline-sdk/ai-models/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf

# Production-sized (Qwen3-8B, ~5.0GB)
curl -L -o offline-sdk/ai-models/qwen3-8b-instruct-q4_k_m.gguf \
  https://huggingface.co/Qwen/Qwen3-8B-GGUF/resolve/main/Qwen3-8B-Q4_K_M.gguf
```

## For a genuinely offline school install

As with `offline-sdk/node/` and `offline-sdk/build-tools/`, the real vendoring/restore script (Stage 10 deliverable) downloads the chosen production GGUF model(s) once on a machine with internet access and stores them for offline installers — large binaries are never committed as git blobs.
