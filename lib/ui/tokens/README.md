# Semantic Token System

> **Version**: 1.0.0  
> **Status**: Production Ready  
> **Location**: `/lib/ui/tokens/`

## Overview

This directory contains the semantic token system for Rhythmologicum Connect - a centralized, type-safe design token implementation that supports theming and brand customization.

## Key Features

- ✅ **Deterministic**: Same config always returns same tokens
- ✅ **Type-safe**: Full TypeScript types with Zod validation
- ✅ **Theme-aware**: Light/dark mode support
- ✅ **Brand customization**: Partial override system
- ✅ **Framework-agnostic**: Not tied to Tailwind (but can be consumed by it)
- ✅ **No raw values**: Only semantic tokens in code

## File Structure

```
lib/ui/tokens/
├── tokenTypes.ts      # TypeScript types & Zod schemas
├── tokens.base.ts     # Base tokens (spacing, typography, etc.)
├── tokens.light.ts    # Light theme colors
├── tokens.dark.ts     # Dark theme colors
├── tokens.brand.ts    # Brand override system
├── index.ts           # Main export with getTokens()
└── __tests__/
    └── tokens.test.ts # Comprehensive test suite
```

## Quick Start

### Basic Usage

```typescript
import { defaultTokens } from '@/lib/ui/tokens'

const buttonStyle = {
  backgroundColor: defaultTokens.colors.primary[500],
  padding: defaultTokens.spacing.md,
  borderRadius: defaultTokens.radii.md,
}
```

### Theme-Aware Usage

```typescript
import { getTokens } from '@/lib/ui/tokens'

// Get tokens for a specific theme
const tokens = getTokens({ mode: 'dark' })

console.log(tokens.colors.primary[500]) // '#38bdf8' (lighter for dark mode)
```

### Brand Customization

```typescript
import { getTokens, sleepBrandOverrides } from '@/lib/ui/tokens'

// Use predefined brand (purple tones for sleep assessments)
const sleepTokens = getTokens({
  mode: 'light',
  brandOverrides: sleepBrandOverrides,
})

// Custom brand
const customTokens = getTokens({
  mode: 'light',
  brandOverrides: {
    primary: { 500: '#ff6b6b', 600: '#ee5a5a' },
  },
})
```

## Available Tokens

### Base Tokens (Theme-Independent)

#### Spacing
```typescript
spacing.xs   // 0.5rem (8px)
spacing.sm   // 0.75rem (12px)
spacing.md   // 1rem (16px)
spacing.lg   // 1.5rem (24px)
spacing.xl   // 2rem (32px)
spacing['2xl'] // 3rem (48px)
spacing['3xl'] // 4rem (64px)
```

#### Typography
```typescript
typography.fontSize.xs     // 0.75rem (12px)
typography.fontSize.base   // 1rem (16px)
typography.fontSize['2xl'] // 1.5rem (24px)

typography.lineHeight.normal // 1.5
typography.fontWeight.bold   // 700
```

#### Radii
```typescript
radii.sm   // 0.375rem (6px)
radii.md   // 0.5rem (8px)
radii.lg   // 0.75rem (12px)
radii.full // 9999px (pill shape)
```

#### Shadows
```typescript
shadows.sm  // Subtle depth
shadows.md  // Standard elevation
shadows.lg  // Prominent cards
```

#### Motion
```typescript
motion.duration.fast    // 150ms
motion.duration.normal  // 200ms
motion.easing.smooth    // cubic-bezier(0.4, 0.0, 0.2, 1)
```

### Color Tokens (Theme-Specific)

#### Primary Colors
```typescript
colors.primary[50]   // Lightest
colors.primary[500]  // Brand color
colors.primary[900]  // Darkest
```

#### Semantic Colors
```typescript
colors.semantic.success  // Success states
colors.semantic.warning  // Warning states
colors.semantic.error    // Error states
colors.semantic.info     // Info states
```

## API Reference

### `getTokens(config?: ThemeConfig): DesignTokens`

Main function to retrieve design tokens.

**Parameters:**
- `config.mode`: `'light' | 'dark'` (default: `'light'`)
- `config.brandOverrides`: Partial color overrides

**Returns:** Complete design token object

**Example:**
```typescript
const tokens = getTokens({
  mode: 'dark',
  brandOverrides: { primary: { 500: '#8b5cf6' } }
})
```

### `defaultTokens: DesignTokens`

Pre-computed tokens for light theme with no overrides.

### Selective Imports

```typescript
import { spacing, colors, typography, radii, shadows, motion } from '@/lib/ui/tokens'
```

## Validation

All tokens include Zod schemas for runtime validation:

```typescript
import { DesignTokensSchema } from '@/lib/ui/tokens'

const result = DesignTokensSchema.safeParse(tokens)
if (result.success) {
  // Tokens are valid
}
```

## Best Practices

### ✅ DO

- Use semantic token names (e.g., `colors.primary[500]`)
- Import from `@/lib/ui/tokens`
- Use `getTokens()` for theme-aware components
- Apply brand overrides at the theme level

### ❌ DON'T

- Don't use raw color values in components (e.g., `#0ea5e9`)
- Don't hardcode spacing values (e.g., `16px`)
- Don't bypass the token system

## Testing

Run token tests:
```bash
npm test -- lib/ui/tokens/__tests__/tokens.test.ts
```

Test coverage includes:
- Deterministic behavior
- Theme switching
- Brand overrides
- Schema validation
- Type safety

## Migration Guide

### From Old Token System

The project has two token systems:
- **Old**: `/lib/design/tokens.ts` (still works, backward compatible)
- **New**: `/lib/ui/tokens/` (recommended for new code)

**Migrating:**
```typescript
// Before
import { spacing, colors } from '@/lib/design/tokens'

// After
import { spacing, colors } from '@/lib/ui/tokens'
```

The new system adds:
- Theme configuration support
- Brand override system
- Zod validation
- Better TypeScript types

## Related Documentation

- Token specification: `/docs/design/TOKENS.md`
- Design system: `/docs/V0_4_DESIGN_SYSTEM.md`
- Tailwind integration: `/app/globals.css`

## Maintainers

Design System Team

**Questions?** See `/docs/design/TOKENS.md` for detailed specification.
