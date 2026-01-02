# Navigation Architecture

**Version:** v0.4.1  
**Last Updated:** 2025-12-13  
**Related Issue:** #219 - Create Unified Navigation Menus per Role

---

## Overview

This document describes the unified navigation architecture for Rhythmologicum Connect, including role-based navigation menus, shared components, and implementation guidelines.

## Design Principles

1. **Role-Based Navigation**: Each user role (patient, clinician, admin) has a tailored navigation menu
2. **Clear Labels**: Navigation uses non-technical, user-friendly German labels
3. **Minimal Navigation**: Only essential items are shown to reduce cognitive load
4. **Consistent Experience**: Shared components ensure consistent behavior across the app
5. **Responsive Design**: Navigation adapts between desktop and mobile views
6. **v0.4 Design System**: All components follow v0.4 design tokens and patterns

---

## Navigation Configuration

Navigation items are centrally defined in `/lib/utils/roleBasedRouting.ts` using helper functions.

### Patient Navigation

**Target Users**: Patients completing assessments  
**Primary Goals**: Start assessments, view history

```typescript
getPatientNavItems(pathname: string): RoleNavItem[]
```

**Navigation Items**:

1. **Fragebogen starten** (`/patient/assessment`)
   - Start new stress/resilience assessments
   - Active when on assessment or funnel routes
2. **Mein Verlauf** (`/patient/history`)
   - View assessment history and results
   - Active when on history route

**Layout**:

- Desktop: Header tabs
- Mobile: Bottom navigation tabs with icons (📝, 📊)

---

### Clinician Navigation

**Target Users**: Healthcare providers reviewing patient data  
**Primary Goals**: View patient overview, manage assessments, edit content

```typescript
getClinicianNavItems(pathname: string): RoleNavItem[]
```

**Navigation Items**:

1. **Übersicht** (`/clinician`)
   - Patient overview dashboard
   - Shows all patient assessments and risk levels
2. **Fragebögen** (`/clinician/funnels`)
   - Manage assessment questionnaires
   - Configure funnel steps and questions
3. **Inhalte** (`/admin/content`)
   - Content management
   - Edit educational content pages

**Layout**:

- Desktop: Collapsible sidebar with icons
- Mobile: Slide-out drawer menu

---

### Admin Navigation

**Target Users**: System administrators  
**Primary Goals**: Full system management including design system access

```typescript
getAdminNavItems(pathname: string): RoleNavItem[]
```

**Navigation Items**:

1. **Übersicht** (`/clinician`)
   - Same as clinician dashboard
2. **Fragebögen** (`/clinician/funnels`)
   - Full assessment management
3. **Inhalte** (`/admin/content`)
   - Full content management
4. **Design System** (`/admin/design-system`)
   - Component showcase and testing
   - Visual regression reference

**Layout**: Same as clinician (sidebar navigation)

---

## Shared Components

### PatientNavigation Component

**Location**: `/app/components/PatientNavigation.tsx`

Reusable navigation component for patient layout supporting both desktop and mobile variants.

**Props**:

```typescript
interface PatientNavigationProps {
  navItems: RoleNavItem[]
  variant?: 'desktop' | 'mobile'
}
```

**Usage**:

```tsx
// Desktop header navigation
<PatientNavigation navItems={navItems} variant="desktop" />

// Mobile bottom tabs
<PatientNavigation navItems={navItems} variant="mobile" />
```

**Features**:

- Automatic active state styling
- Hover effects for desktop
- Touch-friendly mobile tabs with icons
- Uses v0.4 design tokens for consistency

---

### DesktopLayout Component

**Location**: `/lib/ui/DesktopLayout.tsx`

Used by clinician and admin layouts for sidebar navigation.

**Props**:

```typescript
interface DesktopLayoutProps {
  appTitle?: string
  userEmail?: string
  onSignOut?: () => void
  navItems?: NavItem[]
  children: ReactNode
}
```

**Features**:

- Collapsible sidebar (64px collapsed, 256px expanded)
- Automatic icon mapping based on route
- Active state indication with accent dot
- Mobile drawer with overlay
- Theme toggle integration
- User profile section

---

## Helper Functions

### getNavItemsForRole()

**Purpose**: Automatically return the correct navigation items based on user role

```typescript
function getNavItemsForRole(user: User | null, pathname: string): RoleNavItem[]
```

**Example**:

```tsx
const navItems = getNavItemsForRole(user, pathname)
```

This is the recommended way to get navigation items in layouts as it automatically handles role detection.

---

## Navigation Item Structure

All navigation items follow a consistent structure:

```typescript
interface RoleNavItem {
  href: string // Destination URL
  label: string // Display text (German, user-friendly)
  icon?: ReactNode // Optional icon component
  active?: boolean // Active state (auto-calculated)
}
```

---

## Implementing Navigation in New Layouts

### Step 1: Import Utilities

```tsx
import { getPatientNavItems, getUserRole, getRoleDisplayName } from '@/lib/utils/roleBasedRouting'
```

### Step 2: Get Navigation Items

```tsx
const pathname = usePathname()
const navItems = getPatientNavItems(pathname)
```

### Step 3: Render Navigation

For patient layout:

```tsx
<PatientNavigation navItems={navItems} variant="desktop" />
```

For clinician/admin layout:

```tsx
<DesktopLayout
  appTitle="Rhythmologicum Connect"
  userEmail={user?.email}
  onSignOut={handleSignOut}
  navItems={navItems}
>
  {children}
</DesktopLayout>
```

---

## Active State Logic

Active states are determined by pathname matching:

- **Exact match**: `pathname === '/clinician'`
- **Prefix match**: `pathname.startsWith('/clinician/funnels')`
- **Multiple routes**: Assessment active for both `/patient/assessment` and `/patient/funnel`

Active state logic is centralized in `roleBasedRouting.ts` for consistency.

---

## Styling Guidelines

### Color Usage

Navigation follows v0.4 design tokens:

- **Active background**: `--color-primary-100` (light blue)
- **Active text**: `--color-primary-700` (dark blue)
- **Inactive text**: `--color-neutral-600` (gray)
- **Hover background**: `--color-neutral-100` (light gray)

### Mobile Considerations

- **Bottom padding**: Uses `env(safe-area-inset-bottom)` for iPhone notch
- **Touch targets**: Minimum 44px height
- **Icons**: Emoji-based (📝, 📊) for visual clarity

### Desktop Considerations

- **Hover states**: Subtle background color change
- **Active indicator**: Background color + accent dot (sidebar)
- **Responsive breakpoints**: `md:` (768px) for mobile/desktop switch

---

## Accessibility

### Keyboard Navigation

- All links are keyboard accessible via Tab
- Active states are visually distinct
- Proper focus indicators

### Screen Readers

- Semantic `<nav>` elements
- Descriptive labels in German
- Proper ARIA labels where needed

### Touch Accessibility

- Minimum 44x44px touch targets on mobile
- Clear visual feedback on interaction
- Safe area insets for modern devices

---

## Maintenance Guidelines

### Adding a New Navigation Item

1. **Update the appropriate function** in `roleBasedRouting.ts`:

   ```typescript
   {
     href: '/new/route',
     label: 'Neuer Bereich',
     active: pathname?.startsWith('/new/route') ?? false,
   }
   ```

2. **No layout changes needed** - component will automatically render new item

### Changing a Label

1. Edit the `label` field in `roleBasedRouting.ts`
2. Build and test
3. No other changes required

### Adding a New Role

1. Create new `getRoleNavItems()` function
2. Update `getNavItemsForRole()` to handle new role
3. Create or reuse layout component
4. Update role type in TypeScript definitions

---

## Testing Checklist

When making navigation changes:

- [ ] Build succeeds without errors
- [ ] All navigation labels are in German
- [ ] Active states work correctly on all routes
- [ ] Desktop hover effects work
- [ ] Mobile bottom tabs render correctly
- [ ] Icons display properly on mobile
- [ ] Sidebar collapse/expand works (clinician/admin)
- [ ] Navigation works after user role change
- [ ] Theme toggle doesn't affect navigation
- [ ] Safe area insets work on mobile devices

---

## Design Decisions

### Why German Labels?

The primary user base is German-speaking, and non-technical labels improve usability for patients and clinicians.

### Why Minimal Navigation?

Each role has 2-4 items maximum to reduce cognitive load and focus users on core workflows.

### Why Shared Components?

Reduces code duplication, ensures consistency, and makes updates easier to deploy.

### Why Centralized Configuration?

Navigation logic in one place makes it easier to maintain, test, and update labels without touching multiple files.

---

## Future Enhancements

Potential improvements for future versions:

1. **Icon Library Integration**: Replace emoji with proper icon components (lucide-react)
2. **Breadcrumb Navigation**: Add breadcrumbs for deep routes
3. **Quick Actions**: Add floating action buttons for common tasks
4. **Favorites/Bookmarks**: Allow users to bookmark frequent destinations
5. **Search Navigation**: Add global search to jump to specific areas
6. **Contextual Help**: Inline help tooltips for navigation items

---

## Related Documentation

- **Design System**: `/docs/V0_4_DESIGN_SYSTEM.md`
- **Design Tokens**: `/docs/V0_4_DESIGN_TOKENS.md`
- **Layout Standards**: `/docs/LAYOUT_STANDARDS.md`
- **Role-Based Routing**: `/lib/utils/roleBasedRouting.ts`
- **DesktopLayout Component**: `/lib/ui/DesktopLayout.tsx`
- **PatientNavigation Component**: `/app/components/PatientNavigation.tsx`

---

## Change Log

### v0.4.1 (2025-12-13)

- ✅ Unified navigation configuration in `roleBasedRouting.ts`
- ✅ Clear, non-technical German labels for all roles
- ✅ Separate `getAdminNavItems()` for admin-specific navigation
- ✅ Created shared `PatientNavigation` component
- ✅ Refactored patient layout to use shared utilities
- ✅ Added `getNavItemsForRole()` helper function
- ✅ Updated admin layout to use admin navigation
- ✅ Comprehensive documentation

---

**Status**: ✅ Complete  
**Issue**: #219  
**Related Epic**: #216
