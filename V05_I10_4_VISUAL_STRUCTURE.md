# Review Queue Dashboard - Visual Structure

**V05-I10.4 Implementation**  
**URL:** `/clinician/review-queue`

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🛡️  Review Queue                                    [Refresh Button] │
│ Content safety operations - flagged reports & quality sampling       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          STATS CARDS (4 columns)                     │
├───────────────┬───────────────┬───────────────┬───────────────────┤
│ 🕐 Pending    │ ⚠️  Overdue   │ 📈 High Pri   │ ✅ Completed      │
│ Reviews       │ (SLA)         │ (P0/P1)       │                   │
│               │               │               │                   │
│    12         │      3        │      8        │      50           │
│ 62 total      │ Action Req'd  │ P0:2  P1:6   │ ✓45   ✗5         │
└───────────────┴───────────────┴───────────────┴───────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Filters:                                                          │
│                                                                      │
│ Status:  [PENDING]  [APPROVED]  [REJECTED]  [CHANGES_REQUESTED]    │
│                                                                      │
│ Priority: [ALL]  [P0]  [P1]  [P2]  [P3]                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Queue Items                                                          │
│ 12 items (pending)                                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Priority │ Reason          │ Age        │ Validation │ Safety       │
├──────────┼─────────────────┼────────────┼────────────┼──────────────┤
│ [P0]🔴   │ SAFETY_BLOCK    │ 3h 45m     │ fail       │ BLOCK        │
│          │                 │ [Overdue]🔴│ 2 critical │ Score: 45/100│
├──────────┼─────────────────┼────────────┼────────────┼──────────────┤
│ [P0]🔴   │ VALIDATION_FAIL │ 2h 15m     │ fail       │ FLAG         │
│          │                 │ [Overdue]🔴│ 3 critical │ Score: 62/100│
├──────────┼─────────────────┼────────────┼────────────┼──────────────┤
│ [P1]🟠   │ SAFETY_FLAG     │ 4h 30m     │ flag       │ FLAG         │
│          │                 │ [Due Soon]🟠│ 1 warning │ Score: 68/100│
├──────────┼─────────────────┼────────────┼────────────┼──────────────┤
│ [P1]🟠   │ SAFETY_UNKNOWN  │ 7h 12m     │ pass       │ UNKNOWN      │
│          │                 │ [Due Soon]🟠│ —         │ Score: —     │
├──────────┼─────────────────┼────────────┼────────────┼──────────────┤
│ [P2]🔵   │ VALIDATION_FLAG │ 6h 05m     │ flag       │ PASS         │
│          │                 │ [On Track]🟢│ 2 warning │ Score: 85/100│
├──────────┼─────────────────┼────────────┼────────────┼──────────────┤
│ [P3]⚫   │ SAMPLED         │ 15m        │ pass       │ PASS         │
│          │                 │ [On Track]🟢│ —         │ Score: 92/100│
└──────────┴─────────────────┴────────────┴────────────┴──────────────┘
```

---

## Component Breakdown

### 1. Header Section
```
┌─────────────────────────────────────────────────────────┐
│ 🛡️ Icon: Shield (emerald)                               │
│ Title: "Review Queue" (3xl font, bold)                  │
│ Subtitle: "Content safety operations - flagged..."      │
│                                                          │
│ [Refresh Button] - Secondary variant, top-right         │
└─────────────────────────────────────────────────────────┘
```

### 2. Stats Cards Grid
```
Grid: 1 col mobile, 2 cols tablet, 4 cols desktop
Each card:
  - Padding: lg
  - Shadow: md → lg on hover
  - Radius: lg
  - Transition: shadow

Card Structure:
┌───────────────────────────┐
│ Label (sm, slate-500)     │
│                           │
│ Value (3xl, bold)         │
│                           │
│ Subtitle/Badge            │
│                           │
│          [Icon]           │
│          (top-right)      │
└───────────────────────────┘

Icons:
  - Pending: 🕐 Clock (primary-600)
  - Overdue: ⚠️ AlertTriangle (red-600)
  - High Priority: 📈 TrendingUp (orange-600)
  - Completed: ✅ CheckCircle (emerald-600)
```

### 3. Filters Section
```
Card with padding: md, shadow: sm

Layout: Flex row, gap-4, wrap on mobile

Components:
  - Filter icon + label
  - Status buttons (4 buttons)
  - Priority buttons (5 buttons)

Button states:
  - Active: Primary variant
  - Inactive: Ghost variant
```

### 4. Table Header
```
Simple text header:
  - Title: "Queue Items" (xl, semibold)
  - Subtitle: "X items (status)" (sm, slate-600)
```

### 5. Data Table
```
Columns: 6
  1. Priority - Badge with color
  2. Reason - Badge(s)
  3. Age - Time + SLA badge
  4. Validation - Status + flags
  5. Safety - Action + score
  6. Created - Timestamp

Features:
  - Hoverable rows
  - Bordered
  - Click to navigate
  - Empty state message
```

---

## Color Palette

### Priority Badges
- **P0:** `danger` variant - Red (#DC2626 / #EF4444)
- **P1:** `warning` variant - Orange (#EA580C / #F97316)
- **P2:** `info` variant - Blue (#0284C7 / #0EA5E9)
- **P3:** `secondary` variant - Gray (#64748B / #94A3B8)

### SLA Badges
- **Overdue:** `danger` variant - Red
- **Due Soon:** `warning` variant - Orange
- **On Track:** `success` variant - Green (#059669 / #10B981)

### Status Badges
- **Pending:** `secondary` variant - Gray
- **Approved:** `success` variant - Green
- **Rejected:** `danger` variant - Red
- **Changes Requested:** `warning` variant - Orange

### Card Icons Background
- Pending: `bg-primary-100 dark:bg-primary-900/30`
- Overdue: `bg-red-100 dark:bg-red-900/30`
- High Priority: `bg-orange-100 dark:bg-orange-900/30`
- Completed: `bg-emerald-100 dark:bg-emerald-900/30`

---

## Responsive Behavior

### Mobile (< 640px)
- Stats cards: 1 column
- Filter buttons: Wrap to multiple rows
- Table: Horizontal scroll

### Tablet (640px - 1024px)
- Stats cards: 2 columns
- Filter buttons: May wrap
- Table: All columns visible

### Desktop (>= 1024px)
- Stats cards: 4 columns
- Filter buttons: Single row
- Table: Spacious layout

---

## Interactive Elements

### Clickable
- **Refresh button** - Reloads queue data
- **Status filter buttons** - Filter by status
- **Priority filter buttons** - Filter by priority
- **Table rows** - Navigate to patient detail page

### Hover States
- Stats cards: Shadow elevation
- Table rows: Background highlight
- Buttons: Background/border color change

### Loading States
- **Initial load:** Centered spinner with text
- **Error state:** Error component with retry button

---

## Data Flow

```
Component Mount
     │
     ├─> useEffect → loadQueue()
     │        │
     │        ├─> fetch('/api/review/queue?...')
     │        │
     │        ├─> Parse response
     │        │     - items
     │        │     - counts
     │        │
     │        └─> setState
     │              - setItems()
     │              - setStats()
     │
     ├─> useMemo → filteredItems
     │        │
     │        └─> Filter by priorityFilter
     │
     ├─> useMemo → sortedItems
     │        │
     │        └─> Sort by priority → age
     │
     └─> Render
           - Stats cards (from stats state)
           - Filter buttons (statusFilter, priorityFilter)
           - Table (sortedItems)
```

---

## State Management

```typescript
// UI State
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

// Data State
const [items, setItems] = useState<QueueItem[]>([])
const [stats, setStats] = useState<QueueStats | null>(null)

// Filter State
const [statusFilter, setStatusFilter] = useState<string>('PENDING')
const [priorityFilter, setPriorityFilter] = useState<'P0'|'P1'|'P2'|'P3'|'ALL'>('ALL')

// Derived State (useMemo)
const filteredItems = useMemo(() => ...)
const sortedItems = useMemo(() => ...)
```

---

## Example Row Data

```typescript
{
  reviewId: "550e8400-e29b-41d4-a716-446655440000",
  jobId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  assessmentId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  reviewIteration: 1,
  status: "PENDING",
  queueReasons: ["SAFETY_BLOCK"],
  isSampled: false,
  validationSummary: {
    overallStatus: "fail",
    criticalFlagsCount: 2
  },
  safetySummary: {
    recommendedAction: "BLOCK",
    safetyScore: 45
  },
  createdAt: "2026-01-08T08:15:00.000Z",
  updatedAt: "2026-01-08T08:15:00.000Z"
}
```

**Rendered as:**
```
┌──────────┬─────────────┬────────────┬────────────┬──────────────┐
│ [P0]🔴   │ SAFETY_BLOCK│ 3h 45m     │ fail       │ BLOCK        │
│          │             │ [Overdue]🔴│ 2 critical │ Score: 45/100│
└──────────┴─────────────┴────────────┴────────────┴──────────────┘
```

---

## Empty State

```
┌─────────────────────────────────────────────┐
│                                             │
│              📋 (Icon)                      │
│                                             │
│         No review items in queue            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Error State

```
┌─────────────────────────────────────────────┐
│                                             │
│              ⚠️ (Icon)                      │
│                                             │
│         Error Loading Queue                 │
│     [Error message displayed here]          │
│                                             │
│           [Retry Button]                    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Loading State

```
┌─────────────────────────────────────────────┐
│                                             │
│              ⏳ (Spinner)                    │
│                                             │
│         Loading review queue…               │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Navigation Flow

```
Clinician Dashboard
        │
        ├─> /clinician/review-queue
        │         │
        │         ├─> Click row
        │         │     │
        │         │     └─> /clinician/patient/{assessmentId}
        │         │              │
        │         │              ├─> View QAReviewPanel
        │         │              │
        │         │              └─> Make decision
        │         │                    │
        │         │                    └─> Return to queue (manually)
        │         │
        │         ├─> Filter by status
        │         │
        │         ├─> Filter by priority
        │         │
        │         └─> Refresh
        │
        └─> ...other clinician pages
```

---

**END OF VISUAL STRUCTURE**
