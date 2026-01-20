# E6.4.3 — Funnel API Endpoints Catalog

## Overview
This document catalogs all funnel-related API endpoints and their usage in the patient UI for the E6.4.3 pilot implementation.

## Patient Flow Endpoints (Core Runtime)

### 1. Start Assessment
**Endpoint:** `POST /api/funnels/[slug]/assessments`

**Purpose:** Create a new assessment for a funnel

**UI Reference:** 
- `/app/patient/funnel/[slug]/client.tsx` (line 345)

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "status": "in_progress",
    "currentStep": {
      "stepId": "uuid",
      "title": "string",
      "type": "form",
      "orderIndex": 1,
      "stepIndex": 0
    }
  }
}
```

**Features:**
- Idempotency support via `Idempotency-Key` header (E6.2.4)
- Returns first step information
- Creates assessment with status `in_progress`

---

### 2. Get Assessment Status
**Endpoint:** `GET /api/funnels/[slug]/assessments/[assessmentId]`

**Purpose:** Retrieve current assessment status and step

**UI Reference:**
- `/app/patient/funnel/[slug]/client.tsx` (line 116)

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "status": "in_progress",
    "currentStep": {
      "stepId": "uuid",
      "title": "string",
      "type": "form",
      "stepIndex": 0,
      "orderIndex": 1
    },
    "completedSteps": 0,
    "totalSteps": 3
  }
}
```

**Features:**
- Used for resume functionality
- Returns current step position
- Provides progress information

---

### 3. Validate and Navigate Step
**Endpoint:** `POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]`

**Purpose:** Validate current step and get next step information

**UI Reference:**
- `/app/patient/funnel/[slug]/client.tsx` (line 502)

**Request:** None (validation happens server-side)

**Response (Valid):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "nextStep": {
      "stepId": "uuid",
      "title": "string",
      "type": "form",
      "stepIndex": 1,
      "orderIndex": 2
    }
  }
}
```

**Response (Invalid):**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "missingQuestions": [
      {
        "questionId": "uuid",
        "questionKey": "stress_q1",
        "questionLabel": "Question text",
        "orderIndex": 1
      }
    ]
  }
}
```

**Features:**
- Server-side step-skipping prevention
- Returns validation errors with question details
- Determines next step from runtime

---

### 4. Save Answer
**Endpoint:** `POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save`

**Purpose:** Persist a single answer to the database

**UI Reference:**
- `/app/patient/funnel/[slug]/client.tsx` (line 393)

**Request:**
```json
{
  "stepId": "uuid",
  "questionId": "stress_q1",
  "answerValue": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "saved": true
  }
}
```

**Features:**
- Idempotent (upsert behavior)
- Validates answer value range
- Ownership verification

---

### 5. Complete Assessment
**Endpoint:** `POST /api/funnels/[slug]/assessments/[assessmentId]/complete`

**Purpose:** Mark assessment as completed after full validation

**UI Reference:**
- `/app/patient/funnel/[slug]/client.tsx` (line 443)

**Request:** None

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "status": "completed"
  }
}
```

**Response (Validation Failed):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Nicht alle Pflichtfragen wurden beantwortet.",
    "details": {
      "missingQuestions": [
        {
          "questionId": "uuid",
          "questionKey": "stress_q1",
          "questionLabel": "Question text",
          "orderIndex": 1
        }
      ]
    }
  }
}
```

**Features:**
- Full validation across all steps
- Idempotency support (E6.2.4)
- Sets `completed_at` timestamp deterministically
- Sets `status = 'completed'` atomically
- Tracks completion KPI event

---

### 6. Get Assessment Result
**Endpoint:** `GET /api/funnels/[slug]/assessments/[assessmentId]/result`

**Purpose:** Retrieve assessment result summary after completion

**UI Reference:**
- `/app/patient/funnel/[slug]/result/client.tsx` (line 70)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "funnel": "stress-assessment",
    "completedAt": "2026-01-14T12:00:00Z",
    "status": "completed",
    "funnelTitle": "Stress & Resilienz Check"
  }
}
```

**Features:**
- Verifies assessment is completed
- Returns completion metadata
- Used by result page for display

---

### 7. Workup Check (E6.4.5)
**Endpoint:** `POST /api/funnels/[slug]/assessments/[assessmentId]/workup`

**Purpose:** Perform data sufficiency check on completed assessment

**UI Reference:**
- Auto-triggered by completion endpoint (background)
- Can be manually triggered via API for testing/re-evaluation

**Request:** None (POST body optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "workupStatus": "needs_more_data",
    "missingDataFields": ["sleep_quality"],
    "followUpQuestions": [
      {
        "id": "followup_sleep_quality",
        "fieldKey": "sleep_quality",
        "questionText": "Wie würden Sie Ihre Schlafqualität...",
        "inputType": "scale",
        "priority": 10
      }
    ],
    "evidencePackHash": "sha256-hash-string",
    "rulesetVersion": "1.0.0"
  },
  "schemaVersion": "v1"
}
```

**Features:**
- Deterministic rule-based checking (no LLM)
- Updates `workup_status` and `missing_data_fields` in database
- Generates follow-up questions for missing data
- NO DIAGNOSIS - purely data completeness check
- Auto-triggered after assessment completion

---

## Funnel Discovery Endpoints

### 7. Get Funnel Catalog
**Endpoint:** `GET /api/funnels/catalog`

**Purpose:** Retrieve all active funnels organized by pillar

**UI Reference:**
- `/app/patient/funnels/client.tsx` (line 31)

**Response:**
```json
{
  "success": true,
  "data": {
    "pillars": [
      {
        "pillar": {
          "id": "mental-health",
          "title": "Mentale Gesundheit",
          "description": "Assessments zu Stress und Resilienz"
        },
        "funnels": [
          {
            "id": "uuid",
            "slug": "stress-assessment",
            "title": "Stress Assessment",
            "subtitle": null,
            "description": "Ein wissenschaftlich validiertes Assessment",
            "est_duration_min": 10,
            "outcomes": ["Stresslevel ermitteln"],
            "default_version": "1.0.0",
            "availability": "available"
          }
        ]
      }
    ],
    "uncategorized_funnels": []
  }
}
```

**Features:**
- Pillar-based organization
- Availability filtering
- Duration and outcome metadata

---

### 8. Get Active Funnels (Legacy)
**Endpoint:** `GET /api/funnels/active`

**Purpose:** List all active funnels (flat list)

**UI Reference:**
- Currently unused in patient UI (legacy endpoint)

**Status:** ⚠️ Consider deprecating in favor of `/api/funnels/catalog`

---

### 9. Get Funnel Definition
**Endpoint:** `GET /api/funnels/[slug]/definition`

**Purpose:** Retrieve funnel structure with steps and questions

**UI Reference:**
- `/app/patient/funnel/[slug]/client.tsx` (line 221)
- `/app/patient/funnel/[slug]/intro/client.tsx` (line 55)

**Response:**
```json
{
  "id": "uuid",
  "slug": "stress-assessment",
  "title": "Stress & Resilienz Check",
  "subtitle": "Stress & Resilienz",
  "description": "Ihr persönlicher Stress- & Schlaf-Check",
  "steps": [
    {
      "id": "uuid",
      "title": "Umgang mit Stress",
      "type": "form",
      "description": "Bereich: Umgang mit Stress",
      "orderIndex": 1,
      "questions": [
        {
          "id": "uuid",
          "key": "stress_q1",
          "label": "Wie häufig fühlen Sie sich im Alltag gestresst?",
          "type": "scale",
          "minValue": 0,
          "maxValue": 4,
          "isRequired": true,
          "orderIndex": 1
        }
      ]
    }
  ],
  "totalQuestions": 8
}
```

**Features:**
- Complete funnel structure
- Used for rendering questions
- Handles 404 for "coming soon" funnels

---

### 10. Get Content Pages
**Endpoint:** `GET /api/funnels/[slug]/content-pages`

**Purpose:** Retrieve associated content pages (intro, info, result)

**UI Reference:**
- `/app/patient/funnel/[slug]/client.tsx` (line 259)
- `/app/patient/funnel/[slug]/result/client.tsx` (line 93)

**Response:**
```json
[
  {
    "id": "uuid",
    "funnel_slug": "stress-assessment",
    "category": "intro",
    "slug": "intro",
    "title": "Willkommen zum Stress Assessment",
    "content": "# Intro\n\nWillkommen...",
    "published": true
  }
]
```

**Features:**
- Returns published content pages only
- Used for intro pages, info blocks, result pages
- Optional (404 handled gracefully)

---

## Dashboard Endpoints

### 11. Get In-Progress Assessment
**Endpoint:** `GET /api/assessments/in-progress`

**Purpose:** Find the most recent in-progress assessment for the current user

**UI Reference:**
- `/app/patient/dashboard/client.tsx` (line 38)

**Response (Found):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "funnel": "stress-assessment",
    "funnel_id": "uuid",
    "started_at": "2026-01-14T10:00:00Z",
    "completed_at": null
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NO_IN_PROGRESS",
    "message": "No in-progress assessments found"
  }
}
```

**Features:**
- Powers "Continue Assessment" button
- Returns most recent by `started_at`
- Filters by `completed_at IS NULL`

---

## Endpoint Usage Summary

### All Endpoints Referenced in Patient UI ✅

1. ✅ `POST /api/funnels/[slug]/assessments` - Start assessment
2. ✅ `GET /api/funnels/[slug]/assessments/[assessmentId]` - Get status (resume)
3. ✅ `POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]` - Validate step
4. ✅ `POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save` - Save answer
5. ✅ `POST /api/funnels/[slug]/assessments/[assessmentId]/complete` - Complete assessment
6. ✅ `GET /api/funnels/[slug]/assessments/[assessmentId]/result` - Get result
7. ✅ `POST /api/funnels/[slug]/assessments/[assessmentId]/workup` - Workup check (E6.4.5, auto-triggered)
8. ✅ `GET /api/funnels/catalog` - Browse funnels
9. ✅ `GET /api/funnels/[slug]/definition` - Get funnel structure
10. ✅ `GET /api/funnels/[slug]/content-pages` - Get content pages
11. ✅ `GET /api/assessments/in-progress` - Dashboard resume detection

### Potentially Unused/Dead Endpoints

- ⚠️ `GET /api/funnels/active` - Legacy endpoint, not referenced in current patient UI
- ⚠️ `GET /api/funnels/catalog/[slug]` - Individual catalog entry (may be admin-only)

### Admin/Clinician Endpoints (Out of Scope)

The following endpoints exist under `/api/admin/funnels` but are not part of the patient flow:
- Admin funnel management
- Admin step management
- Admin question management
- Funnel version management

---

## AC5 Verification

✅ **All core patient flow endpoints are referenced in the UI:**
- Start, resume, navigate, save, complete, result - all used
- Catalog and definition endpoints - used for discovery and rendering
- Content pages endpoint - used for intro/info/result content
- Dashboard endpoint - used for resume detection

❌ **Dead endpoint candidates:**
- `/api/funnels/active` - Should verify if needed or remove

---

## Flow Diagram

```
Dashboard
  ↓
  GET /api/assessments/in-progress
  ↓
[Has in-progress?] --Yes--> Continue to Funnel
  ↓ No
[Start New] --> Catalog
  ↓
  GET /api/funnels/catalog
  ↓
[Select Funnel] --> Intro Page
  ↓
  GET /api/funnels/[slug]/definition
  GET /api/funnels/[slug]/content-pages
  ↓
[Start Assessment]
  ↓
  POST /api/funnels/[slug]/assessments
  ↓
[Render Questions]
  ↓
  POST /api/funnels/[slug]/assessments/[id]/answers/save (per answer)
  ↓
[Next Step]
  ↓
  POST /api/funnels/[slug]/assessments/[id]/steps/[stepId]
  ↓
[Last Step - Complete]
  ↓
  POST /api/funnels/[slug]/assessments/[id]/complete
  ↓
[Background: Workup Check] (E6.4.5)
  ↓
  POST /api/funnels/[slug]/assessments/[id]/workup
  ↓
[View Results]
  ↓
  GET /api/funnels/[slug]/assessments/[id]/result
  ↓
[Return to Dashboard] --> Dashboard
```

---

## Notes

- All endpoints follow B8 standardized response format
- Idempotency support on POST endpoints (E6.2.4)
- Proper authentication and ownership verification
- Deterministic state management
- No client-side state as source of truth
