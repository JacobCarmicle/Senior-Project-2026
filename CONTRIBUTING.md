# Contributing

## Branch / PR Workflow

1. Create a focused branch per issue.
2. Implement with tests first when possible.
3. Run local quality checks before pushing.
4. Open PR with:
   - issue link
   - summary of changes
   - test/build evidence

## Required Local Checks

### Backend

```bash
cd backend
python3 -m pytest -q
```

### Frontend

```bash
cd frontend
npm run lint
npm test -- --run --maxWorkers=1
npm run build
```

## Commit Style

Use concise prefixes:
- `feat:` new functionality
- `fix:` bug fix
- `test:` tests
- `chore:` tooling/infrastructure/docs
- `docs:` documentation-only

Examples:
- `feat(listings): add create endpoint`
- `test(auth): cover oauth audience mismatch`
- `chore(ci): run frontend lint in workflow`

## Environment & Secrets

- Never commit `.env` secrets.
- Update `.env.example` when adding new required variables.

## Project Conventions

- Keep API contract changes synchronized between backend and frontend.
- Keep Supabase migration history append-only.
- Update relevant issue/project status after completion.
