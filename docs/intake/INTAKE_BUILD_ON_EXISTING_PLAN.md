# Intake Build-on Existing Plan

## Goal
Build intake on existing patient record structures with minimal schema and code changes, avoiding new tables unless strictly necessary.

## Existing building blocks (evidence)
- Versioned patient record entries: [supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql](supabase/migrations/20260202074325_e75_1_create_anamnesis_tables.sql)
- System-generated funnel summaries: [lib/anamnesis/summaryGenerator.ts](lib/anamnesis/summaryGenerator.ts)
- Structured clinician consult notes: [supabase/migrations/20260208220000_issue_5_consult_notes_v1.sql](supabase/migrations/20260208220000_issue_5_consult_notes_v1.sql)
- Existing APIs for patient/clinician anamnesis editing: [apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts](apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts), [apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/anamnesis/route.ts](apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/anamnesis/route.ts)

## Plan A (recommended): Intake as `anamnesis_entries`
Use `anamnesis_entries` as the single intake record container, leveraging built-in versioning and RLS.

Minimal deltas:
- DB: extend `anamnesis_entries.entry_type` constraint to include `intake` (single migration).
- Validation: add `intake` to `ENTRY_TYPES` and allow a structured content shape in [lib/api/anamnesis/validation.ts](lib/api/anamnesis/validation.ts).
- API: reuse existing anamnesis endpoints for create/update; optional new endpoint alias that writes `entry_type = intake` for clarity.
- UI: surface intake entries in existing clinician/patient anamnesis views, with entry-type label.

Why this fits:
- Version history and audit logging already exist for anamnesis entries.
- RLS already supports patient, clinician, and admin access patterns.
- Summary generator already writes system entries into the same table (compatible model).

Risks:
- Mixing patient-authored and clinician-authored content in one table may require tighter validation to prevent inconsistent intake shapes.
- Content size limits and schema expectations need clear constraints to avoid unbounded JSON growth.
- Clinician POST endpoint currently edits the latest entry rather than creating a new one; intake workflows may need explicit create semantics.

## Plan B: Intake as `consult_notes`
Use `consult_notes` to store intake as a structured 12-section note.

Deltas:
- Add a distinct intake flavor in consult note content (e.g., `consultation_type = first` + intake metadata).
- Provide an intake-specific API that creates consult notes and links to chat history (optional).

Risks:
- Consult notes are clinician-oriented and validation is strict (no diagnoses, 12 sections). Patient-authored intake may not fit.
- RLS allows patient reads, but creation is currently clinician-only (policy and API assume clinician role).

## Plan C: New `patient_record` tables (avoid unless necessary)
Create dedicated `patient_record` and `patient_record_versions` tables with bespoke schema.

Risks:
- Higher migration and RLS overhead.
- Duplicates functionality already present in `anamnesis_entries` and `consult_notes`.
- Longer time to integrate with existing UI and APIs.

## Recommendation
Proceed with Plan A. It reuses existing versioning, RLS, and UI, requires only a small schema update, and keeps intake data co-located with other patient record entries.

## Consistency check (docs vs runtime)
- Endpoint method mismatch for patient export: API ownership doc lists `POST /api/patient-measures/export`, but the route is implemented as GET. Evidence: [docs/API_ROUTE_OWNERSHIP.md](docs/API_ROUTE_OWNERSHIP.md), [apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts](apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts)
- Access pattern mismatch for history: endpoint catalog lists patient access for `/api/patient-measures/history`, but the handler uses an admin client and requires `patientId` query param (clinician-style access). Evidence: [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md), [apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts](apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts)
- Canonical patient state exists but is separate from record/intake tables; intake should not write to `patient_state` unless explicitly designed for it. Evidence: [schema/schema.sql](schema/schema.sql), [apps/rhythm-patient-ui/app/api/patient/state/route.ts](apps/rhythm-patient-ui/app/api/patient/state/route.ts)

## Suggested next steps
1. Confirm desired intake content schema (fields, required vs optional).
2. Add `intake` entry type constraint + validation updates.
3. Adjust clinician and patient flows to create dedicated intake entries rather than updating the latest entry.
