# Document Upload Feature (V05-I04.1)

## Overview

The document upload feature enables patients to securely upload documents (PDFs, images) to their assessments. Documents are stored in a private Supabase Storage bucket with Row Level Security (RLS) policies, and metadata is tracked in the database with deterministic parsing status.

## Architecture

### Storage Bucket

- **Bucket Name**: `documents`
- **Access Level**: Private (requires authentication)
- **File Size Limit**: 50 MB
- **Allowed MIME Types**:
  - `application/pdf`
  - `image/jpeg`, `image/jpg`
  - `image/png`
  - `image/heic`, `image/heif`

### Storage Path Format

Documents are stored with the following path structure:
```
{userId}/{assessmentId}/{timestamp}_{sanitizedFilename}
```

Example:
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890/
  assessment-uuid-here/
    1704297600000_lab_report.pdf
```

This ensures:
- User isolation (RLS at folder level)
- Assessment grouping
- Filename uniqueness via timestamp
- Original filename preservation

### Database Schema

The `documents` table stores metadata for each uploaded file:

```sql
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    doc_type TEXT,
    parsing_status parsing_status NOT NULL DEFAULT 'pending',
    extracted_data JSONB DEFAULT '{}'::jsonb,
    confidence JSONB DEFAULT '{}'::jsonb,
    confirmed_data JSONB DEFAULT '{}'::jsonb,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
```

### Parsing Status State Machine

The `parsing_status` field tracks document processing with deterministic transitions:

```
pending ──┬──> processing ──┬──> completed (terminal)
          │                 ├──> partial ──┬──> completed
          │                 │               └──> processing (retry)
          └──> failed ──────┴──────────────> processing (retry)
```

**Status Values:**
- `pending` - Document uploaded, awaiting processing
- `processing` - AI actively extracting data
- `completed` - All data successfully extracted (terminal state)
- `failed` - Extraction failed completely
- `partial` - Some data extracted, manual review needed

**Valid Transitions:**
- `pending` → `processing`, `failed`
- `processing` → `completed`, `partial`, `failed`
- `partial` → `processing`, `completed`, `failed`
- `failed` → `processing` (retry)
- `completed` → (none - terminal state)

## API Endpoints

### POST /api/documents/upload

Upload a document file and create a database record.

**Request:** `multipart/form-data`
```typescript
{
  file: File,              // PDF or image file
  assessmentId: string,    // UUID of assessment
  docType?: string        // Optional: 'lab_report', 'prescription', etc.
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string,
    assessmentId: string,
    storagePath: string,
    fileName: string,
    mimeType: string,
    size: number,
    parsingStatus: 'pending',
    createdAt: string
  }
}
```

**Validation:**
- User must be authenticated (401 if not)
- User must own the assessment via `patient_id` (403 if not)
- File type must be in allowed MIME types (400 if not)
- File size must be ≤ 50 MB (400 if not)

**Example:**
```javascript
const formData = new FormData()
formData.append('file', fileBlob)
formData.append('assessmentId', 'assessment-uuid-here')
formData.append('docType', 'lab_report')

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
if (result.success) {
  console.log('Document uploaded:', result.data.id)
}
```

### PATCH /api/documents/[id]/status

Update document parsing status with state machine validation.

**Request Body:**
```typescript
{
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    documentId: string,
    status: string
  }
}
```

**Validation:**
- User must be authenticated (401 if not)
- Status must be valid enum value (400 if not)
- Transition must be allowed by state machine (400 if not)

**Example:**
```javascript
const response = await fetch('/api/documents/doc-uuid/status', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'processing' }),
})

const result = await response.json()
if (!result.success) {
  console.error('Invalid status transition:', result.error.message)
}
```

## Security

### Row Level Security (RLS)

#### Database Table Policies

**Patients:**
- Can INSERT documents for their own assessments
- Can SELECT documents for their own assessments

**Staff (Clinicians/Nurses):**
- Can SELECT documents for patients in their organization

**Service Role:**
- Full access (for AI processing)

#### Storage Bucket Policies

**Patients:**
- Can INSERT objects to `{userId}/*` paths
- Can SELECT objects from `{userId}/*` paths
- Can DELETE objects from `{userId}/*` paths (optional)

**Staff:**
- Can SELECT objects for patients in their organization

### Data Flow

1. **Upload Request** → Patient makes POST request with file
2. **Authentication** → Verify user session exists
3. **Ownership Check** → Verify `assessments.patient_id` belongs to user
4. **File Validation** → Check MIME type and size
5. **Storage Upload** → Upload to `{userId}/{assessmentId}/` path
6. **DB Record** → Create record with `parsing_status='pending'`
7. **Response** → Return document metadata

## Usage Examples

### TypeScript Client

```typescript
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/types/documents'

async function uploadDocument(
  file: File,
  assessmentId: string,
  docType?: string
) {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    throw new Error(`File type ${file.type} not allowed`)
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE} bytes`)
  }

  // Create form data
  const formData = new FormData()
  formData.append('file', file)
  formData.append('assessmentId', assessmentId)
  if (docType) formData.append('docType', docType)

  // Upload
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error.message)
  }

  return result.data
}
```

### Server-Side Helpers

```typescript
import {
  isValidMimeType,
  isValidFileSize,
  isValidParsingStatusTransition,
  updateDocumentParsingStatus,
} from '@/lib/documents/helpers'

// Validate file
if (!isValidMimeType(file.type)) {
  throw new Error('Invalid file type')
}

if (!isValidFileSize(file.size)) {
  throw new Error('File too large')
}

// Update parsing status
const result = await updateDocumentParsingStatus(
  documentId,
  'processing'
)

if (!result.success) {
  console.error('Status update failed:', result.error)
}
```

## Testing

### Unit Tests

Located in `lib/documents/__tests__/helpers.test.ts`:

- ✅ MIME type validation
- ✅ File size validation
- ✅ Parsing status transitions
- ✅ Storage path generation
- ✅ File extension extraction

Run tests:
```bash
npm test -- lib/documents/__tests__/helpers.test.ts
```

### Manual Testing

1. **Upload a valid PDF:**
   ```bash
   curl -X POST http://localhost:3000/api/documents/upload \
     -H "Cookie: sb-access-token=..." \
     -F "file=@test.pdf" \
     -F "assessmentId=uuid-here"
   ```

2. **Upload with invalid file type:**
   ```bash
   curl -X POST http://localhost:3000/api/documents/upload \
     -H "Cookie: sb-access-token=..." \
     -F "file=@test.txt" \
     -F "assessmentId=uuid-here"
   ```
   Expected: 400 error with validation message

3. **Update parsing status:**
   ```bash
   curl -X PATCH http://localhost:3000/api/documents/doc-id/status \
     -H "Cookie: sb-access-token=..." \
     -H "Content-Type: application/json" \
     -d '{"status":"processing"}'
   ```

## Verification Commands

### PowerShell (Windows Development)

```powershell
# Start Supabase
supabase start

# Reset database and apply all migrations (including storage bucket)
supabase db reset

# Verify storage bucket exists
supabase storage ls

# Check documents bucket configuration
supabase storage info documents

# Generate TypeScript types
npm run db:typegen

# Check for schema drift
supabase db diff

# Run tests
npm test

# Build project
npm run build
```

## Migration Details

**File:** `supabase/migrations/20260103075000_create_documents_storage_bucket.sql`

Creates:
- Storage bucket `documents` with 50 MB limit
- RLS policies for patient upload/read
- RLS policies for staff read access

The migration is idempotent and can be run multiple times safely.

## Future Enhancements (I04.2)

- PDF parsing/extraction logic
- OCR for image-based documents
- Structured data extraction
- Confidence scoring
- User confirmation workflow

## References

- Issue: V05-I04.1
- Migration: `20260103075000_create_documents_storage_bucket.sql`
- Types: `lib/types/documents.ts`
- Helpers: `lib/documents/helpers.ts`
- API: `app/api/documents/upload/route.ts`
- Status API: `app/api/documents/[id]/status/route.ts`
- Tests: `lib/documents/__tests__/helpers.test.ts`
