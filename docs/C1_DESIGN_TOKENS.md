# C1 — Global Design Tokens Documentation

## Overview

This document describes the global design token system implemented for Rhythmologicum Connect. Design tokens provide a centralized, consistent way to manage design values across the application, making it easier to maintain visual consistency and enable theming support.

## Purpose

The design token system serves several key purposes:

1. **Centralized Design Values**: All spacing, typography, colors, and motion values are defined in one place
2. **Consistency**: Eliminates magic numbers and ensures consistent UI across components
3. **Maintainability**: UI changes can be made by updating token values instead of searching through multiple components
4. **Theme Support**: Provides infrastructure for the `funnels.default_theme` field to enable different visual themes (e.g., stress vs. sleep assessments)
5. **Developer Experience**: Provides autocomplete and type safety for design values

## Architecture

### File Structure

```
lib/
  design-tokens.ts          # Main design token definitions
app/
  globals.css               # CSS custom properties (for CSS access)
  components/
    MobileQuestionCard.tsx  # Uses design tokens
    DesktopQuestionCard.tsx # Uses design tokens
    MobileAnswerButton.tsx  # Uses design tokens
    [other components...]
```

### Design Token Categories

The design token system is organized into the following categories:

#### 1. Spacing (`spacing`)

Consistent spacing scale for margins, padding, and gaps.

```typescript
spacing.xs   // 0.5rem (8px)  - minimal gaps
spacing.sm   // 0.75rem (12px) - compact elements
spacing.md   // 1rem (16px)    - default spacing
spacing.lg   // 1.5rem (24px)  - sections, cards
spacing.xl   // 2rem (32px)    - major sections
spacing.2xl  // 3rem (48px)    - page sections
spacing.3xl  // 4rem (64px)    - hero sections
```

#### 2. Typography (`typography`)

Font sizes, line heights, and font weights.

```typescript
// Font Sizes
typography.fontSize.xs    // 0.75rem (12px)  - small labels
typography.fontSize.sm    // 0.875rem (14px) - secondary text
typography.fontSize.base  // 1rem (16px)     - body text
typography.fontSize.lg    // 1.125rem (18px) - emphasized text
typography.fontSize.xl    // 1.25rem (20px)  - small headings
typography.fontSize['2xl'] // 1.5rem (24px)   - section headings
typography.fontSize['3xl'] // 1.875rem (30px) - page titles
typography.fontSize['4xl'] // 2.25rem (36px)  - hero headings

// Line Heights
typography.lineHeight.tight   // 1.25
typography.lineHeight.normal  // 1.5
typography.lineHeight.relaxed // 1.625
typography.lineHeight.loose   // 2

// Font Weights
typography.fontWeight.normal   // 400
typography.fontWeight.medium   // 500
typography.fontWeight.semibold // 600
typography.fontWeight.bold     // 700
```

#### 3. Border Radius (`radii`)

Rounded corner values for different component types.

```typescript
radii.none  // 0
radii.sm    // 0.375rem (6px)  - subtle rounding
radii.md    // 0.5rem (8px)    - default buttons, inputs
radii.lg    // 0.75rem (12px)  - cards, panels
radii.xl    // 1rem (16px)     - prominent cards
radii['2xl'] // 1.5rem (24px)   - mobile cards, hero elements
radii.full  // 9999px          - pill shape, circles
```

#### 4. Shadows (`shadows`)

Box shadow definitions for depth and elevation.

```typescript
shadows.none  // No shadow
shadows.sm    // Subtle depth
shadows.md    // Standard elevation
shadows.lg    // Prominent cards
shadows.xl    // Floating elements
shadows['2xl'] // Maximum elevation
shadows.inner // Inset shadow
```

#### 5. Motion (`motion`)

Animation durations and easing functions.

```typescript
// Durations
motion.duration.instant  // 0ms
motion.duration.fast     // 150ms - quick interactions
motion.duration.normal   // 200ms - standard transitions
motion.duration.moderate // 300ms - comfortable animations
motion.duration.slow     // 500ms - deliberate animations

// Easing Functions
motion.easing.linear
motion.easing.ease
motion.easing.easeIn
motion.easing.easeOut
motion.easing.easeInOut
motion.easing.smooth  // cubic-bezier(0.4, 0.0, 0.2, 1)
motion.easing.snappy  // cubic-bezier(0.4, 0.0, 0.6, 1)
motion.easing.spring  // cubic-bezier(0.34, 1.56, 0.64, 1)

// Framer Motion Spring Configurations
motion.spring.default // stiffness: 300, damping: 20
motion.spring.gentle  // stiffness: 200, damping: 25
motion.spring.bouncy  // stiffness: 400, damping: 15
```

#### 6. Colors (`colors`)

Theme-aware color system supporting the `funnels.default_theme` field.

```typescript
// Primary Colors (sky/blue - default stress theme)
colors.primary[50]  // Lightest
colors.primary[100]
// ... 
colors.primary[500] // Primary brand color
colors.primary[600] // Primary dark
// ...
colors.primary[900] // Darkest

// Neutral Colors (slate - grays)
colors.neutral[50]  // Lightest gray
// ...
colors.neutral[500] // Mid gray
// ...
colors.neutral[900] // Darkest gray

// Semantic Colors
colors.semantic.success // green-500
colors.semantic.warning // amber-500
colors.semantic.error   // red-500
colors.semantic.info    // blue-500

// Background Colors
colors.background.light
colors.background.lightGradientFrom
colors.background.lightGradientTo
colors.background.dark
colors.background.darkGradientFrom
colors.background.darkGradientTo
```

#### 7. Component Tokens (`componentTokens`)

Pre-configured token combinations for common component patterns.

```typescript
// Mobile Question Card
componentTokens.mobileQuestionCard.borderRadius
componentTokens.mobileQuestionCard.padding
componentTokens.mobileQuestionCard.shadow
componentTokens.mobileQuestionCard.headerPaddingX
componentTokens.mobileQuestionCard.headerPaddingY
componentTokens.mobileQuestionCard.contentPaddingX
componentTokens.mobileQuestionCard.contentPaddingY

// Desktop Question Card
componentTokens.desktopQuestionCard.borderRadius
componentTokens.desktopQuestionCard.padding
componentTokens.desktopQuestionCard.shadow
componentTokens.desktopQuestionCard.headerPaddingX
componentTokens.desktopQuestionCard.headerPaddingY

// Answer Buttons
componentTokens.answerButton.borderRadius
componentTokens.answerButton.paddingX
componentTokens.answerButton.paddingY
componentTokens.answerButton.minHeight
componentTokens.answerButton.minWidth
componentTokens.answerButton.gap
componentTokens.answerButton.fontSize
componentTokens.answerButton.fontWeight
componentTokens.answerButton.transition

// Navigation Buttons
componentTokens.navigationButton.borderRadius
componentTokens.navigationButton.paddingX
componentTokens.navigationButton.paddingY
componentTokens.navigationButton.minHeight
componentTokens.navigationButton.fontSize
componentTokens.navigationButton.fontWeight
componentTokens.navigationButton.shadow
componentTokens.navigationButton.transition

// Progress Bar
componentTokens.progressBar.height
componentTokens.progressBar.borderRadius
componentTokens.progressBar.transition

// Info Box
componentTokens.infoBox.borderRadius
componentTokens.infoBox.padding
componentTokens.infoBox.fontSize
componentTokens.infoBox.lineHeight
```

## Usage Guide

### Basic Usage

Import design tokens in your component:

```typescript
import { spacing, typography, motion } from '@/lib/design-tokens'

// Use in inline styles
<div style={{ 
  padding: spacing.lg,
  fontSize: typography.fontSize.base,
  transition: `all ${motion.duration.normal} ${motion.easing.smooth}`
}}>
  Content
</div>
```

### Using Component Tokens

Component tokens provide pre-configured combinations for common patterns:

```typescript
import { componentTokens } from '@/lib/design-tokens'

const tokens = componentTokens.answerButton

<button style={{
  padding: `${tokens.paddingY} ${tokens.paddingX}`,
  borderRadius: tokens.borderRadius,
  minHeight: tokens.minHeight,
  transition: tokens.transition,
}}>
  Click me
</button>
```

### Using with Framer Motion

```typescript
import { motion as motionTokens } from '@/lib/design-tokens'

<motion.div
  animate={{ scale: 1.05 }}
  transition={motionTokens.spring.default}
>
  Animated content
</motion.div>
```

### CSS Custom Properties

Design tokens are also available as CSS custom properties in `app/globals.css`:

```css
.my-component {
  padding: var(--spacing-lg);
  font-size: var(--font-size-base);
  border-radius: var(--radius-xl);
  transition: all var(--duration-normal) var(--easing-smooth);
}
```

## Theme Support

### Current Implementation

The design token system is built with theming in mind, supporting the `funnels.default_theme` field in the database.

```typescript
export type ThemeVariant = 'default' | 'stress' | 'sleep' | 'custom'

// Get theme-specific colors
const themeColors = getThemeColors(funnel.default_theme)
```

### Future Enhancements

The system is designed to support multiple theme variants:

1. **Stress Theme** (default): Blue/Sky color scheme
2. **Sleep Theme**: Purple/Indigo color scheme
3. **Custom Themes**: User-defined color schemes

To implement theme variants:

```typescript
// Example future implementation
export function getThemeColors(variant: ThemeVariant = 'default') {
  switch (variant) {
    case 'sleep':
      return {
        primary: { /* purple/indigo colors */ },
        // ... other sleep theme colors
      }
    case 'stress':
    default:
      return colors // Default stress theme (sky/blue)
  }
}
```

## Migration from Magic Numbers

### Before (Magic Numbers)

```typescript
<div className="px-4 py-3 rounded-xl">
  <h2 className="text-xl font-semibold">Title</h2>
  <button className="px-6 py-4" style={{ minHeight: '56px' }}>
    Button
  </button>
</div>
```

### After (Design Tokens)

```typescript
import { componentTokens, typography } from '@/lib/design-tokens'

const tokens = componentTokens.mobileQuestionCard
const navTokens = componentTokens.navigationButton

<div style={{ 
  padding: `${tokens.headerPaddingY} ${tokens.headerPaddingX}`,
  borderRadius: tokens.borderRadius,
}}>
  <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold }}>
    Title
  </h2>
  <button style={{
    padding: `${navTokens.paddingY} ${navTokens.paddingX}`,
    minHeight: navTokens.minHeight,
  }}>
    Button
  </button>
</div>
```

## Benefits

### 1. Centralized Management

All design values are in one place (`lib/design-tokens.ts`), making it easy to:
- Update spacing across the entire app
- Adjust typography scales
- Modify animation timing
- Change color schemes

### 2. Type Safety

TypeScript provides autocomplete and type checking for all tokens:

```typescript
spacing.lg     // ✓ Valid
spacing.huge   // ✗ TypeScript error
```

### 3. Consistency

Eliminates variations like:
- `px-4` vs `px-3` vs `px-5` (random spacing)
- `rounded-xl` vs `rounded-lg` vs `rounded-2xl` (inconsistent radii)
- `duration-300` vs `duration-200` (varying animation speeds)

### 4. Easier Refactoring

To change all mobile question card padding:
- **Before**: Search and replace across multiple files
- **After**: Change one value in `componentTokens.mobileQuestionCard.padding`

### 5. Theme Readiness

The infrastructure is in place to easily add theme variants based on `funnel.default_theme`.

## Best Practices

### DO:

✅ Use design tokens for all spacing, typography, colors, and motion values  
✅ Use component tokens for common patterns  
✅ Import only the tokens you need to keep bundles small  
✅ Document any custom token combinations  
✅ Update tokens file when adding new design patterns

### DON'T:

❌ Mix magic numbers with design tokens  
❌ Create component-specific tokens in component files  
❌ Override token values inline without good reason  
❌ Add tokens that are only used once (use regular values)  
❌ Forget to update documentation when adding new tokens

## Examples

### Example 1: Creating a New Card Component

```typescript
import { componentTokens, typography, motion } from '@/lib/design-tokens'

const cardTokens = componentTokens.mobileQuestionCard

export function MyCard({ title, children }) {
  return (
    <div 
      className="bg-white border-2 border-slate-200"
      style={{
        padding: cardTokens.padding,
        borderRadius: cardTokens.borderRadius,
        boxShadow: cardTokens.shadow,
        transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
      }}
    >
      <h3 style={{ 
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
```

### Example 2: Animated Button

```typescript
import { motion } from 'framer-motion'
import { componentTokens, motion as motionTokens } from '@/lib/design-tokens'

const tokens = componentTokens.navigationButton

export function AnimatedButton({ children, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="bg-sky-600 text-white font-semibold"
      style={{
        padding: `${tokens.paddingY} ${tokens.paddingX}`,
        borderRadius: tokens.borderRadius,
        minHeight: tokens.minHeight,
        boxShadow: tokens.shadow,
      }}
      whileTap={{ scale: 0.95 }}
      transition={motionTokens.spring.default}
    >
      {children}
    </motion.button>
  )
}
```

### Example 3: Responsive Spacing

```typescript
import { spacing, typography } from '@/lib/design-tokens'

export function ResponsiveSection({ title, content }) {
  return (
    <section style={{
      padding: spacing.lg, // Mobile
      '@media (min-width: 768px)': {
        padding: spacing.xl, // Desktop
      }
    }}>
      <h2 style={{ 
        fontSize: typography.fontSize['2xl'],
        marginBottom: spacing.md,
      }}>
        {title}
      </h2>
      <p style={{ fontSize: typography.fontSize.base }}>
        {content}
      </p>
    </section>
  )
}
```

## Maintenance

### Adding New Tokens

1. Add the token to `lib/design-tokens.ts`
2. Update this documentation with the new token
3. Add CSS custom property to `app/globals.css` if needed
4. Use the token in components
5. Test across different components and themes

### Updating Token Values

1. Update the value in `lib/design-tokens.ts`
2. Test all components that use the token
3. Verify no visual regressions
4. Update documentation if the change is significant

## Related Files

- `lib/design-tokens.ts` - Main token definitions
- `app/globals.css` - CSS custom properties
- `app/components/MobileQuestionCard.tsx` - Example usage (mobile)
- `app/components/DesktopQuestionCard.tsx` - Example usage (desktop)
- `app/components/MobileAnswerButton.tsx` - Example usage (buttons)

## Testing

To test the design token system:

1. **Visual Inspection**: Start dev server and check that UI looks correct
2. **Token Changes**: Modify a token value and verify changes appear globally
3. **Type Safety**: Try using an invalid token and verify TypeScript error
4. **Theme Support**: Test with different `funnel.default_theme` values (when implemented)

```bash
npm run dev
# Navigate to funnel pages and verify UI
```

## Future Roadmap

### Phase 1 (Current) ✅
- Basic design token system
- Component token presets
- Migration of key funnel components
- Documentation

### Phase 2 (Planned)
- Theme variant implementation (stress vs. sleep themes)
- Dynamic theme loading based on `funnel.default_theme`
- Theme preview in clinician dashboard
- Additional component patterns

### Phase 3 (Future)
- Custom theme builder UI
- Export/import theme configurations
- A11y-focused theme variants (high contrast, large text)
- Dark mode theme support

## Support

For questions or issues with the design token system:

1. Check this documentation
2. Review examples in existing components
3. Check the TypeScript definitions in `lib/design-tokens.ts`
4. Consult the team lead or open an issue

## Changelog

### v0.3 - Initial Implementation (2024-12)
- Created design token system
- Defined spacing, typography, radii, shadows, motion, and color tokens
- Created component token presets
- Migrated MobileQuestionCard, DesktopQuestionCard, and MobileAnswerButton
- Added CSS custom properties
- Created comprehensive documentation
