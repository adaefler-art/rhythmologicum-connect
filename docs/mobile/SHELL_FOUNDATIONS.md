# Mobile Shell Foundations (V05-I06.1)

**Version**: v0.5.0  
**Last Updated**: 2026-01-04  
**Status**: Canonical - Single Source of Truth for Mobile Shell  
**Related Issue**: V05-I06.1 — Mobile Shell: Fixed Top Menu + Fixed Bottom Menu

---

## Overview

This document defines the **canonical rules** for the mobile shell layout in Rhythmologicum Connect patient routes. The mobile shell provides a consistent, fixed top/bottom navigation pattern for all patient pages on mobile viewports.

**Single Source of Truth (SSoT)**: All mobile shell implementations MUST align with this specification. If implementation diverges, update code to match this document OR update this document (prefer code alignment; docs only if missing/incorrect).

---

## Mobile Shell Architecture

### Layout Structure

```
┌─────────────────────────────────────┐
│ Fixed Top Header (z-40)             │ ← Mobile only (<768px)
│ - Branding                          │   Height: ~4rem + safe-area-inset-top
│ - Theme toggle, Sign-out            │   Position: fixed top-0
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│                                     │
│  Main Content (scrollable)          │ ← pt-[calc(4rem+env(safe-area-inset-top))]
│                                     │   pb-[calc(6rem+env(safe-area-inset-bottom))]
│                                     │   Mobile only padding
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Fixed Bottom Tabs (z-40)            │ ← Mobile only (<768px)
│ 📝 Fragebogen | 📊 Mein Verlauf     │   Height: ~6rem + safe-area-inset-bottom
│ Active state highlighting           │   Position: fixed bottom-0
└─────────────────────────────────────┘
```

### Desktop Layout (≥768px)

```
┌─────────────────────────────────────┐
│ Static Header                       │ ← Static (not fixed)
│ - Branding, User info               │   max-w-6xl centered
│ - Desktop navigation tabs           │   Position: relative
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Main Content                       │ ← No padding (menus not fixed)
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Static Footer                       │ ← Static (not fixed)
│ - Copyright, Links                  │   max-w-6xl centered
└─────────────────────────────────────┘
```

---

## Canonical Implementation

### File Location

**Primary**: `app/patient/layout.tsx`

**Component Type**: Client Component (`'use client'`)

**Reason**: Requires hooks (`usePathname`, `useRouter`, `useState`, `useEffect`) and event handlers

### Responsive Breakpoints

| Breakpoint | Value | Shell Type |
|------------|-------|------------|
| Mobile     | < 768px (`md:`) | Fixed top + bottom |
| Desktop    | ≥ 768px (`md:`) | Static header + footer |

**Key Rule**: Use Tailwind's `md:` prefix for desktop/mobile switching

---

## Fixed Top Header (Mobile)

### Specifications

- **Position**: `fixed inset-x-0 top-0`
- **z-index**: `z-40` (above content, below dialogs/modals)
- **Background**: `bg-white/95 dark:bg-slate-800/95` with `backdrop-blur`
- **Border**: `border-b border-slate-200 dark:border-slate-700`
- **Safe Area**: `paddingTop: env(safe-area-inset-top, 0px)`
- **Height**: ~4rem (64px) + safe-area-inset-top
- **Visibility**: `md:hidden` (mobile only)

### Content

```tsx
<header className="md:hidden fixed inset-x-0 top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 transition-colors duration-150"
  style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
>
  <div className="px-4 py-3">
    <div className="flex items-center justify-between">
      {/* Branding */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
          Rhythmologicum Connect
        </p>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Stress & Resilienz Pilot
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle size="sm" />
        {user && (
          <button onClick={handleSignOut} aria-label="Abmelden">
            Abmelden
          </button>
        )}
      </div>
    </div>
  </div>
</header>
```

---

## Fixed Bottom Tabs (Mobile)

### Specifications

- **Position**: `fixed inset-x-0 bottom-0`
- **z-index**: `z-40` (above content, below dialogs/modals)
- **Background**: `bg-white/95 dark:bg-slate-800/95` with `backdrop-blur`
- **Border**: `border-t border-slate-200 dark:border-slate-700`
- **Safe Area**: `paddingBottom: calc(0.625rem + env(safe-area-inset-bottom, 0px))`
- **Height**: ~6rem (96px) + safe-area-inset-bottom
- **Visibility**: `md:hidden` (mobile only)

### Navigation Items

| Icon | Label | Route | Active When |
|------|-------|-------|-------------|
| 📝 | Fragebogen starten | `/patient/funnels` | `/patient/assessment`, `/patient/funnel/*` |
| 📊 | Mein Verlauf | `/patient/history` | `/patient/history` (exact) |

### Active State Logic

```typescript
// From lib/utils/roleBasedRouting.ts
export function getPatientNavItems(pathname: string): RoleNavItem[] {
  return [
    {
      href: '/patient/funnels',
      label: 'Fragebogen starten',
      active:
        pathname?.startsWith('/patient/assessment') || 
        pathname?.startsWith('/patient/funnel/') ||  // Note: trailing slash
        false,
    },
    {
      href: '/patient/history',
      label: 'Mein Verlauf',
      active: pathname === '/patient/history',
    },
  ]
}
```

**Important**: Use `/patient/funnel/` with trailing slash to avoid matching `/patient/funnels` catalog route.

---

## Content Area Spacing

### Mobile (< 768px)

```tsx
<main className="flex-1 pt-[calc(4rem+env(safe-area-inset-top,0px))] md:pt-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
  {children}
</main>
```

**Top Padding**: `4rem` (matches header height) + `env(safe-area-inset-top)`  
**Bottom Padding**: `6rem` (matches bottom tabs height) + `env(safe-area-inset-bottom)`

### Desktop (≥ 768px)

**Top Padding**: `md:pt-0` (no padding - static header)  
**Bottom Padding**: `md:pb-0` (no padding - static footer)

---

## Z-Index Layering

### Z-Index Tiers (Canonical)

| Layer | z-index | Purpose | Examples |
|-------|---------|---------|----------|
| Base  | z-0     | Normal content | Cards, text, images |
| Sticky | z-10   | Sticky headers within sections | Section headers |
| Fixed Shell | z-40 | Fixed navigation (mobile shell) | Top header, bottom tabs |
| Dropdown | z-50 | Dropdowns, tooltips | Select menus, popovers |
| Overlay | z-50 | Modal overlays | Backdrop for dialogs |
| Modal | z-50 | Modal content | Dialogs, alerts |
| Toast | z-50 | Toast notifications | Success/error messages |

**Key Rules**:
- Mobile shell uses `z-40` to stay above content but below modals/dialogs
- Modals/dialogs should use `z-50` to appear above fixed navigation
- Never use arbitrary z-index values - follow tiers

---

## Safe Area Insets

### Viewport Configuration

**Required**: Add to `app/layout.tsx` metadata or `<head>`:

```tsx
export const metadata: Metadata = {
  // ... other metadata
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover', // Required for safe-area-inset support
  },
}
```

**Or** use viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### CSS Environment Variables

- `env(safe-area-inset-top)` - Status bar / notch area
- `env(safe-area-inset-bottom)` - Home indicator / gesture area
- `env(safe-area-inset-left)` - Left edge (landscape)
- `env(safe-area-inset-right)` - Right edge (landscape)

**Usage**:

```tsx
// Header top padding
style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}

// Bottom tabs padding
style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}

// Main content spacing
className="pt-[calc(4rem+env(safe-area-inset-top,0px))]"
```

**Fallback**: Always provide fallback value (e.g., `0px`) for browsers that don't support safe-area-inset.

---

## Route Matching

### Deterministic Active State

**Pattern**: Use `startsWith()` with trailing slash for route prefixes to avoid false matches.

```typescript
// ✅ CORRECT - Trailing slash prevents matching /patient/funnels
pathname?.startsWith('/patient/funnel/')

// ❌ WRONG - Matches both /patient/funnel/* and /patient/funnels
pathname?.startsWith('/patient/funnel')
```

### Edge Cases

```typescript
// Handle null/undefined pathname
pathname?.startsWith(...) || false

// Exact match for specific routes
pathname === '/patient/history'

// Multiple conditions
pathname?.startsWith('/patient/assessment') || 
pathname?.startsWith('/patient/funnel/')
```

---

## Server/Client Component Boundaries

### Current Implementation

**Layout**: Client Component (`'use client'`)

**Reason**:
- Uses `usePathname()` hook (client-only)
- Uses `useRouter()` hook (client-only)
- Uses `useState()` and `useEffect()` for auth state
- Event handlers (`onClick`)

**Alternative**: Could refactor to Server Component with client wrappers, but current approach is simpler and works correctly.

### No Hydration Issues

Current implementation is safe because:
- Entire layout is client component
- No server-rendered content that differs from client
- Theme script in root layout prevents theme flash
- Auth state managed client-side with Supabase

---

## Testing Requirements

### Unit Tests

**File**: `lib/utils/__tests__/roleBasedRouting.patient.test.ts`

**Coverage**:
1. Active state for both nav items on all patient routes
2. Navigation structure (hrefs, labels, count)
3. Edge cases (null, undefined, empty pathname)
4. Route boundary testing (`/patient/funnel/` vs `/patient/funnels`)

### Manual Testing Checklist

- [ ] Mobile (< 768px): Fixed top header visible
- [ ] Mobile (< 768px): Fixed bottom tabs visible
- [ ] Mobile (< 768px): Content doesn't overlap with fixed menus
- [ ] Mobile (< 768px): Safe area insets work on notched devices (iOS Safari)
- [ ] Desktop (≥ 768px): Static header/footer, no fixed positioning
- [ ] Desktop (≥ 768px): No mobile menus visible
- [ ] Active state highlights correct tab on route change
- [ ] Navigation between routes works correctly
- [ ] Theme toggle works in mobile header
- [ ] Sign-out button works in mobile header
- [ ] No z-index conflicts with modals/dialogs
- [ ] No hydration mismatches in console

---

## Common Issues & Solutions

### Issue 1: Content Overlaps Fixed Header

**Symptom**: Content appears behind fixed top header

**Solution**: Ensure main element has correct top padding:

```tsx
className="pt-[calc(4rem+env(safe-area-inset-top,0px))] md:pt-0"
```

### Issue 2: Active State Matches Wrong Route

**Symptom**: Bottom tab highlighted on catalog page

**Solution**: Use trailing slash in `startsWith()`:

```typescript
// Before: pathname?.startsWith('/patient/funnel')
// After:
pathname?.startsWith('/patient/funnel/')
```

### Issue 3: Safe Area Insets Don't Work

**Symptom**: Content hidden behind notch on iOS

**Solution**: Add `viewport-fit=cover` to viewport meta tag:

```tsx
viewport: {
  viewportFit: 'cover',
}
```

### Issue 4: Z-Index Conflicts

**Symptom**: Modal appears behind fixed navigation

**Solution**: Use correct z-index tier:

```tsx
// Modal should use z-50
<div className="fixed inset-0 z-50">
```

---

## Design System Integration

### Colors

- Primary: `sky-600` / `sky-400` (brand color)
- Background: `white` / `slate-800` (light/dark)
- Border: `slate-200` / `slate-700` (light/dark)
- Text: `slate-900` / `slate-100` (primary)
- Text muted: `slate-600` / `slate-400` (secondary)

### Typography

- Header branding: `text-xs font-semibold uppercase tracking-wide`
- Header subtitle: `text-sm font-medium`
- Tab label: `text-xs font-semibold`

### Spacing

- Header padding: `px-4 py-3`
- Bottom tabs padding: `px-4 py-2.5`
- Gap between elements: `gap-2`

### Transitions

- Color transitions: `transition-colors duration-150`
- All interactive elements: `duration-200`

---

## Migration from Existing Implementation

If you encounter mobile shell code that doesn't follow this spec:

1. **Check** implementation against this document
2. **Align** code to match canonical spec
3. **Test** on mobile viewports (< 768px)
4. **Verify** safe-area insets on iOS devices
5. **Update** tests to reflect any changes

---

## Related Documentation

- [Mobile Components SSoT](../MOBILE_COMPONENTS_SSoT.md)
- [Layout Standards](../LAYOUT_STANDARDS.md)
- [Mobile Funnel Selector](../MOBILE_FUNNEL_SELECTOR.md)

---

## Changelog

### 2026-01-04 - V05-I06.1 Initial Foundation

- Established canonical mobile shell specification
- Defined fixed top/bottom menu architecture
- Documented z-index layering system
- Specified safe-area-inset requirements
- Created route matching rules
- Added testing requirements

---

## Support

For questions about mobile shell implementation:

1. Check this document first (SSoT)
2. Review existing implementation in `app/patient/layout.tsx`
3. Run tests: `npm test -- lib/utils/__tests__/roleBasedRouting.patient.test.ts`
4. Test manually on mobile viewport
5. Create issue if pattern doesn't fit use case

**Remember**: This document is the canonical foundation for ALL mobile shell decisions. When in doubt, align with this spec.
