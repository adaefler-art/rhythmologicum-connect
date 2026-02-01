# Start/Resume Assessment Semantics

**Version:** 1.0  
**Status:** Canonical (Production)  
**Last Updated:** 2026-02-01  
**Related Epic:** E74.7 - Start/Resume Idempotency

## Purpose

This document defines the canonical semantics for starting and resuming assessments in the Rhythmologicum Connect platform. It establishes clear, idempotent behavior to prevent duplicate assessments and ensure a consistent user experience.

## Problem Statement

Before E74.7, the assessment system had ambiguous start/resume behavior:
- ❌ Multiple parallel requests could create duplicate assessments
- ❌ No clear contract for "continue where you left off"
- ❌ Race conditions in distributed/mobile scenarios
- ❌ Unclear semantics for "start fresh" vs "resume existing"

E74.7 establishes **deterministic, idempotent** semantics with database-level guarantees.

---

## Core Principles

### 1. **ONE In-Progress Assessment Per Patient+Funnel**

At any given time, a patient can have at most **ONE** in-progress assessment for each funnel.

**Database Enforcement:**
```sql
CREATE UNIQUE INDEX idx_assessments_one_in_progress_per_patient_funnel
  ON assessments (patient_id, funnel)
  WHERE completed_at IS NULL;
```

This constraint:
- Prevents duplicate assessments at the database level
- Provides atomic race condition protection
- Applies only to in-progress assessments (`completed_at IS NULL`)
- Allows multiple completed assessments for the same patient+funnel

### 2. **Default Behavior: RESUME_OR_CREATE**

When no explicit behavior is requested, the API follows RESUME_OR_CREATE semantics:
- If in-progress assessment exists → **Resume** (return existing)
- If no in-progress assessment → **Create** new assessment

This ensures idempotent behavior: calling the endpoint multiple times returns the same assessment.

### 3. **Explicit Behavior: FORCE_NEW**

When the client explicitly requests a fresh start, use `forceNew: true`:
- Complete existing in-progress assessment (set `completed_at`, `status='completed'`)
- Create new assessment
- Return new assessment

This allows users to restart an assessment when desired.

---

## API Contract

### Endpoint

```
POST /api/funnels/{slug}/assessments
```

### Request Body

```typescript
interface StartAssessmentRequest {
  forceNew?: boolean  // Optional: Default false
}
```

### Response

```typescript
interface StartAssessmentResponse {
  success: boolean
  data: {
    assessment: Assessment
    currentStep: StepInfo
    behavior: "RESUME" | "CREATE" | "FORCE_NEW"
  }
}

interface Assessment {
  id: string
  patient_id: string
  funnel: string
  status: "in_progress" | "completed"
  started_at: string
  completed_at: string | null
  current_step_id: string | null
  // ... other fields
}

interface StepInfo {
  step_id: string
  title: string
  order_index: number
  // ... other fields
}
```

### HTTP Status Codes

- **200 OK:** Existing in-progress assessment returned (RESUME)
- **201 Created:** New assessment created (CREATE or FORCE_NEW)
- **400 Bad Request:** Invalid request (e.g., missing patient_id)
- **404 Not Found:** Funnel not found
- **500 Internal Server Error:** Server error

---

## Behavior Scenarios

### Scenario 1: First Assessment (No Existing)

**Request:**
```http
POST /api/funnels/stress-assessment-a/assessments
Content-Type: application/json

{}
```

**Behavior:** CREATE
- No in-progress assessment exists
- New assessment created
- Response: 201 Created

**Response:**
```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "assess-123",
      "patient_id": "patient-456",
      "funnel": "stress-assessment-a",
      "status": "in_progress",
      "started_at": "2026-02-01T10:00:00Z",
      "completed_at": null,
      "current_step_id": "step-1"
    },
    "currentStep": {
      "step_id": "step-1",
      "title": "General Well-being",
      "order_index": 0
    },
    "behavior": "CREATE"
  }
}
```

### Scenario 2: Resume Existing (Default)

**Request:**
```http
POST /api/funnels/stress-assessment-a/assessments
Content-Type: application/json

{}
```

**Behavior:** RESUME
- In-progress assessment exists (id: assess-123, current_step: step-2)
- Existing assessment returned
- Response: 200 OK

**Response:**
```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "assess-123",
      "patient_id": "patient-456",
      "funnel": "stress-assessment-a",
      "status": "in_progress",
      "started_at": "2026-02-01T10:00:00Z",
      "completed_at": null,
      "current_step_id": "step-2"
    },
    "currentStep": {
      "step_id": "step-2",
      "title": "Sleep & Energy",
      "order_index": 1
    },
    "behavior": "RESUME"
  }
}
```

### Scenario 3: Force New Assessment

**Request:**
```http
POST /api/funnels/stress-assessment-a/assessments
Content-Type: application/json

{
  "forceNew": true
}
```

**Behavior:** FORCE_NEW
- Existing in-progress assessment (assess-123) is completed
- New assessment (assess-789) created
- Response: 201 Created

**Response:**
```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "assess-789",
      "patient_id": "patient-456",
      "funnel": "stress-assessment-a",
      "status": "in_progress",
      "started_at": "2026-02-01T11:00:00Z",
      "completed_at": null,
      "current_step_id": "step-1"
    },
    "currentStep": {
      "step_id": "step-1",
      "title": "General Well-being",
      "order_index": 0
    },
    "behavior": "FORCE_NEW"
  }
}
```

**Note:** The old assessment (assess-123) now has:
- `status: "completed"`
- `completed_at: "2026-02-01T11:00:00Z"`

### Scenario 4: Parallel Requests (Race Condition)

**Situation:** Two requests arrive simultaneously for the same patient+funnel

**Request 1 & 2 (parallel):**
```http
POST /api/funnels/stress-assessment-a/assessments
```

**Behavior:** Race Protection
- Database unique constraint prevents duplicate creation
- One request creates assessment (201 Created)
- Other request receives same assessment (200 OK or 201 depending on timing)
- Both requests receive the same assessment ID

**Guarantee:** No duplicate in-progress assessments created

---

## State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                 Assessment Lifecycle                         │
└─────────────────────────────────────────────────────────────┘

[No Assessment]
      │
      │ POST /assessments (default or forceNew=false)
      ▼
┌──────────────────┐
│  In-Progress     │ ◄──── POST /assessments (default)
│  status: in_progress  │       Returns existing (RESUME)
│  completed_at: null   │
└──────────────────┘
      │
      │ POST /assessments?forceNew=true
      │ (completes this assessment)
      ▼
┌──────────────────┐
│   Completed      │
│  status: completed    │
│  completed_at: set    │
└──────────────────┘
      │
      │ POST /assessments
      │ (creates new assessment)
      ▼
┌──────────────────┐
│  In-Progress     │
│  (new assessment)    │
└──────────────────┘
```

**Key Points:**
1. An assessment starts in `in_progress` state
2. Default POST behavior returns the in-progress assessment (RESUME)
3. `forceNew=true` transitions old to completed, creates new in-progress
4. Completed assessments don't block new assessments

---

## Implementation Details

### Database Schema

```sql
-- assessments table (relevant fields)
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  funnel TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  current_step_id TEXT,
  -- ... other fields
);

-- Unique constraint: ONE in-progress per patient+funnel
CREATE UNIQUE INDEX idx_assessments_one_in_progress_per_patient_funnel
  ON assessments (patient_id, funnel)
  WHERE completed_at IS NULL;

-- Efficient lookup for in-progress assessments
CREATE INDEX idx_assessments_patient_in_progress
  ON assessments (patient_id, funnel, completed_at)
  WHERE completed_at IS NULL;
```

### API Implementation

**Location:** `apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/route.ts`

**Pseudocode:**
```typescript
export async function POST(request: Request) {
  // 1. Parse request body
  const { forceNew } = await request.json()
  const { user } = await getCurrentUser()
  const { slug } = params
  
  // 2. Check for existing in-progress assessment
  const existingAssessment = await supabase
    .from('assessments')
    .select('*')
    .eq('patient_id', user.id)
    .eq('funnel', slug)
    .is('completed_at', null)
    .single()
  
  // 3. Handle forceNew
  if (forceNew && existingAssessment) {
    await supabase
      .from('assessments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', existingAssessment.id)
    
    // Create new assessment
    const newAssessment = await createNewAssessment(user.id, slug)
    return NextResponse.json({
      success: true,
      data: {
        assessment: newAssessment,
        currentStep: await loadStep(newAssessment.current_step_id),
        behavior: 'FORCE_NEW'
      }
    }, { status: 201 })
  }
  
  // 4. Resume existing
  if (existingAssessment && !forceNew) {
    return NextResponse.json({
      success: true,
      data: {
        assessment: existingAssessment,
        currentStep: await loadStep(existingAssessment.current_step_id),
        behavior: 'RESUME'
      }
    }, { status: 200 })
  }
  
  // 5. Create new
  const newAssessment = await createNewAssessment(user.id, slug)
  return NextResponse.json({
    success: true,
    data: {
      assessment: newAssessment,
      currentStep: await loadStep(newAssessment.current_step_id),
      behavior: 'CREATE'
    }
  }, { status: 201 })
}
```

---

## Frontend Integration

### Mobile/Patient UI

**Pattern: Check for existing assessment on mount**

```typescript
import { useState, useEffect } from 'react'

function AssessmentFlow({ funnelSlug }: { funnelSlug: string }) {
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function initializeAssessment() {
      try {
        // Default behavior: RESUME_OR_CREATE
        const response = await fetch(`/api/funnels/${funnelSlug}/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        
        const { data } = await response.json()
        setAssessment(data.assessment)
        
        if (data.behavior === 'RESUME') {
          console.log('Resuming existing assessment:', data.assessment.id)
          // Navigate to current step
        } else {
          console.log('Starting new assessment:', data.assessment.id)
          // Navigate to first step
        }
      } catch (error) {
        console.error('Failed to initialize assessment:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initializeAssessment()
  }, [funnelSlug])
  
  const handleStartFresh = async () => {
    // Explicit fresh start
    const response = await fetch(`/api/funnels/${funnelSlug}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceNew: true })
    })
    
    const { data } = await response.json()
    setAssessment(data.assessment)
    // Navigate to first step
  }
  
  if (loading) return <LoadingSpinner />
  
  return (
    <div>
      {assessment?.current_step_id && (
        <button onClick={handleStartFresh}>
          Start Fresh Assessment
        </button>
      )}
      <AssessmentSteps assessment={assessment} />
    </div>
  )
}
```

---

## Validation Rules

The following rules ensure correct start/resume behavior:

- **R-E74.7-001:** ONE in-progress assessment per patient+funnel (Database constraint)
- **R-E74.7-002:** Efficient lookup index for in-progress assessments (Database index)
- **R-E74.7-003:** API returns existing assessment by default (RESUME_OR_CREATE logic)
- **R-E74.7-004:** API supports forceNew parameter (API implementation)
- **R-E74.7-005:** API completes old assessment when forceNew=true (API implementation)
- **R-E74.7-006:** Parallel requests don't create duplicate assessments (Race protection)

**Verification:** `npm run verify:e74-7`

---

## Edge Cases & FAQ

### Q: What happens if I call POST multiple times rapidly?

**A:** The unique database constraint prevents duplicates. All requests receive the same assessment ID. This is safe and idempotent.

### Q: Can I have multiple completed assessments for the same funnel?

**A:** Yes! The unique constraint only applies to in-progress assessments (`completed_at IS NULL`). You can have unlimited completed assessments.

### Q: What if I want to "abandon" an in-progress assessment without completing it?

**A:** Use `forceNew: true` to complete the old assessment and start a new one. The old assessment will be marked as completed.

### Q: How do I differentiate between "completed normally" vs "abandoned via forceNew"?

**A:** Check the `status` field:
- Normal completion: `status: "completed"` + answers for all required questions
- Abandoned: `status: "completed"` + may have incomplete answers

For more granular tracking, consider adding a `completion_reason` field in the future.

### Q: What happens after a network disconnect/reconnect?

**A:** The client can safely call POST again without `forceNew`. The API will return the existing in-progress assessment (RESUME behavior), and the user continues where they left off.

### Q: Can clinicians start assessments on behalf of patients?

**A:** This depends on the authorization logic in the API. The start/resume semantics remain the same; the `patient_id` is determined by the API based on context (logged-in user or clinician-specified patient).

---

## Related Documentation

- **Funnel Definition Schema:** `/docs/funnels/DEFINITION_V1.md`
- **Studio Publishing:** `/docs/funnels/STUDIO_PUBLISH_GATES.md`
- **Rules vs Checks Matrix:** `/docs/RULES_VS_CHECKS_MATRIX.md`
- **E74.7 Implementation:** `/E74.7-COMPLETE.md`
- **E74.7 Summary:** `/E74.7-SUMMARY.md`

---

## Version History

- **1.0 (2026-02-01):** Initial documentation
  - Established RESUME_OR_CREATE default semantics
  - Defined forceNew behavior
  - Documented database constraints
  - Added frontend integration examples
