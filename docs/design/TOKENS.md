# Design Tokens - Canonical Specification

> **Version**: 1.0.0  
> **Status**: Production Ready - Canonical Source of Truth  
> **Last Updated**: 2026-01-11

## Overview

This document serves as the **canonical specification** for all design tokens in Rhythmologicum Connect. Design tokens are the foundational visual design elements that ensure consistency across the entire application.

**Implementation Locations**:
1. **TypeScript**: `/lib/design/tokens.ts` - Single source of truth for programmatic access
2. **CSS Custom Properties**: `/app/globals.css` - For use in CSS stylesheets
3. **Tailwind CSS**: `/app/globals.css` (`@theme` block) - For utility class generation
4. **JSON Export**: Available via `scripts/design/export-tokens.ts` for external tooling (iOS, Android, etc.)

## Token Categories

### 1. Color Tokens (Semantic)

Colors are defined semantically, not by literal color names (e.g., no "blue500" in UI code).

#### Primary Colors (Sky Blue)
Main brand color for primary actions, highlights, and interactive elements.

```
primary-50:  #f0f9ff
primary-100: #e0f2fe
primary-200: #bae6fd
primary-300: #7dd3fc
primary-400: #38bdf8
primary-500: #0ea5e9  ← PRIMARY BRAND COLOR
primary-600: #0284c7  ← PRIMARY DARK (hover states)
primary-700: #0369a1
primary-800: #075985
primary-900: #0c4a6e
```

**Usage**: Buttons, links, active states, progress indicators, key UI elements

#### Neutral Colors (Slate)
Grayscale palette for backgrounds, borders, text, and UI scaffolding.

```
neutral-50:  #f8fafc  (Page backgrounds)
neutral-100: #f1f5f9  (Card backgrounds)
neutral-200: #e2e8f0  (Light borders)
neutral-300: #cbd5e1  (Default borders)
neutral-400: #94a3b8  (Disabled text)
neutral-500: #64748b  (Secondary text)
neutral-600: #475569  (Body text)
neutral-700: #334155  (Primary text)
neutral-800: #1e293b  (Strong text)
neutral-900: #0f172a  (Darkest text)
```

**Usage Guidelines**:
- **50-100**: Page and card backgrounds
- **200-300**: Borders and dividers
- **400-500**: Disabled states, placeholder text
- **600-700**: Body text and labels
- **800-900**: Headings and emphasized text

#### Semantic Colors
Contextual colors for user feedback and state communication.

| Token | Color | Usage |
|-------|-------|-------|
| `success` | #10b981 (green-500) | Success messages, confirmations, positive feedback |
| `success-light` | #d1fae5 | Success backgrounds |
| `warning` | #f59e0b (amber-500) | Warnings, caution states, attention needed |
| `warning-light` | #fef3c7 | Warning backgrounds |
| `error` | #ef4444 (red-500) | Error messages, validation errors, destructive actions |
| `error-light` | #fee2e2 | Error backgrounds |
| `info` | #3b82f6 (blue-500) | Information messages, neutral notifications |
| `info-light` | #dbeafe | Info backgrounds |

**Critical**: Always use semantic names in components (e.g., `bg-success` not `bg-green-500`)

#### Background Colors

```
background.light:              #ffffff
background.lightGradientFrom:  #f0f9ff (sky-50)
background.lightGradientTo:    #ffffff
background.dark:               #0a0a0a
background.darkGradientFrom:   #1e293b (slate-800)
background.darkGradientTo:     #0f172a (slate-900)
```

### 2. Typography Tokens

#### Font Families
```
font-sans: Geist Sans (or system fallback)
font-mono: Geist Mono (or system fallback)
```

#### Font Sizes
Consistent type scale following a logical progression.

```
xs:   0.75rem   (12px)  - Small labels, captions, metadata
sm:   0.875rem  (14px)  - Secondary text, helper text
base: 1rem      (16px)  - Body text, form inputs [DEFAULT]
lg:   1.125rem  (18px)  - Emphasized text, large body
xl:   1.25rem   (20px)  - Small headings, card titles
2xl:  1.5rem    (24px)  - Section headings, H3
3xl:  1.875rem  (30px)  - Page titles, H2
4xl:  2.25rem   (36px)  - Hero headings, H1
```

#### Line Heights
```
tight:   1.25    - Compact text (headings)
normal:  1.5     - Standard reading (body) [DEFAULT]
relaxed: 1.625   - Comfortable reading
loose:   2       - Spacious text
```

#### Font Weights
```
normal:   400  - Regular text
medium:   500  - Emphasized text
semibold: 600  - Strong emphasis, buttons
bold:     700  - Headings, important text
```

### 3. Spacing Tokens

Consistent spacing scale for margins, padding, gaps, and layout.

```
xs:  0.5rem   (8px)   - Minimal gaps (icon-text, badges)
sm:  0.75rem  (12px)  - Compact elements (button padding, tight lists)
md:  1rem     (16px)  - Default spacing [RECOMMENDED]
lg:  1.5rem   (24px)  - Card padding, section spacing [MOST COMMON]
xl:  2rem     (32px)  - Major sections, page margins
2xl: 3rem     (48px)  - Page sections, large gaps
3xl: 4rem     (64px)  - Hero sections, maximum spacing
```

**Design Principle**: Follow the 8px grid system. All spacing values are multiples of 4px or 8px.

### 4. Border Radius Tokens

Rounded corner values for different component types.

```
sm:   0.375rem (6px)   - Subtle rounding (badges, small buttons)
md:   0.5rem   (8px)   - Default [RECOMMENDED] (buttons, inputs)
lg:   0.75rem  (12px)  - Cards, panels, containers [MOST COMMON]
xl:   1rem     (16px)  - Prominent cards, large buttons
2xl:  1.5rem   (24px)  - Mobile cards, hero elements
full: 9999px           - Pills, circles, avatars
```

### 5. Shadow Tokens

Box shadow definitions for depth, elevation, and visual hierarchy.

```
none:  none                                           - No shadow
sm:    0 1px 2px 0 rgb(0 0 0 / 0.05)                 - Subtle depth
md:    0 4px 6px -1px rgb(0 0 0 / 0.1), ...          - Standard elevation [RECOMMENDED]
lg:    0 10px 15px -3px rgb(0 0 0 / 0.1), ...        - Prominent cards
xl:    0 20px 25px -5px rgb(0 0 0 / 0.1), ...        - Floating elements (modals)
2xl:   0 25px 50px -12px rgb(0 0 0 / 0.25)           - Maximum elevation
inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05)           - Inset shadow
```

**Elevation Hierarchy**:
1. Level 0 (none): Base page content
2. Level 1 (sm): Subtle depth, hover states
3. Level 2 (md): Standard cards, dropdowns
4. Level 3 (lg): Feature cards, panels
5. Level 4 (xl): Modals, overlays
6. Level 5 (2xl): Maximum prominence

### 6. Motion Tokens

#### Animation Durations
```
instant:  0ms    - No animation (skip to end state)
fast:     150ms  - Quick interactions (hover, toggle)
normal:   200ms  - Standard transitions [RECOMMENDED]
moderate: 300ms  - Comfortable animations (slide, fade)
slow:     500ms  - Deliberate animations (page transitions)
```

#### Easing Functions
```
linear:    linear                           - Constant speed
ease:      ease                             - Standard browser ease
easeIn:    ease-in                          - Slow start
easeOut:   ease-out                         - Slow end
easeInOut: ease-in-out                      - Slow start and end
smooth:    cubic-bezier(0.4, 0.0, 0.2, 1)   - Smooth, natural [RECOMMENDED]
snappy:    cubic-bezier(0.4, 0.0, 0.6, 1)   - Quick start, slow end
spring:    cubic-bezier(0.34, 1.56, 0.64, 1) - Spring bounce effect
```

## Usage Methods

### Method 1: Tailwind CSS Classes (Recommended for Static Values)

```tsx
<button className="bg-primary-600 text-white p-lg rounded-xl shadow-md">
  Click Me
</button>
```

### Method 2: CSS Custom Properties (Recommended for CSS Files)

```css
.my-button {
  background-color: var(--color-primary-600);
  padding: var(--spacing-lg);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}
```

### Method 3: TypeScript Tokens (Recommended for Dynamic/Computed Values)

```typescript
import { colors, spacing, radii } from '@/lib/design/tokens'

const dynamicStyle = {
  backgroundColor: isActive ? colors.primary[600] : colors.neutral[200],
  padding: spacing.lg,
  borderRadius: radii.xl,
}
```

## Best Practices

### DO ✅

1. **Use semantic color names**
   ```tsx
   // Good
   <Alert color="error">Error message</Alert>
   
   // Bad
   <Alert color="#ef4444">Error message</Alert>
   ```

2. **Use design tokens for all visual properties**
   ```tsx
   // Good
   className="p-lg text-base"
   
   // Bad
   style={{ padding: '24px', fontSize: '16px' }}
   ```

3. **Choose the right access method**
   - Static values → Tailwind classes
   - CSS files → CSS custom properties
   - Dynamic/computed → TypeScript tokens

### DON'T ❌

1. **Don't hardcode visual values**
   ```tsx
   // Bad
   style={{ padding: '16px', color: '#0ea5e9' }}
   
   // Good
   className="p-md text-primary-500"
   ```

2. **Don't use literal color names in UI code**
   ```tsx
   // Bad
   className="bg-blue-500"
   
   // Good
   className="bg-primary-500"
   ```

3. **Don't create custom spacing without good reason**
   ```tsx
   // Bad
   style={{ padding: '18px' }}
   
   // Good - use closest token
   className="p-lg" // 24px
   ```

## Token Export

Tokens can be exported as JSON for use in external tooling (Figma, iOS, Android):

```bash
npm run tokens:export
```

This generates `/public/design-tokens.json` with the complete token specification in a platform-agnostic format.

## Implementation Files

| File | Purpose |
|------|---------|
| `/lib/design/tokens.ts` | TypeScript source of truth |
| `/app/globals.css` | CSS custom properties |
| `/scripts/design/export-tokens.ts` | JSON export script |
| `/docs/design/v0.4/tokens.md` | Detailed implementation guide |
| `/docs/design/v0.4/usage-examples.md` | Code examples |

## Related Documentation

- [V0.4 Design Tokens (Detailed)](./v0.4/tokens.md) - Comprehensive implementation details
- [Usage Examples](./v0.4/usage-examples.md) - Copy-paste code examples
- [Design System Overview](/docs/V0_4_DESIGN_SYSTEM.md) - Full design system
- [TypeScript Tokens](/lib/design/tokens.ts) - Source code

## Version History

- **1.0.0** (2026-01-11): Canonical specification established
- **0.4.0** (2025-12-12): Initial comprehensive implementation

---

**Status**: ✅ Production Ready - Canonical Source of Truth  
**Maintainer**: Design System Team  
**Non-goals**: Full rebranding, Figma automation (structural basis only)
