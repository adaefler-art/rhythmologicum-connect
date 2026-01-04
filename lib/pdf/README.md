# PDF Module

PDF generation, storage, and signed URL management for Rhythmologicum Connect reports.

## Overview

This module provides secure PDF generation from approved report sections with:
- **PHI-free storage paths** - Uses SHA-256 hashing to avoid exposing patient identifiers
- **Deterministic output** - Same report sections produce same PDF (verifiable via hash)
- **Time-limited signed URLs** - Secure, expiring download links (1-24 hours)
- **RBAC enforcement** - Patients access only their own reports, clinicians access all

## Architecture

```
Report Sections (approved)
    ↓
PDF Generator (generator.tsx)
    ↓
PDF Buffer + Metadata
    ↓
Storage Helper (storage.ts)
    ↓
Supabase Storage (bucket: reports)
    ↓
Signed URL Generation
    ↓
Download URL (time-limited)
```

## Modules

### `generator.tsx`
HTML → PDF conversion using @react-pdf/renderer
- **Technology**: React components rendered to PDF
- **Styling**: Professional A4 layout with headers, sections, disclaimers
- **Language**: German (Überblick, Befunde, Empfehlungen, etc.)
- **Options**: Page numbers, timestamps, disclaimers

### `storage.ts`
Storage operations and access control
- **Path Generation**: PHI-free paths using SHA-256 hashing
- **Upload**: Supabase Storage with metadata
- **Signed URLs**: Time-limited download links
- **RBAC**: Ownership verification (patient/clinician)
- **Cleanup**: Fail-closed architecture with cleanup on error

## Storage

### Bucket
- **Name**: `reports`
- **Provider**: Supabase Storage
- **Access**: Private (requires signed URL)

### Path Format
```
{job_id_hash}/{timestamp}_{hash}.pdf
```
- `job_id_hash`: SHA-256 hash of job ID (16 chars)
- `timestamp`: Unix timestamp in milliseconds
- `hash`: SHA-256 of `jobId-timestamp` (8 chars)
- **No PHI**: No patient names, emails, IDs, etc.

### Metadata (JSONB in processing_jobs)
```json
{
  "fileSizeBytes": 12345,
  "generatedAt": "2026-01-04T11:00:00.000Z",
  "version": "v1.0.0",
  "contentHash": "sha256...",
  "pageCount": 5,
  "sectionsVersion": "v1"
}
```

## API Endpoints

### Generate PDF
```
POST /api/processing/pdf
Body: { "jobId": "uuid" }
Response: { "success": true, "data": { "pdfPath": "...", "metadata": {...} } }
```

### Get Signed URL
```
GET /api/reports/[reportId]/pdf?expiresIn=3600
Response: { "success": true, "data": { "url": "...", "expiresAt": "..." } }
```

## Usage Example

```typescript
import { generatePdf } from '@/lib/pdf/generator'
import { uploadPdfToStorage, generateSignedUrl } from '@/lib/pdf/storage'

// Generate PDF
const result = await generatePdf({
  jobId: 'uuid',
  assessmentId: 'uuid',
  sectionsData: reportSections,
  patientData: {
    assessmentDate: '2026-01-04T10:00:00.000Z'
  },
  options: {
    includePageNumbers: true,
    includeTimestamp: true,
    includeDisclaimer: true
  }
})

if (result.success && result.buffer && result.metadata) {
  // Upload to storage
  const storagePath = generatePdfStoragePath(jobId)
  const uploadResult = await uploadPdfToStorage(
    result.buffer,
    storagePath,
    result.metadata
  )
  
  // Generate signed URL (1 hour expiry)
  const urlResult = await generateSignedUrl(storagePath, 3600)
  console.log('Download URL:', urlResult.url)
}
```

## Security

### PHI Protection
- ✅ No patient identifiers in storage paths
- ✅ No patient names, emails, phone numbers in metadata
- ✅ Initials intentionally excluded
- ✅ Only technical metadata stored

### Access Control
- ✅ Authentication required (401 if missing)
- ✅ RBAC enforced (403 if unauthorized)
- ✅ Patients: only their own PDFs
- ✅ Clinicians: all PDFs
- ✅ Signed URLs required for download

### Audit Trail
- ✅ All generations logged
- ✅ Unauthorized access logged
- ✅ Error conditions logged

## Testing

Run tests:
```bash
npm test -- lib/pdf
```

Test coverage:
- Path generation (determinism, PHI-free)
- Hash computation (SHA-256)
- Security (enumeration prevention)
- Edge cases (empty, large buffers)

**Results**: 13/13 tests passing ✅

## Dependencies

- `@react-pdf/renderer` v4.x - PDF generation
- `crypto` (Node.js) - SHA-256 hashing
- `@supabase/supabase-js` - Storage API

## Error Handling

### Fail-Closed Architecture
1. Generate PDF
2. Upload to storage
3. Update database
4. **If DB update fails**: Delete uploaded PDF (cleanup)
5. **If any step fails**: Stage remains FAILED, no partial publish

### Error Codes
- `JOB_NOT_FOUND` - Processing job doesn't exist
- `INVALID_STAGE` - Job not in PDF stage
- `SECTIONS_NOT_FOUND` - Report sections missing
- `ASSESSMENT_NOT_FOUND` - Assessment doesn't exist
- `PDF_GENERATION_FAILED` - PDF rendering error
- `INVALID_PDF` - Missing PDF magic bytes
- `UPLOAD_FAILED` - Storage upload error
- `DB_UPDATE_FAILED` - Database update error
- `PROCESSOR_ERROR` - Unexpected processor error

## Integration

The PDF stage fits into the processing pipeline:

```
PENDING → RISK → RANKING → CONTENT → VALIDATION → REVIEW → PDF → DELIVERY → COMPLETED
                                                              ↑
                                                         (This module)
```

After review approval, the PDF stage:
1. Fetches approved report sections
2. Generates PDF from sections
3. Stores in secure bucket
4. Updates job with PDF path
5. Advances to DELIVERY stage

## Future Enhancements

- **Page count accuracy**: Parse PDF to count actual pages
- **Custom styling**: Per-assessment or per-tenant themes
- **Watermarking**: Draft vs. final PDF watermarks
- **Batch generation**: Parallel PDF generation
- **PDF archival**: Automatic cleanup after retention period
- **Compression**: Smaller file sizes
- **Digital signatures**: Cryptographic signing

## License

Internal use only - Rhythmologicum Connect
