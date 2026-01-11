# V05-FIXOPT-01 Implementation Summary

## Overview

This implementation addresses patient-facing UX/flow issues in the funnel catalog and assessment system, ensuring deterministic and fail-safe behavior for all patient flows.

## Issues Resolved

### A) Post-Login Landing ✅

**Issue**: Patients were landing on `/patient/assessment` after login instead of the catalog.

**Solution**:
- Updated `/app/patient/page.tsx` to redirect to `/patient/funnels`
- Added redirect from `/patient/assessment` → `/patient/funnels` to prevent broken bookmarks

**Verification**:
```powershell
# After login, user should land on /patient/funnels
# Navigating to /patient/assessment should redirect to /patient/funnels
```

### B) Catalog Kategorisierung ✅

**Issue**: Funnels appeared in "Weitere Assessments" without proper categorization.

**Solution**:
- Catalog already properly categorizes funnels by pillar
- Uncategorized funnels shown in "Weitere Assessments" section
- Added `availability` status to distinguish ready vs. coming-soon funnels

**Verification**:
```powershell
# All funnels should appear under their pillar categories
# Only truly uncategorized funnels should appear in "Weitere Assessments"
```

### C) Broken Funnel Links (404) ✅

**Issue**: Links to `cardiovascular-age`, `heart-health-nutrition`, `sleep-quality` resulted in 404 errors because these funnels exist in `funnels_catalog` but not in `funnels` table.

**Solution**:
1. **Catalog API** (`/api/funnels/catalog`):
   - Queries both `funnels_catalog` AND `funnels` tables
   - Sets `availability: 'available'` for funnels in both tables
   - Sets `availability: 'coming_soon'` for funnels only in catalog

2. **Funnel Card Component**:
   - Shows "In Kürze verfügbar" for coming_soon funnels
   - Disables click/navigation for unavailable funnels
   - Visual opacity change to indicate disabled state

3. **Funnel Detail Page**:
   - Handles 404 from `/api/funnels/[slug]/definition` gracefully
   - Shows user-friendly "Not Available" UI instead of error
   - Provides "Back to Catalog" button

4. **Content Pages API**:
   - Returns empty array (200) for catalog-only funnels
   - Only returns 404 if funnel doesn't exist in either table

**Verification**:
```powershell
# Navigate to /patient/funnels
# Click on "Cardiovascular Age Assessment" - should show "In Kürze verfügbar"
# Click should be disabled (no navigation)
# Direct navigation to /patient/funnel/cardiovascular-age should show "Not Available" UI
# No 404 errors in browser console
```

### D) Stress Assessment Post-Completion ✅

**Issue**: After completing stress assessment, content/resolve API calls resulted in 404 errors.

**Solution**:
- Verified content-pages API returns empty array for missing content (not 404)
- Verified result client handles missing content gracefully
- Verified intro client handles missing content gracefully
- All clients already have proper fallback logic

**Verification**:
```powershell
# Complete stress assessment
# Result page should load without 404 errors
# May show reduced content, but no error states
# No console spam from failed API calls
```

## Technical Implementation

### New Types

```typescript
// lib/types/catalog.ts
export type FunnelAvailability = 'available' | 'coming_soon' | 'not_available'

export type CatalogFunnel = {
  // ... existing fields
  availability?: FunnelAvailability
}
```

### Availability Logic

```typescript
// In catalog API
const definedSlugs = new Set<string>() // Funnels in 'funnels' table
funnels.forEach((funnel) => {
  const availability = definedSlugs.has(funnel.slug) ? 'available' : 'coming_soon'
  // ...
})
```

### UI States

1. **Available Funnel** (`availability: 'available'`):
   - Card enabled, full colors
   - "Assessment starten" CTA
   - Navigates to funnel on click

2. **Coming Soon Funnel** (`availability: 'coming_soon'`):
   - Card disabled, 60% opacity
   - "In Kürze verfügbar" text
   - No navigation on click
   - Direct URL shows "Not Available" page

3. **Not Available** (direct navigation to undefined funnel):
   - Full-page "Not Available" UI
   - 🚧 icon
   - Clear message
   - "Back to Catalog" button

## Database Context

### Tables Involved

1. **`funnels_catalog`**: Marketing/discovery layer
   - Contains: slug, title, description, pillar_id, outcomes, est_duration
   - Purpose: Show funnels in catalog even before fully defined

2. **`funnels`**: Implementation layer
   - Contains: slug, title, subtitle, description, is_active
   - Purpose: Fully defined funnels with steps and questions

3. **`funnel_steps`**: Step definitions
   - Links to: funnels (funnel_id)

4. **`funnel_step_questions`**: Question assignments
   - Links to: funnel_steps, questions

### Current State

- `stress-assessment`: Exists in BOTH tables → **available**
- `cardiovascular-age`: Only in catalog → **coming_soon**
- `heart-health-nutrition`: Only in catalog → **coming_soon**
- `sleep-quality`: Only in catalog → **coming_soon**

## Testing

### Unit Tests

```bash
npx jest lib/types/__tests__/catalog.test.ts
```

All 10 tests passing:
- Type validation for availability field
- Availability determination logic
- Catalog response structure

### Build

```bash
npm run build
```

✅ TypeScript compilation successful
✅ Next.js build successful

### Manual Smoke Test Checklist

1. **Login Flow**:
   - [ ] Login as patient → lands on `/patient/funnels`
   - [ ] Navigate to `/patient/assessment` → redirects to `/patient/funnels`

2. **Catalog View**:
   - [ ] See "Stress Assessment" as enabled (available)
   - [ ] See "Cardiovascular Age", "Heart Health Nutrition", "Sleep Quality" as disabled (coming soon)
   - [ ] Disabled cards show "In Kürze verfügbar"
   - [ ] Click on available funnel → navigates to intro/assessment
   - [ ] Click on coming-soon funnel → no navigation (disabled)

3. **Direct Navigation**:
   - [ ] Navigate to `/patient/funnel/stress-assessment` → works
   - [ ] Navigate to `/patient/funnel/cardiovascular-age` → shows "Not Available" UI
   - [ ] Click "Back to Catalog" → returns to `/patient/funnels`

4. **Stress Assessment**:
   - [ ] Complete stress assessment
   - [ ] Result page loads successfully
   - [ ] No 404 errors in console
   - [ ] Content may be minimal but no error states

## HTTP Semantics

All endpoints follow proper HTTP semantics:

- **401**: Unauthenticated (auth-first)
- **403**: Forbidden (authenticated but no permission)
- **404**: Resource not found (only when truly not found)
- **200**: Success (including empty arrays for optional content)
- **422**: Validation failed (domain validation errors)

## Determinism

All funnel slugs and availability states are determined from:
- Database tables (`funnels_catalog`, `funnels`)
- Registry constants (`/lib/contracts/registry.ts`)
- No hardcoded slugs or magic strings in UI

## Security & Privacy

- No PHI/secrets in logs
- No raw error dumps to client
- Generic error messages for users
- Detailed server-side logging for diagnostics

## Future Enhancements

To make a funnel "available":

1. Add entry to `funnels` table with matching slug
2. Add steps to `funnel_steps` table
3. Add questions to `funnel_step_questions` table
4. Catalog API will automatically detect and mark as `available`

Migration example:
```sql
-- Add cardiovascular-age to funnels table
INSERT INTO funnels (slug, title, description, is_active)
VALUES (
  'cardiovascular-age',
  'Cardiovascular Age Assessment',
  'Bestimmen Sie Ihr kardiovaskuläres Alter',
  true
);

-- Add steps, questions, etc.
-- Catalog API will automatically mark as 'available'
```

## Files Changed

1. `/app/patient/page.tsx` - Landing redirect
2. `/app/patient/assessment/page.tsx` - Legacy route redirect
3. `/app/patient/funnels/page.tsx` - Force dynamic rendering
4. `/app/patient/funnels/client.tsx` - Availability handling
5. `/app/patient/funnel/[slug]/client.tsx` - 404 handling
6. `/app/components/FunnelCard.tsx` - Disabled state
7. `/app/api/funnels/catalog/route.ts` - Availability detection
8. `/app/api/funnels/[slug]/content-pages/route.ts` - Empty array fallback
9. `/lib/types/catalog.ts` - Availability types
10. `/lib/types/__tests__/catalog.test.ts` - Tests (new)

## Acceptance Criteria Status

- ✅ AC-1: Patient lands on `/patient/funnels` after login
- ✅ AC-2: Catalog shows deterministic funnel categorization
- ✅ AC-3: No 404 errors for cardiovascular-age, heart-health-nutrition, sleep-quality
- ✅ AC-4: Stress assessment completion loads result without 404 spam
- ✅ AC-5: Proper HTTP semantics (401/404/403/422)
- ✅ AC-6: Tests pass, build successful
