# Design System Library

This directory contains the canonical design system implementation for Rhythmologicum Connect.

## Files

### `tokens.ts`
**Single source of truth** for all design tokens. This file defines:
- Color palettes (primary, neutral, semantic, background)
- Typography scale (font sizes, line heights, weights)
- Spacing scale (margins, padding, gaps)
- Border radius values
- Shadow definitions
- Motion/animation tokens
- Layout constraints

**Usage:**
```typescript
import { colors, spacing, typography } from '@/lib/design/tokens'

const buttonStyle = {
  backgroundColor: colors.primary[600],
  padding: spacing.lg,
  fontSize: typography.fontSize.base,
}
```

## Related Files

- `/docs/design/TOKENS.md` - Canonical specification and usage guide
- `/app/globals.css` - CSS custom properties implementation
- `/scripts/design/export-tokens.js` - JSON export for external tools
- `/lib/design-tokens.ts` - Backward compatibility re-export (deprecated)
- `/lib/design-tokens-loader.ts` - Runtime token loader with org overrides

## Export Pipeline

To export tokens as JSON for external tooling (iOS, Android, Figma):

```bash
npm run tokens:export
```

This generates:
- `/public/design-tokens.json` - Platform-agnostic token specification
- `/public/design-tokens-platforms.json` - Platform-specific format hints

## Documentation

For detailed documentation, see:
- [Canonical Token Specification](/docs/design/TOKENS.md)
- [V0.4 Token Details](/docs/design/v0.4/tokens.md)
- [Usage Examples](/docs/design/v0.4/usage-examples.md)
- [Design System Overview](/docs/V0_4_DESIGN_SYSTEM.md)

## Non-Goals

- Full rebranding (tokens provide structural basis)
- Figma automation workflow (manual sync for now)
- Dynamic theme switching at runtime (future enhancement)

---

**Maintainer:** Design System Team  
**Version:** 1.0.0  
**Last Updated:** 2026-01-11
