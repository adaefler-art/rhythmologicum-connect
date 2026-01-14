# iOS Integration Pack — v0.7

**Version:** 1.0.0  
**Date:** 2026-01-14  
**Status:** ✅ Active  
**Related Issue:** E6.2.9 — iOS Integration Pack Doc + Example Calls

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [End-to-End Integration Sequences](#end-to-end-integration-sequences)
5. [API Testing Examples](#api-testing-examples)
6. [iOS Implementation Checklist](#ios-implementation-checklist)
7. [Troubleshooting & Error Mapping](#troubleshooting--error-mapping)
8. [Related Documentation](#related-documentation)
9. [Support](#support)

---

## Quick Start

This document provides everything needed to integrate iOS with the Rhythmologicum Connect backend (v0.7). It includes:

- **5+ complete end-to-end example sequences** covering all critical patient flows
- **Curl and PowerShell examples** for testing API endpoints
- **Error mapping and troubleshooting guide** for common issues
- **Ready-to-implement iOS checklist** with architectural guidance

**Target Audience:** iOS developers, mobile team leads, QA engineers

**Time to Implementation:** ~2-3 weeks for full v0.7 integration

---

## Architecture Overview

### System Components

```
┌─────────────────┐
│   iOS App       │
│  (Swift/UIKit)  │
└────────┬────────┘
         │
         │ HTTPS + JSON
         │ Custom Scheme: rhythm://
         │ Universal Links: https://app.rhythmologicum.com/mobile/*
         │
         ▼
┌─────────────────┐
│  Next.js API    │
│  (TypeScript)   │
└────────┬────────┘
         │
         │ Supabase SDK
         │
         ▼
┌─────────────────┐
│   Supabase      │
│  (PostgreSQL +  │
│   Auth)         │
└─────────────────┘
```

### Key Architectural Principles

1. **Cookie-Based Sessions** — Uses Supabase Auth with HTTP-only cookies for session management
2. **RESTful JSON APIs** — All endpoints return standardized JSON responses
3. **Idempotency Support** — Write operations support idempotency keys for offline/retry scenarios
4. **Correlation IDs** — Every request/response includes `X-Request-Id` for debugging
5. **HTTP Caching** — Catalog endpoints support ETag and Last-Modified for efficient caching
6. **Cursor-Based Pagination** — List endpoints use opaque cursors (not offset-based)

### Authentication Flow

```
┌────────┐                    ┌──────────┐                 ┌──────────┐
│  iOS   │                    │  API     │                 │ Supabase │
│  App   │                    │  Server  │                 │   Auth   │
└───┬────┘                    └────┬─────┘                 └────┬─────┘
    │                              │                            │
    │ 1. Login (email/password)    │                            │
    ├─────────────────────────────>│                            │
    │                              │ 2. Authenticate            │
    │                              ├───────────────────────────>│
    │                              │                            │
    │                              │ 3. Session + Tokens        │
    │                              │<───────────────────────────┤
    │ 4. Session Cookie            │                            │
    │<─────────────────────────────┤                            │
    │                              │                            │
    │ 5. API Call (with cookie)    │                            │
    ├─────────────────────────────>│                            │
    │                              │ 6. Validate Session        │
    │                              ├───────────────────────────>│
    │                              │                            │
    │                              │ 7. User Data               │
    │                              │<───────────────────────────┤
    │ 8. API Response              │                            │
    │<─────────────────────────────┤                            │
```

**Note:** iOS should use `URLSession` with cookie storage enabled to automatically handle session cookies.

---

## Prerequisites

### Backend Requirements

- Backend deployed at production URL (e.g., `https://app.rhythmologicum.com`)
- Supabase project configured with authentication enabled
- Database schema deployed (includes `funnels`, `assessments`, `questions`, etc.)
- At least one active funnel in catalog (e.g., `stress-assessment`)

### iOS Development Requirements

- Xcode 15+
- Swift 5.9+
- iOS 17.0+ deployment target (recommended)
- URLSession for networking
- Codable for JSON parsing
- Keychain for secure token storage (optional, if not using cookie-based auth)

### Testing Tools

- **curl** — Command-line HTTP client (included on macOS)
- **PowerShell** — For Windows testing or advanced scenarios
- **Postman** (optional) — GUI for API testing
- **Charles Proxy** (optional) — Network debugging

---

## End-to-End Integration Sequences

This section provides 6 complete end-to-end sequences covering all critical patient flows in v0.7.

### Sequence 1: Complete Authentication Flow

**Scenario:** User opens app for the first time, creates account, logs in, and verifies session.

#### Steps

1. **Check if authenticated** (app launch)
2. **Sign up with email/password** (if new user)
3. **Verify role** (ensure patient role)
4. **Check onboarding status**
5. **Complete profile** (if needed)

#### API Calls

```bash
# 1. Check current session (will fail if not logged in)
curl -X GET https://app.rhythmologicum.com/api/auth/resolve-role \
  -H "Cookie: sb-access-token=..." \
  -v

# Response (401 if not authenticated):
# {
#   "success": false,
#   "error": {
#     "code": "UNAUTHORIZED",
#     "message": "Authentifizierung fehlgeschlagen. Bitte melden Sie sich an."
#   }
# }

# 2. Sign up (use Supabase Auth SDK - not shown here)
# After signup, you'll receive session tokens

# 3. Get user role
curl -X GET https://app.rhythmologicum.com/api/auth/resolve-role \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "role": "patient"
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440000"
# }

# 4. Check onboarding status
curl -X GET https://app.rhythmologicum.com/api/patient/onboarding-status \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "needsConsent": false,
#     "needsProfile": false,
#     "completed": true
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440001"
# }
```

#### PowerShell Example

```powershell
# 1. Check session
$headers = @{
    "Cookie" = "sb-access-token=YOUR_SESSION_TOKEN"
}

try {
    $response = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/auth/resolve-role" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Authenticated as: $($response.data.role)" -ForegroundColor Green
} catch {
    Write-Host "✗ Not authenticated" -ForegroundColor Red
}

# 2. Check onboarding
try {
    $onboarding = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/patient/onboarding-status" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($onboarding.data.completed) {
        Write-Host "✓ Onboarding complete" -ForegroundColor Green
    } else {
        Write-Host "! Onboarding incomplete" -ForegroundColor Yellow
        Write-Host "  - Needs consent: $($onboarding.data.needsConsent)"
        Write-Host "  - Needs profile: $($onboarding.data.needsProfile)"
    }
} catch {
    Write-Host "✗ Failed to check onboarding: $_" -ForegroundColor Red
}
```

#### iOS Implementation Notes

- Use `URLSession` with shared cookie storage
- Store session in Keychain for persistence across app launches
- Implement automatic token refresh via Supabase SDK
- Handle `SESSION_EXPIRED` error by redirecting to login

---

### Sequence 2: Browse and Select Funnel

**Scenario:** User browses available assessments (funnels) and selects one to start.

#### Steps

1. **Fetch funnel catalog** (list of available assessments)
2. **Get detailed funnel info** (for selected funnel)
3. **Cache catalog data** (5-minute cache TTL)

#### API Calls

```bash
# 1. Get funnel catalog (with caching headers)
curl -X GET "https://app.rhythmologicum.com/api/funnels/catalog?limit=50" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Accept: application/json" \
  -v

# Response Headers:
# Cache-Control: public, max-age=300, must-revalidate
# ETag: "funnels:v1:2026-01-14T04:35:00.000Z"
# Last-Modified: Tue, 14 Jan 2026 04:35:00 GMT

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "pillars": [
#       {
#         "id": "stress-management",
#         "title": "Stressbewältigung",
#         "description": "Werkzeuge zur Stresserkennung und -bewältigung",
#         "funnels": [
#           {
#             "id": "funnel-uuid-123",
#             "slug": "stress-assessment",
#             "title": "Stress Assessment",
#             "description": "Bewerten Sie Ihr aktuelles Stressniveau",
#             "estimatedMinutes": 5,
#             "funnel_version_id": "fv-stress-v1"
#           }
#         ]
#       }
#     ],
#     "pagination": {
#       "limit": 50,
#       "hasMore": false,
#       "nextCursor": null
#     }
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440002"
# }

# 2. Get specific funnel details
curl -X GET "https://app.rhythmologicum.com/api/funnels/catalog/stress-assessment" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "id": "funnel-uuid-123",
#     "slug": "stress-assessment",
#     "title": "Stress Assessment",
#     "description": "Bewerten Sie Ihr aktuelles Stressniveau und erhalten Sie personalisierte Empfehlungen.",
#     "estimatedMinutes": 5,
#     "pillar": "stress-management",
#     "funnel_version_id": "fv-stress-v1",
#     "stepCount": 3
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440003"
# }

# 3. Subsequent request with cache validation (ETag)
curl -X GET "https://app.rhythmologicum.com/api/funnels/catalog?limit=50" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "If-None-Match: \"funnels:v1:2026-01-14T04:35:00.000Z\"" \
  -v

# Response (304 Not Modified) - use cached data
```

#### PowerShell Example

```powershell
# 1. Fetch catalog
$headers = @{
    "Cookie" = "sb-access-token=YOUR_SESSION_TOKEN"
}

$catalog = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/funnels/catalog?limit=50" `
    -Method GET `
    -Headers $headers

Write-Host "Available Funnels:" -ForegroundColor Cyan
foreach ($pillar in $catalog.data.pillars) {
    Write-Host "  Pillar: $($pillar.title)" -ForegroundColor Yellow
    foreach ($funnel in $pillar.funnels) {
        Write-Host "    - $($funnel.title) ($($funnel.slug)) - $($funnel.estimatedMinutes) min" -ForegroundColor White
    }
}

# 2. Get specific funnel
$funnelSlug = "stress-assessment"
$funnelDetails = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/funnels/catalog/$funnelSlug" `
    -Method GET `
    -Headers $headers

Write-Host "`nFunnel Details:" -ForegroundColor Cyan
Write-Host "  Title: $($funnelDetails.data.title)" -ForegroundColor White
Write-Host "  Description: $($funnelDetails.data.description)" -ForegroundColor Gray
Write-Host "  Steps: $($funnelDetails.data.stepCount)" -ForegroundColor White
Write-Host "  Duration: $($funnelDetails.data.estimatedMinutes) minutes" -ForegroundColor White
```

#### iOS Implementation Notes

- Use `URLCache` for automatic caching (5-minute TTL)
- Send `If-None-Match` header with stored ETag for cache validation
- Handle 304 responses by using cached data
- Display funnel list grouped by pillar
- Support pagination for large catalogs (use `cursor` parameter)

---

### Sequence 3: Complete Assessment Flow (Happy Path)

**Scenario:** User starts an assessment, answers all questions, and completes it successfully.

#### Steps

1. **Start assessment** (create new assessment session)
2. **Save answers** (as user answers each question)
3. **Validate step** (before progressing to next step)
4. **Complete assessment** (mark as done)
5. **View results** (fetch generated report)

#### API Calls

```bash
# 1. Start new assessment
curl -X POST "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440010" \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "assessmentId": "assessment-uuid-789",
#     "status": "in_progress",
#     "currentStep": {
#       "stepId": "step-uuid-001",
#       "title": "Stresshäufigkeit",
#       "type": "questions",
#       "stepIndex": 0,
#       "orderIndex": 1,
#       "questions": [
#         {
#           "id": "question-uuid-001",
#           "key": "stress_frequency",
#           "label": "Wie häufig fühlen Sie sich gestresst?",
#           "type": "scale",
#           "options": {
#             "min": 1,
#             "max": 5,
#             "minLabel": "Nie",
#             "maxLabel": "Sehr häufig"
#           },
#           "is_required": true
#         }
#       ]
#     }
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440011"
# }

# 2. Save answer (with idempotency)
curl -X POST "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/assessment-uuid-789/answers/save" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440012" \
  -d '{
    "questionId": "stress_frequency",
    "answerValue": 4
  }' \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "id": "answer-uuid-001",
#     "assessment_id": "assessment-uuid-789",
#     "question_id": "stress_frequency",
#     "answer_value": 4
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440013"
# }

# 3. Validate step before progressing
curl -X POST "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/assessment-uuid-789/steps/step-uuid-001" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -v

# Response (200 OK - validation passed):
# {
#   "success": true,
#   "data": {
#     "valid": true,
#     "nextStep": {
#       "stepId": "step-uuid-002",
#       "title": "Stressintensität",
#       "type": "questions",
#       "orderIndex": 2
#     }
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440014"
# }

# 4. Complete assessment (after all questions answered)
curl -X POST "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/assessment-uuid-789/complete" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440015" \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "assessmentId": "assessment-uuid-789",
#     "status": "completed"
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440016"
# }

# 5. Get results
curl -X GET "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/assessment-uuid-789/result" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "assessment": {
#       "id": "assessment-uuid-789",
#       "funnel": "stress-assessment",
#       "status": "completed",
#       "completed_at": "2026-01-14T10:30:00Z"
#     },
#     "report": {
#       "id": "report-uuid-456",
#       "total_score": 18,
#       "risk_level": "moderate",
#       "interpretation": "Ihr Stresslevel ist moderat erhöht...",
#       "recommendations": [
#         {
#           "title": "Atemübungen",
#           "description": "Praktizieren Sie täglich 5 Minuten tiefe Atemübungen."
#         }
#       ],
#       "created_at": "2026-01-14T10:30:05Z"
#     },
#     "answers": [
#       {
#         "question_id": "stress_frequency",
#         "answer_value": 4
#       }
#     ]
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440017"
# }
```

#### PowerShell Example

```powershell
$headers = @{
    "Cookie" = "sb-access-token=YOUR_SESSION_TOKEN"
    "Content-Type" = "application/json"
}

# 1. Start assessment
$startBody = @{} | ConvertTo-Json
$startHeaders = $headers + @{ "Idempotency-Key" = [guid]::NewGuid().ToString() }

$assessment = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments" `
    -Method POST `
    -Headers $startHeaders `
    -Body $startBody

$assessmentId = $assessment.data.assessmentId
Write-Host "✓ Started assessment: $assessmentId" -ForegroundColor Green

# 2. Answer first question
$answerBody = @{
    questionId = "stress_frequency"
    answerValue = 4
} | ConvertTo-Json

$answerHeaders = $headers + @{ "Idempotency-Key" = [guid]::NewGuid().ToString() }

$answer = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/$assessmentId/answers/save" `
    -Method POST `
    -Headers $answerHeaders `
    -Body $answerBody

Write-Host "✓ Saved answer: stress_frequency = 4" -ForegroundColor Green

# 3. Validate step
$stepId = $assessment.data.currentStep.stepId
$validation = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/$assessmentId/steps/$stepId" `
    -Method POST `
    -Headers $headers

if ($validation.data.valid) {
    Write-Host "✓ Step validation passed" -ForegroundColor Green
} else {
    Write-Host "✗ Validation failed: missing questions" -ForegroundColor Red
}

# 4. Complete assessment (after answering all questions)
$completeHeaders = $headers + @{ "Idempotency-Key" = [guid]::NewGuid().ToString() }

try {
    $complete = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/$assessmentId/complete" `
        -Method POST `
        -Headers $completeHeaders
    
    Write-Host "✓ Assessment completed!" -ForegroundColor Green
} catch {
    Write-Host "✗ Completion failed: $_" -ForegroundColor Red
}

# 5. Get results
$result = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/$assessmentId/result" `
    -Method GET `
    -Headers $headers

Write-Host "`nResults:" -ForegroundColor Cyan
Write-Host "  Score: $($result.data.report.total_score)" -ForegroundColor White
Write-Host "  Risk Level: $($result.data.report.risk_level)" -ForegroundColor Yellow
Write-Host "  Recommendations: $($result.data.report.recommendations.Count)" -ForegroundColor White
```

#### iOS Implementation Notes

- Generate unique `Idempotency-Key` (UUID) for each write operation
- Store idempotency keys locally to enable retries
- Implement "save on tap" pattern (auto-save answers immediately)
- Validate steps before navigation to prevent skipping
- Handle validation errors by highlighting missing required questions
- Cache assessment ID for resume functionality
- Display progress indicator (completed steps / total steps)

---

### Sequence 4: Resume In-Progress Assessment

**Scenario:** User starts an assessment, closes the app, and resumes later.

#### Steps

1. **Get assessment status** (check current step)
2. **Resume from current step**
3. **Continue answering questions**

#### API Calls

```bash
# 1. Get assessment status (using assessment ID)
curl -X GET "https://app.rhythmologicum.com/api/assessments/assessment-uuid-789/resume" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "assessmentId": "assessment-uuid-789",
#     "funnel": "stress-assessment",
#     "status": "in_progress",
#     "currentStep": {
#       "stepId": "step-uuid-002",
#       "title": "Stressintensität",
#       "type": "questions",
#       "orderIndex": 2,
#       "questions": [...]
#     },
#     "completedSteps": 1
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440020"
# }

# Alternative: Get status via funnel-scoped endpoint
curl -X GET "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/assessment-uuid-789" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -v

# Response (200 OK) - same structure as above
```

#### PowerShell Example

```powershell
$headers = @{
    "Cookie" = "sb-access-token=YOUR_SESSION_TOKEN"
}

# Stored assessment ID from previous session
$assessmentId = "assessment-uuid-789"

# Resume assessment
$resume = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/assessments/$assessmentId/resume" `
    -Method GET `
    -Headers $headers

Write-Host "Resuming Assessment:" -ForegroundColor Cyan
Write-Host "  Funnel: $($resume.data.funnel)" -ForegroundColor White
Write-Host "  Status: $($resume.data.status)" -ForegroundColor Yellow
Write-Host "  Current Step: $($resume.data.currentStep.title)" -ForegroundColor White
Write-Host "  Progress: $($resume.data.completedSteps) steps completed" -ForegroundColor Gray
```

#### iOS Implementation Notes

- Store `assessmentId` in UserDefaults for persistence
- Check for in-progress assessments on app launch
- Use `/resume` endpoint to get current state
- Navigate directly to current step (skip completed steps)
- Display "Continue Assessment" option in UI

---

### Sequence 5: Handle Validation Errors

**Scenario:** User tries to complete assessment with missing required answers.

#### Steps

1. **Attempt to complete assessment** (with missing answers)
2. **Receive validation error** (with missing question details)
3. **Navigate to incomplete questions**
4. **Re-attempt completion**

#### API Calls

```bash
# 1. Attempt to complete with missing answers
curl -X POST "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/assessment-uuid-789/complete" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -v

# Response (400 Bad Request - validation failed):
# {
#   "success": false,
#   "error": {
#     "code": "VALIDATION_FAILED",
#     "message": "Nicht alle Pflichtfragen wurden beantwortet.",
#     "details": {
#       "missingQuestions": [
#         {
#           "questionId": "question-uuid-003",
#           "questionKey": "sleep_quality",
#           "questionLabel": "Wie würden Sie Ihre Schlafqualität bewerten?",
#           "orderIndex": 3
#         }
#       ]
#     }
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440025"
# }

# 2. Save missing answer
curl -X POST "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/assessment-uuid-789/answers/save" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440026" \
  -d '{
    "questionId": "sleep_quality",
    "answerValue": 3
  }' \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "id": "answer-uuid-003",
#     "assessment_id": "assessment-uuid-789",
#     "question_id": "sleep_quality",
#     "answer_value": 3
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440027"
# }

# 3. Retry completion
curl -X POST "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/assessment-uuid-789/complete" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440028" \
  -v

# Response (200 OK):
# {
#   "success": true,
#   "data": {
#     "assessmentId": "assessment-uuid-789",
#     "status": "completed"
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440029"
# }
```

#### PowerShell Example

```powershell
$headers = @{
    "Cookie" = "sb-access-token=YOUR_SESSION_TOKEN"
    "Content-Type" = "application/json"
}

$assessmentId = "assessment-uuid-789"

# Attempt completion
$completeHeaders = $headers + @{ "Idempotency-Key" = [guid]::NewGuid().ToString() }

try {
    $complete = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/funnels/stress-assessment/assessments/$assessmentId/complete" `
        -Method POST `
        -Headers $completeHeaders `
        -ErrorAction Stop
    
    Write-Host "✓ Assessment completed successfully!" -ForegroundColor Green
    
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    
    if ($errorResponse.error.code -eq "VALIDATION_FAILED") {
        Write-Host "✗ Validation failed - missing required answers" -ForegroundColor Red
        
        foreach ($missing in $errorResponse.error.details.missingQuestions) {
            Write-Host "  - $($missing.questionLabel) (order: $($missing.orderIndex))" -ForegroundColor Yellow
        }
        
        # Navigate to first missing question and complete it
        # (implementation not shown)
        
    } else {
        Write-Host "✗ Error: $($errorResponse.error.message)" -ForegroundColor Red
    }
}
```

#### iOS Implementation Notes

- Parse `error.details.missingQuestions` array
- Sort by `orderIndex` to find first incomplete question
- Navigate user to that step
- Highlight required fields
- Implement UI validation to prevent this scenario
- Show progress indicator to help users track completion

---

### Sequence 6: Handle Session Expiry

**Scenario:** User's session expires while using the app, triggering re-authentication.

#### Steps

1. **Make API request** (with expired token)
2. **Receive SESSION_EXPIRED error**
3. **Clear local session**
4. **Redirect to login**

#### API Calls

```bash
# Request with expired session
curl -X GET "https://app.rhythmologicum.com/api/funnels/catalog" \
  -H "Cookie: sb-access-token=EXPIRED_TOKEN" \
  -v

# Response (401 Unauthorized):
# {
#   "success": false,
#   "error": {
#     "code": "SESSION_EXPIRED",
#     "message": "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an."
#   },
#   "requestId": "550e8400-e29b-41d4-a716-446655440030"
# }
```

#### PowerShell Example

```powershell
$headers = @{
    "Cookie" = "sb-access-token=EXPIRED_TOKEN"
}

try {
    $catalog = Invoke-RestMethod -Uri "https://app.rhythmologicum.com/api/funnels/catalog" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Catalog fetched successfully" -ForegroundColor Green
    
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    
    if ($errorResponse.error.code -eq "SESSION_EXPIRED") {
        Write-Host "✗ Session expired - please log in again" -ForegroundColor Red
        # Clear stored tokens
        # Redirect to login
    } else {
        Write-Host "✗ Error: $($errorResponse.error.message)" -ForegroundColor Red
    }
}
```

#### iOS Implementation Notes

- Implement centralized error handling for all API responses
- Check for `error.code == "SESSION_EXPIRED"` in every response
- Clear session tokens from Keychain
- Clear any cached user data
- Present login screen modally
- Display user-friendly message: "Your session has expired. Please log in again."
- Do NOT retry the request automatically

---

## API Testing Examples

### Testing with curl (macOS/Linux)

#### Set Environment Variables (for convenience)

```bash
# Set base URL
export API_BASE_URL="https://app.rhythmologicum.com"

# Set session token (after login)
export SESSION_TOKEN="YOUR_SESSION_TOKEN_HERE"

# Now use in requests
curl -X GET "$API_BASE_URL/api/funnels/catalog" \
  -H "Cookie: sb-access-token=$SESSION_TOKEN" \
  -v
```

#### Complete Test Script (Bash)

```bash
#!/bin/bash

# iOS API Integration Test Script
# Usage: ./test-api.sh

set -e

API_BASE="https://app.rhythmologicum.com"
SESSION_TOKEN="YOUR_SESSION_TOKEN"

echo "=== iOS API Integration Tests ==="
echo ""

# Test 1: Check authentication
echo "Test 1: Check authentication..."
AUTH_RESPONSE=$(curl -s -X GET "$API_BASE/api/auth/resolve-role" \
  -H "Cookie: sb-access-token=$SESSION_TOKEN")

ROLE=$(echo $AUTH_RESPONSE | jq -r '.data.role')
if [ "$ROLE" == "patient" ]; then
  echo "✓ Authenticated as patient"
else
  echo "✗ Authentication failed"
  exit 1
fi

# Test 2: Fetch catalog
echo "Test 2: Fetch funnel catalog..."
CATALOG_RESPONSE=$(curl -s -X GET "$API_BASE/api/funnels/catalog?limit=10" \
  -H "Cookie: sb-access-token=$SESSION_TOKEN")

FUNNEL_COUNT=$(echo $CATALOG_RESPONSE | jq '[.data.pillars[].funnels[]] | length')
echo "✓ Found $FUNNEL_COUNT funnels"

# Test 3: Start assessment
echo "Test 3: Start assessment..."
IDEMPOTENCY_KEY=$(uuidgen)
START_RESPONSE=$(curl -s -X POST "$API_BASE/api/funnels/stress-assessment/assessments" \
  -H "Cookie: sb-access-token=$SESSION_TOKEN" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY")

ASSESSMENT_ID=$(echo $START_RESPONSE | jq -r '.data.assessmentId')
if [ ! -z "$ASSESSMENT_ID" ] && [ "$ASSESSMENT_ID" != "null" ]; then
  echo "✓ Started assessment: $ASSESSMENT_ID"
else
  echo "✗ Failed to start assessment"
  exit 1
fi

# Test 4: Save answer
echo "Test 4: Save answer..."
IDEMPOTENCY_KEY=$(uuidgen)
ANSWER_RESPONSE=$(curl -s -X POST "$API_BASE/api/funnels/stress-assessment/assessments/$ASSESSMENT_ID/answers/save" \
  -H "Cookie: sb-access-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{"questionId":"stress_frequency","answerValue":3}')

ANSWER_ID=$(echo $ANSWER_RESPONSE | jq -r '.data.id')
if [ ! -z "$ANSWER_ID" ] && [ "$ANSWER_ID" != "null" ]; then
  echo "✓ Saved answer: $ANSWER_ID"
else
  echo "✗ Failed to save answer"
  exit 1
fi

echo ""
echo "=== All tests passed! ==="
```

### Testing with PowerShell (Windows/macOS)

#### Complete Test Script (PowerShell)

```powershell
# iOS API Integration Test Script
# Usage: .\test-api.ps1

$ErrorActionPreference = "Stop"

$ApiBase = "https://app.rhythmologicum.com"
$SessionToken = "YOUR_SESSION_TOKEN"

$headers = @{
    "Cookie" = "sb-access-token=$SessionToken"
    "Content-Type" = "application/json"
}

Write-Host "=== iOS API Integration Tests ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check authentication
Write-Host "Test 1: Check authentication..." -ForegroundColor Yellow
try {
    $authResponse = Invoke-RestMethod -Uri "$ApiBase/api/auth/resolve-role" `
        -Method GET `
        -Headers $headers
    
    if ($authResponse.data.role -eq "patient") {
        Write-Host "✓ Authenticated as patient" -ForegroundColor Green
    } else {
        throw "Unexpected role: $($authResponse.data.role)"
    }
} catch {
    Write-Host "✗ Authentication failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Fetch catalog
Write-Host "Test 2: Fetch funnel catalog..." -ForegroundColor Yellow
try {
    $catalogResponse = Invoke-RestMethod -Uri "$ApiBase/api/funnels/catalog?limit=10" `
        -Method GET `
        -Headers $headers
    
    $funnelCount = ($catalogResponse.data.pillars | ForEach-Object { $_.funnels }).Count
    Write-Host "✓ Found $funnelCount funnels" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to fetch catalog: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Start assessment
Write-Host "Test 3: Start assessment..." -ForegroundColor Yellow
try {
    $startHeaders = $headers + @{ "Idempotency-Key" = [guid]::NewGuid().ToString() }
    $startResponse = Invoke-RestMethod -Uri "$ApiBase/api/funnels/stress-assessment/assessments" `
        -Method POST `
        -Headers $startHeaders `
        -Body "{}"
    
    $assessmentId = $startResponse.data.assessmentId
    Write-Host "✓ Started assessment: $assessmentId" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to start assessment: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Save answer
Write-Host "Test 4: Save answer..." -ForegroundColor Yellow
try {
    $answerBody = @{
        questionId = "stress_frequency"
        answerValue = 3
    } | ConvertTo-Json
    
    $answerHeaders = $headers + @{ "Idempotency-Key" = [guid]::NewGuid().ToString() }
    $answerResponse = Invoke-RestMethod -Uri "$ApiBase/api/funnels/stress-assessment/assessments/$assessmentId/answers/save" `
        -Method POST `
        -Headers $answerHeaders `
        -Body $answerBody
    
    $answerId = $answerResponse.data.id
    Write-Host "✓ Saved answer: $answerId" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to save answer: $_" -ForegroundColor Red
    exit 1
}

# Test 5: Resume assessment
Write-Host "Test 5: Resume assessment..." -ForegroundColor Yellow
try {
    $resumeResponse = Invoke-RestMethod -Uri "$ApiBase/api/assessments/$assessmentId/resume" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Resumed assessment - current step: $($resumeResponse.data.currentStep.title)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to resume: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== All tests passed! ===" -ForegroundColor Green
```

### Testing with Postman

1. **Create New Collection:** "iOS v0.7 API Tests"
2. **Set Collection Variables:**
   - `base_url`: `https://app.rhythmologicum.com`
   - `session_token`: `YOUR_SESSION_TOKEN`
3. **Import Environment:** Use provided Postman collection (if available)
4. **Run Collection:** Execute all requests in sequence

---

## iOS Implementation Checklist

Use this checklist to guide your iOS implementation. Check off items as you complete them.

### Phase 1: Foundation & Setup (Week 1)

- [ ] **Project Setup**
  - [ ] Create new Xcode project (iOS 17.0+ deployment target)
  - [ ] Add required frameworks (Foundation, UIKit/SwiftUI)
  - [ ] Configure URL schemes: `rhythm://`
  - [ ] Configure Universal Links: `https://app.rhythmologicum.com/mobile/*`
  - [ ] Add AASA (Apple App Site Association) file handling

- [ ] **Networking Layer**
  - [ ] Create `APIClient` class/protocol
  - [ ] Implement `URLSession` with cookie storage
  - [ ] Add request/response interceptors
  - [ ] Implement correlation ID generation (`X-Request-Id` header)
  - [ ] Add idempotency key support (`Idempotency-Key` header)
  - [ ] Create standardized response models (`SuccessResponse<T>`, `ErrorResponse`)

- [ ] **Authentication**
  - [ ] Integrate Supabase Auth SDK
  - [ ] Implement login flow (email/password)
  - [ ] Implement session persistence (Keychain)
  - [ ] Add automatic token refresh
  - [ ] Implement logout functionality
  - [ ] Handle session expiry (`SESSION_EXPIRED` error code)

- [ ] **Error Handling**
  - [ ] Create `APIError` enum with all error codes
  - [ ] Implement centralized error handler
  - [ ] Add error mapping (error code → user message)
  - [ ] Implement retry logic (with exponential backoff)
  - [ ] Add offline detection and queueing

### Phase 2: Core Features (Week 2)

- [ ] **Onboarding Flow**
  - [ ] Check onboarding status (`/api/patient/onboarding-status`)
  - [ ] Implement consent screen (if needed)
  - [ ] Implement profile completion (if needed)
  - [ ] Add role verification (`/api/auth/resolve-role`)

- [ ] **Funnel Catalog**
  - [ ] Fetch funnel catalog (`/api/funnels/catalog`)
  - [ ] Implement caching (ETag, Last-Modified headers)
  - [ ] Display funnel list (grouped by pillar)
  - [ ] Implement pagination (cursor-based)
  - [ ] Add pull-to-refresh
  - [ ] Get funnel details (`/api/funnels/catalog/[slug]`)

- [ ] **Assessment Flow**
  - [ ] Start new assessment (`POST /api/funnels/[slug]/assessments`)
  - [ ] Display assessment steps
  - [ ] Implement question UI (scale, multiple choice, text, etc.)
  - [ ] Save answers on tap (`POST .../answers/save`)
  - [ ] Validate steps before navigation (`POST .../steps/[stepId]`)
  - [ ] Complete assessment (`POST .../complete`)
  - [ ] Handle validation errors (display missing questions)

- [ ] **Assessment Persistence**
  - [ ] Save assessment ID locally (UserDefaults)
  - [ ] Detect in-progress assessments on launch
  - [ ] Resume assessment (`GET /api/assessments/[id]/resume`)
  - [ ] Clear completed assessments from local storage

### Phase 3: Results & Polish (Week 3)

- [ ] **Results Display**
  - [ ] Fetch assessment results (`GET .../result`)
  - [ ] Display score and risk level
  - [ ] Display recommendations
  - [ ] Add share functionality (optional)

- [ ] **Offline Support**
  - [ ] Queue failed requests locally
  - [ ] Retry queued requests on reconnection
  - [ ] Use idempotency keys for safe retries
  - [ ] Show offline indicator in UI

- [ ] **Deep Linking**
  - [ ] Handle custom scheme URLs (`rhythm://`)
  - [ ] Handle universal links (`https://app.rhythmologicum.com/mobile/*`)
  - [ ] Navigate to funnel from deep link
  - [ ] Resume assessment from deep link
  - [ ] Navigate to results from deep link

- [ ] **UI/UX Polish**
  - [ ] Add loading states
  - [ ] Add error states
  - [ ] Add empty states
  - [ ] Implement progress indicator (steps completed / total)
  - [ ] Add animations/transitions
  - [ ] Implement accessibility (VoiceOver, Dynamic Type)

### Phase 4: Testing & Deployment

- [ ] **Unit Tests**
  - [ ] Test API client request/response parsing
  - [ ] Test error handling
  - [ ] Test idempotency logic
  - [ ] Test caching logic

- [ ] **Integration Tests**
  - [ ] Test complete authentication flow
  - [ ] Test complete assessment flow
  - [ ] Test resume functionality
  - [ ] Test offline queueing

- [ ] **UI Tests**
  - [ ] Test login flow
  - [ ] Test funnel browsing
  - [ ] Test assessment completion
  - [ ] Test error scenarios

- [ ] **Performance Testing**
  - [ ] Measure API response times
  - [ ] Test with slow network
  - [ ] Test with no network
  - [ ] Profile memory usage

- [ ] **Beta Testing**
  - [ ] TestFlight distribution
  - [ ] Collect beta feedback
  - [ ] Fix critical bugs

- [ ] **App Store Submission**
  - [ ] Prepare app metadata
  - [ ] Create screenshots
  - [ ] Submit for review

---

## Troubleshooting & Error Mapping

### Common Errors & Solutions

#### Error: `SESSION_EXPIRED` (401)

**Symptoms:**
- User gets logged out unexpectedly
- API calls fail with 401 status

**Causes:**
- JWT token expired (typical: after 1 hour)
- Refresh token expired (typical: after 30 days)
- Manual logout from another device

**Solutions:**
1. Clear local session tokens
2. Redirect user to login screen
3. Display message: "Your session has expired. Please log in again."
4. Do NOT retry automatically

**Prevention:**
- Implement automatic token refresh via Supabase SDK
- Monitor token expiry time
- Refresh proactively (5-10 minutes before expiry)

---

#### Error: `VALIDATION_FAILED` (400)

**Symptoms:**
- Cannot complete assessment
- "Missing required answers" message

**Causes:**
- User skipped required questions
- UI didn't enforce required fields

**Solutions:**
1. Parse `error.details.missingQuestions` array
2. Navigate to first incomplete question (lowest `orderIndex`)
3. Highlight missing required fields
4. Allow user to complete and retry

**Prevention:**
- Show required indicator (*) in UI
- Validate locally before submitting
- Disable "Complete" button until all required fields answered

---

#### Error: `ASSESSMENT_COMPLETED` (400)

**Symptoms:**
- Cannot save answers to completed assessment
- "Assessment already completed" message

**Causes:**
- User trying to edit completed assessment
- Assessment was completed on another device

**Solutions:**
1. Fetch latest assessment status (`/api/assessments/[id]/resume`)
2. If completed, navigate to read-only results view
3. Clear assessment from "in-progress" list

**Prevention:**
- Check assessment status before allowing edits
- Display "locked" indicator for completed assessments
- Sync assessment status on app launch

---

#### Error: `FORBIDDEN` (403)

**Symptoms:**
- Access denied to resource
- "You don't have permission" message

**Causes:**
- Assessment doesn't belong to current user
- User role insufficient (e.g., trying to access clinician endpoint)
- Ownership check failed

**Solutions:**
1. Verify user is logged in with correct account
2. Check if accessing correct resource (own assessments only)
3. If role issue, redirect to appropriate view

**Prevention:**
- Always use authenticated user's ID for requests
- Don't allow access to other users' data
- Implement proper role-based routing

---

#### Error: `NOT_FOUND` (404)

**Symptoms:**
- "Resource not found" error
- Assessment/funnel doesn't exist

**Causes:**
- Invalid assessment ID
- Funnel was deactivated or removed
- Typo in slug/ID

**Solutions:**
1. Verify assessment/funnel ID is correct
2. Refresh funnel catalog (may have been updated)
3. Clear cached assessment ID if stale
4. Navigate back to catalog

**Prevention:**
- Validate IDs before making requests
- Handle 404 gracefully with "not found" message
- Implement cache invalidation strategy

---

#### Error: Network Timeout

**Symptoms:**
- Request hangs and times out
- No response from server

**Causes:**
- Slow or unstable network connection
- Server overloaded or down
- Client network issue (airplane mode, etc.)

**Solutions:**
1. Check network connectivity (`NWPathMonitor`)
2. Display offline indicator
3. Queue request for retry
4. Use exponential backoff (1s, 2s, 4s, 8s delays)

**Prevention:**
- Set reasonable timeout (15-30 seconds for API calls)
- Implement offline detection
- Show loading indicator during requests
- Enable offline mode with local queueing

---

#### Error: Invalid Cursor (Pagination)

**Symptoms:**
- Pagination fails with 400 error
- "Invalid cursor" message

**Causes:**
- Cursor format incorrect
- Cursor expired (data changed)
- Manually constructed cursor (not from API)

**Solutions:**
1. Use cursor exactly as returned from API
2. Don't parse or modify cursor
3. Restart pagination from first page if cursor invalid

**Prevention:**
- Never manually construct cursors
- Treat cursors as opaque strings
- Store cursor with timestamp and expire locally after reasonable time

---

### Error Code Quick Reference

| Error Code | HTTP Status | Retry? | User Action | Log Level |
|------------|-------------|--------|-------------|-----------|
| `SESSION_EXPIRED` | 401 | No | Re-login | Info |
| `UNAUTHORIZED` | 401 | No | Login | Info |
| `FORBIDDEN` | 403 | No | Check permissions | Warning |
| `NOT_FOUND` | 404 | No | Resource missing | Info |
| `VALIDATION_FAILED` | 400 | No | Fix input | Info |
| `INVALID_INPUT` | 400 | No | Fix input | Warning |
| `ASSESSMENT_COMPLETED` | 400 | No | View results | Info |
| `STATE_CONFLICT` | 409 | No | Refresh state | Warning |
| `INTERNAL_ERROR` | 500 | Yes (3x) | Try again later | Error |
| `DATABASE_ERROR` | 500 | Yes (3x) | Try again later | Error |
| `SCHEMA_NOT_READY` | 503 | Yes (backoff) | Service unavailable | Warning |

---

### Debug Checklist

When investigating issues, check these in order:

1. **Network Connectivity**
   - [ ] Device has internet connection
   - [ ] Can reach backend URL (ping/curl)
   - [ ] No firewall/proxy blocking

2. **Authentication**
   - [ ] User is logged in (session token present)
   - [ ] Token not expired (check expiry timestamp)
   - [ ] Token has correct format
   - [ ] Cookie storage enabled in URLSession

3. **Request Format**
   - [ ] Correct HTTP method (GET/POST)
   - [ ] Correct Content-Type header (`application/json` for POST)
   - [ ] Valid JSON body (if POST)
   - [ ] Idempotency-Key header (for write operations)

4. **Response Handling**
   - [ ] Check HTTP status code first
   - [ ] Parse response body as JSON
   - [ ] Check `success` field
   - [ ] Extract `error.code` if `success: false`

5. **Correlation IDs**
   - [ ] Request includes `X-Request-Id` header
   - [ ] Response includes `X-Request-Id` header
   - [ ] Response body includes `requestId` field
   - [ ] Log request ID for support tickets

---

## Related Documentation

### Must-Read Documents (Start Here)

1. **[Mobile API Surface](./MOBILE_API_SURFACE.md)** — Complete API reference with all endpoints, parameters, and responses
2. **[Auth & Session Management](./AUTH_SESSION.md)** — Authentication flow, session handling, and error codes
3. **[API Errors](./API_ERRORS.md)** — Comprehensive error code reference with handling recommendations

### Essential Integration Guides

4. **[Caching & Pagination](./CACHING_PAGINATION.md)** — HTTP caching strategy, ETag validation, cursor-based pagination
5. **[Idempotency](./IDEMPOTENCY.md)** — Offline/retry readiness with idempotency keys
6. **[Deep Links](./DEEP_LINKS.md)** — Custom URL schemes, universal links, and parameter handling
7. **[Observability](./OBSERVABILITY.md)** — Correlation IDs, structured logging, and debugging workflow

### Advanced Topics

8. **[Content Block Renderer Integration](./CONTENT_BLOCK_RENDERER_INTEGRATION.md)** — Rich content display for assessments
9. **[Shell Foundations](./SHELL_FOUNDATIONS.md)** — Mobile app architecture and design patterns
10. **[Block Editor](./BLOCK_EDITOR.md)** — Content editor integration (if needed)

### Backend References

11. **[API Route Ownership](../API_ROUTE_OWNERSHIP.md)** — API endpoint ownership and stability
12. **[Patient API Contracts](../PATIENT_API_CONTRACTS.md)** — Contract guarantees for patient endpoints
13. **[External Clients](../EXTERNAL_CLIENTS.md)** — External client registry

### Database & Schema

14. **[Schema Evidence](../V05_SCHEMA_EVIDENCE.md)** — Database schema documentation
15. **[RLS Evidence](../V05_RLS_EVIDENCE.md)** — Row-level security policies

---

## Support

### Getting Help

**For API Questions:**
- Check [Mobile API Surface](./MOBILE_API_SURFACE.md) for endpoint documentation
- Review [API Errors](./API_ERRORS.md) for error code meanings
- Search [Related Documentation](#related-documentation) for specific topics

**For Integration Issues:**
- Review [Troubleshooting](#troubleshooting--error-mapping) section
- Check [Error Code Quick Reference](#error-code-quick-reference)
- Test with curl/PowerShell examples to isolate issue

**For Bugs:**
- Create GitHub issue with label `ios-client`
- Include correlation ID (`X-Request-Id`) from error response
- Provide request/response payloads (redact sensitive data)
- Include iOS version, device model, and app version

**For Feature Requests:**
- Create GitHub issue with label `enhancement`
- Tag with `mobile-client` if iOS-specific
- Describe use case and expected behavior

### Contact

- **Backend Team:** For API contract changes or backend bugs
- **Mobile Team:** For iOS implementation questions
- **QA Team:** For testing support and validation

---

## Changelog

### v1.0.0 (2026-01-14)

- Initial iOS Integration Pack release
- 6 complete end-to-end sequences
- Curl and PowerShell examples for all critical paths
- Comprehensive troubleshooting guide
- Ready-to-implement iOS checklist
- Error mapping table
- Related documentation links

---

**Next Steps:**

1. Review [Mobile API Surface](./MOBILE_API_SURFACE.md) for detailed endpoint specifications
2. Set up development environment (Xcode, Supabase SDK)
3. Test authentication flow with curl/PowerShell
4. Start Phase 1 of [iOS Implementation Checklist](#ios-implementation-checklist)
5. Join iOS integration Slack channel (if available)

**Estimated Implementation Time:** 2-3 weeks for full v0.7 integration

Good luck with your iOS implementation! 🚀
