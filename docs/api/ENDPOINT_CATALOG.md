# Endpoint Catalog

Deterministic inventory of Next API routes and in-repo callsites.

| Path | Methods | Access | Intent | Used by | Route file |
| --- | --- | --- | --- | ---: | --- |
| /api/_debug/env | GET | system |  | 0 | apps/rhythm-patient-ui/app/api/_debug/env/route.ts |
| /api/account/deletion-request | POST | patient |  | 0 | apps/rhythm-legacy/app/api/account/deletion-request/route.ts |
| /api/account/deletion-request | POST | patient |  | 0 | legacy/code/app/api/account/deletion-request/route.ts |
| /api/admin/content-pages | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/content-pages/route.ts |
| /api/admin/content-pages | GET, POST | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/content-pages/route.ts |
| /api/admin/content-pages | GET, POST | admin |  | 1 | legacy/code/app/api/admin/content-pages/route.ts |
| /api/admin/content-pages/[id] | DELETE, GET, PATCH | admin |  | 1 | apps/rhythm-legacy/app/api/admin/content-pages/[id]/route.ts |
| /api/admin/content-pages/[id] | DELETE, GET, PATCH | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/content-pages/[id]/route.ts |
| /api/admin/content-pages/[id] | DELETE, GET, PATCH | admin |  | 1 | legacy/code/app/api/admin/content-pages/[id]/route.ts |
| /api/admin/content-pages/[id]/sections | GET, POST | admin |  | 2 | apps/rhythm-legacy/app/api/admin/content-pages/[id]/sections/route.ts |
| /api/admin/content-pages/[id]/sections | GET, POST | admin |  | 2 | apps/rhythm-studio-ui/app/api/admin/content-pages/[id]/sections/route.ts |
| /api/admin/content-pages/[id]/sections | GET, POST | admin |  | 2 | legacy/code/app/api/admin/content-pages/[id]/sections/route.ts |
| /api/admin/content-pages/[id]/sections/[sectionId] | DELETE, PATCH | admin |  | 6 | apps/rhythm-legacy/app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts |
| /api/admin/content-pages/[id]/sections/[sectionId] | DELETE, PATCH | admin |  | 6 | apps/rhythm-studio-ui/app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts |
| /api/admin/content-pages/[id]/sections/[sectionId] | DELETE, PATCH | admin |  | 6 | legacy/code/app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts |
| /api/admin/design-tokens | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/design-tokens/route.ts |
| /api/admin/design-tokens | GET, POST | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/design-tokens/route.ts |
| /api/admin/design-tokens | GET, POST | admin |  | 1 | legacy/code/app/api/admin/design-tokens/route.ts |
| /api/admin/dev/endpoint-catalog | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/dev/endpoint-catalog/route.ts |
| /api/admin/dev/endpoint-catalog | GET | admin |  | 0 | apps/rhythm-studio-ui/app/api/admin/dev/endpoint-catalog/route.ts |
| /api/admin/dev/endpoint-catalog | GET | admin |  | 0 | legacy/code/app/api/admin/dev/endpoint-catalog/route.ts |
| /api/admin/diagnostics/pillars-sot | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/diagnostics/pillars-sot/route.ts |
| /api/admin/diagnostics/pillars-sot | GET | admin |  | 0 | legacy/code/app/api/admin/diagnostics/pillars-sot/route.ts |
| /api/admin/funnel-step-questions/[id] | PATCH | admin |  | 1 | apps/rhythm-legacy/app/api/admin/funnel-step-questions/[id]/route.ts |
| /api/admin/funnel-step-questions/[id] | PATCH | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/funnel-step-questions/[id]/route.ts |
| /api/admin/funnel-step-questions/[id] | PATCH | admin |  | 1 | legacy/code/app/api/admin/funnel-step-questions/[id]/route.ts |
| /api/admin/funnel-steps | POST | admin |  | 0 | apps/rhythm-legacy/app/api/admin/funnel-steps/route.ts |
| /api/admin/funnel-steps | POST | admin |  | 0 | legacy/code/app/api/admin/funnel-steps/route.ts |
| /api/admin/funnel-steps/[id] | PATCH | admin |  | 3 | apps/rhythm-legacy/app/api/admin/funnel-steps/[id]/route.ts |
| /api/admin/funnel-steps/[id] | PATCH | admin |  | 3 | apps/rhythm-studio-ui/app/api/admin/funnel-steps/[id]/route.ts |
| /api/admin/funnel-steps/[id] | PATCH | admin |  | 3 | legacy/code/app/api/admin/funnel-steps/[id]/route.ts |
| /api/admin/funnel-steps/[id]/questions | POST | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/funnel-steps/[id]/questions/route.ts |
| /api/admin/funnel-steps/[id]/questions/[questionId] | DELETE | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/funnel-steps/[id]/questions/[questionId]/route.ts |
| /api/admin/funnel-versions/[id] | PATCH | admin |  | 13 | apps/rhythm-legacy/app/api/admin/funnel-versions/[id]/route.ts |
| /api/admin/funnel-versions/[id] | PATCH | admin |  | 13 | apps/rhythm-studio-ui/app/api/admin/funnel-versions/[id]/route.ts |
| /api/admin/funnel-versions/[id] | PATCH | admin |  | 13 | legacy/code/app/api/admin/funnel-versions/[id]/route.ts |
| /api/admin/funnel-versions/[id]/manifest | GET, PUT | admin |  | 2 | apps/rhythm-legacy/app/api/admin/funnel-versions/[id]/manifest/route.ts |
| /api/admin/funnel-versions/[id]/manifest | GET, PUT | admin |  | 2 | apps/rhythm-studio-ui/app/api/admin/funnel-versions/[id]/manifest/route.ts |
| /api/admin/funnel-versions/[id]/manifest | GET, PUT | admin |  | 2 | legacy/code/app/api/admin/funnel-versions/[id]/manifest/route.ts |
| /api/admin/funnels | GET | admin |  | 24 | apps/rhythm-legacy/app/api/admin/funnels/route.ts |
| /api/admin/funnels | GET | admin |  | 24 | apps/rhythm-studio-ui/app/api/admin/funnels/route.ts |
| /api/admin/funnels | GET | admin |  | 24 | legacy/code/app/api/admin/funnels/route.ts |
| /api/admin/funnels/[id] | GET, PATCH | admin |  | 18 | apps/rhythm-legacy/app/api/admin/funnels/[id]/route.ts |
| /api/admin/funnels/[id] | GET, PATCH | admin |  | 18 | apps/rhythm-studio-ui/app/api/admin/funnels/[id]/route.ts |
| /api/admin/funnels/[id] | GET, PATCH | admin |  | 18 | legacy/code/app/api/admin/funnels/[id]/route.ts |
| /api/admin/kpi-thresholds | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/kpi-thresholds/route.ts |
| /api/admin/kpi-thresholds | GET, POST | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/kpi-thresholds/route.ts |
| /api/admin/kpi-thresholds | GET, POST | admin |  | 1 | legacy/code/app/api/admin/kpi-thresholds/route.ts |
| /api/admin/kpi-thresholds/[id] | DELETE, PUT | admin |  | 1 | apps/rhythm-legacy/app/api/admin/kpi-thresholds/[id]/route.ts |
| /api/admin/kpi-thresholds/[id] | DELETE, PUT | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/kpi-thresholds/[id]/route.ts |
| /api/admin/kpi-thresholds/[id] | DELETE, PUT | admin |  | 1 | legacy/code/app/api/admin/kpi-thresholds/[id]/route.ts |
| /api/admin/navigation | GET | admin |  | 2 | apps/rhythm-legacy/app/api/admin/navigation/route.ts |
| /api/admin/navigation | GET | admin |  | 2 | apps/rhythm-patient-ui/app/api/admin/navigation/route.ts |
| /api/admin/navigation | GET | admin |  | 2 | apps/rhythm-studio-ui/app/api/admin/navigation/route.ts |
| /api/admin/navigation | GET | admin |  | 2 | legacy/code/app/api/admin/navigation/route.ts |
| /api/admin/navigation/[role] | PUT | admin |  | 1 | apps/rhythm-legacy/app/api/admin/navigation/[role]/route.ts |
| /api/admin/navigation/[role] | PUT | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/navigation/[role]/route.ts |
| /api/admin/navigation/[role] | PUT | admin |  | 1 | legacy/code/app/api/admin/navigation/[role]/route.ts |
| /api/admin/notification-templates | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/notification-templates/route.ts |
| /api/admin/notification-templates | GET, POST | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/notification-templates/route.ts |
| /api/admin/notification-templates | GET, POST | admin |  | 1 | legacy/code/app/api/admin/notification-templates/route.ts |
| /api/admin/notification-templates/[id] | DELETE, PUT | admin |  | 1 | apps/rhythm-legacy/app/api/admin/notification-templates/[id]/route.ts |
| /api/admin/notification-templates/[id] | DELETE, PUT | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/notification-templates/[id]/route.ts |
| /api/admin/notification-templates/[id] | DELETE, PUT | admin |  | 1 | legacy/code/app/api/admin/notification-templates/[id]/route.ts |
| /api/admin/operational-settings-audit | GET | admin |  | 1 | apps/rhythm-legacy/app/api/admin/operational-settings-audit/route.ts |
| /api/admin/operational-settings-audit | GET | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/operational-settings-audit/route.ts |
| /api/admin/operational-settings-audit | GET | admin |  | 1 | legacy/code/app/api/admin/operational-settings-audit/route.ts |
| /api/admin/pilot/flow-events | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/pilot/flow-events/route.ts |
| /api/admin/pilot/flow-events | GET | admin |  | 0 | legacy/code/app/api/admin/pilot/flow-events/route.ts |
| /api/admin/pilot/kpis | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/pilot/kpis/route.ts |
| /api/admin/pilot/kpis | GET | admin |  | 0 | legacy/code/app/api/admin/pilot/kpis/route.ts |
| /api/admin/reassessment-rules | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/reassessment-rules/route.ts |
| /api/admin/reassessment-rules | GET, POST | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/reassessment-rules/route.ts |
| /api/admin/reassessment-rules | GET, POST | admin |  | 1 | legacy/code/app/api/admin/reassessment-rules/route.ts |
| /api/admin/reassessment-rules/[id] | DELETE, PUT | admin |  | 1 | apps/rhythm-legacy/app/api/admin/reassessment-rules/[id]/route.ts |
| /api/admin/reassessment-rules/[id] | DELETE, PUT | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/reassessment-rules/[id]/route.ts |
| /api/admin/reassessment-rules/[id] | DELETE, PUT | admin |  | 1 | legacy/code/app/api/admin/reassessment-rules/[id]/route.ts |
| /api/admin/studio/funnels/[slug]/drafts | GET, POST | admin |  | 0 | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/route.ts |
| /api/admin/studio/funnels/[slug]/drafts/[draftId] | DELETE, GET, PUT | admin |  | 0 | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/route.ts |
| /api/admin/studio/funnels/[slug]/drafts/[draftId]/publish | POST | admin |  | 0 | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/publish/route.ts |
| /api/admin/studio/funnels/[slug]/drafts/[draftId]/validate | POST | admin |  | 0 | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/drafts/[draftId]/validate/route.ts |
| /api/admin/studio/funnels/[slug]/history | GET | admin |  | 0 | apps/rhythm-studio-ui/app/api/admin/studio/funnels/[slug]/history/route.ts |
| /api/admin/usage | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/usage/route.ts |
| /api/admin/usage | GET | admin |  | 0 | legacy/code/app/api/admin/usage/route.ts |
| /api/amy/chat | GET, POST | system |  | 3 | apps/rhythm-patient-ui/app/api/amy/chat/route.ts |
| /api/amy/stress-report | POST | system |  | 0 | apps/rhythm-legacy/app/api/amy/stress-report/route.ts |
| /api/amy/stress-report | POST | system |  | 0 | legacy/code/app/api/amy/stress-report/route.ts |
| /api/amy/stress-summary | POST | system |  | 0 | apps/rhythm-legacy/app/api/amy/stress-summary/route.ts |
| /api/amy/stress-summary | POST | system |  | 0 | legacy/code/app/api/amy/stress-summary/route.ts |
| /api/amy/triage | POST | system |  | 1 | apps/rhythm-legacy/app/api/amy/triage/route.ts |
| /api/amy/triage | POST | system |  | 1 | apps/rhythm-patient-ui/app/api/amy/triage/route.ts |
| /api/amy/triage | POST | system |  | 1 | legacy/code/app/api/amy/triage/route.ts |
| /api/assessment-answers/save | POST | patient |  | 1 | apps/rhythm-legacy/app/api/assessment-answers/save/route.ts |
| /api/assessment-answers/save | POST | patient |  | 1 | apps/rhythm-patient-ui/app/api/assessment-answers/save/route.ts |
| /api/assessment-answers/save | POST | patient |  | 1 | legacy/code/app/api/assessment-answers/save/route.ts |
| /api/assessment-validation/validate-step | POST | patient |  | 1 | apps/rhythm-legacy/app/api/assessment-validation/validate-step/route.ts |
| /api/assessment-validation/validate-step | POST | patient |  | 1 | apps/rhythm-patient-ui/app/api/assessment-validation/validate-step/route.ts |
| /api/assessment-validation/validate-step | POST | patient |  | 1 | legacy/code/app/api/assessment-validation/validate-step/route.ts |
| /api/assessments/[id]/current-step | GET | patient |  | 0 | apps/rhythm-legacy/app/api/assessments/[id]/current-step/route.ts |
| /api/assessments/[id]/current-step | GET | patient |  | 0 | apps/rhythm-patient-ui/app/api/assessments/[id]/current-step/route.ts |
| /api/assessments/[id]/current-step | GET | patient |  | 0 | legacy/code/app/api/assessments/[id]/current-step/route.ts |
| /api/assessments/[id]/navigation | GET | patient |  | 0 | apps/rhythm-legacy/app/api/assessments/[id]/navigation/route.ts |
| /api/assessments/[id]/navigation | GET | patient |  | 0 | apps/rhythm-patient-ui/app/api/assessments/[id]/navigation/route.ts |
| /api/assessments/[id]/navigation | GET | patient |  | 0 | legacy/code/app/api/assessments/[id]/navigation/route.ts |
| /api/assessments/[id]/resume | GET | patient |  | 1 | apps/rhythm-legacy/app/api/assessments/[id]/resume/route.ts |
| /api/assessments/[id]/resume | GET | patient |  | 1 | apps/rhythm-patient-ui/app/api/assessments/[id]/resume/route.ts |
| /api/assessments/[id]/resume | GET | patient |  | 1 | legacy/code/app/api/assessments/[id]/resume/route.ts |
| /api/assessments/[id]/state | GET | patient |  | 1 | apps/rhythm-legacy/app/api/assessments/[id]/state/route.ts |
| /api/assessments/[id]/state | GET | patient |  | 1 | apps/rhythm-patient-ui/app/api/assessments/[id]/state/route.ts |
| /api/assessments/[id]/state | GET | patient |  | 1 | legacy/code/app/api/assessments/[id]/state/route.ts |
| /api/assessments/in-progress | GET | patient |  | 0 | apps/rhythm-legacy/app/api/assessments/in-progress/route.ts |
| /api/assessments/in-progress | GET | patient |  | 0 | apps/rhythm-patient-ui/app/api/assessments/in-progress/route.ts |
| /api/assessments/in-progress | GET | patient |  | 0 | legacy/code/app/api/assessments/in-progress/route.ts |
| /api/auth/callback | POST | public |  | 11 | apps/rhythm-legacy/app/api/auth/callback/route.ts |
| /api/auth/callback | POST | public |  | 11 | apps/rhythm-patient-ui/app/api/auth/callback/route.ts |
| /api/auth/callback | POST | public |  | 11 | apps/rhythm-studio-ui/app/api/auth/callback/route.ts |
| /api/auth/callback | POST | public |  | 11 | legacy/code/app/api/auth/callback/route.ts |
| /api/auth/debug | GET | public |  | 0 | apps/rhythm-studio-ui/app/api/auth/debug/route.ts |
| /api/auth/debug-cookie | GET | public |  | 0 | apps/rhythm-studio-ui/app/api/auth/debug-cookie/route.ts |
| /api/auth/resolve-role | GET | public |  | 7 | apps/rhythm-legacy/app/api/auth/resolve-role/route.ts |
| /api/auth/resolve-role | GET | public |  | 7 | apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts |
| /api/auth/resolve-role | GET | public |  | 7 | apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts |
| /api/auth/resolve-role | GET | public |  | 7 | legacy/code/app/api/auth/resolve-role/route.ts |
| /api/auth/signout | GET, POST | public |  | 4 | apps/rhythm-legacy/app/api/auth/signout/route.ts |
| /api/auth/signout | GET, POST | public |  | 4 | apps/rhythm-patient-ui/app/api/auth/signout/route.ts |
| /api/auth/signout | GET, POST | public |  | 4 | apps/rhythm-studio-ui/app/api/auth/signout/route.ts |
| /api/auth/signout | GET, POST | public |  | 4 | legacy/code/app/api/auth/signout/route.ts |
| /api/clinician/patient-funnels | POST | clinician |  | 0 | apps/rhythm-studio-ui/app/api/clinician/patient-funnels/route.ts |
| /api/clinician/patient-funnels/[id] | PATCH | clinician |  | 1 | apps/rhythm-studio-ui/app/api/clinician/patient-funnels/[id]/route.ts |
| /api/clinician/patients/[patientId]/funnels | GET | clinician |  | 1 | apps/rhythm-studio-ui/app/api/clinician/patients/[patientId]/funnels/route.ts |
| /api/consent/record | POST | patient |  | 0 | apps/rhythm-legacy/app/api/consent/record/route.ts |
| /api/consent/record | POST | patient |  | 0 | legacy/code/app/api/consent/record/route.ts |
| /api/consent/status | GET | patient |  | 0 | apps/rhythm-legacy/app/api/consent/status/route.ts |
| /api/consent/status | GET | patient |  | 0 | legacy/code/app/api/consent/status/route.ts |
| /api/content-pages/[slug] | GET | patient |  | 2 | apps/rhythm-legacy/app/api/content-pages/[slug]/route.ts |
| /api/content-pages/[slug] | GET | patient |  | 2 | legacy/code/app/api/content-pages/[slug]/route.ts |
| /api/content-resolver | GET | patient |  | 0 | apps/rhythm-legacy/app/api/content-resolver/route.ts |
| /api/content-resolver | GET | patient |  | 0 | legacy/code/app/api/content-resolver/route.ts |
| /api/content/[slug] | GET | patient |  | 12 | apps/rhythm-patient-ui/app/api/content/[slug]/route.ts |
| /api/content/resolve | GET | patient |  | 0 | apps/rhythm-legacy/app/api/content/resolve/route.ts |
| /api/content/resolve | GET | patient |  | 0 | legacy/code/app/api/content/resolve/route.ts |
| /api/documents/[id]/extract | POST | system |  | 0 | apps/rhythm-legacy/app/api/documents/[id]/extract/route.ts |
| /api/documents/[id]/extract | POST | system |  | 0 | legacy/code/app/api/documents/[id]/extract/route.ts |
| /api/documents/[id]/status | PATCH | system |  | 0 | apps/rhythm-legacy/app/api/documents/[id]/status/route.ts |
| /api/documents/[id]/status | PATCH | system |  | 0 | legacy/code/app/api/documents/[id]/status/route.ts |
| /api/documents/upload | POST | system |  | 0 | apps/rhythm-legacy/app/api/documents/upload/route.ts |
| /api/documents/upload | POST | system |  | 0 | legacy/code/app/api/documents/upload/route.ts |
| /api/escalation/log-click | POST | patient |  | 0 | apps/rhythm-legacy/app/api/escalation/log-click/route.ts |
| /api/escalation/log-click | POST | patient |  | 0 | legacy/code/app/api/escalation/log-click/route.ts |
| /api/funnels/[slug]/assessments | POST | patient |  | 22 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/route.ts |
| /api/funnels/[slug]/assessments | POST | patient |  | 22 | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/route.ts |
| /api/funnels/[slug]/assessments | POST | patient |  | 22 | legacy/code/app/api/funnels/[slug]/assessments/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId] | GET | patient |  | 16 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId] | GET | patient |  | 16 | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId] | GET | patient |  | 16 | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/answers/save | POST | patient |  | 14 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/answers/save | POST | patient |  | 14 | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/answers/save | POST | patient |  | 14 | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/complete | POST | patient |  | 14 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/complete | POST | patient |  | 14 | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/complete | POST | patient |  | 14 | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/result | GET | patient |  | 7 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/result | GET | patient |  | 7 | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/result | GET | patient |  | 7 | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | POST | patient |  | 8 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | POST | patient |  | 8 | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | POST | patient |  | 8 | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/workup | POST | patient |  | 0 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/workup | POST | patient |  | 0 | apps/rhythm-patient-ui/app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/workup | POST | patient |  | 0 | legacy/code/app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts |
| /api/funnels/[slug]/content-pages | GET | patient |  | 0 | apps/rhythm-legacy/app/api/funnels/[slug]/content-pages/route.ts |
| /api/funnels/[slug]/content-pages | GET | patient |  | 0 | apps/rhythm-patient-ui/app/api/funnels/[slug]/content-pages/route.ts |
| /api/funnels/[slug]/content-pages | GET | patient |  | 0 | legacy/code/app/api/funnels/[slug]/content-pages/route.ts |
| /api/funnels/[slug]/definition | GET | patient |  | 7 | apps/rhythm-legacy/app/api/funnels/[slug]/definition/route.ts |
| /api/funnels/[slug]/definition | GET | patient |  | 7 | apps/rhythm-patient-ui/app/api/funnels/[slug]/definition/route.ts |
| /api/funnels/[slug]/definition | GET | patient |  | 7 | legacy/code/app/api/funnels/[slug]/definition/route.ts |
| /api/funnels/active | GET | patient |  | 0 | apps/rhythm-legacy/app/api/funnels/active/route.ts |
| /api/funnels/active | GET | patient |  | 0 | apps/rhythm-patient-ui/app/api/funnels/active/route.ts |
| /api/funnels/active | GET | patient |  | 0 | legacy/code/app/api/funnels/active/route.ts |
| /api/funnels/catalog | GET | patient |  | 35 | apps/rhythm-legacy/app/api/funnels/catalog/route.ts |
| /api/funnels/catalog | GET | patient |  | 35 | apps/rhythm-patient-ui/app/api/funnels/catalog/route.ts |
| /api/funnels/catalog | GET | patient |  | 35 | legacy/code/app/api/funnels/catalog/route.ts |
| /api/funnels/catalog/[slug] | GET | patient |  | 12 | apps/rhythm-legacy/app/api/funnels/catalog/[slug]/route.ts |
| /api/funnels/catalog/[slug] | GET | patient |  | 12 | apps/rhythm-patient-ui/app/api/funnels/catalog/[slug]/route.ts |
| /api/funnels/catalog/[slug] | GET | patient |  | 12 | legacy/code/app/api/funnels/catalog/[slug]/route.ts |
| /api/health/env | GET | public |  | 0 | apps/rhythm-legacy/app/api/health/env/route.ts |
| /api/health/env | GET | public |  | 0 | legacy/code/app/api/health/env/route.ts |
| /api/notifications | GET | patient |  | 0 | apps/rhythm-legacy/app/api/notifications/route.ts |
| /api/notifications | GET | patient |  | 0 | legacy/code/app/api/notifications/route.ts |
| /api/notifications/[id] | PATCH | patient |  | 0 | apps/rhythm-legacy/app/api/notifications/[id]/route.ts |
| /api/notifications/[id] | PATCH | patient |  | 0 | legacy/code/app/api/notifications/[id]/route.ts |
| /api/patient-measures/export | GET | patient |  | 1 | apps/rhythm-legacy/app/api/patient-measures/export/route.ts |
| /api/patient-measures/export | GET | patient |  | 1 | apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts |
| /api/patient-measures/export | GET | patient |  | 1 | legacy/code/app/api/patient-measures/export/route.ts |
| /api/patient-measures/history | GET | patient |  | 1 | apps/rhythm-legacy/app/api/patient-measures/history/route.ts |
| /api/patient-measures/history | GET | patient |  | 1 | apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts |
| /api/patient-measures/history | GET | patient |  | 1 | legacy/code/app/api/patient-measures/history/route.ts |
| /api/patient-profiles | GET | patient |  | 2 | apps/rhythm-legacy/app/api/patient-profiles/route.ts |
| /api/patient-profiles | GET | patient |  | 2 | apps/rhythm-studio-ui/app/api/patient-profiles/route.ts |
| /api/patient-profiles | GET | patient |  | 2 | legacy/code/app/api/patient-profiles/route.ts |
| /api/patient/assessments | GET | patient |  | 1 | apps/rhythm-patient-ui/app/api/patient/assessments/route.ts |
| /api/patient/assessments-with-results | GET | patient |  | 3 | apps/rhythm-patient-ui/app/api/patient/assessments-with-results/route.ts |
| /api/patient/assessments-with-results | GET | patient |  | 3 | apps/rhythm-studio-ui/app/api/patient/assessments-with-results/route.ts |
| /api/patient/dashboard | GET | patient |  | 0 | apps/rhythm-legacy/app/api/patient/dashboard/route.ts |
| /api/patient/dashboard | GET | patient |  | 0 | apps/rhythm-patient-ui/app/api/patient/dashboard/route.ts |
| /api/patient/dashboard | GET | patient |  | 0 | legacy/code/app/api/patient/dashboard/route.ts |
| /api/patient/design | GET | patient |  | 1 | apps/rhythm-patient-ui/app/api/patient/design/route.ts |
| /api/patient/onboarding-status | GET | patient |  | 4 | apps/rhythm-legacy/app/api/patient/onboarding-status/route.ts |
| /api/patient/onboarding-status | GET | patient |  | 4 | apps/rhythm-patient-ui/app/api/patient/onboarding-status/route.ts |
| /api/patient/onboarding-status | GET | patient |  | 4 | legacy/code/app/api/patient/onboarding-status/route.ts |
| /api/patient/reports/latest | GET | patient |  | 0 | apps/rhythm-patient-ui/app/api/patient/reports/latest/route.ts |
| /api/patient/state | GET, POST | patient |  | 3 | apps/rhythm-patient-ui/app/api/patient/state/route.ts |
| /api/patient/triage | POST | patient |  | 0 | apps/rhythm-legacy/app/api/patient/triage/route.ts |
| /api/patient/triage | POST | patient |  | 0 | legacy/code/app/api/patient/triage/route.ts |
| /api/pre-screening-calls | GET, POST | clinician |  | 1 | apps/rhythm-legacy/app/api/pre-screening-calls/route.ts |
| /api/pre-screening-calls | GET, POST | clinician |  | 1 | apps/rhythm-studio-ui/app/api/pre-screening-calls/route.ts |
| /api/pre-screening-calls | GET, POST | clinician |  | 1 | legacy/code/app/api/pre-screening-calls/route.ts |
| /api/processing/content | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/content/route.ts |
| /api/processing/content | POST | system |  | 0 | legacy/code/app/api/processing/content/route.ts |
| /api/processing/delivery | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/delivery/route.ts |
| /api/processing/delivery | POST | system |  | 0 | legacy/code/app/api/processing/delivery/route.ts |
| /api/processing/jobs/[jobId] | GET | system |  | 0 | apps/rhythm-legacy/app/api/processing/jobs/[jobId]/route.ts |
| /api/processing/jobs/[jobId] | GET | system |  | 0 | legacy/code/app/api/processing/jobs/[jobId]/route.ts |
| /api/processing/jobs/[jobId]/download | GET | system |  | 1 | apps/rhythm-legacy/app/api/processing/jobs/[jobId]/download/route.ts |
| /api/processing/jobs/[jobId]/download | GET | system |  | 1 | apps/rhythm-studio-ui/app/api/processing/jobs/[jobId]/download/route.ts |
| /api/processing/jobs/[jobId]/download | GET | system |  | 1 | legacy/code/app/api/processing/jobs/[jobId]/download/route.ts |
| /api/processing/pdf | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/pdf/route.ts |
| /api/processing/pdf | POST | system |  | 0 | legacy/code/app/api/processing/pdf/route.ts |
| /api/processing/ranking | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/ranking/route.ts |
| /api/processing/ranking | POST | system |  | 0 | legacy/code/app/api/processing/ranking/route.ts |
| /api/processing/results | POST | system |  | 1 | apps/rhythm-legacy/app/api/processing/results/route.ts |
| /api/processing/results | POST | system |  | 1 | legacy/code/app/api/processing/results/route.ts |
| /api/processing/risk | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/risk/route.ts |
| /api/processing/risk | POST | system |  | 0 | legacy/code/app/api/processing/risk/route.ts |
| /api/processing/safety | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/safety/route.ts |
| /api/processing/safety | POST | system |  | 0 | legacy/code/app/api/processing/safety/route.ts |
| /api/processing/start | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/start/route.ts |
| /api/processing/start | POST | system |  | 0 | legacy/code/app/api/processing/start/route.ts |
| /api/processing/validation | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/validation/route.ts |
| /api/processing/validation | POST | system |  | 0 | legacy/code/app/api/processing/validation/route.ts |
| /api/reports/[reportId]/pdf | GET | clinician |  | 0 | apps/rhythm-legacy/app/api/reports/[reportId]/pdf/route.ts |
| /api/reports/[reportId]/pdf | GET | clinician |  | 0 | legacy/code/app/api/reports/[reportId]/pdf/route.ts |
| /api/review/[id] | GET | clinician |  | 1 | apps/rhythm-legacy/app/api/review/[id]/route.ts |
| /api/review/[id] | GET | clinician |  | 1 | legacy/code/app/api/review/[id]/route.ts |
| /api/review/[id]/decide | POST | clinician |  | 2 | apps/rhythm-legacy/app/api/review/[id]/decide/route.ts |
| /api/review/[id]/decide | POST | clinician |  | 2 | apps/rhythm-studio-ui/app/api/review/[id]/decide/route.ts |
| /api/review/[id]/decide | POST | clinician |  | 2 | legacy/code/app/api/review/[id]/decide/route.ts |
| /api/review/[id]/details | GET | clinician |  | 1 | apps/rhythm-legacy/app/api/review/[id]/details/route.ts |
| /api/review/[id]/details | GET | clinician |  | 1 | apps/rhythm-studio-ui/app/api/review/[id]/details/route.ts |
| /api/review/[id]/details | GET | clinician |  | 1 | legacy/code/app/api/review/[id]/details/route.ts |
| /api/review/queue | GET | clinician |  | 0 | apps/rhythm-legacy/app/api/review/queue/route.ts |
| /api/review/queue | GET | clinician |  | 0 | apps/rhythm-studio-ui/app/api/review/queue/route.ts |
| /api/review/queue | GET | clinician |  | 0 | legacy/code/app/api/review/queue/route.ts |
| /api/shipments | GET, POST | clinician |  | 2 | apps/rhythm-legacy/app/api/shipments/route.ts |
| /api/shipments | GET, POST | clinician |  | 2 | apps/rhythm-studio-ui/app/api/shipments/route.ts |
| /api/shipments | GET, POST | clinician |  | 2 | legacy/code/app/api/shipments/route.ts |
| /api/shipments/[id] | GET, PATCH | clinician |  | 1 | apps/rhythm-legacy/app/api/shipments/[id]/route.ts |
| /api/shipments/[id] | GET, PATCH | clinician |  | 1 | apps/rhythm-studio-ui/app/api/shipments/[id]/route.ts |
| /api/shipments/[id] | GET, PATCH | clinician |  | 1 | legacy/code/app/api/shipments/[id]/route.ts |
| /api/shipments/[id]/events | GET, POST | clinician |  | 0 | apps/rhythm-legacy/app/api/shipments/[id]/events/route.ts |
| /api/shipments/[id]/events | GET, POST | clinician |  | 0 | legacy/code/app/api/shipments/[id]/events/route.ts |
| /api/support-cases | GET, POST | clinician |  | 1 | apps/rhythm-legacy/app/api/support-cases/route.ts |
| /api/support-cases | GET, POST | clinician |  | 1 | apps/rhythm-studio-ui/app/api/support-cases/route.ts |
| /api/support-cases | GET, POST | clinician |  | 1 | legacy/code/app/api/support-cases/route.ts |
| /api/support-cases/[id] | DELETE, GET, PATCH | clinician |  | 1 | apps/rhythm-legacy/app/api/support-cases/[id]/route.ts |
| /api/support-cases/[id] | DELETE, GET, PATCH | clinician |  | 1 | apps/rhythm-studio-ui/app/api/support-cases/[id]/route.ts |
| /api/support-cases/[id] | DELETE, GET, PATCH | clinician |  | 1 | legacy/code/app/api/support-cases/[id]/route.ts |
| /api/support-cases/[id]/escalate | POST | clinician |  | 1 | apps/rhythm-legacy/app/api/support-cases/[id]/escalate/route.ts |
| /api/support-cases/[id]/escalate | POST | clinician |  | 1 | apps/rhythm-studio-ui/app/api/support-cases/[id]/escalate/route.ts |
| /api/support-cases/[id]/escalate | POST | clinician |  | 1 | legacy/code/app/api/support-cases/[id]/escalate/route.ts |
| /api/tasks | GET, POST | clinician |  | 12 | apps/rhythm-legacy/app/api/tasks/route.ts |
| /api/tasks | GET, POST | clinician |  | 12 | apps/rhythm-studio-ui/app/api/tasks/route.ts |
| /api/tasks | GET, POST | clinician |  | 12 | legacy/code/app/api/tasks/route.ts |
| /api/tasks/[id] | PATCH | clinician |  | 13 | apps/rhythm-legacy/app/api/tasks/[id]/route.ts |
| /api/tasks/[id] | PATCH | clinician |  | 13 | apps/rhythm-studio-ui/app/api/tasks/[id]/route.ts |
| /api/tasks/[id] | PATCH | clinician |  | 13 | legacy/code/app/api/tasks/[id]/route.ts |
| /api/test/correlation-id | GET | system |  | 0 | apps/rhythm-legacy/app/api/test/correlation-id/route.ts |
| /api/test/correlation-id | GET | system |  | 0 | legacy/code/app/api/test/correlation-id/route.ts |
