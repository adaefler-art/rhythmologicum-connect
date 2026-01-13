# Endpoint Catalog

Deterministic inventory of Next API routes and in-repo callsites.

| Path | Methods | Access | Intent | Used by | Route file |
| --- | --- | --- | --- | ---: | --- |
| /api/account/deletion-request | POST | unknown |  | 0 | app/api/account/deletion-request/route.ts |
| /api/admin/content-pages | GET, POST | admin |  | 1 | app/api/admin/content-pages/route.ts |
| /api/admin/content-pages/[id] | DELETE, GET, PATCH | admin |  | 1 | app/api/admin/content-pages/[id]/route.ts |
| /api/admin/content-pages/[id]/sections | GET, POST | admin |  | 2 | app/api/admin/content-pages/[id]/sections/route.ts |
| /api/admin/content-pages/[id]/sections/[sectionId] | DELETE, PATCH | admin |  | 6 | app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts |
| /api/admin/design-tokens | GET, POST | admin |  | 1 | app/api/admin/design-tokens/route.ts |
| /api/admin/dev/endpoint-catalog | GET | admin |  | 0 | app/api/admin/dev/endpoint-catalog/route.ts |
| /api/admin/diagnostics/pillars-sot | GET | admin |  | 0 | app/api/admin/diagnostics/pillars-sot/route.ts |
| /api/admin/funnel-step-questions/[id] | PATCH | admin |  | 1 | app/api/admin/funnel-step-questions/[id]/route.ts |
| /api/admin/funnel-steps | POST | admin |  | 0 | app/api/admin/funnel-steps/route.ts |
| /api/admin/funnel-steps/[id] | PATCH | admin |  | 3 | app/api/admin/funnel-steps/[id]/route.ts |
| /api/admin/funnel-versions/[id] | PATCH | admin |  | 8 | app/api/admin/funnel-versions/[id]/route.ts |
| /api/admin/funnel-versions/[id]/manifest | GET, PUT | admin |  | 2 | app/api/admin/funnel-versions/[id]/manifest/route.ts |
| /api/admin/funnels | GET | admin |  | 13 | app/api/admin/funnels/route.ts |
| /api/admin/funnels/[id] | GET, PATCH | admin |  | 11 | app/api/admin/funnels/[id]/route.ts |
| /api/admin/kpi-thresholds | GET, POST | admin |  | 1 | app/api/admin/kpi-thresholds/route.ts |
| /api/admin/kpi-thresholds/[id] | DELETE, PUT | admin |  | 1 | app/api/admin/kpi-thresholds/[id]/route.ts |
| /api/admin/navigation | GET | admin |  | 1 | app/api/admin/navigation/route.ts |
| /api/admin/navigation/[role] | PUT | admin |  | 1 | app/api/admin/navigation/[role]/route.ts |
| /api/admin/notification-templates | GET, POST | admin |  | 1 | app/api/admin/notification-templates/route.ts |
| /api/admin/notification-templates/[id] | DELETE, PUT | admin |  | 1 | app/api/admin/notification-templates/[id]/route.ts |
| /api/admin/operational-settings-audit | GET | admin |  | 1 | app/api/admin/operational-settings-audit/route.ts |
| /api/admin/reassessment-rules | GET, POST | admin |  | 1 | app/api/admin/reassessment-rules/route.ts |
| /api/admin/reassessment-rules/[id] | DELETE, PUT | admin |  | 1 | app/api/admin/reassessment-rules/[id]/route.ts |
| /api/admin/usage | GET | admin |  | 0 | app/api/admin/usage/route.ts |
| /api/amy/stress-report | POST | unknown |  | 0 | app/api/amy/stress-report/route.ts |
| /api/amy/stress-summary | POST | unknown |  | 0 | app/api/amy/stress-summary/route.ts |
| /api/assessment-answers/save | POST | unknown |  | 1 | app/api/assessment-answers/save/route.ts |
| /api/assessment-validation/validate-step | POST | unknown |  | 1 | app/api/assessment-validation/validate-step/route.ts |
| /api/assessments/[id]/current-step | GET | unknown |  | 0 | app/api/assessments/[id]/current-step/route.ts |
| /api/assessments/[id]/navigation | GET | unknown |  | 0 | app/api/assessments/[id]/navigation/route.ts |
| /api/assessments/[id]/resume | GET | unknown |  | 1 | app/api/assessments/[id]/resume/route.ts |
| /api/auth/callback | POST | unknown |  | 2 | app/api/auth/callback/route.ts |
| /api/auth/resolve-role | GET | unknown |  | 3 | app/api/auth/resolve-role/route.ts |
| /api/consent/record | POST | unknown |  | 0 | app/api/consent/record/route.ts |
| /api/consent/status | GET | unknown |  | 0 | app/api/consent/status/route.ts |
| /api/content-pages/[slug] | GET | unknown |  | 2 | app/api/content-pages/[slug]/route.ts |
| /api/content-resolver | GET | unknown |  | 0 | app/api/content-resolver/route.ts |
| /api/content/resolve | GET | unknown |  | 1 | app/api/content/resolve/route.ts |
| /api/documents/[id]/extract | POST | unknown |  | 0 | app/api/documents/[id]/extract/route.ts |
| /api/documents/[id]/status | PATCH | unknown |  | 0 | app/api/documents/[id]/status/route.ts |
| /api/documents/upload | POST | unknown |  | 0 | app/api/documents/upload/route.ts |
| /api/funnels/[slug]/assessments | POST | unknown |  | 1 | app/api/funnels/[slug]/assessments/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId] | GET | unknown |  | 1 | app/api/funnels/[slug]/assessments/[assessmentId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/answers/save | POST | unknown |  | 5 | app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/complete | POST | unknown |  | 1 | app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/result | GET | unknown |  | 1 | app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | POST | unknown |  | 4 | app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts |
| /api/funnels/[slug]/content-pages | GET | unknown |  | 2 | app/api/funnels/[slug]/content-pages/route.ts |
| /api/funnels/[slug]/definition | GET | unknown |  | 5 | app/api/funnels/[slug]/definition/route.ts |
| /api/funnels/active | GET | unknown |  | 1 | app/api/funnels/active/route.ts |
| /api/funnels/catalog | GET | unknown |  | 18 | app/api/funnels/catalog/route.ts |
| /api/funnels/catalog/[slug] | GET | unknown |  | 6 | app/api/funnels/catalog/[slug]/route.ts |
| /api/health/env | GET | unknown |  | 0 | app/api/health/env/route.ts |
| /api/notifications | GET | unknown |  | 0 | app/api/notifications/route.ts |
| /api/notifications/[id] | PATCH | unknown |  | 0 | app/api/notifications/[id]/route.ts |
| /api/patient-measures/export | GET | unknown |  | 1 | app/api/patient-measures/export/route.ts |
| /api/patient-measures/history | GET | unknown |  | 1 | app/api/patient-measures/history/route.ts |
| /api/patient-profiles | GET | unknown |  | 2 | app/api/patient-profiles/route.ts |
| /api/patient/onboarding-status | GET | patient |  | 1 | app/api/patient/onboarding-status/route.ts |
| /api/pre-screening-calls | GET, POST | unknown |  | 1 | app/api/pre-screening-calls/route.ts |
| /api/processing/content | POST | unknown |  | 0 | app/api/processing/content/route.ts |
| /api/processing/delivery | POST | unknown |  | 0 | app/api/processing/delivery/route.ts |
| /api/processing/jobs/[jobId] | GET | unknown |  | 0 | app/api/processing/jobs/[jobId]/route.ts |
| /api/processing/jobs/[jobId]/download | GET | unknown |  | 1 | app/api/processing/jobs/[jobId]/download/route.ts |
| /api/processing/pdf | POST | unknown |  | 0 | app/api/processing/pdf/route.ts |
| /api/processing/ranking | POST | unknown |  | 0 | app/api/processing/ranking/route.ts |
| /api/processing/risk | POST | unknown |  | 0 | app/api/processing/risk/route.ts |
| /api/processing/safety | POST | unknown |  | 0 | app/api/processing/safety/route.ts |
| /api/processing/start | POST | unknown |  | 0 | app/api/processing/start/route.ts |
| /api/processing/validation | POST | unknown |  | 0 | app/api/processing/validation/route.ts |
| /api/reports/[reportId]/pdf | GET | unknown |  | 0 | app/api/reports/[reportId]/pdf/route.ts |
| /api/review/[id] | GET | unknown |  | 1 | app/api/review/[id]/route.ts |
| /api/review/[id]/decide | POST | unknown |  | 2 | app/api/review/[id]/decide/route.ts |
| /api/review/[id]/details | GET | unknown |  | 1 | app/api/review/[id]/details/route.ts |
| /api/review/queue | GET | unknown |  | 0 | app/api/review/queue/route.ts |
| /api/shipments | GET, POST | unknown |  | 2 | app/api/shipments/route.ts |
| /api/shipments/[id] | GET, PATCH | unknown |  | 1 | app/api/shipments/[id]/route.ts |
| /api/shipments/[id]/events | GET, POST | unknown |  | 0 | app/api/shipments/[id]/events/route.ts |
| /api/support-cases | GET, POST | unknown |  | 3 | app/api/support-cases/route.ts |
| /api/support-cases/[id] | DELETE, GET, PATCH | unknown |  | 1 | app/api/support-cases/[id]/route.ts |
| /api/support-cases/[id]/escalate | POST | unknown |  | 1 | app/api/support-cases/[id]/escalate/route.ts |
| /api/tasks | GET, POST | unknown |  | 7 | app/api/tasks/route.ts |
| /api/tasks/[id] | PATCH | unknown |  | 7 | app/api/tasks/[id]/route.ts |
