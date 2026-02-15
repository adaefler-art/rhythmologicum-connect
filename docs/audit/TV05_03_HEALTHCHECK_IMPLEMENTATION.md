# TV05_03: Environment Self-Check Healthcheck Endpoint

## Overview

This document describes the implementation of the environment self-check healthcheck endpoint (`/api/health/env`), which provides deterministic diagnostics for environment configuration issues.

## Problem Statement

Error messages like "Invalid API key" can lead to 500 errors and are difficult to debug. Database cleanup operations don't resolve environment configuration issues. A deterministic environment self-check dramatically reduces diagnosis time.

## Solution

The `/api/health/env` endpoint provides a comprehensive, admin-only health check that validates:

1. **Environment Variable Presence**: Ensures all required variables are set
2. **Format Validation**: Validates URL format, key format, etc.
3. **Whitespace Detection**: Catches common copy/paste errors with leading/trailing spaces
4. **Database Connectivity**: Optional check to verify database access (no PHI)

## Endpoint Specification

### Request

```
GET /api/health/env
```

**Authentication**: Required (401 if not authenticated)  
**Authorization**: Admin or Clinician role required (403 if unauthorized)

### Response

**Success - All Checks Pass (200 OK)**:

```json
{
  "success": true,
  "data": {
    "healthcheckVersion": "1.0.0",
    "status": "GREEN",
    "checks": [
      {
        "name": "NEXT_PUBLIC_SUPABASE_URL",
        "ok": true,
        "message": "Valid URL format"
      },
      {
        "name": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "ok": true,
        "message": "Valid key format"
      },
      {
        "name": "SUPABASE_SERVICE_ROLE_KEY",
        "ok": true,
        "message": "Valid key format"
      },
      {
        "name": "Database Connectivity",
        "ok": true,
        "message": "Successfully connected to database"
      }
    ],
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-01-02T19:00:00.000Z"
  }
}
```

**Failure Example (200 OK with RED status)**:

```json
{
  "success": true,
  "data": {
    "healthcheckVersion": "1.0.0",
    "status": "RED",
    "checks": [
      {
        "name": "NEXT_PUBLIC_SUPABASE_URL",
        "ok": false,
        "message": "Contains leading/trailing whitespace",
        "hint": "Remove spaces before/after the URL value"
      },
      {
        "name": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "ok": false,
        "message": "Invalid key format",
        "hint": "Expected long alphanumeric string (JWT-like format)"
      },
      {
        "name": "SUPABASE_SERVICE_ROLE_KEY",
        "ok": false,
        "message": "Missing service role key",
        "hint": "Required for admin operations - set from Supabase dashboard"
      },
      {
        "name": "Database Connectivity",
        "ok": false,
        "message": "Schema drift detected",
        "hint": "Table \"pillars\" does not exist - run migrations or verify schema"
      }
    ],
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-01-02T19:00:00.000Z"
  }
}
```

**Note**: The endpoint returns HTTP 200 even with RED status for fail-safe behavior. Only authentication (401) and authorization (403) errors return non-200 status codes.

**Unauthorized (401)**:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentifizierung fehlgeschlagen. Bitte melden Sie sich an."
  }
}
```

**Forbidden (403)**:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Sie haben keine Berechtigung für diese Aktion."
  }
}
```

## Implementation Details

### File Structure

```
app/api/health/env/
├── route.ts              # Endpoint implementation
└── __tests__/
    └── route.test.ts     # Comprehensive test suite
```

### Environment Variables Checked

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Presence check: Must be defined
   - Format check: Must be valid URL
   - Whitespace check: No leading/trailing spaces

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Presence check: Must be defined
   - Format check: Must be long alphanumeric string (20+ chars)
   - Whitespace check: No leading/trailing spaces

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Presence check: Must be defined
   - Format check: Must be long alphanumeric string (20+ chars)
   - Whitespace check: No leading/trailing spaces

### Database Connectivity Check

The endpoint performs a simple database query to verify connectivity using the canonical v0.5.x schema:

```typescript
const { error } = await supabase.from('pillars').select('id').limit(1)
```

This query:
- Uses the `pillars` table (canonical, non-PHI taxonomic table)
- Performs a minimal query (just selects id, limit 1)
- Verifies authentication, database connectivity, and schema state

#### Error Detection

The check specifically detects:

1. **Schema Drift (42P01)**: Relation does not exist
   - Returns: `"Schema drift detected"` 
   - Hint: Run migrations or verify schema

2. **Invalid API Key (42501)**: Permission denied
   - Returns: `"Authentication/permission error"`
   - Hint: Check API key credentials

3. **Generic Errors**: Network, connection, etc.
   - Returns specific error message in hint field

### Fail-Safe Behavior

**Important**: The endpoint returns HTTP 200 with RED status for expected failure states instead of 500 errors. This ensures:
- Structured error information is always available
- Healthcheck tooling doesn't falsely report the endpoint as down
- Clients can programmatically distinguish between different failure types

Only authentication (401) and authorization (403) errors return non-200 status codes.

### Security Features

#### Secret Redaction

The endpoint **never** includes actual environment variable values in responses. All checks return only:
- Check name
- Pass/fail status (`ok` field)
- Generic diagnostic message
- Optional hint (on failure)

Example of what is **NOT** included:
- Actual URL values
- Actual API keys
- Any sensitive configuration data

#### Authentication & Authorization

- **Step 1**: User must be authenticated (checked via `getCurrentUser()`)
- **Step 2**: User must have admin or clinician role (checked via `hasAdminOrClinicianRole()`)
- **Both checks required**: Endpoint returns 401 or 403 if either check fails

### Error Handling

The endpoint gracefully handles errors:

1. **Database connectivity failures**: Captured and reported as failed check with RED status (not a 500 error)
2. **Unexpected errors**: Caught and returned as 200 with RED status and error details
3. **Authentication failures**: Return appropriate 401/403 responses

## Testing

### Test Coverage

The test suite (`route.test.ts`) covers:

1. **Authentication & Authorization**
   - 401 for unauthenticated users
   - 403 for non-admin/non-clinician users

2. **Environment Checks**
   - GREEN status when all checks pass
   - Uses pillars table for database connectivity check

3. **Secret Redaction**
   - No actual secret values in responses
   - Fields include name, ok (boolean), message, and optional hint

4. **Failure Scenarios**
   - Schema drift detection (42P01: relation does not exist)
   - Invalid API key detection (42501: permission denied)
   - Generic database errors
   - Connection exceptions
   - Missing environment configuration

5. **Response Structure**
   - Correct JSON structure with healthcheckVersion
   - Valid UUID for requestId
   - Valid ISO 8601 timestamp format

6. **Fail-Safe Behavior**
   - Returns 200 + RED status for unexpected errors (not 500)

### Test Results

All 15 tests pass (was 12 tests in original implementation):
- ✓ Authentication and Authorization (2 tests)
- ✓ Environment Checks (2 tests)
- ✓ Secret Redaction (2 tests)
- ✓ Failure Scenarios (5 tests)
- ✓ Response Structure (3 tests)
- ✓ Fail-Safe Behavior (1 test)

5. **Response Structure**
   - Correct JSON structure
   - All required fields present
   - Valid timestamp format

6. **Error Handling**
   - Graceful handling of internal errors

### Running Tests

```bash
# Run health endpoint tests only
npm test -- app/api/health/env/__tests__/route.test.ts

# Run all tests
npm test
```

### Test Results

All 12 tests pass:

- ✓ Authentication and Authorization (2 tests)
- ✓ Environment Checks (2 tests)
- ✓ Secret Redaction (2 tests)
- ✓ Failure Scenarios (2 tests)
- ✓ Response Structure (3 tests)
- ✓ Error Handling (1 test)

## Usage Examples

### PowerShell (Windows)

```powershell
# With authentication token
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
Invoke-RestMethod -Uri "https://your-app.com/api/health/env" -Headers $headers
```

### cURL (Unix/macOS)

```bash
# With authentication token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-app.com/api/health/env
```

### JavaScript/TypeScript

```typescript
const response = await fetch('/api/health/env', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
const data = await response.json()

if (data.success && data.data.overallStatus === 'pass') {
  console.log('All environment checks passed!')
} else {
  console.error('Environment issues detected:', data.data.checks)
}
```

## Acceptance Criteria

All acceptance criteria have been met:

- ✅ **401/403 handling**: Correctly returns 401 for unauthenticated and 403 for non-admin users
- ✅ **JSON output**: Returns structured checks array with pass/fail and messages
- ✅ **No secrets exposed**: Responses never include actual environment variable values
- ✅ **Concrete failure hints**: Messages indicate specific issues (missing, invalid format, whitespace)
- ✅ **Tests for gating + redaction**: Comprehensive test suite validates all requirements

## Verification

```bash
# Run tests
npm test

# Run build
npm run build
```

Both commands should complete successfully.

## Future Enhancements

Potential improvements for future iterations:

1. **Additional checks**:
   - Anthropic API key format validation
   - Feature flag validation
   - Database migration status

2. **Performance metrics**:
   - Response time for database connectivity
   - Environment variable read latency

3. **Historical tracking**:
   - Log health check results over time
   - Alert on repeated failures

4. **Extended diagnostics**:
   - Database schema version check
   - RLS policy verification
   - API quota/rate limit status

## References

- Issue: TV05_03_HEALTHCHECK
- Related files:
  - `app/api/health/env/route.ts`
  - `app/api/health/env/__tests__/route.test.ts`
  - `lib/api/authHelpers.ts`
  - `lib/api/responses.ts`
  - `lib/env.ts`
