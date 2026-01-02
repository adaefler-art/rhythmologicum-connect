# DB Access Pattern Audit Report

Generated: 2026-01-02T06:56:58.815Z

## Summary

- Total files scanned: 314
- Direct createClient calls: 2
- createServerClient calls: 2
- Service role key usage: 42
- Existing helper usage: 8

## Client Creation Patterns

### API Routes (1)

- `app/api/auth/callback/route.ts:9` - createServerClient

### Library/Utilities (2)

- `lib/funnels/loadFunnelVersion.ts:118` - createClient
- `lib/utils/contentResolver.ts:51` - createClient

### Other (1)

- `proxy.ts:42` - createServerClient

## Table Access Patterns

| Table | Access Count | Files |
|-------|--------------|-------|
| patient_profiles | 23 | 19 |
| content_pages | 22 | 11 |
| assessments | 21 | 16 |
| funnel_steps | 19 | 11 |
| funnels | 13 | 11 |
| funnel_step_questions | 10 | 7 |
| assessment_answers | 10 | 8 |
| content_page_sections | 7 | 3 |
| patient_measures | 7 | 5 |
| questions | 6 | 5 |
| funnels_catalog | 6 | 5 |
| funnel_versions | 6 | 4 |
| reports | 6 | 4 |
| user_consents | 6 | 3 |
| pillars | 3 | 3 |
| audit_log | 1 | 1 |
| table | 1 | 1 |
| public_table | 1 | 1 |
| user_data | 1 | 1 |
| funnel_question_rules | 1 | 1 |

## Environment Variable Usage (process.env)

Found direct process.env usage in 5 files:

- app/content/[slug]/page.tsx
- app/patient/funnel/__tests__/manifestIntegration.test.ts
- lib/__tests__/env.test.ts
- lib/env.ts
- lib/funnels/loadFunnelVersion.ts
