@echo off
setlocal
cd /d "%~dp0.."

echo === Offline English Learning System : deploy ===
echo NOTE: Building the Windows NSIS installer requires Developer Mode
echo enabled on this machine (Settings ^> Privacy ^& Security ^> For Developers),
echo or running this script as Administrator - electron-builder needs
echo symlink-creation privilege to extract its cross-signing tools even
echo for an unsigned Windows-only build. See docs/13-stage10-plan.md.
echo CSC_IDENTITY_AUTO_DISCOVERY=false is set below since this build is
echo not code-signed.

echo Installing dependencies from offline store...
pnpm install --offline

echo Building backend + desktop for production...
pnpm run build

echo Packaging desktop app (electron-builder, offline)...
set CSC_IDENTITY_AUTO_DISCOVERY=false
pnpm --filter @englishclass/desktop run package

echo Deploy complete. See apps\desktop\release\ for the packaged app/installer.
