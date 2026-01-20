# v0.6 Smoke Tests

## Local (PowerShell)
```powershell
# 1) Clean install
npm ci

# 2) Build
npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

# 3) Start prod-like
npm run start
```

## Manual Smoke (Browser)
- Patient: `/patient/dashboard` (kein Crash)
- Studio: `/admin` (Login → Dashboard ohne Loop)
- `/version.json` (Patient + Studio Deploys) zeigt Version/Commit/GeneratedAt

## Expected Outcomes
- Keine Redirect-Loops
- Keine 404s auf `/version.json`
- Admin/Studio Navigation zeigt nur produktive Links
- Endpoint Catalog (bei `DEV_ENDPOINT_CATALOG=1`) zeigt Version/Commit/Links
