# Legacy 410 Routes Mapping

**Status**: E73.6 Active  
**Purpose**: Document all ghosted API routes and their 410 stub implementations  
**Last Updated**: 2026-01-28

---

## Overview

This document maps all legacy API routes to their 410 Gone stub implementations. When a client calls a legacy endpoint, they receive an HTTP 410 response indicating the endpoint has been permanently deprecated.

---

## 410 Response Format

All legacy endpoints return this standardized response:

```typescript
{
  error: 'LEGACY_GHOSTED',
  route: string,              // Original route path
  message: string,            // Human-readable deprecation message
  deprecatedAt: string,       // ISO 8601 timestamp
  docsUrl?: string,           // Optional migration guide URL
  alternative?: string        // Optional replacement endpoint
}
```

**HTTP Status**: 410 Gone  
**Content-Type**: application/json

---

## Ghosted Routes

### Admin Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/admin/funnels` | 2026-01-28 | TBD | Funnel management moved to studio-ui |
| `/api/admin/funnels/[id]` | 2026-01-28 | TBD | Funnel details moved to studio-ui |
| `/api/admin/funnel-steps` | 2026-01-28 | TBD | Step management moved to studio-ui |
| `/api/admin/funnel-steps/[id]` | 2026-01-28 | TBD | Step details moved to studio-ui |
| `/api/admin/reassessment-rules` | 2026-01-28 | TBD | Rules engine moved to studio-ui |
| `/api/admin/reassessment-rules/[id]` | 2026-01-28 | TBD | Rule details moved to studio-ui |
| `/api/admin/usage` | 2026-01-28 | TBD | Usage tracking moved to studio-ui |
| `/api/admin/kpi-thresholds` | 2026-01-28 | TBD | KPI management moved to studio-ui |
| `/api/admin/kpi-thresholds/[id]` | 2026-01-28 | TBD | Threshold details moved to studio-ui |
| `/api/admin/content-pages` | 2026-01-28 | TBD | Content CMS moved to studio-ui |
| `/api/admin/content-pages/[id]` | 2026-01-28 | TBD | Page details moved to studio-ui |
| `/api/admin/content-pages/[id]/sections` | 2026-01-28 | TBD | Section management moved to studio-ui |
| `/api/admin/content-pages/[id]/sections/[sectionId]` | 2026-01-28 | TBD | Section details moved to studio-ui |
| `/api/admin/pilot/kpis` | 2026-01-28 | TBD | Pilot KPIs moved to studio-ui |
| `/api/admin/pilot/flow-events` | 2026-01-28 | TBD | Flow tracking moved to studio-ui |

### Assessment Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/assessments` | 2026-01-28 | TBD | Assessment API redesigned |
| `/api/assessments/[id]` | 2026-01-28 | TBD | Details endpoint redesigned |
| `/api/assessment-answers` | 2026-01-28 | TBD | Answer submission redesigned |
| `/api/assessment-validation` | 2026-01-28 | TBD | Validation moved to funnel runtime |

### Amy (AI) Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/amy/stress-report` | 2026-01-28 | TBD | AI report generation redesigned |
| `/api/amy/stress-summary` | 2026-01-28 | TBD | Summary endpoint redesigned |
| `/api/amy/triage` | 2026-01-28 | TBD | Triage logic moved to processing |

### Auth Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/auth/callback` | 2026-01-28 | Active in studio-ui | Moved to production app |
| `/api/auth/debug` | 2026-01-28 | N/A | Debug endpoint removed |
| `/api/auth/debug-cookie` | 2026-01-28 | N/A | Debug endpoint removed |
| `/api/auth/resolve-role` | 2026-01-28 | Active in studio-ui | Moved to production app |
| `/api/auth/signout` | 2026-01-28 | Active in studio-ui | Moved to production app |

### Content Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/content/resolve` | 2026-01-28 | TBD | Content resolution redesigned |
| `/api/content-resolver` | 2026-01-28 | TBD | Resolver moved to lib |
| `/api/content-pages` | 2026-01-28 | TBD | Content delivery redesigned |

### Document Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/documents/upload` | 2026-01-28 | TBD | Upload API redesigned |
| `/api/documents/[id]/extract` | 2026-01-28 | TBD | Extraction moved to processing |
| `/api/documents/[id]/status` | 2026-01-28 | TBD | Status tracking redesigned |

### Funnel Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/funnels/active` | 2026-01-28 | Active in patient-ui | Moved to production app |
| `/api/funnels/[slug]/assessments` | 2026-01-28 | Active in patient-ui | Moved to production app |
| `/api/funnels/[slug]/assessments/[assessmentId]` | 2026-01-28 | Active in patient-ui | Moved to production app |
| `/api/funnels/[slug]/assessments/[assessmentId]/complete` | 2026-01-28 | Active in patient-ui | Moved to production app |
| `/api/funnels/[slug]/assessments/[assessmentId]/result` | 2026-01-28 | Active in patient-ui | Moved to production app |
| `/api/funnels/[slug]/assessments/[assessmentId]/workup` | 2026-01-28 | Active in patient-ui | Moved to production app |
| `/api/funnels/[slug]/content-pages` | 2026-01-28 | TBD | Content integration redesigned |

### Patient Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/patient/dashboard` | 2026-01-28 | Active in patient-ui | Moved to production app |
| `/api/patient/triage` | 2026-01-28 | TBD | Triage moved to processing |
| `/api/patient-profiles` | 2026-01-28 | TBD | Profile management redesigned |
| `/api/patient-measures/export` | 2026-01-28 | TBD | Export functionality redesigned |
| `/api/patient-measures/history` | 2026-01-28 | TBD | History endpoint redesigned |

### Processing Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/processing/start` | 2026-01-28 | TBD | Processing pipeline redesigned |
| `/api/processing/validation` | 2026-01-28 | TBD | Validation moved to funnel runtime |
| `/api/processing/safety` | 2026-01-28 | TBD | Safety checks redesigned |
| `/api/processing/risk` | 2026-01-28 | TBD | Risk assessment redesigned |
| `/api/processing/ranking` | 2026-01-28 | TBD | Ranking algorithm redesigned |
| `/api/processing/content` | 2026-01-28 | TBD | Content generation redesigned |
| `/api/processing/delivery` | 2026-01-28 | TBD | Delivery logic redesigned |
| `/api/processing/pdf` | 2026-01-28 | TBD | PDF generation redesigned |
| `/api/processing/jobs/[jobId]` | 2026-01-28 | TBD | Job tracking redesigned |
| `/api/processing/jobs/[jobId]/download` | 2026-01-28 | TBD | Download endpoint redesigned |

### Reports Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/reports` | 2026-01-28 | TBD | Reports API redesigned |
| `/api/reports/[reportId]` | 2026-01-28 | TBD | Report details redesigned |
| `/api/reports/[reportId]/pdf` | 2026-01-28 | TBD | PDF export redesigned |

### Review Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/review/queue` | 2026-01-28 | TBD | Review workflow redesigned |
| `/api/review/[id]` | 2026-01-28 | TBD | Review details redesigned |
| `/api/review/[id]/decide` | 2026-01-28 | TBD | Decision endpoint redesigned |
| `/api/review/[id]/details` | 2026-01-28 | TBD | Details endpoint consolidated |

### Other Routes

| Legacy Route | Deprecated At | Alternative | Notes |
|--------------|---------------|-------------|-------|
| `/api/account/deletion-request` | 2026-01-28 | TBD | Account management redesigned |
| `/api/consent/record` | 2026-01-28 | TBD | Consent tracking redesigned |
| `/api/consent/status` | 2026-01-28 | TBD | Status endpoint redesigned |
| `/api/escalation/log-click` | 2026-01-28 | TBD | Event tracking redesigned |
| `/api/health` | 2026-01-28 | Active in studio-ui | Health check moved |
| `/api/health/env` | 2026-01-28 | Active in studio-ui | Env check moved |
| `/api/notifications` | 2026-01-28 | TBD | Notifications API redesigned |
| `/api/notifications/[id]` | 2026-01-28 | TBD | Notification details redesigned |
| `/api/pre-screening-calls` | 2026-01-28 | TBD | Pre-screening redesigned |
| `/api/shipments` | 2026-01-28 | TBD | Shipment tracking redesigned |
| `/api/shipments/[id]` | 2026-01-28 | TBD | Shipment details redesigned |
| `/api/shipments/[id]/events` | 2026-01-28 | TBD | Event tracking redesigned |
| `/api/support-cases` | 2026-01-28 | TBD | Support system redesigned |
| `/api/support-cases/[id]` | 2026-01-28 | TBD | Case details redesigned |
| `/api/support-cases/[id]/escalate` | 2026-01-28 | TBD | Escalation endpoint redesigned |
| `/api/tasks` | 2026-01-28 | TBD | Task management redesigned |
| `/api/tasks/[id]` | 2026-01-28 | TBD | Task details redesigned |
| `/api/test/correlation-id` | 2026-01-28 | N/A | Test endpoint removed |

---

## Implementation Strategy

Legacy routes are NOT implemented as individual 410 stubs. Instead:

1. **Catch-All Route**: A single catch-all route in the production apps catches all undefined API routes
2. **Legacy Check**: The catch-all checks if the route matches a known legacy pattern
3. **410 Response**: If matched, returns the standardized 410 response
4. **404 Response**: If not matched, returns standard 404

This approach:
- ✅ Minimal code duplication
- ✅ Easy to update alternative endpoints
- ✅ Consistent error responses
- ✅ Future-proof for additional ghosted routes

---

## Migration Tracking

**Total Ghosted Routes**: ~80+  
**Moved to Production**: ~15 (auth, health, funnel core)  
**Pending Migration**: ~65  
**Removed (No Replacement)**: ~5 (debug/test endpoints)

---

## Related Documentation

- `legacy/README.md` - Main legacy documentation
- `legacy/code/app/api/` - Original legacy implementations
- `docs/api/ENDPOINT_CATALOG.md` - Active production endpoints
- `docs/api/endpoint-allowlist.json` - Endpoint wiring allowlist

---

## Changelog

- **2026-01-28**: Initial routes mapping created (E73.6)
  - Documented ~80+ legacy routes
  - Categorized by functional area
  - Identified migration status for each route
