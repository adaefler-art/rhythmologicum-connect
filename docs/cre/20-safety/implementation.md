# Safety Implementation

## Evaluation Location

- Safety is evaluated in the intake generation endpoint:
  - [apps/rhythm-patient-ui/app/api/clinical-intake/generate/route.ts](../../../apps/rhythm-patient-ui/app/api/clinical-intake/generate/route.ts)
- The evaluator is rules-only:
  - [lib/cre/safety/redFlags.ts](../../../lib/cre/safety/redFlags.ts)

## Persistence

- Safety results are stored on the intake row:
  - `clinical_intakes.structured_data.safety`
  - `clinical_intakes.structured_data.red_flags`
  - Traceability fields: `structured_data.safety.rule_ids`, `structured_data.safety.check_ids`

## Rendering

- Patient hard-stop: [apps/rhythm-patient-ui/app/patient/(mobile)/dialog/DialogScreenV2.tsx](../../../apps/rhythm-patient-ui/app/patient/(mobile)/dialog/DialogScreenV2.tsx)
- Clinician display: [apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx](../../../apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx)
- UI policy helper: [lib/cre/safety/policy.ts](../../../lib/cre/safety/policy.ts)

## Safety 2.1 Rule Scaffold

Rule IDs and checks are defined in:

- [lib/cre/safety/rules/rules.ts](../../../lib/cre/safety/rules/rules.ts)
- [lib/cre/safety/rules/checks.ts](../../../lib/cre/safety/rules/checks.ts)
- [lib/cre/safety/rules/evaluate.ts](../../../lib/cre/safety/rules/evaluate.ts)

Guidelines for adding new rules:

- Add rule IDs in `rules.ts` with deterministic predicates.
- Use structured intake fields (OPQRST/10W style) for time/dynamics logic.
- Add non-clinical checks in `checks.ts` to track data quality.
- Extend unit tests in `lib/cre/safety/__tests__/` for rule-id traceability.
