# F2 Content Page Editor - Quick Start Guide

## 🎯 What's Been Implemented

A complete CRUD content management system for clinicians with:
- ✅ Full markdown editing with live preview
- ✅ All required fields (title, slug, funnel, category, status, priority)
- ✅ Draft and publish workflow
- ✅ Slug validation (format + uniqueness)
- ✅ Responsive, mobile-friendly UI

## 📁 File Structure

```
app/
├── admin/content/
│   ├── page.tsx                    # Content dashboard (list view)
│   ├── new/page.tsx                # Create new page
│   └── [id]/page.tsx               # Edit existing page
├── api/admin/content-pages/
│   ├── route.ts                    # GET all + POST create
│   └── [id]/route.ts               # GET one + PATCH update
└── components/
    ├── ContentPageEditor.tsx       # Main editor component
    └── MarkdownRenderer.tsx        # Markdown preview renderer

supabase/migrations/
└── 20251210132500_add_content_pages_category_priority.sql

lib/types/
└── content.ts                      # TypeScript types

docs/
├── F2_CONTENT_EDITOR.md            # Detailed documentation
└── F2_IMPLEMENTATION_SUMMARY.md    # Implementation details
```

## 🚀 Usage

### Creating a New Page

1. Navigate to `/admin/content`
2. Click "Neue Seite anlegen"
3. Fill in:
   - **Titel** (required): The page title
   - **Slug** (required): Auto-generated, editable URL slug
   - **Kategorie**: Optional category (e.g., "info", "tutorial")
   - **Funnel**: Optional link to a funnel
   - **Priorität**: Number for sorting (higher = more important)
   - **Auszug**: Optional excerpt/description
   - **Inhalt**: Markdown content (required)
4. Use the live preview to see how it renders
5. Click "Als Entwurf speichern" or "Veröffentlichen"

### Editing a Page

1. Navigate to `/admin/content`
2. Click on any page in the table
3. Modify the fields as needed
4. Save changes

## 🔧 Technical Details

### API Endpoints

**GET /api/admin/content-pages**
- Returns all content pages with metadata
- Includes funnel information
- Sorted by `updated_at` DESC

**POST /api/admin/content-pages**
- Creates new content page
- Required: `title`, `slug`, `body_markdown`, `status`
- Optional: `excerpt`, `category`, `priority`, `funnel_id`, `layout`
- Returns 409 if slug already exists

**GET /api/admin/content-pages/[id]**
- Returns single content page by ID
- Includes funnel information

**PATCH /api/admin/content-pages/[id]**
- Updates existing content page
- Same fields as POST
- Returns 409 if slug conflicts with another page

### Validation

**Client-side:**
- Real-time slug format validation
- Required field checks
- Visual error messages

**Server-side:**
- Slug format: `/^[a-z0-9-]+$/`
- Slug uniqueness check
- Required fields enforcement
- Proper null handling for optional fields

### Component Props

```typescript
type ContentPageEditorProps = {
  initialData?: Partial<ContentPageEditorData>
  mode: 'create' | 'edit'
  pageId?: string  // Required when mode='edit'
}
```

## 🎨 UI Features

- **Split View**: Editor on left, preview on right
- **Toggle Preview**: Hide preview for more editor space
- **Auto Slug**: Automatically generates from title
- **Live Preview**: Real-time markdown rendering
- **Smart Buttons**: Disabled during save operations
- **Error Feedback**: Clear error messages with specific guidance

## 🔒 Security

- Protected by `/admin/*` middleware
- Requires `clinician` role
- Server-side validation on all inputs
- Slug sanitization prevents injection
- Service role key for database operations

## 📊 Database Schema

```sql
-- New columns added to content_pages
category text                   -- Optional category
priority integer DEFAULT 0      -- Sort priority (higher = more important)
```

## ✅ Testing Checklist

- [x] TypeScript compilation
- [x] Next.js build
- [x] Code review
- [x] Prettier formatting
- [ ] Manual end-to-end testing (requires deployed app)
- [ ] Slug validation testing
- [ ] Markdown preview testing
- [ ] Draft/publish flow testing

## 📝 Example Usage

### Creating a Tutorial Page

```
Title: "Wie man den Stress-Check verwendet"
Slug: "stress-check-tutorial"
Category: "tutorial"
Priority: 10
Funnel: [Select "Stress Assessment"]
Excerpt: "Eine Schritt-für-Schritt-Anleitung"
Content:
# Stress-Check Tutorial

## Schritt 1: Anmelden
...
```

### Creating an Info Page

```
Title: "Über Stress und Resilienz"
Slug: "stress-info"
Category: "info"
Priority: 5
Funnel: [None]
Excerpt: "Grundlegende Informationen zu Stress"
Content:
# Was ist Stress?

Stress ist eine natürliche Reaktion...
```

## 🐛 Troubleshooting

**Slug already exists error:**
- Change the slug to something unique
- Check existing pages in the dashboard

**Preview not updating:**
- Click the toggle button twice to refresh
- Check browser console for errors

**Can't save page:**
- Ensure all required fields are filled
- Check slug format (only lowercase, numbers, hyphens)
- Verify you have clinician role

## 🔄 Future Enhancements

Potential improvements for future iterations:
- Image upload for markdown content
- Bulk operations (delete, duplicate)
- Version history
- Preview before publish
- Search/filter in editor
- Auto-save drafts
- Rich text editor option

## 📚 Related Documentation

- Main docs: `docs/F2_CONTENT_EDITOR.md`
- Implementation: `docs/F2_IMPLEMENTATION_SUMMARY.md`
- Database schema: `schema/schema.sql`
- Migration: `supabase/migrations/20251210132500_add_content_pages_category_priority.sql`

---

**Status**: ✅ Complete and ready for deployment
**Last Updated**: 2025-12-10
