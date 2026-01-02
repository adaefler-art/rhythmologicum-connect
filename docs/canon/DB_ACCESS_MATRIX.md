# DB Access Matrix

## Surface → Endpoint → Client Type → Tables

| File | Type | Pattern | Tables Accessed | Has Service Role |
|------|------|---------|-----------------|------------------|
| app/api/admin/content-pages/[id]/route.ts | API Routes |  | content_pages |  |
| app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts | API Routes |  | content_page_sections |  |
| app/api/admin/content-pages/[id]/sections/route.ts | API Routes |  | content_pages, content_page_sections |  |
| app/api/admin/content-pages/route.ts | API Routes |  | content_pages |  |
| app/api/admin/funnel-step-questions/[id]/route.ts | API Routes |  | funnel_step_questions |  |
| app/api/admin/funnel-steps/[id]/route.ts | API Routes |  | content_pages, funnel_steps |  |
| app/api/admin/funnel-steps/route.ts | API Routes |  | content_pages, funnel_steps, funnels |  |
| app/api/admin/funnels/[id]/route.ts | API Routes |  | content_pages, funnel_step_questions, funnel_steps +2 |  |
| app/api/admin/funnels/route.ts | API Routes |  | pillars, funnels_catalog, funnel_versions |  |
| app/api/amy/stress-report/route.ts | API Routes |  | assessments, assessment_answers, reports +1 |  |
| app/api/assessment-answers/save/route.ts | API Routes |  | assessments, assessment_answers, patient_profiles |  |
| app/api/assessment-validation/validate-step/route.ts | API Routes |  | assessments, patient_profiles |  |
| app/api/assessments/[id]/current-step/route.ts | API Routes |  | assessments, patient_profiles |  |
| app/api/assessments/[id]/navigation/route.ts | API Routes |  | assessments, patient_profiles |  |
| app/api/assessments/[id]/resume/route.ts | API Routes |  | assessments, assessment_answers, patient_profiles |  |
| app/api/auth/callback/route.ts | API Routes | createServerClient |  |  |
| app/api/consent/record/route.ts | API Routes |  | user_consents |  |
| app/api/consent/status/route.ts | API Routes |  | user_consents |  |
| app/api/content-pages/[slug]/route.ts | API Routes |  | content_pages, content_page_sections |  |
| app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts | API Routes |  | assessments, assessment_answers, patient_profiles |  |
| app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts | API Routes |  | assessments, patient_profiles |  |
| app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts | API Routes |  | funnels, assessments, patient_profiles |  |
| app/api/funnels/[slug]/assessments/[assessmentId]/route.ts | API Routes |  | funnel_steps, funnels, assessments +1 |  |
| app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts | API Routes |  | funnel_steps, assessments, patient_profiles |  |
| app/api/funnels/[slug]/assessments/route.ts | API Routes |  | funnels, assessments, patient_profiles |  |
| app/api/funnels/[slug]/content-pages/route.ts | API Routes |  | content_pages, funnels |  |
| app/api/funnels/[slug]/definition/route.ts | API Routes |  | content_pages, funnel_step_questions, funnel_steps +2 |  |
| app/api/funnels/active/route.ts | API Routes |  | funnels |  |
| app/api/funnels/catalog/[slug]/route.ts | API Routes |  | pillars, funnels_catalog, funnel_versions |  |
| app/api/funnels/catalog/route.ts | API Routes |  | pillars, funnels_catalog, funnel_versions |  |
| app/api/patient-measures/export/route.ts | API Routes |  | reports, patient_measures, patient_profiles |  |
| app/api/patient-measures/history/route.ts | API Routes |  | reports, patient_measures |  |
| app/clinician/page.tsx | App Pages/Components |  | patient_measures |  |
| app/clinician/patient/[id]/page.tsx | App Pages/Components |  | patient_measures, patient_profiles |  |
| app/clinician/report/[id]/page.tsx | App Pages/Components |  | assessments, assessment_answers, reports +1 |  |
| app/page.tsx | App Pages/Components |  | patient_profiles |  |
| app/patient/funnel/[slug]/client.tsx | App Pages/Components |  | assessments, assessment_answers, patient_profiles |  |
| app/patient/funnel/[slug]/result/page.tsx | App Pages/Components |  | assessments, patient_profiles |  |
| app/patient/history/PatientHistoryClient.tsx | App Pages/Components |  | patient_profiles |  |
| lib/actions/onboarding.ts | Library/Utilities |  | patient_profiles, user_consents |  |
| lib/audit/log.ts | Library/Utilities |  | audit_log |  |
| lib/db/errors.ts | Library/Utilities |  | table |  |
| lib/db/supabase.admin.ts | Library/Utilities |  | content_pages, funnel_steps, funnels +1 |  |
| lib/db/supabase.public.ts | Library/Utilities |  | public_table |  |
| lib/db/supabase.server.ts | Library/Utilities |  | user_data |  |
| lib/funnelHelpers.ts | Library/Utilities |  | funnel_step_questions, funnel_steps, funnels +1 |  |
| lib/funnels/loadFunnelVersion.ts | Library/Utilities | createClient | funnels_catalog, funnel_versions |  |
| lib/navigation/assessmentNavigation.ts | Library/Utilities |  | funnel_step_questions, funnel_steps, questions +2 |  |
| lib/utils/contentResolver.ts | Library/Utilities | createClient | content_pages, funnels |  |
| lib/validation/requiredQuestions.ts | Library/Utilities |  | funnel_step_questions, funnel_steps, assessment_answers +1 |  |
| lib/validation/stepValidation.ts | Library/Utilities |  | funnel_step_questions, funnel_steps, questions |  |
| proxy.ts | Other | createServerClient |  |  |
