# E76.5 Rules vs Checks Matrix

**Status**: Active (Epic E76 - Diagnosis Prompt v1)  
**Purpose**: Mapping of E76.5 guardrail rules to enforcement checks  
**Owner**: E76.5 Implementation  
**Last Updated**: 2026-02-04

---

## Overview

This document provides the complete matrix mapping every E76.5 rule to its enforcement mechanism. It ensures that the diagnosis prompt schema and API implementation comply with all requirements.

**Terminology**:
- **Rule**: A documented "MUST/SHOULD/FORBIDDEN/ALLOWED" constraint
- **Check**: An automated script that enforces a rule
- **Scope**: The exact files/paths where the rule applies
- **Pass Condition**: The criteria for a check to succeed
- **Evidence**: The artifact that proves compliance

---

## Matrix

### R-E76.5-001: Diagnosis Prompt Output Schema Must Exist

**Rule Text**: Diagnosis prompt output schema (v1) must exist at lib/contracts/diagnosis-prompt.ts

**Scope**:
- `lib/contracts/diagnosis-prompt.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptSchemaExists()`
- npm script: `npm run verify:e76-5`

**Pass Condition**:
- File exists at expected path
- Contains required exports: `DiagnosisPromptOutputV1Schema`, `DIAGNOSIS_PROMPT_BUNDLE_VERSION`, `DIAGNOSIS_PROMPT_VERSION`, `DIAGNOSIS_SCHEMA_VERSION`, `validateDiagnosisPromptOutputV1`
- Imports Zod for schema validation
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "✅ All E76.5 guardrails satisfied" (pass)
- Console: "[DIAGNOSIS_PROMPT_SCHEMA_MISSING] violates R-E76.5-001: ..." (fail)

**Known Gaps**: None

**Owner**: E76.5

---

### R-E76.5-002: Schema Must Include All Required Fields

**Rule Text**: Schema must include all required fields (summary, patient_context_used, differential_diagnoses, recommended_next_steps, urgent_red_flags, disclaimer)

**Scope**:
- `lib/contracts/diagnosis-prompt.ts`
- `DiagnosisPromptOutputV1Schema` definition

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptSchemaExists()`

**Pass Condition**:
- Schema includes all required fields: summary, patient_context_used, differential_diagnoses, recommended_next_steps, urgent_red_flags, disclaimer
- Each field is properly typed with Zod validators
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "[DIAGNOSIS_PROMPT_SCHEMA_INCOMPLETE] violates R-E76.5-002: Schema missing required field: {field}" (fail)

**Known Gaps**: Does not validate field types, only presence

**Owner**: E76.5

---

### R-E76.5-003: Diagnosis Prompt Must Exist in Registry

**Rule Text**: Diagnosis prompt must exist in lib/prompts/registry.ts with version v1.0.0

**Scope**:
- `lib/prompts/registry.ts`
- PROMPT_REGISTRY object

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptExists()`

**Pass Condition**:
- Registry contains key 'diagnosis-v1.0.0'
- Entry includes metadata fields (promptId, version, description)
- Entry includes model configuration
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "[DIAGNOSIS_PROMPT_MISSING] violates R-E76.5-003: Prompt registry does not contain diagnosis-v1.0.0 entry" (fail)

**Known Gaps**: Does not validate prompt template syntax

**Owner**: E76.5

---

### R-E76.5-004: Prompt Must Include Medical Advice Guardrails

**Rule Text**: Prompt must include medical advice guardrails in system prompt

**Scope**:
- `lib/prompts/registry.ts`
- 'diagnosis-v1.0.0' system prompt

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptExists()`

**Pass Condition**:
- System prompt includes text: "NOT providing medical advice"
- System prompt includes text: "for clinician review ONLY"
- System prompt includes text: "NOT make final diagnoses"
- System prompt includes text: "NOT prescribe treatments"
- System prompt includes text: "NOT replace clinical judgment"
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "[DIAGNOSIS_PROMPT_NO_GUARDRAILS] violates R-E76.5-004: Prompt missing guardrail text: \"{text}\"" (fail)

**Known Gaps**: None

**Owner**: E76.5

---

### R-E76.5-005: API Route Must Exist

**Rule Text**: API route /api/studio/diagnosis/prompt must exist

**Scope**:
- `apps/rhythm-studio-ui/app/api/studio/diagnosis/prompt/route.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptAPIRouteExists()`

**Pass Condition**:
- File exists at expected path
- Exports GET handler function
- Exports POST handler function
- Uses validateDiagnosisPromptOutputV1 for validation
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "[DIAGNOSIS_PROMPT_API_MISSING] violates R-E76.5-005: ..." (fail)

**Known Gaps**: Does not validate handler implementation logic

**Owner**: E76.5

---

### R-E76.5-006: Literal Callsite Must Exist

**Rule Text**: Literal callsite for /api/studio/diagnosis/prompt must exist (Strategy A compliance)

**Scope**:
- `apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx`

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptLiteralCallsiteExists()`

**Pass Condition**:
- File contains literal string '/api/studio/diagnosis/prompt'
- File contains fetch call
- File references E76.5
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "[DIAGNOSIS_PROMPT_LITERAL_MISSING] violates R-E76.5-006: Test page does not contain literal string /api/studio/diagnosis/prompt" (fail)

**Known Gaps**: Does not verify callsite is reachable/functional

**Owner**: E76.5

---

### R-E76.5-007: Feature Flag Must Exist

**Rule Text**: Feature flag DIAGNOSIS_PROMPT_ENABLED must exist

**Scope**:
- `lib/featureFlags.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptFeatureFlagExists()`

**Pass Condition**:
- Feature flags file defines DIAGNOSIS_PROMPT_ENABLED
- Feature flags file references NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "[DIAGNOSIS_PROMPT_FEATURE_FLAG_MISSING] violates R-E76.5-007: ..." (fail)

**Known Gaps**: Does not verify environment variable is set

**Owner**: E76.5

---

### R-E76.5-008: API Route Must Check Authorization

**Rule Text**: API route must check authorization (clinician/admin only)

**Scope**:
- `apps/rhythm-studio-ui/app/api/studio/diagnosis/prompt/route.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptAPIRouteExists()`

**Pass Condition**:
- API route code includes 'clinician' or 'admin' role checks
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "[DIAGNOSIS_PROMPT_NO_AUTHORIZATION] violates R-E76.5-008: API route does not check for clinician/admin role" (fail)

**Known Gaps**: Does not validate RLS policies or actual authorization logic

**Owner**: E76.5

---

### R-E76.5-009: Prompt Version Constants Must Be Defined

**Rule Text**: Prompt bundle version and prompt version constants must be defined

**Scope**:
- `lib/contracts/diagnosis-prompt.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptSchemaExists()`

**Pass Condition**:
- File exports DIAGNOSIS_PROMPT_BUNDLE_VERSION
- File exports DIAGNOSIS_PROMPT_VERSION
- File exports DIAGNOSIS_SCHEMA_VERSION
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "[DIAGNOSIS_PROMPT_VERSION_MISSING] violates R-E76.5-009: Schema missing version constant: {constant}" (fail)

**Known Gaps**: Does not validate version format (semver)

**Owner**: E76.5

---

### R-E76.5-010: Schema Must Include Validation Helpers

**Rule Text**: Schema must include validation helpers

**Scope**:
- `lib/contracts/diagnosis-prompt.ts`

**Enforced By**:
- Script: `scripts/ci/verify-e76-5-diagnosis-prompt.mjs`
- Function: `checkDiagnosisPromptSchemaExists()`

**Pass Condition**:
- File exports validateDiagnosisPromptOutputV1
- File includes hasValidDisclaimer helper
- File includes hasEmergentRedFlags helper
- File includes getHighestPriorityRecommendation helper
- File includes getMostConfidentDifferential helper
- Exit code 0

**Exceptions**: None

**Evidence Output**:
- Console: "[DIAGNOSIS_PROMPT_VALIDATION_HELPERS_MISSING] violates R-E76.5-010: Schema missing validation helper function: {function}" (fail)

**Known Gaps**: Does not test helper function logic

**Owner**: E76.5

---

## Summary

| Rule ID | Description | Check Script | Error Code | Status |
|---------|-------------|--------------|------------|--------|
| R-E76.5-001 | Schema file must exist | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_SCHEMA_MISSING | ✅ Enforced |
| R-E76.5-002 | Schema must include required fields | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_SCHEMA_INCOMPLETE | ✅ Enforced |
| R-E76.5-003 | Prompt must exist in registry | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_MISSING | ✅ Enforced |
| R-E76.5-004 | Prompt must include guardrails | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_NO_GUARDRAILS | ✅ Enforced |
| R-E76.5-005 | API route must exist | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_API_MISSING | ✅ Enforced |
| R-E76.5-006 | Literal callsite must exist | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_LITERAL_MISSING | ✅ Enforced |
| R-E76.5-007 | Feature flag must exist | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_FEATURE_FLAG_MISSING | ✅ Enforced |
| R-E76.5-008 | API must check authorization | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_NO_AUTHORIZATION | ✅ Enforced |
| R-E76.5-009 | Version constants must exist | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_VERSION_MISSING | ✅ Enforced |
| R-E76.5-010 | Validation helpers must exist | verify-e76-5-diagnosis-prompt.mjs | DIAGNOSIS_PROMPT_VALIDATION_HELPERS_MISSING | ✅ Enforced |

**Coverage**: 10/10 rules enforced (100%)  
**All checks reference their rule IDs**: ✅ Yes  
**All rules have check implementation**: ✅ Yes

---

## Known Gaps

1. **Field Type Validation**: Checks verify field presence but not Zod type definitions
2. **Prompt Template Syntax**: No validation of placeholder syntax or template structure
3. **Helper Function Logic**: Validation helpers are checked for presence but logic is not tested
4. **Authorization Logic**: Role checks are verified via text search, not actual execution
5. **Version Format**: Version constants are checked for existence but not semver compliance

---

## Diff Report

### Rules Without Checks
None - all rules have enforcement checks.

### Checks Without Rules
None - all checks map to documented rules.

### Scope Mismatch
None detected.

---

## Maintenance

**Update Frequency**: On any E76.5 requirement change  
**Verification**: Run `npm run verify:e76-5` to validate all rules  
**CI Integration**: Should be added to CI pipeline for automated enforcement

**Related Documentation**:
- E76.5 Issue Requirements
- lib/contracts/diagnosis-prompt.ts (Schema definition)
- lib/prompts/registry.ts (Prompt definition)
- scripts/ci/verify-e76-5-diagnosis-prompt.mjs (Enforcement script)
