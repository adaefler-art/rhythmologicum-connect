# Pillars/Catalog Source-of-Truth Audit (TV05_01B)

## Overview

The Pillars/Catalog Source-of-Truth (SOT) Audit endpoint provides a comprehensive, PHI-free diagnostic view of the application's funnel catalog infrastructure. It allows administrators and clinicians to verify:

- Supabase connection and configuration
- Table existence (`pillars`, `funnels_catalog`, `funnel_versions`)
- Table metadata (type, RLS status, policy counts)
- Row counts and seed data verification
- Stress funnel presence

## Endpoint

**URL**: `GET /api/admin/diagnostics/pillars-sot`

**Authentication**: Required (Admin or Clinician role)

**Response Format**: JSON (PHI-free, machine-readable)

### Example Response

```json
{
  "success": true,
  "data": {
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
        "metadata": {
          "exists": true,
          "relkind": "r",
          "relrowsecurity": true,
          "policyCount": 3
        },
        "rowCount": 5
      },
      "funnel_versions": {
        "metadata": {
          "exists": true,
          "relkind": "r",
          "relrowsecurity": true,
          "policyCount": 2
        },
        "rowCount": 3
      }
    },
    "seeds": {
      "stressFunnelPresent": true,
      "pillarCount": 7,
      "expectedPillarCount": 7
    },
    "generatedAt": "2026-01-02T12:00:00.000Z"
  }
}
```

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

### 🔴 "Table does not exist"

**Symptom**: `tables.pillars.metadata.exists = false` (or other tables)

**Cause**: Database migrations have not been run or migration failed

**Fix**:
1. Check Supabase migration status:
   ```bash
   supabase db status
   ```

2. Run missing migrations:
   ```bash
   supabase db push
   ```

3. Verify migration `20251231142000_create_funnel_catalog.sql` was applied

4. If using Supabase hosted instance, ensure migrations are deployed via Supabase CLI or dashboard

### 🔴 "Missing environment variables"

**Symptom**: `environment.hasSupabaseServiceRoleKey = false` or `hasSupabaseAnonKey = false`

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

### 🔴 "Seed data missing"

**Symptom**: `seeds.stressFunnelPresent = false` or `seeds.pillarCount != 7`

**Cause**: Seed data was not properly inserted by migrations

**Fix**:
1. Check if migrations completed successfully
2. Manually verify in Supabase Dashboard:
   ```sql
   -- Check pillars
   SELECT * FROM public.pillars;
   
   -- Check stress funnel
   SELECT * FROM public.funnels_catalog WHERE slug = 'stress-assessment';
   ```

3. If missing, re-run migration:
   ```bash
   supabase db reset  # ⚠️ WARNING: Destructive in local dev only
   ```

4. For production, manually insert seed data via Supabase dashboard or create a data fix migration

### 🔴 "RLS policies missing"

**Symptom**: `tables.*.metadata.policyCount = 0` for tables that should have policies

**Cause**: RLS migration not applied or policies were dropped

**Fix**:
1. Check RLS status in Supabase Dashboard → Database → Tables → [table] → Policies
2. Verify migration `20251231093345_v05_i01_3_versioning_contract.sql` was applied
3. Re-apply RLS policies if missing:
   ```bash
   supabase db push --include-all
   ```

### 🔴 "401 Unauthorized" when calling endpoint

**Symptom**: API returns 401 status

**Cause**: User is not authenticated

**Fix**:
1. Ensure you are logged in to the application
2. Check Supabase auth token in browser cookies (Application → Cookies → sb-*)
3. Try logging out and logging back in

### 🔴 "403 Forbidden" when calling endpoint

**Symptom**: API returns 403 status

**Cause**: User is authenticated but does not have admin/clinician role

**Fix**:
1. Verify user role in Supabase Dashboard → Authentication → Users
2. User must have `app_metadata.role` set to `"admin"` or `"clinician"`
3. Update user role using Supabase SQL:
   ```sql
   -- In Supabase SQL Editor
   UPDATE auth.users
   SET raw_app_meta_data = jsonb_set(
     COALESCE(raw_app_meta_data, '{}'::jsonb),
     '{role}',
     '"clinician"'
   )
   WHERE email = 'your-email@example.com';
   ```

### 🔴 "Supabase project URL not set"

**Symptom**: `environment.supabaseUrl = "NOT_SET"`

**Cause**: `NEXT_PUBLIC_SUPABASE_URL` environment variable is missing

**Fix**: See "Missing environment variables" above

### 🟡 "Wrong Supabase project"

**Symptom**: Endpoint returns data but it's for the wrong project/environment

**Cause**: Environment variables point to incorrect Supabase project

**Fix**:
1. Check `environment.supabaseUrl` in response - verify it matches expected project
2. Update environment variables to point to correct Supabase project
3. For Vercel, ensure correct environment (Production/Preview/Development) variables are set

## Implementation Details

### Files
- **Endpoint**: `app/api/admin/diagnostics/pillars-sot/route.ts`
- **Tests**: `app/api/admin/diagnostics/pillars-sot/__tests__/route.test.ts`
- **Verification Script**: `scripts/verify-pillars-sot-audit.ps1`
- **Documentation**: `docs/PILLARS_SOT_AUDIT.md` (this file)

### Security
- Server-only endpoint (cannot be called from browser)
- Requires authentication (enforced via middleware)
- Requires admin or clinician role
- Response is PHI-free (no user data, only system metadata)
- Supabase URL is redacted to domain only
- API keys are returned as boolean flags only (not actual values)

### Dependencies
- Uses `createAdminSupabaseClient` for unrestricted database access
- Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Bypasses RLS (necessary to query system tables)

## Testing

Run the test suite:

```bash
npm test -- app/api/admin/diagnostics/pillars-sot/__tests__/route.test.ts
```

Tests cover:
- Authentication and authorization
- Successful audit data retrieval
- Missing tables handling
- PHI compliance (no sensitive data in response)
- URL redaction
- API key exposure prevention
- Response schema stability

## Integration

This endpoint can be integrated into:
- Admin dashboards for system health monitoring
- CI/CD pipelines for deployment verification
- Diagnostic tools for support staff
- Automated alerts for missing seed data

### Example Usage in CI/CD

```bash
# In a GitHub Actions workflow or similar
response=$(curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-app.vercel.app/api/admin/diagnostics/pillars-sot)

# Check if pillars table exists
pillars_exists=$(echo $response | jq '.data.tables.pillars.metadata.exists')

if [ "$pillars_exists" != "true" ]; then
  echo "❌ Pillars table missing - deployment failed"
  exit 1
fi

# Check if seed data is present
stress_present=$(echo $response | jq '.data.seeds.stressFunnelPresent')

if [ "$stress_present" != "true" ]; then
  echo "⚠️  Warning: Stress funnel seed data missing"
fi
```

## Related Issues
- **TV05_01B**: Pillar/Catalog Source-of-Truth Audit implementation
- Related migrations: `20251231142000_create_funnel_catalog.sql`, `20251231145000_fix_catalog_schema.sql`

## Changelog
- **2026-01-02**: Initial implementation (TV05_01B)
