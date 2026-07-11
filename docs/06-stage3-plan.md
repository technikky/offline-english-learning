# Stage 3 Implementation Plan — Authentication and user management

## Objectives

1. Real user accounts with roles (`admin`, `teacher`, `student`), stored locally, no external identity provider.
2. Password hashing with argon2id; JWT access tokens + rotating opaque refresh tokens, both fully local (no external auth service).
3. RBAC middleware protecting routes by role.
4. Admin can create teacher/student accounts. Teacher can create a class and register students into it (minimal class model now; full class management is Stage 7).
5. Desktop and Android clients get real login screens replacing the Stage 1/2 placeholders.

## Architecture changes

- Backend gains an `auth` domain (users, refresh tokens) and a minimal `classes` domain, both behind the same Fastify + Drizzle + SQLite stack from Stage 1 — no new infrastructure.
- Introduces the RBAC middleware pattern (`authenticate` + `requireRole(...)` preHandlers) that every future protected route (Stage 4+) will reuse.

## Database schema additions

- `users`: id, email (unique), password_hash, role (`admin`|`teacher`|`student`), display_name, must_change_password, created_at.
- `refresh_tokens`: id, user_id, token_hash, expires_at, created_at, revoked_at — refresh tokens are opaque random strings; only their hash is stored, and each use rotates to a new token (old one is revoked), so a stolen-and-replayed token gets caught next legitimate use.
- `classes`: id, name, teacher_id, created_at.
- `class_students`: id, class_id, student_id, created_at.

## Auth flows

- `POST /auth/login` — email + password → argon2 verify → short-lived JWT access token (15 min) + opaque refresh token (30 days, stored hashed).
- `POST /auth/refresh` — refresh token → validated against stored hash + expiry → rotates to a new access+refresh pair, revokes the old refresh token.
- `POST /auth/logout` — revokes the given refresh token.
- `GET /auth/me` — requires a valid access token, returns the caller's profile.

## RBAC

- `authenticate` preHandler: verifies the JWT from `Authorization: Bearer <token>`, attaches `request.user = { id, role }`.
- `requireRole(...roles)` preHandler factory: 403s if `request.user.role` isn't in the allowed list.
- Applied per-route; no route is protected by default (explicit is better than a global auth gate that later routes have to opt out of).

## Admin bootstrap (offline-specific problem)

There is no email/SMS delivery in a fully offline system, so the first admin account can't be provisioned via "forgot password" style flows. On first server boot, if `users` is empty, the backend:

1. Creates one `admin` account with a randomly generated password.
2. Writes that password once to `data/admin-credentials.txt` (gitignored, local filesystem only) and logs a warning to stdout.
3. Sets `must_change_password = true` on that account; the `/auth/login` response includes this flag so clients can force a password-change prompt (the change-password endpoint itself is a small addition here, not deferred).

## Admin / Teacher routes (minimal, scoped to what Stage 3 needs)

- `POST /admin/users` (role: admin) — create a `teacher` or `student` account (email, password, displayName, role).
- `POST /teacher/classes` (role: teacher) — create a class owned by the caller.
- `POST /teacher/classes/:id/students` (role: teacher, must own the class) — create a student account and attach to the class in one call, matching "teacher registers students."

Full class/assignment/report management is Stage 7 (Teacher dashboard); this is only enough surface for Stage 3's "teacher registers students into classes" requirement.

## Client wiring

- **Desktop (Electron)**: renderer gets a login form (email/password), stores the access+refresh token pair in memory (renderer JS state) for the session, shows the logged-in user's name/role, and a logout button. No persistence across app restarts yet — that's a small Stage-4-adjacent follow-up once there's something worth staying logged in for.
- **Android (Flutter)**: `ConnectScreen` → `LoginScreen` (new) → `HomeScreen` now shows the logged-in user instead of just the health check. Tokens persisted via `shared_preferences` (matching the existing server-config storage approach); secure/encrypted token storage is a Stage 11 (security hardening) upgrade, not a Stage 3 blocker.

## Testing procedure

1. Backend unit tests: login success, login with wrong password, RBAC denies a student calling an admin route, admin creates a teacher, teacher creates a class and registers a student.
2. Manual end-to-end: start backend fresh (empty DB) → confirm admin bootstrap credentials appear in `data/admin-credentials.txt` → log in as admin from the Electron app → create a teacher account → log in as that teacher from the Android emulator → create a class and register a student → confirm on both clients.

## Documentation update

- This file, plus updates to `docs/01-architecture.md` §7 (security model) noting the bootstrap mechanism, and `CHANGELOG.md`/`README.md` current-stage pointer.

## Git commit information

- Commit message: `Stage 03: Authentication and user management completed`
- Tag: `v0.3.0`

## Explicitly deferred to later stages

- Full class management (assignments, rosters beyond registration, reports) — Stage 7.
- Persistent desktop login session — revisit once Stage 4 gives users a reason to stay logged in between app launches.
- Secure/encrypted token storage on Android, TLS for LAN traffic — Stage 11 (security hardening).
- Password reset flows beyond admin-created accounts — no email/SMS channel exists in a fully offline system; admin-mediated reset is the permanent design, not a stopgap.
