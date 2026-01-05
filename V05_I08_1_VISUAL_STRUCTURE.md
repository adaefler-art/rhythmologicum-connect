# V05-I08.1 Visual Structure

**Issue:** V05-I08.1 — Nurse Role + Views (Case Queue / Assigned Tasks)  
**Date:** 2026-01-05

---

## UI Layout: Tasks Page with Nurse Filtering

### Page Structure

```
┌─ Rhythmologicum Connect ──────────────────────────────────────────────────┐
│                                                                            │
│  [Sidebar Navigation]                                                      │
│   └─ Übersicht                                                             │
│   └─ Triage                                                                │
│   └─ Fragebögen                                                            │
│   └─ Inhalte                                                               │
│                                                                            │
│  ┌─ Main Content ────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Angemeldet als: Nurse                                             │   │
│  │                                                                     │   │
│  │  ┌─ Header ─────────────────────────────────────────────────┐     │   │
│  │  │  Aufgaben                             [+ Neue Aufgabe]   │     │   │
│  │  │  Verwalten Sie Aufgaben für Patienten                    │     │   │
│  │  └──────────────────────────────────────────────────────────┘     │   │
│  │                                                                     │   │
│  │  ┌─ Statistics Cards ──────────────────────────────────────┐     │   │
│  │  │                                                           │     │   │
│  │  │  [Gesamt: 12]  [Ausstehend: 5]  [In Bearbeitung: 3]     │     │   │
│  │  │  [Abgeschlossen: 4]                                      │     │   │
│  │  │                                                           │     │   │
│  │  └──────────────────────────────────────────────────────────┘     │   │
│  │                                                                     │   │
│  │  ┌─ Status Filter ──────────────────────────────────────────┐     │   │
│  │  │  🔍 Status:                                               │     │   │
│  │  │  [Alle] [Ausstehend] [In Bearbeitung] [Abgeschlossen]   │     │   │
│  │  └──────────────────────────────────────────────────────────┘     │   │
│  │                                                                     │   │
│  │  ┌─ Role Filter ────────────────────────────────────────────┐     │   │
│  │  │  👤 Zugewiesen an:                                        │     │   │
│  │  │  [Alle] [👤 Meine Aufgaben]     ← NURSE-SPECIFIC         │     │   │
│  │  └──────────────────────────────────────────────────────────┘     │   │
│  │                                                                     │   │
│  │  ┌─ Tasks Table ────────────────────────────────────────────┐     │   │
│  │  │                                                           │     │   │
│  │  │  Patient:in    │ Aufgabe        │ Zugewiesen  │ Status  │     │   │
│  │  │  ────────────────────────────────────────────────────────│     │   │
│  │  │  Max Muster    │ LDL-Messung    │ Nurse       │ 🟡 Aus  │     │   │
│  │  │  Anna Schmidt  │ Videoanruf     │ Nurse       │ 🔵 In   │     │   │
│  │  │  Peter Klein   │ Gerät senden   │ Nurse       │ 🟢 Ab   │     │   │
│  │  │                                                           │     │   │
│  │  └──────────────────────────────────────────────────────────┘     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## UI Variants

### 1. Nurse View

**Role Filter Shows:**
```
┌─ Role Filter ─────────────────┐
│  👤 Zugewiesen an:            │
│  [Alle] [👤 Meine Aufgaben]   │
└───────────────────────────────┘
```

**Behavior:**
- "Alle" button: Shows all tasks in organization (RLS enforced)
- "Meine Aufgaben" button: Filters to `assigned_to_role = 'nurse'`
- No other role filters shown (simplified UX)

**Use Case:**
- Nurse wants to see only their assigned tasks
- One-click filter to focus on their work
- Can still see "Alle" for context

---

### 2. Clinician View

**Role Filter Shows:**
```
┌─ Role Filter ─────────────────────────────────┐
│  👤 Zugewiesen an:                            │
│  [Alle] [Clinician] [Nurse] [Admin]          │
└───────────────────────────────────────────────┘
```

**Behavior:**
- "Alle" button: Shows all tasks
- "Clinician" button: Filters to clinician-assigned tasks
- "Nurse" button: Filters to nurse-assigned tasks
- "Admin" button: Filters to admin-assigned tasks

**Use Case:**
- Clinician wants to see tasks by role
- Can see nurse workload
- Can manage task distribution

---

### 3. Admin View

**Role Filter Shows:**
```
┌─ Role Filter ─────────────────────────────────┐
│  👤 Zugewiesen an:                            │
│  [Alle] [Clinician] [Nurse] [Admin]          │
└───────────────────────────────────────────────┘
```

**Behavior:**
- Same as clinician view
- Full oversight of all role assignments

**Use Case:**
- Admin wants to monitor all tasks
- Can filter by role for oversight
- Task distribution analysis

---

## Filter Interaction Flow

### Nurse Workflow

```
┌──────────────┐
│ Page Load    │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────────┐
│ Show All     │────▶│ Click "Meine     │
│ Tasks (RLS)  │     │ Aufgaben"        │
└──────┬───────┘     └────────┬─────────┘
       │                      │
       │                      ▼
       │             ┌──────────────────┐
       │             │ API Call:        │
       │             │ ?assigned_to_    │
       │             │  role=nurse      │
       │             └────────┬─────────┘
       │                      │
       │                      ▼
       │             ┌──────────────────┐
       │             │ Show Only        │
       │◀────────────│ Nurse Tasks      │
       │             └──────────────────┘
       │
       ▼
┌──────────────┐
│ Click "Alle" │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Show All     │
│ Tasks Again  │
└──────────────┘
```

---

## Component Breakdown

### 1. Page Header

```tsx
<div className="mb-8">
  <h1>Aufgaben</h1>
  <p>Verwalten Sie Aufgaben für Patienten</p>
  <Button onClick={...}>+ Neue Aufgabe</Button>
</div>
```

**Features:**
- Clear page title
- Action button for task creation
- Description text

---

### 2. Statistics Cards

```tsx
<div className="grid grid-cols-4 gap-6">
  <StatsCard icon={ClipboardList} title="Gesamt" value={12} />
  <StatsCard icon={Clock} title="Ausstehend" value={5} color="amber" />
  <StatsCard icon={PlayCircle} title="In Bearbeitung" value={3} color="blue" />
  <StatsCard icon={CheckCircle} title="Abgeschlossen" value={4} color="green" />
</div>
```

**Features:**
- Real-time task counts
- Color-coded by status
- Icon indicators
- Responsive grid layout

---

### 3. Status Filter Card

```tsx
<Card>
  <Filter icon /> Status:
  <ButtonGroup>
    <Button active={statusFilter === 'all'}>Alle</Button>
    <Button active={statusFilter === 'pending'}>Ausstehend</Button>
    <Button active={statusFilter === 'in_progress'}>In Bearbeitung</Button>
    <Button active={statusFilter === 'completed'}>Abgeschlossen</Button>
  </ButtonGroup>
</Card>
```

**Features:**
- Visual filter icon
- Active state highlighting
- Clear labels in German

---

### 4. Role Filter Card (NEW - V05-I08.1)

```tsx
<Card>
  <User icon /> Zugewiesen an:
  
  {/* For Nurses */}
  {currentUserRole === 'nurse' && (
    <ButtonGroup>
      <Button active={roleFilter === 'all'}>Alle</Button>
      <Button 
        active={roleFilter === 'nurse'}
        icon={<User />}
      >
        Meine Aufgaben
      </Button>
    </ButtonGroup>
  )}
  
  {/* For Clinicians/Admins */}
  {(currentUserRole === 'clinician' || currentUserRole === 'admin') && (
    <ButtonGroup>
      <Button active={roleFilter === 'all'}>Alle</Button>
      <Button active={roleFilter === 'clinician'}>Clinician</Button>
      <Button active={roleFilter === 'nurse'}>Nurse</Button>
      <Button active={roleFilter === 'admin'}>Admin</Button>
    </ButtonGroup>
  )}
</Card>
```

**Features:**
- Context-aware based on user role
- "Meine Aufgaben" for nurses
- Full role list for clinicians/admins
- User icon indicator

---

### 5. Tasks Table

```tsx
<Table
  columns={[
    { header: 'Patient:in', accessor: 'patient_name' },
    { header: 'Aufgabe', accessor: 'task_type' },
    { header: 'Zugewiesen an', accessor: 'assigned_to_role' },
    { header: 'Status', accessor: 'status' },
    { header: 'Fällig am', accessor: 'due_at' },
    { header: 'Aktionen', accessor: 'actions' },
  ]}
  data={tasks}
/>
```

**Features:**
- Sortable columns
- Status badges with color coding
- Action buttons per row
- Responsive design

---

## Filter State Management

### State Variables

```tsx
const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
```

### Filter Application

```tsx
const loadTasks = useCallback(async () => {
  const params = new URLSearchParams()
  
  // Apply status filter
  if (statusFilter !== 'all') {
    params.append('status', statusFilter)
  }
  
  // Apply role filter (NEW)
  if (roleFilter !== 'all') {
    params.append('assigned_to_role', roleFilter)
  }
  
  const response = await fetch(`/api/tasks?${params}`)
  // ...
}, [statusFilter, roleFilter])
```

---

## API Integration

### Request Example (Nurse)

```http
GET /api/tasks?assigned_to_role=nurse
Authorization: Bearer <token>
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "patient_id": "uuid-2",
      "assigned_to_role": "nurse",
      "task_type": "ldl_measurement",
      "status": "pending",
      "due_at": "2026-01-10T10:00:00Z",
      "patient_profiles": {
        "full_name": "Max Mustermann"
      }
    }
  ]
}
```

---

## Responsive Design

### Desktop (≥768px)

```
┌─────────────────────────────────────────────┐
│  [Sidebar]  │  [Main Content]               │
│             │  - Full width tables          │
│             │  - 4-column statistics        │
│             │  - Horizontal filter buttons  │
└─────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────┐
│  [Header]   │
├─────────────┤
│  [Stats]    │
│  2x2 Grid   │
├─────────────┤
│  [Filters]  │
│  Stacked    │
├─────────────┤
│  [Table]    │
│  Scrollable │
└─────────────┘
```

---

## Accessibility Features

### Keyboard Navigation

- ✅ All buttons keyboard accessible
- ✅ Tab order follows visual layout
- ✅ Enter/Space to activate filters

### Screen Reader Support

- ✅ ARIA labels for filter buttons
- ✅ Role indicators for assistive tech
- ✅ Table headers properly marked

### Visual Indicators

- ✅ Active filter highlighted
- ✅ Color + icon for status
- ✅ High contrast mode support

---

## Performance Considerations

### API Efficiency

- Filter applied server-side (not client-side)
- RLS automatically limits results
- Pagination ready (not implemented yet)

### Client-Side Optimization

- useState for minimal re-renders
- useCallback for stable function references
- useMemo for computed statistics

### Network Efficiency

- Single API call per filter change
- No redundant requests
- Results cached by React

---

## Future UI Enhancements

### Potential Improvements

1. **Saved Filters**
   - "Meine Ausstehenden Aufgaben" preset
   - User-defined filter combinations
   - Quick filter dropdown

2. **Visual Indicators**
   - Task urgency color coding
   - Overdue task highlighting
   - Patient risk level badges

3. **Bulk Actions**
   - Multi-select checkboxes
   - Batch status updates
   - Bulk assignment

4. **Mobile Optimizations**
   - Bottom sheet for filters
   - Swipe actions on task rows
   - Compact card view option

---

## Color Scheme

### Status Colors

- **Pending:** Amber (`bg-amber-100`, `text-amber-600`)
- **In Progress:** Blue (`bg-blue-100`, `text-blue-600`)
- **Completed:** Green (`bg-green-100`, `text-green-600`)
- **Cancelled:** Gray (`bg-slate-100`, `text-slate-600`)

### Theme Support

- ✅ Light mode colors defined
- ✅ Dark mode colors defined
- ✅ Smooth transitions
- ✅ Consistent across components

---

## Conclusion

The enhanced tasks page provides a clean, intuitive interface for nurses to manage their assigned tasks while maintaining full RLS compliance and type safety. The context-aware filtering ensures each user role sees the most relevant controls for their workflow.
