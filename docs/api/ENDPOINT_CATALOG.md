# Endpoint Catalog

Deterministic inventory of Next API routes and in-repo callsites.

| Path | Methods | Access | Intent | Used by | Route file |
| --- | --- | --- | --- | ---: | --- |
| /api/account/deletion-request | POST | patient |  | 0 | apps/rhythm-legacy/app/api/account/deletion-request/route.ts |
| /api/admin/content-pages | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/content-pages/route.ts |
| /api/admin/content-pages | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/content-pages/route.js |
| /api/admin/content-pages | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/content-pages/route.ts |
| /api/admin/content-pages/[id] | DELETE, GET, PATCH | admin |  | 1 | apps/rhythm-legacy/app/api/admin/content-pages/[id]/route.ts |
| /api/admin/content-pages/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/content-pages/[id]/route.js |
| /api/admin/content-pages/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/content-pages/[id]/route.ts |
| /api/admin/content-pages/[id]/sections | GET, POST | admin |  | 2 | apps/rhythm-legacy/app/api/admin/content-pages/[id]/sections/route.ts |
| /api/admin/content-pages/[id]/sections | (none) | admin |  | 2 | apps/rhythm-studio-ui/.next/server/app/api/admin/content-pages/[id]/sections/route.js |
| /api/admin/content-pages/[id]/sections | (none) | admin |  | 2 | apps/rhythm-studio-ui/app/api/admin/content-pages/[id]/sections/route.ts |
| /api/admin/content-pages/[id]/sections/[sectionId] | DELETE, PATCH | admin |  | 6 | apps/rhythm-legacy/app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts |
| /api/admin/content-pages/[id]/sections/[sectionId] | (none) | admin |  | 6 | apps/rhythm-studio-ui/.next/server/app/api/admin/content-pages/[id]/sections/[sectionId]/route.js |
| /api/admin/content-pages/[id]/sections/[sectionId] | (none) | admin |  | 6 | apps/rhythm-studio-ui/app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts |
| /api/admin/design-tokens | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/design-tokens/route.ts |
| /api/admin/design-tokens | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/design-tokens/route.js |
| /api/admin/design-tokens | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/design-tokens/route.ts |
| /api/admin/dev/endpoint-catalog | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/dev/endpoint-catalog/route.ts |
| /api/admin/dev/endpoint-catalog | (none) | admin |  | 0 | apps/rhythm-studio-ui/.next/server/app/api/admin/dev/endpoint-catalog/route.js |
| /api/admin/dev/endpoint-catalog | (none) | admin |  | 0 | apps/rhythm-studio-ui/app/api/admin/dev/endpoint-catalog/route.ts |
| /api/admin/diagnostics/pillars-sot | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/diagnostics/pillars-sot/route.ts |
| /api/admin/funnel-step-questions/[id] | PATCH | admin |  | 1 | apps/rhythm-legacy/app/api/admin/funnel-step-questions/[id]/route.ts |
| /api/admin/funnel-step-questions/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/funnel-step-questions/[id]/route.js |
| /api/admin/funnel-step-questions/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/funnel-step-questions/[id]/route.ts |
| /api/admin/funnel-steps | POST | admin |  | 0 | apps/rhythm-legacy/app/api/admin/funnel-steps/route.ts |
| /api/admin/funnel-steps/[id] | PATCH | admin |  | 3 | apps/rhythm-legacy/app/api/admin/funnel-steps/[id]/route.ts |
| /api/admin/funnel-steps/[id] | (none) | admin |  | 3 | apps/rhythm-studio-ui/.next/server/app/api/admin/funnel-steps/[id]/route.js |
| /api/admin/funnel-steps/[id] | (none) | admin |  | 3 | apps/rhythm-studio-ui/app/api/admin/funnel-steps/[id]/route.ts |
| /api/admin/funnel-versions/[id] | PATCH | admin |  | 8 | apps/rhythm-legacy/app/api/admin/funnel-versions/[id]/route.ts |
| /api/admin/funnel-versions/[id] | (none) | admin |  | 8 | apps/rhythm-studio-ui/.next/server/app/api/admin/funnel-versions/[id]/route.js |
| /api/admin/funnel-versions/[id] | (none) | admin |  | 8 | apps/rhythm-studio-ui/app/api/admin/funnel-versions/[id]/route.ts |
| /api/admin/funnel-versions/[id]/manifest | GET, PUT | admin |  | 2 | apps/rhythm-legacy/app/api/admin/funnel-versions/[id]/manifest/route.ts |
| /api/admin/funnel-versions/[id]/manifest | (none) | admin |  | 2 | apps/rhythm-studio-ui/.next/server/app/api/admin/funnel-versions/[id]/manifest/route.js |
| /api/admin/funnel-versions/[id]/manifest | (none) | admin |  | 2 | apps/rhythm-studio-ui/app/api/admin/funnel-versions/[id]/manifest/route.ts |
| /api/admin/funnels | GET | admin |  | 13 | apps/rhythm-legacy/app/api/admin/funnels/route.ts |
| /api/admin/funnels | (none) | admin |  | 13 | apps/rhythm-studio-ui/.next/server/app/api/admin/funnels/route.js |
| /api/admin/funnels | (none) | admin |  | 13 | apps/rhythm-studio-ui/app/api/admin/funnels/route.ts |
| /api/admin/funnels/[id] | GET, PATCH | admin |  | 11 | apps/rhythm-legacy/app/api/admin/funnels/[id]/route.ts |
| /api/admin/funnels/[id] | (none) | admin |  | 11 | apps/rhythm-studio-ui/.next/server/app/api/admin/funnels/[id]/route.js |
| /api/admin/funnels/[id] | (none) | admin |  | 11 | apps/rhythm-studio-ui/app/api/admin/funnels/[id]/route.ts |
| /api/admin/kpi-thresholds | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/kpi-thresholds/route.ts |
| /api/admin/kpi-thresholds | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/kpi-thresholds/route.js |
| /api/admin/kpi-thresholds | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/kpi-thresholds/route.ts |
| /api/admin/kpi-thresholds/[id] | DELETE, PUT | admin |  | 1 | apps/rhythm-legacy/app/api/admin/kpi-thresholds/[id]/route.ts |
| /api/admin/kpi-thresholds/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/kpi-thresholds/[id]/route.js |
| /api/admin/kpi-thresholds/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/kpi-thresholds/[id]/route.ts |
| /api/admin/navigation | GET | admin |  | 2 | apps/rhythm-legacy/app/api/admin/navigation/route.ts |
| /api/admin/navigation | (none) | admin |  | 2 | apps/rhythm-patient-ui/app/api/admin/navigation/route.ts |
| /api/admin/navigation | (none) | admin |  | 2 | apps/rhythm-studio-ui/.next/server/app/api/admin/navigation/route.js |
| /api/admin/navigation | (none) | admin |  | 2 | apps/rhythm-studio-ui/app/api/admin/navigation/route.ts |
| /api/admin/navigation/[role] | PUT | admin |  | 1 | apps/rhythm-legacy/app/api/admin/navigation/[role]/route.ts |
| /api/admin/navigation/[role] | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/navigation/[role]/route.js |
| /api/admin/navigation/[role] | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/navigation/[role]/route.ts |
| /api/admin/notification-templates | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/notification-templates/route.ts |
| /api/admin/notification-templates | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/notification-templates/route.js |
| /api/admin/notification-templates | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/notification-templates/route.ts |
| /api/admin/notification-templates/[id] | DELETE, PUT | admin |  | 1 | apps/rhythm-legacy/app/api/admin/notification-templates/[id]/route.ts |
| /api/admin/notification-templates/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/notification-templates/[id]/route.js |
| /api/admin/notification-templates/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/notification-templates/[id]/route.ts |
| /api/admin/operational-settings-audit | GET | admin |  | 1 | apps/rhythm-legacy/app/api/admin/operational-settings-audit/route.ts |
| /api/admin/operational-settings-audit | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/operational-settings-audit/route.js |
| /api/admin/operational-settings-audit | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/operational-settings-audit/route.ts |
| /api/admin/pilot/flow-events | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/pilot/flow-events/route.ts |
| /api/admin/pilot/kpis | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/pilot/kpis/route.ts |
| /api/admin/reassessment-rules | GET, POST | admin |  | 1 | apps/rhythm-legacy/app/api/admin/reassessment-rules/route.ts |
| /api/admin/reassessment-rules | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/reassessment-rules/route.js |
| /api/admin/reassessment-rules | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/reassessment-rules/route.ts |
| /api/admin/reassessment-rules/[id] | DELETE, PUT | admin |  | 1 | apps/rhythm-legacy/app/api/admin/reassessment-rules/[id]/route.ts |
| /api/admin/reassessment-rules/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/admin/reassessment-rules/[id]/route.js |
| /api/admin/reassessment-rules/[id] | (none) | admin |  | 1 | apps/rhythm-studio-ui/app/api/admin/reassessment-rules/[id]/route.ts |
| /api/admin/usage | GET | admin |  | 0 | apps/rhythm-legacy/app/api/admin/usage/route.ts |
| /api/amy/stress-report | POST | system |  | 0 | apps/rhythm-legacy/app/api/amy/stress-report/route.ts |
| /api/amy/stress-summary | POST | system |  | 0 | apps/rhythm-legacy/app/api/amy/stress-summary/route.ts |
| /api/amy/triage | POST | system |  | 1 | apps/rhythm-legacy/app/api/amy/triage/route.ts |
| /api/amy/triage | (none) | system |  | 1 | apps/rhythm-patient-ui/app/api/amy/triage/route.ts |
| /api/assessment-answers/save | POST | patient |  | 1 | apps/rhythm-legacy/app/api/assessment-answers/save/route.ts |
| /api/assessment-validation/validate-step | POST | patient |  | 1 | apps/rhythm-legacy/app/api/assessment-validation/validate-step/route.ts |
| /api/assessments/[id]/current-step | GET | patient |  | 0 | apps/rhythm-legacy/app/api/assessments/[id]/current-step/route.ts |
| /api/assessments/[id]/navigation | GET | patient |  | 0 | apps/rhythm-legacy/app/api/assessments/[id]/navigation/route.ts |
| /api/assessments/[id]/resume | GET | patient |  | 1 | apps/rhythm-legacy/app/api/assessments/[id]/resume/route.ts |
| /api/assessments/[id]/state | GET | patient |  | 1 | apps/rhythm-legacy/app/api/assessments/[id]/state/route.ts |
| /api/assessments/in-progress | GET | patient |  | 0 | apps/rhythm-legacy/app/api/assessments/in-progress/route.ts |
| /api/auth/callback | POST | public |  | 8 | apps/rhythm-legacy/app/api/auth/callback/route.ts |
| /api/auth/callback | (none) | public |  | 8 | apps/rhythm-patient-ui/app/api/auth/callback/route.ts |
| /api/auth/callback | (none) | public |  | 8 | apps/rhythm-studio-ui/.next/server/app/api/auth/callback/route.js |
| /api/auth/callback | POST | public |  | 8 | apps/rhythm-studio-ui/app/api/auth/callback/route.ts |
| /api/auth/debug | (none) | public |  | 0 | apps/rhythm-studio-ui/.next/server/app/api/auth/debug/route.js |
| /api/auth/debug | GET | public |  | 0 | apps/rhythm-studio-ui/app/api/auth/debug/route.ts |
| /api/auth/debug-cookie | (none) | public |  | 0 | apps/rhythm-studio-ui/.next/server/app/api/auth/debug-cookie/route.js |
| /api/auth/debug-cookie | GET | public |  | 0 | apps/rhythm-studio-ui/app/api/auth/debug-cookie/route.ts |
| /api/auth/resolve-role | GET | public |  | 4 | apps/rhythm-legacy/app/api/auth/resolve-role/route.ts |
| /api/auth/resolve-role | (none) | public |  | 4 | apps/rhythm-patient-ui/app/api/auth/resolve-role/route.ts |
| /api/auth/resolve-role | (none) | public |  | 4 | apps/rhythm-studio-ui/.next/server/app/api/auth/resolve-role/route.js |
| /api/auth/resolve-role | GET | public |  | 4 | apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts |
| /api/auth/signout | GET, POST | public |  | 4 | apps/rhythm-legacy/app/api/auth/signout/route.ts |
| /api/auth/signout | (none) | public |  | 4 | apps/rhythm-patient-ui/app/api/auth/signout/route.ts |
| /api/auth/signout | (none) | public |  | 4 | apps/rhythm-studio-ui/.next/server/app/api/auth/signout/route.js |
| /api/auth/signout | GET, POST | public |  | 4 | apps/rhythm-studio-ui/app/api/auth/signout/route.ts |
| /api/consent/record | POST | patient |  | 0 | apps/rhythm-legacy/app/api/consent/record/route.ts |
| /api/consent/status | GET | patient |  | 0 | apps/rhythm-legacy/app/api/consent/status/route.ts |
| /api/content-pages/[slug] | GET | patient |  | 1 | apps/rhythm-legacy/app/api/content-pages/[slug]/route.ts |
| /api/content-resolver | GET | patient |  | 0 | apps/rhythm-legacy/app/api/content-resolver/route.ts |
| /api/content/resolve | GET | patient |  | 0 | apps/rhythm-legacy/app/api/content/resolve/route.ts |
| /api/documents/[id]/extract | POST | system |  | 0 | apps/rhythm-legacy/app/api/documents/[id]/extract/route.ts |
| /api/documents/[id]/status | PATCH | system |  | 0 | apps/rhythm-legacy/app/api/documents/[id]/status/route.ts |
| /api/documents/upload | POST | system |  | 0 | apps/rhythm-legacy/app/api/documents/upload/route.ts |
| /api/escalation/log-click | POST | patient |  | 0 | apps/rhythm-legacy/app/api/escalation/log-click/route.ts |
| /api/funnels/[slug]/assessments | POST | patient |  | 10 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId] | GET | patient |  | 7 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/answers/save | POST | patient |  | 6 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/complete | POST | patient |  | 2 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/result | GET | patient |  | 3 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | POST | patient |  | 3 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/workup | POST | patient |  | 0 | apps/rhythm-legacy/app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts |
| /api/funnels/[slug]/content-pages | GET | patient |  | 0 | apps/rhythm-legacy/app/api/funnels/[slug]/content-pages/route.ts |
| /api/funnels/[slug]/definition | GET | patient |  | 3 | apps/rhythm-legacy/app/api/funnels/[slug]/definition/route.ts |
| /api/funnels/active | GET | patient |  | 0 | apps/rhythm-legacy/app/api/funnels/active/route.ts |
| /api/funnels/catalog | GET | patient |  | 18 | apps/rhythm-legacy/app/api/funnels/catalog/route.ts |
| /api/funnels/catalog | (none) | patient |  | 18 | apps/rhythm-patient-ui/app/api/funnels/catalog/route.ts |
| /api/funnels/catalog/[slug] | GET | patient |  | 6 | apps/rhythm-legacy/app/api/funnels/catalog/[slug]/route.ts |
| /api/health/env | GET | public |  | 0 | apps/rhythm-legacy/app/api/health/env/route.ts |
| /api/notifications | GET | patient |  | 0 | apps/rhythm-legacy/app/api/notifications/route.ts |
| /api/notifications/[id] | PATCH | patient |  | 0 | apps/rhythm-legacy/app/api/notifications/[id]/route.ts |
| /api/patient-measures/export | GET | patient |  | 1 | apps/rhythm-legacy/app/api/patient-measures/export/route.ts |
| /api/patient-measures/export | (none) | patient |  | 1 | apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts |
| /api/patient-measures/history | GET | patient |  | 1 | apps/rhythm-legacy/app/api/patient-measures/history/route.ts |
| /api/patient-measures/history | (none) | patient |  | 1 | apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts |
| /api/patient-profiles | GET | patient |  | 2 | apps/rhythm-legacy/app/api/patient-profiles/route.ts |
| /api/patient-profiles | (none) | patient |  | 2 | apps/rhythm-studio-ui/.next/server/app/api/patient-profiles/route.js |
| /api/patient-profiles | (none) | patient |  | 2 | apps/rhythm-studio-ui/app/api/patient-profiles/route.ts |
| /api/patient/dashboard | GET | patient |  | 0 | apps/rhythm-legacy/app/api/patient/dashboard/route.ts |
| /api/patient/dashboard | (none) | patient |  | 0 | apps/rhythm-patient-ui/app/api/patient/dashboard/route.ts |
| /api/patient/onboarding-status | GET | patient |  | 2 | apps/rhythm-legacy/app/api/patient/onboarding-status/route.ts |
| /api/patient/onboarding-status | (none) | patient |  | 2 | apps/rhythm-patient-ui/app/api/patient/onboarding-status/route.ts |
| /api/patient/state | GET, POST | patient |  | 0 | apps/rhythm-patient-ui/app/api/patient/state/route.ts |
| /api/patient/triage | POST | patient |  | 0 | apps/rhythm-legacy/app/api/patient/triage/route.ts |
| /api/pre-screening-calls | GET, POST | clinician |  | 1 | apps/rhythm-legacy/app/api/pre-screening-calls/route.ts |
| /api/pre-screening-calls | (none) | clinician |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/pre-screening-calls/route.js |
| /api/pre-screening-calls | (none) | clinician |  | 1 | apps/rhythm-studio-ui/app/api/pre-screening-calls/route.ts |
| /api/processing/content | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/content/route.ts |
| /api/processing/delivery | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/delivery/route.ts |
| /api/processing/jobs/[jobId] | GET | system |  | 0 | apps/rhythm-legacy/app/api/processing/jobs/[jobId]/route.ts |
| /api/processing/jobs/[jobId]/download | GET | system |  | 1 | apps/rhythm-legacy/app/api/processing/jobs/[jobId]/download/route.ts |
| /api/processing/jobs/[jobId]/download | (none) | system |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/processing/jobs/[jobId]/download/route.js |
| /api/processing/jobs/[jobId]/download | (none) | system |  | 1 | apps/rhythm-studio-ui/app/api/processing/jobs/[jobId]/download/route.ts |
| /api/processing/pdf | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/pdf/route.ts |
| /api/processing/ranking | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/ranking/route.ts |
| /api/processing/risk | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/risk/route.ts |
| /api/processing/safety | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/safety/route.ts |
| /api/processing/start | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/start/route.ts |
| /api/processing/validation | POST | system |  | 0 | apps/rhythm-legacy/app/api/processing/validation/route.ts |
| /api/reports/[reportId]/pdf | GET | clinician |  | 0 | apps/rhythm-legacy/app/api/reports/[reportId]/pdf/route.ts |
| /api/review/[id] | GET | clinician |  | 1 | apps/rhythm-legacy/app/api/review/[id]/route.ts |
| /api/review/[id]/decide | POST | clinician |  | 2 | apps/rhythm-legacy/app/api/review/[id]/decide/route.ts |
| /api/review/[id]/decide | (none) | clinician |  | 2 | apps/rhythm-studio-ui/.next/server/app/api/review/[id]/decide/route.js |
| /api/review/[id]/decide | (none) | clinician |  | 2 | apps/rhythm-studio-ui/app/api/review/[id]/decide/route.ts |
| /api/review/[id]/details | GET | clinician |  | 1 | apps/rhythm-legacy/app/api/review/[id]/details/route.ts |
| /api/review/[id]/details | (none) | clinician |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/review/[id]/details/route.js |
| /api/review/[id]/details | (none) | clinician |  | 1 | apps/rhythm-studio-ui/app/api/review/[id]/details/route.ts |
| /api/review/queue | GET | clinician |  | 0 | apps/rhythm-legacy/app/api/review/queue/route.ts |
| /api/review/queue | (none) | clinician |  | 0 | apps/rhythm-studio-ui/.next/server/app/api/review/queue/route.js |
| /api/review/queue | (none) | clinician |  | 0 | apps/rhythm-studio-ui/app/api/review/queue/route.ts |
| /api/shipments | GET, POST | clinician |  | 2 | apps/rhythm-legacy/app/api/shipments/route.ts |
| /api/shipments | (none) | clinician |  | 2 | apps/rhythm-studio-ui/.next/server/app/api/shipments/route.js |
| /api/shipments | (none) | clinician |  | 2 | apps/rhythm-studio-ui/app/api/shipments/route.ts |
| /api/shipments/[id] | GET, PATCH | clinician |  | 1 | apps/rhythm-legacy/app/api/shipments/[id]/route.ts |
| /api/shipments/[id] | (none) | clinician |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/shipments/[id]/route.js |
| /api/shipments/[id] | (none) | clinician |  | 1 | apps/rhythm-studio-ui/app/api/shipments/[id]/route.ts |
| /api/shipments/[id]/events | GET, POST | clinician |  | 0 | apps/rhythm-legacy/app/api/shipments/[id]/events/route.ts |
| /api/support-cases | GET, POST | clinician |  | 1 | apps/rhythm-legacy/app/api/support-cases/route.ts |
| /api/support-cases | (none) | clinician |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/support-cases/route.js |
| /api/support-cases | (none) | clinician |  | 1 | apps/rhythm-studio-ui/app/api/support-cases/route.ts |
| /api/support-cases/[id] | DELETE, GET, PATCH | clinician |  | 1 | apps/rhythm-legacy/app/api/support-cases/[id]/route.ts |
| /api/support-cases/[id] | (none) | clinician |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/support-cases/[id]/route.js |
| /api/support-cases/[id] | (none) | clinician |  | 1 | apps/rhythm-studio-ui/app/api/support-cases/[id]/route.ts |
| /api/support-cases/[id]/escalate | POST | clinician |  | 1 | apps/rhythm-legacy/app/api/support-cases/[id]/escalate/route.ts |
| /api/support-cases/[id]/escalate | (none) | clinician |  | 1 | apps/rhythm-studio-ui/.next/server/app/api/support-cases/[id]/escalate/route.js |
| /api/support-cases/[id]/escalate | (none) | clinician |  | 1 | apps/rhythm-studio-ui/app/api/support-cases/[id]/escalate/route.ts |
| /api/tasks | GET, POST | clinician |  | 7 | apps/rhythm-legacy/app/api/tasks/route.ts |
| /api/tasks | (none) | clinician |  | 7 | apps/rhythm-studio-ui/.next/server/app/api/tasks/route.js |
| /api/tasks | (none) | clinician |  | 7 | apps/rhythm-studio-ui/app/api/tasks/route.ts |
| /api/tasks/[id] | PATCH | clinician |  | 7 | apps/rhythm-legacy/app/api/tasks/[id]/route.ts |
| /api/tasks/[id] | (none) | clinician |  | 7 | apps/rhythm-studio-ui/.next/server/app/api/tasks/[id]/route.js |
| /api/tasks/[id] | (none) | clinician |  | 7 | apps/rhythm-studio-ui/app/api/tasks/[id]/route.ts |
| /api/test/correlation-id | GET | system |  | 0 | apps/rhythm-legacy/app/api/test/correlation-id/route.ts |
