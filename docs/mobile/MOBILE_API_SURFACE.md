# Mobile API Surface — Patient Flow (v0.7)

## Overview

This document defines the **guaranteed API surface** for the iOS mobile application (v0.7) when accessing patient-facing features in Rhythmologicum Connect. It provides a comprehensive inventory of endpoints the mobile app requires, along with their contracts and guarantees.

**Purpose:**
- Define which endpoints are **must support** for v0.7 iOS release
- Document API contracts (authentication, idempotency, caching, pagination, rate limits)
- Provide schema versioning information for client compatibility
- Establish clear ownership for each endpoint

**Audience:** iOS developers, backend API maintainers, QA engineers

**Version:** v0.7 (2026-01)

**Related Documents:**
- **`docs/mobile/CACHING_PAGINATION.md`** — Detailed caching and pagination implementation guide (E6.2.7)
- `docs/PATIENT_API_CONTRACTS.md` — Patient endpoint contracts
- `docs/API_ROUTE_OWNERSHIP.md` — API route ownership
- `docs/mobile/AUTH_SESSION.md` — Session management guide

---

## Endpoint Categories

The mobile patient flow requires endpoints in these categories:

1. **Authentication & Onboarding** — User session management and initial setup
2. **Funnel Catalog** — Discovering available assessment funnels
3. **Assessment Lifecycle** — Starting, resuming, and completing assessments
4. **Assessment Answers** — Saving and retrieving user responses
5. **Results & History** — Viewing assessment results and past assessments
6. **Patient Profile** — User profile information

---

## Must Support Matrix (v0.7 iOS)

| Endpoint | Priority | Auth Required | Idempotent | Cacheable | Pagination | Rate Limit | Contract Owner | Schema Version Field |
|----------|----------|---------------|------------|-----------|------------|------------|----------------|---------------------|
| **Authentication & Onboarding** |
| `GET /api/patient/onboarding-status` | **MUST** | Yes | Yes | No | No | 60/min | `app/api/patient/onboarding-status/route.ts` | N/A |
| `GET /api/auth/resolve-role` | **MUST** | Yes | Yes | No | No | 60/min | `app/api/auth/resolve-role/route.ts` | N/A |
| `POST /api/consent/record` | NICE | Yes | No | No | No | 10/min | `app/api/consent/record/route.ts` | `consent_version` |
| `GET /api/consent/status` | NICE | Yes | Yes | No | No | 60/min | `app/api/consent/status/route.ts` | `consent_version` |
| **Funnel Catalog** |
| `GET /api/funnels/catalog` | **MUST** | Yes | Yes | Yes (5min) | Yes (cursor) | 120/min | `app/api/funnels/catalog/route.ts` | `funnel_version_id` |
| `GET /api/funnels/catalog/[slug]` | **MUST** | Yes | Yes | Yes (5min) | No | 120/min | `app/api/funnels/catalog/[slug]/route.ts` | `funnel_version_id` |
| `GET /api/funnels/[slug]/definition` | NICE | Yes | Yes | Yes (10min) | No | 60/min | `app/api/funnels/[slug]/definition/route.ts` | `funnel_version_id` |
| **Assessment Lifecycle** |
| `POST /api/funnels/[slug]/assessments` | **MUST** | Yes | No | No | No | 30/min | `app/api/funnels/[slug]/assessments/route.ts` | N/A |
| `GET /api/funnels/[slug]/assessments/[assessmentId]` | **MUST** | Yes | Yes | No | No | 120/min | `app/api/funnels/[slug]/assessments/[assessmentId]/route.ts` | N/A |
| `GET /api/assessments/[id]/resume` | **MUST** | Yes | Yes | No | No | 60/min | `app/api/assessments/[id]/resume/route.ts` | N/A |
| `POST /api/funnels/[slug]/assessments/[assessmentId]/complete` | **MUST** | Yes | No | No | No | 20/min | `app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts` | N/A |
| **Assessment Step Validation** |
| `POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]` | **MUST** | Yes | No | No | No | 60/min | `app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts` | N/A |
| `POST /api/assessment-validation/validate-step` | NICE | Yes | No | No | No | 60/min | `app/api/assessment-validation/validate-step/route.ts` | N/A |
| **Assessment Answers** |
| `POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save` | **MUST** | Yes | Yes (upsert) | No | No | 120/min | `app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts` | N/A |
| `POST /api/assessment-answers/save` | NICE | Yes | Yes (upsert) | No | No | 120/min | `app/api/assessment-answers/save/route.ts` | N/A |
| **Results & History** |
| `GET /api/funnels/[slug]/assessments/[assessmentId]/result` | **MUST** | Yes | Yes | No | No | 60/min | `app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts` | N/A |
| `GET /api/patient-measures/history` | NICE | Yes | Yes | Yes (2min) | Yes (limit) | 30/min | `app/api/patient-measures/history/route.ts` | N/A |
| `GET /api/patient-measures/export` | NICE | Yes | Yes | No | No | 10/min | `app/api/patient-measures/export/route.ts` | N/A |
| **Patient Profile** |
| `GET /api/patient-profiles` | NICE | Yes | Yes | Yes (5min) | No | 60/min | `app/api/patient-profiles/route.ts` | N/A |

**Legend:**
- **MUST** = Required for v0.7 iOS release (critical path)
- **NICE** = Nice to have, but not blocking (can be added in v0.7.1+)
- **Auth Required** = Requires authenticated session via Supabase Auth
- **Idempotent** = Safe to retry (GET, or POST with upsert logic)
- **Cacheable** = Client can cache response (duration in parentheses)
- **Pagination** = Supports pagination (limit/offset or cursor-based)
- **Rate Limit** = Requests per minute per user

---

## Endpoint Specifications

### 1. Authentication & Onboarding

#### `GET /api/patient/onboarding-status`

**Purpose:** Check if user has completed onboarding (consent + profile setup)

**Contract Owner:** `app/api/patient/onboarding-status/route.ts`

**Authentication:** Required (any authenticated user)

**Request:** No parameters

**Response:**
```typescript
{
  success: boolean
  data?: {
    needsConsent: boolean    // True if current consent version not signed
    needsProfile: boolean    // True if patient profile incomplete
    completed: boolean       // True if onboarding fully completed
  }
  error?: { code: string, message: string }
}
```

**Status Codes:**
- `200 OK` — Success
- `401 Unauthorized` — User not authenticated
- `500 Internal Server Error` — Database error

**Caching:** No-store (always fresh)

**Idempotency:** Safe to call multiple times

**Rate Limit:** 60 requests/minute

**Notes:**
- Uses `CURRENT_CONSENT_VERSION` from `lib/contracts/onboarding`
- Profile considered complete when `patient_profiles.full_name` is non-empty
- Critical for determining if user can start assessments

---

#### `GET /api/auth/resolve-role`

**Purpose:** Get user's role after authentication

**Contract Owner:** `app/api/auth/resolve-role/route.ts`

**Authentication:** Required

**Request:** No parameters

**Response:**
```typescript
{
  success: boolean
  data?: {
    role: 'patient' | 'clinician' | 'admin' | 'nurse'
  }
  error?: { code: string, message: string }
}
```

**Status Codes:**
- `200 OK` — Success
- `401 Unauthorized` — User not authenticated

**Caching:** No (role can change)

**Idempotency:** Safe

**Rate Limit:** 60 requests/minute

**Notes:**
- Returns role from `user.app_metadata.role`
- Mobile app should typically see `patient` role
- Used for role-based UI routing

---

### 2. Funnel Catalog

#### `GET /api/funnels/catalog`

**Purpose:** List all active assessment funnels organized by pillar

**Contract Owner:** `app/api/funnels/catalog/route.ts`

**Authentication:** Required (any role)

**Request Query Parameters:**
- `tier` (optional): Filter by program tier (e.g., `tier-1-essential`)
- `limit` (optional): Items per page (default: 50, max: 100) — **E6.2.7**
- `cursor` (optional): Pagination cursor for next page — **E6.2.7**

**Request Headers (Optional):**
- `If-None-Match`: ETag for cache validation — **E6.2.7**
- `If-Modified-Since`: HTTP date for cache validation — **E6.2.7**

**Response:**
```typescript
{
  success: boolean
  data?: {
    pillars: Array<{
      id: string
      title: string
      description: string
      funnels: Array<{
        id: string
        slug: string
        title: string
        description: string
        estimatedMinutes: number
        funnel_version_id: string  // Schema version tracking
      }>
    }>
    pagination?: {                  // E6.2.7
      limit: number
      hasMore: boolean
      nextCursor: string | null
    }
  }
  error?: { code: string, message: string }
  requestId: string
}
```

**Response Headers (E6.2.7):**
- `Cache-Control: public, max-age=300, must-revalidate` — Cache for 5 minutes
- `ETag: "funnels:v1:timestamp"` — Entity tag for cache validation
- `Last-Modified: <HTTP-date>` — Last modification timestamp

**Status Codes:**
- `200 OK` — Success (may return empty pillars array if no funnels)
- `304 Not Modified` — Cached content still valid (when using If-None-Match/If-Modified-Since) — **E6.2.7**
- `400 Bad Request` — Invalid cursor parameter — **E6.2.7**
- `401 Unauthorized` — User not authenticated
- `500 Internal Server Error` — Database or registry error

**Caching (E6.2.7):** 
- Client can cache for 5 minutes (Cache-Control: max-age=300)
- Supports conditional requests with ETag and Last-Modified headers
- 304 Not Modified responses when cache is still valid
- See `docs/mobile/CACHING_PAGINATION.md` for full details

**Pagination (E6.2.7):**
- Cursor-based pagination (not offset-based)
- Default page size: 50 items, max: 100 items
- Deterministic sort order: `title ASC, slug ASC`
- See `docs/mobile/CACHING_PAGINATION.md` for full details

**Idempotency:** Safe

**Rate Limit:** 120 requests/minute

**Notes:**
- Only returns `is_active = true` funnels
- Organized by pillar structure from `program_tiers` registry
- `funnel_version_id` enables version tracking for client compatibility
- If `tier` parameter provided, filters using `lib/contracts/programTier`
- **E6.2.7**: Stable sort order guarantees consistent pagination
- **E6.2.7**: ETag/Last-Modified headers enable efficient caching

**Example: First Page**
```http
GET /api/funnels/catalog?limit=20
```

**Example: Next Page**
```http
GET /api/funnels/catalog?limit=20&cursor=eyJ0aXRsZSI6IlN0cmVzcyBBc3Nlc3NtZW50Iiwic2x1ZyI6InN0cmVzcyJ9
```

**Example: Cache Validation**
```http
GET /api/funnels/catalog
If-None-Match: "funnels:v1:2026-01-13T14:24:29.000Z"
```

---

#### `GET /api/funnels/catalog/[slug]`

**Purpose:** Get detailed information for a specific funnel

**Contract Owner:** `app/api/funnels/catalog/[slug]/route.ts`

**Authentication:** Required

**Request Parameters:**
- `slug` (path): Funnel slug (e.g., `stress-assessment`)

**Response:**
```typescript
{
  success: boolean
  data?: {
    id: string
    slug: string
    title: string
    description: string
    estimatedMinutes: number
    pillar: string
    funnel_version_id: string
    stepCount: number
    contentPages?: Array<{
      slug: string
      title: string
      content: object  // ContentBlock[]
    }>
  }
  error?: { code: string, message: string }
  requestId: string
}
```

**Status Codes:**
- `200 OK` — Success
- `401 Unauthorized` — User not authenticated
- `404 Not Found` — Funnel not found or not active
- `500 Internal Server Error` — Database error

**Caching:** Client can cache for 5 minutes

**Idempotency:** Safe

**Rate Limit:** 120 requests/minute

**Notes:**
- Returns detailed funnel metadata
- May include associated content pages (intro/outro)
- Canonical slug resolution via `FUNNEL_SLUG_ALIASES`

---

### 3. Assessment Lifecycle

#### `POST /api/funnels/[slug]/assessments`

**Purpose:** Start a new assessment session

**Contract Owner:** `app/api/funnels/[slug]/assessments/route.ts`

**Authentication:** Required (patient role recommended)

**Request Parameters:**
- `slug` (path): Funnel slug

**Request Body:** None

**Response:**
```typescript
{
  success: boolean
  data?: {
    assessmentId: string      // UUID of new assessment
    status: 'in_progress'
    currentStep: {
      stepId: string
      title: string
      type: string            // 'question' | 'content' | etc.
      stepIndex: number
      orderIndex: number
      questions?: Array<{
        id: string
        key: string
        label: string
        type: string
        options?: any
        is_required: boolean
      }>
    }
  }
  error?: { code: string, message: string }
}
```

**Status Codes:**
- `200 OK` — Assessment created successfully
- `400 Bad Request` — Invalid funnel slug
- `401 Unauthorized` — User not authenticated
- `404 Not Found` — Funnel not found or not active
- `500 Internal Server Error` — Database error

**Caching:** Not cacheable

**Idempotency:** **NOT idempotent** (creates new assessment each call)

**Rate Limit:** 30 requests/minute

**Notes:**
- Creates new row in `assessments` table
- Sets `status = 'in_progress'` and `started_at = now()`
- Returns first step information from funnel definition
- Tracks KPI via `trackAssessmentStarted()`
- User must have completed onboarding first

---

#### `GET /api/funnels/[slug]/assessments/[assessmentId]`

**Purpose:** Get current assessment status and current step

**Contract Owner:** `app/api/funnels/[slug]/assessments/[assessmentId]/route.ts`

**Authentication:** Required (must be assessment owner)

**Request Parameters:**
- `slug` (path): Funnel slug
- `assessmentId` (path): Assessment UUID

**Response:**
```typescript
{
  success: boolean
  data?: {
    assessmentId: string
    status: 'in_progress' | 'completed'
    currentStep: {
      stepId: string
      title: string
      type: string
      stepIndex: number
      orderIndex: number
      questions?: Array<{...}>
    }
    completedSteps: number
    totalSteps: number
  }
  error?: { code: string, message: string }
}
```

**Status Codes:**
- `200 OK` — Success
- `401 Unauthorized` — User not authenticated
- `403 Forbidden` — Assessment does not belong to user
- `404 Not Found` — Assessment not found
- `500 Internal Server Error` — Database error

**Caching:** Not cacheable (dynamic state)

**Idempotency:** Safe (read-only)

**Rate Limit:** 120 requests/minute

**Notes:**
- Used to resume in-progress assessments
- `currentStep` calculated via `getCurrentStep()` from `lib/navigation/assessmentNavigation`
- Enforces ownership via RLS and explicit patient_id check
- Critical for mobile app state restoration after app restart

---

#### `GET /api/assessments/[id]/resume`

**Purpose:** Resume an in-progress assessment (returns current step)

**Contract Owner:** `app/api/assessments/[id]/resume/route.ts`

**Authentication:** Required (must be assessment owner)

**Request Parameters:**
- `id` (path): Assessment UUID

**Response:**
```typescript
{
  success: boolean
  data?: {
    assessmentId: string
    funnel: string          // Funnel slug
    status: string
    currentStep: {
      stepId: string
      title: string
      type: string
      orderIndex: number
      questions?: Array<{...}>
    }
    completedSteps: number
  }
  error?: { code: string, message: string }
}
```

**Status Codes:**
- `200 OK` — Success
- `401 Unauthorized` — User not authenticated
- `403 Forbidden` — Assessment does not belong to user
- `404 Not Found` — Assessment not found
- `500 Internal Server Error` — Database error

**Caching:** Not cacheable

**Idempotency:** Safe

**Rate Limit:** 60 requests/minute

**Notes:**
- Alternative to funnel-scoped GET endpoint
- Automatically redirects completed assessments to result view
- Useful when user only has assessment ID (not funnel slug)

---

#### `POST /api/funnels/[slug]/assessments/[assessmentId]/complete`

**Purpose:** Mark assessment as completed (with full validation)

**Contract Owner:** `app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts`

**Authentication:** Required (must be assessment owner)

**Request Parameters:**
- `slug` (path): Funnel slug
- `assessmentId` (path): Assessment UUID

**Request Body:** None

**Response (Success):**
```typescript
{
  success: true
  data: {
    assessmentId: string
    status: 'completed'
  }
}
```

**Response (Validation Failed):**
```typescript
{
  success: false
  error: {
    code: 'VALIDATION_FAILED'
    message: 'Nicht alle Pflichtfragen wurden beantwortet.'
    details: {
      missingQuestions: Array<{
        questionId: string
        questionKey: string
        questionLabel: string
        orderIndex: number
      }>
    }
  }
}
```

**Status Codes:**
- `200 OK` — Assessment completed successfully
- `400 Bad Request` — Validation failed (missing required answers)
- `401 Unauthorized` — User not authenticated
- `403 Forbidden` — Assessment does not belong to user
- `404 Not Found` — Assessment not found
- `409 Conflict` — Assessment already completed
- `500 Internal Server Error` — Database error

**Caching:** Not cacheable

**Idempotency:** **NOT strictly idempotent** (updates timestamp), but safe to retry

**Rate Limit:** 20 requests/minute

**Notes:**
- Validates all required questions using `validateAllRequiredQuestions()`
- Sets `completed_at = now()` and `status = 'completed'`
- Tracks KPI via `trackAssessmentCompleted()`
- Once completed, assessment becomes read-only
- Returns validation errors with specific missing question details

---

### 4. Assessment Step Validation

#### `POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]`

**Purpose:** Validate a single step before navigation (funnel runtime)

**Contract Owner:** `app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts`

**Authentication:** Required (must be assessment owner)

**Request Parameters:**
- `slug` (path): Funnel slug
- `assessmentId` (path): Assessment UUID
- `stepId` (path): Step UUID

**Request Body:** None

**Response (Success):**
```typescript
{
  success: true
  data: {
    valid: true
    nextStep?: {
      stepId: string
      title: string
      type: string
      orderIndex: number
    }
  }
}
```

**Response (Validation Failed):**
```typescript
{
  success: false
  error: {
    code: 'VALIDATION_FAILED'
    message: string
    details?: {
      missingQuestions: Array<{...}>
    }
  }
}
```

**Status Codes:**
- `200 OK` — Validation result (check `data.valid`)
- `401 Unauthorized` — User not authenticated
- `403 Forbidden` — Assessment does not belong to user
- `404 Not Found` — Assessment or step not found
- `409 Conflict` — Assessment already completed
- `500 Internal Server Error` — Database error

**Caching:** Not cacheable

**Idempotency:** **NOT idempotent** (may update step state)

**Rate Limit:** 60 requests/minute

**Notes:**
- Part of Funnel Runtime system (Epic B)
- Validates required questions for current step
- Returns next step if validation passes
- Prevents step skipping
- Critical for maintaining assessment integrity

---

### 5. Assessment Answers

#### `POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save`

**Purpose:** Save/update answer for a question (save-on-tap)

**Contract Owner:** `app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts`

**Authentication:** Required (must be assessment owner)

**Request Parameters:**
- `slug` (path): Funnel slug
- `assessmentId` (path): Assessment UUID

**Request Body:**
```typescript
{
  questionId: string      // Question key (e.g., 'stress_frequency')
  answerValue: number     // Integer value
}
```

**Response:**
```typescript
{
  success: boolean
  data?: {
    id: string              // Answer UUID
    assessment_id: string
    question_id: string
    answer_value: number
  }
  error?: { code: string, message: string }
}
```

**Status Codes:**
- `200 OK` — Answer saved successfully
- `400 Bad Request` — Invalid input (missing fields, non-integer value)
- `401 Unauthorized` — User not authenticated
- `403 Forbidden` — Assessment does not belong to user
- `404 Not Found` — Assessment not found
- `409 Conflict` — Assessment already completed (read-only)
- `500 Internal Server Error` — Database error

**Caching:** Not cacheable

**Idempotency:** **YES (upsert)** — Safe to retry, uses ON CONFLICT to update existing answer

**Rate Limit:** 120 requests/minute

**Notes:**
- Uses UPSERT logic (insert or update if exists)
- `questionId` is the question **key** (text), not UUID
- Validates `answerValue` is an integer
- Returns created/updated answer record
- Supports "save on tap" pattern in mobile UI

---

#### `POST /api/assessment-answers/save`

**Purpose:** Legacy save answer endpoint (backwards compatibility)

**Contract Owner:** `app/api/assessment-answers/save/route.ts`

**Authentication:** Required (must be assessment owner)

**Request Body:**
```typescript
{
  assessmentId: string
  questionId: string
  answerValue: number
}
```

**Response:** Same as funnel-scoped save endpoint

**Status Codes:** Same as funnel-scoped save endpoint

**Notes:**
- **Legacy endpoint** — prefer funnel-scoped version for new code
- Kept for backwards compatibility with existing mobile builds
- Identical functionality to `/api/funnels/[slug]/assessments/[assessmentId]/answers/save`

---

### 6. Results & History

#### `GET /api/funnels/[slug]/assessments/[assessmentId]/result`

**Purpose:** Fetch assessment results and generated report

**Contract Owner:** `app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts`

**Authentication:** Required (must be assessment owner)

**Request Parameters:**
- `slug` (path): Funnel slug
- `assessmentId` (path): Assessment UUID

**Response:**
```typescript
{
  success: boolean
  data?: {
    assessment: {
      id: string
      funnel: string
      status: string
      completed_at: string
    }
    report?: {
      id: string
      total_score: number
      risk_level: string
      interpretation: string
      recommendations: Array<{
        title: string
        description: string
      }>
      created_at: string
    }
    answers: Array<{
      question_id: string
      answer_value: number
    }>
  }
  error?: { code: string, message: string }
}
```

**Status Codes:**
- `200 OK` — Success (report may be null if not yet generated)
- `401 Unauthorized` — User not authenticated
- `403 Forbidden` — Assessment does not belong to user
- `404 Not Found` — Assessment not found
- `500 Internal Server Error` — Database error

**Caching:** Client can cache for short duration (1-2 minutes)

**Idempotency:** Safe (read-only)

**Rate Limit:** 60 requests/minute

**Notes:**
- Only returns results for completed assessments
- Report generation may be async (check `report` field)
- Includes all assessment answers for transparency
- Supports funnel slug aliases via `FUNNEL_SLUG_ALIASES`

---

## Authentication Contract

All endpoints marked as **Auth Required: Yes** enforce the following:

1. **Session Validation:**
   - Uses `createServerSupabaseClient()` from `@/lib/db/supabase.server`
   - Calls `supabase.auth.getUser()` to verify session
   - Returns `401 Unauthorized` if no valid session

2. **Ownership Verification:**
   - Endpoints accessing user-specific data (assessments, profiles) verify ownership
   - Compares `patient_id` against authenticated user's patient profile
   - Returns `403 Forbidden` if ownership check fails

3. **Role Checks:**
   - Some endpoints require specific roles (e.g., `clinician`, `admin`)
   - Role stored in `user.app_metadata.role`
   - Patient endpoints typically allow any authenticated user

4. **Session Management:**
   - Mobile app uses cookie-based sessions via `@supabase/ssr`
   - Sessions persist across app restarts
   - Automatic token refresh handled by Supabase client

---

## Error Response Format

All endpoints return standardized error responses:

```typescript
{
  success: false
  error: {
    code: string        // Machine-readable error code
    message: string     // Human-readable error message
    details?: object    // Optional additional context
  }
  requestId?: string    // Trace ID for debugging (when available)
}
```

**Common Error Codes:**

- `AUTH_REQUIRED` — User not authenticated (401)
- `FORBIDDEN` — User lacks permission (403)
- `NOT_FOUND` — Resource not found (404)
- `VALIDATION_FAILED` — Input validation failed (400)
- `CONFLICT` — State conflict (e.g., assessment already completed) (409)
- `INTERNAL_ERROR` — Server error (500)

---

## Rate Limiting

**Current Status:** Rate limits documented above are **recommended targets**, not enforced.

**Future Implementation:**
- Rate limiting will be enforced per-user based on authenticated session
- Limits reset every 60 seconds (sliding window)
- HTTP 429 response when limit exceeded
- `Retry-After` header indicates when to retry

**Mobile Client Guidance:**
- Implement exponential backoff for failed requests
- Cache catalog and profile data locally
- Batch answer saves when possible (single upsert endpoint)
- Don't poll status endpoints — use on-demand fetching only

---

## Caching Guidelines

**Cacheable Endpoints (E6.2.7):**

| Endpoint | Cache Duration | Cache Headers | Cache Key | Details |
|----------|----------------|---------------|-----------|---------|
| `/api/funnels/catalog` | 5 minutes | `Cache-Control`, `ETag`, `Last-Modified` | `catalog:{tier}:{cursor}` | HTTP cache headers, 304 support |
| `/api/funnels/catalog/[slug]` | 5 minutes | TBD | `catalog:${slug}` | Future enhancement |
| `/api/funnels/[slug]/definition` | 10 minutes | TBD | `definition:${slug}` | Future enhancement |
| `/api/patient-measures/history` | 2 minutes | TBD | `history:${userId}` | Future enhancement |
| `/api/patient-profiles` | 5 minutes | TBD | `profiles:${userId}` | Future enhancement |

**Non-Cacheable:**
- All endpoints with dynamic state (assessment status, current step)
- All POST/PUT/DELETE endpoints
- Onboarding status (must be fresh for each check)

**Client Implementation (E6.2.7):**
- Use HTTP cache headers (`Cache-Control`, `ETag`, `Last-Modified`)
- URLCache automatically handles 304 Not Modified responses
- Send `If-None-Match` header for ETag validation
- Send `If-Modified-Since` header for timestamp validation
- Clear cache on user logout
- Respect `no-store` directives
- See `docs/mobile/CACHING_PAGINATION.md` for detailed implementation guide

**Example: iOS URLCache Integration**
```swift
// URLSession configuration with cache
let configuration = URLSessionConfiguration.default
configuration.requestCachePolicy = .useProtocolCachePolicy
configuration.urlCache = URLCache.shared

let session = URLSession(configuration: configuration)
```

---

## Pagination Support

**Current Status (E6.2.7):** Pagination implemented for catalog endpoints.

**Supported Endpoints:**

| Endpoint | Pagination Type | Default Limit | Max Limit | Sort Order |
|----------|-----------------|---------------|-----------|------------|
| `/api/funnels/catalog` | Cursor-based | 50 | 100 | `title ASC, slug ASC` |

**Pagination Response Format:**
```typescript
{
  success: true,
  data: {
    items: [...],
    pagination: {
      limit: 50,          // Items per page
      hasMore: boolean,   // More pages available
      nextCursor: string | null  // Opaque cursor for next page
    }
  }
}
```

**Pagination Query Parameters:**
- `limit` (optional): Items per page (default: 50, max: 100)
- `cursor` (optional): Opaque cursor from previous response's `nextCursor`

**Cursor Format:**
- Base64-encoded JSON object: `{ title: string, slug: string }`
- Cursor is opaque to clients — do not parse or construct manually
- Invalid cursor returns `400 Bad Request` with `INVALID_INPUT` error code

**Stable Sort Order (E6.2.7):**
All paginated endpoints guarantee deterministic, stable sort order:
- Same query always returns items in same order
- Pagination cursors remain valid across requests
- No duplicate or skipped items across pages

**Example: Paginated Catalog Fetch**
```swift
func fetchAllFunnels() async throws -> [CatalogFunnel] {
    var allFunnels: [CatalogFunnel] = []
    var cursor: String? = nil
    
    repeat {
        let page = try await fetchCatalogPage(cursor: cursor, limit: 50)
        allFunnels.append(contentsOf: page.funnels)
        cursor = page.pagination.nextCursor
    } while cursor != nil
    
    return allFunnels
}
```

For complete pagination implementation details, see `docs/mobile/CACHING_PAGINATION.md`.

---

## Schema Versioning

**Purpose:** Enable mobile clients to detect API contract changes and handle migrations.

**Versioning Fields:**

| Endpoint | Version Field | Location | Example |
|----------|---------------|----------|---------|
| Funnel Catalog | `funnel_version_id` | `data.pillars[].funnels[].funnel_version_id` | `"fv_uuid_123"` |
| Consent | `consent_version` | Request/response | `"v1.2"` |

**Mobile Client Usage:**

1. **Store expected schema versions** in app config
2. **Compare received `funnel_version_id`** against known versions
3. **Handle version mismatches:**
   - Known version → proceed normally
   - Unknown version → check for app update, optionally warn user
   - Missing version → assume legacy (best-effort compatibility)

**Backend Guarantees:**

- Schema version fields are **stable** (won't be removed)
- Breaking changes will increment version
- Backward-compatible changes may not increment version

---

## Nice to Have (Post v0.7)

These endpoints are **not required** for initial v0.7 release but may be useful:

1. **Consent Management**
   - `POST /api/consent/record` — Record consent acceptance
   - `GET /api/consent/status` — Check consent status
   - *Alternative:* Handle consent in onboarding web view

2. **Legacy Assessment Endpoints**
   - `POST /api/assessment-answers/save` — Legacy save endpoint
   - `POST /api/assessment-validation/validate-step` — Legacy validation
   - *Note:* Prefer funnel-scoped equivalents

3. **Patient History**
   - `GET /api/patient-measures/history` — Historical assessment data
   - `GET /api/patient-measures/export` — Export patient data (JSON/CSV)
   - *Note:* Can be added in v0.7.1 for "view history" feature

4. **Funnel Definition**
   - `GET /api/funnels/[slug]/definition` — Full funnel schema
   - *Note:* Catalog endpoint may be sufficient for most use cases

---

## Contract Ownership Reference

| Route File | Team Owner | Stability | Notes |
|------------|------------|-----------|-------|
| `app/api/patient/onboarding-status/route.ts` | Platform | Stable | Core onboarding contract |
| `app/api/auth/resolve-role/route.ts` | Auth | Stable | Role resolution |
| `app/api/funnels/catalog/route.ts` | Funnel | Stable | Pillar-based catalog |
| `app/api/funnels/catalog/[slug]/route.ts` | Funnel | Stable | Single funnel details |
| `app/api/funnels/[slug]/assessments/route.ts` | Assessment | Stable | Start assessment (B5/B8) |
| `app/api/funnels/[slug]/assessments/[assessmentId]/route.ts` | Assessment | Stable | Get status (B5/B8) |
| `app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts` | Assessment | Beta | Step validation (Epic B) |
| `app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts` | Assessment | Stable | Complete assessment (B5/B8) |
| `app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts` | Assessment | Stable | Save answers (upsert) |
| `app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts` | Assessment | Stable | Fetch results |
| `app/api/assessments/[id]/resume/route.ts` | Assessment | Stable | Resume in-progress |
| `app/api/assessment-answers/save/route.ts` | Assessment | Legacy | Backwards compat only |
| `app/api/consent/record/route.ts` | Onboarding | Stable | Record consent |
| `app/api/consent/status/route.ts` | Onboarding | Stable | Check consent |
| `app/api/patient-profiles/route.ts` | Patient | Stable | List profiles (RLS-scoped) |
| `app/api/patient-measures/history/route.ts` | Patient | Beta | Assessment history |
| `app/api/patient-measures/export/route.ts` | Patient | Beta | Data export |

**Stability Legend:**
- **Stable** — Production-ready, breaking changes will be versioned
- **Beta** — Available but may change in minor releases
- **Legacy** — Maintained for compatibility, prefer alternative endpoints

---

## Breaking Change Policy

**Definition:** A breaking change requires mobile client code updates to maintain functionality.

**Examples of Breaking Changes:**
- Removing an endpoint
- Changing required fields in request/response
- Changing error codes or status codes
- Removing schema version fields

**Process:**
1. Breaking changes must increment schema version
2. Deprecated endpoints remain available for at least one major version
3. Mobile team notified 2 weeks before deprecation
4. Changelog published in release notes

**Migration Support:**
- Parallel endpoints during transition period
- Version detection via schema fields
- Fallback behavior documented

---

## Appendix: Quick Reference

### Must Support Checklist (v0.7)

**Critical Path (Minimum Viable):**

- [ ] `GET /api/patient/onboarding-status` — Check if user ready
- [ ] `GET /api/funnels/catalog` — Discover funnels
- [ ] `POST /api/funnels/[slug]/assessments` — Start assessment
- [ ] `GET /api/funnels/[slug]/assessments/[assessmentId]` — Get status/resume
- [ ] `POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save` — Save answers
- [ ] `POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]` — Validate step
- [ ] `POST /api/funnels/[slug]/assessments/[assessmentId]/complete` — Complete
- [ ] `GET /api/funnels/[slug]/assessments/[assessmentId]/result` — View results

**Extended Features (Nice to Have):**
- [ ] Consent management endpoints
- [ ] Patient history/export
- [ ] Profile management

### Testing Endpoints

**Authentication Test:**
```bash
# Get auth status
curl -H "Cookie: sb-access-token=..." \
  https://api.example.com/api/patient/onboarding-status

# Expected: 200 OK with status data OR 401 Unauthorized
```

**Catalog Test:**
```bash
# List funnels
curl -H "Cookie: sb-access-token=..." \
  https://api.example.com/api/funnels/catalog

# Expected: 200 OK with pillars array
```

**Assessment Flow Test:**
```bash
# 1. Start assessment
curl -X POST -H "Cookie: sb-access-token=..." \
  https://api.example.com/api/funnels/stress-assessment/assessments

# 2. Save answer
curl -X POST -H "Cookie: sb-access-token=..." \
  -H "Content-Type: application/json" \
  -d '{"questionId":"stress_frequency","answerValue":3}' \
  https://api.example.com/api/funnels/stress-assessment/assessments/{id}/answers/save

# 3. Complete assessment
curl -X POST -H "Cookie: sb-access-token=..." \
  https://api.example.com/api/funnels/stress-assessment/assessments/{id}/complete

# 4. Get results
curl -H "Cookie: sb-access-token=..." \
  https://api.example.com/api/funnels/stress-assessment/assessments/{id}/result
```

---

## Document Metadata

**Version:** 1.0.0  
**Last Updated:** 2026-01-12  
**Authors:** Backend API Team  
**Reviewers:** Mobile Team, QA Team  
**Status:** Draft → Review → **Approved**

**Related Documents:**
- `docs/API_ROUTE_OWNERSHIP.md` — Full API route registry
- `docs/EXTERNAL_CLIENTS.md` — External client registry
- `docs/v0.5/ENDPOINT_INVENTORY.md` — Complete endpoint inventory
- `docs/mobile/SHELL_FOUNDATIONS.md` — Mobile architecture
- `lib/contracts/onboarding.ts` — Onboarding contract
- `lib/contracts/registry.ts` — Funnel registry

**Change Log:**
- 2026-01-12: Initial version (v1.0.0) for v0.7 iOS release
