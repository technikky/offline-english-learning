# Install Guide

For whoever sets this system up at a school — IT staff or a teacher acting as the local admin, not necessarily a developer. This describes installing the **v1.0.0 release build**, not the development workflow (see the root `README.md` for that).

## What you're installing

Three pieces, all running on one on-site computer (a "server" only in the sense that other devices on the same network connect to it — it doesn't need to be a dedicated machine, a normal classroom PC or a small NUC works fine):

1. **Desktop app** (Electron) — the teacher/admin/student client, and also what starts the backend.
2. **Backend** (Fastify + SQLite) — runs locally, listens on the school's LAN.
3. **AI service** (Python + local LLM) — also runs locally; no internet connection is used or required at any point after installation.

Android devices (phones/tablets) connect to the same backend over the LAN using the Android app — see `apps/android`.

## Requirements

- Windows 10/11 (the verified build target; Linux packaging exists but is config-only, not build-verified this release — see `docs/13-stage10-plan.md`).
- No internet connection required to run. Internet is only used once, during the initial install, if you're fetching the installer/dependencies fresh rather than from an offline USB/drive (see `offline-sdk/README.md` for the fully-offline install path used during development).
- A modern multi-core CPU is recommended — response speed from the local AI model scales with CPU thread count (`docs/13-stage10-plan.md` measured a 55% speedup from 4 to 16 threads). No GPU is required.

## Installing

1. Run the packaged installer (or, if only the unpacked build is available for this release — see `docs/13-stage10-plan.md`'s note on the NSIS installer's Developer-Mode build requirement — copy the `win-unpacked` folder anywhere and run the `.exe` inside it directly).
2. Launch the app. On first run with an empty database, the system automatically creates an **admin account** and writes its one-time password to a local file: `data/admin-credentials.txt`, next to wherever the app's data lives. There is no email/SMS step — this is a fully offline system, so this file is the only place that password exists. Read it, log in, and consider changing the password (`docs/17-admin-guide.md`).
3. From the admin console, create teacher accounts (`docs/17-admin-guide.md`). Teachers then create their own student accounts when registering a class roster (`docs/18-teacher-guide.md`) — there's no separate "bulk import" step in this release.
4. For devices other than the one running the backend (other classroom PCs, Android devices), point their client at the server machine's LAN IP address rather than `127.0.0.1`. Find that IP from the server machine (`ipconfig` on Windows) and enter it wherever the client asks for a server address.

## Optional: enabling HTTPS on the LAN

Off by default (see `docs/14-stage11-plan.md`). If your school's IT policy requires encrypted LAN traffic:

1. Run `node scripts/generate-tls-cert.js` once (requires `openssl`, bundled with Git for Windows) to generate a self-signed certificate into `data/tls/`.
2. Set the `TLS_ENABLED=true` environment variable before starting the backend.
3. Each client device will need to accept or install-trust the self-signed certificate the first time it connects — this is a genuine one-time step per device, not a bug, since the certificate isn't from a public certificate authority (there's no internet-facing domain to get one for).

## Backing up your data

Everything the system knows lives in one SQLite file. Use the admin console's **Backup & restore** panel (`docs/17-admin-guide.md`) rather than copying the file by hand while the server is running — the built-in backup uses SQLite's online-backup API, which is safe to run while the server is live; a raw file copy during active use is not guaranteed to be consistent.
