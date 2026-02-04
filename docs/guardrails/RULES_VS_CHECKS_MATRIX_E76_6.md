# E76.6 — Rules vs Checks Matrix

## Overview

This document maps all guardrail rules defined for E76.6 (Studio UI: Diagnose Runs + Artifact Viewer) to their corresponding automated checks. Each rule must have at least one check, and each check must reference a rule ID.

### Terminology

- **Rule**: A requirement or constraint that must be satisfied
- **Check**: An automated verification that tests whether a rule is satisfied
- **Error Code**: A unique identifier for a specific violation type
- **Rule ID**: Format `R-E76.6-XXX` where XXX is a sequential number

## Rules and Their Checks

### R-E76.6-001: Feature Flag in featureFlags.ts
**Rule**: Feature flag DIAGNOSIS_PATIENT_ENABLED must exist in featureFlags.ts

**Check**: `checkFeatureFlagExists()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_PATIENT_FLAG_MISSING`
- **Verification**: Searches for 'DIAGNOSIS_PATIENT_ENABLED' in lib/featureFlags.ts
- **Coverage**: Presence check only (not type validation)

---

### R-E76.6-002: Feature Flag in env.ts Schema
**Rule**: Feature flag must exist in env.ts schema

**Check**: `checkFeatureFlagExists()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_PATIENT_ENV_MISSING`
- **Verification**: Searches for 'NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED' in lib/env.ts
- **Coverage**: Presence check only (not schema validation)

---

### R-E76.6-003: API Route for Diagnosis Runs
**Rule**: API route /api/patient/diagnosis/runs must exist

**Check**: `checkAPIRoutesExist()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_RUNS_API_MISSING`
- **Verification**: Checks file existence of `apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts`
- **Coverage**: File existence only (not implementation validation)

---

### R-E76.6-004: API Route for Diagnosis Artifacts
**Rule**: API route /api/patient/diagnosis/artifacts/[id] must exist

**Check**: `checkAPIRoutesExist()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_ARTIFACTS_API_MISSING`
- **Verification**: Checks file existence of `apps/rhythm-patient-ui/app/api/patient/diagnosis/artifacts/[id]/route.ts`
- **Coverage**: File existence only (not implementation validation)

---

### R-E76.6-005: API Routes Must Check Feature Flag
**Rule**: API routes must check feature flag DIAGNOSIS_PATIENT_ENABLED

**Check**: `checkAPIRoutesHaveFeatureGates()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_API_NO_FEATURE_GATE`
- **Verification**: Searches for 'DIAGNOSIS_PATIENT_ENABLED' in both API route files
- **Coverage**: Text search only (not runtime behavior)

---

### R-E76.6-006: API Routes Must Check Authentication
**Rule**: API routes must check authentication

**Check**: `checkAPIRoutesHaveAuth()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_API_NO_AUTH`
- **Verification**: Searches for 'auth.getUser()' or 'getUser()' in API route files
- **Coverage**: Text search only (not runtime behavior)

---

### R-E76.6-007: Literal Callsites Exist (Strategy A)
**Rule**: At least one literal callsite must exist for each endpoint

**Check**: `checkLiteralCallsitesExist()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_LITERAL_MISSING`
- **Verification**: Searches for '/api/patient/diagnosis/runs' in client component files
- **Coverage**: Presence of literal string in source code

---

### R-E76.6-008: RLS Policy for diagnosis_runs
**Rule**: RLS policy must allow patients to read their own diagnosis_runs

**Check**: `checkRLSPoliciesExist()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_RLS_RUNS_MISSING`
- **Verification**: Searches for 'diagnosis_runs_patient_read' in migration file
- **Coverage**: Presence check only (not policy logic validation)

---

### R-E76.6-009: RLS Policy for diagnosis_artifacts
**Rule**: RLS policy must allow patients to read their own diagnosis_artifacts

**Check**: `checkRLSPoliciesExist()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_RLS_ARTIFACTS_MISSING`
- **Verification**: Searches for 'diagnosis_artifacts_patient_read' in migration file
- **Coverage**: Presence check only (not policy logic validation)

---

### R-E76.6-010: Patient UI Pages Exist
**Rule**: Patient UI pages must exist (list and detail views)

**Check**: `checkUIPagesExist()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_UI_PAGES_MISSING`
- **Verification**: Checks file existence of list and detail page components
- **Coverage**: File existence only (not rendering validation)

---

### R-E76.6-011: Patient UI Must Be Feature-Gated
**Rule**: Patient UI must be feature-gated

**Check**: `checkUIFeatureGates()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_UI_NO_FEATURE_GATE`
- **Verification**: Searches for 'DIAGNOSIS_PATIENT_ENABLED' in page files
- **Coverage**: Text search only (not runtime behavior)

---

### R-E76.6-012: UI Components Must Handle States
**Rule**: UI components must handle loading/empty/error states

**Check**: `checkUIStateHandling()`
- **Location**: `scripts/ci/verify-e76-6-diagnosis-ui.mjs`
- **Error Code**: `DIAGNOSIS_UI_NO_STATE_HANDLING`
- **Verification**: Searches for 'loading', 'error', and 'empty' in client components
- **Coverage**: Keyword presence only (not UX validation)

---

## Summary Table

| Rule ID | Error Code | Check Function | Status |
|---------|-----------|----------------|--------|
| R-E76.6-001 | DIAGNOSIS_PATIENT_FLAG_MISSING | checkFeatureFlagExists | ✅ Implemented |
| R-E76.6-002 | DIAGNOSIS_PATIENT_ENV_MISSING | checkFeatureFlagExists | ✅ Implemented |
| R-E76.6-003 | DIAGNOSIS_RUNS_API_MISSING | checkAPIRoutesExist | ✅ Implemented |
| R-E76.6-004 | DIAGNOSIS_ARTIFACTS_API_MISSING | checkAPIRoutesExist | ✅ Implemented |
| R-E76.6-005 | DIAGNOSIS_API_NO_FEATURE_GATE | checkAPIRoutesHaveFeatureGates | ✅ Implemented |
| R-E76.6-006 | DIAGNOSIS_API_NO_AUTH | checkAPIRoutesHaveAuth | ✅ Implemented |
| R-E76.6-007 | DIAGNOSIS_LITERAL_MISSING | checkLiteralCallsitesExist | ✅ Implemented |
| R-E76.6-008 | DIAGNOSIS_RLS_RUNS_MISSING | checkRLSPoliciesExist | ✅ Implemented |
| R-E76.6-009 | DIAGNOSIS_RLS_ARTIFACTS_MISSING | checkRLSPoliciesExist | ✅ Implemented |
| R-E76.6-010 | DIAGNOSIS_UI_PAGES_MISSING | checkUIPagesExist | ✅ Implemented |
| R-E76.6-011 | DIAGNOSIS_UI_NO_FEATURE_GATE | checkUIFeatureGates | ✅ Implemented |
| R-E76.6-012 | DIAGNOSIS_UI_NO_STATE_HANDLING | checkUIStateHandling | ✅ Implemented |

**Coverage**: 12/12 rules enforced (100%)

## Known Gaps

### 1. Type Validation
**Gap**: Feature flag type checking is not validated  
**Impact**: Low - TypeScript compiler will catch type mismatches  
**Mitigation**: Rely on TypeScript compilation for type safety

### 2. Runtime Behavior
**Gap**: API route logic is not executed/tested by checks  
**Impact**: Medium - Could miss implementation bugs  
**Mitigation**: Manual testing and integration tests required

### 3. RLS Policy Logic
**Gap**: RLS policy SQL logic is not validated  
**Impact**: Medium - Could allow incorrect access  
**Mitigation**: Database migration review process

### 4. UI Rendering
**Gap**: UI components are not rendered/tested  
**Impact**: Medium - Could miss visual or UX bugs  
**Mitigation**: Manual UI testing and Playwright E2E tests

### 5. State Handling Logic
**Gap**: State handling implementation quality not verified  
**Impact**: Low - Presence check only ensures states exist  
**Mitigation**: Code review and manual testing

## Diff Report

### Rules Without Checks
**Count**: 0  
**List**: None - All rules have checks

### Checks Without Rules
**Count**: 0  
**List**: None - All checks reference a rule

### Scope Mismatches
**Count**: 0  
**List**: None - All checks properly scope to their rules

## Verification Command

```bash
npm run verify:e76-6
```

## Exit Codes

- **0**: All guardrails satisfied
- **1**: One or more violations detected
- **2**: Script execution error

## Violation Output Format

When a violation is detected, the output includes:

```
❌ violates R-E76.6-XXX
   Error: ERROR_CODE
   Rule: [rule description]
   Details: [specific violation details]
```

This format enables quick diagnosis and resolution of guardrail violations.

## Maintenance

This document must be updated whenever:
1. New rules are added to E76.6 requirements
2. New checks are added to the verification script
3. Error codes are added or modified
4. Check implementations are changed

**Last Updated**: 2026-02-04  
**Document Version**: 1.0.0
