@echo off
setlocal
cd /d "%~dp0.."

echo === Offline English Learning System : deploy (Stage 1 stub) ===
echo NOTE: Full production deployment (installer signing, service
echo registration, AI model provisioning) matures in Stage 10.
echo This stub produces a local production build only.

echo Installing dependencies from offline store...
pnpm install --offline

echo Building backend + desktop for production...
pnpm run build

echo Packaging desktop app (electron-builder, offline)...
pnpm --filter @englishclass/desktop run package

echo Deploy stub complete. See apps\desktop\release\ for packaged app.
