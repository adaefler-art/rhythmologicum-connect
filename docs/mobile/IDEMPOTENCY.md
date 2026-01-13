# Idempotency for Mobile Offline/Retry Readiness (E6.2.4)

## Overview

Mobile clients can safely retry write operations using idempotency keys. This prevents duplicate submissions when:
- Network connection is lost mid-request
- App is killed or crashes during a request
- User accidentally submits the same action multiple times
- Network timeout causes automatic retry

## How It Works

### 1. Client Sends Idempotency Key

Include an `Idempotency-Key` header with a unique identifier (UUID recommended) in write requests:

```http
POST /api/funnels/stress/assessments HTTP/1.1
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
```

### 2. Server Processing

- **First Request**: Server processes the request normally, caches the response (for 2xx success or 409 conflict)
- **Duplicate Request**: Server returns the cached response without processing again
- **Conflict**: If same key is used with different payload, returns `409 Conflict`

### 3. Response Headers

Cached responses include a special header:

```http
X-Idempotency-Cached: true
```

## Caching Policy

The server caches responses based on status code:

- **2xx Success (200-299)**: Cached for 24 hours
- **409 Conflict**: Cached (deterministic error)
- **Other 4xx (400, 401, 403, 404, etc.)**: NOT cached (may be temporary/fixable)
- **5xx Server Errors**: NOT cached (should be retried)

This means temporary validation errors (400) can be fixed by sending the same request again after correcting the payload.

## Supported Endpoints

Idempotency is supported on all write endpoints:

| Endpoint | Method | Payload Check | Description |
|----------|--------|---------------|-------------|
| `/api/funnels/[slug]/assessments` | POST | No | Start new assessment |
| `/api/funnels/[slug]/assessments/[id]/answers/save` | POST | Yes | Save answer (tap-to-save) |
| `/api/funnels/[slug]/assessments/[id]/steps/[stepId]/validate` | POST | No | Validate step |
| `/api/funnels/[slug]/assessments/[id]/complete` | POST | No | Complete assessment |

**Payload Check**: Whether server validates that duplicate requests have identical payloads.

## Client Implementation

### Generating Idempotency Keys

Use UUIDs for idempotency keys:

```typescript
import { v4 as uuidv4 } from 'uuid'

// Generate a unique key for each operation
const idempotencyKey = uuidv4()
```

### Storing Keys Locally

Store idempotency keys locally to retry failed requests:

```typescript
interface PendingRequest {
  idempotencyKey: string
  endpoint: string
  method: string
  payload?: unknown
  timestamp: number
}

// Store in local storage or IndexedDB
const pendingRequests: PendingRequest[] = []

async function saveAnswer(stepId: string, questionId: string, value: number) {
  const idempotencyKey = uuidv4()
  
  // Store request metadata
  pendingRequests.push({
    idempotencyKey,
    endpoint: `/api/funnels/stress/assessments/${assessmentId}/answers/save`,
    method: 'POST',
    payload: { stepId, questionId, answerValue: value },
    timestamp: Date.now(),
  })
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ stepId, questionId, answerValue: value }),
    })
    
    // Request succeeded - remove from pending
    removePendingRequest(idempotencyKey)
    
    return await response.json()
  } catch (error) {
    // Network error - request remains in pending queue
    console.error('Request failed, will retry:', error)
    throw error
  }
}
```

### Retry Logic

Retry failed requests with same idempotency key:

```typescript
async function retryPendingRequests() {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  for (const request of pendingRequests) {
    // Skip requests older than 24 hours (expired)
    if (now - request.timestamp > maxAge) {
      removePendingRequest(request.idempotencyKey)
      continue
    }
    
    try {
      const response = await fetch(request.endpoint, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': request.idempotencyKey,
        },
        body: request.payload ? JSON.stringify(request.payload) : undefined,
      })
      
      if (response.ok) {
        removePendingRequest(request.idempotencyKey)
      }
    } catch (error) {
      console.error('Retry failed:', error)
      // Will try again on next retry cycle
    }
  }
}

// Call on app startup or when network is restored
retryPendingRequests()
```

### Handling Cached Responses

Check for cached responses:

```typescript
const response = await fetch(endpoint, {
  headers: {
    'Idempotency-Key': idempotencyKey,
  },
})

const isCached = response.headers.get('X-Idempotency-Cached') === 'true'

if (isCached) {
  console.log('Request was already processed, using cached response')
}
```

## Error Responses

### 409 Conflict - Payload Mismatch

Same idempotency key used with different payload:

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_OPERATION",
    "message": "Idempotency-Key wurde bereits mit unterschiedlichen Daten verwendet.",
    "details": {
      "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
      "conflictType": "payload_mismatch"
    }
  }
}
```

**Resolution**: This indicates a bug in the client. The same idempotency key should never be used for different operations. Generate a new key and retry.

## Key Expiration

- **Default TTL**: 24 hours
- **Cleanup**: Expired keys are automatically deleted from the database
- **Best Practice**: Don't retry requests older than 24 hours

## Database Schema

Idempotency keys are stored in the `idempotency_keys` table:

```sql
CREATE TABLE idempotency_keys (
    id uuid PRIMARY KEY,
    idempotency_key text NOT NULL,
    user_id uuid NOT NULL,
    endpoint_path text NOT NULL,
    http_method text NOT NULL,
    response_status integer NOT NULL,
    response_body jsonb NOT NULL,
    request_hash text,  -- SHA-256 hash for conflict detection
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,  -- Default: now() + 24 hours
    
    UNIQUE (user_id, endpoint_path, idempotency_key)
)
```

**Security**: Row-level security (RLS) ensures users can only access their own idempotency keys.

## Testing

### Test Case 1: Duplicate Request Returns Same Response

```typescript
const idempotencyKey = uuidv4()

// First request
const response1 = await saveAnswer(stepId, questionId, value, idempotencyKey)

// Second request with same key
const response2 = await saveAnswer(stepId, questionId, value, idempotencyKey)

// Assertions
expect(response1).toEqual(response2)
expect(response2.headers.get('X-Idempotency-Cached')).toBe('true')
```

### Test Case 2: Conflict Detection

```typescript
const idempotencyKey = uuidv4()

// First request
await saveAnswer(stepId, questionId, 1, idempotencyKey)

// Second request with DIFFERENT value but SAME key
const response = await saveAnswer(stepId, questionId, 2, idempotencyKey)

// Assertions
expect(response.status).toBe(409)
expect(response.error.code).toBe('DUPLICATE_OPERATION')
```

### Test Case 3: Different Keys Create Different Records

```typescript
const key1 = uuidv4()
const key2 = uuidv4()

// Two requests with different keys
const response1 = await saveAnswer(stepId, questionId, value, key1)
const response2 = await saveAnswer(stepId, questionId, value, key2)

// Assertions
expect(response1.data.id).not.toBe(response2.data.id)
```

## Best Practices

### 1. Generate Keys Per Operation

Generate a unique idempotency key for each distinct operation:

```typescript
// ✅ GOOD: New key for each save
saveAnswer(stepId, 'q1', 1, uuidv4())
saveAnswer(stepId, 'q2', 2, uuidv4())

// ❌ BAD: Reusing same key
const key = uuidv4()
saveAnswer(stepId, 'q1', 1, key)
saveAnswer(stepId, 'q2', 2, key)  // Conflict!
```

### 2. Store Keys Before Request

Store the idempotency key BEFORE making the request:

```typescript
// ✅ GOOD
const key = uuidv4()
storeKey(key)
await makeRequest(key)

// ❌ BAD: If request fails, key is lost
await makeRequest(uuidv4())
```

### 3. Clean Up Old Keys

Remove keys after successful response:

```typescript
await makeRequest(key)
removeKey(key)  // Clean up after success
```

### 4. Expire Old Pending Requests

Don't retry requests older than 24 hours:

```typescript
if (Date.now() - request.timestamp > 24 * 60 * 60 * 1000) {
  removeKey(request.key)  // Too old, give up
}
```

### 5. Scope Keys Per User

Idempotency keys are scoped per user automatically. Different users can use the same key without conflicts.

## Limitations

1. **No Support for 5xx Errors**: Server errors (500, 503) are not cached and should be retried
2. **24 Hour Window**: Keys expire after 24 hours
3. **Payload Check Only on Some Endpoints**: Only endpoints with payload checking will detect conflicts
4. **No Cross-Endpoint Keys**: Same key can be used on different endpoints (they're scoped separately)

## Monitoring

Cached responses are logged:

```
[idempotency] Returning cached response for key: 550e8400-e29b-41d4-a716-446655440000
[idempotency] Stored idempotency key: 550e8400-e29b-41d4-a716-446655440000
```

Conflicts are logged and returned to client as 409 errors.
