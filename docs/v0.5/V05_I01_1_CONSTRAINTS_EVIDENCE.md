# V05-I01.1 Migration Evidence: Constraints & Backwards Compatibility

**Migration:** `supabase/migrations/20251230211228_v05_core_schema_jsonb_fields.sql`  
**Scope:** Schema, Tables, Constraints, Indexes (RLS deferred to V05-I01.2)  
**Date:** 2025-12-30

---

## Idempotency Constraints

All required unique constraints are present for retry-safe upsert operations:

### 1. funnels_catalog.slug

```sql
CREATE TABLE IF NOT EXISTS public.funnels_catalog (
    slug TEXT NOT NULL UNIQUE,
    ...
);
```

**Index:** `idx_funnels_catalog_slug`  
**Purpose:** Ensures funnel slugs are unique for URL routing

### 2. funnel_versions(funnel_id, version)

```sql
UNIQUE(funnel_id, version)
```

**Constraint Name:** `funnel_versions_funnel_id_version_key`  
**Purpose:** Prevents duplicate versions per funnel, enables idempotent version creation

### 3. reports(assessment_id, report_version)

```sql
ALTER TABLE public.reports
    ADD CONSTRAINT reports_assessment_version_unique
    UNIQUE(assessment_id, report_version);
```

**Purpose:** One report per assessment+version, supports versioned report regeneration

### 4. report_sections(report_id, section_key)

```sql
ALTER TABLE public.report_sections
    ADD CONSTRAINT report_sections_report_key_unique
    UNIQUE(report_id, section_key);
```

**Purpose:** One section per report+key, enables modular section upserts

### 5. calculated_results(assessment_id, algorithm_version)

```sql
ALTER TABLE public.calculated_results
    ADD CONSTRAINT calculated_results_assessment_version_unique
    UNIQUE(assessment_id, algorithm_version);
```

**Purpose:** One result set per assessment+algorithm version, supports algorithm upgrades

### 6. user_org_membership(user_id, organization_id)

```sql
UNIQUE(user_id, organization_id)
```

**Purpose:** One membership per user per organization

### 7. assessment_answers(assessment_id, question_id)

**Note:** Already exists in prior migration `20251208143813_add_assessment_answers_unique_constraint.sql`

```sql
ALTER TABLE public.assessment_answers
  ADD CONSTRAINT assessment_answers_assessment_question_unique
  UNIQUE (assessment_id, question_id);
```

**Purpose:** One answer per question per assessment, supports save-on-tap upserts

---

## Backwards Compatibility

### Tables Extended (No Breaking Changes)

#### 1. assessments table

**Existing columns preserved:** All existing columns remain unchanged  
**New columns added:**

- `state` (assessment_state enum) - DEFAULT 'in_progress'  
  Migration strategy: Existing NULL values will receive default
- `current_step_id` (UUID NULLABLE)  
  Migration strategy: Existing rows will have NULL, no impact on existing queries

**Impact:** ✅ Zero breaking changes. Existing queries continue to work.

#### 2. reports table

**Existing columns preserved:** All existing columns remain unchanged  
**New columns added:**

- `report_version` (TEXT) - DEFAULT '1.0'
- `prompt_version` (TEXT) - NULLABLE
- `status` (report_status enum) - DEFAULT 'pending'
- `safety_score` (INTEGER) - NULLABLE
- `safety_findings` (JSONB) - DEFAULT '{}'::jsonb
- `html_path` (TEXT) - NULLABLE
- `pdf_path` (TEXT) - NULLABLE
- `citations_meta` (JSONB) - DEFAULT '{}'::jsonb

**Impact:** ✅ Zero breaking changes. All new columns are nullable or have defaults.

### New Tables (No Conflicts)

All 13 new tables are created with `CREATE TABLE IF NOT EXISTS`:

- organizations
- user_profiles
- user_org_membership
- funnels_catalog
- funnel_versions
- patient_funnels
- assessment_events
- documents
- calculated_results
- report_sections
- tasks
- notifications
- audit_log

**Impact:** ✅ No conflicts with existing schema. Safe for existing data.

### Enums (Additive Only)

All enums created with idempotent `DO $$ IF NOT EXISTS` pattern:

- user_role
- assessment_state
- report_status
- task_status
- parsing_status
- notification_status

**Impact:** ✅ Safe to run multiple times. No enum modifications to existing types.

---

## Migration Safety Checklist

- [x] All `CREATE TABLE` use `IF NOT EXISTS`
- [x] All enums use `DO $$ IF NOT EXISTS` guards
- [x] All columns added to existing tables are nullable OR have defaults
- [x] All indexes use `IF NOT EXISTS`
- [x] All constraints use `IF NOT EXISTS` guards
- [x] Foreign keys conditionally created (checks if auth.users exists)
- [x] No data migrations required
- [x] No breaking changes to existing queries
- [x] Safe to rollback (additive only)

---

## Verification Commands (PowerShell)

Execute the following to verify migration safety:

```powershell
# 1. Install dependencies
npm ci

# 2. Reset database and apply all migrations
npm run db:reset

# 3. Check for schema drift
npm run db:diff
# Expected: No schema changes detected

# 4. Generate TypeScript types
npm run db:typegen

# 5. Check type changes
git diff -- lib/types/supabase.ts
# Expected: New types added for v0.5 tables

# 6. Run tests
npm test

# 7. Build project
npm run build
```

---

## Constraints Summary Table

| Table                | Constraint                         | Type   | Purpose                     |
| -------------------- | ---------------------------------- | ------ | --------------------------- |
| funnels_catalog      | slug                               | UNIQUE | URL routing                 |
| funnel_versions      | (funnel_id, version)               | UNIQUE | Version uniqueness          |
| reports              | (assessment_id, report_version)    | UNIQUE | Versioned reports           |
| report_sections      | (report_id, section_key)           | UNIQUE | Modular sections            |
| calculated_results   | (assessment_id, algorithm_version) | UNIQUE | Algorithm versioning        |
| user_org_membership  | (user_id, organization_id)         | UNIQUE | One membership per user/org |
| assessment_answers\* | (assessment_id, question_id)       | UNIQUE | Save-on-tap upserts         |

\*Constraint exists in prior migration

---

## Index Coverage

All foreign keys are indexed for query performance:

- ✅ 34 indexes created
- ✅ All FK columns have dedicated indexes
- ✅ Status/state columns indexed for filtering
- ✅ Timestamp columns indexed with DESC for time-series queries
- ✅ Composite indexes for common multi-column queries

---

## Notes

1. **RLS Policies:** Deferred to V05-I01.2 (separate migration/PR)
2. **assessment_answers:** Already exists with proper constraints from prior migration
3. **No Data Migration:** All changes are additive, no existing data needs transformation
4. **Rollback Safe:** Migration can be rolled back as it's purely additive

---

**Migration Status:** ✅ Ready for deployment  
**Breaking Changes:** None  
**Data Safety:** Full backwards compatibility maintained
