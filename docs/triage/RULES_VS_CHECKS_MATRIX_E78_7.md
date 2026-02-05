# E78.7 Rules vs Checks Matrix

**Epic:** E78.7 — Studio UI Umbau: Triage wird Inbox (Active default + Archiv + Suche + Next Actions)  
**Version:** 1.0  
**Date:** 2026-02-05  
**Status:** ✅ Complete

## Overview

This document maps validation rules to verification checks for the E78.7 Inbox UI refactor implementation. Every rule has a corresponding check, and every check references a rule ID.

## Rule → Check Mapping

| Rule ID | Description | Check ID | Status |
|---------|-------------|----------|--------|
| R-E78.7-001 | Page uses /api/clinician/triage API endpoint | E78.7-001 | ✅ Implemented |
| R-E78.7-002 | No client-side multi-fetch logic | E78.7-002 | ✅ Implemented |
| R-E78.7-003 | No diagnostic/health check code | E78.7-003 | ✅ Implemented |
| R-E78.7-004 | Active/Archive toggle present | E78.7-004 | ✅ Implemented |
| R-E78.7-005 | Search box component present | E78.7-005 | ✅ Implemented |
| R-E78.7-006 | Status filter present | E78.7-006 | ✅ Implemented |
| R-E78.7-007 | Attention level filter present | E78.7-007 | ✅ Implemented |
| R-E78.7-008 | Table has Patient column | E78.7-008 | ✅ Implemented |
| R-E78.7-009 | Table has Funnel/Episode column | E78.7-009 | ✅ Implemented |
| R-E78.7-010 | Table has Status column with case_state | E78.7-010 | ✅ Implemented |
| R-E78.7-011 | Table has Reasons column with attention badges | E78.7-011 | ✅ Implemented |
| R-E78.7-012 | Table has Next Action column | E78.7-012 | ✅ Implemented |
| R-E78.7-013 | Table has Last Activity column | E78.7-013 | ✅ Implemented |
| R-E78.7-014 | No Risk/Score/Result columns visible | E78.7-014 | ✅ Implemented |
| R-E78.7-015 | Row actions dropdown present | E78.7-015 | ✅ Implemented |
| R-E78.7-016 | Flag action in dropdown | E78.7-016 | ✅ Implemented |
| R-E78.7-017 | Snooze action in dropdown | E78.7-017 | ✅ Implemented |
| R-E78.7-018 | Close action in dropdown | E78.7-018 | ✅ Implemented |
| R-E78.7-019 | Reopen action in dropdown | E78.7-019 | ✅ Implemented |
| R-E78.7-020 | Note action in dropdown | E78.7-020 | ✅ Implemented |
| R-E78.7-021 | Dark theme compliance (no pure white/black) | E78.7-021 | ✅ Implemented |
| R-E78.7-022 | Page title is "Inbox" not "Triage" | E78.7-022 | ✅ Implemented |

**Total Rules:** 22  
**Total Checks:** 22

---

## Check → Rule Mapping

| Check ID | Validates Rule | Check Function | Error Format |
|----------|----------------|----------------|--------------|
| E78.7-001 | R-E78.7-001 | `checkApiEndpoint()` | ❌ violates R-E78.7-001 (E78.7-001) |
| E78.7-002 | R-E78.7-002 | `checkNoMultiFetch()` | ❌ violates R-E78.7-002 (E78.7-002) |
| E78.7-003 | R-E78.7-003 | `checkNoDiagnostics()` | ❌ violates R-E78.7-003 (E78.7-003) |
| E78.7-004 | R-E78.7-004 | `checkActiveArchiveToggle()` | ❌ violates R-E78.7-004 (E78.7-004) |
| E78.7-005 | R-E78.7-005 | `checkSearchBox()` | ❌ violates R-E78.7-005 (E78.7-005) |
| E78.7-006 | R-E78.7-006 | `checkStatusFilter()` | ❌ violates R-E78.7-006 (E78.7-006) |
| E78.7-007 | R-E78.7-007 | `checkAttentionFilter()` | ❌ violates R-E78.7-007 (E78.7-007) |
| E78.7-008 | R-E78.7-008 | `checkPatientColumn()` | ❌ violates R-E78.7-008 (E78.7-008) |
| E78.7-009 | R-E78.7-009 | `checkFunnelColumn()` | ❌ violates R-E78.7-009 (E78.7-009) |
| E78.7-010 | R-E78.7-010 | `checkStatusColumn()` | ❌ violates R-E78.7-010 (E78.7-010) |
| E78.7-011 | R-E78.7-011 | `checkReasonsColumn()` | ❌ violates R-E78.7-011 (E78.7-011) |
| E78.7-012 | R-E78.7-012 | `checkNextActionColumn()` | ❌ violates R-E78.7-012 (E78.7-012) |
| E78.7-013 | R-E78.7-013 | `checkLastActivityColumn()` | ❌ violates R-E78.7-013 (E78.7-013) |
| E78.7-014 | R-E78.7-014 | `checkNoRiskScoreColumns()` | ❌ violates R-E78.7-014 (E78.7-014) |
| E78.7-015 | R-E78.7-015 | `checkRowActionsDropdown()` | ❌ violates R-E78.7-015 (E78.7-015) |
| E78.7-016 | R-E78.7-016 | `checkFlagAction()` | ❌ violates R-E78.7-016 (E78.7-016) |
| E78.7-017 | R-E78.7-017 | `checkSnoozeAction()` | ❌ violates R-E78.7-017 (E78.7-017) |
| E78.7-018 | R-E78.7-018 | `checkCloseAction()` | ❌ violates R-E78.7-018 (E78.7-018) |
| E78.7-019 | R-E78.7-019 | `checkReopenAction()` | ❌ violates R-E78.7-019 (E78.7-019) |
| E78.7-020 | R-E78.7-020 | `checkNoteAction()` | ❌ violates R-E78.7-020 (E78.7-020) |
| E78.7-021 | R-E78.7-021 | `checkDarkTheme()` | ❌ violates R-E78.7-021 (E78.7-021) |
| E78.7-022 | R-E78.7-022 | `checkPageTitle()` | ❌ violates R-E78.7-022 (E78.7-022) |

**Total Checks:** 22

---

## Error Code Reference

All checks use the standard error format: `❌ violates R-E78.7-XXX (E78.7-XXX): description`

| Error Code | Rule ID | Description |
|------------|---------|-------------|
| E78.7-001 | R-E78.7-001 | Missing API endpoint usage or fetch call |
| E78.7-002 | R-E78.7-002 | Client-side supabase.from() calls found |
| E78.7-003 | R-E78.7-003 | Diagnostic types or health check code found |
| E78.7-004 | R-E78.7-004 | Missing showActive state or toggle buttons |
| E78.7-005 | R-E78.7-005 | Missing search input or query state |
| E78.7-006 | R-E78.7-006 | Missing status filter or dropdown |
| E78.7-007 | R-E78.7-007 | Missing attention filter or dropdown |
| E78.7-008 | R-E78.7-008 | Missing Patient column or patient_display field |
| E78.7-009 | R-E78.7-009 | Missing Funnel/Episode column or funnel_slug field |
| E78.7-010 | R-E78.7-010 | Missing Status column or case_state field |
| E78.7-011 | R-E78.7-011 | Missing Reasons column or attention level badges |
| E78.7-012 | R-E78.7-012 | Missing Next Action column or action labels |
| E78.7-013 | R-E78.7-013 | Missing Last Activity column or last_activity_at field |
| E78.7-014 | R-E78.7-014 | Risk/Score/Result columns still visible |
| E78.7-015 | R-E78.7-015 | Missing Aktionen column or dropdown state |
| E78.7-016 | R-E78.7-016 | Missing Flag action or icon |
| E78.7-017 | R-E78.7-017 | Missing Snooze action or label |
| E78.7-018 | R-E78.7-018 | Missing Close action or icon |
| E78.7-019 | R-E78.7-019 | Missing Reopen action or icon |
| E78.7-020 | R-E78.7-020 | Missing Note action or icon |
| E78.7-021 | R-E78.7-021 | Pure white/black colors found or missing dark: classes |
| E78.7-022 | R-E78.7-022 | Page title not "Inbox" or old "Triage" title present |

---

## Coverage Summary

### Rules without Checks
**Count:** 0 ✅

None - all rules have corresponding checks.

---

### Checks without Rules
**Count:** 0 ✅

None - all checks reference valid rule IDs.

---

### Scope Mismatches
**Count:** 0 ✅

None - all check scopes match their corresponding rule scopes.

---

## Diff Report

**Rules not covered by checks:** None ✅  
**Checks not referencing rules:** None ✅  
**Scope mismatches:** None ✅

**Coverage:** 100% ✅

---

## Verification Command

```bash
npm run verify:e78-7
```

**Expected Output:**
```
✅ E78.7 Inbox UI refactor verification PASSED
   All requirements met
```

---

## Implementation Notes

### UI Architecture
- **Before:** Client-side multi-fetch with diagnostic logging (770 lines)
- **After:** Clean API-driven UI with server-side logic (678 lines)
- **Reduction:** 92 lines (-12%), improved maintainability

### Key Changes
1. **API Integration:** Single fetch to `/api/clinician/triage` instead of 3+ Supabase queries
2. **State Management:** Simplified state (removed diagnosis, healthCheck, retry logic)
3. **Type Safety:** Updated types to match `triage_cases_v1` view schema
4. **Filter UI:** Added Active/Archive toggle, search box, status and attention dropdowns
5. **Table Columns:** Replaced Risk/Score with Reasons, Next Action, Last Activity
6. **Row Actions:** Added dropdown with 5 HITL actions (placeholders for future backend)
7. **Dark Theme:** All colors use proper dark mode tokens (no pure white/black)
8. **Page Title:** Changed from "Triage / Übersicht" to "Inbox"

### Guardrails Compliance
- ✅ Every rule has a check implementation
- ✅ Every check references a rule ID
- ✅ Check output contains "violates R-E78.7-XXX" for quick diagnosis
- ✅ 100% coverage verified
- ✅ Diff report included

---

## Maintenance Guidelines

1. **When adding new features:**
   - Add rule to this matrix (R-E78.7-023+)
   - Add check to verification script (E78.7-023+)
   - Update coverage summary
   - Run `npm run verify:e78-7`

2. **When modifying UI:**
   - Ensure changes don't break existing checks
   - Update checks if UI patterns change
   - Maintain rule-check 1:1 mapping

3. **When removing features:**
   - Remove corresponding rule
   - Remove corresponding check
   - Update coverage summary
   - Update diff report

---

## Related Documentation

- **Epic Spec:** E78.7-COMPLETE.md
- **Inbox v1 Spec:** docs/triage/inbox-v1.md
- **API Spec:** E78.3-COMPLETE.md
- **View Schema:** E78.2-COMPLETE.md
- **Verification Script:** scripts/ci/verify-e78-7-inbox-ui.mjs
