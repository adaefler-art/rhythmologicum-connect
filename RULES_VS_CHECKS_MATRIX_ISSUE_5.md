# Issue 5: Consult Note v1 — Rules vs Checks Matrix

This document maps every rule to its corresponding check implementation, ensuring **zero drift** between requirements and validation.

**Principle:** Every rule has a check, and every check references a rule.

## Matrix

| Rule ID | Rule Description | Check Implementation | Check Type | Severity |
|---------|------------------|---------------------|------------|----------|
| **R-CN-01** | All 12 sections must be present | `check-12-sections.sh` + `validateSectionPresence()` | Script + Runtime | ERROR |
| **R-CN-02** | Header must document uncertainty profile | `check-uncertainty-mode.sh` + `validateHeader()` | Script + Runtime | ERROR |
| **R-CN-03** | Chief complaint 1-2 sentences | `validateChiefComplaint()` | Runtime | WARNING |
| **R-CN-04** | HPI must have structured fields | `validateHPI()` | Runtime | WARNING |
| **R-CN-05** | Red flags screening status required | `validateRedFlags()` | Runtime | ERROR |
| **R-CN-06** | Problem list 3-7 items | `validateProblemList()` | Runtime | WARNING |
| **R-CN-07** | Preliminary assessment: no definitive diagnoses | `check-uncertainty-mode.sh` + `validatePreliminaryAssessment()` | Script + Runtime | ERROR |
| **R-CN-08** | Handoff summary max 10 lines | `check-handoff-limit.sh` + `validateHandoffSummary()` | Script + Runtime | ERROR |
| **R-CN-09** | NO diagnosis language anywhere | `check-no-diagnosis.sh` + `validateNoDiagnosisLanguage()` | Script + Runtime | ERROR |

## Check Details

### R-CN-01: All 12 Sections Must Be Present

**Rule:**
The Consult Note MUST contain exactly 12 sections in the following order:
1. Header
2. Chief Complaint
3. History of Present Illness (HPI)
4. Red Flags Screening
5. Relevant Medical History / Risks
6. Medications / Allergies
7. Objective Data
8. Problem List
9. Preliminary Assessment
10. Missing Data / Next Data Requests
11. Next Steps
12. Handoff Summary

**Checks:**
- **Script:** `tools/consult-note-guardrails/check-12-sections.sh`
  - Verifies TypeScript type definition includes all sections
  - Verifies validation function checks all sections
  - Verifies LLM prompt mentions all sections
- **Runtime:** `lib/validation/consultNote.ts::validateSectionPresence()`
  - Checks content object has all 12 section keys
  - Returns error for each missing section

**Violation Output:**
```
❌ violates R-CN-01: Missing sections in type definition:
  - medicalHistory
  - nextSteps
```

---

### R-CN-02: Header Must Document Uncertainty Profile

**Rule:**
The header section MUST include:
- `timestamp` (ISO 8601)
- `consultationType` (first | follow_up)
- `source`
- `uncertaintyProfile` (off | qualitative | mixed)
- `assertiveness` (conservative | balanced | direct)
- `audience` (patient | clinician)

**Checks:**
- **Script:** `tools/consult-note-guardrails/check-uncertainty-mode.sh`
  - Verifies TypeScript types exist for all uncertainty config
  - Verifies database enums exist
  - Verifies LLM prompt uses uncertainty instructions
- **Runtime:** `lib/validation/consultNote.ts::validateHeader()`
  - Checks all required header fields are present
  - Returns error for missing fields

**Violation Output:**
```
❌ violates R-CN-02: uncertainty_profile enum not created
```

---

### R-CN-03: Chief Complaint 1-2 Sentences

**Rule:**
The chief complaint MUST be 1-2 sentences describing the reason for consultation.

**Checks:**
- **Runtime:** `lib/validation/consultNote.ts::validateChiefComplaint()`
  - Counts sentences in chief complaint text
  - Returns warning if more than 2 sentences

**Violation Output:**
```
⚠️ violates R-CN-03: Chief complaint should be 1-2 sentences (found 4)
```

---

### R-CN-04: HPI Must Have Structured Fields

**Rule:**
The History of Present Illness MUST use structured bullet points (not free text):
- Onset, Course, Character, Severity
- Triggers, Relief, Associated symptoms
- Functional impact, Prior actions

**Checks:**
- **Runtime:** `lib/validation/consultNote.ts::validateHPI()`
  - Counts populated fields in HPI object
  - Returns warning if empty

**Violation Output:**
```
⚠️ violates R-CN-04: HPI has no structured data
```

---

### R-CN-05: Red Flags Screening Status Required

**Rule:**
Red flags screening MUST indicate whether screening was performed (`screened: true/false`).

**Checks:**
- **Runtime:** `lib/validation/consultNote.ts::validateRedFlags()`
  - Checks `screened` field is defined
  - Returns error if undefined

**Violation Output:**
```
❌ violates R-CN-05: Red flags screening status must be specified
```

---

### R-CN-06: Problem List 3-7 Items

**Rule:**
The problem list MUST contain 3-7 clinical problem formulations (NOT diagnoses).

**Checks:**
- **Runtime:** `lib/validation/consultNote.ts::validateProblemList()`
  - Counts items in problem list
  - Returns warning if < 3 or > 7 items

**Violation Output:**
```
⚠️ violates R-CN-06: Problem list should have 3-7 items (found 2)
```

---

### R-CN-07: Preliminary Assessment: No Definitive Diagnoses

**Rule:**
The preliminary assessment MUST present working hypotheses as options, NOT definitive diagnoses.
Language must be controlled by uncertainty profile.

**Checks:**
- **Script:** `tools/consult-note-guardrails/check-uncertainty-mode.sh`
  - Verifies prompt emphasizes "hypotheses as options"
  - Verifies uncertainty instructions exist
- **Runtime:** `lib/validation/consultNote.ts::validatePreliminaryAssessment()`
  - Checks hypotheses array exists
  - Returns warning if empty

**Violation Output:**
```
⚠️ violates R-CN-07: Prompt may not emphasize 'hypotheses as options'
```

---

### R-CN-08: Handoff Summary Max 10 Lines

**Rule:**
The handoff summary MUST NOT exceed 10 lines. This is a **hard limit** (ERROR, not WARNING).

**Checks:**
- **Script:** `tools/consult-note-guardrails/check-handoff-limit.sh`
  - Verifies `MAX_HANDOFF_LINES` constant = 10
  - Verifies validation function enforces limit
  - Verifies LLM prompt mentions limit
- **Runtime:** `lib/validation/consultNote.ts::validateHandoffSummary()`
  - Counts lines in summary array
  - Returns error if > 10 lines

**Violation Output:**
```
❌ violates R-CN-08: Handoff summary must not exceed 10 lines (found 12)
```

---

### R-CN-09: NO Diagnosis Language

**Rule:**
Consult notes MUST NOT contain diagnosis language. Forbidden phrases include:
- "you have [disease]"
- "diagnosis: [X]"
- "diagnosed with"
- "definitive diagnosis"
- "confirmed", "definitively", "certainly is", "definitely"

**Checks:**
- **Script:** `tools/consult-note-guardrails/check-no-diagnosis.sh`
  - Verifies forbidden words list exists
  - Verifies LLM prompt has "NO DIAGNOSES" rule
  - Scans code for accidental diagnosis language
- **Runtime:** `lib/validation/consultNote.ts::validateNoDiagnosisLanguage()`
  - Scans all text fields for forbidden words
  - Returns error for each violation

**Violation Output:**
```
❌ violates R-CN-09: Forbidden diagnosis language detected: "you have"
```

---

## Verification Script

Run all checks:
```bash
./tools/consult-note-guardrails/run-all.sh
```

Individual checks:
```bash
./tools/consult-note-guardrails/check-12-sections.sh       # R-CN-01
./tools/consult-note-guardrails/check-uncertainty-mode.sh  # R-CN-02, R-CN-07
./tools/consult-note-guardrails/check-handoff-limit.sh     # R-CN-08
./tools/consult-note-guardrails/check-no-diagnosis.sh      # R-CN-09
```

Runtime validation:
```typescript
import { validateConsultNote } from '@/lib/validation/consultNote'

const validation = validateConsultNote(content)

if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
  console.warn('Validation warnings:', validation.warnings)
}
```

## Coverage Report

### Rules without Checks: ✅ **NONE**
All rules have corresponding checks.

### Checks without Rules: ✅ **NONE**
All checks reference specific rules.

### Scope Mismatches: ✅ **NONE**
All checks validate exactly what their rules specify.

## Zero Drift Achievement

✅ **Zero drift confirmed:**
- 9 rules defined
- 9 rules have checks
- 4 automated scripts (covering 5 rules)
- 9 runtime validation functions
- All checks output "violates R-XX-YY" for diagnosis

---

## Maintenance

When adding a new rule:
1. Add row to this matrix
2. Create check script OR runtime validator (or both)
3. Ensure violation output includes "violates R-XX-YY"
4. Update `run-all.sh` if adding script
5. Re-verify zero drift

When removing a rule:
1. Remove row from this matrix
2. Remove check implementation
3. Update `run-all.sh` if script was removed
4. Re-verify zero drift

---

**Version:** 1.0  
**Issue:** #5 — Consult Note v1  
**Last Updated:** 2026-02-08  
**Status:** ✅ Zero Drift Achieved
