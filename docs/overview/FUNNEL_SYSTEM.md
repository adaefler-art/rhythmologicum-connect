# Funnel System (v0.5)

## What it is

Rhythmologicum Connect’s assessment flows are implemented as **data-driven funnels**.
Funnel definitions live in the database and are executed by a dedicated runtime backend.

## Definition vs runtime

- **Definition (DB):** funnel metadata, steps, and questions.
- **Runtime (API):** assessment lifecycle (start, validate step, save answers, complete) with ownership checks and step-skipping prevention.

## Manifest + legacy behavior

- v0.5 treats the database as the **source of truth** for funnel structure.
- Any legacy or transitional flows should be treated as compatibility layers; the runtime remains authoritative for assessment state.

## Related docs

- Funnel mapping UI notes: [../FUNNEL_MAPPING_UI.md](../FUNNEL_MAPPING_UI.md)
- Patient flow structure: [../PATIENT_FLOW_V2_STRUCTURE.md](../PATIENT_FLOW_V2_STRUCTURE.md)
