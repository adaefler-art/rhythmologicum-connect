# Deep Link Contract — iOS v0.7

**Version:** v0.7  
**Last Updated:** 2026-01-13  
**Status:** Canonical - Implementation Contract for iOS  
**Related Issue:** E6.2.5 — Deep Link Contract (Routes + Params + Security)

---

## Overview

This document defines the **deep linking contract** for Rhythmologicum Connect iOS mobile application (v0.7). It establishes URL schemes, entry points, parameter rules, authentication requirements, and security guidelines.

**Purpose:**
- Define iOS-compatible deep link URL patterns (custom scheme and universal links)
- Specify entry points for key patient flows
- Document parameter validation and authentication gating
- Ensure security through ID-based lookups (no PHI in URLs)
- Provide web fallback routes for universal links

**Audience:** iOS developers, backend API maintainers, product managers

**Version:** v0.7 (2026-01)

---

## URL Schemes

### Custom URL Scheme: `rhythm://`

**Format:** `rhythm://[action]/[path]?[parameters]`

**Capabilities:**
- ✅ Deep linking from push notifications
- ✅ Deep linking from email links (if iOS configured)
- ✅ Inter-app navigation
- ❌ Web browser support (requires universal links)

**Example:**
```
rhythm://funnel/stress
rhythm://assessment/resume/550e8400-e29b-41d4-a716-446655440000
rhythm://result/550e8400-e29b-41d4-a716-446655440000
rhythm://notifications
```

### Universal Links: `https://app.rhythmologicum.com/`

**Format:** `https://app.rhythmologicum.com/mobile/[path]?[parameters]`

**Capabilities:**
- ✅ Deep linking from web browsers
- ✅ Deep linking from email links
- ✅ Deep linking from SMS
- ✅ Automatic fallback to web view if app not installed
- ✅ SEO and social media preview support

**Example:**
```
https://app.rhythmologicum.com/mobile/funnel/stress
https://app.rhythmologicum.com/mobile/assessment/resume/550e8400-e29b-41d4-a716-446655440000
https://app.rhythmologicum.com/mobile/result/550e8400-e29b-41d4-a716-446655440000
https://app.rhythmologicum.com/mobile/notifications
```

**Apple App Site Association (AASA):**
- Domain: `app.rhythmologicum.com`
- Path prefix: `/mobile/*`
- AASA file location: `https://app.rhythmologicum.com/.well-known/apple-app-site-association`

---

## Entry Points

### 1. Open Funnel (Start New Assessment)

**Purpose:** Launch a specific assessment funnel (stress, resilience, etc.)

#### Custom Scheme
```
rhythm://funnel/{funnelSlug}
```

#### Universal Link
```
https://app.rhythmologicum.com/mobile/funnel/{funnelSlug}
```

#### Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `funnelSlug` | Path Param | Yes | Funnel identifier (e.g., "stress", "resilience") | Alphanumeric + hyphens, max 50 chars |
| `source` | Query Param | No | Tracking source (e.g., "notification", "email") | Alphanumeric + hyphens, max 50 chars |

#### Examples
```
rhythm://funnel/stress
rhythm://funnel/stress?source=notification
https://app.rhythmologicum.com/mobile/funnel/stress?source=email
```

#### Authentication
- **Required:** Yes
- **Role:** Patient (authenticated user)
- **Behavior if not authenticated:** Redirect to login with return URL

#### Authorization
- **Check:** User must have access to the funnel (check `funnels.is_active` and tenant-based RLS)
- **Behavior if unauthorized:** Show error message "Funnel nicht verfügbar" + redirect to home

#### App Behavior
1. Check authentication status
2. If not authenticated: Show login → return to deep link after login
3. If authenticated: Fetch funnel from `/api/funnels/catalog/{slug}`
4. If funnel inactive or not found: Show error → redirect to home
5. If funnel active: Navigate to funnel start screen (`/patient/funnel/{slug}`)
6. Start new assessment via `POST /api/funnels/{slug}/assessments`

#### Web Fallback (Universal Link)
- **If app not installed:** Redirect to `https://app.rhythmologicum.com/patient/funnel/{funnelSlug}`
- **Fallback page:** Web version of funnel start screen with app install prompt

#### Security
- ✅ No PHI in URL
- ✅ Funnel slug is public identifier (not sensitive)
- ✅ Actual assessment data fetched server-side after authentication

---

### 2. Resume Assessment (Continue In-Progress Assessment)

**Purpose:** Resume a specific in-progress assessment

#### Custom Scheme
```
rhythm://assessment/resume/{assessmentId}
```

#### Universal Link
```
https://app.rhythmologicum.com/mobile/assessment/resume/{assessmentId}
```

#### Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `assessmentId` | Path Param | Yes | Assessment UUID | Valid UUID v4 format |
| `source` | Query Param | No | Tracking source | Alphanumeric + hyphens, max 50 chars |

#### Examples
```
rhythm://assessment/resume/550e8400-e29b-41d4-a716-446655440000
rhythm://assessment/resume/550e8400-e29b-41d4-a716-446655440000?source=notification
https://app.rhythmologicum.com/mobile/assessment/resume/550e8400-e29b-41d4-a716-446655440000
```

#### Authentication
- **Required:** Yes
- **Role:** Patient (authenticated user)
- **Behavior if not authenticated:** Redirect to login with return URL

#### Authorization
- **Check:** User must own the assessment (check `assessments.patient_id = auth.uid()`)
- **Behavior if unauthorized:** Show error "Zugriff verweigert" + redirect to home
- **Behavior if assessment not found:** Show error "Assessment nicht gefunden" + redirect to home

#### App Behavior
1. Check authentication status
2. If not authenticated: Show login → return to deep link after login
3. If authenticated: Fetch assessment from `GET /api/assessments/{assessmentId}/resume`
4. Verify ownership (API will enforce via RLS)
5. If assessment completed: Redirect to result view (entry point #3)
6. If assessment in progress: Navigate to current step
7. Load current step from response `currentStep` field

#### Web Fallback (Universal Link)
- **If app not installed:** Redirect to `https://app.rhythmologicum.com/patient/assessment?id={assessmentId}`
- **Fallback page:** Web version of assessment resume screen with app install prompt

#### Security
- ✅ No PHI in URL (only assessment UUID)
- ✅ Assessment ID is opaque identifier
- ✅ Ownership verified server-side via RLS policies
- ✅ All assessment data (questions, answers, patient info) fetched server-side after auth check
- ⚠️ Assessment UUID is considered non-sensitive (guessing is infeasible, RLS enforces ownership)

---

### 3. Open Result (View Completed Assessment)

**Purpose:** View the result/report of a completed assessment

#### Custom Scheme
```
rhythm://result/{assessmentId}
```

#### Universal Link
```
https://app.rhythmologicum.com/mobile/result/{assessmentId}
```

#### Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `assessmentId` | Path Param | Yes | Assessment UUID | Valid UUID v4 format |
| `source` | Query Param | No | Tracking source | Alphanumeric + hyphens, max 50 chars |

#### Examples
```
rhythm://result/550e8400-e29b-41d4-a716-446655440000
rhythm://result/550e8400-e29b-41d4-a716-446655440000?source=notification
https://app.rhythmologicum.com/mobile/result/550e8400-e29b-41d4-a716-446655440000
```

#### Authentication
- **Required:** Yes
- **Role:** Patient (authenticated user)
- **Behavior if not authenticated:** Redirect to login with return URL

#### Authorization
- **Check:** User must own the assessment (check `assessments.patient_id = auth.uid()`)
- **Behavior if unauthorized:** Show error "Zugriff verweigert" + redirect to home
- **Behavior if assessment not found:** Show error "Ergebnis nicht gefunden" + redirect to home
- **Behavior if assessment not completed:** Show error "Assessment noch nicht abgeschlossen" + redirect to home

#### App Behavior
1. Check authentication status
2. If not authenticated: Show login → return to deep link after login
3. If authenticated: Fetch result from `GET /api/funnels/{slug}/assessments/{assessmentId}/result`
4. Verify ownership (API will enforce via RLS)
5. If assessment not completed: Show error → redirect to home or resume assessment
6. If assessment completed: Navigate to result screen
7. Display assessment result with scores, recommendations, etc.

#### Web Fallback (Universal Link)
- **If app not installed:** Redirect to `https://app.rhythmologicum.com/patient/result?id={assessmentId}`
- **Fallback page:** Web version of result screen with app install prompt

#### Security
- ✅ No PHI in URL (only assessment UUID)
- ✅ Assessment ID is opaque identifier
- ✅ Ownership verified server-side via RLS policies
- ✅ All result data (scores, recommendations, reports) fetched server-side after auth check
- ⚠️ Assessment UUID is considered non-sensitive (guessing is infeasible, RLS enforces ownership)

---

### 4. Open Notification Center

**Purpose:** Open the in-app notification center / inbox

#### Custom Scheme
```
rhythm://notifications
```

#### Universal Link
```
https://app.rhythmologicum.com/mobile/notifications
```

#### Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `notificationId` | Query Param | No | Specific notification UUID to highlight/open | Valid UUID v4 format |
| `source` | Query Param | No | Tracking source | Alphanumeric + hyphens, max 50 chars |

#### Examples
```
rhythm://notifications
rhythm://notifications?notificationId=550e8400-e29b-41d4-a716-446655440000
https://app.rhythmologicum.com/mobile/notifications?notificationId=550e8400-e29b-41d4-a716-446655440000&source=push
```

#### Authentication
- **Required:** Yes
- **Role:** Patient (authenticated user)
- **Behavior if not authenticated:** Redirect to login with return URL

#### Authorization
- **Check:** User can only view their own notifications (check `notifications.user_id = auth.uid()`)
- **Behavior if unauthorized:** Show error "Zugriff verweigert" + redirect to home

#### App Behavior
1. Check authentication status
2. If not authenticated: Show login → return to deep link after login
3. If authenticated: Navigate to notification center screen
4. If `notificationId` provided:
   - Scroll to/highlight specific notification
   - Mark notification as read (`PATCH /api/notifications/{notificationId}/read`)
5. If `notificationId` not provided:
   - Show full notification list
6. Fetch notifications from `GET /api/notifications` (patient-scoped)

#### Web Fallback (Universal Link)
- **If app not installed:** Redirect to `https://app.rhythmologicum.com/patient/notifications`
- **Fallback page:** Web version of notification center with app install prompt

#### Security
- ✅ No PHI in URL (only notification UUID)
- ✅ Notification ID is opaque identifier
- ✅ Ownership verified server-side via RLS policies
- ✅ All notification content fetched server-side after auth check
- ⚠️ Notification UUID is considered non-sensitive (guessing is infeasible, RLS enforces ownership)

---

## Parameter Validation Rules

### General Principles

1. **Validate all parameters before use**
   - Path parameters: UUID format, slug format, alphanumeric patterns
   - Query parameters: Length limits, character whitelists
   - Reject invalid parameters immediately

2. **Fail-safe defaults**
   - Missing optional parameters should not break functionality
   - Invalid optional parameters should be ignored (with logging)
   - Invalid required parameters should show error + redirect to safe screen

3. **Length limits**
   - UUIDs: Exactly 36 characters (with hyphens) or 32 characters (without)
   - Slugs: Max 50 characters
   - Source tracking: Max 50 characters
   - General query params: Max 255 characters

4. **Character whitelists**
   - UUIDs: `[a-f0-9-]` (lowercase hex + hyphens)
   - Slugs: `[a-z0-9-]` (lowercase alphanumeric + hyphens)
   - Source tracking: `[a-zA-Z0-9-_]` (alphanumeric + hyphens + underscores)

### UUID Validation

```typescript
// iOS/Swift example
func isValidUUID(_ uuid: String) -> Bool {
  let uuidRegex = "^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$"
  return uuid.range(of: uuidRegex, options: .regularExpression) != nil
}
```

```typescript
// TypeScript/Backend example
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const isValid = uuidSchema.safeParse(assessmentId).success
```

### Slug Validation

```typescript
// iOS/Swift example
func isValidSlug(_ slug: String) -> Bool {
  guard slug.count <= 50 else { return false }
  let slugRegex = "^[a-z0-9-]+$"
  return slug.range(of: slugRegex, options: .regularExpression) != nil
}
```

```typescript
// TypeScript/Backend example
import { z } from 'zod'

const slugSchema = z.string().regex(/^[a-z0-9-]+$/).max(50)
const isValid = slugSchema.safeParse(funnelSlug).success
```

---

## Authentication &amp; Authorization Gating

### Authentication Flow

**All deep links require authentication.** The flow is:

1. **Deep link received** → Parse URL
2. **Check authentication state**
   - If authenticated: Proceed to authorization check
   - If not authenticated: Redirect to login with return URL
3. **After login:** Return to original deep link destination

### Login with Return URL

```
rhythm://login?returnUrl=rhythm://assessment/resume/550e8400-e29b-41d4-a716-446655440000
```

**Implementation:**
- Store `returnUrl` in app state/keychain
- After successful login: Parse and navigate to `returnUrl`
- Validate `returnUrl` is a valid `rhythm://` link before navigation

### Authorization Checks

After authentication, verify user has access to the resource:

| Entry Point | Authorization Check | Enforcement |
|-------------|---------------------|-------------|
| Open Funnel | Funnel is active | API check + RLS |
| Resume Assessment | User owns assessment | RLS policy |
| Open Result | User owns assessment + assessment completed | RLS policy + API check |
| Notifications | User owns notification | RLS policy |

**Row Level Security (RLS) Policies:**
- `assessments`: `patient_id = auth.uid()` (patient can only see their own)
- `notifications`: `user_id = auth.uid()` (user can only see their own)
- `funnels`: Public read access (filtered by `is_active`)

**API Enforcement:**
- All API endpoints use Supabase RLS automatically
- Additional checks in route handlers where needed (e.g., assessment completion status)

---

## Security Guidelines

### Core Principles

1. **No PHI (Protected Health Information) in URLs**
   - ❌ Never include: names, dates of birth, email addresses, phone numbers
   - ❌ Never include: assessment scores, answers, diagnoses
   - ✅ Only include: opaque identifiers (UUIDs), public slugs

2. **ID-Based Lookups**
   - All sensitive data fetched server-side using UUIDs
   - UUIDs are cryptographically random (guessing is infeasible)
   - RLS policies enforce ownership checks

3. **HTTPS Only for Universal Links**
   - All universal links must use HTTPS
   - No mixed content (HTTP resources)
   - Valid SSL certificate required

4. **URL Tampering Prevention**
   - Always validate UUIDs server-side
   - Never trust client-provided IDs without ownership check
   - Log suspicious access attempts

### Threat Model

| Threat | Mitigation |
|--------|------------|
| URL interception (man-in-the-middle) | HTTPS for universal links, minimize sensitive data |
| URL sharing (accidental forwarding) | UUIDs are opaque, RLS enforces ownership |
| URL guessing (brute force) | UUIDs are 128-bit random, guessing is infeasible |
| Unauthorized access (stolen link) | Authentication required, ownership verified via RLS |
| URL tampering (modified parameters) | Server-side validation, reject invalid UUIDs |

### PHI Exposure Risk Assessment

| Entry Point | URL Contains | Risk Level | Mitigation |
|-------------|--------------|------------|------------|
| Open Funnel | Funnel slug (e.g., "stress") | **LOW** | Slug is public info, no patient data |
| Resume Assessment | Assessment UUID | **LOW** | UUID is opaque, RLS enforces ownership |
| Open Result | Assessment UUID | **LOW** | UUID is opaque, RLS enforces ownership |
| Notifications | Notification UUID (optional) | **LOW** | UUID is opaque, RLS enforces ownership |

**Risk Classification:**
- **LOW:** No PHI exposure, opaque identifiers only
- **MEDIUM:** Indirect PHI exposure (e.g., patient ID + timestamp)
- **HIGH:** Direct PHI exposure (e.g., name, DOB, diagnosis)

**All entry points are rated LOW** because they use opaque UUIDs with server-side ownership checks.

### Logging &amp; Monitoring

**Log all deep link access attempts:**
```json
{
  "timestamp": "2026-01-13T08:30:00Z",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "deep_link_access",
  "entryPoint": "resume_assessment",
  "assessmentId": "660e8400-e29b-41d4-a716-446655440111",
  "source": "notification",
  "authenticated": true,
  "authorized": true,
  "outcome": "success"
}
```

**Alert on suspicious patterns:**
- Multiple failed authorization attempts (potential stolen link)
- High frequency of deep link access (potential automated attack)
- Invalid UUID formats (potential tampering)

---

## Web Fallback Routes

### Fallback Strategy

**Goal:** Graceful degradation when iOS app is not installed

**Approach:** Universal links redirect to web version of the same screen

### Fallback Mapping

| Deep Link Entry Point | Web Fallback Route |
|-----------------------|--------------------|
| `rhythm://funnel/{slug}` | `https://app.rhythmologicum.com/patient/funnel/{slug}` |
| `rhythm://assessment/resume/{id}` | `https://app.rhythmologicum.com/patient/assessment?id={id}` |
| `rhythm://result/{id}` | `https://app.rhythmologicum.com/patient/result?id={id}` |
| `rhythm://notifications` | `https://app.rhythmologicum.com/patient/notifications` |

### Web Fallback Implementation

**Server-side detection (Next.js middleware or route handler):**
```typescript
// Detect if request is from iOS app or web browser
const userAgent = request.headers.get('user-agent') || ''
const isIOSApp = userAgent.includes('RhythmologicumConnect/iOS')

if (!isIOSApp) {
  // Redirect to web version
  return NextResponse.redirect(
    new URL(`/patient/funnel/${funnelSlug}`, request.url)
  )
}
```

**Web fallback page features:**
1. **App install prompt:** "Diese Seite funktioniert am besten in der Rhythmologicum Connect App."
2. **App Store link:** Direct link to iOS App Store
3. **Continue in web:** Full-featured web version as fallback
4. **Smart banner:** iOS Smart App Banner (`<meta name="apple-itunes-app" content="app-id=YOUR_APP_ID">`)

### Universal Link Configuration

**AASA File Example (`/.well-known/apple-app-site-association`):**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.rhythmologicum.connect",
        "paths": [
          "/mobile/*"
        ]
      }
    ]
  }
}
```

**Next.js Route Structure:**
```
/app/mobile/
  funnel/[slug]/page.tsx          → Detect + redirect to iOS or web
  assessment/resume/[id]/page.tsx → Detect + redirect to iOS or web
  result/[id]/page.tsx            → Detect + redirect to iOS or web
  notifications/page.tsx          → Detect + redirect to iOS or web
```

---

## Implementation Checklist (iOS v0.7)

### 1. URL Scheme Registration
- [ ] Register `rhythm://` custom URL scheme in Xcode project
- [ ] Configure Associated Domains capability for `app.rhythmologicum.com`
- [ ] Implement `application(_:open:options:)` for custom scheme
- [ ] Implement `application(_:continue:restorationHandler:)` for universal links

### 2. Deep Link Parsing
- [ ] Create URL parser to extract action + parameters
- [ ] Validate UUID format for assessment/result/notification IDs
- [ ] Validate slug format for funnel identifiers
- [ ] Handle malformed URLs gracefully (show error + redirect to home)

### 3. Authentication Integration
- [ ] Check authentication state on deep link open
- [ ] Redirect to login with return URL if not authenticated
- [ ] Resume deep link navigation after successful login
- [ ] Validate return URL before navigation

### 4. Navigation Logic
- [ ] Route to funnel start screen from `rhythm://funnel/{slug}`
- [ ] Route to assessment resume from `rhythm://assessment/resume/{id}`
- [ ] Route to result screen from `rhythm://result/{id}`
- [ ] Route to notification center from `rhythm://notifications`
- [ ] Handle deep links while app is running (foreground/background)

### 5. Authorization Checks
- [ ] Verify funnel is active before starting assessment
- [ ] Verify user owns assessment before resuming
- [ ] Verify assessment is completed before showing result
- [ ] Verify user owns notification before opening

### 6. Error Handling
- [ ] Show user-friendly error for invalid URLs
- [ ] Show user-friendly error for unauthorized access
- [ ] Show user-friendly error for not found resources
- [ ] Log all errors for debugging

### 7. Analytics &amp; Tracking
- [ ] Track deep link opens (entry point, source, outcome)
- [ ] Track authentication flow from deep links
- [ ] Track conversion rate (deep link → completed action)
- [ ] Track fallback usage (web vs app)

### 8. Testing
- [ ] Test custom scheme deep links (rhythm://)
- [ ] Test universal links (https://app.rhythmologicum.com/mobile/*)
- [ ] Test authentication flow with return URL
- [ ] Test authorization failures (wrong user, inactive funnel, etc.)
- [ ] Test web fallback (app not installed)
- [ ] Test deep links from notifications (push, email, SMS)

---

## API Endpoint Reference

### Required Endpoints for Deep Linking

| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/api/funnels/catalog/{slug}` | GET | Verify funnel exists + active | Open Funnel |
| `/api/funnels/{slug}/assessments` | POST | Start new assessment | Open Funnel |
| `/api/assessments/{id}/resume` | GET | Get assessment status + current step | Resume Assessment |
| `/api/funnels/{slug}/assessments/{id}/result` | GET | Get completed assessment result | Open Result |
| `/api/notifications` | GET | List user notifications | Notifications |
| `/api/notifications/{id}/read` | PATCH | Mark notification as read | Notifications |

**Full API documentation:** See `docs/mobile/MOBILE_API_SURFACE.md`

---

## Examples

### Example 1: Push Notification → Resume Assessment

**Push notification payload:**
```json
{
  "title": "Fragebogen fortsetzen",
  "body": "Sie haben einen Fragebogen begonnen. Möchten Sie fortfahren?",
  "data": {
    "deepLink": "rhythm://assessment/resume/550e8400-e29b-41d4-a716-446655440000",
    "source": "push_notification"
  }
}
```

**User flow:**
1. User taps notification
2. iOS opens app with `rhythm://assessment/resume/550e8400-e29b-41d4-a716-446655440000`
3. App checks authentication → User is logged in
4. App fetches assessment: `GET /api/assessments/550e8400-e29b-41d4-a716-446655440000/resume`
5. API verifies ownership via RLS
6. App navigates to current step (e.g., step 3 of 5)
7. User completes assessment

### Example 2: Email Link → View Result

**Email content:**
```html
<p>Ihr Stress-Assessment ist abgeschlossen!</p>
<a href="https://app.rhythmologicum.com/mobile/result/660e8400-e29b-41d4-a716-446655440111?source=email">
  Ergebnis anzeigen
</a>
```

**User flow (app installed):**
1. User clicks email link in iOS Mail app
2. iOS recognizes universal link → Opens Rhythmologicum Connect app
3. App parses URL: `/mobile/result/660e8400-e29b-41d4-a716-446655440111?source=email`
4. App checks authentication → User is logged in
5. App fetches result: `GET /api/funnels/stress/assessments/660e8400-e29b-41d4-a716-446655440111/result`
6. API verifies ownership + completion status
7. App displays result screen with scores and recommendations

**User flow (app not installed):**
1. User clicks email link in iOS Mail app
2. iOS opens link in Safari
3. Server detects non-app user agent → Redirects to `/patient/result?id=660e8400-e29b-41d4-a716-446655440111`
4. Web page shows app install prompt + full web version of result
5. User can install app or continue in web

### Example 3: SMS Link → Start Funnel

**SMS content:**
```
Starten Sie Ihr Stress-Assessment: https://app.rhythmologicum.com/mobile/funnel/stress?source=sms
```

**User flow:**
1. User taps SMS link
2. iOS recognizes universal link → Opens app
3. App parses URL: `/mobile/funnel/stress?source=sms`
4. App checks authentication → User is not logged in
5. App redirects to login with return URL: `rhythm://funnel/stress?source=sms`
6. User logs in successfully
7. App resumes deep link: Fetches funnel from `/api/funnels/catalog/stress`
8. App navigates to funnel start screen
9. User starts new assessment

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v0.7 | 2026-01-13 | Initial deep link contract for iOS v0.7 |

---

## Related Documentation

- **Mobile API Surface:** `docs/mobile/MOBILE_API_SURFACE.md`
- **Patient API Contracts:** `docs/PATIENT_API_CONTRACTS.md`
- **Shell Foundations:** `docs/mobile/SHELL_FOUNDATIONS.md`
- **API Route Ownership:** `docs/API_ROUTE_OWNERSHIP.md`
- **Navigation Architecture:** `docs/NAVIGATION_ARCHITECTURE.md`

---

## Support &amp; Questions

For questions about this contract, contact:
- **iOS Team:** iOS development questions
- **Backend Team:** API endpoint questions, RLS policy questions
- **Product Team:** Entry point requirements, user flow questions
