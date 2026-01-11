# V05-I05.8 Hardening Evidence

**Date**: 2026-01-04  
**Commits**: 6bb5f39, bd3ced6  
**Status**: ✅ COMPLETE

## Changes Summary

All requirements from @adaefler-art's hardening request implemented and tested.

## 1. Clinician Access Policy Consistency ✅

**Requirement**: Match processing_jobs RLS policy (V05-I05.1) - require explicit clinician-patient assignment.

**Implementation** (`lib/pdf/storage.ts`):
```typescript
// Lines 176-189: Check clinician_patient_assignments table
if (userRole === 'clinician' || userRole === 'admin') {
  const { data: assignment } = await supabase
    .from('clinician_patient_assignments')
    .select('id')
    .eq('clinician_user_id', userId)
    .eq('patient_user_id', patientProfile.user_id)
    .single()

  if (!assignment) {
    return { authorized: false, error: 'Clinician not assigned to this patient' }
  }
}
```

**Evidence**:
- Query matches RLS policy in `supabase/migrations/20260103150000_v05_i05_1_create_processing_jobs.sql` lines 173-188
- Test: `app/api/reports/__tests__/pdf.rbac.test.ts` line 23-33

## 2. API Security: Auth-First + 404-on-Denial ✅

### Auth-First (DoS Prevention)

**Requirement**: Check auth BEFORE parsing request body.

**Implementation** (`app/api/processing/pdf/route.ts`):
```typescript
// Line 48: Comment updated to clarify auth-first pattern
// STEP 1: Authentication Check (BEFORE parsing body - DoS prevention)

// Line 49-56: Auth check
const user = await getCurrentUser()
if (!user) { return unauthorizedResponse() }

// Line 61: Body parsing AFTER auth
const body = await request.json()
```

**Evidence**:
- Auth at line 49, parsing at line 61
- Test: `app/api/processing/pdf/__tests__/route.auth-first.test.ts`

### 404-on-Denial

**Requirement**: Return 404 instead of 403 for unauthorized access.

**Implementation** (`app/api/reports/[reportId]/pdf/route.ts`):
```typescript
// Line 109-117: Changed from forbiddenResponse to notFoundResponse
if (!accessCheck.authorized) {
  logForbidden(...)
  // Return 404 instead of 403 to avoid disclosing resource existence
  return notFoundResponse('Report', 'Report nicht gefunden.')
}
```

**Evidence**:
- Changed from `forbiddenResponse()` to `notFoundResponse()`
- Comment added explaining resource existence disclosure prevention
- Test: `app/api/reports/__tests__/pdf.rbac.test.ts` line 10-21

## 3. Idempotency & Determinism ✅

**Requirement**: Same input → no re-upload. Changed content → safe replacement.

**Implementation** (`lib/processing/pdfStageProcessor.ts`):

### Step 1: Compute Content Hash (lines 77-80)
```typescript
const sectionsJson = JSON.stringify(sections)
const currentContentHash = computePdfHash(Buffer.from(sectionsJson))
```

### Step 2: Check for Existing PDF (lines 82-97)
```typescript
if (jobWithPdf.pdf_path && 
    jobWithPdf.pdf_metadata &&
    jobWithPdf.pdf_metadata.sectionsContentHash === currentContentHash) {
  // Return existing PDF, no regeneration
  return {
    success: true,
    data: {
      pdfPath: jobWithPdf.pdf_path,
      metadata: jobWithPdf.pdf_metadata,
      generationTimeMs: 0  // No generation needed
    }
  }
}
```

### Step 3: Delete Old PDF if Content Changed (lines 99-106)
```typescript
if (jobWithPdf.pdf_path) {
  console.log('[PDF_CONTENT_CHANGED]', { jobId, oldPath: jobWithPdf.pdf_path })
  await deletePdfFromStorage(jobWithPdf.pdf_path)  // Best-effort delete
}
```

### Step 4: Store Content Hash (lines 238-242)
```typescript
const metadataWithHash = {
  ...pdfResult.metadata,
  sectionsContentHash: currentContentHash,  // Store for future checks
}
```

**Evidence**:
- Hash computation uses same `computePdfHash()` as PDF content
- Best-effort delete prevents orphaned PDFs
- Tests: `lib/processing/__tests__/pdfStageProcessor.idempotency.test.ts` (4 tests)
  - Line 14-34: Idempotent return
  - Line 36-49: Content change handling
  - Line 51-63: First run
  - Line 65-78: Hash storage

## 4. Storage Security ✅

**Requirement**: Validate signed URL expiry bounds.

**Implementation** (`app/api/reports/[reportId]/pdf/route.ts`):
```typescript
// Line 126-131: Parse and validate expiry parameter
const expiresInParam = searchParams.get('expiresIn')
let expiresIn = 3600  // Default: 1 hour

if (expiresInParam) {
  const parsed = parseInt(expiresInParam, 10)
  // Enforce bounds: min 60s (1 min), max 86400s (24 hours)
  if (!isNaN(parsed) && parsed >= 60 && parsed <= 86400) {
    expiresIn = parsed
  }
}
```

**Evidence**:
- Min: 60 seconds (1 minute)
- Max: 86400 seconds (24 hours)
- Out-of-range values → default (3600s)
- Test: `app/api/reports/__tests__/pdf.rbac.test.ts` line 35-45

## Test Coverage

### Existing Tests (13)
`lib/pdf/__tests__/storage.test.ts`:
- PHI-free path generation (6 tests)
- Hash computation (5 tests)
- Security policies (2 tests)

### New Tests (9)

#### Idempotency (4 tests)
`lib/processing/__tests__/pdfStageProcessor.idempotency.test.ts`:
1. Returns existing PDF when hash matches (no re-upload)
2. Deletes old PDF when content changes
3. Generates new PDF on first run
4. Stores sectionsContentHash for future checks

#### Auth-First (2 tests)
`app/api/processing/pdf/__tests__/route.auth-first.test.ts`:
1. Returns 401 before parsing invalid JSON
2. Validates auth ordering (auth before body parse)

#### RBAC & 404 (3 tests)
`app/api/reports/__tests__/pdf.rbac.test.ts`:
1. Returns 404 (not 403) when unauthorized
2. Enforces clinician assignment
3. Validates expiry bounds

**Total: 22 tests, all passing ✅**

## Build Verification

```bash
# Test Results
npm test -- lib/pdf                        # 13/13 passed
npm test -- lib/processing/__tests__/pdf*  # 4/4 passed
npm test -- app/api/processing/pdf         # 2/2 passed
npm test -- app/api/reports                # 3/3 passed

# Build Results
npm run build                              # ✅ Successful
```

## Type Safety

All new columns use type assertions until types regenerated:
```typescript
const jobWithPdf = job as typeof job & {
  stage: string
  assessment_id: string
  pdf_path?: string | null
  pdf_metadata?: Record<string, any> | null
  pdf_generated_at?: string | null
}
```

After migration applied, run: `npm run db:typegen`

## Code Quality

- ✅ All code follows existing patterns (V05-I05.1, V05-I05.7)
- ✅ PHI-free logging (only IDs, codes, timestamps)
- ✅ Fail-closed architecture maintained
- ✅ Comments explain "why" not "what"
- ✅ TypeScript strict mode passing
- ✅ No semicolons (repo style)

## Governance

- ✅ Follows processing_jobs RLS policy (clinician assignments)
- ✅ Matches review queue patterns (auth-first, 404-on-denial)
- ✅ Deterministic hash computation (SHA-256)
- ✅ Best-effort cleanup (no hard failures)

## Migration Impact

**Database Changes**:
- None (columns already added in 20260104113000 migration)

**API Breaking Changes**:
- None (all changes internal)

**Behavior Changes**:
- Clinician access: Now requires assignment (was global access)
- Idempotency: Rerunning PDF stage returns existing if content unchanged
- Error responses: 404 instead of 403 for unauthorized (security improvement)

## Acceptance Criteria

All requirements from hardening request met:

1. ✅ **Clinician Access**: Checks `clinician_patient_assignments` (same as processing_jobs)
2. ✅ **Auth-First**: Auth before parsing (DoS prevention)
3. ✅ **404-on-Denial**: No resource existence disclosure
4. ✅ **Idempotency**: Same input → no re-upload (proven via tests)
5. ✅ **Storage Security**: Expiry bounds enforced (60s-86400s)
6. ✅ **Tests**: 9 new tests (22 total), all passing
7. ✅ **Build**: Successful with TypeScript strict mode

## Minimal Diff

Changes limited to:
- 4 core files (storage, processor, 2 API routes)
- 3 test files (new)
- No refactoring of unrelated code
- No changes to existing tests
- Surgical edits only

**Total Lines Changed**: ~150 lines (excluding tests)

## Ready for Production

- ✅ All tests passing
- ✅ Build successful
- ✅ Security requirements met
- ✅ Documentation updated
- ✅ Evidence provided

**Status**: Ready for code review and deployment
