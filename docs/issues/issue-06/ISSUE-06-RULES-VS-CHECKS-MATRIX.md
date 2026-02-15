# Issue 6 Rules vs. Checks Matrix

**Issue:** Issue 6 — Parametrizable Uncertainty & Probability Handling  
**Purpose:** Explicit control over uncertainty expression in medical AI consultations  
**Status:** ✅ Complete  
**Last Updated:** 2026-02-09

---

## Overview

This document provides complete bidirectional traceability between:
- **Rules:** Requirements for parametrizable uncertainty and probability communication
- **Checks:** Verification mechanisms that validate the rules

**Guardrail Principle:** Every rule must have a check, and every check must reference a rule.

---

## Matrix Summary

| Category | Rules | Checks | Coverage |
|----------|-------|--------|----------|
| **Configuration Defaults** | 3 | 3 | 100% |
| **Parameter Effects** | 6 | 6 | 100% |
| **Audience Rules** | 2 | 2 | 100% |
| **Helper Functions** | 4 | 4 | 100% |
| **Validation** | 4 | 4 | 100% |
| **Integration** | 3 | 3 | 100% |
| **TOTAL** | **22** | **22** | **100%** |

---

## Rules → Checks

### Configuration Defaults

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I6-01 | Patient mode defaults: qualitative, conservative, patient audience | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-02 | Clinician mode defaults: qualitative/mixed, balanced, clinician audience | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-03 | System defaults to patient-safe parameters | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |

### Parameter Effects

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I6-04 | Off profile: no explicit uncertainty (except red flags) | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-05 | Qualitative profile: only language markers, no numbers | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-06 | Mixed profile: numbers only in clinician mode | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-07 | Conservative assertiveness: emphasizes preliminary nature | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-08 | Balanced assertiveness: neutral medical tone | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-09 | Direct assertiveness: clear but no diagnosis | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |

### Audience Rules

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I6-10 | Patient audience: no numbers, no jargon, no diagnosis terms | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-11 | Clinician audience: detail allowed, but NO definitive diagnosis | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |

### Helper Functions

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I6-12 | Parameter combination validation helper exists | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-13 | Default parameters by audience helper exists | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-14 | Number allowance check helper exists | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-15 | Header formatting helper exists | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |

### Validation

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I6-16 | Validation checks all three parameters present in header | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-17 | Validation detects numerical probabilities in patient mode | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-18 | Validation checks language consistency with parameters | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-19 | Validation imports uncertainty parameter utilities | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |

### Integration

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I6-20 | LLM prompts accept and document all three parameters | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-21 | API routes use safe default parameters | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |
| R-I6-22 | Type system defines all parameter types | Script | `scripts/ci/verify-issue-6-uncertainty.mjs` | ✅ |

---

## Checks → Rules

### Script: verify-issue-6-uncertainty.mjs

| Check ID | Check Description | Rule(s) Verified | Status |
|----------|-------------------|------------------|--------|
| R-I6-01.1 | Patient mode uses qualitative profile | R-I6-01 | ✅ |
| R-I6-01.2 | Patient mode uses conservative assertiveness | R-I6-01 | ✅ |
| R-I6-01.3 | Patient mode targets patient audience | R-I6-01 | ✅ |
| R-I6-02.1 | Clinician mode targets clinician audience | R-I6-02 | ✅ |
| R-I6-03 | System defaults to patient-safe parameters | R-I6-03 | ✅ |
| R-I6-04 | Uncertainty off profile rules defined | R-I6-04 | ✅ |
| R-I6-05.1 | Qualitative markers defined | R-I6-05 | ✅ |
| R-I6-05.2 | Prohibited patterns include percentages | R-I6-05 | ✅ |
| R-I6-06.1 | Mixed mode rules defined | R-I6-06 | ✅ |
| R-I6-06.2 | Mixed mode forbids numbers in patient mode | R-I6-06 | ✅ |
| R-I6-07 | Conservative assertiveness markers defined | R-I6-07 | ✅ |
| R-I6-08 | Balanced assertiveness markers defined | R-I6-08 | ✅ |
| R-I6-09 | Direct assertiveness markers defined | R-I6-09 | ✅ |
| R-I6-10.1 | Patient audience rules defined | R-I6-10 | ✅ |
| R-I6-10.2 | Patient audience forbids numbers | R-I6-10 | ✅ |
| R-I6-11.1 | Clinician audience rules defined | R-I6-11 | ✅ |
| R-I6-11.2 | Clinician still forbids definitive diagnosis | R-I6-11 | ✅ |
| R-I6-12 | Parameter validation helper exists | R-I6-12 | ✅ |
| R-I6-13 | Default parameters helper exists | R-I6-13 | ✅ |
| R-I6-14 | Number allowance check exists | R-I6-14 | ✅ |
| R-I6-15 | Header formatting helper exists | R-I6-15 | ✅ |
| R-I6-16.1 | Uncertainty parameter validation function exists | R-I6-16 | ✅ |
| R-I6-16.2 | Validation checks uncertainty profile presence | R-I6-16 | ✅ |
| R-I6-16.3 | Validation checks assertiveness presence | R-I6-16 | ✅ |
| R-I6-16.4 | Validation checks audience presence | R-I6-16 | ✅ |
| R-I6-17.1 | Numerical probability validation exists | R-I6-17 | ✅ |
| R-I6-17.2 | Validation detects numerical probabilities | R-I6-17 | ✅ |
| R-I6-18.1 | Language consistency validation exists | R-I6-18 | ✅ |
| R-I6-18.2 | Validation checks language consistency | R-I6-18 | ✅ |
| R-I6-19 | Validation imports uncertainty utilities | R-I6-19 | ✅ |
| R-I6-20.1 | Prompt accepts uncertaintyProfile parameter | R-I6-20 | ✅ |
| R-I6-20.2 | Prompt accepts assertiveness parameter | R-I6-20 | ✅ |
| R-I6-20.3 | Prompt accepts audience parameter | R-I6-20 | ✅ |
| R-I6-20.4 | Prompt generates uncertainty instructions | R-I6-20 | ✅ |
| R-I6-20.5 | Prompt includes uncertainty profile in header | R-I6-20 | ✅ |
| R-I6-20.6 | Prompt includes assertiveness in header | R-I6-20 | ✅ |
| R-I6-20.7 | Prompt includes audience in header | R-I6-20 | ✅ |
| R-I6-21.1 | API defaults to qualitative profile | R-I6-21 | ✅ |
| R-I6-21.2 | API defaults to conservative assertiveness | R-I6-21 | ✅ |
| R-I6-21.3 | API defaults to patient audience | R-I6-21 | ✅ |
| R-I6-21.4 | API passes parameters to prompt | R-I6-21 | ✅ |
| R-I6-22.1 | UncertaintyProfile type defined | R-I6-22 | ✅ |
| R-I6-22.2 | AssertivenessLevel type defined | R-I6-22 | ✅ |
| R-I6-22.3 | AudienceType type defined | R-I6-22 | ✅ |
| R-I6-22.4 | Header includes uncertaintyProfile | R-I6-22 | ✅ |
| R-I6-22.5 | Header includes assertiveness | R-I6-22 | ✅ |
| R-I6-22.6 | Header includes audience | R-I6-22 | ✅ |

---

## Acceptance Criteria Mapping

| Acceptance Criterion | Rules Enforcing | Checks Verifying | Status |
|---------------------|-----------------|------------------|--------|
| Every consult note contains active uncertainty parameters | R-I6-16, R-I6-20 | R-I6-16.1-4, R-I6-20.1-7 | ✅ |
| Patient and clinician outputs differ visibly | R-I6-01, R-I6-02, R-I6-10, R-I6-11 | R-I6-01.1-3, R-I6-02.1, R-I6-10.1-2, R-I6-11.1-2 | ✅ |
| No numbers appear in patient mode | R-I6-10, R-I6-17 | R-I6-10.2, R-I6-17.1-2 | ✅ |
| Language is consistent over consultation | R-I6-18 | R-I6-18.1-2 | ✅ |
| Behavior is explainable through parameters | R-I6-04-15 | R-I6-04-15 | ✅ |

---

## Out of Scope (Explicitly Excluded)

The following are **intentionally NOT implemented** as per MUST NOT requirements:

| Category | Examples | Reason |
|----------|----------|--------|
| Admin UI | UI for changing parameters | Issue requirement: no admin UI |
| Live changes | Updating parameters during consultation | Issue requirement: static parameters per consultation |
| Automatic derivation | AI determining parameters | Issue requirement: explicit parameter setting |
| Patient mode numbers | Numerical probabilities in mixed mode for patients | Issue requirement: no numbers in patient mode |
| Diagnoses | Definitive diagnosis through parameters | Core medical safety requirement |

---

## Implementation Files

### Core Configuration
- `lib/config/uncertaintyParameters.ts` - Central configuration, all rules R-I6-01 to R-I6-15

### Validation
- `lib/validation/consultNote.ts` - Validation enforcement, rules R-I6-16 to R-I6-19

### Integration Points
- `lib/llm/prompts.ts` - LLM prompt generation, rule R-I6-20
- `apps/rhythm-studio-ui/app/api/clinician/consult-notes/generate/route.ts` - API defaults, rule R-I6-21
- `lib/types/consultNote.ts` - Type definitions, rule R-I6-22

### Verification
- `scripts/ci/verify-issue-6-uncertainty.mjs` - Automated check script, all rules

---

## Running Checks

```bash
# Run Issue 6 uncertainty parameter checks
npm run verify:issue-6

# Or directly
node scripts/ci/verify-issue-6-uncertainty.mjs
```

Expected output when all checks pass:
```
=== Issue 6: Uncertainty Parameters Check ===
✓ All Issue 6 uncertainty parameter checks passed
```

---

## Diff Report

### Rules without Checks: **0**
All 22 rules have corresponding checks.

### Checks without Rules: **0**
All checks reference specific rules.

### Scope Mismatches: **0**
All checks verify the exact scope defined in their rules.

---

## Maintenance

When adding new uncertainty-related features:

1. **Add Rule:** Define in `lib/config/uncertaintyParameters.ts` with R-I6-XX ID
2. **Add Check:** Update `scripts/ci/verify-issue-6-uncertainty.mjs`
3. **Update Matrix:** Add to this document
4. **Verify:** Run `npm run verify:issue-6`

---

## Related Documentation

- `ISSUE-06-IMPLEMENTATION-SUMMARY.md` - Implementation details
- `ISSUE-06-TESTING-GUIDE.md` - Testing procedures
- `lib/config/uncertaintyParameters.ts` - Inline rule documentation
- `lib/validation/consultNote.ts` - Validation rule comments
