@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."

echo === Offline English Learning System : setup-dev-env ===
echo One-click setup for a DEVELOPER's coding environment from a fresh
echo git clone. For installing onto a school's machine from a pre-vendored
echo offline package instead, use scripts\install.bat.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found on PATH. Install Node 22+ first
  echo         ^(see offline-sdk\node\README.md for the offline install path^).
  exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
  echo pnpm was not found on PATH -- enabling it via corepack...
  call corepack enable
  where pnpm >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] pnpm still not available after "corepack enable". See
    echo         https://pnpm.io/installation for other install methods.
    exit /b 1
  )
)

echo Installing Node dependencies ^(this fetches from the npm registry --
echo a fresh git clone has no local offline store yet^)...
call pnpm install
if errorlevel 1 (
  echo [ERROR] pnpm install failed. See output above.
  exit /b 1
)

echo.
echo Building backend, shared types, and desktop app...
call pnpm run build
if errorlevel 1 (
  echo [ERROR] Build failed. See output above.
  exit /b 1
)

echo.
echo Setting up the AI service's Python environment...
where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python was not found on PATH. Install Python 3.11+ first.
  exit /b 1
)
if not exist apps\ai-service\.venv (
  python -m venv apps\ai-service\.venv
)
call apps\ai-service\.venv\Scripts\pip install -r apps\ai-service\requirements.txt
if errorlevel 1 (
  echo [ERROR] Installing AI service Python dependencies failed. See output above.
  exit /b 1
)

echo.
echo Running backend test suite to confirm the environment is healthy...
call pnpm --filter @englishclass/backend test
if errorlevel 1 (
  echo [WARN] Backend tests failed -- see output above before continuing.
) else (
  echo Backend tests passed.
)

echo.
echo Running AI service test suite ^(pure-logic tests, no model files needed^)...
call apps\ai-service\.venv\Scripts\python -m pytest apps\ai-service\tests -q
if errorlevel 1 (
  echo [WARN] AI service tests failed -- see output above before continuing.
) else (
  echo AI service tests passed.
)

echo.
echo === Dev environment ready ===
echo Large vendored binaries ^(the LLM model, LanguageTool, Whisper/Piper
echo models^) are gitignored and NOT fetched by this script -- a fresh clone
echo will be missing them. See offline-sdk\README.md and the per-folder
echo READMEs under offline-sdk\ for how to obtain each one, then run
echo scripts\start-dev.bat to launch the full system.
