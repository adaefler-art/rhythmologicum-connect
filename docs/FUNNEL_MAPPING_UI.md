# Content→Funnel Mapping UI Implementation

## Overview

This document describes the implementation of the Content→Funnel Mapping UI feature, which allows administrators to attach content pages to specific funnels and flow steps.

## User Story

As an admin, I want to define which funnel a content page belongs to and at which flow step the content should appear, so that content pages can be dynamically displayed at the appropriate stage in a funnel.

## Database Schema

The `content_pages` table includes the following fields for funnel mapping:

- `funnel_id` (UUID, nullable): Foreign key reference to the `funnels` table
- `flow_step` (text, nullable): Identifier for the flow step (e.g., "intro-1", "between-questions-2")
- `order_index` (integer, nullable): Sort order when multiple content pages exist at the same flow step

## UI Implementation

### Content Page Editor Fields

The Content Page Editor (`app/components/ContentPageEditor.tsx`) now includes three fields in the Metadata section:

1. **Funnel** (dropdown)
   - Lists all available funnels
   - Default option: "Kein Funnel"
   - Help text: "Funnel, zu dem diese Content-Page gehört"

2. **Flow Step** (text input)
   - Text field with monospace font
   - Placeholder: "z.B. intro-1, between-questions-2"
   - Disabled when no funnel is selected
   - Help text: "Identifier für den Flow-Schritt (z.B. "intro-1", "between-questions-2")"
   - Validation: Only lowercase letters, numbers, and hyphens allowed

3. **Order Index** (number input)
   - Number field for ordering
   - Minimum value: 0
   - Placeholder: "Optional"
   - Disabled when no funnel is selected
   - Help text: "Reihenfolge bei mehreren Content-Seiten im gleichen Flow-Schritt"
   - Validation: Must be non-negative if provided

### Form State Management

The component maintains state for the new fields:

```typescript
const [funnelId, setFunnelId] = useState<string>(initialData?.funnel_id || '')
const [flowStep, setFlowStep] = useState(initialData?.flow_step || '')
const [orderIndex, setOrderIndex] = useState<number | null>(initialData?.order_index ?? null)
```

### Validation Rules

The form validation includes:

1. **Flow Step Format**:
   - Pattern: `/^[a-z0-9-]+$/`
   - Only lowercase letters, numbers, and hyphens
   - Optional field (can be empty)

2. **Order Index**:
   - Must be non-negative (>= 0)
   - Optional field (can be null)

3. **Field Dependencies**:
   - Flow Step and Order Index fields are disabled when no funnel is selected
   - This provides clear UX feedback that these fields only apply when a funnel is chosen

## API Changes

### POST /api/admin/content-pages

Creates a new content page. Now accepts additional fields:

```typescript
{
  // ... existing fields ...
  funnel_id?: string | null,
  flow_step?: string | null,
  order_index?: number | null
}
```

### PATCH /api/admin/content-pages/[id]

Updates an existing content page. Now accepts additional fields:

```typescript
{
  // ... existing fields ...
  funnel_id?: string | null,
  flow_step?: string | null,
  order_index?: number | null
}
```

### GET /api/admin/content-pages/[id]

Returns a single content page including the new fields:

```typescript
{
  // ... existing fields ...
  funnel_id: string | null,
  flow_step: string | null,
  order_index: number | null
}
```

## Type Definitions

Updated `ContentPageEditorData` type in `app/components/ContentPageEditor.tsx`:

```typescript
export type ContentPageEditorData = {
  id?: string
  title: string
  slug: string
  excerpt: string
  body_markdown: string
  status: 'draft' | 'published'
  category: string
  priority: number
  funnel_id: string | null
  flow_step: string | null
  order_index: number | null
  layout: string | null
}
```

## Usage Examples

### Example 1: Content Page for Stress Funnel Introduction

```
Funnel: Stress Assessment
Flow Step: intro-1
Order Index: 0
```

This content page will appear at the first introduction step of the stress funnel.

### Example 2: Multiple Content Pages Between Questions

```
Content Page 1:
  Funnel: Stress Assessment
  Flow Step: between-questions-2
  Order Index: 0

Content Page 2:
  Funnel: Stress Assessment
  Flow Step: between-questions-2
  Order Index: 1
```

Both pages appear at the same flow step, ordered by their order_index values.

### Example 3: Standalone Content Page

```
Funnel: (empty/none)
Flow Step: (empty/disabled)
Order Index: (empty/disabled)
```

A content page not attached to any funnel can still be created and accessed via its slug.

## Manual Testing Guide

### Test Case 1: Create New Content Page with Funnel Mapping

1. Navigate to `/admin/content/new`
2. Fill in required fields (title, slug, markdown content)
3. Select a funnel from the dropdown
4. Enter a flow step (e.g., "intro-1")
5. Enter an order index (e.g., 0)
6. Click "Veröffentlichen"
7. Verify the page is created successfully
8. Edit the page and verify all fields are preserved

### Test Case 2: Edit Existing Content Page

1. Navigate to `/admin/content`
2. Click on an existing content page
3. Change the funnel selection
4. Update flow step and order index
5. Save changes
6. Reload the page and verify changes persist

### Test Case 3: Validation - Invalid Flow Step

1. Create or edit a content page
2. Select a funnel
3. Enter an invalid flow step (e.g., "INTRO_1" with capitals)
4. Attempt to save
5. Verify validation error appears

### Test Case 4: Validation - Negative Order Index

1. Create or edit a content page
2. Select a funnel
3. Enter a negative order index (e.g., -1)
4. Attempt to save
5. Verify validation error appears

### Test Case 5: Field Disabling Behavior

1. Create a new content page
2. Verify Flow Step and Order Index are disabled
3. Select a funnel
4. Verify Flow Step and Order Index become enabled
5. Clear the funnel selection
6. Verify Flow Step and Order Index become disabled again

## Future Enhancements

Possible future improvements:

1. **Flow Step Dropdown**: Replace text input with a dropdown populated from funnel step definitions
2. **Visual Flow Step Preview**: Show a visual representation of where the content page will appear in the funnel
3. **Bulk Operations**: Allow attaching multiple content pages to a funnel at once
4. **Step Templates**: Provide templates for common flow step patterns
5. **Content Page Preview in Funnel Context**: Preview how the content page appears within the funnel flow

## Related Files

- `app/components/ContentPageEditor.tsx` - Main editor component
- `app/api/admin/content-pages/route.ts` - List and create content pages
- `app/api/admin/content-pages/[id]/route.ts` - Get, update, and delete content pages
- `lib/types/content.ts` - Content page type definitions
- `schema/schema.sql` - Database schema with content_pages table

## Related Issues

- Parent Epic: #208 - Funnel Architecture & Runtime
