# C2 — Mobile UI Components Documentation

## Overview

This document describes the mobile UI components implemented for C2, built on top of the design tokens from C1. These components provide a consistent, reusable foundation for mobile-first interfaces throughout the Rhythmologicum Connect application.

## Purpose

The C2 mobile UI components serve several key purposes:

1. **Component Reusability**: Provide standard building blocks for mobile interfaces
2. **Design Token Integration**: Fully utilize the C1 design token system for consistency
3. **Funnel Optimization**: Specifically designed for mobile funnel experiences
4. **Maintainability**: Centralize common mobile UI patterns for easier updates
5. **Developer Experience**: Provide well-typed, documented components with clear APIs

## Components

### 1. MobileCard

A versatile wrapper component for mobile content with consistent card styling.

#### Features
- Configurable padding, shadow, and border radius using design tokens
- Optional border and interactive states
- Touch-optimized with hover effects for interactive cards
- Keyboard accessible for interactive variants
- Fully customizable while maintaining design consistency

#### Props

```typescript
type MobileCardProps = {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'  // Design token-based padding variants
  shadow?: 'none' | 'sm' | 'md' | 'lg'  // Shadow depth
  radius?: 'md' | 'lg' | 'xl' | '2xl'  // Border radius
  border?: boolean  // Show/hide border
  onClick?: () => void  // Make card interactive
  interactive?: boolean  // Add hover effects
}
```

#### Usage Examples

```tsx
import { MobileCard } from '@/app/components/mobile'

// Basic card
<MobileCard>
  <p>Card content</p>
</MobileCard>

// Interactive card with custom styling
<MobileCard
  interactive
  onClick={() => navigate('/details')}
  padding="lg"
  shadow="lg"
>
  <h3>Click me</h3>
  <p>I'm an interactive card</p>
</MobileCard>

// Minimal card without border
<MobileCard padding="md" shadow="sm" border={false}>
  <p>Borderless card</p>
</MobileCard>
```

#### Design Token Mapping

- Padding: `spacing.md` (sm), `spacing.lg` (md), `componentTokens.mobileQuestionCard.padding` (lg)
- Shadow: `shadows.none/sm/md/lg`
- Radius: `radii.md/lg/xl/2xl`
- Motion: `motion.duration.normal` + `motion.easing.smooth`

---

### 2. MobileProgress

A progress indicator component that calculates progress based on funnel step data.

#### Features
- Two variants: horizontal bar or step indicators
- Calculates progress percentage automatically
- Optional step text and percentage display
- Smooth animations using design token motion values
- Theme-aware colors
- Fully accessible with ARIA attributes

#### Props

```typescript
type MobileProgressProps = {
  currentStep: number  // Current step index (0-based)
  totalSteps: number   // Total number of steps
  className?: string
  showPercentage?: boolean  // Show percentage text
  showStepText?: boolean    // Show "Step X of Y" text
  color?: string            // Custom color (defaults to primary)
  variant?: 'bar' | 'steps' // Progress style
}
```

#### Usage Examples

```tsx
import { MobileProgress } from '@/app/components/mobile'

// Basic progress bar
<MobileProgress currentStep={2} totalSteps={5} />

// Step indicators variant
<MobileProgress
  currentStep={1}
  totalSteps={4}
  variant="steps"
/>

// Minimal bar without text
<MobileProgress
  currentStep={3}
  totalSteps={6}
  showStepText={false}
  showPercentage={false}
/>

// Custom color (e.g., success green)
<MobileProgress
  currentStep={4}
  totalSteps={5}
  color={colors.semantic.success}
/>
```

#### Variants

**Bar Variant** (default)
- Horizontal progress bar
- Shows "Frage X von Y" text
- Shows percentage
- Smooth fill animation

**Steps Variant**
- Individual step indicators
- Shows "Schritt X von Y" text
- Visual feedback for completed/current/pending steps
- Better for smaller step counts (≤ 8 recommended)

#### Design Token Usage

- Height: `componentTokens.progressBar.height`
- Radius: `componentTokens.progressBar.borderRadius`
- Transition: `componentTokens.progressBar.transition`
- Font sizes: `typography.fontSize.sm` and `typography.fontSize.xs`
- Colors: `colors.primary[500]` (default), `colors.neutral[200]` (background)

---

### 3. MobileSectionTitle

A consistent heading component for mobile funnel and content sections.

#### Features
- Multiple size variants for different hierarchy levels
- Optional subtitle for additional context
- Optional icon/emoji support
- Configurable alignment and spacing
- Consistent typography using design tokens
- Semantic HTML with proper heading tags

#### Props

```typescript
type MobileSectionTitleProps = {
  children: ReactNode
  subtitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'  // Size variant
  align?: 'left' | 'center' | 'right'  // Text alignment
  icon?: ReactNode  // Icon or emoji
  marginBottom?: boolean  // Add bottom margin
}
```

#### Usage Examples

```tsx
import { MobileSectionTitle } from '@/app/components/mobile'

// Basic heading
<MobileSectionTitle>
  Willkommen
</MobileSectionTitle>

// With subtitle and icon
<MobileSectionTitle
  size="lg"
  subtitle="Bitte wählen Sie eine Antwort"
  icon="📋"
>
  Stress Assessment
</MobileSectionTitle>

// Centered heading
<MobileSectionTitle
  size="xl"
  align="center"
  marginBottom
>
  Ihre Ergebnisse
</MobileSectionTitle>

// Small heading without margin
<MobileSectionTitle
  size="sm"
  marginBottom={false}
>
  Zusätzliche Informationen
</MobileSectionTitle>
```

#### Size Variants

| Size | Font Size | Font Weight | Use Case |
|------|-----------|-------------|----------|
| `sm` | `typography.fontSize.lg` (18px) | semibold | Minor sections, labels |
| `md` | `typography.fontSize.xl` (20px) | semibold | Standard section headings |
| `lg` | `typography.fontSize.2xl` (24px) | bold | Major sections, page titles |
| `xl` | `typography.fontSize.3xl` (30px) | bold | Hero sections, main titles |

#### Design Token Usage

- Font sizes: `typography.fontSize.lg/xl/2xl/3xl`
- Font weights: `typography.fontWeight.semibold/bold`
- Line height: `typography.lineHeight.tight` (headings), `typography.lineHeight.relaxed` (subtitles)

---

## Integration with Existing Components

### MobileQuestionCard Refactoring

The `MobileQuestionCard` component has been updated to use the `MobileProgress` component instead of inline progress bar code. This demonstrates how the new components can be integrated into existing code:

**Before:**
```tsx
// Inline progress bar with duplicated design token logic
<div className="w-full bg-slate-200 overflow-hidden" style={{ ... }}>
  <div className="bg-sky-500" style={{ width: `${progressPercent}%`, ... }} />
</div>
```

**After:**
```tsx
// Clean, reusable component
<MobileProgress 
  currentStep={currentQuestionIndex} 
  totalSteps={totalQuestions} 
/>
```

**Benefits:**
- Reduced code duplication
- Easier to maintain and update
- Consistent progress bar styling across the app
- Simpler to add new features (e.g., step indicators)

---

## Convenience Export

All mobile components are available through a single import path:

```tsx
import {
  MobileCard,
  MobileProgress,
  MobileSectionTitle,
  MobileAnswerButton,
  MobileQuestionCard,
} from '@/app/components/mobile'
```

This is defined in `app/components/mobile.ts` and includes both new C2 components and existing mobile components for convenience.

---

## Demo Page

A comprehensive demo page is available at `/patient/mobile-components-demo` that showcases:

- All component variants
- Different configurations and props
- Design token integration
- Real-world usage examples
- Combined component patterns

To view the demo:
```bash
npm run dev
# Navigate to http://localhost:3000/patient/mobile-components-demo
```

---

## Best Practices

### DO:

✅ Use `MobileCard` for any content container in mobile views  
✅ Use `MobileProgress` for all funnel progress indicators  
✅ Use `MobileSectionTitle` for consistent heading hierarchy  
✅ Leverage design tokens through component props  
✅ Combine components to create rich mobile UIs  
✅ Keep interactive cards keyboard accessible  

### DON'T:

❌ Create custom card wrappers when `MobileCard` suffices  
❌ Hardcode progress bars when `MobileProgress` is available  
❌ Mix different heading styles when using `MobileSectionTitle`  
❌ Override component styles excessively (use props instead)  
❌ Forget to test on actual mobile devices  

---

## Accessibility

All components follow accessibility best practices:

- **MobileCard**: Proper keyboard navigation for interactive variants, semantic role attributes
- **MobileProgress**: ARIA progressbar attributes, descriptive labels
- **MobileSectionTitle**: Semantic heading tags, proper hierarchy

---

## Performance

All components are optimized for mobile performance:

- Minimal re-renders using React best practices
- CSS transitions for smooth animations (GPU-accelerated)
- Lightweight component structure
- Design tokens prevent inline style recalculation

---

## Testing

To test the components:

1. **Type Safety**: Components are fully typed with TypeScript
   ```bash
   npx tsc --noEmit
   ```

2. **Visual Testing**: Use the demo page
   ```bash
   npm run dev
   # Visit /patient/mobile-components-demo
   ```

3. **Integration Testing**: Check existing usage
   - MobileQuestionCard uses MobileProgress
   - Test in actual funnel flows

4. **Mobile Device Testing**: Test on real devices
   - iOS Safari
   - Android Chrome
   - Various screen sizes

---

## Future Enhancements

Potential future additions to the mobile component library:

1. **MobileBottomSheet**: Modal-like component anchored to bottom
2. **MobileNavBar**: Consistent navigation bar for mobile views
3. **MobileActionButton**: Floating action button (FAB) pattern
4. **MobileTabs**: Tab navigation component
5. **MobileAccordion**: Expandable/collapsible content sections

---

## Related Documentation

- [C1 Design Tokens Documentation](./C1_DESIGN_TOKENS.md) - Design token system
- [v0.3 Issues](./v0.3_issues.md) - Epic C roadmap
- Component source files:
  - `app/components/MobileCard.tsx`
  - `app/components/MobileProgress.tsx`
  - `app/components/MobileSectionTitle.tsx`
  - `app/components/mobile.ts` (exports)
  - `app/patient/mobile-components-demo/page.tsx` (demo)

---

## Changelog

### v0.3 - Initial Implementation (2024-12)
- Created MobileCard component with configurable styling
- Created MobileProgress component with bar and steps variants
- Created MobileSectionTitle component with size variants
- Integrated MobileProgress into MobileQuestionCard
- Created comprehensive demo page
- Created convenience export module
- Added full TypeScript types and documentation

---

## Support

For questions or issues with the mobile UI components:

1. Check this documentation
2. Review the demo page at `/patient/mobile-components-demo`
3. Check component source code for inline documentation
4. Review the C1 design tokens documentation
5. Consult the team lead or open an issue
