# Stage 11 Implementation Plan — Testing and security improvement

## Objectives

Per `docs/03-roadmap.md`: a test coverage pass across backend, AI service, and both clients, plus security hardening — self-signed TLS for LAN traffic, rate limiting, audit logging, backup/restore verification, and an RBAC penetration pass. Like Stage 10, this is an infrastructure/hardening stage: no new student/teacher-facing product features ship here.

## 1. Test coverage pass

- **Backend**: 44 tests already exist (one file per route module, Stages 3–9). This stage adds two focused additions rather than a wholesale rewrite: a coverage measurement baseline (`node --test --experimental-test-coverage`, built into Node 22 — no new dependency) recorded in this doc, and a new `security/rbac.test.ts` that systematically walks every protected route and asserts it rejects both unauthenticated requests and requests from the wrong role. This doubles as the "RBAC penetration pass" required below — one test suite serves both goals rather than duplicating effort.
- **AI service**: previously verified only by manual curl calls, zero automated tests. The model-loading routes (`/v1/chat`, `/v1/embed`, speech) aren't practical to unit-test without the actual GGUF/ONNX/Whisper/Piper assets loaded, but the parsing logic in `app/prompts.py` (the lenient `EXPLANATION:`/`EXAMPLE:` marker parser used by both grammar and vocabulary explain) is pure functions with no model dependency — the natural place for real automated tests. Adds `pytest` to `requirements.txt` and `tests/test_prompts.py` covering well-formed input, missing markers, extra whitespace, and multi-line content.
- **Clients (Electron desktop, Flutter Android)**: no new automated UI test suites are added this stage. Both apps have been verified every stage via real process launches and (for Android) `flutter build`/emulator runs rather than mocked unit tests, because the actual integration points (streaming chat, mic recording, PDF export) are exactly the parts that are hard to usefully unit-test without the real backend running — the existing per-stage manual E2E verification is treated as the client-side test coverage for this project, and that reasoning is recorded here rather than silently skipped.

## 2. Self-signed TLS for LAN traffic

- The brief's threat model is a school LAN: multiple classroom devices talking to one on-prem server over plain HTTP today. Add `scripts/generate-tls-cert.js`, which shells out to `openssl req -x509` to generate a self-signed cert/key pair into `data/tls/` (gitignored, matches the `data/` pattern already used for the DB and JWT secret). `node:crypto` can generate the raw keypair but not the X.509 certificate structure itself without a real ASN.1 encoder, and pulling in a userland cert-generation library (e.g. `selfsigned`) for a one-time setup script is worse than depending on `openssl`, which is already bundled with Git for Windows (this project's documented dev toolchain) and virtually every Linux distro.
- `server.ts` gains a `TLS_ENABLED` env var (default `false`, preserving today's plain-HTTP dev workflow unchanged): when `true`, Fastify is constructed with `https: { key, cert }` instead of plain HTTP, and clients connect via `https://`. Documented as opt-in rather than forced-on, since a self-signed cert means every client (desktop Electron, Android Flutter) would need to trust it explicitly — a real deployment step for a school IT admin, not a code change, so this stage wires the *capability* and documents the trust-step rather than flipping it on by default in dev.

## 3. Rate limiting

- `@fastify/rate-limit` (added as a dependency this stage) applied specifically to `/auth/login` and `/auth/refresh` — the brute-force-relevant endpoints — rather than globally, since a global limit would throttle legitimate high-frequency use (streaming chat tokens, conversation polling) for no security benefit. Limit: 10 requests per minute per IP, returns `429` past that.

## 4. Audit logging

- New `audit_logs` table (`id, userId (nullable — login failures have no known user), action, detail, ipAddress, createdAt`). Logged events: login success, login failure, logout, admin user creation, and backup/restore actions (see below) — the security-relevant subset, not every request (a full request log is what the existing Fastify `logger: true` already provides, to stdout).
- `audit/log.ts` — a small `recordAuditEvent()` helper, called from the relevant routes.

## 5. Backup/restore verification

- The original brief's admin-system design calls for backup/restore (deferred to Stage 12's admin UI), but Stage 11's "backup/restore verification" goal is about the underlying mechanism actually working, not the UI. Since the whole DB is one SQLite file, `better-sqlite3`'s built-in `.backup()` method (an online hot backup — safe to call while the server is serving requests, no connection-closing required) is used rather than a raw file copy.
- New admin-only routes: `POST /admin/backups` (creates `data/backups/<timestamp>.db`), `GET /admin/backups` (lists existing backups with size/date), `POST /admin/backups/:filename/restore` (copies the chosen backup file back over the live DB file — this one genuinely does need the connection quiesced, done by closing and reopening the `better-sqlite3` handle around the copy).
- Verification: create a backup, mutate data (create a throwaway user), restore, confirm the throwaway user is gone — a real round-trip test, not just "the file exists."

## 6. RBAC penetration pass

- Covered by `security/rbac.test.ts` above: enumerates every `preHandler: [authenticate, requireRole(...)]`-protected route in the codebase and asserts (a) no `Authorization` header → 401, (b) a valid token for the wrong role → 403, (c) a valid token for the right role → not 401/403 (the happy path is already covered by each route's own existing test file, so this suite only re-asserts the negative space).

## Testing / verification procedure

1. `node --test --experimental-test-coverage` — record baseline coverage percentage. **Result**: 45/45 tests passing, 94.54% line / 88.04% branch / 91.28% function coverage across `apps/backend/src`.
2. New `security/rbac.test.ts` passes, covering every protected route.
3. New AI-service `pytest` suite passes.
4. Manual curl verification: rate limit trips after 10 rapid `/auth/login` calls (429), TLS-enabled server serves `https://127.0.0.1:4310/health` successfully with a self-signed cert, backup → mutate → restore round-trip confirmed via direct DB query.
5. Full existing test suite (44 + new tests) still passes — no regressions from schema/route additions.

## Documentation update

This file, `CHANGELOG.md`/`README.md` current-stage pointer, `apps/backend/README.md` (if present) or inline route docs for the new `/admin/backups*` routes and `TLS_ENABLED`/rate-limit config, `apps/ai-service/README.md` (pytest instructions).

## Git commit information

- Commit message: `Stage 11: Testing and security improvements completed`
- Tag: `v0.11.0`

## Explicitly deferred to later stages

- Backup/restore **UI** (admin console button) — Stage 12's admin system finishes this; Stage 11 only proves the underlying mechanism.
- Forcing `TLS_ENABLED=true` by default — left opt-in since it requires a per-device trust step outside this codebase's control (documented, not automated away).
- Full client-side (Electron/Flutter) automated test suites — the existing per-stage manual E2E verification methodology is treated as sufficient client coverage, as reasoned above.
