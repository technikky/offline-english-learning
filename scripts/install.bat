@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."

echo === Offline English Learning System : install ===
echo This is a one-click FIRST-TIME install for a machine that already has
echo this repo (with its vendored offline-sdk assets) copied onto it -- e.g.
echo from a USB drive or offline package, per docs/16-install-guide.md.
echo For setting up a developer's coding environment instead, use
echo scripts\setup-dev-env.bat.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found on PATH. Install Node 22+ first
  echo         ^(see offline-sdk\node\README.md for the offline install path^).
  exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] pnpm was not found on PATH. Enable it with: corepack enable
  exit /b 1
)

echo Installing Node dependencies from the offline package store...
call pnpm install --offline
if errorlevel 1 (
  echo Offline install failed -- falling back to a regular ^(online^) install...
  call pnpm install
  if errorlevel 1 (
    echo [ERROR] pnpm install failed. See output above.
    exit /b 1
  )
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
if not exist apps\ai-service\.venv (
  where python >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] Python was not found on PATH. Install Python 3.11+ first.
    exit /b 1
  )
  python -m venv apps\ai-service\.venv
)
call apps\ai-service\.venv\Scripts\pip install -r apps\ai-service\requirements.txt
if errorlevel 1 (
  echo [ERROR] Installing AI service Python dependencies failed. See output above.
  exit /b 1
)

echo.
echo Checking vendored offline assets...
set MISSING=0
if not exist offline-sdk\ai-models\qwen2.5-1.5b-instruct-q4_k_m.gguf (
  echo [WARN] LLM model not found: offline-sdk\ai-models\qwen2.5-1.5b-instruct-q4_k_m.gguf
  set MISSING=1
)
if not exist offline-sdk\build-tools\LanguageTool-6.5\languagetool-server.jar (
  echo [WARN] LanguageTool not found under offline-sdk\build-tools\LanguageTool-6.5\
  set MISSING=1
)
if not exist offline-sdk\ai-models\piper-voices\en_US-lessac-medium.onnx (
  echo [WARN] Piper voice not found under offline-sdk\ai-models\piper-voices\
  set MISSING=1
)
if "%MISSING%"=="1" (
  echo See offline-sdk\README.md and the per-folder READMEs under offline-sdk\
  echo for how to restore these vendored assets before running the system.
) else (
  echo All expected vendored assets are present.
)

echo.
echo === Install complete ===
echo Next steps:
echo   - First run only: scripts\start-dev.bat will bootstrap an admin account
echo     and write its password to data\admin-credentials.txt.
echo   - To operate the installed system day-to-day: scripts\run.bat
echo   - To package a distributable build: scripts\deploy.bat
