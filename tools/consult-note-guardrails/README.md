# Issue 5: Consult Note v1 Guardrails

This directory contains validation scripts that enforce the rules defined in Issue 5 for the Consult Note v1 feature.

## Overview

The Consult Note v1 is a **structured medical consultation artifact** with strict requirements:
- **12 mandatory sections** in fixed order
- **NO diagnosis language** allowed
- **Handoff summary limited to 10 lines**
- **Uncertainty profiles** must be documented
- **Versioning support** (no in-place edits)

## Guardrail Scripts

### 1. `check-12-sections.sh`
**Rule:** R-CN-01

Validates that all 12 sections are properly defined and enforced:
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
- TypeScript type definition includes all sections
- Validation function checks for all sections
- LLM prompt specifies all sections

**Exit codes:**
- `0` = All 12 sections properly defined
- `1` = One or more sections missing or incorrectly defined

### 2. `check-handoff-limit.sh`
**Rule:** R-CN-08

Validates that the handoff summary is limited to a maximum of 10 lines.

**Checks:**
- `MAX_HANDOFF_LINES` constant set to 10
- Validation function enforces the limit
- LLM prompt mentions the 10-line limit
- Validation returns error (not just warning) for violations

**Exit codes:**
- `0` = 10-line limit properly enforced
- `1` = Limit not enforced or incorrectly configured

### 3. `check-no-diagnosis.sh`
**Rule:** R-CN-09

Detects and prevents diagnosis language in consult notes.

**Forbidden phrases:**
- "you have [disease]"
- "diagnosis: [X]"
- "diagnosed with"
- "definitive diagnosis"
- "confirmed"
- "definitively"
- "certainly is"
- "definitely"
- "it is clear that"

**Checks:**
- Forbidden words list defined in validation
- Diagnosis language detection function exists
- LLM prompt includes "NO DIAGNOSES" rule
- API code doesn't contain diagnosis language
- Documentation examples avoid diagnosis language

**Exit codes:**
- `0` = No diagnosis language detector working
- `1` = Diagnosis language detection missing or ineffective

### 4. `check-uncertainty-mode.sh`
**Rules:** R-CN-02, R-CN-07

Validates that uncertainty modes are properly configured and enforced.

**Checks:**
- TypeScript types for `UncertaintyProfile`, `AssertivenessLevel`, `AudienceType`
- Database enum types for uncertainty configuration
- LLM prompt has uncertainty instructions
- Prompt differentiates patient vs clinician audiences
- Preliminary assessment uses "hypotheses as options" language
- Validation enforces uncertainty mode documentation

**Exit codes:**
- `0` = Uncertainty modes properly configured
- `1` = Uncertainty configuration missing or incomplete

### 5. `run-all.sh`
**Master script**

Runs all guardrail checks in sequence and provides a summary.

**Usage:**
```bash
./tools/consult-note-guardrails/run-all.sh
```

**Exit codes:**
- `0` = All guardrails passed
- `1` = One or more guardrails failed

## Usage

### Run All Checks
```bash
cd /path/to/rhythmologicum-connect
./tools/consult-note-guardrails/run-all.sh
```

### Run Individual Checks
```bash
./tools/consult-note-guardrails/check-12-sections.sh
./tools/consult-note-guardrails/check-handoff-limit.sh
./tools/consult-note-guardrails/check-no-diagnosis.sh
./tools/consult-note-guardrails/check-uncertainty-mode.sh
```

## Integration

### Local Development
Run before committing changes to consult note code:
```bash
./tools/consult-note-guardrails/run-all.sh
```

### CI/CD
Add to GitHub Actions workflow:
```yaml
- name: Run Consult Note Guardrails
  run: ./tools/consult-note-guardrails/run-all.sh
```

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
if git diff --cached --name-only | grep -qE "(consultNote|consult-notes)"; then
  ./tools/consult-note-guardrails/run-all.sh || exit 1
fi
```

## Rule Reference

| Rule | Description | Script | Severity |
|------|-------------|--------|----------|
| R-CN-01 | All 12 sections must be present | check-12-sections.sh | ERROR |
| R-CN-02 | Header must document uncertainty profile | check-uncertainty-mode.sh | ERROR |
| R-CN-03 | Chief complaint 1-2 sentences | (in validation) | WARNING |
| R-CN-04 | HPI must have structured fields | (in validation) | WARNING |
| R-CN-05 | Red flags screening required | (in validation) | ERROR |
| R-CN-06 | Problem list 3-7 items | (in validation) | WARNING |
| R-CN-07 | Preliminary assessment no definitive diagnoses | check-uncertainty-mode.sh | ERROR |
| R-CN-08 | Handoff summary max 10 lines | check-handoff-limit.sh | ERROR |
| R-CN-09 | NO diagnosis language | check-no-diagnosis.sh | ERROR |

## Troubleshooting

### Check fails with "file not found"
Ensure you're running from the project root or the scripts have correct paths.

### False positives in diagnosis detection
Review the `DIAGNOSIS_FORBIDDEN_WORDS` list in `lib/validation/consultNote.ts` and adjust if needed.

### Handoff limit fails but should pass
Check that `MAX_HANDOFF_LINES` in `lib/validation/consultNote.ts` is set to `10`.

## Maintenance

When adding new rules:
1. Update the rule in `RULES_VS_CHECKS_MATRIX.md`
2. Create a new check script following the naming pattern `check-{rule-name}.sh`
3. Add the check to `run-all.sh`
4. Update this README with the new rule

## Related Documentation

- [RULES_VS_CHECKS_MATRIX.md](../../RULES_VS_CHECKS_MATRIX.md) - Complete rules mapping
- [lib/types/consultNote.ts](../../lib/types/consultNote.ts) - Type definitions
- [lib/validation/consultNote.ts](../../lib/validation/consultNote.ts) - Validation logic
- [lib/llm/prompts.ts](../../lib/llm/prompts.ts) - LLM prompts

---

**Version:** 1.0  
**Issue:** #5 — Consult Note v1  
**Last Updated:** 2026-02-08
