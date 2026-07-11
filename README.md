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

**v1.0.0 — all 12 stages complete.** See [docs/15-stage12-plan.md](docs/15-stage12-plan.md) and [CHANGELOG.md](CHANGELOG.md) for the final stage, or [docs/03-roadmap.md](docs/03-roadmap.md) for the full history.

## Guides

- [Install guide](docs/16-install-guide.md) — setting the system up at a school.
- [Admin guide](docs/17-admin-guide.md) — the admin console (system health, server config, AI model management, backup/restore, account creation).
- [Teacher guide](docs/18-teacher-guide.md) — classes, rosters, assignments, mistake review, reports.
- [Student guide](docs/19-student-guide.md) — conversation practice, grammar corrections, vocabulary, pronunciation practice.

## Security features (Stage 11)

- **Rate limiting**: `/auth/login` and `/auth/refresh` are limited to 10 requests/minute/IP.
- **TLS**: opt-in via `TLS_ENABLED=true` (run `node scripts/generate-tls-cert.js` first to generate a self-signed cert into `data/tls/`). Off by default so the plain-HTTP dev workflow is unchanged.
- **Audit logging**: login/logout/admin actions/backups are recorded in the `audit_logs` table.
- **Backup/restore**: admin-only `POST /admin/backups`, `GET /admin/backups`, `POST /admin/backups/:filename/restore` — see [docs/14-stage11-plan.md](docs/14-stage11-plan.md) for the mechanism.
