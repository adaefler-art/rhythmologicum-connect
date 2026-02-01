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

## Audit Results

**Last Updated:** 2026-02-01

### Coverage Analysis

- **Rules without checks:** 0
- **Checks without rules:** 0
- **Total rules (E74.1):** 18
- **Total rules (E74.2):** 8
- **Total rules (E74 combined):** 26
- **Total check implementations:** 6 (E74.1 validators) + 2 (CI scripts)
- **Coverage:** 100%

### Scope Verification

All rules are correctly mapped to check implementations:
- ✅ E74.1: Schema structure rules (2 rules) - Implemented
- ✅ E74.1: Questionnaire config rules (11 rules) - Implemented
- ✅ E74.1: Content manifest rules (5 rules) - Implemented
- ✅ E74.2: Migration rules (8 rules) - Implemented

### Implementation Status

- ✅ E74.1: Runtime validators: `lib/validators/funnelDefinition.ts`
- ✅ E74.1: CI check script: `scripts/ci/verify-funnel-definitions.mjs`
- ✅ E74.2: Migration script: `supabase/migrations/20260201100400_e74_2_backfill_canonical_v1.sql`
- ✅ E74.2: CI check script: `scripts/ci/verify-e74-2-canonical-v1.mjs`
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
