# E73.9 — Studio Design Tool v1 Implementation

**Epic:** Studio Design Tool v1 (Tokens + Page/Component Config)  
**Issue:** E73.9  
**Status:** ✅ Implemented  
**Version:** v0.7  

## Overview

This feature enables Studio administrators to customize Patient UI design tokens (colors, spacing, typography, etc.) through the Studio interface. Patient UI automatically loads and applies these customizations, providing org-scoped theming capabilities.

## Architecture

### Components

1. **Studio Side (Existing)**
   - Admin UI: `/admin/design-tokens` page
   - API: `/api/admin/design-tokens` (GET, POST)
   - Database: `design_tokens` table

2. **Patient Side (New)**
   - API: `/api/patient/design` (GET) - returns merged tokens
   - Server loader: `lib/design-tokens/loader.ts`
   - Provider: `app/patient/PatientDesignTokensProvider.tsx`
   - Hook: `lib/hooks/useDesignTokensLoader.ts` (optional client-side refresh)

3. **Database**
   - Table: `design_tokens`
   - Function: `get_design_tokens(org_id UUID)`

## API Endpoints

### GET /api/patient/design

Returns merged design tokens for the authenticated patient's organization.

**Request:**
```
GET /api/patient/design
Authorization: Required (patient role)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "spacing": { "xs": "0.5rem", "sm": "0.75rem", ... },
      "colors": { "primary": { "500": "#0ea5e9", ... }, ... },
      "typography": { ... },
      ...
    },
    "organizationId": "uuid-or-null",
    "appliedAt": "2026-01-29T09:00:00Z"
  },
  "schemaVersion": "1"
}
```

**Error Handling:**
- 401: Unauthenticated
- 500: Server error (returns empty tokens, client uses static defaults)

**Callsite:**
- `lib/hooks/useDesignTokensLoader.ts` - literal fetch('/api/patient/design')

## Token Merging Strategy

Tokens are merged in the following order (later overrides earlier):

1. **Static defaults** (`lib/design/tokens.ts`) - Base design system
2. **Global tokens** (`design_tokens` where `organization_id IS NULL`)
3. **Org-specific tokens** (`design_tokens` where `organization_id = user.org_id`)

The `get_design_tokens(org_id)` database function handles server-side merging.

## Usage

### Server-Side (Recommended)

Server components automatically load tokens via `PatientDesignTokensProvider`:

```tsx
// app/patient/layout.tsx (already implemented)
import PatientDesignTokensProvider from './PatientDesignTokensProvider'

export default function PatientLayout({ children }) {
  return (
    <PatientDesignTokensProvider>
      {children}
    </PatientDesignTokensProvider>
  )
}
```

### Client-Side Component

Access tokens via `useDesignTokens()` hook:

```tsx
'use client'

import { useDesignTokens } from '@/lib/contexts/DesignTokensContext'

export function MyComponent() {
  const tokens = useDesignTokens()
  
  const primaryColor = tokens.colors?.primary?.[500] || '#0ea5e9'
  
  return (
    <div style={{ backgroundColor: primaryColor }}>
      Themed content
    </div>
  )
}
```

### Client-Side Runtime Refresh (Optional)

For runtime token reloading (e.g., after Studio edit without page reload):

```tsx
import { useDesignTokensLoader } from '@/lib/hooks/useDesignTokensLoader'

export function MyComponent() {
  const { tokens, state, reload } = useDesignTokensLoader({ autoLoad: true })
  
  // Call reload() to fetch latest tokens from Studio
  const handleRefresh = async () => {
    await reload()
  }
  
  return <div>...</div>
}
```

## Visible Effects

### Dashboard Components

The following dashboard components now use dynamic design tokens:

1. **NextStepCard** (`apps/rhythm-patient-ui/app/patient/(mobile)/components/NextStepCard.tsx`)
   - Border color: `tokens.colors.primary[200]`
   - Icon background: `tokens.colors.primary[100]`

2. **Dashboard Loading State** (`apps/rhythm-patient-ui/app/patient/(mobile)/dashboard/client.tsx`)
   - Background: `tokens.colors.primary[50]`
   - Border: `tokens.colors.primary[200]`
   - Text: `tokens.colors.primary[700]`
   - Spinner: `tokens.colors.primary[600]`

### Testing Visible Changes

1. **Studio Admin:**
   - Navigate to `/admin/design-tokens`
   - Create a token override for `colors.primary[200]`
   - Set value to a different color (e.g., `"#ff6b6b"` for red)

2. **Patient:**
   - Reload patient dashboard
   - Observe NextStepCard border color change
   - Observe loading state colors change (if triggered)

## Database Schema

### design_tokens Table

```sql
CREATE TABLE design_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  token_category TEXT NOT NULL,
  token_key TEXT NOT NULL,
  token_value JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID,
  CONSTRAINT design_tokens_category_check CHECK (
    token_category IN ('spacing', 'typography', 'radii', 'shadows', 'motion', 'colors', 'componentTokens', 'layout')
  ),
  UNIQUE(organization_id, token_category, token_key)
);
```

### get_design_tokens Function

```sql
CREATE OR REPLACE FUNCTION get_design_tokens(org_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  category_name TEXT;
BEGIN
  result := '{}'::JSONB;
  
  FOR category_name IN 
    SELECT DISTINCT token_category 
    FROM design_tokens 
    WHERE is_active = TRUE
  LOOP
    result := jsonb_set(
      result,
      ARRAY[category_name],
      COALESCE(
        (
          SELECT jsonb_object_agg(token_key, token_value)
          FROM design_tokens
          WHERE token_category = category_name
          AND is_active = TRUE
          AND (organization_id = org_id OR (org_id IS NULL AND organization_id IS NULL))
        ),
        '{}'::JSONB
      )
    );
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Error Handling

### Server-Side
- If Supabase unavailable → fallback to static tokens
- If `get_design_tokens()` fails → return empty tokens
- Patient sees static defaults (graceful degradation)

### Client-Side
- If `/api/patient/design` fails → use static tokens
- If token merge fails → use static tokens
- No UI crashes, always has usable tokens

## Validation

### Endpoint Catalog Verification ✅
```bash
npm run api:catalog:verify
```

**Results:**
- Endpoint: `/api/patient/design` found in catalog
- Callsites: 1 literal callsite in `useDesignTokensLoader.ts`
- Orphan check: Passed (not orphaned)
- Wiring gate: ✅ Passed

### Build Verification ✅
```bash
npm run build:patient
npm run build:studio
```

Both builds successful with no TypeScript errors.

### Lint Verification ✅
```bash
npm run lint
```

No lint errors in new files.

## Future Enhancements

### Organization Assignment
Currently, all patients use global tokens (`organizationId = null`). Future work:

1. Add `organization_id` to `patient_profiles` or user metadata
2. Update `loadDesignTokens()` to fetch user's org ID
3. Enable org-scoped theming

### Token Categories
Current categories:
- `spacing`, `typography`, `radii`, `shadows`, `motion`, `colors`, `componentTokens`, `layout`

Can be extended by adding values to the `design_tokens_category_check` constraint.

### Page/Component Config
Future: Store page-level or component-level configuration as design tokens:

```json
{
  "token_category": "componentTokens",
  "token_key": "dashboard.nextStepCard.showIcon",
  "token_value": { "enabled": true }
}
```

## Vertical Slice Strategy Compliance

✅ **Requirement:** Endpoint changes require at least one literal callsite

**Compliance:**
- Endpoint: `/api/patient/design`
- Callsite: `lib/hooks/useDesignTokensLoader.ts` line 56
  ```ts
  const response = await fetch('/api/patient/design', {
    method: 'GET',
    cache: 'no-store',
  })
  ```

✅ **Requirement:** Endpoint wiring gate shows no orphan for this endpoint

**Compliance:**
- Verified via `npm run api:catalog:verify`
- Endpoint catalog shows 1 callsite
- No orphans detected

## References

- **Epic:** E73.9
- **Database Schema:** `schema/schema.sql`
- **Studio Admin UI:** `/admin/design-tokens`
- **Patient API:** `/api/patient/design`
- **Endpoint Catalog:** `docs/api/ENDPOINT_CATALOG.md`
