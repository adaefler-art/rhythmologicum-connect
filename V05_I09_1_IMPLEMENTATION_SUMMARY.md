# V05-I09.1 — Admin Navigation/Layouts Config

**Implementation Summary**  
Date: 2026-01-07  
Issue: V05-I09.1 — Admin Navigation/Layouts Config (Top/Bottom Menus + Block Layouts)

## Overview

This implementation provides a complete admin UI for configuring navigation items per user role. Administrators can enable/disable navigation items, change their order, and customize labels and icons for different user roles (patient, clinician, admin, nurse).

## Database Schema

### Tables Created

#### `navigation_items`
Defines all available navigation items in the system.

**Columns:**
- `id` (uuid, PK): Unique identifier
- `route` (text, unique): URL route path (e.g., `/clinician`, `/admin/content`)
- `default_label` (text): Default label shown in navigation
- `default_icon` (text): Icon identifier (lucide-react icon name)
- `default_order` (integer): Default display order (0-based)
- `is_system` (boolean): System items cannot be deleted, only disabled
- `description` (text): Optional description
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

**Constraints:**
- Route must match pattern: `^/[a-z0-9/_-]*$`
- Default order must be >= 0

#### `navigation_item_configs`
Role-specific overrides for navigation items.

**Columns:**
- `id` (uuid, PK): Unique identifier
- `role` (text): User role (`patient`, `clinician`, `admin`, `nurse`)
- `navigation_item_id` (uuid, FK): Reference to navigation_items
- `is_enabled` (boolean): Whether this item is shown for this role
- `custom_label` (text): Optional custom label override
- `custom_icon` (text): Optional custom icon override
- `order_index` (integer): Display order for this role (0-based)
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

**Constraints:**
- Unique constraint on (`role`, `navigation_item_id`)
- Role must be one of: `patient`, `clinician`, `admin`, `nurse`
- Order index must be >= 0

### Indexes
- `idx_navigation_items_default_order` - Optimizes default order queries
- `idx_navigation_item_configs_role` - Optimizes role-based lookups
- `idx_navigation_item_configs_role_order` - Optimizes ordered navigation retrieval

### Row Level Security (RLS)
All tables have RLS enabled with the following policies:

**navigation_items:**
- `navigation_items_select_authenticated` - All authenticated users can read
- `navigation_items_admin_modify` - Only admins and clinicians can modify

**navigation_item_configs:**
- `navigation_item_configs_select_authenticated` - All authenticated users can read
- `navigation_item_configs_admin_modify` - Only admins and clinicians can modify

### Seed Data
The migration includes seed data for all current navigation items:

**Patient navigation:**
- `/patient/funnels` - Fragebogen starten (Workflow icon)
- `/patient/history` - Mein Verlauf (History icon)

**Clinician/Admin navigation:**
- `/clinician` - Übersicht (LayoutDashboard icon)
- `/clinician/triage` - Triage (Users icon)
- `/clinician/pre-screening` - Pre-Screening (ClipboardCheck icon)
- `/clinician/shipments` - Geräteversand (Package icon)
- `/clinician/funnels` - Fragebögen (Workflow icon)
- `/admin/content` - Inhalte (FileText icon)

**Admin-only navigation:**
- `/admin/design-system` - Design System (Palette icon)

## API Endpoints

### GET `/api/admin/navigation`
Fetches all navigation items and their role-specific configurations.

**Authentication:** Required (admin or clinician role)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "route": "/clinician",
        "default_label": "Übersicht",
        "default_icon": "LayoutDashboard",
        "default_order": 0,
        "is_system": true,
        "description": "Clinician/Admin: Dashboard overview"
      }
    ],
    "configs": [
      {
        "id": "uuid",
        "role": "clinician",
        "navigation_item_id": "uuid",
        "is_enabled": true,
        "custom_label": null,
        "custom_icon": null,
        "order_index": 0
      }
    ]
  }
}
```

### PUT `/api/admin/navigation/[role]`
Updates navigation configuration for a specific role.

**Authentication:** Required (admin or clinician role)

**Parameters:**
- `role` (path): One of `patient`, `clinician`, `admin`, `nurse`

**Request Body:**
```json
{
  "configs": [
    {
      "navigation_item_id": "uuid",
      "is_enabled": true,
      "custom_label": null,
      "custom_icon": null,
      "order_index": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Navigation erfolgreich aktualisiert",
    "configs": [...]
  }
}
```

## Admin UI

### Location
`/admin/navigation`

### Features

1. **Role Selection**
   - Tab-style buttons to switch between roles
   - Shows: Patient, Clinician, Administrator, Nurse

2. **Navigation Items List**
   - Displays all configured navigation items for the selected role
   - Shows: Icon, Label, Route, System status
   - Ordered by the configured `order_index`

3. **Item Management**
   - **Enable/Disable**: Eye/EyeOff icon button toggles item visibility
   - **Reorder**: Up/Down arrow buttons to change item order
   - **Visual Feedback**: Disabled items shown with reduced opacity

4. **Available Items**
   - Separate section showing items not yet added to the current role
   - Click to add them to the navigation

5. **Save/Reset**
   - **Save Changes**: Commits all changes to the database
   - **Reset**: Discards unsaved changes and reloads from database
   - Buttons only shown when there are pending changes

### UI Components Used
- `Card` - Container for sections
- `Button` - Action buttons
- `Badge` - System item indicator
- `LoadingSpinner` - Loading state
- `ErrorState` - Error display

### Icons
Uses lucide-react icons:
- `LayoutDashboard` - Dashboard
- `Users` - Triage/Users
- `ClipboardCheck` - Pre-screening
- `Package` - Shipments
- `Workflow` - Funnels/Workflows
- `FileText` - Content
- `Palette` - Design System
- `History` - History
- `Eye`/`EyeOff` - Enable/Disable
- `Save` - Save changes
- `RotateCcw` - Reset
- `GripVertical` - Reorder handle

## Files Created/Modified

### New Files
1. `supabase/migrations/20260107055200_v05_i09_1_create_navigation_config.sql` - Database migration
2. `app/api/admin/navigation/route.ts` - GET endpoint for fetching configs
3. `app/api/admin/navigation/[role]/route.ts` - PUT endpoint for updating configs
4. `app/admin/navigation/page.tsx` - Admin UI page

### Modified Files
1. `schema/schema.sql` - Added navigation tables, indexes, constraints, policies
2. `lib/utils/roleBasedRouting.ts` - Added `/admin/navigation` to admin menu

## Technical Notes

### Type Safety
- TypeScript strict mode enabled
- API routes use proper type assertions for new database tables
- `@ts-expect-error` comments used temporarily until database types are regenerated
- Type definitions for API responses and database models

### Error Handling
- Comprehensive error handling in API routes
- Classification of database errors (SCHEMA_NOT_READY, AUTH_OR_RLS, etc.)
- Structured error responses with request IDs
- Client-side error state display

### Security
- RLS policies ensure only authenticated users with appropriate roles can access/modify
- Server-side authentication checks in all API routes
- Input validation for role parameter
- CRUD operations logged with request IDs

### Performance
- Indexed queries for efficient navigation lookups
- Single-page load fetches all necessary data
- Optimistic UI updates with server synchronization
- Minimal re-renders with proper state management

## Future Enhancements

The following features are planned but not yet implemented:

1. **Dynamic Navigation Loading**
   - Update `roleBasedRouting.ts` to fetch navigation from database
   - Implement caching for navigation configs
   - Fallback to hardcoded defaults if database unavailable

2. **Custom Label/Icon Editing**
   - Inline editing for labels
   - Icon picker for custom icons
   - Preview of navigation changes

3. **Block Layout Configuration**
   - Configure layout blocks per page
   - Top/bottom menu configurations
   - Page-specific layout overrides

4. **Import/Export**
   - Export navigation configs as JSON
   - Import navigation configs from JSON
   - Role template management

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] RLS policies correctly restrict access
- [ ] GET `/api/admin/navigation` returns all configs
- [ ] PUT `/api/admin/navigation/[role]` updates configs correctly
- [ ] Admin UI loads without errors
- [ ] Role switching updates displayed items
- [ ] Enable/disable toggles work correctly
- [ ] Reordering saves correct order_index
- [ ] Save button commits changes to database
- [ ] Reset button discards pending changes
- [ ] Unauthorized users cannot access endpoints
- [ ] Changes persist after page reload

## Migration Path

### Applying the Migration

1. **Local Development:**
   ```bash
   npx supabase migration up
   ```

2. **Production:**
   - Migration will be applied via Supabase dashboard or CI/CD pipeline
   - No data loss - only adds new tables
   - Existing navigation continues to work via hardcoded defaults

### Rollback

If needed, the migration can be rolled back by:
1. Dropping the tables: `DROP TABLE navigation_item_configs CASCADE; DROP TABLE navigation_items CASCADE;`
2. The application will continue to use hardcoded navigation from `roleBasedRouting.ts`

## Related Documentation

- [roleBasedRouting.ts](../lib/utils/roleBasedRouting.ts) - Current hardcoded navigation logic
- [DesktopLayout.tsx](../lib/ui/DesktopLayout.tsx) - Layout component that renders navigation
- [Admin Layout](../app/admin/layout.tsx) - Admin section layout

## Conclusion

This implementation provides a solid foundation for role-based navigation configuration. The database-driven approach allows for flexible, runtime configuration without code deployments. The admin UI is intuitive and follows the existing design patterns in the application.

The next phase will integrate the database navigation into the runtime navigation system, replacing the hardcoded arrays with dynamic database lookups while maintaining backward compatibility.
