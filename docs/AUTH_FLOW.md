# Clinician Authentication Flow Diagram

## Request Flow for /clinician Route

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Request                                │
│                      GET /clinician                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Middleware                             │
│                       (middleware.ts)                               │
│                                                                     │
│  1. Create Supabase client with cookie support                     │
│  2. Call supabase.auth.getUser()                                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ User authenticated?                                       │      │
│  │                                                           │      │
│  │  NO  → Log + Redirect to /?error=authentication_required │      │
│  │                                                           │      │
│  │  YES → Check role in app_metadata                        │      │
│  │        │                                                  │      │
│  │        ├─ role === 'clinician'?                          │      │
│  │        │                                                  │      │
│  │        │  NO  → Log + Redirect to /?error=access_denied  │      │
│  │        │                                                  │      │
│  │        └─ YES → Allow request to continue                │      │
│  └──────────────────────────────────────────────────────────┘      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Clinician Layout                                │
│                  (app/clinician/layout.tsx)                         │
│                                                                     │
│  Client-side protection (redundant but safe):                      │
│                                                                     │
│  1. On mount:                                                       │
│     - Call supabase.auth.getUser()                                 │
│     - Verify user exists and has clinician role                    │
│     - Redirect if checks fail                                      │
│                                                                     │
│  2. Subscribe to auth changes:                                     │
│     - SIGNED_OUT → Redirect to /                                   │
│     - SIGNED_IN/TOKEN_REFRESHED → Verify role                      │
│     - Invalid role → Redirect with error                           │
│                                                                     │
│  3. Render:                                                         │
│     - Header with logout button                                    │
│     - Page content (children)                                      │
│     - Footer                                                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Clinician Page                                  │
│                   (app/clinician/page.tsx)                          │
│                                                                     │
│  Display dashboard with:                                            │
│  - List of reports                                                  │
│  - Patient information                                              │
│  - Links to detailed views                                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Login Flow with Role-Based Routing

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Login Page                                  │
│                        (app/page.tsx)                               │
│                                                                     │
│  User enters email + password                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Supabase Authentication                           │
│                                                                     │
│  supabase.auth.signInWithPassword()                                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Get User Profile                                │
│                                                                     │
│  supabase.auth.getUser()                                           │
│  Extract: user.app_metadata.role                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Role-Based Routing                               │
│                                                                     │
│  ┌────────────────────────────────────────────────┐                │
│  │ role === 'clinician'?                          │                │
│  │                                                │                │
│  │  YES → router.push('/clinician')               │                │
│  │                                                │                │
│  │  NO  → router.push('/patient/stress-check')    │                │
│  │        (after creating patient_profile)        │                │
│  └────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Unauthorized Access                             │
│                  (e.g., /clinician without auth)                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Middleware Detection                            │
│                                                                     │
│  Logs to console:                                                   │
│  {                                                                  │
│    path: '/clinician',                                             │
│    userId: 'anonymous',                                            │
│    reason: 'not_authenticated',                                    │
│    timestamp: '2025-12-06T17:45:00.000Z'                           │
│  }                                                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Redirect to Login                               │
│                                                                     │
│  URL: /?error=authentication_required                              │
│       &message=Bitte melden Sie sich an.                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Display Error                                   │
│                                                                     │
│  Login page reads URL parameters                                    │
│  Shows error message in red box                                     │
│  User can retry login                                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Session Persistence

```
User logs in
     │
     ▼
Supabase creates session
     │
     ├─ Access token (JWT)
     │  - Stored in HTTP-only cookie
     │  - Contains user metadata
     │  - Short expiry (1 hour)
     │
     └─ Refresh token
        - Stored in HTTP-only cookie
        - Used to get new access token
        - Longer expiry (30 days)

Page refresh/navigation
     │
     ▼
Middleware checks cookies
     │
     ├─ Access token valid?
     │  YES → Allow request
     │
     └─ Access token expired?
        - Supabase auto-refreshes using refresh token
        - New access token issued
        - Request continues

User closes browser
     │
     ▼
Cookies remain (unless deleted)
     │
     ▼
User returns later
     │
     ▼
Supabase checks refresh token
     │
     ├─ Still valid → New session created
     │
     └─ Expired → User must login again
```

## Key Protection Points

1. **Server-Side (Middleware)**
   - Runs before page renders
   - Cannot be bypassed by client
   - Checks authentication + role
   - Logs unauthorized attempts

2. **Client-Side (Layout)**
   - Validates on component mount
   - Subscribes to auth changes
   - Handles token refresh
   - Provides UI feedback

3. **Session Management**
   - Secure HTTP-only cookies
   - Automatic token refresh
   - Persistent across sessions
   - Managed by Supabase

## Security Guarantees

✅ **No client-side bypass**: Middleware protection happens server-side
✅ **Role verification**: Checked in both middleware and layout
✅ **Session security**: HTTP-only cookies prevent XSS theft
✅ **Audit trail**: All unauthorized attempts logged
✅ **Clear errors**: Users know why access denied
✅ **Automatic cleanup**: Token refresh prevents stale sessions
