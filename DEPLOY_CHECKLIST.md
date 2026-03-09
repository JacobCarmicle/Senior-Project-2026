# Production Deploy Checklist (TradeForge)

Use this checklist for release readiness and deployment safety.

---

## 1) Pre-Deploy Readiness

- [ ] `main` is green in GitHub Actions (backend tests, frontend lint/tests/build).
- [ ] No open blocking bugs on auth/listings/uploads flows.
- [ ] Supabase project ref confirmed as **Senior Software project** (`lkrjxsjfoaurkfjdnqah`).
- [ ] Team agrees deploy window + rollback owner.

---

## 2) Environment Variables

### Backend (required)

- [ ] `GOOGLE_CLIENT_ID`
- [ ] `JWT_SECRET` (strong random secret)
- [ ] `LISTINGS_BACKEND=supabase`
- [ ] `UPLOADS_BACKEND=supabase`
- [ ] `SUPABASE_STORAGE_BUCKET=listing-images`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Frontend (required)

- [ ] `VITE_API_BASE_URL` (production API URL)
- [ ] `VITE_GOOGLE_CLIENT_ID` (web client ID)

Security:
- [ ] No `.env` secrets committed.
- [ ] Service role key only in backend runtime, never frontend.

---

## 3) Database & Storage

- [ ] Apply all Supabase migrations to target project:
  ```bash
  supabase db push --linked
  ```
- [ ] Verify tables exist:
  - `public.listings`
  - `public.listing_media`
- [ ] Verify storage bucket exists and is accessible for uploads:
  - `listing-images`

---

## 4) OAuth / Auth Configuration

Google Cloud Console (Web client):
- [ ] Authorized JavaScript origins include production frontend URL
- [ ] Local dev origins still include localhost if needed
- [ ] Client ID matches both frontend and backend env vars

Runtime checks:
- [ ] Google sign-in works in production
- [ ] `/auth/me` works with issued token
- [ ] Request IDs returned in error responses (`X-Request-ID`)

---

## 5) Smoke Tests (Post-Deploy)

### Auth
- [ ] Register new user
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Forgot password + reset password

### Listings + Media
- [ ] Upload image via create listing flow
- [ ] Create listing
- [ ] Listing appears in marketplace
- [ ] View listing details
- [ ] Edit listing (including image replacement)
- [ ] Delete listing
- [ ] Verify deleted listing not retrievable (404)

### Access Control
- [ ] Non-owner cannot update/delete another user’s listing (403)
- [ ] Unauthenticated create/update/delete/upload blocked (401)

---

## 6) Observability & Error Handling

- [ ] Backend logs include request id, method, path, status
- [ ] Standardized API error payload shape present:
  - `error.code`
  - `error.message`
  - `error.details`
  - `detail`
  - `request_id`
- [ ] Frontend displays user-friendly API error messages

---

## 7) Rollback Plan

- [ ] Confirm previous known-good commit hash
- [ ] Keep rollback command ready:
  ```bash
  git revert <bad_commit_sha>
  git push origin main
  ```
- [ ] If migration rollback is needed, document manual mitigation before deploy
- [ ] Assign owner for rollback decision and communication

---

## 8) Handoff / Team Notes

- [ ] Post deployment result in team channel/issue
- [ ] Link CI run, commit SHA, and smoke test evidence
- [ ] Record known limitations and next sprint tasks

---

## Release Sign-off

- Deployer: ____________________
- Reviewer: ____________________
- Date/Time: ____________________
- Commit SHA: ____________________
- Environment: ____________________
