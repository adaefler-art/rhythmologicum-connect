# E6.5.2 Implementation Summary

**Issue:** E6.5.2 — Dashboard Data Contract v1 (NextStep + Tiles + Status)  
**Date:** 2026-01-16  
**Status:** ✅ Complete  

---

## Objective

Define a stable, versioned data model for the patient dashboard to ensure UI consistency and reliable mobile integration. Without a standardized contract, the dashboard would be prone to inconsistent responses and breaking changes that impact both web and mobile clients.

---

## Problem Statement

The dashboard needs a stable, versionized data model to prevent:
- Inconsistent UI rendering due to schema drift
- Breaking changes that affect mobile integration
- Lack of type safety and runtime validation
- Difficulty tracking API evolution over time

---

## Solution Design

### Dashboard View Model V1

Implemented a comprehensive data contract with the following structure:

```typescript
DashboardViewModelV1 {
  onboardingStatus: "not_started" | "in_progress" | "completed"
  nextStep: {
    type: "onboarding" | "funnel" | "result" | "content" | "none"
    target: string | null
    label: string
  }
  funnelSummaries: Array<{
    slug: string
    title: string
    description: string | null
    status: "not_started" | "in_progress" | "completed"
    lastAssessmentId: string | null
    completedAt: string | null
    progress: { current: number, total: number } | null
  }>
  workupSummary: {
    state: "no_data" | "needs_more_data" | "ready_for_review"
    counts: {
      needsMoreData: number
      readyForReview: number
      total: number
    }
  }
  contentTiles: Array<{
    id: string
    type: "info" | "action" | "promotion"
    title: string
    description: string | null
    actionLabel: string | null
    actionTarget: string | null
    priority: number
  }>
  meta: {
    version: 1
    correlationId: string (UUID)
    generatedAt: string (ISO 8601)
  }
}
```

### Response Envelope

Following E6.2.3 pattern for versioned patient-facing endpoints:

```typescript
{
  success: true,
  data: DashboardViewModelV1,
  schemaVersion: "v1",
  requestId?: string
}
```

### Error Response

Standardized error format:

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: Record<string, unknown>
  },
  schemaVersion: "v1",
  requestId?: string
}
```

---

## Implementation

### 1. Dashboard Contract Definition

**File:** `lib/api/contracts/patient/dashboard.ts`

**Key Features:**
- ✅ Zod schemas for runtime validation (E6.5.2 AC1)
- ✅ TypeScript types for compile-time safety
- ✅ Version marker: `DASHBOARD_VERSION = 1` (E6.5.2 AC3)
- ✅ Schema version: `PATIENT_DASHBOARD_SCHEMA_VERSION = "v1"`
- ✅ Helper functions for validation
- ✅ `createEmptyDashboardViewModel()` for MVP/default state

**Schema Exports:**
- `OnboardingStatusSchema`
- `NextStepSchema`
- `FunnelSummarySchema`
- `WorkupSummarySchema`
- `ContentTileSchema`
- `DashboardMetaSchema`
- `DashboardViewModelV1Schema`
- `DashboardResponseSchema`
- `DashboardErrorSchema`

**Helper Functions:**
- `validateDashboardResponse(data)` - Throws on invalid data
- `safeValidateDashboardResponse(data)` - Returns null on invalid data
- `validateDashboardViewModel(data)` - Validates view model
- `safeValidateDashboardViewModel(data)` - Safe validation
- `createEmptyDashboardViewModel(correlationId)` - Creates default state

### 2. Updated Dashboard API Endpoint

**File:** `app/api/patient/dashboard/route.ts`

**Changes:**
- ✅ Returns `DashboardViewModelV1` schema
- ✅ Uses `versionedSuccessResponse()` for E6.2.3 compatibility
- ✅ Includes correlation ID for E6.4.8 telemetry alignment
- ✅ Maintains E6.4.1 401-first auth ordering
- ✅ MVP implementation returns empty state via `createEmptyDashboardViewModel()`

**Response Structure:**
```typescript
{
  success: true,
  data: {
    onboardingStatus: "not_started",
    nextStep: {
      type: "onboarding",
      target: "/patient/onboarding",
      label: "Complete Onboarding"
    },
    funnelSummaries: [],
    workupSummary: {
      state: "no_data",
      counts: {
        needsMoreData: 0,
        readyForReview: 0,
        total: 0
      }
    },
    contentTiles: [],
    meta: {
      version: 1,
      correlationId: "uuid-here",
      generatedAt: "2026-01-16T05:39:19Z"
    }
  },
  schemaVersion: "v1",
  requestId: "uuid-here"
}
```

### 3. Comprehensive Test Suite

**Contract Tests:** `lib/api/contracts/patient/__tests__/dashboard.test.ts`

**Coverage:** 40 tests, all passing ✅

Test categories:
- ✅ Schema version and constants validation
- ✅ OnboardingStatusSchema validation
- ✅ NextStepSchema validation (with null target)
- ✅ FunnelSummarySchema validation (complete + minimal states)
- ✅ WorkupSummarySchema validation (empty states tested)
- ✅ ContentTileSchema validation (default priority)
- ✅ DashboardMetaSchema validation (version enforcement)
- ✅ DashboardViewModelV1Schema validation (happy path + empty state)
- ✅ DashboardResponseSchema validation (with/without requestId)
- ✅ DashboardErrorSchema validation (with/without details)
- ✅ Helper function validation (parse and safe parse)
- ✅ `createEmptyDashboardViewModel()` validation

**API Endpoint Tests:** `app/api/patient/dashboard/__tests__/route.test.ts`

**Coverage:** 17 tests, all passing ✅

Test categories:
- ✅ E6.4.1 AC1: 401-first auth ordering
- ✅ E6.5.2 AC1: Schema validation at runtime
- ✅ E6.5.2 AC2: Response envelope structure
- ✅ E6.5.2 AC3: Version marker presence
- ✅ E6.4.8: Correlation ID alignment
- ✅ All required dashboard fields present
- ✅ Empty state implementation
- ✅ nextStep object structure
- ✅ funnelSummaries array structure
- ✅ workupSummary object structure
- ✅ contentTiles array structure

### 4. Contract Export

**File:** `lib/api/contracts/patient/index.ts`

Updated to export dashboard contracts alongside assessment contracts:

```typescript
export * from './assessments'
export * from './dashboard'
```

---

## Acceptance Criteria

### ✅ AC1: Contract as Zod Schema with Runtime Check

**Implementation:**
- Zod schemas defined in `lib/api/contracts/patient/dashboard.ts`
- Runtime validation via `DashboardResponseSchema.parse()`
- Helper functions: `validateDashboardResponse()` and `safeValidateDashboardResponse()`
- Type safety: TypeScript types generated from Zod schemas

**Verification:**
```bash
npm test -- lib/api/contracts/patient/__tests__/dashboard.test.ts
# Result: 40/40 tests passing
```

### ✅ AC2: Response Envelope + Error Semantics Standardized

**Implementation:**
- Response envelope follows E6.2.3 pattern: `{ success, data, schemaVersion, requestId? }`
- Error response: `{ success: false, error: { code, message, details? }, schemaVersion, requestId? }`
- Uses existing `versionedSuccessResponse()` from `lib/api/responses.ts`
- Consistent with existing patient-facing endpoints

**Verification:**
```bash
# Dashboard endpoint returns standardized response
curl http://localhost:3000/api/patient/dashboard \
  -H "Cookie: sb-auth-token=..." | jq .

# Expected structure:
# {
#   "success": true,
#   "data": { ... },
#   "schemaVersion": "v1",
#   "requestId": "uuid"
# }
```

### ✅ AC3: Version Marker Present

**Implementation:**
- Dashboard version marker: `DASHBOARD_VERSION = 1`
- Included in `meta.version` field
- Schema version: `PATIENT_DASHBOARD_SCHEMA_VERSION = "v1"`
- Included in response envelope as `schemaVersion`
- Correlation ID included in `meta.correlationId` (E6.4.8 alignment)

**Verification:**
```typescript
// In response:
{
  data: {
    meta: {
      version: 1,              // E6.5.2 AC3
      correlationId: "uuid",   // E6.4.8
      generatedAt: "ISO-8601"
    }
  },
  schemaVersion: "v1"          // E6.5.2 AC3
}
```

---

## Testing

### Unit Tests

**Contract Schema Tests:**
```bash
npm test -- lib/api/contracts/patient/__tests__/dashboard.test.ts
# ✅ 40/40 tests passing
```

**API Endpoint Tests:**
```bash
npm test -- app/api/patient/dashboard/__tests__/route.test.ts
# ✅ 17/17 tests passing
```

**All Patient Contract Tests:**
```bash
npm test -- lib/api/contracts/patient/__tests__/
# ✅ All tests passing (dashboard + assessments)
```

### Build Verification

```bash
npm run build
# ✅ Build successful
# ✅ TypeScript compilation passed
# ✅ No type errors
```

### Linting

```bash
npm run lint
# ✅ No errors in new files
```

### Endpoint Catalog Verification

```bash
npm run api:catalog
# ✅ Endpoint wiring gate passed
# ✅ /api/patient/dashboard listed in catalog
```

**Catalog Entry:**
```
| /api/patient/dashboard | GET | patient | 0 | app/api/patient/dashboard/route.ts |
```

---

## Files Changed

### New Files
- `lib/api/contracts/patient/dashboard.ts` - Dashboard contract definition (330 lines)
- `lib/api/contracts/patient/__tests__/dashboard.test.ts` - Contract tests (716 lines)
- `E6_5_2_IMPLEMENTATION_SUMMARY.md` - This document

### Modified Files
- `lib/api/contracts/patient/index.ts` - Added dashboard export
- `app/api/patient/dashboard/route.ts` - Updated to use contract
- `app/api/patient/dashboard/__tests__/route.test.ts` - Updated tests for contract

---

## Integration Points

### E6.4.1: 401-First Auth Ordering
- ✅ Dashboard endpoint maintains 401-first pattern
- ✅ Auth check before any business logic
- ✅ No database queries before auth verification

### E6.4.8: Telemetry Correlation IDs
- ✅ Correlation ID generated for each request
- ✅ Included in `meta.correlationId` field
- ✅ Included in `requestId` field
- ✅ Added to response headers (`x-correlation-id`)

### E6.2.3: Versioned Patient Endpoints
- ✅ Follows same pattern as assessment contracts
- ✅ Uses `versionedSuccessResponse()` helper
- ✅ Includes `schemaVersion` in response
- ✅ Compatible with iOS mobile client expectations

### E6.5.1: Dashboard-First Policy
- ✅ Dashboard endpoint accessible via `/api/patient/dashboard`
- ✅ Returns structured data for UI rendering
- ✅ Empty state provided as MVP implementation
- ✅ Ready for UI consumption

---

## MVP Implementation Notes

### Current State: Empty Dashboard

The current implementation returns an empty dashboard state via `createEmptyDashboardViewModel()`:

- **onboardingStatus:** `"not_started"`
- **nextStep:** Points to `/patient/onboarding`
- **funnelSummaries:** Empty array `[]`
- **workupSummary:** `no_data` state with zero counts
- **contentTiles:** Empty array `[]`

### Future Enhancements

To populate with real data, the endpoint will need to:

1. **Query onboarding status:**
   ```sql
   SELECT onboarding_status FROM patient_profiles WHERE user_id = ?
   ```

2. **Query funnel summaries:**
   ```sql
   SELECT f.slug, f.title, f.description, a.status, a.id as lastAssessmentId
   FROM funnels_catalog f
   LEFT JOIN assessments a ON a.funnel_id = f.id AND a.patient_id = ?
   ORDER BY a.created_at DESC
   ```

3. **Query workup summary:**
   ```sql
   SELECT workup_status, COUNT(*) as count
   FROM assessments
   WHERE patient_id = ? AND status = 'completed'
   GROUP BY workup_status
   ```

4. **Query content tiles:**
   ```sql
   SELECT id, type, title, description, action_label, action_target, priority
   FROM content_tiles
   WHERE active = true AND audience = 'patient'
   ORDER BY priority DESC
   ```

5. **Determine next step:**
   - If onboarding incomplete → `{ type: "onboarding", ... }`
   - If in-progress assessment exists → `{ type: "funnel", ... }`
   - If result available → `{ type: "result", ... }`
   - Else → `{ type: "none", ... }`

---

## Schema Evolution

### Version 1 (Current)

- Initial dashboard contract
- MVP empty state implementation
- All fields documented and validated

### Future Versions

When breaking changes are needed:

1. Increment `DASHBOARD_VERSION` (e.g., to `2`)
2. Update `PATIENT_DASHBOARD_SCHEMA_VERSION` (e.g., to `"v2"`)
3. Create new schemas (e.g., `DashboardViewModelV2Schema`)
4. Maintain backward compatibility or provide migration path
5. Update tests to cover new version
6. Document changes in migration guide

**Non-Breaking Changes:**
- Adding optional fields: No version bump needed
- Extending enums: May require version bump
- Removing fields: Always requires version bump

---

## Mobile Integration

### iOS Client Consumption

The dashboard endpoint is ready for iOS consumption:

```swift
struct DashboardResponse: Codable {
    let success: Bool
    let data: DashboardViewModel
    let schemaVersion: String
    let requestId: String?
}

struct DashboardViewModel: Codable {
    let onboardingStatus: String
    let nextStep: NextStep
    let funnelSummaries: [FunnelSummary]
    let workupSummary: WorkupSummary
    let contentTiles: [ContentTile]
    let meta: DashboardMeta
}

// Usage:
let response = try JSONDecoder().decode(
    DashboardResponse.self, 
    from: data
)

if response.schemaVersion == "v1" {
    // Process dashboard data
    renderDashboard(response.data)
}
```

### Version Checking

Mobile clients should:
1. Check `schemaVersion` field
2. Validate against expected version (`"v1"`)
3. Gracefully handle version mismatches
4. Use `meta.version` for dashboard-specific versioning

---

## Performance Considerations

### Current Implementation

- **Minimal overhead:** Returns static empty state
- **No database queries:** MVP implementation
- **Fast response time:** <10ms typical

### Production Implementation

When populated with real data:
- Use database indexes on `patient_id`, `status`, `funnel_id`
- Consider caching dashboard data (5-10 minute TTL)
- Use pagination for large `funnelSummaries` arrays
- Optimize workup summary query with materialized view
- Pre-fetch common content tiles at app startup

---

## Security Considerations

### Authentication & Authorization

- ✅ 401-first auth ordering enforced
- ✅ Patient-scoped data only
- ✅ No cross-patient data leakage
- ✅ Server-side validation only

### Data Minimization

- ✅ Only essential fields included
- ✅ No PHI in meta fields
- ✅ Correlation IDs are UUIDs (non-sensitive)
- ✅ Timestamps are ISO 8601 (no timezone PII)

### CORS & CSP

- Dashboard endpoint follows existing CORS policy
- Same-origin requests only
- No external API calls from dashboard data

---

## Related Issues

- **E6.4.1:** Patient Dashboard API (401-first auth)
- **E6.4.8:** Data Export + Telemetry (correlation IDs)
- **E6.2.3:** Versioned Patient Contracts (assessment pattern)
- **E6.5.1:** Dashboard-First Policy (route protection)

---

## Lessons Learned

1. **Zod for Contract Definition:**
   - Runtime validation catches schema violations
   - TypeScript types generated automatically
   - Excellent error messages for debugging
   - Safe parsing prevents runtime crashes

2. **Empty State First:**
   - Implement contract before data population
   - Allows UI development in parallel
   - Tests validate schema structure early
   - Reduces integration risk

3. **Version Markers:**
   - Two-level versioning (schema + dashboard)
   - `schemaVersion` for API contract evolution
   - `meta.version` for dashboard-specific changes
   - Clear migration path for breaking changes

4. **E6.4.8 Alignment:**
   - Correlation IDs enable request tracing
   - Consistent with telemetry infrastructure
   - Supports observability and debugging

---

## Verification Steps

### 1. Contract Validation

```bash
# Run contract tests
npm test -- lib/api/contracts/patient/__tests__/dashboard.test.ts

# Expected: 40/40 tests passing
```

### 2. API Endpoint Validation

```bash
# Run endpoint tests
npm test -- app/api/patient/dashboard/__tests__/route.test.ts

# Expected: 17/17 tests passing
```

### 3. Build Verification

```bash
# Build project
npm run build

# Expected: ✅ Compiled successfully
```

### 4. Endpoint Catalog Check

```bash
# Generate catalog
npm run api:catalog

# Verify entry exists:
grep "patient/dashboard" docs/api/ENDPOINT_CATALOG.md
```

### 5. Manual API Test

```bash
# Start dev server
npm run dev

# Test endpoint (requires auth)
curl http://localhost:3000/api/patient/dashboard \
  -H "Cookie: sb-auth-token=<token>" | jq .

# Expected: DashboardViewModelV1 with schemaVersion "v1"
```

---

## Conclusion

Dashboard Data Contract V1 successfully implemented with:

- ✅ **AC1:** Zod schema with runtime validation
- ✅ **AC2:** Standardized response envelope and error semantics
- ✅ **AC3:** Version marker in `meta.version` and `schemaVersion`
- ✅ 57 tests passing (40 contract + 17 endpoint)
- ✅ Build successful
- ✅ Endpoint in catalog
- ✅ E6.4.8 correlation ID alignment
- ✅ E6.4.1 401-first auth preserved
- ✅ E6.2.3 versioning pattern followed
- ✅ Ready for UI and mobile integration

**Next Steps:**
1. Implement UI components consuming the contract
2. Populate dashboard with real data from database
3. Add caching layer for production performance
4. Integrate with mobile client (iOS/Android)
5. Monitor telemetry via correlation IDs
