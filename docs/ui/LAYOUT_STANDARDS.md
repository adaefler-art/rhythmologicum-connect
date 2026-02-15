# Layout Standards & Content Container Guidelines

**Last Updated**: 2025-01-13  
**Version**: v0.4.1  
**Related Issues**: Fix global table width & layout constraints (mobile + desktop)

---

## Overview

This document defines the standard layout patterns and content container widths used throughout the Rhythmologicum Connect application to ensure:

- Consistent table and content rendering across all pages
- Optimal use of viewport width on desktop
- Proper responsive behavior on mobile
- Maintainable and predictable layout hierarchy

---

## Layout Hierarchy

### 1. Root Layout (`/app/layout.tsx`)

- **Purpose**: Minimal HTML wrapper with theme provider
- **Constraints**: None (full viewport)
- **Children**: All route-specific layouts

### 2. Section Layouts

#### Patient Layout (`/app/patient/layout.tsx`)

- **Container Width**: `max-w-6xl` for header/footer
- **Main Content**: No width constraints (delegates to page components)
- **Mobile**: Bottom navigation tabs with safe-area-inset padding
- **Desktop**: Top navigation tabs + footer

#### Clinician Layout (`/app/clinician/layout.tsx`)

Uses `DesktopLayout` component:

- **Sidebar**: Fixed width (64px collapsed, 256px expanded)
- **Content Area**: See DesktopLayout specifications below

---

## Standard Content Container Pattern

### DesktopLayout Content Container (`/lib/ui/DesktopLayout.tsx`)

```tsx
import { layout } from '@/lib/design-tokens'

;<main className="p-4 lg:p-8 w-full">
  <div className="w-full mx-auto" style={{ maxWidth: layout.contentMaxWidth }}>
    {children}
  </div>
</main>
```

**Specifications**:

- **Maximum Width**: `layout.contentMaxWidth` from design tokens (1600px)
- **Design Token Source**: `/lib/design-tokens.ts`
- **Padding**: `16px` mobile, `32px` desktop
- **Centering**: `mx-auto` ensures content is centered on ultra-wide screens
- **Flexibility**: Pages inside use `w-full` to utilize full available width

**Why 1600px?**

- Large enough for data-heavy tables to display without excessive horizontal scrolling
- Small enough to maintain readability on ultra-wide monitors
- Balances information density with usability

**Design Token Definition**:

```ts
// lib/design-tokens.ts
export const layout = {
  contentMaxWidth: '1600px', // Clinician data-heavy pages
  patientMaxWidth: '1152px', // Patient readability-focused pages
  articleMaxWidth: '896px', // Article-style content
} as const
```

---

## Page-Level Container Standards

### Clinician Pages

**Standard Pattern**:

```tsx
export default function ClinicianPage() {
  return (
    <div className="w-full">
      {/* Content uses full width within DesktopLayout's max-w-[1600px] container */}
    </div>
  )
}
```

**Applied to**:

- `/clinician/page.tsx` (Dashboard)
- `/clinician/funnels/page.tsx` (Funnel List)
- `/clinician/patient/[id]/page.tsx` (Patient Detail)

**Tables**: Use full available width (no additional constraints)

### Patient Pages

**Standard Pattern**:

```tsx
export default function PatientPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      {/* Content constrained to max-w-6xl for optimal readability */}
    </div>
  )
}
```

**Reusable helper**:

For consistency, patient-facing pages may use:

```tsx
import StandardContentContainer from '@/app/components/StandardContentContainer'

export default function PatientPage() {
  return (
    <StandardContentContainer className="gap-6 py-10">
      {/* Page content */}
    </StandardContentContainer>
  )
}
```

**Applied to**:

- `/patient/history/PatientHistoryClient.tsx`
- `/patient/assessment/client.tsx`

**Maximum Width**: `max-w-6xl` (1152px)

- Optimized for patient-facing content readability
- Sufficient width for measurement history tables
- Matches patient layout header/footer width

---

## Component-Level Standards

### Table Component (`/lib/ui/Table.tsx`)

```tsx
<div className="overflow-x-auto bg-white ...">
  <table className="w-full text-sm">{/* Table content */}</table>
</div>
```

**Key Features**:

- **Width**: `w-full` - uses full available container width
- **Overflow**: `overflow-x-auto` - enables horizontal scroll on small screens
- **No max-width**: Tables are not artificially constrained

### Cards and Content Blocks

**Reasonable max-widths for specific UI elements**:

- `max-w-md` (448px): Error messages, centered modals, form groups
- `max-w-lg` (512px): Loading states, empty states
- `max-w-xl` (576px): Content cards with limited text
- `max-w-2xl` (672px): Article-style content
- `max-w-4xl` (896px): Wide content sections

**Never use for**:

- Page-level containers (use `w-full` or `max-w-6xl` / `max-w-[1600px]`)
- Table wrappers
- Data-dense layouts

**Guardrail (v0.5 P0)**:

- Never use `w-fit` for any page-level/main content container.
- Avoid `inline-flex` for main layout containers (use `w-full` blocks; `inline-flex` is fine for small icons/badges).
- For patient-facing “article-like” screens (intro/result/content), prefer a centered container like `max-w-4xl mx-auto w-full`.

---

## Responsive Breakpoints

Follow Tailwind CSS default breakpoints:

- **sm**: 640px (small tablets, large phones)
- **md**: 768px (tablets)
- **lg**: 1024px (laptops)
- **xl**: 1280px (desktops)
- **2xl**: 1536px (large desktops)

**Mobile-First Approach**:

- Default styles apply to mobile
- Use `md:` prefix for tablet+
- Use `lg:` prefix for desktop+

---

## Common Patterns

### Dashboard/List Pages (Clinician)

```tsx
export default function DashboardPage() {
  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-600">Description</p>
        </div>
        <div className="flex gap-3">{/* Action buttons */}</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">{/* Cards */}</div>

      {/* Data Table - Uses full width */}
      <Table columns={columns} data={data} hoverable bordered />
    </div>
  )
}
```

### History/Timeline Pages (Patient)

```tsx
export default function HistoryPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      {/* Page Header */}
      <section>
        <h1 className="text-2xl font-semibold">Your History</h1>
        <p className="text-sm text-slate-500">Description</p>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">{/* Summary cards */}</section>

      {/* Timeline */}
      <section className="space-y-4">{/* Timeline items */}</section>
    </div>
  )
}
```

---

## Migration Guide

If you encounter a page with layout issues:

### 1. Identify the Issue

- Content too narrow with unused space? → Restrictive `max-w-*`
- Table squished on desktop? → Page container too narrow
- Inconsistent widths between pages? → Missing standard pattern

### 2. Apply Standard Pattern

**For Clinician Pages**:

```tsx
// BEFORE
<div className="max-w-6xl mx-auto">

// AFTER
<div className="w-full">
```

**For Patient Pages**:

```tsx
// BEFORE
<div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">

// AFTER
<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
```

### 3. Test Responsive Behavior

- [ ] Desktop: Content uses appropriate width
- [ ] Tablet: Layout adapts properly
- [ ] Mobile: Horizontal scroll for tables works
- [ ] Ultra-wide: Content centered with max-w constraint

---

## Dos and Don'ts

### ✅ DO

- Use `w-full` for page containers in clinician section
- Use `max-w-6xl` for patient content pages
- Allow tables to use full container width
- Use `overflow-x-auto` for tables on mobile
- Use reasonable max-widths for UI components (modals, cards)
- Test on multiple screen sizes

### ❌ DON'T

- Add `max-w-4xl` or smaller to main page containers
- Nest multiple container constraints
- Use fixed widths (`w-[600px]`) for responsive layouts
- Add max-width to table wrappers
- Assume mobile-only users (optimize for both)
- Mix container patterns within the same section

---

## Testing Checklist

When modifying layout:

- [ ] Desktop (1920px+): Tables use substantial width, content centered
- [ ] Laptop (1280-1536px): All content visible, no cramping
- [ ] Tablet (768-1024px): Responsive grid/flex layouts work
- [ ] Mobile (320-640px): Horizontal scroll for tables, readable text
- [ ] Ultra-wide (2560px+): Content doesn't stretch excessively
- [ ] Dark mode: All styling applies correctly
- [ ] Print: Content flows appropriately (for reports)

---

## Related Files

### Layout Components

- `/app/layout.tsx` - Root layout
- `/app/patient/layout.tsx` - Patient section layout
- `/app/clinician/layout.tsx` - Clinician section layout
- `/lib/ui/DesktopLayout.tsx` - Clinician desktop shell

### Key Pages

- `/app/clinician/page.tsx` - Dashboard (uses w-full)
- `/app/clinician/funnels/page.tsx` - Funnel list (uses w-full)
- `/app/clinician/patient/[id]/page.tsx` - Patient detail (uses w-full)
- `/app/patient/history/PatientHistoryClient.tsx` - History (uses max-w-6xl)
- `/app/patient/assessment/client.tsx` - Assessment selector (uses max-w-6xl)

### Components

- `/lib/ui/Table.tsx` - Table component (w-full, overflow-x-auto)
- `/lib/ui/Card.tsx` - Card component
- `/lib/design-tokens.ts` - Design system tokens

---

## Future Considerations

### Potential Improvements

1. **Custom Breakpoint**: Consider adding `3xl` breakpoint for ultra-wide monitors
2. **Container Component**: Create reusable `<ContentContainer>` component
3. **CSS Custom Properties**: Consider moving layout tokens to CSS variables for runtime theming
4. **Grid System**: Implement consistent column system for complex layouts

### Layout Token Implementation

All layout max-widths are defined in `/lib/design-tokens.ts`:

```ts
export const layout = {
  contentMaxWidth: '1600px', // Clinician content
  patientMaxWidth: '1152px', // Patient content (max-w-6xl)
  articleMaxWidth: '896px', // Articles (max-w-4xl)
} as const
```

Usage in components:

```tsx
import { layout } from '@/lib/design-tokens'

;<div style={{ maxWidth: layout.contentMaxWidth }}>{/* Content */}</div>
```

Or for Tailwind classes, use the equivalent:

- `max-w-[1600px]` → `layout.contentMaxWidth`
- `max-w-6xl` (1152px) → `layout.patientMaxWidth`
- `max-w-4xl` (896px) → `layout.articleMaxWidth`

### Feature Requests

- User-adjustable content width preference
- Print-optimized layout variants
- Accessibility: High-contrast layout mode

---

## Support

For questions or issues related to layout standards:

1. Check this document first
2. Review existing pages following the pattern
3. Test on multiple screen sizes
4. Create an issue if pattern doesn't fit use case

**Note**: These standards were established in v0.4.1 to address global table width and layout constraint issues. All new pages should follow these patterns.
