# Environment Healthcheck Endpoint

Quick reference for using the `/api/health/env` endpoint.

## Quick Start

### Prerequisites

- Authenticated as admin or clinician user
- Valid JWT token from authentication

### Using PowerShell

```powershell
# Run the verification script
.\scripts\verify-healthcheck.ps1

# Or manually with your token
$headers = @{ "Authorization" = "Bearer YOUR_TOKEN_HERE" }
Invoke-RestMethod -Uri "http://localhost:3000/api/health/env" -Headers $headers
```

### Using cURL

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/health/env
```

## Expected Response

### All Checks Pass (GREEN Status)

```json
{
  "success": true,
  "data": {
    "healthcheckVersion": "1.0.0",
    "status": "GREEN",
    "checks": [
      {
        "name": "NEXT_PUBLIC_SUPABASE_URL",
        "ok": true,
        "message": "Valid URL format"
      },
      {
        "name": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "ok": true,
        "message": "Valid key format"
      },
      {
        "name": "SUPABASE_SERVICE_ROLE_KEY",
        "ok": true,
        "message": "Valid key format"
      },
      {
        "name": "Database Connectivity",
        "ok": true,
        "message": "Successfully connected to database"
      }
    ],
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-01-02T19:00:00.000Z"
  }
}
```

### Checks Fail (RED Status)

```json
{
  "success": true,
  "data": {
    "healthcheckVersion": "1.0.0",
    "status": "RED",
    "checks": [
      {
        "name": "NEXT_PUBLIC_SUPABASE_URL",
        "ok": false,
        "message": "Contains leading/trailing whitespace",
        "hint": "Remove spaces before/after the URL value"
      },
      {
        "name": "Database Connectivity",
        "ok": false,
        "message": "Schema drift detected",
        "hint": "Table \"pillars\" does not exist - run migrations or verify schema"
      }
      // ... more checks
    ],
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-01-02T19:00:00.000Z"
  }
}
```

**Note**: The endpoint returns HTTP 200 even with RED status. Only auth failures return 401/403.

## Common Issues

### Issue: 401 Unauthorized

**Cause**: Not authenticated or token expired  
**Fix**: Login again and get fresh token

### Issue: 403 Forbidden

**Cause**: User doesn't have admin/clinician role  
**Fix**: Login with admin/clinician account

### Issue: Check fails with "Invalid URL format"

**Cause**: NEXT_PUBLIC_SUPABASE_URL is not a valid URL  
**Fix**: Check `.env.local` and ensure URL is correct (e.g., `https://xxx.supabase.co`)

### Issue: Check fails with "Contains leading/trailing whitespace"

**Cause**: Environment variable has spaces before/after value  
**Fix**: Remove spaces in `.env.local` and restart server

### Issue: Check fails with "Invalid key format"

**Cause**: API key is too short or has invalid characters  
**Fix**: Verify you copied the complete key from Supabase dashboard

### Issue: Database connectivity fails

**Cause**: Cannot connect to database  
**Fix**:

1. Verify Supabase URL is correct
2. Verify API keys are valid
3. Check network connectivity
4. Check Supabase project status

### Issue: Schema drift detected

**Cause**: Database table `pillars` does not exist  
**Fix**: Run migrations with `npm run db:reset` or `supabase db reset`

### Issue: Invalid API key error

**Cause**: Permission denied (42501 error code)  
**Fix**: Verify SUPABASE_SERVICE_ROLE_KEY is correct and has proper permissions

## Testing

```bash
# Run endpoint tests
npm test -- app/api/health/env

# Run all tests
npm test

# Build verification
npm run build
```

## Documentation

See `docs/TV05_03_HEALTHCHECK_IMPLEMENTATION.md` for detailed documentation.
