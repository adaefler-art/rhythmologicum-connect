# E6.5.2 Verification Guide

**Issue:** E6.5.2 — Dashboard Data Contract v1 (NextStep + Tiles + Status)  
**Date:** 2026-01-16  
**Status:** ✅ Ready for Verification  

---

## Quick Verification

### 1. Run Tests

```bash
# All dashboard-related tests
npm test -- --testPathPatterns="dashboard"
# Expected: 76/76 tests passing

# Contract tests only
npm test -- lib/api/contracts/patient/__tests__/dashboard.test.ts
# Expected: 40/40 tests passing

# API endpoint tests only
npm test -- app/api/patient/dashboard/__tests__/route.test.ts
# Expected: 17/17 tests passing
```

### 2. Build Verification

```bash
# Full production build
npm run build
# Expected: ✅ Compiled successfully
```

### 3. Endpoint Catalog Check

```bash
# Generate API catalog
npm run api:catalog
# Expected: ✅ Endpoint wiring gate passed

# Verify dashboard endpoint is listed
grep "patient/dashboard" docs/api/ENDPOINT_CATALOG.md
# Expected: | /api/patient/dashboard | GET | patient | 0 | app/api/patient/dashboard/route.ts |
```

### 4. Lint Check

```bash
# Run linter on changed files
npm run lint
# Expected: No errors in new files
```

---

## Acceptance Criteria Verification

### ✅ AC1: Contract as Zod Schema with Runtime Check

**Location:** `lib/api/contracts/patient/dashboard.ts`

**Verify:**
```bash
# Check schema export
grep -A 5 "export const DashboardViewModelV1Schema" lib/api/contracts/patient/dashboard.ts

# Check validation helpers
grep "validateDashboardResponse\|safeValidateDashboardResponse" lib/api/contracts/patient/dashboard.ts

# Run contract tests
npm test -- lib/api/contracts/patient/__tests__/dashboard.test.ts
```

**Expected:**
- ✅ Zod schemas defined with proper types
- ✅ Runtime validation functions present
- ✅ All 40 schema tests passing

### ✅ AC2: Response Envelope + Error Semantics Standardized

**Location:** `app/api/patient/dashboard/route.ts`

**Verify:**
```bash
# Check response structure
grep -A 3 "versionedSuccessResponse" app/api/patient/dashboard/route.ts

# Check API tests for response structure
grep "schemaVersion\|success\|error" app/api/patient/dashboard/__tests__/route.test.ts
```

**Expected Response Format:**
```typescript
{
  success: true,
  data: DashboardViewModelV1,
  schemaVersion: "v1",
  requestId?: string
}
```

**Expected Error Format:**
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

### ✅ AC3: Version Marker Present

**Verify:**
```bash
# Check version constants
grep "DASHBOARD_VERSION\|PATIENT_DASHBOARD_SCHEMA_VERSION" lib/api/contracts/patient/dashboard.ts

# Check meta schema
grep -A 5 "DashboardMetaSchema" lib/api/contracts/patient/dashboard.ts

# Run API test that verifies version
npm test -- app/api/patient/dashboard/__tests__/route.test.ts -t "version marker"
```

**Expected:**
- ✅ `DASHBOARD_VERSION = 1`
- ✅ `PATIENT_DASHBOARD_SCHEMA_VERSION = "v1"`
- ✅ `meta.version` field in response
- ✅ `schemaVersion` field in response envelope
- ✅ `meta.correlationId` field present (E6.4.8)

---

## Manual API Testing

### Prerequisites

```bash
# Start development server
npm run dev

# Obtain authentication token (login as patient user)
# Save the session cookie as $AUTH_COOKIE
```

### Test 1: Authenticated Request (Happy Path)

```bash
# Make authenticated request
curl -s http://localhost:3000/api/patient/dashboard \
  -H "Cookie: $AUTH_COOKIE" | jq .

# Expected output:
# {
#   "success": true,
#   "data": {
#     "onboardingStatus": "not_started",
#     "nextStep": {
#       "type": "onboarding",
#       "target": "/patient/onboarding",
#       "label": "Complete Onboarding"
#     },
#     "funnelSummaries": [],
#     "workupSummary": {
#       "state": "no_data",
#       "counts": {
#         "needsMoreData": 0,
#         "readyForReview": 0,
#         "total": 0
#       }
#     },
#     "contentTiles": [],
#     "meta": {
#       "version": 1,
#       "correlationId": "<uuid>",
#       "generatedAt": "<iso-8601-timestamp>"
#     }
#   },
#   "schemaVersion": "v1",
#   "requestId": "<uuid>"
# }
```

**Validation Checks:**
- ✅ `success` is `true`
- ✅ `schemaVersion` is `"v1"`
- ✅ `data.meta.version` is `1`
- ✅ `data.meta.correlationId` is a valid UUID
- ✅ `data.meta.generatedAt` is an ISO 8601 timestamp
- ✅ `requestId` matches `data.meta.correlationId`
- ✅ All required fields present

### Test 2: Unauthenticated Request (401 Error)

```bash
# Make unauthenticated request
curl -s http://localhost:3000/api/patient/dashboard | jq .

# Expected output:
# {
#   "success": false,
#   "error": {
#     "code": "UNAUTHORIZED",
#     "message": "Authentifizierung fehlgeschlagen. Bitte melden Sie sich an."
#   }
# }
```

**Validation Checks:**
- ✅ `success` is `false`
- ✅ `error.code` is `"UNAUTHORIZED"`
- ✅ HTTP status is `401`
- ✅ No dashboard data in response

### Test 3: Schema Validation (Runtime)

```bash
# Test with TypeScript validation (in browser console or Node REPL)
```

```javascript
import { validateDashboardResponse } from '@/lib/api/contracts/patient/dashboard'

const response = await fetch('/api/patient/dashboard')
const data = await response.json()

// Should not throw
const validated = validateDashboardResponse(data)
console.log('✅ Schema validation passed')
console.log('Dashboard version:', validated.data.meta.version)
console.log('Schema version:', validated.schemaVersion)
```

---

## File Checklist

### New Files Created
- ✅ `lib/api/contracts/patient/dashboard.ts` (330 lines)
- ✅ `lib/api/contracts/patient/__tests__/dashboard.test.ts` (716 lines)
- ✅ `E6_5_2_IMPLEMENTATION_SUMMARY.md` (666 lines)
- ✅ `E6_5_2_VERIFICATION_GUIDE.md` (this file)

### Modified Files
- ✅ `lib/api/contracts/patient/index.ts` (added dashboard export)
- ✅ `app/api/patient/dashboard/route.ts` (updated to use contract)
- ✅ `app/api/patient/dashboard/__tests__/route.test.ts` (updated tests)

### Documentation Files
- ✅ `E6_5_2_IMPLEMENTATION_SUMMARY.md` (comprehensive implementation doc)
- ✅ `docs/api/ENDPOINT_CATALOG.md` (auto-generated, includes dashboard endpoint)

---

## Integration Verification

### E6.4.1: 401-First Auth Ordering

**Verify:**
```bash
# Run auth-first tests
npm test -- app/api/patient/dashboard/__tests__/route.test.ts -t "401-first"
```

**Expected:**
- ✅ Unauthenticated requests return 401
- ✅ Auth check happens before any business logic
- ✅ No database queries before auth verification

### E6.4.8: Telemetry Correlation IDs

**Verify:**
```bash
# Check correlation ID presence in tests
npm test -- app/api/patient/dashboard/__tests__/route.test.ts -t "correlationId"
```

**Expected:**
- ✅ `meta.correlationId` is a valid UUID
- ✅ `requestId` field present
- ✅ Correlation ID unique per request

### E6.2.3: Versioned Patient Endpoints

**Verify:**
```bash
# Check schema version in response
npm test -- app/api/patient/dashboard/__tests__/route.test.ts -t "schemaVersion"
```

**Expected:**
- ✅ `schemaVersion` field is `"v1"`
- ✅ Uses `versionedSuccessResponse()` helper
- ✅ Follows same pattern as assessment contracts

---

## Performance Verification

### Response Time

```bash
# Measure response time (10 requests)
for i in {1..10}; do
  curl -s -w "Time: %{time_total}s\n" \
    -o /dev/null \
    -H "Cookie: $AUTH_COOKIE" \
    http://localhost:3000/api/patient/dashboard
done

# Expected: < 100ms per request (empty state)
```

### Memory Usage

```bash
# Run load test (if needed)
# Expected: No memory leaks, stable memory usage
```

---

## Security Verification

### Authentication Required

```bash
# Without auth → 401
curl -s http://localhost:3000/api/patient/dashboard | jq '.error.code'
# Expected: "UNAUTHORIZED"
```

### Patient Scope Enforcement

**Verify:**
- ✅ Only patient's own data returned
- ✅ No cross-patient data leakage
- ✅ RLS policies enforced (when data queries added)

### No Sensitive Data in Meta

**Verify:**
- ✅ `correlationId` is non-sensitive UUID
- ✅ `generatedAt` timestamp has no timezone PII
- ✅ `version` is just a number

---

## Mobile Integration Readiness

### iOS Client Test

```swift
// Sample iOS integration test
struct DashboardResponse: Codable {
    let success: Bool
    let data: DashboardViewModel
    let schemaVersion: String
    let requestId: String?
}

// Decode response
let decoder = JSONDecoder()
let response = try decoder.decode(DashboardResponse.self, from: data)

// Verify version
assert(response.schemaVersion == "v1")
assert(response.data.meta.version == 1)

// Use dashboard data
renderDashboard(response.data)
```

**Expected:**
- ✅ Response decodes successfully
- ✅ All fields accessible
- ✅ Version markers present
- ✅ No runtime errors

---

## Checklist for Issue Completion

- [x] **AC1:** Contract as Zod schema ✅
- [x] **AC2:** Response envelope standardized ✅
- [x] **AC3:** Version marker present ✅
- [x] All tests passing (76/76) ✅
- [x] Build succeeds ✅
- [x] Endpoint in catalog ✅
- [x] No lint errors ✅
- [x] Documentation complete ✅
- [x] Integration verified ✅
- [x] Security reviewed ✅

---

## Next Steps

### For UI Team

1. **Import contract types:**
   ```typescript
   import { DashboardViewModelV1 } from '@/lib/api/contracts/patient/dashboard'
   ```

2. **Fetch dashboard data:**
   ```typescript
   const response = await fetch('/api/patient/dashboard')
   const { data } = await response.json()
   // data is type-safe DashboardViewModelV1
   ```

3. **Render components:**
   - Use `data.nextStep` for CTA button
   - Map `data.funnelSummaries` to funnel cards
   - Display `data.workupSummary` in status widget
   - Render `data.contentTiles` as info cards

### For Backend Team

1. **Populate real data:**
   - Query `patient_profiles.onboarding_status`
   - Fetch `funnels_catalog` with assessment progress
   - Aggregate `assessments.workup_status` for summary
   - Load active `content_tiles` from CMS

2. **Add caching:**
   - Cache dashboard data for 5-10 minutes
   - Invalidate on profile/assessment updates

3. **Monitor performance:**
   - Track response times via correlation IDs
   - Optimize database queries as needed

### For Mobile Team

1. **Implement Swift/Kotlin models:**
   - Match TypeScript types
   - Handle optional fields properly

2. **Add schema version check:**
   - Verify `schemaVersion == "v1"`
   - Handle version mismatches gracefully

3. **Test integration:**
   - Verify all fields decode correctly
   - Test error handling
   - Validate empty state rendering

---

## Support

**Questions or Issues?**
- Check `E6_5_2_IMPLEMENTATION_SUMMARY.md` for detailed docs
- Review contract tests for usage examples
- Test endpoint manually with curl examples above

**Related Documentation:**
- E6.4.1: Patient Dashboard API (401-first)
- E6.4.8: Telemetry & Correlation IDs
- E6.2.3: Versioned Patient Contracts
- E6.5.1: Dashboard-First Policy
