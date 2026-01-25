# RLS Policy Verification (R-DB-009)

## Overview

The `verify-rls-policies.ps1` script provides automated enforcement of the R-DB-009 guardrail: "All tables containing user data must have Row Level Security (RLS) enabled with appropriate policies for patient/clinician roles."

This script is integrated into the `db-determinism.yml` CI workflow and runs on every database migration change.

## Implementation Details

### Detection Heuristic

Tables are classified as "user data tables" if they contain either:
- A column named `patient_id`, OR
- A column named `user_id`

System schemas are automatically excluded: `pg_catalog`, `information_schema`, `auth`, `storage`, `extensions`, `graphql`, `vault`, `realtime`

### Verification Checks

For each detected user data table, the script verifies:

1. **RLS Enabled**: Checks `pg_class.relrowsecurity = true`
2. **Patient Policy Exists**: Verifies at least one policy exists that is patient-oriented
   - Checks if policy name contains "patient" (case-insensitive), OR
   - Checks if policy is applied to roles matching the configured patient role name

**Note**: The default schema uses policy names like "Patients can view own assessments" applied to the "authenticated" role, so the script primarily looks for the "patient" keyword in policy names.

### Allowlist Mechanism

Tables can be explicitly allowlisted in `docs/canon/rls-allowlist.json` if they:
- Contain public metadata (no user-specific data)
- Are system tables with RLS handled differently
- Have a documented security exception

**Allowlist Format:**
```json
{
  "_comment": "RLS Allowlist for R-DB-009 Verification",
  "entries": [
    {
      "table": "public.content_pages",
      "reason": "Public metadata - no user-specific data"
    }
  ]
}
```

## Usage

### Local Execution

```powershell
# Run verification against local Supabase instance
pwsh -File scripts/db/verify-rls-policies.ps1

# Specify custom parameters
pwsh -File scripts/db/verify-rls-policies.ps1 `
  -AllowlistPath "docs/canon/rls-allowlist.json" `
  -OutputDir "artifacts/rls-verify" `
  -PatientRoleName "patient"
```

**Prerequisites:**
- Local Supabase instance running (`supabase start`)
- PowerShell 7+
- Docker (for database access)

### CI Integration

The script runs automatically in the `db-determinism.yml` workflow:

```yaml
- name: Verify RLS policies on user data tables
  run: |
    echo "🔒 Verifying RLS policies (R-DB-009)..."
    pwsh -File scripts/db/verify-rls-policies.ps1
    echo "✅ RLS policies verified"

- name: Upload RLS verification artifacts
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: rls-verification
    path: artifacts/rls-verify/
    retention-days: 30
```

## Output Artifacts

The script generates two evidence files in `artifacts/rls-verify/`:

### 1. JSON Summary (`rls-summary.json`)

Machine-readable format with detailed per-table records:

```json
{
  "timestamp": "2026-01-25T06:34:41.316Z",
  "rule": "R-DB-009",
  "description": "RLS policies required on user data tables",
  "patientRoleName": "patient",
  "allowlistPath": "docs/canon/rls-allowlist.json",
  "summary": {
    "totalTablesChecked": 25,
    "allowlistedTables": 12,
    "violations": 0,
    "passed": true
  },
  "tables": [
    {
      "schema": "public",
      "table": "assessments",
      "classification": {
        "matchedColumns": ["patient_id"],
        "source": "heuristic"
      },
      "rlsEnabled": true,
      "policies": [
        {
          "policyName": "Patients can read own assessments",
          "roles": "{patient}",
          "cmd": "SELECT"
        }
      ],
      "allowlisted": false
    }
  ],
  "violations": []
}
```

### 2. Text Summary (`rls-summary.txt`)

Human-readable format for quick review:

```
RLS Policy Verification Report (R-DB-009)
==========================================
Generated: 2026-01-25 06:34:41
Patient Role: patient
Allowlist: docs/canon/rls-allowlist.json

Summary
-------
Total tables checked: 25
Allowlisted tables: 12
Violations: 0
Result: PASS ✅

Tables Checked
--------------
public.assessments
  Matched columns: patient_id
  RLS enabled: True
  Policies: 3
  Status: PASS
```

## Exit Codes

- **0**: All checks passed (no violations)
- **1**: Violations detected OR script error (fail-closed)

## Fail-Closed Behavior

The script is designed to **fail-closed** on unexpected errors:
- Database connection failures → exit 1
- Invalid allowlist format → exit 1
- Missing allowlist file → exit 1
- Query execution errors → exit 1

This ensures security violations are not silently ignored due to infrastructure issues.

## Known Limitations

1. **Heuristic Detection**: Only detects tables with `patient_id`/`user_id` columns. Tables with user data but different column names must be added to allowlist or will be missed.

2. **Policy Existence Check**: Verifies that at least one patient-oriented policy exists (by name pattern or role), but does NOT validate:
   - Policy correctness (proper WHERE clauses, etc.)
   - Policy completeness (all CRUD operations covered)
   - Policy security (no privilege escalation)

3. **Policy Name Pattern**: The script looks for "patient" in policy names (case-insensitive). If policies use different naming conventions, they may not be detected.

4. **Role Name Coupling**: Default patient role name is "patient" but can be configured via parameter. The current schema uses "authenticated" role with patient-filtering logic in the policy WHERE clauses.

## Troubleshooting

### "No running container matching name=supabase_db_"

**Cause**: Local Supabase instance is not running.

**Fix**: Run `supabase start` before executing the script.

### "Allowlist file not found"

**Cause**: The allowlist path is incorrect or the file doesn't exist.

**Fix**: Ensure `docs/canon/rls-allowlist.json` exists or specify correct path with `-AllowlistPath`.

### "Invalid allowlist format: missing 'entries' field"

**Cause**: The allowlist JSON is malformed.

**Fix**: Validate the JSON structure matches the required format (must have `entries` array).

### False Positives

If a public metadata table is flagged as a violation:

1. Verify it truly contains no user-specific data
2. Add it to the allowlist with a documented reason
3. Re-run the script to confirm it's skipped

## Maintenance

### Quarterly Allowlist Review

The allowlist should be reviewed quarterly to:
- Remove entries for deleted tables
- Re-evaluate if allowlisted tables still qualify
- Update reasons to reflect current architecture

### Updating the Heuristic

To add additional detection columns (e.g., `clinic_id`):

1. Update the SQL query in `verify-rls-policies.ps1`:
   ```sql
   AND c.column_name IN ('patient_id', 'user_id', 'clinic_id')
   ```

2. Document the change in this README
3. Update `RULES_VS_CHECKS_MATRIX.md` scope section

## References

- **Guardrail Rule**: `docs/guardrails/RULES_VS_CHECKS_MATRIX.md` (R-DB-009)
- **Implementation Issue**: E72.ALIGN.P0.DBSEC.001
- **CI Workflow**: `.github/workflows/db-determinism.yml`
- **Allowlist**: `docs/canon/rls-allowlist.json`

---

**Last Updated**: 2026-01-25  
**Owner**: E72 / Database Team / Security
