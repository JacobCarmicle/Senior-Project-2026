# Senior-Project-2026 (TradeForge)

Full-stack senior software project marketplace app.

## Repo Structure

```text
.
├── backend/                # FastAPI backend (auth, listings, uploads)
├── frontend/               # React + Vite frontend
├── supabase/               # Supabase config + SQL migrations
├── start_dev.sh            # One-command local dev startup
└── .github/workflows/      # CI workflows
```

## Quick Start

### 1) Configure environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill required values in `backend/.env` and `frontend/.env`.

### 2) Start local dev

```bash
./start_dev.sh
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:8000

## Development Commands

### Backend

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m pytest -q
python3 -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm test -- --run --maxWorkers=1
npm run build
npm run dev
```

## CI

GitHub Actions runs:
- Backend tests (pytest)
- Frontend lint
- Frontend tests
- Frontend build

on pushes to `main` and pull requests.

## Conventions

- Keep backend/ and frontend/ changes scoped and testable.
- Use TDD where practical: failing test → implementation → green.
- Do not commit real secrets; use `.env.example` for required keys.
- Prefer small, focused commits with clear messages.

See:
- `CONTRIBUTING.md` for team workflow.
- `DEPLOY_CHECKLIST.md` for production release readiness.
