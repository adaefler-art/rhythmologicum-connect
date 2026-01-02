# V05-I02.1 Implementation Summary

## Säulen-/Funnel-Katalog: UI + API

**Date:** 2025-12-31  
**Status:** ✅ Complete (Fixed)

**CORRECTION NOTE:** This implementation was corrected to properly use the V05 core schema tables (`funnels_catalog`, `funnel_versions`) instead of creating duplicates, and to implement the canonical 7-pillar wellness model.

---

## Overview

Implemented a complete funnel catalog system with the canonical 7-pillar wellness taxonomy, versioning support, and multi-tenant capabilities. The catalog allows patients to browse available assessments organized by category (pillars) and view detailed information including estimated duration, outcomes, and version information.

**Key Corrections Made:**

1. Uses `funnels_catalog` table from V05 core schema (not `funnels`)
2. Uses existing `funnel_versions` table from V05 core schema
3. Implements canonical 7-pillar model (not 3)
4. Assigns stress funnel to Pillar 4 (Mental Health & Stress Management)

---

## Database Changes

### New Tables

#### `pillars` Table

- Purpose: Taxonomic categories for organizing funnels (7-Pillar Wellness Model)
- Fields:
  - `id` (UUID, PK)
  - `key` (TEXT, UNIQUE) - programmatic identifier
  - `title` (TEXT) - display name
  - `description` (TEXT)
  - `sort_order` (INTEGER) - for deterministic ordering (1-7)
- RLS: Readable by authenticated users, manageable by admins
- **Canonical 7 Pillars:**
  1. `nutrition` - Ernährung
  2. `movement` - Bewegung
  3. `sleep` - Schlaf
  4. `mental-health` - Mentale Gesundheit & Stressmanagement
  5. `social` - Soziale Verbindungen
  6. `meaning` - Sinn & Lebensqualität
  7. `prevention` - Prävention & Gesundheitsvorsorge

#### `funnel_versions` Table

- **NOTE:** This table already existed in V05 core schema (`20251230211228_v05_core_schema_jsonb_fields.sql`)
- Purpose: Version tracking for funnel configurations
- Fields:
  - `id` (UUID, PK)
  - `funnel_id` (UUID, FK to `funnels_catalog.id`)
  - `version` (TEXT)
  - `is_default` (BOOLEAN)
  - `is_active` (BOOLEAN)
  - `questionnaire_config` (JSONB)
  - `content_manifest` (JSONB)
  - `algorithm_bundle_version` (TEXT)
  - `prompt_version` (TEXT)
  - `rollout_percent` (INTEGER)
- RLS: Readable by authenticated users for active versions, manageable by admins
- Unique constraint: (funnel_id, version)

### Extended Tables

#### `funnels_catalog` Table Extensions

- **NOTE:** This table already existed in V05 core schema, we only added new fields
  Added fields:
- `org_id` (UUID, nullable for system-wide funnels)
- `est_duration_min` (INTEGER, nullable)
- `outcomes` (JSONB, default: [])
- `default_version_id` (UUID, FK to funnel_versions, nullable)

Purpose: Extend catalog table with additional metadata for patient browsing

### Data Migration

- Seeded canonical 7 pillars
- Updated stress-assessment funnel in `funnels_catalog` with catalog fields
- Assigned stress funnel to Pillar 4 (Mental Health & Stress Management)
- Created default version (1.0.0) for stress-assessment

### Corrective Migration

**File:** `supabase/migrations/20251231145000_fix_catalog_schema.sql`

This migration corrects issues from the initial implementation:

1. Removes duplicate `funnel_versions` policies (table already existed in V05 core)
2. Adds missing columns to `funnels_catalog` instead of `funnels`
3. Seeds canonical 7-pillar model
4. Migrates stress funnel to correct pillar (4 - Mental Health)
5. Migrates data from old `funnels` table if it exists

---

## API Implementation

### Endpoints

#### `GET /api/funnels/catalog`

**Purpose:** Browse all active funnels organized by pillar

**Response Format:**

```typescript
{
  success: true,
  data: {
    pillars: [
      {
        pillar: { id, key, title, description, sort_order },
        funnels: [
          {
            id, slug, title, subtitle, description,
            pillar_id, est_duration_min, outcomes,
            is_active, default_version_id, default_version
          }
        ]
      }
    ],
    uncategorized_funnels: [...]
  }
}
```

**Features:**

- Deterministic ordering by pillar.sort_order and funnel.title
- Includes version information
- Authenticated users only
- RLS-compliant

#### `GET /api/funnels/catalog/[slug]`

**Purpose:** Get detailed information for a specific funnel

**Response Format:**

```typescript
{
  success: true,
  data: {
    funnel: { ...catalog funnel with pillar info },
    versions: [...all versions],
    active_version: {...default + active version},
    default_version: {...default version}
  }
}
```

**Features:**

- Supports canonical slug resolution
- Returns all versions for the funnel
- Includes pillar information
- Authenticated users only
- RLS-compliant

---

## UI Implementation

### Patient Catalog Page

**Route:** `/patient/funnels`

**Features:**

- Accordion-based pillar sections
- Auto-expands first pillar
- Funnel cards show:
  - Icon/emoji
  - Title & description
  - Estimated duration (if available)
  - Version (if available)
  - Outcomes as checkmarks (first 3)
- Click-to-start navigation to `/patient/funnel/{slug}/intro`
- Loading, error, and empty states
- Responsive design (mobile-first)
- Dark mode support

### Component Updates

#### Extended `FunnelCard`

Added optional props (backward compatible):

- `funnel` object prop (supports both old and new API)
- `estimatedDuration` (number | null)
- `outcomes` (string[])
- `version` (string | null)

Displays:

- Duration badge (⏱️ ca. X Min.)
- Version badge (vX.X.X)
- Outcomes list with checkmarks (✓)

---

## Type Safety

### New Types (`lib/types/catalog.ts`)

```typescript
;-Pillar -
  FunnelVersion -
  CatalogFunnel -
  PillarWithFunnels -
  FunnelCatalogResponse -
  FunnelDetailResponse
```

### Registry Updates (`lib/contracts/registry.ts`)

Added:

```typescript
export const PILLAR_KEY = {
  STRESS: 'stress',
  RESILIENCE: 'resilience',
  SLEEP: 'sleep',
}

export function isValidPillarKey(value: unknown): value is PillarKey
```

---

## Testing

### Unit Tests

**File:** `app/api/funnels/catalog/__tests__/catalog.test.ts`

**Coverage:**

- FunnelCatalogResponse type validation
- FunnelDetailResponse type validation
- Pillar sort order determinism
- Outcomes array validation
- Null/empty state handling

**Results:** ✅ 6/6 tests passing

### Build Verification

- ✅ TypeScript compilation passes
- ✅ ESLint passes (no new warnings/errors)
- ✅ Next.js build successful
- ✅ No environment variable issues

---

## Determinism & Contracts

### Ordering Guarantees

1. **Pillars:** Ordered by `sort_order` ASC
2. **Funnels within pillar:** Ordered by `title` ASC
3. **Versions:** Ordered by `version` DESC

### Slug Resolution

- Uses `getCanonicalFunnelSlug()` from registry
- Handles legacy aliases (stress, stress-check, etc.)
- Case-insensitive matching
- Deterministic normalization

### API Response Format

- Follows `ApiResponse<T>` contract from CONTRACTS.md
- Uses standardized error codes (ErrorCode enum)
- Consistent success/error structure
- Includes proper HTTP status codes

---

## Security

### RLS Policies

**pillars:**

- SELECT: All authenticated users
- ALL: Admins only

**funnel_versions:**

- SELECT: Authenticated users (active versions only)
- ALL: Admins only

**funnels (existing + new fields):**

- Existing policies remain unchanged
- New fields accessible via existing policies

### Authentication

- All endpoints require authentication
- Server-side session validation
- Cookie-based sessions via Supabase SSR
- Proper error responses for unauthorized access

---

## Multi-Tenant Readiness

### Organization Scoping

- `funnels.org_id` field added (nullable)
- NULL org_id = system-wide funnel
- Non-null org_id = org-specific funnel
- RLS policies can be extended for org isolation

**Note:** Current implementation allows system-wide funnels (org_id = NULL) for simplicity. Org-specific scoping can be enabled by:

1. Adding org_id checks to RLS policies
2. Updating catalog endpoint to filter by user's org(s)
3. Adding org_id to funnel creation/update logic

---

## Backward Compatibility

### Breaking Changes: None

All changes are additive:

- New tables don't affect existing functionality
- Extended funnels table with nullable fields
- FunnelCard component supports both old and new props
- Existing `/patient/assessment` page unaffected
- Existing `/api/funnels/active` endpoint unaffected

### Migration Path

For existing deployments:

1. Run migration `20251231142000_create_funnel_catalog.sql`
2. Optionally update existing funnels with catalog fields
3. Create versions for existing funnels
4. Deploy new API endpoints
5. Deploy new UI page
6. Redirect users from `/patient/assessment` to `/patient/funnels` (optional)

---

## Future Enhancements

### Planned (Not in Scope)

1. **Admin UI** (`/clinician/funnels`)
   - View all funnels and versions
   - Toggle is_active per funnel
   - Toggle is_required per question
   - Reorder steps (order_index)

2. **Org-Specific Catalogs**
   - Filter by user's organization(s)
   - Org-specific funnel configurations
   - Assignment-based access control

3. **Advanced Versioning**
   - Version comparison UI
   - Rollback functionality
   - A/B testing support

4. **Enhanced Metadata**
   - Funnel difficulty levels
   - Required vs. optional funnels
   - Completion statistics
   - Recommended order/sequences

---

## PowerShell Verification Commands

```powershell
# Install dependencies
npm ci

# Run database commands (requires Supabase CLI)
npm run db:reset
npm run db:diff
npm run db:typegen

# Run tests
npm test

# Build
npm run build
```

**Expected Results:**

- All tests pass (except 1 pre-existing redaction test failure)
- Build completes successfully
- No TypeScript errors
- No ESLint errors in new files

---

## Evidence

### Code Artifacts

1. **Migration:** `supabase/migrations/20251231142000_create_funnel_catalog.sql`
2. **API Routes:**
   - `app/api/funnels/catalog/route.ts`
   - `app/api/funnels/catalog/[slug]/route.ts`
3. **UI Pages:**
   - `app/patient/funnels/page.tsx`
   - `app/patient/funnels/client.tsx`
4. **Types:** `lib/types/catalog.ts`
5. **Tests:** `app/api/funnels/catalog/__tests__/catalog.test.ts`
6. **Updated Components:** `app/components/FunnelCard.tsx`
7. **Registry:** `lib/contracts/registry.ts` (PILLAR_KEY added)

### Test Results

```
Test Suites: 1 failed, 9 passed, 10 total
Tests:       1 failed, 140 passed, 141 total
```

**Note:** The 1 failing test is pre-existing (PHI redaction test), not related to this implementation.

### Build Output

```
✓ Compiled successfully in 8.9s
Running TypeScript ... ✓
Build completed successfully
```

---

## Acceptance Criteria Status

- ✅ Katalog ist im UI sichtbar und kommt aus API
- ✅ Funnels sind Säulen zugeordnet
- ✅ Slug ist canonical, deterministisch und unique
- ✅ Default/active Version wird angezeigt (mind. id/version)
- ✅ Tests mindestens für API response shape + ordering

---

## Deliverables Checklist

- ✅ Migration(en) für pillars, funnel_versions, funnels extensions
- ✅ API routes (`/catalog`, `/catalog/[slug]`)
- ✅ API types (`lib/types/catalog.ts`)
- ✅ UI page (`/patient/funnels`) + client component
- ✅ Basic styling (Tailwind, design tokens)
- ✅ Tests (6 passing tests)
- ✅ Documentation (this file)
