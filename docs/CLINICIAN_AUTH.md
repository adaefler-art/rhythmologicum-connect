# Clinician Authentication Setup

## Overview
The `/clinician` route is protected and accessible only to users with the `clinician` role. This document explains how to set up and manage clinician access.

## Architecture

### Authentication Flow
1. User logs in via the main login page (`/`)
2. Middleware (`middleware.ts`) intercepts requests to `/clinician/*`
3. Middleware checks:
   - User is authenticated
   - User has `role: 'clinician'` in their `app_metadata`
4. If checks fail, user is redirected to `/` with an error message
5. Unauthorized access attempts are logged to console

### Components
- **Middleware** (`middleware.ts`): Route protection and authentication checks
- **Clinician Layout** (`app/clinician/layout.tsx`): Protected layout with auth state management
- **Login Page** (`app/page.tsx`): Handles login and role-based redirects
- **Server Utils** (`lib/supabaseServer.ts`): Server-side authentication utilities

## Creating Clinician Users

### Option 1: SQL Function (Recommended)
After creating a user account, run this SQL in the Supabase SQL Editor:

```sql
SELECT set_user_role('doctor@example.com', 'clinician');
```

### Option 2: Direct SQL Update
```sql
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"clinician"'
)
WHERE email = 'doctor@example.com';
```

### Option 3: Programmatically via Supabase Admin API
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key required
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

await supabase.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'clinician' }
})
```

## Testing Authentication

### Test Scenarios
1. **No authentication**: Navigate to `/clinician` without logging in
   - Expected: Redirect to `/` with authentication error message

2. **Patient role**: Login as a patient (no role or `role: 'patient'`)
   - Expected: Redirect to `/` with access denied message

3. **Clinician role**: Login as a user with `role: 'clinician'`
   - Expected: Access granted to `/clinician` dashboard

4. **Session persistence**: Refresh page while logged in as clinician
   - Expected: Remain on `/clinician` without redirect

5. **Logout**: Click logout button in clinician dashboard
   - Expected: Redirect to `/` and session cleared

### Manual Testing Steps
1. Create a test user via the signup form
2. Set their role to `clinician` using one of the methods above
3. Login with the test user credentials
4. Verify redirect to `/clinician`
5. Verify dashboard displays correctly
6. Test logout functionality

## Security Features

### Access Control
- **Middleware protection**: All `/clinician/*` routes are protected at the middleware level
- **Client-side validation**: Layout component validates auth state on mount and auth changes
- **Role validation**: Both middleware and layout verify the `clinician` role
- **Session persistence**: Supabase handles session persistence across page reloads

### Logging
Unauthorized access attempts are logged with:
- Path attempted
- User ID (if authenticated)
- Reason for denial
- Timestamp

Example log:
```
[AUTH] Unauthorized access attempt: {
  path: '/clinician',
  userId: 'anonymous',
  reason: 'not_authenticated',
  timestamp: '2025-12-06T17:45:00.000Z'
}
```

## Mobile Compatibility

The implementation works on both desktop and mobile:
- **Responsive layout**: Clinician dashboard uses responsive design
- **Touch-friendly**: Buttons and links are sized appropriately
- **Session handling**: Auth state persists across mobile app switches
- **Error messages**: Display properly on small screens

## Troubleshooting

### User redirected despite having clinician role
1. Check if role is in `app_metadata` (not `user_metadata`):
   ```sql
   SELECT id, email, raw_app_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'doctor@example.com';
   ```

2. Verify the role value is exactly `'clinician'` (case-sensitive)

3. Clear browser cookies and login again

### Access logs not appearing
- Logs are written to `console.warn`
- Check server console (not browser console)
- Ensure you're looking at the correct environment (dev/production)

### Session not persisting
1. Check if cookies are enabled in browser
2. Verify Supabase environment variables are set correctly
3. Check if third-party cookies are blocked

## Related Files
- `middleware.ts` - Route protection
- `app/clinician/layout.tsx` - Protected layout
- `app/clinician/page.tsx` - Dashboard view
- `app/page.tsx` - Login page with role-based routing
- `lib/supabaseServer.ts` - Server-side auth utilities
- `lib/supabaseClient.ts` - Client-side Supabase client
- `supabase/migrations/20251206174500_add_clinician_role_support.sql` - Database migration
