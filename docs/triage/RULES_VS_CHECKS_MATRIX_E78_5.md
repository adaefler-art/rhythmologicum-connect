# Rules vs Checks Matrix — E78.5

## Overview

This document maps E78.5 business rules to their corresponding check implementations. Every rule has at least one check, and every check references at least one rule.

**Format:** Violations output `violates R-E78.5-XX` where R-E78.5-XX is the rule identifier.

**Status:** ✅ Complete (35 rules defined, 35 checks implemented, 100% coverage)

## Rule Categories

- **R-E78.5-001 to R-E78.5-010**: Database Migration Rules
- **R-E78.5-011 to R-E78.5-018**: Schema.sql Rules
- **R-E78.5-019 to R-E78.5-023**: API Integration Rules
- **R-E78.5-024 to R-E78.5-028**: Audit Trail Rules
- **R-E78.5-029 to R-E78.5-035**: View Logic Rules

## Rules → Checks Mapping

### Database Migration Rules (10 rules)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-E78.5-001 | Migration file must exist | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-002 | Migration must contain latest_snooze CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-003 | Migration must contain latest_close_reopen CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-004 | Migration must contain latest_manual_flag CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-005 | Migration must contain latest_acknowledge CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-006 | Migration must compute snoozed_until field | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-007 | Migration must compute is_manually_closed field | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-008 | Migration must compute manual_flag_severity field | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-009 | Migration must compute acknowledged_at field | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-010 | Migration must integrate manual_flag into attention_items | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |

### Schema.sql Rules (8 rules)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-E78.5-011 | schema.sql must contain triage_cases_v1 view | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-012 | schema.sql must contain latest_snooze CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-013 | schema.sql must contain latest_close_reopen CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-014 | schema.sql must contain latest_manual_flag CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-015 | schema.sql must contain latest_acknowledge CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-016 | schema.sql must contain snoozed_until field | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-017 | schema.sql must contain is_manually_closed field | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-018 | schema.sql view comment must reference E78.5 | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |

### API Integration Rules (5 rules)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-E78.5-019 | Triage API route must exist | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-020 | Triage API must filter snoozed cases when activeOnly | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-021 | Triage API must reference R-E78.5-007 rule | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-022 | Triage API must reference R-E78.5-008 rule | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-023 | Triage API must use is_active for filtering | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |

### Audit Trail Rules (5 rules)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-E78.5-024 | triage_case_actions table must exist in schema | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-025 | triage_case_actions must have snooze action type | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-026 | triage_case_actions must have close action type | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-027 | triage_case_actions must have manual_flag action type | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-028 | triage_case_actions must have acknowledge action type | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |

### View Logic Rules (7 rules)

| Rule ID | Description | Severity | Check Script | Status |
|---------|-------------|----------|--------------|--------|
| R-E78.5-029 | View must handle manual close override in case_state | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-030 | View must include manual_flag in attention_level | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-031 | View must set is_active=false for manually closed cases | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-032 | View must join latest_snooze CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-033 | View must join latest_close_reopen CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-034 | View must join latest_manual_flag CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |
| R-E78.5-035 | View must join latest_acknowledge CTE | 🔴 Block | verify-e78-5-effective-state.mjs | ✅ Pass |

## Checks → Rules Mapping

### `scripts/ci/verify-e78-5-effective-state.mjs`

**Purpose:** Verify that E78.5 effective state integration is correctly implemented

**Rules Enforced:**
- All 35 rules (R-E78.5-001 through R-E78.5-035)

**Usage:**
```bash
npm run verify:e78-5
# or
node scripts/ci/verify-e78-5-effective-state.mjs
```

**Output Example:**
```
✅ R-E78.5-001: Migration file exists
✅ R-E78.5-002: Migration contains latest_snooze CTE
...
✅ Verification PASSED
All 35 checks passed successfully.
```

**Exit Code:** 0 if all checks pass, 1 if any check fails

## Error Code Reference

When a check fails, it outputs a message with the violated rule ID:

| Error Pattern | Rule Violated | Fix |
|---------------|---------------|-----|
| `violates R-E78.5-001` | Migration file missing | Create migration file `20260207042600_e78_5_effective_state_integration.sql` |
| `violates R-E78.5-002` | Missing latest_snooze CTE | Add CTE to compute latest snooze action |
| `violates R-E78.5-003` | Missing latest_close_reopen CTE | Add CTE to compute latest close/reopen action |
| `violates R-E78.5-004` | Missing latest_manual_flag CTE | Add CTE to compute latest manual flag action |
| `violates R-E78.5-005` | Missing latest_acknowledge CTE | Add CTE to compute latest acknowledge action |
| `violates R-E78.5-006` | snoozed_until not computed | Add snoozed_until field computation from latest_snooze |
| `violates R-E78.5-007` | is_manually_closed not computed | Add is_manually_closed field computation from latest_close_reopen |
| `violates R-E78.5-008` | manual_flag_severity not computed | Add manual_flag_severity field from latest_manual_flag |
| `violates R-E78.5-009` | acknowledged_at not computed | Add acknowledged_at field from latest_acknowledge |
| `violates R-E78.5-010` | manual_flag not in attention_items | Integrate manual_flag into attention_items_array |
| `violates R-E78.5-011` | View not in schema.sql | Update schema.sql with view definition |
| `violates R-E78.5-019` | Triage API missing | Ensure route.ts exists at correct path |
| `violates R-E78.5-020` | API doesn't filter snooze | Add snooze filtering logic to API |
| `violates R-E78.5-024` | triage_case_actions missing | Ensure E78.4 migration has been run |
| `violates R-E78.5-029` | Manual close not overriding state | Add manual close override in case_state CASE statement |

## Coverage Summary

- **Total Rules:** 35
- **Total Checks:** 35
- **Rules with ≥1 Check:** 35 (100%)
- **Checks without Rules:** 0 (0%)
- **Coverage:** 100% ✅

## Maintenance Guidelines

### Adding New Rules

1. Add rule to appropriate category above
2. Add check to `verify-e78-5-effective-state.mjs`
3. Update this matrix document
4. Run verification to ensure check works

### Adding New Checks

1. Add check function to `verify-e78-5-effective-state.mjs`
2. Map check to existing rule(s) in this document
3. If no rule exists, create one first
4. Ensure check references rule ID in failure message

### Removing Rules/Checks

1. Update both this document and verification script
2. Document reason for removal in commit message
3. Ensure no orphaned rules or checks remain

## Related Documentation

- **Migration:** `supabase/migrations/20260207042600_e78_5_effective_state_integration.sql`
- **Schema:** `schema/schema.sql` (search for `triage_cases_v1`)
- **API:** `apps/rhythm-studio-ui/app/api/clinician/triage/route.ts`
- **E78.4 (Prerequisite):** `docs/triage/RULES_VS_CHECKS_MATRIX_E78_4.md`
- **E78.2 (Base View):** `docs/triage/RULES_VS_CHECKS_MATRIX_E78_2.md`

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-07 | Initial version with 35 rules and checks |

---

**Last Updated:** 2026-02-07  
**Maintained By:** GitHub Copilot Agent  
**Verification Status:** ✅ All checks passing (35/35)
