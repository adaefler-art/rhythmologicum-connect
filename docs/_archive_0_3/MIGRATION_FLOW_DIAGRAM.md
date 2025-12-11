# Migration Deployment Flow Diagram

## Problem → Solution → Verification

```
┌─────────────────────────────────────────────────────────────┐
│                      THE PROBLEM                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Migration 1: populate_stress_questions.sql                  │
│  └─> Creates funnel with slug: "stress"                     │
│                                                              │
│  Migration 2: seed_stress_funnel_base_pages.sql             │
│  └─> Expects funnel with slug: "stress-assessment" ❌       │
│                                                              │
│  Result: Seed migration fails, no content pages deployed    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

                              │
                              ▼

┌─────────────────────────────────────────────────────────────┐
│                      THE SOLUTION                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Corrective Migration (20251211065000)              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ UPDATE funnels                                      │    │
│  │ SET slug = 'stress-assessment'                      │    │
│  │ WHERE slug = 'stress';                              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Step 2: Automated Deployment Workflow                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │ .github/workflows/apply-migrations.yml              │    │
│  │                                                      │    │
│  │ Triggers:                                            │    │
│  │  • Push to main (migrations/ changes)               │    │
│  │  • Manual workflow dispatch                          │    │
│  │                                                      │    │
│  │ Actions:                                             │    │
│  │  1. Validate secrets exist                           │    │
│  │  2. Link Supabase project                            │    │
│  │  3. Run: supabase db push                            │    │
│  │  4. Verify deployment                                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Step 3: Verification Tools                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Pre-deploy: check-migration-status.sh               │    │
│  │ Post-deploy: verify-migrations.sql                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

                              │
                              ▼

┌─────────────────────────────────────────────────────────────┐
│                   MIGRATION EXECUTION ORDER                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣  20251207150000_populate_stress_questions.sql          │
│     └─> Creates: funnel "stress"                            │
│     └─> Creates: 8 questions                                 │
│     └─> Creates: 2 funnel steps                             │
│                                                              │
│  2️⃣  20251211065000_fix_stress_funnel_slug.sql ⭐ NEW      │
│     └─> Updates: slug "stress" → "stress-assessment"        │
│     └─> Logs: confirmation message                          │
│                                                              │
│  3️⃣  20251211070000_seed_stress_funnel_base_pages.sql      │
│     └─> Finds: funnel "stress-assessment" ✅                │
│     └─> Creates: 10 content pages                           │
│     └─> Sets: all pages to "published" status               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

                              │
                              ▼

┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT WORKFLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Developer                GitHub Actions         Supabase   │
│     │                          │                     │       │
│     │ 1. Merge PR              │                     │       │
│     │ ─────────────────────>   │                     │       │
│     │                          │                     │       │
│     │                          │ 2. Trigger workflow │       │
│     │                          │ (on push to main)   │       │
│     │                          │                     │       │
│     │                          │ 3. Validate secrets │       │
│     │                          │ (check TOKEN & ID)  │       │
│     │                          │                     │       │
│     │                          │ 4. Link project     │       │
│     │                          │ ─────────────────────────>  │
│     │                          │      (supabase link)│       │
│     │                          │                     │       │
│     │                          │ 5. Apply migrations │       │
│     │                          │ ─────────────────────────>  │
│     │                          │      (supabase db push)     │
│     │                          │                     │       │
│     │                          │          6. Execute SQL     │
│     │                          │             (migrations)    │
│     │                          │                     │       │
│     │                          │ <─────────────────────────  │
│     │                          │        7. Success ✅        │
│     │                          │                     │       │
│     │ 8. Notification          │                     │       │
│     │ <─────────────────────   │                     │       │
│     │                          │                     │       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

                              │
                              ▼

┌─────────────────────────────────────────────────────────────┐
│                    VERIFICATION FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PRE-DEPLOYMENT CHECK                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │ $ ./scripts/check-migration-status.sh              │    │
│  │                                                      │    │
│  │ ✓ Populate stress questions                         │    │
│  │ ✓ Fix funnel slug                                   │    │
│  │ ✓ Seed content pages                                │    │
│  │ ✓ apply-migrations.yml workflow exists              │    │
│  │ ✓ DEPLOYMENT_MIGRATIONS.md exists                   │    │
│  │ ✓ F11_SEED_PAGES.md exists                          │    │
│  │                                                      │    │
│  │ Result: ✓ All critical files present                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  POST-DEPLOYMENT VERIFICATION                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Run: scripts/verify-migrations.sql in Supabase      │    │
│  │                                                      │    │
│  │ 1. Funnel Check................... ✓ PASS           │    │
│  │    └─> stress-assessment exists                     │    │
│  │                                                      │    │
│  │ 2. Old Slug Check................. ✓ PASS           │    │
│  │    └─> No old "stress" slug                         │    │
│  │                                                      │    │
│  │ 3. Content Pages Count............ ✓ PASS           │    │
│  │    └─> 10 pages found                               │    │
│  │                                                      │    │
│  │ 4. Published Status............... ✓ PASS           │    │
│  │    └─> All 10 pages published                       │    │
│  │                                                      │    │
│  │ 5. Expected Pages................. ✓ PASS           │    │
│  │    └─> All 10 expected slugs found                  │    │
│  │                                                      │    │
│  │ === SUMMARY ===                                      │    │
│  │ ✓ ALL CHECKS PASSED - Deployment successful!        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

                              │
                              ▼

┌─────────────────────────────────────────────────────────────┐
│                    REQUIRED SETUP                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GitHub Repository Secrets (Settings → Secrets → Actions)   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ SUPABASE_ACCESS_TOKEN                               │    │
│  │  └─> From: Supabase Dashboard → Settings → API     │    │
│  │      → Service Role Key                              │    │
│  │                                                      │    │
│  │ SUPABASE_PROJECT_ID                                 │    │
│  │  └─> From: Supabase Dashboard → Project Settings   │    │
│  │      → General → Reference ID                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Without these secrets, the workflow will fail! ⚠️           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

                              │
                              ▼

┌─────────────────────────────────────────────────────────────┐
│                    EXPECTED RESULTS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Database State After Successful Deployment:                 │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Funnels Table                                    │      │
│  ├──────────────────────────────────────────────────┤      │
│  │ slug: stress-assessment                          │      │
│  │ title: Stress & Resilienz Check                  │      │
│  │ is_active: true                                   │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Content Pages (10 total, all published)         │      │
│  ├──────────────────────────────────────────────────┤      │
│  │ 1. was-ist-stress                                │      │
│  │ 2. schlaf-und-resilienz                          │      │
│  │ 3. ueber-das-assessment                          │      │
│  │ 4. intro-vorbereitung                            │      │
│  │ 5. result-naechste-schritte                      │      │
│  │ 6. info-wissenschaftliche-grundlage              │      │
│  │ 7. stressbewaeltigung-techniken                  │      │
│  │ 8. burnout-praevention                           │      │
│  │ 9. work-life-balance                             │      │
│  │ 10. resilienz-aufbauen                           │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  Application URLs Working:                                   │
│  • /patient/stress-check                                     │
│  • /content/was-ist-stress                                   │
│  • /content/schlaf-und-resilienz                            │
│  • ... (all 10 content pages accessible)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference

### Files Added
- ✅ `.github/workflows/apply-migrations.yml` - Deployment automation
- ✅ `supabase/migrations/20251211065000_fix_stress_funnel_slug.sql` - Slug fix
- ✅ `docs/DEPLOYMENT_MIGRATIONS.md` - Detailed guide
- ✅ `scripts/check-migration-status.sh` - Pre-deployment check
- ✅ `scripts/verify-migrations.sql` - Post-deployment verification
- ✅ `MIGRATION_DEPLOYMENT_SETUP.md` - Quick start guide

### Files Modified
- ✅ `README.md` - Added Database & Migrations section

### Commands Reference

```bash
# Pre-deployment check
./scripts/check-migration-status.sh

# Manual deployment (if needed)
supabase link --project-ref YOUR_PROJECT_ID
supabase db push

# Post-deployment verification
# Copy scripts/verify-migrations.sql into Supabase SQL Editor
```

### Key Learnings

1. **Migration Order Matters**: Timestamps must reflect dependencies
2. **Idempotency is Critical**: All migrations must be safe to re-run
3. **Automation Saves Time**: GitHub Actions handles deployment automatically
4. **Verification is Essential**: Always verify before and after deployment
5. **Documentation Prevents Issues**: Clear guides help future maintainers
