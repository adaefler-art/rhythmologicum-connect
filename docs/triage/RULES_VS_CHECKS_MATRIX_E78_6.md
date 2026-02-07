# E78.6 — SLA/Overdue Config Rules vs Checks Matrix

**Epic:** E78.6 — SLA/Overdue Config v1  
**Status:** Complete  
**Date:** 2026-02-07

## Purpose

This document maps rules for configurable SLA settings to their verification checks, ensuring complete coverage and traceability.

## Rule Definitions

### R-E78.6-001: Default SLA Environment Variable
**Description:** System must support TRIAGE_SLA_DAYS_DEFAULT environment variable for configuring default overdue threshold.

**Requirement:**
- Environment variable `TRIAGE_SLA_DAYS_DEFAULT` accepted
- Valid positive integer values (> 0)
- Defaults to 7 days if not set or invalid
- Invalid values log warning but continue with default

**Check Implementation:** `checkDefaultSLAEnvVar()`

---

### R-E78.6-002: Funnel-Specific SLA Override
**Description:** System must support per-funnel SLA overrides via funnel_triage_settings table.

**Requirement:**
- Table `funnel_triage_settings` exists with correct schema
- Foreign key to `funnels_catalog(id)` with CASCADE delete
- Column `overdue_days` is positive integer
- One row per funnel (primary key on funnel_id)

**Check Implementation:** `checkFunnelSLATable()`

---

### R-E78.6-003: SLA Precedence Rules
**Description:** SLA configuration must follow correct precedence order.

**Requirement:**
Precedence (highest to lowest):
1. `funnel_triage_settings.overdue_days` (if exists)
2. `TRIAGE_SLA_DAYS_DEFAULT` environment variable
3. Hardcoded default (7 days)

**Check Implementation:** `checkSLAPrecedence()`

---

### R-E78.6-004: View Integration - sla_days Column
**Description:** triage_cases_v1 view must include sla_days column with correct calculation.

**Requirement:**
- Column `sla_days` exists in view
- Value computed from `funnel_sla_config` CTE
- Uses `COALESCE(funnel_triage_settings.overdue_days, 7)`

**Check Implementation:** `checkViewSLADaysColumn()`

---

### R-E78.6-005: View Integration - due_at Column
**Description:** triage_cases_v1 view must include due_at column with correct calculation.

**Requirement:**
- Column `due_at` exists in view
- Calculated as: `assigned_at + (sla_days || ' days')::INTERVAL`
- Type: TIMESTAMPTZ

**Check Implementation:** `checkViewDueAtColumn()`

---

### R-E78.6-006: Overdue Detection Uses Configurable SLA
**Description:** Overdue attention item must use configurable SLA, not hardcoded value.

**Requirement:**
- Overdue detection: `started_at < (NOW() - (sla_days || ' days')::INTERVAL)`
- No hardcoded `INTERVAL '7 days'` in overdue logic
- References `fsc.sla_days` from funnel_sla_config CTE

**Check Implementation:** `checkOverdueUsesConfigurableSLA()`

---

### R-E78.6-007: Stuck Detection Uses 2x SLA
**Description:** Stuck attention item must use 2x configurable SLA threshold.

**Requirement:**
- Stuck detection: `started_at < (NOW() - (sla_days * 2 || ' days')::INTERVAL)`
- No hardcoded `INTERVAL '14 days'` in stuck logic
- References `fsc.sla_days * 2`

**Check Implementation:** `checkStuckUses2xSLA()`

---

### R-E78.6-008: RLS Policy - Clinician Read
**Description:** Clinicians and admins must be able to read funnel_triage_settings.

**Requirement:**
- Policy `funnel_triage_settings_read_staff` exists
- Grants SELECT to users with role='clinician' OR role='admin'
- Uses `auth.uid()` and `raw_app_meta_data->>'role'`

**Check Implementation:** `checkRLSClinicianRead()`

---

### R-E78.6-009: RLS Policy - Admin Write
**Description:** Only admins can insert/update/delete funnel_triage_settings.

**Requirement:**
- Policy `funnel_triage_settings_write_admin` exists
- Grants ALL to users with role='admin'
- Uses `auth.uid()` and `raw_app_meta_data->>'role' = 'admin'`

**Check Implementation:** `checkRLSAdminWrite()`

---

### R-E78.6-010: SQL Function - get_triage_sla_days
**Description:** Helper function must return correct SLA for a funnel.

**Requirement:**
- Function `get_triage_sla_days(funnel_id UUID)` exists
- Returns INTEGER
- Queries `funnel_triage_settings` for funnel-specific value
- Returns 7 if no setting found
- Marked as STABLE (can be optimized)

**Check Implementation:** `checkSQLHelperFunction()`

---

### R-E78.6-011: TypeScript Helper - getDefaultTriageSLADays
**Description:** TypeScript helper must read env var with validation and fallback.

**Requirement:**
- Function `getDefaultTriageSLADays()` exists in `lib/triage/slaConfig.ts`
- Reads `env.TRIAGE_SLA_DAYS_DEFAULT`
- Validates as positive integer
- Logs warning on invalid value
- Returns 7 if not set or invalid

**Check Implementation:** `checkTSDefaultHelper()`

---

### R-E78.6-012: TypeScript Helper - getTriageSLADaysForFunnel
**Description:** TypeScript helper must query DB for funnel-specific SLA with fallback.

**Requirement:**
- Function `getTriageSLADaysForFunnel(funnelId)` exists
- Queries `funnel_triage_settings` table
- Falls back to `getDefaultTriageSLADays()` on error or no result
- Handles server/client environment gracefully

**Check Implementation:** `checkTSFunnelHelper()`

---

### R-E78.6-013: assigned_at Source Stability
**Description:** assigned_at field must have stable source (assessment.started_at).

**Requirement:**
- View column `assigned_at` maps to `assessments.started_at`
- Not derived from assignment records or triage actions
- Consistent with E78.1 specification

**Check Implementation:** `checkAssignedAtSource()`

---

### R-E78.6-014: Documentation - E78.1 Spec Updated
**Description:** E78.1 specification must document E78.6 changes.

**Requirement:**
- Section 6.2 updated with E78.6 configuration details
- Precedence rules documented
- SQL examples updated to use `sla_days`
- TypeScript helpers documented

**Check Implementation:** `checkE781SpecDocumentation()`

---

## Check → Rule Mapping

| Check Function | Rule ID | Error Code | Description |
|----------------|---------|------------|-------------|
| `checkDefaultSLAEnvVar` | R-E78.6-001 | E78.6-ERR-001 | Validates TRIAGE_SLA_DAYS_DEFAULT env var |
| `checkFunnelSLATable` | R-E78.6-002 | E78.6-ERR-002 | Validates funnel_triage_settings schema |
| `checkSLAPrecedence` | R-E78.6-003 | E78.6-ERR-003 | Validates SLA precedence rules |
| `checkViewSLADaysColumn` | R-E78.6-004 | E78.6-ERR-004 | Validates sla_days column in view |
| `checkViewDueAtColumn` | R-E78.6-005 | E78.6-ERR-005 | Validates due_at column in view |
| `checkOverdueUsesConfigurableSLA` | R-E78.6-006 | E78.6-ERR-006 | Validates overdue uses sla_days |
| `checkStuckUses2xSLA` | R-E78.6-007 | E78.6-ERR-007 | Validates stuck uses 2x sla_days |
| `checkRLSClinicianRead` | R-E78.6-008 | E78.6-ERR-008 | Validates RLS read policy |
| `checkRLSAdminWrite` | R-E78.6-009 | E78.6-ERR-009 | Validates RLS write policy |
| `checkSQLHelperFunction` | R-E78.6-010 | E78.6-ERR-010 | Validates SQL helper function |
| `checkTSDefaultHelper` | R-E78.6-011 | E78.6-ERR-011 | Validates TS default helper |
| `checkTSFunnelHelper` | R-E78.6-012 | E78.6-ERR-012 | Validates TS funnel helper |
| `checkAssignedAtSource` | R-E78.6-013 | E78.6-ERR-013 | Validates assigned_at source |
| `checkE781SpecDocumentation` | R-E78.6-014 | E78.6-ERR-014 | Validates documentation updates |

## Rule → Check Mapping

| Rule ID | Check Function | Scope |
|---------|----------------|-------|
| R-E78.6-001 | `checkDefaultSLAEnvVar` | Environment |
| R-E78.6-002 | `checkFunnelSLATable` | Database |
| R-E78.6-003 | `checkSLAPrecedence` | Integration |
| R-E78.6-004 | `checkViewSLADaysColumn` | Database |
| R-E78.6-005 | `checkViewDueAtColumn` | Database |
| R-E78.6-006 | `checkOverdueUsesConfigurableSLA` | Database |
| R-E78.6-007 | `checkStuckUses2xSLA` | Database |
| R-E78.6-008 | `checkRLSClinicianRead` | Security |
| R-E78.6-009 | `checkRLSAdminWrite` | Security |
| R-E78.6-010 | `checkSQLHelperFunction` | Database |
| R-E78.6-011 | `checkTSDefaultHelper` | Application |
| R-E78.6-012 | `checkTSFunnelHelper` | Application |
| R-E78.6-013 | `checkAssignedAtSource` | Database |
| R-E78.6-014 | `checkE781SpecDocumentation` | Documentation |

## Coverage Summary

- **Total Rules:** 14
- **Total Checks:** 14
- **Rules without Checks:** 0 ✅
- **Checks without Rules:** 0 ✅
- **Scope Mismatches:** 0 ✅
- **Coverage:** 100% ✅

## Diff Report

### Rules without Checks
*None* ✅

### Checks without Rules
*None* ✅

### Scope Mismatches
*None* ✅

## Error Code Reference

| Error Code | Message Template | Severity |
|------------|------------------|----------|
| E78.6-ERR-001 | violates R-E78.6-001: TRIAGE_SLA_DAYS_DEFAULT invalid or not set | warn |
| E78.6-ERR-002 | violates R-E78.6-002: funnel_triage_settings table missing or invalid | error |
| E78.6-ERR-003 | violates R-E78.6-003: SLA precedence not correctly implemented | error |
| E78.6-ERR-004 | violates R-E78.6-004: sla_days column missing or incorrect | error |
| E78.6-ERR-005 | violates R-E78.6-005: due_at column missing or incorrect | error |
| E78.6-ERR-006 | violates R-E78.6-006: Overdue still uses hardcoded value | error |
| E78.6-ERR-007 | violates R-E78.6-007: Stuck still uses hardcoded value | error |
| E78.6-ERR-008 | violates R-E78.6-008: RLS read policy missing or incorrect | error |
| E78.6-ERR-009 | violates R-E78.6-009: RLS write policy missing or incorrect | error |
| E78.6-ERR-010 | violates R-E78.6-010: SQL helper function missing or incorrect | error |
| E78.6-ERR-011 | violates R-E78.6-011: TS default helper missing or incorrect | error |
| E78.6-ERR-012 | violates R-E78.6-012: TS funnel helper missing or incorrect | error |
| E78.6-ERR-013 | violates R-E78.6-013: assigned_at source unstable or incorrect | error |
| E78.6-ERR-014 | violates R-E78.6-014: E78.1 spec not updated with E78.6 changes | warn |

## Verification Script Template

The verification script should be implemented as:

```bash
npm run verify:e78-6
# or
node scripts/ci/verify-e78-6-sla-config.mjs
```

### Placeholder Check Output Format

Each check should output in this format:

```
🔍 R-E78.6-XXX: [Rule description]
  ✅ [check_name]: PASSED
  ❌ [check_name]: FAILED - violates R-E78.6-XXX: [details]
  ⚠️  [check_name]: PASSED with warnings - [warning details]
```

## Maintenance Guidelines

1. **Adding New Rules:**
   - Add rule definition with unique R-E78.6-XXX ID
   - Add corresponding check function
   - Update both mappings (check→rule and rule→check)
   - Add error code to reference table
   - Update coverage summary

2. **Modifying Rules:**
   - Update rule definition
   - Update corresponding check implementation
   - Update error message if needed
   - Verify scope classification

3. **Removing Rules:**
   - Remove from all mapping tables
   - Update coverage summary
   - Add to diff report if temporarily disabled

4. **Regular Review:**
   - Verify no rules lack checks (coverage gap)
   - Verify no checks lack rules (orphaned checks)
   - Verify scope matches implementation
   - Update documentation as system evolves

## Related Documentation

- **E78.1 Specification:** `docs/triage/inbox-v1.md`
- **E78.6 Migration:** `supabase/migrations/20260207051700_e78_6_funnel_triage_settings.sql`
- **E78.6 View Update:** `supabase/migrations/20260207051800_e78_6_update_triage_view_sla.sql`
- **SLA Config Module:** `lib/triage/slaConfig.ts`
- **Environment Schema:** `lib/env.ts`
- **Schema Definition:** `schema/schema.sql`

---

**Last Updated:** 2026-02-07  
**Version:** 1.0  
**Status:** Complete
