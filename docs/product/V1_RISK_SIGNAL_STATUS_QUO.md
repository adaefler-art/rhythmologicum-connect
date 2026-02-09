# V1 Risk Signal Status Quo

## Executive Summary
- The risk/results pipeline consumes structured assessment answers (`assessment_answers.question_id` + `answer_value`), not conversation text. Evidence: [lib/processing/riskStageProcessor.ts](lib/processing/riskStageProcessor.ts#L62-L104), [lib/processing/resultsStageProcessor.ts](lib/processing/resultsStageProcessor.ts#L107-L191).
- Assessment answers are created via the save-on-tap API that upserts into `assessment_answers`. Evidence: [apps/rhythm-patient-ui/app/api/assessment-answers/save/route.ts](apps/rhythm-patient-ui/app/api/assessment-answers/save/route.ts#L146-L154).
- Assessment completion triggers `processRiskStage` and `processResultsStage` for the processing job. Evidence: [apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts](apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts#L398-L440).
- Outputs are persisted as `risk_bundles.bundle_data` (risk bundle JSON) and `calculated_results` with `scores`, `risk_models`, `priority_ranking`, and `inputs_hash`. Evidence: [lib/risk/persistence.ts](lib/risk/persistence.ts#L53-L63), [lib/results/persistence.ts](lib/results/persistence.ts#L171-L182), [schema/schema.sql](schema/schema.sql#L2611-L2621).
- No adapter or API accepts free JSON/text as risk input; `inputsData` is derived from answers to compute `inputs_hash`. Evidence: [lib/processing/resultsStageProcessor.ts](lib/processing/resultsStageProcessor.ts#L164-L188), [lib/results/persistence.ts](lib/results/persistence.ts#L18-L38).
- Terminology exists for risk level/score, risk models, priority ranking, signals, red flags, and program tier; no evidence for "working hypothesis" or "arbeitsdiagnose" terms in this pipeline. Evidence: [lib/contracts/riskBundle.ts](lib/contracts/riskBundle.ts#L65-L104), [lib/contracts/priorityRanking.ts](lib/contracts/priorityRanking.ts#L28-L210), [docs/clinical/triage_red_flags_v1.md](docs/clinical/triage_red_flags_v1.md#L1-L23), [apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx](apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx#L8-L353).

## What the pipeline consumes

**Conclusion: A (assessment_answers / question_id / answer_value).**

Evidence (inputs read):
- Risk stage reads `assessment_answers` with `question_id` and `answer_value`. Evidence: [lib/processing/riskStageProcessor.ts](lib/processing/riskStageProcessor.ts#L62-L104).
- Results stage reads `assessment_answers` to build `inputsData` for `inputs_hash`. Evidence: [lib/processing/resultsStageProcessor.ts](lib/processing/resultsStageProcessor.ts#L107-L188).

Evidence (inputs created):
- Answers are persisted via the save API (UPSERT into `assessment_answers`). Evidence: [apps/rhythm-patient-ui/app/api/assessment-answers/save/route.ts](apps/rhythm-patient-ui/app/api/assessment-answers/save/route.ts#L146-L154).
- Completion triggers `processRiskStage` and `processResultsStage` for the processing job. Evidence: [apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts](apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts#L398-L440).

Evidence against B/C (free JSON input):
- `inputsData` is an internal record used only to compute `inputs_hash`, built from answers in the results stage. Evidence: [lib/processing/resultsStageProcessor.ts](lib/processing/resultsStageProcessor.ts#L164-L188), [lib/results/persistence.ts](lib/results/persistence.ts#L18-L38).
- `risk_bundles.bundle_data` stores a computed risk bundle JSON; it is persisted by the pipeline, not accepted as input. Evidence: [lib/risk/persistence.ts](lib/risk/persistence.ts#L53-L63).

If a JSON adapter exists, it was not found in the repo scan and is marked **UNKNOWN**.

## What the pipeline produces

Stable outputs and their fields:
- **Risk bundle** (risk score, risk level, factors) in `RiskBundleV1`. Evidence: [lib/contracts/riskBundle.ts](lib/contracts/riskBundle.ts#L65-L104).
- **Priority ranking** (ranked interventions, program tier, signal codes) in `PriorityRankingV1`. Evidence: [lib/contracts/priorityRanking.ts](lib/contracts/priorityRanking.ts#L28-L210).
- **Calculated results** persisted with `scores`, `risk_models`, `priority_ranking`, and `inputs_hash`. Evidence: [lib/results/persistence.ts](lib/results/persistence.ts#L171-L182), [schema/schema.sql](schema/schema.sql#L2611-L2621).

## Terminology inventory

**UI copy (patient/studio):**
- "Red Flags" and tier recommendation labels in pre-screening UI. Evidence: [apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx](apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx#L8-L353).
- "signals" shown for ranked interventions in clinician detail UI. Evidence: [apps/rhythm-studio-ui/app/clinician/patient/[id]/InterventionsSection.tsx](apps/rhythm-studio-ui/app/clinician/patient/[id]/InterventionsSection.tsx#L11-L205).

**API response shapes / contracts:**
- `RiskScore` and `RiskLevel` are explicit contract terms. Evidence: [lib/contracts/riskBundle.ts](lib/contracts/riskBundle.ts#L65-L104).
- `SignalCode` and `programTier` in priority ranking contract. Evidence: [lib/contracts/priorityRanking.ts](lib/contracts/priorityRanking.ts#L28-L210).

**Docs (E73-E76, technical specs):**
- `calculated_results` includes `risk_models`, `priority_ranking`, `inputs_hash`. Evidence: [docs/e7/E73_3_IMPLEMENTATION_SUMMARY.md](docs/e7/E73_3_IMPLEMENTATION_SUMMARY.md#L171-L211).
- Red flag catalog and terminology are documented. Evidence: [docs/clinical/triage_red_flags_v1.md](docs/clinical/triage_red_flags_v1.md#L1-L23).

**Code identifiers (types/constants):**
- Risk level/score types: `RiskScore`, `RiskLevel`. Evidence: [lib/contracts/riskBundle.ts](lib/contracts/riskBundle.ts#L65-L104).
- Risk signals: `SIGNAL_CODE` (e.g., `high_stress_score`, `critical_risk_level`). Evidence: [lib/contracts/priorityRanking.ts](lib/contracts/priorityRanking.ts#L28-L54).
- Program tier (tier constraints) exists; explicit "risk tier" naming is not present. Evidence: [lib/contracts/priorityRanking.ts](lib/contracts/priorityRanking.ts#L180-L196), [apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx](apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx#L58-L353).

**Terms requested and status:**
- Risk Signals: **Present** (signal codes and UI "signals"). Evidence: [lib/contracts/priorityRanking.ts](lib/contracts/priorityRanking.ts#L28-L54), [apps/rhythm-studio-ui/app/clinician/patient/[id]/InterventionsSection.tsx](apps/rhythm-studio-ui/app/clinician/patient/[id]/InterventionsSection.tsx#L11-L205).
- Risk Tier: **Not found** (only program tier). Evidence: [lib/contracts/priorityRanking.ts](lib/contracts/priorityRanking.ts#L180-L196).
- Risk Score: **Present** (`RiskScore`). Evidence: [lib/contracts/riskBundle.ts](lib/contracts/riskBundle.ts#L65-L76).
- Priority Ranking: **Present** (`PriorityRankingV1` and `priority_ranking`). Evidence: [lib/contracts/priorityRanking.ts](lib/contracts/priorityRanking.ts#L180-L210), [lib/results/persistence.ts](lib/results/persistence.ts#L171-L182).
- Risk Models: **Present** (`risk_models` field). Evidence: [lib/results/persistence.ts](lib/results/persistence.ts#L171-L182), [schema/schema.sql](schema/schema.sql#L2611-L2644).
- Calculated Results: **Present** (`calculated_results`). Evidence: [schema/schema.sql](schema/schema.sql#L2611-L2621).
- Working Hypothesis / Arbeitsdiagnose: **UNKNOWN** (no matches in scan).
- Red Flags: **Present** (docs and UI). Evidence: [docs/clinical/triage_red_flags_v1.md](docs/clinical/triage_red_flags_v1.md#L1-L23), [apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx](apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx#L275-L313).

## v1 recommendation

**Minimal existing outputs usable as "signals" in a consult note:**
- `riskModels.riskLevel` and `riskModels.riskFactors` from `calculated_results`. Evidence: [lib/processing/resultsStageProcessor.ts](lib/processing/resultsStageProcessor.ts#L172-L188), [lib/results/persistence.ts](lib/results/persistence.ts#L171-L182).
- `priorityRanking.topInterventions` and signal codes from `PriorityRankingV1`. Evidence: [lib/processing/resultsStageProcessor.ts](lib/processing/resultsStageProcessor.ts#L176-L188), [lib/contracts/priorityRanking.ts](lib/contracts/priorityRanking.ts#L28-L210).

### Variant 1 (assessment-based pipeline)
- Concept: Convert conversation data into a structured list of `question_id` -> `answer_value` that matches the funnel question keys, then persist with the existing save API and complete the assessment to trigger processing.
- Evidence for the required pathway: `assessment_answers` storage and stage triggering. Evidence: [apps/rhythm-patient-ui/app/api/assessment-answers/save/route.ts](apps/rhythm-patient-ui/app/api/assessment-answers/save/route.ts#L146-L154), [apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts](apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts#L398-L440).

### Variant 2 (JSON/text input)
- Status: **UNKNOWN / no adapter found**. The only JSON fields (`risk_bundles.bundle_data`, `calculated_results.inputs_hash`, `priority_ranking`, `risk_models`) are pipeline outputs, not inputs. Evidence: [lib/risk/persistence.ts](lib/risk/persistence.ts#L53-L63), [lib/results/persistence.ts](lib/results/persistence.ts#L171-L182).
- Recommendation: Do not plan on direct JSON/text ingestion without adding a dedicated adapter/route, since no existing contract accepts it.
