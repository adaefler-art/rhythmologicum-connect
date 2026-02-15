# V0.4 Mobile Question Screen Implementation

> Issue #6: Patient Mobile – Question Screen (Adaptive Questionnaire)  
> Date: 2025-12-12  
> Status: Completed

## Overview

Complete rebuild of the patient question screen with a modern, mobile-first adaptive layout. The new design provides an optimal user experience on mobile devices (<640px) while maintaining desktop compatibility.

## Key Features

### 1. **Top Progress Indicator (Sticky)**

- Sticky header that remains visible during scroll
- Shows current question number and total questions
- Animated progress bar with percentage
- Funnel title/subtitle display
- Gradient background for visual appeal

### 2. **Question Block (Scrollable Content)**

- Clean, card-based question display
- Question text with proper typography hierarchy
- Optional help text with icon
- Required field indicators
- Visual feedback (border color changes when answered)
- Focus states for accessibility
- Smooth animations on mount

### 3. **Answer Components**

Support for all funnel question types:

#### Scale Questions (Buttons 1-5)

- Touch-optimized button grid
- 44px minimum touch targets
- Visual state feedback (checked/unchecked)
- Scale animation on selection
- Support for any min/max range
- Customizable labels

#### Slider (Continuous Scale)

- NEW: Alternative to button-based scales
- Large value display with gradient background
- Visual track with fill animation
- Touch-optimized 32px thumb
- Automatic use for ranges > 10
- Optional manual activation via `useSlider` prop
- Accessible with keyboard support

#### Binary (Yes/No, True/False)

- Two large, equal-width buttons
- Clear labeling
- Touch-optimized

#### Single Choice (Chips/Multiple Options)

- Flexible grid or vertical layout
- Auto-layout based on option count
- Support for sublabels
- Touch-optimized

#### Text Input (Textarea)

- Multi-line text input
- Focus states
- Proper padding and sizing

### 4. **Bottom Action Bar (Sticky)**

- Sticky footer navigation
- Back button (hidden on first question)
- Next/Complete button
  - Disabled until question is answered
  - Shows loading state during submission
  - Gradient background when enabled
  - Changes text to "Abschließen" on last question
- Touch-optimized (56px minimum height)
- Tap animation feedback

### 5. **Error Handling**

- Validation error messages
- Required field warnings
- Visual error states (red borders)
- Error icons for clarity
- Non-blocking warnings vs blocking errors

### 6. **Mobile-First Autolayout**

- Full viewport height (min-h-screen)
- Flexbox layout for proper spacing
- Sticky header and footer
- Scrollable content area
- Gradient background
- Smooth scroll behavior

## Architecture

### Component Hierarchy

```
PatientFlowRenderer (detects mobile)
  └── QuestionStepRenderer (routes to mobile screen)
        └── MobileQuestionScreen (full-screen layout)
              ├── Progress Indicator (sticky header)
              ├── Question Card (scrollable)
              │     ├── Question Text
              │     ├── Help Text
              │     ├── Required Indicator
              │     └── Answer Component
              │           ├── ScaleAnswerButtons
              │           ├── SliderAnswerComponent (NEW)
              │           ├── BinaryAnswerButtons
              │           ├── SingleChoiceAnswerButtons
              │           └── Textarea
              └── Action Bar (sticky footer)
```

### Responsive Behavior

The system intelligently switches between desktop and mobile layouts:

- **Mobile (<640px)**: Uses `MobileQuestionScreen` for single-question steps
- **Desktop (≥640px)**: Uses traditional card-based layout
- **Detection**: Uses `useIsMobile()` hook with `window.matchMedia`
- **SSR-Safe**: Properly handles server-side rendering

### Full-Screen Mode

On mobile with single-question steps:

1. `PatientFlowRenderer` detects mobile + single-question
2. Returns `QuestionStepRenderer` directly (no desktop wrapper)
3. `QuestionStepRenderer` renders `MobileQuestionScreen`
4. `MobileQuestionScreen` takes over entire viewport

This ensures:

- No double headers/footers
- Proper full-screen experience
- Clean navigation flow
- Optimal mobile UX

## Design System Integration

All styling uses the v0.4 Design System:

### Design Tokens Used

```typescript
import {
  componentTokens, // Pre-configured component patterns
  motion, // Animation durations and easing
  spacing, // Consistent spacing scale
  typography, // Font sizes and weights
  colors, // Theme-aware colors
} from '@/lib/design-tokens'
```

### Component Tokens

- `componentTokens.mobileQuestionCard` - Card dimensions and padding
- `componentTokens.answerButton` - Button sizes and styling
- `componentTokens.navigationButton` - Navigation button specs
- `componentTokens.progressBar` - Progress indicator styling
- `componentTokens.infoBox` - Help text and error styling

### Colors

- Primary (Sky Blue): `colors.primary[500]`, `colors.primary[600]`
- Neutral (Slate): `colors.neutral[*]` for text and backgrounds
- Semantic: Success, warning, error states

### Motion

- Framer Motion for smooth animations
- `motion.duration.*` for consistent timing
- `motion.easing.*` for natural movement
- `motion.spring.*` for spring animations

## Component API

### MobileQuestionScreen

```typescript
type MobileQuestionScreenProps = {
  // Question data
  question: QuestionDefinition
  questionIndex: number
  totalQuestions: number

  // State
  value?: number | string
  onChange: (questionKey: string, value: number | string) => void

  // Navigation
  onNext?: () => void
  onPrevious?: () => void
  isFirst?: boolean
  isLast?: boolean

  // Validation
  isRequired?: boolean
  error?: string | null

  // Loading
  isSubmitting?: boolean

  // Display
  funnelTitle?: string
  useSlider?: boolean // Force slider for scale questions
}
```

### SliderAnswerComponent (NEW)

```typescript
type SliderAnswerComponentProps = {
  questionId: string
  minValue: number
  maxValue: number
  value?: number
  onChange: (value: number) => void
  disabled?: boolean
  minLabel?: string
  maxLabel?: string
  step?: number
  showValue?: boolean
}
```

## Usage Examples

### Basic Usage

```tsx
<MobileQuestionScreen
  question={currentQuestion}
  questionIndex={2}
  totalQuestions={10}
  value={answers[currentQuestion.key]}
  onChange={handleAnswerChange}
  onNext={handleNext}
  onPrevious={handlePrevious}
  isFirst={false}
  isLast={false}
  isRequired={true}
  funnelTitle="Stress-Fragebogen"
/>
```

### With Slider (Force)

```tsx
<MobileQuestionScreen
  {...props}
  useSlider={true} // Force slider even for small ranges
/>
```

### Slider Auto-Activation

The slider automatically activates for scale ranges > 10:

```typescript
// Question with min=0, max=100 → uses slider
// Question with min=0, max=4 → uses buttons
```

## Accessibility

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Proper tab order maintained
- Focus indicators clearly visible
- Skip links where appropriate

### Screen Readers

- Proper ARIA labels on all controls
- Semantic HTML structure
- Progress announcements
- Error announcements
- Hidden radio inputs for native form semantics

### Touch Optimization

- **Minimum 44x44px touch targets** (WCAG 2.1 Level AAA)
- Navigation buttons: 56px height
- Answer buttons: 44px minimum
- Slider thumb: 32px diameter
- Adequate spacing between interactive elements

### Color Contrast

- Text colors meet WCAG AA standards
- 4.5:1 contrast ratio for normal text
- 3:1 for large text and UI components
- Visual states not solely dependent on color

## Performance Optimizations

### Memoization

```tsx
const MobileQuestionScreen = memo(function MobileQuestionScreen({ ... }) {
  // Component memoized to prevent unnecessary re-renders
})
```

### Conditional Rendering

- Only renders current question
- Lazy loads answer components
- Efficient re-render strategy

### Animation Performance

- Uses Framer Motion with GPU acceleration
- Transform and opacity for smooth animations
- No layout thrashing

## Testing Checklist

- [x] Desktop rendering (card layout)
- [x] Mobile rendering (full-screen layout)
- [x] All question types render correctly
  - [x] Scale buttons (0-4)
  - [x] Slider (0-100)
  - [x] Binary (Yes/No)
  - [x] Single choice
  - [x] Text input
- [x] Navigation works correctly
  - [x] Back button (hidden on first)
  - [x] Next button (disabled until answered)
  - [x] Complete button (last question)
- [x] Progress indicator updates
- [x] Error handling displays
- [x] Required validation works
- [x] Touch targets meet 44px minimum
- [x] Sticky header/footer work on scroll
- [x] Animations are smooth
- [ ] Manual testing on actual mobile device
- [ ] Screen reader testing
- [ ] Keyboard navigation testing

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari 14+, Chrome Android 90+
- **Features Used**:
  - CSS Grid and Flexbox
  - CSS Custom Properties (via Tailwind)
  - ES2020+ JavaScript
  - Framer Motion animations
  - Native range input (slider)

## Future Enhancements

Potential improvements for future versions:

1. **Multi-Question Steps on Mobile**
   - Currently only single-question steps use full-screen mode
   - Could adapt for multiple questions with carousel/stepper

2. **Swipe Navigation**
   - Gesture support for next/previous
   - Already exists in `SwipeableQuestionCard` - could integrate

3. **Progress Persistence**
   - Visual indicator of saved state
   - Offline support

4. **Animations**
   - Question transition animations
   - Answer selection celebrations
   - Progress milestone animations

5. **Customization**
   - Theme variants (per funnel.default_theme)
   - Custom progress indicators
   - Configurable layouts

6. **A11y Enhancements**
   - High contrast mode
   - Reduced motion support
   - Screen reader optimizations

## Migration from Old Design

No breaking changes to existing API. The new mobile screen is automatically used when:

- Device width < 640px (mobile)
- Question step has exactly 1 question
- Question step is of type 'question_step' or 'form'

Desktop users and multi-question steps continue to use the existing card-based layout.

## Files Changed

### New Files

- `app/components/MobileQuestionScreen.tsx` - Main mobile screen component
- `app/components/SliderAnswerComponent.tsx` - Slider for continuous scales
- `docs/V0_4_MOBILE_QUESTION_SCREEN.md` - This documentation

### Modified Files

- `app/components/QuestionStepRenderer.tsx` - Added mobile routing logic
- `app/components/PatientFlowRenderer.tsx` - Added mobile full-screen mode

## References

- Design System: `/docs/V0_4_DESIGN_SYSTEM.md`
- Design Tokens: `/lib/design-tokens.ts`
- Funnel Types: `/lib/types/funnel.ts`
- Patient Flow: `/docs/V0_4_E2_PATIENT_FLOW_V2.md`

---

**Implementation Date**: 2025-12-12  
**Issue**: #6 - Patient Mobile – Question Screen (Adaptive Questionnaire)  
**Labels**: `frontend`, `mobile`, `questionnaire`, `v0.4`
