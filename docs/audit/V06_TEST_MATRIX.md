# v0.6 Test Matrix

> **Generated from evidence files in `.audit/v06/evidence/`**
> **Only npm scripts verified to exist in evidence are used.**

## Commit Range

| Marker | SHA |
|--------|-----|
| **Baseline** | `6de6c86c826447ce2c93c19b74a08e8133f9deb0` |
| **Head** | `dd1d997a9186825d583078292a8e67f696ff9d84` |

---

## Available npm Scripts (from evidence)

The following scripts are available in `package.json` and can be used for verification:

| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `prebuild` | `node scripts/generate-version.js` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |
| `lint:changed` | `node tools/lint-changed-lines.mjs` |
| `hooks:install` | `node tools/install-git-hooks.mjs` |
| `lint:migrations` | `bash scripts/check-migrations.sh` |
| `lint:schema` | `pwsh -File scripts/db/lint-migrations.ps1` |
| `db:typegen` | `supabase gen types typescript --local > lib/types/supabase.ts` |
| `db:reset` | `supabase db reset` |
| `db:migrate` | `supabase migration up` |
| `db:seed` | `supabase db reset` |
| `db:seed:verify` | `pwsh -File verify-e6-4-10-seed.ps1` |
| `db:diff` | `supabase db diff` |
| `db:verify` | `pwsh -File scripts/verify-db-determinism.ps1` |
| `db:verify-sync` | `pwsh -File scripts/verify-migration-sync.ps1` |
| `db:access-audit` | `node scripts/db/audit-db-access.js` |
| `db:access-verify` | `node scripts/db/verify-db-access.js` |
| `api:catalog` | `node scripts/dev/endpoint-catalog/generate.js --repo-root . --out-dir docs/api --allowlist docs/api/endpoint-allowlist.json` |
| `api:catalog:verify` | `pwsh -File scripts/ci/verify-endpoint-catalog.ps1` |
| `mobile:contracts` | `node scripts/dev/mobile-contract/export.js --out docs/dev/mobile-contracts.v1.json` |
| `mobile:contracts:verify` | `pwsh -File scripts/ci/verify-mobile-contracts.ps1` |
| `test` | `jest` |
| `test:watch` | `jest --watch` |
| `test:coverage` | `jest --coverage` |

---

## Local Gates

### Gate 1: Dependencies Install

| Command | Pass Criteria |
|---------|---------------|
| `npm ci` | Exit code 0, no audit vulnerabilities at critical level |

### Gate 2: Lint

| Command | Pass Criteria |
|---------|---------------|
| `npm run lint` | Exit code 0 |

### Gate 3: Unit Tests

| Command | Pass Criteria |
|---------|---------------|
| `npm test` | Exit code 0, all tests pass |

### Gate 4: Build

| Command | Pass Criteria |
|---------|---------------|
| `npm run build` | Exit code 0, no TypeScript errors |

---

## Risk Area Test Matrix

### Area: API Changes (PRs #612, #613, #621, #623, #624, #626, #627, #630)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Dashboard contract tests | `npm test -- --testPathPattern="dashboard.test"` | All contract tests pass |
| Triage contract tests | `npm test -- --testPathPattern="triage.test"` | All contract tests pass |
| Endpoint catalog sync | `npm run api:catalog:verify` | Exit code 0, catalog is current |
| API route tests | `npm test -- --testPathPattern="route.test"` | All route tests pass |

### Area: UI Changes (PRs #611, #614, #618, #621)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Dashboard component tests | `npm test -- --testPathPattern="dashboard"` | All tests pass |
| Dashboard-first policy tests | `npm test -- --testPathPattern="dashboardFirstPolicy"` | All tests pass |
| Build succeeds | `npm run build` | Exit code 0 |

### Area: Database Changes (PRs #610, #626)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| DB determinism check | `npm run db:verify` | Exit code 0 |
| Migration sync check | `npm run db:verify-sync` | Exit code 0 |
| Seed verification | `npm run db:seed:verify` | Exit code 0 |
| Type generation | `npm run db:typegen` | Exit code 0, no diff |

### Area: Auth Changes (PRs #611, #613, #624)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Auth-related tests | `npm test -- --testPathPattern="auth\|pilot\|eligibility"` | All tests pass |
| Dashboard API tests | `npm test -- --testPathPattern="patient/dashboard"` | All tests pass |
| Triage API tests | `npm test -- --testPathPattern="patient/triage"` | All tests pass |

### Area: Tooling Changes (PR #610)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Endpoint catalog generation | `npm run api:catalog` | Exit code 0, deterministic output |
| Mobile contracts | `npm run mobile:contracts:verify` | Exit code 0 |

---

## Production Smoke Tests (BLOCKER)

### Blocker: /patient/dashboard Server-Component Render

This is a **BLOCKER** for v0.6 release. The `/patient/dashboard` route must render without Server Component errors.

| Test | Method | Pass Criteria | Evidence Required |
|------|--------|---------------|-------------------|
| Dashboard loads (Preview) | Manual browser test | HTTP 200, no "Server Components render" error | Screenshot |
| Dashboard loads (Prod) | Manual browser test | HTTP 200, no "Server Components render" error | Screenshot |
| Console log evidence | Browser DevTools | No `[PATIENT_DASHBOARD]` error logs | Console export |
| API response | `curl` or Invoke-WebRequest | `/api/patient/dashboard` returns 200 with valid JSON | Response body |

#### Manual Verification Script

```powershell
# Smoke test - requires authentication
$baseUrl = "https://your-preview-url.vercel.app"  # or production URL

# Test 1: Dashboard page loads
Invoke-WebRequest -Uri "$baseUrl/patient/dashboard" -UseBasicParsing

# Test 2: API endpoint responds
Invoke-WebRequest -Uri "$baseUrl/api/patient/dashboard" -UseBasicParsing
```

---

## Pre-Release Checklist

| # | Check | Command | Status |
|---|-------|---------|--------|
| 1 | Dependencies install | `npm ci` | ⬜ |
| 2 | Lint passes | `npm run lint` | ⬜ |
| 3 | Tests pass | `npm test` | ⬜ |
| 4 | Build succeeds | `npm run build` | ⬜ |
| 5 | DB verification | `npm run db:verify` | ⬜ |
| 6 | Endpoint catalog current | `npm run api:catalog:verify` | ⬜ |
| 7 | Mobile contracts current | `npm run mobile:contracts:verify` | ⬜ |
| 8 | Dashboard smoke (Preview) | Manual | ⬜ |
| 9 | Dashboard smoke (Prod) | Manual | ⬜ |

---

## Evidence Collection

Evidence should be stored in `.audit/v06/evidence/` with the following structure:

```
.audit/v06/evidence/
├── baseline_sha.txt          # v0.5.0 commit SHA
├── head_sha.txt              # HEAD commit SHA
├── prs.json                  # All 59 merged PRs
├── npm_scripts.json          # Available npm scripts
├── pr_files/                 # Per-PR file changes
│   ├── pr_610.json
│   ├── pr_611.json
│   └── ...
├── test_output.txt           # npm test output
├── build_output.txt          # npm run build output
├── smoke_dashboard.png       # Dashboard screenshot
└── smoke_api_response.json   # API response body
```

---

## Notes

- All commands in this matrix are derived from `.audit/v06/evidence/npm_scripts.json`
- PRs without file evidence are marked as "UNKNOWN" in the delta report
- The dashboard Server Component blocker was introduced due to production errors on `/patient/dashboard`
