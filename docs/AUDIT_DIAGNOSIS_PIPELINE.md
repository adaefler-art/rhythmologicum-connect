# Diagnosis Pipeline Audit (Studio)

## Sollfluss (target)
1. Start: Clinician queues diagnosis run via API.
2. Run-Record: `diagnosis_runs` row created with inputs_hash + inputs_meta.
3. Execution Worker: worker sets status=running, builds context pack, calls MCP `run_diagnosis`.
4. MCP Call: MCP returns diagnosis_result payload.
5. Artifact Persist: result stored in `diagnosis_artifacts` with risk_level + confidence_score.
6. Run Update: run marked completed with processing_time_ms and correlation info.
7. UI List/Detail: list shows runs + summary; detail shows full result (JSON viewer).

## Istfluss (repo evidence)
- Start (Queue API): [apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts](../apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts)
- Execution Worker: [lib/diagnosis/worker.ts](../lib/diagnosis/worker.ts)
- MCP call: `run_diagnosis` in worker.
- Persist artifact: `diagnosis_artifacts` insert in worker.
- Run update: `diagnosis_runs` updated with status, mcp_run_id, processing_time_ms.
- Tables + RLS: [supabase/migrations/20260204104959_e76_4_diagnosis_runs_and_artifacts.sql](../supabase/migrations/20260204104959_e76_4_diagnosis_runs_and_artifacts.sql)
- UI list: [apps/rhythm-studio-ui/app/clinician/patient/[id]/DiagnosisSection.tsx](../apps/rhythm-studio-ui/app/clinician/patient/%5Bid%5D/DiagnosisSection.tsx)
- List API: [apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/diagnosis/runs/route.ts](../apps/rhythm-studio-ui/app/api/clinician/patient/%5BpatientId%5D/diagnosis/runs/route.ts)
- Artifact API: [apps/rhythm-studio-ui/app/api/studio/diagnosis/runs/[runId]/artifact/route.ts](../apps/rhythm-studio-ui/app/api/studio/diagnosis/runs/%5BrunId%5D/artifact/route.ts)

## Gaps (before fixes)
- Run detail endpoint missing: UI had no `/api/studio/diagnosis/runs/[runId]` route; 404 observed.
- Result endpoint semantics: artifact endpoint returned 404 for missing artifact, causing UI "Noch kein Ergebnis" with no structured run detail.
- Writeback idempotency: worker always inserted artifacts (no update on retry).
- Correlation data: trace_id not persisted alongside result payload.

## Fixplan (changes applied)
- Add run detail route returning `{ run, result, artifact }` with 200 + `result=null` when no artifact.
- Point UI "View Result" to the run detail route; disable button until run is completed.
- Make artifact persistence idempotent (update existing artifact by run_id + artifact_type).
- Persist trace_id in artifact metadata and store metadata column for deterministic debugging.

### Files changed
- [apps/rhythm-studio-ui/app/api/studio/diagnosis/runs/[runId]/route.ts](../apps/rhythm-studio-ui/app/api/studio/diagnosis/runs/%5BrunId%5D/route.ts)
- [apps/rhythm-studio-ui/app/clinician/patient/[id]/DiagnosisSection.tsx](../apps/rhythm-studio-ui/app/clinician/patient/%5Bid%5D/DiagnosisSection.tsx)
- [lib/diagnosis/worker.ts](../lib/diagnosis/worker.ts)
