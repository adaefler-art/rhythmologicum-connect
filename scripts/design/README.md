# Design Scripts

Scripts for managing and exporting design tokens.

## Available Scripts

### `export-tokens.js`
Exports design tokens from TypeScript source to JSON format for external tooling.

**Usage:**
```bash
npm run tokens:export
# or
node scripts/design/export-tokens.js
```

**Output:**
- `/public/design-tokens.json` - Platform-agnostic token specification
- `/public/design-tokens-platforms.json` - Platform-specific hints for iOS, Android, Figma

**Use Cases:**
- iOS app development (convert to Swift UIColor extensions)
- Android app development (convert to colors.xml/dimens.xml)
- Figma design tokens plugin import
- Documentation generation
- Third-party design tool integration

### `export-tokens.ts`
TypeScript version of the export script (requires compilation).

## Token Structure

The exported JSON contains:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-11T...",
  "colors": { ... },
  "typography": { ... },
  "spacing": { ... },
  "radii": { ... },
  "shadows": { ... },
  "motion": { ... },
  "layout": { ... }
}
```

## Platform Integration

### iOS
```swift
// Parse JSON and generate extensions
extension UIColor {
    static let primary500 = UIColor(hex: "#0ea5e9")
}
```

### Android
```xml
<!-- colors.xml -->
<color name="primary_500">#0ea5e9</color>
```

### Figma
Import using [Figma Tokens plugin](https://docs.tokens.studio/)

## Related Documentation

- [Canonical Token Specification](/docs/design/TOKENS.md)
- [Design Token Source](/lib/design/tokens.ts)

---

**Last Updated:** 2026-01-11
