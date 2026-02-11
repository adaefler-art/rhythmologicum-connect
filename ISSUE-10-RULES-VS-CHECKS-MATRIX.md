# Issue 10 Rules vs. Checks Matrix

**Issue:** Issue 10 — Clinical Intake Synthesis (CRE-konform)  
**Purpose:** Generate structured clinical intake from patient conversations  
**Status:** ✅ Complete  
**Last Updated:** 2026-02-11

---

## Overview

This document provides complete bidirectional traceability between:
- **Rules:** Requirements for clinical intake generation and quality
- **Checks:** Verification mechanisms that validate the rules

**Guardrail Principle:** Every rule must have a check, and every check must reference a rule.

---

## Matrix Summary

| Category | Rules | Checks | Coverage |
|----------|-------|--------|----------|
| **Clinical Summary Quality** | 3 | 3 | 100% |
| **Structured Data Quality** | 2 | 2 | 100% |
| **Content Standards** | 1 | 1 | 100% |
| **Safety Documentation** | 2 | 2 | 100% |
| **TOTAL** | **8** | **8** | **100%** |

---

## Rules → Checks

### Clinical Summary Quality

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I10-1.1 | Clinical summary must not contain colloquial language (no "super", "okay", "klar", etc.) | Function | `lib/clinicalIntake/validation.ts::checkNoColloquialLanguage` | ✅ |
| R-I10-1.2 | Clinical summary must use medical terminology and be sufficiently detailed (min 50 chars) | Function | `lib/clinicalIntake/validation.ts::checkMedicalTerminology` | ✅ |
| R-I10-1.3 | Clinical summary must be physician-readable narrative, not bullet points | Manual Review | Code review process | ✅ |

### Structured Data Quality

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I10-2.1 | STRUCTURED_INTAKE must contain data in at least one key field (chief_complaint, HPI, etc.) | Function | `lib/clinicalIntake/validation.ts::checkRequiredFields` | ✅ |
| R-I10-2.2 | All array fields in STRUCTURED_INTAKE must contain valid string arrays | Function | `lib/clinicalIntake/validation.ts::checkArrayValidity` | ✅ |

### Content Standards

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I10-3.1 | Clinical summary must not contain chat-like language ("Patient sagt", "laut Chat", etc.) | Function | `lib/clinicalIntake/validation.ts::checkNoChatLanguage` | ✅ |

### Safety Documentation

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I10-4.1 | Red flags must be documented clearly and specifically (min 10 chars per flag) | Function | `lib/clinicalIntake/validation.ts::checkRedFlagDocumentation` | ✅ |
| R-I10-4.2 | Uncertainties must be explicitly stated when present | Function | `lib/clinicalIntake/validation.ts::checkUncertaintyExplicit` | ✅ |

---

## Checks → Rules

### Function: checkNoColloquialLanguage

| Check ID | Check Description | Rule(s) Verified | Status |
|----------|-------------------|------------------|--------|
| R-I10-1.1 | Tests for colloquial words/phrases in clinical summary | R-I10-1.1 | ✅ |

### Function: checkMedicalTerminology

| Check ID | Check Description | Rule(s) Verified | Status |
|----------|-------------------|------------------|--------|
| R-I10-1.2 | Validates clinical summary length and content quality | R-I10-1.2 | ✅ |

### Function: checkRequiredFields

| Check ID | Check Description | Rule(s) Verified | Status |
|----------|-------------------|------------------|--------|
| R-I10-2.1 | Ensures structured intake has content in key fields | R-I10-2.1 | ✅ |

### Function: checkArrayValidity

| Check ID | Check Description | Rule(s) Verified | Status |
|----------|-------------------|------------------|--------|
| R-I10-2.2 | Validates all array fields contain valid string data | R-I10-2.2 | ✅ |

### Function: checkNoChatLanguage

| Check ID | Check Description | Rule(s) Verified | Status |
|----------|-------------------|------------------|--------|
| R-I10-3.1 | Detects chat-like references in clinical summary | R-I10-3.1 | ✅ |

### Function: checkRedFlagDocumentation

| Check ID | Check Description | Rule(s) Verified | Status |
|----------|-------------------|------------------|--------|
| R-I10-4.1 | Validates red flags are properly documented | R-I10-4.1 | ✅ |

### Function: checkUncertaintyExplicit

| Check ID | Check Description | Rule(s) Verified | Status |
|----------|-------------------|------------------|--------|
| R-I10-4.2 | Checks uncertainties are explicitly stated | R-I10-4.2 | ✅ |

---

## Out of Scope

The following are **intentionally NOT checked** programmatically:

| Category | Examples | Reason |
|----------|----------|--------|
| Medical accuracy | Correct symptom interpretation | Requires physician review |
| Clinical judgment | Appropriate risk assessment | Requires medical expertise |
| Narrative quality | Writing style, coherence | Subjective, requires human review (R-I10-1.3) |
| Completeness | All relevant info captured | Depends on conversation content |

---

## CI/CD Integration

### Automated Checks

All programmatic checks (R-I10-1.1, R-I10-1.2, R-I10-2.1, R-I10-2.2, R-I10-3.1, R-I10-4.1, R-I10-4.2) are:
- Executed on every intake generation via `validateIntakeQuality()`
- Results logged for audit trail
- Quality report returned with each generation

### Manual Review

Rule R-I10-1.3 (narrative quality) requires:
- Code review during PR process
- Periodic audit of generated intakes
- Physician feedback loop for quality improvement

---

## Validation Report Structure

```typescript
{
  isValid: boolean,
  checks: [
    {
      rule: "R-I10-1.1",
      passed: true,
      message: "No colloquial language detected",
      severity: "error"
    },
    // ... more checks
  ],
  errors: [],    // Failed checks with severity "error"
  warnings: []   // Failed checks with severity "warning"
}
```

---

## Drift Detection

**Zero Drift Policy:**
- Every rule in this document must have at least one check
- Every check must reference at least one rule
- Any new rule requires a new check (or justification if not checkable)
- Any new check must reference a rule

**Verification:**
- Manual review during PR process
- Document updates required for new rules/checks
- Matrix must be updated with implementation

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-11 | Initial matrix for Issue 10 | Copilot |

---

## Notes

- All validation checks are implemented in `lib/clinicalIntake/validation.ts`
- Quality validation runs automatically on every intake generation
- Failed checks do not block intake creation (warnings only)
- Errors are logged for audit and quality improvement
- Future enhancement: Add CI script to run validation on test data
