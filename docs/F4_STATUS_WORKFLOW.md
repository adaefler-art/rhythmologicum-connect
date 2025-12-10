# F4 – Status Workflow Implementation

## Overview
This document describes the implementation of the content status workflow for content pages, including draft, published, and archived states, plus optional soft-delete functionality.

## Features Implemented

### 1. Status Field Values
The `content_pages.status` field now supports three values:
- **draft**: Content that is being worked on (not visible to patients)
- **published**: Content that is live and visible to patients
- **archived**: Content that is no longer active (not visible to patients)

### 2. Soft Delete with `deleted_at`
Added optional `deleted_at` timestamp column:
- When `NULL`: Content is active (visible based on status)
- When set: Content is soft-deleted and excluded from all queries by default

### 3. Access Control

#### Patient Access
Patients can only see content that is:
- `status = 'published'`
- `deleted_at IS NULL`

This is enforced in:
- `/api/content-pages/[slug]` - Get single content page
- `/api/funnels/[slug]/content-pages` - List content pages for a funnel

#### Admin/Clinician Access
Admins and clinicians can see content with any status:
- `draft`, `published`, or `archived`
- By default, soft-deleted content (`deleted_at IS NOT NULL`) is excluded
- This is implemented in `/api/admin/content-pages` endpoints

## Database Changes

### Migration: `20251210180353_add_archived_status_and_soft_delete.sql`

```sql
-- Add deleted_at column
ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add index for deleted_at
CREATE INDEX IF NOT EXISTS idx_content_pages_deleted_at 
ON public.content_pages (deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Update status index to be partial
DROP INDEX IF EXISTS public.content_pages_status_idx;
CREATE INDEX content_pages_status_idx 
ON public.content_pages (status) 
WHERE deleted_at IS NULL;
```

### Schema Updates
- `content_pages` table now includes `deleted_at` column
- Indexes optimized for queries filtering by status and deleted_at

## API Changes

### Status Validation
Both POST and PATCH endpoints now validate status values:
```typescript
const validStatuses = ['draft', 'published', 'archived']
if (!validStatuses.includes(status)) {
  return NextResponse.json(
    { error: 'Invalid status. Must be one of: draft, published, archived' },
    { status: 400 },
  )
}
```

### Query Filters

**Patient-facing endpoints:**
```typescript
.eq('status', 'published')
.is('deleted_at', null)
```

**Admin endpoints:**
```typescript
.is('deleted_at', null)
// No status filter - admins see all statuses
```

## Type Definitions

Updated `lib/types/content.ts`:
```typescript
export type ContentPage = {
  // ... other fields
  status: 'draft' | 'published' | 'archived'
  deleted_at: string | null
}
```

## UI Support

The admin dashboard (`app/admin/content/page.tsx`) already had UI support for the archived status:
- Status badges with appropriate styling for draft, published, and archived
- Status filter dropdown includes all three states
- German labels: "Entwurf", "Veröffentlicht", "Archiviert"

## Testing Checklist

### Manual Testing Steps

1. **Test Status Creation**
   - Create a content page with status='draft'
   - Create a content page with status='published'
   - Create a content page with status='archived'

2. **Test Patient Access**
   - As a patient, verify you can only see 'published' content
   - Verify draft content is not visible
   - Verify archived content is not visible

3. **Test Admin Access**
   - As a clinician, verify you can see all statuses in the dashboard
   - Verify filtering by status works correctly
   - Verify status badges display correctly

4. **Test Status Transitions**
   - Change a page from draft → published
   - Change a page from published → archived
   - Change a page from archived → published (reactivation)

5. **Test Soft Delete (Optional)**
   - Set `deleted_at` timestamp on a content page
   - Verify it's excluded from all queries
   - Verify it can be recovered by setting `deleted_at` to NULL

6. **Test API Validation**
   - Try to create/update with invalid status value
   - Verify proper error message is returned

## Example SQL Commands

### View all content with status
```sql
SELECT id, slug, title, status, deleted_at 
FROM content_pages 
ORDER BY updated_at DESC;
```

### Change status to archived
```sql
UPDATE content_pages 
SET status = 'archived', updated_at = NOW() 
WHERE slug = 'example-page';
```

### Soft delete a page
```sql
UPDATE content_pages 
SET deleted_at = NOW() 
WHERE slug = 'example-page';
```

### Recover a soft-deleted page
```sql
UPDATE content_pages 
SET deleted_at = NULL 
WHERE slug = 'example-page';
```

## Notes

- The UI was already prepared to handle 'archived' status (badges, filters, labels)
- All database queries now properly exclude soft-deleted content
- Status validation is enforced at the API level for data integrity
- Indexes are optimized for common query patterns (active, published content)
