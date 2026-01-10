# Endpoint Inventory (v0.5)

Generated: 2026-01-10T14:05:14

Evidence commands:
```powershell
Get-ChildItem -Recurse -File app/api -Filter route.ts | % FullName
rg -n "export async function (GET|POST|PUT|PATCH|DELETE)" app/api
```

## Inventory

| Route | Methods | Auth hints | Data source | Response hints | File |
| --- | --- | --- | --- | --- | --- |
| /api/account/deletion-request | POST | supabase.server, auth.getUser |  | json: {success,...} | app/api/account/deletion-request/route.ts |
| /api/admin/content-pages/[id] | GET, PATCH, DELETE | supabase.server, supabase.admin, auth.getUser | db(supabase) | json: {success,...} | app/api/admin/content-pages/[id]/route.ts |
| /api/admin/content-pages/[id]/sections/[sectionId] | PATCH, DELETE | supabase.server, auth.getUser | db(supabase) | json: {success,...} | app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts |
| /api/admin/content-pages/[id]/sections | GET, POST | supabase.server, auth.getUser | db(supabase) |  | app/api/admin/content-pages/[id]/sections/route.ts |
| /api/admin/content-pages | GET, POST | supabase.server, auth.getUser | db(supabase) |  | app/api/admin/content-pages/route.ts |
| /api/admin/design-tokens | GET, POST | supabase.server, hasClinicianRole | db(supabase) | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/admin/design-tokens/route.ts |
| /api/admin/diagnostics/pillars-sot | GET | supabase.server, supabase.admin | registry | json: {error:{...}}, json: {requestId,...} | app/api/admin/diagnostics/pillars-sot/route.ts |
| /api/admin/funnels/[id] | GET, PATCH | supabase.server, supabase.admin, auth.getUser | db(supabase), registry | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/admin/funnels/[id]/route.ts |
| /api/admin/funnels | GET | supabase.server, supabase.admin, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/admin/funnels/route.ts |
| /api/admin/funnel-step-questions/[id] | PATCH | supabase.server, supabase.admin, auth.getUser, hasClinicianRole | db(supabase) | json: {requestId,...} | app/api/admin/funnel-step-questions/[id]/route.ts |
| /api/admin/funnel-steps/[id] | PATCH | supabase.server, supabase.admin, auth.getUser, hasClinicianRole | db(supabase) | json: {requestId,...} | app/api/admin/funnel-steps/[id]/route.ts |
| /api/admin/funnel-steps | POST | supabase.server, supabase.admin, auth.getUser, hasClinicianRole | db(supabase) | json: {requestId,...} | app/api/admin/funnel-steps/route.ts |
| /api/admin/funnel-versions/[id]/manifest | GET, PUT | supabase.server, supabase.admin, auth.getUser | db(supabase), registry | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/admin/funnel-versions/[id]/manifest/route.ts |
| /api/admin/funnel-versions/[id] | PATCH | supabase.server, supabase.admin, auth.getUser | db(supabase) | json: {requestId,...} | app/api/admin/funnel-versions/[id]/route.ts |
| /api/admin/kpi-thresholds/[id] | PUT, DELETE | supabase.server, supabase.admin, hasClinicianRole | db(supabase) |  | app/api/admin/kpi-thresholds/[id]/route.ts |
| /api/admin/kpi-thresholds | GET, POST | supabase.server, supabase.admin, hasClinicianRole | db(supabase) | json: {success,...} | app/api/admin/kpi-thresholds/route.ts |
| /api/admin/navigation/[role] | PUT | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/admin/navigation/[role]/route.ts |
| /api/admin/navigation | GET | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/admin/navigation/route.ts |
| /api/admin/notification-templates/[id] | PUT, DELETE | supabase.server, supabase.admin, hasClinicianRole | db(supabase) |  | app/api/admin/notification-templates/[id]/route.ts |
| /api/admin/notification-templates | GET, POST | supabase.server, supabase.admin, hasClinicianRole | db(supabase) | json: {success,...} | app/api/admin/notification-templates/route.ts |
| /api/admin/operational-settings-audit | GET | supabase.server, supabase.admin, hasClinicianRole | db(supabase) |  | app/api/admin/operational-settings-audit/route.ts |
| /api/admin/reassessment-rules/[id] | PUT, DELETE | supabase.server, supabase.admin, hasClinicianRole | db(supabase) |  | app/api/admin/reassessment-rules/[id]/route.ts |
| /api/admin/reassessment-rules | GET, POST | supabase.server, supabase.admin, hasClinicianRole | db(supabase) | json: {success,...} | app/api/admin/reassessment-rules/route.ts |
| /api/admin/usage | GET | supabase.server |  |  | app/api/admin/usage/route.ts |
| /api/amy/stress-report | POST | supabase.admin | db(supabase) |  | app/api/amy/stress-report/route.ts |
| /api/amy/stress-summary | POST |  |  |  | app/api/amy/stress-summary/route.ts |
| /api/assessment-answers/save | POST | supabase.server, auth.getUser | db(supabase) |  | app/api/assessment-answers/save/route.ts |
| /api/assessments/[id]/current-step | GET | supabase.server, auth.getUser | db(supabase) | json: {success,...} | app/api/assessments/[id]/current-step/route.ts |
| /api/assessments/[id]/navigation | GET | supabase.server, auth.getUser | db(supabase) | json: {success,...} | app/api/assessments/[id]/navigation/route.ts |
| /api/assessments/[id]/resume | GET | supabase.server, auth.getUser | db(supabase) | json: {success,...} | app/api/assessments/[id]/resume/route.ts |
| /api/assessment-validation/validate-step | POST | supabase.server, auth.getUser | db(supabase) | json: {success,...} | app/api/assessment-validation/validate-step/route.ts |
| /api/auth/callback | POST | supabase.server |  |  | app/api/auth/callback/route.ts |
| /api/auth/resolve-role | GET | supabase.server, auth.getUser |  | json: {success,...}, json: {error:{...}} | app/api/auth/resolve-role/route.ts |
| /api/consent/record | POST | supabase.server, auth.getUser | db(supabase) | json: {success,...} | app/api/consent/record/route.ts |
| /api/consent/status | GET | supabase.server, auth.getUser | db(supabase) |  | app/api/consent/status/route.ts |
| /api/content/resolve | GET |  |  | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/content/resolve/route.ts |
| /api/content-pages/[slug] | GET | supabase.admin | db(supabase) |  | app/api/content-pages/[slug]/route.ts |
| /api/content-resolver | GET |  |  |  | app/api/content-resolver/route.ts |
| /api/documents/[id]/extract | POST | supabase.server | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/documents/[id]/extract/route.ts |
| /api/documents/[id]/status | PATCH | supabase.server, supabase.admin |  | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/documents/[id]/status/route.ts |
| /api/documents/upload | POST | supabase.server | db(supabase) | json: {requestId,...} | app/api/documents/upload/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/answers/save | POST | supabase.server, auth.getUser | db(supabase) |  | app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/complete | POST | supabase.server, auth.getUser | db(supabase), registry | json: {success,...}, json: {error:{...}} | app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/result | GET | supabase.server, auth.getUser | db(supabase), registry |  | app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId] | GET | supabase.server, auth.getUser | db(supabase) | json: {success,...} | app/api/funnels/[slug]/assessments/[assessmentId]/route.ts |
| /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | POST | supabase.server, auth.getUser | db(supabase) | json: {success,...} | app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts |
| /api/funnels/[slug]/assessments | POST | supabase.server, auth.getUser | db(supabase), registry | json: {success,...} | app/api/funnels/[slug]/assessments/route.ts |
| /api/funnels/[slug]/content-pages | GET | supabase.admin | db(supabase), registry | json: [], json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/funnels/[slug]/content-pages/route.ts |
| /api/funnels/[slug]/definition | GET | supabase.server | db(supabase), registry |  | app/api/funnels/[slug]/definition/route.ts |
| /api/funnels/active | GET | supabase.server, auth.getUser | db(supabase) | json: {success,...} | app/api/funnels/active/route.ts |
| /api/funnels/catalog/[slug] | GET | supabase.server, auth.getUser | db(supabase), registry | json: {success,...}, json: {requestId,...} | app/api/funnels/catalog/[slug]/route.ts |
| /api/funnels/catalog | GET | supabase.server, auth.getUser | db(supabase), registry | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/funnels/catalog/route.ts |
| /api/health/env | GET | supabase.server | db(supabase) | json: {requestId,...} | app/api/health/env/route.ts |
| /api/notifications/[id] | PATCH | supabase.server, supabase.admin | db(supabase) | json: {success,...} | app/api/notifications/[id]/route.ts |
| /api/notifications | GET | supabase.server, supabase.admin | db(supabase) | json: {success,...} | app/api/notifications/route.ts |
| /api/patient/onboarding-status | GET | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/patient/onboarding-status/route.ts |
| /api/patient-measures/export | GET | supabase.admin, auth.getUser | db(supabase) |  | app/api/patient-measures/export/route.ts |
| /api/patient-measures/history | GET | supabase.admin | db(supabase) |  | app/api/patient-measures/history/route.ts |
| /api/patient-profiles | GET | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/patient-profiles/route.ts |
| /api/pre-screening-calls | POST, GET | supabase.server, auth.getUser | db(supabase), registry | json: {success,...}, json: {error:{...}} | app/api/pre-screening-calls/route.ts |
| /api/processing/content | POST | supabase.server, supabase.admin, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/processing/content/route.ts |
| /api/processing/delivery | POST | supabase.server |  | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/processing/delivery/route.ts |
| /api/processing/jobs/[jobId] | GET | supabase.server, supabase.admin, auth.getUser | db(supabase) | json: {success,...} | app/api/processing/jobs/[jobId]/route.ts |
| /api/processing/pdf | POST | supabase.server |  | json: {requestId,...} | app/api/processing/pdf/route.ts |
| /api/processing/ranking | POST | supabase.server, supabase.admin, auth.getUser, role-check | registry | json: {success,...} | app/api/processing/ranking/route.ts |
| /api/processing/risk | POST | supabase.server, supabase.admin, auth.getUser | db(supabase) | json: {success,...} | app/api/processing/risk/route.ts |
| /api/processing/safety | POST | supabase.server, supabase.admin, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/processing/safety/route.ts |
| /api/processing/start | POST | supabase.server, supabase.admin, auth.getUser | db(supabase) | json: {success,...} | app/api/processing/start/route.ts |
| /api/processing/validation | POST | supabase.server, supabase.admin, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/processing/validation/route.ts |
| /api/reports/[reportId]/pdf | GET | supabase.server | db(supabase) | json: {requestId,...} | app/api/reports/[reportId]/pdf/route.ts |
| /api/review/[id]/decide | POST | supabase.server, supabase.admin, auth.getUser |  | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/review/[id]/decide/route.ts |
| /api/review/[id]/details | GET | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/review/[id]/details/route.ts |
| /api/review/[id] | GET | supabase.server, supabase.admin, auth.getUser |  | json: {success,...}, json: {error:{...}} | app/api/review/[id]/route.ts |
| /api/review/queue | GET | supabase.server, supabase.admin, auth.getUser |  | json: {success,...}, json: {error:{...}} | app/api/review/queue/route.ts |
| /api/shipments/[id]/events | POST, GET | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/shipments/[id]/events/route.ts |
| /api/shipments/[id] | GET, PATCH | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/shipments/[id]/route.ts |
| /api/shipments | POST, GET | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}} | app/api/shipments/route.ts |
| /api/support-cases/[id]/escalate | POST | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/support-cases/[id]/escalate/route.ts |
| /api/support-cases/[id] | GET, PATCH, DELETE | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/support-cases/[id]/route.ts |
| /api/support-cases | POST, GET | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/support-cases/route.ts |
| /api/tasks/[id] | PATCH | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/tasks/[id]/route.ts |
| /api/tasks | POST, GET | supabase.server, auth.getUser | db(supabase) | json: {success,...}, json: {error:{...}}, json: {requestId,...} | app/api/tasks/route.ts |
