# Diagnosis Go-Live v1 (E76)

## Scope

This document provides the contract compliance audit and go-live checklist for the E76 diagnosis stack (MCP server, context pack, execution worker, prompt schema, patient UI, RLS/audit, and endpoint wiring).

## Contract Compliance Audit

### Contracts and Schemas

- Source contracts: [lib/contracts/diagnosis.ts](../../lib/contracts/diagnosis.ts), [lib/contracts/diagnosis-prompt.ts](../../lib/contracts/diagnosis-prompt.ts)
- MCP artifact schema docs: [docs/runbooks/ARTIFACT_SCHEMA_V1.md](../runbooks/ARTIFACT_SCHEMA_V1.md)
- Prompt registry and guardrails: [lib/prompts/registry.ts](../../lib/prompts/registry.ts)

### API Endpoints (E76)

Studio:
- [apps/rhythm-studio-ui/app/api/mcp/route.ts](../../apps/rhythm-studio-ui/app/api/mcp/route.ts)
- [apps/rhythm-studio-ui/app/api/mcp/context-pack/route.ts](../../apps/rhythm-studio-ui/app/api/mcp/context-pack/route.ts)
- [apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts](../../apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts)
- [apps/rhythm-studio-ui/app/api/studio/diagnosis/execute/route.ts](../../apps/rhythm-studio-ui/app/api/studio/diagnosis/execute/route.ts)
- [apps/rhythm-studio-ui/app/api/studio/diagnosis/prompt/route.ts](../../apps/rhythm-studio-ui/app/api/studio/diagnosis/prompt/route.ts)
- [apps/rhythm-studio-ui/app/api/studio/diagnosis/health/route.ts](../../apps/rhythm-studio-ui/app/api/studio/diagnosis/health/route.ts)
- [apps/rhythm-studio-ui/app/api/studio/diagnosis/runs/[runId]/artifact/route.ts](../../apps/rhythm-studio-ui/app/api/studio/diagnosis/runs/%5BrunId%5D/artifact/route.ts)
- [apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/diagnosis/runs/route.ts](../../apps/rhythm-studio-ui/app/api/clinician/patient/%5BpatientId%5D/diagnosis/runs/route.ts)

Patient:
- [apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts](../../apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts)
- [apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/[runId]/artifact/route.ts](../../apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/%5BrunId%5D/artifact/route.ts)

Endpoint catalogs:
- [docs/api/ENDPOINT_CATALOG.md](../api/ENDPOINT_CATALOG.md)
- [docs/api/ENDPOINT_INVENTORY.md](../api/ENDPOINT_INVENTORY.md)

### Feature Flags and Env Documentation

- Feature flags: [lib/featureFlags.ts](../../lib/featureFlags.ts)
- Env schema: [lib/env.ts](../../lib/env.ts)
- Env template: [.env.example](../../.env.example)

Required E76 flags and config (documented in .env.example):
- `NEXT_PUBLIC_FEATURE_MCP_ENABLED`
- `MCP_SERVER_URL`
- `NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED`
- `NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED`
- `NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED`
- `NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED`

### RLS, Audit, and Migrations

- Base tables + RLS: [supabase/migrations/20260204104959_e76_4_diagnosis_runs_and_artifacts.sql](../../supabase/migrations/20260204104959_e76_4_diagnosis_runs_and_artifacts.sql)
- Patient RLS read policies: [supabase/migrations/20260204142315_e76_6_diagnosis_patient_rls.sql](../../supabase/migrations/20260204142315_e76_6_diagnosis_patient_rls.sql)
- Assignment-based clinician RLS + audit triggers: [supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql](../../supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql)
- inputs_meta for dedupe auditability: [supabase/migrations/20260204164641_e76_8_add_inputs_meta.sql](../../supabase/migrations/20260204164641_e76_8_add_inputs_meta.sql)
- RLS SQL tests: [test/e76-7-diagnosis-rls-tests.sql](../../test/e76-7-diagnosis-rls-tests.sql)

### Guardrails and Epic References

- E76.1 MCP server: [E76.1-COMPLETE.md](../../E76.1-COMPLETE.md)
- E76.2 context pack: [E76.2-COMPLETE.md](../../E76.2-COMPLETE.md)
- E76.4 execution worker: [E76.4-COMPLETE.md](../../E76.4-COMPLETE.md)
- E76.5 prompt schema: [E76.5-COMPLETE.md](../../E76.5-COMPLETE.md)
- E76.6 patient UI: [E76.6-COMPLETE.md](../../E76.6-COMPLETE.md)
- E76.7 security/audit: [docs/e7/E76_7_IMPLEMENTATION_SUMMARY.md](../e7/E76_7_IMPLEMENTATION_SUMMARY.md)
- E76.8 dedupe: [E76.8-COMPLETE.md](../../E76.8-COMPLETE.md)
- E76.9 docs/runbook: [E76.9-COMPLETE.md](../../E76.9-COMPLETE.md)

Guardrail matrices:
- [docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_5.md](../guardrails/RULES_VS_CHECKS_MATRIX_E76_5.md)
- [docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_6.md](../guardrails/RULES_VS_CHECKS_MATRIX_E76_6.md)
- [docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_8.md](../guardrails/RULES_VS_CHECKS_MATRIX_E76_8.md)
- [docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_9.md](../guardrails/RULES_VS_CHECKS_MATRIX_E76_9.md)

## Contract Drift Notes

- E76.6 COMPLETE doc references `/api/patient/diagnosis/artifacts/[id]`, while the current route is `/api/patient/diagnosis/runs/[runId]/artifact` in [apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/[runId]/artifact/route.ts](../../apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/%5BrunId%5D/artifact/route.ts). Treat the run-based endpoint as the current contract unless the docs are updated.

## Go-Live Checklist

### Automated Checks (Preflight)

- Run the local go-live audit script: `bash scripts/diagnosis/go-live-check.sh`
- Run existing guardrail scripts:
  - `npm run verify:e76-1`
  - `npm run verify:e76-2`
  - `npm run verify:e76-4`
  - `npm run verify:e76-5`
  - `npm run verify:e76-6`
  - `npm run verify:e76-8`
  - `npm run verify:e76-9`
- Run RLS SQL tests (local DB): `psql -U postgres -d rhythmologicum_connect -f test/e76-7-diagnosis-rls-tests.sql`

### Configuration

- Confirm MCP server is reachable at `MCP_SERVER_URL` and health returns 200.
- Confirm Supabase keys are configured (public + service role).
- Keep all diagnosis feature flags `false` until final approval.

### Runtime Validation

- Health check: `GET /api/studio/diagnosis/health` (expects 200 + `available: true` when enabled).
- Queue + execute: `POST /api/studio/diagnosis/queue`, then `POST /api/studio/diagnosis/execute`.
- Artifact fetch: `GET /api/studio/diagnosis/runs/[runId]/artifact`.
- Patient read: `GET /api/patient/diagnosis/runs` and `GET /api/patient/diagnosis/runs/[runId]/artifact`.
- Audit log entry created for run lifecycle + artifact view (verify in DB).

### Feature Flag Rollout

- Enable flags in order:
  1. `NEXT_PUBLIC_FEATURE_MCP_ENABLED`
  2. `NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED`
  3. `NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED`
  4. `NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED`
  5. `NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED`
- Verify UI: clinician diagnosis section gated behavior, patient list/detail pages, and admin diagnostics test page.

### Rollback Plan

- Set all diagnosis feature flags back to `false`.
- Stop MCP server (or remove network access to MCP host).
- Confirm queue endpoint returns 503 with `DIAG_SERVICE_UNAVAILABLE` or `FEATURE_DISABLED` as expected.

## Automated Go-Live Script

- Script path: [scripts/diagnosis/go-live-check.sh](../../scripts/diagnosis/go-live-check.sh)
- Purpose: Static validation of required route files, contracts, RLS markers, and env documentation.
