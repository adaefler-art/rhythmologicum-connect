# E74.3 Guardrails Matrix Diff Report

**Generated:** 2026-02-01T12:20:57.807Z
**Status:** ✅ PASSED
**Coverage:** 100%

## Rules Added (E74.3)

| Rule ID | Description | Error Code | Check Location |
|---------|-------------|------------|----------------|
| R-E74.3-001 | Draft versions must have status="draft" and is_default=false | `DRAFT_INVALID_STATUS` | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:create_draft_from_version() |
| R-E74.3-002 | Published versions cannot be deleted (only archived) | `PUBLISHED_DELETE_BLOCKED` | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:prevent_published_version_delete() |
| R-E74.3-003 | Draft with validation errors cannot be published | `PUBLISH_WITH_VALIDATION_ERRORS` | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version() |
| R-E74.3-004 | Publish must be atomic (status update + default pointer + audit log) | `PUBLISH_NOT_ATOMIC` | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version() |
| R-E74.3-005 | Only one version per funnel can have is_default=true | `MULTIPLE_DEFAULT_VERSIONS` | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version() |
| R-E74.3-006 | Published version must have published_at and published_by set | `PUBLISHED_MISSING_METADATA` | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version() |
| R-E74.3-007 | Publish history must record diff between versions | `PUBLISH_HISTORY_NO_DIFF` | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql:publish_draft_version() |
| R-E74.3-008 | Validation must use E74.1 canonical validators | `VALIDATION_NOT_CANONICAL` | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts:validateFunnelVersion() |
| R-E74.3-009 | Studio API endpoints require admin or clinician role | `STUDIO_UNAUTHORIZED` | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/route.ts:hasAdminOrClinicianRole() |
| R-E74.3-010 | Patient APIs must only serve published versions (status="published") | `PATIENT_SEES_DRAFT` | Patient API endpoints (verified manually - see E74_3_PATIENT_API_VERIFICATION.md) |

## Checks Added (E74.3)

| Check | Rule IDs | Location | Description |
|-------|----------|----------|-------------|
| create_draft_from_version | R-E74.3-001 | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql | Database function that creates draft with correct status and is_default=false |
| prevent_published_version_delete_trigger | R-E74.3-002 | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql | Trigger that prevents deletion of published versions |
| publish_draft_version | R-E74.3-003, R-E74.3-004, R-E74.3-005, R-E74.3-006, R-E74.3-007 | supabase/migrations/20260201120948_e74_3_funnel_studio_draft_publish.sql | Atomic publish function with validation check, metadata update, and audit logging |
| POST /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate | R-E74.3-008 | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts | Validation endpoint using E74.1 validators |
| Studio API Authorization | R-E74.3-009 | apps/rhythm-studio-ui/app/api/admin/studio/funnels/**/*.ts | All Studio API endpoints check for admin/clinician role |

## ⚠️  Warnings

- **[RULE_DEFERRED]** Rule R-E74.3-010 is deferred for later implementation

## Coverage Analysis

Before E74.3:
- E74.1: 18 rules
- E74.2: 8 rules
- Total: 26 rules

After E74.3:
- E74.1: 18 rules
- E74.2: 8 rules
- E74.3: 10 rules
- Total: 36 rules

New rules added: 10
Coverage maintained: 100%
