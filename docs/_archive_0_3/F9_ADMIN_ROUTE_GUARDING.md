# F9 – Admin-Route-Guarding Implementation

## Overview

This document describes the implementation of RBAC (Role-Based Access Control) for `/admin/content` routes and all admin-related API endpoints, ensuring that only authorized users (Clinician/Admin roles) can access administrative functionality.

## Acceptance Criteria

✅ **Nur Admin/Clinician haben Zugriff** - Only users with 'admin' or 'clinician' role can access  
✅ **Patienten/Unregistered → Redirect / Fehlerseite** - Unauthorized users are redirected with error messages  
✅ **Logging optional** - All unauthorized access attempts are logged with details

## Implementation

### 1. Proxy-Based Route Protection (`proxy.ts`)

The `proxy.ts` file (Next.js middleware) provides the first line of defense for all `/admin/*` routes:

**Key Features:**
- Intercepts all requests to `/admin/*` and `/clinician/*` routes
- Validates user authentication via Supabase session
- Checks user role from `app_metadata` or `user_metadata`
- Allows access for both `'clinician'` and `'admin'` roles
- Redirects unauthorized users with clear error messages
- Logs all unauthorized access attempts

**Protected Routes:**
- `/admin/*` - All admin routes (content management, funnels, etc.)
- `/clinician/*` - All clinician dashboard routes

**Redirect Behavior:**
- Unauthenticated users → `/?error=authentication_required&message=Bitte melden Sie sich an.`
- Authenticated but insufficient permissions → `/?error=access_denied&message=Sie haben keine Berechtigung...`

### 2. Server-Side Helper Functions (`lib/supabaseServer.ts`)

Added utility functions for role checking:

```typescript
export async function hasClinicianRole(): Promise<boolean>
export async function hasAdminOrClinicianRole(): Promise<boolean>
```

These functions:
- Get the current user from Supabase session
- Check role in both `app_metadata` and `user_metadata`
- Return boolean indicating if user has required role
- Can be used in server components and API routes

### 3. Client-Side Layout Protection (`app/admin/layout.tsx`)

The admin layout provides redundant client-side protection:

**Features:**
- Checks authentication on mount and auth state changes
- Validates user has `'clinician'` or `'admin'` role
- Shows loading state during authentication check
- Redirects unauthorized users immediately
- Subscribes to auth state changes for real-time protection

**User Experience:**
- Loading indicator: "Authentifizierung wird überprüft…"
- Auto-redirect on sign out
- Seamless navigation for authorized users

### 4. API Route Protection

All admin API endpoints verify authorization:

**Protected Endpoints:**
- `POST /api/admin/content-pages` - Create content page
- `GET /api/admin/content-pages` - List content pages
- `GET /api/admin/content-pages/[id]` - Get single page
- `PATCH /api/admin/content-pages/[id]` - Update page
- `POST /api/admin/content-pages/[id]/sections` - Create section
- `GET /api/admin/content-pages/[id]/sections` - List sections
- `PATCH /api/admin/content-pages/[id]/sections/[sectionId]` - Update section
- `GET /api/admin/funnels` - List funnels
- `GET /api/admin/funnels/[id]` - Get funnel details
- `PATCH /api/admin/funnels/[id]` - Update funnel
- `PATCH /api/admin/funnel-steps/[id]` - Update funnel step
- `PATCH /api/admin/funnel-step-questions/[id]` - Update question

**Authorization Pattern:**
```typescript
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const role = user.app_metadata?.role || user.user_metadata?.role
// Allow access for clinician and admin roles
const hasAccess = role === 'clinician' || role === 'admin'
if (!hasAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## Security Layers

### Defense in Depth

The implementation uses multiple security layers:

1. **Proxy/Middleware Layer** (First line of defense)
   - Intercepts all HTTP requests
   - Blocks unauthorized access before reaching pages/APIs
   - Fast rejection of invalid requests

2. **Client-Side Layout** (UX protection)
   - Prevents UI flicker for unauthorized users
   - Handles auth state changes in real-time
   - Provides immediate feedback

3. **API Route Protection** (Backend security)
   - Validates every API request independently
   - Ensures no data exposure via direct API calls
   - Works even if middleware is bypassed

4. **Database RLS Policies** (Data layer - existing)
   - Row Level Security policies restrict data access
   - Final safeguard at the database level

## Logging

All unauthorized access attempts are logged with comprehensive details:

```javascript
console.warn('[AUTH] Unauthorized access attempt:', {
  path: '/admin/content',
  userId: 'user-uuid' || 'anonymous',
  userEmail: 'user@example.com', // if authenticated
  userRole: 'patient' || 'none',
  reason: 'insufficient_permissions' || 'not_authenticated',
  timestamp: '2025-12-10T21:00:00.000Z',
})
```

**Log Location:**
- Server console (not browser console)
- Check with `docker logs` or hosting platform logs

## Roles in the System

### Current Role Structure

The system currently recognizes two privileged roles:

- **`clinician`** - Medical professionals with access to:
  - Clinician dashboard (`/clinician/*`)
  - Admin content management (`/admin/*`)
  - All patient data (via RLS policies)
  - Funnel configuration
  
- **`admin`** (future-ready) - Administrative users with access to:
  - Same permissions as clinician
  - Prepared for future role separation

- **`patient`** or no role - Regular users with access to:
  - Patient portal (`/patient/*`)
  - Own assessments and history only

### Role Assignment

Roles are stored in Supabase user metadata:
- `user.app_metadata.role` (primary)
- `user.user_metadata.role` (fallback)

**To assign clinician role:**
```sql
-- Option 1: Using helper function
SELECT set_user_role('doctor@example.com', 'clinician');

-- Option 2: Direct update
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"clinician"'
)
WHERE email = 'doctor@example.com';
```

## Testing

### Manual Test Scenarios

#### 1. Unauthenticated Access
**Steps:**
1. Ensure you're logged out
2. Navigate to `/admin/content`

**Expected:**
- Immediate redirect to `/?error=authentication_required`
- Error message: "Bitte melden Sie sich an."
- Log entry in server console

#### 2. Patient Access
**Steps:**
1. Login as patient (no role or `role: 'patient'`)
2. Try to navigate to `/admin/content`

**Expected:**
- Redirect to `/?error=access_denied`
- Error message: "Sie haben keine Berechtigung..."
- Log entry with user ID and role

#### 3. Clinician Access
**Steps:**
1. Login as clinician (`role: 'clinician'`)
2. Navigate to `/admin/content`

**Expected:**
- Access granted
- Admin dashboard displays
- No redirect or error

#### 4. API Direct Access
**Steps:**
1. Use curl or Postman to call `/api/admin/content-pages`
2. Try without auth token
3. Try with patient token
4. Try with clinician token

**Expected:**
- No token: 401 Unauthorized
- Patient token: 403 Forbidden
- Clinician token: 200 OK with data

### Automated Testing

While no automated tests exist yet, here are recommended test cases:

```typescript
// Proxy middleware tests
describe('Admin Route Protection', () => {
  it('blocks unauthenticated access to /admin/*')
  it('blocks patient access to /admin/*')
  it('allows clinician access to /admin/*')
  it('allows admin access to /admin/*')
  it('logs unauthorized attempts')
})

// API route tests
describe('Admin API Protection', () => {
  it('returns 401 for unauthenticated requests')
  it('returns 403 for patient requests')
  it('returns 200 for clinician requests')
  it('returns 200 for admin requests')
})
```

## Files Modified

### Core Files
- **`proxy.ts`** - Route middleware protection
- **`lib/supabaseServer.ts`** - Added `hasAdminOrClinicianRole()` helper

### Admin Components
- **`app/admin/layout.tsx`** - Client-side auth protection

### Admin API Routes (all updated with dual role support)
- `app/api/admin/content-pages/route.ts`
- `app/api/admin/content-pages/[id]/route.ts`
- `app/api/admin/content-pages/[id]/sections/route.ts`
- `app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts`
- `app/api/admin/funnels/route.ts`
- `app/api/admin/funnels/[id]/route.ts`
- `app/api/admin/funnel-steps/[id]/route.ts`
- `app/api/admin/funnel-step-questions/[id]/route.ts`

### Documentation
- **`docs/F9_ADMIN_ROUTE_GUARDING.md`** - This file

## Related Documentation

- [CLINICIAN_AUTH.md](./CLINICIAN_AUTH.md) - Clinician authentication details
- [D4_RLS_IMPLEMENTATION.md](./D4_RLS_IMPLEMENTATION.md) - Database-level security
- [E2_IMPLEMENTATION.md](./E2_IMPLEMENTATION.md) - Feature flags (clinician dashboard toggle)

## Troubleshooting

### User redirected despite having clinician role

1. **Check role in database:**
   ```sql
   SELECT id, email, raw_app_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'user@example.com';
   ```

2. **Verify role is in `app_metadata` not `user_metadata`:**
   - Helper functions check both, but `app_metadata` is preferred

3. **Clear cookies and login again:**
   - Session might have stale data

### Logs not appearing

- Check **server console**, not browser console
- Middleware logs appear in Next.js server output
- Check hosting platform logs (Vercel, Railway, etc.)

### Infinite redirect loop

- Usually caused by login page also being protected
- Ensure `/` (root) is **not** in protected routes
- Check `proxy.ts` matcher configuration

## Future Enhancements

Potential improvements for future iterations:

1. **Separate Admin Role:**
   - Create distinct `admin` role with more privileges
   - Restrict some features to admin only
   - Allow clinicians read-only access to certain admin features

2. **Permission Granularity:**
   - Fine-grained permissions (read, write, delete)
   - Permission-based access instead of role-based
   - Feature-specific permissions

3. **Audit Logging:**
   - Store unauthorized attempts in database
   - Admin dashboard to view security events
   - Alert on suspicious activity

4. **Rate Limiting:**
   - Limit failed access attempts
   - Temporary lockout for suspicious behavior
   - IP-based restrictions

5. **Two-Factor Authentication:**
   - Require 2FA for admin access
   - Enhanced security for sensitive operations

## Summary

F9 implementation provides comprehensive protection for admin routes through:

✅ **Middleware/Proxy protection** - Primary defense at HTTP level  
✅ **Client-side guards** - Immediate UX feedback  
✅ **API route validation** - Backend security  
✅ **Dual role support** - Future-ready for admin/clinician separation  
✅ **Comprehensive logging** - Audit trail of access attempts  
✅ **Clear error messages** - User-friendly feedback  
✅ **Defense in depth** - Multiple security layers  

The system is production-ready and provides secure access control for all administrative functionality.
