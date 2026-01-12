# Patient Mobile Layout Patterns

**Version**: 0.7.0  
**Status**: Production Ready  
**Last Updated**: 2026-01-12  
**Related**: E6.1.7 — Layout Patterns: Patient Mobile Shell (0.7 iOS Blueprint)

---

## Overview

This document defines the mobile-first layout patterns used across all patient-facing interfaces in Rhythmologicum Connect. These patterns ensure consistent spacing, navigation, progress indicators, and safe area handling across all iOS devices.

### Design Goals

1. **Mobile-First**: Optimized for iOS with proper safe area handling
2. **Consistency**: All patient screens follow the same layout structure
3. **No Visual Jumps**: Smooth transitions between screens and states
4. **Accessibility**: Touch targets ≥44px, proper contrast, VoiceOver support
5. **Performance**: Minimal re-renders, smooth 60fps animations

---

## Core Layout Pattern: Mobile Shell

The **Patient Mobile Shell** is the foundational layout structure used throughout the patient portal. It consists of three key areas:

```
┌─────────────────────────────────┐
│  Top Header (Fixed)             │ ← Safe area aware
│  - Logo / Title                 │
│  - User controls                │
├─────────────────────────────────┤
│                                 │
│  Content Area (Scrollable)      │
│  - Dynamic content              │
│  - Variable height              │
│                                 │
│                                 │
├─────────────────────────────────┤
│  Bottom Navigation (Fixed)      │ ← Safe area aware
│  - Tab navigation               │
└─────────────────────────────────┘
```

### Implementation

The mobile shell is implemented in `app/patient/PatientLayoutClient.tsx` and provides:

- **Top Header (Mobile Only)**: Fixed positioning with safe area padding
- **Content Area**: Flexible scrolling area with padding for fixed elements
- **Bottom Navigation (Mobile Only)**: Fixed tab bar with safe area padding

#### Code Structure

```tsx
// app/patient/PatientLayoutClient.tsx
<div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
  {/* Mobile Top Header - Fixed */}
  <header
    className="md:hidden fixed inset-x-0 top-0 z-40 bg-white/95 backdrop-blur border-b"
    style={{
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}
  >
    {/* Header content */}
  </header>

  {/* Content Area */}
  <main className="flex-1 pt-[calc(4rem+env(safe-area-inset-top,0px))] md:pt-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
    {children}
  </main>

  {/* Mobile Bottom Navigation - Fixed */}
  <nav
    className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t"
    style={{
      paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))',
    }}
  >
    {/* Navigation tabs */}
  </nav>
</div>
```

---

## Safe Area Handling (iOS)

### What are Safe Areas?

iOS devices have non-rectangular screens with notches, Dynamic Island, and home indicators. The **safe area** is the region where content is guaranteed to be visible and not obscured.

### Implementation Pattern

We use CSS environment variables to respect safe areas:

```css
/* Top safe area */
padding-top: env(safe-area-inset-top, 0px);

/* Bottom safe area (includes home indicator) */
padding-bottom: calc(0.625rem + env(safe-area-inset-bottom, 0px));

/* Combined layout spacing */
padding-top: calc(4rem + env(safe-area-inset-top, 0px));
padding-bottom: calc(6rem + env(safe-area-inset-bottom));
```

### Components Using Safe Areas

| Component | Location | Safe Area Usage |
|-----------|----------|-----------------|
| `PatientLayoutClient` | `app/patient/PatientLayoutClient.tsx` | Top header, main content, bottom nav |
| `PatientNavigation` | `app/components/PatientNavigation.tsx` | Bottom navigation tabs |
| `MobileWelcomeScreen` | `app/components/MobileWelcomeScreen.tsx` | Content padding |
| Funnel Result Pages | `app/patient/funnel/[slug]/result/client.tsx` | Content padding |

---

## Step Progress Pattern

The **Step Progress Pattern** is used in multi-step funnels (assessments, onboarding) to show users their current position.

### Visual Pattern

```
┌─────────────────────────────────┐
│  Schritt 2 von 5          40%   │
│  ████████░░░░░░░░░░░░░░░░       │
└─────────────────────────────────┘
```

### Implementation

The progress indicator is implemented in `app/components/MobileProgress.tsx` with two variants:

#### 1. Bar Variant (Default)

Horizontal progress bar with percentage:

```tsx
<MobileProgress
  currentStep={2}
  totalSteps={5}
  variant="bar"
  showPercentage={true}
  showStepText={true}
/>
```

**Visual Output:**
```
Frage 3 von 5                60%
████████████░░░░░░░░░
```

#### 2. Steps Variant

Individual step indicators:

```tsx
<MobileProgress
  currentStep={1}
  totalSteps={4}
  variant="steps"
/>
```

**Visual Output:**
```
Schritt 2 von 4              50%
████ ████ ░░░░ ░░░░
```

### Design Specifications

| Property | Value | Token Reference |
|----------|-------|-----------------|
| Bar Height | `8px` | `componentTokens.progressBar.height` |
| Border Radius | `9999px` (pill) | `componentTokens.progressBar.borderRadius` |
| Background | `#e2e8f0` | `colors.neutral[200]` |
| Fill Color | `#0ea5e9` | `colors.primary[500]` |
| Transition | `300ms ease-out` | `componentTokens.progressBar.transition` |
| Text Size | `14px` | `typography.fontSize.sm` |

### Usage Guidelines

- **Use bar variant** for questions/forms with many steps (>5)
- **Use steps variant** for onboarding/wizards with few steps (2-5)
- Always show step text for accessibility
- Show percentage for long funnels to give concrete progress feedback

---

## Spacing & Radius Rules

### Spacing Scale

Consistent spacing ensures visual rhythm and prevents "jumpy" layouts:

| Token | Value | Use Case |
|-------|-------|----------|
| `spacing.xs` | `8px` | Minimal gaps, icon spacing |
| `spacing.sm` | `12px` | Compact elements, tight spacing |
| `spacing.md` | `16px` | **Default spacing**, form fields |
| `spacing.lg` | `24px` | **Card padding**, section gaps |
| `spacing.xl` | `32px` | Large sections, hero spacing |
| `spacing.2xl` | `48px` | Major section separators |
| `spacing.3xl` | `64px` | Page-level spacing |

### Mobile-Specific Spacing

For mobile layouts, follow these guidelines:

```tsx
// Card Padding
padding: spacing.lg // 24px

// Content Spacing
gap: spacing.md // 16px between elements

// Section Separators
marginBottom: spacing.xl // 32px between sections

// Screen Margins (iOS)
paddingX: spacing.md // 16px horizontal padding
```

### Border Radius Scale

Rounded corners reduce visual sharpness and improve touch targets:

| Token | Value | Use Case |
|-------|-------|----------|
| `radii.sm` | `6px` | Small buttons, tags |
| `radii.md` | `8px` | Input fields |
| `radii.lg` | `12px` | Standard buttons |
| `radii.xl` | `16px` | **Primary buttons** |
| `radii.2xl` | `24px` | **Cards, panels** |
| `radii.full` | `9999px` | Pills, circular buttons |

### Mobile-Specific Radius

For iOS-style interfaces:

```tsx
// Primary Cards
borderRadius: radii['2xl'] // 24px - matches iOS design language

// Buttons
borderRadius: radii.xl // 16px - touch-friendly

// Input Fields
borderRadius: radii.lg // 12px

// Progress Bars
borderRadius: radii.full // Pill shape
```

---

## Common Layout Components

### 1. MobileHeader

**Location**: `app/components/MobileHeader.tsx`

Sticky header with back navigation and optional title/actions.

```tsx
<MobileHeader
  variant="with-title"
  title="Stress Assessment"
  subtitle="Schritt 2 von 5"
  showBack={true}
  onBack={() => router.back()}
/>
```

**Features**:
- Sticky positioning with elevated z-index
- 44px minimum touch targets
- Theme-aware colors
- Safe area support (when used in full-page layouts)

### 2. MobileCard

**Location**: `app/components/MobileCard.tsx`

Reusable card container with consistent styling.

```tsx
<MobileCard
  padding="lg"
  shadow="lg"
  radius="2xl"
  border={true}
>
  <h3>Card Title</h3>
  <p>Card content...</p>
</MobileCard>
```

**Features**:
- Configurable padding, shadow, and radius using design tokens
- Optional interactive states with hover/active effects
- Consistent with design system

### 3. MobileProgress

**Location**: `app/components/MobileProgress.tsx`

Progress indicator for multi-step flows.

```tsx
<MobileProgress
  currentStep={2}
  totalSteps={5}
  variant="bar"
  showPercentage={true}
/>
```

**Features**:
- Two variants: bar and steps
- Smooth animations using design token motion values
- Accessible with proper ARIA labels

### 4. PatientNavigation

**Location**: `app/components/PatientNavigation.tsx`

Bottom tab navigation (mobile) and top tabs (desktop).

```tsx
<PatientNavigation
  navItems={navItems}
  variant="mobile"
/>
```

**Features**:
- Dual rendering: mobile bottom tabs and desktop header tabs
- Safe area aware
- Active state highlighting

---

## Funnel Screen Patterns

### Standard Funnel Flow

All patient funnel screens follow this pattern:

```
1. Intro/Welcome Screen
   └─> MobileWelcomeScreen component

2. Question Screens (repeating)
   └─> MobileQuestionScreen component
   
3. Result Screen
   └─> Custom result layout with MobileCard components
```

### Question Screen Layout

```
┌─────────────────────────────────┐
│  ← Back    [Progress: 40%]      │ ← MobileHeader + Progress
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │  Frage Titel              │ │ ← MobileCard
│  │  Question text here...    │ │
│  │                           │ │
│  │  [Answer Options]         │ │
│  └───────────────────────────┘ │
│                                 │
│  [Weiter Button]                │ ← Action bar
└─────────────────────────────────┘
```

**Implementation**:

```tsx
// app/components/MobileQuestionScreen.tsx
<div className="min-h-screen flex flex-col bg-slate-50">
  {/* Header with progress */}
  <MobileHeader title={funnelTitle} />
  <MobileProgress currentStep={questionIndex} totalSteps={totalQuestions} />

  {/* Question content */}
  <div className="flex-1 px-4 py-6">
    <MobileCard padding="lg" shadow="lg" radius="2xl">
      {/* Question and answers */}
    </MobileCard>
  </div>

  {/* Action buttons */}
  <div className="px-4 pb-6">
    <button>Weiter</button>
  </div>
</div>
```

---

## Typography in Mobile Layouts

### Heading Hierarchy

```tsx
// Page Title (Hero)
<h1 className="text-3xl font-bold text-slate-900">
  Welcome
</h1>

// Section Title
<h2 className="text-2xl font-semibold text-slate-800">
  Assessment Results
</h2>

// Card Title
<h3 className="text-xl font-semibold text-slate-700">
  Question 1
</h3>

// Subsection
<h4 className="text-lg font-medium text-slate-600">
  Details
</h4>
```

### Body Text

```tsx
// Regular body text
<p className="text-base text-slate-700 leading-relaxed">
  This is body text...
</p>

// Secondary text
<p className="text-sm text-slate-500">
  Helper text or metadata
</p>

// Small labels
<span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
  Label
</span>
```

---

## Touch Targets & Accessibility

### Minimum Touch Target Size

All interactive elements must meet iOS accessibility guidelines:

**Minimum: 44×44 points (44px)**

```tsx
// Button
<button
  className="min-h-[44px] min-w-[44px] px-4 py-2"
>
  Action
</button>

// Icon button
<button
  className="w-11 h-11 rounded-full flex items-center justify-center"
>
  <Icon size={20} />
</button>
```

### Color Contrast

All text must meet WCAG 2.1 AA standards:

- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18px+ or 14px+ bold): 3:1 contrast ratio

Our default combinations:
- `text-slate-700` on `bg-white` = 10.4:1 ✅
- `text-slate-900` on `bg-slate-50` = 15.52:1 ✅
- `text-sky-600` on `bg-white` = 4.8:1 ✅

### VoiceOver Support

All interactive elements need proper labels:

```tsx
<button
  aria-label="Zurück zur vorherigen Frage"
  onClick={onBack}
>
  <ArrowLeft aria-hidden />
</button>

<div
  role="progressbar"
  aria-valuenow={40}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Fortschritt: 40%"
>
  {/* Progress bar */}
</div>
```

---

## Animation & Motion

### Transition Timing

Use design tokens for consistent animation timing:

| Token | Value | Use Case |
|-------|-------|----------|
| `motion.duration.instant` | `0ms` | No animation |
| `motion.duration.fast` | `150ms` | Micro-interactions, hover |
| `motion.duration.normal` | `200ms` | **Default transitions** |
| `motion.duration.moderate` | `300ms` | Comfortable animations |
| `motion.duration.slow` | `500ms` | Deliberate animations |

### Easing Curves

```tsx
// Standard transition
transition: `all ${motion.duration.normal} ${motion.easing.smooth}`

// Spring animation (iOS-like)
// Uses framer-motion for complex animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
>
  {content}
</motion.div>
```

### Preventing Visual Jumps

To avoid layout shifts:

1. **Reserve space for loading states**:
   ```tsx
   <div className="min-h-[200px]">
     {loading ? <LoadingSpinner /> : <Content />}
   </div>
   ```

2. **Use CSS transitions instead of instant changes**:
   ```tsx
   className="transition-all duration-200"
   ```

3. **Maintain consistent padding/margins**:
   ```tsx
   // Always use the same vertical spacing
   <div className="py-6">
     {content}
   </div>
   ```

---

## Desktop Responsiveness

While the patient portal is mobile-first, it gracefully adapts to desktop:

```tsx
// Mobile: Fixed header + bottom nav
// Desktop: Top navigation + footer

<header className="md:hidden fixed ...">
  Mobile Header
</header>

<header className="hidden md:block">
  Desktop Header
</header>

<nav className="md:hidden fixed bottom-0 ...">
  Mobile Bottom Nav
</nav>

<footer className="hidden md:block">
  Desktop Footer
</footer>
```

### Breakpoints

```css
/* Mobile first (default) */
/* Applies to < 768px */

/* Tablet and up */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large desktop */
@media (min-width: 1280px) { }
```

---

## Testing Checklist

### Visual Testing

- [ ] All screens use consistent header/navigation
- [ ] Progress indicators display correctly
- [ ] No visual jumps during navigation
- [ ] Spacing is consistent (no random margins)
- [ ] Border radius matches design system
- [ ] Safe areas respected on iOS devices

### Functionality Testing

- [ ] Back navigation works on all screens
- [ ] Progress updates correctly as user advances
- [ ] Bottom tabs navigate properly
- [ ] Scrolling works smoothly
- [ ] Touch targets are large enough (44px minimum)

### Accessibility Testing

- [ ] VoiceOver can navigate all elements
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All interactive elements have labels
- [ ] Keyboard navigation works (desktop)
- [ ] Focus states are visible

### Device Testing

- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (notch + Dynamic Island)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad Mini (tablet)
- [ ] Desktop browser (≥1024px)

---

## Component Reference

### Core Layout Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `PatientLayoutClient` | `app/patient/PatientLayoutClient.tsx` | Root mobile shell layout |
| `PatientNavigation` | `app/components/PatientNavigation.tsx` | Bottom tabs (mobile) / top tabs (desktop) |
| `MobileHeader` | `app/components/MobileHeader.tsx` | Sticky header with back button |
| `MobileProgress` | `app/components/MobileProgress.tsx` | Step progress indicator |
| `MobileCard` | `app/components/MobileCard.tsx` | Card container with design tokens |

### Funnel-Specific Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MobileQuestionScreen` | `app/components/MobileQuestionScreen.tsx` | Complete question screen layout |
| `MobileWelcomeScreen` | `app/components/MobileWelcomeScreen.tsx` | Funnel intro/welcome screen |
| `PatientFlowRenderer` | `app/components/PatientFlowRenderer.tsx` | Orchestrates funnel flow |

### Answer Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `BinaryAnswerButtons` | `app/components/BinaryAnswerButtons.tsx` | Yes/No questions |
| `ScaleAnswerButtons` | `app/components/ScaleAnswerButtons.tsx` | 1-5 scale questions |
| `SingleChoiceAnswerButtons` | `app/components/SingleChoiceAnswerButtons.tsx` | Multiple choice |
| `SliderAnswerComponent` | `app/components/SliderAnswerComponent.tsx` | Slider input |

---

## Future Enhancements

### Planned (v0.8+)

- [ ] Gesture-based navigation (swipe to go back/forward)
- [ ] Pull-to-refresh for data updates
- [ ] Haptic feedback on iOS
- [ ] Skeleton loaders for better perceived performance
- [ ] Dark mode optimization for OLED screens
- [ ] Offline support with service workers

### Under Consideration

- [ ] Native iOS app using React Native
- [ ] SwiftUI implementation for better iOS integration
- [ ] Landscape mode optimizations for iPad
- [ ] Apple Pencil support for drawing/annotations

---

## Related Documentation

- [iOS Style Guide](../design/ios-style-guide.md) - Native iOS implementation
- [V0.4 Design System](../V0_4_DESIGN_SYSTEM.md) - Overall design system
- [Design Tokens](../V0_4_DESIGN_TOKENS.md) - Token reference
- [Layout Standards](../LAYOUT_STANDARDS.md) - Desktop layout patterns

---

## Change Log

### v0.7.0 (2026-01-12)

- Initial documentation of Patient Mobile Shell pattern
- Safe area handling guidelines
- Step progress pattern specification
- Spacing and radius rules
- Component reference catalog

---

**Maintained by**: Design System Team  
**Status**: ✅ Production Ready  
**Version**: 0.7.0
