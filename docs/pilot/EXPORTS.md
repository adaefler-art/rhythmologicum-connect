# Pilot Evaluation — Data Export Documentation

**Version:** 1.0  
**Last Updated:** 2026-01-15  
**Issue:** E6.4.8 — Data Export for Pilot Evaluation

---

## Overview

This document describes the data export endpoints available for pilot evaluation and analysis. These endpoints provide structured access to patient measures, reports, and PDF downloads with proper PHI protection and data minimization strategies.

### Purpose

After the pilot phase, evaluable artifacts are required for:
- Clinical outcome analysis
- System performance assessment
- Patient journey validation
- Regulatory documentation
- Quality assurance

---

## Export Endpoints

### 1. Patient Measures Export

**Endpoint:** `GET /api/patient-measures/export`

**Purpose:** Export all patient measures, scores, and consent data for a specific patient in JSON format.

#### Authentication

- **Required:** Yes (Bearer Token or Session Cookie)
- **Authorization:** Patient can only export their own data
- **Method:** Automatic via browser session or Authorization header

#### Request

```bash
# Via curl with Authorization header
curl -X GET "http://localhost:3000/api/patient-measures/export" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Via PowerShell (using session cookie)
$headers = @{
    "Cookie" = "sb-localhost-auth-token=YOUR_SESSION_COOKIE"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/patient-measures/export" `
    -Method Get -Headers $headers
```

#### Response Format

```json
{
  "export_date": "2026-01-15T09:00:00.000Z",
  "patient_id": "uuid-of-patient-profile",
  "user_id": "uuid-of-auth-user",
  "total_count": 3,
  "measures": [
    {
      "measure_id": "uuid-of-measure",
      "patient_id": "uuid-of-patient-profile",
      "measured_at": "2026-01-15T08:30:00.000Z",
      "stress_score": 65,
      "sleep_score": 72,
      "risk_level": "moderate",
      "report_id": "uuid-of-report",
      "scores": {
        "stress_score": 65,
        "sleep_score": 72
      },
      "report_assessment_id": "uuid-of-assessment",
      "amy_interpretation": "Ihre Stresswerte liegen im moderaten Bereich...",
      "report_created_at": "2026-01-15T08:31:00.000Z"
    }
  ],
  "consents": [
    {
      "consent_id": "uuid-of-consent",
      "consent_version": "1.0.0",
      "consented_at": "2026-01-15T07:00:00.000Z",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0 ..."
    }
  ],
  "consents_count": 1
}
```

#### Field Descriptions

**Root Level:**
- `export_date` (ISO 8601): Timestamp when export was generated
- `patient_id` (UUID): Patient profile identifier
- `user_id` (UUID): Auth user identifier (from auth.users)
- `total_count` (number): Number of measures in export
- `measures` (array): Array of patient measure objects
- `consents` (array): Array of user consent records
- `consents_count` (number): Number of consent records

**Measure Object:**
- `measure_id` (UUID): Unique measure identifier
- `patient_id` (UUID): Reference to patient_profiles
- `measured_at` (ISO 8601): Timestamp of measurement (from report or measure creation)
- `stress_score` (number | null): Normalized stress score (0-100)
- `sleep_score` (number | null): Normalized sleep score (0-100)
- `risk_level` (string): Risk classification: "low", "moderate", "high", or "pending"
- `report_id` (UUID | null): Reference to generated report
- `scores` (object): Duplicate scores object for backwards compatibility
- `report_assessment_id` (UUID | null): Assessment that generated this report
- `amy_interpretation` (string | null): Short interpretation text from AMY
- `report_created_at` (ISO 8601 | null): When report was generated

**Consent Object:**
- `consent_id` (UUID): Unique consent record identifier
- `consent_version` (string): Version of consent terms (e.g., "1.0.0")
- `consented_at` (ISO 8601): When consent was given
- `ip_address` (string | null): IP address at consent time (audit trail)
- `user_agent` (string | null): Browser user agent at consent time (audit trail)

#### Response Headers

```
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="patient-export-YYYY-MM-DD.json"
```

**Note:** The endpoint now sets `Content-Disposition: attachment` header with a timestamped filename to enable automatic download in browsers.

#### HTTP Status Codes

- `200 OK`: Export successful
- `401 Unauthorized`: Not authenticated or invalid token
- `403 Forbidden`: No patient profile found for authenticated user
- `500 Internal Server Error`: Server error during export

#### Error Response

```json
{
  "error": "Nicht authentifiziert. Bitte melden Sie sich an."
}
```

or

```json
{
  "error": "Interner Fehler beim Exportieren der Messungen.",
  "message": "Detailed error message"
}
```

---

### 2. Report PDF Download

**Endpoint:** `GET /api/reports/[reportId]/pdf`

**Purpose:** Generate a time-limited signed URL for downloading a PDF report.

#### Authentication

- **Required:** Yes (Session Cookie)
- **Authorization:** 
  - **Patients:** Can only access their own reports (404 if unauthorized)
  - **Clinicians:** Can access reports for assigned patients only
- **RBAC Policy:** Returns 404 (not 403) to prevent resource enumeration

#### Request

```bash
# Via curl
curl -X GET "http://localhost:3000/api/reports/REPORT_ID/pdf?expiresIn=3600" \
  -H "Cookie: sb-localhost-auth-token=YOUR_SESSION_COOKIE"

# Via PowerShell
$reportId = "uuid-of-report"
$headers = @{
    "Cookie" = "sb-localhost-auth-token=YOUR_SESSION_COOKIE"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/reports/$reportId/pdf" `
    -Method Get -Headers $headers
```

#### Query Parameters

- `expiresIn` (optional, number): URL expiration time in seconds
  - **Default:** 3600 (1 hour)
  - **Minimum:** 60 (1 minute)
  - **Maximum:** 86400 (24 hours)
  - **Out of bounds:** Falls back to default

#### Response Format (B8 Standardized)

```json
{
  "success": true,
  "data": {
    "url": "https://storage.supabase.co/object/sign/bucket/path/file.pdf?token=...",
    "expiresAt": "2026-01-15T10:00:00.000Z",
    "metadata": {
      "fileSizeBytes": 245632,
      "pageCount": 3,
      "generatedAt": "2026-01-15T09:00:00.000Z"
    }
  }
}
```

#### Field Descriptions

- `success` (boolean): Always `true` for successful response
- `data.url` (string): Time-limited signed URL for PDF download
- `data.expiresAt` (ISO 8601): When the signed URL expires
- `data.metadata.fileSizeBytes` (number): Size of PDF file in bytes
- `data.metadata.pageCount` (number): Number of pages in PDF
- `data.metadata.generatedAt` (ISO 8601): When PDF was generated

#### HTTP Status Codes

- `200 OK`: Signed URL generated successfully
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Report not found OR user not authorized (security: no 403)
- `500 Internal Server Error`: Error generating signed URL

#### Error Response Format (B8 Standardized)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Report nicht gefunden."
  }
}
```

#### Security Considerations

- PDF access is verified through `processing_jobs` table with `assessment_id`
- Clinicians must have explicit assignment via `clinician_patient_assignments`
- Returns 404 instead of 403 to prevent resource existence disclosure
- Signed URLs are time-limited (default 1 hour, max 24 hours)
- URL expiration is enforced by Supabase Storage

---

## Data Minimization & PHI Protection

### Strategy

Both export endpoints follow strict data minimization principles to protect Protected Health Information (PHI):

#### What is Included

✅ **Patient Measures Export:**
- Normalized scores (stress_score, sleep_score)
- Risk levels (low/moderate/high)
- Timestamps (created_at, measured_at)
- Patient and user IDs (UUIDs only)
- AMY interpretation text
- Consent records with audit metadata

✅ **PDF Reports:**
- Assessment scores and risk levels
- Clinical interpretations
- Recommendations
- Metadata (page count, file size, generation time)

#### What is Excluded

❌ **Not Exported:**
- Raw assessment answers (personal medical details)
- Patient names, email addresses, phone numbers
- Street addresses or detailed location data
- Social security numbers or government IDs
- Detailed medical history beyond scores
- Internal system metadata (database IDs beyond UUID references)

### PHI Classification

| Data Type | Classification | Export Policy |
|-----------|---------------|---------------|
| Stress/Sleep Scores | De-identified PHI | ✅ Exported |
| Risk Levels | De-identified PHI | ✅ Exported |
| AMY Interpretations | De-identified PHI | ✅ Exported |
| UUIDs (patient_id, user_id) | Pseudonymous Identifiers | ✅ Exported |
| Consent Audit Trail | Non-PHI Metadata | ✅ Exported |
| IP Addresses | Technical Metadata | ✅ Exported (consent audit) |
| Raw Assessment Answers | Direct PHI | ❌ Not Exported |
| Patient Personal Info | Direct PHI | ❌ Not Exported |

### GDPR Compliance

The exports support GDPR requirements:

- **Art. 15 (Right of Access):** Patients can export their complete data set
- **Art. 20 (Data Portability):** JSON format enables machine-readable transfer
- **Art. 13-14 (Transparency):** Consent records document user agreements
- **Data Minimization Principle:** Only necessary data is exported

### Audit Trail

Consent records include audit metadata:
- `ip_address`: IP at consent time (for verification)
- `user_agent`: Browser fingerprint at consent time
- `consented_at`: Precise timestamp of consent

This metadata is essential for regulatory compliance and dispute resolution.

---

## Usage Examples

### Example 1: Export Patient Data for Analysis

```powershell
# PowerShell script to export and save patient data

# Set authentication cookie
$cookie = "sb-localhost-auth-token=YOUR_SESSION_COOKIE_HERE"
$headers = @{ "Cookie" = $cookie }

# Export patient measures
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/patient-measures/export" `
    -Method Get -Headers $headers

# Save to file with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$filename = "patient-export-$timestamp.json"
$response | ConvertTo-Json -Depth 10 | Out-File -FilePath $filename -Encoding UTF8

Write-Host "✅ Export saved to: $filename"
Write-Host "   Measures: $($response.total_count)"
Write-Host "   Consents: $($response.consents_count)"
```

### Example 2: Download PDF Report

```powershell
# PowerShell script to download PDF report

$reportId = "YOUR_REPORT_UUID_HERE"
$cookie = "sb-localhost-auth-token=YOUR_SESSION_COOKIE_HERE"
$headers = @{ "Cookie" = $cookie }

# Get signed URL
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/$reportId/pdf" `
    -Method Get -Headers $headers

if ($response.success) {
    $signedUrl = $response.data.url
    $metadata = $response.data.metadata
    
    Write-Host "✅ PDF URL generated:"
    Write-Host "   Size: $($metadata.fileSizeBytes) bytes"
    Write-Host "   Pages: $($metadata.pageCount)"
    Write-Host "   Expires: $($response.data.expiresAt)"
    
    # Download PDF
    $pdfFilename = "report-$reportId.pdf"
    Invoke-WebRequest -Uri $signedUrl -OutFile $pdfFilename
    
    Write-Host "✅ PDF downloaded to: $pdfFilename"
} else {
    Write-Host "❌ Error: $($response.error.message)"
}
```

### Example 3: Generate One Export Per Patient (Pilot Evaluation)

For pilot evaluation, generate one representative export per patient:

```powershell
# PowerShell script to generate pilot exports

# Patient authentication tokens (one per patient)
$patients = @(
    @{ name = "Patient_A"; cookie = "COOKIE_FOR_PATIENT_A" },
    @{ name = "Patient_B"; cookie = "COOKIE_FOR_PATIENT_B" },
    @{ name = "Patient_C"; cookie = "COOKIE_FOR_PATIENT_C" }
)

foreach ($patient in $patients) {
    Write-Host "`n📊 Exporting data for: $($patient.name)"
    
    $headers = @{ "Cookie" = $patient.cookie }
    
    try {
        # Export measures
        $response = Invoke-RestMethod `
            -Uri "http://localhost:3000/api/patient-measures/export" `
            -Method Get -Headers $headers
        
        # Save to file
        $filename = "pilot-export-$($patient.name).json"
        $response | ConvertTo-Json -Depth 10 | Out-File -FilePath $filename -Encoding UTF8
        
        Write-Host "✅ Exported: $filename"
        Write-Host "   Measures: $($response.total_count)"
        Write-Host "   Consents: $($response.consents_count)"
    }
    catch {
        Write-Host "❌ Error for $($patient.name): $($_.Exception.Message)"
    }
}

Write-Host "`n✅ Pilot export complete!"
```

---

## Testing & Verification

### Pre-requisites

1. **Authentication:**
   - Valid patient account with completed assessments
   - Valid session cookie or access token
   - For PDF endpoint: Generated report with PDF

2. **Test Data:**
   - At least one completed assessment
   - At least one consent record
   - At least one generated PDF report

### Verification Checklist

#### Patient Measures Export

- [ ] Returns 200 OK with valid authentication
- [ ] Returns 401 Unauthorized without authentication
- [ ] Response includes all required fields
- [ ] `export_date` is ISO 8601 timestamp
- [ ] `total_count` matches array length
- [ ] Measures include all score types
- [ ] Consents include audit metadata
- [ ] Response is valid JSON
- [ ] No sensitive PHI beyond scores/UUIDs
- [ ] Patient can only see their own data

#### PDF Download

- [ ] Returns 200 OK with valid authentication and authorization
- [ ] Returns 404 for non-existent report
- [ ] Returns 404 (not 403) for unauthorized access
- [ ] Signed URL is valid and accessible
- [ ] PDF downloads successfully from signed URL
- [ ] URL expires after specified time
- [ ] Metadata includes file size and page count
- [ ] Response follows B8 standard format
- [ ] Clinicians can access assigned patients only

### Manual Test Commands

```bash
# Test 1: Export patient measures (should succeed)
curl -X GET "http://localhost:3000/api/patient-measures/export" \
  -H "Cookie: sb-localhost-auth-token=VALID_COOKIE" \
  -w "\nHTTP Status: %{http_code}\n"

# Test 2: Export without auth (should return 401)
curl -X GET "http://localhost:3000/api/patient-measures/export" \
  -w "\nHTTP Status: %{http_code}\n"

# Test 3: Get PDF signed URL (should succeed)
curl -X GET "http://localhost:3000/api/reports/VALID_REPORT_ID/pdf" \
  -H "Cookie: sb-localhost-auth-token=VALID_COOKIE" \
  -w "\nHTTP Status: %{http_code}\n"

# Test 4: Get PDF for invalid report (should return 404)
curl -X GET "http://localhost:3000/api/reports/00000000-0000-0000-0000-000000000000/pdf" \
  -H "Cookie: sb-localhost-auth-token=VALID_COOKIE" \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## Troubleshooting

### Common Issues

#### Issue: 401 Unauthorized on Export

**Symptoms:**
```json
{ "error": "Nicht authentifiziert. Bitte melden Sie sich an." }
```

**Solutions:**
1. Verify session cookie is valid and not expired
2. Check Authorization header format: `Bearer <token>`
3. Re-authenticate and obtain new session
4. Verify user exists in auth.users table

#### Issue: 403 Forbidden - No Patient Profile

**Symptoms:**
```json
{ "error": "Ihr Profil konnte nicht geladen werden." }
```

**Solutions:**
1. Verify patient_profiles record exists for user
2. Check user_id matches auth.users.id
3. Verify database RLS policies allow access
4. Check patient onboarding completed successfully

#### Issue: Empty Measures Array

**Symptoms:**
```json
{
  "measures": [],
  "total_count": 0,
  "message": "Keine Messungen gefunden."
}
```

**Solutions:**
1. Verify patient has completed at least one assessment
2. Check patient_measures table has records
3. Verify report generation completed successfully
4. Check created_at timestamps are recent

#### Issue: PDF 404 Not Found

**Symptoms:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Report nicht gefunden."
  }
}
```

**Solutions:**
1. Verify reportId is a valid UUID
2. Check processing_jobs table for report record
3. Verify pdf_path and pdf_metadata fields exist
4. Check user authorization (patient owns report, clinician assigned)
5. Verify PDF generation completed (pdf_generated_at not null)

#### Issue: PDF Not Yet Generated

**Symptoms:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "PDF wurde noch nicht generiert."
  }
}
```

**Solutions:**
1. Wait for PDF generation to complete
2. Check processing_jobs.pdf_generated_at timestamp
3. Verify processing job completed successfully
4. Check background job queue status

#### Issue: Signed URL Generation Failed

**Symptoms:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Fehler beim Generieren der Download-URL."
  }
}
```

**Solutions:**
1. Check Supabase Storage configuration
2. Verify storage bucket exists and is accessible
3. Check pdf_path in processing_jobs is valid
4. Review server logs for detailed error message
5. Verify Supabase Storage service role key

---

## Implementation Notes

### Current Status

- ✅ `/api/patient-measures/export` - Implemented and working
- ✅ `/api/reports/[reportId]/pdf` - Implemented with B8 standardization
- ✅ Data minimization strategy - Documented
- ✅ Export format specification - Documented
- ✅ Security and RBAC - Implemented and documented

### Future Enhancements

Potential improvements for future iterations:

1. **Batch Export:**
   - Clinician endpoint to export all assigned patients
   - Organization-level aggregated reports

2. **Export Formats:**
   - CSV export option for spreadsheet analysis
   - XML export for legacy system integration

3. **Filtering:**
   - Date range filtering for measures
   - Risk level filtering
   - Assessment type filtering

4. **Compression:**
   - Gzip compression for large exports
   - ZIP archives for multi-file exports

5. **Audit Logging:**
   - Log all export operations for compliance
   - Track who accessed which exports and when

---

## References

- **Source Code:**
  - Patient Measures Export: `/app/api/patient-measures/export/route.ts`
  - PDF Signed URL: `/app/api/reports/[reportId]/pdf/route.ts`

- **Related Documentation:**
  - API Response Standards: `/lib/api/responses.ts` (B8 standardization)
  - PDF Generation: `/lib/pdf/` (generator, storage, templates)
  - JSON Export (archived): `/docs/_archive_0_3/JSON_EXPORT.md`

- **Database Schema:**
  - Tables: `patient_measures`, `reports`, `processing_jobs`, `user_consents`
  - RLS Policies: Patient-isolated, clinician assignment-based

- **Compliance:**
  - GDPR Articles: 13, 14, 15, 20
  - PHI Protection: HIPAA-aligned data minimization

---

## Contact & Support

For issues or questions regarding data exports:

1. **Technical Issues:** Check troubleshooting section above
2. **Feature Requests:** Create GitHub issue with `enhancement` label
3. **Security Concerns:** Report via secure channel (not public issues)
4. **Pilot Evaluation:** Coordinate with clinical team for export scheduling

---

**Document Version:** 1.0  
**Last Review:** 2026-01-15  
**Next Review:** After pilot completion
