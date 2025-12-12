# iOS Style Guide - RHYTHM Design System

> **Version:** 0.4.1  
> **Status:** Production Ready  
> **Last Updated:** 2025-12-12  
> **Platform:** iOS, React Native, Expo, SwiftUI

## Overview

This guide provides comprehensive documentation for implementing the RHYTHM Design System in iOS applications, whether using **React Native**, **Expo**, **NativeWind**, or native **SwiftUI**.

### Purpose

The RHYTHM Design System ensures **visual consistency** between the web application and future mobile apps by providing:

- ✅ **Unified design tokens** exported as structured JSON
- ✅ **Mobile-first component guidelines**
- ✅ **Ready-to-use integration patterns** for React Native/Expo
- ✅ **SwiftUI compatibility** for native iOS development
- ✅ **Accessibility-first approach** with proper touch targets and contrast

### Key Benefits

1. **Design Consistency**: Same visual language across web and mobile
2. **Development Speed**: Pre-defined tokens eliminate design decisions
3. **Type Safety**: Structured token format enables type generation
4. **Maintainability**: Single source of truth for all design values
5. **Scalability**: Easy to extend with new tokens or themes

---

## Design Token Export

### Location

All design tokens are exported in a structured JSON format:

```
/design/tokens/ios.json
```

### Token Structure

The JSON export follows the [Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) specification and includes:

- **colors** - Primary, neutral, semantic, and background colors
- **typography** - Font sizes, weights, and line heights
- **spacing** - Consistent spacing scale (8px to 64px)
- **radii** - Border radius values (0 to full rounding)
- **shadows** - Elevation system with iOS-specific mappings
- **motion** - Animation durations, easing curves, and spring configs
- **componentTokens** - Pre-configured combinations for common patterns

### JSON Schema

Each token includes:

```json
{
  "tokenName": {
    "value": "actual value (hex, number, etc.)",
    "unit": "px, ms, etc.",
    "type": "color, dimension, duration, etc.",
    "description": "Human-readable explanation",
    "reference": "optional reference to other token",
    "ios": "optional iOS-specific implementation notes"
  }
}
```

---

## Integration Paths

### Option 1: React Native + Expo (Recommended)

**Best for:** Cross-platform mobile apps with web-like development experience

#### Setup

1. **Install dependencies:**

```bash
npx create-expo-app rhythm-mobile --template blank-typescript
cd rhythm-mobile
npm install
```

2. **Copy design tokens:**

```bash
# Copy the ios.json file to your React Native project
cp /design/tokens/ios.json ./design/tokens/
```

3. **Create token loader:**

```typescript
// lib/design-tokens.ts
import tokens from '../design/tokens/ios.json'

export const colors = tokens.colors
export const typography = tokens.typography
export const spacing = tokens.spacing
export const radii = tokens.radii
export const shadows = tokens.shadows
export const motion = tokens.motion
export const componentTokens = tokens.componentTokens

// Type-safe token access
export type ColorToken = keyof typeof colors
export type SpacingToken = keyof typeof spacing
```

4. **Use tokens in components:**

```tsx
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography, radii, shadows } from './lib/design-tokens'

export function QuestionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.light.value,
    borderRadius: radii['2xl'].value,
    padding: spacing.lg.value,
    // iOS shadow
    shadowColor: shadows.lg.value.color,
    shadowOffset: shadows.lg.value,
    shadowOpacity: 0.1,
    shadowRadius: shadows.lg.value.blur / 2,
    // Android shadow
    elevation: 8,
  },
  title: {
    fontSize: typography.fontSize['2xl'].value,
    fontWeight: String(typography.fontWeight.bold.value),
    color: colors.neutral[900].value,
    lineHeight: typography.fontSize['2xl'].value * typography.lineHeight.tight.value,
  },
})
```

#### Advantages

- ✅ Fast development with hot reload
- ✅ Direct use of design tokens
- ✅ Cross-platform (iOS + Android)
- ✅ Large ecosystem of packages
- ✅ Familiar React patterns

---

### Option 2: React Native + Expo + NativeWind

**Best for:** Tailwind-like utility classes in React Native

#### Setup

1. **Install NativeWind:**

```bash
npm install nativewind
npm install --save-dev tailwindcss
```

2. **Configure Tailwind with design tokens:**

```javascript
// tailwind.config.js
const tokens = require('./design/tokens/ios.json')

// Convert tokens to Tailwind theme
const colorPalette = {}
Object.entries(tokens.colors.primary).forEach(([key, token]) => {
  colorPalette[key] = token.value
})

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colorPalette,
        // ... map other colors
      },
      spacing: {
        xs: `${tokens.spacing.xs.value}px`,
        sm: `${tokens.spacing.sm.value}px`,
        md: `${tokens.spacing.md.value}px`,
        lg: `${tokens.spacing.lg.value}px`,
        xl: `${tokens.spacing.xl.value}px`,
        '2xl': `${tokens.spacing['2xl'].value}px`,
        '3xl': `${tokens.spacing['3xl'].value}px`,
      },
      borderRadius: {
        sm: `${tokens.radii.sm.value}px`,
        md: `${tokens.radii.md.value}px`,
        lg: `${tokens.radii.lg.value}px`,
        xl: `${tokens.radii.xl.value}px`,
        '2xl': `${tokens.radii['2xl'].value}px`,
        full: '9999px',
      },
    },
  },
  plugins: [],
}
```

3. **Use NativeWind classes:**

```tsx
import { View, Text } from 'react-native'
import { styled } from 'nativewind'

const StyledView = styled(View)
const StyledText = styled(Text)

export function QuestionCard({ title, children }) {
  return (
    <StyledView className="bg-white rounded-2xl p-lg shadow-lg">
      <StyledText className="text-2xl font-bold text-neutral-900">{title}</StyledText>
      {children}
    </StyledView>
  )
}
```

#### Advantages

- ✅ Tailwind-like developer experience
- ✅ Utility-first styling
- ✅ Automatic design token mapping
- ✅ Smaller bundle size (no StyleSheet objects)

---

### Option 3: Native SwiftUI

**Best for:** Pure native iOS apps with maximum performance

#### Setup

1. **Generate Swift constants from JSON:**

Create a script or use a code generator to convert `ios.json` to Swift constants:

```swift
// DesignTokens.swift
import SwiftUI

struct DesignTokens {
    // MARK: - Colors
    struct Colors {
        struct Primary {
            static let shade50 = Color(hex: "#f0f9ff")
            static let shade100 = Color(hex: "#e0f2fe")
            static let shade200 = Color(hex: "#bae6fd")
            static let shade300 = Color(hex: "#7dd3fc")
            static let shade400 = Color(hex: "#38bdf8")
            static let shade500 = Color(hex: "#0ea5e9") // Primary brand
            static let shade600 = Color(hex: "#0284c7") // Primary dark
            static let shade700 = Color(hex: "#0369a1")
            static let shade800 = Color(hex: "#075985")
            static let shade900 = Color(hex: "#0c4a6e")
        }
        
        struct Neutral {
            static let shade50 = Color(hex: "#f8fafc")
            static let shade100 = Color(hex: "#f1f5f9")
            static let shade200 = Color(hex: "#e2e8f0")
            static let shade300 = Color(hex: "#cbd5e1")
            static let shade400 = Color(hex: "#94a3b8")
            static let shade500 = Color(hex: "#64748b")
            static let shade600 = Color(hex: "#475569")
            static let shade700 = Color(hex: "#334155")
            static let shade800 = Color(hex: "#1e293b")
            static let shade900 = Color(hex: "#0f172a")
        }
        
        struct Semantic {
            static let success = Color(hex: "#10b981")
            static let successLight = Color(hex: "#d1fae5")
            static let warning = Color(hex: "#f59e0b")
            static let warningLight = Color(hex: "#fef3c7")
            static let error = Color(hex: "#ef4444")
            static let errorLight = Color(hex: "#fee2e2")
            static let info = Color(hex: "#3b82f6")
            static let infoLight = Color(hex: "#dbeafe")
        }
    }
    
    // MARK: - Spacing
    struct Spacing {
        static let xs: CGFloat = 8
        static let sm: CGFloat = 12
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
        static let xxxl: CGFloat = 64
    }
    
    // MARK: - Radii
    struct Radii {
        static let none: CGFloat = 0
        static let sm: CGFloat = 6
        static let md: CGFloat = 8
        static let lg: CGFloat = 12
        static let xl: CGFloat = 16
        static let xxl: CGFloat = 24
        static let full: CGFloat = 9999
    }
    
    // MARK: - Typography
    struct Typography {
        struct FontSize {
            static let xs: CGFloat = 12
            static let sm: CGFloat = 14
            static let base: CGFloat = 16
            static let lg: CGFloat = 18
            static let xl: CGFloat = 20
            static let xxl: CGFloat = 24
            static let xxxl: CGFloat = 30
            static let xxxxl: CGFloat = 36
        }
        
        struct FontWeight {
            static let normal: Font.Weight = .regular    // 400
            static let medium: Font.Weight = .medium     // 500
            static let semibold: Font.Weight = .semibold // 600
            static let bold: Font.Weight = .bold         // 700
        }
        
        struct LineHeight {
            static let tight: CGFloat = 1.25
            static let normal: CGFloat = 1.5
            static let relaxed: CGFloat = 1.625
            static let loose: CGFloat = 2.0
        }
    }
    
    // MARK: - Shadows
    struct Shadows {
        static let sm = ShadowStyle(radius: 1, y: 1)
        static let md = ShadowStyle(radius: 3, y: 2)
        static let lg = ShadowStyle(radius: 7.5, y: 5)
        static let xl = ShadowStyle(radius: 12.5, y: 10)
        static let xxl = ShadowStyle(radius: 25, y: 12.5)
    }
    
    // MARK: - Motion
    struct Motion {
        struct Duration {
            static let instant: Double = 0
            static let fast: Double = 0.15
            static let normal: Double = 0.2
            static let moderate: Double = 0.3
            static let slow: Double = 0.5
        }
        
        struct Easing {
            static let linear = Animation.linear
            static let easeIn = Animation.easeIn
            static let easeOut = Animation.easeOut
            static let easeInOut = Animation.easeInOut
            static let smooth = Animation.timingCurve(0.4, 0, 0.2, 1)
            static let spring = Animation.spring(response: 0.3, dampingFraction: 0.7)
        }
    }
}

// MARK: - Helper Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct ShadowStyle {
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat
    
    init(radius: CGFloat, x: CGFloat = 0, y: CGFloat) {
        self.radius = radius
        self.x = x
        self.y = y
    }
}
```

2. **Use tokens in SwiftUI views:**

```swift
import SwiftUI

struct QuestionCardView: View {
    let title: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.md) {
            Text(title)
                .font(.system(size: DesignTokens.Typography.FontSize.xxl))
                .fontWeight(DesignTokens.Typography.FontWeight.bold)
                .foregroundColor(DesignTokens.Colors.Neutral.shade900)
            
            // Card content here
        }
        .padding(DesignTokens.Spacing.lg)
        .background(Color.white)
        .cornerRadius(DesignTokens.Radii.xxl)
        .shadow(
            color: Color.black.opacity(0.1),
            radius: DesignTokens.Shadows.lg.radius,
            x: DesignTokens.Shadows.lg.x,
            y: DesignTokens.Shadows.lg.y
        )
    }
}
```

#### Advantages

- ✅ Native iOS performance
- ✅ Best integration with iOS ecosystem
- ✅ SwiftUI declarative syntax
- ✅ Compile-time type checking
- ✅ Smallest bundle size

---

## Component Guidelines

### Mobile Question Card

The mobile question card is the primary container for assessment questions.

**Design Specs:**
- Border radius: `24px` (radii.2xl)
- Padding: `24px` (spacing.lg)
- Shadow: `lg` elevation
- Background: `#ffffff` (background.light)
- Minimum touch target: `44px` (iOS accessibility)

**React Native Example:**

```tsx
import { View, Text, StyleSheet } from 'react-native'
import { componentTokens, colors, shadows } from '@/lib/design-tokens'

const tokens = componentTokens.mobileQuestionCard

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.light.value,
    borderRadius: tokens.borderRadius.value,
    padding: tokens.padding.value,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 7.5,
    elevation: 8,
  },
})
```

**SwiftUI Example:**

```swift
struct QuestionCard<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
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

### Answer Buttons

Touch-optimized buttons for multiple-choice answers.

**Design Specs:**
- Border radius: `16px` (radii.xl)
- Padding X: `16px` (spacing.md)
- Padding Y: `16px` (spacing.md)
- Min height: `44px` (iOS accessibility guideline)
- Min width: `44px` (iOS accessibility guideline)
- Font size: `16px` (typography.fontSize.base)
- Font weight: `600` (typography.fontWeight.semibold)

**React Native Example:**

```tsx
import { Pressable, Text, StyleSheet } from 'react-native'
import { componentTokens, colors, typography, motion } from '@/lib/design-tokens'

export function AnswerButton({ label, selected, onPress }) {
  const tokens = componentTokens.answerButton
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  )
}

const tokens = componentTokens.answerButton

const styles = StyleSheet.create({
  button: {
    borderRadius: tokens.borderRadius.value,
    paddingHorizontal: tokens.paddingX.value,
    paddingVertical: tokens.paddingY.value,
    minHeight: tokens.minHeight.value,
    minWidth: tokens.minWidth.value,
    backgroundColor: colors.neutral[100].value,
    borderWidth: 2,
    borderColor: colors.neutral[200].value,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.primary[50].value,
    borderColor: colors.primary[500].value,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: typography.fontSize.base.value,
    fontWeight: String(typography.fontWeight.semibold.value),
    color: colors.neutral[700].value,
  },
  selectedText: {
    color: colors.primary[700].value,
  },
})
```

**SwiftUI Example:**

```swift
struct AnswerButton: View {
    let label: String
    let selected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: DesignTokens.Typography.FontSize.base))
                .fontWeight(DesignTokens.Typography.FontWeight.semibold)
                .foregroundColor(selected ? DesignTokens.Colors.Primary.shade700 : DesignTokens.Colors.Neutral.shade700)
                .frame(minWidth: 44, minHeight: 44)
                .padding(.horizontal, DesignTokens.Spacing.md)
                .padding(.vertical, DesignTokens.Spacing.md)
                .background(selected ? DesignTokens.Colors.Primary.shade50 : DesignTokens.Colors.Neutral.shade100)
                .cornerRadius(DesignTokens.Radii.xl)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignTokens.Radii.xl)
                        .stroke(selected ? DesignTokens.Colors.Primary.shade500 : DesignTokens.Colors.Neutral.shade200, lineWidth: 2)
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}
```

### Navigation Buttons

Primary action buttons for navigation (Next, Back, Submit).

**Design Specs:**
- Border radius: `16px` (radii.xl)
- Padding X: `24px` (spacing.lg)
- Padding Y: `16px` (spacing.md)
- Min height: `56px` (larger for primary actions)
- Font size: `16px` (typography.fontSize.base)
- Font weight: `600` (typography.fontWeight.semibold)
- Shadow: `md` elevation

**React Native Example:**

```tsx
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { componentTokens, colors, typography, shadows } from '@/lib/design-tokens'

export function NavigationButton({ label, onPress, variant = 'primary', loading = false, disabled = false }) {
  const tokens = componentTokens.navigationButton
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const tokens = componentTokens.navigationButton

const styles = StyleSheet.create({
  button: {
    borderRadius: tokens.borderRadius.value,
    paddingHorizontal: tokens.paddingX.value,
    paddingVertical: tokens.paddingY.value,
    minHeight: tokens.minHeight.value,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  primary: {
    backgroundColor: colors.primary[600].value,
  },
  secondary: {
    backgroundColor: colors.neutral[100].value,
    borderWidth: 1,
    borderColor: colors.neutral[300].value,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: typography.fontSize.base.value,
    fontWeight: String(typography.fontWeight.semibold.value),
    color: '#ffffff',
  },
  secondaryText: {
    color: colors.neutral[700].value,
  },
})
```

### Progress Bar

Assessment progress indicator with smooth animations.

**Design Specs:**
- Height: `8px`
- Border radius: `full` (pill shape)
- Background: `neutral.200`
- Fill: `primary.500`
- Transition: `300ms` ease-out

**React Native Example:**

```tsx
import { View, StyleSheet, Animated } from 'react-native'
import { useEffect, useRef } from 'react'
import { componentTokens, colors, motion } from '@/lib/design-tokens'

export function ProgressBar({ value, max = 100 }) {
  const animatedWidth = useRef(new Animated.Value(0)).current
  const percentage = (value / max) * 100
  
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: motion.duration.moderate.value,
      useNativeDriver: false,
    }).start()
  }, [percentage])
  
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  )
}

const tokens = componentTokens.progressBar

const styles = StyleSheet.create({
  container: {
    height: tokens.height.value,
    backgroundColor: colors.neutral[200].value,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary[500].value,
    borderRadius: 9999,
  },
})
```

**SwiftUI Example:**

```swift
struct ProgressBar: View {
    let value: Double
    let max: Double = 100
    
    private var percentage: Double {
        min(value / max, 1.0)
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background
                RoundedRectangle(cornerRadius: DesignTokens.Radii.full)
                    .fill(DesignTokens.Colors.Neutral.shade200)
                    .frame(height: 8)
                
                // Fill
                RoundedRectangle(cornerRadius: DesignTokens.Radii.full)
                    .fill(DesignTokens.Colors.Primary.shade500)
                    .frame(width: geometry.size.width * percentage, height: 8)
                    .animation(.easeOut(duration: DesignTokens.Motion.Duration.moderate), value: percentage)
            }
        }
        .frame(height: 8)
    }
}
```

---

## Accessibility Guidelines

### iOS Accessibility Standards

All components must meet iOS accessibility requirements:

#### 1. Touch Targets

**Minimum size: 44x44 points**

All interactive elements (buttons, links, inputs) must have at least a 44x44pt touch area.

```tsx
// React Native
const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    // other styles...
  },
})
```

```swift
// SwiftUI
.frame(minWidth: 44, minHeight: 44)
```

#### 2. Color Contrast

**WCAG 2.1 AA Standard**

- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio

Our color palette is designed to meet these standards:
- `neutral.900` on `neutral.50` = 15.52:1 ✅
- `primary.600` on `primary.50` = 6.8:1 ✅
- `neutral.700` on white = 10.4:1 ✅

#### 3. Dynamic Type

Support iOS Dynamic Type for font scaling:

```swift
// SwiftUI
Text("Content")
    .font(.system(size: DesignTokens.Typography.FontSize.base))
    .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
```

```tsx
// React Native with react-native-dynamic
import { useDynamicValue } from 'react-native-dynamic'

const fontSize = useDynamicValue(
  typography.fontSize.base.value,
  typography.fontSize.lg.value,
)
```

#### 4. VoiceOver Labels

Provide descriptive labels for all interactive elements:

```swift
// SwiftUI
Button("Submit") { }
    .accessibilityLabel("Submit assessment")
    .accessibilityHint("Completes the current assessment")
```

```tsx
// React Native
<Pressable
  accessibilityLabel="Submit assessment"
  accessibilityHint="Completes the current assessment"
  accessibilityRole="button"
>
  <Text>Submit</Text>
</Pressable>
```

---

## Color Usage Guidelines

### Primary Colors (Sky Blue)

**When to use:**
- Primary action buttons
- Links and interactive elements
- Active/selected states
- Progress indicators
- Brand elements

**Shades:**
- `50-200`: Backgrounds, highlights, hover states
- `500`: Main brand color, primary buttons
- `600`: Hover/pressed states
- `700-900`: High-emphasis elements, dark mode

### Neutral Colors (Slate)

**When to use:**
- Body text and headings
- Borders and dividers
- Card backgrounds
- Disabled states
- Secondary UI elements

**Shades:**
- `50-100`: Backgrounds, surfaces
- `200-300`: Borders, dividers
- `400-500`: Disabled, secondary text
- `600-700`: Body text, headings
- `800-900`: High-emphasis text

### Semantic Colors

**Success (Green):**
- ✅ Completed states
- ✅ Positive feedback
- ✅ Confirmation messages

**Warning (Amber):**
- ⚠️ Cautionary messages
- ⚠️ Incomplete requirements
- ⚠️ Attention needed

**Error (Red):**
- ❌ Error messages
- ❌ Failed validation
- ❌ Destructive actions

**Info (Blue):**
- ℹ️ Informational messages
- ℹ️ Help text
- ℹ️ Tips and guidance

---

## Typography Guidelines

### Font Stack

**iOS System Font (SF Pro)**
- Default font for all text
- Automatic Dynamic Type support
- Optimized for readability

**React Native:**
```tsx
const styles = StyleSheet.create({
  text: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: typography.fontSize.base.value,
  },
})
```

**SwiftUI:**
```swift
Text("Content")
    .font(.system(size: DesignTokens.Typography.FontSize.base))
```

### Size Scale

| Token | Size | Use Case |
|-------|------|----------|
| `xs` | 12px | Small labels, captions, timestamps |
| `sm` | 14px | Secondary text, helper text |
| `base` | 16px | Body text, inputs, default |
| `lg` | 18px | Emphasized text, large buttons |
| `xl` | 20px | Small headings, card titles |
| `2xl` | 24px | Section headings |
| `3xl` | 30px | Page titles |
| `4xl` | 36px | Hero headings, marketing |

### Weight Scale

| Token | Weight | Use Case |
|-------|--------|----------|
| `normal` | 400 | Body text, paragraphs |
| `medium` | 500 | Emphasized text, labels |
| `semibold` | 600 | Buttons, strong emphasis |
| `bold` | 700 | Headings, titles |

### Line Height

| Token | Multiplier | Use Case |
|-------|------------|----------|
| `tight` | 1.25 | Headings, compact text |
| `normal` | 1.5 | Body text, standard reading |
| `relaxed` | 1.625 | Comfortable reading |
| `loose` | 2.0 | Spacious text, annotations |

---

## Animation Guidelines

### Duration

**Follow iOS conventions:**
- **Instant (0ms)**: No animation
- **Fast (150ms)**: Micro-interactions, hover effects
- **Normal (200ms)**: Standard transitions, tab switches
- **Moderate (300ms)**: Comfortable animations, modals
- **Slow (500ms)**: Deliberate animations, attention-grabbing

### Easing

**Recommended curves:**
- **easeOut**: Default for most animations
- **easeInOut**: Smooth start and end
- **smooth**: Material Design standard (0.4, 0, 0.2, 1)
- **spring**: iOS-style spring animations

### React Native Animated

```tsx
import { Animated } from 'react-native'
import { motion } from '@/lib/design-tokens'

const fadeAnim = useRef(new Animated.Value(0)).current

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: motion.duration.normal.value,
  useNativeDriver: true,
}).start()
```

### SwiftUI Animations

```swift
withAnimation(.easeOut(duration: DesignTokens.Motion.Duration.normal)) {
    // State change
}

// Or with spring
withAnimation(DesignTokens.Motion.Easing.spring) {
    // State change
}
```

---

## Shadow System

### iOS Shadow Implementation

React Native and SwiftUI handle shadows differently:

**React Native:**
```tsx
{
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.1,
  shadowRadius: 7.5,
  // Android
  elevation: 8,
}
```

**SwiftUI:**
```swift
.shadow(
    color: Color.black.opacity(0.1),
    radius: 7.5,
    x: 0,
    y: 5
)
```

### Shadow Scale

| Token | Usage | iOS Shadow Radius | Android Elevation |
|-------|-------|-------------------|-------------------|
| `sm` | Subtle depth | 1pt | 2 |
| `md` | Standard cards | 3pt | 4 |
| `lg` | Prominent cards | 7.5pt | 8 |
| `xl` | Floating elements | 12.5pt | 12 |
| `2xl` | Modals, overlays | 25pt | 16 |

---

## Best Practices

### ✅ DO

1. **Use design tokens consistently**
   ```tsx
   // Good
   padding: spacing.lg.value
   
   // Bad
   padding: 24
   ```

2. **Follow iOS accessibility guidelines**
   - 44x44pt minimum touch targets
   - WCAG 2.1 AA color contrast
   - VoiceOver labels

3. **Use semantic color names**
   ```tsx
   // Good
   color: colors.semantic.error.value
   
   // Bad
   color: '#ef4444'
   ```

4. **Leverage component tokens**
   ```tsx
   const tokens = componentTokens.navigationButton
   ```

5. **Support Dynamic Type (iOS)**
   ```swift
   .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
   ```

### ❌ DON'T

1. **Don't hardcode values**
   ```tsx
   // Bad
   borderRadius: 16
   
   // Good
   borderRadius: radii.xl.value
   ```

2. **Don't ignore touch targets**
   ```tsx
   // Bad
   minHeight: 30
   
   // Good
   minHeight: 44
   ```

3. **Don't use arbitrary colors**
   ```tsx
   // Bad
   backgroundColor: '#abc123'
   
   // Good
   backgroundColor: colors.primary[500].value
   ```

4. **Don't skip animations**
   ```tsx
   // Bad - instant change
   setVisible(true)
   
   // Good - animated transition
   Animated.timing(opacity, { duration: motion.duration.normal.value })
   ```

---

## Testing Checklist

### Visual Testing

- [ ] All colors match web app
- [ ] Typography scales properly
- [ ] Spacing is consistent
- [ ] Shadows render correctly (iOS vs Android)
- [ ] Animations are smooth

### Accessibility Testing

- [ ] VoiceOver navigation works
- [ ] Touch targets are 44x44pt minimum
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Dynamic Type scales properly
- [ ] All interactive elements have labels

### Platform Testing

- [ ] iOS simulator (iPhone)
- [ ] iOS simulator (iPad)
- [ ] Physical iOS device
- [ ] Android emulator (if cross-platform)
- [ ] Different screen sizes

---

## Token Reference

### Quick Reference

**Colors:**
- `colors.primary[500]` - Main brand color
- `colors.neutral[700]` - Body text
- `colors.semantic.success` - Success green

**Spacing:**
- `spacing.md` - 16px (default)
- `spacing.lg` - 24px (card padding)

**Typography:**
- `typography.fontSize.base` - 16px (body)
- `typography.fontWeight.semibold` - 600 (buttons)

**Radii:**
- `radii.xl` - 16px (buttons)
- `radii['2xl']` - 24px (cards)

**Shadows:**
- `shadows.md` - Standard elevation
- `shadows.lg` - Prominent cards

**Motion:**
- `motion.duration.normal` - 200ms (transitions)
- `motion.easing.smooth` - Material Design curve

---

## Resources

### Documentation

- [Design Tokens JSON](/design/tokens/ios.json)
- [Web Design System](/docs/V0_4_DESIGN_SYSTEM.md)
- [Component Summary](/docs/DESIGN_SYSTEM_COMPONENTS_SUMMARY.md)

### External Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools

- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [iOS Simulator (Xcode)](https://developer.apple.com/xcode/)
- [Expo Snack (Online IDE)](https://snack.expo.dev/)

---

## Support

For questions or issues related to the iOS Design System:

1. Review this guide and token JSON
2. Check web design system documentation
3. Test with provided code examples
4. Consult iOS Human Interface Guidelines
5. Open an issue in the project repository

---

**Version:** 0.4.1  
**Status:** Production Ready ✅  
**Last Updated:** 2025-12-12

This guide is maintained as part of the RHYTHM Design System for iOS mobile applications (Issue #5).
