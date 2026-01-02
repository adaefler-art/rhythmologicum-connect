# TV05_01: Runtime Usage Telemetry Implementation

## Overview

A minimal, PHI-free usage tracking system for API routes to support data-driven decision-making for cleanup audits. The system records route usage with status codes and provides an admin dashboard endpoint for viewing aggregated metrics.

## Architecture

### Components

1. **Usage Tracker** (`lib/monitoring/usageTracker.ts`)
   - Core utility for recording and retrieving usage data
   - File-based storage (`.usage-telemetry/usage-data.json`)
   - PHI-free: Only stores routeKey, statusCodeBucket, env, count, lastSeenAt

2. **Usage Tracking Wrapper** (`lib/monitoring/usageTrackingWrapper.ts`)
   - Helper functions to easily integrate tracking into routes
   - `withUsageTracking()`: Wraps route handlers
   - `trackUsage()`: Manual tracking for specific cases

3. **Admin Endpoint** (`/api/admin/usage`)
   - Protected endpoint (admin/clinician only)
   - Returns aggregated usage metrics as JSON
   - Auth gates: 401 for unauthenticated, 403 for non-admin

### Data Model

```typescript
type AggregatedUsage = {
  routeKey: string           // e.g., "POST /api/amy/stress-report"
  count: number              // Total number of requests
  lastSeenAt: string         // ISO timestamp of most recent request
  statusBuckets: {           // Breakdown by HTTP status code bucket
    '2xx': number
    '3xx': number
    '4xx': number
    '5xx': number
  }
  env: string                // Environment (development, production, etc.)
}
```

## Tracked Routes

The following routes are currently tracked:

- `POST /api/amy/stress-report`
- `POST /api/amy/stress-summary`
- `POST /api/consent/record`
- `GET /api/content/resolve`

## Usage

### Accessing Usage Data (Admin/Clinician Only)

```bash
# Authenticated request with admin/clinician role
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/admin/usage
```

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
        "statusBuckets": {
          "2xx": 40,
          "3xx": 0,
          "4xx": 2,
          "5xx": 0
        },
        "env": "production"
      }
    ],
    "generatedAt": "2026-01-02T10:30:00.000Z",
    "totalRoutes": 1
  }
}
```

### Adding Tracking to a New Route

**Option 1: Using trackUsage() manually**
```typescript
import { NextResponse } from 'next/server'
import { trackUsage } from '@/lib/monitoring/usageTrackingWrapper'

export async function POST(req: Request) {
  try {
    // Your route logic here
    const response = NextResponse.json({ success: true })
    
    // Track usage (fire and forget)
    trackUsage('POST /api/your-route', response)
    
    return response
  } catch (error) {
    const response = NextResponse.json({ error: 'Error' }, { status: 500 })
    trackUsage('POST /api/your-route', response)
    return response
  }
}
```

**Option 2: Using withUsageTracking() wrapper**
```typescript
import { withUsageTracking } from '@/lib/monitoring/usageTrackingWrapper'

export const POST = withUsageTracking(
  'POST /api/your-route',
  async (req: Request) => {
    // Your route logic here
    return NextResponse.json({ success: true })
  }
)
```

## Security & Compliance

### PHI Compliance

The usage tracking system is **PHI-free** by design:

- ✅ **No user IDs**: No tracking of individual users
- ✅ **No patient data**: No assessment IDs, patient IDs, or health data
- ✅ **No request details**: Only route path and status code bucket
- ✅ **Minimal metadata**: Only env, timestamp, and counts

### Verified in Tests

All PHI compliance is verified through automated tests:
- `lib/monitoring/__tests__/usageTracker.test.ts` (PHI compliance suite)
- `app/api/admin/usage/__tests__/route.test.ts` (PHI compliance suite)

## Storage

### File-Based Storage

- **Location**: `.usage-telemetry/usage-data.json`
- **Format**: JSON array of aggregated usage records
- **Persistence**: Survives process restarts
- **Gitignore**: Added to `.gitignore` to prevent commits

### Data Retention

Currently, data persists indefinitely in the file. Future enhancements could include:
- Automatic cleanup of old entries
- Migration to database table
- Time-based aggregation (daily/weekly summaries)

## Testing

### Test Coverage

**Usage Tracker Tests** (17 tests):
```bash
npm test -- lib/monitoring/__tests__/usageTracker.test.ts
```

- Status code bucket mapping
- Single and multiple event recording
- Route separation
- Timestamp updates
- PHI compliance verification

**Admin Endpoint Tests** (7 tests):
```bash
npm test -- app/api/admin/usage/__tests__/route.test.ts
```

- Authentication gating (401)
- Authorization gating (403)
- Data retrieval for admin/clinician
- Error handling
- PHI compliance verification

### Running All Tests

```bash
npm test
```

All 287 tests pass, including the 24 new usage tracking tests.

## Build Verification

```bash
npm run build
```

Build completes successfully with all routes compiled.

## Future Enhancements

### Phase 2 (Out of Scope for TV05_01)

- Database-backed storage (Supabase table)
- Time-based aggregation and cleanup
- Additional metrics (response time percentiles)
- Client-side route tracking
- Full analytics dashboard UI

## Troubleshooting

### Usage Data Not Recording

1. Check file permissions for `.usage-telemetry/` directory
2. Verify tracking calls are not throwing errors (check logs)
3. Ensure `NODE_ENV` is set correctly

### Admin Endpoint Returns 401

1. Verify user is authenticated
2. Check Supabase session cookies

### Admin Endpoint Returns 403

1. Verify user has `clinician` or `admin` role in `app_metadata`
2. Use `hasAdminOrClinicianRole()` to check role

## References

- Issue: TV05_01-AUDIT-RUNTIME
- Related: TV05_CLEANUP_AUDIT_UNUSED
- Implementation: `/lib/monitoring/`
- Tests: `/lib/monitoring/__tests__/` and `/app/api/admin/usage/__tests__/`
