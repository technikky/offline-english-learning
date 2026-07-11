# Stage 12 Implementation Plan — Production release

## Objectives

Per `docs/03-roadmap.md`: complete the admin system (server configuration UI, AI model management, backup/restore UI, system health monitoring dashboard), finalize the full documentation set (install/admin/teacher/student guides plus the existing architecture doc), do a final packaging pass, and tag `v1.0.0`.

## 1. A real bug found while building the admin console: CORS

The desktop renderer loads `index.html` from a `file://` origin and calls the backend via `fetch()` on `http://127.0.0.1:4310`. This is genuinely cross-origin from Chromium's point of view — Electron enforces the same web platform security model as any Chromium browser unless `webSecurity` is explicitly disabled (it isn't, and shouldn't be). Without CORS response headers, every `fetch()` from the renderer fails with no server-side trace at all (the browser blocks it client-side before the response body is even readable).

This had gone undetected through Stages 1–11 because of this project's established verification limitation (documented since Stage 3): the actual Electron window can't be screenshotted or driven interactively in this environment, so every prior stage's UI "verification" was a clean-process-launch check plus **separate** curl calls against the backend — never an actual `fetch()` call fired from the loaded page and observed end-to-end. Stage 12 is the first stage to load `index.html` in a real browser context (via a throwaway local static file server) and drive it with actual clicks/form input rather than curl, and that's what surfaced this.

**Fix**: `@fastify/cors` registered in `server.ts` with `origin: true` (reflects the request's `Origin` header, which covers `file://`'s `null` origin and any future Android/webview origin too). This is safe for this project's auth model — authentication is a `Bearer` token in the `Authorization` header, not a cookie, so a permissive origin allowlist doesn't reopen CSRF the way it would for cookie-based sessions.

**Verified**: loaded the real `index.html` + `renderer.js` against a real backend instance in a browser context, watched the `/health` poll go from "Backend unreachable" to "Backend OK" after the fix, then logged in as admin, created a backup, selected an AI model, and created a teacher account — all through actual UI clicks, not curl.

## 2. Admin console (desktop)

The admin role previously had **no dedicated UI at all** — `showLoggedIn()` only branched on `role === "teacher"`, so an admin logging into the desktop app silently landed on the student chat screen. New `#adminView` in `index.html`/`renderer.js`:

- **System health**: calls new `GET /admin/system-health`, which checks the backend's own DB connection, the AI service's `/health` (enhanced this stage to also report `modelPath`/`threadCount`), and LanguageTool's `/v2/languages`, each with a 2-second timeout so one down dependency doesn't hang the dashboard. Shown as OK/unreachable badges plus backend uptime.
- **Server configuration**: new `GET /admin/config` — a **read-only** view (host, port, TLS-enabled flag, auth rate limit, DB file path). Deliberately not an editable settings form: every one of these is a process-level config (env var or CLI flag) that requires a restart to take effect either way, so an in-app "save" button would be misleading about what it actually does. Read-only status, not a defect.
- **AI model management**: new `GET /admin/ai-models` (scans `offline-sdk/ai-models/` for `.gguf` files) and `POST /admin/ai-models/select` (writes the chosen path to `data/ai-model-config.json`). `apps/ai-service/app/model.py`'s `get_model_path()` checks this file ahead of the `AI_MODEL_PATH` env var. This is model **selection**, not live hot-swapping — switching still requires restarting the AI service process, called out directly in the UI's own copy, because a single in-memory llama.cpp instance can't safely swap models mid-request.
- **Backup & restore**: reuses Stage 11's `/admin/backups*` routes with a real UI — list, one-click create, and restore-with-confirmation (a `confirm()` dialog, since restore is destructive).
- **Create teacher/student account**: `POST /admin/users` already existed since Stage 3 but, like the rest of the admin role, had no UI anywhere — admins could only be exercised via curl/Postman. Added here as part of "admin system completed."

## 3. Documentation set finalized

New guides under `docs/`, each written for its actual audience rather than assuming prior stage-by-stage context:

- `16-install-guide.md` — offline installation/setup for whoever deploys this at a school (IT staff, not developers).
- `17-admin-guide.md` — using the admin console from §2, plus the offline admin-bootstrap credential flow from Stage 3.
- `18-teacher-guide.md` — classes, rosters, assignments, mistake review, reports (Stage 7), student drilldown (Stage 8).
- `19-student-guide.md` — conversation practice, grammar corrections, vocabulary notebook, pronunciation practice, progress view.
- `01-architecture.md` gets a short "Status: v1.0.0" note pointing at this being the completed system, rather than a living in-progress doc.

## 4. Final packaging

- Electron: retried the Stage 10 NSIS installer blocker. **Same result**: Developer Mode is still not enabled on this build machine, so `electron-builder --win` still fails extracting `winCodeSign`'s symlinked macOS cross-signing files ("Cannot create symbolic link: A required privilege is not held by the client"). Confirmed via `electron-builder --win --dir`: a fresh, real packaged app rebuilt at `apps/desktop/release/win-unpacked/` (269MB, timestamp-verified as a genuine rebuild this session, not stale from Stage 10). The NSIS installer step remains a one-time build-machine setup requirement (enable Developer Mode or build as Administrator), not a project defect — unchanged conclusion from Stage 10.
- Android: rebuilt the release APK (`flutter build apk --release`, 20.7MB) against the current schema/route set and re-verified its signature with `apksigner verify --print-certs` — same certificate as Stage 10's keystore, confirming the signing pipeline still works end to end. Nothing in Stages 11–12 touched the Android client, which remains on its Stage 3 login-only baseline (a standing, explicitly-tracked gap from `docs/03-roadmap.md`'s backlog note, not new scope for this stage).

## Testing / verification procedure

1. Backend: full suite passes (48 tests — 45 from Stage 11 plus 3 new ones for `/admin/config` and `/admin/ai-models`), plus the RBAC sweep extended to cover the 4 new admin routes (401/403 checked, same pattern as Stage 11).
2. AI service: `pytest` extended with `tests/test_model.py` (4 cases covering `get_model_path()`'s override-file resolution: no file, valid file, file pointing at a missing model, malformed JSON) — 11 tests total.
3. Manual end-to-end UI verification (see §1) — the first stage to actually click through the desktop UI rather than relying solely on curl, made possible by the CORS fix.
4. Final full build (`pnpm run build` across all workspaces) + full test suite green.

## Documentation update

This file, the four new guides, `01-architecture.md` status note, `CHANGELOG.md`/`README.md`, `apps/ai-service/README.md` (model-selection override), `apps/backend` route list additions.

## Git commit information

- Commit message: `Stage 12: Production release completed`
- Tag: `v1.0.0`

## Explicitly deferred (post-v1.0 backlog, per `docs/03-roadmap.md`)

- Android client catch-up (conversation/vocabulary/grammar/speech UI) — tracked since Stage 3, still not in scope for a stage that's about admin tooling and documentation, not new client feature parity.
- Reading/listening/writing practice, quiz generator, homework system, multi-school tenancy — the `project requirements.docx` backlog, unchanged from the Stage 3 decision to keep the current architecture.
- Live AI-model hot-swapping without a restart — would require the AI service to manage multiple loaded models or a supervisor process; out of scope for a single-process, single-model design.
