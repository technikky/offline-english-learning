# 12-Stage Development Roadmap

Each stage ends with: tests passing, docs updated, a commit with the message pattern `Stage NN: <summary>`, and a version tag `v0.N.0`. Stages are ordered so every stage produces a runnable, demoable increment — no stage leaves the system in a non-booting state.

## Stage 1 — Desktop foundation + offline environment + build system
- pnpm monorepo scaffold: `apps/desktop` (Electron), `apps/backend` (Fastify), shared `packages/types`.
- SQLite file created, Drizzle migration tooling wired up, empty schema.
- `offline-sdk/` populated with vendored Node, pnpm, and placeholders for later AI tooling.
- `start-dev.bat`/`.sh`, `rebuild.bat`/`.sh`, `deploy.bat` scaffolds (backend+frontend boot, even before features exist).
- Tag: `v0.1.0`.

## Stage 2 — Android client
- Flutter project scaffold (`apps/android`), LAN server-discovery + manual IP entry, shared API client generated from backend's OpenAPI schema.
- Login screen wired to Stage 3's auth once available; until then, a mock/local-only screen.
- Tag: `v0.2.0`.

## Stage 3 — Authentication and user management
- Users/Roles/Sessions schema, argon2 password hashing, JWT issuance/refresh, RBAC middleware.
- Admin can create teacher/student accounts; teacher can register students into classes.
- Desktop + Android login flows wired to real auth.
- Tag: `v0.3.0`.

## Stage 4 — AI conversation engine
- AI Service Layer stood up (FastAPI), llama.cpp server integrated, model vendored into `offline-sdk/ai-models/`.
- Conversation/Message schema, difficulty-adaptation heuristic (CEFR-level tagging based on user history), scenario presets (free talk, role-play, interview, business, travel, daily, debate).
- Streaming chat UI in desktop app.
- Tag: `v0.4.0`.

## Stage 5 — Grammar correction engine
- LanguageTool offline integration for deterministic checks; LLM fallback for explanations/examples via AI Service `/v1/grammar/check`.
- GrammarMistakes schema, correction UI inline in conversation view, "explain this mistake" AI Tutor entry point.
- Tag: `v0.5.0`.

## Stage 6 — Vocabulary learning system
- Vocabulary schema, personal notebook CRUD, embeddings pipeline (sentence-transformers + sqlite-vec) for synonym/antonym/recommendation lookups, CEFR tagging of words.
- Automatic recommendation surfaced after conversations based on words the student struggled with.
- Tag: `v0.6.0`.

## Stage 7 — Teacher dashboard
- Teacher console: class creation, student roster, assignment creation, review of flagged mistakes, report generation (PDF/CSV export, fully local).
- Tag: `v0.7.0`.

## Stage 8 — Student analytics
- Learning-history aggregation service: progress trends, grammar-weakness heatmap, vocabulary growth curve, practice frequency, estimated CEFR level.
- Student-facing progress view + teacher-facing per-student drilldown, reusing the same analytics service.
- Tag: `v0.8.0`.

## Stage 9 — Speech recognition and pronunciation
- whisper.cpp integration for speech-to-text input in conversations, Piper integration for AI voice output.
- Pronunciation-practice mode: record → transcribe → compare against target phrase → feedback.
- Tag: `v0.9.0`.

## Stage 10 — Deployment optimization
- Installer polish (electron-builder offline installers for Windows/Linux), Android APK signing/build pipeline.
- Performance pass on LLM/embedding inference (quantization tuning, response caching), evaluate Tauri migration if binary size/RAM becomes a blocker.
- PostgreSQL migration path validated (Drizzle dialect swap) for large-deployment scenarios; documented, not necessarily switched by default.
- Tag: `v0.10.0`.

## Stage 11 — Testing and security improvement
- Test coverage pass (unit + integration) across backend, AI service, and both clients.
- Security hardening: self-signed TLS for LAN traffic, rate limiting, audit logging, backup/restore verification, RBAC penetration pass.
- Tag: `v0.11.0`.

## Stage 12 — Production release
- Admin system completed: server configuration UI, AI model management (swap/update GGUF models from local files), backup/restore UI, system health monitoring dashboard.
- Full documentation set finalized (install guide, admin guide, teacher guide, student guide, architecture doc).
- Final packaging, changelog compiled, tag: `v1.0.0`.

## Notes on ordering deviations from the brief's suggested order

- Auth (Stage 3) is placed before AI conversation (Stage 4) rather than in parallel with Stage 1/2, because every later stage's data model (conversations, mistakes, vocabulary) is owned by a user — building AI features against unauthenticated stub users would require rework.
- Admin system is completed in Stage 12 rather than earlier because its main components (model management, backup/restore, health monitoring) only become meaningful once there are models, data, and a running system to manage — building it earlier would be scaffolding without substance.
