# Navigation Management - Source of Truth Documentation

**Version:** V05-I09.1  
**Last Updated:** 2026-02-06  
**Status:** Active

## Overview

The Navigation Management feature allows administrators and clinicians to configure role-based navigation menus for the Rhythmologicum Connect application.

## Source of Truth

### Storage Location
**Stored in:** Supabase PostgreSQL Database

The navigation configuration is **NOT** stored in static JSON files or configuration files. All navigation data is persisted in the database.

### Database Tables

#### 1. `navigation_items`
Defines the available navigation menu items in the application.

**Schema:**
- `id` (uuid, PK): Unique identifier for the navigation item
- `route` (text, unique): URL route path (e.g., `/clinician`, `/admin/content`)
- `default_label` (text): Default label shown in navigation
- `default_icon` (text, nullable): Icon identifier (lucide-react icon name)
- `default_order` (integer): Default display order (0-based)
- `is_system` (boolean): System items cannot be deleted, only disabled
- `description` (text, nullable): Optional description of the navigation item
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

**Constraints:**
- `route` must match pattern: `^/[a-z0-9/_-]*$`
- `default_order` must be >= 0
- Unique constraint on `route`

#### 2. `navigation_item_configs`
Role-specific configuration overrides for navigation items.

**Schema:**
- `id` (uuid, PK): Unique identifier for the config
- `role` (text): User role this config applies to (`patient`, `clinician`, `admin`, `nurse`)
- `navigation_item_id` (uuid, FK): References `navigation_items.id`
- `is_enabled` (boolean): Whether this item is shown for this role
- `custom_label` (text, nullable): Optional custom label override
- `custom_icon` (text, nullable): Optional custom icon override
- `order_index` (integer): Display order for this role (0-based)
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

**Constraints:**
- `order_index` must be >= 0
- `role` must be one of: `patient`, `clinician`, `admin`, `nurse`
- Unique constraint on (`role`, `navigation_item_id`)

**Foreign Keys:**
- `navigation_item_id` → `navigation_items(id)` ON DELETE CASCADE

## API Endpoints

### GET /api/admin/navigation
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
        "default_label": "Dashboard",
        "default_icon": "LayoutDashboard",
        "default_order": 0,
        "is_system": true,
        "description": "Main dashboard view"
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

### PUT /api/admin/navigation/[role]
Updates the navigation configuration for a specific role.

**Authentication:** Required (admin or clinician role)

**Path Parameters:**
- `role`: One of `patient`, `clinician`, `admin`, `nurse`

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

**Behavior:**
1. Deletes all existing configs for the specified role
2. Inserts the new configs provided in the request
3. Returns the newly inserted configs

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

## Implementation Files

### Frontend
- **Page:** `apps/rhythm-studio-ui/app/admin/navigation/page.tsx`
  - Client-side React component
  - Provides UI for viewing, reordering, and toggling navigation items
  - Uses drag-and-drop for reordering
  - Role selector to switch between different role configurations

### Backend API Routes
- **GET:** `apps/rhythm-studio-ui/app/api/admin/navigation/route.ts`
- **PUT:** `apps/rhythm-studio-ui/app/api/admin/navigation/[role]/route.ts`

### Database Schema
- **Schema:** `schema/schema.sql`
  - Contains the CREATE TABLE statements
  - Includes constraints, indexes, and comments
- **Migrations:** `supabase/migrations/` (timestamped SQL files)

## Features

### Implemented
✅ View all navigation items  
✅ View role-specific configurations  
✅ Toggle navigation items on/off per role  
✅ Reorder navigation items (drag-and-drop UI)  
✅ Persist changes to database  
✅ Role-based access control (admin/clinician only)  

### UI Features
- **Role Selector:** Switch between patient, clinician, admin, and nurse views
- **Enable/Disable Toggle:** Eye icon to show/hide items for a role
- **Drag Handle:** Move items up/down to reorder
- **System Badge:** Indicates system-level items that cannot be deleted
- **Available Items:** Shows items not yet added to the current role's navigation
- **Unsaved Changes Indicator:** Shows save/reset buttons when changes are pending

## Data Flow

1. **Page Load:**
   - GET `/api/admin/navigation`
   - Fetches all items and configs
   - Stores in React state

2. **User Makes Changes:**
   - Toggle enabled/disabled
   - Reorder items
   - Changes tracked in local state
   - `hasChanges` flag set to true

3. **Save Changes:**
   - PUT `/api/admin/navigation/{role}`
   - Sends updated configs for selected role
   - Database transaction:
     - DELETE existing configs for role
     - INSERT new configs
   - Reload configuration from server

## Known Issues & Fixes

### Issue: PUT /api/admin/navigation/[role] Returns 405 Method Not Allowed

**Root Cause:**  
When `ENGINE_BASE_URL` environment variable is set, the Next.js rewrite configuration in `next.config.ts` catches `/api/:path*` and proxies it to the engine service. The navigation routes are not explicitly preserved like other admin routes (funnels, funnel-versions, funnel-steps).

**Fix:**  
Add explicit rewrites for navigation routes in `next.config.ts` before the catch-all `/api/:path*` rule:

```typescript
{
  source: '/api/admin/navigation/:path*',
  destination: '/api/admin/navigation/:path*',
},
{
  source: '/api/admin/navigation',
  destination: '/api/admin/navigation',
},
```

**Status:** Fixed in this PR

## Security Considerations

- **Authentication:** All endpoints require valid Supabase session
- **Authorization:** Requires `admin` or `clinician` role
- **RLS Policies:** Database tables should have Row Level Security enabled
- **Input Validation:** 
  - Role parameter validated against allowed values
  - Navigation item IDs validated as UUIDs
  - Order index validated as non-negative integers

## Testing

### Manual Testing Steps
1. Log in as admin or clinician
2. Navigate to `/admin/navigation`
3. Select a role (e.g., "Clinician")
4. Toggle items on/off
5. Reorder items using drag handles
6. Click "Änderungen speichern" (Save Changes)
7. Verify changes persist after page reload
8. Switch to different role and verify independent configs

### API Testing
```bash
# Get navigation config
curl -X GET http://localhost:3000/api/admin/navigation \
  -H "Cookie: <session-cookie>"

# Update navigation for clinician role
curl -X PUT http://localhost:3000/api/admin/navigation/clinician \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "configs": [
      {
        "navigation_item_id": "uuid-here",
        "is_enabled": true,
        "custom_label": null,
        "custom_icon": null,
        "order_index": 0
      }
    ]
  }'
```

## Troubleshooting

### Changes Not Persisting
- Check browser console for API errors
- Verify authentication cookie is valid
- Check database connection and RLS policies

### 405 Method Not Allowed
- Verify Next.js rewrites in `next.config.ts`
- Check that route file exports `PUT` function
- Ensure `ENGINE_BASE_URL` rewrites preserve navigation routes

### Items Not Showing
- Check `is_enabled` flag in `navigation_item_configs`
- Verify role matches current user role
- Check order_index values for proper ordering

## Future Enhancements

- [ ] Add custom label editing UI
- [ ] Add custom icon selection UI
- [ ] Add bulk import/export functionality
- [ ] Add version history/rollback
- [ ] Add preview mode to see navigation as different roles
- [ ] Add validation warnings for misconfigured routes
