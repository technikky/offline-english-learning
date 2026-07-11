# Changelog

## v0.4.0 — Stage 4: AI conversation engine

- New AI Service (`apps/ai-service`, Python + FastAPI) wrapping a local llama.cpp model (`llama-cpp-python`). Streams token-by-token NDJSON responses from `POST /v1/chat`, with a system prompt assembled server-side from a scenario preset + CEFR difficulty level.
- Dev-time model: Qwen2.5-1.5B-Instruct (GGUF Q4_K_M, ~1.1GB), vendored under `offline-sdk/ai-models/`. The production-sized 7–8B model from the technology-selection doc is a config swap (`AI_MODEL_PATH`), deliberately not done in this session — see `docs/07-stage4-plan.md`.
- Backend: `conversations`/`messages` schema; scenario presets (`free_talk`, `role_play`, `interview`, `business`, `travel`, `daily`, `debate`); a v1 CEFR difficulty-estimation heuristic derived from a student's own message history (sentence length + vocabulary diversity); `POST /conversations`, `GET /conversations/:id`, and a streaming `POST /conversations/:id/messages` that proxies the AI service's NDJSON stream straight through to the client while persisting both sides of the exchange.
- Desktop (Electron): real streaming chat UI — scenario picker, chat log, and token-by-token rendering read live from the response's `ReadableStream`, replacing the profile-only view from Stage 3.
- Verified end-to-end via curl: admin creates a student, student starts a `daily` conversation, sends a message, and receives a live token stream from the real model appropriate to the chosen scenario and difficulty — both messages persisted correctly on refetch. 11 backend tests pass in total, including 4 new ones covering conversation creation/ownership/validation/auth-required and the difficulty heuristic's relative ordering.

## v0.3.0 — Stage 3: Authentication and user management

- Backend: `users`, `refresh_tokens`, `classes`, `class_students` tables; argon2id password hashing; JWT access tokens (15 min) + rotating opaque refresh tokens (30 days, stored hashed); `authenticate`/`requireRole` RBAC middleware.
- Routes: `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `POST /auth/change-password`, `POST /admin/users` (admin-only), `POST /teacher/classes` and `POST /teacher/classes/:id/students` (teacher-only, ownership-checked).
- Offline-specific admin bootstrap: first boot with no users creates an `admin` account with a random password written to `data/admin-credentials.txt` (no email/SMS channel exists to deliver it otherwise).
- Desktop (Electron) and Android (Flutter) both get real login screens wired to the backend, replacing the health-check-only placeholders from Stages 1–2.
- Verified end-to-end: admin bootstrap → admin creates a teacher via the API → teacher creates a class and registers a student → student logs in from the Android app on an emulator and sees their live profile and connection status. 6 backend tests cover login success/failure, refresh-token rotation and reuse rejection, `/auth/me` auth requirement, and RBAC denial of a student calling an admin route.

## v0.2.0 — Stage 2: Android client

- Flutter Android client (`apps/android`): manual LAN server IP/port entry persisted via `shared_preferences`, an `ApiClient` hitting the backend's `/health` endpoint, and a home screen showing live connection status.
- Verified end-to-end on an Android emulator (API 34, x86_64): built a debug APK, installed and launched it, entered the host-loopback alias `10.0.2.2`, and confirmed "Connected — db: true" against the real Fastify + SQLite backend from Stage 1 — visible on both the app screen and the backend's request log.
- Flutter SDK (3.27.1) and Android SDK (platform 34, build-tools 34.0.0, emulator + system image) installed for the project; analytics/telemetry disabled to match the project's no-telemetry stance.
- Documented in `offline-sdk/build-tools/README.md`: Android's command-line tooling breaks under a path containing spaces, so the SDKs are installed at a dedicated space-free path (`D:\dev-sdks`) rather than inside this repo's own path.

## v0.1.0 — Stage 1: Offline desktop foundation

- pnpm monorepo scaffold: `apps/backend`, `apps/desktop`, `packages/types`.
- Backend: Fastify server with a `/health` route backed by a real SQLite database (via `better-sqlite3` + Drizzle ORM), WAL mode enabled.
- Desktop: Electron shell rendering a page that polls `/health` and displays the live result — proves the full offline round trip (Electron → Fastify → SQLite) with zero network dependency.
- One-click scripts: `scripts/start-dev.{bat,sh}`, `scripts/rebuild.{bat,sh}`, `scripts/deploy.bat` (stub).
- `offline-sdk/` scaffolded with per-category placeholders and a documented vendoring strategy for Node/pnpm.
- Architecture, technology selection, 12-stage roadmap, repo structure, and Stage 1 plan documented under `docs/`.
