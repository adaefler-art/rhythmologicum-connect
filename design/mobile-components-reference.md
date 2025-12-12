# Mobile Components UI Kit Reference

> **Version:** 0.4.1  
> **Last Updated:** 2025-12-12  
> **Purpose:** Visual reference for iOS/React Native component implementation

## Overview

This document provides visual specifications and implementation references for all mobile components in the RHYTHM Design System. Use these as a guide when building iOS apps with React Native, Expo, or SwiftUI.

---

## Component Catalog

### 1. Mobile Question Card

**Purpose:** Primary container for assessment questions on mobile devices

**Visual Specifications:**
```
┌────────────────────────────────────────┐
│                                        │  ← 24px padding
│  Question Title (24px, bold)          │
│                                        │
│  ──────────────────────────────────  │  ← Optional divider
│                                        │
│  Question content goes here with      │  ← 16px body text
│  comfortable line height (1.5).       │
│                                        │
│  [Answer options below]                │
│                                        │
└────────────────────────────────────────┘
   └─ 24px border radius (rounded corners)
```

**Specifications:**
- Background: `#ffffff` (white)
- Border Radius: `24px` (radii.2xl)
- Padding: `24px` all sides (spacing.lg)
- Shadow: Large elevation (shadows.lg)
  - iOS: shadowRadius 7.5, shadowOpacity 0.1, shadowOffset {0, 5}
  - Android: elevation 8
- Min Width: Full screen width minus margins
- Max Width: 600px (tablet optimization)

**Component Token:** `componentTokens.mobileQuestionCard`

**Implementation:**
- React Native: See iOS Style Guide, Section "Mobile Question Card"
- SwiftUI: See iOS Style Guide, Section "Mobile Question Card"

---

### 2. Answer Button

**Purpose:** Touch-optimized button for multiple choice answers

**Visual Specifications:**

**Default State:**
```
┌─────────────────────────────────┐
│                                 │
│         Answer Text             │  ← 16px semibold
│                                 │
└─────────────────────────────────┘
  ↑ Min 44px height (accessibility)
  ← 16px border radius
  Background: neutral.100 (#f1f5f9)
  Border: 2px neutral.200 (#e2e8f0)
```

**Selected State:**
```
┌─────────────────────────────────┐
│                                 │
│         Answer Text             │  ← Primary text color
│                                 │
└─────────────────────────────────┘
  Background: primary.50 (#f0f9ff)
  Border: 2px primary.500 (#0ea5e9)
  Text: primary.700 (#0369a1)
```

**Pressed State:**
```
┌─────────────────────────────────┐
│                                 │
│         Answer Text             │
│                                 │
└─────────────────────────────────┘
  Opacity: 0.8
  Scale: 0.98 (subtle press effect)
```

**Specifications:**
- Border Radius: `16px` (radii.xl)
- Padding: `16px` horizontal and vertical (spacing.md)
- Min Height: `44px` (iOS accessibility)
- Min Width: `44px` (iOS accessibility)
- Font Size: `16px` (typography.fontSize.base)
- Font Weight: `600` (typography.fontWeight.semibold)
- Transition: 200ms smooth

**States:**
1. Default: Light gray background, neutral border
2. Hover: Subtle opacity change (web/tablet)
3. Selected: Primary color background and border
4. Pressed: Scale down slightly, reduce opacity
5. Disabled: Opacity 0.5, no interaction

**Component Token:** `componentTokens.answerButton`

---

### 3. Navigation Button (Primary)

**Purpose:** Primary action buttons for navigation (Next, Submit, Continue)

**Visual Specifications:**

**Primary Button:**
```
┌─────────────────────────────────┐
│                                 │
│     Button Label (white)        │  ← 16px semibold
│                                 │
└─────────────────────────────────┘
  ↑ Min 56px height (larger for primary actions)
  Background: primary.600 (#0284c7)
  Shadow: md elevation
  Border Radius: 16px
```

**Secondary Button:**
```
┌─────────────────────────────────┐
│                                 │
│     Button Label (dark)         │  ← 16px semibold
│                                 │
└─────────────────────────────────┘
  Background: neutral.100 (#f1f5f9)
  Border: 1px neutral.300 (#cbd5e1)
  Text: neutral.700 (#334155)
```

**Loading State:**
```
┌─────────────────────────────────┐
│                                 │
│          ⟳ Loading...           │  ← Spinner animation
│                                 │
└─────────────────────────────────┘
  Same styling, spinner replaces text
  Disabled interaction
```

**Specifications:**
- Border Radius: `16px` (radii.xl)
- Padding: `24px` horizontal, `16px` vertical
- Min Height: `56px` (emphasis for primary actions)
- Font Size: `16px` (typography.fontSize.base)
- Font Weight: `600` (typography.fontWeight.semibold)
- Shadow: Medium elevation (shadows.md)
- Transition: 200ms smooth

**Variants:**
1. **Primary:** Blue background, white text, shadow
2. **Secondary:** Light background, dark text, border
3. **Danger:** Red background, white text (destructive actions)
4. **Ghost:** Transparent background, colored text

**States:**
1. Default: Base styling
2. Pressed: Opacity 0.9, scale 0.98
3. Loading: Spinner, disabled interaction
4. Disabled: Opacity 0.5, no interaction

**Component Token:** `componentTokens.navigationButton`

---

### 4. Progress Bar

**Purpose:** Visual indicator of assessment completion

**Visual Specifications:**

**Progress Bar:**
```
────────────────────────────────────
████████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← 60% complete
────────────────────────────────────
  ↑ 8px height
  Background: neutral.200 (#e2e8f0)
  Fill: primary.500 (#0ea5e9)
  Border radius: full (pill shape)
```

**With Step Indicator:**
```
Schritt 3 von 6                     60%

────────────────────────────────────
████████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
────────────────────────────────────
```

**Specifications:**
- Height: `8px`
- Border Radius: `full` (9999px - pill shape)
- Background: `neutral.200` (#e2e8f0)
- Fill Color: `primary.500` (#0ea5e9)
- Animation: 300ms ease-out transition
- Optional Labels:
  - Step text: "Schritt X von Y" (14px, left-aligned)
  - Percentage: "XX%" (14px, right-aligned)

**Animation:**
- Width transition: 300ms ease-out
- Smooth fill animation when progress updates
- No jank on updates

**Component Token:** `componentTokens.progressBar`

---

### 5. Mobile Header

**Purpose:** Navigation header for mobile screens

**Visual Specifications:**

**Mobile Header:**
```
┌────────────────────────────────────────┐
│  ←  Page Title              [Action]   │  ← 56px height
└────────────────────────────────────────┘
   ↑ Back button (44px touch target)
        ↑ Centered title (18px semibold)
                            ↑ Optional action button
```

**With Subtitle:**
```
┌────────────────────────────────────────┐
│  ←  Page Title                         │
│      Subtitle (smaller, muted)         │
└────────────────────────────────────────┘
```

**Specifications:**
- Height: `56px` minimum
- Padding: `16px` horizontal
- Background: White or transparent
- Border Bottom: Optional 1px neutral.200
- Back Button:
  - Icon: ArrowLeft (24px)
  - Touch target: 44x44px
  - Position: Left-aligned
- Title:
  - Font size: `18px` (typography.fontSize.lg)
  - Font weight: `600` (typography.fontWeight.semibold)
  - Color: `neutral.900` (#0f172a)
  - Alignment: Centered or left (depends on layout)
- Subtitle:
  - Font size: `14px` (typography.fontSize.sm)
  - Font weight: `400` (typography.fontWeight.normal)
  - Color: `neutral.500` (#64748b)
- Action Button:
  - Position: Right-aligned
  - Min touch target: 44x44px

**Variants:**
1. **Centered Title:** Title centered, back left, action right
2. **Left-Aligned Title:** Title next to back button
3. **With Subtitle:** Two-line header with main and subtitle
4. **Transparent:** No background, used over content
5. **Elevated:** With shadow for scroll effect

---

### 6. Badge / Status Tag

**Purpose:** Small labels for status, categories, or metadata

**Visual Specifications:**

**Default Badge:**
```
┌──────────────┐
│  Status Text │  ← 12px medium
└──────────────┘
  Padding: 4px 12px
  Border radius: full (pill)
```

**Badge Variants:**

**Success:**
```
┌──────────────┐
│ ✓ Completed  │  Green background
└──────────────┘
```

**Warning:**
```
┌──────────────┐
│ ⚠ Pending    │  Amber background
└──────────────┘
```

**Error:**
```
┌──────────────┐
│ ✗ Failed     │  Red background
└──────────────┘
```

**Info:**
```
┌──────────────┐
│ ℹ Info       │  Blue background
└──────────────┘
```

**Specifications:**
- Border Radius: `full` (9999px - pill shape)
- Padding: `4px` vertical, `12px` horizontal
- Font Size: `12px` (typography.fontSize.xs) or `14px` (sm)
- Font Weight: `500` (typography.fontWeight.medium)
- Min Height: `24px` (small) or `28px` (medium)

**Color Schemes:**

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| Default | neutral.100 | neutral.700 | neutral.200 |
| Success | semantic.successLight | semantic.success | none |
| Warning | semantic.warningLight | semantic.warning | none |
| Error | semantic.errorLight | semantic.error | none |
| Info | semantic.infoLight | semantic.info | none |
| Primary | primary.50 | primary.700 | none |

**Usage:**
- Status indicators (completed, pending, failed)
- Category labels
- Metadata tags
- Count badges

---

### 7. Info Box / Helper Text

**Purpose:** Contextual information, tips, and help text

**Visual Specifications:**

**Info Box:**
```
┌────────────────────────────────────────┐
│  ℹ️  Information Title                  │
│                                        │
│  This is helper text that provides    │
│  additional context or guidance.      │
│                                        │
└────────────────────────────────────────┘
  Border radius: 12px
  Background: Light semantic color
  Padding: 16px
```

**Specifications:**
- Border Radius: `12px` (radii.lg)
- Padding: `16px` (spacing.md)
- Font Size: `14px` (typography.fontSize.sm)
- Line Height: `1.625` (typography.lineHeight.relaxed)
- Background Colors:
  - Info: `semantic.infoLight` (#dbeafe)
  - Success: `semantic.successLight` (#d1fae5)
  - Warning: `semantic.warningLight` (#fef3c7)
  - Error: `semantic.errorLight` (#fee2e2)
- Icon: Optional leading icon (24px)
- Title: Optional bold title (14px semibold)

**Variants:**
1. **Info:** Blue background, info icon
2. **Success:** Green background, checkmark icon
3. **Warning:** Amber background, warning icon
4. **Error:** Red background, error icon

**Component Token:** `componentTokens.infoBox`

---

### 8. Input Field (Mobile)

**Purpose:** Text input for forms and user data entry

**Visual Specifications:**

**Default Input:**
```
┌────────────────────────────────────────┐
│  Label Text (14px medium)              │
│  ┌──────────────────────────────────┐ │
│  │ Placeholder text...              │ │
│  └──────────────────────────────────┘ │
│  Helper text (12px, muted)             │
└────────────────────────────────────────┘
  Border: 1px neutral.300
  Border radius: 8px
  Min height: 44px (accessibility)
```

**Focus State:**
```
┌────────────────────────────────────────┐
│  Label Text (14px medium, primary)     │
│  ┌══════════════════════════════════┐ │  ← Primary border
│  │ User typing...                   │ │
│  └══════════════════════════════════┘ │
│  Helper text                           │
└────────────────────────────────────────┘
  Border: 2px primary.500
  Ring: 4px primary.100 (glow effect)
```

**Error State:**
```
┌────────────────────────────────────────┐
│  Label Text (14px medium, error)       │
│  ┌──────────────────────────────────┐ │
│  │ Invalid input                    │ │  ← Error border
│  └──────────────────────────────────┘ │
│  ✗ Error message (12px, error)        │
└────────────────────────────────────────┘
  Border: 2px semantic.error
  Background: Subtle error tint
```

**Specifications:**
- Border Radius: `8px` (radii.md)
- Padding: `12px` horizontal, `12px` vertical
- Min Height: `44px` (iOS accessibility)
- Font Size: `16px` (typography.fontSize.base) - prevents zoom on iOS
- Border Width: `1px` default, `2px` focus/error
- Label:
  - Font size: `14px` (typography.fontSize.sm)
  - Font weight: `500` (typography.fontWeight.medium)
  - Margin bottom: `8px`
- Helper Text:
  - Font size: `12px` (typography.fontSize.xs)
  - Color: `neutral.500` (muted)
  - Margin top: `4px`

**States:**
1. Default: Light border, placeholder visible
2. Focus: Primary border, ring effect
3. Filled: User content, no placeholder
4. Error: Red border, error message
5. Disabled: Gray background, no interaction

---

### 9. Card Container

**Purpose:** General content container for grouped information

**Visual Specifications:**

**Basic Card:**
```
┌────────────────────────────────────────┐
│  Card Header (optional)                │
│  ──────────────────────────────────   │
│                                        │
│  Card body content goes here with     │
│  appropriate padding and spacing.     │
│                                        │
│  ──────────────────────────────────   │
│  Card Footer (optional)                │
└────────────────────────────────────────┘
  Border radius: 12px (desktop) or 24px (mobile)
  Shadow: md elevation
  Background: white
```

**KPI Card (Statistics):**
```
┌────────────────────────────────────────┐
│                                        │
│           1,234                        │  ← Large number (36px)
│      Active Patients                   │  ← Label (14px)
│                                        │
│      ↑ 12% vs last month              │  ← Change indicator
│                                        │
└────────────────────────────────────────┘
```

**Specifications:**
- Border Radius: `12px` (radii.lg) or `24px` (radii.2xl for mobile)
- Padding: `20px` (desktop) or `24px` (mobile)
- Shadow: `md` or `lg` elevation
- Background: `#ffffff` (white)
- Min Height: Auto (based on content)
- Optional Elements:
  - Header: Title, subtitle, actions
  - Divider: 1px neutral.200
  - Footer: Actions, metadata

**Variants:**
1. **Basic:** Simple container
2. **Interactive:** Hover effect, pressable
3. **Elevated:** Larger shadow
4. **Outlined:** Border instead of shadow
5. **KPI:** Large number, label, change indicator

---

### 10. Loading Spinner

**Purpose:** Loading state indicator

**Visual Specifications:**

**Spinner:**
```
    ⟳
  Loading animation (rotating)
```

**Specifications:**
- Size: `24px` (small), `32px` (medium), `48px` (large)
- Color: `primary.500` or `neutral.500`
- Animation: 360° rotation, 1s duration, linear easing
- Stroke Width: `2px` (small), `3px` (medium), `4px` (large)

**Usage:**
- Button loading states
- Page loading
- Data fetching
- Form submission

**Implementation:**
- React Native: `<ActivityIndicator>` component
- SwiftUI: `ProgressView()` with circular style

---

## Component Relationships

### Assessment Flow Components

```
MobileHeader
    ↓
Progress Bar (showing completion)
    ↓
Mobile Question Card
    ├── Question text
    ├── Answer Buttons (multiple)
    └── Info Box (optional help)
    ↓
Navigation Buttons
    ├── Back (secondary)
    └── Next (primary)
```

### Form Components

```
Input Field
    ├── Label
    ├── Input box
    ├── Helper text
    └── Error text (conditional)
    ↓
Navigation Button (Submit)
```

### Status Display Components

```
Card Container
    ├── KPI Number
    ├── Badge (status)
    └── Info Box (context)
```

---

## Layout Guidelines

### Mobile Screen Structure

```
┌────────────────────────────────────────┐
│ Mobile Header (56px)                   │  ← Fixed top
├────────────────────────────────────────┤
│                                        │
│ Progress Bar (optional)                │  ← Below header
│                                        │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ │   Mobile Question Card         │   │  ← Scrollable content
│ │   (primary content)            │   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│ ┌────────────────────────────────┐   │
│ │   Answer Buttons (stacked)     │   │
│ └────────────────────────────────┘   │
│                                        │
├────────────────────────────────────────┤
│ [Back]              [Next →]           │  ← Fixed bottom
└────────────────────────────────────────┘
  ↑ Navigation buttons (56px height)
```

### Spacing Scale

| Element | Spacing Token | Value |
|---------|---------------|-------|
| Minimal gap | xs | 8px |
| Compact spacing | sm | 12px |
| Default spacing | md | 16px |
| Section spacing | lg | 24px |
| Major sections | xl | 32px |
| Page sections | 2xl | 48px |

### Safe Areas (iOS)

Always respect iOS safe areas:
- Top: Status bar + notch
- Bottom: Home indicator
- Sides: Curved edges

React Native:
```tsx
import { SafeAreaView } from 'react-native-safe-area-context'

<SafeAreaView edges={['top', 'bottom']}>
  {/* Content */}
</SafeAreaView>
```

SwiftUI:
```swift
.ignoresSafeArea(.keyboard) // Only ignore keyboard
.safeAreaInset(edge: .bottom) { /* Custom inset */ }
```

---

## Responsive Breakpoints

### Mobile First

Design for mobile first, then scale up:

| Device | Width | Adjustments |
|--------|-------|-------------|
| Phone | 320-428px | Base design, single column |
| Phablet | 429-768px | Slightly larger touch targets |
| Tablet | 769-1024px | Two-column layout, desktop-like |
| Desktop | 1025px+ | Web app (not covered in mobile kit) |

### Tablet Optimizations

For iPad and large tablets:
- Increase card max-width to 600px
- Use two-column layouts where appropriate
- Increase font sizes slightly
- Add more whitespace
- Consider desktop navigation patterns

---

## Accessibility Checklist

### iOS Accessibility

- [ ] All touch targets are minimum 44x44pt
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text)
- [ ] All interactive elements have accessibility labels
- [ ] Support for Dynamic Type (font scaling)
- [ ] VoiceOver navigation works properly
- [ ] Keyboard navigation supported (iPad)
- [ ] Reduce motion support for animations
- [ ] Sufficient spacing between interactive elements

### Testing

Test with:
- VoiceOver enabled
- Large text sizes (Dynamic Type)
- Reduce motion enabled
- High contrast mode
- Different screen sizes
- Landscape and portrait orientations

---

## Export Formats

### For Designers

**Figma Components:**
- Create components matching these specifications
- Use auto-layout for responsive behavior
- Export assets as SVG (icons) and PNG (screenshots)
- Share component library with developers

**Design Tokens:**
- Use `/design/tokens/ios.json` as source of truth
- Sync with Figma using plugins (Tokens Studio)
- Export artboards as PNG for reference

### For Developers

**Code Components:**
- React Native components in `/components/mobile/`
- SwiftUI views in Xcode project
- Shared token file: `/design/tokens/ios.json`

**Screenshot References:**
- Export component examples as PNG
- Store in `/design/components/screenshots/`
- Include all states (default, hover, selected, error, disabled)

---

## Update Process

### When Design Changes

1. Update `/lib/design-tokens.ts` (source of truth)
2. Run export script to generate `/design/tokens/ios.json`
3. Update this document with new specs
4. Update component implementations
5. Test on iOS devices
6. Update Figma components
7. Notify mobile team

### Version Control

Track changes to:
- Token values
- Component specifications
- New components
- Breaking changes

Use semantic versioning:
- Major: Breaking changes
- Minor: New components/features
- Patch: Bug fixes, minor adjustments

---

## Resources

### Design Files

- iOS Token Export: `/design/tokens/ios.json`
- iOS Style Guide: `/docs/design/ios-style-guide.md`
- Web Design System: `/docs/V0_4_DESIGN_SYSTEM.md`

### Component Screenshots

Component screenshots should be generated and stored in:
```
/design/components/screenshots/
  ├── mobile-question-card.png
  ├── answer-button-states.png
  ├── navigation-buttons.png
  ├── progress-bar.png
  ├── mobile-header.png
  ├── badges.png
  ├── info-box.png
  ├── input-states.png
  └── card-variants.png
```

### External References

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [React Native Components](https://reactnative.dev/docs/components-and-apis)
- [Expo Components](https://docs.expo.dev/ui-programming/react-native-styling-buttons/)
- [SwiftUI Views](https://developer.apple.com/documentation/swiftui/views)

---

**Version:** 0.4.1  
**Status:** Production Ready ✅  
**Last Updated:** 2025-12-12

This mobile components reference is part of the RHYTHM Design System iOS export (Issue #5).
