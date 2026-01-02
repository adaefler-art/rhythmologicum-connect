# Adaptive Questionnaire Engine (V05-I03.2)

Manifest-driven questionnaire system with conditional logic, validation, and deterministic step sequencing.

## Features

- ✅ **40-50 Question Support**: Handle large questionnaires efficiently
- ✅ **Conditional Logic**: Show/hide/skip steps based on answers
- ✅ **All Question Types**: radio, checkbox, text, textarea, number, scale, slider
- ✅ **Validation**: Required field validation with user-friendly errors
- ✅ **Deterministic**: Same answers always produce same step sequence
- ✅ **No Persistence**: Pure UI state machine (integrate with your backend)
- ✅ **Type Safe**: All types from registry contracts - NO magic strings
- ✅ **Tested**: 48 passing tests (conditional logic, state machine, integration)

## Architecture

```
lib/questionnaire/
├── conditionalLogic.ts       # Conditional logic evaluator (21 tests)
├── stateMachine.ts            # Questionnaire state machine (20 tests)
├── QuestionRenderer.tsx       # Question type renderers
├── QuestionnaireRunner.tsx    # Main runner component
├── examples/
│   └── stressAssessment.tsx  # Example: 40+ question stress assessment
└── __tests__/
    ├── conditionalLogic.test.ts
    ├── stateMachine.test.ts
    └── QuestionnaireRunner.test.ts
```

## Quick Start

### 1. Define Your Questionnaire

```typescript
import type { FunnelQuestionnaireConfig } from '@/lib/contracts/funnelManifest'
import { QUESTION_TYPE } from '@/lib/contracts/registry'

const myQuestionnaire: FunnelQuestionnaireConfig = {
  version: '1.0',
  steps: [
    {
      id: 'step1',
      title: 'Basic Info',
      questions: [
        {
          id: 'q1',
          key: 'age',
          type: QUESTION_TYPE.NUMBER,
          label: 'How old are you?',
          required: true,
        },
      ],
    },
    {
      id: 'step2',
      title: 'Adult Questions',
      questions: [
        {
          id: 'q2',
          key: 'occupation',
          type: QUESTION_TYPE.TEXT,
          label: 'What is your occupation?',
          required: true,
        },
      ],
      conditionalLogic: {
        type: 'show',
        conditions: [{ questionId: 'q1', operator: 'gte', value: 18 }],
        logic: 'and',
      },
    },
  ],
}
```

### 2. Use the Runner

```tsx
import QuestionnaireRunner from '@/lib/questionnaire/QuestionnaireRunner'

export default function MyQuestionnairePage() {
  const handleComplete = (answers) => {
    // Save answers to your backend
    console.log('Completed:', answers)
  }

  return (
    <QuestionnaireRunner
      config={myQuestionnaire}
      onComplete={handleComplete}
      onAnswersChange={(answers) => console.log('Updated:', answers)}
      title="My Questionnaire"
    />
  )
}
```

## Question Types

All from `QUESTION_TYPE` registry:

| Type | Description | Example |
|------|-------------|---------|
| `RADIO` | Single choice | Gender, Yes/No questions |
| `CHECKBOX` | Multiple choice | Symptoms, Preferences |
| `TEXT` | Short text input | Name, Email |
| `TEXTAREA` | Long text input | Comments, Description |
| `NUMBER` | Numeric input | Age, Weight |
| `SCALE` | Discrete scale (buttons) | Stress level 1-10 |
| `SLIDER` | Continuous slider | Pain level 0-100 |

## Conditional Logic

### Operators

- `eq`: Equal to
- `neq`: Not equal to
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `in`: Value in array
- `notIn`: Value not in array

### Logic Types

- `show`: Show step if condition met
- `hide`: Hide step if condition met
- `skip`: Skip step if condition met

### Example: Age-Based Branching

```typescript
{
  id: 'adult_questions',
  title: 'Adult Questions',
  questions: [...],
  conditionalLogic: {
    type: 'show',
    conditions: [
      { questionId: 'age', operator: 'gte', value: 18 }
    ],
    logic: 'and'
  }
}
```

### Example: Multiple Conditions (OR)

```typescript
{
  conditionalLogic: {
    type: 'show',
    conditions: [
      { questionId: 'status', operator: 'eq', value: 'employed' },
      { questionId: 'status', operator: 'eq', value: 'self_employed' }
    ],
    logic: 'or'
  }
}
```

### Example: Array Conditions

```typescript
{
  conditionalLogic: {
    type: 'show',
    conditions: [
      { questionId: 'symptoms', operator: 'in', value: ['headache', 'fever'] }
    ],
    logic: 'and'
  }
}
```

## Validation

Required questions are validated automatically:

```typescript
{
  id: 'email',
  key: 'email',
  type: QUESTION_TYPE.TEXT,
  label: 'Email address',
  required: true,  // ← Validation enforced
  validation: {
    pattern: '^[^@]+@[^@]+\\.[^@]+$',  // Optional regex
    message: 'Please enter a valid email'
  }
}
```

## State Management

The runner uses an internal state machine. You can integrate with your backend:

```tsx
<QuestionnaireRunner
  config={config}
  initialAnswers={savedAnswers}  // Resume from saved state
  onAnswersChange={(answers) => {
    // Auto-save to backend
    saveAnswers(answers)
  }}
  onComplete={(answers) => {
    // Final submission
    submitAssessment(answers)
  }}
/>
```

## Testing

Run tests:

```bash
npm test -- lib/questionnaire/
```

Test coverage:
- 21 tests: Conditional logic (all operators, AND/OR, determinism)
- 20 tests: State machine (navigation, validation, progress)
- 7 tests: Integration (complete flows with branching)

## Example: Complete Stress Assessment

See `lib/questionnaire/examples/stressAssessment.tsx` for a realistic 40+ question stress assessment with:
- Demographics
- Work stress (conditional on employment status)
- Symptom assessment
- High stress follow-up (conditional on stress level)
- Lifestyle factors
- Coping strategies

## Error Handling

Unknown question types show a controlled error:

```
⚠️ Unbekannter Fragetyp
Der Fragetyp "xyz" wird nicht unterstützt.
Bitte kontaktieren Sie den Support.
```

## Integration with Funnel Runtime

To integrate with the existing funnel runtime backend:

1. Load questionnaire config from `funnel_versions.questionnaire_config`
2. Use `QuestionnaireRunner` for UI
3. Save answers via `/api/assessment-answers/save` endpoint
4. Complete via `/api/funnels/{slug}/assessments/{id}/complete`

## API

### QuestionnaireRunner Props

```typescript
{
  config: FunnelQuestionnaireConfig      // Required: Questionnaire definition
  initialAnswers?: AnswersMap            // Optional: Resume from saved state
  onComplete?: (answers) => void         // Optional: Called on completion
  onAnswersChange?: (answers) => void    // Optional: Called on answer change
  title?: string                         // Optional: Display title
}
```

### AnswersMap Type

```typescript
type AnswersMap = Record<string, string | number | boolean | string[]>
```

## Contracts

All types from canonical contracts:
- `FunnelQuestionnaireConfig` - Main config schema
- `QuestionnaireStep` - Step definition
- `QuestionConfig` - Question definition
- `ConditionalLogic` - Conditional logic rules
- `QUESTION_TYPE` - Registry of valid question types

**NO MAGIC STRINGS** - All types validated by Zod schemas.

## Migration from Legacy

If you have legacy funnel questions:

1. Convert to manifest format using contracts
2. Test with `QuestionnaireRunner`
3. Replace old QuestionStepRenderer usage
4. Verify conditional logic works as expected

## Support

For issues or questions:
1. Check tests for examples
2. See `examples/stressAssessment.tsx`
3. Review contracts in `lib/contracts/funnelManifest.ts`
