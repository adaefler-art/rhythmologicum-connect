# Auth & Session Management for Mobile (E6.2.6)

## Overview

This document describes the authentication and session handling contract for the iOS mobile application. It defines how the mobile client should handle session lifecycle, expiry, and refresh scenarios to ensure a robust and predictable user experience.

**Version:** v0.7 (2026-01)  
**Last Updated:** 2026-01-13

---

## Session Lifecycle

### 1. Session Establishment

When a user successfully authenticates (via email/password, OAuth, or magic link):

1. Supabase Auth creates a session with:
   - Access token (JWT, short-lived, typically 1 hour)
   - Refresh token (long-lived, typically 30 days)
2. Session is stored in HTTP-only cookies (web) or secure storage (mobile)
3. Client receives user metadata including role information

### 2. Active Session

During an active session:

- All API requests include the session token
- Server validates the token on each request via `supabase.auth.getUser()`
- If token is valid, request proceeds normally
- If token is expired but refresh token is valid, Supabase automatically refreshes the session

### 3. Session Expiry

Sessions can expire in several ways:

1. **Access Token Expiry**: JWT expires after ~1 hour
   - Supabase attempts automatic refresh using refresh token
   - If refresh succeeds, request proceeds transparently
   - If refresh fails, session is considered expired

2. **Refresh Token Expiry**: Refresh token expires after ~30 days
   - Cannot be automatically refreshed
   - User must re-authenticate

3. **Token Invalidation**: Manual logout or revocation
   - Session is immediately invalidated
   - All tokens are cleared

---

## Error Response Contract

### Consistent 401 Handling

All authentication-related failures return HTTP status `401 Unauthorized` with one of two error codes:

#### 1. `SESSION_EXPIRED` (401)

**When:** Session has expired and cannot be automatically refreshed

**Response Structure:**
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
- Clear local session/tokens
- Clear any cached user data
- Redirect to login screen
- Display user-friendly message: "Your session has expired. Please log in again."
- Do NOT retry the request automatically

**Detected Scenarios:**
- JWT expired
- Token expired
- Session expired
- Refresh token not found
- Invalid refresh token

#### 2. `AUTH_REQUIRED` (401)

**When:** No session is present or authentication failed for other reasons

**Response Structure:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

**Mobile Client Action:**
- Redirect to login screen
- Do not display an error message (user simply isn't logged in)
- Clear any stale local session data

---

## Affected Endpoints

The following endpoints implement the SESSION_EXPIRED detection:

### Critical Patient Endpoints (MUST support)

| Endpoint | Purpose | Error Codes |
|----------|---------|-------------|
| `GET /api/auth/resolve-role` | Role resolution after login | `SESSION_EXPIRED`, `AUTH_REQUIRED` |
| `POST /api/auth/callback` | OAuth/magic link callback | `SESSION_EXPIRED`, `AUTH_REQUIRED` |
| `GET /api/patient/onboarding-status` | Check onboarding completion | `SESSION_EXPIRED`, `AUTH_REQUIRED` |
| `POST /api/funnels/[slug]/assessments` | Start assessment | `SESSION_EXPIRED`, `AUTH_REQUIRED` |
| `GET /api/funnels/[slug]/assessments/[id]` | Get assessment status | `SESSION_EXPIRED`, `AUTH_REQUIRED` |
| `POST /api/funnels/[slug]/assessments/[id]/complete` | Complete assessment | `SESSION_EXPIRED`, `AUTH_REQUIRED` |
| `POST /api/assessment-answers/save` | Save assessment answers | `SESSION_EXPIRED`, `AUTH_REQUIRED` |

All patient-facing endpoints that require authentication follow this contract.

---

## Implementation Details

### Server-Side Detection

The server uses the following patterns to detect session expiry:

```typescript
// Error message patterns checked (case-insensitive):
- "jwt expired"
- "token expired"
- "session expired"
- "refresh_token_not_found"
- "invalid refresh token"
```

When `supabase.auth.getUser()` returns an error matching these patterns, the server responds with `SESSION_EXPIRED` instead of generic `AUTH_REQUIRED`.

### Helper Functions

**Server-side:**
```typescript
import { isSessionExpired } from '@/lib/api/authHelpers'
import { sessionExpiredResponse } from '@/lib/api/responses'

const { data: { user }, error } = await supabase.auth.getUser()

if (error) {
  if (isSessionExpired(error)) {
    return sessionExpiredResponse()
  }
  return unauthorizedResponse()
}
```

---

## Mobile Client Recommendations

### Session State Management

1. **Store Session Securely**
   - Use iOS Keychain for tokens
   - Never store in UserDefaults or plain files
   - Clear on logout and session expiry

2. **Monitor Token Expiry**
   - Track access token expiry time
   - Attempt refresh 5-10 minutes before expiry
   - Handle refresh failures gracefully

3. **Detect Session Expiry**
   - Check for `SESSION_EXPIRED` error code in all API responses
   - Treat as unrecoverable - force re-authentication
   - Clear local state and navigate to login

4. **Handle Network Errors**
   - Distinguish between network failures and session expiry
   - Network errors: allow retry with backoff
   - Session expiry: immediate logout, no retry

### Error Handling Example (Swift)

```swift
func handleAPIError(_ error: APIError) {
    switch error.code {
    case "SESSION_EXPIRED":
        // Clear session
        authManager.clearSession()
        
        // Show user-friendly message
        showAlert(
            title: "Session Expired",
            message: "Your session has expired. Please log in again."
        )
        
        // Navigate to login
        coordinator.showLogin()
        
    case "AUTH_REQUIRED":
        // User not logged in, navigate to login
        coordinator.showLogin()
        
    case "FORBIDDEN":
        // User logged in but lacks permission
        showAlert(
            title: "Access Denied",
            message: "You don't have permission to access this resource."
        )
        
    default:
        // Handle other errors
        handleGenericError(error)
    }
}
```

---

## Testing Scenarios

### Manual Testing

1. **Normal Session Flow**
   - Login → API call → Success
   - Verify tokens are stored securely
   - Verify API calls succeed with valid session

2. **Token Refresh**
   - Login → Wait for token to expire → API call
   - Verify automatic refresh happens (if refresh token valid)
   - Verify API call succeeds after refresh

3. **Session Expiry**
   - Login → Manually invalidate tokens → API call
   - Verify `SESSION_EXPIRED` response
   - Verify client clears session and redirects to login

4. **No Session**
   - Clear all tokens → API call
   - Verify `AUTH_REQUIRED` response
   - Verify client redirects to login without error message

### Automated Testing

Test that all endpoints return correct error codes:

```typescript
// Example: Test session expiry on /api/auth/resolve-role
test('returns SESSION_EXPIRED when JWT expired', async () => {
  const expiredError = new Error('JWT expired')
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: expiredError
  })
  
  const response = await GET()
  const json = await response.json()
  
  expect(response.status).toBe(401)
  expect(json.error.code).toBe('SESSION_EXPIRED')
})
```

---

## Troubleshooting

### Common Issues

**Issue:** Getting `SESSION_EXPIRED` immediately after login  
**Cause:** Clock skew between client and server  
**Fix:** Ensure device time is accurate (enable automatic time sync)

**Issue:** Session expires too quickly (< 1 hour)  
**Cause:** Supabase configuration or token lifetime settings  
**Fix:** Check Supabase project settings for JWT expiry

**Issue:** Getting `AUTH_REQUIRED` instead of `SESSION_EXPIRED`  
**Cause:** Error message doesn't match detection patterns  
**Fix:** Check server logs for actual error message, update detection patterns if needed

**Issue:** App doesn't redirect to login on session expiry  
**Cause:** Client not checking `error.code`  
**Fix:** Implement proper error code checking in API response handling

---

## Changelog

**v0.7 (2026-01-13) - E6.2.6**
- Added `SESSION_EXPIRED` error code
- Implemented session expiry detection across all patient endpoints
- Documented consistent 401-first error handling contract

---

## Related Documentation

- [Mobile API Error Reference](./API_ERRORS.md)
- [Mobile API Surface](./MOBILE_API_SURFACE.md)
- [Deep Links](./DEEP_LINKS.md)
