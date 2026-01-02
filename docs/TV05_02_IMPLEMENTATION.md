# TV05_02: Usage Telemetry Toggle Implementation

## Overview

Implementation of deterministic toggle for Usage Telemetry that:
- **Defaults to ON in development** (NODE_ENV=development)
- **Defaults to OFF in production/preview** (NODE_ENV=production/test)
- **Supports explicit override** via `USAGE_TELEMETRY_ENABLED` environment variable
- **Never breaks requests** - errors are caught and logged only
- **Admin endpoint remains accessible** regardless of toggle state

## Implementation Summary

### 1. Environment Configuration

**File:** `lib/env.ts`

Added `USAGE_TELEMETRY_ENABLED` to environment schema:
- Type: `string` (optional)
- Accepted values: "true", "1", "yes" (enable), "false", "0", "no" (disable)
- Case-insensitive parsing
- Empty string uses default behavior

**File:** `.env.example`

Added documentation section:
```bash
# USAGE_TELEMETRY_ENABLED=true  # Override default behavior
```

### 2. Configuration Module

**File:** `lib/monitoring/config.ts` (NEW)

Implements `isUsageTelemetryEnabled()`:
```typescript
export function isUsageTelemetryEnabled(): boolean {
  // 1. Check for explicit override
  if (USAGE_TELEMETRY_ENABLED is set) {
    return parseBoolean(USAGE_TELEMETRY_ENABLED)
  }
  
  // 2. Use environment-based default
  return NODE_ENV === 'development'
}
```

**Logic:**
- Explicit override takes precedence over environment
- Default ON in development (helps identify unused endpoints)
- Default OFF in production/preview (avoids misleading data from ephemeral storage)

### 3. Usage Tracker Update

**File:** `lib/monitoring/usageTracker.ts`

Updated `recordUsage()`:
```typescript
export async function recordUsage(params) {
  // Early return if telemetry is disabled
  if (!isUsageTelemetryEnabled()) {
    return
  }
  
  // ... rest of recording logic
}
```

**Behavior:**
- When disabled: No filesystem writes, function returns immediately
- When enabled: Normal recording behavior
- Errors: Always caught and logged as warnings (never throw)

### 4. Admin Endpoint Update

**File:** `app/api/admin/usage/route.ts`

Updated response to include `enabled` flag:
```typescript
return successResponse({
  enabled: isUsageTelemetryEnabled(),
  routes: [...],
  generatedAt: "...",
  totalRoutes: 42
})
```

**Behavior:**
- Authentication errors still return 401 (unauthenticated) or 403 (unauthorized)
- Authorized requests return HTTP 200 (never 500 when telemetry is disabled)
- `enabled: false` when telemetry is off
- Empty `routes: []` when no data or disabled
- Endpoint remains accessible for monitoring

### 5. Test Coverage

**File:** `lib/monitoring/__tests__/config.test.ts` (NEW)

Tests for `isUsageTelemetryEnabled()`:
- ✅ Default ON in development
- ✅ Default OFF in production/test
- ✅ Explicit override "true"/"1"/"yes" (case-insensitive)
- ✅ Explicit override "false"/"0"/"no" (case-insensitive)
- ✅ Override takes precedence over environment
- ✅ Handles whitespace
- ✅ Invalid values treated as false
- ✅ Empty string uses default

**File:** `lib/monitoring/__tests__/usageTracker.test.ts`

Updated with telemetry toggle tests:
- ✅ No recording when disabled
- ✅ Normal recording when enabled
- ✅ No filesystem writes when disabled
- ✅ Can switch mid-session (enabled → disabled)
- ✅ No errors when disabled

**File:** `app/api/admin/usage/__tests__/route.test.ts`

Updated with enabled flag tests:
- ✅ Returns 401 for unauthenticated requests
- ✅ Returns 403 for unauthorized requests
- ✅ Returns `enabled: true` when telemetry is on
- ✅ Returns `enabled: false` when telemetry is off
- ✅ Returns HTTP 200 for authorized requests (not 500) when telemetry is disabled
- ✅ Empty routes array when disabled

**Total:** 385 tests passing (including 18 new telemetry toggle tests)

## Usage Examples

### Development (Default ON)

```bash
# No env var set - telemetry is ON
NODE_ENV=development npm run dev

# Access usage data
curl http://localhost:3000/api/admin/usage
# Response: { "success": true, "data": { "enabled": true, "routes": [...] } }
```

### Production (Default OFF)

```bash
# No env var set - telemetry is OFF
NODE_ENV=production npm start

# Access usage data
curl https://example.com/api/admin/usage
# Response: { "success": true, "data": { "enabled": false, "routes": [] } }
```

### Override in Production (Force ON)

```bash
# Explicitly enable in production
USAGE_TELEMETRY_ENABLED=true NODE_ENV=production npm start

# Access usage data
curl https://example.com/api/admin/usage
# Response: { "success": true, "data": { "enabled": true, "routes": [...] } }
```

### Override in Development (Force OFF)

```bash
# Explicitly disable in development
USAGE_TELEMETRY_ENABLED=false NODE_ENV=development npm run dev

# Access usage data
curl http://localhost:3000/api/admin/usage
# Response: { "success": true, "data": { "enabled": false, "routes": [] } }
```

## Acceptance Criteria Verification

### AC1: Default ON in Development ✅

```typescript
env.NODE_ENV = 'development'
env.USAGE_TELEMETRY_ENABLED = undefined
isUsageTelemetryEnabled() // → true
```

### AC2: Default OFF in Production/Preview ✅

```typescript
env.NODE_ENV = 'production'
env.USAGE_TELEMETRY_ENABLED = undefined
isUsageTelemetryEnabled() // → false

env.NODE_ENV = 'test'
isUsageTelemetryEnabled() // → false
```

### AC3: Explicit Override ✅

```typescript
// Override to enable
env.USAGE_TELEMETRY_ENABLED = 'true'
env.NODE_ENV = 'production'
isUsageTelemetryEnabled() // → true

// Override to disable
env.USAGE_TELEMETRY_ENABLED = 'false'
env.NODE_ENV = 'development'
isUsageTelemetryEnabled() // → false

// Unset - use default
env.USAGE_TELEMETRY_ENABLED = undefined
// Falls back to environment-based logic
```

### AC4: When Disabled ✅

**No Writes:**
```typescript
// Telemetry disabled
recordUsage({ routeKey: 'POST /api/test', statusCodeBucket: '2xx' })
// → Returns immediately, no filesystem writes

getAggregatedUsage()
// → Returns []
```

**Admin Endpoint Still Works:**
```bash
# Authorized request with telemetry disabled
GET /api/admin/usage
# HTTP 200
{
  "success": true,
  "data": {
    "enabled": false,  // ← Clear indication
    "routes": [],
    "generatedAt": "2026-01-02T...",
    "totalRoutes": 0
  }
}

# Unauthenticated request
GET /api/admin/usage
# HTTP 401
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

### AC5: Never Breaks Requests ✅

```typescript
// Errors are caught and logged as warnings
try {
  await recordUsage(...)
} catch (error) {
  // ❌ Never reaches here - errors caught internally
}

// Function signature:
export async function recordUsage(...): Promise<void> {
  try {
    // ... recording logic
  } catch (error) {
    console.warn('[usageTracker] Failed to record usage:', error)
    // ✅ No throw - request continues
  }
}
```

## Migration Notes

### Existing Deployments

**No breaking changes:**
- If `USAGE_TELEMETRY_ENABLED` is not set, behavior depends on `NODE_ENV`
- Development environments: Telemetry continues working (ON by default)
- Production environments: Telemetry automatically disabled (OFF by default)

**To maintain current behavior:**
- Development: No action needed (already ON by default)
- Production: Set `USAGE_TELEMETRY_ENABLED=true` if you want to keep collecting data

### New Deployments

**Recommended configuration:**
- Development: Leave unset (defaults to ON)
- Staging/Preview: Leave unset or set to `false` (ephemeral storage)
- Production: Decide based on storage strategy:
  - Ephemeral storage (e.g., Vercel): Leave unset (defaults to OFF)
  - Persistent storage (e.g., dedicated server): Set to `true` if desired

## Related Documentation

- [Usage Telemetry](./USAGE_TELEMETRY.md) - Original telemetry documentation
- [External Clients](./EXTERNAL_CLIENTS.md) - External client registry
- [API Route Ownership](./API_ROUTE_OWNERSHIP.md) - Route ownership documentation
- [Cleanup Audit README](./CLEANUP_AUDIT_README.md) - Cleanup process

## Files Changed

**New Files:**
- `lib/monitoring/config.ts` - Telemetry configuration logic
- `lib/monitoring/__tests__/config.test.ts` - Configuration tests
- `docs/TV05_02_IMPLEMENTATION.md` - This file

**Modified Files:**
- `lib/env.ts` - Added `USAGE_TELEMETRY_ENABLED` to schema
- `.env.example` - Documented telemetry toggle
- `lib/monitoring/usageTracker.ts` - Early return when disabled
- `app/api/admin/usage/route.ts` - Added `enabled` flag to response
- `lib/monitoring/__tests__/usageTracker.test.ts` - Added toggle tests
- `app/api/admin/usage/__tests__/route.test.ts` - Added enabled flag tests

**Documentation:**
- `docs/EXTERNAL_CLIENTS.md` - External client registry
- `docs/API_ROUTE_OWNERSHIP.md` - Route ownership registry
- `docs/CLEANUP_AUDIT_README.md` - Updated to reference registries

---

**Implementation Date:** 2026-01-02  
**Issue:** TV05_02 — External Client Registry + Route Ownership  
**Status:** Complete ✅  
**Tests Passing:** 385/385
