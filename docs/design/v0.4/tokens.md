# Design Tokens - v0.4

> **Version**: 0.4.0  
> **Status**: Production Ready  
> **Last Updated**: 2025-12-12

## Overview

This document describes the complete design token system for Rhythmologicum Connect v0.4. Design tokens are the foundational visual design elements that ensure consistency across the entire application.

## Implementation

Design tokens are implemented in **three locations** for maximum flexibility:

1. **TypeScript**: `/lib/design-tokens.ts` - For programmatic access in React components
2. **CSS Custom Properties**: `/app/globals.css` (`:root` scope) - For use in CSS stylesheets
3. **Tailwind CSS Theme**: `/app/globals.css` (`@theme` block) - For utility class generation

## Color Palette

### Primary Colors (Sky Blue)

Main brand color used for primary actions, highlights, and interactive elements.

**Hex Values**:
```
50:  #f0f9ff - Lightest background
100: #e0f2fe - Light background
200: #bae6fd - Subtle highlights
300: #7dd3fc - Light accents
400: #38bdf8 - Medium accents
500: #0ea5e9 - PRIMARY BRAND COLOR
600: #0284c7 - PRIMARY DARK (hover states)
700: #0369a1 - Strong emphasis
800: #075985 - Very strong emphasis
900: #0c4a6e - Darkest shade
```

**Tailwind Classes**:
```tsx
// Background
className="bg-primary-500"     // #0ea5e9
className="bg-primary-600"     // #0284c7 (hover)

// Text
className="text-primary-600"   // #0284c7

// Border
className="border-primary-500" // #0ea5e9
```

**CSS Custom Properties**:
```css
background-color: var(--color-primary-500);
color: var(--color-primary-600);
border-color: var(--color-primary-300);
```

**TypeScript**:
```typescript
import { colors } from '@/lib/design-tokens'

const buttonBg = colors.primary[600]  // '#0284c7'
```

### Neutral Colors (Slate)

Grayscale colors for backgrounds, borders, text, and UI elements.

**Hex Values**:
```
50:  #f8fafc - Page backgrounds
100: #f1f5f9 - Card backgrounds
200: #e2e8f0 - Light borders
300: #cbd5e1 - Default borders
400: #94a3b8 - Disabled text
500: #64748b - Secondary text
600: #475569 - Body text
700: #334155 - Primary text
800: #1e293b - Strong text
900: #0f172a - Darkest text
```

**Usage Guidelines**:
- **50-100**: Backgrounds
- **200-300**: Borders, dividers
- **400-500**: Disabled states, placeholder text
- **600-700**: Body text, labels
- **800-900**: Headings, emphasized text

**Tailwind Classes**:
```tsx
className="bg-neutral-50 text-neutral-700 border-neutral-300"
```

### Semantic Colors

Contextual colors for feedback states and alerts.

**Success (Green)**:
- Base: `#10b981`
- Light: `#d1fae5`
- Use: Success messages, confirmations, positive feedback

**Warning (Amber)**:
- Base: `#f59e0b`
- Light: `#fef3c7`
- Use: Warnings, caution states, attention needed

**Error (Red)**:
- Base: `#ef4444`
- Light: `#fee2e2`
- Use: Error messages, validation errors, destructive actions

**Info (Blue)**:
- Base: `#3b82f6`
- Light: `#dbeafe`
- Use: Information messages, neutral notifications

**Tailwind Classes**:
```tsx
className="bg-success text-success"
className="bg-error-light text-error border-error"
className="bg-warning-light text-warning"
```

### Background Colors

Predefined backgrounds for consistent page styling.

```
light:              #ffffff - Default light background
lightGradientFrom:  #f0f9ff - Sky-50 for gradients
lightGradientTo:    #ffffff - White for gradients
dark:               #0a0a0a - Dark mode background
darkGradientFrom:   #1e293b - Slate-800 for gradients
darkGradientTo:     #0f172a - Slate-900 for gradients
```

## Typography

### Font Sizes

Consistent font size scale following a logical progression.

**Scale**:
```
xs:   0.75rem   (12px) - Small labels, captions, metadata
sm:   0.875rem  (14px) - Secondary text, helper text
base: 1rem      (16px) - Body text, form inputs (DEFAULT)
lg:   1.125rem  (18px) - Emphasized text, large body
xl:   1.25rem   (20px) - Small headings, card titles
2xl:  1.5rem    (24px) - Section headings, H3
3xl:  1.875rem  (30px) - Page titles, H2
4xl:  2.25rem   (36px) - Hero headings, H1
```

**Tailwind Classes**:
```tsx
<h1 className="text-4xl">Hero Heading</h1>
<h2 className="text-3xl">Page Title</h2>
<h3 className="text-2xl">Section Heading</h3>
<p className="text-base">Body paragraph</p>
<small className="text-sm">Helper text</small>
```

**CSS Custom Properties**:
```css
h1 { font-size: var(--font-size-4xl); }
h2 { font-size: var(--font-size-3xl); }
h3 { font-size: var(--font-size-2xl); }
body { font-size: var(--font-size-base); }
```

### Line Heights

```
tight:   1.25   - Compact text (headings)
normal:  1.5    - Standard reading (body) [DEFAULT]
relaxed: 1.625  - Comfortable reading
loose:   2      - Spacious text
```

### Font Weights

```
normal:   400 - Regular text
medium:   500 - Emphasized text
semibold: 600 - Strong emphasis, buttons
bold:     700 - Headings, important text
```

## Spacing

Consistent spacing scale for margins, padding, gaps, and layout.

**Scale**:
```
xs:  0.5rem   (8px)  - Minimal gaps between icons/text
sm:  0.75rem  (12px) - Compact elements, tight spacing
md:  1rem     (16px) - Default spacing [RECOMMENDED]
lg:  1.5rem   (24px) - Card padding, section spacing
xl:  2rem     (32px) - Major sections, page margins
2xl: 3rem     (48px) - Page sections, large gaps
3xl: 4rem     (64px) - Hero sections, maximum spacing
```

**Tailwind Classes**:
```tsx
className="p-lg"      // padding: 1.5rem (24px)
className="mb-xl"     // margin-bottom: 2rem (32px)
className="gap-md"    // gap: 1rem (16px)
className="space-y-lg" // vertical spacing between children
```

**CSS Custom Properties**:
```css
padding: var(--spacing-lg);
margin-bottom: var(--spacing-xl);
gap: var(--spacing-md);
```

**Usage Guidelines**:
- **xs (8px)**: Icon-text gaps, badge padding
- **sm (12px)**: Button padding, compact lists
- **md (16px)**: Default form field spacing, standard padding
- **lg (24px)**: Card padding, section spacing (MOST COMMON)
- **xl (32px)**: Page container padding, major sections
- **2xl (48px)**: Page-level sections
- **3xl (64px)**: Hero sections, landing pages

## Border Radius

Rounded corner values for different component types.

**Scale**:
```
sm:   0.375rem (6px)   - Subtle rounding (badges, small buttons)
md:   0.5rem   (8px)   - Default (buttons, inputs) [RECOMMENDED]
lg:   0.75rem  (12px)  - Cards, panels, containers
xl:   1rem     (16px)  - Prominent cards, large buttons
2xl:  1.5rem   (24px)  - Mobile cards, hero elements
full: 9999px           - Pills, circles, avatars
```

**Tailwind Classes**:
```tsx
className="rounded-md"   // Border radius: 8px (buttons, inputs)
className="rounded-lg"   // Border radius: 12px (cards)
className="rounded-xl"   // Border radius: 16px (prominent cards)
className="rounded-full" // Fully circular (avatars, pills)
```

**CSS Custom Properties**:
```css
button { border-radius: var(--radius-md); }
.card { border-radius: var(--radius-lg); }
.avatar { border-radius: var(--radius-full); }
```

**Usage Guidelines**:
- **sm**: Badges, small UI elements
- **md**: Buttons, form inputs (MOST COMMON)
- **lg**: Cards, panels (MOST COMMON)
- **xl**: Large cards, navigation buttons
- **2xl**: Mobile-optimized cards
- **full**: Avatars, pills, circular badges

## Shadows

Box shadow definitions for depth, elevation, and visual hierarchy.

**Scale**:
```
sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
    - Subtle depth, slight elevation
    - Use for: Subtle cards, hover states

md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
    - Standard elevation [RECOMMENDED]
    - Use for: Standard cards, dropdowns, buttons

lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
    - Prominent elevation
    - Use for: Feature cards, important panels

xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
    - Floating elevation
    - Use for: Modals, popovers, tooltips

2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
     - Maximum elevation
     - Use for: Major overlays, full-screen modals

inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05)
       - Inset shadow
       - Use for: Pressed buttons, input fields
```

**Tailwind Classes**:
```tsx
className="shadow-md"   // Standard card shadow
className="shadow-lg"   // Feature card shadow
className="shadow-xl"   // Modal shadow
```

**CSS Custom Properties**:
```css
.card { box-shadow: var(--shadow-md); }
.modal { box-shadow: var(--shadow-xl); }
```

**Elevation Levels**:
1. **Level 0 (None)**: Base page content
2. **Level 1 (sm)**: Slight elevation, hover states
3. **Level 2 (md)**: Standard cards, dropdowns
4. **Level 3 (lg)**: Feature cards, panels
5. **Level 4 (xl)**: Modals, overlays
6. **Level 5 (2xl)**: Maximum prominence

## Motion & Animation

### Durations

```
instant:  0ms   - No animation (skip to end state)
fast:     150ms - Quick interactions (hover, toggle)
normal:   200ms - Standard transitions (RECOMMENDED)
moderate: 300ms - Comfortable animations (slide, fade)
slow:     500ms - Deliberate animations (page transitions)
```

### Easing Functions

```
linear:    linear                          - Constant speed
ease:      ease                            - Standard browser ease
easeIn:    ease-in                         - Slow start
easeOut:   ease-out                        - Slow end
easeInOut: ease-in-out                     - Slow start and end
smooth:    cubic-bezier(0.4, 0.0, 0.2, 1)  - Smooth, natural (RECOMMENDED)
snappy:    cubic-bezier(0.4, 0.0, 0.6, 1)  - Quick start, slow end
spring:    cubic-bezier(0.34, 1.56, 0.64, 1) - Spring bounce effect
```

### CSS Usage

```css
.button {
  transition: all 200ms cubic-bezier(0.4, 0.0, 0.2, 1);
  /* or using custom properties: */
  transition: all var(--duration-normal) var(--easing-smooth);
}
```

### TypeScript Usage

```typescript
import { motion } from '@/lib/design-tokens'

// For inline styles
const buttonStyle = {
  transition: `all ${motion.duration.normal} ${motion.easing.smooth}`
}

// For Framer Motion
import { motion as framerMotion } from 'framer-motion'

<framerMotion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={motion.spring.default}
/>
```

## Usage Examples

### Complete Button Example

```tsx
import { spacing, radii, typography, colors, shadows, motion } from '@/lib/design-tokens'

function MyButton({ children }) {
  return (
    <button
      style={{
        // Spacing
        padding: `${spacing.md} ${spacing.lg}`,
        
        // Typography
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        
        // Colors
        backgroundColor: colors.primary[600],
        color: '#ffffff',
        
        // Appearance
        borderRadius: radii.xl,
        boxShadow: shadows.md,
        
        // Motion
        transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
      }}
    >
      {children}
    </button>
  )
}
```

### Using Tailwind Classes

```tsx
function MyCard({ children }) {
  return (
    <div className="bg-neutral-50 p-lg rounded-lg shadow-md">
      <h3 className="text-2xl text-neutral-900 mb-md">Card Title</h3>
      <p className="text-base text-neutral-700">{children}</p>
    </div>
  )
}
```

### Mixed Approach

```tsx
import { colors } from '@/lib/design-tokens'

function Alert({ type, message }) {
  const bgColor = type === 'error' ? colors.semantic.error : colors.semantic.info
  
  return (
    <div 
      className="p-md rounded-lg"
      style={{ backgroundColor: bgColor, color: '#ffffff' }}
    >
      {message}
    </div>
  )
}
```

## Accessing Tokens

### Method 1: Tailwind CSS Classes (Recommended for Static Values)

```tsx
<div className="bg-primary-600 text-white p-lg rounded-xl shadow-md">
  Content
</div>
```

### Method 2: CSS Custom Properties (Recommended for CSS Files)

```css
.my-component {
  background-color: var(--color-primary-600);
  padding: var(--spacing-lg);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}
```

### Method 3: TypeScript Tokens (Recommended for Dynamic/Computed Values)

```typescript
import { colors, spacing, radii, shadows } from '@/lib/design-tokens'

const dynamicStyle = {
  backgroundColor: someCondition ? colors.primary[600] : colors.neutral[200],
  padding: spacing.lg,
  borderRadius: radii.xl,
  boxShadow: shadows.md,
}
```

## Best Practices

### DO ✅

1. **Use design tokens for all visual properties**
   ```tsx
   // Good
   className="p-lg text-base"
   
   // Bad
   style={{ padding: '24px', fontSize: '16px' }}
   ```

2. **Choose the right method for the use case**
   - Static values → Tailwind classes
   - CSS files → CSS custom properties
   - Dynamic/computed → TypeScript tokens

3. **Use semantic color names**
   ```tsx
   // Good
   <Alert color={colors.semantic.error}>
   
   // Bad
   <Alert color="#ef4444">
   ```

4. **Maintain consistent spacing**
   ```tsx
   // Good
   <div className="space-y-lg">
   
   // Bad
   <div style={{ gap: '23px' }}>
   ```

### DON'T ❌

1. **Don't hardcode visual values**
   ```tsx
   // Bad
   style={{ padding: '16px', color: '#0ea5e9' }}
   
   // Good
   className="p-md text-primary-500"
   ```

2. **Don't create custom spacing without good reason**
   ```tsx
   // Bad
   style={{ padding: '18px' }}
   
   // Good - use closest token
   className="p-lg" // 24px
   ```

3. **Don't mix naming conventions**
   ```tsx
   // Bad
   <div className="p-lg" style={{ margin: '24px' }}>
   
   // Good
   <div className="p-lg m-lg">
   ```

## Token Coverage

### ✅ Colors
- Primary palette (Sky Blue): 10 shades
- Neutral palette (Slate): 10 shades
- Semantic colors: Success, Warning, Error, Info (+ light variants)
- Background colors: Light, Dark, Gradients

### ✅ Typography
- Font sizes: 8 levels (xs to 4xl)
- Line heights: 4 levels (tight to loose)
- Font weights: 4 weights (normal to bold)

### ✅ Spacing
- 7 spacing levels (xs to 3xl)
- Covers 8px to 64px range
- Follows 4/8px grid system

### ✅ Border Radius
- 6 radius levels (sm to 2xl) + full
- Covers 6px to 24px + circular

### ✅ Shadows
- 5 elevation levels (sm to 2xl) + inner
- Provides depth hierarchy

### ✅ Motion
- 5 duration levels (instant to slow)
- 8 easing functions (linear to spring)
- Framer Motion presets

## Figma Integration

All tokens in this document map 1:1 with Figma design tokens. When designers update Figma:

1. **Colors**: Update hex values in this document and `/app/globals.css`
2. **Spacing**: Update rem values in design tokens
3. **Typography**: Update font size scale
4. **Radii**: Update border radius values
5. **Shadows**: Update box shadow definitions

**Token sync checklist**:
- [ ] Update `/lib/design-tokens.ts` (TypeScript)
- [ ] Update `/app/globals.css` (`:root` CSS variables)
- [ ] Update `/app/globals.css` (`@theme` Tailwind integration)
- [ ] Update this documentation
- [ ] Test in design system showcase page
- [ ] Verify Tailwind utility classes work

## Validation

### Tailwind Class Availability

All tokens should be accessible via Tailwind utility classes:

```bash
# Test in browser console or component
<div className="bg-primary-500">       ✓ Works
<div className="text-neutral-700">     ✓ Works
<div className="p-lg">                 ✓ Works
<div className="rounded-xl">           ✓ Works
<div className="shadow-md">            ✓ Works
<div className="text-2xl">             ✓ Works
```

### CSS Custom Property Availability

```css
/* All should work in any CSS file */
background-color: var(--color-primary-500);  ✓
padding: var(--spacing-lg);                  ✓
border-radius: var(--radius-xl);             ✓
box-shadow: var(--shadow-md);                ✓
font-size: var(--font-size-2xl);             ✓
```

### TypeScript Token Availability

```typescript
import { colors, spacing, radii, shadows, typography } from '@/lib/design-tokens'

colors.primary[500]        ✓
spacing.lg                 ✓
radii.xl                   ✓
shadows.md                 ✓
typography.fontSize['2xl'] ✓
```

## Migration Notes

When migrating existing components:

1. **Identify hardcoded values** (colors, spacing, etc.)
2. **Replace with appropriate token**
3. **Choose token access method** (Tailwind/CSS/TypeScript)
4. **Test visual result**
5. **Remove old hardcoded values**

**Before**:
```tsx
<button style={{ 
  padding: '16px 24px',
  fontSize: '16px',
  backgroundColor: '#0284c7',
  borderRadius: '16px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
}}>
```

**After (Tailwind)**:
```tsx
<button className="px-lg py-md text-base bg-primary-600 rounded-xl shadow-md">
```

**After (TypeScript)**:
```typescript
import { spacing, typography, colors, radii, shadows } from '@/lib/design-tokens'

<button style={{
  padding: `${spacing.md} ${spacing.lg}`,
  fontSize: typography.fontSize.base,
  backgroundColor: colors.primary[600],
  borderRadius: radii.xl,
  boxShadow: shadows.md
}}>
```

## Related Documentation

- **Design System Overview**: `/docs/V0_4_DESIGN_SYSTEM.md`
- **Design Token Details**: `/docs/V0_4_DESIGN_TOKENS.md`
- **TypeScript Tokens**: `/lib/design-tokens.ts`
- **CSS Variables**: `/app/globals.css`
- **UI Component Library**: `/lib/ui/`

---

**Status**: ✅ Production Ready  
**Coverage**: 100% of Figma tokens implemented  
**Version**: 0.4.0  
**Last Updated**: 2025-12-12
