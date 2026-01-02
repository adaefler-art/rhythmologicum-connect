# Mobile Components - Single Source of Truth

## Overview

This document defines the **Single Source of Truth** for all mobile UI components in the Rhythmologicum Connect patient interface.

**Last Updated:** 2025-12-12  
**Status:** Active

## Component Locations

### Primary Mobile Components Directory

**Location:** `app/components/`

All mobile UI components are located in the `app/components/` directory. This is the **Single Source of Truth** for mobile components.

### Component Inventory

| Component              | Path                                      | Purpose                                                                | Used By                       |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| `MobileHeader`         | `app/components/MobileHeader.tsx`         | Global mobile header with back button, title, and optional action      | All patient mobile routes     |
| `MobileQuestionScreen` | `app/components/MobileQuestionScreen.tsx` | Full-screen mobile question layout with progress, content, and actions | Question steps in assessments |
| `MobileQuestionCard`   | `app/components/MobileQuestionCard.tsx`   | Card-based question display                                            | Legacy/multi-question steps   |
| `MobileWelcomeScreen`  | `app/components/MobileWelcomeScreen.tsx`  | Intro/welcome screen for funnels                                       | Funnel intro pages            |
| `MobileContentPage`    | `app/components/MobileContentPage.tsx`    | Content page renderer                                                  | Info/result pages             |
| `MobileCard`           | `app/components/MobileCard.tsx`           | Generic mobile card component                                          | Various pages                 |
| `MobileProgress`       | `app/components/MobileProgress.tsx`       | Progress indicator                                                     | Assessment flows              |
| `MobileSectionTitle`   | `app/components/MobileSectionTitle.tsx`   | Section headers                                                        | Various pages                 |
| `MobileAnswerButton`   | `app/components/MobileAnswerButton.tsx`   | Touch-optimized answer buttons                                         | Question screens              |
| `FunnelCard`           | `app/components/FunnelCard.tsx`           | Funnel selection cards                                                 | Assessment selector           |

### Component Exports

All mobile components are also exported via the convenience module:

```typescript
// Import from convenience module
import { MobileHeader, MobileCard } from '@/app/components/mobile'

// Or import directly
import MobileHeader from '@/app/components/MobileHeader'
```

## Mobile Breakpoint

**Mobile viewport:** `< 640px` (Tailwind's `sm` breakpoint)

## Architecture Patterns

### 1. Responsive Detection

Mobile detection is handled by the `useIsMobile()` hook:

```typescript
import { useIsMobile } from '@/lib/hooks/useIsMobile'

const isMobile = useIsMobile()
```

**Key Rules:**

- ✅ Only use in **client components** (`'use client'`)
- ✅ Returns `false` on server-side (SSR-safe)
- ✅ Automatically updates on window resize
- ❌ Never use in server components

### 2. Layout Architecture

#### Patient Layout (`app/patient/layout.tsx`)

The patient layout implements intelligent routing:

- **Desktop:** Shows full layout with header and footer
- **Mobile on full-screen routes:** Hides layout header/footer, lets child components render their own
- **Mobile on other routes:** Shows layout header/footer

**Full-screen mobile routes:**

- `/patient/funnel/*` (all funnel pages)
- `/patient/assessment` (assessment selector)

**Why?** Mobile assessment flows render their own `MobileHeader` components and need complete viewport control.

### 3. Component Hierarchy

```
app/patient/layout.tsx (conditional wrapper)
└── Full-screen mobile routes render their own UI
    ├── MobileHeader (per-page)
    ├── Content area (scrollable)
    └── Action bar (sticky bottom)
```

## Removed/Deprecated Components

### ❌ `lib/ui/MobileHeader.tsx` - REMOVED

**Reason:** Duplicate implementation. The version in `app/components/MobileHeader.tsx` is more complete and actively used.

**Removed in:** This cleaning PR (2025-12-12)

**Migration:** All imports should use `@/app/components/MobileHeader`

## Import Guidelines

### ✅ Correct Imports

```typescript
// Direct import (recommended for single components)
import MobileHeader from '@/app/components/MobileHeader'

// Convenience module (recommended for multiple components)
import { MobileHeader, MobileCard, MobileProgress } from '@/app/components/mobile'
```

### ❌ Incorrect Imports

```typescript
// DON'T: This no longer exists
import { MobileHeader } from '@/lib/ui'
import MobileHeader from '@/lib/ui/MobileHeader'
```

## Usage Examples

### Full-Screen Mobile Question Flow

```typescript
'use client'

import { useIsMobile } from '@/lib/hooks/useIsMobile'
import MobileQuestionScreen from '@/app/components/MobileQuestionScreen'

export default function QuestionPage() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <MobileQuestionScreen
        question={currentQuestion}
        questionIndex={0}
        totalQuestions={10}
        value={answer}
        onChange={handleChange}
        onNext={handleNext}
        onPrevious={handlePrev}
        funnelTitle="Stress Assessment"
      />
    )
  }

  // Desktop layout
  return <DesktopQuestionCard {...props} />
}
```

### Mobile Header with Back Button

```typescript
'use client'

import MobileHeader from '@/app/components/MobileHeader'

export default function ResultPage() {
  return (
    <>
      <MobileHeader
        variant="with-title"
        title="Ergebnisse"
        subtitle="Stress Assessment"
        showBack={true}
      />
      <main>
        {/* Content */}
      </main>
    </>
  )
}
```

## Testing Mobile UI

### Manual Testing

1. **Resize browser to mobile viewport:** `< 640px` width
2. **Use browser DevTools:** Mobile device emulation
3. **Test routes:**
   - `/patient/assessment` - Assessment selector
   - `/patient/funnel/stress-assessment/intro` - Intro page
   - `/patient/funnel/stress-assessment` - Question flow
   - `/patient/funnel/stress-assessment/result` - Results page

### Expected Behavior

- ✅ No duplicate headers on mobile
- ✅ Full-screen mobile layouts (no layout header/footer)
- ✅ Smooth transitions between questions
- ✅ Touch-optimized buttons (44px minimum)
- ✅ Consistent design tokens
- ✅ No hydration mismatches

## Maintenance Guidelines

### Adding New Mobile Components

1. Create component in `app/components/`
2. Add to `app/components/mobile.ts` exports
3. Document in this file
4. Follow existing mobile component patterns

### Modifying Existing Components

1. Make changes only in `app/components/`
2. Test on mobile viewport (`< 640px`)
3. Verify no desktop regressions
4. Update this documentation if behavior changes

### Code Review Checklist

- [ ] Component is in `app/components/` directory
- [ ] Uses `useIsMobile()` hook correctly (client-side only)
- [ ] No duplicate implementations
- [ ] Follows design tokens (`@/lib/design-tokens`)
- [ ] Touch-optimized (min 44px tap targets)
- [ ] SSR-safe (no window access in server components)

## Design System

All mobile components use the centralized design system:

```typescript
import { spacing, typography, colors, radii, shadows, componentTokens } from '@/lib/design-tokens'
```

### Key Design Tokens

- **Spacing:** `spacing.sm`, `spacing.md`, `spacing.lg`
- **Typography:** `typography.fontSize.base`, `typography.lineHeight.normal`
- **Colors:** `colors.primary[600]`, `colors.neutral[100]`
- **Border Radius:** `radii.lg`, `radii.full`
- **Shadows:** `shadows.sm`, `shadows.md`

## Related Documentation

- [Funnel Architecture](./FUNNEL_ARCHITECTURE.md)
- [Design Tokens](../lib/design-tokens.ts)
- [Component Guidelines](../app/components/README.md)

## Changelog

### 2025-12-12 - Initial Documentation

- Established Single Source of Truth for mobile components
- Removed duplicate `lib/ui/MobileHeader.tsx`
- Updated `lib/ui/index.ts` to remove MobileHeader export
- Enhanced `app/patient/layout.tsx` for mobile full-screen routes
- Documented component inventory and architecture patterns
