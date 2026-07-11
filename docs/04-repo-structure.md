# Initial Repository Structure

```
englishclass/
├── project details.md
├── docs/
│   ├── 01-architecture.md
│   ├── 02-technology-selection.md
│   ├── 03-roadmap.md
│   ├── 04-repo-structure.md
│   └── 05-stage1-plan.md
│
├── apps/
│   ├── desktop/              # Electron shell (renderer + main process)
│   ├── backend/              # Node.js + Fastify API (Stage 1+)
│   ├── ai-service/           # Python + FastAPI AI layer (Stage 4+)
│   └── android/              # Flutter client (Stage 2+)
│
├── packages/
│   └── types/                # Shared TypeScript types (API contracts) used by backend + desktop
│
├── offline-sdk/
│   ├── ai-models/            # Vendored GGUF LLM models, embedding models, whisper/piper voices
│   ├── node/                 # Vendored Node.js runtime + pnpm
│   ├── python/                # Vendored Python runtime + wheels for offline pip install
│   ├── database/              # SQLite binaries/extensions (sqlite-vec), migration tooling
│   ├── speech-models/          # whisper.cpp models, Piper voices
│   ├── deployment-tools/        # electron-builder caches, signing tools
│   ├── build-tools/             # Flutter SDK, Android SDK/NDK, Java (for LanguageTool)
│   ├── installers/               # Prebuilt installers for target OSes
│   └── documentation/            # Vendored docs for offline reference (framework docs, API refs)
│
├── data/                        # Runtime data (gitignored): sqlite db file, uploads, logs, backups
│
├── scripts/
│   ├── start-dev.bat / .sh
│   ├── rebuild.bat / .sh
│   └── deploy.bat / .sh
│
├── .gitignore
├── pnpm-workspace.yaml
├── CHANGELOG.md
└── README.md
```

## Notes

- `offline-sdk/` is intentionally checked into a separate large-file-friendly storage strategy (Git LFS or an external vendored archive restored by a setup script) rather than committed as raw binaries in the main history — multi-GB model files in normal git history would make clone/checkout unusable over time. This is decided and documented in Stage 1, not deferred.
- `data/` is gitignored; a fresh clone + `scripts/start-dev` must be able to initialize an empty database and be usable immediately (no manual seeding required for the app to boot).
- `packages/types` is the single source of truth for API request/response shapes shared between `apps/backend` and `apps/desktop`, keeping client/server contracts in sync at compile time as the spec's "new client applications" extensibility goal requires.
