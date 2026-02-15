# E74.2 Test Plan

## Migration Testing

### Pre-requisites
- Local Supabase instance running
- Database reset to clean state
- Environment variables configured

### Test 1: Migration Idempotence

**Objective:** Verify migration can be run multiple times safely

**Steps:**
```bash
# Reset database
supabase db reset

# Run migration (first time)
# Migration runs automatically during reset

# Verify initial state
npm run verify:e74-2

# Run migration again by resetting
supabase db reset

# Verify state unchanged
npm run verify:e74-2
```

**Expected Result:**
- ✅ First run: All checks pass
- ✅ Second run: All checks pass
- ✅ No errors or warnings
- ✅ Data remains consistent

---

### Test 2: Schema Version Backfill

**Objective:** Verify all funnel_versions have schema_version 'v1'

**SQL Check:**
```sql
SELECT 
  fv.id,
  fv.version,
  fv.questionnaire_config->>'schema_version' as qc_schema_version,
  fv.content_manifest->>'schema_version' as cm_schema_version
FROM funnel_versions fv
JOIN funnels_catalog fc ON fv.funnel_id = fc.id
WHERE fc.slug IN ('stress-assessment', 'sleep-quality', 'cardiovascular-age', 'heart-health-nutrition');
```

**Expected Result:**
- ✅ All rows have qc_schema_version = 'v1'
- ✅ All rows have cm_schema_version = 'v1'
- ✅ No NULL values

---

### Test 3: A/B Funnel Publishing

**Objective:** Verify A/B funnels are published and active

**SQL Check:**
```sql
SELECT 
  slug,
  published,
  is_active,
  default_version_id IS NOT NULL as has_default_version
FROM funnels_catalog
WHERE slug IN ('stress-assessment', 'sleep-quality')
ORDER BY slug;
```

**Expected Result:**
| slug | published | is_active | has_default_version |
|------|-----------|-----------|---------------------|
| sleep-quality | true | true | true |
| stress-assessment | true | true | true |

---

### Test 4: Archived Funnel Status

**Objective:** Verify archived funnels are not published

**SQL Check:**
```sql
SELECT 
  slug,
  published,
  is_active,
  default_version_id IS NOT NULL as has_default_version
FROM funnels_catalog
WHERE slug IN ('cardiovascular-age', 'heart-health-nutrition')
ORDER BY slug;
```

**Expected Result:**
| slug | published | is_active | has_default_version |
|------|-----------|-----------|---------------------|
| cardiovascular-age | false | true | true |
| heart-health-nutrition | false | true | true |

---

### Test 5: Slug Uniqueness

**Objective:** Verify no duplicate slugs exist

**SQL Check:**
```sql
SELECT slug, COUNT(*) as count
FROM funnels_catalog
GROUP BY slug
HAVING COUNT(*) > 1;
```

**Expected Result:**
- ✅ No rows returned (no duplicates)

---

### Test 6: Pillar Mapping Validation

**Objective:** Verify all pillar_id references are valid

**SQL Check:**
```sql
SELECT 
  fc.slug,
  fc.pillar_id,
  p.title as pillar_title
FROM funnels_catalog fc
LEFT JOIN pillars p ON fc.pillar_id = p.key
WHERE fc.slug IN ('stress-assessment', 'sleep-quality', 'cardiovascular-age', 'heart-health-nutrition')
ORDER BY fc.slug;
```

**Expected Result:**
| slug | pillar_id | pillar_title |
|------|-----------|--------------|
| cardiovascular-age | prevention | Prävention & Gesundheitsvorsorge |
| heart-health-nutrition | nutrition | Ernährung |
| sleep-quality | sleep | Schlaf |
| stress-assessment | mental-health | Mentale Gesundheit & Stressmanagement |

- ✅ All rows have matching pillar
- ✅ No NULL pillar_title (indicates valid foreign key)

---

### Test 7: CI Verification Script

**Objective:** Verify E74.2 verification script runs successfully

**Steps:**
```bash
npm run verify:e74-2
```

**Expected Output:**
```
========================================
E74.2 Canonical v1 Migration Verification
========================================

🔍 Checking schema_version in funnel_versions...
🔍 Checking slug uniqueness...
🔍 Checking pillar mappings...
🔍 Checking A/B defaults (published funnels)...
🔍 Checking archived funnels (unpublished)...

========================================
Verification Summary
========================================
Schema Versions:     ✅ (4 versions checked)
Slug Uniqueness:     ✅ (4 funnels checked)
Pillar Mappings:     ✅ (4 funnels checked)
A/B Defaults:        ✅ (2 A/B funnels checked)
Archived Funnels:    ✅ (2 archived funnels checked)
========================================
Total Errors:        0
========================================

✅ All E74.2 validation checks passed!

📋 Migration Status:
   • 4 funnels migrated to canonical v1
   • 2 A/B funnels published (stress-assessment, sleep-quality)
   • 2 archived funnels unpublished (cardiovascular-age, heart-health-nutrition)
```

**Expected Exit Code:** 0

---

### Test 8: Patient API - Published Funnels

**Objective:** Verify published funnels are accessible via Patient API

**API Test:**
```bash
# Test stress-assessment (published)
curl -s http://localhost:3000/api/patient/funnel-definitions/stress-assessment | jq '.questionnaire_config.schema_version, .content_manifest.schema_version'

# Test sleep-quality (published)
curl -s http://localhost:3000/api/patient/funnel-definitions/sleep-quality | jq '.questionnaire_config.schema_version, .content_manifest.schema_version'
```

**Expected Result:**
- ✅ Both return HTTP 200
- ✅ Both have `schema_version: "v1"` in questionnaire_config
- ✅ Both have `schema_version: "v1"` in content_manifest

---

### Test 9: Patient API - Archived Funnels

**Objective:** Verify archived funnels are NOT accessible via Patient API

**API Test:**
```bash
# Test cardiovascular-age (archived)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/patient/funnel-definitions/cardiovascular-age

# Test heart-health-nutrition (archived)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/patient/funnel-definitions/heart-health-nutrition
```

**Expected Result:**
- ✅ Both return HTTP 404 or are filtered out
- ✅ Patients cannot access archived funnels

---

### Test 10: Funnel Catalog API

**Objective:** Verify catalog lists only published funnels

**API Test:**
```bash
curl -s http://localhost:3000/api/patient/funnels | jq '.data[] | {slug, published}'
```

**Expected Result:**
```json
[
  {
    "slug": "stress-assessment",
    "published": true
  },
  {
    "slug": "sleep-quality",
    "published": true
  }
]
```

- ✅ Only 2 funnels listed
- ✅ Both are published
- ✅ Archived funnels not included

---

## Regression Testing

### Test 11: Existing Funnel Data Integrity

**Objective:** Verify migration doesn't break existing funnel data

**Steps:**
```sql
-- Check questionnaire_config structure preserved
SELECT 
  fc.slug,
  fv.questionnaire_config->'steps' IS NOT NULL as has_steps,
  jsonb_array_length(fv.questionnaire_config->'steps') as step_count
FROM funnel_versions fv
JOIN funnels_catalog fc ON fv.funnel_id = fc.id
WHERE fc.slug = 'stress-assessment';

-- Check content_manifest structure preserved
SELECT 
  fc.slug,
  fv.content_manifest->'pages' IS NOT NULL as has_pages,
  jsonb_array_length(fv.content_manifest->'pages') as page_count
FROM funnel_versions fv
JOIN funnels_catalog fc ON fv.funnel_id = fc.id
WHERE fc.slug = 'stress-assessment';
```

**Expected Result:**
- ✅ has_steps = true
- ✅ step_count > 0
- ✅ has_pages = true
- ✅ page_count > 0
- ✅ Original data structure preserved

---

### Test 12: E74.1 Validation Still Works

**Objective:** Verify E74.1 funnel definition validation still works

**Steps:**
```bash
npm run verify:funnel-definitions
```

**Expected Result:**
- ✅ All funnel definitions valid
- ✅ No new violations introduced
- ✅ E74.1 and E74.2 checks are compatible

---

## Error Handling Testing

### Test 13: Missing Schema Version Detection

**Objective:** Verify script detects missing schema_version

**Setup:**
```sql
-- Manually remove schema_version from one funnel
UPDATE funnel_versions
SET questionnaire_config = questionnaire_config - 'schema_version'
WHERE funnel_id = (SELECT id FROM funnels_catalog WHERE slug = 'sleep-quality' LIMIT 1)
LIMIT 1;
```

**Run:**
```bash
npm run verify:e74-2
```

**Expected Output:**
```
[MISSING_SCHEMA_VERSION_QC] violates R-E74.2-001: Funnel version 1.0.0 (...) missing schema_version in questionnaire_config
```

**Expected Exit Code:** 1

**Cleanup:**
```bash
supabase db reset
```

---

### Test 14: Invalid Pillar Reference Detection

**Objective:** Verify script detects invalid pillar mappings

**Setup:**
```sql
-- Set invalid pillar_id
UPDATE funnels_catalog
SET pillar_id = 'invalid-pillar'
WHERE slug = 'stress-assessment';
```

**Run:**
```bash
npm run verify:e74-2
```

**Expected Output:**
```
[INVALID_PILLAR_MAPPING] violates R-E74.2-004: Funnel "stress-assessment" has invalid pillar_id: "invalid-pillar"
```

**Expected Exit Code:** 1

**Cleanup:**
```bash
supabase db reset
```

---

### Test 15: Incorrect Published Status Detection

**Objective:** Verify script detects incorrect published status

**Setup:**
```sql
-- Unpublish an A/B funnel
UPDATE funnels_catalog
SET published = false
WHERE slug = 'stress-assessment';
```

**Run:**
```bash
npm run verify:e74-2
```

**Expected Output:**
```
[INCORRECT_AB_PUBLISHED] violates R-E74.2-005: A/B funnel "stress-assessment" is not published (expected published=true)
```

**Expected Exit Code:** 1

**Cleanup:**
```bash
supabase db reset
```

---

## Performance Testing

### Test 16: Migration Performance

**Objective:** Verify migration completes in reasonable time

**Steps:**
```bash
time supabase db reset
```

**Expected Result:**
- ✅ Migration completes in < 10 seconds
- ✅ No timeout errors
- ✅ All verification checks pass

---

### Test 17: Verification Script Performance

**Objective:** Verify verification script runs quickly

**Steps:**
```bash
time npm run verify:e74-2
```

**Expected Result:**
- ✅ Script completes in < 5 seconds
- ✅ No timeout errors
- ✅ Reasonable query performance

---

## Documentation Review

### Test 18: Documentation Completeness

**Checklist:**
- [x] E74_2_IMPLEMENTATION_SUMMARY.md created
- [x] RULES_VS_CHECKS_MATRIX.md updated with E74.2 rules
- [x] Migration file has comprehensive comments
- [x] Verification script has JSDoc comments
- [x] README or main docs reference E74.2
- [x] A/B vs archived decision documented
- [x] Source provenance documented

---

## Acceptance Criteria Validation

### Final Checklist

- [ ] All 4 funnels have schema_version 'v1' ✅
- [ ] 2 A/B funnels published (stress-assessment, sleep-quality) ✅
- [ ] 2 archived funnels unpublished (cardiovascular-age, heart-health-nutrition) ✅
- [ ] Slug uniqueness maintained ✅
- [ ] Pillar mappings valid ✅
- [ ] Migration is idempotent ✅
- [ ] Source provenance recorded ✅
- [ ] API delivers canonical v1 ✅
- [ ] No legacy tables used ✅
- [ ] All 8 rules have checks ✅
- [ ] All checks reference rule IDs ✅
- [ ] Output contains "violates R-XYZ" ✅
- [ ] RULES_VS_CHECKS_MATRIX.md updated ✅

---

## Sign-off

**Test Execution Date:** _____________

**Tested By:** _____________

**Results:**
- [ ] All tests passed
- [ ] Minor issues (document below)
- [ ] Major issues (do not deploy)

**Notes:**
_____________________________________________________________________________
_____________________________________________________________________________

**Approval:** ☐ Approved for deployment ☐ Requires fixes
