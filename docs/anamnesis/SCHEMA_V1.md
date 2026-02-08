# Patient Record (Anamnesis) Schema V1

**Version:** 1.0  
**Epic:** E75 — Patient Record (Anamnesis/Medical History) Feature  
**Status:** Active  
**Last Updated:** 2026-02-08

**UI Terminology:** In user-facing contexts, this feature is called "Patient Record". Database schema uses "anamnesis" for technical consistency. See Issue 4.

## Overview

The anamnesis schema provides a structured way to store and version patient medical history entries. The schema is designed for multi-tenant isolation, automatic versioning, and comprehensive audit logging.

## Core Tables

### anamnesis_entries

Primary table for storing medical history entries.

**Database:** `public.anamnesis_entries`  
**Migration:** `20260202074325_e75_1_create_anamnesis_tables.sql`

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT gen_random_uuid() | Unique entry identifier |
| `patient_id` | UUID | NOT NULL, FK → patient_profiles(id) | Patient this entry belongs to |
| `organization_id` | UUID | NOT NULL, FK → organizations(id) | Organization for multi-tenant isolation |
| `title` | TEXT | NOT NULL | Brief title/summary of entry (max 500 chars via API validation) |
| `content` | JSONB | NOT NULL, DEFAULT '{}' | Structured entry content |
| `entry_type` | TEXT | CHECK constraint, NULLABLE | Category of entry (see Entry Types) |
| `tags` | TEXT[] | DEFAULT [], NULLABLE | Searchable tags for categorization |
| `is_archived` | BOOLEAN | NOT NULL, DEFAULT false | Soft delete flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Initial creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Latest version timestamp (auto-updated by trigger) |
| `created_by` | UUID | NULLABLE, FK → auth.users(id) | User who created entry |
| `updated_by` | UUID | NULLABLE, FK → auth.users(id) | User who last updated entry |

#### Required Fields

**Database Level:**
- `id` (auto-generated)
- `patient_id`
- `organization_id`
- `title`
- `content`
- `is_archived` (defaults to false)
- `created_at` (auto-generated)
- `updated_at` (auto-generated)

**API Level (Additional Validation):**
- `title` must not be empty and max 500 characters
- `content` JSONB size must not exceed 1MB

#### Optional Fields

- `entry_type` - Can be NULL or one of predefined types
- `tags` - Can be empty array or NULL
- `created_by` - Set by API when user context available
- `updated_by` - Set by API on updates

### anamnesis_entry_versions

Immutable version history table.

**Database:** `public.anamnesis_entry_versions`  
**Migration:** `20260202074325_e75_1_create_anamnesis_tables.sql`

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL, DEFAULT gen_random_uuid() | Unique version identifier |
| `entry_id` | UUID | NOT NULL, FK → anamnesis_entries(id) | Reference to parent entry |
| `version_number` | INTEGER | NOT NULL, UNIQUE(entry_id, version_number) | Sequential version (1, 2, 3...) |
| `title` | TEXT | NOT NULL | Snapshot of title at this version |
| `content` | JSONB | NOT NULL | Snapshot of content at this version |
| `entry_type` | TEXT | NULLABLE | Snapshot of entry_type at this version |
| `tags` | TEXT[] | NULLABLE | Snapshot of tags at this version |
| `changed_by` | UUID | NULLABLE, FK → auth.users(id) | User who created this version |
| `changed_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When this version was created |
| `change_reason` | TEXT | NULLABLE | Optional reason for the change |
| `diff` | JSONB | NULLABLE | Before/after comparison (reserved for future use) |

#### Required Fields

- `id` (auto-generated)
- `entry_id`
- `version_number`
- `title`
- `content`
- `changed_at` (auto-generated)

**UNIQUE Constraint:** `(entry_id, version_number)` - Prevents duplicate version numbers

## Entry Types

Entry types categorize anamnesis entries. All types are optional at the database level.

### Allowed Values

| Type | German Label | Use Case |
|------|--------------|----------|
| `medical_history` | Krankengeschichte | General medical history, past diagnoses, surgeries |
| `symptoms` | Symptome | Current or past symptoms reported by patient |
| `medications` | Medikation | Current or past medications |
| `allergies` | Allergien | Known allergies and adverse reactions |
| `family_history` | Familienanamnese | Family medical history |
| `lifestyle` | Lebensstil | Lifestyle factors (diet, exercise, smoking, alcohol) |
| `other` | Sonstiges | Other anamnesis information not fitting above categories |

### Validation Rules

**Database Level:**
```sql
CHECK (entry_type IN ('medical_history', 'symptoms', 'medications', 
                      'allergies', 'family_history', 'lifestyle', 'other'))
```

**API Level:**
- Must be one of the allowed values if provided
- Can be NULL or omitted (validation in `lib/api/anamnesis/validation.ts`)

## Content Field Structure

The `content` field is JSONB and can store any valid JSON structure. There is no enforced schema at the database level to allow flexibility.

### Recommended Structure

```json
{
  "freeText": "Patient reports...",
  "structuredData": {
    "field1": "value1",
    "field2": "value2"
  },
  "metadata": {
    "source": "patient" | "clinician",
    "confidenceLevel": "high" | "medium" | "low"
  }
}
```

### Size Limits

- **Database:** No size limit (JSONB can be very large)
- **API:** 1MB maximum (enforced in validation)

## Tags

Tags are stored as PostgreSQL TEXT arrays for searchable categorization.

### Examples

```sql
tags = ARRAY['chronic', 'cardiac', 'q1-2026']
tags = ARRAY['medication-review', 'current']
tags = []  -- Empty array (valid)
tags = NULL  -- Also valid
```

### Indexing

A GIN index is created on the tags column for efficient array searches:

```sql
CREATE INDEX idx_anamnesis_entries_tags ON anamnesis_entries USING GIN (tags);
```

## Indexes

Performance indexes for common query patterns:

| Index Name | Type | Columns | Purpose |
|------------|------|---------|---------|
| `idx_anamnesis_entries_patient_updated` | B-tree | (patient_id, updated_at DESC) | Patient's entries sorted by update time |
| `idx_anamnesis_entries_org_id` | B-tree | (organization_id) | Org-scoped queries |
| `idx_anamnesis_entries_entry_type` | B-tree | (entry_type) WHERE entry_type IS NOT NULL | Type filtering |
| `idx_anamnesis_entries_tags` | GIN | (tags) | Tag searches |
| `idx_anamnesis_entry_versions_entry_version` | B-tree | (entry_id, version_number DESC) | Version history queries |
| `idx_anamnesis_entry_versions_changed_at` | B-tree | (changed_at DESC) | Temporal version queries |

## Triggers

### Automatic Versioning

**Trigger:** `trigger_anamnesis_entry_versioning`  
**Function:** `anamnesis_entry_create_version()`  
**Event:** BEFORE INSERT OR UPDATE on anamnesis_entries

**Behavior:**
- Calculates next version number (COUNT(*) + 1)
- Inserts immutable version record into anamnesis_entry_versions
- Captures snapshot of all fields
- Records changed_by from NEW.updated_by
- Updates NEW.updated_at to NOW()

**Result:**
- Every INSERT creates version 1
- Every UPDATE creates next sequential version
- All done in same transaction (no race conditions)

### Audit Logging

**Trigger:** `trigger_anamnesis_entry_audit`  
**Function:** `anamnesis_entry_audit_log()`  
**Event:** AFTER INSERT OR UPDATE OR DELETE on anamnesis_entries

**Behavior:**
- Logs to `public.audit_log` table
- Records entity_type='anamnesis_entry'
- Captures action (created/updated/deleted)
- Includes before/after diff for updates
- Stores organization context

## Foreign Key Constraints

All foreign keys use CASCADE delete:

| From Column | References | On Delete |
|-------------|------------|-----------|
| `anamnesis_entries.patient_id` | patient_profiles(id) | CASCADE |
| `anamnesis_entries.organization_id` | organizations(id) | CASCADE |
| `anamnesis_entries.created_by` | auth.users(id) | SET NULL |
| `anamnesis_entries.updated_by` | auth.users(id) | SET NULL |
| `anamnesis_entry_versions.entry_id` | anamnesis_entries(id) | CASCADE |
| `anamnesis_entry_versions.changed_by` | auth.users(id) | SET NULL |

**Cascade Behavior:**
- Deleting a patient deletes all their anamnesis entries and versions
- Deleting an organization deletes all entries in that org
- Deleting an entry deletes all its versions
- Deleting a user sets created_by/updated_by/changed_by to NULL (preserves data)

## Security

See [SECURITY_MODEL.md](./SECURITY_MODEL.md) for complete RLS policies.

**Summary:**
- **Patients:** Can view/edit only their own entries
- **Clinicians:** Can view/edit entries for assigned patients only
- **Admins:** Can view/edit all entries within their organization
- **Version History:** Read-only, no UPDATE or DELETE policies

## Versioning Behavior

### Create Entry (INSERT)

```sql
INSERT INTO anamnesis_entries (patient_id, organization_id, title, content, created_by)
VALUES ('patient-uuid', 'org-uuid', 'Title', '{"data": "value"}', 'user-uuid');
```

**Result:**
- 1 row in anamnesis_entries (version implicit)
- 1 row in anamnesis_entry_versions (version_number=1)
- created_at and updated_at set to same timestamp

### Update Entry (via API creating version)

```sql
-- API calls anamnesis_entry_create_version() function
-- This inserts into anamnesis_entries.updated_at trigger
```

**Result:**
- anamnesis_entries row updated with new title/content/updated_at
- New row in anamnesis_entry_versions (version_number incremented)
- updated_at timestamp refreshed

### Archive Entry

```sql
UPDATE anamnesis_entries SET is_archived = true WHERE id = 'entry-uuid';
```

**Result:**
- is_archived flag set to true
- New version created with snapshot
- Entry cannot be updated again (API enforces 409 conflict)

## Migration Notes

**Idempotency:** Migration uses `IF NOT EXISTS` guards throughout, can be run multiple times safely.

**Rollback:** To rollback:
```sql
DROP TABLE IF EXISTS public.anamnesis_entry_versions CASCADE;
DROP TABLE IF EXISTS public.anamnesis_entries CASCADE;
DROP FUNCTION IF EXISTS anamnesis_entry_create_version() CASCADE;
DROP FUNCTION IF EXISTS anamnesis_entry_audit_log() CASCADE;
```

## References

- **Migration:** `supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql`
- **API Documentation:** [API_V1.md](./API_V1.md)
- **Security Model:** [SECURITY_MODEL.md](./SECURITY_MODEL.md)
- **Implementation Summary:** `/E75.1-COMPLETE.md`
- **Schema Manifest:** `docs/canon/DB_SCHEMA_MANIFEST.json`

---

**Version:** 1.0  
**Author:** GitHub Copilot  
**Epic:** E75 — Anamnesis Feature
