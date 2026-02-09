# IST DB Inventory (Patient Record + Versioning)

## Core patient record structures
- Anamnesis master table (patient-facing record with versioning trigger): [supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql](supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql)
  - Tables: `anamnesis_entries`, `anamnesis_entry_versions`
  - Versioning: trigger `anamnesis_entry_create_version()` inserts immutable versions
  - Audit: trigger `anamnesis_entry_audit_log()` writes to `audit_log`
  - RLS: patient, clinician, admin policies on both tables
- Funnel summary system entries (idempotent per assessment): [supabase/migrations/20260202151003_e75_5_add_funnel_summary_entry_type.sql](supabase/migrations/20260202151003_e75_5_add_funnel_summary_entry_type.sql)
  - Adds entry type `funnel_summary`
  - Idempotency index `idx_anamnesis_entries_funnel_summary_lookup` on patient + assessment
- Canonical patient state (single JSONB per user): [schema/schema.sql](schema/schema.sql)
  - Table: `patient_state`
  - Trigger: `update_patient_state_updated_at` to keep timestamps current
  - RLS: patient can read/write own state; clinicians can read (policy in migrations)

## Structured clinician note with versioning
- Consult notes (strict 12-section JSON + auto-versioning): [supabase/migrations/20260208220000_issue_5_consult_notes_v1.sql](supabase/migrations/20260208220000_issue_5_consult_notes_v1.sql)
  - Tables: `consult_notes`, `consult_note_versions`
  - Versioning: trigger `create_consult_note_version()` on content update
  - RLS: patient, clinician, admin policies on both tables
  - Optional linkage to chat via `chat_session_id`

## Assessment evidence sources used by record tooling
- Assessments and answers: RLS policies in [supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql](supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql)
  - Tables: `assessments`, `assessment_answers`
  - Provides assessment metadata and raw answers (used by funnel summaries and context pack)
- Results and reports (for clinician-facing facts): referenced in clinician anamnesis API and summary generator
  - Tables: `reports`, `calculated_results` (sources for risk level and scores)
- Documents extraction evidence (confidence + evidence pointers): [supabase/migrations/20260103130600_add_extraction_pipeline_fields.sql](supabase/migrations/20260103130600_add_extraction_pipeline_fields.sql)
  - Table: `documents` (fields `extracted_json`, `confidence_json`)

## Longitudinal measures + consents (patient-owned history)
- Patient measures (assessment-derived scores + risk): [supabase/migrations/20241204210000_create_patient_measures_table.sql](supabase/migrations/20241204210000_create_patient_measures_table.sql), [supabase/migrations/20241209103000_update_patient_measures_schema.sql](supabase/migrations/20241209103000_update_patient_measures_schema.sql)
  - Table: `patient_measures`
  - Stores `stress_score`, `sleep_score`, `risk_level` plus report linkage
  - RLS: patient and clinician access defined in [supabase/migrations/20251207094000_enable_comprehensive_rls.sql](supabase/migrations/20251207094000_enable_comprehensive_rls.sql)
- User consent records (exported with measures): [supabase/migrations/20251207074557_create_user_consents_table.sql](supabase/migrations/20251207074557_create_user_consents_table.sql)
  - Table: `user_consents`
  - RLS: user can view/insert own consents

## LLM interaction history (adjacent record data)
- AMY chat message history (used in clinician/patient chat flows): [schema/schema.sql](schema/schema.sql)
  - Table: `amy_chat_messages`
  - Stores role + message content + metadata per chat session

## Access control primitives (re-used by record flows)
- Patient identity: `patient_profiles` with RLS updates in [supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql](supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql)
- Clinician assignment: `clinician_patient_assignments` (referenced by RLS for anamnesis and consult notes)
- Organization scoping: `user_org_membership` (used by helpers to resolve org)

## Versioning + idempotency mechanisms
- `anamnesis_entry_versions` created by trigger (immutable history)
- `consult_note_versions` created by trigger (immutable history)
- Funnel summary idempotency index per assessment (prevents duplicates)
- Document extraction idempotency index on `documents` extraction fields

## Observed gaps for a dedicated patient record object
- No dedicated `patient_record` or `patient_record_versions` tables exist.
- Existing versioning is implemented via `anamnesis_entry_versions` and `consult_note_versions`.
- Intake-specific entry type is not yet present in `anamnesis_entries` entry type constraint.
