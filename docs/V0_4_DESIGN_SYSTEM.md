# V0.4 Design System

> Version: 0.4.0  
> Last Updated: 2025-12-11

This document describes the design system for Rhythmologicum Connect v0.4, including design tokens, components, and usage guidelines.

## Overview

The V0.4 Design System provides a cohesive visual language and component library used across all areas of the application:

- **Clinician Dashboard**: Professional tools for healthcare providers
- **Admin Interface**: Content management and configuration
- **Patient Portal**: User-friendly assessment experience

## Design Principles

1. **Consistency**: Reusable components with predictable behavior
2. **Accessibility**: WCAG 2.1 AA compliant, keyboard navigable
3. **Clarity**: Clear visual hierarchy and readable typography
4. **Touch-Friendly**: Minimum 44px touch targets for interactive elements
5. **Performance**: Lightweight, optimized components

## Design Tokens

Design tokens are defined in two locations:
- **TypeScript**: `/lib/design-tokens.ts` - For programmatic use
- **CSS**: `/app/globals.css` - For global styles

### Color Palette

#### Primary Colors (Sky Blue)
Main brand color used for primary actions and highlights:

```
--color-primary-50:  #f0f9ff
--color-primary-100: #e0f2fe
--color-primary-200: #bae6fd
--color-primary-300: #7dd3fc
--color-primary-400: #38bdf8
--color-primary-500: #0ea5e9 (Primary)
--color-primary-600: #0284c7 (Primary Dark)
--color-primary-700: #0369a1
--color-primary-800: #075985
--color-primary-900: #0c4a6e
```

#### Neutral Colors (Slate)
Used for backgrounds, borders, and text:

```
--color-neutral-50:  #f8fafc (Lightest background)
--color-neutral-100: #f1f5f9 (Light background)
--color-neutral-200: #e2e8f0 (Border light)
--color-neutral-300: #cbd5e1 (Border default)
--color-neutral-400: #94a3b8
--color-neutral-500: #64748b (Secondary text)
--color-neutral-600: #475569
--color-neutral-700: #334155 (Primary text)
--color-neutral-800: #1e293b (Dark text)
--color-neutral-900: #0f172a (Darkest)
```

#### Semantic Colors
Contextual colors for states and feedback:

```
Success: #10b981 (Green)
Warning: #f59e0b (Amber)
Error:   #ef4444 (Red)
Info:    #3b82f6 (Blue)
```

### Typography

Font sizes follow a logical scale:

```
--font-size-xs:   0.75rem   (12px) - Small labels, captions
--font-size-sm:   0.875rem  (14px) - Secondary text
--font-size-base: 1rem      (16px) - Body text, inputs
--font-size-lg:   1.125rem  (18px) - Emphasized text
--font-size-xl:   1.25rem   (20px) - Small headings
--font-size-2xl:  1.5rem    (24px) - Section headings
--font-size-3xl:  1.875rem  (30px) - Page titles
--font-size-4xl:  2.25rem   (36px) - Hero headings
```

### Spacing

Consistent spacing scale for margins, padding, and gaps:

```
--spacing-xs:  0.5rem  (8px)  - Minimal gaps
--spacing-sm:  0.75rem (12px) - Compact elements
--spacing-md:  1rem    (16px) - Default spacing
--spacing-lg:  1.5rem  (24px) - Sections, cards
--spacing-xl:  2rem    (32px) - Major sections
--spacing-2xl: 3rem    (48px) - Page sections
--spacing-3xl: 4rem    (64px) - Hero sections
```

### Border Radius

Rounded corner values:

```
--radius-sm:   0.375rem (6px)    - Subtle rounding
--radius-md:   0.5rem   (8px)    - Buttons, inputs
--radius-lg:   0.75rem  (12px)   - Cards, panels
--radius-xl:   1rem     (16px)   - Prominent cards
--radius-2xl:  1.5rem   (24px)   - Mobile cards, hero
--radius-full: 9999px            - Pills, circles
```

### Shadows

Box shadow definitions for depth:

```
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

### Motion

Animation durations and easing:

```
--duration-fast:     150ms - Quick interactions
--duration-normal:   200ms - Standard transitions
--duration-moderate: 300ms - Comfortable animations
--duration-slow:     500ms - Deliberate animations

--easing-smooth: cubic-bezier(0.4, 0.0, 0.2, 1) - Smooth, natural
--easing-snappy: cubic-bezier(0.4, 0.0, 0.6, 1) - Quick start, slow end
```

## Component Library

All components are located in `/lib/ui/` and can be imported from `@/lib/ui`.

### Button

Versatile button component with multiple variants.

**Import:**
```tsx
import { Button } from '@/lib/ui'
```

**Variants:**
- `primary` - Main call-to-action (Sky blue background)
- `secondary` - Secondary actions (Light gray background)
- `outline` - Outlined style (Transparent with border)
- `ghost` - Minimal style (Transparent, subtle hover)
- `danger` - Destructive actions (Red background)

**Sizes:**
- `sm` - Small (36px min-height)
- `md` - Medium/Default (56px min-height)
- `lg` - Large (56px min-height)

**Example:**
```tsx
<Button variant="primary" size="md">
  Save Changes
</Button>

<Button variant="secondary" icon={<PlusIcon />}>
  Add New
</Button>

<Button variant="danger" loading>
  Delete
</Button>
```

### Card

Flexible container for grouping related content.

**Import:**
```tsx
import { Card } from '@/lib/ui'
```

**Props:**
- `header` - Optional header content
- `footer` - Optional footer content
- `padding` - Size: `none | sm | md | lg`
- `shadow` - Depth: `none | sm | md | lg`
- `radius` - Rounding: `md | lg | xl | 2xl`
- `interactive` - Adds hover effects
- `onClick` - Click handler

**Example:**
```tsx
<Card
  header={<h3 className="font-semibold">Card Title</h3>}
  footer={<Button variant="primary">Action</Button>}
  padding="lg"
  shadow="md"
>
  <p>Card body content goes here</p>
</Card>

<Card interactive onClick={() => navigate('/details')}>
  <p>Clickable card</p>
</Card>
```

### Input

Styled text input with error states.

**Import:**
```tsx
import { Input } from '@/lib/ui'
```

**Props:**
- `error` - Error state (boolean)
- `errorMessage` - Error text to display
- `helperText` - Helper text below input
- `inputSize` - Size: `sm | md | lg`

**Example:**
```tsx
<Input
  type="email"
  placeholder="Enter your email"
  error={hasError}
  errorMessage="Invalid email address"
  helperText="We'll never share your email"
/>
```

### Textarea

Multi-line text input component.

**Import:**
```tsx
import { Textarea } from '@/lib/ui'
```

**Example:**
```tsx
<Textarea
  rows={4}
  placeholder="Enter description"
  error={hasError}
  errorMessage="Description is required"
/>
```

### Select

Dropdown selection component.

**Import:**
```tsx
import { Select } from '@/lib/ui'
```

**Example:**
```tsx
<Select error={hasError} errorMessage="Please select an option">
  <option value="">Choose...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>
```

### Label

Form field label with required indicator.

**Import:**
```tsx
import { Label } from '@/lib/ui'
```

**Example:**
```tsx
<Label htmlFor="email" required>
  Email Address
</Label>
<Input id="email" type="email" />
```

### FormField

Wrapper that combines label, input, and helper text.

**Import:**
```tsx
import { FormField } from '@/lib/ui'
```

**Example:**
```tsx
<FormField
  label="Email Address"
  required
  description="We'll send a verification email"
  htmlFor="email"
>
  <Input id="email" type="email" />
</FormField>
```

### Table

Data display table with sorting support.

**Import:**
```tsx
import { Table } from '@/lib/ui'
```

**Example:**
```tsx
const columns = [
  { header: 'Name', accessor: (row) => row.name },
  { header: 'Email', accessor: (row) => row.email, sortable: true },
  { header: 'Status', accessor: (row) => <Badge>{row.status}</Badge> },
]

<Table
  columns={columns}
  data={users}
  hoverable
  bordered
  onRowClick={(user) => navigate(`/users/${user.id}`)}
  emptyMessage="No users found"
/>
```

## Layout Patterns

### Global Layout Structure

All authenticated areas share a common layout structure:

```
┌─────────────────────────────────────┐
│           Header                    │
│  - Logo/Brand                       │
│  - User Info                        │
│  - Sign Out                         │
├─────────────────────────────────────┤
│           Navigation                │
│  - Primary Links                    │
├─────────────────────────────────────┤
│                                     │
│         Main Content                │
│                                     │
│                                     │
├─────────────────────────────────────┤
│           Footer                    │
│  - Legal Links                      │
│  - Copyright                        │
└─────────────────────────────────────┘
```

### Spacing Guidelines

- **Page container**: `max-w-6xl mx-auto px-4 sm:px-6`
- **Section spacing**: `mb-6` or `mb-8` between sections
- **Card spacing**: `p-6` for standard card padding
- **Form field spacing**: `mb-4` between fields

## Accessibility

All components follow accessibility best practices:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Color Contrast**: Minimum 4.5:1 contrast ratio for text
- **Touch Targets**: Minimum 44x44px for interactive elements
- **Focus States**: Clear focus indicators with ring styles

## Dark Mode

**Current Decision for v0.4**: Light mode only with forced white backgrounds for form fields.

Form fields maintain white backgrounds even when system dark mode is active to ensure:
- Maximum readability
- Consistent experience across platforms
- Clear visual feedback

Future versions may implement proper dark mode support.

## Usage Guidelines

### Do's ✅

- Use design tokens instead of hardcoded values
- Use components from `/lib/ui` for consistency
- Follow spacing scale for layouts
- Use semantic color names (success, error, warning)
- Maintain 44px minimum touch targets

### Don'ts ❌

- Don't hardcode colors or spacing values
- Don't create one-off styled components without reason
- Don't override component styles arbitrarily
- Don't ignore accessibility requirements
- Don't use custom animations without design tokens

## Implementation Examples

### Login Page (Existing)
See `/app/page.tsx` for a well-implemented example using design tokens.

### Clinician Dashboard
See `/app/clinician/layout.tsx` for header/navigation pattern.

### Content Management
See `/app/admin/content/page.tsx` for table and filter usage.

## Migration Guide

When updating existing pages to use the new design system:

1. **Replace inline buttons** with `<Button>` component
2. **Replace card divs** with `<Card>` component
3. **Update form fields** to use `<FormField>`, `<Input>`, etc.
4. **Replace tables** with `<Table>` component
5. **Use design tokens** for custom spacing/colors

**Before:**
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Save
</button>
```

**After:**
```tsx
<Button variant="primary">
  Save
</Button>
```

## Resources

- Design Tokens: `/lib/design-tokens.ts`
- UI Components: `/lib/ui/`
- Global Styles: `/app/globals.css`
- Layouts: `/app/clinician/layout.tsx`, `/app/patient/layout.tsx`

## Future Enhancements

Planned for future versions:

- [ ] Full dark mode support
- [ ] Additional component variants
- [ ] Animation library
- [ ] Icon system
- [ ] Toast/notification system
- [ ] Modal/dialog components
- [ ] Dropdown menu component
- [ ] Badge/chip component
- [ ] Tooltip component

---

For questions or contributions, refer to the main project documentation.
