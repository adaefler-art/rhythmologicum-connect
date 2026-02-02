# E75.3 — Rules vs. Checks Matrix

**Purpose:** Ensure every rule has a check and every check maps to a rule (bidirectional traceability).

**Status:** ✅ Complete  
**Last Updated:** 2026-02-02

---

## Matrix Overview

| Rule ID | Rule Description | Check Type | Check Location | Status | Notes |
|---------|-----------------|------------|----------------|--------|-------|
| R-E75.3-1 | Timeline list route exists at `/patient/anamnese-timeline` | File Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 1: Verify route files exist |
| R-E75.3-2 | Detail route exists at `/patient/anamnese-timeline/[entryId]/detail` | File Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 1: Verify route files exist |
| R-E75.3-3 | Timeline uses mobile-v2 UI components only | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 2: Verify mobile-v2 imports |
| R-E75.3-4 | Timeline displays entries grouped by entry_type | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 3: Verify grouping logic |
| R-E75.3-5 | Timeline shows loading state | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 4: Verify state handling |
| R-E75.3-6 | Timeline shows empty state | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 4: Verify state handling |
| R-E75.3-7 | Timeline shows error state | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 4: Verify state handling |
| R-E75.3-8 | Add entry modal exists and creates entry | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 5: Verify add functionality |
| R-E75.3-9 | Edit entry modal exists and updates entry | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 6: Verify edit functionality |
| R-E75.3-10 | Archive confirmation exists and archives entry | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 7: Verify archive functionality |
| R-E75.3-11 | PATCH endpoint exists for updating entries | API Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 8: Verify PATCH endpoint |
| R-E75.3-12 | Navigation entry exists in BottomNavV2 | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 9: Verify navigation |
| R-E75.3-13 | No max-w-* constraints in timeline UI | UI v2 Check | `verify:ui-v2` | ✅ | Automated via npm run verify:ui-v2 |
| R-E75.3-14 | No legacy imports (e.g., direct lucide-react) | UI v2 Check | `verify:ui-v2` | ✅ | Automated via npm run verify:ui-v2 |
| R-E75.3-15 | Version history displayed in detail view | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 10: Verify version display |
| R-E75.3-16 | Entry type badges use correct variant mapping | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 11: Verify badge variants |
| R-E75.3-17 | Filter tabs (Active/Archived/All) implemented | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 12: Verify filter logic |
| R-E75.3-18 | Dashboard-first policy enforced | Code Check | `scripts/ci/verify-e75-3-ui.mjs` | ✅ | Check 13: Verify enforceDashboardFirst |

---

## Detailed Rule → Check Mapping

### R-E75.3-1: Timeline List Route Exists

**Rule:**
Timeline list view must exist at `/patient/anamnese-timeline` as a server component.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 1)
- **Verification:** File existence check for `page.tsx` and `client.tsx`

**Evidence:**
```typescript
// apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/page.tsx
export default async function AnamneseTimelinePage() { ... }
```

**Status:** ✅ Pass

---

### R-E75.3-2: Detail Route Exists

**Rule:**
Detail view must exist at `/patient/anamnese-timeline/[entryId]/detail` with server and client components.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 1)
- **Verification:** File existence check for detail route files

**Evidence:**
```typescript
// apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/page.tsx
export default async function AnamneseDetailPage({ params }) { ... }
```

**Status:** ✅ Pass

---

### R-E75.3-3: Mobile-v2 UI Components Only

**Rule:**
Timeline UI must use only mobile-v2 components (Card, Button, Badge, EmptyState, ErrorState, LoadingSkeleton).

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 2)
- **Verification:** Parse imports and verify they come from `@/lib/ui/mobile-v2`

**Evidence:**
```typescript
import { Card, Button, Badge, EmptyState, ErrorState, LoadingSkeleton } from '@/lib/ui/mobile-v2'
import { Plus, Clock, ArrowLeft } from '@/lib/ui/mobile-v2/icons'
```

**Status:** ✅ Pass

---

### R-E75.3-4: Entries Grouped by entry_type

**Rule:**
Timeline must display entries grouped by entry_type with German labels.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 3)
- **Verification:** Check for `groupedEntries` logic and `ENTRY_TYPE_LABELS` mapping

**Evidence:**
```typescript
const groupedEntries = filteredEntries.reduce((acc, entry) => {
  const type = entry.entry_type || 'other'
  if (!acc[type]) { acc[type] = [] }
  acc[type].push(entry)
  return acc
}, {} as Record<string, AnamnesisEntry[]>)
```

**Status:** ✅ Pass

---

### R-E75.3-5-7: Deterministic UI States

**Rule:**
Timeline must implement loading, empty, and error states using mobile-v2 components.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 4)
- **Verification:** Check for FetchState discriminated union and state rendering

**Evidence:**
```typescript
type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; entries: AnamnesisEntry[] }
  | { status: 'error'; message: string }

if (state.status === 'loading') return <LoadingSkeleton />
if (state.status === 'error') return <ErrorState />
if (entries.length === 0) return <EmptyState />
```

**Status:** ✅ Pass

---

### R-E75.3-8: Add Entry Functionality

**Rule:**
Add entry modal must exist with form for title, entry_type, and POST to API.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 5)
- **Verification:** Check for AddEntryModal component and POST logic

**Evidence:**
```typescript
function AddEntryModal({ onClose, onSuccess }) {
  const handleSubmit = async (e) => {
    const response = await fetch('/api/patient/anamnesis', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
  }
}
```

**Status:** ✅ Pass

---

### R-E75.3-9: Edit Entry Functionality

**Rule:**
Edit entry modal must exist, pre-populate with entry data, and PATCH to API.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 6)
- **Verification:** Check for EditEntryModal component and PATCH logic

**Evidence:**
```typescript
function EditEntryModal({ entry, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: entry.title,
    entry_type: entry.entry_type || 'other',
  })
  
  const response = await fetch(`/api/patient/anamnesis/${entry.id}`, {
    method: 'PATCH',
    body: JSON.stringify(formData),
  })
}
```

**Status:** ✅ Pass

---

### R-E75.3-10: Archive Functionality

**Rule:**
Archive confirmation modal must exist and POST to archive endpoint.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 7)
- **Verification:** Check for archive confirmation and POST logic

**Evidence:**
```typescript
const handleArchive = async () => {
  const response = await fetch(`/api/patient/anamnesis/${entryId}/archive`, {
    method: 'POST',
  })
}
```

**Status:** ✅ Pass

---

### R-E75.3-11: PATCH Endpoint Exists

**Rule:**
PATCH endpoint must exist at `/api/patient/anamnesis/[entryId]` to update entries.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 8)
- **Verification:** Check for PATCH export in route file

**Evidence:**
```typescript
// apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts
export async function PATCH(request: Request, context: RouteContext) { ... }
```

**Status:** ✅ Pass

---

### R-E75.3-12: Navigation Entry Exists

**Rule:**
Timeline must be added to BottomNavV2 with canonical route.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 9)
- **Verification:** Check menuConfig and navigation utils

**Evidence:**
```typescript
// apps/rhythm-patient-ui/app/patient/(mobile)/navigation/menuConfig.ts
{
  id: 'anamnese',
  label: 'Timeline',
  href: CANONICAL_ROUTES.ANAMNESE_TIMELINE,
  icon: '📋',
  order: 2,
}
```

**Status:** ✅ Pass

---

### R-E75.3-13-14: UI v2 Compliance

**Rule:**
Timeline UI must pass all UI v2 verification checks (no max-w-*, no legacy imports).

**Check Implementation:**
- **Script:** `npm run verify:ui-v2` (automated)
- **Verification:** Runs all 6 UI v2 checks

**Evidence:**
```bash
✅ All checks passed! Mobile UI v2 constraints are satisfied.
```

**Status:** ✅ Pass

---

### R-E75.3-15: Version History Display

**Rule:**
Detail view must display version history with version numbers and timestamps.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 10)
- **Verification:** Check for version list rendering in detail client

**Evidence:**
```typescript
{versions.map((version) => (
  <Card key={version.id}>
    <p>Version {version.version_number}</p>
    <p>{formatDateTime(version.changed_at)}</p>
  </Card>
))}
```

**Status:** ✅ Pass

---

### R-E75.3-16: Entry Type Badge Variants

**Rule:**
Entry type badges must use correct color variants based on type.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 11)
- **Verification:** Check for ENTRY_TYPE_COLORS mapping

**Evidence:**
```typescript
const ENTRY_TYPE_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  medical_history: 'primary',
  symptoms: 'danger',
  medications: 'success',
  allergies: 'warning',
  ...
}
```

**Status:** ✅ Pass

---

### R-E75.3-17: Filter Tabs Implemented

**Rule:**
Timeline must have filter tabs for Active, Archived, and All entries.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 12)
- **Verification:** Check for filter state and filtering logic

**Evidence:**
```typescript
const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active')

const filteredEntries = state.entries.filter((entry) => {
  if (filter === 'all') return true
  if (filter === 'active') return !entry.is_archived
  if (filter === 'archived') return entry.is_archived
  return true
})
```

**Status:** ✅ Pass

---

### R-E75.3-18: Dashboard-First Policy

**Rule:**
Both timeline and detail routes must enforce dashboard-first policy.

**Check Implementation:**
- **Script:** `scripts/ci/verify-e75-3-ui.mjs` (Check 13)
- **Verification:** Check for `enforceDashboardFirst` call in page.tsx files

**Evidence:**
```typescript
// Both page.tsx files
const redirectUrl = await enforceDashboardFirst('/patient/anamnese-timeline')
if (redirectUrl) { redirect(redirectUrl) }
```

**Status:** ✅ Pass

---

## Check → Rule Reverse Mapping

| Check ID | Check Description | Rules Covered | Location |
|----------|------------------|---------------|----------|
| CHECK-1 | Route files exist | R-E75.3-1, R-E75.3-2 | `verify-e75-3-ui.mjs` |
| CHECK-2 | Mobile-v2 imports only | R-E75.3-3 | `verify-e75-3-ui.mjs` |
| CHECK-3 | Entry grouping logic | R-E75.3-4 | `verify-e75-3-ui.mjs` |
| CHECK-4 | UI state handling | R-E75.3-5, R-E75.3-6, R-E75.3-7 | `verify-e75-3-ui.mjs` |
| CHECK-5 | Add entry functionality | R-E75.3-8 | `verify-e75-3-ui.mjs` |
| CHECK-6 | Edit entry functionality | R-E75.3-9 | `verify-e75-3-ui.mjs` |
| CHECK-7 | Archive functionality | R-E75.3-10 | `verify-e75-3-ui.mjs` |
| CHECK-8 | PATCH endpoint | R-E75.3-11 | `verify-e75-3-ui.mjs` |
| CHECK-9 | Navigation config | R-E75.3-12 | `verify-e75-3-ui.mjs` |
| CHECK-10 | Version history display | R-E75.3-15 | `verify-e75-3-ui.mjs` |
| CHECK-11 | Badge variant mapping | R-E75.3-16 | `verify-e75-3-ui.mjs` |
| CHECK-12 | Filter tabs logic | R-E75.3-17 | `verify-e75-3-ui.mjs` |
| CHECK-13 | Dashboard-first policy | R-E75.3-18 | `verify-e75-3-ui.mjs` |
| CHECK-UI-v2 | UI v2 compliance | R-E75.3-13, R-E75.3-14 | `npm run verify:ui-v2` |

---

## Diff Report

### Rules Without Checks
✅ None - All 18 rules have corresponding checks

### Checks Without Rules
✅ None - All 14 checks map to rules

### Scope Mismatches
✅ None - All checks correctly validate their associated rules

---

## Execution

Run all E75.3 checks:

```bash
# Run UI verification check
npm run verify:e75-3

# Run UI v2 compliance (required for R-E75.3-13, R-E75.3-14)
npm run verify:ui-v2
```

Expected output on success:
```
✅ CHECK-1: Route files exist
✅ CHECK-2: Mobile-v2 imports only
✅ CHECK-3: Entry grouping logic
✅ CHECK-4: UI state handling
✅ CHECK-5: Add entry functionality
✅ CHECK-6: Edit entry functionality
✅ CHECK-7: Archive functionality
✅ CHECK-8: PATCH endpoint exists
✅ CHECK-9: Navigation config
✅ CHECK-10: Version history display
✅ CHECK-11: Badge variant mapping
✅ CHECK-12: Filter tabs logic
✅ CHECK-13: Dashboard-first policy

All E75.3 rules verified ✅
```

---

## Summary

- **Total Rules:** 18
- **Total Checks:** 14 (includes multi-rule checks)
- **Coverage:** 100%
- **Bidirectional Traceability:** ✅ Complete
- **All Checks Reference Rule IDs:** ✅ Yes
- **All Rules Have Checks:** ✅ Yes
