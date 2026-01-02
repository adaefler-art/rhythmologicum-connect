# Pillars/Catalog Source-of-Truth Audit (TV05_01B)

## Overview

The Pillars/Catalog Source-of-Truth (SOT) Audit endpoint provides a comprehensive, PHI-free diagnostic view of the application's funnel catalog infrastructure. It allows administrators and clinicians to verify:

- Supabase connection and configuration
- Table existence (`pillars`, `funnels_catalog`, `funnel_versions`)
- Table metadata (type, RLS status, policy counts)
- Row counts and seed data verification
- Stress funnel presence

**Key Features**:
- Uses secure RPC function for metadata queries (production-ready)
- Returns status codes: GREEN, YELLOW, RED with detailed findings
- PHI-free and deterministic responses
- Includes requestId for troubleshooting

## Endpoint

**URL**: `GET /api/admin/diagnostics/pillars-sot`

**Authentication**: Required (Admin or Clinician role)

**Response Format**: JSON (PHI-free, machine-readable, versioned schema)

### Example Response

```json
{
  "success": true,
  "data": {
    "diagnosticsVersion": "1.0.0",
    "status": "GREEN",
    "findings": [],
    "environment": {
      "supabaseUrl": "https://project.supabase.co",
      "envName": "production",
      "hasSupabaseServiceRoleKey": true,
      "hasSupabaseAnonKey": true
    },
    "tables": {
      "pillars": {
        "metadata": {
          "exists": true,
          "relkind": "r",
          "relrowsecurity": true,
          "policyCount": 1
        },
        "rowCount": 7
      },
      "funnels_catalog": {
        "metadata": { "exists": true, "relkind": "r", "relrowsecurity": true, "policyCount": 3 },
        "rowCount": 5
      },
      "funnel_versions": {
        "metadata": { "exists": true, "relkind": "r", "relrowsecurity": true, "policyCount": 2 },
        "rowCount": 3
      }
    },
    "seeds": {
      "stressFunnelPresent": true,
      "pillarCount": 7,
      "expectedPillarCount": 7
    },
    "generatedAt": "2026-01-02T12:00:00.000Z",
    "requestId": "abc-123-def-456"
  }
}
```

### Response Status Codes

- **GREEN**: All checks passed, system healthy
- **YELLOW**: Warnings present (e.g., seed data incomplete), system functional
- **RED**: Errors present (e.g., tables missing, RPC failure), system degraded

## Verification

Use the provided PowerShell script to verify the implementation:

```powershell
# Full verification (tests + build + checks)
.\scripts\verify-pillars-sot-audit.ps1

# Skip build if environment variables are not set
.\scripts\verify-pillars-sot-audit.ps1 -SkipBuild

# Skip tests during quick checks
.\scripts\verify-pillars-sot-audit.ps1 -SkipTests

# Enable debug output
.\scripts\verify-pillars-sot-audit.ps1 -Debug
```

## Troubleshooting

### 🔴 "RPC_FUNCTION_ERROR"

**Symptom**: `status: "RED"`, finding with code `RPC_FUNCTION_ERROR`

**Cause**: Database function `diagnostics_pillars_sot` does not exist or failed to execute

**Fix**:
1. Check if migration has been applied:
   ```powershell
   supabase db status
   ```

2. Apply the migration:
   ```powershell
   supabase db push
   ```

3. Verify the migration file exists:
   - `supabase/migrations/20260102140000_create_diagnostics_pillars_sot_function.sql`

4. If using Supabase hosted instance, ensure migrations are deployed via Supabase CLI or dashboard

### 🔴 "TABLE_MISSING_PILLARS" / "TABLE_MISSING_CATALOG" / "TABLE_MISSING_VERSIONS"

**Symptom**: `status: "RED"`, findings indicate tables don't exist

**Cause**: Database migrations have not been run or migration failed

**Fix**:

1. Check Supabase migration status:
   ```powershell
   supabase db status
   ```

2. Run missing migrations:
   ```powershell
   supabase db push
   ```

3. Verify key migrations were applied:
   - `20251231142000_create_funnel_catalog.sql` (creates pillars table)
   - `20251230211228_v05_core_schema_jsonb_fields.sql` (creates catalog/versions)

### 🔴 "MISSING_SERVICE_ROLE_KEY" / "MISSING_ANON_KEY"

**Symptom**: `status: "RED"`, `hasSupabaseServiceRoleKey: false` or `hasSupabaseAnonKey: false`

**Cause**: Required environment variables not set

**Fix**:

**For Vercel deployment**:
1. Go to Vercel project settings → Environment Variables
2. Add missing variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy

**For local development**:
1. Copy `.env.example` to `.env.local`
2. Fill in Supabase project values
3. Restart dev server

### 🟡 "SEED_PILLAR_COUNT_MISMATCH"

**Symptom**: `status: "YELLOW"`, pillar count doesn't match expected (7)

**Cause**: Seed data was not properly inserted by migrations

**Fix**:
1. Check current pillar count in response: `data.seeds.pillarCount`
2. Manually verify in Supabase Dashboard:
   ```sql
   SELECT * FROM public.pillars;
   ```

3. If missing, re-run migration:
   ```powershell
   # ⚠️ WARNING: Destructive in local dev only
   supabase db reset
   ```

4. For production, manually insert seed data via Supabase dashboard or create a data fix migration

### 🟡 "SEED_STRESS_FUNNEL_MISSING"

**Symptom**: `status: "YELLOW"`, stress funnel not found in catalog

**Cause**: Canonical stress funnel (`slug: 'stress-assessment'`) missing from funnels_catalog

**Fix**:
1. Verify slug in registry: Should be `FUNNEL_SLUG.STRESS_ASSESSMENT` = `'stress-assessment'`
2. Re-run migration `20251231142000_create_funnel_catalog.sql`
3. Check for typos in slug (must be exact match)

### 🟡 "RLS_POLICIES_MISSING_PILLARS"

**Symptom**: `status: "YELLOW"`, `policyCount: 0` for tables that should have policies

**Cause**: RLS migration not applied or policies were dropped

**Fix**:
1. Check RLS status in Supabase Dashboard → Database → Tables → [table] → Policies
2. Verify migration `20251231093345_v05_i01_3_versioning_contract.sql` was applied
3. Re-apply RLS policies if missing:
   ```powershell
   supabase db push --include-all
   ```

### 🔴 "401 Unauthorized"

**Symptom**: API returns 401 status

**Cause**: User is not authenticated

**Fix**:
1. Ensure you are logged in to the application
2. Check Supabase auth token in browser cookies (Application → Cookies → sb-*)
3. Try logging out and logging back in

### 🔴 "403 Forbidden"

**Symptom**: API returns 403 status

**Cause**: User is authenticated but does not have admin/clinician role

**Fix**:
1. Verify user role in Supabase Dashboard → Authentication → Users
2. User must have `app_metadata.role` set to `"admin"` or `"clinician"`
3. Update user role using Supabase SQL Editor:
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = jsonb_set(
     COALESCE(raw_app_meta_data, '{}'::jsonb),
     '{role}',
     '"clinician"'
   )
   WHERE email = 'your-email@example.com';
   ```

### 🔴 "Wrong Supabase project"

**Symptom**: Endpoint returns data but it's for the wrong project/environment

**Cause**: Environment variables point to incorrect Supabase project

**Fix**:
1. Check `environment.supabaseUrl` in response - verify it matches expected project
2. Update environment variables to point to correct Supabase project
3. For Vercel, ensure correct environment (Production/Preview/Development) variables are set

## Implementation Details

### Files
- **Endpoint**: `app/api/admin/diagnostics/pillars-sot/route.ts`
- **Tests**: `app/api/admin/diagnostics/pillars-sot/__tests__/route.test.ts` (12 tests)
- **Migration**: `supabase/migrations/20260102140000_create_diagnostics_pillars_sot_function.sql`
- **Verification Script**: `scripts/verify-pillars-sot-audit.ps1`
- **Documentation**: `docs/PILLARS_SOT_AUDIT.md` (this file)

### Security
- Server-only endpoint (cannot be called from browser)
- Requires authentication (enforced via middleware)
- Requires admin or clinician role
- Response is PHI-free (no user data, only system metadata)
- Supabase URL is redacted to domain only (no project refs or query params)
- API keys are returned as boolean flags only (not actual values)
- Uses SECURITY DEFINER RPC function for safe pg_* access

### Database Function
- **Function**: `public.diagnostics_pillars_sot()`
- **Returns**: JSONB with table metadata
- **Security**: SECURITY DEFINER (runs with elevated privileges to query pg_* catalogs)
- **Permissions**: Granted to `authenticated` role (API enforces admin/clinician check)

### Deterministic Seed Checks
- Uses canonical values from `@/lib/contracts/registry`:
  - `FUNNEL_SLUG.STRESS_ASSESSMENT` = `'stress-assessment'`
  - `PILLAR_KEY` = 7 canonical pillars
- No hard-coded strings in seed verification
- Registry-based approach prevents "fantasy names"

## Testing

Run the test suite:

```powershell
npm test -- app/api/admin/diagnostics/pillars-sot/__tests__/route.test.ts
```

Tests cover:
- Authentication and authorization (401/403)
- Status codes (GREEN/YELLOW/RED)
- RPC function usage
- Missing tables handling
- Seed data verification
- PHI compliance (no sensitive data exposure)
- URL redaction
- Secret exposure prevention
- Response schema stability with version
- Deterministic seed checks using registry

## Integration

This endpoint can be integrated into:
- Admin dashboards for system health monitoring
- CI/CD pipelines for deployment verification
- Diagnostic tools for support staff
- Automated alerts for missing seed data

### Example Usage in CI/CD (PowerShell)

```powershell
# In a CI pipeline
$response = Invoke-RestMethod -Uri "https://your-app.vercel.app/api/admin/diagnostics/pillars-sot" `
  -Headers @{ "Authorization" = "Bearer $authToken" }

# Check status
if ($response.data.status -eq "RED") {
  Write-Error "❌ Deployment failed: $($response.data.findings.Count) errors found"
  exit 1
}

if ($response.data.status -eq "YELLOW") {
  Write-Warning "⚠️ Deployment warning: $($response.data.findings.Count) warnings found"
}

# Check specific conditions
if (-not $response.data.seeds.stressFunnelPresent) {
  Write-Warning "⚠️ Stress funnel seed data missing"
}

Write-Host "✓ Deployment health check passed (requestId: $($response.data.requestId))"
```

## Related Issues
- **TV05_01B**: Pillar/Catalog Source-of-Truth Audit implementation
- Related migrations:
  - `20251231142000_create_funnel_catalog.sql` (pillars table + seed)
  - `20260102140000_create_diagnostics_pillars_sot_function.sql` (RPC function)

## Changelog
- **2026-01-02 (v2)**: 
  - Added RPC function for production-ready pg_* access
  - Added status codes (GREEN/YELLOW/RED) with findings
  - Added `diagnosticsVersion` field for schema stability
  - Added `requestId` for troubleshooting
  - Switched to registry-based seed checks
  - Fixed secret leak prevention (tests use REDACTED)
  - Enhanced error semantics (200 with RED status instead of 500 for missing tables)
- **2026-01-02 (v1)**: Initial implementation
