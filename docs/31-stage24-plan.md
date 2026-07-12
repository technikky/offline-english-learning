# Stage 24 Implementation Plan — Vendor Qwen3-8B + model choice

## Objective

Per the brief: "while currently only `qwen2.5-1.5b-instruct-q4_k_m.gguf` is available, `Qwen3 8B Instruct` should also be downloaded so that users can choose between the two models as appropriate."

## 1. Vendor the model

- Downloaded `Qwen3-8B` Q4_K_M (~5.0 GB) from Hugging Face (`Qwen/Qwen3-8B-GGUF`) to `offline-sdk/ai-models/qwen3-8b-instruct-q4_k_m.gguf`. Verified GGUF magic bytes; gitignored like the 1.5B (large binaries are never committed).
- Confirmed it **loads and generates** under the vendored `llama-cpp-python` 0.3.33 (Qwen3 architecture is supported): ~4 s load, coherent generation.

## 2. Model choice already exists — reuse it

The admin model-management feature (Stage 12) already lists every `.gguf` in `offline-sdk/ai-models/` and lets an admin pick one, writing `data/ai-model-config.json`, which the AI service's `model.py` reads on startup ahead of `AI_MODEL_PATH`. So the 8B **automatically appears as a selectable option** with no code change — `listAiModels()` scans the directory, `selectAiModel()` validates + persists the choice. Switching models requires an AI-service restart (a single in-memory llama.cpp instance can't be hot-swapped mid-request); this is model *selection*, documented in the admin UI, not live hot-swapping.

## 3. The one real code change: strip Qwen3 reasoning output

Qwen3 is a **hybrid reasoning** model — by default it emits a leading `<think> … </think>` block of private chain-of-thought before the answer. That reasoning must never reach the student (it would pollute conversation replies) nor the marker-based parsers used by the grammar/reading/writing/quiz endpoints.

New `apps/ai-service/app/reasoning.py`:
- `strip_think_blocks(text)` — removes `<think>…</think>` from a complete reply (and drops an unterminated block if generation was cut off mid-reasoning). Applied to every non-streaming endpoint's raw output.
- `ThinkFilter` — a stateful, streaming-safe stripper for the token-by-token `/v1/chat` path: it suppresses a leading think block (even when the `<think>` tag is split across tokens and when the blank lines after `</think>` arrive in later tokens) and passes everything else through unchanged.

Qwen2.5 never emits these tags, so **both are transparent no-ops for the default model** — the stripping is applied unconditionally to all model output regardless of the selected model, keeping the code model-agnostic.

## 4. Verification

- Unit tests: `test_reasoning.py` (9) — closed/unterminated/mid-content blocks for `strip_think_blocks`; streaming suppression, passthrough, split-tag, pure-think, and a `<3`-is-not-`<think>` guard for `ThinkFilter`. Full AI-service suite: **47 pytest passing**.
- Live full-stack with the 8B selected (config pointed at the 8B, AI service restarted → `/health` reports the 8B loaded): a `free_talk` conversation returned a clean, natural reply with **no `<think>` leakage**; the marker-parsed `/v1/vocabulary/explain` returned a correctly structured definition/example/synonyms/antonyms. Config restored to the 1.5B default afterward.

## 5. Docs

`offline-sdk/ai-models/README.md` updated: the 8B is documented as the production-sized model, with the admin selection flow, the restart requirement, and fresh-clone restore commands for both models.
