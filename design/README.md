# RHYTHM Design System Export

> **Version:** 0.4.1  
> **Purpose:** iOS/React Native design token export and mobile UI kit

## Overview

This directory contains the complete RHYTHM Design System exported for iOS and React Native development. All design tokens, component specifications, and integration guides are provided to ensure visual consistency between the web application and future mobile apps.

## Directory Structure

```
/design/
├── tokens/
│   └── ios.json                      # Complete design token export
├── mobile-components-reference.md     # Mobile component specifications
└── README.md                          # This file
```

## Files

### 1. Design Tokens Export

**File:** `/design/tokens/ios.json`

Complete design token export in JSON format, including:
- **colors** - Primary, neutral, semantic, and background colors with hex values
- **typography** - Font sizes (12px-36px), weights (400-700), line heights
- **spacing** - Spacing scale (8px-64px) for margins, padding, and gaps
- **radii** - Border radius values (0-24px + full rounding)
- **shadows** - Elevation system with iOS-specific shadow mappings
- **motion** - Animation durations (0-500ms), easing curves, spring configs
- **componentTokens** - Pre-configured combinations for common UI patterns

**Format:** Follows [Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) specification

**Usage:**
```typescript
// Import in React Native
import tokens from './design/tokens/ios.json'

// Access tokens
const primaryColor = tokens.colors.primary['500'].value  // '#0ea5e9'
const cardPadding = tokens.spacing.lg.value              // 24
const buttonRadius = tokens.radii.xl.value               // 16
```

### 2. Mobile Components Reference

**File:** `/design/mobile-components-reference.md`

Comprehensive visual reference guide for implementing mobile components:
- Mobile Question Card specifications
- Answer Button states and variants
- Navigation Button guidelines
- Progress Bar implementation
- Mobile Header structure
- Badge/Status Tag variants
- Info Box patterns
- Input Field states
- Card Container types
- Loading Spinner specs

Includes:
- ASCII diagrams showing component structure
- Detailed specifications (padding, radius, colors, shadows)
- State variations (default, hover, selected, pressed, disabled, error)
- Implementation examples for React Native and SwiftUI
- Layout guidelines and responsive breakpoints
- Accessibility requirements

## Documentation

### Main Documentation

**iOS Style Guide:** `/docs/design/ios-style-guide.md`

Complete integration guide for iOS development:
- Three integration paths (React Native + Expo, React Native + NativeWind, Native SwiftUI)
- Setup instructions for each platform
- Code examples for all major components
- Accessibility guidelines (44pt touch targets, WCAG contrast, VoiceOver)
- Color usage guidelines
- Typography guidelines
- Animation guidelines
- Shadow system implementation
- Best practices and testing checklist

## Integration Paths

### Option 1: React Native + Expo (Recommended)

**Best for:** Cross-platform mobile apps with web-like DX

**Setup:**
1. Create Expo app: `npx create-expo-app rhythm-mobile --template blank-typescript`
2. Copy `/design/tokens/ios.json` to your project
3. Create token loader module
4. Import and use tokens in StyleSheet

**Advantages:**
- Fast development with hot reload
- Direct token access
- Cross-platform (iOS + Android)
- Large ecosystem

### Option 2: React Native + NativeWind

**Best for:** Tailwind-like utility classes in React Native

**Setup:**
1. Install NativeWind and Tailwind CSS
2. Configure Tailwind with design tokens from `ios.json`
3. Use utility classes in components

**Advantages:**
- Tailwind-like developer experience
- Utility-first styling
- Automatic token mapping
- Smaller bundle size

### Option 3: Native SwiftUI

**Best for:** Pure native iOS apps with maximum performance

**Setup:**
1. Generate Swift constants from `ios.json`
2. Create `DesignTokens.swift` with color, spacing, typography structs
3. Use tokens in SwiftUI views

**Advantages:**
- Native iOS performance
- Best iOS ecosystem integration
- SwiftUI declarative syntax
- Compile-time type checking

## Quick Start

### React Native Example

```typescript
// 1. Import tokens
import tokens from './design/tokens/ios.json'
import { View, Text, StyleSheet } from 'react-native'

// 2. Create component
export function QuestionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  )
}

// 3. Use design tokens in styles
const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.background.light.value,
    borderRadius: tokens.radii['2xl'].value,
    padding: tokens.spacing.lg.value,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 7.5,
    elevation: 8,
  },
  title: {
    fontSize: tokens.typography.fontSize['2xl'].value,
    fontWeight: String(tokens.typography.fontWeight.bold.value),
    color: tokens.colors.neutral[900].value,
  },
})
```

### SwiftUI Example

```swift
// 1. Import design tokens (after generating Swift constants)
import SwiftUI

// 2. Create component
struct QuestionCard<Content: View>: View {
    let title: String
    let content: Content
    
    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.md) {
            Text(title)
                .font(.system(size: DesignTokens.Typography.FontSize.xxl))
                .fontWeight(DesignTokens.Typography.FontWeight.bold)
                .foregroundColor(DesignTokens.Colors.Neutral.shade900)
            
            content
        }
        .padding(DesignTokens.Spacing.lg)
        .background(Color.white)
        .cornerRadius(DesignTokens.Radii.xxl)
        .shadow(
            color: Color.black.opacity(0.1),
            radius: DesignTokens.Shadows.lg.radius,
            x: 0,
            y: DesignTokens.Shadows.lg.y
        )
    }
}
```

## Token Categories

### Colors

- **Primary (Sky Blue):** Brand color, primary actions (`#0ea5e9`)
- **Neutral (Slate):** Backgrounds, text, borders
- **Semantic:** Success (green), Warning (amber), Error (red), Info (blue)
- **Background:** Light/dark mode backgrounds and gradients

### Typography

- **Font Sizes:** xs (12px) → 4xl (36px)
- **Font Weights:** normal (400), medium (500), semibold (600), bold (700)
- **Line Heights:** tight (1.25), normal (1.5), relaxed (1.625), loose (2.0)

### Spacing

- **xs:** 8px - Minimal gaps
- **sm:** 12px - Compact elements
- **md:** 16px - Default spacing
- **lg:** 24px - Card padding
- **xl:** 32px - Major sections
- **2xl:** 48px - Page sections
- **3xl:** 64px - Hero sections

### Radii

- **sm:** 6px - Subtle rounding
- **md:** 8px - Default buttons, inputs
- **lg:** 12px - Cards, panels
- **xl:** 16px - Prominent cards
- **2xl:** 24px - Mobile cards
- **full:** 9999px - Pills, circles

### Shadows

- **sm:** Subtle depth
- **md:** Standard elevation
- **lg:** Prominent cards
- **xl:** Floating elements
- **2xl:** Maximum elevation

### Motion

- **Durations:** instant (0ms), fast (150ms), normal (200ms), moderate (300ms), slow (500ms)
- **Easing:** linear, ease, easeIn, easeOut, easeInOut, smooth, snappy, spring
- **Spring:** default, gentle, bouncy (with stiffness and damping values)

## Component Tokens

Pre-configured token combinations for common patterns:

- **mobileQuestionCard:** borderRadius (24px), padding (24px), shadow (lg)
- **answerButton:** borderRadius (16px), padding (16px), minHeight (44px)
- **navigationButton:** borderRadius (16px), padding (24px/16px), minHeight (56px)
- **progressBar:** height (8px), borderRadius (full)
- **infoBox:** borderRadius (12px), padding (16px)

## Accessibility

All design tokens follow iOS accessibility guidelines:

- **Touch Targets:** Minimum 44x44pt for all interactive elements
- **Color Contrast:** WCAG 2.1 AA compliant (4.5:1 for text, 3:1 for large text)
- **Typography:** Supports iOS Dynamic Type for font scaling
- **VoiceOver:** All component specs include accessibility label guidance

## Consistency Guarantee

This export ensures **100% visual consistency** between web and mobile:

1. **Single Source of Truth:** Tokens derived from `/lib/design-tokens.ts`
2. **Automated Export:** JSON generated programmatically (no manual sync)
3. **Version Controlled:** All changes tracked in git
4. **Type Safe:** TypeScript types can be generated from JSON
5. **Documented:** Complete integration guides and examples

## Testing Checklist

Before using in production:

- [ ] Import tokens successfully in your project
- [ ] Colors match web app exactly
- [ ] Typography scales properly on iOS devices
- [ ] Spacing feels consistent across screens
- [ ] Shadows render correctly (iOS vs Android differences noted)
- [ ] Animations are smooth (60fps target)
- [ ] Touch targets meet 44pt minimum
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] VoiceOver navigation works
- [ ] Dynamic Type scaling works

## Support

### Documentation Resources

- **iOS Style Guide:** `/docs/design/ios-style-guide.md`
- **Mobile Components Reference:** `/design/mobile-components-reference.md`
- **Web Design System:** `/docs/V0_4_DESIGN_SYSTEM.md`
- **Web Design Tokens:** `/docs/V0_4_DESIGN_TOKENS.md`

### External Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)

### Questions?

1. Check documentation first (comprehensive guides included)
2. Review code examples in iOS Style Guide
3. Test with provided component specifications
4. Consult iOS Human Interface Guidelines for platform standards
5. Open an issue in the project repository

## Changelog

### v0.4.1 (2025-12-12)

Initial iOS export release:
- ✅ Complete design token export as JSON
- ✅ Mobile component specifications with visual diagrams
- ✅ iOS Style Guide with three integration paths
- ✅ React Native and SwiftUI code examples
- ✅ Accessibility guidelines and testing checklist
- ✅ Naming conventions unified across platforms
- ✅ Consistency with web app guaranteed

## License

This design system export is part of the Rhythmologicum Connect project and follows the project's license terms.

---

**Version:** 0.4.1  
**Status:** Production Ready ✅  
**Last Updated:** 2025-12-12  
**Issue:** #5 - iOS App Style Export

For the complete iOS integration guide, see `/docs/design/ios-style-guide.md`
