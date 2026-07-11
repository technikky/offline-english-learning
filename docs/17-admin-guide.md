# Admin Guide

For the school administrator (or whoever holds the `admin` account) using the desktop app's admin console.

## Logging in

The first admin account is created automatically the first time the backend starts with an empty database, with a random password written to `data/admin-credentials.txt` (see `docs/16-install-guide.md`). Log in with that email/password. There is currently no in-app "change password" button for the admin account specifically — use `POST /auth/change-password` (any authenticated user can change their own password) if you need to rotate it, or ask a developer to run it via the API directly.

Logging in as an admin takes you straight to the **admin console** — a different screen from the teacher dashboard or student chat view.

## System health

Shows, at a glance:

- **Backend DB** — whether the backend's own database connection is alive.
- **Backend uptime** — how long the current backend process has been running.
- **AI service** — whether the AI service process is reachable, and if so, whether its model is loaded, which model file path it's using, and how many CPU threads it's using for inference.
- **LanguageTool** — whether the grammar-checking service is reachable.

If AI service or LanguageTool show "unreachable," check that `scripts/start-dev.bat`/`.sh` (or your production start script) actually launched all three processes — the desktop app's own health check only covers the backend, so this dashboard is the way to confirm the other two are actually up.

## Server configuration

Read-only — host, port, whether TLS/HTTPS is enabled, the login rate limit, and the database file's location. Every one of these is set via an environment variable or command-line flag before the server starts, so there's no "save" button here: the point of this panel is visibility (useful when troubleshooting, or confirming a production deployment's settings actually took effect), not in-app editing.

## AI model management

Lists every `.gguf` model file found in the system's vendored model folder, with its file size and whether it's the currently active model. Clicking **Select** on a different model writes that choice down, but **does not swap the running model immediately** — the AI service needs to be restarted (stop and re-run the start script) to actually load the newly selected model. This is intentional: a single running AI service holds exactly one model in memory at a time, and swapping it mid-conversation isn't something that can be done safely without interrupting whoever is mid-request.

Use this if your school later adds a larger, more capable model file to the vendored models folder and wants to switch to it without editing configuration files by hand.

## Backup & restore

- **Create backup now** — takes an immediate, consistent snapshot of the entire database (all users, classes, conversations, grammar history, vocabulary, everything) into a timestamped file. Safe to run at any time, including while people are actively using the system.
- **Restore** — reverts the live database to a previous backup. This is destructive: anything created after that backup's timestamp is gone afterward. You'll be asked to confirm before it proceeds. Consider taking a fresh backup immediately before restoring an old one, in case you want to go back.

There's no automatic scheduled backup in this release — creating one is a manual action from this panel. If your school wants nightly backups, that's a good candidate for a scheduled task calling the same `POST /admin/backups` endpoint (see `docs/14-stage11-plan.md` for the API).

## Creating teacher and student accounts

The **Create teacher / student account** panel creates a new login directly. Give the account holder their email and the initial password you set here (there's no email delivery — this is fully offline, so you'll need to communicate the password out of band). Teachers can also create student accounts themselves when registering students into a class roster (`docs/18-teacher-guide.md`), which is usually the faster path for a whole class at once; use this admin panel mainly for creating teacher accounts, or for one-off student accounts outside a class context.
