# Deprecated UI Components

## Status: ⚠️ DEPRECATED

The UI components in the following directories are **deprecated** and should not be used in new code:

- `docs/clinician_dashboard/components/ui/`
- `docs/mobile/components/ui/`

## Reason for Deprecation

These components were part of exploratory design work and documentation but are not part of the official v0.4 Design System. They are duplicates that provide similar functionality to the official components.

## Migration Path

**Use the official v0.4 Design System components instead:**

All form controls and UI components should use the shared components from `@/lib/ui`:

### Form Controls

| Deprecated (DO NOT USE) | Use Instead |
|------------------------|-------------|
| `docs/*/components/ui/input.tsx` | `@/lib/ui/Input` |
| `docs/*/components/ui/textarea.tsx` | `@/lib/ui/Textarea` |
| `docs/*/components/ui/select.tsx` | `@/lib/ui/Select` |
| `docs/*/components/ui/label.tsx` | `@/lib/ui/Label` |
| `docs/*/components/ui/form.tsx` | `@/lib/ui/FormField` |

### Other Components

| Deprecated (DO NOT USE) | Use Instead |
|------------------------|-------------|
| `docs/*/components/ui/button.tsx` | `@/lib/ui/Button` |
| `docs/*/components/ui/card.tsx` | `@/lib/ui/Card` |
| `docs/*/components/ui/badge.tsx` | `@/lib/ui/Badge` |
| `docs/*/components/ui/table.tsx` | `@/lib/ui/Table` |
| `docs/*/components/ui/progress.tsx` | `@/lib/ui/Progress` |
| `docs/*/components/ui/tabs.tsx` | `@/lib/ui/Tabs` |

## Official Design System

The official v0.4 Design System components are located in:

```
lib/ui/
├── Input.tsx          ✅ Use this
├── Textarea.tsx       ✅ Use this
├── Select.tsx         ✅ Use this
├── Label.tsx          ✅ Use this
├── FormField.tsx      ✅ Use this
├── Button.tsx         ✅ Use this
├── Card.tsx           ✅ Use this
├── Badge.tsx          ✅ Use this
├── Table.tsx          ✅ Use this
├── Progress.tsx       ✅ Use this
├── Tabs.tsx           ✅ Use this
└── ...
```

## Import Examples

### ❌ Don't Do This

```tsx
import { Input } from '@/docs/clinician_dashboard/components/ui/input'
import { Button } from '@/docs/mobile/components/ui/button'
```

### ✅ Do This Instead

```tsx
import { Input, Button, Textarea, Select } from '@/lib/ui'
```

## Benefits of the Official Components

The official v0.4 Design System components provide:

- ✅ Consistent styling across the entire application
- ✅ Built-in error states and helper text
- ✅ Proper accessibility (ARIA attributes, focus management)
- ✅ Dark mode support out of the box
- ✅ Design token integration
- ✅ Type-safe props with TypeScript
- ✅ Responsive size variants (sm, md, lg)
- ✅ Comprehensive documentation

## Cleanup Plan

These deprecated components may be removed in a future cleanup:

1. Verify no imports from `docs/*/components/ui/` exist in the codebase ✅ (verified 2025-12-13)
2. Add this deprecation notice ✅ (completed 2025-12-13)
3. Consider removing in future maintenance window

## Questions?

If you have questions about migrating from these deprecated components, refer to:

- [lib/ui/README.md](../lib/ui/README.md) - Official component documentation
- [lib/ui/index.ts](../lib/ui/index.ts) - Available exports
- Individual component files in `lib/ui/` for detailed API documentation
