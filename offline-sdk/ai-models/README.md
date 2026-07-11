# offline-sdk/ai-models

Vendored GGUF models for the AI Service ([apps/ai-service](../../apps/ai-service)).

## Currently vendored (Stage 4, dev-time)

- `qwen2.5-1.5b-instruct-q4_k_m.gguf` (~1.1GB) — Qwen2.5-1.5B-Instruct, quantized Q4_K_M. Not committed to git (see root `.gitignore`); downloaded from Hugging Face (`Qwen/Qwen2.5-1.5B-Instruct-GGUF`).

**This is a development-time model choice, not the final production sizing.** [docs/02-technology-selection.md](../../docs/02-technology-selection.md) specifies a 7–8B instruction-tuned model for real classroom deployment; see [docs/07-stage4-plan.md](../../docs/07-stage4-plan.md) for why a much smaller model was used to build and verify the pipeline in this session, and how swapping the production model is a config change (`AI_MODEL_PATH` env var), not a code change.

## Restoring the dev model on a fresh clone

```
curl -L -o offline-sdk/ai-models/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf
```

## For a genuinely offline school install

As with `offline-sdk/node/` and `offline-sdk/build-tools/`, the real vendoring/restore script (Stage 10 deliverable) downloads the chosen production GGUF model(s) once on a machine with internet access and stores them for offline installers — large binaries are never committed as git blobs.
