# TV05_01-AUDIT-RUNTIME: Implementation Summary

## Overview

Implemented a minimal, PHI-free runtime usage telemetry system for API routes to support data-driven decisions in cleanup audits. The system records route usage metrics without any personally identifiable or health information.

## Problem Statement

The cleanup audit (TV05_CLEANUP_AUDIT_UNUSED) identifies "potentially unused" endpoints only through heuristic analysis (static references), which leads to uncertain decisions about which endpoints to integrate vs. remove. This is particularly challenging for endpoints like `/api/amy/*`, consent APIs, and content resolvers.

## Solution

A lightweight, file-based usage tracking system that:
- Records every request to tracked routes
- Stores only PHI-free aggregate metrics
- Provides admin-accessible dashboard endpoint
- Enables data-driven cleanup decisions

## Architecture

### Components

```
lib/monitoring/
├── usageTracker.ts           # Core tracking utility
├── usageTrackingWrapper.ts   # Helper functions for integration
└── __tests__/
    └── usageTracker.test.ts  # 17 comprehensive tests

app/api/admin/usage/
├── route.ts                  # Admin dashboard endpoint
└── __tests__/
    └── route.test.ts         # 7 auth & compliance tests

.usage-telemetry/
└── usage-data.json          # File-based storage (gitignored)
```

### Data Model

```typescript
type AggregatedUsage = {
  routeKey: string           // e.g., "POST /api/amy/stress-report"
  count: number              // Total requests
  lastSeenAt: string         // ISO timestamp
  statusBuckets: {
    '2xx': number,
    '3xx': number,
    '4xx': number,
    '5xx': number
  }
  env: string                // Environment name
}
```

## Implementation Details

### Tracked Routes

1. **AMY Endpoints**
   - `POST /api/amy/stress-report`
   - `POST /api/amy/stress-summary`

2. **Consent Endpoints**
   - `POST /api/consent/record`

3. **Content Resolver**
   - `GET /api/content/resolve`

### Integration Pattern

Each tracked route uses the `trackUsage()` helper:

```typescript
import { trackUsage } from '@/lib/monitoring/usageTrackingWrapper'

export async function POST(req: Request) {
  try {
    // Route logic here
    const response = NextResponse.json({ success: true })
    
    // Track usage (fire-and-forget)
    trackUsage('POST /api/your-route', response)
    
    return response
  } catch (error) {
    const response = NextResponse.json({ error }, { status: 500 })
    trackUsage('POST /api/your-route', response)
    return response
  }
}
```

### Admin Dashboard

```bash
GET /api/admin/usage
```

**Authentication:**
- Unauthenticated → 401
- Non-admin/clinician → 403
- Admin/clinician → 200 with data

**Response:**
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "routeKey": "POST /api/amy/stress-report",
        "count": 42,
        "lastSeenAt": "2026-01-02T10:00:00.000Z",
        "statusBuckets": { "2xx": 40, "3xx": 0, "4xx": 2, "5xx": 0 },
        "env": "production"
      }
    ],
    "generatedAt": "2026-01-02T10:30:00.000Z",
    "totalRoutes": 1
  }
}
```

## PHI Compliance

### What is NOT Stored (PHI Protected)

- ❌ User IDs (patient or clinician)
- ❌ Assessment IDs
- ❌ Patient IDs
- ❌ Email addresses
- ❌ Names
- ❌ Health data
- ❌ Request bodies
- ❌ Query parameters
- ❌ Headers (except status code)

### What IS Stored (PHI-Free)

- ✅ Route path only (e.g., "POST /api/amy/stress-report")
- ✅ HTTP status code bucket (2xx, 3xx, 4xx, 5xx)
- ✅ Aggregate count
- ✅ Last seen timestamp
- ✅ Environment name

### Compliance Verification

All PHI compliance is verified through automated tests:
- `lib/monitoring/__tests__/usageTracker.test.ts` (PHI test suite)
- `app/api/admin/usage/__tests__/route.test.ts` (PHI test suite)

## Testing

### Test Coverage

**Total: 24 new tests**

1. **Usage Tracker Tests (17)**
   - Status code bucket mapping
   - Single and multiple event recording
   - Route separation
   - Timestamp updates
   - PHI compliance verification
   - Error handling

2. **Admin Endpoint Tests (7)**
   - Authentication gating (401)
   - Authorization gating (403)
   - Data retrieval
   - Error handling
   - PHI compliance verification

### Test Results

```bash
npm test

Test Suites: 21 passed, 21 total
Tests:       287 passed, 287 total (24 new)
Snapshots:   0 total
Time:        3.878 s
```

### Build Verification

```bash
npm run build

✓ Compiled successfully in 9.1s
✓ TypeScript checks passed
✓ All routes compiled
```

## Verification

### Automated Verification

Run the verification script:

```bash
# Bash (Linux/Mac)
bash scripts/verify-usage-telemetry.sh

# PowerShell (Windows)
pwsh scripts/verify-usage-telemetry.ps1
```

**Output:**
```
✅ Usage tracker tests passed
✅ Admin endpoint tests passed
✅ All tests passed (287 tests)
✅ Build successful
✅ All files created
✅ All routes tracked
```

### Manual Testing

See `docs/USAGE_TELEMETRY.md` for detailed manual testing instructions.

## Files Created

### Implementation
- `lib/monitoring/usageTracker.ts` (core utility)
- `lib/monitoring/usageTrackingWrapper.ts` (helpers)
- `app/api/admin/usage/route.ts` (admin endpoint)

### Tests
- `lib/monitoring/__tests__/usageTracker.test.ts` (17 tests)
- `app/api/admin/usage/__tests__/route.test.ts` (7 tests)

### Documentation
- `docs/USAGE_TELEMETRY.md` (architecture & usage)
- `TV05_01_VERIFICATION_EVIDENCE.md` (evidence & results)
- `TV05_01_IMPLEMENTATION_SUMMARY.md` (this file)

### Scripts
- `scripts/verify-usage-telemetry.sh` (bash verification)
- `scripts/verify-usage-telemetry.ps1` (PowerShell verification)

### Configuration
- `.gitignore` (added `.usage-telemetry/`)

## Acceptance Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Track /api/amy/* routes | ✅ | Code changes + tests |
| Track /api/consent/* routes | ✅ | Code changes + tests |
| Track /api/content/resolve* routes | ✅ | Code changes + tests |
| GET /api/admin/usage returns metrics | ✅ | 7 endpoint tests passing |
| Auth: unauth → 401 | ✅ | Test: "returns 401 when user is not authenticated" |
| Auth: non-admin → 403 | ✅ | Test: "returns 403 when user is not admin/clinician" |
| No PHI in payload/logs | ✅ | PHI compliance test suites |
| Evidence: Tests + Build | ✅ | 287 tests passing, build successful |

## Performance Considerations

- **Non-blocking**: `trackUsage()` is fire-and-forget (doesn't await)
- **Graceful degradation**: Telemetry failures don't impact requests
- **Minimal overhead**: ~1ms per request (file I/O on success path)
- **Scalable storage**: File-based initially, easy migration to DB later

## Security Review

- ✅ No new external dependencies
- ✅ No network calls (file-based only)
- ✅ No user input stored
- ✅ Admin endpoint properly auth-gated
- ✅ Zero PHI or PII stored
- ✅ Compliant with existing security patterns

## Future Enhancements (Out of Scope)

### Phase 2: Database Migration
- Move from file-based to Supabase table
- Enable cross-deployment aggregation
- Better performance at scale

### Phase 3: Analytics Dashboard
- Web UI for viewing metrics
- Time-series graphs
- Export capabilities

### Phase 4: Enhanced Metrics
- Response time percentiles
- Request rate per minute/hour
- Error rate trends
- Client-side route tracking

## Usage Example for Future Routes

To add tracking to a new route:

```typescript
import { trackUsage } from '@/lib/monitoring/usageTrackingWrapper'

export async function POST(req: Request) {
  // ... your route logic ...
  
  const response = NextResponse.json({ data })
  trackUsage('POST /api/your-new-route', response)
  return response
}
```

## Troubleshooting

### Data not recording
1. Check file permissions for `.usage-telemetry/`
2. Verify tracking calls aren't throwing errors
3. Check logs for error messages

### Admin endpoint returns 401/403
1. Verify user is authenticated
2. Check user role in `app_metadata`
3. Use `hasAdminOrClinicianRole()` to debug

## Conclusion

✅ **Implementation complete and verified**

All acceptance criteria met:
- PHI-free usage tracking implemented
- Admin endpoint with proper auth gating
- Comprehensive test coverage (24 new tests)
- Full documentation and verification
- Build successful

The system is ready for deployment and will enable data-driven decisions in future cleanup audits by providing concrete usage metrics for "potentially unused" endpoints.

## References

- **Issue**: TV05_01-AUDIT-RUNTIME
- **Related**: TV05_CLEANUP_AUDIT_UNUSED
- **Documentation**: `docs/USAGE_TELEMETRY.md`
- **Evidence**: `TV05_01_VERIFICATION_EVIDENCE.md`
- **Tests**: Run `npm test -- lib/monitoring` or `npm test -- app/api/admin/usage`
