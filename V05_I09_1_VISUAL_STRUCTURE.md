# V05-I09.1 Navigation Config - Visual Structure

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        navigation_items                         │
├─────────────────────────────────────────────────────────────────┤
│ • id (uuid, PK)                                                 │
│ • route (text, UNIQUE) - e.g., "/clinician"                    │
│ • default_label (text) - e.g., "Übersicht"                     │
│ • default_icon (text) - e.g., "LayoutDashboard"                │
│ • default_order (int) - e.g., 0                                │
│ • is_system (bool) - true (cannot delete)                      │
│ • description (text, nullable)                                  │
│ • created_at, updated_at                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   navigation_item_configs                       │
├─────────────────────────────────────────────────────────────────┤
│ • id (uuid, PK)                                                 │
│ • role (text) - "patient"|"clinician"|"admin"|"nurse"          │
│ • navigation_item_id (uuid, FK → navigation_items.id)          │
│ • is_enabled (bool) - true/false                               │
│ • custom_label (text, nullable) - optional override            │
│ • custom_icon (text, nullable) - optional override             │
│ • order_index (int) - display order for this role              │
│ • created_at, updated_at                                        │
│                                                                 │
│ UNIQUE(role, navigation_item_id)                               │
└─────────────────────────────────────────────────────────────────┘
```

## API Flow Diagram

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       │ GET /api/admin/navigation
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│                                                              │
│  1. Authenticate user (Supabase)                            │
│  2. Check admin/clinician role                              │
│  3. Fetch from navigation_items                             │
│  4. Fetch from navigation_item_configs                      │
│  5. Return combined data                                     │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ Response: { items: [...], configs: [...] }
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    React UI Component                        │
│                                                              │
│  • Display role tabs                                         │
│  • Show enabled items for selected role                     │
│  • Allow enable/disable toggle                              │
│  • Allow reordering (up/down)                               │
│  • Show available items to add                              │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ PUT /api/admin/navigation/{role}
       │ Body: { configs: [...] }
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    API Route Handler                         │
│                                                              │
│  1. Authenticate user                                        │
│  2. Validate role parameter                                  │
│  3. Delete existing configs for role                         │
│  4. Insert new configs                                       │
│  5. Return success response                                  │
└──────────────────────────────────────────────────────────────┘
```

## UI Component Structure

```
/admin/navigation
│
├─ Role Selector (Tabs)
│  ├─ Patient
│  ├─ Clinician
│  ├─ Administrator
│  └─ Nurse
│
├─ Action Buttons (when changes pending)
│  ├─ Save Changes
│  └─ Reset
│
├─ Navigation Items List (for selected role)
│  │
│  └─ For each enabled item:
│     ├─ Reorder Controls (up/down arrows)
│     ├─ Icon Display
│     ├─ Label & Route
│     ├─ System Badge (if is_system)
│     └─ Enable/Disable Toggle (eye icon)
│
└─ Available Items (not yet in role)
   │
   └─ For each available item:
      ├─ Icon Display
      ├─ Label & Route
      ├─ System Badge (if is_system)
      └─ Click to add to navigation
```

## Role Navigation Matrix

Current default configurations:

```
┌─────────────────────────┬─────────┬───────────┬─────────┬─────────┐
│ Navigation Item         │ Patient │ Clinician │  Admin  │  Nurse  │
├─────────────────────────┼─────────┼───────────┼─────────┼─────────┤
│ /patient/funnels        │    ✓    │           │         │         │
│ /patient/history        │    ✓    │           │         │         │
├─────────────────────────┼─────────┼───────────┼─────────┼─────────┤
│ /clinician              │         │     ✓     │    ✓    │    ✓    │
│ /clinician/triage       │         │     ✓     │    ✓    │    ✓    │
│ /clinician/pre-screening│         │     ✓     │    ✓    │         │
│ /clinician/shipments    │         │     ✓     │    ✓    │    ✓    │
│ /clinician/funnels      │         │     ✓     │    ✓    │    ✓    │
│ /admin/content          │         │     ✓     │    ✓    │         │
│ /admin/navigation       │         │           │    ✓    │         │
│ /admin/design-system    │         │           │    ✓    │         │
└─────────────────────────┴─────────┴───────────┴─────────┴─────────┘

Legend: ✓ = Enabled by default
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Component State                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  items: NavigationItem[]                                        │
│    └─ All available navigation items from DB                   │
│                                                                 │
│  configs: NavigationItemConfig[]                                │
│    └─ All role-specific configs from DB                        │
│                                                                 │
│  selectedRole: 'patient' | 'clinician' | 'admin' | 'nurse'     │
│    └─ Current role being configured                            │
│                                                                 │
│  hasChanges: boolean                                            │
│    └─ Whether user has unsaved changes                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        User Actions                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  toggleItemEnabled(itemId)                                      │
│    ├─ If exists: Toggle is_enabled                             │
│    └─ If not: Add new config (enabled=true)                    │
│                                                                 │
│  moveItem(index, direction)                                     │
│    ├─ Swap items in array                                      │
│    └─ Update order_index for affected items                    │
│                                                                 │
│  saveChanges()                                                  │
│    ├─ PUT /api/admin/navigation/{role}                         │
│    └─ Reload data from server                                  │
│                                                                 │
│  resetChanges()                                                 │
│    └─ Reload data from server (discard changes)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Icon Mapping

Currently supported icons from lucide-react:

```
┌─────────────────────┬──────────────────────────────────┐
│ Icon Name           │ Usage                            │
├─────────────────────┼──────────────────────────────────┤
│ LayoutDashboard     │ Dashboard/Overview               │
│ Users               │ Triage/User Management           │
│ ClipboardCheck      │ Pre-screening                    │
│ Package             │ Device Shipments                 │
│ Workflow            │ Funnels/Questionnaires           │
│ FileText            │ Content Management               │
│ Palette             │ Design System                    │
│ History             │ Assessment History               │
│ Eye / EyeOff        │ Enable/Disable Toggle            │
│ Save                │ Save Changes Button              │
│ RotateCcw           │ Reset Button                     │
│ GripVertical        │ Reorder Handle                   │
└─────────────────────┴──────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     Row Level Security                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  navigation_items                                               │
│    SELECT: All authenticated users                             │
│    INSERT/UPDATE/DELETE: Admins & Clinicians only              │
│                                                                 │
│  navigation_item_configs                                        │
│    SELECT: All authenticated users                             │
│    INSERT/UPDATE/DELETE: Admins & Clinicians only              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     API Authorization                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /api/admin/navigation                                      │
│    ✓ Must be authenticated                                      │
│    ✓ Must have admin OR clinician role                         │
│                                                                 │
│  PUT /api/admin/navigation/[role]                              │
│    ✓ Must be authenticated                                      │
│    ✓ Must have admin OR clinician role                         │
│    ✓ Role parameter must be valid                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## File Organization

```
rhythmologicum-connect/
│
├── app/
│   ├── admin/
│   │   └── navigation/
│   │       └── page.tsx ...................... Admin UI component
│   │
│   └── api/
│       └── admin/
│           └── navigation/
│               ├── route.ts ................. GET endpoint
│               └── [role]/
│                   └── route.ts .............. PUT endpoint
│
├── lib/
│   └── utils/
│       └── roleBasedRouting.ts .............. Navigation definitions
│                                              (hardcoded, to be replaced)
│
├── schema/
│   └── schema.sql ........................... Updated with new tables
│
├── supabase/
│   └── migrations/
│       └── 20260107055200_v05_i09_1_create_navigation_config.sql
│
└── V05_I09_1_IMPLEMENTATION_SUMMARY.md ...... This documentation
```

## Usage Example

### 1. Admin wants to add "Pre-Screening" to Nurse role:

```
User Action:
  1. Navigate to /admin/navigation
  2. Select "Nurse" role tab
  3. Click on "/clinician/pre-screening" in "Available Items"
  4. Item moves to active navigation list
  5. Click "Save Changes"

Backend:
  DELETE FROM navigation_item_configs WHERE role = 'nurse';
  INSERT INTO navigation_item_configs (role, navigation_item_id, ...)
    VALUES ('nurse', '{pre-screening-id}', ...);
```

### 2. Admin wants to disable "Design System" for admin role:

```
User Action:
  1. Navigate to /admin/navigation
  2. Select "Administrator" role tab
  3. Click eye icon next to "/admin/design-system"
  4. Item becomes grayed out
  5. Click "Save Changes"

Backend:
  UPDATE navigation_item_configs
  SET is_enabled = false
  WHERE role = 'admin' AND navigation_item_id = '{design-system-id}';
```

### 3. Admin wants to reorder clinician navigation:

```
User Action:
  1. Navigate to /admin/navigation
  2. Select "Clinician" role tab
  3. Use up/down arrows to reorder items
  4. New order: Dashboard → Funnels → Triage → ...
  5. Click "Save Changes"

Backend:
  DELETE FROM navigation_item_configs WHERE role = 'clinician';
  INSERT INTO navigation_item_configs (role, navigation_item_id, order_index, ...)
    VALUES
      ('clinician', '{dashboard-id}', 0, ...),
      ('clinician', '{funnels-id}', 1, ...),
      ('clinician', '{triage-id}', 2, ...),
      ...
```

## Next Steps

To complete the dynamic navigation system:

1. **Update `roleBasedRouting.ts`:**
   ```typescript
   export async function getNavItemsForRole(user: User, pathname: string) {
     const role = getUserRole(user)
     
     // Try to fetch from database
     const dbNavItems = await fetchNavigationFromDB(role)
     
     // Fallback to hardcoded if DB unavailable
     return dbNavItems || getHardcodedNavItems(role, pathname)
   }
   ```

2. **Add caching layer:**
   ```typescript
   const navCache = new Map<string, NavItem[]>()
   const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
   ```

3. **Implement hot-reload:**
   - WebSocket or polling to detect navigation changes
   - Update cache when admin saves changes
   - Refresh active user sessions
