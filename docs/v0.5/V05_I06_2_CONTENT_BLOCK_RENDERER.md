# V05-I06.2 — Content Block Renderer (Cards/Sections Stack)

**Version**: v0.5.0  
**Date**: 2026-01-04  
**Status**: Implemented  
**Issue**: V05-I06.2 — Content Block Renderer

---

## Overview

This document describes the manifest-driven Content Block Renderer implementation for Rhythmologicum Connect v0.5 Mobile UI. The renderer transforms `content_manifest` data from funnel versions into deterministic UI stacks (pages → sections → blocks).

**Key Principles**:
- **No Fantasy Names**: Only uses block types from `SECTION_TYPE` registry
- **Deterministic**: Same manifest input → identical output
- **Fail-Closed**: Unknown block types → controlled error
- **Server/Client Boundaries**: Manifest loaded server-side, rendered client-side

---

## Architecture

### Component Hierarchy

```
ContentBlockRenderer (orchestrator)
  ↓
PageRenderer (page-level)
  ↓
SectionRenderer (section-level, type-safe switch)
  ↓
Block Renderers (7 types)
  - HeroBlockRenderer
  - TextBlockRenderer
  - ImageBlockRenderer
  - VideoBlockRenderer
  - MarkdownBlockRenderer
  - CTABlockRenderer
  - DividerBlockRenderer
```

### Data Flow

```
Server Component (loads manifest)
  ↓ FunnelContentManifest
Client Component (ContentBlockRenderer)
  ↓ pages array
PageRenderer (renders each page)
  ↓ sections array
SectionRenderer (type-safe switch)
  ↓ specific section type
Block Renderer (renders UI)
```

---

## Implementation Files

### Core Components

| File | Purpose | Type |
|------|---------|------|
| `lib/components/content/ContentBlockRenderer.tsx` | Main orchestrator | Client Component |
| `lib/components/content/PageRenderer.tsx` | Page-level renderer | Client Component |
| `lib/components/content/SectionRenderer.tsx` | Type-safe section switch | Client Component |
| `lib/components/content/CardRenderer.tsx` | Optional card wrapper | Client Component |

### Block Renderers

| File | Block Type | SECTION_TYPE |
|------|------------|--------------|
| `blocks/HeroBlockRenderer.tsx` | Hero section | `SECTION_TYPE.HERO` |
| `blocks/TextBlockRenderer.tsx` | Text content | `SECTION_TYPE.TEXT` |
| `blocks/ImageBlockRenderer.tsx` | Images | `SECTION_TYPE.IMAGE` |
| `blocks/VideoBlockRenderer.tsx` | Videos | `SECTION_TYPE.VIDEO` |
| `blocks/MarkdownBlockRenderer.tsx` | Markdown | `SECTION_TYPE.MARKDOWN` |
| `blocks/CTABlockRenderer.tsx` | Call-to-action | `SECTION_TYPE.CTA` |
| `blocks/DividerBlockRenderer.tsx` | Dividers | `SECTION_TYPE.DIVIDER` |

### Tests

| File | Coverage |
|------|----------|
| `__tests__/ContentBlockRenderer.test.tsx` | All supported types, unknown types, deterministic order, empty manifests |

---

## Usage

### Server Component (loads manifest)

```tsx
// app/patient/funnel/[slug]/intro/page.tsx
import { loadFunnelVersion } from '@/lib/funnels/loadFunnelVersion'
import { ContentBlockRenderer } from '@/lib/components/content/ContentBlockRenderer'

export default async function FunnelIntroPage({ params }: { params: { slug: string } }) {
  const funnelVersion = await loadFunnelVersion(params.slug)
  
  return (
    <ContentBlockRenderer 
      manifest={funnelVersion.manifest.content_manifest}
      pageSlug="intro"
    />
  )
}
```

### Client Component (renders blocks)

```tsx
'use client'

import { ContentBlockRenderer } from '@/lib/components/content/ContentBlockRenderer'

function MyPage({ manifest }: { manifest: FunnelContentManifest }) {
  return (
    <div>
      <h1>My Content</h1>
      <ContentBlockRenderer manifest={manifest} />
    </div>
  )
}
```

### Error Handling

```tsx
<ContentBlockRenderer 
  manifest={manifest}
  onBlockTypeError={(blockType, sectionKey) => {
    console.error(`Unsupported block type: ${blockType} in section ${sectionKey}`)
    // Custom error handling
  }}
/>
```

---

## Block Types & Content Fields

### Hero Block (`SECTION_TYPE.HERO`)

**Content Fields**:
- `title` (string): Main heading
- `subtitle` (string, optional): Subheading
- `backgroundImage` (string, optional): Background image URL
- `alignment` ('left' | 'center' | 'right', default: 'center')

**Example**:
```json
{
  "key": "hero",
  "type": "hero",
  "content": {
    "title": "Stress Assessment",
    "subtitle": "Understand your stress levels",
    "alignment": "center"
  }
}
```

### Text Block (`SECTION_TYPE.TEXT`)

**Content Fields**:
- `title` (string, optional): Section title
- `text` (string): Main text content
- `alignment` ('left' | 'center' | 'right', default: 'left')

**Example**:
```json
{
  "key": "intro",
  "type": "text",
  "content": {
    "title": "Welcome",
    "text": "This assessment will help...",
    "alignment": "left"
  }
}
```

### Image Block (`SECTION_TYPE.IMAGE`)

**Content Fields**:
- `url` (string): Image URL (can also use `contentRef`)
- `alt` (string): Alt text for accessibility
- `caption` (string, optional): Image caption
- `width` (number, optional): Image width
- `height` (number, optional): Image height

### Video Block (`SECTION_TYPE.VIDEO`)

**Content Fields**:
- `url` (string): Video URL (can also use `contentRef`)
- `caption` (string, optional): Video caption
- `poster` (string, optional): Thumbnail/poster image
- `controls` (boolean, default: true): Show video controls

### Markdown Block (`SECTION_TYPE.MARKDOWN`)

**Content Fields**:
- `markdown` (string): Markdown content (can also use `contentRef`)

**Features**:
- GitHub-flavored markdown (GFM) support
- Tables, strikethrough, task lists, etc.

### CTA Block (`SECTION_TYPE.CTA`)

**Content Fields**:
- `text` (string): Button text
- `href` (string): Link destination
- `variant` ('primary' | 'secondary' | 'outline', default: 'primary')
- `alignment` ('left' | 'center' | 'right', default: 'center')

### Divider Block (`SECTION_TYPE.DIVIDER`)

**Content Fields**:
- `style` ('solid' | 'dashed' | 'dotted', default: 'solid')
- `spacing` ('sm' | 'md' | 'lg', default: 'md')

---

## Deterministic Rendering

### Order Preservation

**Manifest order is preserved**:
```json
{
  "pages": [
    { "slug": "page-2", "sections": [...] },  // Rendered first
    { "slug": "page-1", "sections": [...] }   // Rendered second
  ]
}
```

### Order Index Support

**Sections can be sorted by `orderIndex`**:
```json
{
  "sections": [
    { "key": "c", "type": "text", "orderIndex": 2 },
    { "key": "a", "type": "hero", "orderIndex": 0 },
    { "key": "b", "type": "text", "orderIndex": 1 }
  ]
}
// Renders: a → b → c
```

---

## Error Handling

### Unknown Block Type

**Controlled Error (Fail-Closed)**:
```typescript
// Unknown type in manifest
{
  "key": "invalid",
  "type": "fantasy_type"  // ❌ Not in SECTION_TYPE
}

// Throws UnsupportedBlockTypeError
throw new UnsupportedBlockTypeError('fantasy_type', 'invalid')
```

**Custom Error Handler**:
```tsx
<ContentBlockRenderer 
  manifest={manifest}
  onBlockTypeError={(blockType, sectionKey) => {
    // Log error, show fallback, etc.
    console.error(`Unsupported: ${blockType}`)
  }}
/>
```

---

## Testing

### Test Coverage

**All Acceptance Criteria**:
- ✅ AC1: Manifest-driven, no fantasy names
- ✅ AC2: Deterministic rendering
- ✅ AC3: UI stack pattern
- ✅ AC4: Server/client boundaries
- ✅ AC5: Test coverage

### Run Tests

```powershell
# PowerShell
npm test -- lib/components/content/__tests__/ContentBlockRenderer.test.tsx
```

**Expected Output**:
```
Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
```

---

## Verification Commands

### PowerShell

```powershell
# Run all tests
npm test

# Run content block renderer tests only
npm test -- lib/components/content/__tests__/ContentBlockRenderer.test.tsx

# Build project
npm run build

# Lint code
npm run lint
```

### Expected Results

| Command | Expected Result |
|---------|----------------|
| `npm test` | All tests pass (including 17 ContentBlockRenderer tests) |
| `npm run build` | Build succeeds without errors |
| `npm run lint` | No linting errors |

---

## Integration Points

### Minimal Integration

**No new routes created** - renderer designed to be integrated into existing pages.

**Example Integration Locations**:
- `app/patient/funnel/[slug]/intro/page.tsx` - Funnel intro pages
- `app/patient/content/[slug]/page.tsx` - Standalone content pages
- `app/clinician/content/[slug]/page.tsx` - Clinician content pages

**Minimal Diff Pattern**:
```tsx
// Before
export default async function IntroPage() {
  return <div>Hardcoded intro content</div>
}

// After  
export default async function IntroPage({ params }) {
  const funnelVersion = await loadFunnelVersion(params.slug)
  return <ContentBlockRenderer manifest={funnelVersion.manifest.content_manifest} />
}
```

---

## Security & Boundaries

### Server-Only Data Loading

**✅ Correct Pattern**:
```tsx
// Server Component (loads manifest)
import { loadFunnelVersion } from '@/lib/funnels/loadFunnelVersion'

const manifest = await loadFunnelVersion(slug)

// Pass to client component
<ContentBlockRenderer manifest={manifest.manifest.content_manifest} />
```

**❌ Incorrect Pattern**:
```tsx
// Don't load manifest in client component
'use client'
const manifest = await loadFunnelVersion(slug) // ❌ Server-only function
```

### No Secrets in Client Components

- ✅ All renderers are client components
- ✅ No database clients in renderer code
- ✅ No service role keys
- ✅ Manifest pre-validated server-side

---

## Implementation Evidence

### Files Created

| Path | Lines | Purpose |
|------|-------|---------|
| `lib/components/content/ContentBlockRenderer.tsx` | 81 | Main orchestrator |
| `lib/components/content/PageRenderer.tsx` | 55 | Page renderer |
| `lib/components/content/SectionRenderer.tsx` | 98 | Section switch |
| `lib/components/content/CardRenderer.tsx` | 32 | Card wrapper |
| `lib/components/content/blocks/HeroBlockRenderer.tsx` | 52 | Hero block |
| `lib/components/content/blocks/TextBlockRenderer.tsx` | 43 | Text block |
| `lib/components/content/blocks/ImageBlockRenderer.tsx` | 52 | Image block |
| `lib/components/content/blocks/VideoBlockRenderer.tsx` | 48 | Video block |
| `lib/components/content/blocks/MarkdownBlockRenderer.tsx` | 36 | Markdown block |
| `lib/components/content/blocks/CTABlockRenderer.tsx` | 60 | CTA block |
| `lib/components/content/blocks/DividerBlockRenderer.tsx` | 35 | Divider block |
| `lib/components/content/__tests__/ContentBlockRenderer.test.tsx` | 418 | Tests |
| **Total** | **1010 lines** | **12 files** |

### Test Results

```
Test Suites: 1 passed
Tests:       17 passed
```

**Test Categories**:
- Supported block types (7 types)
- Unknown type handling (2 tests)
- Deterministic rendering (3 tests)
- Empty manifest handling (3 tests)
- UI stack pattern (3 tests)
- Server/client boundaries (2 tests)

### Build Status

```
✓ npm test       # All tests pass
✓ npm run build  # Build succeeds
```

---

## Done Criteria

- [x] Tests green (`npm test`)
- [x] Build green (`npm run build`)
- [x] No new terms/types outside registry
- [x] Renderer works with existing manifest
- [x] Reusable for Patient/Clinician/Nurse views
- [x] All 7 SECTION_TYPEs supported
- [x] Unknown types → controlled error
- [x] Deterministic rendering verified
- [x] Documentation complete

---

## Next Steps

### Integration (Not in Scope)

**Future work** (separate issues):
- Integrate renderer into patient funnel intro pages
- Integrate renderer into content pages
- Add UI smoke tests with real manifests

### Enhancement Ideas

**Not required for v0.5**:
- Block-level animations
- Custom block types via plugins
- Visual block editor (V05-I06.4)

---

## References

- **Contracts**: `lib/contracts/funnelManifest.ts`
- **Registry**: `lib/contracts/registry.ts`
- **Loader**: `lib/funnels/loadFunnelVersion.ts`
- **Mobile Shell**: `docs/mobile/SHELL_FOUNDATIONS.md`

---

## Support

For questions or issues with the Content Block Renderer:

1. Review this documentation
2. Check test files for usage examples
3. Verify block type is in `SECTION_TYPE` registry
4. Run tests: `npm test`
5. Create GitHub issue if pattern doesn't fit use case

**Remember**: This renderer is manifest-driven and registry-constrained. No fantasy names, no silent failures.
