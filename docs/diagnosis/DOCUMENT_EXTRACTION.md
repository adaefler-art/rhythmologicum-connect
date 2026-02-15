# Document Extraction Pipeline (V05-I04.2)

## Overview

The AI extraction pipeline enables automated extraction of structured data from uploaded medical documents using Claude AI. The pipeline is versioned, deterministic, and idempotent, ensuring that the same document processed with the same extractor version produces consistent results.

## Architecture

### Pipeline Flow

```
Document Upload (I04.1)
    ↓
Parsing (Manual/Future: OCR)
    ↓
Document Status = 'completed'
    ↓
Extraction Trigger (POST /api/documents/[id]/extract)
    ↓
Input Hash Computation (SHA-256)
    ↓
Idempotency Check (existing extraction?)
    ↓
AI Extraction (Anthropic Claude)
    ↓
Schema Validation (Zod)
    ↓
Persist Results (JSONB fields)
    ↓
Response with extracted data + confidence
```

### Key Components

1. **Extractor Versioning**: Uses semantic versioning (`v1.0.0`) defined in contracts registry
2. **Input Hashing**: SHA-256 hash of `{storage_path, extractor_version, parsed_text_hash}`
3. **Idempotency**: Unique constraint on `(document_id, extractor_version, input_hash)`
4. **Schema Validation**: Zod schemas for extracted data and confidence metadata
5. **PHI-Safe Logging**: Only logs document UUIDs, versions, and status codes

## Database Schema

### New Columns in `documents` Table

```sql
-- Extraction pipeline fields (V05-I04.2)
extractor_version TEXT             -- Versioned extractor identifier (e.g., 'v1.0.0')
input_hash TEXT                     -- SHA-256 hash of inputs for idempotency
extracted_json JSONB DEFAULT '{}'  -- Structured extracted data
confidence_json JSONB DEFAULT '{}'  -- Per-field confidence + evidence
```

### Indexes

- `idx_documents_extractor_version`: Faster lookups by version
- `idx_documents_input_hash`: Faster lookups by input hash
- `idx_documents_extraction_idempotency`: Unique constraint on `(id, extractor_version, input_hash)`

## Extractor Versioning

Extractor versions are defined in `lib/contracts/registry.ts`:

```typescript
export const EXTRACTOR_VERSION = {
  V1_0_0: 'v1.0.0', // Initial extraction pipeline
} as const

export const CURRENT_EXTRACTOR_VERSION = EXTRACTOR_VERSION.V1_0_0
```

**When to increment version:**
- **Patch (v1.0.1)**: Bug fixes, minor prompt tweaks
- **Minor (v1.1.0)**: New extractable fields, improved prompts
- **Major (v2.0.0)**: Breaking changes to schema or extraction logic

## API Endpoint

### POST /api/documents/[id]/extract

Triggers AI extraction for a document in PARSED (`completed`) state.

**Request Body (optional):**
```json
{
  "force_reextract": false,  // Optional: force re-extraction even if exists
  "parsed_text": "..."       // Optional: provide parsed text if available
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "document_id": "uuid",
    "extractor_version": "v1.0.0",
    "input_hash": "abc123...",
    "extraction_created": true,
    "extracted_data": {
      "lab_values": [
        {
          "test_name": "Cholesterol",
          "value": 180,
          "unit": "mg/dL",
          "reference_range": "< 200",
          "date": "2026-01-01"
        }
      ],
      "medications": [
        {
          "name": "Aspirin",
          "dosage": "81mg",
          "frequency": "daily",
          "route": "oral"
        }
      ],
      "vital_signs": {
        "blood_pressure": "120/80",
        "heart_rate": 72
      },
      "diagnoses": ["Hypertension"]
    },
    "confidence": {
      "overall_confidence": 0.85,
      "field_confidence": {
        "lab_values.0.test_name": 0.95,
        "lab_values.0.value": 0.90
      },
      "evidence": {
        "lab_values.0": {
          "page": 1,
          "section": "Lab Results",
          "confidence_score": 0.92
        }
      },
      "extraction_timestamp": "2026-01-03T13:30:00Z"
    }
  }
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|-----------|-------------|
| 401 | UNAUTHORIZED | Not authenticated |
| 403 | FORBIDDEN | User doesn't own document |
| 404 | INVALID_STATE | Document not found |
| 409 | INVALID_STATE | Document state conflict |
| 422 | NOT_PARSED | Document not in PARSED state |
| 500 | EXTRACTION_FAILED | AI extraction failed |
| 500 | STORAGE_ERROR | Failed to persist results |

## Extracted Data Schema

### Supported Fields

```typescript
type ExtractedData = {
  lab_values?: Array<{
    test_name: string
    value: number | string
    unit?: string
    reference_range?: string
    date?: string
  }>
  medications?: Array<{
    name: string
    dosage?: string
    frequency?: string
    route?: string
  }>
  vital_signs?: Record<string, number | string>
  diagnoses?: string[]
  notes?: string
}
```

### Validation

All extracted data is validated against Zod schemas before persistence:

```typescript
import { validateExtractedData } from '@/lib/types/extraction'

const result = validateExtractedData(data)
if (!result.valid) {
  console.error('Validation failed:', result.error)
}
```

## Confidence Metadata

### Structure

```typescript
type ConfidenceMetadata = {
  overall_confidence: number        // 0.0 to 1.0
  field_confidence: Record<string, number>  // Per-field scores
  evidence: Record<string, EvidencePointer> // PHI-safe references
  extraction_timestamp: string      // ISO 8601
}

type EvidencePointer = {
  page?: number           // Page number in document
  section?: string        // Section name (e.g., "Lab Results")
  confidence_score: number // 0.0 to 1.0
}
```

### PHI-Safe Evidence

Evidence pointers DO NOT include:
- ❌ Document text or content
- ❌ Patient names or identifiers
- ❌ Specific data values

Evidence pointers DO include:
- ✅ Page numbers
- ✅ Section names
- ✅ Confidence scores
- ✅ Generic location descriptors

## Idempotency

### How It Works

1. **Input Hash Computation**: SHA-256 of normalized inputs
   ```typescript
   const inputHash = await computeExtractionInputHash({
     storagePath: 'user/assessment/doc.pdf',
     extractorVersion: 'v1.0.0',
     parsedText: 'document content...'
   })
   ```

2. **Uniqueness Constraint**: Database enforces unique `(document_id, extractor_version, input_hash)`

3. **Check Before Extract**: Pipeline checks for existing extraction
   ```typescript
   const existing = await checkExtractionExists(
     supabase,
     documentId,
     extractorVersion,
     inputHash
   )
   if (existing.exists) {
     return existing.extraction // Return cached result
   }
   ```

### Benefits

- **Cost Savings**: Avoid re-running expensive AI operations
- **Consistency**: Same inputs → same outputs
- **Auditability**: Track when inputs changed requiring re-extraction

## Security

### Authentication & Authorization

- ✅ All endpoints require authentication (401 if not)
- ✅ Ownership verified via assessment → patient_id → user_id chain
- ✅ RLS policies enforce row-level access control

### PHI Protection

- ✅ Logs contain only UUIDs and metadata
- ✅ No document content in logs
- ✅ Evidence pointers are PHI-safe
- ✅ Extracted data stored encrypted at rest (Supabase JSONB)

### Rate Limiting

- Current: None (backend handles AI rate limits)
- Future: Consider per-user rate limits for extraction triggers

## Usage Examples

### Trigger Extraction

```typescript
const response = await fetch(`/api/documents/${documentId}/extract`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ force_reextract: false })
})

const result = await response.json()
if (result.success) {
  console.log('Extracted data:', result.data.extracted_data)
  console.log('Confidence:', result.data.confidence.overall_confidence)
}
```

### Server-Side Pipeline

```typescript
import { runExtractionPipeline } from '@/lib/extraction/pipeline'

const result = await runExtractionPipeline(supabase, {
  documentId: 'doc-uuid',
  forceReextract: false,
  parsedText: 'optional parsed text'
})

if (result.success) {
  console.log('Extraction:', result.extraction)
} else {
  console.error('Error:', result.error)
}
```

## Testing

### Unit Tests

Located in `lib/extraction/__tests__/pipeline.test.ts`:

- ✅ Input hash computation (23 tests total)
- ✅ Document state validation
- ✅ Idempotency checking
- ✅ Schema validation
- ✅ Helper functions

Run tests:
```bash
npm test -- lib/extraction/__tests__/pipeline.test.ts
```

### Integration Testing

Manual testing workflow:

1. Upload document → get document_id
2. Set parsing_status to 'completed'
3. Trigger extraction: `POST /api/documents/{id}/extract`
4. Verify response contains extracted_data and confidence
5. Trigger again → should return cached result (idempotency)
6. Change extractor_version → should create new extraction

## Monitoring

### Logs to Monitor

- `[extract] POST request received` - Extraction triggered
- `[runExtractionPipeline] Starting pipeline` - Pipeline started
- `[extractDataWithAI] Starting extraction` - AI call started
- `[extractDataWithAI] AI response received` - AI call completed
- `[extract] Success` - Extraction completed

### Error Logs

- `[extract] Document not found` - Invalid document_id
- `[extractDataWithAI] AI extraction failed` - AI call failed
- `[persistExtractionResult] Database update failed` - Persistence failed

### Metrics to Track

- Extraction success rate
- Average extraction duration
- AI API costs per extraction
- Idempotency hit rate (cached vs new)

## Future Enhancements (Out of Scope)

- Patient confirmation UI (I04.3)
- Multi-page document support
- OCR for image-based PDFs
- Structured form extraction (checkboxes, signatures)
- Confidence threshold alerts
- Batch extraction API

## References

- Issue: V05-I04.2
- Migration: `20260103130600_add_extraction_pipeline_fields.sql`
- Types: `lib/types/extraction.ts`
- Pipeline: `lib/extraction/pipeline.ts`
- API Route: `app/api/documents/[id]/extract/route.ts`
- Tests: `lib/extraction/__tests__/pipeline.test.ts`
- Contract: `lib/contracts/registry.ts` (EXTRACTOR_VERSION)

---

**Last Updated**: 2026-01-03  
**Version**: V05-I04.2  
**Status**: Implementation Complete
