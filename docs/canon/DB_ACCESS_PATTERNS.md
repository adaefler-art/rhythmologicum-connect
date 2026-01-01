# DB Access Pattern Audit Report

Generated: 2026-01-01T17:13:23.572Z

## Summary

- Total files scanned: 306
- Direct createClient calls: 20
- createServerClient calls: 44
- Service role key usage: 71
- Existing helper usage: 8

## Client Creation Patterns

### API Routes (47)

- `app/api/admin/content-pages/[id]/route.ts:25` - createServerClient
- `app/api/admin/content-pages/[id]/route.ts:60` - createClient
- `app/api/admin/content-pages/[id]/route.ts:163` - createServerClient
- `app/api/admin/content-pages/[id]/route.ts:198` - createClient
- `app/api/admin/content-pages/[id]/route.ts:304` - createClient
- `app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts:27` - createServerClient
- `app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts:103` - createServerClient
- `app/api/admin/content-pages/[id]/sections/route.ts:26` - createServerClient
- `app/api/admin/content-pages/[id]/sections/route.ts:90` - createServerClient
- `app/api/admin/content-pages/route.ts:23` - createServerClient
- `app/api/admin/content-pages/route.ts:140` - createServerClient
- `app/api/admin/funnel-step-questions/[id]/route.ts:22` - createServerClient
- `app/api/admin/funnel-step-questions/[id]/route.ts:68` - createClient
- `app/api/admin/funnel-steps/[id]/route.ts:22` - createServerClient
- `app/api/admin/funnel-steps/[id]/route.ts:92` - createClient
- `app/api/admin/funnel-steps/route.ts:25` - createServerClient
- `app/api/admin/funnel-steps/route.ts:93` - createClient
- `app/api/admin/funnels/[id]/route.ts:21` - createServerClient
- `app/api/admin/funnels/[id]/route.ts:62` - createClient
- `app/api/admin/funnels/[id]/route.ts:179` - createServerClient
  _... and 27 more_

### App Pages/Components (5)

- `app/patient/funnel/[slug]/content/[pageSlug]/page.tsx:16` - createServerClient
- `app/patient/funnel/[slug]/intro/page.tsx:17` - createServerClient
- `app/patient/funnel/[slug]/page.tsx:19` - createServerClient
- `app/patient/funnel/[slug]/result/page.tsx:23` - createServerClient
- `app/patient/funnels/page.tsx:18` - createServerClient

### Library/Utilities (11)

- `lib/actions/onboarding.ts:44` - createServerClient
- `lib/api/authHelpers.ts:37` - createServerClient
- `lib/funnels/loadFunnelVersion.ts:118` - createClient
- `lib/supabaseClient.ts:55` - createClient
- `lib/supabaseServer.ts:5` - createClient
- `lib/supabaseServer.ts:8` - createServerClient
- `lib/supabaseServer.ts:33` - createClient
- `lib/utils/contentResolver.ts:51` - createClient
- `lib/validation/requiredQuestions.ts:40` - createServerClient
- `lib/validation/requiredQuestions.ts:139` - createServerClient
- `lib/validation/requiredQuestions.ts:203` - createServerClient

### Other (1)

- `proxy.ts:41` - createServerClient

## Table Access Patterns

| Table | Access Count | Files |
|-------|--------------|-------|
| patient_profiles | 23 | 19 |
| content_pages | 21 | 10 |
| assessments | 21 | 16 |
| funnel_steps | 18 | 10 |
| funnels | 12 | 10 |
| funnel_step_questions | 10 | 7 |
| assessment_answers | 10 | 8 |
| content_page_sections | 7 | 3 |
| patient_measures | 7 | 5 |
| questions | 6 | 5 |
| funnel_versions | 6 | 4 |
| reports | 6 | 4 |
| user_consents | 6 | 3 |
| funnels_catalog | 4 | 4 |
| pillars | 3 | 3 |
| audit_log | 1 | 1 |
| funnel_question_rules | 1 | 1 |

## Environment Variable Usage (process.env)

Found direct process.env usage in 37 files:

- app/api/admin/content-pages/[id]/route.ts
- app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts
- app/api/admin/content-pages/[id]/sections/route.ts
- app/api/admin/content-pages/route.ts
- app/api/admin/funnel-step-questions/[id]/route.ts
- app/api/admin/funnel-steps/[id]/route.ts
- app/api/admin/funnel-steps/route.ts
- app/api/admin/funnels/[id]/route.ts
- app/api/amy/stress-report/route.ts
- app/api/assessment-answers/save/route.ts
- app/api/assessment-validation/validate-step/route.ts
- app/api/assessments/[id]/current-step/route.ts
- app/api/assessments/[id]/navigation/route.ts
- app/api/assessments/[id]/resume/route.ts
- app/api/auth/callback/route.ts
- app/api/consent/record/route.ts
- app/api/consent/status/route.ts
- app/api/content-pages/[slug]/route.ts
- app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts
- app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts
