# PILOT_SPINE (v0.7 POC)

## Pages
- /patient/funnels
- /patient/funnel/[slug]/intro
- /patient/funnel/[slug]
- /patient/funnel/[slug]/result?assessmentId=...

## Engine Endpoints (POC)
- POST /api/funnels/{slug}/assessments
- GET  /api/funnels/{slug}/assessments/{assessmentId}
- POST /api/funnels/{slug}/assessments/{assessmentId}/answers/save
- POST /api/funnels/{slug}/assessments/{assessmentId}/steps/{stepId}/validate
- POST /api/funnels/{slug}/assessments/{assessmentId}/complete
- GET  /api/funnels/{slug}/assessments/{assessmentId}/result
- GET  /api/funnels/{slug}/definition
- GET  /api/funnels/{slug}/content-pages

## Single Sources of Truth
- Contracts: packages/rhythm-core/src/contracts
- Fixtures: packages/rhythm-core/src/fixtures
- Manifest: funnel_versions.questionnaire_config (V0.5)

## Smoke Tests (PowerShell)
```powershell
$base = "http://localhost:3000"
$aid = "<ASSESSMENT_ID>"

# Start assessment
Invoke-WebRequest -Uri "$base/api/funnels/cardiovascular-age/assessments" -Method Post -SkipHttpErrorCheck |
  Select-Object StatusCode,Content

# Save answer
Invoke-WebRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/answers/save" -Method Post -ContentType "application/json" -Body '{"stepId":"step-1","questionId":"q1-age","answerValue":54}' -SkipHttpErrorCheck |
  Select-Object StatusCode,Content

# Validate step
Invoke-WebRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/steps/step-1" -Method Post -SkipHttpErrorCheck |
  Select-Object StatusCode,Content

# Complete assessment
Invoke-WebRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/complete" -Method Post -SkipHttpErrorCheck |
  Select-Object StatusCode,Content

# Fetch result
Invoke-WebRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/result" -Method Get -SkipHttpErrorCheck |
  Select-Object StatusCode,Content
```

## Package 2 — UI Split (Studio vs Patient)

### Routing Strategy (B: Engine Proxy Redirects)
The engine keeps stable URLs and redirects to dedicated UI apps via env vars:

- `STUDIO_BASE_URL` → Studio UI (hosts `/admin/**` and `/clinician/**`)
- `PATIENT_BASE_URL` → Patient UI (hosts `/patient/**`)
- `ENGINE_BASE_URL` → Engine API base (used by UI app rewrites for `/api/**`)

Redirect behavior is implemented in the engine routes and preserves path + query.

### Local Run (PowerShell)
```powershell
# Engine (API host + redirect proxy)
npm run dev

# Studio UI (admin/clinician)
npm run --workspace apps/rhythm-studio-ui dev

# Patient UI (patient portal)
npm run --workspace apps/rhythm-patient-ui dev
```

### Package 2 Verification (PowerShell)
```powershell
# Root checks
npm test
npm run build

# Per-app builds
npm run --workspace apps/rhythm-studio-ui build
npm run --workspace apps/rhythm-patient-ui build

# Redirect smoke checks (expect 307/308 depending on environment)
$engine = "http://localhost:3000"
Invoke-WebRequest -Uri "$engine/admin" -MaximumRedirection 0 -SkipHttpErrorCheck | Select-Object StatusCode,Headers
Invoke-WebRequest -Uri "$engine/clinician" -MaximumRedirection 0 -SkipHttpErrorCheck | Select-Object StatusCode,Headers
Invoke-WebRequest -Uri "$engine/patient" -MaximumRedirection 0 -SkipHttpErrorCheck | Select-Object StatusCode,Headers

# Patient spine manual flow (UI)
# 1) /patient/funnels → start cardiovascular-age
# 2) answer → save → continue
# 3) complete → result page renders
```
