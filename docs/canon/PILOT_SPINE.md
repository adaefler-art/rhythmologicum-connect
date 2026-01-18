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

## Content Resolution (V061-I03)

**Canonical Resolver:** `GET /api/content/resolve`

The canonical content resolver endpoint for all patient UI content lookups.

**Query Parameters:**
- `funnel` (required): Funnel slug or UUID
- `category` (optional): Page category (e.g., 'intro', 'info', 'result')
- `slug` (optional): Specific page slug
- `includeDrafts` (optional): Whether to include draft pages (default: false)

**Response Format:**
```json
{
  "success": true,
  "version": "v1",
  "status": "ok",
  "page": { /* ContentPage object */ },
  "strategy": "direct-match",
  "requestId": "uuid"
}
```

**Error Semantics:**
- `404 NOT_FOUND` - Unknown funnel (not in registry or database)
- `200 missing_content` - Known funnel but no matching content page
- `422 VALIDATION_FAILED` - Missing required parameters or invalid category
- `500 INTERNAL_ERROR` - Server error

**Examples:**
```powershell
# Fetch intro page for stress funnel
Invoke-WebRequest -Uri "http://localhost:3000/api/content/resolve?funnel=stress&category=intro"

# Fetch specific content page by slug
Invoke-WebRequest -Uri "http://localhost:3000/api/content/resolve?funnel=cardiovascular-age&slug=intro"

# Expected 404 for unknown funnel
Invoke-WebRequest -Uri "http://localhost:3000/api/content/resolve?funnel=unknown-funnel&category=intro" -SkipHttpErrorCheck
# Returns: 404 { "success": false, "error": { "code": "FUNNEL_NOT_FOUND" } }

# Expected 200 for known funnel with no content
Invoke-WebRequest -Uri "http://localhost:3000/api/content/resolve?funnel=stress&category=nonexistent"
# Returns: 200 { "success": true, "status": "missing_content", "page": null }
```

## Single Sources of Truth
- Contracts: packages/rhythm-core/src/contracts
- Fixtures: packages/rhythm-core/src/fixtures
- Manifest: funnel_versions.questionnaire_config (V0.5)

## Smoke Tests (PowerShell)

### V061-I02: Deterministic Lifecycle Smoke Sequence

This smoke test validates the full cardiovascular-age assessment lifecycle with deterministic behavior guarantees.

**Prerequisites:**
- Local dev server running (`npm run dev`)
- Valid auth session (cookies stored in browser/session)
- Patient user with profile created

**Authentication Note:**
PowerShell `Invoke-WebRequest` does NOT automatically handle cookies. You have two options:

1. **Manual Cookie Extraction** (recommended for CI/automation):
   - Login via browser
   - Extract cookies from browser DevTools (Application → Cookies)
   - Pass cookies explicitly in PowerShell requests

2. **Session Container** (recommended for interactive testing):
   - Use `-SessionVariable` to persist cookies across requests

#### Option 1: With Manual Cookies

```powershell
# Step 0: Extract cookies from browser after login
# In browser DevTools → Application → Cookies → http://localhost:3000
# Copy values for: sb-access-token, sb-refresh-token

$base = "http://localhost:3000"
$cookies = @{
  "sb-access-token" = "your-access-token-here"
  "sb-refresh-token" = "your-refresh-token-here"
}

# Helper function to make authenticated requests
function Invoke-AuthRequest {
  param($Uri, $Method = "GET", $Body = $null)
  $params = @{
    Uri = $Uri
    Method = $Method
    SkipHttpErrorCheck = $true
    WebSession = $session
  }
  if ($Body) {
    $params.ContentType = "application/json"
    $params.Body = $Body
  }
  Invoke-WebRequest @params
}

# 1. CREATE: Start assessment (expect 201, returns assessmentId)
$createResp = Invoke-AuthRequest -Uri "$base/api/funnels/cardiovascular-age/assessments" -Method Post
Write-Host "CREATE Status: $($createResp.StatusCode)" -ForegroundColor $(if($createResp.StatusCode -eq 201){'Green'}else{'Red'})
$createData = $createResp.Content | ConvertFrom-Json
$aid = $createData.data.assessmentId
Write-Host "Assessment ID: $aid" -ForegroundColor Cyan
Write-Host "Schema Version: $($createData.schemaVersion)" -ForegroundColor Cyan

if ($createResp.StatusCode -ne 201 -or -not $aid) {
  Write-Host "CREATE FAILED - stopping smoke test" -ForegroundColor Red
  exit 1
}

# 2. SAVE: Save first answer (expect 200)
$saveBody = @{
  stepId = "step-1"
  questionId = "q1-age"
  answerValue = 54
} | ConvertTo-Json

$saveResp = Invoke-AuthRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/answers/save" -Method Post -Body $saveBody
Write-Host "SAVE Status: $($saveResp.StatusCode)" -ForegroundColor $(if($saveResp.StatusCode -eq 200){'Green'}else{'Red'})

# 3. SAVE: Save second answer (expect 200)
$saveBody2 = @{
  stepId = "step-1"
  questionId = "q2-gender"
  answerValue = "male"
} | ConvertTo-Json

$saveResp2 = Invoke-AuthRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/answers/save" -Method Post -Body $saveBody2
Write-Host "SAVE (2) Status: $($saveResp2.StatusCode)" -ForegroundColor $(if($saveResp2.StatusCode -eq 200){'Green'}else{'Red'})

# 4. SAVE: Save third answer (expect 200)
$saveBody3 = @{
  stepId = "step-2"
  questionId = "q3-blood-pressure"
  answerValue = "normal"
} | ConvertTo-Json

$saveResp3 = Invoke-AuthRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/answers/save" -Method Post -Body $saveBody3
Write-Host "SAVE (3) Status: $($saveResp3.StatusCode)" -ForegroundColor $(if($saveResp3.StatusCode -eq 200){'Green'}else{'Red'})

# 5. RESULT (before complete): Expect 409 STATE_CONFLICT
$resultBeforeResp = Invoke-AuthRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/result" -Method Get
Write-Host "RESULT (before complete) Status: $($resultBeforeResp.StatusCode)" -ForegroundColor $(if($resultBeforeResp.StatusCode -eq 409){'Green'}else{'Red'})
$resultBeforeData = $resultBeforeResp.Content | ConvertFrom-Json
if ($resultBeforeResp.StatusCode -eq 409) {
  Write-Host "  ✓ Correctly returned 409 for incomplete assessment" -ForegroundColor Green
  Write-Host "  Error code: $($resultBeforeData.error.code)" -ForegroundColor Gray
} else {
  Write-Host "  ✗ FAILED: Expected 409, got $($resultBeforeResp.StatusCode)" -ForegroundColor Red
}

# 6. COMPLETE: Complete assessment (expect 200)
$completeResp = Invoke-AuthRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/complete" -Method Post
Write-Host "COMPLETE Status: $($completeResp.StatusCode)" -ForegroundColor $(if($completeResp.StatusCode -eq 200){'Green'}else{'Red'})
$completeData = $completeResp.Content | ConvertFrom-Json
Write-Host "  Status: $($completeData.data.status)" -ForegroundColor Cyan

# 7. COMPLETE (idempotency): Call again, expect 200 (not 500 or 409)
$completeResp2 = Invoke-AuthRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/complete" -Method Post
Write-Host "COMPLETE (2nd call) Status: $($completeResp2.StatusCode)" -ForegroundColor $(if($completeResp2.StatusCode -eq 200){'Green'}else{'Red'})
$completeData2 = $completeResp2.Content | ConvertFrom-Json
if ($completeResp2.StatusCode -eq 200 -and $completeData2.data.message -like "*bereits*") {
  Write-Host "  ✓ Idempotency verified: already completed message" -ForegroundColor Green
} else {
  Write-Host "  ✗ FAILED: Idempotency check failed" -ForegroundColor Red
}

# 8. RESULT (after complete): Expect 200
$resultResp = Invoke-AuthRequest -Uri "$base/api/funnels/cardiovascular-age/assessments/$aid/result" -Method Get
Write-Host "RESULT (after complete) Status: $($resultResp.StatusCode)" -ForegroundColor $(if($resultResp.StatusCode -eq 200){'Green'}else{'Red'})
$resultData = $resultResp.Content | ConvertFrom-Json
if ($resultResp.StatusCode -eq 200) {
  Write-Host "  ✓ Result retrieved successfully" -ForegroundColor Green
  Write-Host "  Assessment ID: $($resultData.data.id)" -ForegroundColor Cyan
  Write-Host "  Status: $($resultData.data.status)" -ForegroundColor Cyan
  Write-Host "  Funnel: $($resultData.data.funnel)" -ForegroundColor Cyan
} else {
  Write-Host "  ✗ FAILED: Could not retrieve result" -ForegroundColor Red
}

# Summary
Write-Host "`n========== SMOKE TEST SUMMARY ==========" -ForegroundColor Yellow
Write-Host "CREATE:            $($createResp.StatusCode) $(if($createResp.StatusCode -eq 201){'✓'}else{'✗'})" -ForegroundColor $(if($createResp.StatusCode -eq 201){'Green'}else{'Red'})
Write-Host "SAVE (1):          $($saveResp.StatusCode) $(if($saveResp.StatusCode -eq 200){'✓'}else{'✗'})" -ForegroundColor $(if($saveResp.StatusCode -eq 200){'Green'}else{'Red'})
Write-Host "SAVE (2):          $($saveResp2.StatusCode) $(if($saveResp2.StatusCode -eq 200){'✓'}else{'✗'})" -ForegroundColor $(if($saveResp2.StatusCode -eq 200){'Green'}else{'Red'})
Write-Host "SAVE (3):          $($saveResp3.StatusCode) $(if($saveResp3.StatusCode -eq 200){'✓'}else{'✗'})" -ForegroundColor $(if($saveResp3.StatusCode -eq 200){'Green'}else{'Red'})
Write-Host "RESULT (pre):      $($resultBeforeResp.StatusCode) $(if($resultBeforeResp.StatusCode -eq 409){'✓'}else{'✗'})" -ForegroundColor $(if($resultBeforeResp.StatusCode -eq 409){'Green'}else{'Red'})
Write-Host "COMPLETE:          $($completeResp.StatusCode) $(if($completeResp.StatusCode -eq 200){'✓'}else{'✗'})" -ForegroundColor $(if($completeResp.StatusCode -eq 200){'Green'}else{'Red'})
Write-Host "COMPLETE (2):      $($completeResp2.StatusCode) $(if($completeResp2.StatusCode -eq 200){'✓'}else{'✗'})" -ForegroundColor $(if($completeResp2.StatusCode -eq 200){'Green'}else{'Red'})
Write-Host "RESULT (post):     $($resultResp.StatusCode) $(if($resultResp.StatusCode -eq 200){'✓'}else{'✗'})" -ForegroundColor $(if($resultResp.StatusCode -eq 200){'Green'}else{'Red'})
Write-Host "=========================================" -ForegroundColor Yellow

$allPassed = (
  $createResp.StatusCode -eq 201 -and
  $saveResp.StatusCode -eq 200 -and
  $saveResp2.StatusCode -eq 200 -and
  $saveResp3.StatusCode -eq 200 -and
  $resultBeforeResp.StatusCode -eq 409 -and
  $completeResp.StatusCode -eq 200 -and
  $completeResp2.StatusCode -eq 200 -and
  $resultResp.StatusCode -eq 200
)

if ($allPassed) {
  Write-Host "`n✓ ALL CHECKS PASSED" -ForegroundColor Green
  exit 0
} else {
  Write-Host "`n✗ SOME CHECKS FAILED" -ForegroundColor Red
  exit 1
}
```

#### Option 2: With Session Variable (Interactive)

```powershell
$base = "http://localhost:3000"

# Step 0: Login first (adjust to your login mechanism)
# This creates a session with cookies
$loginResp = Invoke-WebRequest -Uri "$base/auth/login" `
  -Method Post `
  -Body '{"email":"patient@example.com","password":"yourpassword"}' `
  -ContentType "application/json" `
  -SessionVariable session

# Then use $session for all subsequent requests
# (Same request sequence as above, but with -WebSession $session)
```

### Legacy Smoke Tests (Simple)

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

### Routing Strategy (Primary: Engine Proxy Redirects)
The engine keeps stable URLs and redirects to dedicated UI apps via env vars. This is the only routing strategy used in Package 2:

- `STUDIO_BASE_URL` → Studio UI (hosts `/admin/**` and `/clinician/**`)
- `PATIENT_BASE_URL` → Patient UI (hosts `/patient/**`)
- `ENGINE_BASE_URL` → Engine API base (used by UI app rewrites for `/api/**`)

Redirect behavior is implemented in the engine routes and preserves path + query.
No loops: engine redirects only `/admin/**`, `/clinician/**`, `/patient/**`; UI apps only rewrite `/api/**` to the engine.

### Local Run (PowerShell)
```powershell
# Engine (API host + redirect proxy)
npm run dev

# Studio UI (admin/clinician)
$env:PORT=3001; npm run --workspace apps/rhythm-studio-ui dev

# Patient UI (patient portal)
$env:PORT=3002; npm run --workspace apps/rhythm-patient-ui dev
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
