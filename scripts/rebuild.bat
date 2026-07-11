@echo off
setlocal
cd /d "%~dp0.."

echo === Offline English Learning System : rebuild ===

echo Cleaning previous builds...
if exist apps\backend\dist rmdir /s /q apps\backend\dist
if exist apps\desktop\dist rmdir /s /q apps\desktop\dist
if exist packages\types\dist rmdir /s /q packages\types\dist

echo Installing dependencies from offline store...
pnpm install --offline

echo Building all packages...
pnpm run build

echo Rebuild complete. Run scripts\start-dev.bat to launch.
