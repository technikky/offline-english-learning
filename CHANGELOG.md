# Changelog

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
