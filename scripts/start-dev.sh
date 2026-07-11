#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Offline English Learning System : start-dev ==="
echo "Starting AI service..."

(cd apps/ai-service && .venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8100) &
AI_PID=$!
trap 'kill $AI_PID 2>/dev/null || true; kill $BACKEND_PID 2>/dev/null || true' EXIT

echo "Waiting for AI service health check on http://127.0.0.1:8100/health ..."
tries=0
until curl -s http://127.0.0.1:8100/health >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -gt 120 ]; then
    echo "AI service did not become healthy in time. Aborting."
    exit 1
  fi
  sleep 1
done

echo "AI service is healthy. Starting backend..."
pnpm --filter @englishclass/backend dev &
BACKEND_PID=$!

echo "Waiting for backend health check on http://127.0.0.1:4310/health ..."
tries=0
until curl -s http://127.0.0.1:4310/health >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -gt 60 ]; then
    echo "Backend did not become healthy in time. Aborting."
    exit 1
  fi
  sleep 1
done

echo "Backend is healthy. Launching desktop app..."
pnpm --filter @englishclass/desktop dev
