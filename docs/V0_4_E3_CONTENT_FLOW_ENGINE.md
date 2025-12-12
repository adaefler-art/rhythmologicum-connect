# V0.4-E3: Content Flow Engine (CONTENT_PAGE Integration)

## Overview

The Content Flow Engine enables editorial content pages to be integrated directly into funnel flows as first-class steps. This allows content to appear before, between, or after question blocks, providing a more flexible and informative user experience.

## Implementation Date

2025-12-12

## Key Features

### 1. Database Schema

#### Funnel Steps Integration (Initial Implementation)

- **New Column**: `funnel_steps.content_page_id` (UUID, nullable)
  - References `content_pages.id`
  - ON DELETE SET NULL
  - Must be non-null for `content_page` type steps
  - Must be null for non-`content_page` type steps

- **Constraint**: `funnel_steps_content_page_consistency`
  - Ensures data integrity between step type and content_page_id

- **Index**: `funnel_steps_content_page_id_idx`
  - Partial index on content_page_id WHERE NOT NULL
  - Optimizes content page lookups

#### Content Flow Mapping (Enhancement - Epic #208)

Extension to support bidirectional content-to-funnel mapping:

- **New Column**: `content_pages.flow_step` (TEXT, nullable)
  - Identifies which step in the funnel flow this content belongs to
  - Examples: "intro", "pre-assessment", "step-1", "post-assessment", "result"
  - NULL if not part of a specific flow step
  - Enables filtering and organizing content by flow position

- **New Column**: `content_pages.order_index` (INTEGER, nullable)
  - Determines display order within a flow step
  - Lower numbers appear first
  - NULL if ordering is not relevant
  - Allows multiple content pages per flow step in a defined sequence

- **Existing Column**: `content_pages.funnel_id` (UUID, nullable)
  - Associates content with a specific funnel
  - Used in combination with flow_step for precise placement

- **New Indexes**:
  - `idx_content_pages_flow_step`: Partial index on flow_step WHERE NOT NULL
  - `idx_content_pages_funnel_flow`: Composite index on (funnel_id, flow_step) WHERE both NOT NULL
  - `idx_content_pages_order_index`: Partial index on order_index WHERE NOT NULL

**Migration**: `20251212220145_add_content_flow_mapping.sql`

### 2. TypeScript Types

New type definition in `lib/types/funnel.ts`:

```typescript
export interface ContentPageStepDefinition extends BaseStepDefinition {
  type: 'content_page'
  contentPageId: string
  contentPage?: {
    id: string
    slug: string
    title: string
    excerpt: string | null
    body_markdown: string
    status: string
  }
}
```

Type guard function:
```typescript
export function isContentPageStep(step: StepDefinition): step is ContentPageStepDefinition
```

### 3. Patient Flow Renderer

**Component**: `ContentPageStepRenderer.tsx`

- Renders editorial content within the assessment flow
- Mobile-optimized using `MobileContentPage` component
- Desktop uses card-based layout consistent with question steps
- Features:
  - Displays content page title, excerpt, and markdown body
  - "Continue" and "Back" navigation buttons
  - Loading state support
  - Responsive design (mobile/desktop)

### 4. API Endpoints

#### GET /api/funnels/[slug]/definition
- Extended to include content_page data for content_page steps
- Fetches associated content page when `type === 'content_page'`

#### GET /api/admin/funnels/[id]
- Extended to include content_page information
- Returns content page metadata for admin UI

#### PATCH /api/admin/funnel-steps/[id]
- Supports updating `content_page_id`
- Validates content page exists before assignment
- Allows null to clear content page association

#### POST /api/admin/funnel-steps (NEW)
- Creates new funnel steps
- Validates type-specific requirements
- Ensures `content_page_id` is provided for `content_page` steps
- Auto-assigns `order_index` if not specified

### 5. Admin UI

**Page**: `/clinician/funnels/[id]`

- Displays content page information for `content_page` steps
- Shows:
  - Content page title, slug, excerpt
  - Publication status (published/draft)
  - Warning if no content page is assigned
- Translation: "Inhaltsseite" for content_page step type

## Navigation & Validation

### Navigation Logic
The existing navigation logic in `lib/navigation/assessmentNavigation.ts` works seamlessly with content_page steps:
- Content page steps have no questions, so they don't block navigation
- The system automatically moves to the next step with unanswered questions

### Validation Logic
The existing validation logic in `lib/validation/requiredQuestions.ts`:
- Returns `isValid: true` for steps with no required questions
- Content page steps pass validation automatically

## Usage Example

### Creating a Content Page Step via API

```javascript
POST /api/admin/funnel-steps
{
  "funnel_id": "uuid-of-funnel",
  "title": "Wichtige Information",
  "description": "Bitte lesen Sie diese Information",
  "type": "content_page",
  "content_page_id": "uuid-of-content-page",
  "order_index": 2  // Optional, defaults to end
}
```

### Using Content Flow Mapping Fields

The new `flow_step` and `order_index` fields enable flexible content organization:

#### Example 1: Intro Content Pages
```sql
-- Create intro content pages for a funnel
UPDATE content_pages 
SET 
  funnel_id = 'uuid-of-stress-funnel',
  flow_step = 'intro',
  order_index = 1
WHERE slug = 'was-ist-stress';

UPDATE content_pages 
SET 
  funnel_id = 'uuid-of-stress-funnel',
  flow_step = 'intro',
  order_index = 2
WHERE slug = 'ueber-das-assessment';
```

#### Example 2: Post-Assessment Content
```sql
-- Add content pages to show after assessment
UPDATE content_pages 
SET 
  funnel_id = 'uuid-of-stress-funnel',
  flow_step = 'post-assessment',
  order_index = 1
WHERE slug = 'result-naechste-schritte';
```

#### Example 3: Querying Content by Flow Step
```sql
-- Get all intro content for a funnel, ordered
SELECT id, title, slug, excerpt
FROM content_pages
WHERE funnel_id = 'uuid-of-stress-funnel'
  AND flow_step = 'intro'
ORDER BY order_index ASC NULLS LAST, created_at;
```

#### Example 4: TypeScript/API Usage
```typescript
// Fetch content pages for a specific flow step
const { data: contentPages, error } = await supabase
  .from('content_pages')
  .select('*')
  .eq('funnel_id', funnelId)
  .eq('flow_step', 'intro')
  .order('order_index', { ascending: true, nullsFirst: false })
```

### Patient Experience

1. User starts assessment
2. Encounters content_page step (e.g., "Datenschutzhinweise")
3. Reads content with markdown formatting
4. Clicks "Weiter" to continue to next step
5. No validation required - content pages are always "complete"

### Mobile Experience

On mobile devices (<640px):
- Full-screen layout using `MobileContentPage`
- Sticky header with title
- Scrollable content area
- Sticky footer with navigation buttons
- Consistent with other mobile step renderers

### Desktop Experience

On desktop:
- Card-based layout
- Consistent styling with question steps
- Clear visual hierarchy
- Responsive spacing

## Future Enhancements

Potential improvements for future versions:

1. **Visual Step Management**
   - Drag-and-drop reordering in admin UI
   - Visual preview of content pages
   - Inline content page selection

2. **Content Page Templates**
   - Pre-defined templates for common use cases
   - Quick-add buttons for specific content types

3. **Conditional Content**
   - Show/hide content pages based on previous answers
   - Dynamic content insertion

4. **Analytics**
   - Track time spent on content pages
   - Completion rates for content steps

5. **Rich Media Support**
   - Embed videos, images in content steps
   - Interactive content elements

## Testing Checklist

- [x] Database migration runs successfully
- [x] TypeScript types compile without errors
- [x] Build succeeds
- [x] Linting passes (no new errors)
- [ ] Manual test: Create content_page step via API
- [ ] Manual test: View content_page step in patient flow
- [ ] Manual test: Navigate through content_page step
- [ ] Manual test: Mobile rendering of content_page step
- [ ] Manual test: Admin UI displays content page info

## Related Issues

- V0.4-E3 — Content Flow Engine (CONTENT_PAGE Integration)

## Related Documentation

- `/docs/V0_4_MOBILE_CONTENT_PAGE.md` - Mobile content page component
- `/docs/_archive_0_3/D2_CONTENT_INTEGRATION.md` - Content pages integration (v0.3)
- `/docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md` - Funnel runtime backend

## Migration

**File**: `supabase/migrations/20251212204909_add_content_page_steps.sql`

To apply:
```bash
# Local development
supabase db reset

# Production
# Migration will be applied automatically on next deploy
```

## Breaking Changes

None. This is a backward-compatible addition:
- Existing funnel steps are not affected
- New column is nullable
- Constraint only applies to new content_page steps
- No changes to existing APIs (only extensions)

## Security Considerations

- Content page access follows existing RLS policies
- Only clinician/admin roles can create content_page steps
- Content pages must be published to be visible to patients
- Content page validation prevents assignment of non-existent pages

## Performance Considerations

- Partial index on `content_page_id` minimizes index size
- Content page data is lazily loaded (only for content_page steps)
- No impact on existing question step performance
- Markdown rendering is lazy-loaded on client

---

**Status**: ✅ Implemented  
**Version**: v0.4-dev  
**Author**: GitHub Copilot  
**Date**: 2025-12-12
