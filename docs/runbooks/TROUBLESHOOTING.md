# Troubleshooting Guide

**Version:** 1.0  
**Status:** Active  
**Scope:** System-wide error diagnostics  
**Last Updated:** 2026-02-04

---

## Overview

This guide provides diagnostic procedures for common error types in Rhythmologicum Connect. All errors follow a standardized format with error codes for quick diagnosis.

**Error Code Format:** `{CATEGORY}_ERROR`

**Guardrail Rule Format:** Errors may reference violated rules with ID: `R-{DOMAIN}-{NUMBER}`

---

## Error Categories

1. **VALIDATION_ERROR** - Input validation failures
2. **AUTH_ERROR** - Authentication/authorization failures
3. **LLM_ERROR** - LLM API errors (MCP server)
4. **NOT_FOUND_ERROR** - Resource not found
5. **INTERNAL_ERROR** - Unexpected server errors
6. **DB_ERROR** - Database access errors
7. **NETWORK_ERROR** - External service connectivity

---

## VALIDATION_ERROR

### Description

Input data failed schema validation (Zod validation errors).

### Common Causes

1. Missing required fields
2. Incorrect data types (string instead of number)
3. Invalid UUID format
4. Out-of-range values
5. Unknown/extra fields

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": {
      "field": "patient_id",
      "received": "not-a-uuid",
      "expected": "UUID v4 format",
      "zodErrors": [...]
    },
    "rule_id": "R-E76.9-002"
  }
}
```

### Diagnostic Steps

1. **Check the `details` field** for specific validation failures
2. **Review the schema** (ARTIFACT_SCHEMA_V1.md) for expected format
3. **Verify input data** matches schema exactly
4. **Check for typos** in field names (case-sensitive)
5. **Remove extra fields** not in schema (strict mode)

### Example: Invalid UUID

**Error:**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid patient_id",
  "details": {
    "field": "patient_id",
    "received": "123",
    "expected": "UUID v4 format (e.g., 123e4567-e89b-12d3-a456-426614174000)"
  }
}
```

**Fix:**
```typescript
// ❌ Wrong
const input = { patient_id: '123' }

// ✅ Correct
const input = { patient_id: '123e4567-e89b-12d3-a456-426614174000' }
```

### Example: Missing Required Field

**Error:**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Missing required field: patient_id",
  "details": {
    "field": "patient_id",
    "issue": "required"
  }
}
```

**Fix:**
```typescript
// ❌ Wrong
const input = {}

// ✅ Correct
const input = { patient_id: '123e4567-e89b-12d3-a456-426614174000' }
```

### Example: Wrong Type

**Error:**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid type for confidence_score",
  "details": {
    "field": "confidence_score",
    "received": "0.75",
    "expected": "number"
  }
}
```

**Fix:**
```typescript
// ❌ Wrong (string)
const result = { confidence_score: "0.75" }

// ✅ Correct (number)
const result = { confidence_score: 0.75 }
```

### Prevention

- Use TypeScript types inferred from Zod schemas
- Validate early in request lifecycle
- Test with invalid inputs
- Document expected formats clearly

### Related

- **Schema Reference:** `docs/runbooks/ARTIFACT_SCHEMA_V1.md`
- **Rule:** R-E76.9-002 (Input validation required for all API endpoints)

---

## AUTH_ERROR

### Description

Authentication or authorization failure.

### Common Causes

1. No session token (user not logged in)
2. Expired session token
3. Invalid/corrupted session token
4. Insufficient permissions (wrong role)
5. Not assigned to patient (clinician access)
6. Cross-organization access attempt

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "AUTH_ERROR",
    "message": "Not authenticated",
    "details": {
      "reason": "no_session",
      "required_role": "clinician"
    }
  }
}
```

### HTTP Status Codes

- **401 Unauthorized** - Not authenticated (no session)
- **403 Forbidden** - Authenticated but insufficient permissions

### Subtypes

#### 1. Not Authenticated (401)

**Error:**
```json
{
  "code": "AUTH_ERROR",
  "message": "Not authenticated",
  "details": { "reason": "no_session" }
}
```

**Diagnostic:**
```bash
# Check session cookies
curl -v http://localhost:3000/api/endpoint

# Look for sb-access-token and sb-refresh-token cookies
```

**Fix:**
- User must log in
- Verify cookies are being sent
- Check cookie domain/path settings
- Verify HTTPS (cookies may be restricted)

#### 2. Expired Session (401)

**Error:**
```json
{
  "code": "AUTH_ERROR",
  "message": "Session expired",
  "details": { "reason": "token_expired" }
}
```

**Fix:**
- Refresh token automatically (should happen via Supabase)
- If refresh fails, user must log in again
- Check session expiry settings (default: 1 hour)

#### 3. Wrong Role (403)

**Error:**
```json
{
  "code": "AUTH_ERROR",
  "message": "Insufficient permissions",
  "details": {
    "reason": "wrong_role",
    "required_role": "clinician",
    "user_role": "patient"
  }
}
```

**Diagnostic:**
```typescript
// Check user role
const { data: { user } } = await supabase.auth.getUser()
console.log('User role:', user?.app_metadata?.role)
```

**Fix:**
- Verify user has correct role in database
- Contact admin to assign correct role
- Check if endpoint requires specific role

#### 4. Not Assigned (403)

**Error:**
```json
{
  "code": "AUTH_ERROR",
  "message": "Not assigned to this patient",
  "details": {
    "reason": "no_assignment",
    "clinician_id": "clinician-uuid",
    "patient_id": "patient-uuid"
  }
}
```

**Diagnostic:**
```sql
-- Check assignments
SELECT * FROM clinician_patient_assignments
WHERE clinician_user_id = 'clinician-uuid'
  AND patient_user_id = 'patient-uuid';
```

**Fix:**
- Admin must create assignment
- Verify patient exists
- Check organization matches

#### 5. Cross-Organization (403)

**Error:**
```json
{
  "code": "AUTH_ERROR",
  "message": "Access denied: different organization",
  "details": {
    "reason": "cross_org_access",
    "user_org": "org-a-uuid",
    "resource_org": "org-b-uuid"
  }
}
```

**Fix:**
- Users cannot access data from other organizations
- This is by design (multi-tenant isolation)
- Contact admin if organization assignment is wrong

### Prevention

- Always check auth before processing requests
- Use server-side auth checks (never trust client)
- Implement session refresh logic
- Log all auth failures for monitoring

### Related

- **Security Model:** `docs/runbooks/SECURITY_MODEL.md`
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth

---

## LLM_ERROR

### Description

Error calling LLM (Large Language Model) API - Anthropic Claude.

### Common Causes

1. Invalid API key
2. Rate limit exceeded
3. LLM API timeout
4. Invalid prompt/parameters
5. Content policy violation

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "LLM_ERROR",
    "message": "LLM API call failed",
    "details": {
      "reason": "rate_limit_exceeded",
      "llm_status": 429,
      "llm_message": "Too many requests"
    }
  }
}
```

### Subtypes

#### 1. Invalid API Key

**Error:**
```json
{
  "code": "LLM_ERROR",
  "message": "Invalid LLM API key",
  "details": { "llm_status": 401 }
}
```

**Diagnostic:**
```bash
# Check if API key is set
echo $LLM_API_KEY

# Verify key format (should start with sk-ant-)
# Note: actual key will be redacted in logs
```

**Fix:**
- Set correct `LLM_API_KEY` in environment
- Verify key is active (not revoked)
- Check key permissions (should allow Claude API access)

#### 2. Rate Limit

**Error:**
```json
{
  "code": "LLM_ERROR",
  "message": "Rate limit exceeded",
  "details": {
    "llm_status": 429,
    "retry_after": 60
  }
}
```

**Fix:**
- Wait before retrying (see `retry_after` seconds)
- Implement exponential backoff
- Reduce request frequency
- Consider upgrading API tier

**Prevention:**
- Implement request queue
- Add rate limiting at application level
- Cache LLM responses when appropriate

#### 3. Timeout

**Error:**
```json
{
  "code": "LLM_ERROR",
  "message": "LLM API timeout",
  "details": {
    "timeout_ms": 30000,
    "reason": "llm_timeout"
  }
}
```

**Fix:**
- Increase timeout setting
- Simplify prompt (shorter input)
- Check network connectivity
- Retry with exponential backoff

**Configuration:**
```typescript
const response = await fetch('https://api.anthropic.com/v1/...', {
  signal: AbortSignal.timeout(60000)  // 60 second timeout
})
```

#### 4. Content Policy Violation

**Error:**
```json
{
  "code": "LLM_ERROR",
  "message": "Content policy violation",
  "details": {
    "llm_status": 400,
    "reason": "content_filtered"
  }
}
```

**Fix:**
- Review input for inappropriate content
- Sanitize user input before sending to LLM
- Check if medical terminology is being flagged
- Contact Anthropic support if false positive

#### 5. Invalid Parameters

**Error:**
```json
{
  "code": "LLM_ERROR",
  "message": "Invalid LLM parameters",
  "details": {
    "llm_status": 400,
    "parameter": "max_tokens",
    "issue": "Must be between 1 and 100000"
  }
}
```

**Fix:**
- Review LLM API documentation
- Validate parameters before API call
- Use recommended defaults
- Check model capabilities

### Monitoring

```typescript
// Log all LLM errors for analysis
logger.error({
  event: 'llm_error',
  error_code: error.code,
  llm_status: error.details.llm_status,
  model: 'claude-3-opus',
  prompt_length: promptLength,
})
```

### Related

- **Anthropic API Docs:** https://docs.anthropic.com/
- **MCP Server:** `packages/mcp-server/src/handlers.ts`

---

## NOT_FOUND_ERROR

### Description

Requested resource does not exist or is not accessible.

### Common Causes

1. Invalid UUID (resource doesn't exist)
2. Resource deleted
3. User doesn't have permission (RLS filtered it out)
4. Wrong organization

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND_ERROR",
    "message": "Patient not found",
    "details": {
      "entity_type": "patient",
      "entity_id": "patient-uuid"
    }
  }
}
```

### HTTP Status Code

- **404 Not Found**

### Diagnostic Steps

1. **Verify UUID is correct** (check for typos)
2. **Check if resource exists in database**
3. **Verify RLS policies** (may be filtering result)
4. **Check organization** (cross-org access blocked)
5. **Check if deleted** (soft delete flag)

### Example Diagnostic

```sql
-- Check if patient exists
SELECT * FROM patient_profiles WHERE id = 'patient-uuid';

-- Check if current user can see it (RLS)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid"}';
SELECT * FROM patient_profiles WHERE id = 'patient-uuid';
```

### 404 vs 403

**When to use 404:**
- Resource doesn't exist at all
- User doesn't have permission (to avoid information disclosure)

**When to use 403:**
- User is authenticated
- Resource exists
- User lacks permission AND it's safe to disclose existence

**Recommendation:** Use 404 for patient data (don't reveal if patient exists)

### Related

- **Security Model:** `docs/runbooks/SECURITY_MODEL.md` (Information Disclosure)

---

## INTERNAL_ERROR

### Description

Unexpected server error (catch-all for unhandled errors).

### Common Causes

1. Unhandled exception
2. Database connection failure
3. Configuration error
4. Missing environment variable
5. File system error

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": {
      "error_id": "err_abc123"
    }
  }
}
```

### HTTP Status Code

- **500 Internal Server Error**

### Diagnostic Steps

1. **Check server logs** for stack trace
2. **Look for error_id** in logs to find details
3. **Verify environment variables** are set
4. **Check database connectivity**
5. **Review recent code changes**

### Prevention

```typescript
// Always catch and handle errors
try {
  const result = await riskyOperation()
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  // Log error with details
  logger.error({
    event: 'internal_error',
    error_id: generateErrorId(),
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  })
  
  // Return generic error (don't leak details)
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: { error_id: errorId }
    }
  }, { status: 500 })
}
```

### Related

- **Logging:** `packages/mcp-server/src/logger.ts`

---

## DB_ERROR

### Description

Database access error (Supabase/PostgreSQL errors).

### Common Causes

1. Connection timeout
2. Query timeout
3. Constraint violation
4. RLS policy blocked operation
5. Database unavailable

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "DB_ERROR",
    "message": "Database operation failed",
    "details": {
      "db_code": "23505",
      "db_message": "duplicate key value violates unique constraint",
      "constraint": "unique_email"
    }
  }
}
```

### Common PostgreSQL Error Codes

- **23505** - Unique constraint violation
- **23503** - Foreign key violation
- **23502** - Not null violation
- **42P01** - Table does not exist
- **42703** - Column does not exist
- **PGRST116** - RLS policy violation (Supabase-specific)

### Example: Unique Constraint

**Error:**
```json
{
  "code": "DB_ERROR",
  "message": "Email already exists",
  "details": {
    "db_code": "23505",
    "constraint": "users_email_key"
  }
}
```

**Fix:**
- Check if email already exists before insert
- Handle duplicate error gracefully
- Return user-friendly message

### Example: RLS Violation (PGRST116)

**Error:**
```json
{
  "code": "DB_ERROR",
  "message": "Row level security policy violation",
  "details": {
    "db_code": "PGRST116",
    "hint": "Check RLS policies"
  }
}
```

**Diagnostic:**
```sql
-- Check RLS policies on table
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid"}';
SELECT * FROM your_table;
```

**Fix:**
- Verify user has necessary permissions
- Check assignment exists (for clinician access)
- Verify organization matches
- Review RLS policy definition

### Prevention

- Use Supabase client (handles connection pooling)
- Add proper indexes (avoid slow queries)
- Set reasonable timeouts
- Handle constraint violations explicitly

### Related

- **Supabase Error Codes:** https://postgrest.org/en/stable/errors.html
- **Security Model:** `docs/runbooks/SECURITY_MODEL.md` (RLS section)

---

## NETWORK_ERROR

### Description

Failed to connect to external service.

### Common Causes

1. Service unavailable
2. Network timeout
3. DNS resolution failure
4. Firewall blocking connection
5. Invalid URL

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "NETWORK_ERROR",
    "message": "Failed to connect to MCP server",
    "details": {
      "url": "http://localhost:3001",
      "reason": "ECONNREFUSED"
    }
  }
}
```

### Common Network Error Codes

- **ECONNREFUSED** - Connection refused (service not running)
- **ETIMEDOUT** - Connection timeout
- **ENOTFOUND** - DNS lookup failed
- **ECONNRESET** - Connection reset by peer

### Diagnostic Steps

1. **Verify service is running:**
```bash
# Check if MCP server is running
curl http://localhost:3001/health

# Check process
ps aux | grep mcp-server
```

2. **Check connectivity:**
```bash
# Test network connection
ping localhost
telnet localhost 3001
```

3. **Verify environment variables:**
```bash
echo $MCP_SERVER_URL
# Should be: http://localhost:3001
```

4. **Check firewall:**
```bash
# Check if port is open
sudo lsof -i :3001
```

### Fix

- Start the service if not running
- Verify URL/port in environment
- Check firewall rules
- Increase timeout if service is slow

### Related

- **MCP Server Runbook:** `docs/runbooks/MCP_SERVER.md`

---

## Error Code to Rule ID Mapping

Some errors reference specific guardrail rules that were violated:

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| VALIDATION_ERROR | R-E76.9-002 | Input validation required |
| AUTH_ERROR | R-API-001 | Critical API handlers must exist |
| MCP_PACKAGE_MISSING | R-E76.1-001 | MCP package structure |
| MCP_TOOLS_SCHEMA_MISSING | R-E76.1-002 | Tool schemas required |
| MCP_API_ROUTE_MISSING | R-E76.1-006 | API route must exist |
| MCP_LITERAL_CALLSITE_MISSING | R-E76.1-007 | Literal callsite required |

### Viewing Rule Details

```bash
# Find rule in matrix
grep "R-E76.9-002" docs/guardrails/RULES_VS_CHECKS_MATRIX.md
```

---

## Logging Best Practices

### Structured Logging

```typescript
import { logger } from '@/lib/logger'

// ✅ Good - structured
logger.error({
  event: 'validation_error',
  error_code: 'VALIDATION_ERROR',
  field: 'patient_id',
  user_id: user.id,
})

// ❌ Bad - unstructured
console.log('Error: validation failed for patient_id')
```

### Correlation IDs

```typescript
// Generate correlation ID for request tracing
const correlationId = generateCorrelationId()

logger.info({
  event: 'request_start',
  correlation_id: correlationId,
  path: request.url,
})

// Pass to all downstream calls
await fetch('/api/mcp', {
  headers: { 'X-Correlation-ID': correlationId }
})
```

### What to Log

**DO log:**
- Error codes and messages
- User IDs (UUIDs, not PII)
- Timestamps
- Request paths
- Correlation IDs
- Error IDs

**DON'T log:**
- Passwords or API keys
- Session tokens
- PII (names, emails, addresses)
- PHI (medical data)

---

## Getting Help

### Check Documentation

1. **This guide** - Common errors and fixes
2. **Security Model** - Auth/access issues
3. **MCP Server Runbook** - MCP-specific issues
4. **Artifact Schema** - Validation errors
5. **Rules Matrix** - Guardrail violations

### Search Logs

```bash
# Search for error code
grep "VALIDATION_ERROR" logs/app.log

# Search for correlation ID
grep "correlation_id.*abc123" logs/app.log

# Search for user actions
grep "user_id.*user-uuid" logs/app.log
```

### Contact Support

Include in bug report:
- Error code
- Full error message
- Correlation ID (if available)
- Steps to reproduce
- User role and organization
- Timestamp of error

---

## References

- **MCP Server:** `docs/runbooks/MCP_SERVER.md`
- **Security Model:** `docs/runbooks/SECURITY_MODEL.md`
- **Artifact Schema:** `docs/runbooks/ARTIFACT_SCHEMA_V1.md`
- **Rules Matrix:** `docs/guardrails/RULES_VS_CHECKS_MATRIX.md`

---

**Troubleshooting Guide Version:** 1.0  
**Author:** GitHub Copilot  
**Epic:** E76.9 — Docs & Developer Runbook
