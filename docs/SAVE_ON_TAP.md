# Save-on-Tap Feature Implementation

## Overview

The Save-on-Tap feature automatically saves user answers to the `assessment_answers` table as soon as they select an option in the mobile funnel UI. This provides instant feedback and ensures data is persisted without waiting for the user to complete the entire assessment.

## Architecture

### Database Layer

**Table: `assessment_answers`**
```sql
CREATE TABLE public.assessment_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id text NOT NULL,
    answer_value integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT assessment_answers_assessment_question_unique 
        UNIQUE (assessment_id, question_id)
);

CREATE INDEX idx_assessment_answers_lookup 
    ON assessment_answers (assessment_id, question_id);
```

**Key Features:**
- Unique constraint on `(assessment_id, question_id)` prevents duplicate answers
- Index optimizes upsert operations
- Foreign key ensures referential integrity

### API Layer

**Endpoint:** `POST /api/assessment-answers/save`

**Request:**
```json
{
  "assessmentId": "uuid-of-assessment",
  "questionId": "question_key",
  "answerValue": 3
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "answer-uuid",
    "assessment_id": "uuid-of-assessment",
    "question_id": "question_key",
    "answer_value": 3
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Fehler beim Speichern der Antwort. Bitte versuchen Sie es erneut."
}
```

**Security:**
- Validates user authentication via Supabase session
- Verifies user owns the assessment before allowing saves
- Returns clear, user-friendly error messages in German

**Upsert Logic:**
```typescript
await supabase
  .from('assessment_answers')
  .upsert(
    {
      assessment_id: assessmentId,
      question_id: questionId,
      answer_value: answerValue,
    },
    {
      onConflict: 'assessment_id,question_id',
      ignoreDuplicates: false, // Update existing records
    },
  )
```

### Client-Side Implementation

#### Hook: `useAssessmentAnswer`

Custom React hook that handles save-on-tap logic:

```typescript
const { saveAnswer, saveState, lastError, retry } = useAssessmentAnswer()

// Save an answer
await saveAnswer({
  assessmentId: 'uuid',
  questionId: 'stress_level',
  answerValue: 3
})

// saveState: 'idle' | 'saving' | 'saved' | 'error'
// lastError: string | null
// retry: () => Promise<SaveAnswerResult | null>
```

**Features:**
- **Debouncing:** 300ms delay prevents excessive API calls
- **State Management:** Clear states (idle, saving, saved, error)
- **Error Handling:** Network errors and API failures handled gracefully
- **Retry Mechanism:** Users can retry failed saves

#### Component: `SaveIndicator`

Visual feedback component for save states:

```tsx
<SaveIndicator 
  saveState={saveState} 
  error={lastError} 
  onRetry={retry} 
/>
```

**Visual States:**
- **Saving:** Animated spinner + "Speichert..."
- **Saved:** Check mark + "Gespeichert" (auto-hides after 1.5s)
- **Error:** Error icon + error message + "Erneut versuchen" button

#### Enhanced MobileQuestionCard

The `MobileQuestionCard` component now supports save-on-tap:

```tsx
<MobileQuestionCard
  funnel={funnel}
  question={currentQuestion}
  currentQuestionIndex={index}
  totalQuestions={total}
  value={answers[question.id]}
  onChange={handleAnswerChange}
  onNext={handleNext}
  onPrevious={handlePrevious}
  isFirst={index === 0}
  isLast={index === total - 1}
  // New props for save-on-tap:
  assessmentId={assessmentId}          // Required for save-on-tap
  enableSaveOnTap={true}                // Optional, defaults to true
/>
```

**New Props:**
- `assessmentId?: string` - If provided, enables save-on-tap
- `enableSaveOnTap?: boolean` - Explicitly enable/disable (default: true)

**Behavior:**
- When user selects an answer, it saves immediately to the backend
- Shows save indicator below answer buttons
- Disables answer buttons while saving
- Allows retry if save fails

## Usage Example

### Complete Funnel Flow with Save-on-Tap

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ResponsiveQuestionRouter from '@/app/components/ResponsiveQuestionRouter'

export default function AssessmentPage() {
  const router = useRouter()
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [questions, setQuestions] = useState<Question[]>([])

  // Create assessment on mount
  useEffect(() => {
    async function initAssessment() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get patient profile
      const { data: profile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      // Create new assessment
      const { data: assessment } = await supabase
        .from('assessments')
        .insert({
          patient_id: profile.id,
          funnel: 'stress',
        })
        .select()
        .single()

      setAssessmentId(assessment.id)
    }

    initAssessment()
  }, [])

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Mark assessment as completed
      if (assessmentId) {
        supabase
          .from('assessments')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', assessmentId)
          .then(() => router.push('/patient/results'))
      }
    }
  }

  return (
    <ResponsiveQuestionRouter
      funnel={funnel}
      question={questions[currentIndex]}
      currentQuestionIndex={currentIndex}
      totalQuestions={questions.length}
      value={answers[questions[currentIndex].id]}
      onChange={handleAnswerChange}
      onNext={handleNext}
      onPrevious={() => setCurrentIndex(currentIndex - 1)}
      isFirst={currentIndex === 0}
      isLast={currentIndex === questions.length - 1}
      assessmentId={assessmentId!}  // Enable save-on-tap
      enableSwipe={true}
    />
  )
}
```

## Error Handling

### Network Errors

When network is unavailable or request times out:
```
Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.
[Erneut versuchen button]
```

### Authentication Errors

When user session is invalid:
```
Authentifizierung fehlgeschlagen. Bitte melden Sie sich an.
```

### Permission Errors

When user tries to save to someone else's assessment:
```
Sie haben keine Berechtigung, dieses Assessment zu bearbeiten.
```

### Validation Errors

When request data is invalid:
```
Fehlende Pflichtfelder. Bitte geben Sie assessmentId, questionId und answerValue an.
```

## Testing

### Test Scenarios

1. **Rapid Multiple Taps**
   - Tap answer option multiple times quickly
   - Expected: Only one answer saved (no duplicates)
   - Verification: Check `assessment_answers` table

2. **Network Failure**
   - Disconnect network, select answer
   - Expected: Error message with retry button
   - Tap retry after reconnecting
   - Expected: Answer saves successfully

3. **Answer Change**
   - Select answer A → saved
   - Select answer B → saved
   - Expected: Only answer B in database (upsert works)

4. **Navigation While Saving**
   - Select answer, immediately tap "Weiter"
   - Expected: Save completes, navigation proceeds

5. **Report Generation**
   - Complete assessment with save-on-tap
   - Generate report
   - Expected: Report uses saved answers from `assessment_answers`

## Migration Path

### Existing Code Compatibility

The save-on-tap feature is **opt-in** and **backward compatible**:

- Existing components work without changes
- `assessmentId` prop is optional
- If `assessmentId` is not provided, save-on-tap is disabled
- Local state management still works as before

### Enabling Save-on-Tap in Existing Funnels

1. Pass `assessmentId` to `MobileQuestionCard`/`ResponsiveQuestionRouter`
2. Ensure assessment is created before rendering questions
3. Optionally set `enableSaveOnTap={true}` (default is true)

## Performance Considerations

### Debouncing

- 300ms debounce prevents excessive API calls
- Multiple rapid taps result in single save operation
- Improves server load and reduces database operations

### Database Optimization

- Index on `(assessment_id, question_id)` speeds up upserts
- Unique constraint enforced at database level (fast)
- ON CONFLICT clause uses efficient PostgreSQL merge logic

### Network Efficiency

- Only saves when answer changes
- Minimal payload (3 fields: assessmentId, questionId, answerValue)
- Gzip compression reduces transfer size

## Future Enhancements

### Potential Improvements

1. **Offline Support**
   - Store answers in IndexedDB/LocalStorage
   - Sync when connection restored
   - Show offline indicator

2. **Optimistic Updates**
   - Show "saved" immediately
   - Revert on failure
   - Faster perceived performance

3. **Batch Saves**
   - Queue multiple answers
   - Send in single request
   - Reduce API calls further

4. **Auto-save for Text Inputs**
   - Debounce text input changes
   - Save after user stops typing
   - Better UX for long-form answers

## Related Files

- Migration: `supabase/migrations/20251208143813_add_assessment_answers_unique_constraint.sql`
- Schema: `schema/schema.sql` (updated with constraint and index)
- API Route: `app/api/assessment-answers/save/route.ts`
- Hook: `lib/hooks/useAssessmentAnswer.ts`
- Component: `app/components/SaveIndicator.tsx`
- Enhanced Component: `app/components/MobileQuestionCard.tsx`
