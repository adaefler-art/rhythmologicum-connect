# Funnel System Documentation

**Version:** 1.0  
**Last Updated:** 2026-02-01  
**Purpose:** Comprehensive documentation for the Canonical Funnel Definition Schema and related workflows

## Overview

This directory contains the canonical documentation for the Rhythmologicum Connect Funnel System, covering:
- Schema definition and validation
- Assessment start/resume semantics
- Studio publishing workflow
- End-to-end testing procedures

All funnel definitions in the system must conform to the standards documented here.

---

## Document Index

### 1. [DEFINITION_V1.md](./DEFINITION_V1.md)
**Canonical Funnel Definition Schema v1**

The authoritative contract for funnel configurations. Defines:
- Questionnaire config structure (steps, questions, validation)
- Content manifest structure (pages, sections, assets)
- 18 validation rules (R-E74-001 through R-E74-018)
- Error codes and their meanings
- Examples and migration guide

**Use this when:**
- Creating new funnel definitions
- Understanding schema requirements
- Debugging validation errors
- Migrating legacy funnels

**Key Concepts:**
- `schema_version: "v1"` is required in both configs
- Questions must have unique IDs and keys
- Conditional logic cannot forward-reference
- URLs are validated for security (XSS prevention)

---

### 2. [START_RESUME_SEMANTICS.md](./START_RESUME_SEMANTICS.md)
**Assessment Start/Resume Behavior**

Defines idempotent assessment lifecycle semantics. Covers:
- ONE in-progress assessment per patient+funnel (database constraint)
- RESUME_OR_CREATE default behavior
- FORCE_NEW explicit restart behavior
- Race condition protection
- Frontend integration patterns

**Use this when:**
- Implementing assessment flows
- Understanding assessment state management
- Troubleshooting duplicate assessments
- Integrating mobile/web frontends

**Key Concepts:**
- Default POST returns existing assessment (RESUME)
- `forceNew: true` completes old and creates new
- Unique database constraint prevents duplicates
- Parallel requests are safe and idempotent

---

### 3. [STUDIO_PUBLISH_GATES.md](./STUDIO_PUBLISH_GATES.md)
**Publishing Workflow and Gates**

Defines the Studio editor draft/publish workflow. Covers:
- Draft, Published, and Archived version states
- 7 publish gates that must pass
- Atomic transaction guarantees
- Publish history and audit trail
- API endpoints and authorization

**Use this when:**
- Using the Studio editor
- Understanding publish workflow
- Troubleshooting publish failures
- Implementing Studio integrations

**Key Concepts:**
- Drafts can be edited, published versions cannot
- Validation must pass before publish
- Publish is atomic (status + pointer + history)
- Only admin/clinician can publish
- Patient APIs only see published versions

---

### 4. [TEST_E2E.md](./TEST_E2E.md)
**End-to-End Manual Test Script**

Step-by-step test procedures for the complete funnel system. Covers:
- 10 test scenarios from validation to assessment
- Database verification steps
- CI/CD script execution
- Troubleshooting guide
- Success criteria

**Use this when:**
- Setting up new developer environment
- Validating after deployment
- Reproducing bugs
- Onboarding new team members

**Key Scenarios:**
1. Validate existing funnels
2. Create and validate drafts
3. Publish valid/invalid drafts
4. Start/resume assessments
5. Force new assessments
6. Race condition handling
7. CI/CD verification
8. Error traceability

---

## Quick Reference

### Validation Rules Summary

| Category | Rules | Error Code Prefix |
|----------|-------|-------------------|
| Schema Structure | R-E74-001 to R-E74-002 | `DEF_*_SCHEMA_*` |
| Questionnaire Steps | R-E74-003 to R-E74-006 | `DEF_*_STEP*`, `DEF_*_QUESTIONS` |
| Questionnaire Questions | R-E74-007 to R-E74-011 | `DEF_*_QUESTION_*`, `DEF_*_OPTIONS_*` |
| Conditional Logic | R-E74-012 to R-E74-013 | `DEF_CONDITIONAL_*` |
| Content Manifest | R-E74-014 to R-E74-018 | `DEF_*_PAGE*`, `DEF_*_SECTIONS`, `DEF_*_ASSET_*` |

**Total:** 18 validation rules

### Publishing Gates Summary

| Gate | Rule | Error Code |
|------|------|------------|
| Validation Check | R-E74.3-003 | `PUBLISH_WITH_VALIDATION_ERRORS` |
| Schema Validation | R-E74.3-008 | `VALIDATION_NOT_CANONICAL` |
| Authorization | R-E74.3-009 | `STUDIO_UNAUTHORIZED` |
| Atomicity | R-E74.3-004 | `PUBLISH_NOT_ATOMIC` |
| Single Default | R-E74.3-005 | `MULTIPLE_DEFAULT_VERSIONS` |
| Published Metadata | R-E74.3-006 | `PUBLISHED_MISSING_METADATA` |
| Publish History Diff | R-E74.3-007 | `PUBLISH_HISTORY_NO_DIFF` |

**Total:** 7 publish gates

### Assessment Lifecycle Summary

| Action | API Endpoint | Behavior |
|--------|--------------|----------|
| Start/Resume (default) | `POST /api/funnels/{slug}/assessments` | RESUME_OR_CREATE |
| Force New | `POST /api/funnels/{slug}/assessments` with `forceNew: true` | FORCE_NEW |
| Get Status | `GET /api/funnels/{slug}/assessments/{id}` | Returns current step |
| Save Answers | `POST /api/assessment-answers/save` | Saves progress |
| Complete | `POST /api/funnels/{slug}/assessments/{id}/complete` | Marks completed |

**Database Guarantee:** ONE in-progress assessment per patient+funnel

---

## API Reference

### Validation API

```typescript
import { 
  validateFunnelVersion, 
  formatValidationErrors,
  ERROR_CODE_TO_RULE_ID 
} from '@/lib/validators/funnelDefinition'

const result = validateFunnelVersion({
  questionnaire_config: {...},
  content_manifest: {...}
})

if (!result.valid) {
  console.error(formatValidationErrors(result.errors))
  // Output: "[DEF_DUPLICATE_QUESTION_ID] violates R-E74-007: ..."
}
```

### Studio API

```typescript
// Create draft
POST /api/admin/studio/funnels/{slug}/drafts

// Validate draft
POST /api/admin/studio/funnels/{slug}/drafts/{draftId}/validate

// Publish draft
POST /api/admin/studio/funnels/{slug}/drafts/{draftId}/publish

// Get history
GET /api/admin/studio/funnels/{slug}/history
```

### Patient Assessment API

```typescript
// Start or resume
POST /api/funnels/{slug}/assessments
// Body: {} or { forceNew: true }

// Get current assessment
GET /api/funnels/{slug}/assessments/{id}

// Save answers
POST /api/assessment-answers/save

// Complete assessment
POST /api/funnels/{slug}/assessments/{id}/complete
```

---

## CI/CD Commands

```bash
# Validate all funnel definitions
npm run verify:funnel-definitions

# Verify E74.2 canonical v1 backfill
npm run verify:e74-2

# Verify E74.3 studio publishing guardrails
npm run verify:e74-3

# Verify E74.6 patient funnels lifecycle
npm run verify:e74-6

# Verify E74.7 assessment idempotency
npm run verify:e74-7
```

All scripts output violations in format: `"violates R-XYZ"`

---

## Related Documentation

### In This Repository

- `/docs/RULES_VS_CHECKS_MATRIX.md` - Complete rule-to-check mapping
- `/docs/E74_1_IMPLEMENTATION_SUMMARY.md` - E74.1 implementation details
- `/docs/E74_3_IMPLEMENTATION_SUMMARY.md` - E74.3 implementation details
- `/E74.7-COMPLETE.md` - E74.7 completion summary
- `/E74.7-SUMMARY.md` - E74.7 summary

### Implementation Files

- `lib/validators/funnelDefinition.ts` - Validation implementation
- `lib/contracts/funnelManifest.ts` - Schema contracts (Zod)
- `scripts/ci/verify-*-*.mjs` - CI verification scripts
- `supabase/migrations/202602*_e74_*.sql` - Database migrations

---

## Guardrails

**Every rule has a check, and every check references a rule.**

This documentation follows the E74.9 guardrail:
- ✅ All validation rules documented
- ✅ All error codes mapped to rule IDs
- ✅ All checks output "violates R-XYZ" format
- ✅ Complete rules-vs-checks matrix maintained
- ✅ End-to-end test script provided

**Verification:** `npm run verify:e74-3` (checks rule-check alignment)

---

## Version History

- **1.0 (2026-02-01):** Initial documentation release
  - DEFINITION_V1.md: Canonical schema v1
  - START_RESUME_SEMANTICS.md: Assessment lifecycle
  - STUDIO_PUBLISH_GATES.md: Publishing workflow
  - TEST_E2E.md: Manual test procedures
  - README.md: This index

---

## Contributing

When updating funnel documentation:

1. **Schema Changes:** Update DEFINITION_V1.md and increment version
2. **New Rules:** Add to RULES_VS_CHECKS_MATRIX.md and relevant doc
3. **API Changes:** Update relevant doc and examples
4. **Test Changes:** Update TEST_E2E.md scenarios

**Always:**
- Maintain rule ID traceability
- Update error code mappings
- Verify CI scripts pass
- Document breaking changes

---

## Support

For questions or issues:
- Check TEST_E2E.md troubleshooting section
- Review RULES_VS_CHECKS_MATRIX.md for rule details
- Run relevant `npm run verify:*` command
- Consult implementation summary docs

**Key Principle:** If a check fails, it references a rule. If a rule exists, it has a check.
