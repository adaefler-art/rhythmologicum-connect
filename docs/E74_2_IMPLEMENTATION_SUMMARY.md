# E74.2 Implementation Summary

## Backfill/Migration: 4 Datasets → Canonical v1 (A/B Designation)

**Date:** 2026-02-01  
**Status:** ✅ Complete  
**Coverage:** 100% (8 rules, all with checks)

---

## Overview

This implementation migrates the existing 4 funnel datasets in `funnels_catalog` to canonical v1 schema with A/B designation. The migration:

1. Adds `schema_version: 'v1'` to all `questionnaire_config` and `content_manifest` JSONB fields
2. Sets `published=true` for 2 A/B default funnels (patient-visible)
3. Sets `published=false` for 2 archived funnels (not patient-visible)
4. Ensures data integrity (slug uniqueness, pillar mapping)
5. Adds source provenance metadata
6. Is fully idempotent (safe to re-run)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              4 Funnels in funnels_catalog                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  A/B Defaults (published=true, patient-visible):            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. stress-assessment                                 │   │
│  │    • Most mature (1063 lines of content seeding)     │   │
│  │    • pillar_id: mental-health                        │   │
│  │    • default_version_id: v1.0.0                      │   │
│  │    • is_active: true                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. sleep-quality                                     │   │
│  │    • Comprehensive stub (3 well-structured steps)    │   │
│  │    • pillar_id: sleep                                │   │
│  │    • default_version_id: v1.0.0                      │   │
│  │    • is_active: true                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Archived (published=false, not patient-visible):           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. cardiovascular-age                                │   │
│  │    • Stub manifest for future use                    │   │
│  │    • pillar_id: prevention                           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 4. heart-health-nutrition                            │   │
│  │    • Stub manifest for future use                    │   │
│  │    • pillar_id: nutrition                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Migration Script (Idempotent)                   │
│  supabase/migrations/20260201100400_e74_2_backfill_*        │
│                                                               │
│  1. Add schema_version 'v1' to all funnel_versions          │
│  2. Set published=true for A/B funnels                       │
│  3. Set published=false for archived funnels                 │
│  4. Verify slug uniqueness                                   │
│  5. Verify pillar mappings                                   │
│  6. Add source provenance metadata                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Verification Script (CI/CD)                     │
│  scripts/ci/verify-e74-2-canonical-v1.mjs                   │
│                                                               │
│  • Validates all 8 E74.2 rules                               │
│  • Reports violations with "violates R-E74.2-XXX"           │
│  • Verifies A/B defaults are published & active              │
│  • Verifies archived funnels are unpublished                 │
│  • Exit code 0 = all checks passed                           │
└─────────────────────────────────────────────────────────────┘
```

---

## A/B vs Archived Decision

### A/B Defaults (Patient-Visible)

**Criteria:** Most complete and ready for patient use

1. **stress-assessment**
   - Most mature funnel in the system
   - Has 1063 lines of content seeding migration
   - Full content pages with rich media and guidance
   - Production-ready with validated workflow
   
2. **sleep-quality**
   - Most comprehensive stub manifest
   - 3 well-structured steps with detailed questions
   - Covers key sleep assessment domains (patterns, problems, hygiene)
   - Ready for patient testing

### Archived (Not Patient-Visible)

**Criteria:** Stub manifests for future development

3. **cardiovascular-age**
   - Stub manifest with basic structure
   - Requires additional content development
   - Reserved for future pillar expansion
   
4. **heart-health-nutrition**
   - Stub manifest with basic structure
   - 4 steps but needs content enrichment
   - Reserved for future pillar expansion

---

## Files Changed

### 1. Migration Script

**File:** `supabase/migrations/20260201100400_e74_2_backfill_canonical_v1.sql`

**Sections:**
1. **Add schema_version to funnel_versions**
   - Updates `questionnaire_config` with `schema_version: 'v1'`
   - Updates `content_manifest` with `schema_version: 'v1'`
   - Only modifies if missing or incorrect
   - Sets `updated_at` timestamp

2. **Set published status**
   - A/B funnels: `published=true` (stress-assessment, sleep-quality)
   - Archived funnels: `published=false` (cardiovascular-age, heart-health-nutrition)

3. **Add source provenance**
   - Updates table comment with migration tracking
   - Records E74.2 backfill date

4. **Verify data integrity**
   - Checks slug uniqueness (enforced by unique constraint)
   - Verifies pillar mappings against pillars table
   - Validates schema_version presence
   - Confirms A/B defaults published status
   - Confirms archived funnels unpublished status

5. **Migration summary**
   - Reports total funnels, versions, published count
   - Lists A/B defaults and archived funnels
   - Confirms canonical v1 compliance

**Idempotency:**
- All updates use conditional checks (WHERE clauses)
- Uses `jsonb_set` with create_if_missing=true
- Safe to re-run multiple times
- No destructive operations

---

### 2. Verification Script

**File:** `scripts/ci/verify-e74-2-canonical-v1.mjs`

**Purpose:** CI/CD check for E74.2 compliance

**Checks Implemented:**

| Function | Rules Validated | Description |
|----------|----------------|-------------|
| `checkSchemaVersions()` | R-E74.2-001, R-E74.2-002 | All funnel_versions have schema_version 'v1' |
| `checkSlugUniqueness()` | R-E74.2-003 | No duplicate slugs in funnels_catalog |
| `checkPillarMappings()` | R-E74.2-004 | All pillar_id references are valid |
| `checkABDefaults()` | R-E74.2-005, R-E74.2-007, R-E74.2-008 | A/B funnels published, active, with default versions |
| `checkArchivedFunnels()` | R-E74.2-006 | Archived funnels are unpublished |

**Error Format:**
```
[MISSING_SCHEMA_VERSION_QC] violates R-E74.2-001: Funnel version 1.0.0 missing schema_version in questionnaire_config
```

**Exit Codes:**
- `0` - All checks passed
- `1` - Validation failures found
- `2` - Script error (config, database)

**Usage:**
```bash
npm run verify:e74-2
```

---

### 3. Updated Documentation

**File:** `docs/RULES_VS_CHECKS_MATRIX.md`

**Changes:**
- Renamed from "E74.1: Rules vs Checks Matrix" to "E74: Rules vs Checks Matrix"
- Added E74.2 section with 8 migration rules
- Added E74.2 error codes (12 codes)
- Added E74.2 check implementations
- Updated coverage metrics: 26 total rules (18 E74.1 + 8 E74.2)
- Added E74.2 usage examples

---

### 4. Package.json

**Added Script:**
```json
"verify:e74-2": "node scripts/ci/verify-e74-2-canonical-v1.mjs"
```

---

## Validation Rules

### R-E74.2-001: Schema version in questionnaire_config
- **Error Codes:** `MISSING_SCHEMA_VERSION_QC`, `INVALID_SCHEMA_VERSION_QC`
- **Check:** `checkSchemaVersions()`
- **Fix:** Migration adds `"schema_version": "v1"` to all questionnaire_config

### R-E74.2-002: Schema version in content_manifest
- **Error Codes:** `MISSING_SCHEMA_VERSION_CM`, `INVALID_SCHEMA_VERSION_CM`
- **Check:** `checkSchemaVersions()`
- **Fix:** Migration adds `"schema_version": "v1"` to all content_manifest

### R-E74.2-003: Slug uniqueness
- **Error Code:** `DUPLICATE_SLUG`
- **Check:** `checkSlugUniqueness()`
- **Fix:** Already enforced by database unique constraint

### R-E74.2-004: Valid pillar mappings
- **Error Code:** `INVALID_PILLAR_MAPPING`
- **Check:** `checkPillarMappings()`
- **Fix:** Migration verifies all pillar_id values exist in pillars table

### R-E74.2-005: A/B funnels published
- **Error Codes:** `INCORRECT_AB_COUNT`, `INCORRECT_AB_PUBLISHED`
- **Check:** `checkABDefaults()`
- **Fix:** Migration sets `published=true` for stress-assessment and sleep-quality

### R-E74.2-006: Archived funnels unpublished
- **Error Codes:** `INCORRECT_ARCHIVED_COUNT`, `INCORRECT_ARCHIVED_PUBLISHED`
- **Check:** `checkArchivedFunnels()`
- **Fix:** Migration sets `published=false` for cardiovascular-age and heart-health-nutrition

### R-E74.2-007: Published funnels active
- **Error Code:** `PUBLISHED_NOT_ACTIVE`
- **Check:** `checkABDefaults()`
- **Fix:** Verify `is_active=true` for published funnels

### R-E74.2-008: Published funnels have default version
- **Error Code:** `PUBLISHED_NO_DEFAULT_VERSION`
- **Check:** `checkABDefaults()`
- **Fix:** Verify `default_version_id` is set for published funnels

---

## Migration Safety

### Idempotency Guarantees

1. **Schema version updates:**
   ```sql
   WHERE questionnaire_config->>'schema_version' IS NULL 
      OR questionnaire_config->>'schema_version' != 'v1'
   ```
   - Only updates if missing or incorrect
   - Safe to re-run

2. **Published status updates:**
   ```sql
   WHERE slug IN ('stress-assessment', 'sleep-quality')
     AND (published IS NULL OR published = false)
   ```
   - Only updates if status doesn't match target
   - Safe to re-run

3. **Verification checks:**
   - Use `DO $$` blocks with conditional logic
   - Only raise notices/warnings, no destructive actions
   - Provide detailed diagnostics

### Rollback Strategy

If needed, rollback by:

1. **Restore published status:**
   ```sql
   UPDATE funnels_catalog SET published = false WHERE slug IN ('stress-assessment', 'sleep-quality');
   UPDATE funnels_catalog SET published = true WHERE slug IN ('cardiovascular-age', 'heart-health-nutrition');
   ```

2. **Remove schema_version (if needed):**
   ```sql
   UPDATE funnel_versions SET 
     questionnaire_config = questionnaire_config - 'schema_version',
     content_manifest = content_manifest - 'schema_version';
   ```

---

## API Impact

### Patient Definition API

**Endpoint:** `GET /api/patient/funnel-definitions/{slug}`

**Changes:**
- Only returns funnels with `published=true`
- A/B funnels (stress-assessment, sleep-quality) are accessible
- Archived funnels return 404 or are filtered out
- All returned manifests have `schema_version: 'v1'`

**Example Response:**
```json
{
  "slug": "stress-assessment",
  "title": "Stress Assessment",
  "questionnaire_config": {
    "schema_version": "v1",
    "version": "1.0",
    "steps": [...]
  },
  "content_manifest": {
    "schema_version": "v1",
    "version": "1.0",
    "pages": [...]
  }
}
```

### Catalog API

**Endpoint:** `GET /api/patient/funnels`

**Changes:**
- Lists only published funnels
- Returns 2 funnels: stress-assessment, sleep-quality
- Excludes archived funnels by default

---

## Testing

### Manual Verification Steps

1. **Run migration:**
   ```bash
   supabase db reset
   # Migration runs automatically
   ```

2. **Run verification script:**
   ```bash
   npm run verify:e74-2
   ```

3. **Check database state:**
   ```sql
   SELECT slug, published, is_active, default_version_id 
   FROM funnels_catalog 
   WHERE slug IN ('stress-assessment', 'sleep-quality', 'cardiovascular-age', 'heart-health-nutrition');
   
   SELECT 
     fv.version,
     fv.questionnaire_config->>'schema_version' as qc_version,
     fv.content_manifest->>'schema_version' as cm_version
   FROM funnel_versions fv
   LIMIT 10;
   ```

4. **Test Patient API:**
   ```bash
   curl http://localhost:3000/api/patient/funnel-definitions/stress-assessment
   curl http://localhost:3000/api/patient/funnel-definitions/sleep-quality
   curl http://localhost:3000/api/patient/funnel-definitions/cardiovascular-age  # Should fail
   ```

---

## Source Provenance

### Migration Tracking

- **Table comment:** Updated to include "E74.2: Backfilled canonical v1 schema_version on 2026-02-01"
- **Migration file:** `supabase/migrations/20260201100400_e74_2_backfill_canonical_v1.sql`
- **Documentation:** This file + `docs/RULES_VS_CHECKS_MATRIX.md`

### Audit Trail

All changes are tracked via:
- Migration file in version control
- Database table comments
- Updated_at timestamps in affected rows
- CI/CD verification in RULES_VS_CHECKS_MATRIX.md

---

## Acceptance Criteria Status

✅ **Data cleanse: Slug uniqueness** - Verified by migration, enforced by unique constraint  
✅ **Data cleanse: Pillar mapping** - Verified by migration against pillars table  
✅ **funnel_versions with canonical v1 JSON** - All have schema_version 'v1'  
✅ **default_version_id for A/B** - Set for both A/B funnels  
✅ **Mapping: 2 official release (A/B)** - stress-assessment, sleep-quality  
✅ **Mapping: 2 archived** - cardiovascular-age, heart-health-nutrition  
✅ **Repeatable/idempotent migration** - Safe to re-run multiple times  
✅ **Source provenance recorded** - Table comment + migration file + docs  
✅ **Funnel A/B default** - Published and accessible to patients  
✅ **API delivers canonical v1** - All returned manifests have schema_version 'v1'  
✅ **Migrations idempotent** - Conditional updates, safe to re-run  
✅ **No legacy tables used** - Uses v0.5 schema (funnels_catalog, funnel_versions)  

### Guardrails

✅ **Every rule has check** - 8/8 rules implemented  
✅ **Every check references rule** - Complete ERROR_CODE_TO_RULE_ID mapping  
✅ **Output contains "violates R-XYZ"** - Verification script format implemented  
✅ **RULES_VS_CHECKS_MATRIX.md** - Updated with E74.2 rules  
✅ **Diff report** - Coverage metrics updated (26 total rules)  

---

## Benefits

### 1. **Clear A/B Designation**
- Patients only see published funnels (stress-assessment, sleep-quality)
- Archived funnels reserved for future development
- Simple `published` flag for visibility control

### 2. **Canonical v1 Compliance**
- All funnel definitions have schema_version 'v1'
- Consistent with E74.1 validation framework
- Ready for versioning and schema evolution

### 3. **Data Integrity**
- Slug uniqueness verified
- Pillar mappings validated
- Default versions set for published funnels
- Active status enforced for published funnels

### 4. **Idempotent Migration**
- Safe to re-run multiple times
- Conditional updates prevent duplicates
- No destructive operations
- Comprehensive verification checks

### 5. **Complete Audit Trail**
- Migration file tracked in version control
- Source provenance in table comments
- Documentation in RULES_VS_CHECKS_MATRIX
- CI/CD verification script

---

## Future Enhancements

### Potential Additions

1. **Dynamic A/B Rollout**
   - Use `rollout_percent` for gradual feature rollout
   - A/B testing different funnel versions
   - Controlled exposure for new features

2. **Archive Management**
   - Admin UI for publishing/archiving funnels
   - Version history for published changes
   - Audit log for visibility changes

3. **Publishing Workflow**
   - Approval process for publishing new funnels
   - Preview mode for testing unpublished funnels
   - Scheduled publishing for time-based releases

4. **Patient Segmentation**
   - Target specific patient cohorts with different funnels
   - Personalized funnel recommendations
   - A/B testing by patient demographics

---

## Conclusion

E74.2 implementation successfully migrates 4 funnel datasets to canonical v1 with clear A/B designation. The migration is fully idempotent, maintains data integrity, and includes comprehensive verification. With 100% rule coverage and complete documentation, the system is ready for production deployment.

**Key Achievements:**
- ✅ 4 funnels migrated to canonical v1
- ✅ 2 A/B funnels published (stress-assessment, sleep-quality)
- ✅ 2 archived funnels unpublished (cardiovascular-age, heart-health-nutrition)
- ✅ 8 validation rules with deterministic error codes
- ✅ Idempotent migration (safe to re-run)
- ✅ Complete source provenance tracking
- ✅ CI/CD verification script
- ✅ 100% coverage (rules ↔ checks mapping)

**Production Readiness:** High - Idempotent migration, comprehensive validation, complete audit trail.  
**Operational Impact:** Low - Non-breaking changes, backward compatible with existing data.  
**Security Posture:** Strong - Data integrity verified, no sensitive data exposed.
