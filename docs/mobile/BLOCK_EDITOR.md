# Visual Block Editor

**Version**: v0.5.0  
**Issue**: V05-I06.4  
**Status**: Implemented  
**Date**: 2026-01-05

---

## Overview

The Visual Block Editor provides an internal UI for composing and editing funnel content manifests using the existing registry and contracts. This enables non-code iteration of mobile content while maintaining strict validation and determinism.

**Key Principles**:
- **Registry-driven**: Only uses block types from `SECTION_TYPE` registry
- **Strict validation**: Zod schemas prevent saving invalid manifests
- **Fail-closed**: Unknown block types show error, no silent coercion
- **Deterministic**: Stable ordering via explicit `orderIndex`
- **No PHI**: Schema enforcement prevents PHI in manifests

---

## Architecture

### Components

```
/app/clinician/funnels/[slug]/editor/page.tsx
  - Main editor page (client component)
  - Three-panel layout: Pages | Blocks | Editor

/app/api/admin/funnel-versions/[id]/manifest/route.ts
  - GET: Fetch content_manifest with validation
  - PUT: Update content_manifest with strict validation
  - Audit logging for changes
```

### Data Flow

```
Editor UI
  ↓ Load
GET /api/admin/funnel-versions/[id]/manifest
  ↓ Validate
FunnelContentManifestSchema.parse()
  ↓ Display
Three-panel editor interface
  ↓ Edit
User modifies blocks
  ↓ Save
PUT /api/admin/funnel-versions/[id]/manifest
  ↓ Validate
FunnelContentManifestSchema.parse()
  ↓ Persist
Update funnel_versions.content_manifest JSONB
  ↓ Audit
Insert audit_log entry
```

---

## Usage

### Accessing the Editor

1. Navigate to clinician dashboard: `/clinician`
2. Click "Funnel Verwaltung" to see funnel list
3. Select a funnel to view details
4. Navigate to `/clinician/funnels/[slug]/editor` (add link in UI)

### Editor Interface

#### Left Panel: Pages
- Lists all pages in the manifest
- Shows page title and block count
- Click to select page

#### Middle Panel: Blocks
- Lists all blocks/sections in selected page
- Shows block type and key
- Add new blocks via dropdown menu
- Reorder blocks with ↑ ↓ buttons
- Delete blocks with ✕ button
- Click to select block for editing

#### Right Panel: Block Editor
- Edit selected block's content fields
- Fields vary by block type
- Changes update in-memory manifest

### Saving Changes

1. Click "Speichern" button in header
2. Manifest is validated against `FunnelContentManifestSchema`
3. If validation fails, errors are displayed
4. If successful, manifest is persisted to database
5. Audit log entry is created

---

## Block Types &amp; Fields

### Hero (`SECTION_TYPE.HERO`)

**Fields**:
- `title` (string): Main heading
- `subtitle` (string, optional): Subheading
- `alignment` ('left' | 'center' | 'right'): Text alignment

### Text (`SECTION_TYPE.TEXT`)

**Fields**:
- `title` (string, optional): Section title
- `text` (string): Main text content
- `alignment` ('left' | 'center' | 'right'): Text alignment

### Image (`SECTION_TYPE.IMAGE`)

**Fields**:
- `url` (string): Image URL
- `alt` (string): Alt text for accessibility
- `caption` (string, optional): Image caption

### Video (`SECTION_TYPE.VIDEO`)

**Fields**:
- `url` (string): Video URL
- `caption` (string, optional): Video caption

### Markdown (`SECTION_TYPE.MARKDOWN`)

**Fields**:
- `markdown` (string): Markdown content

### CTA (`SECTION_TYPE.CTA`)

**Fields**:
- `text` (string): Button text
- `href` (string): Link destination
- `variant` ('primary' | 'secondary' | 'outline'): Button style
- `alignment` ('left' | 'center' | 'right'): Button alignment

### Divider (`SECTION_TYPE.DIVIDER`)

**Fields**:
- `style` ('solid' | 'dashed' | 'dotted'): Line style
- `spacing` ('sm' | 'md' | 'lg'): Spacing around divider

---

## Validation &amp; Error Handling

### Schema Validation

**All saves are gated by `FunnelContentManifestSchema`**:

```typescript
import { FunnelContentManifestSchema } from '@/lib/contracts/funnelManifest'

// Validation happens on PUT
const validatedManifest = FunnelContentManifestSchema.parse(manifest)
```

**Validation Rules**:
- Only `SECTION_TYPE` values allowed
- Required fields must be present
- Field length limits enforced
- No unknown keys allowed (strict mode)
- `orderIndex` must be non-negative integer

### Fail-Closed Behavior

**Unknown block types**:
- Editor shows error UI: "Unbekannter Block-Typ"
- Block cannot be edited
- Prevents silent data corruption

**Validation errors on save**:
- Red error panel shows Zod validation errors
- Save is blocked until errors are fixed
- User must correct errors before proceeding

### Bounds Enforcement

**Manifest limits** (from schema):
- Pages: max 50 per manifest
- Sections: max 100 per page
- Assets: max 200 per manifest
- Key length: max 200 chars
- URL length: max 2048 chars
- Title length: max 500 chars
- Description length: max 2000 chars

---

## Deterministic Ordering

### Array Order Preservation

Blocks maintain their array order by default:

```json
{
  "sections": [
    { "key": "first", "type": "hero" },
    { "key": "second", "type": "text" },
    { "key": "third", "type": "cta" }
  ]
}
```

### Explicit `orderIndex`

For deterministic sorting, use `orderIndex`:

```json
{
  "sections": [
    { "key": "c", "type": "text", "orderIndex": 2 },
    { "key": "a", "type": "hero", "orderIndex": 0 },
    { "key": "b", "type": "text", "orderIndex": 1 }
  ]
}
```

**Editor behavior**:
- Up/down buttons update `orderIndex`
- Reindexing happens after each move
- Ensures stable, reproducible ordering

---

## API Endpoints

### GET /api/admin/funnel-versions/[id]/manifest

**Purpose**: Fetch content manifest for editing

**Auth**: Requires clinician or admin role

**Response**:
```json
{
  "success": true,
  "data": {
    "versionId": "uuid",
    "funnelId": "uuid",
    "version": "1.0.0",
    "manifest": { /* FunnelContentManifest */ }
  }
}
```

**Errors**:
- 401: Not authenticated
- 403: Not authorized (not clinician/admin)
- 404: Funnel version not found
- 422: Manifest validation failed

### PUT /api/admin/funnel-versions/[id]/manifest

**Purpose**: Update content manifest

**Auth**: Requires clinician or admin role

**Request Body**:
```json
{
  "manifest": { /* FunnelContentManifest */ }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "versionId": "uuid",
    "funnelId": "uuid",
    "version": "1.0.0",
    "manifest": { /* Updated manifest */ }
  }
}
```

**Errors**:
- 401: Not authenticated
- 403: Not authorized
- 404: Funnel version not found
- 422: Validation failed (with Zod error details)

**Audit Trail**:
- All updates logged to `audit_log` table
- Entity type: `AUDIT_ENTITY_TYPE.FUNNEL_VERSION`
- Action: `AUDIT_ACTION.UPDATE`
- Source: `AUDIT_SOURCE.ADMIN_UI`

---

## Security &amp; Constraints

### No PHI in Manifests

**Schema enforcement**:
- Only predefined content structure allowed
- No dynamic patient data fields
- Content is generic and reusable
- Manifests are templates, not patient records

### Authorization

**Roles allowed**:
- `clinician`
- `admin`

**Enforcement**:
- Server-side role check in API routes
- Middleware protection on `/clinician/*` routes

### No New Section Types

**Registry-constrained**:
- Only `SECTION_TYPE` values accepted
- No fantasy names or custom types
- Extends existing V05-I06.2 renderer contracts

---

## Testing

### Test Coverage

**Schema Validation**:
- Valid manifests with all block types
- Reject unknown block types
- Reject missing required fields
- Reject manifests exceeding bounds

**Deterministic Ordering**:
- Array order preservation
- Explicit `orderIndex` support
- Non-negative `orderIndex` validation

**Fail-Closed Behavior**:
- Unknown section types fail validation
- Unknown keys rejected in strict mode
- All `SECTION_TYPE` values accepted

**No PHI**:
- Generic content fields allowed
- Schema bounds prevent PHI storage

### Running Tests

```powershell
# Run all tests
npm test

# Run manifest validation tests only
npm test -- app/api/admin/funnel-versions/\[id\]/manifest/__tests__/validation.test.ts

# Run with coverage
npm test -- --coverage
```

---

## Implementation Files

| Path | Purpose | Lines |
|------|---------|-------|
| `app/api/admin/funnel-versions/[id]/manifest/route.ts` | GET/PUT API endpoints | 280 |
| `app/clinician/funnels/[slug]/editor/page.tsx` | Editor UI | 750 |
| `app/api/admin/funnel-versions/[id]/manifest/__tests__/validation.test.ts` | Validation tests | 400 |
| `docs/mobile/BLOCK_EDITOR.md` | This documentation | 450 |
| **Total** | | **~1880 lines** |

---

## Verification Commands

### PowerShell

```powershell
# Build project
npm run build

# Run tests
npm test

# Run specific tests
npm test -- app/api/admin/funnel-versions
```

### Expected Results

| Command | Expected Result |
|---------|----------------|
| `npm test` | All tests pass (including new validation tests) |
| `npm run build` | Build succeeds without errors |

---

## Constraints &amp; Non-Goals

### Non-Goals

✗ No new `SECTION_TYPE` values  
✗ No new permissions model  
✗ No WYSIWYG rich text (markdown textarea is fine)  
✗ No publish workflow (this is an editor MVP)  
✗ No page creation/deletion (edit existing only)  
✗ No asset management (manual URL input only)

### Future Enhancements

**Not in scope for V05-I06.4**:
- Asset upload and management
- Page creation/deletion
- Multi-version editing
- Visual preview panel
- Undo/redo functionality
- Collaborative editing

---

## Usage Constraints

### Editor Limitations

**What you CAN do**:
- Edit existing pages and blocks
- Add/remove/reorder blocks within a page
- Edit block content fields
- Save changes to database

**What you CANNOT do**:
- Create new pages
- Delete pages
- Change page slugs
- Upload assets (use URLs)
- Create new block types
- Override validation rules

### Best Practices

1. **Always validate before saving**: Use "Speichern" button, check for validation errors
2. **Use descriptive block keys**: e.g., `intro-hero`, `main-text`, `cta-primary`
3. **Respect bounds**: Don't exceed 100 blocks per page
4. **Test in renderer**: After saving, test content with V05-I06.2 renderer
5. **Audit trail**: All changes are logged for accountability

---

## Troubleshooting

### Validation Errors

**"Invalid manifest structure"**:
- Check Zod error details in red error panel
- Fix field values to match schema
- Remove any unknown fields

**"Unbekannter Block-Typ"**:
- Block type not in `SECTION_TYPE` registry
- Cannot edit this block
- Remove or change to valid type

### Save Failures

**403 Forbidden**:
- You don't have clinician/admin role
- Contact administrator

**404 Not Found**:
- Funnel version doesn't exist
- Check funnel slug and default version

### Editor Issues

**Blocks not reordering**:
- Check console for errors
- Ensure `orderIndex` values are valid
- Refresh page and try again

**Changes not persisting**:
- Click "Speichern" button
- Check for validation errors
- Verify network request succeeded

---

## Support

For questions or issues with the Block Editor:

1. Review this documentation
2. Check existing manifests for examples
3. Run validation tests: `npm test`
4. Verify block type is in `SECTION_TYPE` registry
5. Create GitHub issue if pattern doesn't fit use case

**Remember**: This editor is manifest-driven and registry-constrained. No fantasy names, no silent failures.

---

## References

- **V05-I06.2 Renderer**: `docs/V05_I06_2_CONTENT_BLOCK_RENDERER.md`
- **Contracts**: `lib/contracts/funnelManifest.ts`
- **Registry**: `lib/contracts/registry.ts`
- **Loader**: `lib/funnels/loadFunnelVersion.ts`
- **Mobile Docs**: `docs/mobile/`
