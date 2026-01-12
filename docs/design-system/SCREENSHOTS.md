# Patient Mobile Shell - Visual Documentation

**Version**: 0.7.0  
**Last Updated**: 2026-01-12  
**Related**: E6.1.7 — Layout Patterns

---

## Overview

This document contains visual examples of the Patient Mobile Shell layout patterns in action. Screenshots and diagrams illustrate how the documented patterns are implemented across different patient screens.

---

## Mobile Shell Pattern

### Full Screen Layout

```
┌─────────────────────────────────┐
│ ▓▓▓▓▓▓ Safe Area Top ▓▓▓▓▓▓    │ ← iOS Safe Area (notch/Dynamic Island)
├─────────────────────────────────┤
│ 📱 Rhythmologicum Connect       │
│    Stress & Resilienz Pilot     │ ← Fixed Top Header (z-40)
│                         [Theme] │
├─────────────────────────────────┤
│                                 │
│  [Main Content - Scrollable]    │
│                                 │
│  Padding:                       │
│  - Top: 4rem + safe-area-top    │
│  - Bottom: 6rem + safe-area-btm │
│                                 │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│  📝 Assessment   📊 Verlauf     │ ← Fixed Bottom Navigation (z-40)
├─────────────────────────────────┤
│ ▓▓▓▓▓ Safe Area Bottom ▓▓▓▓▓    │ ← iOS Safe Area (home indicator)
└─────────────────────────────────┘
```

**Key Features:**
- Top header fixed with backdrop blur
- Content area with safe-area-aware padding
- Bottom navigation fixed with safe-area padding
- No visual jumps when scrolling

---

## Welcome/Intro Screen Pattern

```
┌─────────────────────────────────┐
│  ← Back   Stress Assessment     │ ← MobileHeader
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │       🧘‍♀️ Icon          │   │
│  │                         │   │ ← Illustration area
│  └─────────────────────────┘   │
│                                 │
│  Willkommen zum                 │ ← Title (text-3xl)
│  Stress Assessment              │
│                                 │
│  Diese Bewertung hilft...       │ ← Description
│                                 │
│  • Punkt 1                      │
│  • Punkt 2                      │ ← Bullet points
│  • Punkt 3                      │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Assessment starten  →  │   │ ← CTA Button
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Component:** `MobileWelcomeScreen`  
**Implementation:** `app/components/MobileWelcomeScreen.tsx`

---

## Question Screen Pattern

```
┌─────────────────────────────────┐
│  ← Back   Stress Assessment     │ ← MobileHeader
├─────────────────────────────────┤
│  Frage 3 von 12           25%   │ ← MobileProgress (bar variant)
│  ██████░░░░░░░░░░░░░░░░░░       │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  Wie oft fühlten Sie    │   │
│  │  sich gestresst?        │   │ ← MobileCard with question
│  │                         │   │
│  │  ○ Nie                  │   │
│  │  ○ Selten               │   │ ← Answer options
│  │  ● Manchmal             │   │ (selected state)
│  │  ○ Oft                  │   │
│  │  ○ Sehr oft             │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │      Weiter →           │   │ ← Navigation button
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Component:** `MobileQuestionScreen`  
**Implementation:** `app/components/MobileQuestionScreen.tsx`

**Features:**
- Progress indicator at top
- Question in card with 24px padding
- Touch-optimized answer buttons (≥44px)
- Primary action button at bottom

---

## Result Screen Pattern

```
┌─────────────────────────────────┐
│  ← Back   Ergebnisse            │ ← MobileHeader
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │  Stress Score           │   │
│  │                         │   │
│  │      42 / 100           │   │ ← ScoreCard
│  │                         │   │
│  │   Moderates Risiko      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Wichtige Ergebnisse    │   │
│  │                         │   │
│  │  • Finding 1            │   │ ← KeyOutcomesCard
│  │  • Finding 2            │   │
│  │  • Finding 3            │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Empfohlene Maßnahmen   │   │
│  │                         │   │
│  │  [Action 1]             │   │ ← FollowUpActions
│  │  [Action 2]             │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Implementation:** `app/patient/funnel/[slug]/result/client.tsx`  
**Components:** Multiple `MobileCard` components with result data

---

## Step Progress Variants

### Bar Variant (Many Steps)

```
Frage 7 von 15              47%
█████████░░░░░░░░░░░
```

**Usage:** Questionnaires with >5 steps  
**Code:**
```tsx
<MobileProgress
  currentStep={6}
  totalSteps={15}
  variant="bar"
  showPercentage={true}
/>
```

### Steps Variant (Few Steps)

```
Schritt 2 von 4             50%
████ ████ ░░░░ ░░░░
```

**Usage:** Onboarding/wizards with 2-5 steps  
**Code:**
```tsx
<MobileProgress
  currentStep={1}
  totalSteps={4}
  variant="steps"
/>
```

---

## Spacing Examples

### Card Layout (Mobile)

```
┌─────────────────────────────────┐
│  ← 16px →                       │ ← Horizontal padding (spacing.md)
│  ┌─────────────────────────┐   │
│  │  ↕ 24px (spacing.lg)    │   │ ← Card padding
│  │                         │   │
│  │  Card Content           │   │
│  │                         │   │
│  │  ↕ 24px                 │   │
│  └─────────────────────────┘   │
│  ← 16px →                       │
└─────────────────────────────────┘
```

### Section Gaps

```
┌─────────────────────────────────┐
│  Section 1                      │
│                                 │
│  ↕ 32px gap (spacing.xl)        │
│                                 │
│  Section 2                      │
│                                 │
│  ↕ 32px gap                     │
│                                 │
│  Section 3                      │
└─────────────────────────────────┘
```

---

## Border Radius Examples

### Cards (24px)

```
  ╭───────────────────────╮
  │                       │
  │  Card with 24px       │
  │  border radius        │
  │  (radii.2xl)          │
  │                       │
  ╰───────────────────────╯
```

### Buttons (16px)

```
  ╭─────────────────╮
  │  Button 16px    │
  ╰─────────────────╯
```

### Input Fields (12px)

```
  ╭─────────────────────────╮
  │  Input Field 12px       │
  ╰─────────────────────────╯
```

### Progress Bar (pill)

```
  ╭─────────────────────╮
  │ █████████░░░░░░░░░  │
  ╰─────────────────────╯
```

---

## Touch Target Examples

### Minimum 44x44px

```
┌─────────────────────────────────┐
│                                 │
│  ┏━━━━━━━━━━━━━┓               │
│  ┃   Button    ┃  ← 44px min   │
│  ┃   (44×56)   ┃     height    │
│  ┗━━━━━━━━━━━━━┛               │
│                                 │
│  ⬜ 44×44px icon button         │
│                                 │
└─────────────────────────────────┘
```

**All interactive elements:**
- Buttons: min-h-[44px]
- Icon buttons: w-11 h-11 (44px)
- Answer options: min-h-[44px]

---

## Color Contrast Examples

### Primary Text on White

```
████████████████████████████████
█  Text: slate-900 (#0f172a)  █
█  Background: white           █
█  Contrast: 15.52:1 ✅        █
████████████████████████████████
```

### Secondary Text

```
████████████████████████████████
█  Text: slate-600 (#475569)  █
█  Background: white           █
█  Contrast: 8.6:1 ✅          █
████████████████████████████████
```

### Primary Button

```
████████████████████████████████
█  Text: white                █
█  Background: sky-600         █
█  Contrast: 4.8:1 ✅          █
████████████████████████████████
```

---

## Animation Examples

### Page Transition

```
Frame 1:        Frame 2:        Frame 3:
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Page A  │    │ Page A  │    │ Page B  │
│ opacity │ →  │ opacity │ →  │ opacity │
│   1.0   │    │   0.5   │    │   1.0   │
└─────────┘    └─────────┘    └─────────┘

Duration: 200ms (motion.duration.normal)
Easing: smooth (0.4, 0, 0.2, 1)
```

### Progress Bar Fill

```
0%:  ░░░░░░░░░░░░░░░░░░░░
     ↓ Animate over 300ms
50%: ██████████░░░░░░░░░░
     ↓ Smooth transition
100%: ████████████████████

Transition: width 300ms ease-out
```

---

## Safe Area Handling

### iPhone with Notch

```
┌─────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓ Notch ▓▓▓▓▓▓▓▓▓      │ ← env(safe-area-inset-top)
├─────────────────────────────────┤
│  Header                         │
│  padding-top: env(safe-area...) │
├─────────────────────────────────┤
│                                 │
│  Content                        │
│                                 │
├─────────────────────────────────┤
│  Bottom Nav                     │
│  padding-bottom: calc(...)      │
├─────────────────────────────────┤
│ ▓▓▓ Home Indicator ▓▓▓          │ ← env(safe-area-inset-bottom)
└─────────────────────────────────┘
```

**Formula:**
```css
/* Top */
padding-top: env(safe-area-inset-top, 0px)

/* Bottom */
padding-bottom: calc(0.625rem + env(safe-area-inset-bottom, 0px))

/* Content */
padding-top: calc(4rem + env(safe-area-inset-top, 0px))
padding-bottom: calc(6rem + env(safe-area-inset-bottom))
```

---

## Desktop Responsive Behavior

### Mobile (<768px)

```
┌─────────────────┐
│  Fixed Header   │
├─────────────────┤
│                 │
│  Content        │
│                 │
├─────────────────┤
│  Fixed Bottom   │
│  Navigation     │
└─────────────────┘
```

### Desktop (≥768px)

```
┌─────────────────────────────────┐
│  Header with Top Navigation     │
├─────────────────────────────────┤
│                                 │
│  Content (max-width: 1152px)    │
│  Centered with padding          │
│                                 │
├─────────────────────────────────┤
│  Footer                         │
└─────────────────────────────────┘
```

**Media Query:**
```css
/* Mobile (default) */
.mobile-only { display: block; }
.desktop-only { display: none; }

/* Desktop (≥768px) */
@media (min-width: 768px) {
  .mobile-only { display: none; }
  .desktop-only { display: block; }
}
```

---

## Placeholder for Actual Screenshots

> **Note**: Once the application is deployed or running locally, replace the ASCII diagrams above with actual screenshots showing:
>
> 1. **Mobile Shell** - Full screen layout on iOS device
> 2. **Welcome Screen** - Intro page with illustration
> 3. **Question Screen** - Single question with progress
> 4. **Result Screen** - Assessment results display
> 5. **Navigation** - Bottom tabs in action
> 6. **Safe Areas** - Proper handling on iPhone with notch
> 7. **Desktop View** - Responsive behavior on large screens

### Screenshot Naming Convention

- `mobile-shell-overview.png` - Full mobile shell layout
- `welcome-screen-ios.png` - Welcome/intro screen
- `question-screen-single.png` - Single question view
- `question-screen-progress.png` - Progress indicator close-up
- `result-screen-cards.png` - Result cards layout
- `bottom-navigation.png` - Bottom tabs navigation
- `safe-area-notch.png` - Safe area handling with notch
- `desktop-responsive.png` - Desktop view

---

## Testing Checklist Visual Verification

Use these screenshots to verify:

- [ ] Fixed header stays at top during scroll
- [ ] Bottom navigation stays at bottom during scroll
- [ ] Progress bar updates smoothly
- [ ] No content hidden behind notch or home indicator
- [ ] Cards have consistent 24px padding
- [ ] Buttons have 16px border radius
- [ ] Touch targets are clearly ≥44px
- [ ] Text contrast is readable (no gray on gray)
- [ ] Transitions are smooth (no jumps)
- [ ] Desktop view shows different layout

---

## Related Documentation

- [Layout Patterns](./LAYOUT_PATTERNS.md) - Detailed pattern documentation
- [iOS Style Guide](../design/ios-style-guide.md) - Native iOS guidelines
- [V0.4 Design System](../V0_4_DESIGN_SYSTEM.md) - Design system overview

---

**Maintained by**: Design System Team  
**Last Updated**: 2026-01-12  
**Version**: 0.7.0
