# D1: Content Pages Implementation

## Overview

The D1 feature enables rendering of editorial content pages (`content_pages` table) in the frontend. Content pages are associated with funnels and can display markdown-formatted content with professional typography and mobile-optimized layouts.

## Database Schema

Content pages are stored in the `content_pages` table:

```sql
create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body_markdown text not null,
  status text not null default 'draft', -- draft, published
  layout text default 'default',        -- default, wide, hero
  funnel_id uuid references public.funnels(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## API Endpoints

### List Content Pages for a Funnel
```
GET /api/funnels/{slug}/content-pages
```

Returns all published content pages associated with a funnel.

**Example Response:**
```json
[
  {
    "id": "...",
    "slug": "was-ist-stress",
    "title": "Was ist Stress?",
    "excerpt": "Erfahren Sie mehr über die Grundlagen von Stress...",
    "body_markdown": "# Was ist Stress?\n\n...",
    "status": "published",
    "layout": "default",
    "funnel_id": "...",
    "created_at": "2025-12-10T...",
    "updated_at": "2025-12-10T..."
  }
]
```

### Get a Specific Content Page
```
GET /api/content-pages/{slug}
```

Returns a single published content page by its slug, including funnel information.

**Example Response:**
```json
{
  "id": "...",
  "slug": "was-ist-stress",
  "title": "Was ist Stress?",
  "excerpt": "Erfahren Sie mehr über...",
  "body_markdown": "# Was ist Stress?\n\n...",
  "status": "published",
  "layout": "default",
  "funnel_id": "...",
  "funnel": {
    "id": "...",
    "slug": "stress-assessment",
    "title": "Stress-Assessment"
  },
  "created_at": "2025-12-10T...",
  "updated_at": "2025-12-10T..."
}
```

## Frontend Routes

### Content Page Display
```
/patient/funnel/{funnelSlug}/content/{pageSlug}
```

Displays a content page with:
- Authentication check (redirect to login if not authenticated)
- Published-only content (draft pages return 404)
- Responsive header with back navigation
- Markdown rendering with typography styling
- Layout variants (default, wide, hero)
- Mobile-optimized design

## Components

### MarkdownRenderer
Location: `/app/components/MarkdownRenderer.tsx`

A reusable component for rendering markdown content with:
- GitHub Flavored Markdown support (via `remark-gfm`)
- Tailwind prose styling
- Custom typography optimized for readability
- Mobile-friendly spacing and line length

**Usage:**
```tsx
import MarkdownRenderer from '@/app/components/MarkdownRenderer'

<MarkdownRenderer 
  content={contentPage.body_markdown} 
  className="custom-class"
/>
```

### ContentPageClient
Location: `/app/patient/funnel/[slug]/content/[pageSlug]/client.tsx`

Client component that:
- Fetches content page data from API
- Handles loading and error states
- Renders page with header, content, and navigation
- Adapts layout based on `layout` setting

## Layout Variants

Content pages support three layout variants:

1. **default** (max-width: 768px)
   - Optimal for reading long-form text
   - Best for articles and documentation

2. **wide** (max-width: 1024px)
   - More horizontal space
   - Suitable for tables and wide content

3. **hero** (max-width: 1280px)
   - Full-width presentation
   - Best for landing pages and visual content

## Typography Styling

The MarkdownRenderer uses Tailwind's typography plugin with custom styling:

- **Headings:** Semibold, slate-900, responsive sizes
- **Paragraphs:** Relaxed line-height, slate-700
- **Links:** Blue-600, hover underline
- **Lists:** Proper spacing and indentation
- **Blockquotes:** Left border, italic, muted color
- **Code:** Inline and block syntax with light background
- **Images:** Rounded corners, shadow

## Sample Data

Sample content pages are included in migration `20251210045800_add_sample_content_pages.sql`:

1. **was-ist-stress** - Information about stress (default layout)
2. **schlaf-und-resilienz** - Sleep and resilience (default layout)
3. **ueber-das-assessment** - About the assessment (wide layout)
4. **draft-seite** - Draft page (should NOT be visible)

## Access Control

- **Authentication:** Required (redirects to `/login` if not authenticated)
- **Status Filter:** Only pages with `status = 'published'` are visible
- **Draft Pages:** Return 404 in frontend

## Mobile Optimization

Content pages are optimized for mobile with:
- Responsive font sizes (text-3xl sm:text-4xl)
- Appropriate padding (px-6 sm:px-8)
- Readable line length (max-w-3xl default)
- Touch-friendly navigation buttons
- Smooth scrolling

## Usage Examples

### Link to Content Page from Funnel
```tsx
<a href={`/patient/funnel/${funnelSlug}/content/was-ist-stress`}>
  Was ist Stress?
</a>
```

### Fetch Content Pages for a Funnel
```tsx
const response = await fetch(`/api/funnels/stress-assessment/content-pages`)
const pages = await response.json()
```

### Display Content Page
Navigate to:
```
/patient/funnel/stress-assessment/content/was-ist-stress
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Content page navigation menu in funnel
- [ ] Table of contents for long articles
- [ ] Related content suggestions
- [ ] Print-friendly CSS
- [ ] PDF export of content pages
- [ ] Search within content
- [ ] Content versioning
- [ ] Multi-language support

## Testing

To test the implementation:

1. **Run Migration:**
   ```bash
   supabase db push
   ```

2. **Verify Sample Data:**
   Check that sample content pages were created in the database.

3. **Access Content Page:**
   Navigate to `/patient/funnel/stress-assessment/content/was-ist-stress`

4. **Verify Features:**
   - ✅ Authentication required
   - ✅ Markdown rendering works
   - ✅ Mobile layout is responsive
   - ✅ Back navigation works
   - ✅ Draft pages return 404
   - ✅ Typography is readable

## TypeScript Types

Content page types are defined in `/lib/types/content.ts`:

```typescript
export type ContentPage = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body_markdown: string
  status: 'draft' | 'published'
  layout: string | null
  funnel_id: string | null
  created_at: string
  updated_at: string
}

export type ContentPageWithFunnel = ContentPage & {
  funnel?: {
    id: string
    slug: string
    title: string
  }
}
```

## Acceptance Criteria Verification

✅ **Content pages can be loaded and displayed in the UI**
- API endpoints fetch published pages
- Frontend route renders content

✅ **body_markdown is rendered correctly as HTML/React**
- MarkdownRenderer component with remark-gfm
- Prose styling applied

✅ **Only published pages are visible**
- Status filter in API queries
- Draft pages return 404

✅ **Mobile layout is readable and doesn't break**
- Responsive design
- Proper line length and spacing
- Touch-friendly navigation

## Related Files

- `/lib/types/content.ts` - TypeScript types
- `/app/api/funnels/[slug]/content-pages/route.ts` - List API
- `/app/api/content-pages/[slug]/route.ts` - Get API
- `/app/components/MarkdownRenderer.tsx` - Markdown renderer
- `/app/patient/funnel/[slug]/content/[pageSlug]/page.tsx` - Server component
- `/app/patient/funnel/[slug]/content/[pageSlug]/client.tsx` - Client component
- `/supabase/migrations/20251210045800_add_sample_content_pages.sql` - Sample data
