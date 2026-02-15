# V061-I01: PGRST116 Error Mapping Guide

## Problem Statement

When using Supabase/PostgREST's `.single()` method, a query that returns 0 rows produces a **PGRST116** error:

```
{
  code: 'PGRST116',
  message: 'JSON object requested, multiple (or no) rows returned'
}
```

**This is NOT a database failure** - it's a normal "resource not found" condition and should map to **HTTP 404**, not HTTP 500.

## Solution

We've created a centralized helper function: `isNotFoundPostgrestError(error)`

### Location
`lib/db/errors.ts`

### Signature
```typescript
export function isNotFoundPostgrestError(error: unknown): boolean
```

### Returns
- `true` - Error represents "not found" (0 rows) → should return **HTTP 404**
- `false` - Error is a real database failure → should return **HTTP 500**

## Usage Pattern

### ✅ Correct Pattern (V061-I01)

```typescript
import { isNotFoundPostgrestError } from '@/lib/db/errors'
import { notFoundResponse, databaseErrorResponse } from '@/lib/api/responses'

const { data, error } = await supabase
  .from('assessments')
  .select('*')
  .eq('id', assessmentId)
  .single()

if (error) {
  // Step 1: Check for "not found" FIRST
  if (isNotFoundPostgrestError(error)) {
    return notFoundResponse('Assessment', 'Assessment nicht gefunden.')
  }
  
  // Step 2: Handle real DB errors
  const classified = classifySupabaseError(error)
  if (classified.kind === 'SCHEMA_NOT_READY') {
    return schemaNotReadyResponse()
  }
  if (classified.kind === 'AUTH_OR_RLS') {
    return forbiddenResponse()
  }
  
  // Default: internal error
  return databaseErrorResponse()
}

if (!data) {
  // Null data without error is also not-found
  return notFoundResponse('Assessment', 'Assessment nicht gefunden.')
}

// Success case
return successResponse(data)
```

### ❌ Old Pattern (Ad-hoc PGRST116 checks)

```typescript
// DON'T DO THIS - inconsistent, error-prone
if (error) {
  if (error.code === 'PGRST116') {  // ❌ Ad-hoc check
    return notFoundResponse('Assessment')
  }
  return databaseErrorResponse()
}
```

## Why This Matters

### Before (Wrong Behavior)
```
GET /api/funnels/stress/assessments/non-existent-id
→ 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",  // ❌ Wrong!
    "message": "Datenbankfehler"
  }
}
```

### After (Correct Behavior)
```
GET /api/funnels/stress/assessments/non-existent-id
→ 404 Not Found
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",  // ✅ Correct!
    "message": "Assessment nicht gefunden"
  }
}
```

## Detection Logic

The helper detects "not found" conditions via:

1. **Primary: Error code**
   - `PGRST116` - PostgREST cannot coerce to single result (0 rows)

2. **Defensive: Message patterns** (case-insensitive)
   - `"no rows"`
   - `"0 rows returned"`
   - `"JSON object requested ... no ... rows"`

## What It Does NOT Detect (Real Errors)

These correctly return `false` and should map to HTTP 500:

- **Connection errors**: `08000`, `08003`, `08006`
- **RLS violations**: `PGRST301`, `PGRST302`, `42501`
- **Schema errors**: `42P01`, `42703`, `PGRST205`
- **Constraint violations**: `23505`, `23503`
- **Timeouts**: message contains "timeout"
- **Any other PostgREST error codes**

## Logging Best Practices

```typescript
import { logNotFound, logDatabaseError } from '@/lib/logging/logger'

if (error) {
  if (isNotFoundPostgrestError(error)) {
    // Use logNotFound (warn level) - this is expected/normal
    logNotFound('Assessment', { assessmentId, userId })
    return notFoundResponse('Assessment')
  }
  
  // Use logDatabaseError (error level) - this is unexpected
  logDatabaseError({ operation: 'get_assessment', userId }, error)
  return databaseErrorResponse()
}
```

**Key Points:**
- ✅ Not-found → `logNotFound()` or `logWarn()` - normal operation
- ✅ Real DB error → `logDatabaseError()` or `logError()` - needs investigation
- ❌ Never log PHI/PII (patient names, answers, medical data)

## Testing

### Unit Tests
See `lib/db/__tests__/errors.test.ts` for comprehensive tests.

### API Route Tests
```typescript
it('returns 404 for PGRST116 error', async () => {
  const mockSupabase = createMockSupabase({
    resourceError: { code: 'PGRST116', message: 'No rows' },
  })
  
  const response = await GET(mockRequest, { params })
  
  expect(response.status).toBe(404)
  const body = await response.json()
  expect(body.error.code).toBe('NOT_FOUND')
})

it('returns 500 for real database error', async () => {
  const mockSupabase = createMockSupabase({
    resourceError: { code: '08000', message: 'connection failed' },
  })
  
  const response = await GET(mockRequest, { params })
  
  expect(response.status).toBe(500)
  const body = await response.json()
  expect(body.error.code).toBe('INTERNAL_ERROR')
})
```

## Migration Guide

### Step 1: Identify Ad-hoc PGRST116 Checks
```bash
git grep "PGRST116" app/api/
```

### Step 2: Replace with Helper
```typescript
// Before
if (error && error.code === 'PGRST116') {
  return notFoundResponse('Resource')
}

// After
if (error && isNotFoundPostgrestError(error)) {
  return notFoundResponse('Resource')
}
```

### Step 3: Test Both Cases
Add tests for:
1. Missing resource → 404
2. Real DB error → 500

## Common Pitfalls

### ❌ Pitfall 1: Checking AFTER classification
```typescript
// WRONG ORDER
const classified = classifySupabaseError(error)
if (classified.kind === 'INTERNAL_ERROR') {
  if (isNotFoundPostgrestError(error)) {  // ❌ Too late!
    return notFoundResponse()
  }
}
```

### ✅ Solution: Check BEFORE classification
```typescript
// CORRECT ORDER
if (isNotFoundPostgrestError(error)) {
  return notFoundResponse()  // ✅ Check first!
}
const classified = classifySupabaseError(error)
// ... handle other kinds
```

### ❌ Pitfall 2: Not checking null data
```typescript
if (error) {
  if (isNotFoundPostgrestError(error)) {
    return notFoundResponse()
  }
}
// ❌ What if data is null but no error?
return successResponse(data)  // ❌ Will return null!
```

### ✅ Solution: Check both error and data
```typescript
if (error) {
  if (isNotFoundPostgrestError(error)) {
    return notFoundResponse()
  }
  return databaseErrorResponse()
}
if (!data) {  // ✅ Also check null data
  return notFoundResponse()
}
return successResponse(data)
```

## Related Files

- **Implementation**: `lib/db/errors.ts` - `isNotFoundPostgrestError()`
- **Tests**: `lib/db/__tests__/errors.test.ts`
- **Example**: `lib/db/__tests__/errorMappingExample.test.ts`
- **Response Types**: `lib/api/responses.ts` - `notFoundResponse()`, `databaseErrorResponse()`
- **Existing Patterns**: See `app/api/admin/funnels/[id]/route.ts` for real-world usage

## Support

For questions or issues:
- Check existing API routes for usage examples
- Review test files for edge cases
- Consult `lib/db/errors.ts` documentation comments
