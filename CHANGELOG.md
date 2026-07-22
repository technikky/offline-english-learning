# Changelog

## v1.16.0 — Stage 28: Chinese as a target language

- **The platform now teaches Mandarin Chinese, not just English.** A new "I'm learning" selector switches a student between English and Chinese; the content catalogs, the curriculum path, and the AI conversation partner all follow the setting.
- **The bundled model already speaks Chinese.** The vendored LLM is Qwen — a Chinese-native model family — so Chinese conversation is a *prompting* change, not a new model. The AI now replies in simplified characters with pinyin and a short English gloss on every line, pitched at the matching HSK band, and won't fall back to English-only.
- **Curated Chinese content**: 7 grammar topics (A1–B2: word order, 吗 questions, measure words, 了, 把, 比 comparisons, 得 complements) with pinyin and glosses inline, and 3 reading passages (A1–B1) that ship with full pinyin and an English translation revealed by toggles.
- **A Chinese learning path**: `中文 Chinese: HSK 1 to HSK 4`, four units, served by the existing `GET /curriculum` for Chinese learners.
- **CEFR stays the internal scale; HSK is a display label** (`A1→HSK 1` … `C2→HSK 6`). This means placement, difficulty estimation, curriculum ordering and progress all keep working with no refactor.
- **Content ids are globally unique across languages** (`zh-` prefixes), so lookups stay language-agnostic and only listing filters — a much smaller change than threading a language parameter everywhere.
- New `users.target_language` column (additive migration, constant default, no backfill) and `GET`/`PUT /me/language`.
- **Deferred, with reasons documented** in the plan doc: Chinese listening (needs a Chinese Piper voice) and pronunciation/speech input (bundled Whisper is `tiny.en`, English-only) both need new vendored models; Chinese writing prompts/quizzes, an HSK vocabulary seed, CJK font bundling and UI translation are follow-ups. The Chinese path currently covers HSK 1–4.
- Verified: backend **139 tests passing** (+6), AI service **53 pytest passing** (+6), backend `tsc` clean, types build clean, `renderer.js` `node --check` clean. The reference-integrity guard now runs over every language's course and asserts the Chinese path only references Chinese-tagged content.

## v1.15.0 — Stage 27: Structured curriculum path

- **The eight practice modules are now an ordered route, not an à-la-carte menu.** A curated course, `English: A1 to C1`, sequences grammar, reading, listening, writing, conversation and quiz work into five units (one per CEFR level, A1–C1), giving a learner a clear "what next" from beginner to advanced.
- **New 🗺️ Path tab** with an overall progress bar, per-unit `done/total` counts and CEFR badges, a **START HERE** marker on the recommended unit, and lessons as tickable steps. Clicking a lesson **deep-links straight into that activity** (opens the exact grammar topic / passage / clip / prompt, or preselects the conversation scenario / quiz category).
- **Progress is derived, not tracked separately**: completion is computed at read time from the existing per-module result tables (same approach as the Stage 22 history view), so finishing an activity in its own module ticks it off in the path automatically — and existing student progress counts retroactively. **No new tables were added.**
- **The path is a pure overlay**: lessons reference existing content by id rather than duplicating it. A reference-integrity test validates every lesson id against the real content modules, so a typo or removed passage fails the suite instead of shipping a dead lesson.
- **Seeded by the placement test** (Stage 26): `recommendedUnitId` is the first unfinished unit at or above the learner's placement level, with sensible fallbacks. New route `GET /curriculum`.
- Known limitations, documented in the plan doc: quiz completion is by category (shared across units), the C1 unit is thinner because no C1 listening/writing content exists yet, and units are advisory rather than locked.
- Verified: backend **133 tests passing** (+12: 3 reference-integrity, 5 pure progress/recommendation, 4 end-to-end), backend `tsc` clean, types build clean, `renderer.js` `node --check` clean. Live boot against a throwaway DB confirmed `GET /curriculum` is registered and reachable (401 unauthenticated vs 404 for unknown paths) with `dbConnected: true`.

## v1.14.0 — Stage 26: Adaptive CEFR placement test

- **Learners now get a real starting level instead of a hardcoded B1 guess.** A short adaptive placement test assesses a student in ~1 minute and stores the result, which seeds their conversation difficulty (and, in a later stage, the structured learning path). Entirely offline — no new models or vendored assets.
- **Adaptive up/down staircase** (`placement/staircase.ts`): the test starts mid-scale at B1 and serves one block of questions per CEFR rung — passing a rung moves up, failing moves down — concluding as soon as the pass/fail boundary is found (or a level is topped out at C2 / floored at A1). Placement usually takes only 2–4 blocks. The scheduler is a pure, DB-free module, unit-tested in isolation.
- **Curated item bank** (`placement/items.ts`): static CEFR-tagged multiple-choice items, ≥3 per level A1–C2, curated for reliability like the grammar curriculum and reading passages. No item repeats within a test.
- **Answers graded server-side** (mirrors the quiz pattern): new `placement_sessions` table stores the staircase state and the served item ids, so the client never sees correct answers. New routes `POST /placement/start`, `POST /placement/:sessionId/answer`, `GET /placement/status`.
- **Seeds conversation difficulty**: `estimateDifficultyLevel()` now uses the placement result when a student has no message history yet, instead of assuming B1; the existing history-based heuristic still takes over once there's conversation data.
- **New "My level" sidebar section** with a Take/Retake button; the test runs in a modal (one block of questions at a time) and shows the assessed CEFR level with a friendly label. New `users.placement_level` / `placement_completed_at` columns (additive migration).
- Verified: backend **121 tests passing** (+12: 7 staircase + 5 route), backend `tsc` clean, types build clean, `renderer.js` `node --check` clean, and the DB migration validated on a real SQLite file with a pre-existing users table.

## v1.13.0 — Stage 25: Spaced-repetition vocabulary review (SRS)

- **The vocabulary notebook is now a spaced-repetition system, not just a saved-word list.** Each saved word carries an SM-2 schedule (the algorithm behind Anki); words come back for review just before they'd be forgotten, which is the key mechanism for growing vocabulary toward an advanced level. Entirely offline — the scheduler is a few lines of arithmetic with no models or vendored assets.
- **New 🔁 Review tab** with a due-count badge. It runs a flashcard flow — the word is shown first (active recall), "Show answer" reveals the definition/example/synonyms, and four **Again / Hard / Good / Easy** buttons grade recall and schedule the next review (1 day → 6 days → `interval × ease`, ease floored at 1.3; "Again" resets the card to relearn tomorrow and counts a lapse).
- **New routes**: `GET /vocabulary/review/queue` (due cards, oldest-due first), `GET /vocabulary/review/stats` (`due`/`learning`/`mature`/`total`), `POST /vocabulary/review/:id` (grade a card; own-only → 404 otherwise, unknown rating → 400). The notebook responses now embed the SRS schedule with a server-computed `due` flag.
- **Schema**: six additive columns on `vocabulary_notebook` (`repetitions`, `ease_factor`, `interval_days`, `lapses`, `due_at`, `last_reviewed_at`). A guarded, idempotent migration adds them to existing DBs and backfills `due_at` from `created_at`, so every previously-saved word becomes due for review immediately the first time SRS is enabled.
- The SM-2 scheduler lives in a pure, DB-free `vocabulary/srs.ts` so it is unit-tested in isolation and swappable later without touching callers.
- Verified: backend **109 tests passing** (+10: 8 scheduler + 2 route), backend `tsc` clean, types build clean, `renderer.js` `node --check` clean, and the DB migration validated on a real SQLite file simulating a pre-Stage-25 database.

## v1.12.0 — Stage 24: Vendor Qwen3-8B + model choice

- **A second, production-sized model is now available**: Qwen3-8B (Q4_K_M, ~5.0 GB) is vendored alongside the default Qwen2.5-1.5B, so a deployment can pick the right one for its hardware. Verified it loads and generates under llama-cpp-python 0.3.33.
- **Choosing between the two models reuses the existing admin Model-management UI** (Stage 12): it lists every `.gguf` in `offline-sdk/ai-models/` and persists the choice to `data/ai-model-config.json`, read by the AI service on startup. The 8B appears automatically — no code change to the selector. Switching requires an AI-service restart (a single in-memory llama.cpp instance can't be hot-swapped mid-request).
- **Qwen3 reasoning output is stripped automatically**: Qwen3 is a hybrid-reasoning model that emits a leading `<think>…</think>` block. New `reasoning.py` removes it from both the streaming chat path (`ThinkFilter`, handles split tags / trailing blank lines) and every structured endpoint (`strip_think_blocks`), so replies and marker-parsed outputs stay clean. It's a transparent no-op for Qwen2.5, which never emits these tags.
- Verified end-to-end with the 8B selected: a conversation returned a clean, natural reply with no `<think>` leakage, and `/v1/vocabulary/explain` parsed correctly. AI service: 47 pytest tests (+9). Model README documents both models, the selection flow, and fresh-clone restore commands.

## v1.11.0 — Stage 23: Instructor-added conversation topics

- **Teachers can now add their own conversation topics.** A new "Conversation topics" panel in the teacher sidebar lets an instructor create a topic (title + AI role/instructions) and delete their own; new `custom_topics` table.
- **Custom topics appear in students' conversation picker** alongside the 21 built-ins, under a "School topics" group. The student dropdown is now populated from a new `GET /topics` (built-in + school's custom topics) instead of a static list.
- **The teacher's instructions drive the AI**: a custom topic is addressed as `custom:<id>`; its prompt is threaded through the chat request (`build_system_prompt(..., custom_prompt)`) so the AI role-plays the teacher's scenario, while the built-in scenario dictionary stays untouched.
- **Tenant-scoped** (reuses Stage 20): a student only sees/can start topics from their own school; a bogus or cross-school `custom:<id>` → 400. New teacher routes `GET/POST/DELETE /teacher/topics` (own-only; students get 403).
- Verified end-to-end via curl (create → appears in student `/topics` → start conversation → cross-school + bogus denied → own-only delete) and unit tests. Backend: 99 tests passing (+4). AI service: 38 pytest tests (+2).

## v1.10.0 — Stage 22: Learning history view

- **New 📜 History tab** giving each student one chronological view of everything they've practiced across all seven modules (conversations, grammar, reading, listening, writing, quizzes, pronunciation).
- Built as a **read-time aggregator** (`getLearningHistory`) over the existing per-module tables — no data duplication. Returns merged, newest-first entries plus `totalActivities` and an `averageScore` computed over scored entries only (ungraded items are listed but excluded from the average).
- New `GET /history` (own history only). New shared types `LearningActivityType` / `LearningHistoryEntry` / `LearningHistoryResponse`.
- Verified via unit tests (empty, cross-module merge/ordering/average, per-student isolation, auth 401) and live (a student with one started conversation → `totalActivities: 1`, unauthenticated → 401).

## v1.9.0 — Stage 21: Hands-free voice conversation mode

- **Voice mode for conversations**: after Start conversation, a new Voice-mode toggle enables a real-time, back-and-forth spoken exchange with the AI partner **with no Send button** — the app listens, detects end-of-speech, transcribes, sends, speaks the reply, and automatically resumes listening. Fully hands-free, mimicking a natural conversation. Text mode is unchanged.
- Implemented as a renderer-side **voice-activity-detection state machine** (Web Audio RMS + thresholds/timers) orchestrating the existing Whisper STT (`/speech/transcribe`), Piper TTS (`speakAsAvatar`), and streaming chat. The mic is gated off during processing/speaking so the AI's own voice is never recorded. No backend/AI-service changes.
- `sendMessage` refactored to share one path (`sendMessageContent`) between typed and spoken turns.
- Note: live mic-driven turn-taking can't be automated (no microphone in the headless test browser); validated by construction and manual use in the Electron app.

## v1.8.0 — Stage 20: Multi-school (multi-tenant) support

- **The platform can now host multiple schools on one deployment.** New `schools` table + a `schoolId` on every user (logical separation, not separate databases — an additive change, no rearchitecture).
- **New `super_admin` platform role** that manages schools and their admins, above the existing school-scoped `admin` → `teacher` → `student` hierarchy. New super-admin-only routes: `GET/POST /schools` and `POST /schools/:id/admins`.
- **Tenant isolation enforced on user creation**: teachers/students created by a school admin (or students registered by a teacher) automatically inherit the creator's school — an admin can't place users in another school. Verified with a real two-school test.
- **Backward compatible**: first-boot bootstrap now creates *both* a platform super-admin and a "Default School" with its own admin (`admin@school.local`, unchanged). A single-school deployment works exactly as before; multi-school is opt-in via the super-admin.
- `UserProfile` now carries `schoolId`/`schoolName`; the admin console header shows which school the admin manages.
- **Desktop**: new super-admin view — a schools table with per-role member counts, create-school, and add-school-admin. Verified end-to-end (bootstrap → create school → add admin → tenant-isolated teacher creation → UI create-school).
- Backend: 91 tests passing (4 new + RBAC sweep extended to the super-admin routes).

## v1.7.0 — Stage 19: Quiz generator module

- **New AI Quiz Generator**: pick a category (Grammar / Vocabulary / Everyday English) and difficulty (CEFR), and the AI generates a 5-question quiz mixing multiple-choice and true/false, auto-graded with a per-question explanation and score.
- **Answers kept server-side**: a generated quiz is stored in a new `quiz_instances` table and only the question+options are sent to the client; correct answers and explanations are revealed only after submission (graded server-side). Ownership enforced — you can't submit someone else's quiz.
- New `GET /quiz/progress` (recent graded quizzes + average score).
- **Desktop**: new "❓ Quiz" tab — category/difficulty selectors, a recent-quizzes summary, radio-button questions, and post-submit grading that annotates each question correct/incorrect inline with the answer + explanation and a score.
- Verified end-to-end: via curl (generate hides answers, submit grades 3/5 and reveals them, progress recorded) and via the real UI (vocabulary A2 quiz generated, answered, graded 60% with inline explanations).
- Backend: 87 tests passing (5 new). AI service: 36 pytest tests (4 new).

## v1.6.0 — Stage 18: Writing module

- **New Writing Module**: 4 scaffolded prompts (A1–B2), each with a topic, target vocabulary, grammar focus, word-count target, and hints — not a blank page. The student writes a response and gets structured AI feedback.
- **Hybrid analysis**: concrete grammar/spelling/punctuation errors come from **LanguageTool** (deterministic, reused from Stage 5) as exact original→correction pairs; the higher-level judgment (overall assessment, vocabulary/coherence scores, strengths, actionable suggestions, and a **model answer**) comes from the LLM via a new `/v1/writing/analyze`. Degrades gracefully to AI-only feedback if LanguageTool is down.
- New `writing_submissions` table + `GET /writing/progress` (submission history + average score).
- **Desktop**: new "✍️ Writing" tab — prompt cards, a scaffolded prompt view, a textarea with a live word counter, and a feedback panel (overall, scores table, strengths/suggestions, LanguageTool grammar/spelling issues, and the model answer).
- Verified end-to-end through the real UI + full stack: submitted an essay containing "recieve", and the feedback showed the LLM's assessment/scores/model-answer **plus LanguageTool's real "recieve → receive" correction**; progress updated.
- Backend: 82 tests passing (6 new). AI service: 32 pytest tests (4 new).

## v1.5.0 — Stage 17: Listening module

- **New Listening Module**: 4 curated audio clips across CEFR A1–B2, each with an AI-generated comprehension quiz, a dictation mode, and playback controls (speed 0.75x–1.5x, loop, hidden-by-default transcript).
- **Fully offline via TTS, no audio files/codecs**: a clip is a curated script whose audio is synthesized client-side through the existing Piper `/speech/synthesize` — which means the Stage 16 male/female voice selection applies here too. Teacher-uploaded MP3/FLAC/etc. is deferred (documented) since decoding those offline needs codecs the project doesn't bundle.
- **Reuse over duplication**: comprehension questions come from the same generic AI generator the Reading module uses (no duplicate endpoint); dictation scoring reuses the pronunciation module's word-level similarity, now extracted into a shared `speech/textSimilarity.ts` used by both. Comprehension is generated once per clip and cached (`listening_comprehension_cache`), consistent with reading.
- New `listening_results` table + `GET /listening/progress` for per-clip best score and overall average.
- **Desktop**: new "🎧 Listening" tab — clip cards with progress, an audio panel (play/speed/loop/show-transcript), a comprehension quiz, and sentence-by-sentence dictation (play a sentence → type it → word-level accuracy + correct answer revealed).
- Verified end-to-end with the live stack: real AI comprehension generated + cached, both full-clip and per-sentence audio synthesized (200 OK), dictation scored a typed attempt at 88%, comprehension submit scored 100% (4/4), progress updated.
- Backend: 76 tests passing (10 new). AI service: 28 pytest tests (unchanged — listening reuses the reading endpoint).

## v1.4.0 — Stage 16: AI conversation avatar with male/female voice selection

- **The AI conversation partner now has a visible avatar that speaks its replies aloud.** A voice selector (female/male) in the conversation sidebar swaps between a **female avatar + female voice** and a **male avatar + male voice**, exactly matching the two. The avatar bobs and its mouth animates for the duration of each spoken reply.
- **Vendored a second Piper voice** (`en_US-ryan-medium`, male) alongside the original female `en_US-lessac-medium` — voice selection didn't exist before this; there was only one voice. Confirmed the two are genuinely distinct models (different MD5, audibly different synthesis).
- AI service `app/speech.py` now lazily loads and caches one Piper voice per gender; `/v1/speech/synthesize` and the backend `/speech/synthesize` route take a `voice: "male" | "female"` param (defaulting to female, so every prior caller is unchanged). The single voice setting also drives the pronunciation-practice and reading-passage "Listen" buttons for consistency.
- Avatars are inline SVGs (no image files — fully offline/self-contained). "Speak replies aloud" is a toggle (on by default); off makes it a silent no-op.
- Verified end-to-end through the real UI + full stack: avatar switches male↔female with the selector, the correct `voice` param is sent per gender (request bodies captured), distinct audio is produced per gender through the full backend→AI path, and the speaking animation activates during playback and clears after. (The auto-speak-from-a-live-streamed-reply step is verified via the `speakAsAvatar` function directly, since the in-app preview browser doesn't consume the conversation route's hijacked streaming response — a preview-only limitation; the real Electron Chromium handles it, and the streaming path itself was verified via curl in Stage 13.)
- Backend + AI service test suites extended (AI service 28 pytest tests; backend speech-route voice-forwarding tests).

## v1.3.0 — Stage 15: Reading module

- **New Reading Module** (previously nonexistent): 5 curated passages across CEFR A1-C1 (a simple park story up through an academic AI-ethics piece), each with an AI-generated summary, vocabulary highlights, and a 4-question comprehension quiz.
- **Comprehension caching, deliberately different from Stage 14's grammar exercises**: a passage's quiz is generated once and cached (`reading_comprehension_cache`), not regenerated per read -- a reading test should stay consistent, unlike a grammar drill which should vary each attempt. Verified the cache actually prevents a second AI call on a repeat read.
- **Audio playback reused existing infrastructure with zero new AI-service code**: "Listen to passage" calls the same `POST /speech/synthesize` (Piper TTS) built in Stage 9 for pronunciation practice -- a direct payoff of building shared, reusable AI service endpoints instead of one-off ones per feature.
- New `reading_results` table + `GET /reading/progress` for per-passage best score and overall average, same aggregation pattern as Stage 8/14.
- **Real finding**: same class of small-model quality limitation as Stage 14 -- one live-generated question had a duplicate option, and the vocabulary list over-included nearly every content word rather than a curated subset. Documented in `docs/22-stage15-plan.md`, not treated as a bug.
- **Desktop UI**: new "📖 Reading" tab (third alongside Conversation/Grammar) -- passage cards with progress, full passage view with Listen button and clickable vocabulary chips (added directly to the existing notebook), and a comprehension quiz with live scoring. Verified end-to-end with the live LLM: real summary/questions generated, audio synthesis confirmed (200 OK), quiz answered and scored (75%, 3/4), progress updated correctly.
- Backend: 64 tests passing (6 new). AI service: 24 pytest tests passing (4 new).

## v1.2.0 — Stage 14: Grammar learning module

- **New Grammar Learning Module**: a curated 9-topic curriculum across beginner/intermediate/advanced (Present Simple, Past Simple, Articles, Prepositions, Present Perfect, Passive Voice, Conditionals, Modal Verbs of Deduction, Relative Clauses), each with an explanation and real examples. Curriculum is static/curated code, not AI-generated or a DB table — reliability for foundational teaching content matters more than variety there.
- **AI-generated practice exercises**: new `POST /v1/grammar/exercise` (multiple-choice or fill-in-the-blank), graded exact-match (case-insensitive) against the AI's own generated answer. New `grammar_exercise_attempts` table + `GET /grammar/progress` for per-topic and overall accuracy tracking.
- **Real finding**: verified against the live 1.5B dev model that multiple-choice distractor quality can be weak (observed duplicate options in one generation) — documented as a known small-model limitation in `docs/21-stage14-plan.md`, not a bug, with a swap to a production-sized model as the real fix.
- **Desktop UI**: new "📘 Grammar" tab (alongside "💬 Conversation") — topic cards with progress bars, lesson detail view, and a practice panel with live exercise generation/grading. Verified end-to-end through the actual UI: a real exercise generated by the live LLM, answered, graded, and reflected in progress.
- Backend: 58 tests passing (7 new). AI service: 20 pytest tests passing (5 new).

## v1.1.0 — Stage 13: Conversation module redesign

- **21 topic-grounded scenarios**, up from 7 generic modes: kept `free_talk`/`role_play`/`debate` as open-ended modes, added/renamed the rest to concrete situations — `travel`, `airport`, `restaurant`, `business_meeting` (was `business`), `job_interview` (was `interview`), `shopping`, `technology`, `sports`, `movies`, `daily_life` (was `daily`), `hospital`, `hotel`, `school`, `university`, `coffee_shop`, `emergency`, `family`, `culture`. Renaming is a documented breaking change for old stored scenario strings (no real deployment exists yet, so accepted).
- **AI pedagogy**: every scenario's system prompt now gets a shared `PEDAGOGY_INSTRUCTIONS` block instructing the model to keep asking genuine follow-up questions, reference earlier parts of the conversation, correct mistakes by natural recasting (LanguageTool's explicit correction already covers the "explain the rule" side), teach vocabulary in context, and encourage longer student answers. Verified with a real live conversation (not just unit tests): the AI stayed in character as a restaurant server and asked real contextual follow-ups across two turns.
- **Friendly difficulty labels**: CEFR A1–C2 now display as Beginner/Elementary/Intermediate/Upper Intermediate/Advanced/Native-like in the progress panel — CEFR remains the internal representation everywhere (no rearchitecture needed, since the whole difficulty-estimation pipeline already keys on CEFR).
- **Deduplication**: the previously-duplicated `VALID_SCENARIOS` array (identically defined in both `conversations.ts` and `assignments.ts`) is now one shared `isValidScenario()` backed by `packages/types`' `ALL_SCENARIOS`.
- Backend: 51 tests passing (3 new). AI service: 15 pytest tests passing (4 new).

## v1.0.0 — Stage 12: Production release

- **Real bug found and fixed: cross-origin requests from the desktop app were silently broken.** The renderer loads `index.html` from a `file://` origin and calls the backend via `fetch()` — genuinely cross-origin under Chromium's security model (which Electron enforces same as any browser unless `webSecurity` is disabled, which it isn't). Every prior stage's "verification" relied on curl calls made separately from the UI (a documented limitation since Stage 3 — this environment can't screenshot or drive the actual Electron window), so this had never been exercised through an actual `fetch()` call before. Found this stage by loading the real UI in a browser context and clicking through it for the first time. Fixed with `@fastify/cors` (`origin: true` — safe here since auth is bearer-token, not cookie-based, so this doesn't reopen CSRF).
- **Admin console**: the `admin` role previously had no dedicated UI at all (`showLoggedIn()` only branched on `teacher`, so an admin fell into the student chat screen). New desktop admin console: system health dashboard (backend/AI-service/LanguageTool reachability + AI service's active model/thread count), read-only server configuration viewer, AI model management (list vendored `.gguf` files, select one — writes `data/ai-model-config.json`, which `model.py` checks ahead of `AI_MODEL_PATH`; requires an AI service restart to take effect, by design, not a hot-swap), backup/restore controls (reusing Stage 11's API), and account creation for teacher/student roles (existed via API since Stage 3, never had a UI).
- **Documentation set finalized**: `docs/16-install-guide.md`, `17-admin-guide.md`, `18-teacher-guide.md`, `19-student-guide.md` — each written for its actual audience (IT staff, admin, teacher, student) rather than assuming developer context. `01-architecture.md` marked `Status: v1.0.0`.
- **Final packaging verified**: Electron `--dir` packaged build re-confirmed (269MB, fresh rebuild this session) — the NSIS installer's Developer-Mode/symlink requirement is unchanged from Stage 10 and remains a build-machine setup step, not a defect. Android release APK rebuilt (20.7MB) and re-signature-verified against the Stage 10 keystore.
- Backend test suite grew to 48 tests (3 new: `/admin/config`, `/admin/ai-models` list, and a 404 case for selecting a nonexistent model), plus the RBAC sweep extended to the 4 new admin routes. AI service `pytest` suite grew to 11 tests (4 new, covering `get_model_path()`'s override-file resolution).

## v0.11.0 — Stage 11: Testing and security improvements

- **Test coverage baseline**: `node --test --experimental-test-coverage` recorded 45/45 backend tests passing at 94.54% line / 88.04% branch / 91.28% function coverage. New `security/rbac.test.ts` systematically sweeps every `requireRole`-protected route (14 routes across admin/teacher/assignments/reports/analytics/teacherReview) asserting both an unauthenticated 401 and a wrong-role 403 — the "RBAC penetration pass". AI service gets its first automated tests: a 7-case `pytest` suite for `app/prompts.py`'s lenient marker-based response parsers (well-formed input, missing markers, whitespace/multiline, invalid CEFR fallback).
- **Rate limiting**: `@fastify/rate-limit` applied specifically to `/auth/login` and `/auth/refresh` (10 requests/minute/IP, `429` past that) rather than globally, so brute-force attempts are blunted without throttling legitimate high-frequency use (streaming chat, polling). Verified with 12 rapid login attempts: the first 10 return `401` (wrong password), the 11th and 12th return `429`.
- **Self-signed TLS for LAN traffic**: opt-in via `TLS_ENABLED=true` (default stays plain HTTP). `scripts/generate-tls-cert.js` shells out to `openssl` (bundled with Git for Windows) to generate a cert/key pair into `data/tls/`. Verified: server boots as `https://127.0.0.1:PORT`, `curl -k` reaches `/health` successfully. Left opt-in rather than default-on because a self-signed cert requires a per-device trust step (documented, not automated away).
- **Audit logging**: new `audit_logs` table; login success/failure, logout, admin user creation, and backup/restore actions are recorded (the security-relevant subset — the full request log already goes to stdout via Fastify's own logger).
- **Backup/restore verification**: admin-only `POST /admin/backups` (better-sqlite3's online hot-backup API — safe to call while serving requests), `GET /admin/backups`, `POST /admin/backups/:filename/restore` (closes and reopens the live SQLite connection around the file copy, since restoring genuinely does require quiescing the connection unlike backing up). Verified with a real round trip: created a backup, created a throwaway user, restored, confirmed the throwaway user's login now fails while the pre-backup admin account is intact.
- No new client-side (Electron/Flutter) automated test suites this stage — the existing per-stage manual E2E verification methodology is treated as sufficient client coverage, reasoned explicitly in `docs/14-stage11-plan.md` rather than silently skipped.

## v0.10.0 — Stage 10: Deployment optimization

- **Electron installer**: NSIS (Windows) and AppImage (Linux, config-only) configured. Real finding: building the final single-file NSIS installer requires Windows Developer Mode or Administrator privileges (electron-builder needs symlink-creation rights to extract cross-signing tools, even for an unsigned Windows-only build) — documented as a one-time build-machine setup step in `docs/13-stage10-plan.md`, not a project defect. Verified instead via `electron-builder --win --dir`: a real, complete packaged app (`Offline English Learning.exe`, 269MB unpacked).
- **Android release signing**: a school/dev-deployment keystore (gitignored, `apps/android/keystore/README.md`) wired into `build.gradle` via `key.properties`. Built and verified a real signed release APK (`apksigner verify` confirms the certificate).
- **AI service performance**: llama.cpp thread count made explicit and configurable (`AI_THREADS`, defaults to logical core count). Benchmarked a real **55% tokens/sec speedup** (10.65 → 16.51 tok/s on 16 cores) from thread tuning alone — measured, not assumed, via `apps/ai-service/scripts/benchmark.py`. Documented that the caching layers that actually benefit (`/v1/vocabulary/explain`, `/v1/grammar/explain`) were already built in Stages 5–6, so no new cache was added.
- **Electron vs. Tauri, revisited with real numbers**: 269MB unpacked Electron vs. an estimated tens-of-MB Tauri equivalent — decision recorded to stay on Electron (Rust/crates.io offline vendoring is a harder problem than npm vendoring, and school hardware has disk space to spare).
- **PostgreSQL migration path documented, not switched**: concrete column-type translation guide (`sqliteTable`→`pgTable`, `blob`→`bytea`/`pgvector`, autoincrement→`serial`) and a migration script skeleton, explicitly deferred until a real multi-school/district deployment needs it.
- No new product features or backend tests this stage — infrastructure/ops work, verified by real builds and measurements rather than unit tests.

## v0.9.0 — Stage 9: Speech recognition and pronunciation

- AI Service: `pywhispercpp` (Whisper `tiny.en`) for speech-to-text and `piper-tts` (`en_US-lessac-medium`) for text-to-speech — both installed cleanly via prebuilt wheels, no compilation, no PyTorch, feasibility-checked before committing to the plan (same approach as Stage 6's `fastembed`). New `POST /v1/speech/transcribe` and `POST /v1/speech/synthesize`, both behind the Stage 6 inference lock.
- **Design correction found during development**: the plan assumed the client would send exactly-16kHz WAV so the server could skip resampling, but `pywhispercpp`'s loader hard-rejects non-16kHz audio and browsers can't reliably guarantee an exact recording rate. Fixed by resampling server-side (numpy) regardless of input rate — verified via a real TTS→STT round trip through the actual HTTP endpoints using 22050Hz source audio.
- Backend: `pronunciation_results` schema; `POST /speech/transcribe`, `POST /speech/synthesize` (thin authenticated proxies), and `POST /pronunciation/practice` (transcribes an attempt, scores it against a target phrase via word-level Levenshtein distance — a documented v1 heuristic, not phoneme-level pronunciation scoring — and persists the result).
- Desktop: a mic button in the conversation composer (records via `MediaRecorder`, decodes and re-encodes to WAV via the Web Audio API, transcribes, and fills the message box for the student to review before sending) and a new Pronunciation Practice panel (type a phrase, "Listen" to hear it via TTS, record an attempt, see transcript + accuracy score + feedback). Electron's `setPermissionRequestHandler` now grants microphone access, since the renderer only ever loads the app's own local page.
- Verified end-to-end via curl against the real models: a Piper-synthesized phrase transcribed back correctly, and pronunciation scoring correctly distinguished a matching attempt (100%) from a completely different one (11%). 44 backend tests pass, including 9 new ones (scoring correctness + route-level persistence/auth, AI speech client faked in tests per the established pattern).

## v0.8.0 — Stage 8: Student analytics

- Backend: one aggregation function (`getStudentAnalytics`) reused by both a student-facing and teacher-facing route — no duplicated logic. Computes total conversations/messages, practice frequency (last 30 days), an estimated practice-time proxy (span between first/last message per conversation, summed — an openly documented estimate, not tracked session time), grammar weaknesses by LanguageTool category, a vocabulary-notebook growth curve, and the Stage 4 CEFR-level heuristic (reused unchanged, not reimplemented).
- `GET /analytics/me` (any authenticated user, their own data) and `GET /analytics/students/:id` (teacher-only, ownership-checked via class membership).
- Desktop: a "My progress" panel in the student sidebar (stat tiles, a CSS-bar practice-frequency strip, a grammar-weakness breakdown, vocabulary count) — no charting library added, consistent with Stage 6's same call on `sqlite-vec`. Teacher roster rows are now clickable, opening the same rendering code inline to show that student's analytics.
- Verified end-to-end via curl: generated real conversation/mistake/vocabulary activity for a student, confirmed `/analytics/me` and the teacher's `/analytics/students/:id` for the same student return identical numbers, and confirmed a teacher is denied access to a student outside their classes. 35 backend tests pass, including 5 new ones covering aggregation correctness and ownership.

## v0.7.0 — Stage 7: Teacher dashboard

- Backend: `assignments` schema (scenario-based practice targets, not a full homework/grading system — see `docs/10-stage7-plan.md`). `GET /teacher/classes`, `GET /teacher/classes/:id` (roster), `POST`/`GET /teacher/classes/:id/assignments` (with a per-student completion heuristic based on matching conversations started after the assignment), `GET /teacher/classes/:id/mistakes` (grammar-mistake review across a class), `GET /teacher/classes/:id/report.csv` and `.pdf` (per-student stats: conversations, mistakes, vocabulary size, estimated CEFR level).
- PDF export via `pdfkit` (pure JS, no native dependencies) — a small, deliberate addition alongside the CSV export.
- Desktop: a new Teacher Dashboard view (shown instead of the student conversation UI when logged in as a teacher) — class list/creation, roster with add-student form, assignment creation with per-student completion badges, a mistake-review table, and CSV/PDF report download buttons.
- Verified end-to-end via curl: created a class, registered a student, created a "daily" assignment, had the student complete a conversation with a real grammar mistake, confirmed the assignment flipped to "completed," the mistake appeared in the review feed, and both report formats downloaded with correct real data (PDF verified as a structurally valid 1-page document). 30 backend tests pass, including 6 new ones covering roster listing/ownership, the completion heuristic, mistake-review ownership, and CSV report shape.

## v0.6.0 — Stage 6: Vocabulary learning system

- AI Service: `POST /v1/embed` (384-dim vectors via `fastembed`/ONNX `all-MiniLM-L6-v2` — no PyTorch dependency, a lighter ONNX path than raw `sentence-transformers`) and `POST /v1/vocabulary/explain` (definition, example, synonyms, antonyms, and the word's own CEFR level, same lenient marker-based parsing as grammar/explain).
- **Important robustness fix**: added a process-wide inference lock (`app/inference_lock.py`). Concurrent requests to the AI service (e.g. a recommendations batch firing off several embed/explain calls) were crashing the single llama.cpp/ONNX instance during development — FastAPI's threadpool really does run "concurrent" sync routes in parallel. All model-touching routes now serialize through one lock; no throughput lost since it's a single CPU-bound model anyway.
- Backend: `vocabulary` (shared dictionary cache, one row per distinct word across the whole school, embeddings stored as blobs) and `vocabulary_notebook` (per-student) schema. `POST /vocabulary/lookup`, `POST /vocabulary/notebook`, `GET /vocabulary/notebook`, `DELETE /vocabulary/notebook/:id`, `GET /vocabulary/recommendations?conversationId=` (difficult-word heuristic over the AI's own replies, v1: length + stoplist), `GET /vocabulary/similar?word=` (brute-force cosine similarity over cached embeddings).
- Two documented architecture deviations from the original tech-selection doc, both scale-aware simplifications: `fastembed` (ONNX) instead of `sentence-transformers`+PyTorch, and brute-force cosine similarity instead of `sqlite-vec` (a single school's vocabulary cache is small enough that indexed ANN search has no measurable benefit yet) — see `docs/09-stage6-plan.md`.
- Desktop: a Vocabulary Notebook panel in the sidebar (manual lookup/add, expandable word detail, remove), and a "Words to learn" strip after each AI reply surfacing recommended words with one-click add.
- Verified end-to-end via curl against the real embedding model and LLM: looked up "meticulous" (real definition/synonyms/antonyms/CEFR + a real embedding vector), confirmed `/vocabulary/similar` correctly ranks a semantically related word above an unrelated one, and confirmed conversation-based recommendations surface real candidate words while excluding ones already saved. 24 backend tests pass, including 8 new ones (AI service faked in tests, per the same reasoning as Stages 4–5).

## v0.5.0 — Stage 5: Grammar correction engine

- Vendored LanguageTool 6.5 (fully offline, rule-based grammar checker) under `offline-sdk/build-tools/` (gitignored). Detects tenses, subject-verb agreement, articles, prepositions, punctuation, and more, with stable rule IDs/categories for later analytics.
- Backend: `grammar_mistakes` schema; `POST /conversations/:id/messages` now runs the student's message through LanguageTool and sends detected mistakes as the first line of the same NDJSON stream (no extra round trip), persisting them tied to the message. `GET /conversations/:id` returns mistakes per message too, so a reload doesn't lose corrections.
- New `POST /grammar/explain` route — the "explain this mistake" AI Tutor entry point from the original requirements. Calls the AI Service, caches the explanation/example on first request so re-opening a correction doesn't re-run inference.
- AI Service: new non-streaming `POST /v1/grammar/explain` endpoint generating a beginner-friendly, step-by-step explanation and example, difficulty-aware.
- Desktop: inline correction UI under user chat bubbles ("original → corrected") with a per-mistake "Explain" button that expands to show the AI-generated explanation and example.
- Verified end-to-end via curl: a message with deliberate mistakes ("...buy a apple...") gets a real LanguageTool-detected correction (`a` → `an`, rule `EN_A_VS_AN`) streamed back immediately, and "explain" returns a real LLM-generated explanation that's cached on the mistake row. 16 backend tests pass, including 5 new ones for grammar-check persistence and the explain route's caching/ownership behavior (LanguageTool and the AI service are faked in tests, per the same reasoning as Stage 4's streaming-path testing decision).

## v0.4.0 — Stage 4: AI conversation engine

- New AI Service (`apps/ai-service`, Python + FastAPI) wrapping a local llama.cpp model (`llama-cpp-python`). Streams token-by-token NDJSON responses from `POST /v1/chat`, with a system prompt assembled server-side from a scenario preset + CEFR difficulty level.
- Dev-time model: Qwen2.5-1.5B-Instruct (GGUF Q4_K_M, ~1.1GB), vendored under `offline-sdk/ai-models/`. The production-sized 7–8B model from the technology-selection doc is a config swap (`AI_MODEL_PATH`), deliberately not done in this session — see `docs/07-stage4-plan.md`.
- Backend: `conversations`/`messages` schema; scenario presets (`free_talk`, `role_play`, `interview`, `business`, `travel`, `daily`, `debate`); a v1 CEFR difficulty-estimation heuristic derived from a student's own message history (sentence length + vocabulary diversity); `POST /conversations`, `GET /conversations/:id`, and a streaming `POST /conversations/:id/messages` that proxies the AI service's NDJSON stream straight through to the client while persisting both sides of the exchange.
- Desktop (Electron): real streaming chat UI — scenario picker, chat log, and token-by-token rendering read live from the response's `ReadableStream`, replacing the profile-only view from Stage 3.
- Verified end-to-end via curl: admin creates a student, student starts a `daily` conversation, sends a message, and receives a live token stream from the real model appropriate to the chosen scenario and difficulty — both messages persisted correctly on refetch. 11 backend tests pass in total, including 4 new ones covering conversation creation/ownership/validation/auth-required and the difficulty heuristic's relative ordering.

## v0.3.0 — Stage 3: Authentication and user management

- Backend: `users`, `refresh_tokens`, `classes`, `class_students` tables; argon2id password hashing; JWT access tokens (15 min) + rotating opaque refresh tokens (30 days, stored hashed); `authenticate`/`requireRole` RBAC middleware.
- Routes: `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `POST /auth/change-password`, `POST /admin/users` (admin-only), `POST /teacher/classes` and `POST /teacher/classes/:id/students` (teacher-only, ownership-checked).
- Offline-specific admin bootstrap: first boot with no users creates an `admin` account with a random password written to `data/admin-credentials.txt` (no email/SMS channel exists to deliver it otherwise).
- Desktop (Electron) and Android (Flutter) both get real login screens wired to the backend, replacing the health-check-only placeholders from Stages 1–2.
- Verified end-to-end: admin bootstrap → admin creates a teacher via the API → teacher creates a class and registers a student → student logs in from the Android app on an emulator and sees their live profile and connection status. 6 backend tests cover login success/failure, refresh-token rotation and reuse rejection, `/auth/me` auth requirement, and RBAC denial of a student calling an admin route.

## v0.2.0 — Stage 2: Android client

- Flutter Android client (`apps/android`): manual LAN server IP/port entry persisted via `shared_preferences`, an `ApiClient` hitting the backend's `/health` endpoint, and a home screen showing live connection status.
- Verified end-to-end on an Android emulator (API 34, x86_64): built a debug APK, installed and launched it, entered the host-loopback alias `10.0.2.2`, and confirmed "Connected — db: true" against the real Fastify + SQLite backend from Stage 1 — visible on both the app screen and the backend's request log.
- Flutter SDK (3.27.1) and Android SDK (platform 34, build-tools 34.0.0, emulator + system image) installed for the project; analytics/telemetry disabled to match the project's no-telemetry stance.
- Documented in `offline-sdk/build-tools/README.md`: Android's command-line tooling breaks under a path containing spaces, so the SDKs are installed at a dedicated space-free path (`D:\dev-sdks`) rather than inside this repo's own path.

## v0.1.0 — Stage 1: Offline desktop foundation

- pnpm monorepo scaffold: `apps/backend`, `apps/desktop`, `packages/types`.
- Backend: Fastify server with a `/health` route backed by a real SQLite database (via `better-sqlite3` + Drizzle ORM), WAL mode enabled.
- Desktop: Electron shell rendering a page that polls `/health` and displays the live result — proves the full offline round trip (Electron → Fastify → SQLite) with zero network dependency.
- One-click scripts: `scripts/start-dev.{bat,sh}`, `scripts/rebuild.{bat,sh}`, `scripts/deploy.bat` (stub).
- `offline-sdk/` scaffolded with per-category placeholders and a documented vendoring strategy for Node/pnpm.
- Architecture, technology selection, 12-stage roadmap, repo structure, and Stage 1 plan documented under `docs/`.
