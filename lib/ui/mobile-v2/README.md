# Mobile UI v2 Design System

## Overview

The Mobile UI v2 design system provides a stable, token-based foundation for building mobile-optimized patient interfaces. This system is extracted from the design package in `docs/rhythm_mobile_v2` and normalized to avoid interference with the Studio UI.

## Directory Structure

```
lib/ui/mobile-v2/
├── tokens/           # Design tokens (single source of truth)
│   ├── colors.ts     # Color palette
│   ├── gradients.ts  # Gradient definitions
│   ├── spacing.ts    # Spacing scale
│   ├── radius.ts     # Border radius values
│   ├── shadows.ts    # Shadow definitions
│   ├── typography.ts # Font sizes, weights, line heights
│   └── index.ts      # Token exports
├── components/       # Primitive components
│   ├── Button.tsx    # Button with variants
│   ├── Card.tsx      # Card container
│   ├── Chip.tsx      # Tag/Pill/Chip component
│   ├── ListRow.tsx   # List item component
│   ├── ProgressBar.tsx # Progress indicator
│   ├── Icon.tsx      # Icon wrapper
│   └── index.ts      # Component exports
└── index.ts          # Main entry point

public/mobile-v2/
├── icons/            # Icon assets
└── illustrations/    # Illustration assets
```

## Design Tokens

### Colors

Mobile UI v2 uses a carefully crafted color palette:

- **Primary**: Blue gradient (#4a90e2 → #6c63ff)
- **Neutral**: Grays for text and backgrounds (50-900)
- **Success**: Green (#5cb85c)
- **Warning**: Orange (#f0ad4e)
- **Danger**: Red (#d9534f)

```typescript
import { mobileColors } from '@/lib/ui/mobile-v2'

// Access color tokens
const primaryBlue = mobileColors.primary[500] // #4a90e2
const neutralGray = mobileColors.neutral[100] // #f3f4f6
```

### Spacing

Consistent spacing scale from 4px (xs) to 48px (3xl):

```typescript
import { mobileSpacing } from '@/lib/ui/mobile-v2'

const smallGap = mobileSpacing.sm // 0.5rem (8px)
const largeGap = mobileSpacing.xl // 1.5rem (24px)
```

### Border Radius

- **sm**: 8px - Small elements
- **md**: 12px - Medium elements
- **lg**: 16px - Cards
- **full**: 9999px - Pills and chips

### Shadows

Three shadow levels for elevation:
- **sm**: Subtle elevation
- **md**: Medium elevation
- **lg**: Prominent elevation

## Primitive Components

### Button

Primary action component with three variants:

```tsx
import { Button } from '@/lib/ui/mobile-v2'

<Button variant="primary" size="md" onClick={handleClick}>
  Save Changes
</Button>

<Button variant="secondary" icon={<Icon>...</Icon>}>
  Cancel
</Button>

<Button variant="ghost" fullWidth>
  Skip
</Button>
```

**Variants**: `primary`, `secondary`, `ghost`  
**Sizes**: `sm`, `md`, `lg`

### Card

Container component with configurable padding and shadows:

```tsx
import { Card } from '@/lib/ui/mobile-v2'

<Card padding="md" shadow="sm">
  <h2>Card Content</h2>
  <p>Lorem ipsum...</p>
</Card>

<Card hover onClick={handleClick}>
  Clickable card
</Card>
```

**Padding**: `none`, `sm`, `md`, `lg`  
**Shadow**: `none`, `sm`, `md`, `lg`

### Chip / Tag / Pill

Tag component for status indicators and filters:

```tsx
import { Chip, Tag, Pill } from '@/lib/ui/mobile-v2'

<Chip variant="success" size="md">Active</Chip>
<Tag variant="warning">Pending</Tag>
<Pill variant="neutral" removable onRemove={handleRemove}>
  Filter
</Pill>
```

**Variants**: `primary`, `success`, `warning`, `danger`, `neutral`  
**Sizes**: `sm`, `md`

### ListRow

List item component for menus and selections:

```tsx
import { ListRow } from '@/lib/ui/mobile-v2'

<ListRow
  icon={<Icon>...</Icon>}
  subtitle="Additional info"
  trailing={<ChevronRight />}
  onClick={handleClick}
>
  List Item Title
</ListRow>
```

### ProgressBar

Linear progress indicator:

```tsx
import { ProgressBar } from '@/lib/ui/mobile-v2'

<ProgressBar value={75} max={100} color="primary" showLabel />
<ProgressBar value={30} color="success" size="lg" label="Completion" />
```

**Colors**: `primary`, `success`, `warning`, `danger`  
**Sizes**: `sm`, `md`, `lg`

### Icon

Icon wrapper for consistent sizing:

```tsx
import { Icon } from '@/lib/ui/mobile-v2'
import { Heart } from 'lucide-react'

<Icon size="md" color="#4a90e2">
  <Heart />
</Icon>
```

**Sizes**: `xs`, `sm`, `md`, `lg`, `xl`

## Usage Guidelines

### Layout and Max-Width

**CRITICAL: Always use `max-w-7xl` for page containers to ensure proper width utilization.**

Mobile-v2 pages should utilize the full viewport width appropriately. Do NOT use narrow constraints like `max-w-2xl`, `max-w-xl`, or `max-w-lg` for main page containers as this creates an undesirable narrow column appearance.

❌ **Bad** (causes narrow column issue):
```tsx
<div className="min-h-screen p-6">
  <div className="max-w-2xl mx-auto">  {/* Too narrow! */}
    <Card>Content</Card>
  </div>
</div>
```

✅ **Good** (proper width utilization):
```tsx
<div className="min-h-screen p-6">
  <div className="max-w-7xl mx-auto">  {/* Correct width */}
    <Card>Content</Card>
  </div>
</div>
```

**Standard Container Classes:**
- **Page container**: `max-w-7xl mx-auto` - For main page layout
- **Content sections**: Use Grid/Flex for responsive layouts within the page
- **Individual cards**: Let them flow naturally within the grid

### Single Source of Truth

All styling should reference tokens, not hardcoded values:

❌ **Bad**:
```tsx
<div style={{ padding: '12px', borderRadius: '16px' }}>
```

✅ **Good**:
```tsx
<Card padding="md">
```

### Component Reuse

Always use primitive components instead of recreating styles:

❌ **Bad**:
```tsx
<div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl">
  Button
</div>
```

✅ **Good**:
```tsx
<Button variant="primary" size="md">
  Button
</Button>
```

### Scoping

Mobile UI v2 is scoped to avoid interference with Studio UI:
- Use `mobile-v2` components only in patient-facing pages
- Do not modify Studio UI components to use mobile-v2 tokens
- Keep token namespaces separate (`mobileColors` vs existing tokens)

## Integration with Tailwind

Mobile UI v2 components use Tailwind utility classes that reference the existing token system in `app/globals.css`. The color values are compatible but scoped to avoid conflicts.

For custom styling, you can still use Tailwind utilities:

```tsx
<Card className="border-2 border-primary-500">
  Custom styled card
</Card>
```

## Source Attribution

Design tokens and components extracted from:
- **Source**: `docs/rhythm_mobile_v2/`
- **Reference Screens**: Dashboard.png, Assessment.png, Dialog.png, PersonalScreen.png, Assessment_Select.png
- **Original Design System**: Health App Design System (React + Tailwind v4)

## Migration Guide

When converting existing pages to use Mobile UI v2:

1. **Replace hardcoded buttons** with `<Button>` component
2. **Replace divs with shadows** with `<Card>` component
3. **Replace status badges** with `<Chip>` component
4. **Replace list items** with `<ListRow>` component
5. **Use design tokens** for spacing, colors, and radii

Example migration:

```tsx
// Before
<div className="bg-white rounded-2xl p-6 shadow-sm">
  <button className="bg-blue-500 px-6 py-3 rounded-xl text-white">
    Save
  </button>
</div>

// After
import { Card, Button } from '@/lib/ui/mobile-v2'

<Card padding="md" shadow="sm">
  <Button variant="primary" size="md">
    Save
  </Button>
</Card>
```

## Testing

Verify mobile-v2 components:

```bash
npm run build  # Ensure build succeeds
npm run start  # Test in development
```

Check that:
- ✅ Components render correctly
- ✅ Tokens are applied consistently
- ✅ Studio UI remains unchanged
- ✅ No TypeScript errors
- ✅ No build warnings

## Future Enhancements

Potential additions (out of scope for initial implementation):

- Additional components (Modal, Drawer, Tabs)
- Animation utilities
- Dark mode support
- Ring progress component
- Form components (Input, Select, Checkbox)

---

**Status**: ✅ Complete  
**Last Updated**: 2026-01-20  
**Maintainer**: Design System Team
