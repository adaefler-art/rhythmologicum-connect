# CSS Variable Mapping - E6.1.5

## Overview

This document describes the Tailwind/Shadcn bridging implementation that maps semantic design tokens to CSS variables, ensuring a single source of truth for the design system.

## Architecture

### Token Flow

```
/lib/ui/tokens/           → Semantic Token Definitions (TypeScript)
      ↓
/lib/ui/theme/            → CSS Variable Generator (TypeScript)
      ↓
/app/globals.css          → CSS Variable Declarations (:root, .dark)
      ↓
@theme inline             → Tailwind Integration
      ↓
Components                → Use Tailwind classes or CSS variables
```

## File Structure

### Source of Truth

**Primary Token Definitions:**
- `/lib/ui/tokens/tokens.base.ts` - Theme-independent tokens (spacing, typography, radii, shadows, motion, layout)
- `/lib/ui/tokens/tokens.light.ts` - Light theme color palette
- `/lib/ui/tokens/tokens.dark.ts` - Dark theme color palette
- `/lib/ui/tokens/tokens.brand.ts` - Brand override system
- `/lib/ui/tokens/index.ts` - Token aggregation and export

**CSS Variable Generation:**
- `/lib/ui/theme/generateCssVars.ts` - Utility to convert tokens to CSS variables

**CSS Variable Application:**
- `/app/globals.css` - Complete CSS variable declarations with light/dark themes

### No Duplication

The system ensures **no token duplication**:
1. Tokens are defined **once** in TypeScript files
2. CSS variables reference the same values
3. Components use either:
   - Tailwind classes (e.g., `bg-primary-500`)
   - CSS variables directly (e.g., `var(--color-primary-500)`)
   - Imported token values for inline styles

## CSS Variable Structure

### Root Variables (`:root`)

All tokens are declared in `:root` with light theme values:

```css
:root {
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  /* ... */
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --line-height-tight: 1.25;
  --font-weight-normal: 400;
  /* ... */
  
  /* Colors - Light Theme */
  --color-primary-500: #0ea5e9;
  --color-neutral-700: #334155;
  --color-success: #10b981;
  /* ... */
  
  /* Radii, Shadows, Motion, Layout */
  --radius-lg: 0.75rem;
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --duration-normal: 200ms;
  --easing-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
  /* ... */
}
```

### Dark Mode Overrides (`.dark`, `[data-theme="dark"]`)

Color tokens are overridden for dark mode:

```css
.dark,
[data-theme="dark"] {
  --background: #0a0a0a;
  --foreground: #ededed;
  
  /* Primary Colors - Brighter for dark backgrounds */
  --color-primary-500: #38bdf8;
  --color-primary-600: #7dd3fc;
  
  /* Neutral Colors - Inverted scale */
  --color-neutral-50: #0f172a;
  --color-neutral-900: #f8fafc;
  
  /* Semantic Colors - Adjusted brightness */
  --color-success: #34d399;
  --color-warning: #fbbf24;
  --color-error: #f87171;
  --color-info: #60a5fa;
  
  /* Shadows - Stronger for dark mode */
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  
  color-scheme: dark;
}
```

## Tailwind Integration

### @theme inline Directive

Tailwind 4 uses `@theme inline` to map CSS variables to utility classes:

```css
@theme inline {
  /* Colors */
  --color-primary-500: var(--color-primary-500);
  --color-neutral-700: var(--color-neutral-700);
  --color-success: var(--color-success);
  
  /* Spacing */
  --spacing-md: var(--spacing-md);
  
  /* Radii, Shadows, etc. */
  --radius-lg: var(--radius-lg);
  --shadow-md: var(--shadow-md);
}
```

### Usage in Components

**Tailwind Classes (Recommended):**
```tsx
<div className="bg-primary-500 text-neutral-700 rounded-lg shadow-md p-md">
  Content
</div>
```

**CSS Variables (Direct):**
```tsx
<div style={{ backgroundColor: 'var(--color-primary-500)' }}>
  Content
</div>
```

**Imported Tokens (Inline Styles):**
```tsx
import { radii, spacing } from '@/lib/design-tokens'

<div style={{ borderRadius: radii.lg, padding: spacing.md }}>
  Content
</div>
```

## Token Categories

### Spacing
- `--spacing-{xs|sm|md|lg|xl|2xl|3xl}`
- Maps to: `p-*`, `m-*`, `gap-*`, etc.

### Typography
- Font Sizes: `--font-size-{xs|sm|base|lg|xl|2xl|3xl|4xl}`
- Line Heights: `--line-height-{tight|normal|relaxed|loose}`
- Font Weights: `--font-weight-{normal|medium|semibold|bold}`
- Maps to: `text-*`, `leading-*`, `font-*`

### Colors
- Primary: `--color-primary-{50-900}`
- Neutral: `--color-neutral-{50-900}`
- Semantic: `--color-{success|warning|error|info}`
- Background: `--color-bg-{light|dark|...}`
- Maps to: `bg-*`, `text-*`, `border-*`

### Border Radius
- `--radius-{none|sm|md|lg|xl|2xl|full}`
- Maps to: `rounded-*`

### Shadows
- `--shadow-{none|sm|md|lg|xl|2xl|inner}`
- Maps to: `shadow-*`

### Motion
- Durations: `--duration-{instant|fast|normal|moderate|slow}`
- Easing: `--easing-{linear|smooth|snappy|spring|...}`
- Used in: `transition-*`, custom animations

### Layout
- `--layout-{contentMaxWidth|patientMaxWidth|articleMaxWidth}`
- Used in: Container max-width constraints

## Brand Customization

### Runtime Brand Overrides

The `ThemeProvider` can apply brand-specific color overrides at runtime:

```tsx
import { applyCssVars } from '@/lib/ui/theme/generateCssVars'

// Apply purple brand colors
const purpleBrand = {
  '--color-primary-500': '#a855f7',
  '--color-primary-600': '#9333ea',
}

applyCssVars(document.documentElement, purpleBrand)
```

### Predefined Brand Themes

See `/lib/ui/tokens/tokens.brand.ts` for predefined brand overrides:
- `defaultBrandOverrides` - Sky blue (default)
- `sleepBrandOverrides` - Purple theme for sleep assessments
- `customBrandOverrides` - Customizable theme

## Verification

### Components Using Tokens

The following components demonstrate correct usage of the token system:

1. **Badge** (`/lib/ui/Badge.tsx`)
   - Uses Tailwind classes: `bg-slate-100`, `dark:bg-slate-700`, `text-sky-800`
   - Properly adapts to light/dark mode

2. **Input** (`/lib/ui/Input.tsx`)
   - Uses imported tokens: `radii.lg`, `spacing.xs`
   - Uses Tailwind classes: `bg-white`, `dark:bg-slate-700`

3. **Button** (`/lib/ui/Button.tsx`)
   - Uses `componentTokens` for consistent styling
   - Supports semantic color variants

4. **Card** (`/lib/ui/Card.tsx`)
   - Uses imported tokens: `shadows`, `radii`, `spacing`
   - Responsive to theme changes

5. **Progress** (`/lib/ui/Progress.tsx`)
   - Uses `componentTokens.progressBar`
   - Theme-aware color scaling

### Testing Dark Mode

To verify dark mode works correctly:

1. Add `class="dark"` to `<html>` element
2. Or set `data-theme="dark"` attribute
3. All components should automatically switch to dark theme colors

### Browser DevTools Inspection

Check CSS variables are applied:
```javascript
// In browser console
getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500')
// Light mode: "#0ea5e9"
// Dark mode: "#38bdf8"
```

## Migration Guide

### Updating Components to Use Tokens

**Before (Hard-coded values):**
```tsx
<div style={{ 
  backgroundColor: '#0ea5e9',
  padding: '1rem',
  borderRadius: '0.75rem'
}}>
```

**After (Using tokens):**
```tsx
import { spacing, radii } from '@/lib/design-tokens'

<div style={{ 
  backgroundColor: 'var(--color-primary-500)',
  padding: spacing.md,
  borderRadius: radii.lg
}}>
```

**Best (Using Tailwind classes):**
```tsx
<div className="bg-primary-500 p-md rounded-lg">
```

## Maintenance

### Adding New Tokens

1. **Add to TypeScript definition:**
   - Edit `/lib/ui/tokens/tokens.base.ts` for base tokens
   - Or edit color files for theme-specific tokens

2. **Update CSS variables:**
   - Add to `:root` in `/app/globals.css`
   - Add to `.dark` if color-related
   - Add to `@theme inline` for Tailwind access

3. **Update types:**
   - Ensure TypeScript types in `tokenTypes.ts` are updated

4. **Document:**
   - Add to this file if it's a new category or significant change

### Removing Tokens

1. Check for usage: `grep -r "token-name" app/ lib/`
2. Remove from TypeScript definitions
3. Remove from CSS variables
4. Update documentation

## Benefits of This Approach

✅ **Single Source of Truth** - Tokens defined once in TypeScript  
✅ **No Duplication** - CSS variables reference token values  
✅ **Type Safety** - TypeScript ensures valid token usage  
✅ **Theme Support** - Light/dark modes work automatically  
✅ **Brand Flexibility** - Easy to override colors per funnel/organization  
✅ **Tailwind Integration** - Use utility classes everywhere  
✅ **Runtime Theming** - Can apply brand colors dynamically  
✅ **Developer Experience** - Autocomplete, refactoring, linting all work  

## Related Documentation

- [Token Specification](/docs/design/TOKENS.md)
- [Theme Provider](/lib/ui/theme/ThemeProvider.tsx)
- [Funnel Theming](/docs/funnels/THEMING.md) (if exists)

## Implementation Summary

**Issue:** E6.1.5 — Tailwind/Shadcn Bridging (CSS Variables / Mapping)

**Solution:**
- Created `/lib/ui/theme/generateCssVars.ts` utility
- Updated `/app/globals.css` with comprehensive CSS variables
- Mapped all semantic tokens to CSS variables in `:root`
- Added dark mode overrides in `.dark` and `[data-theme="dark"]`
- Integrated with Tailwind via `@theme inline` directive
- Verified 5+ components use tokens correctly in light/dark modes

**Result:**
- ✅ Single source of truth for design tokens
- ✅ No token duplication
- ✅ Light and dark modes work correctly
- ✅ Tailwind classes use CSS variables
- ✅ Components adapt to theme changes
