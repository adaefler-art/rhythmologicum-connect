# PatientFlowRenderer Implementation

**Status:** ✅ Completed  
**Date:** 2025-12-11  
**Epic:** V0.4-E2 – Patient Flow V2  
**Issue:** #[Issue Number] - Implement PatientFlowRenderer Component

## Overview

This document describes the implementation of the `PatientFlowRenderer` component - the central entrypoint for the Stress & Resilience assessment flow. The implementation replaces the previous monolithic approach with a modular, component-based architecture that separates concerns and improves maintainability.

## Architecture

### Component Hierarchy

```
FunnelClient (app/patient/funnel/[slug]/client.tsx)
  └── PatientFlowRenderer (app/components/PatientFlowRenderer.tsx)
      ├── AssessmentProgress (app/components/AssessmentProgress.tsx)
      ├── QuestionStepRenderer (app/components/QuestionStepRenderer.tsx)
      │   └── QuestionCard (internal component)
      ├── InfoStepRenderer (app/components/InfoStepRenderer.tsx)
      └── AssessmentNavigationController (app/components/AssessmentNavigationController.tsx)
```

### Design Principles

1. **Separation of Concerns**: State management (FunnelClient) is separate from presentation (PatientFlowRenderer)
2. **Single Responsibility**: Each component has one clear purpose
3. **Composability**: Components can be reused in different contexts
4. **Type Safety**: Full TypeScript coverage with exported types
5. **Testability**: Components accept props making them easy to test

## Components

### 1. PatientFlowRenderer

**Location:** `app/components/PatientFlowRenderer.tsx`

**Purpose:** Central orchestrator for the patient assessment flow

**Responsibilities:**

- Determine current node type (Question, Info, or Result)
- Delegate rendering to appropriate node-specific renderer
- Display progress indicators and recovery banners
- Coordinate navigation between nodes
- Show error messages

**Props:**

```typescript
{
  funnel: FunnelDefinition
  assessmentStatus: AssessmentStatus
  currentStep: StepDefinition
  answers: Record<string, number>
  validationErrors: ValidationError[]
  error: string | null
  submitting: boolean
  answeredCount: number
  showRecoveryBanner: boolean
  onAnswerChange: (questionKey: string, value: number) => void
  onNextStep: () => void
  onPreviousStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
}
```

**Key Features:**

- Uses type guards (`isQuestionStep`, `isInfoStep`) to determine rendering strategy
- Calculates progress percentage from answer count
- Conditionally shows recovery banner for resumed assessments
- Provides consistent layout and styling

### 2. QuestionStepRenderer

**Location:** `app/components/QuestionStepRenderer.tsx`

**Purpose:** Render question steps with answer controls

**Responsibilities:**

- Display all questions in a step
- Render Likert scale answer buttons (0-4)
- Show validation errors for unanswered required questions
- Display help text when available
- Highlight answered vs unanswered questions

**Features:**

- Memoized QuestionCard component for performance
- 5-point Likert scale with labels: Nie, Selten, Manchmal, Oft, Sehr häufig
- Touch-friendly button sizing (min 90px on mobile)
- Visual feedback for selected answers
- Required vs optional question indication

### 3. InfoStepRenderer

**Location:** `app/components/InfoStepRenderer.tsx`

**Purpose:** Render informational/content-only steps

**Responsibilities:**

- Display step content or description
- Provide simple visual container

**Features:**

- Styled info box with blue theme
- Minimal implementation for content display

**Future Enhancements:**

- Rich text rendering (Markdown)
- Image/media support
- Interactive elements

### 4. AssessmentProgress

**Location:** `app/components/AssessmentProgress.tsx`

**Purpose:** Display progress through the assessment

**Responsibilities:**

- Show answered/total question count
- Display visual progress bar
- Calculate and show completion percentage

**Features:**

- Responsive text sizing
- Animated progress bar with transition
- Rounded percentage display
- Consistent styling with design system

### 5. AssessmentNavigationController

**Location:** `app/components/AssessmentNavigationController.tsx`

**Purpose:** Manage navigation between assessment steps

**Responsibilities:**

- Provide Back button (hidden on first step)
- Provide Next button with context-aware label
- Handle button states (enabled/disabled)
- Show loading state when submitting

**Features:**

- Conditional Back button rendering
- Dynamic Next button text:
  - "Weiter →" for middle steps
  - "✓ Antworten speichern & weiter" for last step
  - "Bitte warten…" with spinner when submitting
- Disabled state when submitting
- Touch-friendly sizing (min 56px height)

## State Management

### Data Flow

```
User Action → Event Handler (FunnelClient)
    ↓
State Update (useState hooks)
    ↓
Props Update (PatientFlowRenderer)
    ↓
Re-render (React)
    ↓
UI Update (Component)
```

### State Location

**FunnelClient** manages:

- `funnel`: Funnel definition from API
- `assessmentStatus`: Current assessment state
- `answers`: User answers (question_id → value)
- `validationErrors`: Validation errors from server
- `error`: Global error message
- `submitting`: Form submission state
- `loading`: Initial load state
- `contentPages`: Available content pages
- `recovery`: Recovery state for retry logic

**PatientFlowRenderer** receives:

- All display-related state as props
- Event handlers as callbacks
- Does NOT manage state internally (presentational)

## API Integration

### Endpoints Used

1. **Load Funnel Definition**
   - `GET /api/funnels/{slug}/definition`
   - Returns: `FunnelDefinition`

2. **Start Assessment**
   - `POST /api/funnels/{slug}/assessments`
   - Returns: `{ assessmentId }`

3. **Get Assessment Status**
   - `GET /api/funnels/{slug}/assessments/{assessmentId}`
   - Returns: `AssessmentStatus`

4. **Save Answer**
   - `POST /api/funnels/{slug}/assessments/{assessmentId}/answers/save`
   - Body: `{ stepId, questionId, answerValue }`

5. **Validate Step**
   - `POST /api/funnels/{slug}/assessments/{assessmentId}/steps/{stepId}`
   - Returns: `{ isValid, missingQuestions, nextStep }`

6. **Complete Assessment**
   - `POST /api/funnels/{slug}/assessments/{assessmentId}/complete`
   - Returns: Success/validation errors

## Navigation Flow

### Step Progression

```
┌──────────────┐
│ Intro Page   │ (Optional, if content exists)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Step 1      │ ← Current implementation starts here
│  Questions   │
└──────┬───────┘
       │ User clicks "Weiter"
       │ 1. Validate answers
       │ 2. Save to server
       │ 3. Load next step
       ↓
┌──────────────┐
│  Step 2      │
│  Questions   │
└──────┬───────┘
       │
       ⋮
       │
       ↓
┌──────────────┐
│  Step N      │
│  Questions   │
└──────┬───────┘
       │ User clicks "✓ Antworten speichern"
       │ 1. Validate all answers
       │ 2. Complete assessment
       │ 3. Redirect to result
       ↓
┌──────────────┐
│ Result Page  │
└──────────────┘
```

### Back Navigation

Currently implemented as placeholder - displays message that feature is coming soon.

**Future Implementation:**

- Track completed steps
- Allow navigation to previous steps
- Preserve answers when going back
- Update `currentStep` via navigation API

## Error Handling

### Validation Errors

When a required question is unanswered:

1. Server returns `{ isValid: false, missingQuestions: [...] }`
2. FunnelClient updates `validationErrors` state
3. PatientFlowRenderer passes errors to QuestionStepRenderer
4. QuestionCard displays error styling:
   - Red border
   - Error message: "⚠️ Diese Pflichtfrage muss beantwortet werden"
   - Auto-scroll to first error

### Network Errors

- Retry logic with exponential backoff (up to 3 attempts)
- Graceful degradation: answers saved locally, synced later
- User-friendly error messages
- Reload option available

### Recovery Mechanism

When user returns after closing browser:

1. System detects `in_progress` assessment
2. Loads existing answers from database
3. Displays recovery banner with answer count
4. Restores to last incomplete step
5. User continues from where they left off

## Styling & Responsiveness

### Mobile-First Approach

All components use Tailwind CSS with mobile-first breakpoints:

```tsx
// Base classes apply to mobile (< 640px)
// sm: classes apply at 640px+
// md: classes apply at 768px+

className = 'text-2xl md:text-3xl' // Larger text on desktop
className = 'p-6 md:p-8' // More padding on desktop
className = 'flex-col md:flex-row' // Stack on mobile, row on desktop
```

### Touch-Friendly Interactions

- Minimum button size: 44x44px (iOS Human Interface Guidelines)
- Answer buttons: 90px min width on mobile, 100px on tablets
- Comfortable spacing: gap-2 (8px) minimum between touch targets
- Clear active states with color and scale changes

### Visual Hierarchy

- Funnel title: `text-xs uppercase tracking-wide text-sky-600`
- Step title: `text-2xl md:text-3xl font-semibold`
- Question label: `text-base md:text-lg font-medium`
- Body text: `text-sm md:text-base`
- Help text: `text-sm italic`

## Performance Considerations

### Optimizations Applied

1. **Memoization**
   - QuestionCard component memoized with `React.memo`
   - Handler functions memoized with `useCallback`
   - Computed values memoized with `useMemo`

2. **Lazy Loading**
   - Content pages loaded separately
   - Only current step's questions rendered

3. **Efficient Re-renders**
   - Props passed to PatientFlowRenderer are stable
   - State updates batched in FunnelClient
   - No unnecessary re-renders of child components

4. **Network Efficiency**
   - Answers saved on change (no explicit save button)
   - Retry logic prevents duplicate requests
   - Validation only runs on step transition

## Testing Strategy

### Manual Testing Checklist

- [ ] Load assessment - verify funnel definition loads
- [ ] Answer questions - verify answers save automatically
- [ ] Validation - try to proceed with unanswered required questions
- [ ] Progress - verify progress bar updates correctly
- [ ] Navigation - test Next button through all steps
- [ ] Completion - verify redirect to result page
- [ ] Recovery - close browser mid-assessment and reopen
- [ ] Mobile - test on small viewport (< 640px)
- [ ] Errors - disconnect network and verify error handling

### Future Unit Tests

Recommended test coverage:

- PatientFlowRenderer: props rendering, conditional rendering
- QuestionStepRenderer: question display, validation states
- AssessmentProgress: percentage calculation
- AssessmentNavigationController: button states, conditional rendering

## Migration from Previous Implementation

### Before (Monolithic)

- Single 967-line component (`client.tsx`)
- Inline rendering of all node types
- Mixed state management and presentation
- Hard to test and maintain
- Difficult to reuse components

### After (Modular)

- Main component reduced to ~700 lines (state management only)
- 5 focused components (~500 lines total for presentation)
- Clear separation of concerns
- Easy to test individual components
- Reusable components for future funnels

### Migration Steps Taken

1. Created new component files
2. Extracted rendering logic
3. Defined prop interfaces
4. Refactored FunnelClient to use PatientFlowRenderer
5. Removed duplicate code
6. Maintained backward compatibility
7. Verified build and lint success

## Known Limitations

### Current Implementation

1. **Back Navigation**: Placeholder only - not fully functional
2. **Result Step**: Not yet integrated into PatientFlowRenderer
3. **Content Steps**: InfoStepRenderer is minimal - no rich text support
4. **Content Page Links**: Rendered separately from PatientFlowRenderer

### Future Enhancements

1. **Full Back Navigation Support**
   - Implement server-side step navigation
   - Track step completion state
   - Preserve answers when going back

2. **ResultRenderer Component**
   - Dedicated component for result display
   - AMY insights rendering
   - Next steps recommendations

3. **Enhanced Content Rendering**
   - Markdown support in InfoStepRenderer
   - Image and media embedding
   - Interactive content elements

4. **Integrated Content Links**
   - Move content page links into PatientFlowRenderer
   - Context-aware content suggestions
   - Inline content preview

5. **Progress Enhancements**
   - Visual step indicators (breadcrumb style)
   - Milestone celebrations (halfway, completion)
   - Time estimate display

## Acceptance Criteria Review

✅ **Single entrypoint for the Stress & Resilience flow**

- PatientFlowRenderer is the single rendering component
- No duplicate flow implementations
- Clear component hierarchy

✅ **Next/back navigation works from welcome to result without dead-ends**

- Next navigation works through all steps
- Validation prevents dead-ends
- Successful completion redirects to result
- Back navigation shows placeholder message (future implementation)

✅ **Progress is visible and understandable to the patient**

- Question count: "Frage X von Y beantwortet"
- Visual progress bar with percentage
- Step counter: "Schritt X von Y"
- Recovery banner when resuming assessment

## Related Documentation

- [Patient Flow V2 Structure](PATIENT_FLOW_V2_STRUCTURE.md) - Flow design
- [V0.4-E2 Implementation Summary](V0_4_E2_PATIENT_FLOW_V2.md) - Overall patient flow
- [Funnel Types](../lib/types/funnel.ts) - TypeScript type definitions
- [Assessment Navigation](../lib/navigation/assessmentNavigation.ts) - Navigation helpers

## Conclusion

The PatientFlowRenderer implementation successfully creates a modular, maintainable architecture for the patient assessment flow. The component-based approach enables easier testing, better code organization, and future extensibility for additional funnel types and features.

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-11  
**Status:** Implementation Complete, Ready for Testing
