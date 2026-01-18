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
