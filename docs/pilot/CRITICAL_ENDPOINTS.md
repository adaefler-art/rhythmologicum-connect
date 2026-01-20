# Pilot-Critical Endpoints

**Issue:** E6.4.9 — Pilot Telemetry/KPIs (Minimal) + "Unused Endpoints" Gate Alignment  
**Date:** 2026-01-15  
**Status:** ✅ Defined

---

## Purpose

This document defines which API endpoints **must** show non-zero usage during the pilot phase. These endpoints are considered critical for pilot operations and should not be marked as "unused" or removed during cleanup audits.

## Definition Criteria

An endpoint is "pilot-critical" if:
1. It is required for core patient flows (onboarding, assessment, results)
2. It is required for clinician workflows (review, triage, workup)
3. It is required for pilot evaluation/observability (telemetry, KPIs, exports)
4. Removing it would break pilot functionality

## Pilot-Critical Endpoints

### Patient Journey Endpoints

These endpoints support the core patient assessment flow:

| Endpoint | Methods | Purpose | Must Be Used During Pilot |
|----------|---------|---------|---------------------------|
| `/api/funnels/[slug]/assessments` | POST | Start a new funnel assessment | ✅ Yes |
| `/api/funnels/[slug]/assessments/[assessmentId]` | GET | Resume existing assessment | ✅ Yes |
| `/api/funnels/[slug]/assessments/[assessmentId]/complete` | POST | Complete assessment | ✅ Yes |
| `/api/funnels/[slug]/assessments/[assessmentId]/answers/save` | POST | Save assessment answers | ✅ Yes |
| `/api/funnels/[slug]/assessments/[assessmentId]/result` | GET | Get assessment result | ✅ Yes |
| `/api/funnels/[slug]/definition` | GET | Get funnel definition | ✅ Yes |
| `/api/funnels/catalog` | GET | List available funnels | ✅ Yes |
| `/api/amy/stress-report` | POST | Generate stress report (AMY) | ✅ Yes |

### Clinician Workflow Endpoints

These endpoints support clinician review and triage:

| Endpoint | Methods | Purpose | Must Be Used During Pilot |
|----------|---------|---------|---------------------------|
| `/api/review/[id]/decide` | POST | Make review decision | ✅ Yes |
| `/api/review/[id]/details` | GET | Get review details | ✅ Yes |
| `/api/review/queue` | GET | Get review queue | ⚠️ Recommended |
| `/api/funnels/[slug]/assessments/[assessmentId]/workup` | POST | Trigger workup check | ✅ Yes |

### Support & Escalation Endpoints

These endpoints support patient support and escalation:

| Endpoint | Methods | Purpose | Must Be Used During Pilot |
|----------|---------|---------|---------------------------|
| `/api/support-cases` | GET, POST | Create/list support cases | ✅ Yes |
| `/api/support-cases/[id]` | GET, PATCH | Manage support cases | ✅ Yes |
| `/api/support-cases/[id]/escalate` | POST | Escalate support case | ⚠️ Recommended |
| `/api/escalation/log-click` | POST | Log escalation CTA click | ⚠️ Recommended |

### Pilot Observability Endpoints

These endpoints provide telemetry and KPIs for pilot evaluation:

| Endpoint | Methods | Purpose | Must Be Used During Pilot |
|----------|---------|---------|---------------------------|
| `/api/admin/pilot/kpis` | GET | Get pilot KPIs (NEW) | ✅ Yes |
| `/api/admin/pilot/flow-events` | GET | Get pilot flow events | ✅ Yes |
| `/api/admin/usage` | GET | Get endpoint usage metrics | ✅ Yes |
| `/api/patient-measures/export` | GET | Export patient data | ✅ Yes |

### Authentication & Profile Endpoints

These endpoints support user authentication and profile management:

| Endpoint | Methods | Purpose | Must Be Used During Pilot |
|----------|---------|---------|---------------------------|
| `/api/auth/callback` | POST | OAuth callback | ✅ Yes |
| `/api/auth/resolve-role` | GET | Resolve user role | ✅ Yes |
| `/api/patient-profiles` | GET | Get patient profiles | ✅ Yes |

---

## Non-Critical Endpoints (May Be Unused)

The following endpoints are **not** required for pilot operations and may legitimately show zero usage:

- `/api/account/deletion-request` - GDPR deletion (not expected during pilot)
- `/api/consent/record` - Manual consent recording (may be handled in onboarding)
- `/api/consent/status` - Consent status check (may not be triggered)
- `/api/health/env` - Environment health check (admin/dev only)
- `/api/test/correlation-id` - Test endpoint (dev only)
- `/api/processing/*` - Background processing (may not be active)
- `/api/documents/*` - Document upload/extraction (future feature)
- `/api/notifications/*` - Notification system (may not be enabled)

---

## Validation Rules

### During Pilot

1. **Funnel Starts**: `/api/funnels/[slug]/assessments` (POST) must show > 0 calls
2. **Funnel Completes**: `/api/funnels/[slug]/assessments/[assessmentId]/complete` (POST) must show > 0 calls
3. **Review Decisions**: `/api/review/[id]/decide` (POST) should show > 0 calls
4. **Support Cases**: `/api/support-cases` (POST) should show > 0 calls
5. **KPI Access**: `/api/admin/pilot/kpis` (GET) should be called at least once for pilot reporting

### Completion Rate KPI

- **Definition**: `(Funnel Completes / Funnel Starts) * 100`
- **Target**: ≥ 60% completion rate during pilot
- **Measurement**: Via `/api/admin/pilot/kpis` endpoint

### Review Decision KPI

- **Definition**: Total review decisions (approved + rejected + changes requested)
- **Target**: ≥ 10 review decisions during pilot
- **Measurement**: Via `/api/admin/pilot/kpis` endpoint

### Support Case KPI

- **Definition**: Total support cases created
- **Target**: ≥ 1 support case during pilot
- **Measurement**: Via `/api/admin/pilot/kpis` endpoint

---

## Endpoint Catalog Alignment

### Allowlist Synchronization

All pilot-critical endpoints listed above should be present in:
- `docs/api/endpoint-allowlist.json` → `allowedOrphans` (if not called from repo code)
- `docs/api/ENDPOINT_CATALOG.md` → Marked as "pilot-critical" in comments

### Catalog Update Required

The endpoint catalog should be regenerated after:
1. Adding new pilot endpoints (e.g., `/api/admin/pilot/kpis`)
2. Marking endpoints as pilot-critical
3. Any structural changes to pilot flow

**Command:**
```bash
npm run endpoint-catalog:update
# or
node scripts/generate-endpoint-catalog.js
```

---

## Usage Monitoring

### How to Check Endpoint Usage

#### Option 1: Admin Usage Endpoint

```bash
curl -H "Cookie: sb-localhost-auth-token=YOUR_COOKIE" \
  http://localhost:3000/api/admin/usage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "routes": [
      {
        "routeKey": "POST /api/funnels/stress/assessments",
        "count": 42,
        "lastSeenAt": "2026-01-15T10:00:00.000Z",
        "statusBuckets": { "2xx": 40, "3xx": 0, "4xx": 2, "5xx": 0 }
      }
    ]
  }
}
```

#### Option 2: Pilot KPIs Endpoint (NEW)

```bash
curl -H "Cookie: sb-localhost-auth-token=YOUR_COOKIE" \
  http://localhost:3000/api/admin/pilot/kpis
```

**Response:**
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
          "stress": { "starts": 100, "completes": 75, "completionRate": 75 }
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
    "generatedAt": "2026-01-15T12:00:00.000Z"
  }
}
```

#### Option 3: Pilot Flow Events

```bash
curl -H "Cookie: sb-localhost-auth-token=YOUR_COOKIE" \
  "http://localhost:3000/api/admin/pilot/flow-events?limit=100"
```

---

## Acceptance Criteria Validation

### ✅ AC1: Admin Can See Usage for Pilot-Relevant Routes

**Verification:**
```bash
# Access admin usage endpoint
curl -H "Cookie: $ADMIN_COOKIE" http://localhost:3000/api/admin/usage

# Access pilot KPIs endpoint
curl -H "Cookie: $ADMIN_COOKIE" http://localhost:3000/api/admin/pilot/kpis

# Both should return 200 with metrics for pilot-critical endpoints
```

**Expected Result:**
- Both endpoints return 200 OK
- Usage metrics include funnel, review, and support case routes
- KPIs show funnel completion rate, review decisions, and support case volume

### ✅ AC2: Doc Section Defines Pilot-Critical Routes

**Verification:**
- This document (`docs/pilot/CRITICAL_ENDPOINTS.md`) exists
- Lists all pilot-critical endpoints with "Must Be Used" flags
- Defines validation rules for non-zero usage

**Expected Result:**
- Document defines 15+ pilot-critical endpoints
- Specifies which must show non-zero usage
- Provides KPI targets (completion rate ≥ 60%, reviews ≥ 10, cases ≥ 1)

### ✅ AC3: Endpoint Catalog Alignment

**Verification:**
```bash
# Check endpoint catalog includes new pilot KPI endpoint
grep -r "pilot/kpis" docs/api/ENDPOINT_CATALOG.md

# Check allowlist includes pilot endpoints
cat docs/api/endpoint-allowlist.json | grep -E "pilot|usage"
```

**Expected Result:**
- New `/api/admin/pilot/kpis` endpoint appears in catalog
- Pilot endpoints are in allowlist as permitted orphans

---

## Troubleshooting

### Issue: Endpoint Shows Zero Usage

1. **Check Telemetry is Enabled:**
   ```bash
   # Check USAGE_TELEMETRY_ENABLED in environment
   curl http://localhost:3000/api/admin/usage | jq .data.enabled
   ```

2. **Check Endpoint is Instrumented:**
   - Verify endpoint calls `trackUsage()` or `withUsageTracking()`
   - Check `lib/monitoring/usageTrackingWrapper.ts` for pattern

3. **Check RLS Policies:**
   - Endpoint may be blocked by Row Level Security
   - Verify user has correct role (patient/clinician/admin)

### Issue: KPIs Show Zero Metrics

1. **Check Database Migration:**
   ```bash
   # Verify pilot_flow_events table exists
   psql -c "\dt pilot_flow_events"
   ```

2. **Check Event Emission:**
   - Verify `emitFunnelStarted()`, `emitReviewDecision()`, etc. are called
   - Check logs for telemetry errors: `grep TELEMETRY logs/*.log`

3. **Check Time Filters:**
   - KPI endpoint accepts `since` and `until` parameters
   - Ensure date range includes pilot activity

---

## References

- **Issue:** E6.4.9 — Pilot Telemetry/KPIs (Minimal) + "Unused Endpoints" Gate Alignment
- **Related:**
  - E6.4.8 — Minimal Telemetry (pilot_flow_events table)
  - TV05_01 — Runtime Usage Telemetry (admin/usage endpoint)
  - V05-I10.3 — KPI/Observability Tracking
- **Implementation:**
  - `/app/api/admin/pilot/kpis/route.ts` — Pilot KPIs endpoint
  - `/app/api/admin/usage/route.ts` — Usage telemetry endpoint
  - `/app/api/admin/pilot/flow-events/route.ts` — Flow events endpoint
- **Documentation:**
  - `/docs/USAGE_TELEMETRY.md` — Usage tracking implementation
  - `/docs/pilot/EXPORTS.md` — Pilot data export guide
  - `../e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md` — Telemetry implementation

---

**Last Updated:** 2026-01-15  
**Implemented By:** GitHub Copilot Agent  
**Status:** ✅ Ready for Pilot
