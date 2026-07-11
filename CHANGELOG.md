# Changelog

## v0.1.0 — Stage 1: Offline desktop foundation

- pnpm monorepo scaffold: `apps/backend`, `apps/desktop`, `packages/types`.
- Backend: Fastify server with a `/health` route backed by a real SQLite database (via `better-sqlite3` + Drizzle ORM), WAL mode enabled.
- Desktop: Electron shell rendering a page that polls `/health` and displays the live result — proves the full offline round trip (Electron → Fastify → SQLite) with zero network dependency.
- One-click scripts: `scripts/start-dev.{bat,sh}`, `scripts/rebuild.{bat,sh}`, `scripts/deploy.bat` (stub).
- `offline-sdk/` scaffolded with per-category placeholders and a documented vendoring strategy for Node/pnpm.
- Architecture, technology selection, 12-stage roadmap, repo structure, and Stage 1 plan documented under `docs/`.
