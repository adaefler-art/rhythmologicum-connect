# Endpoint Inventory (Repo Derived)

## Generator Inputs

- scripts/dev/endpoint-catalog/generate.js
- scripts/dev/endpoint-catalog/core.js
- docs/api/endpoint-allowlist.json
- scripts/ci/verify-endpoint-catalog.ps1
- .github/workflows/api-wiring-gate.yml
- .github/workflows/endpoint-catalog-autofix.yml
- .github/workflows/pr-preflight-autofix.yml

## Authoritative Endpoint List (Ist)

| METHOD | URL | FILE PATH | APP ROOT | HANDLER (GET/POST/…) | NOTES (auth?) |
| --- | --- | --- | --- | --- | --- |
| GET | /api/_debug/env | apps/rhythm-patient-ui/app/api/_debug/env/route.ts | rhythm-patient-ui | GET | accessRole=system |
| GET | /api/_meta/ping | apps/rhythm-studio-ui/app/api/_meta/ping/route.ts | rhythm-studio-ui | GET | accessRole=unknown |
| POST | /api/account/deletion-request | apps/rhythm-legacy/app/api/account/deletion-request/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/account/deletion-request | legacy/code/app/api/account/deletion-request/route.ts | legacy/code | POST | accessRole=patient |
| GET, POST | /api/admin/content-pages | apps/rhythm-legacy/app/api/admin/content-pages/route.ts | rhythm-legacy | GET, POST | accessRole=admin |
| GET, POST | /api/admin/content-pages | apps/rhythm-studio-ui/app/api/admin/content-pages/route.ts | rhythm-studio-ui | GET, POST | accessRole=admin |
| GET, POST | /api/admin/content-pages | legacy/code/app/api/admin/content-pages/route.ts | legacy/code | GET, POST | accessRole=admin |
| DELETE, GET, PATCH | /api/admin/content-pages/[id] | apps/rhythm-legacy/app/api/admin/content-pages/[id]/route.ts | rhythm-legacy | DELETE, GET, PATCH | accessRole=admin |
| DELETE, GET, PATCH | /api/admin/content-pages/[id] | apps/rhythm-studio-ui/app/api/admin/content-pages/[id]/route.ts | rhythm-studio-ui | DELETE, GET, PATCH | accessRole=admin |
| DELETE, GET, PATCH | /api/admin/content-pages/[id] | legacy/code/app/api/admin/content-pages/[id]/route.ts | legacy/code | DELETE, GET, PATCH | accessRole=admin |
| GET, POST | /api/admin/content-pages/[id]/sections | apps/rhythm-legacy/app/api/admin/content-pages/[id]/sections/route.ts | rhythm-legacy | GET, POST | accessRole=admin |
| GET, POST | /api/admin/content-pages/[id]/sections | apps/rhythm-studio-ui/app/api/admin/content-pages/[id]/sections/route.ts | rhythm-studio-ui | GET, POST | accessRole=admin |
| GET, POST | /api/admin/content-pages/[id]/sections | legacy/code/app/api/admin/content-pages/[id]/sections/route.ts | legacy/code | GET, POST | accessRole=admin |
| DELETE, PATCH | /api/admin/content-pages/[id]/sections/[sectionId] | apps/rhythm-legacy/app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts | rhythm-legacy | DELETE, PATCH | accessRole=admin |
| DELETE, PATCH | /api/admin/content-pages/[id]/sections/[sectionId] | apps/rhythm-studio-ui/app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts | rhythm-studio-ui | DELETE, PATCH | accessRole=admin |
| DELETE, PATCH | /api/admin/content-pages/[id]/sections/[sectionId] | legacy/code/app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts | legacy/code | DELETE, PATCH | accessRole=admin |
| GET, POST | /api/admin/design-tokens | apps/rhythm-legacy/app/api/admin/design-tokens/route.ts | rhythm-legacy | GET, POST | accessRole=admin |
| GET, POST | /api/admin/design-tokens | apps/rhythm-studio-ui/app/api/admin/design-tokens/route.ts | rhythm-studio-ui | GET, POST | accessRole=admin |
| GET, POST | /api/admin/design-tokens | legacy/code/app/api/admin/design-tokens/route.ts | legacy/code | GET, POST | accessRole=admin |
| GET | /api/admin/dev/endpoint-catalog | apps/rhythm-legacy/app/api/admin/dev/endpoint-catalog/route.ts | rhythm-legacy | GET | accessRole=admin |
| GET | /api/admin/dev/endpoint-catalog | apps/rhythm-studio-ui/app/api/admin/dev/endpoint-catalog/route.ts | rhythm-studio-ui | GET | accessRole=admin |
| GET | /api/admin/dev/endpoint-catalog | legacy/code/app/api/admin/dev/endpoint-catalog/route.ts | legacy/code | GET | accessRole=admin |
| GET | /api/admin/diagnostics/pillars-sot | apps/rhythm-legacy/app/api/admin/diagnostics/pillars-sot/route.ts | rhythm-legacy | GET | accessRole=admin |
| GET | /api/admin/diagnostics/pillars-sot | legacy/code/app/api/admin/diagnostics/pillars-sot/route.ts | legacy/code | GET | accessRole=admin |
| PATCH | /api/admin/funnel-step-questions/[id] | apps/rhythm-legacy/app/api/admin/funnel-step-questions/[id]/route.ts | rhythm-legacy | PATCH | accessRole=admin |
| PATCH | /api/admin/funnel-step-questions/[id] | apps/rhythm-studio-ui/app/api/admin/funnel-step-questions/[id]/route.ts | rhythm-studio-ui | PATCH | accessRole=admin |
| PATCH | /api/admin/funnel-step-questions/[id] | legacy/code/app/api/admin/funnel-step-questions/[id]/route.ts | legacy/code | PATCH | accessRole=admin |
| POST | /api/admin/funnel-steps | apps/rhythm-legacy/app/api/admin/funnel-steps/route.ts | rhythm-legacy | POST | accessRole=admin |
| POST | /api/admin/funnel-steps | legacy/code/app/api/admin/funnel-steps/route.ts | legacy/code | POST | accessRole=admin |
| PATCH | /api/admin/funnel-steps/[id] | apps/rhythm-legacy/app/api/admin/funnel-steps/[id]/route.ts | rhythm-legacy | PATCH | accessRole=admin |
| PATCH | /api/admin/funnel-steps/[id] | apps/rhythm-studio-ui/app/api/admin/funnel-steps/[id]/route.ts | rhythm-studio-ui | PATCH | accessRole=admin |
| PATCH | /api/admin/funnel-steps/[id] | legacy/code/app/api/admin/funnel-steps/[id]/route.ts | legacy/code | PATCH | accessRole=admin |
| POST | /api/admin/funnel-steps/[id]/questions | apps/rhythm-studio-ui/app/api/admin/funnel-steps/[id]/questions/route.ts | rhythm-studio-ui | POST | accessRole=admin |
| DELETE | /api/admin/funnel-steps/[id]/questions/[questionId] | apps/rhythm-studio-ui/app/api/admin/funnel-steps/[id]/questions/[questionId]/route.ts | rhythm-studio-ui | DELETE | accessRole=admin |
| PATCH | /api/admin/funnel-versions/[id] | apps/rhythm-legacy/app/api/admin/funnel-versions/[id]/route.ts | rhythm-legacy | PATCH | accessRole=admin |
| PATCH | /api/admin/funnel-versions/[id] | apps/rhythm-studio-ui/app/api/admin/funnel-versions/[id]/route.ts | rhythm-studio-ui | PATCH | accessRole=admin |
| PATCH | /api/admin/funnel-versions/[id] | legacy/code/app/api/admin/funnel-versions/[id]/route.ts | legacy/code | PATCH | accessRole=admin |
| GET, PUT | /api/admin/funnel-versions/[id]/manifest | apps/rhythm-legacy/app/api/admin/funnel-versions/[id]/manifest/route.ts | rhythm-legacy | GET, PUT | accessRole=admin |
| GET, PUT | /api/admin/funnel-versions/[id]/manifest | apps/rhythm-studio-ui/app/api/admin/funnel-versions/[id]/manifest/route.ts | rhythm-studio-ui | GET, PUT | accessRole=admin |
| GET, PUT | /api/admin/funnel-versions/[id]/manifest | legacy/code/app/api/admin/funnel-versions/[id]/manifest/route.ts | legacy/code | GET, PUT | accessRole=admin |
| GET | /api/admin/funnels | apps/rhythm-legacy/app/api/admin/funnels/route.ts | rhythm-legacy | GET | accessRole=admin |
| GET | /api/admin/funnels | apps/rhythm-studio-ui/app/api/admin/funnels/route.ts | rhythm-studio-ui | GET | accessRole=admin |
| GET | /api/admin/funnels | legacy/code/app/api/admin/funnels/route.ts | legacy/code | GET | accessRole=admin |
| GET, PATCH | /api/admin/funnels/[id] | apps/rhythm-legacy/app/api/admin/funnels/[id]/route.ts | rhythm-legacy | GET, PATCH | accessRole=admin |
| GET, PATCH | /api/admin/funnels/[id] | apps/rhythm-studio-ui/app/api/admin/funnels/[id]/route.ts | rhythm-studio-ui | GET, PATCH | accessRole=admin |
| GET, PATCH | /api/admin/funnels/[id] | legacy/code/app/api/admin/funnels/[id]/route.ts | legacy/code | GET, PATCH | accessRole=admin |
| GET, POST | /api/admin/kpi-thresholds | apps/rhythm-legacy/app/api/admin/kpi-thresholds/route.ts | rhythm-legacy | GET, POST | accessRole=admin |
| GET, POST | /api/admin/kpi-thresholds | apps/rhythm-studio-ui/app/api/admin/kpi-thresholds/route.ts | rhythm-studio-ui | GET, POST | accessRole=admin |
| GET, POST | /api/admin/kpi-thresholds | legacy/code/app/api/admin/kpi-thresholds/route.ts | legacy/code | GET, POST | accessRole=admin |
| DELETE, PUT | /api/admin/kpi-thresholds/[id] | apps/rhythm-legacy/app/api/admin/kpi-thresholds/[id]/route.ts | rhythm-legacy | DELETE, PUT | accessRole=admin |
| DELETE, PUT | /api/admin/kpi-thresholds/[id] | apps/rhythm-studio-ui/app/api/admin/kpi-thresholds/[id]/route.ts | rhythm-studio-ui | DELETE, PUT | accessRole=admin |
| DELETE, PUT | /api/admin/kpi-thresholds/[id] | legacy/code/app/api/admin/kpi-thresholds/[id]/route.ts | legacy/code | DELETE, PUT | accessRole=admin |
| GET | /api/admin/navigation | apps/rhythm-legacy/app/api/admin/navigation/route.ts | rhythm-legacy | GET | accessRole=admin |
| GET | /api/admin/navigation | apps/rhythm-patient-ui/app/api/admin/navigation/route.ts | rhythm-patient-ui | GET | accessRole=admin |
| GET | /api/admin/navigation | apps/rhythm-studio-ui/app/api/admin/navigation/route.ts | rhythm-studio-ui | GET | accessRole=admin |
| GET | /api/admin/navigation | legacy/code/app/api/admin/navigation/route.ts | legacy/code | GET | accessRole=admin |
| PUT | /api/admin/navigation/[role] | apps/rhythm-legacy/app/api/admin/navigation/[role]/route.ts | rhythm-legacy | PUT | accessRole=admin |
| PUT | /api/admin/navigation/[role] | apps/rhythm-studio-ui/app/api/admin/navigation/[role]/route.ts | rhythm-studio-ui | PUT | accessRole=admin |
| PUT | /api/admin/navigation/[role] | legacy/code/app/api/admin/navigation/[role]/route.ts | legacy/code | PUT | accessRole=admin |
| GET, POST | /api/admin/notification-templates | apps/rhythm-legacy/app/api/admin/notification-templates/route.ts | rhythm-legacy | GET, POST | accessRole=admin |
| GET, POST | /api/admin/notification-templates | apps/rhythm-studio-ui/app/api/admin/notification-templates/route.ts | rhythm-studio-ui | GET, POST | accessRole=admin |
| GET, POST | /api/admin/notification-templates | legacy/code/app/api/admin/notification-templates/route.ts | legacy/code | GET, POST | accessRole=admin |
| DELETE, PUT | /api/admin/notification-templates/[id] | apps/rhythm-legacy/app/api/admin/notification-templates/[id]/route.ts | rhythm-legacy | DELETE, PUT | accessRole=admin |
| DELETE, PUT | /api/admin/notification-templates/[id] | apps/rhythm-studio-ui/app/api/admin/notification-templates/[id]/route.ts | rhythm-studio-ui | DELETE, PUT | accessRole=admin |
| DELETE, PUT | /api/admin/notification-templates/[id] | legacy/code/app/api/admin/notification-templates/[id]/route.ts | legacy/code | DELETE, PUT | accessRole=admin |
| GET | /api/admin/operational-settings-audit | apps/rhythm-legacy/app/api/admin/operational-settings-audit/route.ts | rhythm-legacy | GET | accessRole=admin |
| GET | /api/admin/operational-settings-audit | apps/rhythm-studio-ui/app/api/admin/operational-settings-audit/route.ts | rhythm-studio-ui | GET | accessRole=admin |
| GET | /api/admin/operational-settings-audit | legacy/code/app/api/admin/operational-settings-audit/route.ts | legacy/code | GET | accessRole=admin |
| GET | /api/admin/pilot/flow-events | apps/rhythm-legacy/app/api/admin/pilot/flow-events/route.ts | rhythm-legacy | GET | accessRole=admin |
| GET | /api/admin/pilot/flow-events | legacy/code/app/api/admin/pilot/flow-events/route.ts | legacy/code | GET | accessRole=admin |
| GET | /api/admin/pilot/kpis | apps/rhythm-legacy/app/api/admin/pilot/kpis/route.ts | rhythm-legacy | GET | accessRole=admin |
| GET | /api/admin/pilot/kpis | legacy/code/app/api/admin/pilot/kpis/route.ts | legacy/code | GET | accessRole=admin |
| GET, POST | /api/admin/reassessment-rules | apps/rhythm-legacy/app/api/admin/reassessment-rules/route.ts | rhythm-legacy | GET, POST | accessRole=admin |
| GET, POST | /api/admin/reassessment-rules | apps/rhythm-studio-ui/app/api/admin/reassessment-rules/route.ts | rhythm-studio-ui | GET, POST | accessRole=admin |
| GET, POST | /api/admin/reassessment-rules | legacy/code/app/api/admin/reassessment-rules/route.ts | legacy/code | GET, POST | accessRole=admin |
| DELETE, PUT | /api/admin/reassessment-rules/[id] | apps/rhythm-legacy/app/api/admin/reassessment-rules/[id]/route.ts | rhythm-legacy | DELETE, PUT | accessRole=admin |
| DELETE, PUT | /api/admin/reassessment-rules/[id] | apps/rhythm-studio-ui/app/api/admin/reassessment-rules/[id]/route.ts | rhythm-studio-ui | DELETE, PUT | accessRole=admin |
| DELETE, PUT | /api/admin/reassessment-rules/[id] | legacy/code/app/api/admin/reassessment-rules/[id]/route.ts | legacy/code | DELETE, PUT | accessRole=admin |
| GET, POST | /api/admin/studio/funnels/[slug]/drafts | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/route.ts | rhythm-studio-ui | GET, POST | accessRole=admin |
| DELETE, GET, PUT | /api/admin/studio/funnels/[slug]/drafts/[draftId] | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/route.ts | rhythm-studio-ui | DELETE, GET, PUT | accessRole=admin |
| POST | /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/publish/route.ts | rhythm-studio-ui | POST | accessRole=admin |
| POST | /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts | rhythm-studio-ui | POST | accessRole=admin |
| GET | /api/admin/studio/funnels/[slug]/history | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/history/route.ts | rhythm-studio-ui | GET | accessRole=admin |
| GET | /api/admin/usage | apps/rhythm-legacy/app/api/admin/usage/route.ts | rhythm-legacy | GET | accessRole=admin |
| GET | /api/admin/usage | legacy/code/app/api/admin/usage/route.ts | legacy/code | GET | accessRole=admin |
| GET, POST | /api/amy/chat | apps/rhythm-patient-ui/app/api/amy/chat/route.ts | rhythm-patient-ui | GET, POST | accessRole=system |
| POST | /api/amy/stress-report | apps/rhythm-legacy/app/api/amy/stress-report/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/amy/stress-report | legacy/code/app/api/amy/stress-report/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/amy/stress-summary | apps/rhythm-legacy/app/api/amy/stress-summary/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/amy/stress-summary | legacy/code/app/api/amy/stress-summary/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/amy/triage | apps/rhythm-legacy/app/api/amy/triage/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/amy/triage | apps/rhythm-patient-ui/app/api/amy/triage/route.ts | rhythm-patient-ui | POST | accessRole=system |
| POST | /api/amy/triage | legacy/code/app/api/amy/triage/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/assessment-answers/save | apps/rhythm-legacy/app/api/assessment-answers/save/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/assessment-answers/save | apps/rhythm-patient-ui/app/api/assessment-answers/save/route.ts | rhythm-patient-ui | POST | accessRole=patient |
| POST | /api/assessment-answers/save | legacy/code/app/api/assessment-answers/save/route.ts | legacy/code | POST | accessRole=patient |
| POST | /api/assessment-validation/validate-step | apps/rhythm-legacy/app/api/assessment-validation/validate-step/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/assessment-validation/validate-step | apps/rhythm-patient-ui/app/api/assessment-validation/validate-step/route.ts | rhythm-patient-ui | POST | accessRole=patient |
| POST | /api/assessment-validation/validate-step | legacy/code/app/api/assessment-validation/validate-step/route.ts | legacy/code | POST | accessRole=patient |
| GET | /api/assessments/[id]/current-step | apps/rhythm-legacy/app/api/assessments/[id]/current-step/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/assessments/[id]/current-step | apps/rhythm-patient-ui/app/api/assessments/[id]/current-step/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/assessments/[id]/current-step | legacy/code/app/api/assessments/[id]/current-step/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/assessments/[id]/navigation | apps/rhythm-legacy/app/api/assessments/[id]/navigation/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/assessments/[id]/navigation | apps/rhythm-patient-ui/app/api/assessments/[id]/navigation/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/assessments/[id]/navigation | legacy/code/app/api/assessments/[id]/navigation/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/assessments/[id]/resume | apps/rhythm-legacy/app/api/assessments/[id]/resume/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/assessments/[id]/resume | apps/rhythm-patient-ui/app/api/assessments/[id]/resume/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/assessments/[id]/resume | legacy/code/app/api/assessments/[id]/resume/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/assessments/[id]/state | apps/rhythm-legacy/app/api/assessments/[id]/state/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/assessments/[id]/state | apps/rhythm-patient-ui/app/api/assessments/[id]/state/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/assessments/[id]/state | legacy/code/app/api/assessments/[id]/state/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/assessments/in-progress | apps/rhythm-legacy/app/api/assessments/in-progress/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/assessments/in-progress | apps/rhythm-patient-ui/app/api/assessments/in-progress/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/assessments/in-progress | legacy/code/app/api/assessments/in-progress/route.ts | legacy/code | GET | accessRole=patient |
| POST | /api/auth/callback | apps/rhythm-legacy/app/api/auth/callback/route.ts | rhythm-legacy | POST | accessRole=public |
| POST | /api/auth/callback | apps/rhythm-patient-ui/app/api/auth/callback/route.ts | rhythm-patient-ui | POST | accessRole=public |
| POST | /api/auth/callback | apps/rhythm-studio-ui/app/api/auth/callback/route.ts | rhythm-studio-ui | POST | accessRole=public |
| POST | /api/auth/callback | legacy/code/app/api/auth/callback/route.ts | legacy/code | POST | accessRole=public |
| GET | /api/auth/debug | apps/rhythm-studio-ui/app/api/auth/debug/route.ts | rhythm-studio-ui | GET | accessRole=public |
| GET | /api/auth/debug-cookie | apps/rhythm-studio-ui/app/api/auth/debug-cookie/route.ts | rhythm-studio-ui | GET | accessRole=public |
| GET | /api/auth/resolve-role | apps/rhythm-legacy/app/api/auth/resolve-role/route.ts | rhythm-legacy | GET | accessRole=public |
| GET | /api/auth/resolve-role | apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts | rhythm-patient-ui | GET | accessRole=public |
| GET | /api/auth/resolve-role | apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts | rhythm-studio-ui | GET | accessRole=public |
| GET | /api/auth/resolve-role | legacy/code/app/api/auth/resolve-role/route.ts | legacy/code | GET | accessRole=public |
| GET, POST | /api/auth/signout | apps/rhythm-legacy/app/api/auth/signout/route.ts | rhythm-legacy | GET, POST | accessRole=public |
| GET, POST | /api/auth/signout | apps/rhythm-patient-ui/app/api/auth/signout/route.ts | rhythm-patient-ui | GET, POST | accessRole=public |
| GET, POST | /api/auth/signout | apps/rhythm-studio-ui/app/api/auth/signout/route.ts | rhythm-studio-ui | GET, POST | accessRole=public |
| GET, POST | /api/auth/signout | legacy/code/app/api/auth/signout/route.ts | legacy/code | GET, POST | accessRole=public |
| POST | /api/clinician/anamnesis/[entryId]/archive | apps/rhythm-studio-ui/app/api/clinician/anamnesis/[entryId]/archive/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| POST | /api/clinician/anamnesis/[entryId]/versions | apps/rhythm-studio-ui/app/api/clinician/anamnesis/[entryId]/versions/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| GET | /api/clinician/assessments/[assessmentId]/details | apps/rhythm-studio-ui/app/api/clinician/assessments/[assessmentId]/details/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| POST | /api/clinician/patient-funnels | apps/rhythm-studio-ui/app/api/clinician/patient-funnels/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| PATCH | /api/clinician/patient-funnels/[id] | apps/rhythm-studio-ui/app/api/clinician/patient-funnels/[id]/route.ts | rhythm-studio-ui | PATCH | accessRole=clinician |
| UNKNOWN | /api/clinician/patient/[patientId]/[...probe] | apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/[...probe]/route.ts | rhythm-studio-ui | UNKNOWN | accessRole=clinician |
| GET | /api/clinician/patient/[patientId]/amy-insights | apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/amy-insights/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| GET, POST | /api/clinician/patient/[patientId]/anamnesis | apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/anamnesis/route.ts | rhythm-studio-ui | GET, POST | accessRole=clinician |
| GET | /api/clinician/patient/[patientId]/diagnosis/runs | apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/diagnosis/runs/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| GET | /api/clinician/patient/[patientId]/results | apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/results/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| GET | /api/clinician/patients/[patientId]/funnels | apps/rhythm-studio-ui/app/api/clinician/patients/[patientId]/funnels/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| GET | /api/clinician/triage | apps/rhythm-studio-ui/app/api/clinician/triage/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| POST | /api/consent/record | apps/rhythm-legacy/app/api/consent/record/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/consent/record | legacy/code/app/api/consent/record/route.ts | legacy/code | POST | accessRole=patient |
| GET | /api/consent/status | apps/rhythm-legacy/app/api/consent/status/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/consent/status | legacy/code/app/api/consent/status/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/content-pages/[slug] | apps/rhythm-legacy/app/api/content-pages/[slug]/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/content-pages/[slug] | legacy/code/app/api/content-pages/[slug]/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/content-resolver | apps/rhythm-legacy/app/api/content-resolver/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/content-resolver | legacy/code/app/api/content-resolver/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/content/[slug] | apps/rhythm-patient-ui/app/api/content/[slug]/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/content/resolve | apps/rhythm-legacy/app/api/content/resolve/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/content/resolve | legacy/code/app/api/content/resolve/route.ts | legacy/code | GET | accessRole=patient |
| POST | /api/documents/[id]/extract | apps/rhythm-legacy/app/api/documents/[id]/extract/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/documents/[id]/extract | legacy/code/app/api/documents/[id]/extract/route.ts | legacy/code | POST | accessRole=system |
| PATCH | /api/documents/[id]/status | apps/rhythm-legacy/app/api/documents/[id]/status/route.ts | rhythm-legacy | PATCH | accessRole=system |
| PATCH | /api/documents/[id]/status | legacy/code/app/api/documents/[id]/status/route.ts | legacy/code | PATCH | accessRole=system |
| POST | /api/documents/upload | apps/rhythm-legacy/app/api/documents/upload/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/documents/upload | legacy/code/app/api/documents/upload/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/escalation/log-click | apps/rhythm-legacy/app/api/escalation/log-click/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/escalation/log-click | legacy/code/app/api/escalation/log-click/route.ts | legacy/code | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/route.ts | rhythm-patient-ui | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments | legacy/code/app/api/funnels/[slug]/assessments/route.ts | legacy/code | POST | accessRole=patient |
| GET | /api/funnels/[slug]/assessments/[assessmentId] | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/funnels/[slug]/assessments/[assessmentId] | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/funnels/[slug]/assessments/[assessmentId] | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/route.ts | legacy/code | GET | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/answers/save | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/answers/save | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | rhythm-patient-ui | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/answers/save | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | legacy/code | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/complete | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/complete | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | rhythm-patient-ui | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/complete | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | legacy/code | POST | accessRole=patient |
| GET | /api/funnels/[slug]/assessments/[assessmentId]/result | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/funnels/[slug]/assessments/[assessmentId]/result | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/funnels/[slug]/assessments/[assessmentId]/result | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | legacy/code | GET | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | rhythm-patient-ui | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | legacy/code | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/workup | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/workup | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts | rhythm-patient-ui | POST | accessRole=patient |
| POST | /api/funnels/[slug]/assessments/[assessmentId]/workup | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts | legacy/code | POST | accessRole=patient |
| GET | /api/funnels/[slug]/content-pages | apps/rhythm-legacy/app/api/funnels/[slug]/content-pages/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/funnels/[slug]/content-pages | apps/rhythm-patient-ui/app/api/funnels/[slug]/content-pages/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/funnels/[slug]/content-pages | legacy/code/app/api/funnels/[slug]/content-pages/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/funnels/[slug]/definition | apps/rhythm-legacy/app/api/funnels/[slug]/definition/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/funnels/[slug]/definition | apps/rhythm-patient-ui/app/api/funnels/[slug]/definition/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/funnels/[slug]/definition | legacy/code/app/api/funnels/[slug]/definition/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/funnels/active | apps/rhythm-legacy/app/api/funnels/active/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/funnels/active | apps/rhythm-patient-ui/app/api/funnels/active/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/funnels/active | legacy/code/app/api/funnels/active/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/funnels/catalog | apps/rhythm-legacy/app/api/funnels/catalog/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/funnels/catalog | apps/rhythm-patient-ui/app/api/funnels/catalog/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/funnels/catalog | legacy/code/app/api/funnels/catalog/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/funnels/catalog/[slug] | apps/rhythm-legacy/app/api/funnels/catalog/[slug]/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/funnels/catalog/[slug] | apps/rhythm-patient-ui/app/api/funnels/catalog/[slug]/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/funnels/catalog/[slug] | legacy/code/app/api/funnels/catalog/[slug]/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/health/env | apps/rhythm-legacy/app/api/health/env/route.ts | rhythm-legacy | GET | accessRole=public |
| GET | /api/health/env | legacy/code/app/api/health/env/route.ts | legacy/code | GET | accessRole=public |
| GET, POST | /api/mcp | apps/rhythm-studio-ui/app/api/mcp/route.ts | rhythm-studio-ui | GET, POST | accessRole=system |
| POST | /api/mcp/context-pack | apps/rhythm-studio-ui/app/api/mcp/context-pack/route.ts | rhythm-studio-ui | POST | accessRole=system |
| GET | /api/me | apps/rhythm-studio-ui/app/api/me/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| GET | /api/notifications | apps/rhythm-legacy/app/api/notifications/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/notifications | legacy/code/app/api/notifications/route.ts | legacy/code | GET | accessRole=patient |
| PATCH | /api/notifications/[id] | apps/rhythm-legacy/app/api/notifications/[id]/route.ts | rhythm-legacy | PATCH | accessRole=patient |
| PATCH | /api/notifications/[id] | legacy/code/app/api/notifications/[id]/route.ts | legacy/code | PATCH | accessRole=patient |
| GET | /api/patient-measures/export | apps/rhythm-legacy/app/api/patient-measures/export/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/patient-measures/export | apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/patient-measures/export | legacy/code/app/api/patient-measures/export/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/patient-measures/history | apps/rhythm-legacy/app/api/patient-measures/history/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/patient-measures/history | apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/patient-measures/history | legacy/code/app/api/patient-measures/history/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/patient-profiles | apps/rhythm-legacy/app/api/patient-profiles/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/patient-profiles | apps/rhythm-studio-ui/app/api/patient-profiles/route.ts | rhythm-studio-ui | GET | accessRole=patient |
| GET | /api/patient-profiles | legacy/code/app/api/patient-profiles/route.ts | legacy/code | GET | accessRole=patient |
| GET, POST | /api/patient/anamnesis | apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts | rhythm-patient-ui | GET, POST | accessRole=patient |
| GET, PATCH | /api/patient/anamnesis/[entryId] | apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts | rhythm-patient-ui | GET, PATCH | accessRole=patient |
| POST | /api/patient/anamnesis/[entryId]/archive | apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/archive/route.ts | rhythm-patient-ui | POST | accessRole=patient |
| POST | /api/patient/anamnesis/[entryId]/versions | apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/versions/route.ts | rhythm-patient-ui | POST | accessRole=patient |
| GET | /api/patient/anamnesis/export.json | apps/rhythm-studio-ui/app/api/patient/anamnesis/export.json/route.ts | rhythm-studio-ui | GET | accessRole=patient |
| GET | /api/patient/assessments | apps/rhythm-patient-ui/app/api/patient/assessments/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/patient/assessments-with-results | apps/rhythm-patient-ui/app/api/patient/assessments-with-results/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/patient/assessments-with-results | apps/rhythm-studio-ui/app/api/patient/assessments-with-results/route.ts | rhythm-studio-ui | GET | accessRole=patient |
| GET | /api/patient/dashboard | apps/rhythm-legacy/app/api/patient/dashboard/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/patient/dashboard | apps/rhythm-patient-ui/app/api/patient/dashboard/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/patient/dashboard | legacy/code/app/api/patient/dashboard/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/patient/design | apps/rhythm-patient-ui/app/api/patient/design/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/patient/diagnosis/runs | apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/patient/diagnosis/runs/[runId]/artifact | apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/[runId]/artifact/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/patient/onboarding-status | apps/rhythm-legacy/app/api/patient/onboarding-status/route.ts | rhythm-legacy | GET | accessRole=patient |
| GET | /api/patient/onboarding-status | apps/rhythm-patient-ui/app/api/patient/onboarding-status/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET | /api/patient/onboarding-status | legacy/code/app/api/patient/onboarding-status/route.ts | legacy/code | GET | accessRole=patient |
| GET | /api/patient/reports/latest | apps/rhythm-patient-ui/app/api/patient/reports/latest/route.ts | rhythm-patient-ui | GET | accessRole=patient |
| GET, POST | /api/patient/state | apps/rhythm-patient-ui/app/api/patient/state/route.ts | rhythm-patient-ui | GET, POST | accessRole=patient |
| POST | /api/patient/triage | apps/rhythm-legacy/app/api/patient/triage/route.ts | rhythm-legacy | POST | accessRole=patient |
| POST | /api/patient/triage | legacy/code/app/api/patient/triage/route.ts | legacy/code | POST | accessRole=patient |
| GET, POST | /api/pre-screening-calls | apps/rhythm-legacy/app/api/pre-screening-calls/route.ts | rhythm-legacy | GET, POST | accessRole=clinician |
| GET, POST | /api/pre-screening-calls | apps/rhythm-studio-ui/app/api/pre-screening-calls/route.ts | rhythm-studio-ui | GET, POST | accessRole=clinician |
| GET, POST | /api/pre-screening-calls | legacy/code/app/api/pre-screening-calls/route.ts | legacy/code | GET, POST | accessRole=clinician |
| POST | /api/processing/content | apps/rhythm-legacy/app/api/processing/content/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/processing/content | legacy/code/app/api/processing/content/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/processing/delivery | apps/rhythm-legacy/app/api/processing/delivery/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/processing/delivery | legacy/code/app/api/processing/delivery/route.ts | legacy/code | POST | accessRole=system |
| GET | /api/processing/jobs/[jobId] | apps/rhythm-legacy/app/api/processing/jobs/[jobId]/route.ts | rhythm-legacy | GET | accessRole=system |
| GET | /api/processing/jobs/[jobId] | legacy/code/app/api/processing/jobs/[jobId]/route.ts | legacy/code | GET | accessRole=system |
| GET | /api/processing/jobs/[jobId]/download | apps/rhythm-legacy/app/api/processing/jobs/[jobId]/download/route.ts | rhythm-legacy | GET | accessRole=system |
| GET | /api/processing/jobs/[jobId]/download | apps/rhythm-studio-ui/app/api/processing/jobs/[jobId]/download/route.ts | rhythm-studio-ui | GET | accessRole=system |
| GET | /api/processing/jobs/[jobId]/download | legacy/code/app/api/processing/jobs/[jobId]/download/route.ts | legacy/code | GET | accessRole=system |
| POST | /api/processing/pdf | apps/rhythm-legacy/app/api/processing/pdf/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/processing/pdf | legacy/code/app/api/processing/pdf/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/processing/ranking | apps/rhythm-legacy/app/api/processing/ranking/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/processing/ranking | legacy/code/app/api/processing/ranking/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/processing/results | apps/rhythm-legacy/app/api/processing/results/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/processing/results | legacy/code/app/api/processing/results/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/processing/risk | apps/rhythm-legacy/app/api/processing/risk/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/processing/risk | legacy/code/app/api/processing/risk/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/processing/safety | apps/rhythm-legacy/app/api/processing/safety/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/processing/safety | legacy/code/app/api/processing/safety/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/processing/start | apps/rhythm-legacy/app/api/processing/start/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/processing/start | legacy/code/app/api/processing/start/route.ts | legacy/code | POST | accessRole=system |
| POST | /api/processing/validation | apps/rhythm-legacy/app/api/processing/validation/route.ts | rhythm-legacy | POST | accessRole=system |
| POST | /api/processing/validation | legacy/code/app/api/processing/validation/route.ts | legacy/code | POST | accessRole=system |
| GET | /api/reports/[reportId]/pdf | apps/rhythm-legacy/app/api/reports/[reportId]/pdf/route.ts | rhythm-legacy | GET | accessRole=clinician |
| GET | /api/reports/[reportId]/pdf | legacy/code/app/api/reports/[reportId]/pdf/route.ts | legacy/code | GET | accessRole=clinician |
| GET | /api/review/[id] | apps/rhythm-legacy/app/api/review/[id]/route.ts | rhythm-legacy | GET | accessRole=clinician |
| GET | /api/review/[id] | legacy/code/app/api/review/[id]/route.ts | legacy/code | GET | accessRole=clinician |
| POST | /api/review/[id]/decide | apps/rhythm-legacy/app/api/review/[id]/decide/route.ts | rhythm-legacy | POST | accessRole=clinician |
| POST | /api/review/[id]/decide | apps/rhythm-studio-ui/app/api/review/[id]/decide/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| POST | /api/review/[id]/decide | legacy/code/app/api/review/[id]/decide/route.ts | legacy/code | POST | accessRole=clinician |
| GET | /api/review/[id]/details | apps/rhythm-legacy/app/api/review/[id]/details/route.ts | rhythm-legacy | GET | accessRole=clinician |
| GET | /api/review/[id]/details | apps/rhythm-studio-ui/app/api/review/[id]/details/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| GET | /api/review/[id]/details | legacy/code/app/api/review/[id]/details/route.ts | legacy/code | GET | accessRole=clinician |
| GET | /api/review/queue | apps/rhythm-legacy/app/api/review/queue/route.ts | rhythm-legacy | GET | accessRole=clinician |
| GET | /api/review/queue | apps/rhythm-studio-ui/app/api/review/queue/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| GET | /api/review/queue | legacy/code/app/api/review/queue/route.ts | legacy/code | GET | accessRole=clinician |
| GET, POST | /api/shipments | apps/rhythm-legacy/app/api/shipments/route.ts | rhythm-legacy | GET, POST | accessRole=clinician |
| GET, POST | /api/shipments | apps/rhythm-studio-ui/app/api/shipments/route.ts | rhythm-studio-ui | GET, POST | accessRole=clinician |
| GET, POST | /api/shipments | legacy/code/app/api/shipments/route.ts | legacy/code | GET, POST | accessRole=clinician |
| GET, PATCH | /api/shipments/[id] | apps/rhythm-legacy/app/api/shipments/[id]/route.ts | rhythm-legacy | GET, PATCH | accessRole=clinician |
| GET, PATCH | /api/shipments/[id] | apps/rhythm-studio-ui/app/api/shipments/[id]/route.ts | rhythm-studio-ui | GET, PATCH | accessRole=clinician |
| GET, PATCH | /api/shipments/[id] | legacy/code/app/api/shipments/[id]/route.ts | legacy/code | GET, PATCH | accessRole=clinician |
| GET, POST | /api/shipments/[id]/events | apps/rhythm-legacy/app/api/shipments/[id]/events/route.ts | rhythm-legacy | GET, POST | accessRole=clinician |
| GET, POST | /api/shipments/[id]/events | legacy/code/app/api/shipments/[id]/events/route.ts | legacy/code | GET, POST | accessRole=clinician |
| POST | /api/studio/anamnesis/[entryId]/archive | apps/rhythm-studio-ui/app/api/studio/anamnesis/[entryId]/archive/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| POST | /api/studio/anamnesis/[entryId]/versions | apps/rhythm-studio-ui/app/api/studio/anamnesis/[entryId]/versions/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| POST | /api/studio/diagnosis/execute | apps/rhythm-studio-ui/app/api/studio/diagnosis/execute/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| GET, POST | /api/studio/diagnosis/prompt | apps/rhythm-studio-ui/app/api/studio/diagnosis/prompt/route.ts | rhythm-studio-ui | GET, POST | accessRole=clinician |
| POST | /api/studio/diagnosis/queue | apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| GET | /api/studio/diagnosis/runs/[runId]/artifact | apps/rhythm-studio-ui/app/api/studio/diagnosis/runs/[runId]/artifact/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| GET | /api/studio/patients/[patientId]/anamnesis/export.json | apps/rhythm-studio-ui/app/api/studio/patients/[patientId]/anamnesis/export.json/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| GET, POST | /api/support-cases | apps/rhythm-legacy/app/api/support-cases/route.ts | rhythm-legacy | GET, POST | accessRole=clinician |
| GET, POST | /api/support-cases | apps/rhythm-studio-ui/app/api/support-cases/route.ts | rhythm-studio-ui | GET, POST | accessRole=clinician |
| GET, POST | /api/support-cases | legacy/code/app/api/support-cases/route.ts | legacy/code | GET, POST | accessRole=clinician |
| DELETE, GET, PATCH | /api/support-cases/[id] | apps/rhythm-legacy/app/api/support-cases/[id]/route.ts | rhythm-legacy | DELETE, GET, PATCH | accessRole=clinician |
| DELETE, GET, PATCH | /api/support-cases/[id] | apps/rhythm-studio-ui/app/api/support-cases/[id]/route.ts | rhythm-studio-ui | DELETE, GET, PATCH | accessRole=clinician |
| DELETE, GET, PATCH | /api/support-cases/[id] | legacy/code/app/api/support-cases/[id]/route.ts | legacy/code | DELETE, GET, PATCH | accessRole=clinician |
| POST | /api/support-cases/[id]/escalate | apps/rhythm-legacy/app/api/support-cases/[id]/escalate/route.ts | rhythm-legacy | POST | accessRole=clinician |
| POST | /api/support-cases/[id]/escalate | apps/rhythm-studio-ui/app/api/support-cases/[id]/escalate/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| POST | /api/support-cases/[id]/escalate | legacy/code/app/api/support-cases/[id]/escalate/route.ts | legacy/code | POST | accessRole=clinician |
| GET, POST | /api/tasks | apps/rhythm-legacy/app/api/tasks/route.ts | rhythm-legacy | GET, POST | accessRole=clinician |
| GET, POST | /api/tasks | apps/rhythm-studio-ui/app/api/tasks/route.ts | rhythm-studio-ui | GET, POST | accessRole=clinician |
| GET, POST | /api/tasks | legacy/code/app/api/tasks/route.ts | legacy/code | GET, POST | accessRole=clinician |
| PATCH | /api/tasks/[id] | apps/rhythm-legacy/app/api/tasks/[id]/route.ts | rhythm-legacy | PATCH | accessRole=clinician |
| PATCH | /api/tasks/[id] | apps/rhythm-studio-ui/app/api/tasks/[id]/route.ts | rhythm-studio-ui | PATCH | accessRole=clinician |
| PATCH | /api/tasks/[id] | legacy/code/app/api/tasks/[id]/route.ts | legacy/code | PATCH | accessRole=clinician |
| GET | /api/test/correlation-id | apps/rhythm-legacy/app/api/test/correlation-id/route.ts | rhythm-legacy | GET | accessRole=system |
| GET | /api/test/correlation-id | legacy/code/app/api/test/correlation-id/route.ts | legacy/code | GET | accessRole=system |
| POST | /api/triage/fix-membership | apps/rhythm-studio-ui/app/api/triage/fix-membership/route.ts | rhythm-studio-ui | POST | accessRole=clinician |
| GET | /api/triage/health | apps/rhythm-studio-ui/app/api/triage/health/route.ts | rhythm-studio-ui | GET | accessRole=clinician |
| MIDDLEWARE | /api/:path* | apps/rhythm-studio-ui/middleware.ts | rhythm-studio-ui | middleware | middleware |

## UI Call Sites → Endpoints

| UI FILE | CALLED URL | METHOD | MATCHING ENDPOINT (URL+file) |
| --- | --- | --- | --- |
| apps/rhythm-studio-ui/app/admin/content/page.tsx | /api/admin/content-pages | GET, POST | /api/admin/content-pages → apps/rhythm-legacy/app/api/admin/content-pages/route.ts, /api/admin/content-pages → apps/rhythm-studio-ui/app/api/admin/content-pages/route.ts, /api/admin/content-pages → legacy/code/app/api/admin/content-pages/route.ts |
| apps/rhythm-studio-ui/app/admin/content/[id]/page.tsx | /api/admin/content-pages/${key} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/components/ContentPageEditor.tsx | /api/admin/content-pages/${pageId}/sections | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/components/ContentPageEditor.tsx | /api/admin/content-pages/${pageId}/sections/${sectionId} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/components/ContentPageEditor.tsx | /api/admin/content-pages/${pageId}/sections/${section.id} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/components/ContentPageEditor.tsx | /api/admin/content-pages/${pageId}/sections/${prevSection.id} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/components/ContentPageEditor.tsx | /api/admin/content-pages/${pageId}/sections/${nextSection.id} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/admin/design-tokens/page.tsx | /api/admin/design-tokens | GET, POST | /api/admin/design-tokens → apps/rhythm-legacy/app/api/admin/design-tokens/route.ts, /api/admin/design-tokens → apps/rhythm-studio-ui/app/api/admin/design-tokens/route.ts, /api/admin/design-tokens → legacy/code/app/api/admin/design-tokens/route.ts |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/page.tsx | /api/admin/funnel-step-questions/${questionId} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/page.tsx | /api/admin/funnel-steps/${stepId} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/page.tsx | /api/admin/funnel-steps/${otherStep.id} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/page.tsx | /api/admin/funnel-steps/${addingQuestionStepId}/questions | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/page.tsx | /api/admin/funnel-steps/${stepId}/questions/${questionId} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/admin/funnel-versions/[id]/__tests__/route.test.ts | /api/admin/funnel-versions/not-a-uuid | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/admin/funnel-versions/[id]/__tests__/route.test.ts | /api/admin/funnel-versions/550e8400-e29b-41d4-a716-446655440000 | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/admin/funnel-versions/[id]/__tests__/route.test.ts | /api/admin/funnel-versions/$%7BversionId%7D | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/page.tsx | /api/admin/funnel-versions/${versionId} | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/admin/funnel-versions/[id]/__tests__/route.test.ts | /api/admin/funnel-versions/not-a-uuid | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/admin/funnel-versions/[id]/__tests__/route.test.ts | /api/admin/funnel-versions/550e8400-e29b-41d4-a716-446655440000 | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/admin/funnel-versions/[id]/__tests__/route.test.ts | /api/admin/funnel-versions/$%7BversionId%7D | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/editor/page.tsx | /api/admin/funnel-versions/${funnelVersion.id}/manifest | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/editor/page.tsx | /api/admin/funnel-versions/${latestVersionId}/manifest | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/admin/funnels/__tests__/route.test.ts | /api/admin/funnels | GET | /api/admin/funnels → apps/rhythm-legacy/app/api/admin/funnels/route.ts, /api/admin/funnels → apps/rhythm-studio-ui/app/api/admin/funnels/route.ts, /api/admin/funnels → legacy/code/app/api/admin/funnels/route.ts |
| apps/rhythm-studio-ui/app/clinician/funnels/page.tsx | /api/admin/funnels | GET | /api/admin/funnels → apps/rhythm-legacy/app/api/admin/funnels/route.ts, /api/admin/funnels → apps/rhythm-studio-ui/app/api/admin/funnels/route.ts, /api/admin/funnels → legacy/code/app/api/admin/funnels/route.ts |
| apps/rhythm-studio-ui/app/components/ContentPageEditor.tsx | /api/admin/funnels | GET | /api/admin/funnels → apps/rhythm-legacy/app/api/admin/funnels/route.ts, /api/admin/funnels → apps/rhythm-studio-ui/app/api/admin/funnels/route.ts, /api/admin/funnels → legacy/code/app/api/admin/funnels/route.ts |
| legacy/code/app/api/admin/funnels/__tests__/route.test.ts | /api/admin/funnels | GET | /api/admin/funnels → apps/rhythm-legacy/app/api/admin/funnels/route.ts, /api/admin/funnels → apps/rhythm-studio-ui/app/api/admin/funnels/route.ts, /api/admin/funnels → legacy/code/app/api/admin/funnels/route.ts |
| apps/rhythm-legacy/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/stress-assessment | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/nonexistent | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/$%7BuuidParam%7D | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/test-funnel | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/test | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/editor/page.tsx | /api/admin/funnels/${funnelId} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/page.tsx | /api/admin/funnels/${identifier} | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/stress-assessment | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/nonexistent | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/$%7BuuidParam%7D | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/test-funnel | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/admin/funnels/[id]/__tests__/route.test.ts | /api/admin/funnels/test | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/admin/operational-settings/page.tsx | /api/admin/kpi-thresholds | GET, POST | /api/admin/kpi-thresholds → apps/rhythm-legacy/app/api/admin/kpi-thresholds/route.ts, /api/admin/kpi-thresholds → apps/rhythm-studio-ui/app/api/admin/kpi-thresholds/route.ts, /api/admin/kpi-thresholds → legacy/code/app/api/admin/kpi-thresholds/route.ts |
| apps/rhythm-studio-ui/app/admin/operational-settings/page.tsx | /api/admin/kpi-thresholds/${id} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/admin/navigation/page.tsx | /api/admin/navigation | GET | /api/admin/navigation → apps/rhythm-legacy/app/api/admin/navigation/route.ts, /api/admin/navigation → apps/rhythm-patient-ui/app/api/admin/navigation/route.ts, /api/admin/navigation → apps/rhythm-studio-ui/app/api/admin/navigation/route.ts, /api/admin/navigation → legacy/code/app/api/admin/navigation/route.ts |
| lib/utils/roleBasedRouting.ts | /api/admin/navigation | GET | /api/admin/navigation → apps/rhythm-legacy/app/api/admin/navigation/route.ts, /api/admin/navigation → apps/rhythm-patient-ui/app/api/admin/navigation/route.ts, /api/admin/navigation → apps/rhythm-studio-ui/app/api/admin/navigation/route.ts, /api/admin/navigation → legacy/code/app/api/admin/navigation/route.ts |
| apps/rhythm-studio-ui/app/admin/navigation/page.tsx | /api/admin/navigation/${selectedRole} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/admin/operational-settings/page.tsx | /api/admin/notification-templates | GET, POST | /api/admin/notification-templates → apps/rhythm-legacy/app/api/admin/notification-templates/route.ts, /api/admin/notification-templates → apps/rhythm-studio-ui/app/api/admin/notification-templates/route.ts, /api/admin/notification-templates → legacy/code/app/api/admin/notification-templates/route.ts |
| apps/rhythm-studio-ui/app/admin/operational-settings/page.tsx | /api/admin/notification-templates/${id} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/admin/operational-settings/page.tsx | /api/admin/operational-settings-audit | GET | /api/admin/operational-settings-audit → apps/rhythm-legacy/app/api/admin/operational-settings-audit/route.ts, /api/admin/operational-settings-audit → apps/rhythm-studio-ui/app/api/admin/operational-settings-audit/route.ts, /api/admin/operational-settings-audit → legacy/code/app/api/admin/operational-settings-audit/route.ts |
| apps/rhythm-studio-ui/app/admin/operational-settings/page.tsx | /api/admin/reassessment-rules | GET, POST | /api/admin/reassessment-rules → apps/rhythm-legacy/app/api/admin/reassessment-rules/route.ts, /api/admin/reassessment-rules → apps/rhythm-studio-ui/app/api/admin/reassessment-rules/route.ts, /api/admin/reassessment-rules → legacy/code/app/api/admin/reassessment-rules/route.ts |
| apps/rhythm-studio-ui/app/admin/operational-settings/page.tsx | /api/admin/reassessment-rules/${id} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/components/AMYChatWidget.tsx | /api/amy/chat | GET, POST | /api/amy/chat → apps/rhythm-patient-ui/app/api/amy/chat/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/dialog/DialogScreenV2.tsx | /api/amy/chat | GET, POST | /api/amy/chat → apps/rhythm-patient-ui/app/api/amy/chat/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/components/AMYComposer.tsx | /api/amy/triage | POST | /api/amy/triage → apps/rhythm-legacy/app/api/amy/triage/route.ts, /api/amy/triage → apps/rhythm-patient-ui/app/api/amy/triage/route.ts, /api/amy/triage → legacy/code/app/api/amy/triage/route.ts |
| lib/hooks/useAssessmentAnswer.ts | /api/assessment-answers/save | POST | /api/assessment-answers/save → apps/rhythm-legacy/app/api/assessment-answers/save/route.ts, /api/assessment-answers/save → apps/rhythm-patient-ui/app/api/assessment-answers/save/route.ts, /api/assessment-answers/save → legacy/code/app/api/assessment-answers/save/route.ts |
| lib/hooks/useStepValidation.ts | /api/assessment-validation/validate-step | POST | /api/assessment-validation/validate-step → apps/rhythm-legacy/app/api/assessment-validation/validate-step/route.ts, /api/assessment-validation/validate-step → apps/rhythm-patient-ui/app/api/assessment-validation/validate-step/route.ts, /api/assessment-validation/validate-step → legacy/code/app/api/assessment-validation/validate-step/route.ts |
| lib/hooks/useAssessmentNavigation.ts | /api/assessments/${assessmentId}/resume | UNKNOWN | ❌ NO MATCH IN REPO |
| lib/api/assessmentPersistence.ts | /api/assessments/${assessmentId}/state | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/page.tsx | /api/auth/callback | POST | /api/auth/callback → apps/rhythm-legacy/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-patient-ui/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-studio-ui/app/api/auth/callback/route.ts, /api/auth/callback → legacy/code/app/api/auth/callback/route.ts |
| apps/rhythm-patient-ui/app/components/LoginPage.tsx | /api/auth/callback | POST | /api/auth/callback → apps/rhythm-legacy/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-patient-ui/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-studio-ui/app/api/auth/callback/route.ts, /api/auth/callback → legacy/code/app/api/auth/callback/route.ts |
| apps/rhythm-studio-ui/app/admin/AdminLayoutClient.tsx | /api/auth/callback | POST | /api/auth/callback → apps/rhythm-legacy/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-patient-ui/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-studio-ui/app/api/auth/callback/route.ts, /api/auth/callback → legacy/code/app/api/auth/callback/route.ts |
| apps/rhythm-studio-ui/app/clinician/ClinicianLayoutClient.tsx | /api/auth/callback | POST | /api/auth/callback → apps/rhythm-legacy/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-patient-ui/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-studio-ui/app/api/auth/callback/route.ts, /api/auth/callback → legacy/code/app/api/auth/callback/route.ts |
| apps/rhythm-studio-ui/app/components/StudioLoginClient.tsx | /api/auth/callback | POST | /api/auth/callback → apps/rhythm-legacy/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-patient-ui/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-studio-ui/app/api/auth/callback/route.ts, /api/auth/callback → legacy/code/app/api/auth/callback/route.ts |
| apps/rhythm-studio-ui/app/page.tsx | /api/auth/callback | POST | /api/auth/callback → apps/rhythm-legacy/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-patient-ui/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-studio-ui/app/api/auth/callback/route.ts, /api/auth/callback → legacy/code/app/api/auth/callback/route.ts |
| legacy/code/app/page.tsx | /api/auth/callback | POST | /api/auth/callback → apps/rhythm-legacy/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-patient-ui/app/api/auth/callback/route.ts, /api/auth/callback → apps/rhythm-studio-ui/app/api/auth/callback/route.ts, /api/auth/callback → legacy/code/app/api/auth/callback/route.ts |
| apps/rhythm-legacy/app/page.tsx | /api/auth/resolve-role | GET | /api/auth/resolve-role → apps/rhythm-legacy/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → legacy/code/app/api/auth/resolve-role/route.ts |
| apps/rhythm-patient-ui/app/components/LoginPage.tsx | /api/auth/resolve-role | GET | /api/auth/resolve-role → apps/rhythm-legacy/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → legacy/code/app/api/auth/resolve-role/route.ts |
| apps/rhythm-studio-ui/app/admin/AdminLayoutClient.tsx | /api/auth/resolve-role | GET | /api/auth/resolve-role → apps/rhythm-legacy/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → legacy/code/app/api/auth/resolve-role/route.ts |
| apps/rhythm-studio-ui/app/clinician/ClinicianLayoutClient.tsx | /api/auth/resolve-role | GET | /api/auth/resolve-role → apps/rhythm-legacy/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → legacy/code/app/api/auth/resolve-role/route.ts |
| apps/rhythm-studio-ui/app/components/StudioLoginClient.tsx | /api/auth/resolve-role | GET | /api/auth/resolve-role → apps/rhythm-legacy/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → legacy/code/app/api/auth/resolve-role/route.ts |
| apps/rhythm-studio-ui/app/page.tsx | /api/auth/resolve-role | GET | /api/auth/resolve-role → apps/rhythm-legacy/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → legacy/code/app/api/auth/resolve-role/route.ts |
| legacy/code/app/page.tsx | /api/auth/resolve-role | GET | /api/auth/resolve-role → apps/rhythm-legacy/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts, /api/auth/resolve-role → legacy/code/app/api/auth/resolve-role/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/profile/ProfileClient.tsx | /api/auth/signout | GET, POST | /api/auth/signout → apps/rhythm-legacy/app/api/auth/signout/route.ts, /api/auth/signout → apps/rhythm-patient-ui/app/api/auth/signout/route.ts, /api/auth/signout → apps/rhythm-studio-ui/app/api/auth/signout/route.ts, /api/auth/signout → legacy/code/app/api/auth/signout/route.ts |
| apps/rhythm-patient-ui/app/patient/PatientLayoutClient.tsx | /api/auth/signout | GET, POST | /api/auth/signout → apps/rhythm-legacy/app/api/auth/signout/route.ts, /api/auth/signout → apps/rhythm-patient-ui/app/api/auth/signout/route.ts, /api/auth/signout → apps/rhythm-studio-ui/app/api/auth/signout/route.ts, /api/auth/signout → legacy/code/app/api/auth/signout/route.ts |
| apps/rhythm-studio-ui/app/admin/AdminLayoutClient.tsx | /api/auth/signout | GET, POST | /api/auth/signout → apps/rhythm-legacy/app/api/auth/signout/route.ts, /api/auth/signout → apps/rhythm-patient-ui/app/api/auth/signout/route.ts, /api/auth/signout → apps/rhythm-studio-ui/app/api/auth/signout/route.ts, /api/auth/signout → legacy/code/app/api/auth/signout/route.ts |
| apps/rhythm-studio-ui/app/clinician/ClinicianLayoutClient.tsx | /api/auth/signout | GET, POST | /api/auth/signout → apps/rhythm-legacy/app/api/auth/signout/route.ts, /api/auth/signout → apps/rhythm-patient-ui/app/api/auth/signout/route.ts, /api/auth/signout → apps/rhythm-studio-ui/app/api/auth/signout/route.ts, /api/auth/signout → legacy/code/app/api/auth/signout/route.ts |
| apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx | /api/clinician/anamnesis/${entryId}/archive | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx | /api/clinician/anamnesis/${selectedEntry.id}/versions | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/patient/[id]/FunnelsSection.tsx | /api/clinician/patient-funnels/${funnelId} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/patient/[id]/FunnelsSection.tsx | /api/clinician/patients/${patientId}/funnels | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/triage/page.tsx | /api/clinician/triage | GET | /api/clinician/triage → apps/rhythm-studio-ui/app/api/clinician/triage/route.ts |
| apps/rhythm-legacy/app/content/[slug]/client.tsx | /api/content-pages/${encodeURIComponent(slug)} | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/content/[slug]/client.tsx | /api/content-pages/${encodeURIComponent(slug)} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/api/content/[slug]/__tests__/route.test.ts | /api/content/test-content | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/api/content/[slug]/__tests__/route.test.ts | /api/content/nonexistent | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/api/content/[slug]/__tests__/route.test.ts | /api/content/draft-content | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/api/content/[slug]/__tests__/route.test.ts | /api/content/archived-content | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/api/content/[slug]/__tests__/route.test.ts | /api/content/deleted-content | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/api/content/[slug]/__tests__/route.test.ts | /api/content/test-slug | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/lib/api/contentApi.ts | /api/content/${slug} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/cardiovascular-age/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/createAssessment.test.ts | /api/funnels/stress-assessment/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/createAssessment.test.ts | /api/funnels/cardiovascular-age/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/createAssessment.test.ts | /api/funnels/nonexistent-funnel/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/e74-7-idempotency.test.ts | /api/funnels/stress-assessment/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/assessment-flow-v2/client.tsx | /api/funnels/${slug}/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/components/FunnelRunner.tsx | /api/funnels/${slug}/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/cardiovascular-age/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/createAssessment.test.ts | /api/funnels/stress-assessment/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/createAssessment.test.ts | /api/funnels/cardiovascular-age/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/createAssessment.test.ts | /api/funnels/nonexistent-funnel/assessments | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/getAssessment.test.ts | /api/funnels/stress-assessment/assessments/non-existent-id | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/getAssessment.test.ts | /api/funnels/stress-assessment/assessments/assessment-123 | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/getAssessment.test.ts | /api/funnels/cardiovascular-age/assessments/$%7BassessmentId%7D | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/assessment-flow-v2/client.tsx | /api/funnels/${slug}/assessments/${assessmentIdFromQuery} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/components/FunnelRunner.tsx | /api/funnels/${slug}/assessments/${assessmentId} | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/getAssessment.test.ts | /api/funnels/stress-assessment/assessments/non-existent-id | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/getAssessment.test.ts | /api/funnels/stress-assessment/assessments/assessment-123 | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/getAssessment.test.ts | /api/funnels/cardiovascular-age/assessments/$%7BassessmentId%7D | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/$%7BfunnelSlug%7D/assessments/$%7BassessmentId%7D/answers/save | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/hardening.test.ts | /api/funnels/stress/assessments/assessment-123/answers/save | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/assessment-flow-v2/client.tsx | /api/funnels/${slug}/assessments/${assessmentId}/answers/save | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/components/FunnelRunner.tsx | /api/funnels/${slug}/assessments/${runtime.assessmentId}/answers/save | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/$%7BfunnelSlug%7D/assessments/$%7BassessmentId%7D/answers/save | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/hardening.test.ts | /api/funnels/stress/assessments/assessment-123/answers/save | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/$%7BfunnelSlug%7D/assessments/$%7BassessmentId%7D/complete | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/processing-job-creation.test.ts | /api/funnels/cardiovascular-age/assessments/assessment-456/complete | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/assessment-flow-v2/client.tsx | /api/funnels/${slug}/assessments/${id}/complete | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/components/FunnelRunner.tsx | /api/funnels/${slug}/assessments/${runtime.assessmentId}/complete | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/$%7BfunnelSlug%7D/assessments/$%7BassessmentId%7D/complete | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/processing-job-creation.test.ts | /api/funnels/cardiovascular-age/assessments/assessment-456/complete | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/$%7BfunnelSlug%7D/assessments/$%7BassessmentId%7D/result | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/$%7BfunnelSlug%7D/assessments/nonexistent-id/result | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/$%7BfunnelSlug%7D/assessments/$%7BassessmentId%7D/result | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | /api/funnels/$%7BfunnelSlug%7D/assessments/nonexistent-id/result | UNKNOWN | ❌ NO MATCH IN REPO |
| lib/hooks/useAssessmentResult.ts | /api/funnels/${slug}/assessments/${assessmentId}/result | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/hardening.test.ts | /api/funnels/stress/assessments/assessment-123/steps/step-123 | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/__tests__/hardening.test.ts | /api/funnels/stress/assessments/assessment-123/steps/step-invalid | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/assessment-flow-v2/client.tsx | /api/funnels/${slug}/assessments/${assessmentId}/steps/${currentQuestion.stepId} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/components/FunnelRunner.tsx | /api/funnels/${slug}/assessments/${runtime.assessmentId}/steps/${stepId} | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/hardening.test.ts | /api/funnels/stress/assessments/assessment-123/steps/step-123 | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/__tests__/hardening.test.ts | /api/funnels/stress/assessments/assessment-123/steps/step-invalid | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/[slug]/definition/__tests__/route.test.ts | /api/funnels/cardiovascular-age/definition | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/[slug]/definition/__tests__/route.test.ts | /api/funnels/nope/definition | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/assessment-flow-v2/client.tsx | /api/funnels/${slug}/definition | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/components/FunnelRunner.tsx | /api/funnels/${slug}/definition | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/[slug]/definition/__tests__/route.test.ts | /api/funnels/cardiovascular-age/definition | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/[slug]/definition/__tests__/route.test.ts | /api/funnels/nope/definition | UNKNOWN | ❌ NO MATCH IN REPO |
| lib/funnelHelpers.ts | /api/funnels/${slug}/definition | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/catalog/__tests__/route.test.ts | /api/funnels/catalog | GET | /api/funnels/catalog → apps/rhythm-legacy/app/api/funnels/catalog/route.ts, /api/funnels/catalog → apps/rhythm-patient-ui/app/api/funnels/catalog/route.ts, /api/funnels/catalog → legacy/code/app/api/funnels/catalog/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/assess/client.tsx | /api/funnels/catalog | GET | /api/funnels/catalog → apps/rhythm-legacy/app/api/funnels/catalog/route.ts, /api/funnels/catalog → apps/rhythm-patient-ui/app/api/funnels/catalog/route.ts, /api/funnels/catalog → legacy/code/app/api/funnels/catalog/route.ts |
| legacy/code/app/api/funnels/catalog/__tests__/route.test.ts | /api/funnels/catalog | GET | /api/funnels/catalog → apps/rhythm-legacy/app/api/funnels/catalog/route.ts, /api/funnels/catalog → apps/rhythm-patient-ui/app/api/funnels/catalog/route.ts, /api/funnels/catalog → legacy/code/app/api/funnels/catalog/route.ts |
| apps/rhythm-legacy/app/api/funnels/catalog/[slug]/__tests__/route.test.ts | /api/funnels/catalog/stress | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/funnels/catalog/[slug]/__tests__/route.test.ts | /api/funnels/catalog/nonexistent | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/catalog/[slug]/__tests__/route.test.ts | /api/funnels/catalog/stress | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/funnels/catalog/[slug]/__tests__/route.test.ts | /api/funnels/catalog/nonexistent | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx | /api/mcp | GET, POST | /api/mcp → apps/rhythm-studio-ui/app/api/mcp/route.ts |
| apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx | /api/mcp/context-pack | POST | /api/mcp/context-pack → apps/rhythm-studio-ui/app/api/mcp/context-pack/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/history/PatientHistoryClient.tsx | /api/patient-measures/export | GET | /api/patient-measures/export → apps/rhythm-legacy/app/api/patient-measures/export/route.ts, /api/patient-measures/export → apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts, /api/patient-measures/export → legacy/code/app/api/patient-measures/export/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/history/PatientHistoryClient.tsx | /api/patient-measures/history | GET | /api/patient-measures/history → apps/rhythm-legacy/app/api/patient-measures/history/route.ts, /api/patient-measures/history → apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts, /api/patient-measures/history → legacy/code/app/api/patient-measures/history/route.ts |
| apps/rhythm-studio-ui/app/clinician/shipments/ShipmentCreateDialog.tsx | /api/patient-profiles | GET | /api/patient-profiles → apps/rhythm-legacy/app/api/patient-profiles/route.ts, /api/patient-profiles → apps/rhythm-studio-ui/app/api/patient-profiles/route.ts, /api/patient-profiles → legacy/code/app/api/patient-profiles/route.ts |
| apps/rhythm-studio-ui/app/clinician/tasks/TaskCreateDialog.tsx | /api/patient-profiles | GET | /api/patient-profiles → apps/rhythm-legacy/app/api/patient-profiles/route.ts, /api/patient-profiles → apps/rhythm-studio-ui/app/api/patient-profiles/route.ts, /api/patient-profiles → legacy/code/app/api/patient-profiles/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/client.tsx | /api/patient/anamnesis | GET, POST | /api/patient/anamnesis → apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/client.tsx | /api/patient/anamnesis/${entry.id} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/client.tsx | /api/patient/anamnesis/${entryId} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-patient-ui/app/patient/(mobile)/anamnese-timeline/[entryId]/detail/client.tsx | /api/patient/anamnesis/${entryId}/archive | UNKNOWN | ❌ NO MATCH IN REPO |
| lib/api/anamnesis/exportClient.ts | /api/patient/anamnesis/export.json | GET | /api/patient/anamnesis/export.json → apps/rhythm-studio-ui/app/api/patient/anamnesis/export.json/route.ts |
| apps/rhythm-studio-ui/app/clinician/processing/dev-trigger/page.tsx | /api/patient/assessments | GET | /api/patient/assessments → apps/rhythm-patient-ui/app/api/patient/assessments/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/history/PatientHistoryClient.tsx | /api/patient/assessments-with-results | GET | /api/patient/assessments-with-results → apps/rhythm-patient-ui/app/api/patient/assessments-with-results/route.ts, /api/patient/assessments-with-results → apps/rhythm-studio-ui/app/api/patient/assessments-with-results/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/profile/ProfileClient.tsx | /api/patient/assessments-with-results | GET | /api/patient/assessments-with-results → apps/rhythm-patient-ui/app/api/patient/assessments-with-results/route.ts, /api/patient/assessments-with-results → apps/rhythm-studio-ui/app/api/patient/assessments-with-results/route.ts |
| apps/rhythm-studio-ui/app/clinician/patient/[id]/page.tsx | /api/patient/assessments-with-results | GET | /api/patient/assessments-with-results → apps/rhythm-patient-ui/app/api/patient/assessments-with-results/route.ts, /api/patient/assessments-with-results → apps/rhythm-studio-ui/app/api/patient/assessments-with-results/route.ts |
| lib/hooks/useDesignTokensLoader.ts | /api/patient/design | GET | /api/patient/design → apps/rhythm-patient-ui/app/api/patient/design/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/[id]/client.tsx | /api/patient/diagnosis/runs | GET | /api/patient/diagnosis/runs → apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/client.tsx | /api/patient/diagnosis/runs | GET | /api/patient/diagnosis/runs → apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/diagnosis/[id]/client.tsx | /api/patient/diagnosis/runs/${runId}/artifact | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/page.tsx | /api/patient/onboarding-status | GET | /api/patient/onboarding-status → apps/rhythm-legacy/app/api/patient/onboarding-status/route.ts, /api/patient/onboarding-status → apps/rhythm-patient-ui/app/api/patient/onboarding-status/route.ts, /api/patient/onboarding-status → legacy/code/app/api/patient/onboarding-status/route.ts |
| apps/rhythm-patient-ui/app/components/LoginPage.tsx | /api/patient/onboarding-status | GET | /api/patient/onboarding-status → apps/rhythm-legacy/app/api/patient/onboarding-status/route.ts, /api/patient/onboarding-status → apps/rhythm-patient-ui/app/api/patient/onboarding-status/route.ts, /api/patient/onboarding-status → legacy/code/app/api/patient/onboarding-status/route.ts |
| apps/rhythm-studio-ui/app/page.tsx | /api/patient/onboarding-status | GET | /api/patient/onboarding-status → apps/rhythm-legacy/app/api/patient/onboarding-status/route.ts, /api/patient/onboarding-status → apps/rhythm-patient-ui/app/api/patient/onboarding-status/route.ts, /api/patient/onboarding-status → legacy/code/app/api/patient/onboarding-status/route.ts |
| legacy/code/app/page.tsx | /api/patient/onboarding-status | GET | /api/patient/onboarding-status → apps/rhythm-legacy/app/api/patient/onboarding-status/route.ts, /api/patient/onboarding-status → apps/rhythm-patient-ui/app/api/patient/onboarding-status/route.ts, /api/patient/onboarding-status → legacy/code/app/api/patient/onboarding-status/route.ts |
| apps/rhythm-patient-ui/app/patient/(mobile)/insights-v2/client.tsx | /api/patient/state | GET, POST | /api/patient/state → apps/rhythm-patient-ui/app/api/patient/state/route.ts |
| apps/rhythm-patient-ui/app/patient/PatientLayoutClient.tsx | /api/patient/state | GET, POST | /api/patient/state → apps/rhythm-patient-ui/app/api/patient/state/route.ts |
| apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx | /api/pre-screening-calls | GET, POST | /api/pre-screening-calls → apps/rhythm-legacy/app/api/pre-screening-calls/route.ts, /api/pre-screening-calls → apps/rhythm-studio-ui/app/api/pre-screening-calls/route.ts, /api/pre-screening-calls → legacy/code/app/api/pre-screening-calls/route.ts |
| apps/rhythm-studio-ui/app/clinician/delivery/page.tsx | /api/processing/jobs/${jobId}/download | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/processing/dev-trigger/page.tsx | /api/processing/results | POST | /api/processing/results → apps/rhythm-legacy/app/api/processing/results/route.ts, /api/processing/results → legacy/code/app/api/processing/results/route.ts |
| apps/rhythm-studio-ui/app/clinician/patient/[id]/QAReviewPanel.tsx | /api/review/${reviewId}/decide | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/patient/[id]/QAReviewPanel.tsx | /api/review/${reviewId}/details | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/review-queue/page.tsx | /api/review/queue | GET | /api/review/queue → apps/rhythm-legacy/app/api/review/queue/route.ts, /api/review/queue → apps/rhythm-studio-ui/app/api/review/queue/route.ts, /api/review/queue → legacy/code/app/api/review/queue/route.ts |
| apps/rhythm-studio-ui/app/clinician/shipments/ShipmentCreateDialog.tsx | /api/shipments | GET, POST | /api/shipments → apps/rhythm-legacy/app/api/shipments/route.ts, /api/shipments → apps/rhythm-studio-ui/app/api/shipments/route.ts, /api/shipments → legacy/code/app/api/shipments/route.ts |
| apps/rhythm-studio-ui/app/clinician/shipments/page.tsx | /api/shipments | GET, POST | /api/shipments → apps/rhythm-legacy/app/api/shipments/route.ts, /api/shipments → apps/rhythm-studio-ui/app/api/shipments/route.ts, /api/shipments → legacy/code/app/api/shipments/route.ts |
| apps/rhythm-studio-ui/app/clinician/shipments/ShipmentDetailDialog.tsx | /api/shipments/${shipment.id} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx | /api/studio/diagnosis/execute | POST | /api/studio/diagnosis/execute → apps/rhythm-studio-ui/app/api/studio/diagnosis/execute/route.ts |
| apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx | /api/studio/diagnosis/prompt | GET, POST | /api/studio/diagnosis/prompt → apps/rhythm-studio-ui/app/api/studio/diagnosis/prompt/route.ts |
| apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx | /api/studio/diagnosis/queue | POST | /api/studio/diagnosis/queue → apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts |
| apps/rhythm-studio-ui/app/clinician/patient/[id]/DiagnosisSection.tsx | /api/studio/diagnosis/queue | POST | /api/studio/diagnosis/queue → apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts |
| apps/rhythm-studio-ui/app/clinician/patient/[id]/DiagnosisSection.tsx | /api/studio/diagnosis/runs/${runId}/artifact | UNKNOWN | ❌ NO MATCH IN REPO |
| lib/api/anamnesis/exportClient.ts | /api/studio/patients/${patientId}/anamnesis/export.json | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/support-cases/page.tsx | /api/support-cases | GET, POST | /api/support-cases → apps/rhythm-legacy/app/api/support-cases/route.ts, /api/support-cases → apps/rhythm-studio-ui/app/api/support-cases/route.ts, /api/support-cases → legacy/code/app/api/support-cases/route.ts |
| apps/rhythm-studio-ui/app/clinician/support-cases/page.tsx | /api/support-cases/${caseId} | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/support-cases/page.tsx | /api/support-cases/${caseId}/escalate | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-legacy/app/api/tasks/__tests__/route.test.ts | /api/tasks | GET, POST | /api/tasks → apps/rhythm-legacy/app/api/tasks/route.ts, /api/tasks → apps/rhythm-studio-ui/app/api/tasks/route.ts, /api/tasks → legacy/code/app/api/tasks/route.ts |
| apps/rhythm-studio-ui/app/clinician/tasks/TaskCreateDialog.tsx | /api/tasks | GET, POST | /api/tasks → apps/rhythm-legacy/app/api/tasks/route.ts, /api/tasks → apps/rhythm-studio-ui/app/api/tasks/route.ts, /api/tasks → legacy/code/app/api/tasks/route.ts |
| apps/rhythm-studio-ui/app/clinician/tasks/page.tsx | /api/tasks | GET, POST | /api/tasks → apps/rhythm-legacy/app/api/tasks/route.ts, /api/tasks → apps/rhythm-studio-ui/app/api/tasks/route.ts, /api/tasks → legacy/code/app/api/tasks/route.ts |
| legacy/code/app/api/tasks/__tests__/route.test.ts | /api/tasks | GET, POST | /api/tasks → apps/rhythm-legacy/app/api/tasks/route.ts, /api/tasks → apps/rhythm-studio-ui/app/api/tasks/route.ts, /api/tasks → legacy/code/app/api/tasks/route.ts |
| apps/rhythm-legacy/app/api/tasks/[id]/__tests__/route.test.ts | /api/tasks/t1 | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/app/clinician/tasks/page.tsx | /api/tasks/${taskId} | UNKNOWN | ❌ NO MATCH IN REPO |
| legacy/code/app/api/tasks/[id]/__tests__/route.test.ts | /api/tasks/t1 | UNKNOWN | ❌ NO MATCH IN REPO |
| apps/rhythm-studio-ui/lib/fetchClinician.ts | /api/_meta/build | UNKNOWN | ❌ NO MATCH IN REPO |

## Generator Warnings

### Unknown callsites
- /api/_meta/build (fetch) @ apps/rhythm-studio-ui/lib/fetchClinician.ts#L31 raw='/api/_meta/build'

### Orphan endpoints
- /api/_meta/ping [GET] (apps/rhythm-studio-ui/app/api/_meta/ping/route.ts)
- /api/clinician/patient/[patientId]/[...probe] [(none)] (apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/[...probe]/route.ts)
- /api/clinician/patient/[patientId]/amy-insights [GET] (apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/amy-insights/route.ts)
- /api/clinician/patient/[patientId]/anamnesis [GET, POST] (apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/anamnesis/route.ts)
- /api/clinician/patient/[patientId]/diagnosis/runs [GET] (apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/diagnosis/runs/route.ts)
- /api/clinician/patient/[patientId]/results [GET] (apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/results/route.ts)
- /api/triage/fix-membership [POST] (apps/rhythm-studio-ui/app/api/triage/fix-membership/route.ts)
- /api/triage/health [GET] (apps/rhythm-studio-ui/app/api/triage/health/route.ts)

### Unknown access-rules
- /api/_meta/ping [GET] (apps/rhythm-studio-ui/app/api/_meta/ping/route.ts)

## Doc Map

| FILE | PURPOSE | LAST UPDATED | REFERENCED ENDPOINTS/URLS |
| --- | --- | --- | --- |
| .github/copilot-instructions.md | Rhythmologicum Connect - Copilot Instructions | 2025-12-09 | /api/amy/stress-report/, /api/your-endpoint/route.ts, /api/funnels/, /api/assessment-answers/save |
| .github/PULL_REQUEST_TEMPLATE.md | Beschreibung | 2026-01-28 | /api/endpoint-allowlist.json |
| CLINICIAN-NAV-UPDATE.md | Clinician/Admin Navigation Update - Follow-up to E75.3 | 2026-02-02 | /api/patient/anamnesis, /api/patient/anamnesis/[entryId], /api/patient/anamnesis/[entryId]/archive, /api/patient/anamnesis/[entryId]/versions |
| docs/ACCOUNT_DELETION_RETENTION.md | Account Deletion and Retention Workflow | 2026-01-08 | /api/account/deletion-request, /api/account/deletion-cancel, /api/admin/account/execute-deletion |
| docs/anamnesis/API_V1.md | Anamnesis API V1 | 2026-02-02 | /api/patient/anamnesis, /api/patient/anamnesis/, /api/studio, /api/studio/, /api/patient/anamnesis/[entryId], /api/patient/anamnesis/[entryId]/versions, /api/patient/anamnesis/[entryId]/archive, /api/studio/patients/[patientId]/anamnesis, /api/studio/anamnesis/[entryId]/versions, /api/studio/anamnesis/[entryId]/archive, /api/patient/anamnesis/route.ts, /api/patient/anamnesis/[entryId]/route.ts, /api/patient/anamnesis/[entryId]/versions/route.ts, /api/patient/anamnesis/[entryId]/archive/route.ts, /api/studio/patients/[patientId]/anamnesis/route.ts, /api/studio/anamnesis/[entryId]/versions/route.ts, /api/studio/anamnesis/[entryId]/archive/route.ts, /api/anamnesis/validation.ts, /api/anamnesis/helpers.ts |
| docs/anamnesis/RULES_VS_CHECKS_MATRIX.md | Anamnesis Rules vs. Checks Matrix — E75.7 | 2026-02-02 | /api/patient/anamnesis, /api/patient/anamnesis/[id] |
| docs/anamnesis/SCHEMA_V1.md | Anamnesis Schema V1 | 2026-02-02 | /api/anamnesis/validation.ts |
| docs/anamnesis/SECURITY_MODEL.md | Anamnesis Security Model | 2026-02-02 | /api/patient/anamnesis/OTHER_PATIENT_ENTRY_ID, /api/studio/patients/NON_ASSIGNED_PATIENT_ID/anamnesis, /api/studio/patients/ORG_Y_PATIENT_ID/anamnesis |
| docs/api/ENDPOINT_CATALOG.md | Endpoint Catalog | 2026-02-05 | /api/_debug/env, /api/_debug/env/route.ts, /api/_meta/ping, /api/_meta/ping/route.ts, /api/account/deletion-request, /api/account/deletion-request/route.ts, /api/admin/content-pages, /api/admin/content-pages/route.ts, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/route.ts, /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/route.ts, /api/admin/content-pages/[id]/sections/[sectionId], /api/admin/content-pages/[id]/sections/[sectionId]/route.ts, /api/admin/design-tokens, /api/admin/design-tokens/route.ts, /api/admin/dev/endpoint-catalog, /api/admin/dev/endpoint-catalog/route.ts, /api/admin/diagnostics/pillars-sot, /api/admin/diagnostics/pillars-sot/route.ts, /api/admin/funnel-step-questions/[id], /api/admin/funnel-step-questions/[id]/route.ts, /api/admin/funnel-steps, /api/admin/funnel-steps/route.ts, /api/admin/funnel-steps/[id], /api/admin/funnel-steps/[id]/route.ts, /api/admin/funnel-steps/[id]/questions, /api/admin/funnel-steps/[id]/questions/route.ts, /api/admin/funnel-steps/[id]/questions/[questionId], /api/admin/funnel-steps/[id]/questions/[questionId]/route.ts, /api/admin/funnel-versions/[id], /api/admin/funnel-versions/[id]/route.ts, /api/admin/funnel-versions/[id]/manifest, /api/admin/funnel-versions/[id]/manifest/route.ts, /api/admin/funnels, /api/admin/funnels/route.ts, /api/admin/funnels/[id], /api/admin/funnels/[id]/route.ts, /api/admin/kpi-thresholds, /api/admin/kpi-thresholds/route.ts, /api/admin/kpi-thresholds/[id], /api/admin/kpi-thresholds/[id]/route.ts, /api/admin/navigation, /api/admin/navigation/route.ts, /api/admin/navigation/[role], /api/admin/navigation/[role]/route.ts, /api/admin/notification-templates, /api/admin/notification-templates/route.ts, /api/admin/notification-templates/[id], /api/admin/notification-templates/[id]/route.ts, /api/admin/operational-settings-audit, /api/admin/operational-settings-audit/route.ts, /api/admin/pilot/flow-events, /api/admin/pilot/flow-events/route.ts, /api/admin/pilot/kpis, /api/admin/pilot/kpis/route.ts, /api/admin/reassessment-rules, /api/admin/reassessment-rules/route.ts, /api/admin/reassessment-rules/[id], /api/admin/reassessment-rules/[id]/route.ts, /api/admin/studio/funnels/[slug]/drafts, /api/admin/studio/funnels/[slug]/drafts/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId], /api/admin/studio/funnels/[slug]/drafts/[draftId]/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish, /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate, /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts, /api/admin/studio/funnels/[slug]/history, /api/admin/studio/funnels/[slug]/history/route.ts, /api/admin/usage, /api/admin/usage/route.ts, /api/amy/chat, /api/amy/chat/route.ts, /api/amy/stress-report, /api/amy/stress-report/route.ts, /api/amy/stress-summary, /api/amy/stress-summary/route.ts, /api/amy/triage, /api/amy/triage/route.ts, /api/assessment-answers/save, /api/assessment-answers/save/route.ts, /api/assessment-validation/validate-step, /api/assessment-validation/validate-step/route.ts, /api/assessments/[id]/current-step, /api/assessments/[id]/current-step/route.ts, /api/assessments/[id]/navigation, /api/assessments/[id]/navigation/route.ts, /api/assessments/[id]/resume, /api/assessments/[id]/resume/route.ts, /api/assessments/[id]/state, /api/assessments/[id]/state/route.ts, /api/assessments/in-progress, /api/assessments/in-progress/route.ts, /api/auth/callback, /api/auth/callback/route.ts, /api/auth/debug, /api/auth/debug/route.ts, /api/auth/debug-cookie, /api/auth/debug-cookie/route.ts, /api/auth/resolve-role, /api/auth/resolve-role/route.ts, /api/auth/signout, /api/auth/signout/route.ts, /api/clinician/anamnesis/[entryId]/archive, /api/clinician/anamnesis/[entryId]/archive/route.ts, /api/clinician/anamnesis/[entryId]/versions, /api/clinician/anamnesis/[entryId]/versions/route.ts, /api/clinician/assessments/[assessmentId]/details, /api/clinician/assessments/[assessmentId]/details/route.ts, /api/clinician/patient-funnels, /api/clinician/patient-funnels/route.ts, /api/clinician/patient-funnels/[id], /api/clinician/patient-funnels/[id]/route.ts, /api/clinician/patient/[patientId]/[...probe], /api/clinician/patient/[patientId]/[...probe]/route.ts, /api/clinician/patient/[patientId]/amy-insights, /api/clinician/patient/[patientId]/amy-insights/route.ts, /api/clinician/patient/[patientId]/anamnesis, /api/clinician/patient/[patientId]/anamnesis/route.ts, /api/clinician/patient/[patientId]/diagnosis/runs, /api/clinician/patient/[patientId]/diagnosis/runs/route.ts, /api/clinician/patient/[patientId]/results, /api/clinician/patient/[patientId]/results/route.ts, /api/clinician/patients/[patientId]/funnels, /api/clinician/patients/[patientId]/funnels/route.ts, /api/clinician/triage, /api/clinician/triage/route.ts, /api/consent/record, /api/consent/record/route.ts, /api/consent/status, /api/consent/status/route.ts, /api/content-pages/[slug], /api/content-pages/[slug]/route.ts, /api/content-resolver, /api/content-resolver/route.ts, /api/content/[slug], /api/content/[slug]/route.ts, /api/content/resolve, /api/content/resolve/route.ts, /api/documents/[id]/extract, /api/documents/[id]/extract/route.ts, /api/documents/[id]/status, /api/documents/[id]/status/route.ts, /api/documents/upload, /api/documents/upload/route.ts, /api/escalation/log-click, /api/escalation/log-click/route.ts, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/workup, /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts, /api/funnels/[slug]/content-pages, /api/funnels/[slug]/content-pages/route.ts, /api/funnels/[slug]/definition, /api/funnels/[slug]/definition/route.ts, /api/funnels/active, /api/funnels/active/route.ts, /api/funnels/catalog, /api/funnels/catalog/route.ts, /api/funnels/catalog/[slug], /api/funnels/catalog/[slug]/route.ts, /api/health/env, /api/health/env/route.ts, /api/mcp, /api/mcp/route.ts, /api/mcp/context-pack, /api/mcp/context-pack/route.ts, /api/me, /api/me/route.ts, /api/notifications, /api/notifications/route.ts, /api/notifications/[id], /api/notifications/[id]/route.ts, /api/patient-measures/export, /api/patient-measures/export/route.ts, /api/patient-measures/history, /api/patient-measures/history/route.ts, /api/patient-profiles, /api/patient-profiles/route.ts, /api/patient/anamnesis, /api/patient/anamnesis/route.ts, /api/patient/anamnesis/[entryId], /api/patient/anamnesis/[entryId]/route.ts, /api/patient/anamnesis/[entryId]/archive, /api/patient/anamnesis/[entryId]/archive/route.ts, /api/patient/anamnesis/[entryId]/versions, /api/patient/anamnesis/[entryId]/versions/route.ts, /api/patient/anamnesis/export.json, /api/patient/anamnesis/export.json/route.ts, /api/patient/assessments, /api/patient/assessments/route.ts, /api/patient/assessments-with-results, /api/patient/assessments-with-results/route.ts, /api/patient/dashboard, /api/patient/dashboard/route.ts, /api/patient/design, /api/patient/design/route.ts, /api/patient/diagnosis/runs, /api/patient/diagnosis/runs/route.ts, /api/patient/diagnosis/runs/[runId]/artifact, /api/patient/diagnosis/runs/[runId]/artifact/route.ts, /api/patient/onboarding-status, /api/patient/onboarding-status/route.ts, /api/patient/reports/latest, /api/patient/reports/latest/route.ts, /api/patient/state, /api/patient/state/route.ts, /api/patient/triage, /api/patient/triage/route.ts, /api/pre-screening-calls, /api/pre-screening-calls/route.ts, /api/processing/content, /api/processing/content/route.ts, /api/processing/delivery, /api/processing/delivery/route.ts, /api/processing/jobs/[jobId], /api/processing/jobs/[jobId]/route.ts, /api/processing/jobs/[jobId]/download, /api/processing/jobs/[jobId]/download/route.ts, /api/processing/pdf, /api/processing/pdf/route.ts, /api/processing/ranking, /api/processing/ranking/route.ts, /api/processing/results, /api/processing/results/route.ts, /api/processing/risk, /api/processing/risk/route.ts, /api/processing/safety, /api/processing/safety/route.ts, /api/processing/start, /api/processing/start/route.ts, /api/processing/validation, /api/processing/validation/route.ts, /api/reports/[reportId]/pdf, /api/reports/[reportId]/pdf/route.ts, /api/review/[id], /api/review/[id]/route.ts, /api/review/[id]/decide, /api/review/[id]/decide/route.ts, /api/review/[id]/details, /api/review/[id]/details/route.ts, /api/review/queue, /api/review/queue/route.ts, /api/shipments, /api/shipments/route.ts, /api/shipments/[id], /api/shipments/[id]/route.ts, /api/shipments/[id]/events, /api/shipments/[id]/events/route.ts, /api/studio/anamnesis/[entryId]/archive, /api/studio/anamnesis/[entryId]/archive/route.ts, /api/studio/anamnesis/[entryId]/versions, /api/studio/anamnesis/[entryId]/versions/route.ts, /api/studio/diagnosis/execute, /api/studio/diagnosis/execute/route.ts, /api/studio/diagnosis/prompt, /api/studio/diagnosis/prompt/route.ts, /api/studio/diagnosis/queue, /api/studio/diagnosis/queue/route.ts, /api/studio/diagnosis/runs/[runId]/artifact, /api/studio/diagnosis/runs/[runId]/artifact/route.ts, /api/studio/patients/[patientId]/anamnesis/export.json, /api/studio/patients/[patientId]/anamnesis/export.json/route.ts, /api/support-cases, /api/support-cases/route.ts, /api/support-cases/[id], /api/support-cases/[id]/route.ts, /api/support-cases/[id]/escalate, /api/support-cases/[id]/escalate/route.ts, /api/tasks, /api/tasks/route.ts, /api/tasks/[id], /api/tasks/[id]/route.ts, /api/test/correlation-id, /api/test/correlation-id/route.ts, /api/triage/fix-membership, /api/triage/fix-membership/route.ts, /api/triage/health, /api/triage/health/route.ts |
| docs/api/ENDPOINT_INVENTORY.md | Endpoint Inventory (Repo Derived) |  | /api/_debug/env, /api/_debug/env/route.ts, /api/_meta/ping, /api/_meta/ping/route.ts, /api/account/deletion-request, /api/account/deletion-request/route.ts, /api/admin/content-pages, /api/admin/content-pages/route.ts, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/route.ts, /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/route.ts, /api/admin/content-pages/[id]/sections/[sectionId], /api/admin/content-pages/[id]/sections/[sectionId]/route.ts, /api/admin/design-tokens, /api/admin/design-tokens/route.ts, /api/admin/dev/endpoint-catalog, /api/admin/dev/endpoint-catalog/route.ts, /api/admin/diagnostics/pillars-sot, /api/admin/diagnostics/pillars-sot/route.ts, /api/admin/funnel-step-questions/[id], /api/admin/funnel-step-questions/[id]/route.ts, /api/admin/funnel-steps, /api/admin/funnel-steps/route.ts, /api/admin/funnel-steps/[id], /api/admin/funnel-steps/[id]/route.ts, /api/admin/funnel-steps/[id]/questions, /api/admin/funnel-steps/[id]/questions/route.ts, /api/admin/funnel-steps/[id]/questions/[questionId], /api/admin/funnel-steps/[id]/questions/[questionId]/route.ts, /api/admin/funnel-versions/[id], /api/admin/funnel-versions/[id]/route.ts, /api/admin/funnel-versions/[id]/manifest, /api/admin/funnel-versions/[id]/manifest/route.ts, /api/admin/funnels, /api/admin/funnels/route.ts, /api/admin/funnels/[id], /api/admin/funnels/[id]/route.ts, /api/admin/kpi-thresholds, /api/admin/kpi-thresholds/route.ts, /api/admin/kpi-thresholds/[id], /api/admin/kpi-thresholds/[id]/route.ts, /api/admin/navigation, /api/admin/navigation/route.ts, /api/admin/navigation/[role], /api/admin/navigation/[role]/route.ts, /api/admin/notification-templates, /api/admin/notification-templates/route.ts, /api/admin/notification-templates/[id], /api/admin/notification-templates/[id]/route.ts, /api/admin/operational-settings-audit, /api/admin/operational-settings-audit/route.ts, /api/admin/pilot/flow-events, /api/admin/pilot/flow-events/route.ts, /api/admin/pilot/kpis, /api/admin/pilot/kpis/route.ts, /api/admin/reassessment-rules, /api/admin/reassessment-rules/route.ts, /api/admin/reassessment-rules/[id], /api/admin/reassessment-rules/[id]/route.ts, /api/admin/studio/funnels/[slug]/drafts, /api/admin/studio/funnels/[slug]/drafts/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId], /api/admin/studio/funnels/[slug]/drafts/[draftId]/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish, /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate, /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts, /api/admin/studio/funnels/[slug]/history, /api/admin/studio/funnels/[slug]/history/route.ts, /api/admin/usage, /api/admin/usage/route.ts, /api/amy/chat, /api/amy/chat/route.ts, /api/amy/stress-report, /api/amy/stress-report/route.ts, /api/amy/stress-summary, /api/amy/stress-summary/route.ts, /api/amy/triage, /api/amy/triage/route.ts, /api/assessment-answers/save, /api/assessment-answers/save/route.ts, /api/assessment-validation/validate-step, /api/assessment-validation/validate-step/route.ts, /api/assessments/[id]/current-step, /api/assessments/[id]/current-step/route.ts, /api/assessments/[id]/navigation, /api/assessments/[id]/navigation/route.ts, /api/assessments/[id]/resume, /api/assessments/[id]/resume/route.ts, /api/assessments/[id]/state, /api/assessments/[id]/state/route.ts, /api/assessments/in-progress, /api/assessments/in-progress/route.ts, /api/auth/callback, /api/auth/callback/route.ts, /api/auth/debug, /api/auth/debug/route.ts, /api/auth/debug-cookie, /api/auth/debug-cookie/route.ts, /api/auth/resolve-role, /api/auth/resolve-role/route.ts, /api/auth/signout, /api/auth/signout/route.ts, /api/clinician/anamnesis/[entryId]/archive, /api/clinician/anamnesis/[entryId]/archive/route.ts, /api/clinician/anamnesis/[entryId]/versions, /api/clinician/anamnesis/[entryId]/versions/route.ts, /api/clinician/assessments/[assessmentId]/details, /api/clinician/assessments/[assessmentId]/details/route.ts, /api/clinician/patient-funnels, /api/clinician/patient-funnels/route.ts, /api/clinician/patient-funnels/[id], /api/clinician/patient-funnels/[id]/route.ts, /api/clinician/patient/[patientId]/[...probe], /api/clinician/patient/[patientId]/[...probe]/route.ts, /api/clinician/patient/[patientId]/amy-insights, /api/clinician/patient/[patientId]/amy-insights/route.ts, /api/clinician/patient/[patientId]/anamnesis, /api/clinician/patient/[patientId]/anamnesis/route.ts, /api/clinician/patient/[patientId]/diagnosis/runs, /api/clinician/patient/[patientId]/diagnosis/runs/route.ts, /api/clinician/patient/[patientId]/results, /api/clinician/patient/[patientId]/results/route.ts, /api/clinician/patients/[patientId]/funnels, /api/clinician/patients/[patientId]/funnels/route.ts, /api/clinician/triage, /api/clinician/triage/route.ts, /api/consent/record, /api/consent/record/route.ts, /api/consent/status, /api/consent/status/route.ts, /api/content-pages/[slug], /api/content-pages/[slug]/route.ts, /api/content-resolver, /api/content-resolver/route.ts, /api/content/[slug], /api/content/[slug]/route.ts, /api/content/resolve, /api/content/resolve/route.ts, /api/documents/[id]/extract, /api/documents/[id]/extract/route.ts, /api/documents/[id]/status, /api/documents/[id]/status/route.ts, /api/documents/upload, /api/documents/upload/route.ts, /api/escalation/log-click, /api/escalation/log-click/route.ts, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/workup, /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts, /api/funnels/[slug]/content-pages, /api/funnels/[slug]/content-pages/route.ts, /api/funnels/[slug]/definition, /api/funnels/[slug]/definition/route.ts, /api/funnels/active, /api/funnels/active/route.ts, /api/funnels/catalog, /api/funnels/catalog/route.ts, /api/funnels/catalog/[slug], /api/funnels/catalog/[slug]/route.ts, /api/health/env, /api/health/env/route.ts, /api/mcp, /api/mcp/route.ts, /api/mcp/context-pack, /api/mcp/context-pack/route.ts, /api/me, /api/me/route.ts, /api/notifications, /api/notifications/route.ts, /api/notifications/[id], /api/notifications/[id]/route.ts, /api/patient-measures/export, /api/patient-measures/export/route.ts, /api/patient-measures/history, /api/patient-measures/history/route.ts, /api/patient-profiles, /api/patient-profiles/route.ts, /api/patient/anamnesis, /api/patient/anamnesis/route.ts, /api/patient/anamnesis/[entryId], /api/patient/anamnesis/[entryId]/route.ts, /api/patient/anamnesis/[entryId]/archive, /api/patient/anamnesis/[entryId]/archive/route.ts, /api/patient/anamnesis/[entryId]/versions, /api/patient/anamnesis/[entryId]/versions/route.ts, /api/patient/anamnesis/export.json, /api/patient/anamnesis/export.json/route.ts, /api/patient/assessments, /api/patient/assessments/route.ts, /api/patient/assessments-with-results, /api/patient/assessments-with-results/route.ts, /api/patient/dashboard, /api/patient/dashboard/route.ts, /api/patient/design, /api/patient/design/route.ts, /api/patient/diagnosis/runs, /api/patient/diagnosis/runs/route.ts, /api/patient/diagnosis/runs/[runId]/artifact, /api/patient/diagnosis/runs/[runId]/artifact/route.ts, /api/patient/onboarding-status, /api/patient/onboarding-status/route.ts, /api/patient/reports/latest, /api/patient/reports/latest/route.ts, /api/patient/state, /api/patient/state/route.ts, /api/patient/triage, /api/patient/triage/route.ts, /api/pre-screening-calls, /api/pre-screening-calls/route.ts, /api/processing/content, /api/processing/content/route.ts, /api/processing/delivery, /api/processing/delivery/route.ts, /api/processing/jobs/[jobId], /api/processing/jobs/[jobId]/route.ts, /api/processing/jobs/[jobId]/download, /api/processing/jobs/[jobId]/download/route.ts, /api/processing/pdf, /api/processing/pdf/route.ts, /api/processing/ranking, /api/processing/ranking/route.ts, /api/processing/results, /api/processing/results/route.ts, /api/processing/risk, /api/processing/risk/route.ts, /api/processing/safety, /api/processing/safety/route.ts, /api/processing/start, /api/processing/start/route.ts, /api/processing/validation, /api/processing/validation/route.ts, /api/reports/[reportId]/pdf, /api/reports/[reportId]/pdf/route.ts, /api/review/[id], /api/review/[id]/route.ts, /api/review/[id]/decide, /api/review/[id]/decide/route.ts, /api/review/[id]/details, /api/review/[id]/details/route.ts, /api/review/queue, /api/review/queue/route.ts, /api/shipments, /api/shipments/route.ts, /api/shipments/[id], /api/shipments/[id]/route.ts, /api/shipments/[id]/events, /api/shipments/[id]/events/route.ts, /api/studio/anamnesis/[entryId]/archive, /api/studio/anamnesis/[entryId]/archive/route.ts, /api/studio/anamnesis/[entryId]/versions, /api/studio/anamnesis/[entryId]/versions/route.ts, /api/studio/diagnosis/execute, /api/studio/diagnosis/execute/route.ts, /api/studio/diagnosis/prompt, /api/studio/diagnosis/prompt/route.ts, /api/studio/diagnosis/queue, /api/studio/diagnosis/queue/route.ts, /api/studio/diagnosis/runs/[runId]/artifact, /api/studio/diagnosis/runs/[runId]/artifact/route.ts, /api/studio/patients/[patientId]/anamnesis/export.json, /api/studio/patients/[patientId]/anamnesis/export.json/route.ts, /api/support-cases, /api/support-cases/route.ts, /api/support-cases/[id], /api/support-cases/[id]/route.ts, /api/support-cases/[id]/escalate, /api/support-cases/[id]/escalate/route.ts, /api/tasks, /api/tasks/route.ts, /api/tasks/[id], /api/tasks/[id]/route.ts, /api/test/correlation-id, /api/test/correlation-id/route.ts, /api/triage/fix-membership, /api/triage/fix-membership/route.ts, /api/triage/health, /api/triage/health/route.ts, /api/admin/content-pages/, /api/admin/funnel-step-questions/, /api/admin/funnel-steps/, /api/admin/funnel-versions/[id]/__tests__/route.test.ts, /api/admin/funnel-versions/not-a-uuid, /api/admin/funnel-versions/550e8400-e29b-41d4-a716-446655440000, /api/admin/funnel-versions/, /api/admin/funnels/__tests__/route.test.ts, /api/admin/funnels/[id]/__tests__/route.test.ts, /api/admin/funnels/stress-assessment, /api/admin/funnels/nonexistent, /api/admin/funnels/, /api/admin/funnels/test-funnel, /api/admin/funnels/test, /api/admin/kpi-thresholds/, /api/admin/navigation/, /api/admin/notification-templates/, /api/admin/reassessment-rules/, /api/assessments/, /api/assessmentPersistence.ts, /api/clinician/anamnesis/, /api/clinician/patient-funnels/, /api/clinician/patients/, /api/content-pages/, /api/content/[slug]/__tests__/route.test.ts, /api/content/test-content, /api/content/nonexistent, /api/content/draft-content, /api/content/archived-content, /api/content/deleted-content, /api/content/test-slug, /api/contentApi.ts, /api/content/, /api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts, /api/funnels/cardiovascular-age/assessments, /api/funnels/__tests__/createAssessment.test.ts, /api/funnels/stress-assessment/assessments, /api/funnels/nonexistent-funnel/assessments, /api/funnels/__tests__/e74-7-idempotency.test.ts, /api/funnels/, /api/funnels/__tests__/getAssessment.test.ts, /api/funnels/stress-assessment/assessments/non-existent-id, /api/funnels/stress-assessment/assessments/assessment-123, /api/funnels/cardiovascular-age/assessments/, /api/funnels/__tests__/hardening.test.ts, /api/funnels/stress/assessments/assessment-123/answers/save, /api/funnels/__tests__/processing-job-creation.test.ts, /api/funnels/cardiovascular-age/assessments/assessment-456/complete, /api/funnels/stress/assessments/assessment-123/steps/step-123, /api/funnels/stress/assessments/assessment-123/steps/step-invalid, /api/funnels/[slug]/definition/__tests__/route.test.ts, /api/funnels/cardiovascular-age/definition, /api/funnels/nope/definition, /api/funnels/catalog/__tests__/route.test.ts, /api/funnels/catalog/[slug]/__tests__/route.test.ts, /api/funnels/catalog/stress, /api/funnels/catalog/nonexistent, /api/patient/anamnesis/, /api/anamnesis/exportClient.ts, /api/patient/diagnosis/runs/, /api/processing/jobs/, /api/review/, /api/shipments/, /api/studio/diagnosis/runs/, /api/studio/patients/, /api/support-cases/, /api/tasks/__tests__/route.test.ts, /api/tasks/[id]/__tests__/route.test.ts, /api/tasks/t1, /api/tasks/, /api/_meta/build, /api/ENDPOINT_CATALOG.md, /api/route/path, /api/funnels/.../steps/.../route, /api/content-resolver/route, /api/[route]/route.ts, /api/studio, /api/studio/, /api/studio/patients/[patientId]/anamnesis, /api/studio/patients/[patientId]/anamnesis/route.ts, /api/anamnesis/validation.ts, /api/anamnesis/helpers.ts, /api/account/deletion-cancel, /api/admin/account/execute-deletion, /api/endpoint-allowlist.json |
| docs/api/ORPHAN_ENDPOINTS.md | Orphan Endpoints | 2026-01-18 | /api/_meta/ping, /api/_meta/ping/route.ts, /api/clinician/patient/[patientId]/[...probe], /api/clinician/patient/[patientId]/[...probe]/route.ts, /api/clinician/patient/[patientId]/amy-insights, /api/clinician/patient/[patientId]/amy-insights/route.ts, /api/clinician/patient/[patientId]/anamnesis, /api/clinician/patient/[patientId]/anamnesis/route.ts, /api/clinician/patient/[patientId]/diagnosis/runs, /api/clinician/patient/[patientId]/diagnosis/runs/route.ts, /api/clinician/patient/[patientId]/results, /api/clinician/patient/[patientId]/results/route.ts, /api/triage/fix-membership, /api/triage/fix-membership/route.ts, /api/triage/health, /api/triage/health/route.ts |
| docs/api/UNKNOWN_ACCESS_ENDPOINTS.md | Unknown Access Role Endpoints | 2026-01-18 | /api/_meta/ping, /api/_meta/ping/route.ts |
| docs/api/UNKNOWN_CALLSITES.md | Unknown API Callsites | 2026-01-11 | /api/_meta/build |
| docs/API_ROUTE_OWNERSHIP.md | API Route Ownership Registry | 2026-01-02 | /api/route/path, /api/admin/usage, /api/admin/funnels, /api/admin/funnels/[id], /api/admin/funnel-steps, /api/admin/funnel-steps/[id], /api/admin/funnel-step-questions/[id], /api/admin/content-pages, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/[sectionId], /api/admin/diagnostics/pillars-sot, /api/funnels/active, /api/funnels/catalog, /api/funnels/catalog/[slug], /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/assessment-answers/save, /api/funnels/[slug]/content-pages, /api/funnels/[slug]/definition, /api/assessment-validation/validate-step, /api/funnels/.../steps/.../route, /api/assessments/[id]/current-step, /api/assessments/[id]/navigation, /api/assessments/[id]/resume, /api/amy/stress-report, /api/amy/stress-summary, /api/consent/record, /api/consent/status, /api/content-pages/[slug], /api/content-resolver/route, /api/content/resolve, /api/content-resolver, /api/patient-measures/history, /api/patient-measures/export, /api/auth/callback, /api/[route]/route.ts |
| docs/audit/V061_WIRING_AUDIT.md | V061-I05: Evidence-locked Wiring Audit | 2026-01-20 | /api/admin/funnels, /api/admin/funnels/route.ts, /api/admin/funnels/[id], /api/admin/funnels/[id]/route.ts, /api/admin/reassessment-rules, /api/admin/reassessment-rules/route.ts, /api/admin/reassessment-rules/[id], /api/admin/reassessment-rules/[id]/route.ts, /api/admin/usage, /api/admin/usage/route.ts, /api/admin/kpi-thresholds, /api/admin/kpi-thresholds/route.ts, /api/admin/kpi-thresholds/[id], /api/admin/kpi-thresholds/[id]/route.ts, /api/admin/content-pages, /api/admin/content-pages/route.ts, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/route.ts, /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/route.ts, /api/admin/content-pages/[id]/sections/[sectionId], /api/admin/content-pages/[id]/sections/[sectionId]/route.ts, /api/admin/pilot/kpis, /api/admin/pilot/kpis/route.ts, /api/admin/pilot/flow-events, /api/admin/pilot/flow-events/route.ts, /api/admin/funnel-steps, /api/admin/funnel-steps/route.ts, /api/admin/funnel-steps/[id], /api/admin/funnel-steps/[id]/route.ts, /api/admin/diagnostics/pillars-sot, /api/admin/diagnostics/pillars-sot/route.ts, /api/admin/dev/endpoint-catalog, /api/admin/dev/endpoint-catalog/route.ts, /api/admin/navigation, /api/admin/navigation/route.ts, /api/admin/navigation/[role], /api/admin/navigation/[role]/route.ts, /api/admin/funnel-versions/[id], /api/admin/funnel-versions/[id]/route.ts, /api/admin/funnel-versions/[id]/manifest, /api/admin/funnel-versions/[id]/manifest/route.ts, /api/admin/funnel-step-questions/[id], /api/admin/funnel-step-questions/[id]/route.ts, /api/admin/design-tokens, /api/admin/design-tokens/route.ts, /api/admin/operational-settings-audit, /api/admin/operational-settings-audit/route.ts, /api/admin/notification-templates, /api/admin/notification-templates/route.ts, /api/admin/notification-templates/[id], /api/admin/notification-templates/[id]/route.ts, /api/health/env, /api/health/env/route.ts, /api/patient-profiles, /api/patient-profiles/route.ts, /api/patient/dashboard, /api/patient/dashboard/route.ts, /api/patient/triage, /api/patient/triage/route.ts, /api/patient/onboarding-status, /api/patient/onboarding-status/route.ts, /api/support-cases, /api/support-cases/route.ts, /api/support-cases/[id]/escalate, /api/support-cases/[id]/escalate/route.ts, /api/support-cases/[id], /api/support-cases/[id]/route.ts, /api/funnels/active, /api/funnels/active/route.ts, /api/funnels/[slug]/content-pages, /api/funnels/[slug]/content-pages/route.ts, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/workup, /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts, /api/funnels/[slug]/definition, /api/funnels/[slug]/definition/route.ts, /api/funnels/catalog, /api/funnels/catalog/route.ts, /api/funnels/catalog/[slug], /api/funnels/catalog/[slug]/route.ts, /api/pre-screening-calls, /api/pre-screening-calls/route.ts, /api/documents/upload, /api/documents/upload/route.ts, /api/documents/[id]/extract, /api/documents/[id]/extract/route.ts, /api/documents/[id]/status, /api/documents/[id]/status/route.ts, /api/auth/signout, /api/auth/signout/route.ts, /api/auth/resolve-role, /api/auth/resolve-role/route.ts, /api/auth/callback, /api/auth/callback/route.ts, /api/auth/debug, /api/auth/debug/route.ts, /api/auth/debug-cookie, /api/auth/debug-cookie/route.ts, /api/admin/notification-templates/, /api/admin/reassessment-rules/, /api/admin/kpi-thresholds/, /api/admin/content-pages/, /api/admin/navigation/, /api/support-cases/, /api/admin/funnels/, /api/admin/funnel-versions/, /api/admin/funnel-steps/, /api/admin/funnel-step-questions/, /api/tasks, /api/tasks/, /api/review/queue, /api/shipments, /api/processing/jobs/, /api/notifications, /api/notifications/route.ts, /api/notifications/[id], /api/notifications/[id]/route.ts, /api/reports/[reportId]/pdf, /api/reports/[reportId]/pdf/route.ts, /api/content-pages/[slug], /api/content-pages/[slug]/route.ts, /api/assessment-validation/validate-step, /api/assessment-validation/validate-step/route.ts, /api/assessment-answers/save, /api/assessment-answers/save/route.ts, /api/shipments/[id]/events, /api/shipments/[id]/events/route.ts, /api/shipments/[id], /api/shipments/[id]/route.ts, /api/amy/triage, /api/amy/triage/route.ts, /api/amy/stress-report, /api/amy/stress-report/route.ts, /api/amy/stress-summary, /api/amy/stress-summary/route.ts, /api/processing/pdf, /api/processing/pdf/route.ts, /api/processing/safety, /api/processing/safety/route.ts, /api/processing/ranking, /api/processing/ranking/route.ts, /api/processing/jobs/[jobId], /api/processing/jobs/[jobId]/route.ts, /api/processing/content, /api/processing/content/route.ts, /api/processing/start, /api/processing/start/route.ts, /api/processing/delivery, /api/processing/delivery/route.ts, /api/processing/risk, /api/processing/risk/route.ts, /api/processing/validation, /api/processing/validation/route.ts, /api/content-resolver, /api/content-resolver/route.ts, /api/content/resolve, /api/content/resolve/route.ts, /api/assessments/in-progress, /api/assessments/in-progress/route.ts, /api/assessments/[id]/current-step, /api/assessments/[id]/current-step/route.ts, /api/assessments/[id]/resume, /api/assessments/[id]/resume/route.ts, /api/assessments/[id]/navigation, /api/assessments/[id]/navigation/route.ts, /api/test/correlation-id, /api/test/correlation-id/route.ts, /api/review/[id]/decide, /api/review/[id]/decide/route.ts, /api/review/[id]/details, /api/review/[id]/details/route.ts, /api/escalation/log-click, /api/escalation/log-click/route.ts, /api/consent/record, /api/consent/record/route.ts, /api/consent/status, /api/consent/status/route.ts, /api/account/deletion-request, /api/account/deletion-request/route.ts, /api/patient-measures/export, /api/patient-measures/export/route.ts, /api/patient-measures/history, /api/patient-measures/history/route.ts, /api/... |
| docs/audit/V06_DELTA_REPORT.md | V0.6 Delta Report | 2026-01-20 | /api/patient/triage, /api/contracts/patient/__tests__/triage.test.ts, /api/patient/triage/route.ts, /api/patient/triage/__tests__/route.test.ts, /api/endpoint-catalog.json, /api/contracts/triage/index.ts, /api/contracts/triage/__tests__/index.test.ts, /api/amy/triage/route.ts, /api/patient/dashboard/route.ts, /api/contracts/patient/dashboard.ts, /api/admin/pilot/kpis/route.ts, /api/admin/pilot/kpis, /api/patient-measures/export/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/patient/onboarding-status/route.ts |
| docs/audit/V06_FUNNEL_POC_PROOF.md | V0.6 Funnel POC Proof — cardiovascular-age | 2026-01-17 | /api/funnels/cardiovascular-age/assessments, /api/funnels/cardiovascular-age/definition, /api/funnels/cardiovascular-age/assessments/, /api/contracts/patient/assessments.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/definition/route.ts |
| docs/audit/V06_TEST_MATRIX.md | v0.6 Test Matrix | 2026-01-20 | /api/endpoint-allowlist.json, /api/patient/dashboard |
| docs/canon/CONTRACTS.md | API and Component Contracts | 2026-01-25 | /api/responses.ts, /api/responseTypes.ts, /api/responses, /api/responseTypes, /api/funnels/, /api/assessment-answers/save, /api/funnels/catalog, /api/admin/funnels |
| docs/canon/DB_ACCESS_DECISION.md | DB Access Decision: Canonical Patterns | 2026-02-05 | /api/admin/funnels/route.ts, /api/funnels/catalog/route.ts, /api/mcp/context-pack/route.ts, /api/studio/diagnosis/execute/route.ts, /api/studio/diagnosis/queue/route.ts, /api/triage/fix-membership/route.ts, /api/triage/health/route.ts |
| docs/canon/DB_ACCESS_EVIDENCE.md | DB Access Standardization - Verification Evidence | 2026-01-01 | /api/admin/content-pages/[id]/route.ts, /api/admin/funnel-step-questions/[id]/route.ts, /api/admin/funnel-steps/[id]/route.ts, /api/admin/funnel-steps/route.ts, /api/admin/funnels/[id]/route.ts, /api/admin/funnels/route.ts, /api/amy/stress-report/route.ts, /api/content-pages/[slug]/route.ts, /api/funnels/[slug]/content-pages/route.ts, /api/funnels/catalog/route.ts, /api/patient-measures/export/route.ts, /api/patient-measures/history/route.ts, /api/funnels/catalog |
| docs/canon/DB_ACCESS_GUARDRAILS.md | DB Access Guardrails | 2026-01-01 | /api/admin/funnels/route.ts |
| docs/canon/DB_ACCESS_IMPLEMENTATION.md | DB Access Pattern Standardization - Implementation Summary | 2026-01-01 | /api/funnels/catalog/route.ts, /api/admin/funnels/, /api/admin/content-pages/, /api/admin/funnel-steps/, /api/funnels/[slug]/assessments/, /api/assessments/, /api/assessment-answers/, /api/authHelpers.ts |
| docs/canon/DB_ACCESS_MATRIX.md | DB Access Matrix | 2026-01-02 | /api/admin/content-pages/[id]/route.ts, /api/admin/content-pages/[id]/sections/[sectionId]/route.ts, /api/admin/content-pages/[id]/sections/route.ts, /api/admin/content-pages/route.ts, /api/admin/funnel-step-questions/[id]/route.ts, /api/admin/funnel-steps/[id]/route.ts, /api/admin/funnel-steps/route.ts, /api/admin/funnels/[id]/route.ts, /api/admin/funnels/route.ts, /api/amy/stress-report/route.ts, /api/assessment-answers/save/route.ts, /api/assessment-validation/validate-step/route.ts, /api/assessments/[id]/current-step/route.ts, /api/assessments/[id]/navigation/route.ts, /api/assessments/[id]/resume/route.ts, /api/auth/callback/route.ts, /api/consent/record/route.ts, /api/consent/status/route.ts, /api/content-pages/[slug]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/content-pages/route.ts, /api/funnels/[slug]/definition/route.ts, /api/funnels/active/route.ts, /api/funnels/catalog/[slug]/route.ts, /api/funnels/catalog/route.ts, /api/patient-measures/export/route.ts, /api/patient-measures/history/route.ts |
| docs/canon/DB_ACCESS_PATTERNS.md | DB Access Pattern Audit Report | 2026-01-02 | /api/auth/callback/route.ts |
| docs/canon/GLOSSARY.md | Project Glossary | 2025-12-30 | /api/funnels/ |
| docs/canon/PILOT_SPINE.md | PILOT_SPINE (v0.7 POC) | 2026-01-20 | /api/funnels/, /api/content/resolve, /api/health/env, /api/health, /api/ready, /api/funnels/cardiovascular-age/assessments, /api/funnels/cardiovascular-age/assessments/ |
| docs/CLEANUP_AUDIT_README.md | TV05-CLEANUP & AUDIT — Repository Cleanup Audit | 2026-01-02 | /api/amy/, /api/consent/, /api/amy/stress-report, /api/admin/usage |
| docs/CONTENT_SAFETY_OPS_SOP.md | Content Safety Operations - Standard Operating Procedure (SOP) | 2026-01-08 | /api/review/queue, /api/review/ |
| docs/DEPLOYMENT_VERIFICATION.md | Deployment Verification Guide | 2026-01-10 | /api/content/resolve, /api/funnels/[slug]/content-pages, /api/funnels/stress-assessment/content-pages |
| docs/DESIGN_TOKEN_OVERRIDE_GUIDE.md | Design Token Override System - Migration Guide | 2026-01-07 | /api/admin/design-tokens |
| docs/dev/triage_test_inputs_v1.md | Triage Test Inputs v1 — Deterministic Canned Examples | 2026-01-16 | /api/contracts/triage, /api/contracts/triage/index.ts |
| docs/dev/VERCEL_PROJECTS.md | Vercel Projects | 2026-01-19 | /api/test/correlation-id, /api/health/env |
| docs/dev/VERIFY_ENDPOINTS.md | Verify Endpoints (Endpoint Catalog Gate) | 2026-01-11 | /api/endpoint-allowlist.json |
| docs/DOCUMENT_EXTRACTION.md | Document Extraction Pipeline (V05-I04.2) | 2026-01-03 | /api/documents/[id]/extract, /api/documents/, /api/documents/[id]/extract/route.ts |
| docs/DOCUMENT_UPLOAD.md | Document Upload Feature (V05-I04.1) | 2026-01-03 | /api/documents/upload, /api/documents/[id]/status, /api/documents/doc-uuid/status, /api/documents/doc-id/status, /api/documents/upload/route.ts, /api/documents/[id]/status/route.ts |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | E6.2.3 Implementation Summary | 2026-01-20 | /api/contracts/patient/, /api/contracts/patient/assessments.ts, /api/contracts/patient/index.ts, /api/contracts/patient/__tests__/assessments.test.ts, /api/funnels/, /api/responses.ts, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts, /api/contracts/patient, /api/funnels/stress/assessments |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | E6.2.6 Implementation Summary | 2026-01-20 | /api/responseTypes.ts, /api/authHelpers.ts, /api/responses.ts, /api/auth/resolve-role, /api/auth/callback, /api/patient/onboarding-status, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/authHelpers, /api/auth/resolve-role/route.ts, /api/auth/callback/route.ts, /api/patient/onboarding-status/route.ts, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/__tests__/sessionExpiry.test.ts, /api/auth/resolve-role/__tests__/route.test.ts |
| docs/e6/E6_2_7_IMPLEMENTATION_SUMMARY.md | E6.2.7 Implementation Summary | 2026-01-20 | /api/caching.ts, /api/funnels/catalog/route.ts, /api/__tests__/caching.test.ts, /api/funnels/catalog/__tests__/route.test.ts, /api/funnels/catalog, /api/caching, /api/funnels/catalog/[slug], /api/funnels/[slug]/definition, /api/patient-measures/history |
| docs/e6/E6_2_8_IMPLEMENTATION_SUMMARY.md | E6.2.8 Implementation Summary | 2026-01-20 | /api/responseTypes.ts, /api/responses.ts, /api/__tests__/responses.test.ts, /api/test/correlation-id/route.ts, /api/test/correlation-id, /api/funnels/catalog, /api/funnels/stress/assessments |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | E6.4.1 Implementation Summary | 2026-01-20 | /api/responseTypes.ts, /api/responses.ts, /api/pilotEligibility.ts, /api/authHelpers.ts, /api/patient/dashboard/route.ts, /api/pilotEligibility, /api/__tests__/pilotEligibility.test.ts, /api/__tests__/authOrdering.test.ts, /api/patient/dashboard/__tests__/route.test.ts, /api/patient/dashboard, /api/authHelpers |
| docs/e6/E6_4_2_IMPLEMENTATION_SUMMARY.md | E6.4.2 — Patient Onboarding Happy Path | 2026-01-20 | /api/assessments/in-progress, /api/patient/onboarding-status/route.ts, /api/assessments/in-progress/route.ts, /api/patient/onboarding-status/__tests__/route.test.ts, /api/assessments/in-progress/__tests__/route.test.ts, /api/patient/onboarding-status |
| docs/e6/E6_4_3_FUNNEL_ENDPOINTS.md | E6.4.3 — Funnel API Endpoints Catalog | 2026-01-20 | /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/assessments/[assessmentId]/workup, /api/funnels/catalog, /api/funnels/active, /api/funnels/[slug]/definition, /api/funnels/[slug]/content-pages, /api/assessments/in-progress, /api/funnels/catalog/[slug], /api/admin/funnels, /api/funnels/[slug]/assessments/[id]/answers/save, /api/funnels/[slug]/assessments/[id]/steps/[stepId], /api/funnels/[slug]/assessments/[id]/complete, /api/funnels/[slug]/assessments/[id]/workup, /api/funnels/[slug]/assessments/[id]/result |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | E6.4.3 — Patient Flow Wiring Completion (Pilot Funnels) | 2026-01-20 | /api/assessments/in-progress, /api/funnels/[slug]/assessments/[id], /api/assessments/in-progress/route.ts, /api/funnels/[slug]/assessments/[id]/complete, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[id]/steps/[stepId], /api/funnels/[slug]/assessments/[id]/answers/save, /api/funnels/[slug]/assessments/[id]/result, /api/funnels/catalog, /api/funnels/[slug]/definition, /api/funnels/[slug]/content-pages, /api/funnels/active, /api/funnels/stress/assessments, /api/funnels/stress/assessments/ |
| docs/e6/E6_4_3_VERIFICATION_GUIDE.md | E6.4.3 — Manual Verification Guide | 2026-01-20 | /api/funnels/stress/assessments/[id]/answers/save, /api/funnels/stress/assessments/[id]/steps/[stepId], /api/funnels/stress/assessments/[id]/complete, /api/assessments/in-progress, /api/funnels/stress/assessments, /api/funnels/stress/assessments/, /api/funnels/[slug]/assessments/__tests__/ |
| docs/e6/E6_4_5_IMPLEMENTATION_SUMMARY.md | E6.4.5 — Workup Stub Implementation Summary | 2026-01-20 | /api/funnels/[slug]/assessments/[assessmentId]/workup, /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts |
| docs/e6/E6_4_6_IMPLEMENTATION_SUMMARY.md | E6.4.6 — Escalation Offer Stub Implementation Summary | 2026-01-20 | /api/escalation/log-click/route.ts, /api/escalation/log-click |
| docs/e6/E6_4_6_VERIFICATION_CHECKLIST.md | E6.4.6 — Escalation Offer Stub Verification Checklist | 2026-01-20 | /api/escalation, /api/escalation/log-click |
| docs/e6/E6_4_7_IMPLEMENTATION_SUMMARY.md | E6.4.7 Implementation Summary | 2026-01-20 | /api/patient/dashboard, /api/funnels/[slug]/assessments/[assessmentId]/workup, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/assessments/in-progress, /api/funnels/[slug]/assessments/[id], /api/funnels/[slug]/assessments/[id]/complete, /api/funnels/[slug]/assessments/[id]/workup, /api/health/env |
| docs/e6/E6_4_8_IMPLEMENTATION_SUMMARY.md | E6.4.8 Implementation Summary | 2026-01-20 | /api/patient-measures/export/route.ts, /api/reports/[reportId]/pdf/route.ts, /api/patient-measures/export, /api/reports/VALID_REPORT_ID/pdf, /api/reports/00000000-0000-0000-0000-000000000000/pdf, /api/responses.ts |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | E6.4.8 Implementation Summary | 2026-01-20 | /api/responses.ts, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts, /api/amy/stress-report/route.ts, /api/escalation/log-click/route.ts, /api/admin/pilot/flow-events/route.ts, /api/admin/pilot/flow-events, /api/funnels/stress/assessments, /api/funnels/stress/assessments/, /api/admin/content-pages/[id]/sections/route.ts |
| docs/e6/E6_4_9_IMPLEMENTATION_SUMMARY.md | E6.4.9 Implementation Summary | 2026-01-20 | /api/admin/pilot/kpis/route.ts, /api/admin/pilot/kpis, /api/ENDPOINT_CATALOG.md, /api/endpoint-allowlist.json, /api/admin/pilot/flow-events, /api/admin/usage |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | E6.5.10 Implementation Summary | 2026-01-20 | /api/contracts/patient/__tests__/dashboard.test.ts, /api/patient/dashboard/__tests__/route.test.ts, /api/ENDPOINT_CATALOG.md, /api/endpoint-catalog.json, /api/authHelpers, /api/patient/dashboard/, /api/contracts/patient/dashboard.ts, /api/responses.ts, /api/authHelpers.ts |
| docs/e6/E6_5_2_IMPLEMENTATION_SUMMARY.md | E6.5.2 Implementation Summary | 2026-01-20 | /api/contracts/patient/dashboard.ts, /api/patient/dashboard/route.ts, /api/contracts/patient/__tests__/dashboard.test.ts, /api/patient/dashboard/__tests__/route.test.ts, /api/contracts/patient/index.ts, /api/responses.ts, /api/patient/dashboard, /api/contracts/patient/__tests__/, /api/ENDPOINT_CATALOG.md |
| docs/e6/E6_5_2_VERIFICATION_GUIDE.md | E6.5.2 Verification Guide | 2026-01-20 | /api/contracts/patient/__tests__/dashboard.test.ts, /api/patient/dashboard/__tests__/route.test.ts, /api/ENDPOINT_CATALOG.md, /api/patient/dashboard, /api/patient/dashboard/route.ts, /api/contracts/patient/dashboard.ts, /api/contracts/patient/dashboard, /api/contracts/patient/index.ts |
| docs/e6/E6_5_3_IMPLEMENTATION_SUMMARY.md | E6.5.3 Implementation Summary | 2026-01-20 | /api/patient/dashboard, /api/patient/dashboard/route.ts, /api/authHelpers, /api/patient/dashboard/__tests__/route.test.ts |
| docs/e6/E6_5_4_IMPLEMENTATION_SUMMARY.md | E6.5.4 Implementation Summary | 2026-01-20 | /api/assessments/in-progress, /api/patient/dashboard |
| docs/e6/E6_5_5_IMPLEMENTATION_SUMMARY.md | E6.5.5 Implementation Summary | 2026-01-20 | /api/patient/dashboard/route.ts, /api/patient/dashboard/__tests__/route.test.ts |
| docs/e6/E6_5_6_IMPLEMENTATION_SUMMARY.md | E6.5.6 Implementation Summary | 2026-01-20 | /api/patient/dashboard/route.ts, /api/patient/dashboard/__tests__/route.test.ts |
| docs/e6/E6_5_8_IMPLEMENTATION_SUMMARY.md | E6.5.8 Implementation Summary | 2026-01-20 | /api/funnels/ |
| docs/e6/E6_6_10_COMPLETE.md | E6.6.10 — Triage Endpoint Governance ✅ COMPLETE | 2026-01-20 | /api/patient/triage, /api/contracts/patient/__tests__/triage.test.ts, /api/endpoint-catalog.json, /api/ENDPOINT_CATALOG.md, /api/patient/triage/route.ts, /api/contracts/triage/index.ts, /api/amy/triage |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | E6.6.10 — Triage Endpoint Governance Implementation Summary | 2026-01-20 | /api/patient/triage, /api/contracts/patient/__tests__/triage.test.ts, /api/endpoint-catalog.json, /api/patient/triage/route.ts, /api/amy/triage, /api/contracts/triage, /api/contracts/patient/__tests__/assessments.test.ts, /api/contracts/patient/__tests__/dashboard.test.ts, /api/contracts/triage/__tests__/index.test.ts, /api/ENDPOINT_CATALOG.md, /api/ORPHAN_ENDPOINTS.md, /api/UNKNOWN_CALLSITES.md, /api/patient/triage/__tests__/route.test.ts, /api/contracts/triage/index.ts |
| docs/e6/E6_6_10_VERIFICATION_GUIDE.md | E6.6.10 — Verification Guide | 2026-01-20 | /api/contracts/patient/__tests__/triage.test.ts, /api/patient/triage, /api/endpoint-catalog.json, /api/patient/triage/route.ts, /api/ENDPOINT_CATALOG.md, /api/contracts/triage/__tests__/index.test.ts, /api/patient/triage/__tests__/route.test.ts, /api/contracts/triage/index.ts, /api/amy/triage |
| docs/e6/E6_6_1_COMPLETE.md | E6.6.1 Implementation Complete ✅ | 2026-01-20 | /api/amy/triage/route.ts, /api/amy/triage |
| docs/e6/E6_6_1_IMPLEMENTATION_SUMMARY.md | E6.6.1 — AMY Composer (Guided Mode) Implementation Summary | 2026-01-20 | /api/amy/triage, /api/amy/triage/route.ts |
| docs/e6/E6_6_1_VERIFICATION_GUIDE.md | E6.6.1 Verification Guide | 2026-01-20 | /api/amy/triage |
| docs/e6/E6_6_1_VISUAL_STRUCTURE.md | AMY Composer Component Structure | 2026-01-20 | /api/amy/triage |
| docs/e6/E6_6_2_IMPLEMENTATION_SUMMARY.md | E6.6.2 — TriageResult v1 Contract Implementation Summary | 2026-01-20 | /api/contracts/triage/index.ts, /api/contracts/triage/__tests__/index.test.ts, /api/amy/triage/route.ts, /api/amy/triage |
| docs/e6/E6_6_3_IMPLEMENTATION_SUMMARY.md | E6.6.3 — Triage Engine v1 Implementation Summary | 2026-01-20 | /api/amy/triage/route.ts, /api/contracts/triage/__tests__/index.test.ts, /api/amy/triage |
| docs/e6/E6_6_4_IMPLEMENTATION_SUMMARY.md | E6.6.4 — POST /api/patient/triage — Implementation Summary | 2026-01-20 | /api/patient/triage, /api/patient/triage/route.ts, /api/patient/triage/__tests__/route.test.ts, /api/contracts/triage/index.ts, /api/authHelpers.ts, /api/responses.ts |
| docs/e6/E6_6_4_VERIFICATION_GUIDE.md | E6.6.4 — POST /api/patient/triage — Verification Guide | 2026-01-20 | /api/patient/triage |
| docs/e6/E6_6_6_COMPLETE.md | E6.6.6 — Triage Session Persistence - IMPLEMENTATION COMPLETE ✅ | 2026-01-20 | /api/patient/triage, /api/amy/triage, /api/patient/triage/route.ts, /api/amy/triage/route.ts |
| docs/e6/E6_6_6_IMPLEMENTATION_SUMMARY.md | E6.6.6 — Triage Session Persistence Implementation Summary | 2026-01-20 | /api/patient/triage, /api/amy/triage, /api/patient/triage/route.ts, /api/amy/triage/route.ts |
| docs/e6/E6_6_9_IMPLEMENTATION_SUMMARY.md | E6.6.9 — Dev Harness: Deterministic Triage Test Inputs | 2026-01-20 | /api/contracts/triage, /api/contracts/triage/index.ts |
| docs/e6/VERIFICATION_GUIDE.md | E6.2.8 Verification Guide | 2026-01-20 | /api/test/correlation-id, /api/responseTypes, /api/health/env, /api/funnels/catalog, /api/responses, /api/responseTypes.ts, /api/responses.ts, /api/__tests__/responses.test.ts, /api/test/correlation-id/route.ts |
| docs/e7/E73-7-IMPLEMENTATION-SUMMARY.md | E73.7 Implementation Summary | 2026-01-29 | /api/content/[slug]/route.ts, /api/contentApi.ts, /api/content/, /api/content/[slug]/__tests__/route.test.ts, /api/endpoint-allowlist.json, /api/content/[slug], /api/ORPHAN_ENDPOINTS.md, /api/content, /api/ENDPOINT_CATALOG.md |
| docs/e7/E73_2_IMPLEMENTATION_SUMMARY.md | E73.2 Implementation Summary | 2026-01-27 | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/__tests__/processing-job-creation.test.ts, /api/ENDPOINT_CATALOG.md |
| docs/e7/E73_3_ENDPOINT_WIRING.md | E73.3 Endpoint Wiring Documentation | 2026-01-28 | /api/processing/results, /api/processing/, /api/processing/risk, /api/processing/ranking, /api/ENDPOINT_CATALOG.md, /api/endpoint-catalog.json, /api/ORPHAN_ENDPOINTS.md |
| docs/e7/E73_3_IMPLEMENTATION_SUMMARY.md | E73.3 Implementation Summary | 2026-01-28 | /api/processing/results/route.ts, /api/processing/results |
| docs/e7/E73_3_SECURITY_SUMMARY.md | E73.3 Security Summary | 2026-01-28 | /api/processing/results/route.ts |
| docs/e7/E73_5_IMPLEMENTATION_SUMMARY.md | E73.5 — History + Studio/Clinician: SSOT Join, konsistente Sichtbarkeit | 2026-01-28 | /api/patient/assessments-with-results, /api/patient/assessments-with-results/route.ts |
| docs/e7/E73_5_RULES_VS_CHECKS_MATRIX.md | E73.5 Rules vs Checks Matrix | 2026-01-28 | /api/..., /api/patient/assessments-with-results, /api/ENDPOINT_CATALOG.md, /api/ORPHAN_ENDPOINTS.md, /api/endpoint-catalog.json, /api/patient/assessments-with-results/route.ts |
| docs/e7/E73_5_VERIFICATION_SUMMARY.md | E73.5 Implementation Verification Summary | 2026-01-28 | /api/patient/assessments-with-results, /api/ENDPOINT_CATALOG.md, /api/endpoint-catalog.json, /api/patient/assessments-with-results/route.ts, /api/ORPHAN_ENDPOINTS.md, /api/UNKNOWN_CALLSITES.md |
| docs/e7/E73_8_IMPLEMENTATION_SUMMARY.md | E73.8 — AMY Frontdesk Chat (LLM), ohne Steuerung | 2026-01-29 | /api/amy/chat, /api/endpoint-allowlist.json, /api/funnels/, /api/assessments/, /api/amy/chat/route.ts |
| docs/e7/E73_8_RULES_VS_CHECKS_MATRIX.md | E73.8 — Rules vs. Checks Matrix | 2026-01-29 | /api/amy/chat, /api/endpoint-allowlist.json, /api/..., /api/amy/chat/route.ts |
| docs/e7/E75_3_RULES_VS_CHECKS_MATRIX.md | E75.3 — Rules vs. Checks Matrix | 2026-02-02 | /api/patient/anamnesis, /api/patient/anamnesis/, /api/patient/anamnesis/[entryId], /api/patient/anamnesis/[entryId]/route.ts |
| docs/e7/E76_7_IMPLEMENTATION_SUMMARY.md | E76.7 Implementation Summary | 2026-02-04 | /api/patient/diagnosis/artifacts/[id]/route.ts, /api/patient/diagnosis/runs, /api/patient/diagnosis/artifacts/[id], /api/studio/diagnosis/execute, /api/studio/diagnosis/prompt |
| docs/e7/E76_7_RULES_VS_CHECKS_MATRIX.md | E76.7 — Rules vs. Checks Matrix | 2026-02-04 | /api/patient/diagnosis/runs, /api/patient/diagnosis/artifacts/[id], /api/studio/diagnosis/execute, /api/studio/diagnosis/prompt, /api/patient/diagnosis/artifacts/[id]/route.ts |
| docs/E73-9_STUDIO_DESIGN_TOOL_V1.md | E73.9 — Studio Design Tool v1 Implementation | 2026-01-29 | /api/admin/design-tokens, /api/patient/design, /api/ENDPOINT_CATALOG.md |
| docs/E73_4_RESULT_API_SSOT.md | E73.4 — Result API SSOT-first + "processing" Contract | 2026-01-28 | /api/funnels/, /api/funnels/stress/assessments/, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts |
| docs/E74.8-COMPLETE.md | E74.8 Implementation - Complete Summary | 2026-02-01 | /api/clinician/assessments/[assessmentId]/details/route.ts, /api/patient/assessments-with-results |
| docs/E74.8-DATA-FLOW.md | E74.8 — Assessment Timeline View: Data Flow | 2026-02-01 | /api/clinician/assessments/[id]/details |
| docs/E74.8-IMPLEMENTATION.md | E74.8 — Clinician View v1: Funnel Run Timeline + Answers + Result Summary | 2026-02-01 | /api/clinician/assessments/[assessmentId]/details, /api/clinician/assessments/[assessmentId]/details/route.ts |
| docs/E74_1_IMPLEMENTATION_SUMMARY.md | E74.1 Implementation Summary | 2026-02-01 | /api/admin/funnel-versions/[id]/manifest/route.ts |
| docs/E74_2_IMPLEMENTATION_SUMMARY.md | E74.2 Implementation Summary | 2026-02-01 | /api/patient/funnel-definitions/, /api/patient/funnels, /api/patient/funnel-definitions/stress-assessment, /api/patient/funnel-definitions/sleep-quality, /api/patient/funnel-definitions/cardiovascular-age |
| docs/E74_2_TEST_PLAN.md | E74.2 Test Plan | 2026-02-01 | /api/patient/funnel-definitions/stress-assessment, /api/patient/funnel-definitions/sleep-quality, /api/patient/funnel-definitions/cardiovascular-age, /api/patient/funnel-definitions/heart-health-nutrition, /api/patient/funnels |
| docs/E74_3_GUARDRAILS_DIFF.md | E74.3 Guardrails Matrix Diff Report | 2026-02-01 | /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts, /api/admin/studio/funnels/[slug]/drafts/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate, /api/admin/studio/funnels/ |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | E74.3 Implementation Summary | 2026-02-01 | /api/admin/studio/funnels/[slug]/drafts, /api/admin/studio/funnels/[slug]/drafts/[id], /api/admin/studio/funnels/[slug]/drafts/[id]/validate, /api/admin/studio/funnels/[slug]/drafts/[id]/publish, /api/admin/studio/funnels/[slug]/history, /api/admin/studio/funnels/, /api/admin/studio/funnels/[slug]/drafts/[draftId], /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate, /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish, /api/admin/funnels, /api/admin/studio/funnels/stress-assessment/drafts, /api/admin/studio/funnels/stress-assessment/drafts/[draftId], /api/admin/studio/funnels/stress-assessment/drafts/[draftId]/validate, /api/admin/studio/funnels/stress-assessment/drafts/[draftId]/publish, /api/admin/studio/funnels/stress-assessment/history, /api/admin/studio/funnels/stress-assessment/drafts/ |
| docs/E74_4_IMPLEMENTATION_SUMMARY.md | E74.4 — Patient Funnel Execution UI v1 (Step Runner aus Definition) — IMPLEMENTATION | 2026-02-01 | /api/funnels/[slug]/definition, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/ |
| docs/engineering/ENDPOINT_WIRING_POLICY.md | Endpoint Wiring Policy (Vertical Slices) | 2026-01-28 | /api/..., /api/endpoint-allowlist.json |
| docs/EXTERNAL_CLIENTS.md | External Client Registry | 2026-01-02 | /api/funnels/active, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/assessment-answers/save, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/patient-measures/history, /api/patient-measures/export, /api/admin/usage, /api/admin/diagnostics/pillars-sot, /api/amy/stress-report, /api/amy/stress-summary, /api/consent/record, /api/consent/status, /api/[route] |
| docs/funnels/README.md | Funnel System Documentation | 2026-02-01 | /api/funnels/, /api/assessment-answers/save, /api/admin/studio/funnels/ |
| docs/funnels/START_RESUME_SEMANTICS.md | Start/Resume Assessment Semantics | 2026-02-01 | /api/funnels/, /api/funnels/stress-assessment-a/assessments, /api/funnels/[slug]/assessments/route.ts |
| docs/funnels/STUDIO_PUBLISH_GATES.md | Studio Publish Gates & Workflow | 2026-02-01 | /api/admin/studio/funnels/ |
| docs/funnels/TEST_E2E.md | End-to-End Manual Test Script | 2026-02-01 | /api/admin/studio/funnels/, /api/funnels/stress-assessment-a/assessments, /api/assessment-answers/save |
| docs/FUNNEL_MAPPING_UI.md | Content→Funnel Mapping UI Implementation | 2025-12-13 | /api/admin/content-pages, /api/admin/content-pages/[id], /api/admin/content-pages/route.ts, /api/admin/content-pages/[id]/route.ts |
| docs/guardrails/README.md | Guardrails Documentation | 2026-01-28 | /api/new-endpoint.ps1, /api/your/route |
| docs/guardrails/RULES_VS_CHECKS_DIFF.md | Rules vs Checks Diff Report | 2026-01-25 | /api/responses.ts, /api/endpoint-allowlist.json, /api/example/legacy |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | Rules vs Checks Matrix | 2026-02-04 | /api/ENDPOINT_CATALOG.md, /api/endpoint-catalog.json, /api/endpoint-allowlist.json, /api/example/legacy, /api/..., /api/ORPHAN_ENDPOINTS.md, /api/webhooks/stripe, /api/content/, /api/contentApi.ts, /api/content/[slug], /api/responses.ts, /api/responseTypes.ts, /api/[path], /api/[new-path], /api/mcp, /api/mcp/route.ts, /api/mcp/context-pack, /api/mcp/context-pack/route.ts, /api/studio/diagnosis/execute, /api/studio/diagnosis/execute/route.ts, /api/studio/diagnosis/queue., /api/studio/diagnosis/queue/route.ts, /api/studio/diagnosis/queue |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_5.md | E76.5 Rules vs Checks Matrix | 2026-02-04 | /api/studio/diagnosis/prompt, /api/studio/diagnosis/prompt/route.ts |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_6.md | E76.6 — Rules vs Checks Matrix | 2026-02-04 | /api/patient/diagnosis/runs, /api/patient/diagnosis/runs/route.ts, /api/patient/diagnosis/artifacts/[id], /api/patient/diagnosis/artifacts/[id]/route.ts |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_8.md | RULES_VS_CHECKS_MATRIX E76.8 Update | 2026-02-04 | /api/studio/diagnosis/queue, /api/studio/diagnosis/queue/route.ts |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_9.md | E76.9 Rules vs Checks Matrix | 2026-02-04 | /api/..., /api/endpoint-allowlist.json, /api/external/webhook, /api/orphan, /api/mcp |
| docs/HEALTHCHECK_QUICKSTART.md | Environment Healthcheck Endpoint | 2026-01-02 | /api/health/env |
| docs/I2_1_PATIENT_STATE_IMPLEMENTATION.md | I2.1 Implementation Summary: Canonical Patient State v0.1 | 2026-01-25 | /api/contracts/patient/state.ts, /api/patient/state/route.ts, /api/patient/state, /api/contracts/patient/index.ts |
| docs/I71.4-IMPLEMENTATION-SUMMARY.md | I71.4 Implementation Summary | 2026-01-21 | /api/assessmentPersistence.ts, /api/assessments/[id]/state, /api/assessment-answers/save, /api/__tests__/assessmentPersistence.test.ts, /api/__tests__/saveResumeIntegration.test.ts, /api/assessments/[id]/state/route.ts, /api/assessment-answers/save/route.ts |
| docs/I71.4-PERSISTENCE-ADAPTER.md | I71.4: Assessment Persistence Adapter - Usage Guide | 2026-01-21 | /api/assessmentPersistence.ts, /api/assessments/[id]/state, /api/assessment-answers/save, /api/assessmentPersistence, /api/assessments/, /api/contracts/patient/README.md |
| docs/IMPLEMENTATION_EXAMPLE.md | Mobile Funnel Selector - Implementation Example | 2026-01-02 | /api/funnels/active, /api/funnels/active/route.ts |
| docs/LINT_POLICY.md | ESLint Policy & CI Gate Strategy | 2026-01-02 | /api/health/env/route.ts |
| docs/LOGGING_EXAMPLES.md | Logging Output Examples | 2026-01-02 | /api/funnels/stress/assessments, /api/funnels/stress/assessments/abc/complete, /api/admin/funnels, /api/admin/funnels/route.ts, /api/amy/stress-report, /api/amy/stress-report/route.ts |
| docs/LOGGING_PATTERNS.md | Logging Patterns | 2026-01-02 | /api/users, /api/admin/users, /api/funnels/[slug]/assessments, /api/data, /api/assessments |
| docs/mobile/API_ERRORS.md | Mobile API Error Reference | 2026-01-13 | /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/result |
| docs/mobile/AUTH_SESSION.md | Auth & Session Management for Mobile (E6.2.6) | 2026-01-13 | /api/auth/resolve-role, /api/auth/callback, /api/patient/onboarding-status, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[id], /api/funnels/[slug]/assessments/[id]/complete, /api/assessment-answers/save, /api/authHelpers, /api/responses |
| docs/mobile/BLOCK_EDITOR.md | Visual Block Editor | 2026-01-05 | /api/admin/funnel-versions/[id]/manifest/route.ts, /api/admin/funnel-versions/[id]/manifest, /api/admin/funnel-versions/, /api/admin/funnel-versions/[id]/manifest/__tests__/validation.test.ts, /api/admin/funnel-versions |
| docs/mobile/BLOCK_EDITOR_SECURITY_AUDIT.md | V05-I06.4 Visual Block Editor - Security Hardening Evidence | 2026-01-05 | /api/admin/funnel-versions/[id]/manifest |
| docs/mobile/CACHING_PAGINATION.md | Mobile Caching & Pagination Contract | 2026-01-13 | /api/funnels/catalog, /api/funnels/catalog/[slug], /api/funnels/[slug]/definition |
| docs/mobile/DEEP_LINKS.md | Deep Link Contract — iOS v0.7 | 2026-01-13 | /api/funnels/catalog/, /api/funnels/, /api/assessments/, /api/notifications/, /api/notifications, /api/assessments/550e8400-e29b-41d4-a716-446655440000/resume, /api/funnels/stress/assessments/660e8400-e29b-41d4-a716-446655440111/result, /api/funnels/catalog/stress |
| docs/mobile/E6_2_2_VERIFICATION.md | E6.2.2 Implementation Verification | 2026-01-13 | /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/catalog, /api/funnels/catalog/[slug], /api/responseTypes.ts, /api/responses.ts, /api/__tests__/responses.test.ts |
| docs/mobile/IDEMPOTENCY.md | Idempotency for Mobile Offline/Retry Readiness (E6.2.4) | 2026-01-13 | /api/funnels/stress/assessments, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[id]/answers/save, /api/funnels/[slug]/assessments/[id]/steps/[stepId]/validate, /api/funnels/[slug]/assessments/[id]/complete, /api/funnels/stress/assessments/ |
| docs/mobile/IOS_INTEGRATION_PACK.md | iOS Integration Pack — v0.7 | 2026-01-14 | /api/auth/resolve-role, /api/patient/onboarding-status, /api/funnels/catalog, /api/funnels/catalog/stress-assessment, /api/funnels/catalog/, /api/funnels/stress-assessment/assessments, /api/funnels/stress-assessment/assessments/assessment-uuid-789/answers/save, /api/funnels/stress-assessment/assessments/assessment-uuid-789/steps/step-uuid-001, /api/funnels/stress-assessment/assessments/assessment-uuid-789/complete, /api/funnels/stress-assessment/assessments/assessment-uuid-789/result, /api/funnels/stress-assessment/assessments/, /api/assessments/assessment-uuid-789/resume, /api/funnels/stress-assessment/assessments/assessment-uuid-789, /api/assessments/, /api/funnels/catalog/[slug], /api/funnels/[slug]/assessments, /api/assessments/[id]/resume |
| docs/mobile/MOBILE_API_SURFACE.md | Mobile API Surface — Patient Flow (v0.7) | 2026-01-13 | /api/patient/onboarding-status, /api/patient/onboarding-status/route.ts, /api/auth/resolve-role, /api/auth/resolve-role/route.ts, /api/consent/record, /api/consent/record/route.ts, /api/consent/status, /api/consent/status/route.ts, /api/funnels/catalog, /api/funnels/catalog/route.ts, /api/funnels/catalog/[slug], /api/funnels/catalog/[slug]/route.ts, /api/funnels/[slug]/definition, /api/funnels/[slug]/definition/route.ts, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/assessments/[id]/resume, /api/assessments/[id]/resume/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/assessment-validation/validate-step, /api/assessment-validation/validate-step/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/assessment-answers/save, /api/assessment-answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts, /api/patient-measures/history, /api/patient-measures/history/route.ts, /api/patient-measures/export, /api/patient-measures/export/route.ts, /api/patient-profiles, /api/patient-profiles/route.ts, /api/funnels/stress-assessment/assessments, /api/funnels/stress-assessment/assessments/ |
| docs/mobile/OBSERVABILITY.md | Mobile Observability Guide | 2026-01-13 | /api/funnels/catalog, /api/funnels/stress/assessments, /api/funnels/stress/assessments/abc-123/complete, /api/responses |
| docs/MOBILE_FUNNEL_SELECTOR.md | Mobile Funnel Selector Implementation | 2026-01-02 | /api/funnels/active, /api/funnels/active/route.ts |
| docs/MONITORING_INTEGRATION.md | Monitoring Integration Guide | 2026-01-02 | /api/auth/callback/route.ts, /api/test-monitoring |
| docs/overview/README.md | Rhythmologicum Connect v0.5 — Overview | 2026-01-11 | /api/ENDPOINT_CATALOG.md], /api/ENDPOINT_CATALOG.md |
| docs/PATIENT_API_CONTRACTS.md | Patient API Contract Schemas - E6.2.3 | 2026-01-27 | /api/contracts/patient/assessments.ts, /api/contracts/patient/index.ts, /api/funnels/, /api/contracts/patient, /api/responses, /api/funnels/stress/assessments, /api/contracts/patient/__tests__/assessments.test.ts |
| docs/PATIENT_FLOW_RENDERER_IMPLEMENTATION.md | PatientFlowRenderer Implementation | 2026-01-02 | /api/funnels/ |
| docs/PATIENT_FLOW_V2_DIAGRAM.md | Patient Flow V2 – Visual Flow Diagram | 2026-01-02 | /api/funnels/ |
| docs/PATIENT_FLOW_V2_STRUCTURE.md | Patient Flow V2 Structure – Screens & States | 2026-01-02 | /api/funnels/, /api/assessment-answers/save |
| docs/PILLARS_SOT_AUDIT.md | Pillars/Catalog Source-of-Truth Audit (TV05_01B) | 2026-01-02 | /api/admin/diagnostics/pillars-sot, /api/admin/diagnostics/pillars-sot/route.ts, /api/admin/diagnostics/pillars-sot/__tests__/route.test.ts |
| docs/pilot/ANAMNESIS_EXPORT.md | E75.6 — Anamnesis JSON Export Documentation | 2026-02-02 | /api/patient/anamnesis/export.json, /api/studio/patients/[patientId]/anamnesis/export.json, /api/studio/patients/PATIENT_UUID/anamnesis/export.json, /api/anamnesis/exportClient, /api/studio/patients/, /api/studio/patients/ASSIGNED_PATIENT_ID/anamnesis/export.json, /api/studio/patients/UNASSIGNED_PATIENT_ID/anamnesis/export.json, /api/patient/anamnesis/export.json/route.ts, /api/studio/patients/[patientId]/anamnesis/export.json/route.ts, /api/anamnesis/export.ts, /api/anamnesis/exportClient.ts |
| docs/pilot/CRITICAL_ENDPOINTS.md | Pilot-Critical Endpoints | 2026-01-20 | /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/definition, /api/funnels/catalog, /api/amy/stress-report, /api/review/[id]/decide, /api/review/[id]/details, /api/review/queue, /api/funnels/[slug]/assessments/[assessmentId]/workup, /api/support-cases, /api/support-cases/[id], /api/support-cases/[id]/escalate, /api/escalation/log-click, /api/admin/pilot/kpis, /api/admin/pilot/flow-events, /api/admin/usage, /api/patient-measures/export, /api/auth/callback, /api/auth/resolve-role, /api/patient-profiles, /api/account/deletion-request, /api/consent/record, /api/consent/status, /api/health/env, /api/test/correlation-id, /api/processing/, /api/documents/, /api/notifications/, /api/endpoint-allowlist.json, /api/ENDPOINT_CATALOG.md, /api/funnels/stress/assessments, /api/admin/pilot/kpis/route.ts, /api/admin/usage/route.ts, /api/admin/pilot/flow-events/route.ts |
| docs/pilot/EXPORTS.md | Pilot Evaluation — Data Export Documentation | 2026-01-15 | /api/patient-measures/export, /api/reports/[reportId]/pdf, /api/reports/REPORT_ID/pdf, /api/reports/, /api/reports/VALID_REPORT_ID/pdf, /api/reports/00000000-0000-0000-0000-000000000000/pdf, /api/patient-measures/export/route.ts, /api/reports/[reportId]/pdf/route.ts, /api/responses.ts |
| docs/pilot/KPIS_QUICK_REF.md | Pilot KPIs Quick Reference | 2026-01-20 | /api/admin/pilot/kpis, /api/admin/pilot/flow-events, /api/admin/usage, /api/patient-measures/export |
| docs/pilot/README.md | Pilot Documentation | 2026-01-20 | /api/patient-measures/export, /api/reports/[reportId]/pdf, /api/reports/ |
| docs/PROGRAM_TIER_CONTRACT.md | Program Tier Contract Documentation | 2026-01-02 | /api/funnels/catalog |
| docs/releases/v0.4/changelog.md | Zusammenfassung der Änderungen | 2025-12-30 | /api/funnels/[slug]/definition/route.ts, /api/funnels/[slug]/content-pages/route.ts, /api/content-pages/[slug], /api/funnels/[slug]/content-pages, /api/admin/content-pages/, /api/funnels/, /api/amy/stress-report/route.ts, /api/amy/stress-report |
| docs/releases/v0.5.md | Release v0.5 (tag: v0.5.0) | 2026-01-11 | /api/endpoint-allowlist.json |
| docs/REVIEW_QUEUE_QUICK_REFERENCE.md | Review Queue - Quick Reference Guide | 2026-01-08 | /api/review/queue |
| docs/RULES_VS_CHECKS_MATRIX.md | E74: Rules vs Checks Matrix | 2026-02-01 | /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts, /api/admin/studio/funnels/, /api/funnels/[slug]/assessments, /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate, /api/clinician/patient-funnels/ |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | E75.2 Anamnese API — Rules vs Checks Matrix | 2026-02-02 | /api/patient/anamnesis, /api/patient/anamnesis/[id], /api/patient/anamnesis/[id]/versions, /api/patient/anamnesis/[id]/archive, /api/studio/patients/[patientId]/anamnesis, /api/studio/anamnesis/[id]/versions, /api/studio/anamnesis/[id]/archive, /api/patient/anamnesis/route.ts, /api/patient/anamnesis/[entryId]/route.ts, /api/patient/anamnesis/[entryId]/versions/route.ts, /api/patient/anamnesis/[entryId]/archive/route.ts, /api/studio/patients/[patientId]/anamnesis/route.ts, /api/studio/anamnesis/[entryId]/versions/route.ts, /api/studio/anamnesis/[entryId]/archive/route.ts, /api/anamnesis/validation.ts, /api/anamnesis/helpers.ts |
| docs/runbooks/CHECK_ALIGNMENT.md | Check Alignment Documentation | 2026-02-04 | /api/mcp |
| docs/runbooks/MCP_SERVER.md | MCP Server Runbook | 2026-02-04 | /api/mcp/, /api/mcp/route.ts, /api/mcp |
| docs/runbooks/PILOT_SMOKE_TESTS.md | Pilot Runbook + Flow Smoke Tests | 2026-01-20 | /api/patient/dashboard, /api/assessments/in-progress, /api/funnels/, /api/funnels/stress/assessments, /api/funnels/stress/assessments/, /api/health/env |
| docs/runbooks/SECURITY_MODEL.md | Security Model | 2026-02-04 | /api/mcp/route.ts |
| docs/runbooks/TROUBLESHOOTING.md | Troubleshooting Guide | 2026-02-04 | /api/endpoint, /api/mcp |
| docs/test-runs/v0.7_patient_smoke.md | v0.7 Patient Smoke Pack — Test Run Documentation | 2026-01-26 | /api/amy/triage, /api/patient/state, /api/contracts/patient/state.ts, /api/amy/triage/route.ts |
| docs/testing/E73-7-MANUAL-TEST-PLAN.md | E73.7 Manual Testing Workflow | 2026-01-29 | /api/content/e737-test-content, /api/admin/content-pages/, /api/content/does-not-exist-12345, /api/content/, /api/contentApi.ts, /api/endpoint-allowlist.json |
| docs/triage/inbox-v1.md | Inbox Logic v1 — Deterministic Specification | 2026-02-05 | /api/admin/processing/retry/ |
| docs/triage/RULES_VS_CHECKS_MATRIX.md | E78.1 Inbox v1 — Rules vs Checks Matrix | 2026-02-05 | /api/clinician/inbox, /api/clinician/inbox/, /api/clinician/inbox/stats |
| docs/triage/RULES_VS_CHECKS_MATRIX_E78_3.md | E78.3 Rules vs Checks Matrix | 2026-02-05 | /api/clinician/triage, /api/clinician/triage/route.ts |
| docs/triage/RULES_VS_CHECKS_MATRIX_E78_7.md | E78.7 Rules vs Checks Matrix | 2026-02-05 | /api/clinician/triage |
| docs/triage_system_map.md | Triage System Map (Studio) | 2026-02-05 | /api/triage/health, /api/triage/health/route.ts], /api/triage/health/route.ts |
| docs/TV05_02_IMPLEMENTATION.md | TV05_02: Usage Telemetry Toggle Implementation | 2026-01-02 | /api/admin/usage/route.ts, /api/admin/usage/__tests__/route.test.ts, /api/admin/usage, /api/test |
| docs/TV05_03_HEALTHCHECK_IMPLEMENTATION.md | TV05_03: Environment Self-Check Healthcheck Endpoint | 2026-01-02 | /api/health/env, /api/health/env/, /api/health/env/__tests__/route.test.ts, /api/health/env/route.ts, /api/authHelpers.ts, /api/responses.ts |
| docs/TV05_CLEANUP_AUDIT_ISSUE_MAP.md | V05 Cleanup Audit: Issue ↔ Repo Mapping | 2026-01-02 | /api/amy/stress-report/route.ts, /api/funnels/catalog, /api/funnels/catalog/[slug], /api/funnels/active, /api/amy/ |
| docs/TV05_CLEANUP_AUDIT_UNUSED.md | V05 Cleanup Audit: Unused & Unintegrated Inventory | 2026-01-02 | /api/amy/stress-report, /api/amy/stress-report/route.ts, /api/amy/stress-summary, /api/amy/stress-summary/route.ts, /api/consent/record, /api/consent/record/route.ts, /api/consent/status, /api/consent/status/route.ts, /api/content-resolver, /api/content-resolver/route.ts, /api/content/resolve, /api/content/resolve/route.ts, /api/admin/funnels, /api/admin/funnels/[id], /api/admin/funnel-steps, /api/admin/funnel-steps/[id], /api/admin/funnel-step-questions/[id], /api/admin/content-pages, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/[sectionId], /api/patient-measures/export |
| docs/TV05_CLEANUP_BACKLOG.md | V05 Cleanup Backlog | 2026-01-02 | /api/amy/stress-report, /api/amy/stress-summary, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/amy/stress-report/route.ts, /api/amy/stress-summary/route.ts, /api/consent/record, /api/consent/status, /api/consent, /api/consent/record/route.ts, /api/consent/status/route.ts, /api/content-resolver, /api/content/resolve, /api/patient-measures/export, /api/patient-measures/history, /api/assessments/[id]/current-step, /api/assessments/[id]/navigation, /api/assessments/[id]/resume, /api/assessment-validation/validate-step |
| docs/TV05_CLEANUP_IMPLEMENTATION_SUMMARY.md | TV05-CLEANUP & AUDIT Implementation Summary | 2026-01-02 | /api/amy/stress-report, /api/amy/stress-summary, /api/consent/record, /api/content-resolver, /api/content/resolve |
| docs/USAGE_TELEMETRY.md | TV05_01: Runtime Usage Telemetry Implementation | 2026-01-02 | /api/admin/usage, /api/amy/stress-report, /api/amy/stress-summary, /api/consent/record, /api/content/resolve, /api/your-route, /api/admin/usage/__tests__/route.test.ts, /api/admin/usage/__tests__/ |
| docs/v0.5/CALLSITE_MAP.md | ﻿# Callsite Map (v0.5) | 2026-01-10 | /api/account/deletion-request, /api/admin/content-pages, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/[sectionId], /api/admin/design-tokens, /api/admin/diagnostics/pillars-sot, /api/admin/funnels, /api/admin/funnels/[id], /api/admin/funnel-step-questions/[id], /api/admin/funnel-steps, /api/admin/funnel-steps/[id], /api/admin/funnel-versions/[id], /api/admin/funnel-versions/[id]/manifest, /api/admin/kpi-thresholds, /api/admin/kpi-thresholds/[id], /api/admin/navigation, /api/admin/navigation/[role], /api/admin/notification-templates, /api/admin/notification-templates/[id], /api/admin/operational-settings-audit, /api/admin/reassessment-rules, /api/admin/reassessment-rules/[id], /api/admin/usage, /api/amy/stress-report, /api/amy/stress-summary, /api/assessment-answers/save, /api/assessments/[id]/current-step, /api/assessments/[id]/navigation, /api/assessments/[id]/resume, /api/assessment-validation/validate-step, /api/auth/callback, /api/auth/resolve-role, /api/consent/record, /api/consent/status, /api/content/resolve, /api/content-pages/[slug], /api/content-resolver, /api/documents/[id]/extract, /api/documents/[id]/status, /api/documents/upload, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/content-pages, /api/funnels/[slug]/definition, /api/funnels/active, /api/funnels/catalog, /api/funnels/catalog/[slug], /api/health/env, /api/notifications, /api/notifications/[id], /api/patient/onboarding-status, /api/patient-measures/export, /api/patient-measures/history, /api/patient-profiles, /api/pre-screening-calls, /api/processing/content, /api/processing/delivery, /api/processing/jobs/[jobId], /api/processing/pdf, /api/processing/ranking, /api/processing/risk, /api/processing/safety, /api/processing/start, /api/processing/validation, /api/reports/[reportId]/pdf, /api/review/[id], /api/review/[id]/decide, /api/review/[id]/details, /api/review/queue, /api/shipments, /api/shipments/[id], /api/shipments/[id]/events, /api/support-cases, /api/support-cases/[id], /api/support-cases/[id]/escalate, /api/tasks, /api/tasks/[id] |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | ﻿# Changed Files Since 2025-12-30 | 2026-01-20 | /api/account/deletion-request/route.ts, /api/admin/content-pages/[id]/__tests__/route.test.ts, /api/admin/content-pages/[id]/route.ts, /api/admin/content-pages/[id]/sections/[sectionId]/route.ts, /api/admin/content-pages/[id]/sections/route.ts, /api/admin/content-pages/route.ts, /api/admin/design-tokens/route.ts, /api/admin/diagnostics/pillars-sot/__tests__/route.test.ts, /api/admin/diagnostics/pillars-sot/route.ts, /api/admin/funnels/[id]/__tests__/route.test.ts, /api/admin/funnels/[id]/route.ts, /api/admin/funnels/__tests__/route.test.ts, /api/admin/funnels/route.ts, /api/admin/funnel-step-questions/[id]/route.ts, /api/admin/funnel-steps/[id]/route.ts, /api/admin/funnel-steps/route.ts, /api/admin/funnel-versions/[id]/__tests__/route.test.ts, /api/admin/funnel-versions/[id]/manifest/__tests__/route.test.ts, /api/admin/funnel-versions/[id]/manifest/__tests__/validation.test.ts, /api/admin/funnel-versions/[id]/manifest/route.ts, /api/admin/funnel-versions/[id]/route.ts, /api/admin/kpi-thresholds/[id]/route.ts, /api/admin/kpi-thresholds/route.ts, /api/admin/navigation/[role]/route.ts, /api/admin/navigation/route.ts, /api/admin/notification-templates/[id]/route.ts, /api/admin/notification-templates/route.ts, /api/admin/operational-settings-audit/route.ts, /api/admin/reassessment-rules/[id]/route.ts, /api/admin/reassessment-rules/route.ts, /api/admin/usage/__tests__/route.test.ts, /api/admin/usage/route.ts, /api/amy/stress-report/route.ts, /api/amy/stress-summary/route.ts, /api/assessment-answers/save/route.ts, /api/assessments/[id]/current-step/route.ts, /api/assessments/[id]/navigation/route.ts, /api/assessments/[id]/resume/route.ts, /api/assessment-validation/validate-step/route.ts, /api/auth/callback/route.ts, /api/auth/resolve-role/__tests__/route.test.ts, /api/auth/resolve-role/route.ts, /api/consent/record/route.ts, /api/consent/status/route.ts, /api/content/resolve/__tests__/route.test.ts, /api/content/resolve/route.ts, /api/content-pages/[slug]/route.ts, /api/documents/[id]/extract/route.ts, /api/documents/[id]/status/route.ts, /api/documents/upload/__tests__/route.test.ts, /api/documents/upload/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/content-pages/__tests__/route.test.ts, /api/funnels/[slug]/content-pages/route.ts, /api/funnels/[slug]/definition/route.ts, /api/funnels/__tests__/hardening.test.ts, /api/funnels/__tests__/save-resume.test.ts, /api/funnels/active/route.ts, /api/funnels/catalog/[slug]/__tests__/route.test.ts, /api/funnels/catalog/[slug]/route.ts, /api/funnels/catalog/__tests__/catalog.test.ts, /api/funnels/catalog/__tests__/route.test.ts, /api/funnels/catalog/route.ts, /api/health/env/__tests__/route.test.ts, /api/health/env/__tests__/route.test.ts.backup, /api/health/env/route.ts, /api/notifications/[id]/route.ts, /api/notifications/route.ts, /api/patient/onboarding-status/__tests__/route.test.ts, /api/patient/onboarding-status/route.ts, /api/patient-measures/export/route.ts, /api/patient-measures/history/route.ts, /api/patient-profiles/route.ts, /api/pre-screening-calls/route.ts, /api/processing/__tests__/integration.test.ts, /api/processing/content/route.ts, /api/processing/delivery/__tests__/route.test.ts, /api/processing/delivery/route.ts, /api/processing/jobs/[jobId]/route.ts, /api/processing/pdf/__tests__/route.auth-first.test.ts, /api/processing/pdf/route.ts, /api/processing/ranking/route.ts, /api/processing/risk/route.ts, /api/processing/safety/route.ts, /api/processing/start/route.ts, /api/processing/validation/route.ts, /api/reports/[reportId]/pdf/route.ts, /api/reports/__tests__/pdf.rbac.test.ts, /api/review/[id]/decide/route.ts, /api/review/[id]/details/__tests__/route.test.ts, /api/review/[id]/details/route.ts, /api/review/[id]/route.ts, /api/review/__tests__/httpSemantics.test.ts, /api/review/queue/route.ts, /api/shipments/[id]/events/route.ts, /api/shipments/[id]/route.ts, /api/shipments/route.ts, /api/support-cases/[id]/escalate/__tests__/route.test.ts, /api/support-cases/[id]/escalate/route.ts, /api/support-cases/[id]/route.ts, /api/support-cases/route.ts, /api/tasks/[id]/__tests__/route.test.ts, /api/tasks/[id]/route.ts, /api/tasks/__tests__/route.test.ts, /api/tasks/route.ts, /api/authHelpers.ts, /api/responses.ts, /api/responseTypes.ts |
| docs/v0.5/ENDPOINT_INVENTORY.md | ﻿# Endpoint Inventory (v0.5) | 2026-01-10 | /api/account/deletion-request, /api/account/deletion-request/route.ts, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/route.ts, /api/admin/content-pages/[id]/sections/[sectionId], /api/admin/content-pages/[id]/sections/[sectionId]/route.ts, /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/route.ts, /api/admin/content-pages, /api/admin/content-pages/route.ts, /api/admin/design-tokens, /api/admin/design-tokens/route.ts, /api/admin/diagnostics/pillars-sot, /api/admin/diagnostics/pillars-sot/route.ts, /api/admin/funnels/[id], /api/admin/funnels/[id]/route.ts, /api/admin/funnels, /api/admin/funnels/route.ts, /api/admin/funnel-step-questions/[id], /api/admin/funnel-step-questions/[id]/route.ts, /api/admin/funnel-steps/[id], /api/admin/funnel-steps/[id]/route.ts, /api/admin/funnel-steps, /api/admin/funnel-steps/route.ts, /api/admin/funnel-versions/[id]/manifest, /api/admin/funnel-versions/[id]/manifest/route.ts, /api/admin/funnel-versions/[id], /api/admin/funnel-versions/[id]/route.ts, /api/admin/kpi-thresholds/[id], /api/admin/kpi-thresholds/[id]/route.ts, /api/admin/kpi-thresholds, /api/admin/kpi-thresholds/route.ts, /api/admin/navigation/[role], /api/admin/navigation/[role]/route.ts, /api/admin/navigation, /api/admin/navigation/route.ts, /api/admin/notification-templates/[id], /api/admin/notification-templates/[id]/route.ts, /api/admin/notification-templates, /api/admin/notification-templates/route.ts, /api/admin/operational-settings-audit, /api/admin/operational-settings-audit/route.ts, /api/admin/reassessment-rules/[id], /api/admin/reassessment-rules/[id]/route.ts, /api/admin/reassessment-rules, /api/admin/reassessment-rules/route.ts, /api/admin/usage, /api/admin/usage/route.ts, /api/amy/stress-report, /api/amy/stress-report/route.ts, /api/amy/stress-summary, /api/amy/stress-summary/route.ts, /api/assessment-answers/save, /api/assessment-answers/save/route.ts, /api/assessments/[id]/current-step, /api/assessments/[id]/current-step/route.ts, /api/assessments/[id]/navigation, /api/assessments/[id]/navigation/route.ts, /api/assessments/[id]/resume, /api/assessments/[id]/resume/route.ts, /api/assessment-validation/validate-step, /api/assessment-validation/validate-step/route.ts, /api/auth/callback, /api/auth/callback/route.ts, /api/auth/resolve-role, /api/auth/resolve-role/route.ts, /api/consent/record, /api/consent/record/route.ts, /api/consent/status, /api/consent/status/route.ts, /api/content/resolve, /api/content/resolve/route.ts, /api/content-pages/[slug], /api/content-pages/[slug]/route.ts, /api/content-resolver, /api/content-resolver/route.ts, /api/documents/[id]/extract, /api/documents/[id]/extract/route.ts, /api/documents/[id]/status, /api/documents/[id]/status/route.ts, /api/documents/upload, /api/documents/upload/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/content-pages, /api/funnels/[slug]/content-pages/route.ts, /api/funnels/[slug]/definition, /api/funnels/[slug]/definition/route.ts, /api/funnels/active, /api/funnels/active/route.ts, /api/funnels/catalog/[slug], /api/funnels/catalog/[slug]/route.ts, /api/funnels/catalog, /api/funnels/catalog/route.ts, /api/health/env, /api/health/env/route.ts, /api/notifications/[id], /api/notifications/[id]/route.ts, /api/notifications, /api/notifications/route.ts, /api/patient/onboarding-status, /api/patient/onboarding-status/route.ts, /api/patient-measures/export, /api/patient-measures/export/route.ts, /api/patient-measures/history, /api/patient-measures/history/route.ts, /api/patient-profiles, /api/patient-profiles/route.ts, /api/pre-screening-calls, /api/pre-screening-calls/route.ts, /api/processing/content, /api/processing/content/route.ts, /api/processing/delivery, /api/processing/delivery/route.ts, /api/processing/jobs/[jobId], /api/processing/jobs/[jobId]/route.ts, /api/processing/pdf, /api/processing/pdf/route.ts, /api/processing/ranking, /api/processing/ranking/route.ts, /api/processing/risk, /api/processing/risk/route.ts, /api/processing/safety, /api/processing/safety/route.ts, /api/processing/start, /api/processing/start/route.ts, /api/processing/validation, /api/processing/validation/route.ts, /api/reports/[reportId]/pdf, /api/reports/[reportId]/pdf/route.ts, /api/review/[id]/decide, /api/review/[id]/decide/route.ts, /api/review/[id]/details, /api/review/[id]/details/route.ts, /api/review/[id], /api/review/[id]/route.ts, /api/review/queue, /api/review/queue/route.ts, /api/shipments/[id]/events, /api/shipments/[id]/events/route.ts, /api/shipments/[id], /api/shipments/[id]/route.ts, /api/shipments, /api/shipments/route.ts, /api/support-cases/[id]/escalate, /api/support-cases/[id]/escalate/route.ts, /api/support-cases/[id], /api/support-cases/[id]/route.ts, /api/support-cases, /api/support-cases/route.ts, /api/tasks/[id], /api/tasks/[id]/route.ts, /api/tasks, /api/tasks/route.ts |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | Funnel Wiring Analysis (v0.5) | 2026-01-10 | /api/content/resolve, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/route.ts], /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/route.ts], /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/, /api/funnels/[slug]/definition, /api/funnels/[slug]/definition/route.ts], /api/funnels/[slug]/definition/route.ts, /api/content/resolve/route.ts], /api/content/resolve/route.ts, /api/funnels/[slug]/assessments/ |
| docs/v0.5/P0_FIX_PLAN.md | P0 Fix Plan (v0.5) — Minimal-Diff, Issue-Shaped | 2026-01-10 | /api/funnels/[slug]/definition, /api/funnels/[slug]/assessments/, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts, /api/funnels/ |
| docs/v0.5/STATUS_QUO_AND_DELTA.md | v0.5 Status Quo & Delta (Evidence-First) | 2026-01-10 | /api/funnels/[slug]/assessments/, /api/content/resolve, /api/funnels/catalog, /api/admin/funnels |
| docs/v0.5/_generated_delta_table.md | Issues updated since date with no linked merged PR | 2026-01-10 | /api/funnels/catalog, /api/admin/funnels |
| docs/V05_I01_3_VERSIONING_EVIDENCE.md | V05-I01.3 Implementation Evidence | 2026-01-02 | /api/amy/stress-report/route.ts |
| docs/V05_I02_1_CATALOG_IMPLEMENTATION.md | V05-I02.1 Implementation Summary | 2026-01-02 | /api/funnels/catalog, /api/funnels/catalog/[slug], /api/funnels/catalog/__tests__/catalog.test.ts, /api/funnels/active, /api/funnels/catalog/route.ts, /api/funnels/catalog/[slug]/route.ts |
| docs/V05_I02_1_SCHEMA_VERIFICATION.md | V05-I02.1 Schema Verification Evidence | 2026-01-02 | /api/funnels/catalog, /api/funnels/catalog/[slug], /api/funnels/catalog/__tests__/catalog.test.ts |
| docs/V05_I02_1_VISUAL_EVIDENCE.md | V05-I02.1 Visual Verification Evidence | 2026-01-02 | /api/funnels/catalog, /api/funnels/catalog/__tests__/catalog.test.ts |
| docs/V05_I02_2_IMPLEMENTATION_SUMMARY.md | V05-I02.2 Implementation Summary | 2026-01-02 | /api/funnels/catalog, /api/funnels/catalog/[slug] |
| docs/V05_I02_2_PATIENT_FLOW_INTEGRATION.md | V05-I02.2 Patient Flow Integration Evidence | 2026-01-02 | /api/funnels/catalog/[slug]/manifest |
| docs/V05_I02_3_CATALOG_500_FIX.md | V05-I02.3 — Fix: `/api/funnels/catalog` 500 in Production | 2026-01-02 | /api/funnels/catalog, /api/funnels/catalog/route.ts], /api/funnels/catalog/route.ts, /api/responses.ts], /api/responses.ts, /api/responseTypes.ts], /api/responseTypes.ts, /api/funnels/catalog/, /api/funnels/catalog/__tests__/route.test.ts |
| docs/V05_I02_3_IMPLEMENTATION_SUMMARY.md | V05-I02.3 Implementation Summary | 2026-01-20 | /api/funnels/catalog, /api/funnels/catalog/ |
| docs/V05_I05_1_PROCESSING_ORCHESTRATOR.md | V05-I05.1: Processing Orchestrator - Usage Guide | 2026-01-03 | /api/processing/start, /api/processing/jobs/[jobId], /api/processing/jobs/YOUR_JOB_ID |
| docs/V05_MILESTONES_CRITICAL_PATH.md | V05 Milestones & Critical Path | 2026-01-02 | /api/amy/stress-report/ |
| docs/v06/ENDPOINTS.md | v0.6 Endpoints | 2026-01-20 | /api/admin/dev/endpoint-catalog, /api/ENDPOINT_CATALOG.md, /api/endpoint-catalog.json |
| docs/V061-I03-VERIFICATION.md | V061-I03 Verification Report | 2026-01-18 | /api/content-pages/, /api/content/resolve, /api/funnels/, /api/content/resolve/__tests__/route.test.ts |
| docs/V061_I01_PGRST116_MAPPING_GUIDE.md | V061-I01: PGRST116 Error Mapping Guide | 2026-01-18 | /api/responses, /api/funnels/stress/assessments/non-existent-id, /api/responses.ts, /api/admin/funnels/[id]/route.ts |
| docs/v07/E71_SMOKE.md | E71 — Smoke & Acceptance Pack | 2026-01-23 | /api/funnels/catalog, /api/content/resolve, /api/admin/navigation |
| docs/v07/E71_SMOKE_TESTS.md | EPIC E71 - Mobile UI v2 + Studio Workbench v0.7 Smoke Tests | 2026-01-21 | /api/admin/navigation |
| docs/V0_4_E2_PATIENT_FLOW_V2.md | V0.4-E2 — Patient Flow V2 Implementation Summary | 2026-01-02 | /api/funnels/ |
| docs/V0_4_E3_CONTENT_FLOW_ENGINE.md | V0.4-E3: Content Flow Engine (CONTENT_PAGE Integration) | 2026-01-02 | /api/funnels/[slug]/definition, /api/admin/funnels/[id], /api/admin/funnel-steps/[id], /api/admin/funnel-steps |
| docs/Z4_EXECUTIVE_SUMMARY_V0.3.md | Executive Summary – Rhythmologicum Connect v0.3 | 2026-01-02 | /api/funnels/, /api/assessment-validation/validate-step, /api/assessment-answers/save, /api/content-resolver |
| docs/_archive/root/AUDIT_LOG_IMPLEMENTATION.md | V05-I01.4 Implementation Summary | 2026-01-11 | /api/amy/stress-report/route.ts |
| docs/_archive/root/CHANGES.md | Zusammenfassung der Änderungen | 2026-01-11 | /api/funnels/[slug]/definition/route.ts, /api/funnels/[slug]/content-pages/route.ts, /api/content-pages/[slug], /api/funnels/[slug]/content-pages, /api/admin/content-pages/, /api/funnels/, /api/amy/stress-report/route.ts, /api/amy/stress-report |
| docs/_archive/root/CODE_REVIEW_COMPLIANCE.md | V05-I05.7 Code Review Compliance Verification | 2026-01-11 | /api/review/queue/route.ts, /api/review/[id]/route.ts, /api/review/[id]/decide/route.ts, /api/review/__tests__/httpSemantics.test.ts |
| docs/_archive/root/CONTENT_QA_CHECKLIST.md | Content QA Checklist – v0.3 | 2026-01-11 | /api/funnels/, /api/content-resolver, /api/admin/content-pages |
| docs/_archive/root/DEPLOYMENT_VERIFICATION_V05_I02_3.md | V05-I02.3: Final Verification Checklist | 2026-01-20 | /api/funnels/catalog, /api/funnels/catalog/cardiovascular-age, /api/funnels/catalog/sleep-quality, /api/funnels/catalog/heart-health-nutrition |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | V05-HYGIENE-A Implementation Summary | 2026-01-11 | /api/admin/funnels/route.ts, /api/admin/funnels/[id]/route.ts, /api/admin/funnel-steps/route.ts, /api/admin/funnel-steps/[id]/route.ts, /api/admin/funnel-step-questions/[id]/route.ts, /api/responses, /api/admin/funnels/, /api/admin/funnels/__tests__/route.test.ts, /api/admin/funnels, /api/responses.ts |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_B.md | V05-HYGIENE-B Implementation Evidence | 2026-01-11 | /api/funnels/catalog/, /api/funnels/catalog/[slug]/route.ts, /api/funnels/catalog/[slug]/__tests__/route.test.ts, /api/funnels/catalog/[slug] |
| docs/_archive/root/IMPLEMENTATION_V05_P0_DEPLOY_VERIFICATION.md | V0.5 P0 Production Fixes - Implementation Summary | 2026-01-11 | /api/content/resolve, /api/funnels/, /api/content/resolve/route.ts, /api/funnels/[slug]/content-pages/route.ts, /api/funnels/[slug]/content-pages, /api/funnels/[slug]/assessments, /api/assessment-answers/save |
| docs/_archive/root/MANUAL_TEST_V05_I03_3.md | V05-I03.3 Manual Testing Guide | 2026-01-11 | /api/funnels/stress/assessments, /api/funnels/.../assessments/... |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | v0.5 Release Checklist - Evidence-Based | 2026-01-11 | /api/auth/callback, /api/auth/callback/route.ts, /api/admin/usage, /api/admin/usage/route.ts, /api/admin/kpi-thresholds, /api/admin/kpi-thresholds/route.ts, /api/admin/notification-templates, /api/admin/notification-templates/route.ts, /api/admin/navigation/[role], /api/admin/navigation/[role]/route.ts, /api/admin/reassessment-rules/[id], /api/admin/reassessment-rules/[id]/route.ts, /api/content-resolver, /api/content-resolver/route.ts, /api/funnels/, /api/notifications, /api/notifications/route.ts, /api/notifications/[id], /api/notifications/[id]/route.ts, /api/review/queue, /api/review/queue/route.ts, /api/processing/jobs/[jobId], /api/processing/jobs/[jobId]/route.ts, /api/__tests__/authHelpers.test.ts |
| docs/_archive/root/RELEASE_NOTES_V0.5.md | Release Notes: v0.5 | 2026-01-11 | /api/admin/design-tokens/route.ts |
| docs/_archive/root/REVIEW_EVIDENCE.md | Evidence Document: V0.5 P0 Production Fixes - Review Response | 2026-01-11 | /api/content/resolve, /api/funnels/[slug]/content-pages, /api/funnels/[slug]/assessments, /api/assessment-answers/save, /api/content/resolve.ts, /api/content/resolve/__tests__/route.test.ts, /api/funnels/[slug]/content-pages/__tests__/route.test.ts |
| docs/_archive/root/TV05_01B_IMPLEMENTATION.md | TV05_01B Implementation Summary | 2026-01-11 | /api/admin/diagnostics/pillars-sot/route.ts, /api/admin/diagnostics/pillars-sot/__tests__/route.test.ts, /api/admin/diagnostics/pillars-sot |
| docs/_archive/root/TV05_01D_IMPLEMENTATION_SUMMARY.md | TV05_01D Implementation Summary | 2026-01-11 | /api/funnels/catalog/route.ts, /api/funnels/catalog, /api/funnels/catalog/__tests__/catalog.test.ts |
| docs/_archive/root/TV05_01D_VERIFICATION.md | TV05_01D Implementation Verification | 2026-01-11 | /api/funnels/catalog, /api/funnels/catalog/__tests__/catalog.test.ts, /api/funnels/catalog/route.ts |
| docs/_archive/root/TV05_01_IMPLEMENTATION_SUMMARY.md | TV05_01-AUDIT-RUNTIME: Implementation Summary | 2026-01-11 | /api/amy/, /api/admin/usage/, /api/amy/stress-report, /api/amy/stress-summary, /api/consent/record, /api/content/resolve, /api/your-route, /api/admin/usage, /api/admin/usage/__tests__/route.test.ts, /api/admin/usage/route.ts, /api/consent/, /api/your-new-route |
| docs/_archive/root/TV05_01_VERIFICATION_EVIDENCE.md | TV05_01: Runtime Usage Telemetry - Verification Evidence | 2026-01-11 | /api/amy/stress-report, /api/amy/stress-summary, /api/consent/record, /api/content/resolve, /api/amy/stress-report/route.ts, /api/admin/usage, /api/admin/usage/route.ts, /api/admin/usage/__tests__/route.test.ts, /api/test, /api/responses.ts |
| docs/_archive/root/V0.5_MANUAL_TESTS.md | v0.5 Manual Tests (P0) | 2026-01-11 | /api/auth/callback/route.ts, /api/review/queue/route.ts, /api/review/[id]/route.ts, /api/review/[id]/details/route.ts, /api/review/[id]/decide/route.ts |
| docs/_archive/root/V05_FIXOPT_01_IMPLEMENTATION.md | V05-FIXOPT-01 Implementation Summary | 2026-01-11 | /api/funnels/catalog, /api/funnels/[slug]/definition, /api/funnels/catalog/route.ts, /api/funnels/[slug]/content-pages/route.ts |
| docs/_archive/root/V05_I01_3_SUMMARY.md | V05-I01.3 Implementation Complete | 2026-01-11 | /api/amy/stress-report/route.ts |
| docs/_archive/root/V05_I02_3_VALIDATION_EVIDENCE.md | V05-I02.3 Validation Evidence | 2026-01-11 | /api/funnels/catalog, /api/funnels/catalog/cardiovascular-age |
| docs/_archive/root/V05_I03_2_IMPLEMENTATION_SUMMARY.md | V05-I03.2 Implementation Summary | 2026-01-11 | /api/assessment-answers/save, /api/funnels/ |
| docs/_archive/root/V05_I03_3_HARDENING_SUMMARY.md | V05-I03.3 Hardening Summary | 2026-01-11 | /api/funnels/__tests__/hardening.test.ts, /api/funnels/[slug]/assessments/[assessmentId]/ |
| docs/_archive/root/V05_I03_3_IMPLEMENTATION_SUMMARY.md | V05-I03.3 Implementation Summary | 2026-01-11 | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/__tests__/save-resume.test.ts |
| docs/_archive/root/V05_I04_1_IMPLEMENTATION_SUMMARY.md | V05-I04.1 Implementation Summary | 2026-01-11 | /api/documents/upload, /api/documents/[id]/status, /api/documents/upload/route.ts, /api/documents/[id]/status/route.ts |
| docs/_archive/root/V05_I04_2_IMPLEMENTATION_SUMMARY.md | V05-I04.2 Implementation Summary | 2026-01-11 | /api/documents/[id]/extract/route.ts, /api/documents/[id]/extract, /api/documents/ |
| docs/_archive/root/V05_I05_1_IMPLEMENTATION_EVIDENCE.md | V05-I05.1 Implementation Evidence | 2026-01-11 | /api/processing/start/route.ts, /api/processing/jobs/[jobId]/route.ts, /api/processing/start, /api/processing/jobs/[jobId], /api/processing/__tests__/integration.test.ts |
| docs/_archive/root/V05_I05_1_SUMMARY.md | V05-I05.1 Processing Orchestrator - Implementation Complete ✅ | 2026-01-11 | /api/processing/start/route.ts, /api/processing/jobs/[jobId]/route.ts, /api/processing/__tests__/integration.test.ts, /api/processing/start, /api/processing/jobs/[jobId] |
| docs/_archive/root/V05_I05_2_IMPLEMENTATION_SUMMARY.md | V05-I05.2 Implementation Summary: Risk Calculation Bundle | 2026-01-11 | /api/processing/risk/route.ts, /api/processing/risk |
| docs/_archive/root/V05_I05_3_IMPLEMENTATION_SUMMARY.md | V05-I05.3 Implementation Summary: Priority Ranking (Impact × Feasibility) | 2026-01-11 | /api/processing/ranking/route.ts, /api/processing/ranking |
| docs/_archive/root/V05_I05_4_IMPLEMENTATION_SUMMARY.md | V05-I05.4 Implementation Summary: Content Generation (modulare Sections + Prompt Versioning) | 2026-01-11 | /api/processing/content/route.ts, /api/processing/content |
| docs/_archive/root/V05_I05_5_IMPLEMENTATION_SUMMARY.md | V05-I05.5 Implementation Summary: Medical Validation Layer 1 | 2026-01-11 | /api/processing/validation/route.ts, /api/processing/validation |
| docs/_archive/root/V05_I05_6_IMPLEMENTATION_SUMMARY.md | V05-I05.6 Implementation Summary: Medical Validation Layer 2 | 2026-01-11 | /api/processing/safety/route.ts, /api/processing/safety |
| docs/_archive/root/V05_I05_7_IMPLEMENTATION_SUMMARY.md | V05-I05.7 Implementation Summary: Review Queue | 2026-01-11 | /api/review/queue, /api/review/queue/route.ts, /api/review/[id], /api/review/[id]/route.ts, /api/review/[id]/decide, /api/review/[id]/decide/route.ts, /api/review/ |
| docs/_archive/root/V05_I05_8_FINALIZATION_EVIDENCE.md | V05-I05.8 Finalization Evidence | 2026-01-11 | /api/processing/pdf/__tests__/route.auth-first.test.ts, /api/reports/__tests__/pdf.rbac.test.ts, /api/processing/pdf, /api/reports/[reportId]/pdf, /api/reports |
| docs/_archive/root/V05_I05_8_HARDENING_EVIDENCE.md | V05-I05.8 Hardening Evidence | 2026-01-11 | /api/reports/__tests__/pdf.rbac.test.ts, /api/processing/pdf/route.ts, /api/processing/pdf/__tests__/route.auth-first.test.ts, /api/reports/[reportId]/pdf/route.ts, /api/processing/pdf, /api/reports |
| docs/_archive/root/V05_I05_8_IMPLEMENTATION_SUMMARY.md | V05-I05.8 Implementation Summary: PDF Assembly (HTML → PDF) + Signed URLs + Storage | 2026-01-11 | /api/processing/pdf, /api/processing/pdf/route.ts, /api/reports/[reportId]/pdf, /api/reports/[reportId]/pdf/route.ts |
| docs/_archive/root/V05_I05_9_HARDENING_SUMMARY.md | V05-I05.9 Hardening Summary | 2026-01-11 | /api/processing/delivery, /api/notifications, /api/notifications/[id], /api/processing/delivery/__tests__/route.test.ts, /api/processing/delivery/route.ts, /api/notifications/route.ts, /api/notifications/[id]/route.ts |
| docs/_archive/root/V05_I05_9_IMPLEMENTATION_SUMMARY.md | V05-I05.9 Implementation Summary: Delivery System MVP | 2026-01-11 | /api/processing/delivery, /api/processing/delivery/route.ts, /api/notifications, /api/notifications/route.ts, /api/notifications/[id], /api/notifications/[id]/route.ts, /api/processing/jobs/ |
| docs/_archive/root/V05_I07_3_HARDENING_SUMMARY.md | V05-I07.3 Security Hardening Summary | 2026-01-11 | /api/review/[id]/details, /api/review/[id]/decide, /api/review/[id]/details/__tests__/route.test.ts, /api/review/__tests__/httpSemantics.test.ts, /api/review/[id]/details/route.ts, /api/review/[id]/decide/route.ts |
| docs/_archive/root/V05_I07_3_IMPLEMENTATION_SUMMARY.md | V05-I07.3 Implementation Summary | 2026-01-11 | /api/review/[id]/details/route.ts, /api/review/[id]/details, /api/review/[id]/decide |
| docs/_archive/root/V05_I07_3_MERGE_READY.md | V05-I07.3 Merge-Ready Summary | 2026-01-11 | /api/review/[id]/decide, /api/review/[id]/details/route.ts |
| docs/_archive/root/V05_I07_3_VISUAL_STRUCTURE.md | V05-I07.3 Visual Structure | 2026-01-11 | /api/review/, /api/review/[id]/details, /api/review/[id]/decide |
| docs/_archive/root/V05_I07_4_IMPLEMENTATION_SUMMARY.md | V05-I07.4 Implementation Summary | 2026-01-11 | /api/tasks, /api/tasks/route.ts, /api/tasks/[id], /api/tasks/[id]/route.ts, /api/patient-profiles, /api/patient-profiles/route.ts |
| docs/_archive/root/V05_I07_4_MERGE_READY.md | V05-I07.4 Merge-Ready Summary | 2026-01-11 | /api/tasks, /api/patient-profiles, /api/tasks/[id], /api/tasks/__tests__/route.test.ts, /api/tasks/[id]/__tests__/route.test.ts, /api/tasks/route.ts, /api/tasks/[id]/route.ts, /api/patient-profiles/route.ts |
| docs/_archive/root/V05_I08_1_SECURITY_FIX_SUMMARY.md | V05-I08.1 Implementation Summary - Security Fix | 2026-01-11 | /api/tasks/route.ts, /api/tasks |
| docs/_archive/root/V05_I08_2_IMPLEMENTATION_SUMMARY.md | V05-I08.2 Implementation Summary - Pre-screening Call Script UI (MVP) | 2026-01-11 | /api/pre-screening-calls/route.ts, /api/pre-screening-calls |
| docs/_archive/root/V05_I08_2_MERGE_READY.md | V05-I08.2 Merge Ready Summary | 2026-01-11 | /api/pre-screening-calls/route.ts, /api/pre-screening-calls |
| docs/_archive/root/V05_I08_2_SECURITY_VERIFICATION.md | V05-I08.2 Security Verification Report | 2026-01-11 | /api/pre-screening-calls/route.ts |
| docs/_archive/root/V05_I08_2_VISUAL_MOCKUP.md | Pre-screening Call Script UI - Visual Mockup | 2026-01-11 | /api/pre-screening-calls |
| docs/_archive/root/V05_I08_3_IMPLEMENTATION_SUMMARY.md | V05-I08.3 Implementation Summary - Device Shipment Tracking + Return + Reminders | 2026-01-11 | /api/shipments, /api/shipments/[id], /api/shipments/[id]/events, /api/shipments/route.ts, /api/shipments/[id]/route.ts, /api/shipments/[id]/events/route.ts |
| docs/_archive/root/V05_I08_3_MERGE_READY.md | V05-I08.3 - MERGE READY | 2026-01-11 | /api/shipments, /api/shipments/[id], /api/shipments/[id]/events, /api/shipments/route.ts, /api/shipments/[id]/route.ts, /api/shipments/[id]/events/route.ts |
| docs/_archive/root/V05_I08_3_SECURITY_FIXES.md | V05-I08.3 Security Review Fixes - Summary | 2026-01-11 | /api/shipments/[id]/route.ts, /api/shipments/ |
| docs/_archive/root/V05_I08_4_IMPLEMENTATION_SUMMARY.md | V05-I08.4 Implementation Summary - Support Notes + Escalation to Clinician | 2026-01-11 | /api/support-cases, /api/support-cases/[id], /api/support-cases/[id]/escalate, /api/support-cases/route.ts, /api/support-cases/[id]/route.ts, /api/support-cases/[id]/escalate/route.ts |
| docs/_archive/root/V05_I08_4_MERGE_READY.md | V05-I08.4 Merge Ready Summary | 2026-01-11 | /api/support-cases/route.ts, /api/support-cases/[id]/route.ts, /api/support-cases/[id]/escalate/route.ts, /api/support-cases, /api/support-cases/ |
| docs/_archive/root/V05_I08_4_SECURITY_HARDENING.md | V05-I08.4 Security Hardening & Verification Report | 2026-01-11 | /api/support-cases/[id]/escalate/__tests__/route.test.ts, /api/support-cases/[id]/escalate/route.ts, /api/support-cases/route.ts, /api/support-cases |
| docs/_archive/root/V05_I09_1_IMPLEMENTATION_SUMMARY.md | V05-I09.1 — Admin Navigation/Layouts Config | 2026-01-11 | /api/admin/navigation, /api/admin/navigation/[role], /api/admin/navigation/route.ts, /api/admin/navigation/[role]/route.ts |
| docs/_archive/root/V05_I09_1_VISUAL_STRUCTURE.md | V05-I09.1 Navigation Config - Visual Structure | 2026-01-11 | /api/admin/navigation, /api/admin/navigation/, /api/admin/navigation/[role] |
| docs/_archive/root/V05_I09_2_IMPLEMENTATION_SUMMARY.md | V05-I09.2 Implementation Summary | 2026-01-11 | /api/admin/design-tokens, /api/admin/design-tokens/route.ts |
| docs/_archive/root/V05_I09_2_VISUAL_STRUCTURE.md | V05-I09.2 Visual Structure | 2026-01-11 | /api/admin/design-tokens |
| docs/_archive/root/V05_I09_3_IMPLEMENTATION_SUMMARY.md | V05-I09.3 Implementation Summary | 2026-01-11 | /api/admin/funnel-versions/[id], /api/admin/funnels/[id], /api/admin/funnel-versions/[id]/route.ts, /api/admin/funnel-versions/[id]/__tests__/route.test.ts |
| docs/_archive/root/V05_I09_4_IMPLEMENTATION_SUMMARY.md | V05-I09.4 Implementation Summary | 2026-01-11 | /api/admin/notification-templates, /api/admin/notification-templates/[id], /api/admin/reassessment-rules, /api/admin/reassessment-rules/[id], /api/admin/kpi-thresholds, /api/admin/kpi-thresholds/[id], /api/admin/operational-settings-audit, /api/admin/notification-templates/route.ts, /api/admin/notification-templates/[id]/route.ts, /api/admin/reassessment-rules/route.ts, /api/admin/reassessment-rules/[id]/route.ts, /api/admin/kpi-thresholds/route.ts, /api/admin/kpi-thresholds/[id]/route.ts, /api/admin/operational-settings-audit/route.ts |
| docs/_archive/root/V05_I10_1_IMPLEMENTATION_SUMMARY.md | V05-I10.1 Implementation Summary | 2026-01-11 | /api/consent/record, /api/consent/status, /api/patient-measures/export, /api/patient-measures/export/route.ts |
| docs/_archive/root/V05_I10_1_VERIFICATION.md | V05-I10.1 Implementation Verification | 2026-01-11 | /api/consent/record, /api/consent/status, /api/patient-measures/export, /api/patient-measures/export/route.ts |
| docs/_archive/root/V05_I10_2_IMPLEMENTATION_SUMMARY.md | V05-I10.2 Implementation Summary | 2026-01-11 | /api/account/deletion-request/route.ts, /api/account/deletion-request, /api/account/deletion-cancel |
| docs/_archive/root/V05_I10_2_VERIFICATION.md | V05-I10.2 Verification Checklist | 2026-01-11 | /api/account/deletion-request, /api/account/deletion-request/route.ts |
| docs/_archive/root/V05_I10_3_FINAL_SUMMARY.md | V05-I10.3 - Final Summary | 2026-01-11 | /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/amy/stress-report/route.ts |
| docs/_archive/root/V05_I10_3_IMPLEMENTATION_SUMMARY.md | V05-I10.3 Implementation Summary | 2026-01-11 | /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/amy/stress-report/route.ts |
| docs/_archive/root/V05_I10_4_IMPLEMENTATION_SUMMARY.md | V05-I10.4 Implementation Summary | 2026-01-11 | /api/review/queue, /api/review/ |
| docs/_archive/root/V05_I10_4_VISUAL_STRUCTURE.md | Review Queue Dashboard - Visual Structure | 2026-01-11 | /api/review/queue |
| docs/_archive/root/VERIFICATION_EVIDENCE.md | V05-I01.4 Verification Evidence | 2026-01-11 | /api/amy/stress-report, /api/funnels/[slug]/assessments |
| docs/_archive_0_3/A5_IMPLEMENTATION_SUMMARY.md | A5 — Mobile Funnel Integration Implementation Summary | 2025-12-11 | /api/assessment-answers/save, /api/assessment-answers/save/route.ts |
| docs/_archive_0_3/AMY_FALLBACK.md | AMY Fallback-Mechanismus | 2025-12-11 | /api/amy/stress-report, /api/amy/stress-summary |
| docs/_archive_0_3/B1_IMPLEMENTATION.md | B1 — Funnel Definition aus DB-Tabellen zusammensetzen | 2025-12-11 | /api/funnels/[slug]/definition/route.ts, /api/funnels/, /api/funnels/stress/definition |
| docs/_archive_0_3/B1_SUMMARY.md | B1 — Implementierung abgeschlossen ✅ | 2025-12-11 | /api/funnels/[slug]/definition/route.ts, /api/funnels/, /api/funnels/stress/definition, /api/funnels/[slug]/definition |
| docs/_archive_0_3/B1_TESTING_GUIDE.md | B1 Testing Guide - Funnel Definition API | 2025-12-11 | /api/funnels/stress/definition, /api/funnels/nonexistent/definition, /api/funnels/[slug]/definition/route.ts |
| docs/_archive_0_3/B2.2_IMPLEMENTATION.md | B2.2 — Step-by-Step Navigation mit Validierungsintegration | 2025-12-11 | /api/funnels/stress/definition, /api/assessment-validation/validate-step |
| docs/_archive_0_3/B2.2_TESTING_GUIDE.md | B2.2 — Step-by-Step Navigation Testing Guide | 2025-12-11 | /api/assessment-validation/validate-step |
| docs/_archive_0_3/B2_IMPLEMENTATION.md | B2 Save-Logic für neue Messungen - Implementation Details | 2025-12-11 | /api/amy/stress-report, /api/amy/stress-report/route.ts, /api/patient-measures/export/route.ts |
| docs/_archive_0_3/B2_TESTING_GUIDE.md | Manual Testing Guide for B2 Save-Logic | 2025-12-11 | /api/amy/stress-report |
| docs/_archive_0_3/B2_VALIDATION_IMPLEMENTATION.md | B2 — Answer Validation v2 Implementation | 2025-12-11 | /api/assessment-validation/validate-step/route.ts, /api/assessment-validation/validate-step |
| docs/_archive_0_3/B2_VALIDATION_TESTING_GUIDE.md | B2 Answer Validation v2 - Testing Guide | 2025-12-11 | /api/assessment-validation/validate-step |
| docs/_archive_0_3/B3_IMPLEMENTATION_SUMMARY.md | B3 Navigation Implementation - Summary | 2025-12-11 | /api/assessments/[id]/current-step, /api/assessments/[id]/navigation, /api/assessments/[id]/resume, /api/assessments/ |
| docs/_archive_0_3/B3_NAVIGATION_API.md | B3 Assessment Navigation API | 2025-12-11 | /api/assessments/[id]/current-step, /api/assessments/550e8400-e29b-41d4-a716-446655440000/current-step, /api/assessments/[id]/navigation, /api/assessments/550e8400-e29b-41d4-a716-446655440000/navigation, /api/assessments/[id]/resume, /api/assessments/550e8400-e29b-41d4-a716-446655440000/resume, /api/assessments/ |
| docs/_archive_0_3/B3_NAVIGATION_EXAMPLES.md | B3 Navigation - Beispiel Integration | 2025-12-11 | /api/assessments/, /api/assessment-answers/save |
| docs/_archive_0_3/B4_DYNAMIC_VALIDATION_RULES.md | B4 — Erweiterte Validierungsregeln (Conditional Required & dynamische Logik) | 2025-12-11 | /api/assessment-validation/validate-step, /api/assessment-validation/validate-step/route.ts |
| docs/_archive_0_3/B4_IMPLEMENTATION_SUMMARY.md | B4 Implementation Summary | 2025-12-11 | /api/assessment-validation/validate-step/route.ts |
| docs/_archive_0_3/B4_TESTING_GUIDE.md | B4 Dynamic Validation Rules - Testing Guide | 2025-12-11 | /api/assessment-validation/validate-step |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | B5 — Funnel Runtime Backend (Assessment Lifecycle & Step Navigation) | 2025-12-11 | /api/funnels/, /api/funnels/stress/assessments, /api/funnels/stress/assessments/abc-123, /api/assessment-answers/save, /api/funnels/stress/assessments/abc-123/steps/step-1/validate, /api/funnels/stress/assessments/abc-123/complete, /api/funnels/stress/assessments/, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/assessment-answers/save/route.ts |
| docs/_archive_0_3/B5_IMPLEMENTATION_SUMMARY.md | B5 Implementation Summary - Quick Reference | 2025-12-11 | /api/funnels/, /api/assessment-answers/save, /api/assessment-answers/save/route.ts, /api/funnels/stress/assessments, /api/funnels/stress/assessments/ |
| docs/_archive_0_3/B5_TESTING_GUIDE.md | B5 Funnel Runtime Backend - Testing Guide | 2025-12-11 | /api/funnels/stress/assessments, /api/assessment-answers/save, /api/funnels/stress/assessments/, /api/assessment-validation/validate-step, /api/assessments/, /api/funnels/invalid-slug/assessments |
| docs/_archive_0_3/B6_FRONTEND_INTEGRATION.md | B6 — Frontend-Integration der Funnel Runtime (B5) | 2025-12-11 | /api/funnels/stress/assessments, /api/assessment-answers/save, /api/funnels/stress/assessments/, /api/.../steps/, /api/.../complete |
| docs/_archive_0_3/B6_IMPLEMENTATION_SUMMARY.md | B6 Implementation Summary - Quick Reference | 2025-12-11 | /api/funnels/stress/assessments, /api/assessment-answers/save, /api/.../complete, /api/funnels/stress/assessments/ |
| docs/_archive_0_3/B7_IMPLEMENTATION.md | B7 — Clinician Funnel Management UI | 2025-12-11 | /api/admin/funnels, /api/admin/funnels/[id], /api/admin/funnel-steps/[id], /api/admin/funnel-step-questions/[id], /api/admin/funnels/[funnel-id], /api/admin/funnel-steps/[step-id], /api/admin/funnel-step-questions/[question-id] |
| docs/_archive_0_3/B7_SUMMARY.md | B7 — Implementierungszusammenfassung | 2025-12-11 | /api/admin/funnels, /api/admin/funnels/[id], /api/admin/funnel-steps/[id], /api/admin/funnel-step-questions/[id], /api/admin/... |
| docs/_archive_0_3/B7_TESTING_GUIDE.md | B7 Testing Guide - Funnel Management UI | 2025-12-11 | /api/admin/funnels, /api/admin/funnels/, /api/admin/funnel-steps/, /api/admin/funnel-step-questions/ |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | B8 Implementation Summary | 2025-12-11 | /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/assessment-answers/save, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/..., /api/funnels/stress/assessments/..., /api/responseTypes.ts, /api/responses.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/assessment-answers/save/route.ts, /api/assessment-validation/validate-step/route.ts, /api/funnels/stress/assessments, /api/funnels/stress/assessments/, /api/funnels/, /api/assessment-validation/validate-step |
| docs/_archive_0_3/D1_CONTENT_PAGES.md | D1: Content Pages Implementation | 2025-12-11 | /api/funnels/, /api/content-pages/, /api/funnels/stress-assessment/content-pages, /api/funnels/[slug]/content-pages/route.ts, /api/content-pages/[slug]/route.ts |
| docs/_archive_0_3/D2_CONSENT_STORAGE.md | D2: Consent Data Storage Implementation | 2025-12-11 | /api/consent/record, /api/consent/status |
| docs/_archive_0_3/D2_CONTENT_INTEGRATION.md | D2: Content Pages Integration in Funnel Context | 2025-12-11 | /api/funnels/ |
| docs/_archive_0_3/D2_CONTENT_INTEGRATION_SUMMARY.md | D2 (Content Integration) Implementation Summary | 2025-12-11 | /api/funnels/ |
| docs/_archive_0_3/D2_IMPLEMENTATION_SUMMARY.md | D2 Implementation Summary | 2025-12-11 | /api/consent/record/route.ts, /api/consent/status/route.ts, /api/consent/record, /api/consent/status |
| docs/_archive_0_3/E1_LOGGING_IMPLEMENTATION.md | E1 Logging Implementation - Zentrale technische Parameter | 2025-12-11 | /api/amy/stress-report/route.ts, /api/amy/stress-summary/route.ts |
| docs/_archive_0_3/E1_TESTING_TIPS.md | E1 — Mobile Device Testing Tips & Tricks | 2025-12-11 | /api/assessment-answers/save |
| docs/_archive_0_3/E2_IMPLEMENTATION.md | E2 Feature Flags - Implementation Summary | 2025-12-11 | /api/amy/stress-report/route.ts |
| docs/_archive_0_3/E2_RECOVERY_TESTING.md | E2 — Recovery & Resume Testing Guide | 2025-12-11 | /api/funnels/[slug]/assessments/[id]/answers/save, /api/assessments/[id]/resume |
| docs/_archive_0_3/E3_PERFORMANCE_OPTIMIZATION.md | E3 — Performance Optimization (Funnel & Content) | 2025-12-11 | /api/funnels/[slug]/definition, /api/content-pages/[slug] |
| docs/_archive_0_3/E3_PERFORMANCE_TESTING_GUIDE.md | Performance Testing Guide — E3 | 2025-12-11 | /api/funnels/[slug]/definition |
| docs/_archive_0_3/EPIC_B_CONSOLIDATION.md | Epic B — Abschluss & Final Consolidation | 2025-12-11 | /api/funnels/, /api/funnels/[slug]/definition/route.ts, /api/assessment-validation/validate-step, /api/assessment-answers/save, /api/admin/funnels, /api/admin/funnels/[id], /api/admin/funnel-steps/[id], /api/admin/funnel-step-questions/[id], /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/responseTypes.ts, /api/responses.ts, /api/funnels/stress/assessments |
| docs/_archive_0_3/F10_API_PROTECTION.md | F10 – API-Schutz für Content-CRUD | 2025-12-11 | /api/admin/content-pages/, /api/admin/content-pages, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/[sectionId], /api/content-pages/[slug], /api/authHelpers.ts, /api/__tests__/authHelpers.test.ts, /api/authHelpers |
| docs/_archive_0_3/F10_SECURITY_VERIFICATION.md | F10 Security Verification Checklist | 2025-12-11 | /api/admin/content-pages, /api/admin/content-pages/[id], /api/content-pages/[slug], /api/__tests__/authHelpers.test.ts, /api/content-pages/some-draft-slug, /api/content-pages/some-published-slug |
| docs/_archive_0_3/F2_CONTENT_EDITOR.md | F2 – Content Page Editor | 2025-12-11 | /api/admin/content-pages, /api/admin/content-pages/[id] |
| docs/_archive_0_3/F2_IMPLEMENTATION_SUMMARY.md | F2 Implementation Summary | 2025-12-11 | /api/admin/content-pages, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/route.ts, /api/admin/content-pages/route.ts |
| docs/_archive_0_3/F2_QUICKSTART.md | F2 Content Page Editor - Quick Start Guide | 2025-12-11 | /api/admin/content-pages, /api/admin/content-pages/[id] |
| docs/_archive_0_3/F4_STATUS_WORKFLOW.md | F4 – Status Workflow Implementation | 2025-12-11 | /api/content-pages/[slug], /api/funnels/[slug]/content-pages, /api/admin/content-pages |
| docs/_archive_0_3/F6_IMPLEMENTATION_SUMMARY.md | F6 — Intro-Page Integration in Stress-Funnel | 2025-12-11 | /api/content/resolve, /api/content/resolve/route.ts |
| docs/_archive_0_3/F7_IMPLEMENTATION_SUMMARY.md | F7 Implementation Summary – Info-Pages Rendering unter /content/[slug] | 2025-12-11 | /api/content-pages/[slug] |
| docs/_archive_0_3/F8_IMPLEMENTATION_SUMMARY.md | F8 – Result-Bausteine dynamisch integrieren | 2025-12-11 | /api/content-resolver, /api/content-resolver/route.ts |
| docs/_archive_0_3/F8_QUICKSTART.md | F8 Quick Start: Adding Result Content Blocks | 2025-12-11 | /api/content-resolver |
| docs/_archive_0_3/F8_TESTING_CHECKLIST.md | F8 Testing Checklist | 2025-12-11 | /api/content-resolver, /api/content-resolver/route.ts |
| docs/_archive_0_3/F9_ADMIN_ROUTE_GUARDING.md | F9 – Admin-Route-Guarding Implementation | 2025-12-11 | /api/admin/content-pages, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/[sectionId], /api/admin/funnels, /api/admin/funnels/[id], /api/admin/funnel-steps/[id], /api/admin/funnel-step-questions/[id], /api/admin/content-pages/route.ts, /api/admin/content-pages/[id]/route.ts, /api/admin/content-pages/[id]/sections/route.ts, /api/admin/content-pages/[id]/sections/[sectionId]/route.ts, /api/admin/funnels/route.ts, /api/admin/funnels/[id]/route.ts, /api/admin/funnel-steps/[id]/route.ts, /api/admin/funnel-step-questions/[id]/route.ts |
| docs/_archive_0_3/FEATURE_FLAGS.md | Feature Flags Documentation | 2025-12-11 | /api/amy/stress-report, /api/amy/stress-report/route.ts |
| docs/_archive_0_3/FIX_SUMMARY_DE.md | Fix Summary: „Weiter"-Button Problem im Stress-Funnel | 2025-12-11 | /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts |
| docs/_archive_0_3/ISSUES_v0.3.md | EPIC: v0.3 ÔÇô Funnel-Engine Backend (konfigurierbare Funnels) | 2025-12-11 | /api/funnels/[slug], /api/funnels/[slug]/route.ts, /api/funnels/stress, /api/funnel-assessments/[slug], /api/funnel-assessments/[slug]/route.ts, /api/content/[slug], /api/content/[slug]., /api/content/was-ist-stress |
| docs/_archive_0_3/JSON_EXPORT.md | JSON Export für Verlaufsdaten | 2026-01-07 | /api/patient-measures/export |
| docs/_archive_0_3/SAVE_ON_TAP.md | Save-on-Tap Feature Implementation | 2025-12-11 | /api/assessment-answers/save, /api/assessment-answers/save/route.ts |
| docs/_archive_0_3/WEITER_BUTTON_FIX.md | Weiter-Button Fix - Testing Guide | 2025-12-11 | /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId], /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/answers/save, /api/funnels/[slug]/assessments/[assessmentId]/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts, /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/[slug]/definition/route.ts |
| E74.3-COMPLETE.md | E74.3 — Studio Funnel Editor v1 — COMPLETE (Backend) | 2026-02-01 | /api/admin/studio/funnels/, /api/admin/studio/funnels/[slug]/drafts, /api/admin/studio/funnels/[slug]/drafts/[draftId], /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate, /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish, /api/admin/studio/funnels/[slug]/history, /api/admin/studio/funnels/[slug]/drafts/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId]/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts, /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish/route.ts, /api/admin/studio/funnels/[slug]/history/route.ts |
| E74.4-COMPLETE.md | E74.4 — Patient Funnel Execution UI v1 — COMPLETE | 2026-02-01 | /api/funnels/[slug]/definition, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/ |
| E74.5-COMPLETE.md | E74.5 — Persistenz: Answers + Progress (SSOT) + Resume deterministisch | 2026-02-01 | /api/funnels/[slug]/assessments/[id]/answers/save, /api/assessments/[id]/resume, /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/funnels/, /api/assessments/[id]/resume/route.ts, /api/assessmentPersistence.ts, /api/funnels/stress/assessments/ABC/answers/save, /api/assessments/ABC/resume |
| E74.5-SUMMARY.md | E74.5 Implementation Summary - Quick Reference | 2026-02-01 | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts, /api/assessments/[id]/resume/route.ts, /api/assessmentPersistence.ts |
| E74.6-COMPLETE.md | E74.6 - COMPLETE | 2026-02-01 | /api/clinician/patient-funnels/route.ts, /api/clinician/patient-funnels/[id]/route.ts, /api/clinician/patients/[patientId]/funnels/route.ts, /api/clinician/patient-funnels, /api/clinician/patient-funnels/[id], /api/clinician/patients/[patientId]/funnels |
| E74.6-SUMMARY.md | E74.6 Implementation Summary | 2026-02-01 | /api/clinician/patient-funnels, /api/clinician/patient-funnels/[id], /api/clinician/patients/[patientId]/funnels, /api/clinician/patient-funnels/route.ts, /api/clinician/patient-funnels/[id]/route.ts, /api/clinician/patients/[patientId]/funnels/route.ts |
| E74.7-COMPLETE.md | E74.7 - COMPLETE | 2026-02-01 | /api/funnels/[slug]/assessments/route.ts, /api/funnels/[slug]/assessments, /api/funnels/__tests__/e74-7-idempotency.test.ts, /api/funnels/, /api/funnels/stress-assessment/assessments, /api/funnels/cardiovascular-age/assessments |
| E74.7-SUMMARY.md | E74.7 - Implementation Summary | 2026-02-01 | /api/funnels/[slug]/assessments/route.ts, /api/funnels/, /api/funnels/stress/assessments, /api/funnels/__tests__/e74-7-idempotency.test.ts |
| E75.2-COMPLETE.md | E75.2 Implementation Summary | 2026-02-02 | /api/patient/anamnesis, /api/patient/anamnesis/[entryId], /api/patient/anamnesis/[entryId]/versions, /api/patient/anamnesis/[entryId]/archive, /api/studio, /api/studio/patients/[patientId]/anamnesis, /api/studio/anamnesis/[entryId]/versions, /api/studio/anamnesis/[entryId]/archive, /api/patient/anamnesis/route.ts, /api/patient/anamnesis/[entryId]/route.ts, /api/patient/anamnesis/[entryId]/versions/route.ts, /api/patient/anamnesis/[entryId]/archive/route.ts, /api/studio/patients/[patientId]/anamnesis/route.ts, /api/studio/anamnesis/[entryId]/versions/route.ts, /api/studio/anamnesis/[entryId]/archive/route.ts, /api/anamnesis/validation.ts, /api/anamnesis/helpers.ts, /api/patient/anamnesis/, /api/studio/patients/, /api/responseTypes.ts |
| E75.3-COMPLETE.md | E75.3 Implementation Complete Summary | 2026-02-02 | /api/patient/anamnesis/[entryId], /api/patient/anamnesis, /api/patient/anamnesis/[entryId]/archive, /api/patient/anamnesis/[entryId]/route.ts |
| E75.4-COMPLETE.md | E75.4 Implementation Summary | 2026-02-02 | /api/studio/patients/[patientId]/anamnesis, /api/studio/anamnesis/[entryId]/versions, /api/studio/anamnesis/[entryId]/archive, /api/anamnesis/validation, /api/studio/patients/[patientId]/anamnesis/route.ts, /api/studio/anamnesis/[entryId]/versions/route.ts, /api/studio/anamnesis/[entryId]/archive/route.ts, /api/anamnesis/validation.ts, /api/anamnesis/helpers.ts |
| E75.5-COMPLETE.md | E75.5 Implementation Summary | 2026-02-02 | /api/patient/anamnesis, /api/patient/anamnesis/[entryId], /api/studio/patients/[patientId]/anamnesis, /api/admin/anamnesis/regenerate-summaries |
| E75.6-COMPLETE.md | E75.6 Implementation Summary — JSON Export (Patient + Clinician) | 2026-02-02 | /api/patient/anamnesis/export.json/route.ts, /api/patient/anamnesis/export.json, /api/studio/patients/[patientId]/anamnesis/export.json/route.ts, /api/studio/patients/[patientId]/anamnesis/export.json, /api/anamnesis/export.ts, /api/anamnesis/exportClient.ts, /api/studio/patients/ |
| E76.1-COMPLETE.md | E76.1 - MCP Server Skeleton + Tooling Contract - COMPLETE | 2026-02-02 | /api/mcp/route.ts, /api/mcp, /api/endpoint-allowlist.json |
| E76.2-COMPLETE.md | E76.2 — Context Pack Builder v1 — COMPLETE | 2026-02-03 | /api/mcp/context-pack, /api/mcp/context-pack/route.ts, /api/endpoint-allowlist.json |
| E76.4-COMPLETE.md | E76.4 — Execution Worker: Diagnose-Run ausführen + Artefakt persistieren — COMPLETE | 2026-02-04 | /api/studio/diagnosis/execute, /api/studio/diagnosis/execute/route.ts, /api/mcp/context-pack/route.ts, /api/endpoint-allowlist.json |
| E76.5-COMPLETE.md | E76.5 — Prompt v1 (Diagnosis JSON Spec) + Output Schema Contract — COMPLETE | 2026-02-04 | /api/studio/diagnosis/prompt/route.ts, /api/studio/diagnosis/prompt |
| E76.6-COMPLETE.md | E76.6 — Studio UI: Diagnose Runs + Artifact Viewer (JSON) — COMPLETE | 2026-02-04 | /api/patient/diagnosis/runs, /api/patient/diagnosis/runs/route.ts, /api/patient/diagnosis/artifacts/[id], /api/patient/diagnosis/artifacts/[id]/route.ts, /api/patient/diagnosis/artifacts/ |
| E76.8-COMPLETE.md | E76.8 — Determinism & Idempotenz: inputs_hash + Dedupe Policy — COMPLETE | 2026-02-04 | /api/studio/diagnosis/queue, /api/studio/diagnosis/queue/route.ts, /api/endpoint-allowlist.json |
| E76.9-COMPLETE.md | E76.9 Implementation Summary | 2026-02-04 | /api/..., /api/endpoint-allowlist.json, /api/example, /api/admin/content-pages/[id]/sections, /api/admin/funnel-steps/[id]/questions, /api/admin/funnel-versions/[id], /api/admin/funnels/[id], /api/clinician/assessments/[assessmentId]/details, /api/clinician/patients/[patientId]/funnels, /api/assessments/[id]/resume, /api/assessments/[id]/state, /api/funnels/[slug]/assessments, /api/funnels/[slug]/definition, /api/funnels/catalog/[slug], /api/patient/anamnesis/export.json, /api/patient/diagnosis/artifacts/[id], /api/studio/patients/[patientId]/anamnesis/export.json, /api/tasks/[id], /api/mcp |
| E78.1-COMPLETE.md | E78.1 Implementation Summary | 2026-02-05 | /api/admin/processing/retry/, /api/clinician/inbox, /api/clinician/inbox/, /api/clinician/inbox/stats |
| E78.2-COMPLETE.md | E78.2 Implementation Summary | 2026-02-05 | /api/clinician/inbox |
| E78.3-COMPLETE.md | E78.3 Implementation Summary | 2026-02-05 | /api/clinician/triage, /api/clinician/triage/route.ts |
| E78.3-SUMMARY.md | E78.3 Quick Reference | 2026-02-05 | /api/clinician/triage, /api/clinician/triage/route.ts |
| E78.3-VERIFICATION-REPORT.md | E78.3 Implementation Verification Report | 2026-02-05 | /api/clinician/triage, /api/clinician/triage/route.ts, /api/responses |
| E78.7-COMPLETE.md | E78.7 Implementation Summary | 2026-02-05 | /api/clinician/triage, /api/clinician/triage/ |
| legacy/README.md | Legacy Code Quarantine Zone | 2026-01-28 | /api/[original-path], /api/[route], /api/ENDPOINT_CATALOG.md |
| legacy/routes/README.md | Legacy 410 Routes Mapping | 2026-01-28 | /api/admin/funnels, /api/admin/funnels/[id], /api/admin/funnel-steps, /api/admin/funnel-steps/[id], /api/admin/reassessment-rules, /api/admin/reassessment-rules/[id], /api/admin/usage, /api/admin/kpi-thresholds, /api/admin/kpi-thresholds/[id], /api/admin/content-pages, /api/admin/content-pages/[id], /api/admin/content-pages/[id]/sections, /api/admin/content-pages/[id]/sections/[sectionId], /api/admin/pilot/kpis, /api/admin/pilot/flow-events, /api/assessments, /api/assessments/[id], /api/assessment-answers, /api/assessment-validation, /api/amy/stress-report, /api/amy/stress-summary, /api/amy/triage, /api/auth/callback, /api/auth/debug, /api/auth/debug-cookie, /api/auth/resolve-role, /api/auth/signout, /api/content/resolve, /api/content-resolver, /api/content-pages, /api/documents/upload, /api/documents/[id]/extract, /api/documents/[id]/status, /api/funnels/active, /api/funnels/[slug]/assessments, /api/funnels/[slug]/assessments/[assessmentId], /api/funnels/[slug]/assessments/[assessmentId]/complete, /api/funnels/[slug]/assessments/[assessmentId]/result, /api/funnels/[slug]/assessments/[assessmentId]/workup, /api/funnels/[slug]/content-pages, /api/patient/dashboard, /api/patient/triage, /api/patient-profiles, /api/patient-measures/export, /api/patient-measures/history, /api/processing/start, /api/processing/validation, /api/processing/safety, /api/processing/risk, /api/processing/ranking, /api/processing/content, /api/processing/delivery, /api/processing/pdf, /api/processing/jobs/[jobId], /api/processing/jobs/[jobId]/download, /api/reports, /api/reports/[reportId], /api/reports/[reportId]/pdf, /api/review/queue, /api/review/[id], /api/review/[id]/decide, /api/review/[id]/details, /api/account/deletion-request, /api/consent/record, /api/consent/status, /api/escalation/log-click, /api/health, /api/health/env, /api/notifications, /api/notifications/[id], /api/pre-screening-calls, /api/shipments, /api/shipments/[id], /api/shipments/[id]/events, /api/support-cases, /api/support-cases/[id], /api/support-cases/[id]/escalate, /api/tasks, /api/tasks/[id], /api/test/correlation-id, /api/ENDPOINT_CATALOG.md, /api/endpoint-allowlist.json |
| lib/pdf/README.md | PDF Module | 2026-01-04 | /api/processing/pdf, /api/reports/[reportId]/pdf |
| lib/questionnaire/MANIFEST_WIRING.md | Funnel Manifest Wiring Guide | 2026-01-03 | /api/funnels/[slug]/questionnaire/route.ts, /api/funnels/ |
| lib/questionnaire/README.md | Adaptive Questionnaire Engine (V05-I03.2) | 2026-01-02 | /api/assessment-answers/save, /api/funnels/ |
| lib/results/README.md | Calculated Results Module (E73.3) | 2026-01-28 | /api/processing/results, /api/ENDPOINT_CATALOG.md |
| lib/review/README.md | Review Queue Module - V05-I05.7 | 2026-01-04 | /api/review/queue, /api/review/ |
| packages/mcp-server/README.md | MCP Server | 2026-02-04 | /api/mcp/route.ts |
| RULES_VS_CHECKS_MATRIX_E75_4.md | E75.4 Rules vs Checks Matrix | 2026-02-02 | /api/studio/patients/[patientId]/anamnesis, /api/studio/anamnesis/[entryId]/versions, /api/studio/anamnesis/[entryId]/archive, /api/studio/patients/[patientId]/anamnesis/route.ts |
| supabase/README.md | Supabase Database Schema | 2025-12-06 | /api/amy/stress-report |

## Doku-Drift (Doku ≠ Code)

| DOC FILE | ENDPOINT | STATUS |
| --- | --- | --- |
| .github/copilot-instructions.md | /api/amy/stress-report/ | ❌ missing in repo |
| .github/copilot-instructions.md | /api/your-endpoint/route.ts | ❌ missing in repo |
| .github/copilot-instructions.md | /api/funnels/ | ❌ missing in repo |
| .github/PULL_REQUEST_TEMPLATE.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/ACCOUNT_DELETION_RETENTION.md | /api/account/deletion-cancel | ❌ missing in repo |
| docs/ACCOUNT_DELETION_RETENTION.md | /api/admin/account/execute-deletion | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/patient/anamnesis/ | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/studio | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/studio/ | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/studio/patients/[patientId]/anamnesis | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/patient/anamnesis/route.ts | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/patient/anamnesis/[entryId]/route.ts | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/patient/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/patient/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/studio/patients/[patientId]/anamnesis/route.ts | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/studio/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/studio/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/anamnesis/validation.ts | ❌ missing in repo |
| docs/anamnesis/API_V1.md | /api/anamnesis/helpers.ts | ❌ missing in repo |
| docs/anamnesis/RULES_VS_CHECKS_MATRIX.md | /api/patient/anamnesis/[id] | ❌ missing in repo |
| docs/anamnesis/SCHEMA_V1.md | /api/anamnesis/validation.ts | ❌ missing in repo |
| docs/anamnesis/SECURITY_MODEL.md | /api/patient/anamnesis/OTHER_PATIENT_ENTRY_ID | ❌ missing in repo |
| docs/anamnesis/SECURITY_MODEL.md | /api/studio/patients/NON_ASSIGNED_PATIENT_ID/anamnesis | ❌ missing in repo |
| docs/anamnesis/SECURITY_MODEL.md | /api/studio/patients/ORG_Y_PATIENT_ID/anamnesis | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/_debug/env/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/_meta/ping/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/account/deletion-request/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/content-pages/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/content-pages/[id]/sections/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/content-pages/[id]/sections/[sectionId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/design-tokens/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/dev/endpoint-catalog/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/diagnostics/pillars-sot/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/funnel-step-questions/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/funnel-steps/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/funnel-steps/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/funnel-steps/[id]/questions/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/funnel-steps/[id]/questions/[questionId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/funnel-versions/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/funnel-versions/[id]/manifest/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/kpi-thresholds/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/kpi-thresholds/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/navigation/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/navigation/[role]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/notification-templates/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/notification-templates/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/operational-settings-audit/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/pilot/flow-events/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/pilot/kpis/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/reassessment-rules/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/reassessment-rules/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/studio/funnels/[slug]/drafts/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/studio/funnels/[slug]/history/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/amy/chat/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/amy/stress-summary/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/assessments/[id]/current-step/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/assessments/[id]/navigation/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/assessments/[id]/resume/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/assessments/[id]/state/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/assessments/in-progress/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/auth/debug/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/auth/debug-cookie/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/auth/resolve-role/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/auth/signout/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/assessments/[assessmentId]/details/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/patient-funnels/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/patient-funnels/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/patient/[patientId]/[...probe]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/patient/[patientId]/amy-insights/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/patient/[patientId]/anamnesis/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/patient/[patientId]/diagnosis/runs/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/patient/[patientId]/results/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/patients/[patientId]/funnels/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/clinician/triage/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/content-pages/[slug]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/content-resolver/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/content/[slug]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/content/resolve/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/documents/[id]/extract/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/documents/[id]/status/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/documents/upload/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/escalation/log-click/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/active/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/funnels/catalog/[slug]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/health/env/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/mcp/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/mcp/context-pack/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/me/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/notifications/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/notifications/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient-measures/history/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient-profiles/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/anamnesis/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/anamnesis/[entryId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/anamnesis/export.json/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/assessments/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/assessments-with-results/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/design/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/diagnosis/runs/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/diagnosis/runs/[runId]/artifact/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/onboarding-status/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/reports/latest/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/state/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/pre-screening-calls/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/content/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/delivery/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/jobs/[jobId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/jobs/[jobId]/download/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/pdf/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/ranking/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/results/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/risk/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/safety/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/start/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/processing/validation/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/reports/[reportId]/pdf/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/review/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/review/[id]/decide/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/review/[id]/details/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/review/queue/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/shipments/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/shipments/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/shipments/[id]/events/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/studio/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/studio/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/studio/diagnosis/execute/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/studio/diagnosis/prompt/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/studio/diagnosis/queue/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/studio/diagnosis/runs/[runId]/artifact/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/studio/patients/[patientId]/anamnesis/export.json/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/support-cases/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/support-cases/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/support-cases/[id]/escalate/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/tasks/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/tasks/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/test/correlation-id/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/triage/fix-membership/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_CATALOG.md | /api/triage/health/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/_debug/env/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/_meta/ping/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/account/deletion-request/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/content-pages/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/content-pages/[id]/sections/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/content-pages/[id]/sections/[sectionId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/design-tokens/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/dev/endpoint-catalog/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/diagnostics/pillars-sot/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-step-questions/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-steps/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-steps/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-steps/[id]/questions/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-steps/[id]/questions/[questionId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-versions/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-versions/[id]/manifest/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/kpi-thresholds/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/kpi-thresholds/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/navigation/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/navigation/[role]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/notification-templates/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/notification-templates/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/operational-settings-audit/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/pilot/flow-events/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/pilot/kpis/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/reassessment-rules/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/reassessment-rules/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/studio/funnels/[slug]/drafts/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/studio/funnels/[slug]/history/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/amy/chat/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/amy/stress-summary/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/assessments/[id]/current-step/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/assessments/[id]/navigation/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/assessments/[id]/resume/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/assessments/[id]/state/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/assessments/in-progress/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/auth/debug/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/auth/debug-cookie/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/auth/resolve-role/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/auth/signout/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/assessments/[assessmentId]/details/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patient-funnels/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patient-funnels/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patient/[patientId]/[...probe]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patient/[patientId]/amy-insights/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patient/[patientId]/anamnesis/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patient/[patientId]/diagnosis/runs/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patient/[patientId]/results/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patients/[patientId]/funnels/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/triage/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content-pages/[slug]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content-resolver/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/[slug]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/resolve/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/documents/[id]/extract/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/documents/[id]/status/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/documents/upload/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/escalation/log-click/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/active/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/catalog/[slug]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/health/env/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/mcp/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/mcp/context-pack/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/me/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/notifications/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/notifications/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient-measures/history/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient-profiles/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/anamnesis/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/anamnesis/[entryId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/anamnesis/export.json/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/assessments/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/assessments-with-results/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/design/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/diagnosis/runs/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/diagnosis/runs/[runId]/artifact/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/onboarding-status/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/reports/latest/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/state/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/pre-screening-calls/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/content/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/delivery/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/jobs/[jobId]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/jobs/[jobId]/download/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/pdf/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/ranking/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/results/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/risk/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/safety/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/start/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/validation/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/reports/[reportId]/pdf/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/review/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/review/[id]/decide/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/review/[id]/details/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/review/queue/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/shipments/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/shipments/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/shipments/[id]/events/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/diagnosis/execute/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/diagnosis/prompt/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/diagnosis/queue/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/diagnosis/runs/[runId]/artifact/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/patients/[patientId]/anamnesis/export.json/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/support-cases/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/support-cases/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/support-cases/[id]/escalate/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/tasks/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/tasks/[id]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/test/correlation-id/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/triage/fix-membership/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/triage/health/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/content-pages/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-step-questions/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-steps/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-versions/[id]/__tests__/route.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-versions/not-a-uuid | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-versions/550e8400-e29b-41d4-a716-446655440000 | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnel-versions/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnels/__tests__/route.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnels/[id]/__tests__/route.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnels/stress-assessment | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnels/nonexistent | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnels/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnels/test-funnel | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/funnels/test | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/kpi-thresholds/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/navigation/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/notification-templates/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/reassessment-rules/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/assessments/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/assessmentPersistence.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/anamnesis/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patient-funnels/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/clinician/patients/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content-pages/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/[slug]/__tests__/route.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/test-content | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/nonexistent | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/draft-content | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/archived-content | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/deleted-content | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/test-slug | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/contentApi.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/__tests__/cardiovascular-age-lifecycle.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/cardiovascular-age/assessments | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/__tests__/createAssessment.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/stress-assessment/assessments | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/nonexistent-funnel/assessments | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/__tests__/e74-7-idempotency.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/__tests__/getAssessment.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/stress-assessment/assessments/non-existent-id | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/stress-assessment/assessments/assessment-123 | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/cardiovascular-age/assessments/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/__tests__/hardening.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/stress/assessments/assessment-123/answers/save | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/__tests__/processing-job-creation.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/cardiovascular-age/assessments/assessment-456/complete | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/stress/assessments/assessment-123/steps/step-123 | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/stress/assessments/assessment-123/steps/step-invalid | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/definition/__tests__/route.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/cardiovascular-age/definition | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/nope/definition | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/catalog/__tests__/route.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/catalog/[slug]/__tests__/route.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/catalog/stress | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/catalog/nonexistent | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/anamnesis/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/anamnesis/exportClient.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/patient/diagnosis/runs/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/processing/jobs/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/review/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/shipments/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/diagnosis/runs/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/patients/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/support-cases/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/tasks/__tests__/route.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/tasks/[id]/__tests__/route.test.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/tasks/t1 | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/tasks/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/_meta/build | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/route/path | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/funnels/.../steps/.../route | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/content-resolver/route | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/[route]/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/ | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/patients/[patientId]/anamnesis | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/studio/patients/[patientId]/anamnesis/route.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/anamnesis/validation.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/anamnesis/helpers.ts | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/account/deletion-cancel | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/admin/account/execute-deletion | ❌ missing in repo |
| docs/api/ENDPOINT_INVENTORY.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/api/ORPHAN_ENDPOINTS.md | /api/_meta/ping/route.ts | ❌ missing in repo |
| docs/api/ORPHAN_ENDPOINTS.md | /api/clinician/patient/[patientId]/[...probe]/route.ts | ❌ missing in repo |
| docs/api/ORPHAN_ENDPOINTS.md | /api/clinician/patient/[patientId]/amy-insights/route.ts | ❌ missing in repo |
| docs/api/ORPHAN_ENDPOINTS.md | /api/clinician/patient/[patientId]/anamnesis/route.ts | ❌ missing in repo |
| docs/api/ORPHAN_ENDPOINTS.md | /api/clinician/patient/[patientId]/diagnosis/runs/route.ts | ❌ missing in repo |
| docs/api/ORPHAN_ENDPOINTS.md | /api/clinician/patient/[patientId]/results/route.ts | ❌ missing in repo |
| docs/api/ORPHAN_ENDPOINTS.md | /api/triage/fix-membership/route.ts | ❌ missing in repo |
| docs/api/ORPHAN_ENDPOINTS.md | /api/triage/health/route.ts | ❌ missing in repo |
| docs/api/UNKNOWN_ACCESS_ENDPOINTS.md | /api/_meta/ping/route.ts | ❌ missing in repo |
| docs/api/UNKNOWN_CALLSITES.md | /api/_meta/build | ❌ missing in repo |
| docs/API_ROUTE_OWNERSHIP.md | /api/route/path | ❌ missing in repo |
| docs/API_ROUTE_OWNERSHIP.md | /api/funnels/.../steps/.../route | ❌ missing in repo |
| docs/API_ROUTE_OWNERSHIP.md | /api/content-resolver/route | ❌ missing in repo |
| docs/API_ROUTE_OWNERSHIP.md | /api/[route]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/reassessment-rules/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/reassessment-rules/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/kpi-thresholds/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/kpi-thresholds/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/content-pages/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/content-pages/[id]/sections/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/content-pages/[id]/sections/[sectionId]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/pilot/kpis/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/pilot/flow-events/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnel-steps/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnel-steps/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/diagnostics/pillars-sot/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/dev/endpoint-catalog/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/navigation/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/navigation/[role]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnel-versions/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnel-versions/[id]/manifest/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnel-step-questions/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/design-tokens/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/operational-settings-audit/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/notification-templates/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/notification-templates/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/health/env/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/patient-profiles/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/patient/onboarding-status/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/support-cases/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/support-cases/[id]/escalate/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/support-cases/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/active/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/funnels/catalog/[slug]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/pre-screening-calls/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/documents/upload/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/documents/[id]/extract/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/documents/[id]/status/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/auth/signout/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/auth/resolve-role/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/auth/debug/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/auth/debug-cookie/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/notification-templates/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/reassessment-rules/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/kpi-thresholds/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/content-pages/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/navigation/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/support-cases/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnels/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnel-versions/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnel-steps/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/admin/funnel-step-questions/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/tasks/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/jobs/ | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/notifications/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/notifications/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/reports/[reportId]/pdf/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/content-pages/[slug]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/shipments/[id]/events/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/shipments/[id]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/amy/stress-summary/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/pdf/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/safety/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/ranking/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/jobs/[jobId]/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/content/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/start/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/delivery/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/risk/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/processing/validation/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/content-resolver/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/content/resolve/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/assessments/in-progress/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/assessments/[id]/current-step/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/assessments/[id]/resume/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/assessments/[id]/navigation/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/test/correlation-id/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/review/[id]/decide/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/review/[id]/details/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/escalation/log-click/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/account/deletion-request/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/patient-measures/history/route.ts | ❌ missing in repo |
| docs/audit/V061_WIRING_AUDIT.md | /api/... | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/contracts/patient/__tests__/triage.test.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/patient/triage/__tests__/route.test.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/contracts/triage/index.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/contracts/triage/__tests__/index.test.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/contracts/patient/dashboard.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/admin/pilot/kpis/route.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/audit/V06_DELTA_REPORT.md | /api/patient/onboarding-status/route.ts | ❌ missing in repo |
| docs/audit/V06_FUNNEL_POC_PROOF.md | /api/funnels/cardiovascular-age/assessments | ❌ missing in repo |
| docs/audit/V06_FUNNEL_POC_PROOF.md | /api/funnels/cardiovascular-age/definition | ❌ missing in repo |
| docs/audit/V06_FUNNEL_POC_PROOF.md | /api/funnels/cardiovascular-age/assessments/ | ❌ missing in repo |
| docs/audit/V06_FUNNEL_POC_PROOF.md | /api/contracts/patient/assessments.ts | ❌ missing in repo |
| docs/audit/V06_FUNNEL_POC_PROOF.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/audit/V06_FUNNEL_POC_PROOF.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/audit/V06_FUNNEL_POC_PROOF.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/audit/V06_FUNNEL_POC_PROOF.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/audit/V06_TEST_MATRIX.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/canon/CONTRACTS.md | /api/responses.ts | ❌ missing in repo |
| docs/canon/CONTRACTS.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/canon/CONTRACTS.md | /api/responses | ❌ missing in repo |
| docs/canon/CONTRACTS.md | /api/responseTypes | ❌ missing in repo |
| docs/canon/CONTRACTS.md | /api/funnels/ | ❌ missing in repo |
| docs/canon/DB_ACCESS_DECISION.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_DECISION.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_DECISION.md | /api/mcp/context-pack/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_DECISION.md | /api/studio/diagnosis/execute/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_DECISION.md | /api/studio/diagnosis/queue/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_DECISION.md | /api/triage/fix-membership/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_DECISION.md | /api/triage/health/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/admin/funnel-step-questions/[id]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/admin/funnel-steps/[id]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/admin/funnel-steps/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/content-pages/[slug]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_EVIDENCE.md | /api/patient-measures/history/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_GUARDRAILS.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_IMPLEMENTATION.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_IMPLEMENTATION.md | /api/admin/funnels/ | ❌ missing in repo |
| docs/canon/DB_ACCESS_IMPLEMENTATION.md | /api/admin/content-pages/ | ❌ missing in repo |
| docs/canon/DB_ACCESS_IMPLEMENTATION.md | /api/admin/funnel-steps/ | ❌ missing in repo |
| docs/canon/DB_ACCESS_IMPLEMENTATION.md | /api/funnels/[slug]/assessments/ | ❌ missing in repo |
| docs/canon/DB_ACCESS_IMPLEMENTATION.md | /api/assessments/ | ❌ missing in repo |
| docs/canon/DB_ACCESS_IMPLEMENTATION.md | /api/assessment-answers/ | ❌ missing in repo |
| docs/canon/DB_ACCESS_IMPLEMENTATION.md | /api/authHelpers.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/admin/content-pages/[id]/sections/[sectionId]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/admin/content-pages/[id]/sections/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/admin/content-pages/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/admin/funnel-step-questions/[id]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/admin/funnel-steps/[id]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/admin/funnel-steps/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/assessments/[id]/current-step/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/assessments/[id]/navigation/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/assessments/[id]/resume/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/content-pages/[slug]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/active/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/catalog/[slug]/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_MATRIX.md | /api/patient-measures/history/route.ts | ❌ missing in repo |
| docs/canon/DB_ACCESS_PATTERNS.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/canon/GLOSSARY.md | /api/funnels/ | ❌ missing in repo |
| docs/canon/PILOT_SPINE.md | /api/funnels/ | ❌ missing in repo |
| docs/canon/PILOT_SPINE.md | /api/health | ❌ missing in repo |
| docs/canon/PILOT_SPINE.md | /api/ready | ❌ missing in repo |
| docs/canon/PILOT_SPINE.md | /api/funnels/cardiovascular-age/assessments | ❌ missing in repo |
| docs/canon/PILOT_SPINE.md | /api/funnels/cardiovascular-age/assessments/ | ❌ missing in repo |
| docs/CLEANUP_AUDIT_README.md | /api/amy/ | ❌ missing in repo |
| docs/CLEANUP_AUDIT_README.md | /api/consent/ | ❌ missing in repo |
| docs/CONTENT_SAFETY_OPS_SOP.md | /api/review/ | ❌ missing in repo |
| docs/DEPLOYMENT_VERIFICATION.md | /api/funnels/stress-assessment/content-pages | ❌ missing in repo |
| docs/dev/triage_test_inputs_v1.md | /api/contracts/triage | ❌ missing in repo |
| docs/dev/triage_test_inputs_v1.md | /api/contracts/triage/index.ts | ❌ missing in repo |
| docs/dev/VERIFY_ENDPOINTS.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/DOCUMENT_EXTRACTION.md | /api/documents/ | ❌ missing in repo |
| docs/DOCUMENT_EXTRACTION.md | /api/documents/[id]/extract/route.ts | ❌ missing in repo |
| docs/DOCUMENT_UPLOAD.md | /api/documents/doc-uuid/status | ❌ missing in repo |
| docs/DOCUMENT_UPLOAD.md | /api/documents/doc-id/status | ❌ missing in repo |
| docs/DOCUMENT_UPLOAD.md | /api/documents/upload/route.ts | ❌ missing in repo |
| docs/DOCUMENT_UPLOAD.md | /api/documents/[id]/status/route.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/ | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/assessments.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/index.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/__tests__/assessments.test.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient | ❌ missing in repo |
| docs/e6/E6_2_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/authHelpers.ts | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/authHelpers | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/auth/resolve-role/route.ts | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/patient/onboarding-status/route.ts | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/__tests__/sessionExpiry.test.ts | ❌ missing in repo |
| docs/e6/E6_2_6_IMPLEMENTATION_SUMMARY.md | /api/auth/resolve-role/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_2_7_IMPLEMENTATION_SUMMARY.md | /api/caching.ts | ❌ missing in repo |
| docs/e6/E6_2_7_IMPLEMENTATION_SUMMARY.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/e6/E6_2_7_IMPLEMENTATION_SUMMARY.md | /api/__tests__/caching.test.ts | ❌ missing in repo |
| docs/e6/E6_2_7_IMPLEMENTATION_SUMMARY.md | /api/funnels/catalog/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_2_7_IMPLEMENTATION_SUMMARY.md | /api/caching | ❌ missing in repo |
| docs/e6/E6_2_8_IMPLEMENTATION_SUMMARY.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/e6/E6_2_8_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/E6_2_8_IMPLEMENTATION_SUMMARY.md | /api/__tests__/responses.test.ts | ❌ missing in repo |
| docs/e6/E6_2_8_IMPLEMENTATION_SUMMARY.md | /api/test/correlation-id/route.ts | ❌ missing in repo |
| docs/e6/E6_2_8_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/pilotEligibility.ts | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/authHelpers.ts | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/pilotEligibility | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/__tests__/pilotEligibility.test.ts | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/__tests__/authOrdering.test.ts | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_4_1_IMPLEMENTATION_SUMMARY.md | /api/authHelpers | ❌ missing in repo |
| docs/e6/E6_4_2_IMPLEMENTATION_SUMMARY.md | /api/patient/onboarding-status/route.ts | ❌ missing in repo |
| docs/e6/E6_4_2_IMPLEMENTATION_SUMMARY.md | /api/assessments/in-progress/route.ts | ❌ missing in repo |
| docs/e6/E6_4_2_IMPLEMENTATION_SUMMARY.md | /api/patient/onboarding-status/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_4_2_IMPLEMENTATION_SUMMARY.md | /api/assessments/in-progress/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_4_3_FUNNEL_ENDPOINTS.md | /api/funnels/[slug]/assessments/[id]/answers/save | ❌ missing in repo |
| docs/e6/E6_4_3_FUNNEL_ENDPOINTS.md | /api/funnels/[slug]/assessments/[id]/steps/[stepId] | ❌ missing in repo |
| docs/e6/E6_4_3_FUNNEL_ENDPOINTS.md | /api/funnels/[slug]/assessments/[id]/complete | ❌ missing in repo |
| docs/e6/E6_4_3_FUNNEL_ENDPOINTS.md | /api/funnels/[slug]/assessments/[id]/workup | ❌ missing in repo |
| docs/e6/E6_4_3_FUNNEL_ENDPOINTS.md | /api/funnels/[slug]/assessments/[id]/result | ❌ missing in repo |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[id] | ❌ missing in repo |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | /api/assessments/in-progress/route.ts | ❌ missing in repo |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[id]/complete | ❌ missing in repo |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[id]/steps/[stepId] | ❌ missing in repo |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[id]/answers/save | ❌ missing in repo |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[id]/result | ❌ missing in repo |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/e6/E6_4_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/e6/E6_4_3_VERIFICATION_GUIDE.md | /api/funnels/stress/assessments/[id]/answers/save | ❌ missing in repo |
| docs/e6/E6_4_3_VERIFICATION_GUIDE.md | /api/funnels/stress/assessments/[id]/steps/[stepId] | ❌ missing in repo |
| docs/e6/E6_4_3_VERIFICATION_GUIDE.md | /api/funnels/stress/assessments/[id]/complete | ❌ missing in repo |
| docs/e6/E6_4_3_VERIFICATION_GUIDE.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/e6/E6_4_3_VERIFICATION_GUIDE.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/e6/E6_4_3_VERIFICATION_GUIDE.md | /api/funnels/[slug]/assessments/__tests__/ | ❌ missing in repo |
| docs/e6/E6_4_5_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts | ❌ missing in repo |
| docs/e6/E6_4_5_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/e6/E6_4_6_IMPLEMENTATION_SUMMARY.md | /api/escalation/log-click/route.ts | ❌ missing in repo |
| docs/e6/E6_4_6_VERIFICATION_CHECKLIST.md | /api/escalation | ❌ missing in repo |
| docs/e6/E6_4_7_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[id] | ❌ missing in repo |
| docs/e6/E6_4_7_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[id]/complete | ❌ missing in repo |
| docs/e6/E6_4_7_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[id]/workup | ❌ missing in repo |
| docs/e6/E6_4_8_IMPLEMENTATION_SUMMARY.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/e6/E6_4_8_IMPLEMENTATION_SUMMARY.md | /api/reports/[reportId]/pdf/route.ts | ❌ missing in repo |
| docs/e6/E6_4_8_IMPLEMENTATION_SUMMARY.md | /api/reports/VALID_REPORT_ID/pdf | ❌ missing in repo |
| docs/e6/E6_4_8_IMPLEMENTATION_SUMMARY.md | /api/reports/00000000-0000-0000-0000-000000000000/pdf | ❌ missing in repo |
| docs/e6/E6_4_8_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/escalation/log-click/route.ts | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/admin/pilot/flow-events/route.ts | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/e6/E6_4_8_TELEMETRY_IMPLEMENTATION_SUMMARY.md | /api/admin/content-pages/[id]/sections/route.ts | ❌ missing in repo |
| docs/e6/E6_4_9_IMPLEMENTATION_SUMMARY.md | /api/admin/pilot/kpis/route.ts | ❌ missing in repo |
| docs/e6/E6_4_9_IMPLEMENTATION_SUMMARY.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e6/E6_4_9_IMPLEMENTATION_SUMMARY.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/__tests__/dashboard.test.ts | ❌ missing in repo |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | /api/authHelpers | ❌ missing in repo |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/ | ❌ missing in repo |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/dashboard.ts | ❌ missing in repo |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/E6_5_10_IMPLEMENTATION_SUMMARY.md | /api/authHelpers.ts | ❌ missing in repo |
| docs/e6/E6_5_2_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/dashboard.ts | ❌ missing in repo |
| docs/e6/E6_5_2_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/e6/E6_5_2_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/__tests__/dashboard.test.ts | ❌ missing in repo |
| docs/e6/E6_5_2_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_5_2_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/index.ts | ❌ missing in repo |
| docs/e6/E6_5_2_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/E6_5_2_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/__tests__/ | ❌ missing in repo |
| docs/e6/E6_5_2_IMPLEMENTATION_SUMMARY.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e6/E6_5_2_VERIFICATION_GUIDE.md | /api/contracts/patient/__tests__/dashboard.test.ts | ❌ missing in repo |
| docs/e6/E6_5_2_VERIFICATION_GUIDE.md | /api/patient/dashboard/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_5_2_VERIFICATION_GUIDE.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e6/E6_5_2_VERIFICATION_GUIDE.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/e6/E6_5_2_VERIFICATION_GUIDE.md | /api/contracts/patient/dashboard.ts | ❌ missing in repo |
| docs/e6/E6_5_2_VERIFICATION_GUIDE.md | /api/contracts/patient/dashboard | ❌ missing in repo |
| docs/e6/E6_5_2_VERIFICATION_GUIDE.md | /api/contracts/patient/index.ts | ❌ missing in repo |
| docs/e6/E6_5_3_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/e6/E6_5_3_IMPLEMENTATION_SUMMARY.md | /api/authHelpers | ❌ missing in repo |
| docs/e6/E6_5_3_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_5_5_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/e6/E6_5_5_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_5_6_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/route.ts | ❌ missing in repo |
| docs/e6/E6_5_6_IMPLEMENTATION_SUMMARY.md | /api/patient/dashboard/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_5_8_IMPLEMENTATION_SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| docs/e6/E6_6_10_COMPLETE.md | /api/contracts/patient/__tests__/triage.test.ts | ❌ missing in repo |
| docs/e6/E6_6_10_COMPLETE.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/e6/E6_6_10_COMPLETE.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e6/E6_6_10_COMPLETE.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_10_COMPLETE.md | /api/contracts/triage/index.ts | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/__tests__/triage.test.ts | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/contracts/triage | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/__tests__/assessments.test.ts | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/contracts/patient/__tests__/dashboard.test.ts | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/contracts/triage/__tests__/index.test.ts | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/ORPHAN_ENDPOINTS.md | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/UNKNOWN_CALLSITES.md | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/patient/triage/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_6_10_IMPLEMENTATION_SUMMARY.md | /api/contracts/triage/index.ts | ❌ missing in repo |
| docs/e6/E6_6_10_VERIFICATION_GUIDE.md | /api/contracts/patient/__tests__/triage.test.ts | ❌ missing in repo |
| docs/e6/E6_6_10_VERIFICATION_GUIDE.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/e6/E6_6_10_VERIFICATION_GUIDE.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_10_VERIFICATION_GUIDE.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e6/E6_6_10_VERIFICATION_GUIDE.md | /api/contracts/triage/__tests__/index.test.ts | ❌ missing in repo |
| docs/e6/E6_6_10_VERIFICATION_GUIDE.md | /api/patient/triage/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_6_10_VERIFICATION_GUIDE.md | /api/contracts/triage/index.ts | ❌ missing in repo |
| docs/e6/E6_6_1_COMPLETE.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_1_IMPLEMENTATION_SUMMARY.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_2_IMPLEMENTATION_SUMMARY.md | /api/contracts/triage/index.ts | ❌ missing in repo |
| docs/e6/E6_6_2_IMPLEMENTATION_SUMMARY.md | /api/contracts/triage/__tests__/index.test.ts | ❌ missing in repo |
| docs/e6/E6_6_2_IMPLEMENTATION_SUMMARY.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_3_IMPLEMENTATION_SUMMARY.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_3_IMPLEMENTATION_SUMMARY.md | /api/contracts/triage/__tests__/index.test.ts | ❌ missing in repo |
| docs/e6/E6_6_4_IMPLEMENTATION_SUMMARY.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_4_IMPLEMENTATION_SUMMARY.md | /api/patient/triage/__tests__/route.test.ts | ❌ missing in repo |
| docs/e6/E6_6_4_IMPLEMENTATION_SUMMARY.md | /api/contracts/triage/index.ts | ❌ missing in repo |
| docs/e6/E6_6_4_IMPLEMENTATION_SUMMARY.md | /api/authHelpers.ts | ❌ missing in repo |
| docs/e6/E6_6_4_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/E6_6_6_COMPLETE.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_6_COMPLETE.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_6_IMPLEMENTATION_SUMMARY.md | /api/patient/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_6_IMPLEMENTATION_SUMMARY.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/e6/E6_6_9_IMPLEMENTATION_SUMMARY.md | /api/contracts/triage | ❌ missing in repo |
| docs/e6/E6_6_9_IMPLEMENTATION_SUMMARY.md | /api/contracts/triage/index.ts | ❌ missing in repo |
| docs/e6/VERIFICATION_GUIDE.md | /api/responseTypes | ❌ missing in repo |
| docs/e6/VERIFICATION_GUIDE.md | /api/responses | ❌ missing in repo |
| docs/e6/VERIFICATION_GUIDE.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/e6/VERIFICATION_GUIDE.md | /api/responses.ts | ❌ missing in repo |
| docs/e6/VERIFICATION_GUIDE.md | /api/__tests__/responses.test.ts | ❌ missing in repo |
| docs/e6/VERIFICATION_GUIDE.md | /api/test/correlation-id/route.ts | ❌ missing in repo |
| docs/e7/E73-7-IMPLEMENTATION-SUMMARY.md | /api/content/[slug]/route.ts | ❌ missing in repo |
| docs/e7/E73-7-IMPLEMENTATION-SUMMARY.md | /api/contentApi.ts | ❌ missing in repo |
| docs/e7/E73-7-IMPLEMENTATION-SUMMARY.md | /api/content/ | ❌ missing in repo |
| docs/e7/E73-7-IMPLEMENTATION-SUMMARY.md | /api/content/[slug]/__tests__/route.test.ts | ❌ missing in repo |
| docs/e7/E73-7-IMPLEMENTATION-SUMMARY.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/e7/E73-7-IMPLEMENTATION-SUMMARY.md | /api/ORPHAN_ENDPOINTS.md | ❌ missing in repo |
| docs/e7/E73-7-IMPLEMENTATION-SUMMARY.md | /api/content | ❌ missing in repo |
| docs/e7/E73-7-IMPLEMENTATION-SUMMARY.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e7/E73_2_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/e7/E73_2_IMPLEMENTATION_SUMMARY.md | /api/funnels/__tests__/processing-job-creation.test.ts | ❌ missing in repo |
| docs/e7/E73_2_IMPLEMENTATION_SUMMARY.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e7/E73_3_ENDPOINT_WIRING.md | /api/processing/ | ❌ missing in repo |
| docs/e7/E73_3_ENDPOINT_WIRING.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e7/E73_3_ENDPOINT_WIRING.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/e7/E73_3_ENDPOINT_WIRING.md | /api/ORPHAN_ENDPOINTS.md | ❌ missing in repo |
| docs/e7/E73_3_IMPLEMENTATION_SUMMARY.md | /api/processing/results/route.ts | ❌ missing in repo |
| docs/e7/E73_3_SECURITY_SUMMARY.md | /api/processing/results/route.ts | ❌ missing in repo |
| docs/e7/E73_5_IMPLEMENTATION_SUMMARY.md | /api/patient/assessments-with-results/route.ts | ❌ missing in repo |
| docs/e7/E73_5_RULES_VS_CHECKS_MATRIX.md | /api/... | ❌ missing in repo |
| docs/e7/E73_5_RULES_VS_CHECKS_MATRIX.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e7/E73_5_RULES_VS_CHECKS_MATRIX.md | /api/ORPHAN_ENDPOINTS.md | ❌ missing in repo |
| docs/e7/E73_5_RULES_VS_CHECKS_MATRIX.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/e7/E73_5_RULES_VS_CHECKS_MATRIX.md | /api/patient/assessments-with-results/route.ts | ❌ missing in repo |
| docs/e7/E73_5_VERIFICATION_SUMMARY.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/e7/E73_5_VERIFICATION_SUMMARY.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/e7/E73_5_VERIFICATION_SUMMARY.md | /api/patient/assessments-with-results/route.ts | ❌ missing in repo |
| docs/e7/E73_5_VERIFICATION_SUMMARY.md | /api/ORPHAN_ENDPOINTS.md | ❌ missing in repo |
| docs/e7/E73_5_VERIFICATION_SUMMARY.md | /api/UNKNOWN_CALLSITES.md | ❌ missing in repo |
| docs/e7/E73_8_IMPLEMENTATION_SUMMARY.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/e7/E73_8_IMPLEMENTATION_SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| docs/e7/E73_8_IMPLEMENTATION_SUMMARY.md | /api/assessments/ | ❌ missing in repo |
| docs/e7/E73_8_IMPLEMENTATION_SUMMARY.md | /api/amy/chat/route.ts | ❌ missing in repo |
| docs/e7/E73_8_RULES_VS_CHECKS_MATRIX.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/e7/E73_8_RULES_VS_CHECKS_MATRIX.md | /api/... | ❌ missing in repo |
| docs/e7/E73_8_RULES_VS_CHECKS_MATRIX.md | /api/amy/chat/route.ts | ❌ missing in repo |
| docs/e7/E75_3_RULES_VS_CHECKS_MATRIX.md | /api/patient/anamnesis/ | ❌ missing in repo |
| docs/e7/E75_3_RULES_VS_CHECKS_MATRIX.md | /api/patient/anamnesis/[entryId]/route.ts | ❌ missing in repo |
| docs/e7/E76_7_IMPLEMENTATION_SUMMARY.md | /api/patient/diagnosis/artifacts/[id]/route.ts | ❌ missing in repo |
| docs/e7/E76_7_IMPLEMENTATION_SUMMARY.md | /api/patient/diagnosis/artifacts/[id] | ❌ missing in repo |
| docs/e7/E76_7_RULES_VS_CHECKS_MATRIX.md | /api/patient/diagnosis/artifacts/[id] | ❌ missing in repo |
| docs/e7/E76_7_RULES_VS_CHECKS_MATRIX.md | /api/patient/diagnosis/artifacts/[id]/route.ts | ❌ missing in repo |
| docs/E73-9_STUDIO_DESIGN_TOOL_V1.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/E73_4_RESULT_API_SSOT.md | /api/funnels/ | ❌ missing in repo |
| docs/E73_4_RESULT_API_SSOT.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/E73_4_RESULT_API_SSOT.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/E74.8-COMPLETE.md | /api/clinician/assessments/[assessmentId]/details/route.ts | ❌ missing in repo |
| docs/E74.8-DATA-FLOW.md | /api/clinician/assessments/[id]/details | ❌ missing in repo |
| docs/E74.8-IMPLEMENTATION.md | /api/clinician/assessments/[assessmentId]/details/route.ts | ❌ missing in repo |
| docs/E74_1_IMPLEMENTATION_SUMMARY.md | /api/admin/funnel-versions/[id]/manifest/route.ts | ❌ missing in repo |
| docs/E74_2_IMPLEMENTATION_SUMMARY.md | /api/patient/funnel-definitions/ | ❌ missing in repo |
| docs/E74_2_IMPLEMENTATION_SUMMARY.md | /api/patient/funnels | ❌ missing in repo |
| docs/E74_2_IMPLEMENTATION_SUMMARY.md | /api/patient/funnel-definitions/stress-assessment | ❌ missing in repo |
| docs/E74_2_IMPLEMENTATION_SUMMARY.md | /api/patient/funnel-definitions/sleep-quality | ❌ missing in repo |
| docs/E74_2_IMPLEMENTATION_SUMMARY.md | /api/patient/funnel-definitions/cardiovascular-age | ❌ missing in repo |
| docs/E74_2_TEST_PLAN.md | /api/patient/funnel-definitions/stress-assessment | ❌ missing in repo |
| docs/E74_2_TEST_PLAN.md | /api/patient/funnel-definitions/sleep-quality | ❌ missing in repo |
| docs/E74_2_TEST_PLAN.md | /api/patient/funnel-definitions/cardiovascular-age | ❌ missing in repo |
| docs/E74_2_TEST_PLAN.md | /api/patient/funnel-definitions/heart-health-nutrition | ❌ missing in repo |
| docs/E74_2_TEST_PLAN.md | /api/patient/funnels | ❌ missing in repo |
| docs/E74_3_GUARDRAILS_DIFF.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts | ❌ missing in repo |
| docs/E74_3_GUARDRAILS_DIFF.md | /api/admin/studio/funnels/[slug]/drafts/route.ts | ❌ missing in repo |
| docs/E74_3_GUARDRAILS_DIFF.md | /api/admin/studio/funnels/ | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/[slug]/drafts/[id] | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/[slug]/drafts/[id]/validate | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/[slug]/drafts/[id]/publish | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/ | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/stress-assessment/drafts | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/stress-assessment/drafts/[draftId] | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/stress-assessment/drafts/[draftId]/validate | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/stress-assessment/drafts/[draftId]/publish | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/stress-assessment/history | ❌ missing in repo |
| docs/E74_3_IMPLEMENTATION_SUMMARY.md | /api/admin/studio/funnels/stress-assessment/drafts/ | ❌ missing in repo |
| docs/E74_4_IMPLEMENTATION_SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| docs/engineering/ENDPOINT_WIRING_POLICY.md | /api/... | ❌ missing in repo |
| docs/engineering/ENDPOINT_WIRING_POLICY.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/EXTERNAL_CLIENTS.md | /api/[route] | ❌ missing in repo |
| docs/funnels/README.md | /api/funnels/ | ❌ missing in repo |
| docs/funnels/README.md | /api/admin/studio/funnels/ | ❌ missing in repo |
| docs/funnels/START_RESUME_SEMANTICS.md | /api/funnels/ | ❌ missing in repo |
| docs/funnels/START_RESUME_SEMANTICS.md | /api/funnels/stress-assessment-a/assessments | ❌ missing in repo |
| docs/funnels/START_RESUME_SEMANTICS.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/funnels/STUDIO_PUBLISH_GATES.md | /api/admin/studio/funnels/ | ❌ missing in repo |
| docs/funnels/TEST_E2E.md | /api/admin/studio/funnels/ | ❌ missing in repo |
| docs/funnels/TEST_E2E.md | /api/funnels/stress-assessment-a/assessments | ❌ missing in repo |
| docs/FUNNEL_MAPPING_UI.md | /api/admin/content-pages/route.ts | ❌ missing in repo |
| docs/FUNNEL_MAPPING_UI.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/guardrails/README.md | /api/new-endpoint.ps1 | ❌ missing in repo |
| docs/guardrails/README.md | /api/your/route | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_DIFF.md | /api/responses.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_DIFF.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_DIFF.md | /api/example/legacy | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/example/legacy | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/... | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/ORPHAN_ENDPOINTS.md | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/webhooks/stripe | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/content/ | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/contentApi.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/responses.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/[path] | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/[new-path] | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/mcp/route.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/mcp/context-pack/route.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/studio/diagnosis/execute/route.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/studio/diagnosis/queue. | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX.md | /api/studio/diagnosis/queue/route.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_5.md | /api/studio/diagnosis/prompt/route.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_6.md | /api/patient/diagnosis/runs/route.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_6.md | /api/patient/diagnosis/artifacts/[id] | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_6.md | /api/patient/diagnosis/artifacts/[id]/route.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_8.md | /api/studio/diagnosis/queue/route.ts | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_9.md | /api/... | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_9.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_9.md | /api/external/webhook | ❌ missing in repo |
| docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_9.md | /api/orphan | ❌ missing in repo |
| docs/I2_1_PATIENT_STATE_IMPLEMENTATION.md | /api/contracts/patient/state.ts | ❌ missing in repo |
| docs/I2_1_PATIENT_STATE_IMPLEMENTATION.md | /api/patient/state/route.ts | ❌ missing in repo |
| docs/I2_1_PATIENT_STATE_IMPLEMENTATION.md | /api/contracts/patient/index.ts | ❌ missing in repo |
| docs/I71.4-IMPLEMENTATION-SUMMARY.md | /api/assessmentPersistence.ts | ❌ missing in repo |
| docs/I71.4-IMPLEMENTATION-SUMMARY.md | /api/__tests__/assessmentPersistence.test.ts | ❌ missing in repo |
| docs/I71.4-IMPLEMENTATION-SUMMARY.md | /api/__tests__/saveResumeIntegration.test.ts | ❌ missing in repo |
| docs/I71.4-IMPLEMENTATION-SUMMARY.md | /api/assessments/[id]/state/route.ts | ❌ missing in repo |
| docs/I71.4-IMPLEMENTATION-SUMMARY.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/I71.4-PERSISTENCE-ADAPTER.md | /api/assessmentPersistence.ts | ❌ missing in repo |
| docs/I71.4-PERSISTENCE-ADAPTER.md | /api/assessmentPersistence | ❌ missing in repo |
| docs/I71.4-PERSISTENCE-ADAPTER.md | /api/assessments/ | ❌ missing in repo |
| docs/I71.4-PERSISTENCE-ADAPTER.md | /api/contracts/patient/README.md | ❌ missing in repo |
| docs/IMPLEMENTATION_EXAMPLE.md | /api/funnels/active/route.ts | ❌ missing in repo |
| docs/LINT_POLICY.md | /api/health/env/route.ts | ❌ missing in repo |
| docs/LOGGING_EXAMPLES.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/LOGGING_EXAMPLES.md | /api/funnels/stress/assessments/abc/complete | ❌ missing in repo |
| docs/LOGGING_EXAMPLES.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/LOGGING_EXAMPLES.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/LOGGING_PATTERNS.md | /api/users | ❌ missing in repo |
| docs/LOGGING_PATTERNS.md | /api/admin/users | ❌ missing in repo |
| docs/LOGGING_PATTERNS.md | /api/data | ❌ missing in repo |
| docs/LOGGING_PATTERNS.md | /api/assessments | ❌ missing in repo |
| docs/mobile/API_ERRORS.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate | ❌ missing in repo |
| docs/mobile/AUTH_SESSION.md | /api/funnels/[slug]/assessments/[id] | ❌ missing in repo |
| docs/mobile/AUTH_SESSION.md | /api/funnels/[slug]/assessments/[id]/complete | ❌ missing in repo |
| docs/mobile/AUTH_SESSION.md | /api/authHelpers | ❌ missing in repo |
| docs/mobile/AUTH_SESSION.md | /api/responses | ❌ missing in repo |
| docs/mobile/BLOCK_EDITOR.md | /api/admin/funnel-versions/[id]/manifest/route.ts | ❌ missing in repo |
| docs/mobile/BLOCK_EDITOR.md | /api/admin/funnel-versions/ | ❌ missing in repo |
| docs/mobile/BLOCK_EDITOR.md | /api/admin/funnel-versions/[id]/manifest/__tests__/validation.test.ts | ❌ missing in repo |
| docs/mobile/BLOCK_EDITOR.md | /api/admin/funnel-versions | ❌ missing in repo |
| docs/mobile/DEEP_LINKS.md | /api/funnels/catalog/ | ❌ missing in repo |
| docs/mobile/DEEP_LINKS.md | /api/funnels/ | ❌ missing in repo |
| docs/mobile/DEEP_LINKS.md | /api/assessments/ | ❌ missing in repo |
| docs/mobile/DEEP_LINKS.md | /api/notifications/ | ❌ missing in repo |
| docs/mobile/DEEP_LINKS.md | /api/assessments/550e8400-e29b-41d4-a716-446655440000/resume | ❌ missing in repo |
| docs/mobile/DEEP_LINKS.md | /api/funnels/stress/assessments/660e8400-e29b-41d4-a716-446655440111/result | ❌ missing in repo |
| docs/mobile/DEEP_LINKS.md | /api/funnels/catalog/stress | ❌ missing in repo |
| docs/mobile/E6_2_2_VERIFICATION.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/mobile/E6_2_2_VERIFICATION.md | /api/responses.ts | ❌ missing in repo |
| docs/mobile/E6_2_2_VERIFICATION.md | /api/__tests__/responses.test.ts | ❌ missing in repo |
| docs/mobile/IDEMPOTENCY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/mobile/IDEMPOTENCY.md | /api/funnels/[slug]/assessments/[id]/answers/save | ❌ missing in repo |
| docs/mobile/IDEMPOTENCY.md | /api/funnels/[slug]/assessments/[id]/steps/[stepId]/validate | ❌ missing in repo |
| docs/mobile/IDEMPOTENCY.md | /api/funnels/[slug]/assessments/[id]/complete | ❌ missing in repo |
| docs/mobile/IDEMPOTENCY.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/funnels/catalog/stress-assessment | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/funnels/catalog/ | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/funnels/stress-assessment/assessments | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/funnels/stress-assessment/assessments/assessment-uuid-789/answers/save | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/funnels/stress-assessment/assessments/assessment-uuid-789/steps/step-uuid-001 | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/funnels/stress-assessment/assessments/assessment-uuid-789/complete | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/funnels/stress-assessment/assessments/assessment-uuid-789/result | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/funnels/stress-assessment/assessments/ | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/assessments/assessment-uuid-789/resume | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/funnels/stress-assessment/assessments/assessment-uuid-789 | ❌ missing in repo |
| docs/mobile/IOS_INTEGRATION_PACK.md | /api/assessments/ | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/patient/onboarding-status/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/auth/resolve-role/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/catalog/[slug]/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/assessments/[id]/resume/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/patient-measures/history/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/patient-profiles/route.ts | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/stress-assessment/assessments | ❌ missing in repo |
| docs/mobile/MOBILE_API_SURFACE.md | /api/funnels/stress-assessment/assessments/ | ❌ missing in repo |
| docs/mobile/OBSERVABILITY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/mobile/OBSERVABILITY.md | /api/funnels/stress/assessments/abc-123/complete | ❌ missing in repo |
| docs/mobile/OBSERVABILITY.md | /api/responses | ❌ missing in repo |
| docs/MOBILE_FUNNEL_SELECTOR.md | /api/funnels/active/route.ts | ❌ missing in repo |
| docs/MONITORING_INTEGRATION.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/MONITORING_INTEGRATION.md | /api/test-monitoring | ❌ missing in repo |
| docs/overview/README.md | /api/ENDPOINT_CATALOG.md] | ❌ missing in repo |
| docs/overview/README.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/PATIENT_API_CONTRACTS.md | /api/contracts/patient/assessments.ts | ❌ missing in repo |
| docs/PATIENT_API_CONTRACTS.md | /api/contracts/patient/index.ts | ❌ missing in repo |
| docs/PATIENT_API_CONTRACTS.md | /api/funnels/ | ❌ missing in repo |
| docs/PATIENT_API_CONTRACTS.md | /api/contracts/patient | ❌ missing in repo |
| docs/PATIENT_API_CONTRACTS.md | /api/responses | ❌ missing in repo |
| docs/PATIENT_API_CONTRACTS.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/PATIENT_API_CONTRACTS.md | /api/contracts/patient/__tests__/assessments.test.ts | ❌ missing in repo |
| docs/PATIENT_FLOW_RENDERER_IMPLEMENTATION.md | /api/funnels/ | ❌ missing in repo |
| docs/PATIENT_FLOW_V2_DIAGRAM.md | /api/funnels/ | ❌ missing in repo |
| docs/PATIENT_FLOW_V2_STRUCTURE.md | /api/funnels/ | ❌ missing in repo |
| docs/PILLARS_SOT_AUDIT.md | /api/admin/diagnostics/pillars-sot/route.ts | ❌ missing in repo |
| docs/PILLARS_SOT_AUDIT.md | /api/admin/diagnostics/pillars-sot/__tests__/route.test.ts | ❌ missing in repo |
| docs/pilot/ANAMNESIS_EXPORT.md | /api/studio/patients/PATIENT_UUID/anamnesis/export.json | ❌ missing in repo |
| docs/pilot/ANAMNESIS_EXPORT.md | /api/anamnesis/exportClient | ❌ missing in repo |
| docs/pilot/ANAMNESIS_EXPORT.md | /api/studio/patients/ | ❌ missing in repo |
| docs/pilot/ANAMNESIS_EXPORT.md | /api/studio/patients/ASSIGNED_PATIENT_ID/anamnesis/export.json | ❌ missing in repo |
| docs/pilot/ANAMNESIS_EXPORT.md | /api/studio/patients/UNASSIGNED_PATIENT_ID/anamnesis/export.json | ❌ missing in repo |
| docs/pilot/ANAMNESIS_EXPORT.md | /api/patient/anamnesis/export.json/route.ts | ❌ missing in repo |
| docs/pilot/ANAMNESIS_EXPORT.md | /api/studio/patients/[patientId]/anamnesis/export.json/route.ts | ❌ missing in repo |
| docs/pilot/ANAMNESIS_EXPORT.md | /api/anamnesis/export.ts | ❌ missing in repo |
| docs/pilot/ANAMNESIS_EXPORT.md | /api/anamnesis/exportClient.ts | ❌ missing in repo |
| docs/pilot/CRITICAL_ENDPOINTS.md | /api/processing/ | ❌ missing in repo |
| docs/pilot/CRITICAL_ENDPOINTS.md | /api/documents/ | ❌ missing in repo |
| docs/pilot/CRITICAL_ENDPOINTS.md | /api/notifications/ | ❌ missing in repo |
| docs/pilot/CRITICAL_ENDPOINTS.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/pilot/CRITICAL_ENDPOINTS.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/pilot/CRITICAL_ENDPOINTS.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/pilot/CRITICAL_ENDPOINTS.md | /api/admin/pilot/kpis/route.ts | ❌ missing in repo |
| docs/pilot/CRITICAL_ENDPOINTS.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/pilot/CRITICAL_ENDPOINTS.md | /api/admin/pilot/flow-events/route.ts | ❌ missing in repo |
| docs/pilot/EXPORTS.md | /api/reports/REPORT_ID/pdf | ❌ missing in repo |
| docs/pilot/EXPORTS.md | /api/reports/ | ❌ missing in repo |
| docs/pilot/EXPORTS.md | /api/reports/VALID_REPORT_ID/pdf | ❌ missing in repo |
| docs/pilot/EXPORTS.md | /api/reports/00000000-0000-0000-0000-000000000000/pdf | ❌ missing in repo |
| docs/pilot/EXPORTS.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/pilot/EXPORTS.md | /api/reports/[reportId]/pdf/route.ts | ❌ missing in repo |
| docs/pilot/EXPORTS.md | /api/responses.ts | ❌ missing in repo |
| docs/pilot/README.md | /api/reports/ | ❌ missing in repo |
| docs/releases/v0.4/changelog.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/releases/v0.4/changelog.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/releases/v0.4/changelog.md | /api/admin/content-pages/ | ❌ missing in repo |
| docs/releases/v0.4/changelog.md | /api/funnels/ | ❌ missing in repo |
| docs/releases/v0.4/changelog.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/releases/v0.5.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX.md | /api/admin/studio/funnels/ | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX.md | /api/clinician/patient-funnels/ | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/patient/anamnesis/[id] | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/patient/anamnesis/[id]/versions | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/patient/anamnesis/[id]/archive | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/studio/patients/[patientId]/anamnesis | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/studio/anamnesis/[id]/versions | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/studio/anamnesis/[id]/archive | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/patient/anamnesis/route.ts | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/patient/anamnesis/[entryId]/route.ts | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/patient/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/patient/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/studio/patients/[patientId]/anamnesis/route.ts | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/studio/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/studio/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/anamnesis/validation.ts | ❌ missing in repo |
| docs/RULES_VS_CHECKS_MATRIX_E75_2.md | /api/anamnesis/helpers.ts | ❌ missing in repo |
| docs/runbooks/MCP_SERVER.md | /api/mcp/ | ❌ missing in repo |
| docs/runbooks/MCP_SERVER.md | /api/mcp/route.ts | ❌ missing in repo |
| docs/runbooks/PILOT_SMOKE_TESTS.md | /api/funnels/ | ❌ missing in repo |
| docs/runbooks/PILOT_SMOKE_TESTS.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/runbooks/PILOT_SMOKE_TESTS.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/runbooks/SECURITY_MODEL.md | /api/mcp/route.ts | ❌ missing in repo |
| docs/runbooks/TROUBLESHOOTING.md | /api/endpoint | ❌ missing in repo |
| docs/test-runs/v0.7_patient_smoke.md | /api/contracts/patient/state.ts | ❌ missing in repo |
| docs/test-runs/v0.7_patient_smoke.md | /api/amy/triage/route.ts | ❌ missing in repo |
| docs/testing/E73-7-MANUAL-TEST-PLAN.md | /api/content/e737-test-content | ❌ missing in repo |
| docs/testing/E73-7-MANUAL-TEST-PLAN.md | /api/admin/content-pages/ | ❌ missing in repo |
| docs/testing/E73-7-MANUAL-TEST-PLAN.md | /api/content/does-not-exist-12345 | ❌ missing in repo |
| docs/testing/E73-7-MANUAL-TEST-PLAN.md | /api/content/ | ❌ missing in repo |
| docs/testing/E73-7-MANUAL-TEST-PLAN.md | /api/contentApi.ts | ❌ missing in repo |
| docs/testing/E73-7-MANUAL-TEST-PLAN.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| docs/triage/inbox-v1.md | /api/admin/processing/retry/ | ❌ missing in repo |
| docs/triage/RULES_VS_CHECKS_MATRIX.md | /api/clinician/inbox | ❌ missing in repo |
| docs/triage/RULES_VS_CHECKS_MATRIX.md | /api/clinician/inbox/ | ❌ missing in repo |
| docs/triage/RULES_VS_CHECKS_MATRIX.md | /api/clinician/inbox/stats | ❌ missing in repo |
| docs/triage/RULES_VS_CHECKS_MATRIX_E78_3.md | /api/clinician/triage/route.ts | ❌ missing in repo |
| docs/triage_system_map.md | /api/triage/health/route.ts] | ❌ missing in repo |
| docs/triage_system_map.md | /api/triage/health/route.ts | ❌ missing in repo |
| docs/TV05_02_IMPLEMENTATION.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/TV05_02_IMPLEMENTATION.md | /api/admin/usage/__tests__/route.test.ts | ❌ missing in repo |
| docs/TV05_02_IMPLEMENTATION.md | /api/test | ❌ missing in repo |
| docs/TV05_03_HEALTHCHECK_IMPLEMENTATION.md | /api/health/env/ | ❌ missing in repo |
| docs/TV05_03_HEALTHCHECK_IMPLEMENTATION.md | /api/health/env/__tests__/route.test.ts | ❌ missing in repo |
| docs/TV05_03_HEALTHCHECK_IMPLEMENTATION.md | /api/health/env/route.ts | ❌ missing in repo |
| docs/TV05_03_HEALTHCHECK_IMPLEMENTATION.md | /api/authHelpers.ts | ❌ missing in repo |
| docs/TV05_03_HEALTHCHECK_IMPLEMENTATION.md | /api/responses.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_AUDIT_ISSUE_MAP.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_AUDIT_ISSUE_MAP.md | /api/amy/ | ❌ missing in repo |
| docs/TV05_CLEANUP_AUDIT_UNUSED.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_AUDIT_UNUSED.md | /api/amy/stress-summary/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_AUDIT_UNUSED.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_AUDIT_UNUSED.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_AUDIT_UNUSED.md | /api/content-resolver/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_AUDIT_UNUSED.md | /api/content/resolve/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_BACKLOG.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_BACKLOG.md | /api/amy/stress-summary/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_BACKLOG.md | /api/consent | ❌ missing in repo |
| docs/TV05_CLEANUP_BACKLOG.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/TV05_CLEANUP_BACKLOG.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/USAGE_TELEMETRY.md | /api/your-route | ❌ missing in repo |
| docs/USAGE_TELEMETRY.md | /api/admin/usage/__tests__/route.test.ts | ❌ missing in repo |
| docs/USAGE_TELEMETRY.md | /api/admin/usage/__tests__/ | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/account/deletion-request/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/content-pages/[id]/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/content-pages/[id]/sections/[sectionId]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/content-pages/[id]/sections/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/content-pages/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/design-tokens/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/diagnostics/pillars-sot/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/diagnostics/pillars-sot/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnels/[id]/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnels/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnel-step-questions/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnel-steps/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnel-steps/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnel-versions/[id]/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnel-versions/[id]/manifest/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnel-versions/[id]/manifest/__tests__/validation.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnel-versions/[id]/manifest/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/funnel-versions/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/kpi-thresholds/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/kpi-thresholds/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/navigation/[role]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/navigation/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/notification-templates/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/notification-templates/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/operational-settings-audit/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/reassessment-rules/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/reassessment-rules/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/usage/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/amy/stress-summary/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/assessments/[id]/current-step/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/assessments/[id]/navigation/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/assessments/[id]/resume/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/auth/resolve-role/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/auth/resolve-role/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/content/resolve/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/content/resolve/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/content-pages/[slug]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/documents/[id]/extract/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/documents/[id]/status/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/documents/upload/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/documents/upload/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/[slug]/content-pages/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/__tests__/hardening.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/__tests__/save-resume.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/active/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/catalog/[slug]/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/catalog/[slug]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/catalog/__tests__/catalog.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/catalog/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/health/env/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/health/env/__tests__/route.test.ts.backup | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/health/env/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/notifications/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/notifications/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/patient/onboarding-status/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/patient/onboarding-status/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/patient-measures/history/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/patient-profiles/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/pre-screening-calls/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/__tests__/integration.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/content/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/delivery/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/delivery/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/jobs/[jobId]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/pdf/__tests__/route.auth-first.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/pdf/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/ranking/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/risk/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/safety/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/start/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/processing/validation/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/reports/[reportId]/pdf/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/reports/__tests__/pdf.rbac.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/review/[id]/decide/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/review/[id]/details/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/review/[id]/details/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/review/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/review/__tests__/httpSemantics.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/review/queue/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/shipments/[id]/events/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/shipments/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/shipments/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/support-cases/[id]/escalate/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/support-cases/[id]/escalate/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/support-cases/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/support-cases/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/tasks/[id]/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/tasks/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/tasks/__tests__/route.test.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/tasks/route.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/authHelpers.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/responses.ts | ❌ missing in repo |
| docs/v0.5/CHANGED_FILES_SINCE_2025-12-30.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/account/deletion-request/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/content-pages/[id]/sections/[sectionId]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/content-pages/[id]/sections/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/content-pages/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/design-tokens/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/diagnostics/pillars-sot/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/funnel-step-questions/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/funnel-steps/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/funnel-steps/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/funnel-versions/[id]/manifest/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/funnel-versions/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/kpi-thresholds/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/kpi-thresholds/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/navigation/[role]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/navigation/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/notification-templates/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/notification-templates/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/operational-settings-audit/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/reassessment-rules/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/reassessment-rules/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/amy/stress-summary/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/assessments/[id]/current-step/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/assessments/[id]/navigation/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/assessments/[id]/resume/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/auth/resolve-role/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/content/resolve/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/content-pages/[slug]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/content-resolver/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/documents/[id]/extract/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/documents/[id]/status/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/documents/upload/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/active/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/catalog/[slug]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/health/env/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/notifications/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/notifications/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/patient/onboarding-status/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/patient-measures/history/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/patient-profiles/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/pre-screening-calls/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/processing/content/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/processing/delivery/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/processing/jobs/[jobId]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/processing/pdf/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/processing/ranking/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/processing/risk/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/processing/safety/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/processing/start/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/processing/validation/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/reports/[reportId]/pdf/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/review/[id]/decide/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/review/[id]/details/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/review/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/review/queue/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/shipments/[id]/events/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/shipments/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/shipments/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/support-cases/[id]/escalate/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/support-cases/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/support-cases/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/tasks/[id]/route.ts | ❌ missing in repo |
| docs/v0.5/ENDPOINT_INVENTORY.md | /api/tasks/route.ts | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/assessments/route.ts] | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts] | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts] | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/ | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/definition/route.ts] | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/content/resolve/route.ts] | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/content/resolve/route.ts | ❌ missing in repo |
| docs/v0.5/FUNNEL_WIRING_ANALYSIS.md | /api/funnels/[slug]/assessments/ | ❌ missing in repo |
| docs/v0.5/P0_FIX_PLAN.md | /api/funnels/[slug]/assessments/ | ❌ missing in repo |
| docs/v0.5/P0_FIX_PLAN.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/v0.5/P0_FIX_PLAN.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/v0.5/P0_FIX_PLAN.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/v0.5/P0_FIX_PLAN.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/v0.5/P0_FIX_PLAN.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/v0.5/P0_FIX_PLAN.md | /api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | ❌ missing in repo |
| docs/v0.5/P0_FIX_PLAN.md | /api/funnels/ | ❌ missing in repo |
| docs/v0.5/STATUS_QUO_AND_DELTA.md | /api/funnels/[slug]/assessments/ | ❌ missing in repo |
| docs/V05_I01_3_VERSIONING_EVIDENCE.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/V05_I02_1_CATALOG_IMPLEMENTATION.md | /api/funnels/catalog/__tests__/catalog.test.ts | ❌ missing in repo |
| docs/V05_I02_1_CATALOG_IMPLEMENTATION.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/V05_I02_1_CATALOG_IMPLEMENTATION.md | /api/funnels/catalog/[slug]/route.ts | ❌ missing in repo |
| docs/V05_I02_1_SCHEMA_VERIFICATION.md | /api/funnels/catalog/__tests__/catalog.test.ts | ❌ missing in repo |
| docs/V05_I02_1_VISUAL_EVIDENCE.md | /api/funnels/catalog/__tests__/catalog.test.ts | ❌ missing in repo |
| docs/V05_I02_2_PATIENT_FLOW_INTEGRATION.md | /api/funnels/catalog/[slug]/manifest | ❌ missing in repo |
| docs/V05_I02_3_CATALOG_500_FIX.md | /api/funnels/catalog/route.ts] | ❌ missing in repo |
| docs/V05_I02_3_CATALOG_500_FIX.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/V05_I02_3_CATALOG_500_FIX.md | /api/responses.ts] | ❌ missing in repo |
| docs/V05_I02_3_CATALOG_500_FIX.md | /api/responses.ts | ❌ missing in repo |
| docs/V05_I02_3_CATALOG_500_FIX.md | /api/responseTypes.ts] | ❌ missing in repo |
| docs/V05_I02_3_CATALOG_500_FIX.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/V05_I02_3_CATALOG_500_FIX.md | /api/funnels/catalog/ | ❌ missing in repo |
| docs/V05_I02_3_CATALOG_500_FIX.md | /api/funnels/catalog/__tests__/route.test.ts | ❌ missing in repo |
| docs/V05_I02_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/catalog/ | ❌ missing in repo |
| docs/V05_I05_1_PROCESSING_ORCHESTRATOR.md | /api/processing/jobs/YOUR_JOB_ID | ❌ missing in repo |
| docs/V05_MILESTONES_CRITICAL_PATH.md | /api/amy/stress-report/ | ❌ missing in repo |
| docs/v06/ENDPOINTS.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| docs/v06/ENDPOINTS.md | /api/endpoint-catalog.json | ❌ missing in repo |
| docs/V061-I03-VERIFICATION.md | /api/content-pages/ | ❌ missing in repo |
| docs/V061-I03-VERIFICATION.md | /api/funnels/ | ❌ missing in repo |
| docs/V061-I03-VERIFICATION.md | /api/content/resolve/__tests__/route.test.ts | ❌ missing in repo |
| docs/V061_I01_PGRST116_MAPPING_GUIDE.md | /api/responses | ❌ missing in repo |
| docs/V061_I01_PGRST116_MAPPING_GUIDE.md | /api/funnels/stress/assessments/non-existent-id | ❌ missing in repo |
| docs/V061_I01_PGRST116_MAPPING_GUIDE.md | /api/responses.ts | ❌ missing in repo |
| docs/V061_I01_PGRST116_MAPPING_GUIDE.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/V0_4_E2_PATIENT_FLOW_V2.md | /api/funnels/ | ❌ missing in repo |
| docs/Z4_EXECUTIVE_SUMMARY_V0.3.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive/root/AUDIT_LOG_IMPLEMENTATION.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive/root/CHANGES.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/_archive/root/CHANGES.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/_archive/root/CHANGES.md | /api/admin/content-pages/ | ❌ missing in repo |
| docs/_archive/root/CHANGES.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive/root/CHANGES.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive/root/CODE_REVIEW_COMPLIANCE.md | /api/review/queue/route.ts | ❌ missing in repo |
| docs/_archive/root/CODE_REVIEW_COMPLIANCE.md | /api/review/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/CODE_REVIEW_COMPLIANCE.md | /api/review/[id]/decide/route.ts | ❌ missing in repo |
| docs/_archive/root/CODE_REVIEW_COMPLIANCE.md | /api/review/__tests__/httpSemantics.test.ts | ❌ missing in repo |
| docs/_archive/root/CONTENT_QA_CHECKLIST.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive/root/DEPLOYMENT_VERIFICATION_V05_I02_3.md | /api/funnels/catalog/cardiovascular-age | ❌ missing in repo |
| docs/_archive/root/DEPLOYMENT_VERIFICATION_V05_I02_3.md | /api/funnels/catalog/sleep-quality | ❌ missing in repo |
| docs/_archive/root/DEPLOYMENT_VERIFICATION_V05_I02_3.md | /api/funnels/catalog/heart-health-nutrition | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | /api/admin/funnel-steps/route.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | /api/admin/funnel-steps/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | /api/admin/funnel-step-questions/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | /api/responses | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | /api/admin/funnels/ | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | /api/admin/funnels/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_A.md | /api/responses.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_B.md | /api/funnels/catalog/ | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_B.md | /api/funnels/catalog/[slug]/route.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_HYGIENE_B.md | /api/funnels/catalog/[slug]/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_P0_DEPLOY_VERIFICATION.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_P0_DEPLOY_VERIFICATION.md | /api/content/resolve/route.ts | ❌ missing in repo |
| docs/_archive/root/IMPLEMENTATION_V05_P0_DEPLOY_VERIFICATION.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/_archive/root/MANUAL_TEST_V05_I03_3.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/_archive/root/MANUAL_TEST_V05_I03_3.md | /api/funnels/.../assessments/... | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/admin/kpi-thresholds/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/admin/notification-templates/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/admin/navigation/[role]/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/admin/reassessment-rules/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/content-resolver/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/notifications/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/notifications/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/review/queue/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/processing/jobs/[jobId]/route.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_CHECKLIST_V0.5.md | /api/__tests__/authHelpers.test.ts | ❌ missing in repo |
| docs/_archive/root/RELEASE_NOTES_V0.5.md | /api/admin/design-tokens/route.ts | ❌ missing in repo |
| docs/_archive/root/REVIEW_EVIDENCE.md | /api/content/resolve.ts | ❌ missing in repo |
| docs/_archive/root/REVIEW_EVIDENCE.md | /api/content/resolve/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/REVIEW_EVIDENCE.md | /api/funnels/[slug]/content-pages/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01B_IMPLEMENTATION.md | /api/admin/diagnostics/pillars-sot/route.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01B_IMPLEMENTATION.md | /api/admin/diagnostics/pillars-sot/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01D_IMPLEMENTATION_SUMMARY.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01D_IMPLEMENTATION_SUMMARY.md | /api/funnels/catalog/__tests__/catalog.test.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01D_VERIFICATION.md | /api/funnels/catalog/__tests__/catalog.test.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01D_VERIFICATION.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01_IMPLEMENTATION_SUMMARY.md | /api/amy/ | ❌ missing in repo |
| docs/_archive/root/TV05_01_IMPLEMENTATION_SUMMARY.md | /api/admin/usage/ | ❌ missing in repo |
| docs/_archive/root/TV05_01_IMPLEMENTATION_SUMMARY.md | /api/your-route | ❌ missing in repo |
| docs/_archive/root/TV05_01_IMPLEMENTATION_SUMMARY.md | /api/admin/usage/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01_IMPLEMENTATION_SUMMARY.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01_IMPLEMENTATION_SUMMARY.md | /api/consent/ | ❌ missing in repo |
| docs/_archive/root/TV05_01_IMPLEMENTATION_SUMMARY.md | /api/your-new-route | ❌ missing in repo |
| docs/_archive/root/TV05_01_VERIFICATION_EVIDENCE.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01_VERIFICATION_EVIDENCE.md | /api/admin/usage/route.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01_VERIFICATION_EVIDENCE.md | /api/admin/usage/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/TV05_01_VERIFICATION_EVIDENCE.md | /api/test | ❌ missing in repo |
| docs/_archive/root/TV05_01_VERIFICATION_EVIDENCE.md | /api/responses.ts | ❌ missing in repo |
| docs/_archive/root/V0.5_MANUAL_TESTS.md | /api/auth/callback/route.ts | ❌ missing in repo |
| docs/_archive/root/V0.5_MANUAL_TESTS.md | /api/review/queue/route.ts | ❌ missing in repo |
| docs/_archive/root/V0.5_MANUAL_TESTS.md | /api/review/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V0.5_MANUAL_TESTS.md | /api/review/[id]/details/route.ts | ❌ missing in repo |
| docs/_archive/root/V0.5_MANUAL_TESTS.md | /api/review/[id]/decide/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_FIXOPT_01_IMPLEMENTATION.md | /api/funnels/catalog/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_FIXOPT_01_IMPLEMENTATION.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I01_3_SUMMARY.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I02_3_VALIDATION_EVIDENCE.md | /api/funnels/catalog/cardiovascular-age | ❌ missing in repo |
| docs/_archive/root/V05_I03_2_IMPLEMENTATION_SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive/root/V05_I03_3_HARDENING_SUMMARY.md | /api/funnels/__tests__/hardening.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I03_3_HARDENING_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/ | ❌ missing in repo |
| docs/_archive/root/V05_I03_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I03_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I03_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/__tests__/save-resume.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I04_1_IMPLEMENTATION_SUMMARY.md | /api/documents/upload/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I04_1_IMPLEMENTATION_SUMMARY.md | /api/documents/[id]/status/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I04_2_IMPLEMENTATION_SUMMARY.md | /api/documents/[id]/extract/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I04_2_IMPLEMENTATION_SUMMARY.md | /api/documents/ | ❌ missing in repo |
| docs/_archive/root/V05_I05_1_IMPLEMENTATION_EVIDENCE.md | /api/processing/start/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_1_IMPLEMENTATION_EVIDENCE.md | /api/processing/jobs/[jobId]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_1_IMPLEMENTATION_EVIDENCE.md | /api/processing/__tests__/integration.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_1_SUMMARY.md | /api/processing/start/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_1_SUMMARY.md | /api/processing/jobs/[jobId]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_1_SUMMARY.md | /api/processing/__tests__/integration.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_2_IMPLEMENTATION_SUMMARY.md | /api/processing/risk/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_3_IMPLEMENTATION_SUMMARY.md | /api/processing/ranking/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_4_IMPLEMENTATION_SUMMARY.md | /api/processing/content/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_5_IMPLEMENTATION_SUMMARY.md | /api/processing/validation/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_6_IMPLEMENTATION_SUMMARY.md | /api/processing/safety/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_7_IMPLEMENTATION_SUMMARY.md | /api/review/queue/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_7_IMPLEMENTATION_SUMMARY.md | /api/review/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_7_IMPLEMENTATION_SUMMARY.md | /api/review/[id]/decide/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_7_IMPLEMENTATION_SUMMARY.md | /api/review/ | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_FINALIZATION_EVIDENCE.md | /api/processing/pdf/__tests__/route.auth-first.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_FINALIZATION_EVIDENCE.md | /api/reports/__tests__/pdf.rbac.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_FINALIZATION_EVIDENCE.md | /api/reports | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_HARDENING_EVIDENCE.md | /api/reports/__tests__/pdf.rbac.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_HARDENING_EVIDENCE.md | /api/processing/pdf/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_HARDENING_EVIDENCE.md | /api/processing/pdf/__tests__/route.auth-first.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_HARDENING_EVIDENCE.md | /api/reports/[reportId]/pdf/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_HARDENING_EVIDENCE.md | /api/reports | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_IMPLEMENTATION_SUMMARY.md | /api/processing/pdf/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_8_IMPLEMENTATION_SUMMARY.md | /api/reports/[reportId]/pdf/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_9_HARDENING_SUMMARY.md | /api/processing/delivery/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_9_HARDENING_SUMMARY.md | /api/processing/delivery/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_9_HARDENING_SUMMARY.md | /api/notifications/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_9_HARDENING_SUMMARY.md | /api/notifications/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_9_IMPLEMENTATION_SUMMARY.md | /api/processing/delivery/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_9_IMPLEMENTATION_SUMMARY.md | /api/notifications/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_9_IMPLEMENTATION_SUMMARY.md | /api/notifications/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I05_9_IMPLEMENTATION_SUMMARY.md | /api/processing/jobs/ | ❌ missing in repo |
| docs/_archive/root/V05_I07_3_HARDENING_SUMMARY.md | /api/review/[id]/details/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_3_HARDENING_SUMMARY.md | /api/review/__tests__/httpSemantics.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_3_HARDENING_SUMMARY.md | /api/review/[id]/details/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_3_HARDENING_SUMMARY.md | /api/review/[id]/decide/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_3_IMPLEMENTATION_SUMMARY.md | /api/review/[id]/details/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_3_MERGE_READY.md | /api/review/[id]/details/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_3_VISUAL_STRUCTURE.md | /api/review/ | ❌ missing in repo |
| docs/_archive/root/V05_I07_4_IMPLEMENTATION_SUMMARY.md | /api/tasks/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_4_IMPLEMENTATION_SUMMARY.md | /api/tasks/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_4_IMPLEMENTATION_SUMMARY.md | /api/patient-profiles/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_4_MERGE_READY.md | /api/tasks/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_4_MERGE_READY.md | /api/tasks/[id]/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_4_MERGE_READY.md | /api/tasks/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_4_MERGE_READY.md | /api/tasks/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I07_4_MERGE_READY.md | /api/patient-profiles/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_1_SECURITY_FIX_SUMMARY.md | /api/tasks/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_2_IMPLEMENTATION_SUMMARY.md | /api/pre-screening-calls/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_2_MERGE_READY.md | /api/pre-screening-calls/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_2_SECURITY_VERIFICATION.md | /api/pre-screening-calls/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_3_IMPLEMENTATION_SUMMARY.md | /api/shipments/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_3_IMPLEMENTATION_SUMMARY.md | /api/shipments/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_3_IMPLEMENTATION_SUMMARY.md | /api/shipments/[id]/events/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_3_MERGE_READY.md | /api/shipments/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_3_MERGE_READY.md | /api/shipments/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_3_MERGE_READY.md | /api/shipments/[id]/events/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_3_SECURITY_FIXES.md | /api/shipments/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_3_SECURITY_FIXES.md | /api/shipments/ | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_IMPLEMENTATION_SUMMARY.md | /api/support-cases/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_IMPLEMENTATION_SUMMARY.md | /api/support-cases/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_IMPLEMENTATION_SUMMARY.md | /api/support-cases/[id]/escalate/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_MERGE_READY.md | /api/support-cases/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_MERGE_READY.md | /api/support-cases/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_MERGE_READY.md | /api/support-cases/[id]/escalate/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_MERGE_READY.md | /api/support-cases/ | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_SECURITY_HARDENING.md | /api/support-cases/[id]/escalate/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_SECURITY_HARDENING.md | /api/support-cases/[id]/escalate/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I08_4_SECURITY_HARDENING.md | /api/support-cases/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_1_IMPLEMENTATION_SUMMARY.md | /api/admin/navigation/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_1_IMPLEMENTATION_SUMMARY.md | /api/admin/navigation/[role]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_1_VISUAL_STRUCTURE.md | /api/admin/navigation/ | ❌ missing in repo |
| docs/_archive/root/V05_I09_2_IMPLEMENTATION_SUMMARY.md | /api/admin/design-tokens/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_3_IMPLEMENTATION_SUMMARY.md | /api/admin/funnel-versions/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_3_IMPLEMENTATION_SUMMARY.md | /api/admin/funnel-versions/[id]/__tests__/route.test.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_4_IMPLEMENTATION_SUMMARY.md | /api/admin/notification-templates/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_4_IMPLEMENTATION_SUMMARY.md | /api/admin/notification-templates/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_4_IMPLEMENTATION_SUMMARY.md | /api/admin/reassessment-rules/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_4_IMPLEMENTATION_SUMMARY.md | /api/admin/reassessment-rules/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_4_IMPLEMENTATION_SUMMARY.md | /api/admin/kpi-thresholds/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_4_IMPLEMENTATION_SUMMARY.md | /api/admin/kpi-thresholds/[id]/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I09_4_IMPLEMENTATION_SUMMARY.md | /api/admin/operational-settings-audit/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_1_IMPLEMENTATION_SUMMARY.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_1_VERIFICATION.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_2_IMPLEMENTATION_SUMMARY.md | /api/account/deletion-request/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_2_IMPLEMENTATION_SUMMARY.md | /api/account/deletion-cancel | ❌ missing in repo |
| docs/_archive/root/V05_I10_2_VERIFICATION.md | /api/account/deletion-request/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_3_FINAL_SUMMARY.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_3_FINAL_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_3_FINAL_SUMMARY.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_3_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_3_IMPLEMENTATION_SUMMARY.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive/root/V05_I10_4_IMPLEMENTATION_SUMMARY.md | /api/review/ | ❌ missing in repo |
| docs/_archive_0_3/A5_IMPLEMENTATION_SUMMARY.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B1_IMPLEMENTATION.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B1_IMPLEMENTATION.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/B1_IMPLEMENTATION.md | /api/funnels/stress/definition | ❌ missing in repo |
| docs/_archive_0_3/B1_SUMMARY.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B1_SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/B1_SUMMARY.md | /api/funnels/stress/definition | ❌ missing in repo |
| docs/_archive_0_3/B1_TESTING_GUIDE.md | /api/funnels/stress/definition | ❌ missing in repo |
| docs/_archive_0_3/B1_TESTING_GUIDE.md | /api/funnels/nonexistent/definition | ❌ missing in repo |
| docs/_archive_0_3/B1_TESTING_GUIDE.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B2.2_IMPLEMENTATION.md | /api/funnels/stress/definition | ❌ missing in repo |
| docs/_archive_0_3/B2_IMPLEMENTATION.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B2_IMPLEMENTATION.md | /api/patient-measures/export/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B2_VALIDATION_IMPLEMENTATION.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B3_IMPLEMENTATION_SUMMARY.md | /api/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B3_NAVIGATION_API.md | /api/assessments/550e8400-e29b-41d4-a716-446655440000/current-step | ❌ missing in repo |
| docs/_archive_0_3/B3_NAVIGATION_API.md | /api/assessments/550e8400-e29b-41d4-a716-446655440000/navigation | ❌ missing in repo |
| docs/_archive_0_3/B3_NAVIGATION_API.md | /api/assessments/550e8400-e29b-41d4-a716-446655440000/resume | ❌ missing in repo |
| docs/_archive_0_3/B3_NAVIGATION_API.md | /api/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B3_NAVIGATION_EXAMPLES.md | /api/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B4_DYNAMIC_VALIDATION_RULES.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B4_IMPLEMENTATION_SUMMARY.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/stress/assessments/abc-123 | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/stress/assessments/abc-123/steps/step-1/validate | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/stress/assessments/abc-123/complete | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B5_FUNNEL_RUNTIME_BACKEND.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B5_IMPLEMENTATION_SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/B5_IMPLEMENTATION_SUMMARY.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B5_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/_archive_0_3/B5_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B5_TESTING_GUIDE.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/_archive_0_3/B5_TESTING_GUIDE.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B5_TESTING_GUIDE.md | /api/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B5_TESTING_GUIDE.md | /api/funnels/invalid-slug/assessments | ❌ missing in repo |
| docs/_archive_0_3/B6_FRONTEND_INTEGRATION.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/_archive_0_3/B6_FRONTEND_INTEGRATION.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B6_FRONTEND_INTEGRATION.md | /api/.../steps/ | ❌ missing in repo |
| docs/_archive_0_3/B6_FRONTEND_INTEGRATION.md | /api/.../complete | ❌ missing in repo |
| docs/_archive_0_3/B6_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/_archive_0_3/B6_IMPLEMENTATION_SUMMARY.md | /api/.../complete | ❌ missing in repo |
| docs/_archive_0_3/B6_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B7_IMPLEMENTATION.md | /api/admin/funnels/[funnel-id] | ❌ missing in repo |
| docs/_archive_0_3/B7_IMPLEMENTATION.md | /api/admin/funnel-steps/[step-id] | ❌ missing in repo |
| docs/_archive_0_3/B7_IMPLEMENTATION.md | /api/admin/funnel-step-questions/[question-id] | ❌ missing in repo |
| docs/_archive_0_3/B7_SUMMARY.md | /api/admin/... | ❌ missing in repo |
| docs/_archive_0_3/B7_TESTING_GUIDE.md | /api/admin/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/B7_TESTING_GUIDE.md | /api/admin/funnel-steps/ | ❌ missing in repo |
| docs/_archive_0_3/B7_TESTING_GUIDE.md | /api/admin/funnel-step-questions/ | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/... | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments/... | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/responses.ts | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/assessment-validation/validate-step/route.ts | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/stress/assessments/ | ❌ missing in repo |
| docs/_archive_0_3/B8_IMPLEMENTATION_SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/D1_CONTENT_PAGES.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/D1_CONTENT_PAGES.md | /api/content-pages/ | ❌ missing in repo |
| docs/_archive_0_3/D1_CONTENT_PAGES.md | /api/funnels/stress-assessment/content-pages | ❌ missing in repo |
| docs/_archive_0_3/D1_CONTENT_PAGES.md | /api/funnels/[slug]/content-pages/route.ts | ❌ missing in repo |
| docs/_archive_0_3/D1_CONTENT_PAGES.md | /api/content-pages/[slug]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/D2_CONTENT_INTEGRATION.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/D2_CONTENT_INTEGRATION_SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/D2_IMPLEMENTATION_SUMMARY.md | /api/consent/record/route.ts | ❌ missing in repo |
| docs/_archive_0_3/D2_IMPLEMENTATION_SUMMARY.md | /api/consent/status/route.ts | ❌ missing in repo |
| docs/_archive_0_3/E1_LOGGING_IMPLEMENTATION.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive_0_3/E1_LOGGING_IMPLEMENTATION.md | /api/amy/stress-summary/route.ts | ❌ missing in repo |
| docs/_archive_0_3/E2_IMPLEMENTATION.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive_0_3/E2_RECOVERY_TESTING.md | /api/funnels/[slug]/assessments/[id]/answers/save | ❌ missing in repo |
| docs/_archive_0_3/EPIC_B_CONSOLIDATION.md | /api/funnels/ | ❌ missing in repo |
| docs/_archive_0_3/EPIC_B_CONSOLIDATION.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| docs/_archive_0_3/EPIC_B_CONSOLIDATION.md | /api/responseTypes.ts | ❌ missing in repo |
| docs/_archive_0_3/EPIC_B_CONSOLIDATION.md | /api/responses.ts | ❌ missing in repo |
| docs/_archive_0_3/EPIC_B_CONSOLIDATION.md | /api/funnels/stress/assessments | ❌ missing in repo |
| docs/_archive_0_3/F10_API_PROTECTION.md | /api/admin/content-pages/ | ❌ missing in repo |
| docs/_archive_0_3/F10_API_PROTECTION.md | /api/authHelpers.ts | ❌ missing in repo |
| docs/_archive_0_3/F10_API_PROTECTION.md | /api/__tests__/authHelpers.test.ts | ❌ missing in repo |
| docs/_archive_0_3/F10_API_PROTECTION.md | /api/authHelpers | ❌ missing in repo |
| docs/_archive_0_3/F10_SECURITY_VERIFICATION.md | /api/__tests__/authHelpers.test.ts | ❌ missing in repo |
| docs/_archive_0_3/F10_SECURITY_VERIFICATION.md | /api/content-pages/some-draft-slug | ❌ missing in repo |
| docs/_archive_0_3/F10_SECURITY_VERIFICATION.md | /api/content-pages/some-published-slug | ❌ missing in repo |
| docs/_archive_0_3/F2_IMPLEMENTATION_SUMMARY.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F2_IMPLEMENTATION_SUMMARY.md | /api/admin/content-pages/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F6_IMPLEMENTATION_SUMMARY.md | /api/content/resolve/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F8_IMPLEMENTATION_SUMMARY.md | /api/content-resolver/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F8_TESTING_CHECKLIST.md | /api/content-resolver/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F9_ADMIN_ROUTE_GUARDING.md | /api/admin/content-pages/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F9_ADMIN_ROUTE_GUARDING.md | /api/admin/content-pages/[id]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F9_ADMIN_ROUTE_GUARDING.md | /api/admin/content-pages/[id]/sections/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F9_ADMIN_ROUTE_GUARDING.md | /api/admin/content-pages/[id]/sections/[sectionId]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F9_ADMIN_ROUTE_GUARDING.md | /api/admin/funnels/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F9_ADMIN_ROUTE_GUARDING.md | /api/admin/funnels/[id]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F9_ADMIN_ROUTE_GUARDING.md | /api/admin/funnel-steps/[id]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/F9_ADMIN_ROUTE_GUARDING.md | /api/admin/funnel-step-questions/[id]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/FEATURE_FLAGS.md | /api/amy/stress-report/route.ts | ❌ missing in repo |
| docs/_archive_0_3/FIX_SUMMARY_DE.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/FIX_SUMMARY_DE.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/FIX_SUMMARY_DE.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/_archive_0_3/FIX_SUMMARY_DE.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/_archive_0_3/FIX_SUMMARY_DE.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/_archive_0_3/ISSUES_v0.3.md | /api/funnels/[slug] | ❌ missing in repo |
| docs/_archive_0_3/ISSUES_v0.3.md | /api/funnels/[slug]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/ISSUES_v0.3.md | /api/funnels/stress | ❌ missing in repo |
| docs/_archive_0_3/ISSUES_v0.3.md | /api/funnel-assessments/[slug] | ❌ missing in repo |
| docs/_archive_0_3/ISSUES_v0.3.md | /api/funnel-assessments/[slug]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/ISSUES_v0.3.md | /api/content/[slug]. | ❌ missing in repo |
| docs/_archive_0_3/ISSUES_v0.3.md | /api/content/was-ist-stress | ❌ missing in repo |
| docs/_archive_0_3/SAVE_ON_TAP.md | /api/assessment-answers/save/route.ts | ❌ missing in repo |
| docs/_archive_0_3/WEITER_BUTTON_FIX.md | /api/funnels/[slug]/assessments/[assessmentId]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/WEITER_BUTTON_FIX.md | /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | ❌ missing in repo |
| docs/_archive_0_3/WEITER_BUTTON_FIX.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| docs/_archive_0_3/WEITER_BUTTON_FIX.md | /api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | ❌ missing in repo |
| docs/_archive_0_3/WEITER_BUTTON_FIX.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| docs/_archive_0_3/WEITER_BUTTON_FIX.md | /api/funnels/[slug]/definition/route.ts | ❌ missing in repo |
| E74.3-COMPLETE.md | /api/admin/studio/funnels/ | ❌ missing in repo |
| E74.3-COMPLETE.md | /api/admin/studio/funnels/[slug]/drafts/route.ts | ❌ missing in repo |
| E74.3-COMPLETE.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/route.ts | ❌ missing in repo |
| E74.3-COMPLETE.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts | ❌ missing in repo |
| E74.3-COMPLETE.md | /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish/route.ts | ❌ missing in repo |
| E74.3-COMPLETE.md | /api/admin/studio/funnels/[slug]/history/route.ts | ❌ missing in repo |
| E74.4-COMPLETE.md | /api/funnels/ | ❌ missing in repo |
| E74.5-COMPLETE.md | /api/funnels/[slug]/assessments/[id]/answers/save | ❌ missing in repo |
| E74.5-COMPLETE.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| E74.5-COMPLETE.md | /api/funnels/ | ❌ missing in repo |
| E74.5-COMPLETE.md | /api/assessments/[id]/resume/route.ts | ❌ missing in repo |
| E74.5-COMPLETE.md | /api/assessmentPersistence.ts | ❌ missing in repo |
| E74.5-COMPLETE.md | /api/funnels/stress/assessments/ABC/answers/save | ❌ missing in repo |
| E74.5-COMPLETE.md | /api/assessments/ABC/resume | ❌ missing in repo |
| E74.5-SUMMARY.md | /api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | ❌ missing in repo |
| E74.5-SUMMARY.md | /api/assessments/[id]/resume/route.ts | ❌ missing in repo |
| E74.5-SUMMARY.md | /api/assessmentPersistence.ts | ❌ missing in repo |
| E74.6-COMPLETE.md | /api/clinician/patient-funnels/route.ts | ❌ missing in repo |
| E74.6-COMPLETE.md | /api/clinician/patient-funnels/[id]/route.ts | ❌ missing in repo |
| E74.6-COMPLETE.md | /api/clinician/patients/[patientId]/funnels/route.ts | ❌ missing in repo |
| E74.6-SUMMARY.md | /api/clinician/patient-funnels/route.ts | ❌ missing in repo |
| E74.6-SUMMARY.md | /api/clinician/patient-funnels/[id]/route.ts | ❌ missing in repo |
| E74.6-SUMMARY.md | /api/clinician/patients/[patientId]/funnels/route.ts | ❌ missing in repo |
| E74.7-COMPLETE.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| E74.7-COMPLETE.md | /api/funnels/__tests__/e74-7-idempotency.test.ts | ❌ missing in repo |
| E74.7-COMPLETE.md | /api/funnels/ | ❌ missing in repo |
| E74.7-COMPLETE.md | /api/funnels/stress-assessment/assessments | ❌ missing in repo |
| E74.7-COMPLETE.md | /api/funnels/cardiovascular-age/assessments | ❌ missing in repo |
| E74.7-SUMMARY.md | /api/funnels/[slug]/assessments/route.ts | ❌ missing in repo |
| E74.7-SUMMARY.md | /api/funnels/ | ❌ missing in repo |
| E74.7-SUMMARY.md | /api/funnels/stress/assessments | ❌ missing in repo |
| E74.7-SUMMARY.md | /api/funnels/__tests__/e74-7-idempotency.test.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/studio | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/studio/patients/[patientId]/anamnesis | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/patient/anamnesis/route.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/patient/anamnesis/[entryId]/route.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/patient/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/patient/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/studio/patients/[patientId]/anamnesis/route.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/studio/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/studio/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/anamnesis/validation.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/anamnesis/helpers.ts | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/patient/anamnesis/ | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/studio/patients/ | ❌ missing in repo |
| E75.2-COMPLETE.md | /api/responseTypes.ts | ❌ missing in repo |
| E75.3-COMPLETE.md | /api/patient/anamnesis/[entryId]/route.ts | ❌ missing in repo |
| E75.4-COMPLETE.md | /api/studio/patients/[patientId]/anamnesis | ❌ missing in repo |
| E75.4-COMPLETE.md | /api/anamnesis/validation | ❌ missing in repo |
| E75.4-COMPLETE.md | /api/studio/patients/[patientId]/anamnesis/route.ts | ❌ missing in repo |
| E75.4-COMPLETE.md | /api/studio/anamnesis/[entryId]/versions/route.ts | ❌ missing in repo |
| E75.4-COMPLETE.md | /api/studio/anamnesis/[entryId]/archive/route.ts | ❌ missing in repo |
| E75.4-COMPLETE.md | /api/anamnesis/validation.ts | ❌ missing in repo |
| E75.4-COMPLETE.md | /api/anamnesis/helpers.ts | ❌ missing in repo |
| E75.5-COMPLETE.md | /api/studio/patients/[patientId]/anamnesis | ❌ missing in repo |
| E75.5-COMPLETE.md | /api/admin/anamnesis/regenerate-summaries | ❌ missing in repo |
| E75.6-COMPLETE.md | /api/patient/anamnesis/export.json/route.ts | ❌ missing in repo |
| E75.6-COMPLETE.md | /api/studio/patients/[patientId]/anamnesis/export.json/route.ts | ❌ missing in repo |
| E75.6-COMPLETE.md | /api/anamnesis/export.ts | ❌ missing in repo |
| E75.6-COMPLETE.md | /api/anamnesis/exportClient.ts | ❌ missing in repo |
| E75.6-COMPLETE.md | /api/studio/patients/ | ❌ missing in repo |
| E76.1-COMPLETE.md | /api/mcp/route.ts | ❌ missing in repo |
| E76.1-COMPLETE.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| E76.2-COMPLETE.md | /api/mcp/context-pack/route.ts | ❌ missing in repo |
| E76.2-COMPLETE.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| E76.4-COMPLETE.md | /api/studio/diagnosis/execute/route.ts | ❌ missing in repo |
| E76.4-COMPLETE.md | /api/mcp/context-pack/route.ts | ❌ missing in repo |
| E76.4-COMPLETE.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| E76.5-COMPLETE.md | /api/studio/diagnosis/prompt/route.ts | ❌ missing in repo |
| E76.6-COMPLETE.md | /api/patient/diagnosis/runs/route.ts | ❌ missing in repo |
| E76.6-COMPLETE.md | /api/patient/diagnosis/artifacts/[id] | ❌ missing in repo |
| E76.6-COMPLETE.md | /api/patient/diagnosis/artifacts/[id]/route.ts | ❌ missing in repo |
| E76.6-COMPLETE.md | /api/patient/diagnosis/artifacts/ | ❌ missing in repo |
| E76.8-COMPLETE.md | /api/studio/diagnosis/queue/route.ts | ❌ missing in repo |
| E76.8-COMPLETE.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| E76.9-COMPLETE.md | /api/... | ❌ missing in repo |
| E76.9-COMPLETE.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| E76.9-COMPLETE.md | /api/example | ❌ missing in repo |
| E76.9-COMPLETE.md | /api/patient/diagnosis/artifacts/[id] | ❌ missing in repo |
| E78.1-COMPLETE.md | /api/admin/processing/retry/ | ❌ missing in repo |
| E78.1-COMPLETE.md | /api/clinician/inbox | ❌ missing in repo |
| E78.1-COMPLETE.md | /api/clinician/inbox/ | ❌ missing in repo |
| E78.1-COMPLETE.md | /api/clinician/inbox/stats | ❌ missing in repo |
| E78.2-COMPLETE.md | /api/clinician/inbox | ❌ missing in repo |
| E78.3-COMPLETE.md | /api/clinician/triage/route.ts | ❌ missing in repo |
| E78.3-SUMMARY.md | /api/clinician/triage/route.ts | ❌ missing in repo |
| E78.3-VERIFICATION-REPORT.md | /api/clinician/triage/route.ts | ❌ missing in repo |
| E78.3-VERIFICATION-REPORT.md | /api/responses | ❌ missing in repo |
| E78.7-COMPLETE.md | /api/clinician/triage/ | ❌ missing in repo |
| legacy/README.md | /api/[original-path] | ❌ missing in repo |
| legacy/README.md | /api/[route] | ❌ missing in repo |
| legacy/README.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| legacy/routes/README.md | /api/assessments | ❌ missing in repo |
| legacy/routes/README.md | /api/assessments/[id] | ❌ missing in repo |
| legacy/routes/README.md | /api/assessment-answers | ❌ missing in repo |
| legacy/routes/README.md | /api/assessment-validation | ❌ missing in repo |
| legacy/routes/README.md | /api/content-pages | ❌ missing in repo |
| legacy/routes/README.md | /api/reports | ❌ missing in repo |
| legacy/routes/README.md | /api/reports/[reportId] | ❌ missing in repo |
| legacy/routes/README.md | /api/health | ❌ missing in repo |
| legacy/routes/README.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| legacy/routes/README.md | /api/endpoint-allowlist.json | ❌ missing in repo |
| lib/questionnaire/MANIFEST_WIRING.md | /api/funnels/[slug]/questionnaire/route.ts | ❌ missing in repo |
| lib/questionnaire/MANIFEST_WIRING.md | /api/funnels/ | ❌ missing in repo |
| lib/questionnaire/README.md | /api/funnels/ | ❌ missing in repo |
| lib/results/README.md | /api/ENDPOINT_CATALOG.md | ❌ missing in repo |
| lib/review/README.md | /api/review/ | ❌ missing in repo |
| packages/mcp-server/README.md | /api/mcp/route.ts | ❌ missing in repo |
| RULES_VS_CHECKS_MATRIX_E75_4.md | /api/studio/patients/[patientId]/anamnesis | ❌ missing in repo |
| RULES_VS_CHECKS_MATRIX_E75_4.md | /api/studio/patients/[patientId]/anamnesis/route.ts | ❌ missing in repo |

