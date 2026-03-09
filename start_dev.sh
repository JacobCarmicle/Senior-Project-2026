#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [[ ! -d "$BACKEND_DIR" || ! -d "$FRONTEND_DIR" ]]; then
  echo "Error: expected backend/ and frontend/ directories next to this script."
  exit 1
fi

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  echo "Warning: backend/.env not found. Copy backend/.env.example -> backend/.env"
fi

if [[ ! -f "$FRONTEND_DIR/.env" ]]; then
  echo "Warning: frontend/.env not found. Copy frontend/.env.example -> frontend/.env"
fi

echo "Starting backend on http://localhost:8000 ..."
(
  cd "$BACKEND_DIR"
  python3 -m uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:5173 ..."
(
  cd "$FRONTEND_DIR"
  npm run dev -- --host 0.0.0.0 --port 5173
) &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "Shutting down dev servers..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo ""
echo "Dev servers are running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "Press Ctrl+C to stop."
echo ""

wait "$BACKEND_PID" "$FRONTEND_PID"
