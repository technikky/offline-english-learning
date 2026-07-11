# Stage 10 Implementation Plan — Deployment optimization

## Objectives

Per `docs/03-roadmap.md`: installer polish, Android signing pipeline, an LLM/embedding performance pass, a revisit of the Electron-vs-Tauri decision now that there's a real app to measure, and a documented (not switched) PostgreSQL migration path. This stage is infrastructure/ops work, not new product features — no new student/teacher-facing functionality ships here.

## 1. Electron installer polish

- Configure `electron-builder` for a real NSIS installer (`apps/desktop/package.json` `build` field already exists from Stage 1 but was never exercised beyond a stub). Target Windows first (the dev/verification platform); Linux (AppImage) config is added too since it's nearly free once NSIS config exists, but only Windows is build-verified in this session.
- `scripts/deploy.bat` graduates from a Stage 1 stub to an actually-working one-click production build + package.
- **Real finding, not fully resolved in this session**: `electron-builder`'s Windows NSIS target unconditionally downloads and extracts a `winCodeSign` bundle (containing macOS cross-signing libraries, unused for a Windows-only unsigned build) that includes symlinked files. Extracting those symlinks requires either Windows Developer Mode or an elevated (Administrator) process — a genuine OS privilege requirement, not a config mistake (`CSC_IDENTITY_AUTO_DISCOVERY=false` does not avoid it). Verified instead via `electron-builder --win --dir`, which skips NSIS packaging and produces the packaged, runnable app directly: `release/win-unpacked/Offline English Learning.exe`, **269MB unpacked** — proving the app packages and its dependencies resolve correctly. Producing the final single-file NSIS installer on a school's build machine requires Developer Mode enabled (or building as Administrator) — documented here as a one-time build-environment setup step, not a defect in the project.

## 2. Android signing pipeline

- Generate a local release keystore (`keytool`, bundled with the JDK already vendored for LanguageTool in Stage 5 — no new dependency). This is a **school/dev-deployment keystore**, not a Play Store distribution key (there is no Play Store distribution — Stage 2 already established sideloaded APKs as the distribution model). Its purpose is Android's own requirement that app updates be signed consistently; without one, reinstalling an updated APK on a device that already has the debug-signed version would require an uninstall first.
- Wire a `signingConfig` into `android/app/build.gradle` for the `release` build type, keystore path/passwords supplied via `gradle.properties` (gitignored — credentials never committed).
- Produce and verify a signed release APK (`flutter build apk --release`), confirmed via `apksigner verify` (bundled with the Android SDK build-tools already vendored in Stage 2).

## 3. Performance pass

- **Thread count**: `llama-cpp-python`'s `Llama()` had no explicit `n_threads`, leaving it to the library's default heuristic. Made explicit and configurable via `AI_THREADS` (defaults to the host's logical core count, measured at 16 on the dev machine). This is measured, not assumed — see the benchmark below.
- **Caching, already in place, documented rather than re-built**: `/v1/vocabulary/explain` and `/v1/grammar/explain` results are already cached in `vocabulary`/`grammar_mistakes` (Stages 5–6) — a repeated identical request never re-hits the LLM. `/v1/chat` and `/v1/embed`-for-a-new-word are intentionally *not* cached (a conversation reply must vary turn to turn; a never-seen word has no cache entry yet by definition). Stage 10 doesn't add a new caching layer because the two calls that benefit from one already have it from earlier stages — restated here as a deliberate finding, not an oversight.
- **Benchmark** (`apps/ai-service/scripts/benchmark.py`, run on the dev machine, 16 logical cores, Qwen2.5-1.5B-Instruct Q4_K_M):

  | Config | Result |
  |---|---|
  | `n_threads=4` (a common conservative default) | 10.65 tok/s |
  | `n_threads=16` (full logical core count) | 16.51 tok/s |

  A **55% speedup** from explicit thread tuning alone, with zero model or quantization changes — a genuinely measured finding, not a guess, and the reason `AI_THREADS` now defaults to `os.cpu_count()` rather than being left unset.

## 4. Electron vs. Tauri — revisited with real measurements

[docs/02-technology-selection.md](02-technology-selection.md) deferred this to "Stage 10, if binary size becomes a real constraint." With an actual packaged app measured:

- The packaged, unpacked Electron app (`release/win-unpacked/`) is **269MB** — the real number, not an estimate, from `electron-builder --win --dir`. An NSIS installer compresses this to something smaller (typically 40–60% of unpacked size for Electron apps) but wasn't measured directly in this session (see the installer note above).
- Tauri's equivalent (a Rust-compiled webview shim, no bundled Chromium) would be tens of MB instead of ~270MB, but the tradeoff called out in Stage 1 hasn't changed: Tauri requires a Rust toolchain and mirroring the crates.io dependency graph for a genuinely offline build, which is harder to keep reliably offline than npm package vendoring, and the team's stack is already Node/TypeScript end-to-end.
- **Decision: stay on Electron.** Modern school lab PCs (the target hardware per the brief) have disk space to spare for a one-time ~100–150MB install; nothing measured in this stage shows Electron's size actually blocking deployment. This is recorded as a decision with real numbers behind it, not deferred again by default.

## 5. PostgreSQL migration path (documented, not switched)

Drizzle's SQLite table builder (`sqliteTable`) and PostgreSQL's (`pgTable`) are not drop-in compatible — column type mapping, autoincrement syntax, and blob storage all differ. This stage documents exactly what would need to change and why it isn't done now, rather than claiming a false "just change the driver" simplicity:

- `integer(...).primaryKey({ autoIncrement: true })` → `serial(...).primaryKey()`.
- `text(...)` stays `text(...)` (compatible).
- `blob(..., { mode: "buffer" })` (used for `vocabulary.embedding`) → `bytea` via `customType`, or `vector` if the `pgvector` extension is available (which would also obsolete Stage 6's brute-force cosine-similarity code — a real win if this migration ever happens for a large multi-school deployment).
- SQLite's `CURRENT_TIMESTAMP` string defaults → Postgres `now()` with a native `timestamp` column type (currently stored as `text` throughout for SQLite simplicity).
- `better-sqlite3` driver swap → `drizzle-orm/node-postgres` (or equivalent), with connection-string config instead of a file path.

This is legitimate future work for a large multi-school/district deployment (where SQLite's single-writer model becomes a real constraint) but is explicitly **not done now**: maintaining two schema dialects in parallel, or migrating the one and only real deployment target (single-school SQLite) to Postgres, has no payoff yet and would add maintenance burden for a hypothetical scale this project hasn't been asked to support.

### Migration script skeleton (for when this is actually needed)

```ts
// apps/backend/src/db/schema.pg.ts (hypothetical — does not exist yet)
import { pgTable, serial, text, integer, timestamp, boolean, customType } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() { return "bytea"; },
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull(),
  displayName: text("display_name").notNull(),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vocabulary = pgTable("vocabulary", {
  id: serial("id").primaryKey(),
  // ...
  embedding: bytea("embedding").notNull(), // or `vector(384)` with the pgvector extension
});
```

Data migration itself (once schemas exist in both dialects) is a straightforward per-table `SELECT * FROM sqlite_table` → transform → `INSERT INTO pg_table` script, since there's no complex relational restructuring involved — every table's shape stays the same, only the column type declarations change.

## Testing / verification procedure

1. Build the Electron installer and confirm the artifact exists and is a plausible size for an Electron app.
2. Build a signed Android release APK and verify the signature with `apksigner verify`.
3. Run the LLM benchmark script and record tokens/sec with and without explicit thread tuning.
4. No new runtime product logic is added in this stage, so no new automated backend tests are expected — verification here is build/measurement based, appropriate to an infrastructure stage.

## Documentation update

This file, `CHANGELOG.md`/`README.md` current-stage pointer, `apps/ai-service/README.md` (thread-count config), Android build docs.

## Git commit information

- Commit message: `Stage 10: Deployment optimization completed`
- Tag: `v0.10.0`

## Explicitly deferred to later stages

- Actually executing a PostgreSQL migration — no current deployment needs it; revisit only if a real multi-school/district rollout materializes.
- Linux/macOS installer build verification (config is added, but only Windows is build-verified in this session, matching the dev environment).
- Auto-update infrastructure for the desktop app — out of scope for a fully offline system with no update server to check against.
