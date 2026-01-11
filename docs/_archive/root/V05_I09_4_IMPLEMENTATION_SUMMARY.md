# V05-I09.4 Implementation Summary

**Issue:** V05-I09.4 — Operational Settings (Notification Templates, Re-assessment Rules, KPI Thresholds)  
**Date:** 2026-01-07  
**Status:** ✅ Complete

## Overview

Implemented a comprehensive operational settings management system that allows administrators and clinicians to configure:

1. **Notification Templates** - Reusable templates for system notifications
2. **Re-assessment Rules** - Automated scheduling rules for patient follow-ups
3. **KPI Thresholds** - Key Performance Indicator thresholds for monitoring and alerting

All settings are database-driven, fully auditable, and manageable through a dedicated admin UI.

## Acceptance Criteria

✅ **Basic Templates + Scheduling-Regeln**
- Notification templates for different communication channels (in-app, email, SMS)
- Re-assessment scheduling rules with flexible interval or cron-based scheduling
- KPI thresholds with warning, critical, and target levels

✅ **Gespeichert &amp; auditierbar**
- All changes automatically logged to audit table
- Complete audit trail with old/new values
- Audit logs viewable in admin UI

## Database Schema

### Tables Created

#### 1. `notification_templates`
Stores reusable notification templates with variable substitution support.

**Columns:**
- `id` (uuid, PK)
- `template_key` (text, unique) - Template identifier
- `name` (text) - Display name
- `description` (text) - Optional description
- `channel` (text) - Delivery channel: in_app, email, sms
- `subject_template` (text) - Subject line template
- `body_template` (text) - Message body template
- `variables` (jsonb) - Array of variable names used in template
- `is_active` (boolean) - Active status
- `is_system` (boolean) - System templates cannot be deleted
- `created_at`, `updated_at` (timestamptz)
- `created_by`, `updated_by` (uuid → auth.users)

**Seed Data:**
- `report_ready` - Notification when assessment report is ready
- `followup_reminder` - Reminder for scheduled follow-up
- `high_risk_alert` - Alert for high stress levels

#### 2. `reassessment_rules`
Defines automated re-assessment scheduling based on conditions.

**Columns:**
- `id` (uuid, PK)
- `rule_name` (text, unique) - Rule identifier
- `description` (text) - Optional description
- `funnel_id` (uuid → funnels_catalog) - Associated funnel (optional)
- `trigger_condition` (jsonb) - Conditions that trigger the rule
- `schedule_interval_days` (integer) - Simple day interval
- `schedule_cron` (text) - Complex cron schedule
- `priority` (text) - low, medium, high, urgent
- `is_active` (boolean) - Active status
- `created_at`, `updated_at` (timestamptz)
- `created_by`, `updated_by` (uuid → auth.users)

**Constraints:**
- Exactly one of `schedule_interval_days` OR `schedule_cron` must be set

**Seed Data:**
- High risk weekly follow-up (7 days)
- Medium risk bi-weekly follow-up (14 days)
- Low risk monthly follow-up (30 days)
- Post-assessment 30-day check

#### 3. `kpi_thresholds`
Configures thresholds for monitoring key performance indicators.

**Columns:**
- `id` (uuid, PK)
- `kpi_key` (text, unique) - KPI identifier
- `name` (text) - Display name
- `description` (text) - Optional description
- `metric_type` (text) - percentage, count, duration, score
- `warning_threshold` (numeric) - Warning level
- `critical_threshold` (numeric) - Critical level
- `target_threshold` (numeric) - Target/desired level
- `unit` (text) - Unit of measurement
- `evaluation_period_days` (integer) - Evaluation window (NULL = real-time)
- `is_active` (boolean) - Active status
- `notify_on_breach` (boolean) - Send notifications on threshold breach
- `created_at`, `updated_at` (timestamptz)
- `created_by`, `updated_by` (uuid → auth.users)

**Seed Data:**
- Assessment completion rate (target: 85%, warning: 70%, critical: 50%)
- Average response time (target: 24h, warning: 48h, critical: 72h)
- High-risk patient count (target: 5, warning: 10, critical: 20)
- Report generation success rate (target: 99%, warning: 95%, critical: 90%)
- Average stress score (target: 50, warning: 65, critical: 75)

#### 4. `operational_settings_audit`
Unified audit trail for all operational settings changes.

**Columns:**
- `id` (uuid, PK)
- `table_name` (text) - Name of modified table
- `record_id` (uuid) - ID of modified record
- `operation` (text) - INSERT, UPDATE, DELETE
- `old_values` (jsonb) - Snapshot before change
- `new_values` (jsonb) - Snapshot after change
- `changed_by` (uuid → auth.users) - User who made change
- `changed_at` (timestamptz) - Timestamp of change
- `change_reason` (text) - Optional reason for change

**Indexes:**
- `idx_operational_audit_table` - Fast filtering by table
- `idx_operational_audit_record` - Fast lookup by record ID
- `idx_operational_audit_changed_by` - Filter by user
- `idx_operational_audit_changed_at` - Chronological ordering

### Automatic Audit Logging

Database triggers automatically log all INSERT, UPDATE, and DELETE operations:

- `audit_notification_templates_trigger`
- `audit_reassessment_rules_trigger`
- `audit_kpi_thresholds_trigger`

Each trigger captures old and new values as JSONB for complete change tracking.

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

**Read Access:**
- All authenticated users can SELECT from all tables

**Write Access:**
- Only users with `admin` or `clinician` role can INSERT, UPDATE, DELETE

**Audit Logs:**
- Only `admin` or `clinician` roles can SELECT audit logs

## API Endpoints

### Notification Templates

**GET `/api/admin/notification-templates`**
- Fetches all notification templates
- Query params: `?active_only=true`
- Returns: `{ success: true, data: { templates: [...] } }`

**POST `/api/admin/notification-templates`**
- Creates a new notification template
- Body: `{ template_key, name, channel, body_template, ... }`
- Returns: `{ success: true, data: { template: {...} } }`

**PUT `/api/admin/notification-templates/[id]`**
- Updates existing template
- Body: Partial template object
- Returns: `{ success: true, data: { template: {...} } }`

**DELETE `/api/admin/notification-templates/[id]`**
- Deletes template (non-system only)
- Returns: `{ success: true, data: { message: "..." } }`

### Re-assessment Rules

**GET `/api/admin/reassessment-rules`**
- Fetches all reassessment rules
- Query params: `?active_only=true`
- Returns: `{ success: true, data: { rules: [...] } }`

**POST `/api/admin/reassessment-rules`**
- Creates a new rule
- Body: `{ rule_name, trigger_condition, schedule_interval_days OR schedule_cron, ... }`
- Returns: `{ success: true, data: { rule: {...} } }`

**PUT `/api/admin/reassessment-rules/[id]`**
- Updates existing rule
- Body: Partial rule object
- Returns: `{ success: true, data: { rule: {...} } }`

**DELETE `/api/admin/reassessment-rules/[id]`**
- Deletes rule
- Returns: `{ success: true, data: { message: "..." } }`

### KPI Thresholds

**GET `/api/admin/kpi-thresholds`**
- Fetches all KPI thresholds
- Query params: `?active_only=true`
- Returns: `{ success: true, data: { thresholds: [...] } }`

**POST `/api/admin/kpi-thresholds`**
- Creates a new threshold
- Body: `{ kpi_key, name, metric_type, warning_threshold, ... }`
- Returns: `{ success: true, data: { threshold: {...} } }`

**PUT `/api/admin/kpi-thresholds/[id]`**
- Updates existing threshold
- Body: Partial threshold object
- Returns: `{ success: true, data: { threshold: {...} } }`

**DELETE `/api/admin/kpi-thresholds/[id]`**
- Deletes threshold
- Returns: `{ success: true, data: { message: "..." } }`

### Audit Logs

**GET `/api/admin/operational-settings-audit`**
- Fetches audit trail
- Query params:
  - `?table_name=notification_templates` - Filter by table
  - `?record_id=<uuid>` - Filter by specific record
  - `?limit=50` - Limit results (default: 50, max: 200)
  - `?offset=0` - Pagination offset
- Returns: `{ success: true, data: { auditLogs: [...], total: 123, hasMore: true } }`

### Security

All endpoints:
- ✅ Require authentication (verified via `getCurrentUser()`)
- ✅ Require admin or clinician role (verified via `hasClinicianRole()`)
- ✅ Validate input parameters
- ✅ Return structured error responses
- ✅ Log unauthorized access attempts

## Admin UI

### Location
`/admin/operational-settings`

### Features

**Tab-Based Navigation:**
1. **Benachrichtigungen** (Notifications) - Notification templates
2. **Nachuntersuchungen** (Re-assessments) - Re-assessment rules
3. **KPI-Schwellenwerte** (KPI Thresholds) - Performance thresholds
4. **Änderungsprotokoll** (Change Log) - Audit trail

**Notification Templates Tab:**
- List all templates with key, name, channel, description
- Badge indicators: Active/Inactive, System, Channel
- Toggle active/inactive with eye icon button
- Display template variables
- System templates cannot be deleted (only deactivated)

**Re-assessment Rules Tab:**
- List all rules with name, description, schedule
- Badge indicators: Active/Inactive, Priority level
- Toggle active/inactive with eye icon button
- Display schedule interval or cron expression

**KPI Thresholds Tab:**
- List all thresholds with name, metric type, description
- Badge indicators: Active/Inactive, Metric type
- Display warning, critical, and target thresholds with color coding:
  - Warning: Yellow
  - Critical: Red
  - Target: Green
- Toggle active/inactive with eye icon button

**Audit Log Tab:**
- Chronological list of all changes
- Badge indicators: Operation type (INSERT/UPDATE/DELETE)
- Display table name, timestamp, and change reason
- Color coding:
  - INSERT: Green
  - UPDATE: Blue/Neutral
  - DELETE: Red

**UI Components Used:**
- `Card` - Container for sections
- `Button` - Action buttons
- `Badge` - Status and type indicators
- `LoadingSpinner` - Loading states
- `ErrorState` - Error display with retry
- Lucide React icons: `Bell`, `Clock`, `Target`, `Edit2`, `Eye`, `EyeOff`

### State Management

React hooks for:
- Tab switching
- Data loading per tab
- Toggle operations with optimistic updates
- Error handling and display
- Loading states

## Files Created

### Migration
1. `supabase/migrations/20260107110000_v05_i09_4_create_operational_settings.sql`

### API Routes
2. `app/api/admin/notification-templates/route.ts` - GET, POST
3. `app/api/admin/notification-templates/[id]/route.ts` - PUT, DELETE
4. `app/api/admin/reassessment-rules/route.ts` - GET, POST
5. `app/api/admin/reassessment-rules/[id]/route.ts` - PUT, DELETE
6. `app/api/admin/kpi-thresholds/route.ts` - GET, POST
7. `app/api/admin/kpi-thresholds/[id]/route.ts` - PUT, DELETE
8. `app/api/admin/operational-settings-audit/route.ts` - GET

### UI
9. `app/admin/operational-settings/page.tsx` - Admin UI page

## Technical Notes

### Type Safety
- TypeScript strict mode enabled
- Proper type definitions for all interfaces
- Temporary `as any` casts for new database tables (until `npm run db:typegen` is run)
- Type-safe API responses

### Error Handling
- Comprehensive validation in all API routes
- Structured error responses with codes and messages
- Client-side error display with retry capability
- Graceful degradation for network errors

### Performance
- Indexed queries for fast lookups
- Pagination support in audit logs
- Optimized RLS policies
- Minimal database round-trips

### Audit Trail
- Fully automatic via database triggers
- Complete change history with before/after snapshots
- User attribution for all changes
- Timestamp precision to millisecond

## Testing

### Manual Testing Checklist

- [ ] **Database Migration**
  - [ ] Run migration: `supabase db reset` or CI/CD deployment
  - [ ] Verify all 4 tables exist
  - [ ] Verify seed data loaded correctly
  - [ ] Verify RLS policies active

- [ ] **Notification Templates**
  - [ ] GET - List all templates
  - [ ] POST - Create new template
  - [ ] PUT - Update template (name, body, active status)
  - [ ] DELETE - Delete custom template
  - [ ] DELETE - Verify system template cannot be deleted
  - [ ] Verify audit log created for each operation

- [ ] **Re-assessment Rules**
  - [ ] GET - List all rules
  - [ ] POST - Create new rule
  - [ ] PUT - Update rule (schedule, priority, active status)
  - [ ] DELETE - Delete rule
  - [ ] Verify audit log created for each operation

- [ ] **KPI Thresholds**
  - [ ] GET - List all thresholds
  - [ ] POST - Create new threshold
  - [ ] PUT - Update threshold (thresholds, active status)
  - [ ] DELETE - Delete threshold
  - [ ] Verify audit log created for each operation

- [ ] **Admin UI**
  - [ ] Navigate to `/admin/operational-settings`
  - [ ] Switch between all 4 tabs
  - [ ] Toggle template active/inactive
  - [ ] Toggle rule active/inactive
  - [ ] Toggle threshold active/inactive
  - [ ] View audit logs
  - [ ] Filter audit logs by table
  - [ ] Verify visual indicators (badges, colors)

- [ ] **Security**
  - [ ] Verify unauthenticated access blocked (401)
  - [ ] Verify patient role access blocked (403)
  - [ ] Verify clinician role can access and modify
  - [ ] Verify admin role can access and modify

## Future Enhancements

1. **Full CRUD UI**
   - Add/Edit forms for creating and modifying settings
   - Inline editing for quick changes
   - Bulk operations (activate/deactivate multiple items)

2. **Template Editor**
   - Visual template editor with variable picker
   - Template preview with sample data
   - Template testing/sending capability

3. **Rule Builder**
   - Visual condition builder for trigger conditions
   - Schedule preview/calculator
   - Rule simulation/testing

4. **Threshold Monitoring**
   - Real-time KPI value display
   - Threshold breach notifications
   - Historical trend charts
   - Dashboard integration

5. **Import/Export**
   - Export settings as JSON
   - Import settings from JSON
   - Template marketplace/sharing

6. **Enhanced Audit**
   - Detailed diff view for changes
   - Rollback to previous version
   - Export audit logs
   - Advanced filtering and search

## Migration Path

### Applying the Migration

**Local Development:**
```bash
supabase db reset
npm run db:typegen
```

**Production:**
- Migration will be applied via CI/CD pipeline
- No data loss - only adds new tables
- Existing functionality continues to work

### Rollback

If needed, drop the tables:
```sql
DROP TABLE operational_settings_audit CASCADE;
DROP TABLE kpi_thresholds CASCADE;
DROP TABLE reassessment_rules CASCADE;
DROP TABLE notification_templates CASCADE;
```

## Related Documentation

- [Notification System (V05-I05.9)](../supabase/migrations/20260104134110_v05_i05_9_create_delivery_system.sql)
- [Admin Navigation (V05-I09.1)](./V05_I09_1_IMPLEMENTATION_SUMMARY.md)
- [Design Tokens (V05-I09.2)](./V05_I09_2_IMPLEMENTATION_SUMMARY.md)

## Conclusion

The operational settings system is fully implemented and ready for use. Administrators can now:

- ✅ Configure notification templates for different channels
- ✅ Set up automated re-assessment scheduling rules
- ✅ Define KPI thresholds for monitoring
- ✅ View complete audit trail of all changes

All acceptance criteria have been met:
- ✅ Basic templates + scheduling rules implemented
- ✅ All settings stored in database and fully auditable

The system provides a solid foundation for operational configuration and monitoring, with room for future enhancements like visual editors and advanced analytics.

---

**Author:** GitHub Copilot  
**Reviewed:** Pending  
**Status:** Ready for review and testing
