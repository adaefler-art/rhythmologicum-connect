# Mobile Funnel Selector - Visual Design

## Overview

This document describes the visual design and layout of the mobile funnel selector implemented in v0.4.1.

## Page Structure

### Header

- **Component:** `MobileHeader` (existing component)
- **Variant:** "with-title"
- **Title:** "Assessment auswählen"
- **Subtitle:** "Rhythmologicum Connect"
- **Back Button:** Yes (navigates to previous page)

### Main Content Area

- **Background:** Gradient from `primary[50]` → `background.light` → `neutral[50]`
- **Padding:** `spacing.lg` (24px)
- **Max Width:** 448px (centered on larger screens)

#### Page Title

```
Wählen Sie Ihr Assessment
```

- **Font Size:** `typography.fontSize['2xl']` (24px)
- **Font Weight:** Bold
- **Color:** slate-900
- **Line Height:** Tight (1.25)

#### Page Description

```
Erkunden Sie verschiedene Bereiche Ihrer Gesundheit und erhalten Sie personalisierte Einblicke.
```

- **Font Size:** `typography.fontSize.base` (16px)
- **Color:** slate-600
- **Line Height:** Relaxed (1.625)

### Funnel Cards Grid

#### Layout

- **Display:** Grid
- **Columns:** 1 (single column on mobile)
- **Gap:** 16px between cards

#### Individual Funnel Card

Each card has the following structure:

**Card Container:**

- Background: White
- Border: 2px solid slate-200
- Border Radius: `radii.xl` (16px)
- Box Shadow: `shadows.md`
- Padding: `spacing.lg` (24px)
- Hover State: Border changes to sky-400, shadow increases
- Active State: Scale 0.98 (slight press effect)
- Transition: Smooth 200ms

**Icon Section:**

- Display: Centered
- Icon Container:
  - Size: 80px × 80px
  - Background: Linear gradient from `primary[100]` to `primary[50]`
  - Border: 1px solid `primary[200]`
  - Border Radius: `radii.xl` (16px)
- Icon/Emoji:
  - Font Size: 3rem (48px)
  - Examples: 🧘‍♀️ (Stress), 😴 (Sleep), 🥗 (Nutrition)

**Subtitle Badge (if present):**

- Background: sky-600
- Text Color: White
- Font Weight: Semibold
- Text Transform: Uppercase
- Letter Spacing: Wide
- Font Size: `typography.fontSize.xs` (12px)
- Padding: `spacing.xs` × `spacing.sm` (8px × 12px)
- Border Radius: `radii.md` (8px)

**Title:**

```
Stress & Resilienz
```

- Font Size: `typography.fontSize.xl` (20px)
- Font Weight: Bold
- Color: slate-900
- Line Height: Tight

**Description:**

```
Erfassen Sie Ihr aktuelles Stresslevel und entdecken Sie Ihre Resilienzfaktoren.
```

- Font Size: `typography.fontSize.sm` (14px)
- Color: slate-600
- Line Height: Relaxed

**Call-to-Action:**

- Text: "Assessment starten →"
- Font Size: `typography.fontSize.sm` (14px)
- Font Weight: Semibold
- Color: sky-600
- Margin Top: 16px

## States

### Loading State

```
┌─────────────────────────┐
│                         │
│      [Spinner Icon]     │
│                         │
│  Lade Assessments...    │
│                         │
└─────────────────────────┘
```

- Spinner: Sky-600 color, animated rotation
- Text: slate-600, centered

### Error State

```
┌─────────────────────────┐
│                         │
│         Fehler          │
│                         │
│ Funnels konnten nicht   │
│    geladen werden.      │
│                         │
└─────────────────────────┘
```

- Background: red-50
- Border: 2px solid red-200
- Border Radius: `radii.lg` (12px)
- Padding: `spacing.lg` (24px)
- Title: Red-800, semibold
- Message: Red-700

### Empty State

```
┌─────────────────────────┐
│                         │
│          🔍            │
│                         │
│ Keine Assessments       │
│     verfügbar          │
│                         │
│ Derzeit sind keine      │
│ Assessments aktiviert.  │
│ Bitte kontaktieren Sie  │
│ Ihren Behandler.        │
│                         │
└─────────────────────────┘
```

- Background: slate-50
- Border: 2px solid slate-200
- Border Radius: `radii.lg` (12px)
- Padding: `spacing.xl` (32px)
- Icon: 96px font size
- Title: Slate-700, semibold
- Message: Slate-600

## Example Layout

```
╔═══════════════════════════════════════╗
║   ← Assessment auswählen              ║
║   Rhythmologicum Connect              ║
╠═══════════════════════════════════════╣
║                                       ║
║   Wählen Sie Ihr Assessment           ║
║                                       ║
║   Erkunden Sie verschiedene Bereiche  ║
║   Ihrer Gesundheit und erhalten Sie   ║
║   personalisierte Einblicke.          ║
║                                       ║
║   ┌─────────────────────────────┐    ║
║   │         ┌──────┐             │    ║
║   │         │ 🧘‍♀️  │             │    ║
║   │         └──────┘             │    ║
║   │                              │    ║
║   │   [STRESS-ASSESSMENT]        │    ║
║   │                              │    ║
║   │   Stress & Resilienz         │    ║
║   │                              │    ║
║   │   Erfassen Sie Ihr aktuelles │    ║
║   │   Stresslevel und entdecken  │    ║
║   │   Sie Ihre Resilienzfaktoren.│    ║
║   │                              │    ║
║   │   Assessment starten →       │    ║
║   └─────────────────────────────┘    ║
║                                       ║
║   ┌─────────────────────────────┐    ║
║   │         ┌──────┐             │    ║
║   │         │ 😴   │             │    ║
║   │         └──────┘             │    ║
║   │                              │    ║
║   │   [SLEEP-ASSESSMENT]         │    ║
║   │                              │    ║
║   │   Schlaf & Erholung          │    ║
║   │                              │    ║
║   │   Analysieren Sie Ihre       │    ║
║   │   Schlafqualität und         │    ║
║   │   Erholungsmuster.           │    ║
║   │                              │    ║
║   │   Assessment starten →       │    ║
║   └─────────────────────────────┘    ║
║                                       ║
╚═══════════════════════════════════════╝
```

## Responsive Design

### Mobile Portrait (360px - 430px)

- Single column layout
- Cards stack vertically
- Full width with 24px horizontal padding
- Icons: 80px × 80px
- Font sizes as specified in design tokens

### Mobile Landscape (>430px)

- Still single column for consistency
- Max-width container (448px) centered
- Maintains same spacing and sizing

### Tablet/Desktop (>768px)

- Could be extended to 2-column grid in future
- Current implementation: single column for simplicity

## Touch Interactions

### Tap Target

- Minimum 44px height for accessibility
- Card padding ensures comfortable touch area
- Active state provides immediate feedback (scale 0.98)

### Hover (Desktop)

- Border color changes to sky-400
- Box shadow increases for elevation effect
- Smooth 200ms transition

## Color Palette

### Primary Colors (from design tokens)

- `primary[50]`: Light gradient background
- `primary[100]`: Icon gradient start
- `primary[200]`: Icon border
- `sky-600`: Brand color for badges and CTA
- `sky-400`: Hover border

### Neutral Colors

- `slate-900`: Primary text (titles)
- `slate-700`: Secondary text
- `slate-600`: Tertiary text (descriptions)
- `slate-200`: Card borders
- `slate-50`: Empty state background

### Semantic Colors

- `red-50`, `red-200`, `red-700`, `red-800`: Error states
- White: Card backgrounds

## Typography

### Headings

- H1 (Page Title): 24px, Bold, slate-900
- H3 (Card Title): 20px, Bold, slate-900

### Body Text

- Description: 16px, Regular, slate-600
- Card Description: 14px, Regular, slate-600
- Badge: 12px, Semibold, White
- CTA: 14px, Semibold, sky-600

### Line Heights

- Tight (1.25): Headings
- Normal (1.5): Standard text
- Relaxed (1.625): Descriptions for comfortable reading

## Accessibility

### Keyboard Navigation

- All cards are focusable buttons
- Tab order follows visual layout
- Enter or Space activates the card

### Screen Readers

- `aria-label` on each card: "{Title} Assessment starten"
- Semantic HTML structure
- Clear, descriptive text

### Color Contrast

- All text meets WCAG AA standards
- Primary text (slate-900) on white: >7:1
- Secondary text (slate-600) on white: >4.5:1

## Design Tokens Reference

All spacing, colors, typography, and other design values are sourced from:

```
@/lib/design-tokens.ts
```

This ensures consistency across the entire application and makes future design updates easier.
