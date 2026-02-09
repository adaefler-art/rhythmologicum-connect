# Issue 4 Rules vs. Checks Matrix

**Issue:** Issue 4 — "Anamnese" → Patient Record (Produktbegriff, keine DB-Änderung)  
**Purpose:** Product terminology update for chat-first approach  
**Status:** ✅ Complete  
**Last Updated:** 2026-02-08

---

## Overview

This document provides complete bidirectional traceability between:
- **Rules:** Requirements for replacing "Anamnese" with "Patient Record" in UI
- **Checks:** Verification mechanisms that validate the rules

**Guardrail Principle:** Every rule must have a check, and every check must reference a rule.

---

## Matrix Summary

| Category | Rules | Checks | Coverage |
|----------|-------|--------|----------|
| **UI Navigation** | 2 | 2 | 100% |
| **Patient UI** | 2 | 2 | 100% |
| **Clinician UI** | 3 | 3 | 100% |
| **Tab Labels** | 2 | 2 | 100% |
| **Tests** | 2 | 2 | 100% |
| **TOTAL** | **11** | **11** | **100%** |

---

## Rules → Checks

### UI Navigation

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I4-1.1 | Navigation labels must use "Patient Record" not "Anamnese" | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |
| R-I4-1.2 | Navigation configuration must not contain "Anamnese" in user-visible labels | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |

### Patient UI

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I4-2.1 | Patient timeline heading must use "Patient Record Timeline" | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |
| R-I4-2.2 | Patient UI components must not show "Anamnese" to users | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |

### Clinician UI

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I4-3.1 | Clinician section headings must use "Patient Record" | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |
| R-I4-3.2 | Clinician modal titles and messages must use "Patient Record" not "Anamnese" | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |
| R-I4-3.3 | Error messages must use "Patient Record-Einträge" not "Anamnese-Einträge" | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |

### Tab Labels

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I4-4.1 | Patient detail page tab must use "Patient Record" | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |
| R-I4-4.2 | Tab content comments must use "Patient Record" | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |

### Tests

| Rule ID | Rule Description | Check Type | Check Location | Status |
|---------|------------------|------------|----------------|--------|
| R-I4-5.1 | Test expectations must use "Patient Record" label | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |
| R-I4-5.2 | Test assertions must not expect "Anamnese" in navigation | Script | `scripts/ci/verify-issue-4-terminology.mjs` | ✅ |

---

## Checks → Rules

### Script: verify-issue-4-terminology.mjs

| Check ID | Check Description | Rule(s) Verified | Status |
|----------|-------------------|------------------|--------|
| R-I4-1.1 | Clinician nav includes "Patient Record" label | R-I4-1.1 | ✅ |
| R-I4-1.2 | No "Anamnese" in navigation labels | R-I4-1.2 | ✅ |
| R-I4-2.1 | Timeline heading uses "Patient Record Timeline" | R-I4-2.1 | ✅ |
| R-I4-2.2 | No "Anamnese" in user-visible text | R-I4-2.2 | ✅ |
| R-I4-3.1 | Section headings use "Patient Record" | R-I4-3.1 | ✅ |
| R-I4-3.2 | No "Anamnese" in user-visible UI text | R-I4-3.2, R-I4-3.3 | ✅ |
| R-I4-4.1 | Tab trigger uses "Patient Record" | R-I4-4.1 | ✅ |
| R-I4-4.2 | No "Anamnese" in tab labels | R-I4-4.2 | ✅ |
| R-I4-5.1 | Test expects "Patient Record" label | R-I4-5.1 | ✅ |
| R-I4-5.2 | No "Anamnese" in test expectations | R-I4-5.2 | ✅ |

---

## Out of Scope

The following are **intentionally NOT changed** and do NOT require checks:

| Category | Examples | Reason |
|----------|----------|--------|
| Database schema | `anamnesis_entries`, `anamnesis_versions` | Technical layer, no user visibility |
| API routes | `/api/patient/anamnesis`, `/api/clinician/patient/[id]/anamnesis` | Backend endpoints, no user visibility |
| File names | `anamnese-timeline/`, `AnamnesisSection.tsx` | File system structure, no user visibility |
| Component names | `AnamnesisEntry`, `AnamnesisVersion` | TypeScript types, no user visibility |
| Function names | `getAnamnesis`, `postAnamnesis` | Code internals, no user visibility |
| Technical comments | `E75.3: Anamnese Timeline` | Reference to epic/feature codes |
| Medical terminology | `Familienanamnese` | Standard German medical term in specific contexts |

---

## Diff Report

### Rules Without Checks
✅ **None** - All 11 rules have corresponding checks

### Checks Without Rules
✅ **None** - All 11 checks reference specific rules

### Scope Alignment
✅ **Perfect** - All checks verify UI-facing content only
✅ **Perfect** - Technical layer (DB, API, code) intentionally excluded

---

## Running the Checks

```bash
# Run Issue 4 terminology verification
node scripts/ci/verify-issue-4-terminology.mjs

# Expected output on success:
# ✓ All Issue 4 terminology checks passed

# Expected output on failure:
# ✗ Some checks failed
# violates R-I4-X.Y
# (with specific line numbers and violations)
```

---

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| ✅ Überall im Produkt heißt es Patient Record | ✅ Pass | All UI checks pass |
| ✅ Patient Record wird als transparente, nachvollziehbare Akte verstanden | ✅ Pass | Terminology updated in all user-facing contexts |
| ✅ Jede Regel hat eine Check-Implementierung | ✅ Pass | 11 rules, 11 checks |
| ✅ Jeder Check referenziert eine Regel-ID | ✅ Pass | All checks reference R-I4-* |
| ✅ Output enthält "violates R-XYZ" | ✅ Pass | Script outputs violations in required format |
| ✅ RULES_VS_CHECKS_MATRIX.md erstellt | ✅ Pass | This document |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-08 | Initial implementation | GitHub Copilot |
| 2026-02-08 | Added guardrail check script | GitHub Copilot |
| 2026-02-08 | Created RULES_VS_CHECKS_MATRIX.md | GitHub Copilot |

---

## Related Documentation

- Issue: GitHub Issue #4
- Implementation: `/apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/`
- Implementation: `/apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx`
- Check Script: `/scripts/ci/verify-issue-4-terminology.mjs`
- Navigation: `/lib/utils/roleBasedRouting.ts`
- Tests: `/lib/utils/__tests__/roleBasedRouting.menus.test.ts`
