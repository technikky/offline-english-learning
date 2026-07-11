#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Offline English Learning System : rebuild ==="

echo "Cleaning previous builds..."
rm -rf apps/backend/dist apps/desktop/dist packages/types/dist

echo "Installing dependencies from offline store..."
pnpm install --offline

echo "Building all packages..."
pnpm run build

echo "Rebuild complete. Run scripts/start-dev.sh to launch."
