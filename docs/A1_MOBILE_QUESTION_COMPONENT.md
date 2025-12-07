# Mobile Question Component (A1) - Implementation Documentation

## Overview

The Mobile Question Component (`<MobileQuestionCard />`) is a mobile-optimized funnel question display component that presents questions in a card-stack design. It integrates with the existing database funnel model to provide a seamless user experience for mobile devices.

## Component Location

- **Component**: `/app/components/MobileQuestionCard.tsx`
- **Types**: `/lib/types/funnel.ts`
- **Helpers**: `/lib/funnelHelpers.ts`
- **Demo**: `/app/patient/funnel-demo/page.tsx`

## Database Schema Integration

The component reads data from the following database tables:

### Tables Used
1. **`funnels`** - Funnel metadata (title, subtitle, description)
2. **`funnel_steps`** - Steps within a funnel (ordered by `order_index`)
3. **`questions`** - Question bank (label, help_text, question_type)
4. **`funnel_step_questions`** - Join table mapping questions to steps (ordered by `order_index`)
5. **`assessments`** - User assessment sessions

### Data Flow
```
assessments.funnel_id → funnels.id
funnels.id → funnel_steps.funnel_id
funnel_steps.id → funnel_step_questions.funnel_step_id
funnel_step_questions.question_id → questions.id
```

## Component Features

### Mobile-First Design
- **Viewport Detection**: Automatically activates for viewports <640px
- **Thumb-Friendly Controls**: All interactive elements are minimum 44px tall
- **Mobile Typography**: Larger text (text-xl for questions, text-lg for headers)
- **Adequate Spacing**: Generous padding and margins for readability

### UI Elements

#### Header
- Displays funnel title from `funnels.title`
- Shows subtitle from `funnels.subtitle` or "Fragebogen" fallback
- Fixed position with shadow for clarity

#### Progress Indicator
- Shows current question number and total questions
- Visual progress bar with percentage
- Smooth transitions

#### Question Display
- Question text from `questions.label`
- Optional help text from `questions.help_text` (displayed in info box with 💡 icon)
- Visual feedback for answered/unanswered state
- Warning message for required unanswered questions

#### Answer Area
- **Scale Questions**: Radio button grid with value labels
  - Uses `question.min_value` and `question.max_value` if available
  - Falls back to default 0-4 scale (Nie, Selten, Manchmal, Oft, Sehr häufig)
  - Visual feedback on selection (scale-105 transform, color change)
- **Text Questions**: Textarea with minimum 120px height
  - 16px font size to prevent iOS zoom

#### Navigation
- **Previous Button**: Appears on all questions except first
- **Next/Submit Button**: 
  - Shows "Weiter →" for all questions except last
  - Shows "✓ Abschließen" for last question
  - Disabled until question is answered
  - Loading state with spinner animation

### State Management

The component manages the following states:
- `value`: Current answer value (number or string)
- `isAnswered`: Boolean derived from value presence
- `isFocused`: Visual feedback for focused state
- `isLoading`: Loading state for async operations
- `error`: Error message display

### Props Interface

```typescript
export type MobileQuestionCardProps = {
  funnel: Funnel                      // Funnel metadata
  question: Question                  // Current question
  currentQuestionIndex: number        // 0-based index
  totalQuestions: number              // Total number of questions
  value?: number | string             // Current answer
  onChange: (questionId: string, value: number | string) => void
  onNext?: () => void                 // Next/Submit handler
  onPrevious?: () => void             // Previous handler
  isFirst?: boolean                   // First question flag
  isLast?: boolean                    // Last question flag
  isRequired?: boolean                // Required flag (default: true)
  error?: string | null               // Error message
  isLoading?: boolean                 // Loading state
}
```

## Helper Functions

### `getFunnelWithQuestions(funnelId: string)`
Fetches a complete funnel with all steps and questions, properly ordered.

**Returns**: Funnel object with nested `funnel_steps` array, each containing a `questions` array

### `getActiveQuestion(funnelId: string, currentQuestionIndex: number)`
Determines the active question based on the current progress index.

**Returns**: `ActiveQuestion` object with question data, indices, and metadata

### `calculateProgress(answeredCount: number, totalQuestions: number)`
Calculates progress percentage.

**Returns**: Number (0-100)

## Usage Example

```tsx
import MobileQuestionCard from '@/app/components/MobileQuestionCard'
import { getActiveQuestion, getFunnelWithQuestions } from '@/lib/funnelHelpers'

const MyFunnelPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [funnelData, setFunnelData] = useState(null)
  
  // Fetch funnel data
  useEffect(() => {
    getFunnelWithQuestions(funnelId).then(setFunnelData)
  }, [funnelId])
  
  // Get active question
  const activeQuestion = await getActiveQuestion(funnelId, currentIndex)
  
  return (
    <MobileQuestionCard
      funnel={funnelData}
      question={activeQuestion.question}
      currentQuestionIndex={currentIndex}
      totalQuestions={activeQuestion.totalQuestions}
      value={answers[activeQuestion.question.id]}
      onChange={(id, value) => setAnswers(prev => ({ ...prev, [id]: value }))}
      onNext={() => setCurrentIndex(prev => prev + 1)}
      onPrevious={() => setCurrentIndex(prev => prev - 1)}
      isFirst={currentIndex === 0}
      isLast={currentIndex === activeQuestion.totalQuestions - 1}
    />
  )
}
```

## Demo Page

A demo implementation is available at `/patient/funnel-demo` that shows:
- Mobile viewport detection
- Question navigation
- Answer persistence
- Loading states
- Error handling
- Desktop fallback message

## Accessibility

- **Semantic HTML**: Proper heading hierarchy, form elements
- **ARIA Labels**: All radio buttons have descriptive labels
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Hidden labels for assistive technology
- **Focus Management**: Visual focus indicators

## Responsive Behavior

- **Mobile (<640px)**: Full mobile-optimized card stack layout
- **Desktop (≥640px)**: Component still works but demo shows message to resize

## Styling

- **Colors**: Sky blue primary (#0ea5e9), slate gray neutral
- **Borders**: 2px for emphasis, rounded corners (rounded-xl, rounded-2xl)
- **Shadows**: Subtle elevation (shadow-sm, shadow-lg)
- **Transitions**: Smooth 200-300ms transitions
- **Animations**: Scale transforms on interaction

## Browser Compatibility

- ✅ iOS Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)
- ✅ Firefox Mobile
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)

## Known Limitations

1. Component assumes sequential question flow (no branching logic)
2. Only supports 'scale' and 'text' question types currently
3. Requires client-side state management from parent component

## Future Enhancements

- [ ] Support for multi-select questions
- [ ] Support for conditional/branching logic
- [ ] Swipe gestures for navigation
- [ ] Offline answer caching
- [ ] Answer validation rules
- [ ] Accessibility improvements (WCAG AAA)

## Testing Recommendations

1. Test on actual iOS and Android devices
2. Test with different screen sizes (320px, 375px, 414px widths)
3. Test with VoiceOver and TalkBack screen readers
4. Test keyboard navigation
5. Test with slow network connections
6. Test answer persistence across page refreshes

## Related Files

- Database schema: `/schema/schema.sql`
- Funnel tables migration: `/supabase/migrations/01_create_funnel_tables.sql`
- Assessment tables: `/supabase/migrations/20241203110000_init_patient_profiles_and_assessments.sql`
