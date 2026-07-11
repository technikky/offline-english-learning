# Offline AI English Learning Support System

An offline-first AI English learning platform for schools. See [project details.md](project%20details.md) and [project requirements.docx](project%20requirements.docx) for the source requirements, and [docs/](docs/01-architecture.md) for the architecture, technology selection, and 12-stage roadmap this project follows.

## Quick start (development)

Requires Node.js 22+ and Corepack-enabled pnpm (see [offline-sdk/node/README.md](offline-sdk/node/README.md) for the fully-offline install path).

```
pnpm install
scripts/start-dev.bat     # Windows
scripts/start-dev.sh      # macOS/Linux
```

This starts the local backend (Fastify + SQLite on `127.0.0.1:4310`) and launches the Electron desktop app, which shows a live `/health` check proving the offline round trip works end to end.

## Other scripts

- `scripts/rebuild.bat` / `.sh` — clean, reinstall from the offline package store, rebuild, ready to restart.
- `scripts/deploy.bat` — Stage 1 stub for a local production build + packaged Electron app; matures into full one-click deployment in Stage 10.

## Project layout

See [docs/04-repo-structure.md](docs/04-repo-structure.md).

## Current stage

Stage 8 — Student analytics. See [docs/11-stage8-plan.md](docs/11-stage8-plan.md) and [CHANGELOG.md](CHANGELOG.md).
