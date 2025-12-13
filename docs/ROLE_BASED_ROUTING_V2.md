# Role-Based Navigation &amp; Routing V2

## Overview

This document describes the implementation of predictable, role-aware navigation and routing for the Rhythmologicum Connect application. The system supports three user roles: **Patient**, **Clinician**, and **Admin**.

## User Roles

### Patient
- **Default role** for new users
- Access to: `/patient/*` routes
- Can view their own assessments and history
- Limited access to clinician/admin features

### Clinician
- **Healthcare provider** role
- Access to: `/clinician/*` and `/admin/*` routes
- Can view all patient data and manage assessments
- Can configure funnels and content pages

### Admin
- **Administrative** role (currently treated as equivalent to clinician)
- Access to: `/clinician/*` and `/admin/*` routes
- Same permissions as clinician
- Future: May have additional administrative capabilities

## Architecture

### Core Utility: `lib/utils/roleBasedRouting.ts`

This module provides centralized role detection and routing logic:

#### Type Definitions

```typescript
export type UserRole = 'patient' | 'clinician' | 'admin'

export interface RoleNavItem {
  href: string
  label: string
  icon?: React.ReactNode
  active?: boolean
}
```

#### Key Functions

##### `getUserRole(user: User | null): UserRole | null`
Extracts the user's role from their metadata.

```typescript
const role = getUserRole(user)
// Returns: 'patient' | 'clinician' | 'admin' | null
```

##### `hasRole(user: User | null, requiredRole: UserRole): boolean`
Checks if user has a specific role.

```typescript
if (hasRole(user, 'clinician')) {
  // User is a clinician
}
```

##### `hasAnyRole(user: User | null, requiredRoles: UserRole[]): boolean`
Checks if user has any of the specified roles.

```typescript
if (hasAnyRole(user, ['clinician', 'admin'])) {
  // User has admin or clinician access
}
```

##### `getRoleLandingPage(user: User | null): string`
Returns the appropriate landing page after login based on role.

```typescript
const landingPage = getRoleLandingPage(user)
// Returns: '/clinician' | '/patient'
```

##### `getClinicianNavItems(pathname: string): RoleNavItem[]`
Returns navigation items for clinician/admin roles.

```typescript
const navItems = getClinicianNavItems(pathname)
// Returns: [
//   { href: '/clinician', label: 'Dashboard', active: true },
//   { href: '/clinician/funnels', label: 'Funnels', active: false },
//   { href: '/admin/content', label: 'Content', active: false }
// ]
```

##### `getPatientNavItems(pathname: string): RoleNavItem[]`
Returns navigation items for patient role.

```typescript
const navItems = getPatientNavItems(pathname)
// Returns: [
//   { href: '/patient/assessment', label: 'Assessments', active: true },
//   { href: '/patient/history', label: 'Verlauf', active: false }
// ]
```

##### `getRoleDisplayName(role: UserRole | null): string`
Returns German display name for role.

```typescript
const displayName = getRoleDisplayName('clinician')
// Returns: 'Clinician'
```

##### `canAccessRoute(user: User | null, route: string): boolean`
Checks if user can access a specific route.

```typescript
if (canAccessRoute(user, '/clinician/funnels')) {
  // User has access
}
```

## Implementation Details

### 1. Login Flow (`app/page.tsx`)

After successful authentication, the login page redirects users based on their role:

```typescript
const role = getUserRole(user)

// For patients: ensure patient_profile exists
if (role === 'patient') {
  await supabase.from('patient_profiles').upsert(...)
}

// Redirect based on role
if (role === 'clinician' && !featureFlags.CLINICIAN_DASHBOARD_ENABLED) {
  router.replace('/patient')
} else {
  const landingPage = getRoleLandingPage(user)
  router.replace(landingPage)
}
```

**Landing Pages by Role:**
- Patient → `/patient`
- Clinician → `/clinician`
- Admin → `/clinician`

### 2. Clinician Layout (`app/clinician/layout.tsx`)

The clinician layout:
- Verifies user has `clinician` or `admin` role
- Uses `DesktopLayout` component with sidebar navigation
- Shows role indicator: "Angemeldet als: Clinician"
- Provides consistent navigation across all clinician pages

**Navigation Items:**
- Dashboard (`/clinician`)
- Funnels (`/clinician/funnels`)
- Content (`/admin/content`)

**Authentication Check:**
```typescript
if (!hasAnyRole(user, ['clinician', 'admin'])) {
  router.push(ACCESS_DENIED_REDIRECT)
  return
}
```

### 3. Admin Layout (`app/admin/layout.tsx`)

The admin layout:
- Identical to clinician layout (uses same navigation)
- Verifies user has `clinician` or `admin` role
- Shows role indicator: "Angemeldet als: Administrator"
- Future: May diverge with admin-specific features

### 4. Patient Layout (`app/patient/layout.tsx`)

The patient layout:
- Custom mobile-first design with bottom tabs
- Desktop header with user info and logout button
- Shows role indicator in desktop view
- Simpler navigation focused on assessment workflow

**Navigation Items:**
- Assessments (`/patient/assessment`)
- Verlauf (`/patient/history`)

**Features:**
- Mobile bottom navigation with icons
- Desktop top navigation with tabs
- Logout button in desktop view
- Role display in desktop header

## Navigation Menu Differences

### Desktop (Clinician/Admin)
- **Sidebar Navigation** (collapsible)
- Dashboard, Funnels, Content
- User profile with email
- Theme toggle
- Logout button

### Desktop (Patient)
- **Top Tab Navigation**
- Assessments, Verlauf
- User info with role
- Logout button

### Mobile (Patient)
- **Bottom Tab Navigation** (sticky)
- Icon + label for each tab
- Assessments, Verlauf

## Route Protection

### Server-Side Protection
Route protection is handled in layout files:

```typescript
// Clinician/Admin routes
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push(AUTH_REQUIRED_REDIRECT)
      return
    }
    
    if (!hasAnyRole(user, ['clinician', 'admin'])) {
      router.push(ACCESS_DENIED_REDIRECT)
      return
    }
    
    setUser(user)
    setLoading(false)
  }
  checkAuth()
}, [router])
```

### Route Access Matrix

| Route Path | Patient | Clinician | Admin |
|------------|---------|-----------|-------|
| `/` (login) | ✅ | ✅ | ✅ |
| `/datenschutz` | ✅ | ✅ | ✅ |
| `/patient/*` | ✅ | ✅ | ✅ |
| `/clinician/*` | ❌ | ✅ | ✅ |
| `/admin/*` | ❌ | ✅ | ✅ |

## User Experience Flow

### New Patient Registration
1. User signs up at `/`
2. System assigns default `patient` role
3. Patient profile created automatically
4. Redirected to `/patient`
5. Sees Assessments and Verlauf tabs

### Clinician Login
1. Clinician logs in at `/`
2. System detects `clinician` role
3. Redirected to `/clinician`
4. Sees Dashboard with KPI cards
5. Sidebar shows: Dashboard, Funnels, Content

### Admin Login
1. Admin logs in at `/`
2. System detects `admin` role
3. Redirected to `/clinician` (shared dashboard)
4. Sees same navigation as clinician
5. Role indicator shows "Administrator"

## Role Indicator

All layouts now show a role indicator for clarity:

**Clinician/Admin Layouts:**
```html
<div className="mb-4 text-xs text-slate-500">
  Angemeldet als: <span className="font-medium">Clinician</span>
</div>
```

**Patient Layout (Desktop):**
```html
<div className="text-right">
  <p className="text-xs text-neutral-500">Angemeldet als</p>
  <p className="text-sm font-medium">Patient</p>
</div>
```

## Testing Scenarios

### Test 1: Patient Login
1. Create patient account
2. Login
3. ✅ Redirected to `/patient`
4. ✅ See "Assessments" and "Verlauf" tabs
5. ✅ Desktop view shows logout button
6. ✅ Role shows "Patient"
7. ❌ Cannot access `/clinician`
8. ❌ Cannot access `/admin/content`

### Test 2: Clinician Login
1. Login with clinician account
2. ✅ Redirected to `/clinician`
3. ✅ See Dashboard with patient overview
4. ✅ Sidebar shows: Dashboard, Funnels, Content
5. ✅ Can navigate to `/clinician/funnels`
6. ✅ Can navigate to `/admin/content`
7. ✅ Role shows "Clinician"
8. ✅ Can access patient data

### Test 3: Admin Login
1. Login with admin account
2. ✅ Redirected to `/clinician`
3. ✅ See same dashboard as clinician
4. ✅ Role shows "Administrator"
5. ✅ All clinician features accessible

### Test 4: Role-Based Redirect
1. Patient tries to access `/clinician` directly
2. ✅ Redirected to `/?error=access_denied`
3. ✅ Error message displayed

### Test 5: Logout Flow
1. Any role: Click "Abmelden"
2. ✅ Logged out
3. ✅ Redirected to `/`
4. ✅ Session cleared

## Benefits of V2 Implementation

### 1. **Centralized Logic**
- Single source of truth for role detection
- Reusable utility functions across codebase
- Easier to maintain and update

### 2. **Type Safety**
- TypeScript types for roles
- Compile-time checking of role strings
- IDE autocomplete support

### 3. **Predictable Routing**
- Consistent redirect behavior
- Role-based landing pages
- Clear access control rules

### 4. **Maintainability**
- DRY principle: no duplicated role checks
- Easy to add new roles in future
- Navigation config in one place

### 5. **User Experience**
- Clear role indication
- Appropriate navigation for each role
- Consistent logout experience
- Mobile-optimized for patients

## Future Enhancements

### Potential Improvements
1. **Separate Admin Features**
   - Distinct admin dashboard
   - User management interface
   - System configuration settings

2. **Role Hierarchy**
   - Super admin role
   - Team/organization support
   - Delegated permissions

3. **Dynamic Navigation**
   - Feature flags per role
   - Customizable menu items
   - Role-based feature access

4. **Enhanced Mobile Navigation**
   - Bottom tabs for clinicians
   - Gesture navigation
   - Progressive web app support

5. **Audit Logging**
   - Track role changes
   - Monitor access attempts
   - Security reporting

## Migration Notes

### Breaking Changes
None - this is an enhancement that maintains backward compatibility.

### Files Modified
- `app/page.tsx` - Login redirect logic
- `app/clinician/layout.tsx` - Refactored to use utilities
- `app/admin/layout.tsx` - Refactored to use utilities
- `app/patient/layout.tsx` - Added logout and role display

### Files Created
- `lib/utils/roleBasedRouting.ts` - Core routing utilities

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router](https://nextjs.org/docs/app)
- [V0.4 Design System](./V0_4_DESIGN_SYSTEM.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
