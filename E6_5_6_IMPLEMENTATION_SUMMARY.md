# E6.5.6 Implementation Summary

**Issue**: E6.5.6 — Content Tiles MVP (Stub Source, Deterministic Ordering, No CMS Yet)

**Date**: 2026-01-16

**Status**: ✅ Complete

---

## Objective

Implement minimal content tile model with:
- Static data source (JSON, no CMS)
- Deterministic ordering (rank asc, slug asc - no localeCompare drift)
- Integration with patient dashboard
- Max tiles limit (configurable)

---

## Problem Statement

The patient dashboard needed content tiles to display recommended content and resources. Requirements:
- **Minimal data model**: id, slug, title, summary, category, href, rank
- **Deterministic ordering**: Explicit numeric rank (lower = higher priority), slug as tiebreaker
- **No CMS dependency**: Static JSON data source for MVP
- **Bounded output**: Max N tiles (6-12 range)
- **Navigation ready**: Tiles can be clicked to navigate to content pages

---

## Solution Design

### Architecture

```
┌─────────────────────────────────────────┐
│       Patient Dashboard API             │
│                                          │
│  1. Fetch content tiles via service     │
│  2. Apply max limit (10 tiles)          │
│  3. Include in dashboard view model     │
└─────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Content Tiles Service │
        │  (lib/services)        │
        │                        │
        │  • Transform data      │
        │  • Map to contract     │
        └────────────────────────┘
                     │
                     ▼
           ┌──────────────────┐
           │  Content Tiles   │
           │  Data Model      │
           │  (lib/data)      │
           │                  │
           │  • Static JSON   │
           │  • Deterministic │
           │    ordering      │
           └──────────────────┘
```

### Data Flow

1. **Data Model** (`lib/data/contentTiles.ts`):
   - Static JSON array with 8 sample tiles
   - `sortContentTilesDeterministic()` - rank ASC, slug ASC
   - `getContentTiles(maxTiles)` - sorted and limited

2. **Service Layer** (`lib/services/contentTiles.ts`):
   - `fetchContentTilesForDashboard(maxTiles)` - fetches and transforms
   - Maps category → dashboard tile type
   - Converts rank to priority (inverted for dashboard contract)

3. **Dashboard Integration** (`app/api/patient/dashboard/route.ts`):
   - Calls `fetchContentTilesForDashboard(MAX_CONTENT_TILES)`
   - Includes tiles in `DashboardViewModelV1`
   - Bounded IO (max 10 tiles by default)

4. **UI Consumption** (`app/patient/dashboard/client.tsx`):
   - `ContentTilesGrid` component already exists
   - Receives tiles from dashboard API
   - Handles tile clicks for navigation

---

## Implementation

### 1. Content Tiles Data Model

**File**: `lib/data/contentTiles.ts`

**Key Features**:
- ✅ Minimal model (E6.5.6 spec)
- ✅ Static JSON source (8 tiles)
- ✅ Deterministic ordering (E6.5.6 AC2)
- ✅ Max tiles limit (E6.5.6 AC1)

**Interface**:
```typescript
interface ContentTileData {
  id: string
  slug: string
  title: string
  summary: string
  category: string
  href: string
  rank: number
}
```

**Static Data**:
```typescript
export const CONTENT_TILES_DATA: ContentTileData[] = [
  {
    id: '1',
    slug: 'stress-verstehen',
    title: 'Stress verstehen',
    summary: 'Erfahren Sie mehr über die verschiedenen Arten von Stress und deren Auswirkungen.',
    category: 'info',
    href: '/content/stress-verstehen',
    rank: 10,
  },
  // ... 7 more tiles
]
```

**Deterministic Ordering**:
```typescript
export function sortContentTilesDeterministic(tiles: ContentTileData[]): ContentTileData[] {
  return [...tiles].sort((a, b) => {
    // Primary sort: rank ascending
    if (a.rank !== b.rank) {
      return a.rank - b.rank
    }
    
    // Secondary sort: slug ascending (lexicographic)
    // Using simple string comparison for deterministic behavior
    if (a.slug < b.slug) return -1
    if (a.slug > b.slug) return 1
    return 0
  })
}
```

**Get Tiles with Limit**:
```typescript
export function getContentTiles(maxTiles: number = 10): ContentTileData[] {
  const sorted = sortContentTilesDeterministic(CONTENT_TILES_DATA)
  return sorted.slice(0, maxTiles)
}
```

### 2. Content Tiles Service

**File**: `lib/services/contentTiles.ts`

**Purpose**: Transform internal data model to dashboard contract

**Key Functions**:

**Category Mapping**:
```typescript
function mapCategoryToType(category: string): ContentTile['type'] {
  switch (category) {
    case 'action':
      return 'action'
    case 'promotion':
      return 'promotion'
    case 'info':
    default:
      return 'info'
  }
}
```

**Data Transformation**:
```typescript
function transformToContentTile(data: ContentTileData): ContentTile {
  return {
    id: data.id,
    type: mapCategoryToType(data.category),
    title: data.title,
    description: data.summary,
    actionLabel: null,
    actionTarget: data.href,
    priority: 100 - data.rank, // Invert rank so lower rank = higher priority
  }
}
```

**Public API**:
```typescript
export function fetchContentTilesForDashboard(maxTiles: number = 10): ContentTile[] {
  const tiles = getContentTiles(maxTiles)
  return tiles.map(transformToContentTile)
}
```

### 3. Dashboard API Integration

**File**: `app/api/patient/dashboard/route.ts`

**Changes**:

**Import Service**:
```typescript
import { fetchContentTilesForDashboard } from '@/lib/services/contentTiles'
```

**Fetch Tiles**:
```typescript
// E6.5.6: Fetch content tiles with deterministic ordering
const contentTiles = fetchContentTilesForDashboard(MAX_CONTENT_TILES)
```

**Include in View Model**:
```typescript
const dashboardData: DashboardViewModelV1 = {
  ...createEmptyDashboardViewModel(correlationId),
  onboardingStatus: resolverInput.onboardingStatus,
  nextStep: resolution.nextStep,
  workupSummary: {
    state: workupState,
    counts: {
      needsMoreData: workupNeedsMoreDataCount,
      readyForReview: workupReadyForReviewCount,
      total: (workupAssessments?.length || 0),
    },
  },
  contentTiles, // ← E6.5.6: Include content tiles
}
```

### 4. Comprehensive Unit Tests

**File**: `lib/data/__tests__/contentTiles.test.ts`

**Coverage**: 23 tests, all passing ✅

**Test Categories**:

**Data Validation** (7 tests)
- ✅ Has 6-12 tiles (E6.5.6 AC1)
- ✅ All required fields present
- ✅ Unique IDs and slugs
- ✅ Valid href paths
- ✅ Non-negative ranks

**Deterministic Ordering** (7 tests)
- ✅ Sorts by rank ascending
- ✅ Sorts by slug ascending when rank equal
- ✅ Same input produces same output (E6.5.6 AC2)
- ✅ Does not mutate original array
- ✅ Handles edge cases (empty, single item)
- ✅ Uses lexicographic comparison (no localeCompare drift)

**Max Tiles Limit** (7 tests)
- ✅ Returns sorted tiles (E6.5.6 AC2)
- ✅ Limits to default 10 tiles
- ✅ Limits to specified max
- ✅ Returns all if max > available
- ✅ Returns highest priority tiles
- ✅ Deterministic across multiple calls
- ✅ Handles maxTiles of 0

**Integration Tests** (2 tests)
- ✅ Provides tiles ready for dashboard API
- ✅ Maintains deterministic order across calls

### 5. Dashboard API Tests Updated

**File**: `app/api/patient/dashboard/__tests__/route.test.ts`

**Changes**:
- Updated test to verify content tiles are now included
- Test now expects `contentTiles` array with data

**Before**:
```typescript
it('should return empty state as MVP implementation', async () => {
  expect(body.data.contentTiles).toEqual([])
})
```

**After**:
```typescript
it('should return content tiles in dashboard (E6.5.6)', async () => {
  expect(body.data.contentTiles).toBeDefined()
  expect(Array.isArray(body.data.contentTiles)).toBe(true)
  expect(body.data.contentTiles.length).toBeGreaterThan(0)
})
```

**Result**: All 17 dashboard API tests passing ✅

---

## Acceptance Criteria

### ✅ AC1: Max Tiles N (e.g. 6–12)

**Implementation**:
- Static data source has 8 tiles (within 6-12 range)
- `getContentTiles(maxTiles)` enforces limit
- Dashboard uses `MAX_CONTENT_TILES = 10`
- Configurable via function parameter

**Verification**:
```bash
npm test -- lib/data/__tests__/contentTiles.test.ts

# Tests include:
# ✓ should have at least 6 tiles
# ✓ should have at most 12 tiles
# ✓ should limit to default 10 tiles
# ✓ should limit to specified max tiles
```

**Example**:
```typescript
const tiles3 = getContentTiles(3)   // Returns 3 highest priority tiles
const tiles10 = getContentTiles(10) // Returns all 8 tiles (max available)
```

### ✅ AC2: Deterministic Ordering (rank asc, slug asc)

**Implementation**:
- Primary sort: `rank` ascending (lower rank = higher priority)
- Secondary sort: `slug` ascending (lexicographic, no localeCompare)
- Pure function, no randomness or external dependencies
- Always returns same output for same input

**Verification**:
```bash
npm test -- lib/data/__tests__/contentTiles.test.ts

# Tests include:
# ✓ should sort by rank ascending (lower rank first)
# ✓ should sort by slug ascending when rank is equal
# ✓ should be deterministic - same input produces same output
# ✓ should use lexicographic comparison for slugs
```

**Example**:
```typescript
const tiles1 = getContentTiles(8)
const tiles2 = getContentTiles(8)
expect(tiles1).toEqual(tiles2) // ✓ Always identical
```

**Ordering Example**:
```
1. "Stress verstehen" (rank: 10)
2. "Resilienztechniken" (rank: 20)
3. "Achtsamkeitsübungen" (rank: 30)
4. "Schlafhygiene" (rank: 40)
...
```

### ✅ AC3: Tile Click Navigates to Content Page

**Implementation**:
- Each tile has `href` field with internal path
- Service transforms to `actionTarget` in dashboard contract
- UI component handles click → navigation
- Existing `ContentTilesGrid` component already implements navigation

**Verification**:
```typescript
// Dashboard client (already implemented)
const handleTileClick = (tile: any) => {
  if (tile.actionTarget) {
    router.push(tile.actionTarget)  // ✓ Navigate to content page
  }
}
```

**Data Structure**:
```typescript
{
  id: '1',
  title: 'Stress verstehen',
  actionTarget: '/content/stress-verstehen',  // ✓ Ready for navigation
  ...
}
```

**UI Integration** (already exists):
- `ContentTilesGrid` component receives tiles
- Click handler calls `onTileClick`
- Router navigates to `actionTarget`

---

## Testing

### Unit Tests

**Content Tiles Tests**:
```bash
npm test -- lib/data/__tests__/contentTiles.test.ts

# ✅ 23/23 tests passing
```

**Dashboard API Tests**:
```bash
npm test -- app/api/patient/dashboard/__tests__/route.test.ts

# ✅ 17/17 tests passing
```

**All Tests**:
```bash
npm test

# ✅ 113 test suites, 1692 tests passing
```

### Build Verification

```bash
npm run build

# ✅ Build successful
# ✅ TypeScript compilation passed
# ✅ No type errors
```

### Linting

```bash
npx eslint lib/data/contentTiles.ts lib/services/contentTiles.ts

# ✅ No errors in new files
```

---

## Files Changed

### New Files
- `lib/data/contentTiles.ts` - Content tiles data model (127 lines)
- `lib/data/__tests__/contentTiles.test.ts` - Comprehensive tests (230 lines)
- `lib/services/contentTiles.ts` - Service layer (51 lines)
- `E6_5_6_IMPLEMENTATION_SUMMARY.md` - This document

### Modified Files
- `app/api/patient/dashboard/route.ts` - Integrated content tiles service
- `app/api/patient/dashboard/__tests__/route.test.ts` - Updated test expectations

---

## Integration Points

### E6.5.2: Dashboard Data Contract V1
- ✅ Uses existing `ContentTile` type from dashboard contract
- ✅ Compatible with `DashboardViewModelV1.contentTiles` array
- ✅ Follows contract structure (id, type, title, description, actionTarget, priority)

### E6.5.3: Dashboard API - RLS and Bounded IO
- ✅ Integrated into existing dashboard API route
- ✅ Maintains bounded IO (max N tiles)
- ✅ No database queries (static data source)

### E6.5.4: Dashboard Shell with Section Slots
- ✅ Uses existing `ContentTilesGrid` component
- ✅ Dashboard client already renders content tiles
- ✅ Tile click navigation already implemented

---

## Sample Data

The MVP includes 8 content tiles covering key resilience topics:

1. **Stress verstehen** (info) - Understanding stress types and impacts
2. **Resilienztechniken** (action) - Practical resilience methods
3. **Achtsamkeitsübungen** (action) - Mindfulness exercises
4. **Schlafhygiene** (info) - Sleep hygiene tips
5. **Bewegung und Entspannung** (action) - Exercise and relaxation
6. **Ernährung und Psyche** (info) - Nutrition and mental health
7. **Zeitmanagement** (action) - Time management strategies
8. **Soziale Unterstützung** (info) - Social support importance

Each tile has:
- German title and summary
- Category (info, action, promotion)
- Internal href path (`/content/[slug]`)
- Explicit rank for ordering

---

## Future Enhancements

### Potential Improvements

1. **CMS Integration**
   - Replace static JSON with database table
   - Admin UI for content management
   - Dynamic tile creation/editing

2. **Personalization**
   - User preferences for tile ordering
   - Hide dismissed tiles
   - Recommend based on user activity

3. **Analytics**
   - Track tile click rates
   - A/B test different tiles
   - Optimize ordering based on engagement

4. **Rich Content**
   - Add images/icons
   - Support markdown in descriptions
   - Include tags/keywords

5. **Advanced Filtering**
   - Filter by category
   - Search within tiles
   - Favorite tiles

6. **Internationalization**
   - Multi-language support
   - Localized content
   - Culture-specific tiles

---

## Performance Considerations

### Current Implementation
- **No database queries**: Static data source (fast)
- **Deterministic sorting**: O(n log n), minimal overhead
- **Memory efficient**: Small dataset (8 tiles)
- **Response time**: <1ms for tile fetching

### Production Recommendations
1. **Caching**:
   - Cache static tiles at build time
   - Use Next.js static generation if tiles rarely change
   
2. **If Moving to Database**:
   - Add index on `rank` column
   - Cache query results
   - Consider materialized view for sorted tiles

3. **Pagination**:
   - Not needed for MVP (8 tiles)
   - Consider for >20 tiles in future

---

## Security Considerations

### Data Safety
- ✅ No user input in tile data
- ✅ Static data source (no injection risk)
- ✅ All hrefs are internal paths (no external links)

### Access Control
- ✅ Tiles available to all authenticated users
- ✅ No sensitive data in tiles
- ✅ Dashboard API enforces authentication

### Future Considerations
- Validate hrefs when moving to database
- Sanitize user-generated content (if added)
- Implement content approval workflow

---

## Lessons Learned

1. **Deterministic Ordering is Critical**
   - Avoided `localeCompare` to prevent platform drift
   - Explicit numeric rank prevents ambiguity
   - Slug as tiebreaker ensures stability

2. **Static Data for MVP is Sufficient**
   - No CMS complexity
   - Fast implementation
   - Easy to migrate to database later

3. **Service Layer Enables Flexibility**
   - Separates data model from dashboard contract
   - Easy to swap data sources
   - Clean transformation logic

4. **Comprehensive Testing Pays Off**
   - 23 tests for core functionality
   - Edge cases covered
   - Confidence in refactoring

5. **UI Integration Was Already There**
   - Dashboard shell ready for tiles
   - No UI work needed
   - Smooth integration

---

## Related Issues

- **E6.5.2**: Dashboard Data Contract V1 (provides ContentTile type)
- **E6.5.3**: Dashboard API - RLS and Bounded IO (integration point)
- **E6.5.4**: Dashboard Shell with Section Slots (UI component)

---

## Conclusion

Content Tiles MVP successfully implemented with:
- ✅ **AC1**: Max tiles 6-12 (using 8 tiles, configurable limit)
- ✅ **AC2**: Deterministic ordering (rank ASC, slug ASC)
- ✅ **AC3**: Tile click navigates to content page
- ✅ Static JSON data source (no CMS dependency)
- ✅ 23 unit tests passing (deterministic ordering verified)
- ✅ Dashboard API integration complete
- ✅ UI smoke test ready (existing component)
- ✅ Build successful
- ✅ All 1692 tests passing

**Ready for production deployment.**

Dashboard now displays recommended content tiles with deterministic ordering and navigation support.
