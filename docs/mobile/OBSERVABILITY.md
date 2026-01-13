# Mobile Observability Guide

**Version:** v0.7  
**Issue:** E6.2.8 — Correlation IDs + Client Debug Breadcrumbs  
**Last Updated:** 2026-01-13

## Overview

This document describes the observability infrastructure for the Rhythmologicum Connect mobile application (iOS). It enables end-to-end request tracing, error debugging, and issue reproduction.

**Key Features:**
- **Correlation IDs** - Every API request/response has a unique identifier
- **Request/Response Headers** - Standardized tracing headers
- **Structured Logging** - JSON-formatted logs with correlation context
- **Debug Session Workflow** - Step-by-step guide for reproducing mobile bugs

**Target Audience:** iOS developers, backend engineers, QA, support staff

---

## Correlation IDs (X-Request-Id)

### What is a Correlation ID?

A correlation ID (also called request ID or trace ID) is a unique identifier that follows a request through the entire system:

```
Mobile App → API Gateway → Backend Service → Database → Response
     └──────────── X-Request-Id: abc-123-def ────────────┘
```

### Implementation

#### Middleware

The Next.js middleware (`middleware.ts`) automatically handles correlation IDs for all API requests:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Use client-provided ID or generate new one
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  
  return response
}
```

#### API Responses

All API responses include the correlation ID in **two places**:

1. **Response Header**: `X-Request-Id: abc-123-def`
2. **Response Body**: `{ success: true, data: {...}, requestId: "abc-123-def" }`

**Example Success Response:**

```json
HTTP/1.1 200 OK
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "success": true,
  "data": {
    "assessmentId": "assessment-789",
    "funnelSlug": "stress"
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example Error Response:**

```json
HTTP/1.1 401 Unauthorized
X-Request-Id: 550e8400-e29b-41d4-a716-446655440001
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentifizierung fehlgeschlagen. Bitte melden Sie sich an."
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Mobile Client Usage

#### Sending Correlation IDs

**Option 1: Generate on Client (Recommended)**

```swift
// Swift iOS Example
let requestId = UUID().uuidString

var request = URLRequest(url: url)
request.addValue(requestId, forHTTPHeaderField: "X-Request-Id")

// Store for later logging
UserDefaults.standard.set(requestId, forKey: "lastRequestId")
```

**Option 2: Let Server Generate**

If the client doesn't provide an `X-Request-Id` header, the server automatically generates one. The client can extract it from the response.

#### Extracting from Response

```swift
// Swift iOS Example
let task = URLSession.shared.dataTask(with: request) { data, response, error in
    guard let httpResponse = response as? HTTPURLResponse else { return }
    
    // Extract from header
    let requestId = httpResponse.value(forHTTPHeaderField: "X-Request-Id")
    
    // Or extract from JSON body
    if let data = data,
       let json = try? JSONDecoder().decode(ApiResponse.self, from: data) {
        let requestIdFromBody = json.requestId
    }
    
    // Log for debugging
    print("[DEBUG] Request ID: \(requestId ?? "unknown")")
}
```

---

## Structured Logging

### Server-Side Logging

All server-side logs include correlation IDs automatically:

```typescript
import { logInfo, logError } from '@/lib/logging/logger'

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  
  // Info log with correlation ID
  logInfo('Fetching assessment', {
    requestId,
    userId: user.id,
    assessmentId: '123',
  })
  
  // Error log with correlation ID
  logError('Database query failed', {
    requestId,
    operation: 'fetch_assessment',
    error: dbError,
  })
}
```

**Log Output:**

```json
{
  "timestamp": "2026-01-13T16:00:00.000Z",
  "level": "error",
  "message": "Database query failed",
  "context": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "operation": "fetch_assessment",
    "userId": "user-456"
  },
  "error": {
    "message": "Connection timeout",
    "code": "08000"
  }
}
```

### Client-Side Logging

Mobile apps should log correlation IDs with every network request:

```swift
// Swift iOS Example - Logging wrapper
func logApiRequest(endpoint: String, requestId: String, statusCode: Int?) {
    let log: [String: Any] = [
        "timestamp": ISO8601DateFormatter().string(from: Date()),
        "event": "api_request",
        "endpoint": endpoint,
        "requestId": requestId,
        "statusCode": statusCode ?? "unknown",
        "userAgent": "RhythmologicumConnect/1.0 iOS/17.0"
    ]
    
    print("[API_LOG] \(log)")
    
    // TODO: Send to analytics service in production
    // Analytics.track("api_request", properties: log)
}

// Usage
logApiRequest(
    endpoint: "/api/funnels/catalog",
    requestId: "550e8400-e29b-41d4-a716-446655440000",
    statusCode: 200
)
```

---

## Debug Session Workflow

This section provides a step-by-step guide for debugging mobile bug reports using correlation IDs.

### Scenario: User Reports "Assessment Won't Load"

#### Step 1: Collect Information from User

**Minimum Required Information:**
- What action did you take? (e.g., "Tapped 'Start Assessment' button")
- When did it happen? (approximate time: "2026-01-13 around 16:00 UTC")
- What did you see? (e.g., "Spinner never stopped, no error message")

**Bonus Information:**
- Device: iPhone 14 Pro, iOS 17.2
- App Version: 1.0.5 (build 42)
- Network: WiFi

#### Step 2: Enable Debug Logging in Mobile App

If the app has a debug mode, enable it:

```swift
// Debug settings view
struct DebugSettingsView: View {
    @AppStorage("debugMode") var debugMode = false
    
    var body: some View {
        Toggle("Enable Debug Logging", isOn: $debugMode)
    }
}

// In API client
if UserDefaults.standard.bool(forKey: "debugMode") {
    // Log all requests/responses with correlation IDs
    logApiRequest(endpoint: endpoint, requestId: requestId, statusCode: statusCode)
}
```

#### Step 3: Reproduce the Issue

**Reproduce with Debug Logging Enabled:**

1. User opens the app
2. User navigates to assessment catalog
3. User taps "Start Stress Assessment"
4. App makes API call with correlation ID

**Captured Logs:**

```
[API_LOG] {
  "timestamp": "2026-01-13T16:05:23Z",
  "event": "api_request_start",
  "endpoint": "/api/funnels/stress/assessments",
  "method": "POST",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}

[API_LOG] {
  "timestamp": "2026-01-13T16:05:25Z",
  "event": "api_request_complete",
  "endpoint": "/api/funnels/stress/assessments",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "statusCode": 500,
  "error": "INTERNAL_ERROR"
}
```

**Key Finding:** Request ID = `550e8400-e29b-41d4-a716-446655440000`

#### Step 4: Search Backend Logs

Search server logs for the correlation ID:

```bash
# Example: CloudWatch Logs query
fields @timestamp, message, context.requestId
| filter context.requestId = "550e8400-e29b-41d4-a716-446655440000"
| sort @timestamp asc
```

**Backend Log Results:**

```json
[
  {
    "timestamp": "2026-01-13T16:05:23.500Z",
    "level": "info",
    "message": "Creating new assessment",
    "context": {
      "requestId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "funnelSlug": "stress"
    }
  },
  {
    "timestamp": "2026-01-13T16:05:24.200Z",
    "level": "error",
    "message": "Database connection timeout",
    "context": {
      "requestId": "550e8400-e29b-41d4-a716-446655440000",
      "operation": "insert_assessment"
    },
    "error": {
      "code": "08000",
      "message": "connection timeout after 5000ms"
    }
  }
]
```

**Root Cause:** Database connection timeout at 16:05:24 UTC

#### Step 5: Verify Fix

1. **Fix Applied:** Increase database connection timeout from 5s to 15s
2. **Reproduce Again:** User attempts same action
3. **New Request ID:** `550e8400-e29b-41d4-a716-446655440001`
4. **Result:** Success (200 OK) in 8.5 seconds

**Verification Logs:**

```json
{
  "timestamp": "2026-01-13T17:00:00.500Z",
  "level": "info",
  "message": "Assessment created successfully",
  "context": {
    "requestId": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "user-123",
    "assessmentId": "assessment-new-456",
    "duration_ms": 8500
  }
}
```

**Issue Resolved:** ✅

---

## Example Debug Session: Network Error

### User Report

> "I tried to submit my stress assessment, but it said 'Network Error'. I have full WiFi signal."

### Step-by-Step Investigation

#### 1. Initial Mobile Logs

```
[API_LOG] {
  "timestamp": "2026-01-13T18:30:45Z",
  "event": "api_request_start",
  "endpoint": "/api/funnels/stress/assessments/abc-123/complete",
  "method": "POST",
  "requestId": "7a8b9c0d-1234-5678-90ab-cdef12345678"
}

[API_LOG] {
  "timestamp": "2026-01-13T18:30:50Z",
  "event": "api_request_failed",
  "endpoint": "/api/funnels/stress/assessments/abc-123/complete",
  "requestId": "7a8b9c0d-1234-5678-90ab-cdef12345678",
  "error": "NSURLErrorDomain Code=-1001 (Request timeout)"
}
```

**Analysis:** iOS-level network timeout (Code -1001), request never reached server

#### 2. Backend Logs

Search for `7a8b9c0d-1234-5678-90ab-cdef12345678`:

```
No results found
```

**Conclusion:** Request never arrived at backend. Possible causes:
- Client-side timeout too aggressive (default 30s)
- Network proxy/firewall blocking
- DNS resolution failure

#### 3. Solution

```swift
// Increase request timeout for completion endpoint
let config = URLSessionConfiguration.default
config.timeoutIntervalForRequest = 60.0 // Increase to 60s
config.timeoutIntervalForResource = 120.0

let session = URLSession(configuration: config)
```

---

## Best Practices

### For Mobile Developers

1. **Always Generate Correlation IDs**
   - Generate UUID on client for every API request
   - Send as `X-Request-Id` header
   - Log it locally for debugging

2. **Log Network Activity**
   - Log start/completion of every API call
   - Include correlation ID, endpoint, status code
   - Preserve logs for at least 7 days locally

3. **Display Request IDs in Error Screens**
   ```swift
   struct ErrorView: View {
       let message: String
       let requestId: String?
       
       var body: some View {
           VStack {
               Text("Error: \(message)")
               if let id = requestId {
                   Text("Request ID: \(id)")
                       .font(.caption)
                       .foregroundColor(.gray)
               }
           }
       }
   }
   ```

4. **Include Request IDs in Bug Reports**
   - Auto-populate bug report forms with last request ID
   - Allow users to copy/share request IDs easily

### For Backend Developers

1. **Preserve Correlation IDs**
   - Extract from request headers (`getRequestId(request)`)
   - Pass through all internal service calls
   - Include in all log statements

2. **Return in Responses**
   - Add to response headers (`X-Request-Id`)
   - Include in response body (`requestId` field)
   - Ensure both success and error responses include it

3. **Index by Request ID**
   - Ensure log aggregation systems can filter by `requestId`
   - Tag metrics/traces with correlation IDs
   - Support search queries across distributed systems

### For QA/Support

1. **Always Ask for Request ID**
   - First question: "What was the Request ID?"
   - Guide users to find it in error screens or debug logs

2. **Document Reproduction Steps with IDs**
   - Note request IDs at each step of reproduction
   - Compare successful vs. failed request flows

3. **Use Time Windows**
   - If no request ID available, ask for exact time (± 5 minutes)
   - Search logs by user ID + timestamp range

---

## Production Monitoring Integration

### Recommended Tools

For production environments, integrate correlation IDs with monitoring services:

**Error Tracking:**
- **Sentry** (recommended) - Automatic error grouping by request ID
- **Rollbar** - Error tracking with custom tags

**Log Aggregation:**
- **CloudWatch Logs** (AWS) - Native AWS integration
- **Datadog** - Full-stack observability
- **Splunk** - Enterprise log management

**APM (Application Performance Monitoring):**
- **New Relic** - Distributed tracing with correlation IDs
- **Datadog APM** - End-to-end request tracing

See [docs/MONITORING_INTEGRATION.md](../MONITORING_INTEGRATION.md) for detailed setup guides.

---

## Troubleshooting

### Issue: Request ID Not in Response

**Symptom:** Response body missing `requestId` field

**Causes:**
- Old API endpoint not updated to new response format
- Response bypassing standard response helpers

**Solution:**
```typescript
// Use standardized response helpers
import { successResponse, errorResponse } from '@/lib/api/responses'

// ✅ Correct - includes requestId
return successResponse(data, 200, requestId)

// ❌ Wrong - missing requestId
return NextResponse.json({ success: true, data })
```

### Issue: Duplicate Request IDs

**Symptom:** Multiple requests share the same ID

**Causes:**
- Client reusing request ID across multiple calls
- Retry logic not generating new IDs

**Solution:**
```swift
// ✅ Correct - generate new ID per request
func makeRequest() {
    let requestId = UUID().uuidString
    // ... make request with requestId
}

// ❌ Wrong - reusing same ID
let globalRequestId = UUID().uuidString
func makeRequest() {
    // ... make request with globalRequestId (don't do this!)
}
```

### Issue: Request ID Not in Logs

**Symptom:** Backend logs missing `requestId` in context

**Causes:**
- Using `console.log()` instead of structured logger
- Not passing `requestId` to logger

**Solution:**
```typescript
// ✅ Correct
import { logError } from '@/lib/logging/logger'

logError('Failed to save', {
  requestId,
  userId: user.id,
  error: err,
})

// ❌ Wrong
console.error('Failed to save:', err)
```

---

## FAQ

**Q: Do I need to generate correlation IDs on the client, or will the server do it?**  
A: The server will auto-generate if missing, but it's **strongly recommended** that clients generate and send their own. This enables client-side logging before the request even leaves the device.

**Q: What format should correlation IDs use?**  
A: UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`). Use `crypto.randomUUID()` on web or `UUID().uuidString` in Swift.

**Q: Can I reuse a correlation ID for retry attempts?**  
A: **No.** Each retry should get a new correlation ID. However, you can log the original request ID for reference (e.g., `originalRequestId` field).

**Q: How long are correlation IDs stored in logs?**  
A: Depends on log retention policy. Typically:
- Development: 7 days
- Staging: 30 days
- Production: 90 days (or longer for compliance)

**Q: Are correlation IDs sensitive data?**  
A: No, they're just random UUIDs. Safe to display in error messages and share in bug reports.

---

## Summary Checklist

### For Every API Request/Response

- [ ] Request includes `X-Request-Id` header (client or server generated)
- [ ] Response includes `X-Request-Id` header (same value as request)
- [ ] Response body includes `requestId` field
- [ ] Server logs include `requestId` in context
- [ ] Client logs include `requestId` for debugging

### For Every Bug Report

- [ ] Request ID captured and included
- [ ] Approximate timestamp noted
- [ ] User ID identified (if authenticated)
- [ ] Endpoint/action documented
- [ ] Expected vs. actual behavior described

### For Every Debug Session

- [ ] Search logs by correlation ID
- [ ] Trace request through all system layers
- [ ] Identify exact failure point with timestamp
- [ ] Verify fix using new correlation ID
- [ ] Document resolution for future reference

---

## Related Documentation

- [MOBILE_API_SURFACE.md](./MOBILE_API_SURFACE.md) - API endpoint inventory for mobile
- [CACHING_PAGINATION.md](./CACHING_PAGINATION.md) - Caching and pagination guide
- [AUTH_SESSION.md](./AUTH_SESSION.md) - Session management
- [../LOGGING_PATTERNS.md](../LOGGING_PATTERNS.md) - Server-side logging patterns
- [../MONITORING_INTEGRATION.md](../MONITORING_INTEGRATION.md) - Production monitoring setup

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-13  
**Maintained By:** Backend & Mobile Teams
