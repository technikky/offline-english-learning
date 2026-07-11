# Technology Selection Report

Each decision is made against the criteria from the brief: offline capability, long-term maintainability, scalability, ease of deployment, educational-environment suitability, developer productivity, future expansion.

## Desktop shell: **Electron** (over Tauri, .NET Desktop, Qt, Flutter Desktop)

| Option | Verdict | Reasoning |
|---|---|---|
| **Electron** | **Chosen** | Same TypeScript/Node stack as the backend → one language across client+server, easiest hiring/maintenance pool, mature offline packaging (electron-builder produces fully offline installers), huge ecosystem for embedding local servers, file dialogs, auto-update-free installs. Bundle size (~150MB) is a non-issue on modern school PCs and is a one-time install cost, not a runtime cost. |
| Tauri | Rejected (for now) | Smaller binaries and lower RAM, but requires a Rust toolchain in the dev environment and for offline builds you must mirror the entire crates.io dependency graph — meaningfully harder to keep "fully offline" than npm package vendoring. Revisit in Stage 10 (deployment optimization) if binary size becomes a real constraint. |
| .NET Desktop | Rejected | Ties the project to Windows-first tooling and a separate language (C#) from the rest of the stack; worse fit for a team that will also build the AI service in Python and backend in Node. |
| Qt | Rejected | C++/QML has the steepest learning curve and slowest iteration speed of all options — poor fit for "developer productivity" criterion. |
| Flutter Desktop | Rejected | Desktop support is less mature than Flutter Mobile; would fragment the codebase from the Android client's UI instead of sharing patterns, and Dart has no reuse with the Node/Python backend. |

## Android client: **Flutter**

| Option | Verdict | Reasoning |
|---|---|---|
| **Flutter** | **Chosen** | Single Dart codebase, excellent offline-first local storage (sqflite/Isar) for caching class/lesson data when LAN is briefly unavailable, strong LAN-discovery and HTTP tooling, and keeps the door open for an iOS client later at near-zero extra cost — directly satisfies "future expansion." |
| Kotlin (native) | Rejected | Best raw platform integration, but Android-only; any future iOS ask means a full rewrite. Higher long-term cost for a two-person-scale maintenance team. |
| React Native | Rejected | Viable, but Flutter's rendering engine gives more consistent behavior on the low/mid-range Android tablets typical of school procurement, and avoids the JS-bridge performance overhead for audio-heavy speech features (Stage 9). |

## Backend API: **Node.js + TypeScript + Fastify**

- Fastify over Express: schema-based validation, better throughput, first-class TypeScript support, plugin architecture matches our modular boundaries well.
- TypeScript end-to-end (backend + Electron renderer) reduces context-switching cost and catches contract drift between client and API at compile time.
- ORM: **Drizzle ORM** — SQL-first, lightweight, typed, and trivially portable between SQLite (Stage 1) and PostgreSQL (large-deployment path) with minimal query rewriting, unlike heavier ORMs that hide dialect differences until they leak.

## Local database: **SQLite** (via `better-sqlite3`), WAL mode

- Zero-configuration, single-file, trivially backed up by copying a file — ideal for "ease of deployment" and "educational environment suitability" (IT staff at schools are rarely DBAs).
- WAL mode allows concurrent reads (teacher dashboard) while writes happen (student conversations).
- Migration path to PostgreSQL documented for Stage 10 for large multi-school/district deployments; Drizzle schema is written dialect-agnostic from day one to make that migration mechanical rather than a rewrite.

## AI service layer: **Python + FastAPI**

Chosen as an isolated internal microservice (see architecture doc §3) because every local-inference runtime below is Python-native first.

### Local LLM inference: **llama.cpp** (via `llama-cpp-python` server mode), GGUF models

- The only local-inference runtime with genuinely mature CPU inference — critical since schools cannot be assumed to have GPUs. Quantized GGUF models (Q4/Q5) run acceptably on 8–16GB RAM CPU-only machines.
- Candidate models to vendor into `offline-sdk/ai-models/`: a 7–8B instruction-tuned model (e.g. Llama-3.1-8B-Instruct or Qwen2.5-7B-Instruct, GGUF Q4_K_M) for conversation/tutor/grammar-explanation, sized for CPU inference; exact model pinned in Stage 4.
- Abstracted behind the AI Service's internal `/v1/chat` contract so the model file can be swapped without any change to Node or client code (satisfies "AI model replacement").

### Grammar analysis: hybrid rules + local LLM

- Deterministic layer (LanguageTool running fully offline as a local Java process, or a rule-based grammar library) catches high-confidence categories (subject-verb agreement, article errors, tense) fast and cheaply.
- The local LLM is used for explanation generation, examples, and ambiguous cases the rules engine flags with low confidence — keeps latency and hardware cost down versus routing every message through the LLM.

### Embeddings + vector search: **sentence-transformers (local ONNX/PyTorch model) + sqlite-vec**

- A small local embedding model (e.g. `all-MiniLM-L6-v2`, ONNX export for CPU speed) for vocabulary similarity/recommendation.
- `sqlite-vec` extension keeps vector search inside the same SQLite file rather than standing up a separate vector DB process — fewer moving parts for a school deployment, satisfies "ease of deployment."

### Speech-to-text: **whisper.cpp** (base/small quantized model)

- Mature, CPU-friendly, fully offline, no Python GIL overhead concerns since it's a native binary invoked by the AI service.

### Text-to-speech: **Piper**

- Fast, fully offline, small per-voice model files (~50-100MB), natural-sounding output suitable for pronunciation practice — better fit than heavier options like Coqui TTS for CPU-only school hardware.

## Networking between client and server

- REST (JSON) for CRUD, WebSocket for streaming conversation responses (token-by-token LLM output) and live teacher-dashboard updates.
- LAN-only; server binds to the machine's LAN interface, desktop "standalone mode" binds to loopback only.

## Packaging/build tooling

- `pnpm` workspaces for the Node/TypeScript monorepo (backend + Electron app share types).
- `electron-builder` for offline Windows/Linux/macOS installers.
- `flutter build apk` for Android, distributed as a sideloaded APK (no Play Store dependency, matching offline/restricted-network requirement).
- All toolchains (Node, pnpm, Python, model files, Flutter SDK, Java for LanguageTool) vendored under `offline-sdk/` per the spec — see [04-repo-structure.md](04-repo-structure.md).

## Summary table

| Layer | Choice |
|---|---|
| Desktop shell | Electron |
| Android client | Flutter |
| Backend API | Node.js + TypeScript + Fastify |
| ORM | Drizzle |
| Database | SQLite (WAL) → PostgreSQL migration path |
| AI service | Python + FastAPI |
| LLM inference | llama.cpp / llama-cpp-python, GGUF |
| Grammar rules | LanguageTool (offline) + LLM fallback |
| Embeddings/vector search | sentence-transformers (ONNX) + sqlite-vec |
| Speech-to-text | whisper.cpp |
| Text-to-speech | Piper |
| Auth | JWT + argon2, local |
| Packaging | pnpm + electron-builder (desktop), Flutter build (Android) |
