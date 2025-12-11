# V0.4 Design Tokens

> Version: 0.4.0  
> Status: Production Ready  
> Last Updated: 2025-12-11

## Overview

This document provides a comprehensive reference for the design token system in Rhythmologicum Connect v0.4. Design tokens are the atomic building blocks of our design system—centralized values for colors, typography, spacing, and other visual properties that ensure consistency across the application.

## Purpose & Benefits

### Why Design Tokens?

1. **Single Source of Truth**: All design values defined in one location
2. **Consistency**: Eliminates magic numbers and ensures uniform UI
3. **Maintainability**: Update values globally without searching through components
4. **Type Safety**: TypeScript provides autocomplete and type checking
5. **Theme Support**: Infrastructure for future theme variants (stress, sleep, custom)
6. **Developer Experience**: Clear, semantic naming improves code readability

### Key Advantages

- ✅ No more `className="px-4 py-3"` magic numbers
- ✅ Consistent spacing across all components
- ✅ Unified color palette with semantic meanings
- ✅ Predictable animation timing
- ✅ Easy to update and refactor
- ✅ Built-in documentation via TypeScript types

## Architecture

### Token Storage Locations

Design tokens are defined in **two locations** for maximum flexibility:

#### 1. TypeScript Tokens (`/lib/design-tokens.ts`)

**Purpose**: Programmatic access in React components and TypeScript code

**Usage**:
```typescript
import { spacing, typography, colors } from '@/lib/design-tokens'

<div style={{ padding: spacing.lg, fontSize: typography.fontSize.base }}>
  Content
</div>
```

**Advantages**:
- Type-safe with autocomplete
- Can be used in calculations
- Easy to import in any component
- Supports dynamic theming

#### 2. CSS Custom Properties (`/app/globals.css`)

**Purpose**: Global access in CSS and inline styles

**Usage**:
```css
.my-component {
  padding: var(--spacing-lg);
  font-size: var(--font-size-base);
  color: var(--color-primary-500);
}
```

**Advantages**:
- No JavaScript required
- Works in any CSS context
- Easy to override for testing
- Standard CSS syntax

### Token Organization

Tokens are organized into **seven primary categories**:

1. **Colors** - Color palette and semantic colors
2. **Typography** - Font sizes, weights, and line heights
3. **Spacing** - Margins, padding, and gaps
4. **Radii** - Border radius values
5. **Shadows** - Box shadow definitions
6. **Motion** - Animation durations and easing
7. **Component Tokens** - Pre-configured combinations

---

## Token Categories

### 1. Colors

#### Primary Colors (Sky Blue)

Main brand color used for primary actions, highlights, and interactive elements.

**TypeScript**:
```typescript
import { colors } from '@/lib/design-tokens'

colors.primary[50]  // '#f0f9ff' - Lightest
colors.primary[500] // '#0ea5e9' - Primary brand color
colors.primary[600] // '#0284c7' - Primary dark (hover states)
colors.primary[900] // '#0c4a6e' - Darkest
```

**CSS**:
```css
--color-primary-50:  #f0f9ff;
--color-primary-100: #e0f2fe;
--color-primary-200: #bae6fd;
--color-primary-300: #7dd3fc;
--color-primary-400: #38bdf8;
--color-primary-500: #0ea5e9; /* Primary */
--color-primary-600: #0284c7; /* Primary Dark */
--color-primary-700: #0369a1;
--color-primary-800: #075985;
--color-primary-900: #0c4a6e;
```

**Usage Examples**:
```tsx
// Button primary color
<Button style={{ backgroundColor: colors.primary[600] }}>
  Save
</Button>

// Link hover state
<a style={{ color: colors.primary[500] }}>Link</a>

// Background highlight
<div style={{ backgroundColor: colors.primary[50] }}>
  Highlighted content
</div>
```

#### Neutral Colors (Slate)

Grayscale colors used for backgrounds, borders, and text.

**TypeScript**:
```typescript
colors.neutral[50]  // '#f8fafc' - Lightest background
colors.neutral[100] // '#f1f5f9' - Light background
colors.neutral[200] // '#e2e8f0' - Border light
colors.neutral[300] // '#cbd5e1' - Border default
colors.neutral[500] // '#64748b' - Secondary text
colors.neutral[700] // '#334155' - Primary text
colors.neutral[900] // '#0f172a' - Darkest text
```

**CSS**:
```css
--color-neutral-50:  #f8fafc;
--color-neutral-100: #f1f5f9;
--color-neutral-200: #e2e8f0;
--color-neutral-300: #cbd5e1;
--color-neutral-400: #94a3b8;
--color-neutral-500: #64748b;
--color-neutral-600: #475569;
--color-neutral-700: #334155;
--color-neutral-800: #1e293b;
--color-neutral-900: #0f172a;
```

**Usage Guidelines**:
- **50-100**: Page backgrounds, card backgrounds
- **200-300**: Borders, dividers
- **400-500**: Disabled states, secondary text
- **600-700**: Primary text, headings
- **800-900**: High-emphasis text, dark backgrounds

#### Semantic Colors

Contextual colors for states and feedback.

**TypeScript**:
```typescript
colors.semantic.success // '#10b981' - Green (success states)
colors.semantic.warning // '#f59e0b' - Amber (warning states)
colors.semantic.error   // '#ef4444' - Red (error states)
colors.semantic.info    // '#3b82f6' - Blue (info states)
```

**CSS**:
```css
--color-success: #10b981;
--color-success-light: #d1fae5;
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;
--color-error: #ef4444;
--color-error-light: #fee2e2;
--color-info: #3b82f6;
--color-info-light: #dbeafe;
```

**Usage Examples**:
```tsx
// Success message
<div style={{ 
  backgroundColor: 'var(--color-success-light)',
  color: colors.semantic.success 
}}>
  ✓ Changes saved successfully
</div>

// Error state
<Input
  error
  style={{ borderColor: colors.semantic.error }}
  errorMessage="This field is required"
/>

// Warning banner
<Alert style={{ backgroundColor: 'var(--color-warning-light)' }}>
  ⚠️ Your session will expire soon
</Alert>
```

#### Background Colors

**TypeScript**:
```typescript
colors.background.light              // '#ffffff'
colors.background.lightGradientFrom  // '#f0f9ff' (sky-50)
colors.background.lightGradientTo    // '#ffffff'
colors.background.dark               // '#0a0a0a'
colors.background.darkGradientFrom   // '#1e293b' (slate-800)
colors.background.darkGradientTo     // '#0f172a' (slate-900)
```

**Usage**:
```tsx
// Page background with gradient
<div style={{
  background: `linear-gradient(to bottom, 
    ${colors.background.lightGradientFrom}, 
    ${colors.background.lightGradientTo})`
}}>
  Page content
</div>
```

---

### 2. Typography

#### Font Sizes

Consistent font size scale following a logical progression.

**TypeScript**:
```typescript
import { typography } from '@/lib/design-tokens'

typography.fontSize.xs    // '0.75rem'   (12px) - Small labels, captions
typography.fontSize.sm    // '0.875rem'  (14px) - Secondary text
typography.fontSize.base  // '1rem'      (16px) - Body text, inputs
typography.fontSize.lg    // '1.125rem'  (18px) - Emphasized text
typography.fontSize.xl    // '1.25rem'   (20px) - Small headings
typography.fontSize['2xl'] // '1.5rem'   (24px) - Section headings
typography.fontSize['3xl'] // '1.875rem' (30px) - Page titles
typography.fontSize['4xl'] // '2.25rem'  (36px) - Hero headings
```

**CSS**:
```css
--font-size-xs:   0.75rem;   /* 12px */
--font-size-sm:   0.875rem;  /* 14px */
--font-size-base: 1rem;      /* 16px */
--font-size-lg:   1.125rem;  /* 18px */
--font-size-xl:   1.25rem;   /* 20px */
--font-size-2xl:  1.5rem;    /* 24px */
--font-size-3xl:  1.875rem;  /* 30px */
--font-size-4xl:  2.25rem;   /* 36px */
```

**Usage Guidelines**:
```tsx
// Hero heading
<h1 style={{ fontSize: typography.fontSize['4xl'] }}>
  Welcome to Rhythmologicum Connect
</h1>

// Page title
<h2 style={{ fontSize: typography.fontSize['3xl'] }}>
  Patient Dashboard
</h2>

// Section heading
<h3 style={{ fontSize: typography.fontSize['2xl'] }}>
  Recent Assessments
</h3>

// Body text
<p style={{ fontSize: typography.fontSize.base }}>
  Regular paragraph text
</p>

// Small text
<span style={{ fontSize: typography.fontSize.sm }}>
  Last updated 2 hours ago
</span>
```

#### Line Heights

**TypeScript**:
```typescript
typography.lineHeight.tight   // '1.25'   - Compact text (headings)
typography.lineHeight.normal  // '1.5'    - Standard reading (body)
typography.lineHeight.relaxed // '1.625'  - Comfortable reading
typography.lineHeight.loose   // '2'      - Spacious text
```

**Usage**:
```tsx
// Heading with tight line height
<h2 style={{ 
  fontSize: typography.fontSize['2xl'],
  lineHeight: typography.lineHeight.tight 
}}>
  Multi-line Heading Text That Wraps
</h2>

// Body text with normal line height
<p style={{ lineHeight: typography.lineHeight.normal }}>
  Regular paragraph with comfortable reading experience.
</p>
```

#### Font Weights

**TypeScript**:
```typescript
typography.fontWeight.normal   // '400' - Regular text
typography.fontWeight.medium   // '500' - Emphasized text
typography.fontWeight.semibold // '600' - Strong emphasis
typography.fontWeight.bold     // '700' - Headings
```

**Usage**:
```tsx
// Button text
<button style={{ fontWeight: typography.fontWeight.semibold }}>
  Save Changes
</button>

// Heading
<h3 style={{ fontWeight: typography.fontWeight.bold }}>
  Section Title
</h3>
```

---

### 3. Spacing

Consistent spacing scale for margins, padding, and gaps.

**TypeScript**:
```typescript
import { spacing } from '@/lib/design-tokens'

spacing.xs   // '0.5rem'  (8px)  - Minimal gaps
spacing.sm   // '0.75rem' (12px) - Compact elements
spacing.md   // '1rem'    (16px) - Default spacing
spacing.lg   // '1.5rem'  (24px) - Sections, cards
spacing.xl   // '2rem'    (32px) - Major sections
spacing['2xl'] // '3rem'  (48px) - Page sections
spacing['3xl'] // '4rem'  (64px) - Hero sections
```

**CSS**:
```css
--spacing-xs:  0.5rem;   /* 8px */
--spacing-sm:  0.75rem;  /* 12px */
--spacing-md:  1rem;     /* 16px */
--spacing-lg:  1.5rem;   /* 24px */
--spacing-xl:  2rem;     /* 32px */
--spacing-2xl: 3rem;     /* 48px */
--spacing-3xl: 4rem;     /* 64px */
```

**Usage Guidelines**:

```tsx
// Card padding
<Card style={{ padding: spacing.lg }}>
  Content
</Card>

// Section spacing
<section style={{ marginBottom: spacing['2xl'] }}>
  Section content
</section>

// Button padding
<Button style={{ 
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.md
}}>
  Click Me
</Button>

// Flex gap
<div style={{ 
  display: 'flex',
  gap: spacing.md 
}}>
  <Button>Cancel</Button>
  <Button>Save</Button>
</div>
```

**Common Patterns**:
- **xs (8px)**: Tight gaps between icons and text
- **sm (12px)**: Compact lists, small cards
- **md (16px)**: Default padding, form field spacing
- **lg (24px)**: Card padding, section spacing
- **xl (32px)**: Page margins, major sections
- **2xl (48px)**: Hero sections, page separators
- **3xl (64px)**: Landing page sections

---

### 4. Border Radius

Rounded corner values for different component types.

**TypeScript**:
```typescript
import { radii } from '@/lib/design-tokens'

radii.none  // '0'
radii.sm    // '0.375rem' (6px)  - Subtle rounding
radii.md    // '0.5rem'   (8px)  - Default buttons, inputs
radii.lg    // '0.75rem'  (12px) - Cards, panels
radii.xl    // '1rem'     (16px) - Prominent cards
radii['2xl'] // '1.5rem'  (24px) - Mobile cards, hero elements
radii.full  // '9999px'           - Pill shape, circles
```

**CSS**:
```css
--radius-sm:   0.375rem;  /* 6px */
--radius-md:   0.5rem;    /* 8px */
--radius-lg:   0.75rem;   /* 12px */
--radius-xl:   1rem;      /* 16px */
--radius-2xl:  1.5rem;    /* 24px */
--radius-full: 9999px;    /* Pills/circles */
```

**Usage Examples**:
```tsx
// Button
<button style={{ borderRadius: radii.md }}>
  Click Me
</button>

// Card
<Card style={{ borderRadius: radii.lg }}>
  Card content
</Card>

// Mobile card (more rounded)
<Card style={{ borderRadius: radii['2xl'] }}>
  Mobile-optimized card
</Card>

// Badge/Pill
<span style={{ borderRadius: radii.full }}>
  New
</span>

// Avatar
<img style={{ borderRadius: radii.full }} />
```

---

### 5. Shadows

Box shadow definitions for depth and elevation.

**TypeScript**:
```typescript
import { shadows } from '@/lib/design-tokens'

shadows.none  // 'none'
shadows.sm    // Subtle depth
shadows.md    // Standard elevation
shadows.lg    // Prominent cards
shadows.xl    // Floating elements
shadows['2xl'] // Maximum elevation
shadows.inner // Inset shadow
```

**CSS**:
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

**Usage Guidelines**:
```tsx
// Subtle card
<Card style={{ boxShadow: shadows.sm }}>
  Low elevation content
</Card>

// Standard card
<Card style={{ boxShadow: shadows.md }}>
  Normal elevation
</Card>

// Prominent card
<Card style={{ boxShadow: shadows.lg }}>
  High emphasis content
</Card>

// Floating modal
<Modal style={{ boxShadow: shadows.xl }}>
  Modal content
</Modal>

// Inset (pressed button)
<button style={{ boxShadow: shadows.inner }}>
  Pressed
</button>
```

---

### 6. Motion & Animation

Animation durations and easing functions for consistent motion.

#### Durations

**TypeScript**:
```typescript
import { motion } from '@/lib/design-tokens'

motion.duration.instant  // '0ms'   - No animation
motion.duration.fast     // '150ms' - Quick interactions
motion.duration.normal   // '200ms' - Standard transitions
motion.duration.moderate // '300ms' - Comfortable animations
motion.duration.slow     // '500ms' - Deliberate animations
```

**CSS**:
```css
--duration-fast:     150ms;
--duration-normal:   200ms;
--duration-moderate: 300ms;
--duration-slow:     500ms;
```

#### Easing Functions

**TypeScript**:
```typescript
motion.easing.linear    // 'linear'
motion.easing.ease      // 'ease'
motion.easing.easeIn    // 'ease-in'
motion.easing.easeOut   // 'ease-out'
motion.easing.easeInOut // 'ease-in-out'
motion.easing.smooth    // 'cubic-bezier(0.4, 0.0, 0.2, 1)' - Smooth, natural
motion.easing.snappy    // 'cubic-bezier(0.4, 0.0, 0.6, 1)' - Quick start, slow end
motion.easing.spring    // 'cubic-bezier(0.34, 1.56, 0.64, 1)' - Spring bounce
```

**CSS**:
```css
--easing-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
--easing-snappy: cubic-bezier(0.4, 0.0, 0.6, 1);
```

#### Usage Examples

```tsx
// Button hover transition
<button style={{
  transition: `all ${motion.duration.normal} ${motion.easing.smooth}`
}}>
  Hover me
</button>

// Slide-in animation
<div style={{
  animation: `slideIn ${motion.duration.moderate} ${motion.easing.snappy}`
}}>
  Content
</div>

// Progress bar
<div style={{
  width: `${progress}%`,
  transition: `width ${motion.duration.moderate} ${motion.easing.easeOut}`
}} />
```

#### Framer Motion Spring Configurations

For animations using Framer Motion:

**TypeScript**:
```typescript
motion.spring.default // { type: 'spring', stiffness: 300, damping: 20 }
motion.spring.gentle  // { type: 'spring', stiffness: 200, damping: 25 }
motion.spring.bouncy  // { type: 'spring', stiffness: 400, damping: 15 }
```

**Usage**:
```tsx
import { motion as framerMotion } from 'framer-motion'
import { motion as motionTokens } from '@/lib/design-tokens'

<framerMotion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={motionTokens.spring.default}
>
  Animated content
</framerMotion.div>
```

---

### 7. Component Tokens

Pre-configured token combinations for common component patterns. These provide consistent styling across similar components.

#### Mobile Question Card

**TypeScript**:
```typescript
import { componentTokens } from '@/lib/design-tokens'

const tokens = componentTokens.mobileQuestionCard

tokens.borderRadius    // radii['2xl']
tokens.padding         // spacing.lg
tokens.shadow          // shadows.lg
tokens.headerPaddingX  // spacing.md
tokens.headerPaddingY  // spacing.md
tokens.contentPaddingX // spacing.lg
tokens.contentPaddingY // spacing.lg
```

**Usage**:
```tsx
<div style={{
  borderRadius: tokens.borderRadius,
  padding: tokens.padding,
  boxShadow: tokens.shadow
}}>
  Mobile card content
</div>
```

#### Answer Buttons

**TypeScript**:
```typescript
const tokens = componentTokens.answerButton

tokens.borderRadius  // radii.xl
tokens.paddingX      // spacing.md
tokens.paddingY      // spacing.md
tokens.minHeight     // '44px'
tokens.minWidth      // '44px'
tokens.gap           // '0.25rem'
tokens.fontSize      // typography.fontSize.base
tokens.fontWeight    // typography.fontWeight.semibold
tokens.transition    // Combined duration + easing
```

#### Navigation Buttons

**TypeScript**:
```typescript
const tokens = componentTokens.navigationButton

tokens.borderRadius  // radii.xl
tokens.paddingX      // spacing.lg
tokens.paddingY      // spacing.md
tokens.minHeight     // '56px' - Larger for primary actions
tokens.fontSize      // typography.fontSize.base
tokens.fontWeight    // typography.fontWeight.semibold
tokens.shadow        // shadows.md
tokens.transition    // Combined duration + easing
```

#### Progress Bar

**TypeScript**:
```typescript
const tokens = componentTokens.progressBar

tokens.height       // '0.5rem' (8px)
tokens.borderRadius // radii.full
tokens.transition   // Width transition config
```

#### Info Box

**TypeScript**:
```typescript
const tokens = componentTokens.infoBox

tokens.borderRadius // radii.lg
tokens.padding      // spacing.md
tokens.fontSize     // typography.fontSize.sm
tokens.lineHeight   // typography.lineHeight.relaxed
```

---

## Theme Support

### Current Implementation

The design token system includes infrastructure for theme variants, supporting the `funnels.default_theme` database field.

**TypeScript**:
```typescript
export type ThemeVariant = 'default' | 'stress' | 'sleep' | 'custom'

export function getThemeColors(variant?: ThemeVariant) {
  // Currently returns default colors
  // Future: Load different color schemes based on variant
  return colors
}
```

### Future Theme Variants

The system is designed to support multiple themes:

1. **Stress Theme** (default): Blue/Sky color scheme
2. **Sleep Theme**: Purple/Indigo color scheme  
3. **Custom Themes**: User-defined color schemes

**Example Future Implementation**:
```typescript
export function getThemeColors(variant: ThemeVariant = 'default') {
  switch (variant) {
    case 'sleep':
      return {
        primary: {
          500: '#8b5cf6', // purple-500
          600: '#7c3aed', // purple-600
          // ... other shades
        },
        // ... other theme colors
      }
    case 'stress':
    default:
      return colors // Default stress theme
  }
}
```

---

## Integration with TailwindCSS 4

### Using Design Tokens with Tailwind

The design tokens are fully compatible with TailwindCSS 4:

**In Tailwind Classes**:
```tsx
<div className="p-6 rounded-xl shadow-lg">
  {/* Uses Tailwind's built-in tokens */}
</div>
```

**In Inline Styles with Tokens**:
```tsx
<div 
  className="flex items-center"
  style={{ 
    padding: spacing.lg,
    borderRadius: radii.xl,
    boxShadow: shadows.lg
  }}
>
  {/* Combines Tailwind classes with design tokens */}
</div>
```

### When to Use Each

**Use Tailwind Classes When**:
- Standard utility classes meet your needs
- Rapid prototyping
- Static values

**Use Design Tokens When**:
- Need programmatic access to values
- Dynamic theming
- Calculations based on token values
- Consistency with other token-based components
- Component libraries

---

## Usage Patterns

### Pattern 1: Pure Token Usage

```tsx
import { spacing, typography, colors, radii, shadows } from '@/lib/design-tokens'

export function MyCard({ children }) {
  return (
    <div style={{
      padding: spacing.lg,
      borderRadius: radii.lg,
      boxShadow: shadows.md,
      backgroundColor: colors.background.light,
    }}>
      <h3 style={{
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.semibold,
        marginBottom: spacing.md,
        color: colors.neutral[900],
      }}>
        Title
      </h3>
      {children}
    </div>
  )
}
```

### Pattern 2: Component Token Usage

```tsx
import { componentTokens } from '@/lib/design-tokens'

export function QuestionCard({ question, children }) {
  const tokens = componentTokens.mobileQuestionCard
  
  return (
    <div style={{
      borderRadius: tokens.borderRadius,
      padding: tokens.padding,
      boxShadow: tokens.shadow,
    }}>
      <div style={{
        paddingLeft: tokens.headerPaddingX,
        paddingRight: tokens.headerPaddingX,
        paddingTop: tokens.headerPaddingY,
        paddingBottom: tokens.headerPaddingY,
      }}>
        {question}
      </div>
      <div style={{
        paddingLeft: tokens.contentPaddingX,
        paddingRight: tokens.contentPaddingX,
        paddingTop: tokens.contentPaddingY,
        paddingBottom: tokens.contentPaddingY,
      }}>
        {children}
      </div>
    </div>
  )
}
```

### Pattern 3: Mixed Tailwind + Tokens

```tsx
import { spacing, colors } from '@/lib/design-tokens'

export function Alert({ type, message }) {
  const bgColor = type === 'error' 
    ? colors.semantic.error 
    : colors.semantic.info
    
  return (
    <div 
      className="flex items-center rounded-lg"
      style={{
        padding: spacing.md,
        backgroundColor: bgColor,
      }}
    >
      {message}
    </div>
  )
}
```

### Pattern 4: CSS Custom Properties

```tsx
export function MyComponent() {
  return (
    <div className="custom-card">
      Content
    </div>
  )
}

// In CSS file
.custom-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  background-color: var(--color-neutral-50);
}
```

---

## Best Practices

### DO ✅

1. **Use tokens consistently**
   ```tsx
   // Good
   <div style={{ padding: spacing.lg }}>
   
   // Bad
   <div style={{ padding: '24px' }}>
   ```

2. **Import only what you need**
   ```tsx
   // Good
   import { spacing, colors } from '@/lib/design-tokens'
   
   // Avoid
   import designTokens from '@/lib/design-tokens'
   ```

3. **Use component tokens for common patterns**
   ```tsx
   // Good
   const tokens = componentTokens.navigationButton
   <button style={{ padding: `${tokens.paddingY} ${tokens.paddingX}` }}>
   
   // Less ideal
   <button style={{ padding: `${spacing.md} ${spacing.lg}` }}>
   ```

4. **Use semantic color names**
   ```tsx
   // Good
   <Alert color={colors.semantic.error}>
   
   // Bad
   <Alert color="#ef4444">
   ```

5. **Combine tokens logically**
   ```tsx
   // Good
   <div style={{
     padding: spacing.lg,
     borderRadius: radii.lg,
     fontSize: typography.fontSize.base
   }}>
   ```

### DON'T ❌

1. **Don't hardcode values when tokens exist**
   ```tsx
   // Bad
   <div style={{ padding: '16px', borderRadius: '8px' }}>
   
   // Good
   <div style={{ padding: spacing.md, borderRadius: radii.md }}>
   ```

2. **Don't create custom spacing without good reason**
   ```tsx
   // Bad
   <div style={{ padding: '18px' }}>
   
   // Good - use closest token
   <div style={{ padding: spacing.lg }}>
   ```

3. **Don't mix different naming conventions**
   ```tsx
   // Bad
   <div style={{ 
     padding: spacing.lg,  // token
     margin: '24px'        // hardcoded
   }}>
   
   // Good
   <div style={{ 
     padding: spacing.lg,
     margin: spacing.lg
   }}>
   ```

4. **Don't override token values inline without documentation**
   ```tsx
   // Bad
   const customSpacing = { ...spacing, lg: '28px' }
   
   // Good - if needed, document why
   // Special case: Marketing page needs larger spacing
   const marketingSpacing = { ...spacing, lg: '28px' }
   ```

---

## Migration Guide

### From v0.3 to v0.4

The v0.4 token system is an evolution of v0.3, with the following changes:

#### What Changed

1. **File Location**: Still in `/lib/design-tokens.ts` (no change)
2. **CSS Variables**: Enhanced in `/app/globals.css` with more comprehensive tokens
3. **Component Tokens**: New pre-configured combinations added
4. **Theme Support**: Infrastructure added for future theme variants
5. **Documentation**: Consolidated into this comprehensive guide

#### Migration Steps

**Step 1: Update Import Statements** (if needed)
```tsx
// v0.3 (still works in v0.4)
import { spacing } from '@/lib/design-tokens'

// v0.4 (enhanced)
import { spacing, componentTokens } from '@/lib/design-tokens'
```

**Step 2: Replace Magic Numbers**
```tsx
// Before
<div className="px-4 py-3 rounded-xl">
  
// After
<div style={{ 
  paddingLeft: spacing.md,
  paddingRight: spacing.md,
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  borderRadius: radii.xl
}}>
```

**Step 3: Use Component Tokens**
```tsx
// Before
<button style={{
  padding: '1rem 1.5rem',
  borderRadius: '1rem',
  minHeight: '56px'
}}>

// After
import { componentTokens } from '@/lib/design-tokens'
const tokens = componentTokens.navigationButton

<button style={{
  padding: `${tokens.paddingY} ${tokens.paddingX}`,
  borderRadius: tokens.borderRadius,
  minHeight: tokens.minHeight
}}>
```

### From Hardcoded Values

**Before**: Inline hardcoded styles
```tsx
<div style={{
  padding: '24px',
  borderRadius: '12px',
  fontSize: '16px',
  color: '#334155',
  backgroundColor: '#f8fafc',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease'
}}>
  Content
</div>
```

**After**: Using design tokens
```tsx
import { spacing, radii, typography, colors, shadows, motion } from '@/lib/design-tokens'

<div style={{
  padding: spacing.lg,
  borderRadius: radii.lg,
  fontSize: typography.fontSize.base,
  color: colors.neutral[700],
  backgroundColor: colors.neutral[50],
  boxShadow: shadows.md,
  transition: `all ${motion.duration.normal} ${motion.easing.smooth}`
}}>
  Content
</div>
```

---

## Developer Guidelines

### For Copilot Agents

When working with this codebase:

1. **Always use design tokens** instead of hardcoded values
2. **Import from `@/lib/design-tokens`** for programmatic access
3. **Use CSS custom properties** (`var(--*)`) for CSS-only contexts
4. **Prefer component tokens** for common patterns
5. **Check existing components** for usage patterns before creating new ones
6. **Update this documentation** if you add new tokens

### For Human Developers

1. **Reference this doc** before creating new components
2. **Use TypeScript autocomplete** - it shows all available tokens
3. **Test responsive behavior** - tokens scale appropriately
4. **Consider accessibility** - tokens are designed with WCAG 2.1 AA in mind
5. **Ask before adding new tokens** - ensure they fit the system

### Adding New Tokens

If you need to add a new token:

1. **Check if an existing token works** - don't add duplicates
2. **Add to `/lib/design-tokens.ts`** with TypeScript type
3. **Add to `/app/globals.css`** as CSS custom property
4. **Document here** with usage examples
5. **Test in multiple contexts** before committing
6. **Update component tokens** if creating new patterns

---

## Testing

### Visual Testing

1. **Component showcase**: `/app/admin/design-system`
2. **Check all variants**: buttons, cards, forms, tables
3. **Test responsive behavior**: mobile, tablet, desktop
4. **Verify accessibility**: keyboard navigation, screen readers

### Token Validation

```bash
# Start dev server
npm run dev

# Navigate to design system showcase
# http://localhost:3000/admin/design-system

# Visual inspection:
# - All colors render correctly
# - Typography scale is consistent
# - Spacing feels balanced
# - Shadows provide proper depth
# - Animations are smooth
```

### Type Safety

```tsx
// TypeScript will catch invalid tokens
import { spacing } from '@/lib/design-tokens'

spacing.lg     // ✓ Valid
spacing.huge   // ✗ TypeScript error: Property 'huge' does not exist
```

---

## Troubleshooting

### Common Issues

**Problem**: Token values not updating in browser

**Solution**: 
- Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Restart dev server

**Problem**: CSS variables not working

**Solution**:
- Ensure CSS is imported in root layout
- Check for typos in variable names
- Verify variables are defined in `:root` selector

**Problem**: TypeScript errors when importing tokens

**Solution**:
- Restart TypeScript server in VS Code
- Check import path is correct: `@/lib/design-tokens`
- Ensure tsconfig.json has path alias configured

**Problem**: Spacing looks wrong on mobile

**Solution**:
- Test on actual device, not just browser resize
- Check if parent container has conflicting styles
- Verify responsive breakpoints are correct

---

## Resources

### Documentation
- **Design System Overview**: `/docs/V0_4_DESIGN_SYSTEM.md`
- **Implementation Summary**: `/docs/V0_4_E1_IMPLEMENTATION_SUMMARY.md`
- **UI Component Guide**: Component JSDoc comments

### Code Files
- **TypeScript Tokens**: `/lib/design-tokens.ts`
- **CSS Variables**: `/app/globals.css`
- **UI Components**: `/lib/ui/`
- **Showcase Page**: `/app/admin/design-system/page.tsx`

### External References
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design - Color System](https://material.io/design/color)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

---

## Changelog

### v0.4.0 (2025-12-11)
- ✅ Created comprehensive design token system
- ✅ Defined color palette (primary, neutral, semantic)
- ✅ Established typography scale (8 sizes)
- ✅ Created spacing scale (7 steps)
- ✅ Defined border radii (6 options + full)
- ✅ Added shadow system (5 depths + inner)
- ✅ Implemented motion tokens (durations + easing)
- ✅ Created component token presets
- ✅ Added theme variant infrastructure
- ✅ Full TypeScript + CSS implementation
- ✅ Comprehensive documentation

### Future Planned
- [ ] Theme variant implementation (sleep, custom)
- [ ] Dynamic theme switching
- [ ] Additional component patterns
- [ ] Dark mode support
- [ ] Theme preview tools

---

## Support

For questions or issues:

1. Check this documentation first
2. Review code examples in `/lib/ui/` components
3. Test in design system showcase (`/admin/design-system`)
4. Consult TypeScript types in `/lib/design-tokens.ts`
5. Open an issue in the project repository

---

**Version**: 0.4.0  
**Status**: Production Ready ✅  
**Last Updated**: 2025-12-11

This document is maintained as part of the v0.4 design system initiative (Epic V0.4-E1).
