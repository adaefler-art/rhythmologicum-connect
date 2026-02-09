# Consultation Fact Extraction Pipeline (Issue 7)

This module extracts structured facts from consultation notes and feeds them into the existing Risk/Results pipeline.

## Purpose

Enable PAT to have natural conversations with patients while generating the structured risk signals that clinicians need, without patients ever seeing "assessment" terminology.

## Architecture

```
Consultation Note → Extract Facts → Synthetic Assessment → Risk/Results Pipeline
                                                          ↓
                                                   calculated_results (SSOT)
```

## Files

### Core Modules

- **`types.ts`** - Type definitions and Zod schemas for extraction pipeline
- **`questionMapping.ts`** - Configuration mapping consultation sections to question IDs
- **`factExtraction.ts`** - Extraction logic that applies mappings to content
- **`syntheticAssessment.ts`** - Creates assessments from extracted facts
- **`pipeline.ts`** - Main orchestration and entry point
- **`index.ts`** - Re-exports for easy importing

### Tests

- **`__tests__/factExtraction.test.ts`** - Unit tests for fact extraction
- **`__tests__/questionMapping.test.ts`** - Unit tests for mapping configuration

## Quick Start

### Extract Facts from Consultation

```typescript
import { processConsultationToRiskPipeline } from '@/lib/consultation'

const result = await processConsultationToRiskPipeline({
  supabase,
  consultNoteId: 'abc-123',
  options: {
    minConfidence: 0.6,  // Only high-confidence facts
    skipLowConfidence: true,
  }
})

if (result.success) {
  console.log(`Assessment: ${result.assessmentId}`)
  console.log(`Facts: ${result.factCount}`)
  // Risk Stage can now process this assessment
}
```

### Add New Question Mapping

Edit `questionMapping.ts`:

```typescript
{
  questionId: 'anxiety_level',
  questionLabel: 'Anxiety Level',
  description: 'Extracts anxiety severity from HPI and problem list',
  extractionLogic: (content) => {
    // Your extraction logic here
    // Must return integer (0-10) or null
    return 5
  },
  confidenceEstimator: (content) => {
    // Return confidence 0-1
    return 0.7
  }
}
```

## Example Mappings

### Stress Level from Problem List

```typescript
questionId: 'stress_level_overall'
Logic: Count problems → score
  - 7+ problems → 9 (high stress)
  - 5-6 problems → 7 (moderate-high)
  - 3-4 problems → 5 (moderate)
  - 1-2 problems → 3 (low-moderate)
Confidence: 0.8 if 3+ problems, else 0.6
```

### Sleep Quality from Objective Data

```typescript
questionId: 'sleep_quality'
Logic: Sleep hours → quality score
  - <5 hours → 2 (poor)
  - 5-6 hours → 4 (fair)
  - 7-9 hours → 8 (good)
  - >9 hours → 6 (excessive)
  - HPI mentions sleep issues → 3 (problematic)
Confidence: 0.9 for objective data, 0.6 for HPI mentions
```

### Functional Impairment from HPI

```typescript
questionId: 'functional_impairment'
Logic: Keyword matching in functionalImpact
  - "severe" / "unable" → 9
  - "significant" / "major" → 7
  - "moderate" → 5
  - "mild" / "minor" → 3
  - "minimal" / "none" → 1
Confidence: 0.8 if has qualifier, else 0.5
```

### Red Flags Count

```typescript
questionId: 'red_flags_count'
Logic: Count positive red flags (capped at 10)
Confidence: 1.0 if screened, 0.0 if not screened
```

## API

### `processConsultationToRiskPipeline(params)`

Main pipeline orchestrator.

**Parameters:**
- `supabase: SupabaseClient` - Database client
- `consultNoteId: string` - UUID of consultation note
- `options?: ExtractionPipelineOptions`
  - `minConfidence?: number` - Minimum confidence (default: 0.5)
  - `skipLowConfidence?: boolean` - Filter low-confidence facts (default: false)
  - `dryRun?: boolean` - Extract without saving (default: false)
  - `funnelSlug?: string` - Target funnel (default: "stress-assessment")

**Returns:** `ExtractionPipelineResult`
```typescript
{
  success: boolean
  assessmentId?: string
  factCount: number
  skippedFactCount: number
  errors?: string[]
  metadata?: SyntheticAssessmentMetadata
}
```

### `extractFactsFromConsultation(params)`

Extracts facts from consultation content.

**Parameters:**
- `consultNoteId: string`
- `patientId: string`
- `content: ConsultNoteContent` - 12-section structure
- `consultationType: 'first' | 'follow_up'`
- `uncertaintyProfile: 'off' | 'qualitative' | 'mixed'`
- `minConfidence?: number`

**Returns:** `ConsultationExtractionResult`

### `createSyntheticAssessment(params)`

Creates assessment from extracted facts.

**Parameters:**
- `supabase: SupabaseClient`
- `patientId: string`
- `consultNoteId: string`
- `extractedFacts: ExtractedFact[]`
- `funnelSlug?: string`

**Returns:**
```typescript
{
  success: boolean
  assessmentId?: string
  errorCode?: string
  errorMessage?: string
}
```

## Constants

```typescript
EXTRACTOR_VERSION = 'v1.0.0'
DEFAULT_CONSULTATION_FUNNEL = 'stress-assessment'
MIN_CONFIDENCE_THRESHOLD = 0.5
```

## Validation

### Extracted Fact Validation (R-I7-09 to R-I7-12)

- ✅ Question ID must be string
- ✅ Answer value must be integer
- ✅ Confidence must be 0-1
- ✅ Source must be non-empty string
- ✅ extractedAt must be valid ISO timestamp

### Mapping Configuration Validation (R-I7-01 to R-I7-04)

- ✅ No duplicate question IDs
- ✅ All required fields present
- ✅ extractionLogic returns number or null
- ✅ Confidence estimator returns 0-1

Run validation:
```bash
node scripts/ci/verify-issue-7-extraction.mjs
```

## Testing

### Run Unit Tests

```bash
npm test -- lib/consultation/__tests__
```

### Test Coverage

- Fact extraction logic
- Mapping configuration validity
- Assessment creation
- Idempotency
- Validation functions
- Confidence filtering

## Guardrails

26 rules enforced with corresponding checks:

**Mapping Configuration (R-I7-01 to R-I7-04)**
- Question ID validity
- Return type correctness
- Confidence bounds
- Source attribution

**Fact Extraction (R-I7-05 to R-I7-12)**
- Confidence threshold filtering
- Source section reference
- Integer-only values
- Deterministic extraction
- Validation enforcement

**Assessment Creation (R-I7-13 to R-I7-20)**
- Patient linkage
- Completion status
- Metadata provenance
- Answer persistence
- Idempotency
- Update handling

**Pipeline Integration (R-I7-21 to R-I7-26)**
- Idempotent behavior
- Patient invisibility
- SSOT preservation
- No new risk adapters
- Existing pipeline usage

See `ISSUE-07-RULES-VS-CHECKS-MATRIX.md` for full traceability.

## Performance

- **Extraction:** <100ms for typical consultation
- **Database:** Single fetch + batch insert
- **Parallelizable:** Can process multiple consultations concurrently
- **Idempotent:** Safe to retry on failure

## Security

- PHI isolation - no patient data in logs
- Metadata only in answer_data (confidence, source)
- Access control via RLS policies
- Audit trail in metadata

## Future Enhancements

### v1.1 (Short-term)
- Expanded mappings (anxiety, depression, vitals)
- AI-enhanced extraction (LLM-based)
- Confidence tuning via ML

### v2.0 (Medium-term)
- Multi-funnel support
- Temporal analysis (trends)
- Domain-specific validation

### v3.0 (Long-term)
- Bidirectional sync (clinician overrides)
- Custom mappings UI
- Version control for mappings

## Related Documentation

- **Implementation Summary:** `ISSUE-07-IMPLEMENTATION-SUMMARY.md`
- **Rules/Checks Matrix:** `ISSUE-07-RULES-VS-CHECKS-MATRIX.md`
- **Consultation Notes:** `lib/types/consultNote.ts`
- **Risk Pipeline:** `lib/processing/riskStageProcessor.ts`
- **Results Pipeline:** `lib/processing/resultsStageProcessor.ts`

## Support

For questions or issues:
1. Check implementation summary documentation
2. Run verification script to validate setup
3. Review rules/checks matrix for requirements
4. Check tests for usage examples
