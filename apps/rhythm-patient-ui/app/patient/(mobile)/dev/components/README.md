# Screen Gallery Layout Components

This directory contains layout wrapper components designed to prevent the "narrow box" error in dev/gallery contexts.

## Problem

When rendering mobile screen compositions in development galleries, parent layout constraints (like `max-w-6xl` from desktop layouts) can inadvertently constrain the screen width, causing them to appear too narrow instead of at their intended mobile width.

## Solution

Two wrapper components provide protection against constraint leakage:

### FullBleed

**Purpose:** Neutralizes parent layout constraints

**Usage:**
```tsx
<FullBleed>
  <YourScreenComponent />
</FullBleed>
```

**Implementation:**
- Forces `w-full max-w-none` to override any parent `container`, `prose`, or `max-w-*` classes
- Safe wrapper for any content that needs full viewport width

### DeviceFrame

**Purpose:** Renders content in a fixed phone-width frame (390px)

**Features:**
- Fixed width: 390px (iPhone 12/13/14 standard)
- Centered with `mx-auto`
- Responsive: `max-w-full` on narrow viewports
- Visual frame: rounded corners, border, shadow
- Uses FullBleed internally to prevent constraint leakage

**Usage:**
```tsx
<DeviceFrame>
  <YourMobileScreen />
</DeviceFrame>
```

## Guardrail

The `scripts/guard-no-narrow-screens.mjs` script enforces correct usage:

```bash
npm run verify:narrow-box
```

**Checks:**
1. FullBleed component exists with correct implementation (`w-full max-w-none`)
2. DeviceFrame component exists and uses FullBleed
3. ScreenGallery uses DeviceFrame
4. Gallery pages don't apply narrow constraints without neutralization

## Best Practices

1. **Always use DeviceFrame** when rendering mobile screens in galleries or dev pages
2. **Always use FullBleed** when you need to break out of parent constraints
3. **Run the guardrail** before committing changes to gallery/dev pages: `npm run verify:narrow-box`
4. **Don't apply `container`, `prose`, or `max-w-*`** to gallery wrappers unless paired with `max-w-none`

## Files

- `FullBleed.tsx` - Constraint neutralization wrapper
- `DeviceFrame.tsx` - Phone-width rendering frame
- `ScreenGallery.tsx` - Reference implementation using DeviceFrame
- `../../../../../scripts/guard-no-narrow-screens.mjs` - Guardrail script
