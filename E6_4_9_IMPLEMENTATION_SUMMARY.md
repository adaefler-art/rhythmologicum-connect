# E6.4.9 Implementation Summary

**Issue:** E6.4.9 — Pilot Telemetry/KPIs (Minimal) + "Unused Endpoints" Gate Alignment  
**Date:** 2026-01-15  
**Status:** ✅ Core Implementation Complete  
**Branch:** `copilot/add-pilot-kpis-endpoint-tracking`

---

## Objective

Implement minimal KPIs and endpoint governance for pilot operations to enable:
1. **Pilot Observability**: Admins can view usage metrics for pilot-relevant routes
2. **Endpoint Gate Alignment**: Prevent pilot-critical endpoints from being marked as "unused"
3. **Non-zero Validation**: Define which routes must show activity during pilot

---

## Deliverables

### 1. Pilot KPIs Endpoint ✅

**File:** `app/api/admin/pilot/kpis/route.ts`

**Endpoint:** `GET /api/admin/pilot/kpis`

**Purpose:** Aggregates pilot-relevant metrics from multiple sources:
- Funnel starts/completes (from `pilot_flow_events`)
- Review decisions (from `review_records`)
- Support case volume (from `support_cases`)
- Workup metrics (from `pilot_flow_events`)

**Query Parameters:**
- `since` (optional): ISO timestamp - filter events after this date
- `until` (optional): ISO timestamp - filter events before this date

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "funnelMetrics": {
        "totalStarts": 100,
        "totalCompletes": 75,
        "completionRate": 75,
        "byFunnelSlug": {
          "stress": {
            "starts": 100,
            "completes": 75,
            "completionRate": 75
          }
        }
      },
      "reviewMetrics": {
        "totalReviews": 20,
        "approved": 15,
        "rejected": 3,
        "changesRequested": 2,
        "pending": 0
      },
      "supportCaseMetrics": {
        "totalCases": 5,
        "open": 2,
        "inProgress": 1,
        "resolved": 2,
        "closed": 0,
        "escalated": 1
      },
      "workupMetrics": {
        "totalWorkups": 50,
        "needsMoreData": 10,
        "readyForReview": 40
      }
    },
    "generatedAt": "2026-01-15T12:00:00.000Z",
    "filters": {
      "since": "2026-01-01T00:00:00.000Z",
      "until": "2026-01-15T23:59:59.000Z"
    }
  },
  "requestId": "correlation-id-here"
}
```

**Authorization:**
- **Admin**: Full access
- **Clinician**: Full access
- **Patient**: No access (403 Forbidden)
- **Unauthenticated**: No access (401 Unauthorized)

**Data Sources:**
1. **Funnel Metrics**: `pilot_flow_events` table
   - Event types: `FUNNEL_STARTED`, `FUNNEL_COMPLETED`
   - Groups by `payload_json.funnelSlug`
   - Calculates completion rate per funnel
2. **Review Metrics**: `review_records` table
   - Counts by status: `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`
3. **Support Case Metrics**: `support_cases` table
   - Counts by status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
   - Counts escalated cases (where `escalated_task_id IS NOT NULL`)
4. **Workup Metrics**: `pilot_flow_events` table
   - Event types: `WORKUP_STARTED`, `WORKUP_NEEDS_MORE_DATA`, `WORKUP_READY_FOR_REVIEW`

---

### 2. Pilot-Critical Endpoints Documentation ✅

**File:** `docs/pilot/CRITICAL_ENDPOINTS.md`

**Purpose:** Defines which endpoints **must** show non-zero usage during pilot.

**Sections:**
1. **Definition Criteria**: What makes an endpoint "pilot-critical"
2. **Pilot-Critical Endpoints**: Categorized list with "Must Be Used" flags
   - Patient Journey (8 endpoints)
   - Clinician Workflow (4 endpoints)
   - Support & Escalation (4 endpoints)
   - Pilot Observability (4 endpoints)
   - Authentication & Profile (3 endpoints)
3. **Non-Critical Endpoints**: May legitimately show zero usage
4. **Validation Rules**: KPI targets for pilot completion
5. **Usage Monitoring**: How to check endpoint usage via APIs
6. **Acceptance Criteria Validation**: How to verify implementation
7. **Troubleshooting**: Common issues and solutions

**KPI Targets:**
- **Funnel Completion Rate**: ≥ 60% (completes / starts)
- **Review Decisions**: ≥ 10 total decisions
- **Support Cases**: ≥ 1 case created

---

### 3. Endpoint Catalog Updates ✅

**Files:**
- `docs/api/ENDPOINT_CATALOG.md`
- `docs/api/endpoint-allowlist.json`

**Changes:**
1. Added `/api/admin/pilot/kpis` to catalog with description
2. Added `/api/admin/pilot/kpis` to allowlist (permitted orphan)
3. Updated comments for `/api/admin/pilot/flow-events` with E6.4.8 reference

**Catalog Entry:**
```markdown
| /api/admin/pilot/kpis | GET | admin | E6.4.9: Pilot KPIs (funnel, review, support case metrics) | 0 | app/api/admin/pilot/kpis/route.ts |
```

**Allowlist Entry:**
```json
{
  "allowedOrphans": [
    ...
    "/api/admin/pilot/kpis",
    ...
  ]
}
```

---

## Implementation Patterns

### Pattern 1: Accessing Pilot KPIs

```bash
# Get all-time pilot KPIs
curl -H "Cookie: sb-localhost-auth-token=YOUR_COOKIE" \
  http://localhost:3000/api/admin/pilot/kpis

# Get pilot KPIs for specific time range
curl -H "Cookie: sb-localhost-auth-token=YOUR_COOKIE" \
  "http://localhost:3000/api/admin/pilot/kpis?since=2026-01-01T00:00:00Z&until=2026-01-15T23:59:59Z"
```

### Pattern 2: Checking Endpoint Usage

```bash
# Get usage telemetry (existing endpoint from TV05_01)
curl -H "Cookie: sb-localhost-auth-token=YOUR_COOKIE" \
  http://localhost:3000/api/admin/usage
```

### Pattern 3: Validating Pilot-Critical Routes

```bash
# Check that funnel starts > 0
curl -H "Cookie: sb-localhost-auth-token=YOUR_COOKIE" \
  http://localhost:3000/api/admin/pilot/kpis | jq '.data.kpis.funnelMetrics.totalStarts'

# Check that review decisions > 0
curl -H "Cookie: sb-localhost-auth-token=YOUR_COOKIE" \
  http://localhost:3000/api/admin/pilot/kpis | jq '.data.kpis.reviewMetrics.totalReviews'

# Check that support cases > 0
curl -H "Cookie: sb-localhost-auth-token=YOUR_COOKIE" \
  http://localhost:3000/api/admin/pilot/kpis | jq '.data.kpis.supportCaseMetrics.totalCases'
```

---

## Integration with Existing Systems

### Leverages Existing Infrastructure

1. **E6.4.8 Telemetry**: Uses `pilot_flow_events` table for funnel/workup metrics
2. **TV05_01 Usage Tracking**: Complements existing `/api/admin/usage` endpoint
3. **V05-I05.7 Review System**: Queries `review_records` table
4. **V05-I08.4 Support Cases**: Queries `support_cases` table

### Alignment with Endpoint Governance

1. **Deterministic Catalog**: New endpoint added to `ENDPOINT_CATALOG.md`
2. **Allowlist Synchronization**: Added to `endpoint-allowlist.json`
3. **Pilot-Critical Marking**: Documented in `CRITICAL_ENDPOINTS.md`

---

## Acceptance Criteria

### ✅ AC1: Admin Can See Usage for Pilot-Relevant Routes

**Verification:**
```bash
# Access pilot KPIs
curl -H "Cookie: $ADMIN_COOKIE" http://localhost:3000/api/admin/pilot/kpis
# Should return 200 with funnel, review, support case, and workup metrics

# Access usage telemetry
curl -H "Cookie: $ADMIN_COOKIE" http://localhost:3000/api/admin/usage
# Should return 200 with route-level usage metrics
```

**Result:** ✅ Implemented
- `/api/admin/pilot/kpis` endpoint created
- Returns aggregated KPIs from 4 data sources
- Admin/clinician authorization enforced

### ✅ AC2: Doc Section Defines Pilot-Critical Routes

**Verification:**
```bash
# Check documentation exists
cat docs/pilot/CRITICAL_ENDPOINTS.md | grep "Must Be Used During Pilot"
# Should list 15+ pilot-critical endpoints

# Check KPI targets defined
cat docs/pilot/CRITICAL_ENDPOINTS.md | grep "Target:"
# Should define funnel completion rate, review decisions, support case targets
```

**Result:** ✅ Implemented
- `docs/pilot/CRITICAL_ENDPOINTS.md` created
- Lists 23 pilot-relevant endpoints (15 critical, 8 recommended)
- Defines KPI targets and validation rules

### ✅ AC3: Endpoint Catalog Remains Deterministic

**Verification:**
```bash
# Check new endpoint is cataloged
grep "pilot/kpis" docs/api/ENDPOINT_CATALOG.md
# Should return entry with E6.4.9 reference

# Check allowlist includes new endpoint
grep "pilot/kpis" docs/api/endpoint-allowlist.json
# Should be in allowedOrphans array
```

**Result:** ✅ Implemented
- Endpoint catalog updated with new KPI endpoint
- Allowlist updated to include `/api/admin/pilot/kpis`
- Maintains deterministic structure

---

## Testing Considerations

### Manual Testing

**Test Case 1: Pilot KPIs Retrieval (Admin)**
```bash
# Setup: Authenticate as admin
export ADMIN_COOKIE="sb-localhost-auth-token=YOUR_ADMIN_COOKIE"

# Test: Get pilot KPIs
curl -H "Cookie: $ADMIN_COOKIE" http://localhost:3000/api/admin/pilot/kpis

# Expected:
# - 200 OK
# - Response contains funnelMetrics, reviewMetrics, supportCaseMetrics, workupMetrics
# - All metrics are numeric (may be 0 if no pilot data)
```

**Test Case 2: Pilot KPIs Authorization (Patient)**
```bash
# Setup: Authenticate as patient
export PATIENT_COOKIE="sb-localhost-auth-token=YOUR_PATIENT_COOKIE"

# Test: Attempt to get pilot KPIs
curl -H "Cookie: $PATIENT_COOKIE" http://localhost:3000/api/admin/pilot/kpis

# Expected:
# - 403 Forbidden
# - Error: "Zugriff verweigert."
```

**Test Case 3: Pilot KPIs Time Filtering**
```bash
# Setup: Authenticate as admin
export ADMIN_COOKIE="sb-localhost-auth-token=YOUR_ADMIN_COOKIE"

# Test: Get KPIs for specific time range
curl -H "Cookie: $ADMIN_COOKIE" \
  "http://localhost:3000/api/admin/pilot/kpis?since=2026-01-01T00:00:00Z&until=2026-01-15T23:59:59Z"

# Expected:
# - 200 OK
# - Response includes filters.since and filters.until
# - Metrics only count events within time range
```

**Test Case 4: Endpoint Catalog Validation**
```bash
# Test: Check new endpoint is cataloged
grep "pilot/kpis" docs/api/ENDPOINT_CATALOG.md

# Expected:
# - Entry found with E6.4.9 description
# - Route file points to app/api/admin/pilot/kpis/route.ts
```

### Integration Tests (Future)

**Scenarios:**
1. **Funnel Flow + KPI Check**:
   - Start funnel → Complete funnel
   - Call `/api/admin/pilot/kpis`
   - Verify `totalStarts = 1`, `totalCompletes = 1`, `completionRate = 100`

2. **Review Decision + KPI Check**:
   - Create review → Make decision (approve)
   - Call `/api/admin/pilot/kpis`
   - Verify `totalReviews = 1`, `approved = 1`

3. **Support Case + KPI Check**:
   - Create support case → Escalate
   - Call `/api/admin/pilot/kpis`
   - Verify `totalCases = 1`, `escalated = 1`

---

## Dependencies & Integration

### Depends On

- **E6.4.8** (Pilot Flow Events): `pilot_flow_events` table for funnel/workup metrics
- **TV05_01** (Usage Telemetry): Existing `/api/admin/usage` endpoint
- **V05-I05.7** (Review System): `review_records` table
- **V05-I08.4** (Support Cases): `support_cases` table

### Aligns With

- **Endpoint Governance**: Catalog and allowlist remain deterministic
- **PHI Compliance**: KPIs are PHI-free (only counts and UUIDs)
- **RBAC**: Admin/clinician-only access enforced

---

## Known Limitations & Future Work

### Deferred Items

1. **Admin UI Dashboard**
   - Current: API-only access (curl/PowerShell)
   - Future: Web-based KPI dashboard for admins
   - Reason: Minimal implementation for pilot; CLI is sufficient

2. **Real-Time KPI Updates**
   - Current: On-demand query of database
   - Future: Cached/materialized views for performance
   - Reason: Pilot volume is low; real-time query is acceptable

3. **Historical Trend Analysis**
   - Current: Single-point-in-time metrics
   - Future: Time-series data with trend charts
   - Reason: Pilot duration is short; trend analysis not critical

4. **Automated Alerting**
   - Current: Manual KPI checks by admins
   - Future: Alerts for KPIs below thresholds (e.g., completion rate < 60%)
   - Reason: Pilot is manually monitored; automation not required

### Pre-Existing Issues

- **Build Error**: Unrelated to E6.4.9 (see existing implementation summaries)
- **Type Generation**: `lib/types/supabase.ts` may need regeneration after schema changes

---

## Files Modified/Created

### Created (3 files)

1. `app/api/admin/pilot/kpis/route.ts` - Pilot KPIs endpoint
2. `docs/pilot/CRITICAL_ENDPOINTS.md` - Pilot-critical endpoints documentation
3. `E6_4_9_IMPLEMENTATION_SUMMARY.md` - This document

### Modified (2 files)

4. `docs/api/ENDPOINT_CATALOG.md` - Added pilot KPIs entry
5. `docs/api/endpoint-allowlist.json` - Added pilot KPIs to allowlist

---

## Deployment Notes

### Pre-Deployment

1. Verify database migrations are applied (E6.4.8 `pilot_flow_events` table must exist)
2. Verify `review_records` and `support_cases` tables exist
3. Test endpoint with admin credentials in staging

### Post-Deployment

1. Verify endpoint is accessible: `GET /api/admin/pilot/kpis`
2. Verify authorization gates (403 for patients, 401 for unauthenticated)
3. Test time filtering with `since` and `until` parameters
4. Validate KPI metrics match expected pilot activity

### Rollback Plan

- Remove endpoint: `DELETE app/api/admin/pilot/kpis/route.ts`
- Revert catalog: Remove entry from `ENDPOINT_CATALOG.md`
- Revert allowlist: Remove entry from `endpoint-allowlist.json`
- No database changes required (uses existing tables)

---

## Success Metrics (Post-Pilot)

**KPI Coverage:**
- ✅ Funnel starts/completes tracked
- ✅ Review decisions tracked
- ✅ Support case volume tracked
- ✅ Workup metrics tracked

**Endpoint Governance:**
- ✅ Pilot-critical endpoints documented
- ✅ Endpoint catalog updated
- ✅ Allowlist synchronized

**Admin Usability:**
- ✅ Single endpoint for all pilot KPIs
- ✅ Time filtering for historical analysis
- ✅ PHI-free metrics for safe export

---

## References

- **Issue**: E6.4.9 — Pilot Telemetry/KPIs (Minimal) + "Unused Endpoints" Gate Alignment
- **Related Issues**:
  - E6.4.8 (Pilot Flow Events)
  - TV05_01 (Usage Telemetry)
  - V05-I05.7 (Review System)
  - V05-I08.4 (Support Cases)
- **Documentation**:
  - `docs/pilot/CRITICAL_ENDPOINTS.md` - Pilot-critical endpoints
  - `docs/USAGE_TELEMETRY.md` - Usage tracking implementation
  - `E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md` - E6.4.8 telemetry

---

**Implementation Complete:** 2026-01-15  
**Implemented By:** GitHub Copilot Agent  
**Status:** ✅ Ready for Review  
**Next Steps:** Manual testing, smoke tests, pilot validation
