# Pilot KPIs Quick Reference

**Issue:** E6.4.9 — Pilot Telemetry/KPIs  
**For:** Admins & Clinicians monitoring pilot operations

---

## Quick Access

### Get Pilot KPIs

```bash
# All-time metrics
curl -H "Cookie: sb-localhost-auth-token=YOUR_ADMIN_COOKIE" \
  https://your-domain.com/api/admin/pilot/kpis

# Metrics for specific date range
curl -H "Cookie: sb-localhost-auth-token=YOUR_ADMIN_COOKIE" \
  "https://your-domain.com/api/admin/pilot/kpis?since=2026-01-01T00:00:00Z&until=2026-01-31T23:59:59Z"
```

### What You Get

```json
{
  "success": true,
  "data": {
    "kpis": {
      "funnelMetrics": {
        "totalStarts": 100,
        "totalCompletes": 75,
        "completionRate": 75,
        "byFunnelSlug": {
          "stress": { "starts": 100, "completes": 75, "completionRate": 75 }
        }
      },
      "reviewMetrics": {
        "totalReviews": 20,
        "approved": 15,
        "rejected": 3,
        "changesRequested": 2,
        "pending": 0
      },
      "supportCaseMetrics": {
        "totalCases": 5,
        "open": 2,
        "inProgress": 1,
        "resolved": 2,
        "closed": 0,
        "escalated": 1
      },
      "workupMetrics": {
        "totalWorkups": 50,
        "needsMoreData": 10,
        "readyForReview": 40
      }
    }
  }
}
```

---

## Key Metrics to Monitor

### ✅ Success Criteria

1. **Funnel Completion Rate**: ≥ 60%
   - `(totalCompletes / totalStarts) * 100`
   - Red flag if < 50%

2. **Review Decisions**: ≥ 10 total
   - Indicates clinician engagement
   - Red flag if 0

3. **Support Cases**: ≥ 1 case
   - Shows support workflow is working
   - Red flag if escalation rate > 50%

4. **Workup Success**: ≥ 80% ready for review
   - `(readyForReview / totalWorkups) * 100`
   - Red flag if > 30% need more data

---

## PowerShell Helper

```powershell
# Set your admin cookie once
$env:PILOT_ADMIN_COOKIE = "sb-localhost-auth-token=YOUR_COOKIE_HERE"

# Get KPIs function
function Get-PilotKPIs {
    param([string]$BaseUrl = "http://localhost:3000")
    
    $headers = @{ "Cookie" = $env:PILOT_ADMIN_COOKIE }
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/pilot/kpis" -Headers $headers
    
    Write-Host "=== Pilot KPIs ===" -ForegroundColor Cyan
    Write-Host "Funnel Completion: $($response.data.kpis.funnelMetrics.completionRate)%" -ForegroundColor $(if ($response.data.kpis.funnelMetrics.completionRate -ge 60) { "Green" } else { "Yellow" })
    Write-Host "Review Decisions: $($response.data.kpis.reviewMetrics.totalReviews)" -ForegroundColor $(if ($response.data.kpis.reviewMetrics.totalReviews -ge 10) { "Green" } else { "Yellow" })
    Write-Host "Support Cases: $($response.data.kpis.supportCaseMetrics.totalCases)" -ForegroundColor $(if ($response.data.kpis.supportCaseMetrics.totalCases -ge 1) { "Green" } else { "Yellow" })
    
    return $response.data.kpis
}

# Usage
Get-PilotKPIs
Get-PilotKPIs -BaseUrl "https://your-production-domain.com"
```

---

## Troubleshooting

### 401 Unauthorized
- Check cookie is valid: `sb-localhost-auth-token=...`
- Verify session hasn't expired
- Re-login and get new cookie

### 403 Forbidden
- User must have `admin` or `clinician` role
- Check `app_metadata.role` in Supabase auth

### Empty Metrics (All 0s)
- No pilot activity yet, or
- Time range filters exclude all data, or
- Database migration not applied (check `pilot_flow_events` table exists)

---

## Related Endpoints

- **Flow Events**: `/api/admin/pilot/flow-events` - Detailed event log
- **Usage Telemetry**: `/api/admin/usage` - Route-level usage tracking
- **Patient Export**: `/api/patient-measures/export` - PHI-safe data export

---

## Documentation

- **Full Docs**: `docs/pilot/CRITICAL_ENDPOINTS.md`
- **Implementation**: `E6_4_9_IMPLEMENTATION_SUMMARY.md`
- **Verification**: Run `verify-e6-4-9-pilot-kpis.ps1`

---

**Last Updated:** 2026-01-15  
**Status:** ✅ Ready for Pilot
