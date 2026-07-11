# System Architecture — Offline AI English Learning Support System

## 1. Guiding constraints

- Zero internet dependency after installation. No cloud API, no online auth, no CDN assets.
- Must run on modest school hardware (shared lab PCs, a single "server" PC per school/LAN).
- Must be maintainable by a small team over years — favor mainstream, well-documented stacks over exotic ones.
- Must support incremental rollout: desktop first, Android second, without re-architecting.

## 2. High-level layering

```
┌─────────────────────────────────────────────────────────────┐
│  Clients                                                     │
│  ┌───────────────────┐        ┌───────────────────────────┐ │
│  │ Desktop App        │        │ Android App               │ │
│  │ (Electron shell)   │        │ (Flutter)                 │ │
│  └─────────┬──────────┘        └─────────────┬─────────────┘ │
└────────────┼─────────────────────────────────┼───────────────┘
             │              HTTP/JSON + WS over LAN            │
             ▼                                                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend API (Node.js / TypeScript, Fastify)                 │
│  - Auth (JWT, local), RBAC                                    │
│  - Classes / Users / Lessons / Reports domain services        │
│  - Orchestrates AI Service Layer                               │
└───────────────┬───────────────────────────────────────────────┘
                │ local IPC / HTTP (loopback or LAN)
                ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Service Layer (Python, FastAPI)                           │
│  - LLM inference (llama.cpp server, GGUF models)              │
│  - Grammar analysis pipeline (rules + local LLM)               │
│  - Embeddings + vector search (vocabulary recommender)          │
│  - Speech-to-text (whisper.cpp)                                 │
│  - Text-to-speech (Piper)                                       │
└───────────────┬───────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (SQLite, file-based, WAL mode)                       │
│  Users, Roles, Classes, Lessons, Conversations, Messages,      │
│  GrammarMistakes, Vocabulary, QuizResults, LearningHistory,     │
│  Reports                                                        │
└───────────────┬───────────────────────────────────────────────┘
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Storage (local filesystem)                                    │
│  offline-sdk/, models/, backups/, uploads/, logs/               │
└─────────────────────────────────────────────────────────────┘
```

## 3. Why two backend processes (Node + Python) instead of one

- Node/Fastify handles all business logic, auth, RBAC, and REST/WebSocket contracts with clients — this is the layer client apps talk to and the layer most engineers will touch day-to-day.
- Python/FastAPI is isolated because every mainstream local-inference runtime (llama.cpp, whisper.cpp, Piper, sentence-transformers) ships first-class Python bindings; forcing AI inference through Node FFI bindings is a maintenance trap.
- The two communicate over loopback HTTP (`127.0.0.1:8100`) with a small internal API. This lets the AI layer be swapped, scaled to a separate machine on the school LAN, or replaced with a different model runtime without touching the business-logic backend — satisfying the "AI model replacement" requirement directly.

## 4. Deployment topology (single school)

- One "server" machine (can be a teacher's PC or a small always-on box) runs: Node backend, Python AI service, SQLite file, model files.
- Desktop app instances on lab PCs run the same Electron app in "client mode," pointing at the server machine's LAN IP — OR run fully standalone (all three layers bundled locally) for single-user/offline-classroom use. Both modes share the same backend code; only the configured API base URL differs.
- Android devices join the same LAN and talk to the server machine's Node API over Wi-Fi.
- No component requires outbound internet access at any point.

## 5. Module boundaries (maps to core requirements)

| Module | Owns | Depends on |
|---|---|---|
| Auth & RBAC | Users, Roles, Sessions, JWT | DB |
| Class/School Mgmt | Classes, Students, Teachers, Assignments | Auth |
| Conversation Engine | Conversation/Message CRUD, prompt orchestration, difficulty adaptation | AI Service, DB |
| Grammar Engine | Error detection, correction, explanation generation | AI Service, DB |
| Vocabulary Engine | Word lookups, notebook, spaced-repetition recommender | AI Service (embeddings), DB |
| AI Tutor | Free-form Q&A grounded in conversation/grammar history | AI Service, Conversation Engine |
| Analytics | Aggregation of progress/weaknesses/time from all above | DB (read-only) |
| Teacher Console | Class/assignment/report views | Analytics, Class Mgmt |
| Admin Console | User mgmt, model mgmt, backup/restore, health | All modules |

## 6. Extensibility hooks required by the spec

- **AI model replacement**: AI Service exposes a stable internal contract (`/v1/chat`, `/v1/grammar/check`, `/v1/embed`, `/v1/tts`, `/v1/stt`); swapping GGUF models or runtimes never touches the Node layer.
- **Database migration**: All DB access in Node goes through a repository layer (Drizzle ORM) so SQLite can be swapped for PostgreSQL for large multi-school deployments without rewriting business logic.
- **New client applications**: Any client (desktop, Android, future web/iOS) is just an HTTP/WS client of the same Node API — no client-specific server logic.
- **Additional learning modules**: New domains (e.g., Listening Practice) are added as new service + repository + route triplets following the existing module pattern.

## 7. Security model

- Local JWT-based auth issued by the Node backend; passwords hashed with argon2id (Stage 3). Access tokens are short-lived (15 min); refresh tokens are opaque, stored only as a hash, and rotate on every use.
- RBAC: `admin`, `teacher`, `student` roles enforced via middleware (`authenticate` + `requireRole`) on every protected route (Stage 3).
- **Offline admin bootstrap**: there is no email/SMS channel to deliver a first admin password through, so on first boot with an empty `users` table the backend generates one, writes it once to a local file (`data/admin-credentials.txt`), and logs a warning. All subsequent account creation is admin/teacher-mediated — this is the permanent design for password provisioning, not a stopgap (see [docs/06-stage3-plan.md](06-stage3-plan.md)).
- The JWT signing secret is likewise generated on first boot and persisted to `data/jwt-secret.txt` (or overridden via `JWT_SECRET`), since there's no secrets manager to source one from in a fully offline deployment.
- All traffic on LAN is HTTP; for school deployments a self-signed TLS cert is generated at install time so LAN traffic is encrypted (documented as optional-but-default-on for Stage 11 hardening).
- SQLite file permissions restricted to the service account; nightly automated backups to `offline-sdk-data/backups/` with rotation.
- Structured logging (pino) to local rotating files; no telemetry leaves the machine. Client-side token storage (Android `shared_preferences`) is plaintext for now — encrypted storage is a Stage 11 hardening item, not a Stage 3 blocker.

See [02-technology-selection.md](02-technology-selection.md) for the reasoning behind each technology choice, and [03-roadmap.md](03-roadmap.md) for how this architecture is built up incrementally.
