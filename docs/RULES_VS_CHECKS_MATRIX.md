# E74: Rules vs Checks Matrix

This document maps validation rules to their check implementations for the Canonical Funnel Definition Schema v1 and related migrations.

**Purpose:** Ensure every rule has a check implementation and every check references a rule ID.

## Validation Rules

### E74.1: Schema Structure Rules

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E74-001 | Schema version must be v1 | `DEF_MISSING_SCHEMA_VERSION`, `DEF_INVALID_SCHEMA_VERSION` | `lib/validators/funnelDefinition.ts:validateSchemaVersion()` | ✅ Implemented |
| R-E74-002 | Schema must be valid according to Zod schema | `DEF_INVALID_SCHEMA` | `lib/validators/funnelDefinition.ts:validateQuestionnaireConfig()`, `validateContentManifest()` | ✅ Implemented |

### E74.1: Questionnaire Config Rules

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E74-003 | Steps array must exist and not be empty | `DEF_MISSING_STEPS`, `DEF_EMPTY_STEPS` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-004 | Each step must have a unique ID | `DEF_MISSING_STEP_ID`, `DEF_DUPLICATE_STEP_ID` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-005 | Each step must have a title | `DEF_MISSING_STEP_TITLE` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-006 | Each step must have at least one question | `DEF_MISSING_QUESTIONS`, `DEF_EMPTY_QUESTIONS` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-007 | Each question must have a unique ID | `DEF_MISSING_QUESTION_ID`, `DEF_DUPLICATE_QUESTION_ID` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-008 | Each question must have a unique key | `DEF_MISSING_QUESTION_KEY`, `DEF_DUPLICATE_QUESTION_KEY` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-009 | Each question must have a type | `DEF_MISSING_QUESTION_TYPE`, `DEF_INVALID_QUESTION_TYPE` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-010 | Each question must have a label | `DEF_MISSING_QUESTION_LABEL` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-011 | Radio and checkbox questions must have options | `DEF_MISSING_OPTIONS_FOR_CHOICE`, `DEF_EMPTY_OPTIONS_FOR_CHOICE` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-012 | Conditional logic must reference existing questions | `DEF_INVALID_CONDITIONAL_REFERENCE` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |
| R-E74-013 | Conditional logic must not forward-reference questions | `DEF_CONDITIONAL_FORWARD_REFERENCE` | `lib/validators/funnelDefinition.ts:validateQuestionnaireIntegrity()` | ✅ Implemented |

### E74.1: Content Manifest Rules

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E74-014 | Pages array must exist and not be empty | `DEF_MISSING_PAGES`, `DEF_EMPTY_PAGES` | `lib/validators/funnelDefinition.ts:validateContentManifestIntegrity()` | ✅ Implemented |
| R-E74-015 | Each page must have a unique slug | `DEF_MISSING_PAGE_SLUG`, `DEF_DUPLICATE_PAGE_SLUG` | `lib/validators/funnelDefinition.ts:validateContentManifestIntegrity()` | ✅ Implemented |
| R-E74-016 | Each page must have a title | `DEF_MISSING_PAGE_TITLE` | `lib/validators/funnelDefinition.ts:validateContentManifestIntegrity()` | ✅ Implemented |
| R-E74-017 | Each page must have at least one section | `DEF_MISSING_SECTIONS`, `DEF_EMPTY_SECTIONS` | `lib/validators/funnelDefinition.ts:validateContentManifestIntegrity()` | ✅ Implemented |
| R-E74-018 | Asset keys must be unique | `DEF_DUPLICATE_ASSET_KEY` | `lib/validators/funnelDefinition.ts:validateContentManifestIntegrity()` | ✅ Implemented |

### E74.2: Migration Rules (Canonical v1 Backfill)

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E74.2-001 | All funnel_versions must have schema_version 'v1' in questionnaire_config | `MISSING_SCHEMA_VERSION_QC`, `INVALID_SCHEMA_VERSION_QC` | `scripts/ci/verify-e74-2-canonical-v1.mjs:checkSchemaVersions()` | ✅ Implemented |
| R-E74.2-002 | All funnel_versions must have schema_version 'v1' in content_manifest | `MISSING_SCHEMA_VERSION_CM`, `INVALID_SCHEMA_VERSION_CM` | `scripts/ci/verify-e74-2-canonical-v1.mjs:checkSchemaVersions()` | ✅ Implemented |
| R-E74.2-003 | All funnels_catalog entries must have unique slugs | `DUPLICATE_SLUG` | `scripts/ci/verify-e74-2-canonical-v1.mjs:checkSlugUniqueness()` | ✅ Implemented |
| R-E74.2-004 | All funnels must have valid pillar mappings | `INVALID_PILLAR_MAPPING` | `scripts/ci/verify-e74-2-canonical-v1.mjs:checkPillarMappings()` | ✅ Implemented |
| R-E74.2-005 | Exactly 2 A/B funnels must be published | `INCORRECT_AB_COUNT`, `INCORRECT_AB_PUBLISHED` | `scripts/ci/verify-e74-2-canonical-v1.mjs:checkABDefaults()` | ✅ Implemented |
| R-E74.2-006 | Exactly 2 archived funnels must be unpublished | `INCORRECT_ARCHIVED_COUNT`, `INCORRECT_ARCHIVED_PUBLISHED` | `scripts/ci/verify-e74-2-canonical-v1.mjs:checkArchivedFunnels()` | ✅ Implemented |
| R-E74.2-007 | All published funnels must be active | `PUBLISHED_NOT_ACTIVE` | `scripts/ci/verify-e74-2-canonical-v1.mjs:checkABDefaults()` | ✅ Implemented |
| R-E74.2-008 | All published funnels must have default_version_id set | `PUBLISHED_NO_DEFAULT_VERSION` | `scripts/ci/verify-e74-2-canonical-v1.mjs:checkABDefaults()` | ✅ Implemented |

### E74.3: Studio Editor Rules (Draft/Publish/Versioning)

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E74.3-001 | Draft versions must have status="draft" and is_default=false | `DRAFT_INVALID_STATUS` | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:create_draft_from_version()` | ✅ Implemented |
| R-E74.3-002 | Published versions cannot be deleted (only archived) | `PUBLISHED_DELETE_BLOCKED` | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:prevent_published_version_delete()` | ✅ Implemented |
| R-E74.3-003 | Draft with validation errors cannot be published | `PUBLISH_WITH_VALIDATION_ERRORS` | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()` | ✅ Implemented |
| R-E74.3-004 | Publish must be atomic (status update + default pointer + audit log) | `PUBLISH_NOT_ATOMIC` | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()` | ✅ Implemented |
| R-E74.3-005 | Only one version per funnel can have is_default=true | `MULTIPLE_DEFAULT_VERSIONS` | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()` | ✅ Implemented |
| R-E74.3-006 | Published version must have published_at and published_by set | `PUBLISHED_MISSING_METADATA` | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()` | ✅ Implemented |
| R-E74.3-007 | Publish history must record diff between versions | `PUBLISH_HISTORY_NO_DIFF` | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version()` | ✅ Implemented |
| R-E74.3-008 | Validation must use E74.1 canonical validators | `VALIDATION_NOT_CANONICAL` | `apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts:validateFunnelVersion()` | ✅ Implemented |
| R-E74.3-009 | Studio API endpoints require admin or clinician role | `STUDIO_UNAUTHORIZED` | `apps/rhythm-studio-ui/app/api/admin/studio/funnels/**/*.ts:hasAdminOrClinicianRole()` | ✅ Implemented |
| R-E74.3-010 | Patient APIs must only serve published versions (status="published") | `PATIENT_SEES_DRAFT` | Manual verification (see E74_3_PATIENT_API_VERIFICATION.md) | ⚠️ Deferred (Phase 7) |

### E74.6: Patient Funnels Lifecycle + Org Scoping

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E74.6-001 | Staff can INSERT patient_funnels for org patients | `MISSING_RLS_POLICY_STAFF_INSERT` | RLS policy "Staff can insert org patient funnels" | ✅ Implemented |
| R-E74.6-002 | Staff can UPDATE patient_funnels for org patients | `MISSING_RLS_POLICY_STAFF_UPDATE` | RLS policy "Staff can update org patient funnels" | ✅ Implemented |
| R-E74.6-003 | Staff can SELECT patient_funnels for org patients | `MISSING_RLS_POLICY_STAFF_SELECT` | RLS policy "Staff can view org patient funnels" | ✅ Implemented |
| R-E74.6-004 | Audit log trigger exists for patient_funnels | `MISSING_AUDIT_TRIGGER` | Trigger "audit_patient_funnels_changes_trigger" | ✅ Implemented |
| R-E74.6-005 | Updated_at trigger exists for patient_funnels | `MISSING_UPDATED_AT_TRIGGER` | Trigger "update_patient_funnels_updated_at_trigger" | ✅ Implemented |
| R-E74.6-006 | Status constraint allows only valid values | `INVALID_STATUS_CONSTRAINT` | Constraint "patient_funnels_status_check" | ✅ Implemented |
| R-E74.6-007 | API endpoints require authentication | `API_ENDPOINT_MISSING` | All patient_funnels API endpoints check auth | ✅ Implemented |
| R-E74.6-008 | API endpoints require staff role (clinician/admin/nurse) | `API_ROLE_CHECK_MISSING` | All patient_funnels API endpoints check role | ✅ Implemented |

### E74.7: Start/Resume Idempotency

| Rule ID | Description | Error Code | Check Implementation | Status |
|---------|-------------|------------|---------------------|---------|
| R-E74.7-001 | ONE in-progress assessment per patient+funnel | `MISSING_UNIQUE_INDEX` | Unique partial index "idx_assessments_one_in_progress_per_patient_funnel" | ✅ Implemented |
| R-E74.7-002 | Efficient lookup index for in-progress assessments | `MISSING_LOOKUP_INDEX` | Index "idx_assessments_patient_in_progress" | ✅ Implemented |
| R-E74.7-003 | API returns existing assessment by default (RESUME_OR_CREATE) | `API_NO_RESUME_LOGIC` | POST /api/funnels/[slug]/assessments checks for existing assessment | ✅ Implemented |
| R-E74.7-004 | API supports forceNew parameter to create new assessment | `API_NO_FORCE_NEW` | POST /api/funnels/[slug]/assessments accepts forceNew parameter | ✅ Implemented |
| R-E74.7-005 | API completes old assessment when forceNew=true | `API_NO_COMPLETE_OLD` | POST /api/funnels/[slug]/assessments updates old assessment to completed | ✅ Implemented |
| R-E74.7-006 | Parallel requests don't create duplicate assessments | `API_NO_RACE_PROTECTION` | Unique constraint + query ordering prevents race conditions | ✅ Implemented |

## Check Implementations

### E74.1: Runtime Validators

| Check | Rule ID(s) | Location | Description |
|-------|-----------|----------|-------------|
| `validateSchemaVersion()` | R-E74-001 | `lib/validators/funnelDefinition.ts` | Validates schema_version field is present and equals "v1" |
| `validateQuestionnaireConfig()` | R-E74-001, R-E74-002 | `lib/validators/funnelDefinition.ts` | Validates questionnaire config against Zod schema and schema version |
| `validateContentManifest()` | R-E74-001, R-E74-002 | `lib/validators/funnelDefinition.ts` | Validates content manifest against Zod schema and schema version |
| `validateQuestionnaireIntegrity()` | R-E74-003 to R-E74-013 | `lib/validators/funnelDefinition.ts` | Validates referential integrity of questionnaire config |
| `validateContentManifestIntegrity()` | R-E74-014 to R-E74-018 | `lib/validators/funnelDefinition.ts` | Validates referential integrity of content manifest |
| `validateFunnelVersion()` | All E74.1 rules | `lib/validators/funnelDefinition.ts` | Validates complete funnel version (both configs) |

### E74.1: CI/CD Checks

| Check | Rule ID(s) | Location | Description |
|-------|-----------|----------|-------------|
| Funnel Definition Verification | R-E74-001 to R-E74-018 | `scripts/ci/verify-funnel-definitions.mjs` | CI script that validates all funnel_versions in database |

### E74.2: Migration Checks

| Check | Rule ID(s) | Location | Description |
|-------|-----------|----------|-------------|
| `checkSchemaVersions()` | R-E74.2-001, R-E74.2-002 | `scripts/ci/verify-e74-2-canonical-v1.mjs` | Verifies all funnel_versions have schema_version 'v1' |
| `checkSlugUniqueness()` | R-E74.2-003 | `scripts/ci/verify-e74-2-canonical-v1.mjs` | Verifies no duplicate slugs in funnels_catalog |
| `checkPillarMappings()` | R-E74.2-004 | `scripts/ci/verify-e74-2-canonical-v1.mjs` | Verifies all pillar_id references are valid |
| `checkABDefaults()` | R-E74.2-005, R-E74.2-007, R-E74.2-008 | `scripts/ci/verify-e74-2-canonical-v1.mjs` | Verifies A/B funnels are published, active, and have default versions |
| `checkArchivedFunnels()` | R-E74.2-006 | `scripts/ci/verify-e74-2-canonical-v1.mjs` | Verifies archived funnels are unpublished |

### E74.3: Studio Editor Checks

| Check | Rule ID(s) | Location | Description |
|-------|-----------|----------|-------------|
| `create_draft_from_version()` | R-E74.3-001 | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql` | Database function that creates draft with correct status and is_default=false |
| `prevent_published_version_delete()` trigger | R-E74.3-002 | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql` | Trigger that prevents deletion of published versions |
| `publish_draft_version()` | R-E74.3-003, R-E74.3-004, R-E74.3-005, R-E74.3-006, R-E74.3-007 | `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql` | Atomic publish function with validation check, metadata update, and audit logging |
| POST `/api/admin/studio/funnels/[slug]/drafts/[draftId]/validate` | R-E74.3-008 | `apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts` | Validation endpoint using E74.1 validators |
| Studio API Authorization | R-E74.3-009 | All Studio API endpoints | All Studio API endpoints check for admin/clinician role via hasAdminOrClinicianRole() |
| Guardrails Verification | All E74.3 rules | `scripts/ci/verify-e74-3-guardrails.mjs` | CI script that verifies rule-check coverage and generates diff report |

### E74.6: Patient Funnels Lifecycle Checks

| Check | Rule ID(s) | Location | Description |
|-------|-----------|----------|-------------|
| `checkRLSPolicies()` | R-E74.6-001, R-E74.6-002, R-E74.6-003 | `scripts/ci/verify-e74-6-patient-funnels.mjs` | Verifies RLS policies for staff INSERT/UPDATE/SELECT on patient_funnels |
| `checkTriggers()` | R-E74.6-004, R-E74.6-005 | `scripts/ci/verify-e74-6-patient-funnels.mjs` | Verifies audit logging and updated_at triggers |
| `checkStatusConstraint()` | R-E74.6-006 | `scripts/ci/verify-e74-6-patient-funnels.mjs` | Verifies status constraint allows only valid values |
| `checkAPIEndpoints()` | R-E74.6-007, R-E74.6-008 | `scripts/ci/verify-e74-6-patient-funnels.mjs` | Verifies API endpoints exist and have proper auth/role checks |

### E74.7: Start/Resume Idempotency Checks

| Check | Rule ID(s) | Location | Description |
|-------|-----------|----------|-------------|
| `checkDatabaseConstraints()` | R-E74.7-001, R-E74.7-002 | `scripts/ci/verify-e74-7-idempotency.mjs` | Verifies unique index and lookup index for idempotency |
| `checkAPIImplementation()` | R-E74.7-003, R-E74.7-004, R-E74.7-005, R-E74.7-006 | `scripts/ci/verify-e74-7-idempotency.mjs` | Verifies API has RESUME_OR_CREATE logic and forceNew support |
| `checkMigration()` | R-E74.7-001 | `scripts/ci/verify-e74-7-idempotency.mjs` | Verifies migration file creates required index |

## Error Code Reference

### E74.1: Funnel Definition Errors

All error codes follow the pattern: `DEF_<CATEGORY>_<SPECIFIC_ERROR>`

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| `DEF_INVALID_SCHEMA` | R-E74-002 | Schema validation failed (Zod) |
| `DEF_INVALID_SCHEMA_VERSION` | R-E74-001 | Schema version is not "v1" |
| `DEF_MISSING_SCHEMA_VERSION` | R-E74-001 | Schema version field is missing |
| `DEF_MISSING_STEPS` | R-E74-003 | Steps array is missing |
| `DEF_EMPTY_STEPS` | R-E74-003 | Steps array is empty |
| `DEF_MISSING_STEP_TITLE` | R-E74-005 | Step is missing title |
| `DEF_MISSING_STEP_ID` | R-E74-004 | Step is missing ID |
| `DEF_DUPLICATE_STEP_ID` | R-E74-004 | Duplicate step ID found |
| `DEF_MISSING_QUESTIONS` | R-E74-006 | Questions array is missing |
| `DEF_EMPTY_QUESTIONS` | R-E74-006 | Questions array is empty |
| `DEF_MISSING_QUESTION_ID` | R-E74-007 | Question is missing ID |
| `DEF_MISSING_QUESTION_KEY` | R-E74-008 | Question is missing key |
| `DEF_MISSING_QUESTION_TYPE` | R-E74-009 | Question is missing type |
| `DEF_MISSING_QUESTION_LABEL` | R-E74-010 | Question is missing label |
| `DEF_DUPLICATE_QUESTION_ID` | R-E74-007 | Duplicate question ID found |
| `DEF_DUPLICATE_QUESTION_KEY` | R-E74-008 | Duplicate question key found |
| `DEF_INVALID_QUESTION_TYPE` | R-E74-009 | Question type is invalid |
| `DEF_MISSING_OPTIONS_FOR_CHOICE` | R-E74-011 | Radio/checkbox question missing options |
| `DEF_EMPTY_OPTIONS_FOR_CHOICE` | R-E74-011 | Radio/checkbox question has empty options |
| `DEF_INVALID_CONDITIONAL_REFERENCE` | R-E74-012 | Conditional references non-existent question |
| `DEF_CONDITIONAL_SELF_REFERENCE` | R-E74-012 | Conditional references itself (reserved) |
| `DEF_CONDITIONAL_FORWARD_REFERENCE` | R-E74-013 | Conditional references future question |
| `DEF_MISSING_PAGES` | R-E74-014 | Pages array is missing |
| `DEF_EMPTY_PAGES` | R-E74-014 | Pages array is empty |
| `DEF_MISSING_PAGE_SLUG` | R-E74-015 | Page is missing slug |
| `DEF_MISSING_PAGE_TITLE` | R-E74-016 | Page is missing title |
| `DEF_DUPLICATE_PAGE_SLUG` | R-E74-015 | Duplicate page slug found |
| `DEF_INVALID_PAGE_SLUG` | R-E74-015 | Page slug format is invalid (reserved) |
| `DEF_MISSING_SECTIONS` | R-E74-017 | Sections array is missing |
| `DEF_EMPTY_SECTIONS` | R-E74-017 | Sections array is empty |
| `DEF_DUPLICATE_ASSET_KEY` | R-E74-018 | Duplicate asset key found |
| `DEF_INVALID_ASSET_URL` | R-E74-018 | Asset URL is invalid (reserved) |

### E74.2: Migration Errors

All error codes follow the pattern: `<CATEGORY>_<SPECIFIC_ERROR>`

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| `MISSING_SCHEMA_VERSION_QC` | R-E74.2-001 | Funnel version missing schema_version in questionnaire_config |
| `INVALID_SCHEMA_VERSION_QC` | R-E74.2-001 | Funnel version has invalid schema_version in questionnaire_config |
| `MISSING_SCHEMA_VERSION_CM` | R-E74.2-002 | Funnel version missing schema_version in content_manifest |
| `INVALID_SCHEMA_VERSION_CM` | R-E74.2-002 | Funnel version has invalid schema_version in content_manifest |
| `DUPLICATE_SLUG` | R-E74.2-003 | Duplicate slug found in funnels_catalog |
| `INVALID_PILLAR_MAPPING` | R-E74.2-004 | Funnel has invalid pillar_id reference |
| `INCORRECT_AB_COUNT` | R-E74.2-005 | Incorrect number of published funnels |
| `INCORRECT_AB_PUBLISHED` | R-E74.2-005 | A/B funnel not properly published |
| `INCORRECT_ARCHIVED_COUNT` | R-E74.2-006 | Incorrect number of archived funnels |
| `INCORRECT_ARCHIVED_PUBLISHED` | R-E74.2-006 | Archived funnel incorrectly published |
| `PUBLISHED_NOT_ACTIVE` | R-E74.2-007 | Published funnel is not active |
| `PUBLISHED_NO_DEFAULT_VERSION` | R-E74.2-008 | Published funnel missing default_version_id |

### E74.3: Studio Editor Errors

All error codes follow the pattern: `<CATEGORY>_<SPECIFIC_ERROR>`

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| `DRAFT_INVALID_STATUS` | R-E74.3-001 | Draft version has invalid status or is_default setting |
| `PUBLISHED_DELETE_BLOCKED` | R-E74.3-002 | Cannot delete published version (must archive first) |
| `PUBLISH_WITH_VALIDATION_ERRORS` | R-E74.3-003 | Cannot publish draft with validation errors |
| `PUBLISH_NOT_ATOMIC` | R-E74.3-004 | Publish operation is not atomic |
| `MULTIPLE_DEFAULT_VERSIONS` | R-E74.3-005 | Multiple versions marked as default for same funnel |
| `PUBLISHED_MISSING_METADATA` | R-E74.3-006 | Published version missing published_at or published_by |
| `PUBLISH_HISTORY_NO_DIFF` | R-E74.3-007 | Publish history entry missing diff |
| `VALIDATION_NOT_CANONICAL` | R-E74.3-008 | Validation not using E74.1 canonical validators |
| `STUDIO_UNAUTHORIZED` | R-E74.3-009 | Studio API access denied (requires admin/clinician role) |
| `PATIENT_SEES_DRAFT` | R-E74.3-010 | Patient API serving draft version instead of published |

### E74.6: Patient Funnels Lifecycle Errors

All error codes follow the pattern: `<CATEGORY>_<SPECIFIC_ERROR>`

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| `MISSING_RLS_POLICY_STAFF_INSERT` | R-E74.6-001 | RLS policy for staff INSERT on patient_funnels not found |
| `MISSING_RLS_POLICY_STAFF_UPDATE` | R-E74.6-002 | RLS policy for staff UPDATE on patient_funnels not found |
| `MISSING_RLS_POLICY_STAFF_SELECT` | R-E74.6-003 | RLS policy for staff SELECT on patient_funnels not found |
| `MISSING_AUDIT_TRIGGER` | R-E74.6-004 | Audit logging trigger for patient_funnels not found |
| `MISSING_UPDATED_AT_TRIGGER` | R-E74.6-005 | Updated_at trigger for patient_funnels not found |
| `INVALID_STATUS_CONSTRAINT` | R-E74.6-006 | Status constraint on patient_funnels not found or invalid |
| `API_ENDPOINT_MISSING` | R-E74.6-007 | Required API endpoint file not found |
| `API_ROLE_CHECK_MISSING` | R-E74.6-008 | API endpoint missing role authorization check |

### E74.7: Start/Resume Idempotency Errors

All error codes follow the pattern: `<CATEGORY>_<SPECIFIC_ERROR>`

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| `MISSING_UNIQUE_INDEX` | R-E74.7-001 | Unique partial index on assessments(patient_id, funnel) WHERE completed_at IS NULL not found |
| `MISSING_LOOKUP_INDEX` | R-E74.7-002 | Lookup index idx_assessments_patient_in_progress not found |
| `API_NO_RESUME_LOGIC` | R-E74.7-003 | API doesn't check for existing in-progress assessment before creating new one |
| `API_NO_FORCE_NEW` | R-E74.7-004 | API doesn't support forceNew parameter |
| `API_NO_COMPLETE_OLD` | R-E74.7-005 | API doesn't complete old assessment when forceNew=true |
| `API_NO_RACE_PROTECTION` | R-E74.7-006 | API doesn't prevent race conditions in parallel requests |

## Audit Results

**Last Updated:** 2026-02-01

### Coverage Analysis

- **Rules without checks:** 0
- **Checks without rules:** 0
- **Total rules (E74.1):** 18
- **Total rules (E74.2):** 8
- **Total rules (E74.3):** 10 (1 deferred)
- **Total rules (E74.6):** 8
- **Total rules (E74.7):** 6
- **Total rules (E74 combined):** 50
- **Total check implementations:** 6 (E74.1 validators) + 6 (E74.2 checks) + 6 (E74.3 checks) + 4 (E74.6 checks) + 3 (E74.7 checks) + 5 (CI scripts)
- **Coverage:** 100%

### Scope Verification

All rules are correctly mapped to check implementations:
- ✅ E74.1: Schema structure rules (2 rules) - Implemented
- ✅ E74.1: Questionnaire config rules (11 rules) - Implemented
- ✅ E74.1: Content manifest rules (5 rules) - Implemented
- ✅ E74.2: Migration rules (8 rules) - Implemented
- ✅ E74.3: Studio editor rules (10 rules) - Implemented (1 deferred)
- ✅ E74.6: Patient funnels lifecycle rules (8 rules) - Implemented
- ✅ E74.7: Start/resume idempotency rules (6 rules) - Implemented

### Implementation Status

- ✅ E74.1: Runtime validators: `lib/validators/funnelDefinition.ts`
- ✅ E74.1: CI check script: `scripts/ci/verify-funnel-definitions.mjs`
- ✅ E74.2: Migration script: `supabase/migrations/20260201100400_e74_2_backfill_canonical_v1.sql`
- ✅ E74.2: CI check script: `scripts/ci/verify-e74-2-canonical-v1.mjs`
- ✅ E74.3: Draft/Publish migration: `supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql`
- ✅ E74.3: Studio API endpoints: `apps/rhythm-studio-ui/app/api/admin/studio/funnels/**/*.ts`
- ✅ E74.3: Guardrails verification: `scripts/ci/verify-e74-3-guardrails.mjs`
- ✅ E74.6: Patient funnels migration: `supabase/migrations/20260201151428_e74_6_patient_funnels_lifecycle.sql`
- ✅ E74.6: Patient funnels API: `apps/rhythm-studio-ui/app/api/clinician/patient-funnels/**/*.ts`
- ✅ E74.6: Verification script: `scripts/ci/verify-e74-6-patient-funnels.mjs`
- ✅ Error code mapping: Complete
- ✅ Documentation: This file

## Usage

### Running E74.1 CI Check

```bash
# Run funnel definition validation check
npm run verify:funnel-definitions
```

### Running E74.2 CI Check

```bash
# Run canonical v1 migration verification
npm run verify:e74-2
```

### Using Validators Programmatically

```typescript
import { 
  validateFunnelVersion, 
  formatValidationErrors 
} from '@/lib/validators/funnelDefinition'

// Validate a funnel version
const result = validateFunnelVersion({
  questionnaire_config: config,
  content_manifest: manifest,
})

if (!result.valid) {
  console.error(formatValidationErrors(result.errors))
}
```

### Adding New Rules

When adding a new validation rule:

1. Add rule ID to the Rules table with description
2. Add corresponding error code to `VALIDATION_ERROR_CODES` in `lib/validators/funnelDefinition.ts`
3. Implement check logic in the appropriate validator function
4. Add error code to rule ID mapping in CI script
5. Update this matrix document
6. Verify coverage remains at 100%

## Notes

- All checks must output "violates R-XYZ" format for quick diagnosis
- Error codes are deterministic and never change
- Schema version is enforced at the contract level (Zod literal)
- Referential integrity is checked after schema validation
- CI check runs against database state, not file system
