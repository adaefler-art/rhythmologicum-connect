# F8 Quick Start: Adding Result Content Blocks

## How to Add a New Result Content Block

This guide shows you how to add dynamic content blocks to the stress funnel result page.

### Step 1: Create Content in Database

You can add content via migration or directly in the database:

#### Option A: Via Migration (Recommended)

Create a new migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_my_result_content.sql`

```sql
-- Add your result content block
DO $$
DECLARE
  stress_funnel_id uuid;
BEGIN
  -- Get the stress funnel ID
  SELECT id INTO stress_funnel_id 
  FROM public.funnels 
  WHERE slug = 'stress-assessment' 
  LIMIT 1;

  IF stress_funnel_id IS NOT NULL THEN
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id,
      category,
      priority
    ) VALUES (
      'result-my-new-content',              -- Unique slug
      'My New Result Block Title',           -- Page title
      'Short description for this block',    -- Excerpt (optional)
      '# Main Content\n\nYour markdown content here...',  -- Body
      'published',                           -- Status: draft or published
      'default',                             -- Layout: default, wide, or hero
      stress_funnel_id,                      -- Funnel reference
      'result',                              -- IMPORTANT: Must be 'result'
      60                                     -- Priority (higher = shown first)
    ) ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;
```

Run the migration:
```bash
supabase migration up
```

#### Option B: Via SQL Console

```sql
INSERT INTO public.content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  funnel_id,
  category,
  priority
) VALUES (
  'result-my-content',
  'My Content Title',
  'Brief excerpt',
  '# My Content\n\nYour markdown here...',
  'published',
  (SELECT id FROM funnels WHERE slug = 'stress-assessment'),
  'result',
  60
);
```

### Step 2: (Optional) Add Sections

Sections allow you to structure longer content into collapsible or sequential parts:

```sql
-- Get the content page ID
DO $$
DECLARE
  page_id uuid;
BEGIN
  SELECT id INTO page_id 
  FROM public.content_pages 
  WHERE slug = 'result-my-new-content';

  IF page_id IS NOT NULL THEN
    -- Add sections
    INSERT INTO public.content_page_sections (
      content_page_id,
      title,
      body_markdown,
      order_index
    ) VALUES
    (
      page_id,
      'Section 1 Title',
      '## Section 1\n\nContent for first section...',
      1
    ),
    (
      page_id,
      'Section 2 Title',
      '## Section 2\n\nContent for second section...',
      2
    );
  END IF;
END $$;
```

### Step 3: Verify Content Appears

1. **Reload the result page**: Navigate to any stress assessment result
2. **Check ordering**: Content blocks appear in order of `priority` (highest first)
3. **Verify markdown**: All markdown should be properly styled

## Content Block Best Practices

### Slug Naming
- **Pattern**: `result-descriptive-name`
- **Examples**: 
  - ✅ `result-next-steps`
  - ✅ `result-understanding-scores`
  - ❌ `my-page` (no category prefix)
  - ❌ `result page` (spaces not allowed)

### Category
- **Always** set `category = 'result'` for result page content
- Other categories: `intro`, `info`, `outro`

### Priority
- **Higher numbers** = Shown first
- Suggested ranges:
  - 90-100: Critical information (e.g., crisis hotlines)
  - 70-89: Important content (e.g., score interpretation)
  - 50-69: Helpful tips and resources
  - 1-49: Optional/supplementary content

### Status
- `draft`: Not visible to users (for testing)
- `published`: Visible to all users
- `archived`: Hidden but preserved in database

### Markdown Tips
- Use `#` for main heading (H1)
- Use `##` for section headings (H2)
- Lists work: `- Item 1`, `1. Item 1`
- **Bold**: `**text**`
- *Italic*: `*text*`
- Links: `[Text](url)`
- Blockquotes: `> Quote text`

## Example: Crisis Hotline Block

```sql
DO $$
DECLARE
  stress_funnel_id uuid;
BEGIN
  SELECT id INTO stress_funnel_id 
  FROM public.funnels 
  WHERE slug = 'stress-assessment';

  IF stress_funnel_id IS NOT NULL THEN
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      funnel_id,
      category,
      priority
    ) VALUES (
      'result-crisis-support',
      'Brauchen Sie sofortige Hilfe?',
      'Kostenlose und vertrauliche Unterstützung rund um die Uhr.',
      '# Brauchen Sie sofortige Hilfe?

Wenn Sie sich in einer akuten Krise befinden, zögern Sie nicht, Hilfe zu suchen.

## Notfall-Kontakte (24/7)

📞 **Telefonseelsorge**
- 0800 111 0 111
- 0800 111 0 222
- Kostenlos, anonym, rund um die Uhr

🚑 **Ärztlicher Notdienst**
- 116 117
- Bei gesundheitlichen Problemen außerhalb der Praxiszeiten

🆘 **Notfall**
- 112
- Bei akuter Lebensgefahr

## Online-Hilfe

- [www.telefonseelsorge.de](https://www.telefonseelsorge.de)
- Chat und Mail-Beratung verfügbar

---

**Ihre Gesundheit ist wichtig.** Es ist ein Zeichen von Stärke, Hilfe zu suchen.',
      'published',
      stress_funnel_id,
      'result',
      95  -- High priority, shown near top
    ) ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;
```

## Testing Your Content

### 1. Check in Database
```sql
SELECT slug, title, category, priority, status
FROM content_pages
WHERE category = 'result'
ORDER BY priority DESC;
```

### 2. Test API Endpoint
```bash
curl "http://localhost:3000/api/content-resolver?funnel=stress-assessment&category=result"
```

### 3. Visual Test
1. Complete a stress assessment
2. View the result page
3. Scroll to see your new content block

## Troubleshooting

### Content doesn't appear
- ✅ Check `status = 'published'`
- ✅ Check `category = 'result'`
- ✅ Check `funnel_id` is correct
- ✅ Check `deleted_at IS NULL`

### Content appears in wrong order
- Adjust `priority` values (higher = first)

### Markdown not rendering
- Check for proper markdown syntax
- Test markdown in a validator: https://markdown-it.github.io/

### Content appears on wrong page
- Verify `category` field matches intended page:
  - `intro` → Funnel start page
  - `info` → Both start and result
  - `result` → Result page only

## Advanced: Conditional Content (Future)

Currently all result-category content appears on all result pages. Future enhancements could add:

```sql
-- Add metadata to filter content by score range
ALTER TABLE content_pages 
ADD COLUMN display_conditions JSONB;

-- Example condition
UPDATE content_pages
SET display_conditions = '{
  "risk_level": ["high", "moderate"],
  "min_stress_score": 20
}'
WHERE slug = 'result-high-stress-resources';
```

This would require frontend logic to filter content based on assessment scores.

## Related Documentation

- [F8 Implementation Summary](./F8_IMPLEMENTATION_SUMMARY.md) - Full technical documentation
- [F5 Content Resolver](./F5_CONTENT_RESOLVER.md) - Content resolution logic
- [D1 Content Pages](./D1_CONTENT_PAGES.md) - Content pages schema
