# V05-I09.2 Visual Structure

**Issue:** V05-I09.2 — Design Tokens Parameterisierung  
**Date:** 2026-01-07  
**Status:** ✅ Complete

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Design Token System                               │
│                     (Organization Override Support)                       │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   Database      │
│   Layer         │
└─────────────────┘
        │
        ├── design_tokens table
        │   ├── id (uuid, PK)
        │   ├── organization_id (uuid, FK → organizations)
        │   ├── token_category (text) [spacing, colors, typography, etc.]
        │   ├── token_key (text) [e.g., "md", "primary.500"]
        │   ├── token_value (jsonb) [actual token value]
        │   ├── is_active (boolean)
        │   └── UNIQUE (organization_id, token_category, token_key)
        │
        ├── RLS Policies
        │   ├── SELECT: All authenticated users (active tokens only)
        │   ├── INSERT/UPDATE/DELETE: Admin/Clinician only
        │
        └── Functions
            └── get_design_tokens(org_id uuid) → jsonb
                └── Returns merged tokens (defaults + overrides)

┌─────────────────┐
│   Server        │
│   Layer         │
└─────────────────┘
        │
        ├── lib/design-tokens-loader.ts
        │   ├── loadDesignTokens(organizationId)
        │   │   └── Loads tokens with org overrides
        │   ├── getUserOrganizationId()
        │   │   └── Gets user's org from membership
        │   └── loadUserDesignTokens()
        │       └── Convenience: loads tokens for current user
        │
        ├── lib/design-tokens.ts (existing)
        │   └── Default token definitions
        │       ├── spacing: { xs, sm, md, lg, xl, 2xl, 3xl }
        │       ├── typography: { fontSize, lineHeight, fontWeight }
        │       ├── radii: { sm, md, lg, xl, 2xl, full }
        │       ├── shadows: { sm, md, lg, xl, 2xl }
        │       ├── motion: { duration, easing, spring }
        │       ├── colors: { primary, neutral, semantic, background }
        │       ├── componentTokens: { mobileQuestionCard, answerButton, ... }
        │       └── layout: { contentMaxWidth, patientMaxWidth, ... }
        │
        └── Deep Merge Algorithm
            └── Combines default tokens with org-specific overrides

┌─────────────────┐
│   API           │
│   Layer         │
└─────────────────┘
        │
        └── /api/admin/design-tokens
            ├── GET
            │   ├── Query: ?organization_id=uuid (optional)
            │   ├── Auth: Requires admin/clinician
            │   └── Response: Tokens grouped by category
            │
            └── POST
                ├── Body: { organization_id, token_category, token_key, token_value, is_active }
                ├── Auth: Requires admin/clinician
                ├── Operation: Upsert (insert or update)
                └── Response: Created/updated token

┌─────────────────┐
│   React         │
│   Layer         │
└─────────────────┘
        │
        ├── lib/contexts/DesignTokensContext.tsx
        │   ├── DesignTokensProvider (Context Provider)
        │   │   └── Props: { children, tokens? }
        │   └── useDesignTokens() (Hook)
        │       └── Returns: Complete token object
        │
        ├── app/layout.tsx (Root Layout)
        │   └── Wraps app with DesignTokensProvider
        │       ├── Loads tokens server-side via loadUserDesignTokens()
        │       ├── Passes tokens to provider
        │       └── Fallback to defaults on error
        │
        └── Components
            ├── Existing components (unchanged)
            │   └── Import tokens directly from lib/design-tokens
            │
            └── New/migrated components
                └── Use useDesignTokens() hook

┌─────────────────┐
│   Admin UI      │
│   Layer         │
└─────────────────┘
        │
        └── /admin/design-tokens
            ├── Organization Filter
            │   └── Input: organization_id (optional)
            ├── Category Tabs
            │   └── [spacing | typography | radii | shadows | motion | colors | componentTokens | layout]
            ├── Token List
            │   └── For each token:
            │       ├── Token path (e.g., "colors.primary.500")
            │       ├── Organization ID (if override)
            │       ├── Token value (JSON display)
            │       ├── Active/inactive indicator
            │       └── Created timestamp
            └── Info Box
                └── Links to API documentation
```

## Data Flow Diagrams

### Token Loading Flow (Server-Side)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Page Request                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. Root Layout (app/layout.tsx)                                         │
│    ↓                                                                     │
│    loadUserDesignTokens()                                                │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Get User Organization                                                 │
│    ↓                                                                     │
│    getUserOrganizationId()                                               │
│    └─→ Query: user_org_membership table                                 │
│        └─→ Returns: organization_id or null                             │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Load Tokens with Overrides                                           │
│    ↓                                                                     │
│    loadDesignTokens(organizationId)                                      │
│    ├─→ Load default tokens from lib/design-tokens.ts                    │
│    ├─→ Query: design_tokens table WHERE organization_id = $1            │
│    └─→ Deep merge: defaults + overrides                                 │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. Provide Tokens to React                                              │
│    ↓                                                                     │
│    <DesignTokensProvider tokens={mergedTokens}>                          │
│      {children}                                                          │
│    </DesignTokensProvider>                                               │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. Components Access Tokens                                             │
│    ↓                                                                     │
│    const { spacing, colors } = useDesignTokens()                         │
│    └─→ Returns merged tokens from context                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Token Override Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Admin UI or API Client                                               │
│    ↓                                                                     │
│    POST /api/admin/design-tokens                                         │
│    Body: {                                                               │
│      organization_id: "uuid",                                            │
│      token_category: "colors",                                           │
│      token_key: "primary",                                               │
│      token_value: { "500": "#1e40af" },                                  │
│      is_active: true                                                     │
│    }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. API Route Handler                                                    │
│    ↓                                                                     │
│    Validate Authentication                                               │
│    └─→ getCurrentUser()                                                 │
│        └─→ Reject if not authenticated (401)                            │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Authorization Check                                                   │
│    ↓                                                                     │
│    hasClinicianRole()                                                    │
│    └─→ Check if user has admin or clinician role                        │
│        └─→ Reject if not authorized (403)                               │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Input Validation                                                      │
│    ↓                                                                     │
│    Validate token_category in allowed list                               │
│    Validate required fields present                                      │
│    └─→ Reject if invalid (400)                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. Database Upsert                                                       │
│    ↓                                                                     │
│    supabase.from('design_tokens').upsert({...})                          │
│    └─→ ON CONFLICT (org_id, category, key) DO UPDATE                    │
│        ├─→ RLS Policy Check: User has admin/clinician role              │
│        └─→ Insert new or update existing token                          │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. Response                                                              │
│    ↓                                                                     │
│    Return { success: true, data: { token } }                             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Tree

```
app/
├── layout.tsx (Root Layout) ★
│   ├── loadUserDesignTokens() [Server]
│   └── <DesignTokensProvider tokens={tokens}>
│       └── <ThemeProvider>
│           └── {children}
│
├── admin/
│   └── design-tokens/
│       └── page.tsx ★ [New Admin UI]
│           ├── Organization Filter Input
│           ├── Category Tab Buttons
│           ├── Token List (Card)
│           │   └── For each token:
│           │       ├── Token path display
│           │       ├── Value (JSON pre)
│           │       └── Metadata (org, created_at)
│           └── Info Box
│
├── components/
│   └── ExampleTokenConsumer.tsx ★ [Example]
│       └── useDesignTokens() hook demo
│
└── api/
    └── admin/
        └── design-tokens/
            └── route.ts ★ [API]
                ├── GET handler
                └── POST handler

lib/
├── design-tokens.ts [Existing - Default Tokens]
│   └── Export default token definitions
│
├── design-tokens-loader.ts ★ [New]
│   ├── loadDesignTokens(orgId)
│   ├── getUserOrganizationId()
│   └── loadUserDesignTokens()
│
└── contexts/
    └── DesignTokensContext.tsx ★ [New]
        ├── DesignTokensProvider
        └── useDesignTokens()

docs/
└── DESIGN_TOKEN_OVERRIDE_GUIDE.md ★ [Complete Guide]
```

★ = New or significantly modified file

## Token Category Structure

```
Design Tokens
├── spacing
│   ├── xs: "0.5rem" (8px)
│   ├── sm: "0.75rem" (12px)
│   ├── md: "1rem" (16px)
│   ├── lg: "1.5rem" (24px)
│   ├── xl: "2rem" (32px)
│   ├── 2xl: "3rem" (48px)
│   └── 3xl: "4rem" (64px)
│
├── typography
│   ├── fontSize: { xs, sm, base, lg, xl, 2xl, 3xl, 4xl }
│   ├── lineHeight: { tight, normal, relaxed, loose }
│   └── fontWeight: { normal, medium, semibold, bold }
│
├── radii
│   ├── none: "0"
│   ├── sm: "0.375rem" (6px)
│   ├── md: "0.5rem" (8px)
│   ├── lg: "0.75rem" (12px)
│   ├── xl: "1rem" (16px)
│   ├── 2xl: "1.5rem" (24px)
│   └── full: "9999px"
│
├── shadows
│   ├── none, sm, md, lg, xl, 2xl
│   └── inner
│
├── motion
│   ├── duration: { instant, fast, normal, moderate, slow }
│   ├── easing: { linear, ease, easeIn, easeOut, easeInOut, smooth, snappy, spring }
│   └── spring: { default, gentle, bouncy }
│
├── colors
│   ├── primary: { 50, 100, 200, ..., 900 }
│   ├── neutral: { 50, 100, 200, ..., 900 }
│   ├── semantic: { success, warning, error, info }
│   └── background: { light, lightGradientFrom, lightGradientTo, dark, ... }
│
├── componentTokens
│   ├── mobileQuestionCard: { borderRadius, padding, shadow, ... }
│   ├── desktopQuestionCard: { borderRadius, padding, shadow, ... }
│   ├── answerButton: { borderRadius, paddingX, paddingY, minHeight, ... }
│   ├── navigationButton: { borderRadius, paddingX, paddingY, minHeight, ... }
│   ├── progressBar: { height, borderRadius, transition }
│   └── infoBox: { borderRadius, padding, fontSize, lineHeight }
│
└── layout
    ├── contentMaxWidth: "1600px"
    ├── patientMaxWidth: "1152px"
    └── articleMaxWidth: "896px"
```

## Usage Examples

### Example 1: Using Context in Client Component

```tsx
'use client'

import { useDesignTokens } from '@/lib/contexts/DesignTokensContext'

export function CustomCard() {
  const { spacing, colors, radii, shadows } = useDesignTokens()
  
  return (
    <div style={{
      padding: spacing.lg,
      backgroundColor: colors.primary[50],
      borderRadius: radii.lg,
      boxShadow: shadows.md,
    }}>
      <h2 style={{ 
        fontSize: typography.fontSize['2xl'],
        color: colors.primary[900] 
      }}>
        Custom Card with Organization Tokens
      </h2>
    </div>
  )
}
```

### Example 2: Server-Side Token Loading

```tsx
// app/custom-page/page.tsx (Server Component)
import { loadDesignTokens } from '@/lib/design-tokens-loader'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'
import { CustomCard } from './CustomCard'

export default async function CustomPage({ params }) {
  const tokens = await loadDesignTokens(params.organizationId)
  
  return (
    <DesignTokensProvider tokens={tokens}>
      <CustomCard />
    </DesignTokensProvider>
  )
}
```

### Example 3: Creating Token Override via API

```typescript
// Create a custom primary color for Organization A
const response = await fetch('/api/admin/design-tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'org-a-uuid',
    token_category: 'colors',
    token_key: 'primary',
    token_value: {
      "50": "#faf5ff",   // Purple-50
      "500": "#a855f7",  // Purple-500
      "600": "#9333ea",  // Purple-600
      "900": "#581c87",  // Purple-900
    },
    is_active: true
  })
})

const result = await response.json()
// Now Organization A uses purple instead of sky blue
```

## Security Model

```
┌──────────────────────────────────────────────────────────────┐
│                    Row Level Security                         │
└──────────────────────────────────────────────────────────────┘

design_tokens Table Policies:

SELECT (Read):
├── Policy: design_tokens_select_authenticated
├── Who: All authenticated users
├── Condition: is_active = true
└── Purpose: Allow all users to read active tokens

INSERT (Create):
├── Policy: design_tokens_admin_insert
├── Who: Admin OR Clinician roles only
├── Condition: User has role in ['admin', 'clinician']
└── Purpose: Restrict token creation to admins

UPDATE (Modify):
├── Policy: design_tokens_admin_update
├── Who: Admin OR Clinician roles only
├── Condition: User has role in ['admin', 'clinician']
└── Purpose: Restrict token updates to admins

DELETE (Remove):
├── Policy: design_tokens_admin_delete
├── Who: Admin OR Clinician roles only
├── Condition: User has role in ['admin', 'clinician']
└── Purpose: Restrict token deletion to admins
```

## Performance Considerations

```
┌──────────────────────────────────────────────────────────────┐
│                    Optimization Strategy                      │
└──────────────────────────────────────────────────────────────┘

Database Level:
├── Indexes
│   ├── idx_design_tokens_organization (organization_id)
│   ├── idx_design_tokens_category (token_category)
│   └── idx_design_tokens_active (is_active WHERE is_active = true)
└── Query Optimization
    └── Filtered queries use indexed columns

Server Level:
├── Token Loading
│   ├── Loaded once per request (server component)
│   └── No redundant database queries
└── Error Handling
    └── Graceful fallback to defaults (no blocking)

Client Level:
├── React Context
│   ├── Prevents prop drilling
│   ├── Minimizes re-renders
│   └── Single source of truth
└── Bundle Size
    └── Tokens loaded server-side (no client bundle impact)
```

## Migration Path

```
Phase 1: Infrastructure (✅ Complete)
├── Database schema
├── API endpoints
├── Token loader
└── React Context

Phase 2: Integration (✅ Complete)
├── Root layout integration
├── Admin UI
└── Documentation

Phase 3: Component Migration (Optional - Future)
├── Gradually update components to use useDesignTokens()
├── Replace direct imports with context
└── Maintain backwards compatibility

Phase 4: Advanced Features (Future)
├── Visual token editor
├── Real-time preview
├── Import/export
└── Token versioning
```

## Summary

The design token override system provides a complete, production-ready solution for organization-level UI customization. The architecture is:

- **Scalable** - Database-driven with indexed queries
- **Secure** - RLS policies enforce access control
- **Type-safe** - Full TypeScript support
- **Flexible** - 8 token categories, unlimited customization
- **Compatible** - Zero breaking changes, gradual migration
- **Documented** - Complete guides and examples

All acceptance criteria met. Ready for production deployment.
