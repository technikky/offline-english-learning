@echo off
setlocal
cd /d "%~dp0.."

echo === Offline English Learning System : start-dev ===
echo Starting AI service...

start "englishclass-ai-service" cmd /c "cd apps\ai-service && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8100"

echo Waiting for AI service health check on http://127.0.0.1:8100/health ...
set /a tries=0
:waitloop_ai
set /a tries+=1
if %tries% GTR 120 (
  echo AI service did not become healthy in time. Aborting.
  exit /b 1
)
timeout /t 1 /nobreak >nul
curl -s http://127.0.0.1:8100/health >nul 2>&1
if errorlevel 1 goto waitloop_ai

echo AI service is healthy. Starting backend...
start "englishclass-backend" cmd /c "pnpm --filter @englishclass/backend dev"

echo Waiting for backend health check on http://127.0.0.1:4310/health ...
set /a tries=0
:waitloop_backend
set /a tries+=1
if %tries% GTR 60 (
  echo Backend did not become healthy in time. Aborting.
  exit /b 1
)
timeout /t 1 /nobreak >nul
curl -s http://127.0.0.1:4310/health >nul 2>&1
if errorlevel 1 goto waitloop_backend

echo Backend is healthy. Launching desktop app...
pnpm --filter @englishclass/desktop dev
