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

**Success (200 OK)**:

```json
{
  "success": true,
  "data": {
    "checks": [
      {
        "name": "NEXT_PUBLIC_SUPABASE_URL",
        "pass": true,
        "message": "Valid URL format"
      },
      {
        "name": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "pass": true,
        "message": "Valid key format"
      },
      {
        "name": "SUPABASE_SERVICE_ROLE_KEY",
        "pass": true,
        "message": "Valid key format"
      },
      {
        "name": "Database Connectivity",
        "pass": true,
        "message": "Successfully connected to database"
      }
    ],
    "overallStatus": "pass",
    "timestamp": "2026-01-02T18:43:14.296Z"
  }
}
```

**Failure Example (200 OK with failed checks)**:

```json
{
  "success": true,
  "data": {
    "checks": [
      {
        "name": "NEXT_PUBLIC_SUPABASE_URL",
        "pass": false,
        "message": "Contains leading/trailing whitespace"
      },
      {
        "name": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "pass": false,
        "message": "Invalid key format (expected long alphanumeric string)"
      },
      {
        "name": "SUPABASE_SERVICE_ROLE_KEY",
        "pass": false,
        "message": "Missing service role key (required for admin operations)"
      },
      {
        "name": "Database Connectivity",
        "pass": false,
        "message": "Database query failed: Connection refused"
      }
    ],
    "overallStatus": "fail",
    "timestamp": "2026-01-02T18:43:14.296Z"
  }
}
```

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

The endpoint performs a simple database query to verify connectivity:

```typescript
const { error } = await supabase.from('funnels').select('id', { count: 'exact', head: true })
```

This query:

- Uses the `funnels` table (no PHI)
- Performs a `head` request (doesn't return data, just checks existence)
- Verifies both authentication and database connectivity

### Security Features

#### Secret Redaction

The endpoint **never** includes actual environment variable values in responses. All checks return only:

- Check name
- Pass/fail status
- Generic diagnostic message

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

1. **Database connectivity failures**: Captured and reported as failed check (not a 500 error)
2. **Unexpected errors**: Caught and returned as 500 with generic error message
3. **Authentication failures**: Return appropriate 401/403 responses

## Testing

### Test Coverage

The test suite (`route.test.ts`) covers:

1. **Authentication & Authorization**
   - 401 for unauthenticated users
   - 403 for non-admin/non-clinician users

2. **Environment Checks**
   - All checks pass with valid environment
   - Database connectivity check is included

3. **Secret Redaction**
   - No actual secret values in responses
   - Only allowed fields (name, pass, message) in checks

4. **Failure Scenarios**
   - Database connectivity issues
   - Database connectivity exceptions

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
