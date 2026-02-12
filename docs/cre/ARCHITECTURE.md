# CRE Architecture

## Data Flow

```mermaid
flowchart LR
  Chat[Patient Chat Context] --> Generate[POST /api/clinical-intake/generate]
  Generate --> Quality[Quality Validation]
  Quality --> Safety[Safety Evaluation]
  Safety --> Persist[Persist clinical_intakes]
  Persist --> Patient[GET /api/clinical-intake/latest]
  Persist --> Clinician[GET /api/clinical-intake/patient/[patientId]/latest]
```

## Single Source of Truth

- `clinical_intakes` is the only write/read source for intake data.
- `anamnesis_entries` must not store or project intake data.

## Safety Policy

- Policy config: [config/cre/safety-policy.v1.json](../../config/cre/safety-policy.v1.json)
- Policy application: [lib/cre/safety/policyEngine.ts](../../lib/cre/safety/policyEngine.ts)
- Overrides are stored in `structured_data.safety.override`.

## Endpoints

Patient:
- `POST /api/clinical-intake/generate`
- `GET /api/clinical-intake/latest`

Clinician:
- `GET /api/clinical-intake/patient/[patientId]/latest`
- `GET /api/clinical-intake/patient/[patientId]/history`
- `GET /api/clinical-intake/patient/[patientId]/version/[versionNumber]`
- `PATCH /api/clinical-intake/patient/[patientId]/latest` (safety override)

## RLS Model (Summary)

- Patients can read/write their own intakes via `user_id`.
- Clinicians can read assigned patient intakes via `clinician_patient_assignments`.
- Admins can read intakes for their organization.
- Clinicians/admins can update safety overrides on assigned intakes.
