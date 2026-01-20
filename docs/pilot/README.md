# Pilot Documentation

This directory contains documentation specific to the pilot phase of Rhythmologicum Connect.

## Available Documents

### [EXPORTS.md](./EXPORTS.md)

**Data Export for Pilot Evaluation (E6.4.8)**

Comprehensive documentation for exporting patient data and reports for pilot evaluation and analysis.

**Contents:**
- Patient Measures Export API (`/api/patient-measures/export`)
- Report PDF Download API (`/api/reports/[reportId]/pdf`)
- Data minimization and PHI protection strategies
- GDPR compliance mapping
- PowerShell usage examples
- Testing and verification guides
- Troubleshooting

**Key Features:**
- JSON export of patient measures, scores, and consents
- Time-limited signed URLs for PDF downloads
- RBAC enforcement (patients see own data, clinicians see assigned patients)
- PHI-free exports (only scores, UUIDs, and metadata)

---

## Pilot Evaluation Resources

### Verification Script

Located at: `scripts/verify/verify-pilot-exports.ps1`

**Usage:**
```powershell
# Set authentication cookie
$env:PILOT_AUTH_COOKIE = "sb-localhost-auth-token=YOUR_COOKIE_HERE"

# Run verification
.\scripts\verify\verify-pilot-exports.ps1

# With custom parameters
.\scripts\verify\verify-pilot-exports.ps1 -BaseUrl "http://localhost:3000" -Cookie "YOUR_COOKIE" -ReportId "uuid-of-report"
```

**Tests:**
1. Patient measures export (authenticated)
2. Patient measures export (unauthenticated - expect 401)
3. PDF download (if ReportId provided)
4. PDF download with invalid UUID (expect 404)

---

## Quick Start

### 1. Export Patient Data

```powershell
# PowerShell
$headers = @{ "Cookie" = "sb-localhost-auth-token=YOUR_COOKIE" }
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/patient-measures/export" -Method Get -Headers $headers

# Save to file
$response | ConvertTo-Json -Depth 10 | Out-File "export.json"
```

### 2. Download PDF Report

```powershell
# PowerShell
$reportId = "YOUR_REPORT_UUID"
$headers = @{ "Cookie" = "sb-localhost-auth-token=YOUR_COOKIE" }
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/$reportId/pdf" -Method Get -Headers $headers

# Download PDF
Invoke-WebRequest -Uri $response.data.url -OutFile "report.pdf"
```

---

## Data Privacy & Security

All export endpoints follow strict data minimization:

✅ **Included:**
- Normalized scores (0-100 scale)
- Risk levels (low/moderate/high)
- Timestamps (ISO 8601)
- UUIDs (patient_id, user_id, report_id)
- AMY interpretations (de-identified)
- Consent audit trails

❌ **Excluded:**
- Raw assessment answers
- Patient names, emails, phone numbers
- Addresses or detailed location data
- Government IDs or SSNs
- Detailed medical history

---

## Support

For questions or issues:

1. **Technical Issues:** See troubleshooting section in EXPORTS.md
2. **Security Concerns:** Report via secure channel (not public issues)
3. **Pilot Coordination:** Contact clinical team

---

**Last Updated:** 2026-01-15  
**Issue Reference:** E6.4.8 — Data Export for Pilot Evaluation
