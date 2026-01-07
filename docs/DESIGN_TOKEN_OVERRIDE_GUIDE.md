# Design Token Override System - Migration Guide

## V05-I09.2: Design Tokens Parameterisierung

This guide explains how to use the new design token override system that supports tenant/clinic-level customization.

## Overview

The design token override system allows organizations to customize design tokens (colors, spacing, typography, etc.) without modifying code. Tokens are stored in the database and can be overridden per organization.

## Architecture

### 1. Database Layer
- **Table**: `design_tokens` - Stores organization-specific token overrides
- **Function**: `get_design_tokens(org_id)` - Returns merged tokens
- **RLS**: Admin/clinician can manage, all authenticated users can read

### 2. Token Loading (Server-Side)
- **File**: `lib/design-tokens-loader.ts`
- **Functions**:
  - `loadDesignTokens(organizationId)` - Load tokens with overrides
  - `getUserOrganizationId()` - Get current user's organization
  - `loadUserDesignTokens()` - Load tokens for current user

### 3. React Context (Client-Side)
- **File**: `lib/contexts/DesignTokensContext.tsx`
- **Components**:
  - `DesignTokensProvider` - Context provider
  - `useDesignTokens()` - Hook to access tokens

### 4. API Endpoints
- **GET** `/api/admin/design-tokens` - Fetch token overrides
- **POST** `/api/admin/design-tokens` - Create/update token overrides

## Usage Guide

### Option 1: Using Tokens in Client Components (Recommended)

For client components that need to respect organization-specific tokens:

```tsx
'use client'

import { useDesignTokens } from '@/lib/contexts/DesignTokensContext'

export function MyComponent() {
  const { spacing, colors, typography } = useDesignTokens()
  
  return (
    <div style={{ 
      padding: spacing.lg, 
      backgroundColor: colors.primary[50],
      fontSize: typography.fontSize.base 
    }}>
      This component uses design tokens from context
    </div>
  )
}
```

### Option 2: Using Default Tokens (Existing Pattern)

For components that don't need organization-specific tokens:

```tsx
'use client'

import { spacing, colors, typography } from '@/lib/design-tokens'

export function MyComponent() {
  return (
    <div style={{ 
      padding: spacing.lg, 
      backgroundColor: colors.primary[50] 
    }}>
      This component uses default tokens
    </div>
  )
}
```

### Option 3: Server-Side Token Loading

For server components that need to pass tokens to client components:

```tsx
// Server Component (page.tsx or layout.tsx)
import { loadUserDesignTokens } from '@/lib/design-tokens-loader'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'
import { MyClientComponent } from './MyClientComponent'

export default async function Page() {
  const tokens = await loadUserDesignTokens()
  
  return (
    <DesignTokensProvider tokens={tokens}>
      <MyClientComponent />
    </DesignTokensProvider>
  )
}
```

## Setting Up Organization Overrides

### Via API

```typescript
// Create/update a token override
const response = await fetch('/api/admin/design-tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'org-uuid',
    token_category: 'colors',
    token_key: 'primary.500',
    token_value: '#1e40af', // blue-700 instead of sky-500
    is_active: true
  })
})

// Fetch all overrides for an organization
const response = await fetch('/api/admin/design-tokens?organization_id=org-uuid')
const { data } = await response.json()
```

### Via Database

```sql
-- Insert a color override
INSERT INTO design_tokens (
  organization_id,
  token_category,
  token_key,
  token_value,
  is_active
) VALUES (
  'org-uuid',
  'colors',
  'primary',
  '{"500": "#1e40af", "600": "#1e3a8a"}'::jsonb,
  true
)
ON CONFLICT (organization_id, token_category, token_key)
DO UPDATE SET token_value = EXCLUDED.token_value;
```

## Token Categories

Available token categories for override:

1. **spacing** - Margin, padding, gaps (xs, sm, md, lg, xl, 2xl, 3xl)
2. **typography** - Font sizes, weights, line heights
3. **radii** - Border radius values (sm, md, lg, xl, 2xl, full)
4. **shadows** - Box shadow definitions (sm, md, lg, xl, 2xl)
5. **motion** - Animation durations and easing
6. **colors** - Color palettes (primary, neutral, semantic, background)
7. **componentTokens** - Pre-configured component styles
8. **layout** - Layout constraints (maxWidth values)

## Token Value Format

Token values are stored as JSONB. The structure depends on the token category:

### Simple Value
```json
{
  "token_category": "spacing",
  "token_key": "lg",
  "token_value": "1.5rem"
}
```

### Nested Object
```json
{
  "token_category": "colors",
  "token_key": "primary",
  "token_value": {
    "50": "#f0f9ff",
    "100": "#e0f2fe",
    "500": "#0ea5e9",
    "600": "#0284c7"
  }
}
```

## Migration Strategy

### Phase 1: Add Provider to Root Layout (Completed)
Tokens are now available via context throughout the application.

### Phase 2: Gradual Component Migration (Optional)
Components can be migrated gradually to use `useDesignTokens()` instead of direct imports.

**Before:**
```tsx
import { spacing } from '@/lib/design-tokens'
```

**After:**
```tsx
const { spacing } = useDesignTokens()
```

### Phase 3: Organization-Specific Customization (Future)
Organizations can customize their tokens via admin UI or API.

## Backwards Compatibility

✅ **Existing code continues to work** - Components using direct imports from `@/lib/design-tokens` will use default tokens.

✅ **No breaking changes** - The new system is additive, not replacing.

✅ **Graceful degradation** - If the context is not available, components fall back to default tokens.

## Performance Considerations

1. **Server-side loading** - Tokens are loaded once per request on the server
2. **Client-side caching** - React context prevents unnecessary re-renders
3. **Database indexing** - Indexes on organization_id and token_category ensure fast queries
4. **Fallback to defaults** - If database is unavailable, default tokens are used

## Security

- ✅ RLS policies prevent unauthorized token modifications
- ✅ Only admin/clinician roles can create/update tokens
- ✅ All authenticated users can read active tokens
- ✅ Inactive tokens are not exposed via API

## Testing

### Test Token Override
```typescript
// In your test
import { loadDesignTokens } from '@/lib/design-tokens-loader'

const tokens = await loadDesignTokens('test-org-uuid')
expect(tokens.colors.primary['500']).toBe('#1e40af') // Override
expect(tokens.spacing.lg).toBe('1.5rem') // Default
```

### Test Context
```tsx
import { render } from '@testing-library/react'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'

const customTokens = { ...designTokens, spacing: { ...designTokens.spacing, lg: '2rem' } }

render(
  <DesignTokensProvider tokens={customTokens}>
    <MyComponent />
  </DesignTokensProvider>
)
```

## Admin UI (Future Enhancement)

A future admin UI will allow:
- Visual token picker (color, spacing, etc.)
- Real-time preview of changes
- Import/export token configurations
- Reset to defaults
- Bulk operations

## Examples

### Example 1: Custom Brand Colors

```typescript
// Override primary color to purple for Organization A
await fetch('/api/admin/design-tokens', {
  method: 'POST',
  body: JSON.stringify({
    organization_id: 'org-a-uuid',
    token_category: 'colors',
    token_key: 'primary',
    token_value: {
      "50": "#faf5ff",
      "500": "#a855f7",
      "600": "#9333ea"
    }
  })
})
```

### Example 2: Larger Spacing for Accessibility

```typescript
// Increase all spacing by 25% for Organization B
await fetch('/api/admin/design-tokens', {
  method: 'POST',
  body: JSON.stringify({
    organization_id: 'org-b-uuid',
    token_category: 'spacing',
    token_key: 'md',
    token_value: "1.25rem" // instead of 1rem
  })
})
```

### Example 3: Custom Typography Scale

```typescript
// Use larger base font size for better readability
await fetch('/api/admin/design-tokens', {
  method: 'POST',
  body: JSON.stringify({
    organization_id: 'org-c-uuid',
    token_category: 'typography',
    token_key: 'fontSize',
    token_value: {
      "base": "1.125rem", // 18px instead of 16px
      "lg": "1.25rem"
    }
  })
})
```

## Troubleshooting

### Tokens not updating
1. Check if `is_active` is `true` in the database
2. Verify organization_id matches user's membership
3. Clear any client-side caches
4. Restart development server

### Context not available
1. Ensure `DesignTokensProvider` wraps your component tree
2. Check that you're using the hook in a client component
3. Verify the import path is correct

### Database errors
1. Check RLS policies allow your user role to access tokens
2. Verify the migration has been applied
3. Check Supabase connection in server logs

## Summary

The design token override system provides:
- ✅ Database-driven token customization
- ✅ Organization-level overrides
- ✅ Backwards compatible with existing code
- ✅ Type-safe token access
- ✅ Secure admin-only modifications
- ✅ Graceful fallbacks

For questions or issues, refer to the implementation files or open an issue.
