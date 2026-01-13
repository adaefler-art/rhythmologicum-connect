# Mobile API Error Reference

## Overview

This document provides a comprehensive reference for all error codes, HTTP status codes, and error handling patterns used in the Rhythmologicum Connect Patient APIs. Mobile clients should use this reference to implement deterministic error handling and provide appropriate user feedback.

**Version:** v0.7  
**Last Updated:** 2026-01-13

---

## Standard Response Envelope

All API endpoints follow a consistent response structure:

### Success Response
```typescript
{
  success: true,
  data: {
    // Response-specific data
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,           // Machine-readable error code (see ErrorCode enum)
    message: string,        // Human-readable error message (German)
    details?: {             // Optional additional context
      // Error-specific details
    }
  }
}
```

---

## HTTP Status Codes

The API uses standard HTTP status codes consistently:

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| **200** | OK | Successful GET request |
| **201** | Created | Successful POST that creates a resource |
| **400** | Bad Request | Invalid input, validation failed, malformed request |
| **401** | Unauthorized | Missing or invalid authentication |
| **403** | Forbidden | Valid auth but insufficient permissions (role/ownership) |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | State conflict (e.g., assessment already completed, version mismatch) |
| **413** | Payload Too Large | Request body exceeds size limits |
| **415** | Unsupported Media Type | Invalid content type |
| **422** | Unprocessable Entity | Semantic validation failed (alternative to 400) |
| **500** | Internal Server Error | Unexpected server error |
| **503** | Service Unavailable | Temporary service issue (e.g., schema not ready) |

---

## Error Code Reference

### Authentication & Authorization

#### `SESSION_EXPIRED` (401)
**When:** User's session has expired and cannot be automatically refreshed  
**Status Code:** 401  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an."
  }
}
```

**Mobile Client Action:**
- Clear local session and tokens immediately
- Clear any cached user data
- Redirect to login screen
- Display message: "Your session has expired. Please log in again."
- Do NOT retry automatically

**Detection Patterns:**
- JWT expired
- Token expired
- Refresh token not found
- Invalid refresh token

**See Also:** [Auth & Session Management](./AUTH_SESSION.md) for detailed session handling

#### `UNAUTHORIZED` (401)
**When:** User is not authenticated (no session present) or general auth failure  
**Status Code:** 401  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentifizierung fehlgeschlagen. Bitte melden Sie sich an."
  }
}
```

**Mobile Client Action:**
- Redirect to login screen
- May not need to show error message (user simply not logged in)
- Clear any stale session data

**Note:** `AUTH_REQUIRED` is an alias used in some endpoints for the same scenario.

#### `FORBIDDEN` (403)
**When:** User is authenticated but lacks required role or resource ownership  
**Status Code:** 403  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Sie haben keine Berechtigung für diese Aktion."
  }
}
```

**Mobile Client Action:**
- Display permission denied message
- Do not retry automatically
- May need to check user role/profile

---

### Validation Errors

#### `VALIDATION_FAILED` (400)
**When:** Required questions not answered, incomplete data  
**Status Code:** 400  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Nicht alle Pflichtfragen wurden beantwortet.",
    "details": {
      "missingQuestions": [
        {
          "questionId": "uuid-123",
          "questionKey": "stress_frequency",
          "questionLabel": "Wie häufig fühlen Sie sich gestresst?",
          "orderIndex": 1
        }
      ]
    }
  }
}
```

**Mobile Client Action:**
- Parse `details.missingQuestions` array
- Navigate user to incomplete questions
- Highlight missing required fields
- Do not allow progression until resolved

#### `MISSING_REQUIRED_FIELDS` (400)
**When:** Required request parameters or body fields are missing  
**Status Code:** 400  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELDS",
    "message": "Fehlende Pflichtfelder."
  }
}
```

**Mobile Client Action:**
- This is typically a client bug
- Log error for debugging
- Check request construction

#### `INVALID_INPUT` (400)
**When:** Input values are malformed or semantically invalid  
**Status Code:** 400  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Der Wert answerValue muss eine ganze Zahl sein."
  }
}
```

**Mobile Client Action:**
- Display error message to user
- Validate input before submission
- Do not retry without fixing input

---

### Resource Errors

#### `NOT_FOUND` (404)
**When:** Requested resource doesn't exist  
**Status Code:** 404  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Assessment nicht gefunden."
  }
}
```

**Mobile Client Action:**
- Display "not found" message
- May need to refresh local cache
- Navigate back to previous screen

#### `ALREADY_EXISTS` (409)
**When:** Attempting to create a duplicate resource  
**Status Code:** 409  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "Eine Ressource mit diesem Namen existiert bereits."
  }
}
```

**Mobile Client Action:**
- Display conflict message
- Suggest alternative action (e.g., update existing)

---

### State Conflict Errors (409)

These errors indicate that the requested operation conflicts with the current state of the resource.

#### `STATE_CONFLICT` (409)
**When:** Generic state conflict that prevents the operation  
**Status Code:** 409  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Die Ressource befindet sich in einem Zustand, der diese Aktion nicht zulässt.",
    "details": {
      "currentState": "completed",
      "requiredState": "in_progress"
    }
  }
}
```

**Mobile Client Action:**
- Refresh resource state
- Display appropriate message based on conflict
- May need to reload the entire flow

#### `ASSESSMENT_COMPLETED` (400)
**When:** Attempting to modify an already completed assessment  
**Status Code:** 400  
**Note:** Uses 400 instead of 409 for historical reasons, but semantically a state conflict  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "ASSESSMENT_COMPLETED",
    "message": "Dieses Assessment wurde bereits abgeschlossen und kann nicht mehr bearbeitet werden."
  }
}
```

**Mobile Client Action:**
- Display "assessment locked" message
- Navigate to results/read-only view
- Do not allow further edits

#### `VERSION_MISMATCH` (409)
**When:** Client's version of a resource conflicts with server version (optimistic locking)  
**Status Code:** 409  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VERSION_MISMATCH",
    "message": "Die Ressource wurde zwischenzeitlich geändert. Bitte laden Sie die aktuelle Version.",
    "details": {
      "clientVersion": "v1",
      "serverVersion": "v2"
    }
  }
}
```

**Mobile Client Action:**
- Fetch latest version from server
- Warn user of conflict if they have unsaved changes
- Implement merge strategy if applicable

#### `DUPLICATE_OPERATION` (409)
**When:** Same operation submitted multiple times (idempotency violation)  
**Status Code:** 409  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_OPERATION",
    "message": "Diese Operation wurde bereits durchgeführt."
  }
}
```

**Mobile Client Action:**
- Treat as success if operation intent is met
- Do not retry
- Check for double-submit bugs

---

### Business Logic Errors

#### `STEP_SKIPPING_PREVENTED` (403)
**When:** User attempts to jump to a future step without completing current step  
**Status Code:** 403  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "STEP_SKIPPING_PREVENTED",
    "message": "Sie können nicht zu einem zukünftigen Schritt springen."
  }
}
```

**Mobile Client Action:**
- Navigate user back to current step
- Display progress indicator
- Ensure UI doesn't allow step skipping

#### `QUESTION_NOT_IN_STEP` (404)
**When:** Attempting to answer a question that doesn't belong to the current step  
**Status Code:** 404  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "QUESTION_NOT_IN_STEP",
    "message": "Diese Frage gehört nicht zu diesem Schritt."
  }
}
```

**Mobile Client Action:**
- This indicates a client bug
- Log error for debugging
- Refresh step definition from server

#### `STEP_NOT_IN_FUNNEL` (404)
**When:** Attempting to access a step that doesn't belong to the funnel  
**Status Code:** 404  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "STEP_NOT_IN_FUNNEL",
    "message": "Dieser Schritt gehört nicht zu diesem Funnel."
  }
}
```

**Mobile Client Action:**
- This indicates a client bug
- Log error for debugging
- Reload funnel definition

---

### Server Errors

#### `INTERNAL_ERROR` (500)
**When:** Unexpected server error  
**Status Code:** 500  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Ein unerwarteter Fehler ist aufgetreten."
  }
}
```

**Mobile Client Action:**
- Display generic error message
- Implement exponential backoff retry (max 3 attempts)
- Log error for support

#### `DATABASE_ERROR` (500)
**When:** Database operation failed  
**Status Code:** 500  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Datenbankfehler. Bitte versuchen Sie es später erneut."
  }
}
```

**Mobile Client Action:**
- Display "try again later" message
- Retry after delay
- Enable offline queue if available

#### `CONFIGURATION_ERROR` (500)
**When:** Server configuration issue  
**Status Code:** 500  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "CONFIGURATION_ERROR",
    "message": "Server-Konfigurationsfehler."
  }
}
```

**Mobile Client Action:**
- Display maintenance message
- Do not retry automatically
- Contact support if persistent

#### `SCHEMA_NOT_READY` (503)
**When:** Database schema is being migrated or not ready  
**Status Code:** 503  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "SCHEMA_NOT_READY",
    "message": "Server-Schema ist noch nicht bereit. Bitte versuchen Sie es später erneut."
  }
}
```

**Mobile Client Action:**
- Display "service temporarily unavailable" message
- Retry with exponential backoff
- Switch to offline mode if available

---

### Media & Payload Errors

#### `UNSUPPORTED_MEDIA_TYPE` (415)
**When:** Invalid Content-Type header  
**Status Code:** 415  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_MEDIA_TYPE",
    "message": "Ungültiger Content-Type. Erwartet: application/json"
  }
}
```

**Mobile Client Action:**
- This indicates a client bug
- Ensure Content-Type: application/json for POST/PUT
- Log error for debugging

#### `PAYLOAD_TOO_LARGE` (413)
**When:** Request body exceeds size limits  
**Status Code:** 413  
**Example:**
```json
{
  "success": false,
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "Die Anfrage ist zu groß.",
    "details": {
      "maxSize": "10MB",
      "actualSize": "15MB"
    }
  }
}
```

**Mobile Client Action:**
- Compress data before sending
- Split into multiple requests
- Reduce attachment sizes

---

## Endpoint-Specific Error Patterns

### Assessment Start: `POST /api/funnels/[slug]/assessments`

**Common Errors:**
- `UNAUTHORIZED` (401) — Not authenticated
- `NOT_FOUND` (404) — Funnel not found
- `INVALID_INPUT` (400) — Funnel not active
- `INTERNAL_ERROR` (500) — Failed to create assessment

**Example Error Flow:**
1. User tries to start assessment without login → `UNAUTHORIZED`
2. Mobile client redirects to login
3. User authenticates
4. Retry → Success (201)

---

### Answer Save: `POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save`

**Common Errors:**
- `UNAUTHORIZED` (401) — Not authenticated
- `FORBIDDEN` (403) — Assessment doesn't belong to user OR step skipping
- `NOT_FOUND` (404) — Assessment, step, or question not found
- `ASSESSMENT_COMPLETED` (400) — Assessment locked
- `INVALID_INPUT` (400) — Invalid answer value type

**Example Error Flow:**
1. User answers question in completed assessment → `ASSESSMENT_COMPLETED`
2. Mobile client displays "cannot edit completed assessment"
3. Navigate to read-only results view

---

### Step Validation: `POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate`

**Common Errors:**
- `UNAUTHORIZED` (401) — Not authenticated
- `FORBIDDEN` (403) — Ownership violation OR step skipping
- `NOT_FOUND` (404) — Assessment or step not found

**Success Response (Validation Passed):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "missingQuestions": [],
    "nextStep": {
      "stepId": "uuid-456",
      "title": "Schlafqualität",
      "type": "questions",
      "orderIndex": 2
    }
  }
}
```

**Success Response (Validation Failed):**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "missingQuestions": [
      {
        "questionId": "uuid-123",
        "questionKey": "stress_frequency",
        "questionLabel": "Wie häufig fühlen Sie sich gestresst?",
        "orderIndex": 1
      }
    ]
  }
}
```

**Note:** Validation endpoint returns `success: true` even when validation fails. Check `data.isValid` to determine outcome.

---

### Assessment Complete: `POST /api/funnels/[slug]/assessments/[assessmentId]/complete`

**Common Errors:**
- `UNAUTHORIZED` (401) — Not authenticated
- `FORBIDDEN` (403) — Ownership violation
- `NOT_FOUND` (404) — Assessment not found
- `VALIDATION_FAILED` (400) — Missing required answers

**Success Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": "uuid-789",
    "status": "completed"
  }
}
```

**Example Error Flow:**
1. User tries to complete with missing answers → `VALIDATION_FAILED` with `details.missingQuestions`
2. Mobile client navigates to first incomplete step
3. User answers questions
4. Retry complete → Success

---

### Assessment Result: `GET /api/funnels/[slug]/assessments/[assessmentId]/result`

**Common Errors:**
- `UNAUTHORIZED` (401) — Not authenticated
- `FORBIDDEN` (403) — Assessment doesn't belong to user
- `NOT_FOUND` (404) — Assessment not found

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-789",
    "funnel": "stress-assessment",
    "completedAt": "2026-01-13T10:30:00Z",
    "status": "completed",
    "funnelTitle": "Stress Assessment"
  }
}
```

---

## Error Handling Best Practices

### 1. Parse Error Response Consistently
```typescript
interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

function handleApiError(response: ApiErrorResponse) {
  switch (response.error.code) {
    case 'UNAUTHORIZED':
      // Clear session, redirect to login
      break
    case 'VALIDATION_FAILED':
      // Show missing questions
      const missing = response.error.details?.missingQuestions
      break
    case 'ASSESSMENT_COMPLETED':
      // Navigate to results
      break
    default:
      // Generic error message
      showError(response.error.message)
  }
}
```

### 2. Implement Retry Logic
```typescript
const RETRYABLE_ERRORS = [
  'INTERNAL_ERROR',
  'DATABASE_ERROR',
  'SCHEMA_NOT_READY'
]

async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url)
    if (!response.ok && RETRYABLE_ERRORS.includes(errorCode)) {
      await delay(Math.pow(2, attempt) * 1000) // Exponential backoff
      continue
    }
    return response
  }
  throw new Error('Max retries exceeded')
}
```

### 3. Handle Network Errors
Network errors (connection lost, timeout) don't return structured responses. Treat separately:
```typescript
try {
  const response = await fetch(url)
  const data = await response.json()
  if (!data.success) {
    handleApiError(data)
  }
} catch (networkError) {
  // Network error, no response from server
  showOfflineMessage()
  queueForRetry()
}
```

### 4. Validation Error Details
Always check for `details` object in validation errors:
```typescript
if (error.code === 'VALIDATION_FAILED') {
  const missing = error.details?.missingQuestions || []
  missing.forEach(q => {
    highlightQuestion(q.questionKey)
  })
  navigateToFirstMissing(missing[0])
}
```

### 5. User-Friendly Messages
Map technical error codes to localized user messages:
```typescript
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
  FORBIDDEN: 'Sie haben keine Berechtigung für diese Aktion.',
  NOT_FOUND: 'Die angeforderte Ressource wurde nicht gefunden.',
  VALIDATION_FAILED: 'Bitte beantworten Sie alle Pflichtfragen.',
  INTERNAL_ERROR: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
}
```

---

## Silent Failures

**The API guarantees NO silent failures.** All errors return structured error responses with:
- `success: false`
- `error.code` (machine-readable)
- `error.message` (human-readable)
- `error.details` (context-specific)

If `success: false` but `error` is missing, this is a bug and should be reported.

---

## Testing Error Scenarios

### Recommended Test Cases

1. **Authentication Errors**
   - Request without auth token → `UNAUTHORIZED`
   - Request with expired token → `UNAUTHORIZED`
   - Request to another user's resource → `FORBIDDEN`

2. **Validation Errors**
   - Submit incomplete step → `VALIDATION_FAILED` with missing questions
   - Complete assessment with missing answers → `VALIDATION_FAILED`
   - Invalid answer value type → `INVALID_INPUT`

3. **State Conflicts**
   - Edit completed assessment → `ASSESSMENT_COMPLETED`
   - Skip to future step → `STEP_SKIPPING_PREVENTED`
   - Submit answer to wrong step → `QUESTION_NOT_IN_STEP`

4. **Resource Errors**
   - Request non-existent assessment → `NOT_FOUND`
   - Request deleted funnel → `NOT_FOUND`

5. **Server Errors**
   - Simulate database outage → `DATABASE_ERROR`
   - Simulate schema migration → `SCHEMA_NOT_READY`

---

## Changelog

### v0.7 (2026-01-13)
- Initial comprehensive error documentation
- Added 409 conflict error codes (STATE_CONFLICT, VERSION_MISMATCH, DUPLICATE_OPERATION)
- Documented all patient API endpoints
- Added error handling best practices
- Added mobile client action recommendations for each error type

---

## Support

For questions or to report inconsistencies:
- Create GitHub issue with label `api-error`
- Include endpoint, request, response, and expected behavior
- Tag with `mobile-client` if mobile-specific
