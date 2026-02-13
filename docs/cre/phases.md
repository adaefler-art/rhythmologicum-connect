# CRE Roadmap (Phases)

This document is the binding phase plan for CRE. It reflects the current implementation status and defines the next phases as actionable artifacts. It intentionally avoids UI debates.

## Phase Model

- Phase 1: Intake Extraction (SSOT clinical_intakes)
  - Output: structured intake data plus clinical summary
- Phase 2: Safety/Red Flags + Escalation + Override (Clinician)
  - Output: verified evidence, escalation policy, override plus effective policy
- Phase 3: Clinical Reasoning Pack
  - Output: differential diagnoses, risk assessment, open questions, next steps (no hard-stop)
- Phase 4: Guided Follow-up (Patient Chat Loop)
  - Output: targeted follow-up questions plus new answers into incremental intake versions
- Phase 5: Clinician Review Workflow
  - Output: review/approve/request-more-info, audit, status transitions
- Phase 6: Reporting/Export/Interoperability (optional later)

## Current Status

- Phase 1: done (clinical_intakes SSOT, intake generation)
- Phase 2: done (evidence gating, verified evidence, override, effective policy, E2E guardrails)
- Known gap: semantic tuning of rules to reduce false positives

## Definition of Done

### Phase 1: Intake Extraction

- Inputs/Outputs: clinical_intakes.structured_data contains chief complaint, HPI, relevant negatives, PMH, meds, psychosocial, uncertainties; clinical summary stored/returned
- API Endpoints: intake create/update endpoints return structured_data and summary
- UI: patient intake flow collects data and shows summary where applicable
- Tests: unit tests for extraction, basic E2E intake submission

### Phase 2: Safety/Red Flags + Escalation + Override

- Inputs/Outputs: safety evaluation includes verified evidence items, escalation_level, policy_result, override, effective_level/action
- API Endpoints: safety evaluation returned on intake retrieval and report endpoints; override endpoints persist to clinical_intakes
- UI: clinician override controls and badges, patient-facing safety banner
- Tests: unit tests for evidence gating; E2E guardrails for escalation/override
- Known gap: semantic tuning to reduce false positives

### Phase 3: Clinical Reasoning Pack (Next)

- Inputs/Outputs: add reasoning pack to clinical_intakes (differentials, risk assessment, open questions, next steps)
- API Endpoints: server endpoint to generate/store reasoning pack; retrieval included in clinician views
- UI: clinician view renders reasoning pack without hard-stop behavior
- Tests: unit tests for pack schema, integration tests for storage and retrieval
- Guardrails: reasoning output must not override safety escalation

### Phase 4: Guided Follow-up (Patient Chat Loop)

- Inputs/Outputs: follow-up questions and new answers stored as new intake versions linked to original intake
- API Endpoints: follow-up question generation and answer submission endpoints; versioned intake retrieval
- UI: patient chat loop for follow-up questions, resume from latest version
- Tests: E2E follow-up flow, version chain integrity

### Phase 5: Clinician Review Workflow

- Inputs/Outputs: review status, approval, request-more-info, audit entries
- API Endpoints: status transition endpoints with role checks and audit logging
- UI: clinician review queue, detail view with actions and audit trail
- Tests: unit tests for transitions, E2E review workflow

### Phase 6: Reporting/Export/Interoperability

- Inputs/Outputs: structured export formats (PDF/JSON), optional FHIR mapping
- API Endpoints: export endpoints with RBAC and audit
- UI: clinician export actions
- Tests: snapshot tests for exports, access control tests

## Next Phase

Phase 3 is the next phase to implement. The Definition of Done above is the binding acceptance criteria.
