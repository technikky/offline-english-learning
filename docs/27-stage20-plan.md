# Stage 20 Implementation Plan — Multi-school (multi-tenant) support

## Objective

Support multiple schools on one deployment, per the master brief: multiple schools with logical separation, school administrators, per-school teacher/student isolation, and a platform-level administrator — while keeping single-school deployments working exactly as before.

## 1. Tenancy model

- New `schools` table (id, name, createdAt).
- `users.schoolId` — nullable FK to `schools`. A user belongs to one school; the one exception is the **platform super-admin**, whose `schoolId` is null.
- New role **`super_admin`** added to the existing `admin`/`teacher`/`student` set. The role hierarchy is now: `super_admin` (platform — manages schools and their admins) → `admin` (one school's administrator) → `teacher` → `student`.

This is intentionally a **logical-separation** model (a `schoolId` column), not separate databases per school — matching the brief's "independent databases *or* logical separation" and the architecture doc's note that a `Schools` tenancy table is an additive change, not a rearchitecture.

## 2. How isolation is actually enforced

The pre-existing per-owner scoping already prevents cross-school data leaks, so multi-tenancy mostly needed the *organizing* layer plus correct school assignment on user creation:
- Teachers only ever query their own classes (scoped by `teacherId` since Stage 3); students only see their own conversations/results. No route returns another owner's data.
- **User creation now assigns the right school automatically**: when a school `admin` creates a teacher/student (`/admin/users`), or a teacher registers a student (`/teacher/classes/:id/students`), the new user inherits the creator's `schoolId`. So an admin can't accidentally (or deliberately) place users in another school — they simply inherit the creator's tenant. Verified with a real two-school test: School A's admin creates a teacher → the teacher lands in School A, never School B.

## 3. Bootstrap (backward compatible)

First-boot bootstrap now creates **two** accounts (both written to `data/admin-credentials.txt`):
- a platform **super-admin** (`superadmin@platform.local`) — manages schools, and
- a **"Default School"** with its own **admin** (`admin@school.local`, unchanged from before).

So an existing single-school deployment is unchanged: log in as `admin@school.local` and manage the one Default School exactly as in v1.0.0. Multi-school is opt-in: log in as the super-admin to add more schools.

## 4. Routes (super_admin only)

- `GET /schools` — lists schools with per-role member counts (one grouped query).
- `POST /schools` — create a school.
- `POST /schools/:id/admins` — create an `admin` account scoped to that school.

The RBAC penetration sweep (Stage 11) was extended to cover these three new routes and to include a `super_admin` token in the wrong-role matrix.

## 5. Profile carries school context

`UserProfile` now includes `schoolId` and `schoolName` (resolved via a small shared `auth/profile.ts` helper used by login, `/auth/me`, and user-creation responses). The desktop admin console header shows "admin — <School Name>" so an admin always knows which tenant they're operating in.

## 6. Migration for existing dev DBs

`ensureSchema` includes the `schools` table and `users.school_id` in its `CREATE TABLE`s (covers fresh DBs / tests). For a dev DB created before this stage, a lightweight `runMigrations()` checks `PRAGMA table_info(users)` and `ALTER TABLE users ADD COLUMN school_id` if missing — additive and safe. (The role `CHECK` constraint can't be altered in place in SQLite; a pre-existing DB that needs the new `super_admin` value would be recreated — acceptable since there's no production deployment and the documented backup/restore covers real data preservation.)

## 7. Desktop UI

New **super-admin view** (`superAdminView`): a schools table (name + admin/teacher/student counts + a "+ Admin" action), a "create school" form, and an "add admin to <school>" panel. The role branch in `showLoggedIn()` routes a `super_admin` here.

## Testing / verification

1. Backend: `routes/schools.test.ts` (4 cases — create/list/add-admin happy path with school-name resolution, 404 for unknown school, **tenant-isolation test** proving an admin's created teacher inherits that admin's school and not another's, and a non-super-admin is denied). RBAC sweep extended. Full backend suite: **91/91 passing** (existing 87 + 4).
2. **Real end-to-end** with the live stack: confirmed bootstrap writes both accounts + a Default School; super-admin login has `schoolId: null`; `GET /schools` shows Default School; created "Riverside High" and added its admin (profile correctly `schoolId: 2, schoolName: "Riverside High"`); the Riverside admin's new teacher got `schoolId: 2` while the Default admin's teacher got `schoolId: 1` (isolation); and via the real UI, logged in as super-admin, saw both schools with counts, and created a third school ("Hillcrest Academy") that appeared in the refreshed list.

## Git commit information

- Commit message: `Stage 20: Multi-school (multi-tenant) support completed`
- Tag: `v1.8.0`

## Explicitly deferred

- **Per-school AI settings / per-school content** — the model choice, curated grammar/reading/listening/writing content, and quiz categories are currently global. Scoping them per school is a natural extension now that `schoolId` exists (e.g. a `school_id` column on a future content-overrides table), but isn't needed until schools actually want to differ.
- **School branding** (logos/colors) — a `branding` JSON column on `schools` plus desktop theming; cosmetic, deferred.
- **Cross-school super-admin analytics dashboards** — the counts endpoint is the foundation; richer per-school analytics reuse the Stage 8 aggregation scoped by school.
- **Moving a user between schools / deactivating a school** — administrative lifecycle operations beyond create; add when a real deployment needs them.
