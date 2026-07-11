# Stage 1 Implementation Plan — Desktop foundation + offline environment + build system

## Objectives

1. Stand up the monorepo skeleton (`apps/desktop`, `apps/backend`, `packages/types`).
2. Get an Electron window rendering a page served by a local Fastify backend, talking to a real (empty) SQLite database — a fully offline "hello world" through the whole stack.
3. Establish the `offline-sdk/` vendoring strategy and populate it with the Node/pnpm runtime needed for this stage.
4. Deliver one-click `start-dev`, `rebuild`, and a stub `deploy` script.
5. Set up the Git repository itself (this project currently has no `.git`) with the workflow described in the brief.

## Architecture changes

- Introduces the Node/Fastify backend and Electron shell layers from the architecture doc; AI Service Layer and Python are out of scope until Stage 4 (their folders are stubbed but empty).
- Establishes the repository-level `pnpm` workspace boundary between `apps/*` and `packages/types` that every later stage builds on.

## Implemented features (deliverables)

- `pnpm-workspace.yaml` + root `package.json` wiring `apps/desktop`, `apps/backend`, `packages/types`.
- `apps/backend`: Fastify server with a `/health` route, Drizzle + `better-sqlite3` wired to `data/app.db`, one no-op migration to prove the pipeline works end to end.
- `apps/desktop`: Electron main process that spawns/attaches to the backend on `localhost`, a renderer showing a minimal page that calls `/health` and displays the result — proving the full offline round trip.
- `packages/types`: shared `HealthResponse` type used by both.
- `offline-sdk/node/`: vendored Node + pnpm binaries with a README documenting the exact versions and how they were obtained, so a machine with zero internet access can install and run.
- `scripts/start-dev.{bat,sh}`: starts backend, waits for `/health`, launches Electron pointed at it.
- `scripts/rebuild.{bat,sh}`: cleans `dist/` folders, reinstalls from the vendored offline package cache, rebuilds, restarts.
- `scripts/deploy.bat`: stubbed for Stage 1 (produces a production build of backend + Electron packaging via electron-builder); full one-click production deploy matures in Stage 10.
- `.gitignore` covering `node_modules/`, `data/`, `dist/`, build artifacts.
- Git repository initialized in this directory (`git init`) since none currently exists.

## Testing procedure

1. On a machine with no network access, run `scripts/start-dev.sh` (or `.bat`).
2. Confirm the backend logs "listening on 127.0.0.1:<port>".
3. Confirm the Electron window opens and displays a successful `/health` response sourced from the SQLite-backed backend.
4. Kill the app, run `scripts/rebuild.sh`, confirm it cleans and rebuilds without needing `npm install` to hit the network (verifies `offline-sdk/node` vendoring works).
5. Run the (minimal) backend unit test for the `/health` route.

## Documentation update

- This file plus `docs/01-04` constitute the documentation baseline; `README.md` at repo root gets a "Quick start" section pointing at `scripts/start-dev`.

## Git commit information

- Commit message: `Stage 01: Offline desktop foundation completed`
- Tag: `v0.1.0`
- Changelog entry (in `CHANGELOG.md`): "Stage 1: Monorepo scaffold, Electron+Fastify+SQLite offline round trip, one-click dev/rebuild/deploy scripts, offline-sdk vendoring strategy established."

## What is explicitly deferred to later stages

- Any real authentication (Stage 3), AI features (Stage 4+), Android client (Stage 2).
- Production TLS/security hardening (Stage 11).
- Actual model vendoring into `offline-sdk/ai-models` (Stage 4).

---

**This plan is ready for implementation on your go-ahead.** Once approved, the next step is scaffolding the actual code under `apps/` and `packages/`, running `git init`, and producing the first commit/tag per the workflow above.
