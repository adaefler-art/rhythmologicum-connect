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

### All Checks Pass

```json
{
  "success": true,
  "data": {
    "checks": [
      {
        "name": "NEXT_PUBLIC_SUPABASE_URL",
        "pass": true,
        "message": "Valid URL format"
      },
      {
        "name": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "pass": true,
        "message": "Valid key format"
      },
      {
        "name": "SUPABASE_SERVICE_ROLE_KEY",
        "pass": true,
        "message": "Valid key format"
      },
      {
        "name": "Database Connectivity",
        "pass": true,
        "message": "Successfully connected to database"
      }
    ],
    "overallStatus": "pass",
    "timestamp": "2026-01-02T18:43:14.296Z"
  }
}
```

### Checks Fail

```json
{
  "success": true,
  "data": {
    "checks": [
      {
        "name": "NEXT_PUBLIC_SUPABASE_URL",
        "pass": false,
        "message": "Contains leading/trailing whitespace"
      },
      // ... more checks
    ],
    "overallStatus": "fail",
    "timestamp": "2026-01-02T18:43:14.296Z"
  }
}
```

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
