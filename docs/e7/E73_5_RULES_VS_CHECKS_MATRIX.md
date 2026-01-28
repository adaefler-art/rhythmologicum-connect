# E73.5 Rules vs Checks Matrix

## Overview

This document maps the guardrail rules for E73.5 to their corresponding checks and vice versa.

## Rules → Checks Mapping

### Rule R1: Endpoint Wiring
**Rule**: Every new or modified API endpoint must have at least one literal in-repo callsite.

**Check**: Endpoint Catalog Scanner (`scripts/dev/endpoint-catalog/generate.js`)
- Scans all git-tracked files for fetch() calls with literal string URLs
- Detects pattern: `fetch('/api/...')` or `fetch(\`/api/...\`)`
- Generates orphan endpoint report

**Evidence**:
- `/api/patient/assessments-with-results` detected with 2 callsites
- Patient UI callsite: `PatientHistoryClient.tsx:88`
- Studio UI callsite: `page.tsx:351`
- Not in orphan list ✅

### Rule R2: SSOT Visibility
**Rule**: Only completed assessments with calculated_results should be visible.

**Check**: Database Query Constraint (INNER JOIN)
- SQL query uses `INNER JOIN calculated_results` on assessments
- Ensures only assessments with results are returned
- Filter: `status = 'completed'`

**Evidence**:
```typescript
// Both endpoints use same query pattern
.from('assessments')
.select('..., calculated_results!inner (...)')
.eq('status', 'completed')
```

### Rule R3: No Legacy Dependencies
**Rule**: New assessments should not use legacy patient_measures table.

**Check**: Code Review + Manual Verification
- New endpoint queries only `assessments` + `calculated_results`
- Legacy fetching kept for backward compatibility only
- Clear separation in UI (new section vs legacy section)

**Evidence**:
- Patient History: New assessments from SSOT, legacy measures separate
- Clinician View: Two distinct sections labeled appropriately

### Rule R4: Consistent Data Format
**Rule**: Patient and Clinician views must show same data.

**Check**: Type System + Shared Contract
- Both endpoints return same response structure
- TypeScript types ensure consistency
- Same transformation logic in both endpoints

**Evidence**:
```typescript
// Shared response structure
{
  success: true,
  data: {
    assessments: [{ id, funnelSlug, status, result: {...} }],
    count: number
  }
}
```

## Checks → Rules Mapping

### Check C1: Endpoint Catalog Scanner
**What it checks**: Detects orphan endpoints (no literal callsites)

**Rules enforced**:
- R1: Endpoint Wiring

**Scope**: All API routes in `apps/*/app/api/**/*.ts`

### Check C2: Database INNER JOIN
**What it checks**: Only assessments with results are retrieved

**Rules enforced**:
- R2: SSOT Visibility

**Scope**: Both SSOT endpoints

### Check C3: TypeScript Compiler
**What it checks**: Type safety and contract consistency

**Rules enforced**:
- R4: Consistent Data Format

**Scope**: All TypeScript files

### Check C4: Code Review
**What it checks**: Manual verification of architectural patterns

**Rules enforced**:
- R3: No Legacy Dependencies
- R1: Endpoint Wiring (backup verification)

**Scope**: All changed files in PR

## Matrix Summary

| Rule | Check(s) | Auto/Manual | Status |
|------|----------|-------------|--------|
| R1: Endpoint Wiring | C1: Endpoint Catalog, C4: Code Review | Auto | ✅ Pass |
| R2: SSOT Visibility | C2: Database INNER JOIN | Auto | ✅ Pass |
| R3: No Legacy Deps | C4: Code Review | Manual | ✅ Pass |
| R4: Consistent Format | C3: TypeScript Compiler, C4: Code Review | Auto/Manual | ✅ Pass |

| Check | Rule(s) | Coverage | Status |
|-------|---------|----------|--------|
| C1: Endpoint Catalog | R1 | All API routes | ✅ 2/2 endpoints wired |
| C2: INNER JOIN | R2 | SSOT queries | ✅ Both endpoints |
| C3: TypeScript | R4 | All TS files | ✅ Compiles |
| C4: Code Review | R1, R3, R4 | All changes | ✅ Verified |

## Gaps Analysis

### Rules without Automated Checks
- **R3: No Legacy Dependencies** - Requires manual code review
  - Potential: Add static analysis to detect patient_measures usage in new code
  - Impact: Low (pattern is obvious in review)

### Checks without Specific Rules
- None identified

### Scope Mismatches
- None identified

## Recommendations

### Immediate (PR Merge)
1. ✅ Run endpoint catalog generator
2. ✅ Verify TypeScript compilation
3. ✅ Manual code review for legacy dependencies
4. ✅ Document in implementation summary

### Short-term (Next Sprint)
1. Add integration test for SSOT visibility rules
2. Add test for endpoint wiring detection
3. Consider automated check for legacy table usage

### Long-term (Future)
1. Deprecate patient_measures table completely
2. Add real-time monitoring for SSOT usage
3. Create automated migration tools

## Evidence Artifacts

### Generated Files
1. `docs/api/ENDPOINT_CATALOG.md` - Shows 2 callsites per endpoint
2. `docs/api/ORPHAN_ENDPOINTS.md` - Does not include our endpoints
3. `docs/api/endpoint-catalog.json` - Machine-readable catalog

### Source Files
1. `apps/rhythm-patient-ui/app/api/patient/assessments-with-results/route.ts`
2. `apps/rhythm-studio-ui/app/api/patient/assessments-with-results/route.ts`
3. `apps/rhythm-patient-ui/app/patient/(mobile)/history/PatientHistoryClient.tsx`
4. `apps/rhythm-studio-ui/app/clinician/patient/[id]/page.tsx`

### Documentation
1. `docs/e7/E73_5_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
2. This file - Rules vs Checks mapping

## Diff Report

### Rules without Check
- None ✅

### Checks without Rule
- None ✅

### Scope Mismatch
- None ✅

All rules have corresponding checks, and all checks enforce specific rules. No orphan rules or checks detected.

---

**Matrix Status**: ✅ **COMPLETE**  
**Last Updated**: 2026-01-28  
**Issue**: E73.5
