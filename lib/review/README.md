# Review Queue Module - V05-I05.7

Medical QA review queue for flagged jobs (validation/safety failures) plus deterministic sampling for quality assurance.

## Overview

The review queue system allows clinicians and admins to review jobs that:
1. **Failed validation** - Medical validation layer 1 (rules-based) raised critical flags
2. **Failed safety check** - Medical validation layer 2 (AI-based) returned BLOCK or UNKNOWN
3. **Were sampled** - Deterministically selected for quality assurance (configurable percentage)

## Key Features

- **Deterministic Sampling**: Same job + config → same sampling decision (stable hash)
- **RBAC**: Only clinician/admin can access review queue and make decisions
- **Audit Trail**: All decisions logged with reviewer ID, timestamp, reason codes (PHI-free)
- **Idempotent**: Same decision can be applied multiple times without error
- **PHI-Free**: Queue responses contain only references, codes, and aggregated summaries

## Database Schema

**Table**: `public.review_records`

Key fields:
- `job_id` - Processing job reference
- `status` - PENDING, APPROVED, REJECTED, CHANGES_REQUESTED
- `queue_reasons` - Array of codes (VALIDATION_FAIL, SAFETY_BLOCK, SAMPLED, etc.)
- `is_sampled` - Whether included via sampling
- `sampling_hash` - Deterministic hash for sampling decision
- `reviewer_user_id` - Reviewer reference (no PHI)
- `decision_reason_code` - Coded reason for decision

**Functions**:
- `compute_sampling_hash(job_id, salt)` - Stable SHA-256 hash
- `should_sample_job(job_id, percentage, salt)` - Deterministic sampling decision

## API Endpoints

### List Queue
```http
GET /api/review/queue?status=PENDING&limit=50&offset=0&counts=true
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": { "limit": 50, "offset": 0, "count": 12 },
    "counts": { "PENDING": 12, "APPROVED": 45, "REJECTED": 3, "CHANGES_REQUESTED": 2 }
  }
}
```

### Get Review Details
```http
GET /api/review/{reviewId}
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "jobId": "uuid",
    "status": "PENDING",
    "queueReasons": ["VALIDATION_FAIL", "SAFETY_FLAG"],
    ...
  }
}
```

### Make Decision
```http
POST /api/review/{reviewId}/decide
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED",
  "reasonCode": "APPROVED_FALSE_POSITIVE",
  "notes": "Flag was determined to be false positive after manual review"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "reviewId": "uuid",
    "status": "APPROVED",
    "decidedAt": "2026-01-04T12:00:00.000Z"
  }
}
```

## Usage Examples

### Add Job to Queue (Programmatic)

```typescript
import { addToQueueIfNeeded } from '@/lib/review/queueHelper'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

const admin = createAdminSupabaseClient()

const result = await addToQueueIfNeeded(admin, {
  jobId: 'uuid',
  validationResultId: 'uuid',
  validationStatus: 'fail',
  safetyCheckId: 'uuid',
  safetyAction: 'BLOCK',
  samplingConfig: {
    percentage: 10,
    salt: 'v1-salt',
    version: 'v1.0.0',
  },
})

if (result.success && result.data.queued) {
  console.log(`Added to queue: ${result.data.reviewId}`)
}
```

### List Pending Reviews

```typescript
import { listReviewQueue } from '@/lib/review/persistence'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

const admin = createAdminSupabaseClient()

const result = await listReviewQueue(admin, {
  status: 'PENDING',
  limit: 50,
})

if (result.success) {
  for (const item of result.data) {
    console.log(`Review ${item.reviewId}: ${item.queueReasons.join(', ')}`)
  }
}
```

### Make Review Decision

```typescript
import { updateReviewDecision } from '@/lib/review/persistence'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

const admin = createAdminSupabaseClient()

const result = await updateReviewDecision(admin, {
  reviewId: 'uuid',
  decision: {
    status: 'APPROVED',
    reasonCode: 'APPROVED_SAFE',
    notes: 'Content reviewed and approved',
  },
  reviewerUserId: 'uuid',
  reviewerRole: 'clinician',
})

if (result.success) {
  console.log(`Decision recorded: ${result.data.status}`)
}
```

## Configuration

### Sampling Percentage

Set via environment variables:

```bash
REVIEW_SAMPLING_PERCENTAGE=10  # Default: 10% of passing jobs
REVIEW_SAMPLING_SALT=v1-salt   # Default: 'v05-i05-7-default-salt'
```

## Decision Reason Codes

### Approvals
- `APPROVED_SAFE` - Content is safe to proceed
- `APPROVED_FALSE_POSITIVE` - Flag was a false positive
- `APPROVED_ACCEPTABLE_RISK` - Risk is acceptable
- `APPROVED_SAMPLED_OK` - Sampled content is acceptable

### Rejections
- `REJECTED_UNSAFE` - Content has safety concerns
- `REJECTED_CONTRAINDICATION` - Contraindication detected
- `REJECTED_PLAUSIBILITY` - Plausibility issue
- `REJECTED_QUALITY` - Quality not acceptable
- `REJECTED_POLICY` - Policy violation

### Changes Requested
- `CHANGES_NEEDED_CLARIFICATION` - Needs clarification
- `CHANGES_NEEDED_TONE` - Tone adjustment needed
- `CHANGES_NEEDED_CONTENT` - Content revision needed

## Testing

```bash
# Run review-specific tests
npm test -- lib/contracts/__tests__/reviewRecord.test.ts
npm test -- lib/review/__tests__/queueHelper.test.ts

# Run full test suite
npm test
```

## Database Setup

After running migrations locally:

```powershell
# Apply migrations
supabase db reset

# Generate TypeScript types
npm run db:typegen

# Verify
npm run db:verify
```

## Security & Compliance

- **PHI-Free**: No patient data in queue responses or audit logs
- **RBAC**: Only authorized roles can access/modify review records
- **Audit Trail**: All decisions logged with WHO, WHEN, WHAT, WHY
- **Idempotent**: Safe to retry decisions
- **Fail-Safe**: Sampling failure → manual review (not auto-approve)

## Integration Points

This module integrates with:
- **I05.5**: Medical Validation Layer 1 (rules-based)
- **I05.6**: Medical Validation Layer 2 (AI safety check)
- **I05.1**: Processing Orchestrator (job management)
- **Audit System**: `lib/audit/log.ts`

## Status Codes

- `200` - Success
- `201` - Created (new decision)
- `400` - Bad request (validation error)
- `401` - Authentication required
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `422` - Unprocessable entity (processing failed)
- `500` - Internal error
