# Content Block Renderer Integration — V05-I06.5

**Date**: 2026-01-05  
**Status**: Implemented  
**Related Issues**: V05-I06.5, V05-I06.2

---

## Overview

The Content Block Renderer (implemented in V05-I06.2) is now integrated into patient-facing routes, enabling manifest-driven content rendering in the mobile app.

## Integration Points

### 1. Funnel Intro Pages

**Route**: `/patient/funnel/[slug]/intro`

**Server Component** (`page.tsx`):
- Loads funnel version manifest server-side via `loadFunnelVersion(slug)`
- Passes complete `FunnelContentManifest` to client component
- Implements fail-closed behavior:
  - 404: Funnel not found → `notFound()`
  - 422: Invalid manifest → Error UI with message
  - 500: Unexpected error → Re-throw for error boundary

**Client Component** (`client.tsx`):
- Checks if manifest contains `intro` page with sections
- If yes: Renders via `ContentBlockRenderer` with `pageSlug="intro"`
- If no: Falls back to legacy API content loading
- Unknown block types: PHI-free logging via `onBlockTypeError` callback

**Key Features**:
- ✅ Deterministic rendering (manifest order preserved)
- ✅ Server/client boundaries respected (manifest loaded server-side)
- ✅ Fail-closed error handling
- ✅ Unknown block types → controlled logging (no silent failures)

### 2. Standalone Content Pages

**Route**: `/patient/funnel/[slug]/content/[pageSlug]`

**Server Component** (`page.tsx`):
- Loads funnel version manifest server-side via `loadFunnelVersion(slug)`
- Validates that requested `pageSlug` exists in manifest
- Passes complete `FunnelContentManifest` to client component
- Implements fail-closed behavior (same as intro route)

**Client Component** (`client.tsx`):
- Checks if manifest contains requested page with sections
- If yes: Renders via `ContentBlockRenderer` with specific `pageSlug`
- If no: Falls back to legacy API content loading
- Unknown block types: PHI-free logging via `onBlockTypeError` callback

**Key Features**:
- ✅ Deterministic rendering per page slug
- ✅ Server/client boundaries respected
- ✅ Fail-closed error handling
- ✅ Navigation elements (back button, "Zurück zum Fragebogen")

---

## Error Handling

### HTTP Semantics

| Scenario | HTTP Code | Behavior |
|----------|-----------|----------|
| Funnel not found | 404 | `notFound()` in server component |
| Page not found in manifest | 404 | `notFound()` in server component |
| Invalid manifest schema | 422 | Error UI with message |
| Unexpected error | 500 | Re-throw for error boundary |

### Client-Side Error Handling

**Unknown Block Type**:
```tsx
const handleBlockTypeError = (blockType: string, sectionKey: string) => {
  console.error(`[ROUTE_NAME] Unsupported block type: ${blockType} in section ${sectionKey}`)
  // PHI-free logging only - don't expose to user
}

<ContentBlockRenderer 
  manifest={manifest}
  pageSlug="intro"
  onBlockTypeError={handleBlockTypeError}
/>
```

**Invalid Manifest (422)**:
- Displays error UI with "Konfigurationsfehler" heading
- Shows manifest error message
- Provides "Zurück zur Übersicht" button

---

## Manifest Loading Pattern

### Server Component Pattern

```tsx
// ✅ CORRECT: Load manifest server-side
import { loadFunnelVersion, FunnelNotFoundError, ManifestValidationError } from '@/lib/funnels/loadFunnelVersion'
import { notFound } from 'next/navigation'

export default async function Page({ params }) {
  const { slug } = await params
  
  try {
    const funnelVersion = await loadFunnelVersion(slug)
    
    return (
      <ClientComponent 
        contentManifest={funnelVersion.manifest.content_manifest}
        manifestError={null}
      />
    )
  } catch (error) {
    if (error instanceof FunnelNotFoundError) {
      notFound()
    } else if (error instanceof ManifestValidationError) {
      return (
        <ClientComponent 
          contentManifest={null}
          manifestError="Manifest-Validierung fehlgeschlagen"
        />
      )
    } else {
      throw error
    }
  }
}
```

### Client Component Pattern

```tsx
// ✅ CORRECT: Check manifest, use renderer or fallback
'use client'

import { ContentBlockRenderer } from '@/lib/components/content'

export default function ClientComponent({ contentManifest, manifestError }) {
  const [useManifestRenderer, setUseManifestRenderer] = useState(false)
  
  useEffect(() => {
    if (contentManifest) {
      const targetPage = contentManifest.pages.find(p => p.slug === pageSlug)
      
      if (targetPage && targetPage.sections.length > 0) {
        setUseManifestRenderer(true)
        return
      }
    }
    
    // Fallback to legacy API loading
    loadLegacyContent()
  }, [contentManifest, pageSlug])
  
  if (useManifestRenderer && contentManifest) {
    return (
      <ContentBlockRenderer 
        manifest={contentManifest}
        pageSlug={pageSlug}
        onBlockTypeError={handleBlockTypeError}
      />
    )
  }
  
  // Legacy content rendering
  return <LegacyContentComponent />
}
```

---

## Deterministic Rendering

**Manifest Order Preserved**:
- Pages rendered in manifest array order
- Sections sorted by `orderIndex` (if provided)
- Tie-breaker: original array index → section key (lexicographic)

**Example**:
```json
{
  "pages": [
    {
      "slug": "intro",
      "sections": [
        { "key": "c", "type": "text", "orderIndex": 2 },
        { "key": "a", "type": "hero", "orderIndex": 0 },
        { "key": "b", "type": "divider", "orderIndex": 1 }
      ]
    }
  ]
}
```
Renders: `a` → `b` → `c` (deterministic, stable)

---

## Testing

### Integration Tests

**Intro Route** (`app/patient/funnel/[slug]/intro/__tests__/integration.test.tsx`):
- ✅ AC1: Manifest-driven content renders via ContentBlockRenderer
- ✅ AC2: Fail-closed behavior for invalid manifests
- ✅ AC3: Unknown block type handling
- ✅ AC4: Fallback to legacy content when manifest is empty

**Content Page Route** (`app/patient/funnel/[slug]/content/[pageSlug]/__tests__/integration.test.tsx`):
- ✅ AC1: Manifest-driven content page renders via ContentBlockRenderer
- ✅ AC2: Fail-closed behavior for invalid manifests
- ✅ AC3: Unknown block type handling
- ✅ AC4: Fallback to legacy content when manifest is empty
- ✅ AC5: Navigation elements (back button, CTA button)

### Run Tests

```bash
# Run all integration tests
npm test -- app/patient/funnel

# Run specific integration tests
npm test -- app/patient/funnel/\\[slug\\]/intro/__tests__/integration.test.tsx
npm test -- app/patient/funnel/\\[slug\\]/content/\\[pageSlug\\]/__tests__/integration.test.tsx

# Run all content block renderer tests
npm test -- lib/components/content
```

### Build Verification

```bash
# Build project
npm run build

# Run all tests
npm test
```

---

## Fallback Behavior

**Backward Compatibility**:
- If manifest has no `intro` page or requested `pageSlug`: Falls back to legacy API content loading
- If legacy API also fails: Shows friendly error UI
- No breaking changes for existing content

**Migration Path**:
1. Deploy manifest-driven content to funnel versions
2. Pages automatically use ContentBlockRenderer when manifest available
3. Legacy content still works for funnels without manifest content

---

## Security Considerations

### PHI-Free Logging

**✅ DO**:
```tsx
console.error(`[ROUTE] Unsupported block type: ${blockType} in section ${sectionKey}`)
```

**❌ DON'T**:
```tsx
// Never log user data, PHI, or sensitive information
console.error(`User ${user.name} encountered error in ${assessment.results}`)
```

### Manifest Validation

- All manifests validated server-side before passing to renderer
- Client components accept pre-validated manifests
- Unknown block types handled gracefully (no crashes)

---

## Performance Considerations

### Server-Side Loading

- Manifest loaded once on server (cached)
- No waterfall API calls to client
- Faster initial page load

### Client-Side Rendering

- ContentBlockRenderer is client component (interactive)
- Sections render in single pass (no re-renders)
- Deterministic output (no layout shifts)

---

## Future Enhancements (Not in Scope)

- Visual block editor (V05-I06.4)
- Dynamic content loading (lazy sections)
- A/B testing for content variants
- Content analytics tracking

---

## References

- **ContentBlockRenderer Docs**: `docs/V05_I06_2_CONTENT_BLOCK_RENDERER.md`
- **Funnel Manifest Schema**: `lib/contracts/funnelManifest.ts`
- **Funnel Loader**: `lib/funnels/loadFunnelVersion.ts`
- **Mobile Shell**: `docs/mobile/SHELL_FOUNDATIONS.md`

---

## Support

For questions or issues:

1. Review this documentation
2. Check integration test files for usage examples
3. Verify manifest structure in `lib/contracts/funnelManifest.ts`
4. Run tests: `npm test -- app/patient/funnel`
5. Create GitHub issue if pattern doesn't fit use case

**Remember**: 
- Manifest loaded server-side
- Renderer used client-side
- Fail-closed for invalid manifests
- PHI-free logging only
