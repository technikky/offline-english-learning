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

## One-click batch files (Windows)

Each covers one part of the lifecycle, so you can jump straight to the one you need:

- **`scripts\install.bat`** — first-time install on a machine that already has this repo (with its vendored `offline-sdk` assets) copied onto it, e.g. from a USB drive per [the install guide](docs/16-install-guide.md). Installs Node deps from the offline store, builds everything, sets up the AI service's Python venv, and checks that the vendored model/LanguageTool/voice files are actually present.
- **`scripts\setup-dev-env.bat`** — one-click setup for a **developer's** machine from a fresh `git clone` (online `pnpm install`, Python venv, a full build, and runs the backend + AI-service test suites to confirm the environment is healthy). Large vendored binaries are gitignored and not fetched by this script — see its own output for pointers.
- **`scripts\run.bat`** — **operate** an already-installed system: starts LanguageTool, the AI service, and the backend from their built artifacts (not dev-watch mode), waits for each to become healthy, then launches the desktop app (the packaged build if one exists under `apps\desktop\release\`, otherwise the unpackaged build).
- **`scripts\start-dev.bat`** / `.sh` — the **development** equivalent of `run.bat`: same health-check chain, but launches the backend and desktop app in dev/watch mode for active development.
- **`scripts\rebuild.bat`** / `.sh` — clean, reinstall from the offline package store, rebuild, ready to restart.
- **`scripts\deploy.bat`** — package a distributable build (Electron installer/`--dir` build); see [docs/13-stage10-plan.md](docs/13-stage10-plan.md) for the Windows Developer-Mode requirement for the NSIS installer step.
- **`scripts\generate-tls-cert.js`** — one-time self-signed TLS certificate generation for opt-in HTTPS (see Security features below).

## Project layout

See [docs/04-repo-structure.md](docs/04-repo-structure.md).

## Current stage

**v1.24.0 — post-v1.0.0 platform expansion, Stage 36 (Interface translation) complete.** All 12 originally-planned stages shipped as v1.0.0; development continues in further scoped stages per a master development brief expanding this into a full AI English Tutor platform (per-school content/settings, teacher content management, and more — tracked stage by stage, same methodology as Stages 1–12). The platform now hosts multiple schools under a platform super-admin, and students have eight practice modules: Conversation (with a voiced AI avatar), Grammar, Reading, Listening, Writing, Pronunciation, Vocabulary, and Quizzes — plus a spaced-repetition **Review** flow (SM-2), a short **adaptive placement test** that assesses each learner's CEFR level, a structured **Path** that sequences every module into an ordered A1→C1 route with progress tracking, and support for learning **Mandarin Chinese** as well as English (curated Chinese grammar/reading/listening with pinyin, an HSK 1–6 path, a Chinese-speaking AI partner, Mandarin speech input/output via a vendored multilingual Whisper model and Mandarin voice, pitch-contour **tone scoring** for Mandarin pronunciation, and Chinese writing prompts and quiz categories — so all six lesson types are covered in Chinese across HSK 1–4). The English path now runs A1→**C2** across 6 units and 50 lessons, backed by a curated 160-word CEFR wordlist that seeds the spaced-repetition deck; Chinese has an equivalent 120-word HSK list and its own HSK 1–6 path of 6 units. The student interface is available in English or 中文, independently of the language being learned. See [docs/43-stage36-plan.md](docs/43-stage36-plan.md) and [CHANGELOG.md](CHANGELOG.md) for the latest, or [docs/03-roadmap.md](docs/03-roadmap.md) for the original 12-stage history.

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
