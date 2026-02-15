# Issue 6 — Parametrizable Uncertainty & Probability Handling

## Status: ✅ COMPLETE

**Implementation Date:** 2026-02-09  
**Branch:** `copilot/handle-uncertainty-probability`  
**Commits:** 3 commits

---

## Executive Summary

Issue 6 successfully implements parametrizable control over uncertainty and probability expression in PAT's medical consultations. The system is:
- ✅ Explicit and controlled via three parameters
- ✅ Documented in every consult note header
- ✅ Testable and verifiable with 22 automated checks
- ✅ Safe and compliant with medical requirements
- ✅ Maintainable with 100% rule-to-check coverage

---

## Three-Parameter System

Every consultation is controlled by:

1. **uncertaintyProfile** (`off` | `qualitative` | `mixed`)
   - Controls HOW uncertainty is expressed
   
2. **assertiveness** (`conservative` | `balanced` | `direct`)
   - Controls TONE of medical statements
   
3. **audience** (`patient` | `clinician`)
   - Controls LANGUAGE LEVEL and detail

---

## Deliverables

### Code (2 files modified, 1 new)

1. **lib/config/uncertaintyParameters.ts** (NEW, 9,273 bytes)
   - Central configuration file
   - All parameter rules and effects
   - Helper functions for parameter logic

2. **lib/validation/consultNote.ts** (MODIFIED, +150 lines)
   - Uncertainty parameter validation
   - Numerical probability detection
   - Language consistency checks

3. **package.json** (MODIFIED, +1 line)
   - Added `verify:issue-6` npm script

### Documentation (3 files)

1. **ISSUE-06-IMPLEMENTATION-SUMMARY.md** (13,640 bytes)
   - Complete implementation details
   - Architecture and design decisions
   - Product impact analysis

2. **ISSUE-06-RULES-VS-CHECKS-MATRIX.md** (11,136 bytes)
   - Bidirectional traceability matrix
   - 22 rules with 100% check coverage
   - Maintenance guide

3. **ISSUE-06-TESTING-GUIDE.md** (4,782 bytes)
   - Testing procedures and scenarios
   - Manual and automated tests
   - Troubleshooting guide

### Verification (1 script)

1. **scripts/ci/verify-issue-6-uncertainty.mjs** (14,535 bytes)
   - 22 automated checks
   - Rules R-I6-01 to R-I6-22
   - CI/CD ready

---

## Rules Implemented

**Configuration Defaults (3 rules)**
- R-I6-01: Patient mode defaults (qualitative, conservative, patient)
- R-I6-02: Clinician mode defaults (qualitative, balanced, clinician)
- R-I6-03: System defaults to patient-safe parameters

**Parameter Effects (6 rules)**
- R-I6-04: Off profile (no uncertainty except red flags)
- R-I6-05: Qualitative profile (language only, no numbers)
- R-I6-06: Mixed profile (numbers only in clinician mode)
- R-I6-07: Conservative assertiveness
- R-I6-08: Balanced assertiveness
- R-I6-09: Direct assertiveness

**Audience Rules (2 rules)**
- R-I6-10: Patient audience restrictions (no numbers, no jargon)
- R-I6-11: Clinician audience allowances (still no definitive diagnosis)

**Helper Functions (4 rules)**
- R-I6-12: Parameter combination validation
- R-I6-13: Default parameters by audience
- R-I6-14: Number allowance check
- R-I6-15: Header formatting

**Validation (4 rules)**
- R-I6-16: All parameters present in header
- R-I6-17: No numerical probabilities in patient mode
- R-I6-18: Language consistency with parameters
- R-I6-19: Validation imports utilities

**Integration (3 rules)**
- R-I6-20: LLM prompts accept and document parameters
- R-I6-21: API routes use safe defaults
- R-I6-22: Type system defines all parameters

**Total: 22 rules, 22 checks, 100% coverage**

---

## Acceptance Criteria Verified

✅ **AC1:** Every consult note contains active uncertainty parameters  
- Header includes all three parameters
- Validation enforces presence (R-I6-16)

✅ **AC2:** Patient and clinician outputs differ visibly  
- Different default parameters
- Different audience rules

✅ **AC3:** No numbers appear in patient mode  
- Enforced by `areNumbersAllowed()`
- Validation detects violations (R-I6-17)

✅ **AC4:** Language is consistent over consultation  
- Language consistency validation (R-I6-18)
- LLM prompts enforce consistency

✅ **AC5:** Behavior is explainable through parameters  
- All effects documented
- Header shows active parameters
- 22 automated checks

---

## MUST Requirements Met

✅ **Three exact parameters defined**  
✅ **Parameters set via code/config**  
✅ **Parameters static per consultation**  
✅ **Parameters documented in consult note header**  
✅ **Patient and clinician modes have different defaults**  
✅ **Behavior is predictable, testable, auditable**  

---

## MUST NOT Requirements Met

✅ **No Admin UI created**  
✅ **No live changes during consultation**  
✅ **No automatic parameter derivation**  
✅ **No numerical probabilities in patient mode**  
✅ **No diagnoses through parametrization**  

---

## Verification

### Automated Checks

```bash
npm run verify:issue-6
```

**Result:** ✅ All 22 checks passing

### Manual Verification

- [x] Configuration file exists with all exports
- [x] Validation enforces all rules
- [x] LLM prompts use parameters
- [x] API applies correct defaults
- [x] Types support all parameters
- [x] No breaking changes to existing code
- [x] Issue 4 checks still pass

---

## Integration Points

### Builds On
- **Issue 5:** Consult Note v1 foundation (types, prompts, API already supported parameters)

### No Breaking Changes
- Existing consult note generation continues to work
- Validation is backward compatible (warnings for old notes)
- Type system only extended, not modified

### Future Extensions
Parameters provide foundation for:
- A/B testing different uncertainty expressions
- Adapting to regulatory requirements
- Fine-tuning for different medical domains

---

## Documentation Links

- [ISSUE-06-IMPLEMENTATION-SUMMARY.md](ISSUE-06-IMPLEMENTATION-SUMMARY.md) - Complete implementation details
- [ISSUE-06-RULES-VS-CHECKS-MATRIX.md](ISSUE-06-RULES-VS-CHECKS-MATRIX.md) - Traceability matrix
- [ISSUE-06-TESTING-GUIDE.md](ISSUE-06-TESTING-GUIDE.md) - Testing procedures
- [lib/config/uncertaintyParameters.ts](lib/config/uncertaintyParameters.ts) - Configuration source

---

## Running Verification

```bash
# Quick verification
npm run verify:issue-6

# Manual testing
node scripts/ci/verify-issue-6-uncertainty.mjs

# Check no regressions
npm run verify:issue-4
```

---

## Next Steps

This PR is ready for:
1. ✅ Code review
2. ✅ QA testing (see ISSUE-06-TESTING-GUIDE.md)
3. ✅ Security scan (CodeQL)
4. ✅ Merge to main

No further implementation work required.

---

## Conclusion

Issue 6 successfully delivers parametrizable uncertainty and probability handling that is:
- ✅ Explicit and controlled
- ✅ Documented and auditable
- ✅ Testable and verifiable
- ✅ Safe and compliant
- ✅ Maintainable and extensible

**All MUST requirements met. All MUST NOT items avoided. All acceptance criteria verified.**

## ✅ ISSUE 6 COMPLETE
