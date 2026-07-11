@echo off
setlocal
cd /d "%~dp0.."

echo === Offline English Learning System : start-dev ===
echo Starting backend...

start "englishclass-backend" cmd /c "pnpm --filter @englishclass/backend dev"

echo Waiting for backend health check on http://127.0.0.1:4310/health ...

set /a tries=0
:waitloop
set /a tries+=1
if %tries% GTR 60 (
  echo Backend did not become healthy in time. Aborting.
  exit /b 1
)
timeout /t 1 /nobreak >nul
curl -s http://127.0.0.1:4310/health >nul 2>&1
if errorlevel 1 goto waitloop

echo Backend is healthy. Launching desktop app...
pnpm --filter @englishclass/desktop dev
