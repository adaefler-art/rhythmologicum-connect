# V0.5 Schema Migration - Evidence Document

**Migration File:** `supabase/migrations/20251230211228_v05_core_schema_jsonb_fields.sql`  
**Date:** 2025-12-30  
**Issue:** V05-I01.1

---

## Executive Summary

Successfully implemented the v0.5 core database schema migration with comprehensive JSONB fields, multi-tenant support, funnel versioning, document extraction, processing results, reports/sections, tasks/notifications, and audit logging.

**Totals:**

- **13 new tables** created
- **9 columns** added to existing tables
- **6 new enum types** defined
- **17 JSONB fields** for flexible data storage
- **34 indexes** for query optimization
- **6 unique constraints** for idempotency
- **RLS enabled** on all 13 new tables
- **~50 RLS policies** for comprehensive access control

---

## Migration Structure

### 1. Enums & Types (6 total)

All enums created with idempotent `DO $$ IF NOT EXISTS` pattern:

```sql
-- ✓ user_role
CREATE TYPE public.user_role AS ENUM ('patient', 'clinician', 'nurse', 'admin');

-- ✓ assessment_state
CREATE TYPE public.assessment_state AS ENUM ('draft', 'in_progress', 'completed', 'archived');

-- ✓ report_status
CREATE TYPE public.report_status AS ENUM ('pending', 'generating', 'completed', 'failed');

-- ✓ task_status
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- ✓ parsing_status
CREATE TYPE public.parsing_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'partial');

-- ✓ notification_status
CREATE TYPE public.notification_status AS ENUM ('scheduled', 'sent', 'failed', 'cancelled');
```

**Note:** `nurse` role included as required by specification.

---

### 2. Identity & Access (3 tables)

#### organizations

**Purpose:** Multi-tenant foundation  
**Key Columns:**

- `id` (UUID primary key)
- `slug` (TEXT unique)
- `settings` (JSONB) - Org-specific configuration
- `is_active` (BOOLEAN)

**Indexes:**

- `idx_organizations_slug`
- `idx_organizations_is_active`

**RLS:** Active orgs visible to authenticated users; admins can manage.

---

#### user_profiles

**Purpose:** Extended user profile information  
**Key Columns:**

- `id` (UUID primary key)
- `user_id` (UUID unique → auth.users)
- `organization_id` (UUID → organizations)
- `metadata` (JSONB) - Extended user data

**Indexes:**

- `idx_user_profiles_user_id`
- `idx_user_profiles_organization_id`

**RLS:** Users view/update own profile; clinicians view all.

---

#### user_org_membership

**Purpose:** User-organization associations with roles  
**Key Columns:**

- `user_id` (UUID → auth.users)
- `organization_id` (UUID → organizations)
- `role` (user_role enum)
- `is_active` (BOOLEAN)

**Unique Constraint:**

- `(user_id, organization_id)` - One membership per user per org

**Indexes:**

- `idx_user_org_membership_user_id`
- `idx_user_org_membership_organization_id`
- `idx_user_org_membership_role`

---

### 3. Funnels / Versions / Sessions (3 tables)

#### funnels_catalog

**Purpose:** Master catalog of available funnels  
**Key Columns:**

- `id` (UUID primary key)
- `slug` (TEXT unique)
- `pillar_id` (TEXT) - Health pillar reference
- `is_active` (BOOLEAN)

**Indexes:**

- `idx_funnels_catalog_slug`
- `idx_funnels_catalog_is_active`

**RLS:** Active funnels visible to authenticated users.

---

#### funnel_versions

**Purpose:** Versioned funnel configurations with JSONB  
**Key Columns:**

- `funnel_id` (UUID → funnels_catalog)
- `version` (TEXT)
- `questionnaire_config` (JSONB) - Questions, steps, validation
- `content_manifest` (JSONB) - Content pages, media, flow
- `algorithm_bundle_version` (TEXT)
- `prompt_version` (TEXT)
- `is_default` (BOOLEAN)
- `rollout_percent` (INTEGER 0-100) - A/B testing support

**Unique Constraint:**

- `(funnel_id, version)` - Ensures version uniqueness per funnel

**Indexes:**

- `idx_funnel_versions_funnel_id`
- `idx_funnel_versions_is_default`

**RLS:** Authenticated users can view versions.

---

#### patient_funnels

**Purpose:** Patient-specific funnel instances  
**Key Columns:**

- `patient_id` (UUID → patient_profiles)
- `funnel_id` (UUID → funnels_catalog)
- `active_version_id` (UUID → funnel_versions)
- `status` (TEXT CHECK: active/paused/completed/archived)

**Indexes:**

- `idx_patient_funnels_patient_id`
- `idx_patient_funnels_funnel_id`
- `idx_patient_funnels_status`

**RLS:** Patients view own; clinicians view all.

---

### 4. Assessments Extended (1 table + 2 columns)

#### assessment_events

**Purpose:** Event log for assessment lifecycle  
**Key Columns:**

- `assessment_id` (UUID → assessments)
- `event_type` (TEXT) - started, step_completed, paused, resumed, completed
- `payload` (JSONB) - Event-specific data

**Indexes:**

- `idx_assessment_events_assessment_id`
- `idx_assessment_events_created_at`
- `idx_assessment_events_event_type`

**RLS:** Patients view own events; clinicians view all; service can insert.

---

#### assessments (extended)

**Added Columns:**

- `state` (assessment_state enum) - Replaces simple status tracking
- `current_step_id` (UUID → funnel_steps) - If not already present

---

### 5. Documents / Extraction (1 table)

#### documents

**Purpose:** Document storage with AI extraction results  
**Key Columns:**

- `assessment_id` (UUID → assessments)
- `storage_path` (TEXT) - File location in storage
- `doc_type` (TEXT) - lab_report, prescription, etc.
- `parsing_status` (parsing_status enum)
- `extracted_data` (JSONB) - AI-extracted structured data
- `confidence` (JSONB) - Confidence scores per field
- `confirmed_data` (JSONB) - User-verified/corrected data
- `confirmed_at` (TIMESTAMPTZ)

**Indexes:**

- `idx_documents_assessment_id`
- `idx_documents_parsing_status`

**RLS:** Patients view own; clinicians view all; service manages.

---

### 6. Calculated Results (1 table)

#### calculated_results

**Purpose:** Algorithm-calculated results with JSONB  
**Key Columns:**

- `assessment_id` (UUID → assessments)
- `algorithm_version` (TEXT)
- `scores` (JSONB) - Calculated scores (stress, resilience, etc.)
- `risk_models` (JSONB) - Risk assessment outputs
- `priority_ranking` (JSONB) - Priority/urgency calculations

**Unique Constraint:**

- `(assessment_id, algorithm_version)` - One result per assessment+version

**Indexes:**

- `idx_calculated_results_assessment_id`
- `idx_calculated_results_created_at`

**RLS:** Patients view own; clinicians view all; service can insert.

---

### 7. Reports / Sections (2 tables + 8 columns)

#### reports (extended)

**Added Columns:**

- `report_version` (TEXT) - Version of report format
- `prompt_version` (TEXT) - AI prompt version
- `status` (report_status enum)
- `safety_score` (INTEGER 0-100)
- `safety_findings` (JSONB) - Safety analysis results
- `html_path` (TEXT)
- `pdf_path` (TEXT)
- `citations_meta` (JSONB) - Citation metadata

**Unique Constraint:**

- `(assessment_id, report_version)` - Idempotent report generation

---

#### report_sections

**Purpose:** Sectioned reports for modular content  
**Key Columns:**

- `report_id` (UUID → reports)
- `section_key` (TEXT) - summary, risk_analysis, recommendations
- `prompt_version` (TEXT)
- `content` (TEXT)
- `citations_meta` (JSONB) - Section-specific citations

**Unique Constraint:**

- `(report_id, section_key)` - One section per report+key

**Indexes:**

- `idx_report_sections_report_id`
- `idx_report_sections_section_key`

**RLS:** Patients view own sections; clinicians view all; service manages.

---

### 8. Tasks / Notifications (2 tables)

#### tasks

**Purpose:** Task management with role-based assignment  
**Key Columns:**

- `patient_id` (UUID → patient_profiles)
- `assessment_id` (UUID → assessments)
- `created_by_role` (user_role enum)
- `assigned_to_role` (user_role enum)
- `task_type` (TEXT) - review_assessment, schedule_followup, etc.
- `payload` (JSONB) - Task-specific data
- `status` (task_status enum)
- `due_at` (TIMESTAMPTZ)

**Indexes:**

- `idx_tasks_patient_id`
- `idx_tasks_assessment_id`
- `idx_tasks_assigned_to_role_status_due` (composite for queries)
- `idx_tasks_status`

**RLS:** Patients view own; clinicians view all; service manages.

---

#### notifications

**Purpose:** Notification queue with multi-channel support  
**Key Columns:**

- `user_id` (UUID → auth.users)
- `channel` (TEXT) - email, sms, push, in_app
- `template_key` (TEXT) - Template identifier
- `payload` (JSONB) - Template variables
- `scheduled_at` (TIMESTAMPTZ)
- `sent_at` (TIMESTAMPTZ)
- `status` (notification_status enum)

**Indexes:**

- `idx_notifications_user_id`
- `idx_notifications_status`
- `idx_notifications_scheduled_at`

**RLS:** Users view own; service manages.

---

### 9. Audit (1 table)

#### audit_log

**Purpose:** Comprehensive audit trail for system changes  
**Key Columns:**

- `actor_user_id` (UUID → auth.users, nullable for system)
- `actor_role` (user_role enum)
- `entity_type` (TEXT) - assessment, report, funnel, etc.
- `entity_id` (UUID)
- `action` (TEXT) - created, updated, deleted
- `diff` (JSONB) - Before/after differences

**Indexes:**

- `idx_audit_log_entity_type_id` (composite for entity lookups)
- `idx_audit_log_created_at`
- `idx_audit_log_actor_user_id`

**RLS:** Admins view; service can insert (write-only for most operations).

---

## JSONB Field Schemas

All JSONB fields documented in `docs/canon/CONTRACTS.md` with TypeScript interfaces:

1. **Funnel Configuration** (2 fields)
   - `funnel_versions.questionnaire_config`
   - `funnel_versions.content_manifest`

2. **Document Processing** (3 fields)
   - `documents.extracted_data`
   - `documents.confidence`
   - `documents.confirmed_data`

3. **Results & Analytics** (3 fields)
   - `calculated_results.scores`
   - `calculated_results.risk_models`
   - `calculated_results.priority_ranking`

4. **Reports** (3 fields)
   - `reports.safety_findings`
   - `reports.citations_meta`
   - `report_sections.citations_meta`

5. **Operational** (6 fields)
   - `organizations.settings`
   - `user_profiles.metadata`
   - `assessment_events.payload`
   - `tasks.payload`
   - `notifications.payload`
   - `audit_log.diff`

---

## Idempotency Guarantees

All migration statements use idempotent patterns:

✅ **Tables:** `CREATE TABLE IF NOT EXISTS`  
✅ **Enums:** `DO $$ IF NOT EXISTS (SELECT FROM pg_type...)`  
✅ **Columns:** `DO $$ IF NOT EXISTS (SELECT FROM information_schema.columns...)`  
✅ **Constraints:** `DO $$ IF NOT EXISTS (SELECT FROM information_schema.table_constraints...)`  
✅ **Indexes:** `CREATE INDEX IF NOT EXISTS`  
✅ **RLS Policies:** `DO $$ IF NOT EXISTS (SELECT FROM pg_policies...)`  
✅ **Foreign Keys:** Conditional creation with auth.users existence check

**Result:** Migration can be run multiple times safely without errors or duplicates.

---

## Performance Optimization

### Index Strategy

**34 indexes created** across all new tables:

1. **Primary Lookups:** All foreign keys indexed
2. **Slug/Unique Lookups:** Separate indexes for fast queries
3. **Status Filtering:** Indexes on status/state columns
4. **Time-Series:** DESC indexes on created_at for recent data
5. **Composite Indexes:** For common multi-column queries
   - `tasks(assigned_to_role, status, due_at)`
   - `audit_log(entity_type, entity_id)`

### Query Patterns Optimized

- Get active funnels: `idx_funnels_catalog_is_active`
- Find user's assessments: `idx_assessment_events_assessment_id`
- List pending tasks by role: `idx_tasks_assigned_to_role_status_due`
- Audit trail by entity: `idx_audit_log_entity_type_id`
- Recent notifications: `idx_notifications_scheduled_at`

---

## Security & Access Control

### Row Level Security (RLS)

**All 13 new tables** have RLS enabled with comprehensive policies:

#### Patient Access Pattern

```sql
-- View own data only
USING (
    EXISTS (
        SELECT 1 FROM assessments/patient_funnels/etc
        WHERE entity.patient_id = get_my_patient_profile_id()
    )
)
```

#### Clinician Access Pattern

```sql
-- View all patient data
USING (is_clinician())
```

#### Service Role Pattern

```sql
-- Backend operations
USING (true) WITH CHECK (true)
```

### Access Summary

| Table              | Patient     | Clinician      | Service |
| ------------------ | ----------- | -------------- | ------- |
| organizations      | Read active | Read all       | Full    |
| user_profiles      | Own         | All            | Full    |
| funnels_catalog    | Read active | Read active    | Full    |
| funnel_versions    | Read        | Read           | Full    |
| patient_funnels    | Own         | All            | Full    |
| assessment_events  | Own         | All            | Insert  |
| documents          | Own         | All            | Full    |
| calculated_results | Own         | All            | Insert  |
| report_sections    | Own         | All            | Full    |
| tasks              | Own         | All            | Full    |
| notifications      | Own         | -              | Full    |
| audit_log          | -           | - (Admin only) | Insert  |

---

## Verification Commands

### PowerShell (Windows Development)

```powershell
# Start Supabase
supabase start

# Reset database and apply all migrations
supabase db reset

# Run V0.5 verification script
pwsh -File scripts/verify-v05-schema.ps1

# Generate TypeScript types
npm run db:typegen

# Check for drift
supabase db diff

# View diff of types
git diff lib/types/supabase.ts
```

### CI/CD Verification

GitHub Actions workflow `.github/workflows/db-determinism.yml` automatically:

1. ✅ Checks migration immutability (no edits to existing migrations)
2. ✅ Applies all migrations cleanly
3. ✅ Verifies no schema drift
4. ✅ Generates and validates TypeScript types

---

## Documentation Updates

### CONTRACTS.md

Added two new sections:

1. **V0.5 Database Enums** (~100 lines)
   - Documented all 6 enum types
   - Explained each enum value
   - Provided usage examples

2. **V0.5 JSONB Field Schemas** (~150 lines)
   - TypeScript interfaces for all 17 JSONB fields
   - Structured schema definitions
   - Usage patterns and examples

---

## Migration File Stats

**File:** `supabase/migrations/20251230211228_v05_core_schema_jsonb_fields.sql`

- **Lines:** ~1,200
- **Sections:** 11 clearly marked
- **Comments:** Extensive inline documentation
- **Safety:** 100% idempotent
- **Complexity:** High (but well-structured)

---

## Success Criteria (All Met ✓)

- [x] New migration file in `supabase/migrations/`
- [x] Blank DB → apply migrations runs without errors
- [x] Tables cover all required entities:
  - [x] users/profiles/roles
  - [x] funnels_catalog/funnel_versions
  - [x] assessments/answers/events
  - [x] documents/extraction
  - [x] calculated_results
  - [x] reports/report_sections
  - [x] tasks/notifications
  - [x] audit_log
- [x] JSONB fields present for:
  - [x] questionnaire_config/content_manifest
  - [x] extracted_data/confidence/confirmed_data
  - [x] scores/risk_models/priority_ranking
  - [x] safety_findings/citations_meta
  - [x] task/notification payloads
  - [x] audit diff
- [x] Unique constraints for idempotent generation:
  - [x] reports per assessment+version
  - [x] sections per report+key
  - [x] results per assessment+algorithm
- [x] Evidence in PR: Schema diff output + typegen diff (PowerShell)
- [x] Updated CONTRACTS.md with new enums and JSONB schemas

---

## Next Steps for User

1. **Merge PR** after CI passes
2. **Run in production:**
   ```powershell
   supabase db push
   ```
3. **Verify production:**
   ```powershell
   pwsh -File scripts/verify-v05-schema.ps1
   ```
4. **Update application code** to use new tables/JSONB fields
5. **Migrate existing data** if needed (separate migration)

---

## Notes

- Migration is **additive only** - no existing tables dropped
- Existing `assessments`, `reports` tables **extended** with new columns
- All changes **backwards compatible** (new columns have defaults)
- **Safe to deploy** to production incrementally
- Future migrations can build on this foundation

---

**Created:** 2025-12-30  
**Migration Timestamp:** 20251230211228  
**Verification Script:** `scripts/verify-v05-schema.ps1`
