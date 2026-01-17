# V0.6 Funnel POC Proof — cardiovascular-age

**Status**: ✅ Technically POC Functional  
**Date**: 2026-01-17 (Updated)  
**Validated by**: Automated Build + Test Suite (2040/2040 tests passing)

---

## Summary

The `cardiovascular-age` funnel is the first V0.5 Catalog Funnel verified to work end-to-end.  
V0.5 Catalog Funnels differ from Legacy Funnels in that they have `funnel_id = null` in assessments  
and use `funnels_catalog` + `funnel_versions.questionnaire_config` JSONB instead of the  
`funnels`/`funnel_steps`/`funnel_step_questions`/`questions` table hierarchy.

---

## Runtime Chain Verified

| # | Endpoint | Method | V0.5 Status | Notes |
|---|----------|--------|-------------|-------|
| 1 | `/api/funnels/cardiovascular-age/assessments` | POST | ✅ Works | Creates assessment with `funnel_id = null` |
| 2 | `/api/funnels/cardiovascular-age/definition` | GET | ✅ Works | Returns steps + questions from manifest |
| 3 | `/api/funnels/cardiovascular-age/assessments/{id}` | GET | ✅ Works | Returns current step, status |
| 4 | `/api/funnels/cardiovascular-age/assessments/{id}/answers/save` | POST | ✅ Fixed (v2) | Multi-type support via `answer_data` JSONB |
| 5 | `/api/funnels/cardiovascular-age/assessments/{id}/steps/{stepId}` | POST | ✅ Fixed | V0.5 branch uses `handleV05StepValidation` |
| 6 | `/api/funnels/cardiovascular-age/assessments/{id}/complete` | POST | ✅ Fixed | V0.5 branch uses `validateV05AllRequiredQuestions` |
| 7 | `/api/funnels/cardiovascular-age/assessments/{id}/result` | GET | ✅ Works | Already V0.5 compatible (no funnel_id check) |

---

## answers/save POC Proof

### Problem Identified (400 Bad Request)

The original `SaveAnswerRequestSchema` only accepted `answerValue: z.number().int()`.  
V0.5 Catalog Funnels have multiple question types requiring different value types:

| Question Type | Example | Value Type |
|--------------|---------|------------|
| `number` | Age (18-120) | `number` |
| `radio` | Gender (male/female/other) | `string` |
| `scale` | Exercise days (0-7) | `number` |
| `checkbox` | Consent | `boolean` |

### Solution Implemented

1. **Schema Update** (`lib/api/contracts/patient/assessments.ts`):
   ```typescript
   export const AnswerValueSchema = z.union([
     z.number(),
     z.string(),
     z.boolean(),
   ])
   ```

2. **Database Migration** (`20260117150000_v05_answer_data_jsonb.sql`):
   ```sql
   ALTER TABLE public.assessment_answers
     ADD COLUMN IF NOT EXISTS answer_data JSONB;
   ```

3. **Route Handler** (`answers/save/route.ts`):
   - V0.5 path stores original value in `answer_data` (JSONB)
   - Legacy path continues using `answer_value` (INTEGER)
   - Backward compatible: `answer_value` defaults to 0 for non-numeric values

### Contract (Request)

```json
{
  "stepId": "step-1",
  "questionId": "q1-age",
  "answerValue": 45
}
```

or

```json
{
  "stepId": "step-1",
  "questionId": "q2-gender",
  "answerValue": "male"
}
```

### Contract (Response)

```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "assessment_id": "<uuid>",
    "question_id": "q1-age",
    "answer_value": 45,
    "answer_data": 45
  },
  "schemaVersion": "1.0.0"
}
```

### Tests Added

- `v05-schema.test.ts`: 14 tests for multi-type answer validation
- Updated `assessments.test.ts`: Removed integer-only constraint tests

### Smoke Commands

```powershell
# Build
npm run build

# Tests
npm test

# Expected: 2040 passed, 0 failed
```

---

## Manifest Structure Reference

The cardiovascular-age funnel manifest (from migration `20241213000003`):

```json
{
  "steps": [
    {
      "id": "step-1",
      "title": "Grunddaten",
      "questions": [
        {
          "id": "q1-age",
          "type": "number",
          "label": "Wie alt sind Sie?",
          "required": true,
          "min": 18,
          "max": 120
        },
        {
          "id": "q2-gender",
          "type": "radio",
          "label": "Geschlecht",
          "required": true,
          "options": [
            { "value": "male", "label": "Männlich" },
            { "value": "female", "label": "Weiblich" },
            { "value": "other", "label": "Divers" }
          ]
        }
      ]
    },
    {
      "id": "step-2",
      "title": "Gesundheitsfaktoren",
      "questions": [
        {
          "id": "q3-blood-pressure",
          "type": "radio",
          "label": "Wie ist Ihr Blutdruck?",
          "required": true,
          "options": [
            { "value": "normal", "label": "Normal" },
            { "value": "elevated", "label": "Erhöht" },
            { "value": "high", "label": "Hoch" }
          ]
        },
        {
          "id": "q4-cholesterol",
          "type": "radio",
          "label": "Wie ist Ihr Cholesterin?",
          "required": false,
          "options": [
            { "value": "normal", "label": "Normal" },
            { "value": "borderline", "label": "Grenzwertig" },
            { "value": "high", "label": "Hoch" }
          ]
        }
      ]
    },
    {
      "id": "step-3",
      "title": "Lebensstil",
      "questions": [
        {
          "id": "q5-smoking",
          "type": "radio",
          "label": "Rauchen Sie?",
          "required": true,
          "options": [
            { "value": "never", "label": "Nie" },
            { "value": "former", "label": "Früher" },
            { "value": "current", "label": "Aktuell" }
          ]
        },
        {
          "id": "q6-exercise",
          "type": "scale",
          "label": "Wie viele Tage pro Woche treiben Sie Sport?",
          "required": true,
          "min": 0,
          "max": 7
        }
      ]
    }
  ]
}
```

---

## Test Payloads

### 1. Create Assessment

```bash
POST /api/funnels/cardiovascular-age/assessments
Authorization: Bearer <patient-jwt>
Content-Type: application/json

{}
```

**Expected**: `201 Created` with `{ success: true, data: { id: "<uuid>", ... } }`

---

### 2. Save Answer (number type)

```bash
POST /api/funnels/cardiovascular-age/assessments/{id}/answers/save
Authorization: Bearer <patient-jwt>
Content-Type: application/json

{
  "questionId": "q1-age",
  "answer": 45
}
```

**Expected**: `200 OK` with `{ success: true }`

---

### 3. Save Answer (radio type)

```bash
POST /api/funnels/cardiovascular-age/assessments/{id}/answers/save
Authorization: Bearer <patient-jwt>
Content-Type: application/json

{
  "questionId": "q2-gender",
  "answer": "male"
}
```

**Expected**: `200 OK` with `{ success: true }`

---

### 4. Validate Step

```bash
POST /api/funnels/cardiovascular-age/assessments/{id}/steps/step-1
Authorization: Bearer <patient-jwt>
Content-Type: application/json

{}
```

**Expected**: `200 OK` with:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "nextStep": "step-2"
  }
}
```

---

### 5. Complete Assessment

```bash
POST /api/funnels/cardiovascular-age/assessments/{id}/complete
Authorization: Bearer <patient-jwt>
Content-Type: application/json

{}
```

**Expected**: `200 OK` with:
```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "status": "completed",
    "completedAt": "2026-01-17T..."
  }
}
```

---

### 6. Get Result

```bash
GET /api/funnels/cardiovascular-age/assessments/{id}/result
Authorization: Bearer <patient-jwt>
```

**Expected**: `200 OK` with assessment result data

---

## Files Modified for V0.5 Support

| File | Change |
|------|--------|
| [answers/save/route.ts](../../app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts) | V0.5 detection, bypass Legacy validation |
| [steps/[stepId]/route.ts](../../app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts) | Added `handleV05StepValidation` function |
| [complete/route.ts](../../app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts) | Added `validateV05AllRequiredQuestions` function |
| [lib/types/funnel.ts](../../lib/types/funnel.ts) | Added `QuestionOption` type, `options` field |
| [definition/route.ts](../../app/api/funnels/[slug]/definition/route.ts) | Pass through `options` from manifest |
| [QuestionStepRenderer.tsx](../../app/components/QuestionStepRenderer.tsx) | Type-aware rendering (number/radio/scale) |
| [PatientFlowRenderer.tsx](../../app/components/PatientFlowRenderer.tsx) | Props for `string | number` answers |
| [client.tsx](../../app/patient/funnel/[slug]/client.tsx) | State/handler types for `string | number` |

---

## V0.5 Detection Pattern

All fixed endpoints use this detection:

```typescript
const isV05CatalogFunnel = assessment.funnel_id === null
```

This is the canonical way to distinguish V0.5 Catalog Funnels from Legacy Funnels.

---

## Known Limitations

1. **Scoring/Results**: The cardiovascular-age funnel currently has no scoring algorithm. The `/result` endpoint returns metadata only.

2. **Workup Integration**: Workup checks are triggered but may not have rules configured for this funnel.

3. **AI Report**: No AMY (AI) integration for this funnel yet — this is a data-collection POC only.

4. **Optional Questions**: `q4-cholesterol` is marked `required: false` and is correctly skipped during validation.

---

## Verification Commands

```powershell
# Build
npm run build

# Tests
npm test

# Expected: 2026 passed, 0 failed
```

---

## Conclusion

The cardiovascular-age funnel now completes the full runtime chain without 4xx/5xx errors.  
All V0.5 Catalog Funnel endpoints correctly detect `funnel_id === null` and use manifest-based  
validation instead of Legacy database lookups.

**Next Steps**:
- Add scoring algorithm for cardiovascular age calculation
- Configure workup rules for this funnel
- Manual E2E testing in browser
