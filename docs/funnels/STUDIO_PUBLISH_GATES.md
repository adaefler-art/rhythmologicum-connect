# Studio Publish Gates & Workflow

**Version:** 1.0  
**Status:** Canonical (Production)  
**Last Updated:** 2026-02-01  
**Related Epic:** E74.3 - Studio Funnel Editor v1

## Purpose

This document defines the publishing workflow and validation gates for the Rhythmologicum Studio Funnel Editor. It establishes the rules and checks that must pass before a funnel draft can be published to production.

Publishing gates ensure:
- Only validated funnel definitions reach patients
- Version history is maintained
- Breaking changes are prevented
- Audit trails are complete

---

## Publishing Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 Studio Publishing Workflow                       │
└─────────────────────────────────────────────────────────────────┘

[Published Version v1.0]
      │
      │ Create Draft (copy)
      ▼
┌──────────────────────┐
│  Draft Version       │
│  status: "draft"     │ ◄──── Edit, iterate
│  is_default: false   │
│  validation_errors: []│
└──────────────────────┘
      │
      │ Save changes
      ▼
┌──────────────────────┐
│  Validate Draft      │ ──────┐
│  (E74.1 validators)  │       │ Validation fails
└──────────────────────┘       │
      │                        │
      │ Validation passes      ▼
      ▼                  ┌──────────────────┐
┌──────────────────────┐│  Blocked         │
│  Publish Gate Check  ││  Cannot publish  │
│  • No validation errors   ││  Fix errors      │
│  • User has permission    │└──────────────────┘
│  • Atomic transaction     │
└──────────────────────┘
      │
      │ All gates pass
      ▼
┌──────────────────────┐
│  Published Version v1.1   │
│  status: "published" │
│  is_default: true    │
│  published_at: set   │
│  published_by: set   │
└──────────────────────┘
      │
      │ Audit Trail
      ▼
┌──────────────────────┐
│  Publish History     │
│  • Diff between versions  │
│  • Publish metadata  │
│  • User info         │
└──────────────────────┘
```

---

## Version States

### 1. Draft

**Definition:** A work-in-progress version not visible to patients.

**Properties:**
- `status: "draft"`
- `is_default: false`
- `validation_errors: JSONB[]` (array of validation errors)
- `last_validated_at: timestamptz` (when validation last ran)
- `parent_version_id: uuid` (source version)

**Rules:**
- Can be edited freely
- Can be deleted
- Not served by patient APIs
- Must pass validation before publishing

### 2. Published

**Definition:** A production version visible to patients.

**Properties:**
- `status: "published"`
- `is_default: true` (for the active version) OR `false` (for superseded versions)
- `validation_errors: []` (must be empty)
- `published_at: timestamptz`
- `published_by: uuid`

**Rules:**
- Cannot be edited (create draft instead)
- Cannot be deleted (only archived)
- Served by patient APIs (if `is_default: true`)
- Validation errors must be empty

### 3. Archived

**Definition:** A deprecated version no longer in use.

**Properties:**
- `status: "archived"`
- `is_default: false`

**Rules:**
- Cannot be edited
- Cannot be deleted (data retention)
- Not served by patient APIs
- Read-only for audit purposes

---

## Publish Gates

The following gates must pass for a draft to be published:

### Gate 1: Validation Check (R-E74.3-003)

**Rule:** Draft with validation errors cannot be published.

**Check:**
```sql
SELECT validation_errors 
FROM funnel_versions 
WHERE id = :draft_id

-- Must be: validation_errors IS NULL OR validation_errors = '[]'::jsonb
```

**Error:** `PUBLISH_WITH_VALIDATION_ERRORS`

**Message:** "Cannot publish draft with validation errors. Fix all errors and re-validate before publishing."

**Required Action:** 
1. Fix validation errors in draft
2. Re-run validation: `POST /api/admin/studio/funnels/{slug}/drafts/{draftId}/validate`
3. Retry publish

---

### Gate 2: Schema Validation (R-E74.3-008)

**Rule:** Validation must use E74.1 canonical validators.

**Check:** 
- Validator function: `validateFunnelVersion()` from `lib/validators/funnelDefinition.ts`
- All 18 E74.1 validation rules must pass

**Validation Rules:**
- R-E74-001 to R-E74-018 (see `/docs/funnels/DEFINITION_V1.md`)

**Error Codes:**
- `DEF_INVALID_SCHEMA_VERSION`
- `DEF_MISSING_STEPS`
- `DEF_DUPLICATE_QUESTION_ID`
- ... (see full list in DEFINITION_V1.md)

---

### Gate 3: Authorization Check (R-E74.3-009)

**Rule:** Only admin or clinician roles can publish.

**Check:**
```typescript
const hasPermission = await hasAdminOrClinicianRole(user)
if (!hasPermission) {
  throw new Error('STUDIO_UNAUTHORIZED')
}
```

**Error:** `STUDIO_UNAUTHORIZED`

**Message:** "Studio API access denied. Admin or clinician role required."

---

### Gate 4: Atomicity Check (R-E74.3-004)

**Rule:** Publish operation must be atomic.

**Implementation:** Database function `publish_draft_version()` executes all changes in a single transaction:

```sql
BEGIN;
  -- 1. Update draft version status
  UPDATE funnel_versions 
  SET status = 'published',
      published_at = NOW(),
      published_by = :user_id
  WHERE id = :draft_id;
  
  -- 2. Update previous default version (if exists)
  UPDATE funnel_versions
  SET is_default = false
  WHERE funnel_id = :funnel_id 
    AND is_default = true 
    AND id != :draft_id;
  
  -- 3. Set new default pointer
  UPDATE funnel_versions
  SET is_default = true
  WHERE id = :draft_id;
  
  -- 4. Record publish history
  INSERT INTO funnel_publish_history (
    funnel_id, version_id, published_by, diff, metadata
  ) VALUES (
    :funnel_id, :draft_id, :user_id, :diff, :metadata
  );
  
  -- 5. Update funnels_catalog default_version_id
  UPDATE funnels_catalog
  SET default_version_id = :draft_id
  WHERE id = :funnel_id;
COMMIT;
```

**Error:** `PUBLISH_NOT_ATOMIC`

**Rollback:** If any step fails, entire transaction is rolled back.

---

### Gate 5: Single Default Check (R-E74.3-005)

**Rule:** Only one version per funnel can have `is_default = true`.

**Enforcement:** 
- Publish function clears previous default before setting new one
- Database constraint prevents multiple defaults

**Error:** `MULTIPLE_DEFAULT_VERSIONS`

---

### Gate 6: Published Metadata Check (R-E74.3-006)

**Rule:** Published version must have `published_at` and `published_by` set.

**Check:**
```sql
SELECT published_at, published_by
FROM funnel_versions
WHERE id = :version_id AND status = 'published'

-- Must be: published_at IS NOT NULL AND published_by IS NOT NULL
```

**Error:** `PUBLISHED_MISSING_METADATA`

---

### Gate 7: Publish History Diff (R-E74.3-007)

**Rule:** Publish history must record diff between versions.

**Implementation:**
```typescript
// Calculate diff between parent and draft
const diff = calculateVersionDiff(parentVersion, draftVersion)

// Record in publish history
await supabase.from('funnel_publish_history').insert({
  funnel_id: funnelId,
  version_id: draftId,
  previous_version_id: parentVersionId,
  published_by: userId,
  diff: diff,  // JSONB object with changes
  metadata: {
    timestamp: new Date().toISOString(),
    publisher: user.email,
    comment: publishComment
  }
})
```

**Diff Format:**
```json
{
  "questionnaire_config": {
    "steps_added": 1,
    "steps_removed": 0,
    "steps_modified": 2,
    "questions_added": 3,
    "questions_removed": 1,
    "questions_modified": 5
  },
  "content_manifest": {
    "pages_added": 0,
    "pages_removed": 0,
    "pages_modified": 1,
    "sections_added": 2,
    "sections_removed": 0
  }
}
```

**Error:** `PUBLISH_HISTORY_NO_DIFF`

---

## API Endpoints

### 1. Create Draft

```
POST /api/admin/studio/funnels/{slug}/drafts
```

**Request:**
```json
{
  "sourceVersionId": "uuid",  // Optional: Default to current default version
  "comment": "string"         // Optional: Description of changes
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "draft": {
      "id": "uuid",
      "funnel_id": "uuid",
      "status": "draft",
      "is_default": false,
      "parent_version_id": "uuid",
      "questionnaire_config": {...},
      "content_manifest": {...},
      "validation_errors": null,
      "last_validated_at": null,
      "created_at": "2026-02-01T10:00:00Z"
    }
  }
}
```

**Gate:** Authorization (admin/clinician)

---

### 2. Validate Draft

```
POST /api/admin/studio/funnels/{slug}/drafts/{draftId}/validate
```

**Request:** Empty body

**Response (Valid):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "validated_at": "2026-02-01T10:05:00Z"
  }
}
```

**Response (Invalid):**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "errors": [
      {
        "code": "DEF_DUPLICATE_QUESTION_ID",
        "message": "Duplicate question ID found: q1",
        "path": ["questionnaire_config", "steps", 0, "questions", 1],
        "ruleId": "R-E74-007"
      }
    ],
    "validated_at": "2026-02-01T10:05:00Z"
  }
}
```

**Side Effect:** Updates `validation_errors` and `last_validated_at` in database

**Gate:** Authorization (admin/clinician)

---

### 3. Publish Draft

```
POST /api/admin/studio/funnels/{slug}/drafts/{draftId}/publish
```

**Request:**
```json
{
  "comment": "string"  // Optional: Publish comment for audit trail
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "publishedVersion": {
      "id": "uuid",
      "funnel_id": "uuid",
      "status": "published",
      "is_default": true,
      "published_at": "2026-02-01T10:10:00Z",
      "published_by": "uuid",
      "version": "1.2"
    },
    "historyEntry": {
      "id": "uuid",
      "funnel_id": "uuid",
      "version_id": "uuid",
      "published_by": "uuid",
      "published_at": "2026-02-01T10:10:00Z",
      "diff": {...}
    }
  }
}
```

**Response (Blocked - Validation Errors):**
```json
{
  "success": false,
  "error": {
    "code": "PUBLISH_WITH_VALIDATION_ERRORS",
    "message": "Cannot publish draft with validation errors",
    "details": {
      "validationErrors": [
        {
          "code": "DEF_DUPLICATE_QUESTION_ID",
          "message": "Duplicate question ID found: q1",
          "ruleId": "R-E74-007"
        }
      ]
    }
  }
}
```

**Gates:**
1. ✅ Validation check (no errors)
2. ✅ Schema validation (E74.1)
3. ✅ Authorization (admin/clinician)
4. ✅ Atomicity (transaction)
5. ✅ Single default
6. ✅ Published metadata
7. ✅ Publish history diff

---

### 4. Get Publish History

```
GET /api/admin/studio/funnels/{slug}/history
```

**Query Parameters:**
- `limit` (default: 50, max: 100)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "uuid",
        "funnel_id": "uuid",
        "version_id": "uuid",
        "previous_version_id": "uuid",
        "published_by": "uuid",
        "published_at": "2026-02-01T10:10:00Z",
        "diff": {...},
        "metadata": {
          "publisher": "admin@example.com",
          "comment": "Fixed validation errors in step 2"
        }
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 50,
      "offset": 0
    }
  }
}
```

**Gate:** Authorization (admin/clinician)

---

## Draft Lifecycle Rules

### Creating Drafts (R-E74.3-001)

**Rule:** Draft versions must have `status="draft"` and `is_default=false`.

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION create_draft_from_version(
  p_funnel_id UUID,
  p_source_version_id UUID,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_draft_id UUID;
BEGIN
  INSERT INTO funnel_versions (
    funnel_id,
    questionnaire_config,
    content_manifest,
    algorithm_bundle_version,
    prompt_version,
    status,
    is_default,
    parent_version_id,
    created_by
  )
  SELECT
    funnel_id,
    questionnaire_config,
    content_manifest,
    algorithm_bundle_version,
    prompt_version,
    'draft'::funnel_version_status,
    false,
    p_source_version_id,
    p_user_id
  FROM funnel_versions
  WHERE id = p_source_version_id
  RETURNING id INTO v_draft_id;
  
  RETURN v_draft_id;
END;
$$ LANGUAGE plpgsql;
```

---

### Deleting Drafts

**Rule:** Only draft versions can be deleted.

**Implementation:**
```sql
DELETE FROM funnel_versions
WHERE id = :draft_id AND status = 'draft'
```

---

### Preventing Published Version Deletion (R-E74.3-002)

**Rule:** Published versions cannot be deleted (only archived).

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION prevent_published_version_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'Cannot delete published version. Archive it instead.'
      USING ERRCODE = 'PUBLISHED_DELETE_BLOCKED';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_published_version_delete_trigger
  BEFORE DELETE ON funnel_versions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_published_version_delete();
```

**Error:** `PUBLISHED_DELETE_BLOCKED`

---

## Patient API Protection (R-E74.3-010)

**Rule:** Patient APIs must only serve published versions (`status="published"`).

**Implementation:**
```typescript
// Patient API endpoint
export async function GET(request: Request) {
  const { slug } = params
  
  // Load only published version
  const { data: funnel, error } = await supabase
    .from('funnels_catalog')
    .select(`
      *,
      default_version:funnel_versions!default_version_id (
        *
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  
  // Additional safety check
  if (funnel.default_version.status !== 'published') {
    throw new Error('PATIENT_SEES_DRAFT: Draft version incorrectly set as default')
  }
  
  return NextResponse.json({
    success: true,
    data: {
      funnel: funnel.default_version
    }
  })
}
```

**Error:** `PATIENT_SEES_DRAFT`

**Verification:** Manual testing (see E74_3_PATIENT_API_VERIFICATION.md)

---

## Validation Output Format

All validation checks must output "violates R-XYZ" format for quick diagnosis.

**Example:**
```
[PUBLISH_WITH_VALIDATION_ERRORS] violates R-E74.3-003: Cannot publish draft with validation errors
[DEF_DUPLICATE_QUESTION_ID] violates R-E74-007: Duplicate question ID found: q1
```

This enables:
- Traceability to rule definitions
- Automated rule coverage analysis
- Clear error messages for developers

---

## CI/CD Integration

### Guardrails Verification Script

**Command:** `npm run verify:e74-3`

**Script:** `scripts/ci/verify-e74-3-guardrails.mjs`

**Checks:**
1. Draft versions have correct status and is_default (R-E74.3-001)
2. Published versions cannot be deleted (R-E74.3-002)
3. Draft with validation errors cannot be published (R-E74.3-003)
4. Publish is atomic (R-E74.3-004)
5. Only one default version per funnel (R-E74.3-005)
6. Published version has metadata (R-E74.3-006)
7. Publish history records diff (R-E74.3-007)
8. Validation uses E74.1 validators (R-E74.3-008)
9. Studio API requires admin/clinician (R-E74.3-009)
10. Patient APIs serve only published versions (R-E74.3-010) - Deferred to Phase 7

**Output:**
```
🔍 Verifying E74.3 Studio Publishing Guardrails...

✅ R-E74.3-001: Draft versions have correct status and is_default
✅ R-E74.3-002: Published versions cannot be deleted trigger exists
✅ R-E74.3-003: publish_draft_version() checks validation_errors
✅ R-E74.3-004: Publish is atomic (transaction)
✅ R-E74.3-005: Only one default version per funnel
✅ R-E74.3-006: Published metadata fields exist
✅ R-E74.3-007: Publish history table has diff column
✅ R-E74.3-008: Validation endpoint uses E74.1 validators
✅ R-E74.3-009: Studio API endpoints check admin/clinician role
⚠️  R-E74.3-010: Patient API verification deferred to Phase 7

Coverage: 9/10 rules checked (1 deferred)
Exit code: 0 (All checks passed)
```

---

## Related Documentation

- **Funnel Definition Schema:** `/docs/funnels/DEFINITION_V1.md`
- **Start/Resume Semantics:** `/docs/funnels/START_RESUME_SEMANTICS.md`
- **Rules vs Checks Matrix:** `/docs/RULES_VS_CHECKS_MATRIX.md`
- **E74.3 Implementation:** `/docs/E74_3_IMPLEMENTATION_SUMMARY.md`
- **E74.3 Complete:** `/E74.3-COMPLETE.md`

---

## Version History

- **1.0 (2026-02-01):** Initial documentation
  - Defined 7 publish gates
  - Documented draft/published/archived states
  - Added API endpoint specifications
  - Included validation rules and error codes
