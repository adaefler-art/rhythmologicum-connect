# RULES_VS_CHECKS_MATRIX — Issue 8

## Issue 8: Signals in Patient Record & Clinician Handoff

**Status:** ✅ Complete  
**Date:** 2026-02-09

---

## Rules ↔ Checks Matrix

| Rule ID | Rule Description | Check Implementation | Status |
|---------|-----------------|---------------------|--------|
| R-08.1 | Patient view must not contain forbidden diagnostic terms | `checkR081()` in `scripts/validate-signals.mjs` | ✅ Implemented |
| R-08.2 | Clinician view must show all signal data (Risk Level, Codes, Priority, Red Flags) | `checkR082()` in `scripts/validate-signals.mjs` | ✅ Implemented |
| R-08.3 | Patient view must be collapsed by default with max 5 bullet points | `checkR083()` in `scripts/validate-signals.mjs` | ✅ Implemented |
| R-08.4 | Patient view must not contain numeric scores, percentages, or signal codes | `checkR084()` in `scripts/validate-signals.mjs` | ✅ Implemented |
| R-08.5 | Signals must be clearly separated from consult notes | `checkR085()` in `scripts/validate-signals.mjs` | ✅ Implemented |

---

## Check Details

### R-08.1: Forbidden Terms Check

**Implementation:** `checkR081()` in `scripts/validate-signals.mjs`

**What it checks:**
- Scans `PatientSignalsSection.tsx` for forbidden terms in display logic
- Forbidden terms defined in `lib/types/signals.ts::FORBIDDEN_PATIENT_TERMS`
- Excludes comments and constant definitions from check

**Forbidden Terms:**
- Diagnostic: `diagnose`, `erkrankung festgestellt`, `krankheit`, `pathologie`
- Directive: `kritisches risiko`, `gefährlich`, `sofortige behandlung`
- Technical: `score`, `prozent`, `%`, `signal code`, `tier`, `ranking`, `algorithmus`

**Output format:**
```
[violates R-08.1] Forbidden term "diagnose" found in patient view at line X
```

---

### R-08.2: Clinician View Completeness Check

**Implementation:** `checkR082()` in `scripts/validate-signals.mjs`

**What it checks:**
- Verifies `ClinicianSignalsSection.tsx` displays all required fields
- Checks for "automatically generated" label

**Required fields:**
- `riskLevel`
- `riskScore`
- `signalCodes`
- `redFlags`
- `priorityRanking`

**Output format:**
```
[violates R-08.2] Required field "riskLevel" not displayed in clinician view
[violates R-08.2] Missing "automatically generated" label in clinician view
```

---

### R-08.3: Collapsed & Max Bullets Check

**Implementation:** `checkR083()` in `scripts/validate-signals.mjs`

**What it checks:**
- Verifies patient section is collapsed by default (`useState(false)` or `isCollapsed: true`)
- Checks for max 5 bullet points validation

**Output format:**
```
[violates R-08.3] Patient signals section is not collapsed by default
[violates R-08.3] Missing validation for max 5 bullet points
```

---

### R-08.4: No Scores/Percentages Check

**Implementation:** `checkR084()` in `scripts/validate-signals.mjs`

**What it checks:**
- Verifies `signalTransform.ts` has `validatePatientSignal` function
- Checks for `NUMERIC_SCORE` and `PERCENTAGE` validation types

**Output format:**
```
[violates R-08.4] Missing validatePatientSignal function
[violates R-08.4] Missing validation for numeric scores or percentages
```

---

### R-08.5: Separation from Consult Notes Check

**Implementation:** `checkR085()` in `scripts/validate-signals.mjs`

**What it checks:**
- Verifies `ClinicianSignalsSection` and `DiagnosisSection`/`ConsultNote` exist in clinician page
- Checks they are in separate components (>100 chars apart in source)

**Output format:**
```
[violates R-08.5] ClinicianSignalsSection not found in clinician page
[violates R-08.5] Signals and consult notes may not be properly separated
```

---

## Running the Checks

### Execute all checks:
```bash
node scripts/validate-signals.mjs
```

### Expected output (success):
```
🔍 Issue 8: Running Signal Validation Guardrails...

✅ Checks performed: 5
   Rules: R-08.1, R-08.2, R-08.3, R-08.4, R-08.5

✅ All validations passed!
✅ Rule-Check matrix is complete
```

### Expected output (failure):
```
🔍 Issue 8: Running Signal Validation Guardrails...

✅ Checks performed: 5
   Rules: R-08.1, R-08.2, R-08.3, R-08.4, R-08.5

❌ Found 2 violation(s):

   [violates R-08.1] Forbidden term "diagnose" found in patient view at line 42
   File: apps/rhythm-patient-ui/app/patient/(mobile)/components/PatientSignalsSection.tsx

   [violates R-08.3] Patient signals section is not collapsed by default
   File: apps/rhythm-patient-ui/app/patient/(mobile)/components/PatientSignalsSection.tsx
```

---

## Matrix Verification

The script also verifies that every rule has a corresponding check and vice versa:

- **Rules without checks:** Lists any rule IDs that don't have implementing checks
- **Checks without rules:** Lists any checks that don't reference a defined rule

This ensures bidirectional traceability between requirements and validation.

---

## Scope Mismatch Detection

If a check is implemented but doesn't cover the full scope of the rule, the check output should include a note:

```
[violates R-08.X] [SCOPE_MISMATCH] Check only validates X but rule requires X + Y
```

---

## Integration with CI/CD

To integrate into CI pipeline, add to `.github/workflows/`:

```yaml
- name: Validate Signals (Issue 8)
  run: node scripts/validate-signals.mjs
```

Exit code:
- `0` = All checks passed
- `1` = One or more violations found

---

## Files Checked

| Component | File Path | Rules |
|-----------|-----------|-------|
| Patient Signals View | `apps/rhythm-patient-ui/app/patient/(mobile)/components/PatientSignalsSection.tsx` | R-08.1, R-08.3 |
| Clinician Signals View | `apps/rhythm-studio-ui/app/clinician/patient/[id]/ClinicianSignalsSection.tsx` | R-08.2 |
| Signal Transform Utils | `apps/rhythm-studio-ui/lib/utils/signalTransform.ts` | R-08.4 |
| Clinician Page Integration | `apps/rhythm-studio-ui/app/clinician/patient/[id]/page.tsx` | R-08.5 |
| Signal Types | `apps/rhythm-studio-ui/lib/types/signals.ts` | R-08.1, R-08.4 |

---

## Diff Report

### Rules without Check
*(None)*

### Checks without Rule
*(None)*

### Scope Mismatch
*(None)*

---

## Maintenance

When adding new rules:
1. Add rule to `RULES` object in `scripts/validate-signals.mjs`
2. Implement check function `checkR08X()`
3. Add check function call in `runChecks()`
4. Update this matrix document
5. Run `node scripts/validate-signals.mjs` to verify

When modifying existing checks:
1. Update check function implementation
2. Update this matrix document if behavior changes
3. Re-run validation to ensure no regressions
