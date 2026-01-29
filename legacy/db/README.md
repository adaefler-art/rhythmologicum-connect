# Legacy Database Drop Kit

**Status**: E73.6 Active  
**Purpose**: Documentation and scripts for removing legacy database schemas  
**Last Updated**: 2026-01-28

---

## ⚠️ WARNING: DESTRUCTIVE OPERATIONS

The scripts in this directory will **permanently delete** database tables and data. Use with extreme caution.

**Before executing any drop scripts**:
1. ✅ Verify no production code references these tables
2. ✅ Export any data needed for compliance/audit
3. ✅ Get approval from legal/compliance team
4. ✅ Verify no active usage in logs (90+ days recommended)
5. ✅ Create full database backup
6. ✅ Test drop scripts in staging environment first

---

## Overview

This directory contains:
1. **Schema Documentation**: What tables/schemas are considered legacy
2. **Drop Scripts**: SQL scripts to safely remove legacy database objects
3. **Export Scripts**: Data export utilities for archival
4. **Rollback Procedures**: Emergency recovery if drop was premature

---

## Legacy Database Inventory

### Status: TBD

**Note**: The legacy app (`apps/rhythm-legacy`) primarily used the same database schema as the production apps. Most tables are **still active** and should **NOT** be dropped.

The ghosting of the legacy app is primarily about **code isolation**, not database removal. Database cleanup is a separate, careful process.

### Tables Shared with Production

These tables are used by BOTH legacy and production code. **DO NOT DROP**:

- `users` - User accounts
- `assessments` - Assessment data
- `assessment_answers` - Answer submissions
- `reports` - AI-generated reports
- `funnels` - Funnel definitions
- `funnel_steps` - Funnel step definitions
- `funnel_step_questions` - Questions in funnel steps
- `questions` - Question bank
- `content_pages` - CMS content
- `content_sections` - Content sections
- `notifications` - Notification queue
- `user_notifications` - User notification delivery
- And many more...

### Tables Potentially Legacy-Only

**Status**: Requires audit to confirm

These tables MAY be legacy-only (not used by production apps):

- `reassessment_rules` (if reassessment feature was deprecated)
- `kpi_thresholds` (if KPI feature was deprecated)
- `pilot_kpis` (if pilot program ended)
- `pilot_flow_events` (if pilot program ended)
- `pre_screening_calls` (if feature was deprecated)
- `shipments` (if physical shipment tracking was deprecated)
- `shipment_events` (if shipment tracking was deprecated)
- `support_cases` (if integrated support system was deprecated)
- `tasks` (if task management was deprecated)

**Action Required**: Database audit to identify truly orphaned tables.

### How to Identify Legacy-Only Tables

Run this SQL query to find tables with no recent activity:

```sql
-- Find tables with no recent updates (requires updated_at column)
-- Adjust time window as needed (e.g., 90 days)
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE 
  schemaname = 'public'
  AND (
    last_autoanalyze < NOW() - INTERVAL '90 days'
    OR last_autoanalyze IS NULL
  )
ORDER BY tablename;
```

Then cross-reference with:
1. `grep -r "table_name" apps/rhythm-studio-ui apps/rhythm-patient-ui`
2. Check API endpoints for any table references
3. Review database audit logs for recent access

---

## Drop Script Template

**File**: `drop-example-cluster.sql`

```sql
-- ============================================================================
-- Legacy Database Drop Script: [CLUSTER NAME]
-- ============================================================================
-- Created: 2026-01-28
-- Author: E73.6 Implementation
-- Status: TEMPLATE
-- 
-- Purpose:
--   Safely drop legacy tables that are no longer used by production code.
-- 
-- Tables Affected:
--   - table1
--   - table2
--   - table3
-- 
-- Pre-flight Checks:
--   [ ] Verified no production code references these tables (grep search)
--   [ ] Verified no recent activity in pg_stat_user_tables (90+ days)
--   [ ] Exported data for compliance/audit (if applicable)
--   [ ] Legal/compliance team approval obtained
--   [ ] Full database backup created
--   [ ] Tested in staging environment
-- 
-- Rollback:
--   Restore from backup created before running this script
-- ============================================================================

BEGIN;

-- Sanity check: Verify we're not in production without confirmation
DO $$
DECLARE
  env_name TEXT;
BEGIN
  -- Adjust this check based on your environment detection
  -- This is a placeholder - implement proper environment detection
  SELECT current_setting('app.environment', TRUE) INTO env_name;
  
  IF env_name = 'production' THEN
    RAISE EXCEPTION 'SAFETY: This script requires manual review before running in production. Comment out this check if intentional.';
  END IF;
END $$;

-- ============================================================================
-- Drop dependent objects first (views, foreign keys, etc.)
-- ============================================================================

-- Example: Drop views that reference the tables
-- DROP VIEW IF EXISTS view_name CASCADE;

-- Example: Drop foreign key constraints
-- ALTER TABLE other_table DROP CONSTRAINT IF EXISTS fk_to_legacy_table;

-- ============================================================================
-- Drop tables
-- ============================================================================

-- Drop tables in order (respecting dependencies)
-- DROP TABLE IF EXISTS table3 CASCADE;
-- DROP TABLE IF EXISTS table2 CASCADE;
-- DROP TABLE IF EXISTS table1 CASCADE;

-- ============================================================================
-- Drop related functions/triggers
-- ============================================================================

-- Example: Drop triggers
-- DROP TRIGGER IF EXISTS trigger_name ON table_name;

-- Example: Drop functions
-- DROP FUNCTION IF EXISTS function_name(args);

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify tables are dropped
DO $$
DECLARE
  remaining_tables TEXT[];
BEGIN
  SELECT array_agg(tablename)
  INTO remaining_tables
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('table1', 'table2', 'table3');
  
  IF remaining_tables IS NOT NULL THEN
    RAISE WARNING 'Some tables were not dropped: %', remaining_tables;
  ELSE
    RAISE NOTICE 'All target tables successfully dropped';
  END IF;
END $$;

-- Commit only if all checks pass
-- UNCOMMENT THE LINE BELOW when ready to execute
-- COMMIT;

-- Keep transaction open by default (requires manual COMMIT)
ROLLBACK;  -- Comment this out when ready to commit
```

---

## Data Export Procedures

### Before Dropping Any Table

1. **Identify Data to Preserve**:
   - Compliance requirements (e.g., GDPR data retention)
   - Audit trail needs
   - Historical analytics value

2. **Export Data**:
   ```sql
   -- Export to CSV
   COPY (SELECT * FROM legacy_table) TO '/tmp/legacy_table_export.csv' CSV HEADER;
   
   -- Or use pg_dump for structure + data
   pg_dump -h localhost -U postgres -d dbname -t legacy_table -f legacy_table_backup.sql
   ```

3. **Verify Export**:
   ```bash
   # Check row counts match
   psql -c "SELECT COUNT(*) FROM legacy_table;"
   wc -l /tmp/legacy_table_export.csv
   ```

4. **Archive Export**:
   - Store in secure long-term storage
   - Document retention period
   - Include schema documentation with export

---

## Rollback Procedures

If a drop was executed prematurely:

1. **Stop the Application** (if still running)

2. **Restore from Backup**:
   ```bash
   # Restore specific tables from pg_dump
   psql -h localhost -U postgres -d dbname -f legacy_table_backup.sql
   
   # Or restore full database from backup
   pg_restore -h localhost -U postgres -d dbname full_backup.dump
   ```

3. **Verify Restoration**:
   ```sql
   SELECT COUNT(*) FROM restored_table;
   -- Compare to original count from before drop
   ```

4. **Investigate Impact**:
   - Check application logs for errors during drop window
   - Identify any failed operations that need retry
   - Document the incident for future reference

5. **Update Documentation**:
   - Mark the table as NOT legacy
   - Document why the drop was premature
   - Update the database audit

---

## Migration vs Deletion

### When to Migrate (Export + Drop)

- Table has historical value for analytics
- Compliance requires data retention but not in production DB
- Data might be needed for future reference but not active queries

**Process**:
1. Export data to data warehouse / cold storage
2. Verify export completeness
3. Document export location and retention policy
4. Drop table from production DB
5. Keep export for retention period

### When to Delete (Drop Only)

- Table has no compliance/audit value
- Data is truly ephemeral (e.g., temporary processing state)
- Data is duplicated elsewhere in better form

**Process**:
1. Verify no compliance requirements
2. Get legal approval for deletion
3. Optional: short-term export for safety (7-30 days)
4. Drop table
5. Delete safety export after retention period

---

## Cleanup Checklist Template

Use this checklist for each legacy table cluster:

```markdown
## [Table Cluster Name] Cleanup

**Date Initiated**: YYYY-MM-DD
**Owner**: [Name]
**Status**: [Planning / In Progress / Complete / Aborted]

### Pre-flight
- [ ] Identified all tables in cluster
- [ ] Verified no production code references (grep + IDE search)
- [ ] Checked pg_stat_user_tables for recent activity
- [ ] Reviewed database audit logs
- [ ] Legal/compliance approval obtained
- [ ] Data export completed (if needed)
- [ ] Export verified and archived
- [ ] Full database backup created

### Execution
- [ ] Drop script created and reviewed
- [ ] Drop script tested in staging
- [ ] Maintenance window scheduled
- [ ] Stakeholders notified
- [ ] Drop script executed in production
- [ ] Verification queries run
- [ ] Application smoke tests passed

### Post-Execution
- [ ] Documented in changelog
- [ ] Updated database schema documentation
- [ ] Removed from monitoring/alerting
- [ ] Updated this drop kit documentation
- [ ] Safety export retained for [X days]

### Notes
[Any relevant notes, issues encountered, or lessons learned]
```

---

## Status & Tracking

**Total Legacy Tables Identified**: TBD (requires audit)  
**Tables Exported**: 0  
**Tables Dropped**: 0  
**Data Archived**: 0 GB

**Last Audit**: 2026-01-28  
**Next Review**: TBD (after initial audit complete)

---

## Related Documentation

- `legacy/README.md` - Main legacy documentation
- `legacy/code/` - Legacy application code (references to tables)
- `schema/schema.sql` - Current production schema
- `supabase/migrations/` - Migration history

---

## Changelog

- **2026-01-28**: Initial database drop kit created (E73.6)
  - Created drop script template
  - Documented export procedures
  - Created rollback procedures
  - Established cleanup checklist
  - **Action Required**: Database audit to identify truly legacy tables
