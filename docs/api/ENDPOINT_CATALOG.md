# Endpoint Catalog

Deterministic inventory of Next API routes and in-repo callsites.

| Path | Methods | Access | Intent | Used by | Route file |
| --- | --- | --- | --- | ---: | --- |
| /api/account/deletion-request | POST | patient |  | 0 | app/api/account/deletion-request/route.ts |
| /api/admin/content-pages | GET, POST | admin |  | 0 | app/api/admin/content-pages/route.ts |
| /api/admin/content-pages/[id] | DELETE, GET, PATCH | admin |  | 0 | app/api/admin/content-pages/[id]/route.ts |
| /api/admin/content-pages/[id]/sections | GET, POST | admin |  | 2 | app/api/admin/content-pages/[id]/sections/route.ts |
| /api/admin/content-pages/[id]/sections/[sectionId] | DELETE, PATCH | admin |  | 6 | app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts |
| /api/admin/design-tokens | GET, POST | admin |  | 0 | app/api/admin/design-tokens/route.ts |
| /api/admin/dev/endpoint-catalog | GET | admin |  | 0 | app/api/admin/dev/endpoint-catalog/route.ts |
| /api/admin/diagnostics/pillars-sot | GET | admin |  | 0 | app/api/admin/diagnostics/pillars-sot/route.ts |
| /api/admin/funnel-step-questions/[id] | PATCH | admin |  | 0 | app/api/admin/funnel-step-questions/[id]/route.ts |
| /api/admin/funnel-steps | POST | admin |  | 0 | app/api/admin/funnel-steps/route.ts |
| /api/admin/funnel-steps/[id] | PATCH | admin |  | 0 | app/api/admin/funnel-steps/[id]/route.ts |
| /api/admin/funnel-versions/[id] | PATCH | admin |  | 5 | app/api/admin/funnel-versions/[id]/route.ts |
| /api/admin/funnel-versions/[id]/manifest | GET, PUT | admin |  | 0 | app/api/admin/funnel-versions/[id]/manifest/route.ts |
| /api/admin/funnels | GET | admin |  | 12 | app/api/admin/funnels/route.ts |
| /api/admin/funnels/[id] | GET, PATCH | admin |  | 7 | app/api/admin/funnels/[id]/route.ts |
| /api/admin/kpi-thresholds | GET, POST | admin |  | 0 | app/api/admin/kpi-thresholds/route.ts |
| /api/admin/kpi-thresholds/[id] | DELETE, PUT | admin |  | 0 | app/api/admin/kpi-thresholds/[id]/route.ts |
| /api/admin/navigation | GET | admin |  | 0 | app/api/admin/navigation/route.ts |
| /api/admin/navigation/[role] | PUT | admin |  | 0 | app/api/admin/navigation/[role]/route.ts |
| /api/admin/notification-templates | GET, POST | admin |  | 0 | app/api/admin/notification-templates/route.ts |
| /api/admin/notification-templates/[id] | DELETE, PUT | admin |  | 0 | app/api/admin/notification-templates/[id]/route.ts |
| /api/admin/operational-settings-audit | GET | admin |  | 0 | app/api/admin/operational-settings-audit/route.ts |
| /api/admin/pilot/flow-events | GET | admin |  | 0 | app/api/admin/pilot/flow-events/route.ts |
| /api/admin/pilot/kpis | GET | admin |  | 0 | app/api/admin/pilot/kpis/route.ts |
| /api/admin/reassessment-rules | GET, POST | admin |  | 0 | app/api/admin/reassessment-rules/route.ts |
| /api/admin/reassessment-rules/[id] | DELETE, PUT | admin |  | 0 | app/api/admin/reassessment-rules/[id]/route.ts |
| /api/admin/usage | GET | admin |  | 0 | app/api/admin/usage/route.ts |
| /api/amy/stress-report | POST | system |  | 0 | app/api/amy/stress-report/route.ts |
| /api/amy/stress-summary | POST | system |  | 0 | app/api/amy/stress-summary/route.ts |
| /api/amy/triage | POST | system |  | 0 | app/api/amy/triage/route.ts |
| /api/assessment-answers/save | POST | patient |  | 1 | app/api/assessment-answers/save/route.ts |
| /api/assessment-validation/validate-step | POST | patient |  | 1 | app/api/assessment-validation/validate-step/route.ts |
| /api/assessments/[id]/current-step | GET | patient |  | 0 | app/api/assessments/[id]/current-step/route.ts |
| /api/assessments/[id]/navigation | GET | patient |  | 0 | app/api/assessments/[id]/navigation/route.ts |
| /api/assessments/[id]/resume | GET | patient |  | 1 | app/api/assessments/[id]/resume/route.ts |
| /api/assessments/in-progress | GET | patient |  | 0 | app/api/assessments/in-progress/route.ts |
| /api/auth/callback | POST | public |  | 2 | app/api/auth/callback/route.ts |
| /api/auth/resolve-role | GET | public |  | 1 | app/api/auth/resolve-role/route.ts |
| /api/consent/record | POST | patient |  | 0 | app/api/consent/record/route.ts |
| /api/consent/status | GET | patient |  | 0 | app/api/consent/status/route.ts |
| /api/content-pages/[slug] | GET | patient |  | 1 | app/api/content-pages/[slug]/route.ts |
| /api/content-resolver | GET | patient |  | 0 | app/api/content-resolver/route.ts |
| /api/content/resolve | GET | patient |  | 0 | app/api/content/resolve/route.ts |
| /api/documents/[id]/extract | POST | system |  | 0 | app/api/documents/[id]/extract/route.ts |
| /api/documents/[id]/status | PATCH | system |  | 0 | app/api/documents/[id]/status/route.ts |
| /api/documents/upload | POST | system |  | 0 | app/api/documents/upload/route.ts |
| /api/escalation/log-click | POST | patient |  | 0 | app/api/escalation/log-click/route.ts |
| /api/funnels/[slug]/assessments | POST | patient |  | 10 | app/api/funnels/[slug]/assessments/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId] | GET | patient |  | 7 | app/api/funnels/[slug]/assessments/[assessmentId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/answers/save | POST | patient |  | 6 | app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/complete | POST | patient |  | 2 | app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/result | GET | patient |  | 3 | app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | POST | patient |  | 3 | app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/workup | POST | patient |  | 0 | app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts |
| /api/funnels/[slug]/content-pages | GET | patient |  | 0 | app/api/funnels/[slug]/content-pages/route.ts |
| /api/funnels/[slug]/definition | GET | patient |  | 3 | app/api/funnels/[slug]/definition/route.ts |
| /api/funnels/active | GET | patient |  | 0 | app/api/funnels/active/route.ts |
| /api/funnels/catalog | GET | patient |  | 17 | app/api/funnels/catalog/route.ts |
| /api/funnels/catalog/[slug] | GET | patient |  | 6 | app/api/funnels/catalog/[slug]/route.ts |
| /api/health/env | GET | public |  | 0 | app/api/health/env/route.ts |
| /api/notifications | GET | patient |  | 0 | app/api/notifications/route.ts |
| /api/notifications/[id] | PATCH | patient |  | 0 | app/api/notifications/[id]/route.ts |
| /api/patient-measures/export | GET | patient |  | 0 | app/api/patient-measures/export/route.ts |
| /api/patient-measures/history | GET | patient |  | 0 | app/api/patient-measures/history/route.ts |
| /api/patient-profiles | GET | patient |  | 0 | app/api/patient-profiles/route.ts |
| /api/patient/dashboard | GET | patient |  | 0 | app/api/patient/dashboard/route.ts |
| /api/patient/onboarding-status | GET | patient |  | 1 | app/api/patient/onboarding-status/route.ts |
| /api/patient/triage | POST | patient |  | 0 | app/api/patient/triage/route.ts |
| /api/pre-screening-calls | GET, POST | clinician |  | 0 | app/api/pre-screening-calls/route.ts |
| /api/processing/content | POST | system |  | 0 | app/api/processing/content/route.ts |
| /api/processing/delivery | POST | system |  | 0 | app/api/processing/delivery/route.ts |
| /api/processing/jobs/[jobId] | GET | system |  | 0 | app/api/processing/jobs/[jobId]/route.ts |
| /api/processing/jobs/[jobId]/download | GET | system |  | 0 | app/api/processing/jobs/[jobId]/download/route.ts |
| /api/processing/pdf | POST | system |  | 0 | app/api/processing/pdf/route.ts |
| /api/processing/ranking | POST | system |  | 0 | app/api/processing/ranking/route.ts |
| /api/processing/risk | POST | system |  | 0 | app/api/processing/risk/route.ts |
| /api/processing/safety | POST | system |  | 0 | app/api/processing/safety/route.ts |
| /api/processing/start | POST | system |  | 0 | app/api/processing/start/route.ts |
| /api/processing/validation | POST | system |  | 0 | app/api/processing/validation/route.ts |
| /api/reports/[reportId]/pdf | GET | clinician |  | 0 | app/api/reports/[reportId]/pdf/route.ts |
| /api/review/[id] | GET | clinician |  | 0 | app/api/review/[id]/route.ts |
| /api/review/[id]/decide | POST | clinician |  | 0 | app/api/review/[id]/decide/route.ts |
| /api/review/[id]/details | GET | clinician |  | 0 | app/api/review/[id]/details/route.ts |
| /api/review/queue | GET | clinician |  | 0 | app/api/review/queue/route.ts |
| /api/shipments | GET, POST | clinician |  | 0 | app/api/shipments/route.ts |
| /api/shipments/[id] | GET, PATCH | clinician |  | 0 | app/api/shipments/[id]/route.ts |
| /api/shipments/[id]/events | GET, POST | clinician |  | 0 | app/api/shipments/[id]/events/route.ts |
| /api/support-cases | GET, POST | clinician |  | 0 | app/api/support-cases/route.ts |
| /api/support-cases/[id] | DELETE, GET, PATCH | clinician |  | 0 | app/api/support-cases/[id]/route.ts |
| /api/support-cases/[id]/escalate | POST | clinician |  | 0 | app/api/support-cases/[id]/escalate/route.ts |
| /api/tasks | GET, POST | clinician |  | 5 | app/api/tasks/route.ts |
| /api/tasks/[id] | PATCH | clinician |  | 6 | app/api/tasks/[id]/route.ts |
| /api/test/correlation-id | GET | system |  | 0 | app/api/test/correlation-id/route.ts |
