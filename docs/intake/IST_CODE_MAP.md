# IST Code Map (Patient Record + Intake)

## Anamnesis APIs (patient + clinician)
- Patient list/create entries: [apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts](apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts)
  - Reads `anamnesis_entries`, counts `anamnesis_entry_versions`
  - Writes `anamnesis_entries` (trigger creates version)
- Patient entry detail and update: [apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts](apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts)
  - Reads entry + versions
  - Updates `anamnesis_entries` (version trigger)
- Clinician patient anamnesis (latest + versions + suggested facts): [apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/anamnesis/route.ts](apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/anamnesis/route.ts)
  - Reads `anamnesis_entries`, `anamnesis_entry_versions`
  - Reads `assessments`, `reports`, `calculated_results` for suggested facts
  - Writes `anamnesis_entries` (update latest or insert new) + version trigger
- Shared helper + validation utilities: [lib/api/anamnesis/helpers.ts](lib/api/anamnesis/helpers.ts), [lib/api/anamnesis/validation.ts](lib/api/anamnesis/validation.ts)

## Anamnesis UI surfaces
- Patient timeline: [apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx](apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx)
- Patient entry detail: [apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/client.tsx](apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/client.tsx)
- Clinician section in patient profile: [apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx](apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx)

## Patient state API (canonical state cache)
- Patient state read/write: [apps/rhythm-patient-ui/app/api/patient/state/route.ts](apps/rhythm-patient-ui/app/api/patient/state/route.ts)
  - Reads `patient_state` by `user_id`
  - Upserts `patient_state` with validated partial updates

## Patient measures + export (longitudinal outcomes)
- Patient measures history (clinician-facing, admin client): [apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts](apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts)
  - Reads `patient_measures` and joins `reports`
- Patient measures export (patient-facing): [apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts](apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts)
  - Reads `patient_measures`, `reports`, and `user_consents`

## Assessment history (patient-facing)
- Patient assessment list: [apps/rhythm-patient-ui/app/api/patient/assessments/route.ts](apps/rhythm-patient-ui/app/api/patient/assessments/route.ts)
  - Reads `patient_profiles` and `assessments` (joins `funnels`)
- Patient latest report stub: [apps/rhythm-patient-ui/app/api/patient/reports/latest/route.ts](apps/rhythm-patient-ui/app/api/patient/reports/latest/route.ts)
  - Auth checks only; returns stub payload (no DB read yet)

## Consult note APIs and helpers (structured clinician notes)
- Create/list consult notes: [apps/rhythm-studio-ui/app/api/clinician/consult-notes/route.ts](apps/rhythm-studio-ui/app/api/clinician/consult-notes/route.ts)
- Generate consult note from chat history: [apps/rhythm-studio-ui/app/api/clinician/consult-notes/generate/route.ts](apps/rhythm-studio-ui/app/api/clinician/consult-notes/generate/route.ts)
- Consult note detail + versions: [apps/rhythm-studio-ui/app/api/clinician/consult-notes/[consultNoteId]/route.ts](apps/rhythm-studio-ui/app/api/clinician/consult-notes/[consultNoteId]/route.ts), [apps/rhythm-studio-ui/app/api/clinician/consult-notes/[consultNoteId]/versions/route.ts](apps/rhythm-studio-ui/app/api/clinician/consult-notes/[consultNoteId]/versions/route.ts)
- Types + validation + rendering: [lib/types/consultNote.ts](lib/types/consultNote.ts), [lib/validation/consultNote.ts](lib/validation/consultNote.ts), [lib/consultNote/helpers.ts](lib/consultNote/helpers.ts)

## Consultation pipeline (consult note -> assessment answers)
- Extraction and synthetic assessment orchestration: [lib/consultation/pipeline.ts](lib/consultation/pipeline.ts)
  - Reads `consult_notes`
  - Writes `assessments` and `assessment_answers` via synthetic assessment helpers

## Automated intake-like record creation from assessments
- Funnel summary generator writes system entries: [lib/anamnesis/summaryGenerator.ts](lib/anamnesis/summaryGenerator.ts)
- Triggered during delivery stage: [lib/processing/deliveryStageProcessor.server.ts](lib/processing/deliveryStageProcessor.server.ts)
  - Reads `assessments` and `calculated_results`
  - Writes `anamnesis_entries` with `entry_type = funnel_summary`

## LLM context assembly uses record data
- Context pack builder loads anamnesis + funnel runs: [lib/mcp/contextPackBuilder.ts](lib/mcp/contextPackBuilder.ts)
  - Reads `anamnesis_entries`, `assessments`, `assessment_answers`, `questions`, `calculated_results`

## Clinician colleague chat (case-bound context)
- Clinician chat API reads consult notes + anamnesis list: [apps/rhythm-studio-ui/app/api/clinician/chat/route.ts](apps/rhythm-studio-ui/app/api/clinician/chat/route.ts)
  - Reads `consult_notes` and `anamnesis_entries`
  - Writes `amy_chat_messages` with clinician metadata

## Summary
- Current patient-record-like data lives across `anamnesis_entries` (freeform + system summaries), `consult_notes` (structured clinician notes), and assessment artifacts.
- Versioning is implemented per record type via `anamnesis_entry_versions` and `consult_note_versions`.
- Intake can be layered on these existing read/write paths with minimal new infrastructure.
