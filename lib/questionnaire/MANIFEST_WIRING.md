# Funnel Manifest Wiring Guide

## Overview

This document describes how to wire the Adaptive Questionnaire Runner to funnel manifests stored in `funnel_versions.questionnaire_config`.

## Data Flow

```
funnel_versions (DB)
  └─ questionnaire_config (JSONB)
      └─ FunnelQuestionnaireConfig (Zod schema)
          └─ QuestionnaireRunner (React component)
              └─ State Machine (deterministic logic)
```

## Schema Contract

The `questionnaire_config` JSONB field must conform to `FunnelQuestionnaireConfigSchema` from `lib/contracts/funnelManifest.ts`.

### Required Structure

```typescript
{
  version: string,              // e.g., "1.0"
  steps: QuestionnaireStep[],   // Array of steps with questions
  conditionalLogic?: ConditionalLogic[],  // Optional global logic
  metadata?: Record<string, any>          // Optional metadata
}
```

### Step Structure

Each step in the `steps` array:

```typescript
{
  id: string,                   // Unique step identifier
  title: string,                // Display title
  description?: string,         // Optional description
  questions: QuestionConfig[],  // Questions in this step
  conditionalLogic?: ConditionalLogic  // Optional visibility logic
}
```

### Question Structure

Each question:

```typescript
{
  id: string,                   // Unique question identifier
  key: string,                  // Answer key (for storage)
  type: QuestionType,           // From QUESTION_TYPE registry ONLY
  label: string,                // Display label
  helpText?: string,            // Optional help text
  required: boolean,            // Required validation (default: false)
  options?: QuestionOption[],   // For radio/checkbox types
  validation?: QuestionValidation,  // Optional validation rules
  minValue?: number,            // For scale/slider types
  maxValue?: number,            // For scale/slider types
}
```

### Conditional Logic Structure

```typescript
{
  type: 'show' | 'hide' | 'skip',  // Visibility behavior
  conditions: [
    {
      questionId: string,         // Must reference existing question.id
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn',
      value: string | number | boolean | string[]
    }
  ],
  logic: 'and' | 'or'            // Combine conditions
}
```

## Guardrails

### 1. No Fantasy Names

**RULE:** All types, operators, and identifiers must come from existing contracts.

❌ **WRONG:**
```typescript
type: "custom_input_field"  // Fantasy name!
operator: "is_greater"      // Fantasy operator!
```

✅ **CORRECT:**
```typescript
type: QUESTION_TYPE.TEXT    // From registry
operator: "gt"              // From ConditionalLogic schema
```

### 2. No Silent Defaults

**RULE:** Unknown operators/types throw errors, not silent failures.

❌ **WRONG:**
```typescript
// Unknown operator silently returns false
default: return false
```

✅ **CORRECT:**
```typescript
// Unknown operator throws UnknownOperatorError
default: throw new UnknownOperatorError(operator, questionId)
```

### 3. Deterministic Resume

**RULE:** Same answers always produce same state.

✅ **Guaranteed:**
```typescript
// Run 1
const state1 = initQuestionnaireStateWithResume(config, answers)

// Run 2  
const state2 = initQuestionnaireStateWithResume(config, answers)

// state1 === state2 (same visible steps, same current step index)
```

## Loading from Database

### Server-Side Loading

```typescript
// app/api/funnels/[slug]/questionnaire/route.ts
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { parseQuestionnaireConfig } from '@/lib/contracts/funnelManifest'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const supabase = await createServerSupabaseClient()
  
  // Get funnel and its default version
  const { data: funnel, error: funnelError } = await supabase
    .from('funnels_catalog')
    .select('id, default_version_id')
    .eq('slug', params.slug)
    .single()
    
  if (funnelError || !funnel) {
    return Response.json({ error: 'Funnel not found' }, { status: 404 })
  }
  
  // Get version with questionnaire config
  const { data: version, error: versionError } = await supabase
    .from('funnel_versions')
    .select('questionnaire_config')
    .eq('id', funnel.default_version_id)
    .single()
    
  if (versionError || !version) {
    return Response.json({ error: 'Version not found' }, { status: 404 })
  }
  
  // Parse and validate config (throws on invalid schema)
  const config = parseQuestionnaireConfig(version.questionnaire_config)
  
  return Response.json({ config })
}
```

### Client-Side Usage

```typescript
// app/patient/funnel/[slug]/questionnaire/page.tsx
'use client'

import { useEffect, useState } from 'react'
import QuestionnaireRunner from '@/lib/questionnaire/QuestionnaireRunner'
import type { FunnelQuestionnaireConfig } from '@/lib/contracts/funnelManifest'

export default function QuestionnairePage({ params }: { params: { slug: string } }) {
  const [config, setConfig] = useState<FunnelQuestionnaireConfig | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadConfig() {
      const response = await fetch(`/api/funnels/${params.slug}/questionnaire`)
      const data = await response.json()
      setConfig(data.config)
      setLoading(false)
    }
    loadConfig()
  }, [params.slug])
  
  if (loading) return <div>Loading...</div>
  if (!config) return <div>Error loading questionnaire</div>
  
  return (
    <QuestionnaireRunner
      config={config}
      onComplete={(answers) => {
        // Submit to backend
        console.log('Completed:', answers)
      }}
    />
  )
}
```

## Resume from Saved Answers

```typescript
// Load saved answers from assessment_answers table
const { data: savedAnswers } = await supabase
  .from('assessment_answers')
  .select('question_id, answer_value')
  .eq('assessment_id', assessmentId)

// Convert to AnswersMap
const answersMap = savedAnswers.reduce((acc, answer) => {
  acc[answer.question_id] = answer.answer_value
  return acc
}, {} as AnswersMap)

// Initialize with resume (deterministic positioning)
<QuestionnaireRunner
  config={config}
  initialAnswers={answersMap}
  onComplete={(answers) => completeAssessment(answers)}
/>
```

## Validation Checklist

Before deploying a new questionnaire config:

- [ ] All `question.type` values are from `QUESTION_TYPE` registry
- [ ] All `conditionalLogic.operator` values are valid operators
- [ ] All `questionId` references in conditions point to actual questions
- [ ] Required questions have `required: true` explicitly set
- [ ] Radio/checkbox questions have `options` array
- [ ] Scale/slider questions have `minValue` and `maxValue`
- [ ] Config validates against `FunnelQuestionnaireConfigSchema`
- [ ] Test deterministic resume with sample answers
- [ ] Test branching logic with different answer paths

## Error Handling

### Unknown Operator

```typescript
// Throws: UnknownOperatorError
{
  conditions: [
    { questionId: 'q1', operator: 'fantasy_op', value: 'x' }
  ]
}
```

**Solution:** Use only valid operators from schema.

### Unknown Question Type

```typescript
// Shows controlled error UI (UnknownTypeError component)
{
  id: 'q1',
  type: 'fantasy_type',
  // ...
}
```

**Solution:** Use only types from `QUESTION_TYPE` registry.

### Missing Question Reference

```typescript
// Returns false (missing answer)
{
  conditions: [
    { questionId: 'nonexistent_q', operator: 'eq', value: 'x' }
  ]
}
```

**Solution:** Ensure all referenced question IDs exist in the questionnaire.

## Testing Manifest Compliance

```typescript
import { FunnelQuestionnaireConfigSchema } from '@/lib/contracts/funnelManifest'

// Validate manifest before saving to DB
const result = FunnelQuestionnaireConfigSchema.safeParse(yourConfig)

if (!result.success) {
  console.error('Invalid config:', result.error)
  // Fix schema violations
} else {
  // Safe to save to funnel_versions.questionnaire_config
  await supabase
    .from('funnel_versions')
    .update({ questionnaire_config: result.data })
    .eq('id', versionId)
}
```

## Summary

1. **Source:** `funnel_versions.questionnaire_config` JSONB
2. **Schema:** `FunnelQuestionnaireConfigSchema` (Zod validated)
3. **Types:** All from `QUESTION_TYPE` registry (no fantasy names)
4. **Operators:** All from `ConditionalLogic` schema (strict validation)
5. **Resume:** Deterministic via `initQuestionnaireStateWithResume`
6. **Errors:** Throw on unknown operators, controlled UI for unknown types
7. **Testing:** 62 tests validate all behaviors
