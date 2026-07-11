@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."

echo === Offline English Learning System : run ===
echo One-click OPERATION script: runs the already-installed/built system
echo using its built artifacts ^(not the tsx/dev watch mode that
echo scripts\start-dev.bat uses for active development^). Run
echo scripts\install.bat first if you haven't already.
echo.

if not exist apps\backend\dist\server.js (
  echo [ERROR] apps\backend\dist\server.js not found. Run scripts\install.bat
  echo         ^(or "pnpm run build"^) first.
  exit /b 1
)

echo Starting LanguageTool server...
start "englishclass-languagetool" cmd /c "java -cp offline-sdk\build-tools\LanguageTool-6.5\languagetool-server.jar org.languagetool.server.HTTPServer --port 8081"

echo Waiting for LanguageTool health check on http://127.0.0.1:8081/v2/languages ...
set /a tries=0
:waitloop_lt
set /a tries+=1
if %tries% GTR 60 (
  echo LanguageTool did not become healthy in time. Aborting.
  exit /b 1
)
timeout /t 1 /nobreak >nul
curl -s http://127.0.0.1:8081/v2/languages >nul 2>&1
if errorlevel 1 goto waitloop_lt

echo LanguageTool is healthy. Starting AI service...
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

echo AI service is healthy. Starting backend ^(production build, not dev watch^)...
start "englishclass-backend" cmd /c "pnpm --filter @englishclass/backend start"

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
if exist "apps\desktop\release\win-unpacked\Offline English Learning.exe" (
  start "" "apps\desktop\release\win-unpacked\Offline English Learning.exe"
) else (
  echo No packaged build found under apps\desktop\release\win-unpacked\ --
  echo launching from the built ^(unpackaged^) app instead. Run
  echo scripts\deploy.bat to produce a packaged build.
  pnpm --filter @englishclass/desktop exec electron .
)
