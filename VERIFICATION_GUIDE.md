# E6.2.8 Verification Guide

## Quick Verification Steps

### 1. Test Endpoint Verification

Start the development server and test the correlation ID endpoint:

```bash
npm run dev
```

**Test 1: Server-Generated Correlation ID**
```bash
curl -i http://localhost:3000/api/test/correlation-id
```

Expected response:
- HTTP header: `X-Request-Id: <some-uuid>`
- JSON body includes `requestId` field with same UUID
- JSON body includes `receivedRequestId` with same UUID

**Test 2: Client-Provided Correlation ID**
```bash
curl -i -H "X-Request-Id: test-id-12345" \
  http://localhost:3000/api/test/correlation-id
```

Expected response:
- HTTP header: `X-Request-Id: test-id-12345`
- JSON body `requestId: "test-id-12345"`
- JSON body `receivedRequestId: "test-id-12345"`

### 2. Verify Response Types

Check that TypeScript types are correct:

```typescript
// This should compile without errors
import { SuccessResponse, ErrorResponse } from '@/lib/api/responseTypes'

const success: SuccessResponse<{ id: string }> = {
  success: true,
  data: { id: '123' },
  requestId: 'optional-id',  // Should be allowed
}

const error: ErrorResponse = {
  success: false,
  error: { code: 'INVALID_INPUT', message: 'Test' },
  requestId: 'optional-id',  // Should be allowed
}
```

### 3. Verify Existing Endpoints Still Work

Test any existing API endpoint to ensure backward compatibility:

```bash
# This should still work (no requestId required)
curl http://localhost:3000/api/health/env \
  -H "Authorization: Bearer <your-token>"
```

Expected: Endpoint works normally, may or may not include requestId (depends on whether it was updated).

### 4. Check Middleware

Verify middleware is active:

```bash
# Any API call should have X-Request-Id in request headers
curl -v http://localhost:3000/api/funnels/catalog \
  -H "Authorization: Bearer <your-token>"
```

Check the request log - it should show the middleware added X-Request-Id to the request.

### 5. Verify Documentation

Check that documentation is complete:

```bash
cat docs/mobile/OBSERVABILITY.md
```

Should include:
- ✅ Overview of correlation IDs
- ✅ Implementation details
- ✅ Mobile client usage examples (Swift)
- ✅ Debug session workflow
- ✅ Real-world debugging scenarios
- ✅ Best practices
- ✅ FAQ and troubleshooting

## Integration Testing

### Test Pattern in New Endpoints

When creating new API routes, follow this pattern:

```typescript
import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/responses'
import { getRequestId, withRequestId } from '@/lib/db/errors'
import { logError } from '@/lib/logging/logger'

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)

  try {
    // Business logic here
    const data = { message: 'Success' }
    
    const response = successResponse(data, 200, requestId)
    return withRequestId(response, requestId)
  } catch (error) {
    logError({ requestId, operation: 'get_endpoint', error })
    
    const response = errorResponse('INTERNAL_ERROR', 'Error message', 500, undefined, requestId)
    return withRequestId(response, requestId)
  }
}
```

### Verify Response Structure

Every successful response should look like:
```json
{
  "success": true,
  "data": { /* your data */ },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Every error response should look like:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Checklist for Pull Request Review

- [ ] Middleware file created (`middleware.ts`)
- [ ] Response types updated (`lib/api/responseTypes.ts`)
- [ ] Response helpers updated (`lib/api/responses.ts`)
- [ ] Logging types updated (`lib/logging/logger.ts`)
- [ ] Tests added (`lib/api/__tests__/responses.test.ts`)
- [ ] Test endpoint created (`app/api/test/correlation-id/route.ts`)
- [ ] Documentation created (`docs/mobile/OBSERVABILITY.md`)
- [ ] Implementation summary created (`E6_2_8_IMPLEMENTATION_SUMMARY.md`)
- [ ] No breaking changes to existing code
- [ ] All requestId parameters are optional (backward compatible)
- [ ] TypeScript compiles (ignoring pre-existing errors)

## Common Issues During Verification

### Issue: Response doesn't include requestId

**Solution:** Make sure you're passing the requestId parameter:
```typescript
// Wrong
return successResponse(data)

// Correct
return successResponse(data, 200, requestId)
```

### Issue: Header missing X-Request-Id

**Solution:** Make sure you're using `withRequestId()`:
```typescript
const response = successResponse(data, 200, requestId)
return withRequestId(response, requestId)
```

### Issue: Tests fail

**Solution:** Run tests with proper setup:
```bash
npm test -- lib/api/__tests__/responses.test.ts
```

If node_modules missing:
```bash
npm install
npm test
```

## Deployment Checklist

Before deploying to production:

- [ ] Verify middleware works in staging
- [ ] Test correlation ID flow end-to-end
- [ ] Update monitoring/logging dashboards to filter by requestId
- [ ] Train support team on using correlation IDs for debugging
- [ ] Document correlation ID field in API documentation
- [ ] Update mobile app to send and log correlation IDs

## Success Criteria

✅ All API responses include correlation ID (header + body)  
✅ Middleware ensures all requests have correlation IDs  
✅ Documentation complete with real-world examples  
✅ Tests verify correlation ID functionality  
✅ Backward compatible - no breaking changes  
✅ Mobile developers have clear guide for implementation

---

**Verification Complete**: Ready for code review and merge.
