# E75.2 Anamnese API — Rules vs Checks Matrix

This document maps all implementation rules to their corresponding verification checks, and vice versa.

## Rule → Check Mapping

| Rule ID | Rule Description | Check Implementation | Check File | Status |
|---------|------------------|---------------------|------------|--------|
| R-E75.2-1 | Patient GET /api/patient/anamnesis returns only own entries | verify_patient_list_isolation | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-2 | Patient GET /api/patient/anamnesis/[id] returns 404 for other patient's entry | verify_patient_get_isolation | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-3 | Patient POST /api/patient/anamnesis creates entry + version 1 in transaction | verify_patient_create_versioning | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-4 | Patient POST /api/patient/anamnesis/[id]/versions increments version | verify_patient_version_increment | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-5 | Patient POST /api/patient/anamnesis/[id]/archive sets is_archived=true | verify_patient_archive | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-6 | Patient cannot update archived entry (409 conflict) | verify_patient_archive_conflict | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-7 | Studio GET /api/studio/patients/[patientId]/anamnesis requires clinician role | verify_studio_list_auth | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-8 | Studio GET returns only entries for assigned patients | verify_studio_list_rls | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-9 | Studio POST /api/studio/patients/[patientId]/anamnesis requires clinician role | verify_studio_create_auth | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-10 | Studio POST creates entry + version 1 for assigned patient | verify_studio_create_versioning | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-11 | Studio POST /api/studio/anamnesis/[id]/versions requires clinician role | verify_studio_version_auth | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-12 | Studio POST /api/studio/anamnesis/[id]/archive requires clinician role | verify_studio_archive_auth | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-13 | Validation: title required, max 500 chars | verify_validation_title | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-14 | Validation: entry_type must be in allowed list | verify_validation_entry_type | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-15 | Validation: content JSONB max 1MB | verify_validation_content_size | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-16 | Error 404 for non-existent entry | verify_error_404 | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-17 | Error 403 for non-clinician on studio endpoints | verify_error_403 | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-18 | Error 409 for update on archived entry | verify_error_409 | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-19 | GET /api/patient/anamnesis/[id] includes all versions (latest first) | verify_versions_returned | verify-e75-2-anamnesis-api.mjs | ✅ |
| R-E75.2-20 | Update increments version_number sequentially (1, 2, 3...) | verify_version_sequential | verify-e75-2-anamnesis-api.mjs | ✅ |

## Check → Rule Mapping

| Check Function | Description | Rule ID(s) | File |
|----------------|-------------|------------|------|
| verify_patient_list_isolation | Patient sees only own entries | R-E75.2-1 | verify-e75-2-anamnesis-api.mjs |
| verify_patient_get_isolation | Patient 404 on other's entry | R-E75.2-2 | verify-e75-2-anamnesis-api.mjs |
| verify_patient_create_versioning | Create generates v1 | R-E75.2-3 | verify-e75-2-anamnesis-api.mjs |
| verify_patient_version_increment | Update increments version | R-E75.2-4, R-E75.2-20 | verify-e75-2-anamnesis-api.mjs |
| verify_patient_archive | Archive sets flag | R-E75.2-5 | verify-e75-2-anamnesis-api.mjs |
| verify_patient_archive_conflict | 409 on archived update | R-E75.2-6, R-E75.2-18 | verify-e75-2-anamnesis-api.mjs |
| verify_studio_list_auth | Studio requires clinician | R-E75.2-7, R-E75.2-17 | verify-e75-2-anamnesis-api.mjs |
| verify_studio_list_rls | Studio RLS isolation | R-E75.2-8 | verify-e75-2-anamnesis-api.mjs |
| verify_studio_create_auth | Studio create auth | R-E75.2-9, R-E75.2-17 | verify-e75-2-anamnesis-api.mjs |
| verify_studio_create_versioning | Studio create v1 | R-E75.2-10 | verify-e75-2-anamnesis-api.mjs |
| verify_studio_version_auth | Studio version auth | R-E75.2-11, R-E75.2-17 | verify-e75-2-anamnesis-api.mjs |
| verify_studio_archive_auth | Studio archive auth | R-E75.2-12, R-E75.2-17 | verify-e75-2-anamnesis-api.mjs |
| verify_validation_title | Title validation | R-E75.2-13 | verify-e75-2-anamnesis-api.mjs |
| verify_validation_entry_type | Entry type validation | R-E75.2-14 | verify-e75-2-anamnesis-api.mjs |
| verify_validation_content_size | Content size limit | R-E75.2-15 | verify-e75-2-anamnesis-api.mjs |
| verify_error_404 | 404 for not found | R-E75.2-16 | verify-e75-2-anamnesis-api.mjs |
| verify_error_403 | 403 for forbidden | R-E75.2-17 | verify-e75-2-anamnesis-api.mjs |
| verify_error_409 | 409 for conflict | R-E75.2-18 | verify-e75-2-anamnesis-api.mjs |
| verify_versions_returned | GET returns all versions | R-E75.2-19 | verify-e75-2-anamnesis-api.mjs |
| verify_version_sequential | Sequential versioning | R-E75.2-20 | verify-e75-2-anamnesis-api.mjs |

## Coverage Summary

- **Total Rules**: 20
- **Total Checks**: 16
- **Rules without Checks**: 0 ✅
- **Checks without Rules**: 0 ✅
- **Scope Mismatches**: 0 ✅

## Implementation Files

### API Routes
- `apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts` - Patient list & create
- `apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts` - Patient get single
- `apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/versions/route.ts` - Patient version
- `apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/archive/route.ts` - Patient archive
- `apps/rhythm-studio-ui/app/api/studio/patients/[patientId]/anamnesis/route.ts` - Studio list & create
- `apps/rhythm-studio-ui/app/api/studio/anamnesis/[entryId]/versions/route.ts` - Studio version
- `apps/rhythm-studio-ui/app/api/studio/anamnesis/[entryId]/archive/route.ts` - Studio archive

### Utilities
- `lib/api/anamnesis/validation.ts` - Validation logic
- `lib/api/anamnesis/helpers.ts` - Database helpers

### Database
- `supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql` - Schema & RLS

### Verification
- `scripts/ci/verify-e75-2-anamnesis-api.mjs` - Automated checks

## Error Output Format

All checks output violations in the format:
```
❌ violates R-E75.2-X: [description]
```

This enables quick diagnosis via grep/search.

## Example Check Run

```bash
npm run verify:e75-2
```

Expected output:
```
✅ All E75.2 Anamnese API rules verified successfully
   - Patient isolation: OK
   - Studio access control: OK
   - Versioning: OK
   - Validation: OK
   - Error codes: OK
```

## Notes

- All rules leverage existing RLS policies from E75.1 migration
- Versioning is handled by database triggers (transactional)
- Error codes follow standard ApiResponse format
- All endpoints require authentication (401 if not logged in)
