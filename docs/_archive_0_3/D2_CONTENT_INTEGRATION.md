# D2: Content Pages Integration in Funnel Context

## Overview

This document describes how content pages (`content_pages` table) are integrated contextually within funnels. Content pages can be displayed at strategic points in the assessment flow to provide additional information to users.

## Slug-Based Categorization

Content pages are automatically categorized based on their slug naming pattern. This approach uses the existing schema without requiring additional database fields.

### Naming Conventions

| Slug Pattern | Category | Display Location | Purpose |
|-------------|----------|-----------------|---------|
| `intro-*` | Intro | Funnel start page | Introduction and preparation for the assessment |
| `info-*` | Info | Funnel start & result pages | Additional background information |
| `outro-*` or `result-*` | Result | Result page | Interpretation help and next steps |
| Other patterns | Other | Not automatically displayed | Manual linking required |

### Special Cases

Some slugs are automatically categorized even if they don't follow the prefix pattern:

- `ueber-das-assessment` or slugs containing `about` → **Intro**
- Slugs containing `ergebnis` or `results` → **Result**

## How Content Pages Are Displayed

### On the Funnel Start Page

When a user is filling out a funnel, relevant content pages appear in an information box near the top of the page:

- **Intro pages** (`intro-*`) are shown
- **Info pages** (`info-*`) are shown
- Links open in a new tab to avoid disrupting the assessment flow
- Excerpt text is displayed (first 60 characters)

### On the Result Page

After completing an assessment, users see content page links in a dedicated section:

- **Result pages** (`outro-*`, `result-*`) are shown
- **Info pages** (`info-*`) are shown
- Styled in green to indicate post-completion content
- Links open in a new tab

## Creating Content Pages for Funnel Context

### Step 1: Determine the Category

Decide where you want the content to appear:

- **Before/during assessment?** → Use `intro-*` or `info-*` slug
- **After assessment?** → Use `result-*` or `outro-*` slug

### Step 2: Create the Content Page

Use a migration or direct database insertion:

```sql
INSERT INTO public.content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  layout,
  funnel_id
) VALUES (
  'intro-stress-basics',  -- Slug determines category
  'Was ist Stress?',
  'Grundlegende Informationen über Stress und seine Auswirkungen.',
  '# Was ist Stress?\n\n[Your markdown content here]',
  'published',           -- MUST be 'published' to be visible
  'default',
  '[funnel-uuid]'        -- Link to the specific funnel
);
```

### Step 3: Verify the Integration

1. **Check the funnel start page**: `/patient/funnel/{slug}`
   - Intro and info pages should appear in a blue information box
   
2. **Check the result page**: `/patient/funnel/{slug}/result?assessmentId={id}`
   - Result and info pages should appear in a green "Mehr erfahren" section

## Examples

### Example 1: Introduction Page

```sql
-- This page explains what the assessment is about
INSERT INTO public.content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  funnel_id
) VALUES (
  'intro-assessment-guide',
  'So funktioniert das Assessment',
  'Eine kurze Anleitung zum Ablauf und zur Dauer des Assessments.',
  '# Assessment-Anleitung\n\n...',
  'published',
  (SELECT id FROM funnels WHERE slug = 'stress-assessment')
);
```

This will appear on the funnel start page.

### Example 2: Information Page

```sql
-- General information about stress that's useful throughout
INSERT INTO public.content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  funnel_id
) VALUES (
  'info-stress-types',
  'Arten von Stress',
  'Verstehen Sie den Unterschied zwischen akutem und chronischem Stress.',
  '# Stress-Arten\n\n...',
  'published',
  (SELECT id FROM funnels WHERE slug = 'stress-assessment')
);
```

This will appear both on the funnel start page AND the result page.

### Example 3: Result Interpretation Page

```sql
-- Helps users understand their results
INSERT INTO public.content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  funnel_id
) VALUES (
  'result-interpretation',
  'So interpretieren Sie Ihre Ergebnisse',
  'Leitfaden zur Interpretation Ihrer Stress-Assessment-Ergebnisse.',
  '# Ergebnis-Interpretation\n\n...',
  'published',
  (SELECT id FROM funnels WHERE slug = 'stress-assessment')
);
```

This will appear only on the result page.

## Technical Implementation

### Helper Functions

Located in `/lib/utils/contentPageHelpers.ts`:

```typescript
import { categorizeContentPage, getIntroPages, getInfoPages, getResultPages } from '@/lib/utils/contentPageHelpers'

// Categorize a single page
const category = categorizeContentPage(page)

// Filter pages by category
const introPages = getIntroPages(allPages)
const infoPages = getInfoPages(allPages)
const resultPages = getResultPages(allPages)
```

### API Endpoint

Content pages are fetched via:

```
GET /api/funnels/{slug}/content-pages
```

This endpoint returns all published content pages for the specified funnel.

### Integration Points

1. **Funnel Client** (`/app/patient/funnel/[slug]/client.tsx`)
   - Loads content pages on mount
   - Displays intro and info pages in an information box

2. **Result Client** (`/app/patient/funnel/[slug]/result/client.tsx`)
   - Loads content pages on mount
   - Displays result and info pages in a "Learn More" section

## Best Practices

### Slug Naming

✅ **Good Examples:**
- `intro-welcome` - Clear intro page
- `info-stress-management` - General info
- `result-next-steps` - Post-assessment guidance
- `outro-resources` - Additional resources after completion

❌ **Bad Examples:**
- `stress-page` - Unclear category
- `page-1` - Non-descriptive
- `draft-intro` - Don't use status in slug

### Content Quality

1. **Keep it concise**: Users are in the middle of an assessment
2. **Mobile-friendly**: Content must be readable on small screens
3. **Clear titles**: Users should know what to expect
4. **Good excerpts**: First 60 characters are shown, make them count

### Status Management

- **Draft pages are NOT visible** in the frontend
- Only `status = 'published'` pages appear
- Use draft status for work-in-progress content

## Testing

### Manual Testing Checklist

1. **Create test pages** with different slug patterns:
   ```
   - intro-test
   - info-test
   - result-test
   - other-test
   ```

2. **Verify categorization**: Use helper functions to check category assignment

3. **Test funnel page**: Navigate to `/patient/funnel/{slug}`
   - Confirm intro and info pages appear
   - Verify links work and open in new tab
   - Check mobile responsiveness

4. **Test result page**: Complete an assessment and view results
   - Confirm result and info pages appear
   - Verify styling (green section)
   - Check links work

5. **Test draft pages**: Create a draft page
   - Confirm it does NOT appear in the UI
   - Verify API endpoint excludes it

## Future Enhancements

Potential improvements for future versions:

- [ ] Admin UI for content page management
- [ ] Visual preview before publishing
- [ ] Analytics on which content pages are clicked
- [ ] A/B testing for content effectiveness
- [ ] Multi-language support for content
- [ ] Content versioning and history
- [ ] In-funnel inline content (without new tab)
- [ ] Conditional content based on assessment progress

## Related Documentation

- [D1: Content Pages Implementation](./D1_CONTENT_PAGES.md) - Base content pages feature
- [B3: Navigation API](./B3_NAVIGATION_API.md) - Funnel navigation system
- Schema: `schema/schema.sql` - Database structure

## Support

For questions or issues with content pages integration:

1. Check this documentation first
2. Review existing sample content pages in the database
3. Verify slug naming follows conventions
4. Ensure `status = 'published'` and `funnel_id` is set correctly
