# Design Token Usage Examples

> Quick reference guide for using design tokens in Rhythmologicum Connect v0.4

## Three Ways to Access Tokens

### 1. Tailwind CSS Classes (Recommended for JSX)

```tsx
// Button with primary color
<button className="bg-primary-600 hover:bg-primary-700 text-white px-lg py-md rounded-xl shadow-md">
  Save Changes
</button>

// Card with neutral background
<div className="bg-neutral-50 p-lg rounded-lg shadow-md border border-neutral-200">
  <h3 className="text-2xl text-neutral-900 mb-md">Card Title</h3>
  <p className="text-base text-neutral-700">Card content goes here.</p>
</div>

// Success message
<div className="bg-success-light text-success p-md rounded-md">
  ✓ Changes saved successfully
</div>

// Error message
<div className="bg-error-light text-error p-md rounded-md border border-error">
  ⚠ Please fix the errors below
</div>
```

### 2. CSS Custom Properties (For CSS Files)

```css
/* Button styles */
.custom-button {
  background-color: var(--color-primary-600);
  color: #ffffff;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  transition: all var(--duration-normal) var(--easing-smooth);
}

.custom-button:hover {
  background-color: var(--color-primary-700);
  box-shadow: var(--shadow-lg);
}

/* Card styles */
.custom-card {
  background-color: var(--color-neutral-50);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
  box-shadow: var(--shadow-md);
}

/* Typography */
.heading-large {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-neutral-900);
  margin-bottom: var(--spacing-lg);
}
```

### 3. TypeScript Tokens (For Dynamic/Computed Values)

```tsx
import { colors, spacing, typography, radii, shadows } from '@/lib/design-tokens'

// Dynamic color based on status
function StatusBadge({ status }: { status: 'success' | 'error' | 'warning' }) {
  const bgColor = {
    success: colors.semantic.success,
    error: colors.semantic.error,
    warning: colors.semantic.warning,
  }[status]
  
  return (
    <span
      style={{
        backgroundColor: bgColor,
        color: '#ffffff',
        padding: `${spacing.xs} ${spacing.sm}`,
        borderRadius: radii.md,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
      }}
    >
      {status}
    </span>
  )
}

// Computed spacing
function ResponsiveCard({ isCompact }: { isCompact: boolean }) {
  return (
    <div
      style={{
        padding: isCompact ? spacing.md : spacing.lg,
        borderRadius: radii.lg,
        boxShadow: shadows.md,
        backgroundColor: colors.neutral[50],
      }}
    >
      Content
    </div>
  )
}

// Chart colors
function Chart({ dataType }: { dataType: 'stress' | 'sleep' }) {
  const lineColor = dataType === 'stress' 
    ? colors.primary[500]    // Sky blue for stress
    : colors.semantic.info   // Blue for sleep
    
  return <LineChart color={lineColor} />
}
```

## Common Component Patterns

### Primary Button

```tsx
// Tailwind approach
<button className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white px-lg py-md rounded-xl shadow-md transition-all duration-200">
  Primary Action
</button>

// TypeScript approach
import { colors, spacing, radii, shadows, motion } from '@/lib/design-tokens'

<button
  style={{
    backgroundColor: colors.primary[600],
    color: '#ffffff',
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: radii.xl,
    boxShadow: shadows.md,
    transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
  }}
>
  Primary Action
</button>
```

### Secondary Button

```tsx
<button className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-lg py-md rounded-xl border-2 border-neutral-200">
  Secondary Action
</button>
```

### Outline Button

```tsx
<button className="bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-lg py-md rounded-xl">
  Outline Action
</button>
```

### Danger Button

```tsx
<button className="bg-error hover:bg-red-700 text-white px-lg py-md rounded-xl shadow-md">
  Delete
</button>
```

### Card Component

```tsx
<div className="bg-neutral-50 p-lg rounded-lg shadow-md border border-neutral-200">
  <h3 className="text-2xl text-neutral-900 mb-md font-semibold">Card Title</h3>
  <p className="text-base text-neutral-700 mb-lg">
    Card description goes here. This uses our typography tokens.
  </p>
  <button className="bg-primary-600 text-white px-lg py-md rounded-xl">
    Card Action
  </button>
</div>
```

### Alert/Banner

```tsx
// Success
<div className="bg-success-light border-l-4 border-success p-md rounded-md">
  <p className="text-success font-semibold">✓ Success!</p>
  <p className="text-neutral-700 text-sm">Your changes have been saved.</p>
</div>

// Error
<div className="bg-error-light border-l-4 border-error p-md rounded-md">
  <p className="text-error font-semibold">⚠ Error!</p>
  <p className="text-neutral-700 text-sm">Please fix the errors below.</p>
</div>

// Warning
<div className="bg-warning-light border-l-4 border-warning p-md rounded-md">
  <p className="text-warning font-semibold">⚠ Warning!</p>
  <p className="text-neutral-700 text-sm">Your session will expire soon.</p>
</div>

// Info
<div className="bg-info-light border-l-4 border-info p-md rounded-md">
  <p className="text-info font-semibold">ℹ Info</p>
  <p className="text-neutral-700 text-sm">Here's some helpful information.</p>
</div>
```

### Form Input

```tsx
<div className="mb-md">
  <label className="block text-sm font-semibold text-neutral-700 mb-xs">
    Email Address
  </label>
  <input
    type="email"
    className="w-full px-md py-sm border border-neutral-300 rounded-md focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
    placeholder="you@example.com"
  />
  <p className="text-sm text-neutral-500 mt-xs">
    We'll never share your email.
  </p>
</div>
```

### Form Input with Error

```tsx
<div className="mb-md">
  <label className="block text-sm font-semibold text-neutral-700 mb-xs">
    Email Address
  </label>
  <input
    type="email"
    className="w-full px-md py-sm border border-error rounded-md"
    placeholder="you@example.com"
  />
  <p className="text-sm text-error mt-xs">
    Please enter a valid email address.
  </p>
</div>
```

### Modal/Dialog

```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-md">
  <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-xl">
    <h2 className="text-3xl text-neutral-900 mb-md font-bold">Modal Title</h2>
    <p className="text-base text-neutral-700 mb-lg">
      Modal content goes here with proper spacing and typography.
    </p>
    <div className="flex gap-md justify-end">
      <button className="bg-neutral-100 text-neutral-900 px-lg py-md rounded-xl">
        Cancel
      </button>
      <button className="bg-primary-600 text-white px-lg py-md rounded-xl">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Navigation Header

```tsx
<header className="bg-white border-b border-neutral-200 shadow-sm">
  <div className="max-w-6xl mx-auto px-lg py-md flex items-center justify-between">
    <h1 className="text-2xl text-neutral-900 font-bold">
      Rhythmologicum Connect
    </h1>
    <nav className="flex gap-lg">
      <a href="#" className="text-base text-neutral-700 hover:text-primary-600">
        Dashboard
      </a>
      <a href="#" className="text-base text-neutral-700 hover:text-primary-600">
        Reports
      </a>
      <a href="#" className="text-base text-neutral-700 hover:text-primary-600">
        Settings
      </a>
    </nav>
  </div>
</header>
```

### Typography Hierarchy

```tsx
<article className="max-w-3xl mx-auto p-xl">
  {/* H1 - Hero/Page Title */}
  <h1 className="text-4xl text-neutral-900 font-bold mb-lg">
    Welcome to Rhythmologicum Connect
  </h1>
  
  {/* H2 - Major Section */}
  <h2 className="text-3xl text-neutral-900 font-bold mb-md">
    Assessment Overview
  </h2>
  
  {/* H3 - Subsection */}
  <h3 className="text-2xl text-neutral-900 font-semibold mb-md">
    Recent Results
  </h3>
  
  {/* Body text */}
  <p className="text-base text-neutral-700 mb-md leading-relaxed">
    This is a paragraph of body text. It uses the base font size (16px) 
    and neutral-700 color for optimal readability.
  </p>
  
  {/* Small text */}
  <p className="text-sm text-neutral-500">
    Last updated 2 hours ago
  </p>
</article>
```

### Spacing Examples

```tsx
{/* Tight spacing (xs = 8px) */}
<div className="flex items-center gap-xs">
  <Icon />
  <span>Icon with text</span>
</div>

{/* Compact spacing (sm = 12px) */}
<div className="space-y-sm">
  <p>Compact list item 1</p>
  <p>Compact list item 2</p>
</div>

{/* Standard spacing (md = 16px) */}
<form className="space-y-md">
  <input />
  <input />
  <button />
</form>

{/* Comfortable spacing (lg = 24px) */}
<div className="p-lg rounded-lg shadow-md">
  <p>Card with comfortable padding</p>
</div>

{/* Section spacing (xl = 32px) */}
<section className="mb-xl">
  <h2>Major section</h2>
</section>

{/* Page section spacing (2xl = 48px) */}
<div className="py-2xl">
  <h1>Hero section with generous spacing</h1>
</div>
```

## Color Usage Guidelines

### When to Use Each Color

**Primary (Sky Blue)**
- Primary buttons
- Links
- Active/selected states
- Progress bars
- Key UI elements

**Neutral (Slate)**
- Backgrounds (50-100)
- Borders (200-300)
- Disabled states (400)
- Body text (600-700)
- Headings (800-900)

**Success (Green)**
- Success messages
- Positive feedback
- Completed states
- Confirmation indicators

**Warning (Amber)**
- Warning messages
- Caution states
- Attention needed
- Temporary states

**Error (Red)**
- Error messages
- Validation errors
- Destructive actions
- Critical alerts

**Info (Blue)**
- Information messages
- Neutral notifications
- Helper text
- Secondary indicators

## Quick Reference Cheat Sheet

### Spacing
```
xs  = 8px   | gap-xs, p-xs, m-xs
sm  = 12px  | gap-sm, p-sm, m-sm
md  = 16px  | gap-md, p-md, m-md
lg  = 24px  | gap-lg, p-lg, m-lg
xl  = 32px  | gap-xl, p-xl, m-xl
2xl = 48px  | gap-2xl, p-2xl, m-2xl
3xl = 64px  | gap-3xl, p-3xl, m-3xl
```

### Typography
```
text-xs   = 12px
text-sm   = 14px
text-base = 16px
text-lg   = 18px
text-xl   = 20px
text-2xl  = 24px
text-3xl  = 30px
text-4xl  = 36px
```

### Border Radius
```
rounded-sm   = 6px
rounded-md   = 8px
rounded-lg   = 12px
rounded-xl   = 16px
rounded-2xl  = 24px
rounded-full = circular
```

### Shadows
```
shadow-sm  = Subtle
shadow-md  = Standard
shadow-lg  = Prominent
shadow-xl  = Floating
```

### Colors
```
bg-primary-500    = #0ea5e9 (Main brand)
bg-primary-600    = #0284c7 (Hover/active)
text-neutral-700  = #334155 (Body text)
text-neutral-900  = #0f172a (Headings)
bg-neutral-50     = #f8fafc (Background)
border-neutral-300 = #cbd5e1 (Borders)
```

## Migration Checklist

When updating existing components:

- [ ] Replace `padding: '24px'` with `className="p-lg"` or `padding: spacing.lg`
- [ ] Replace `fontSize: '16px'` with `className="text-base"` or `fontSize: typography.fontSize.base`
- [ ] Replace `color: '#0ea5e9'` with `className="text-primary-500"` or `color: colors.primary[500]`
- [ ] Replace `borderRadius: '12px'` with `className="rounded-lg"` or `borderRadius: radii.lg`
- [ ] Replace `boxShadow: '...'` with `className="shadow-md"` or `boxShadow: shadows.md`
- [ ] Test visual result matches original
- [ ] Remove old hardcoded values

---

**Quick Links**:
- [Full Token Documentation](/docs/design/v0.4/tokens.md)
- [Design System Overview](/docs/V0_4_DESIGN_SYSTEM.md)
- [TypeScript Tokens](/lib/design-tokens.ts)
- [Global CSS](/app/globals.css)
