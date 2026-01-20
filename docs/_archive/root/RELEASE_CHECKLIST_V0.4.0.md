# v0.4.0 Release Checklist & Procedures

**Release Version:** v0.4.0  
**Target Date:** December 14, 2025  
**Status:** Ready for Release

---

## 📋 Pre-Release Checklist

### 1️⃣ Code & Repository Status

- [x] **main branch contains only v0.4 scope**
  - Current branch: `copilot/release-v04-closure-review`
  - All v0.4 features complete and merged
  
- [x] **All v0.4 issues closed or moved to v0.5**
  - Review `../v04/v0_4_issues.json` - all epics marked complete
  
- [x] **No open TODOs/FIXMEs in v0.4 scope**
  - Found TODOs: All related to future monitoring (Sentry integration)
  - These are explicitly documented as v0.5+ features
  - Status: ✅ Acceptable for v0.4
  
- [x] **Repository structure finalized**
  - No temporary files or work-in-progress directories
  - Legacy code properly archived in `_legacy/` folders
  - Clean build output

### 2️⃣ Documentation (Repo-internal)

- [x] **CHANGES.md**
  - ✅ v0.4 comprehensive summary section added
  - ✅ Clear separation: Added / Changed / Fixed
  - ✅ All major features documented
  
- [x] **PR_SUMMARY.md reviewed**
  - Contains D4 RLS implementation summary
  - Consistent with CHANGES.md
  
- [x] **QA Artifacts finalized:**
  - ✅ MANUAL_TEST_PLAN.md - Complete
  - ✅ TESTING_GUIDE.md - Complete
  - ✅ THEME_TESTING_CHECKLIST.md - Complete
  - ✅ CONTENT_QA_CHECKLIST.md - Complete
  - ✅ PATIENT_LAYOUT_AUDIT.md - Complete
  
- [x] **Release documentation created:**
  - ✅ RELEASE_NOTES_V0.4.0.md - Comprehensive English release notes

### 3️⃣ Functional Acceptance

#### Patient Flow (Smoke Tests)
- [ ] **Login → Routing**
  - [ ] Patient can log in successfully
  - [ ] Correct redirect to `/patient/funnel/stress-assessment`
  - [ ] Session persists across page reloads
  
- [ ] **Funnel Start → Completion**
  - [ ] Start assessment from patient dashboard
  - [ ] Complete all steps without errors
  - [ ] Submit assessment successfully
  - [ ] View results page
  
- [ ] **History Visibility**
  - [ ] Navigate to history page
  - [ ] See completed assessments
  - [ ] Open assessment details
  - [ ] View associated reports
  
- [ ] **Dark / Light Mode**
  - [ ] Toggle theme from header
  - [ ] Theme persists on reload
  - [ ] All pages render correctly in both modes
  - [ ] No visual inconsistencies
  
- [ ] **Mobile Layout**
  - [ ] Test on mobile device or DevTools
  - [ ] Tables render properly (no "small table" regression)
  - [ ] Touch interactions work smoothly
  - [ ] Bottom navigation functional

#### Clinician Flow (Smoke Tests)
- [ ] **Unified Navigation**
  - [ ] Dashboard loads correctly
  - [ ] Navigate to Funnels section
  - [ ] Navigate to Content management
  - [ ] All navigation items functional
  
- [ ] **Funnel Management**
  - [ ] View funnel list at `/clinician/funnels`
  - [ ] View funnel details
  - [ ] Toggle funnel active status
  - [ ] Modify step order
  - [ ] Toggle question required status
  
- [ ] **Content Management**
  - [ ] View content list at `/admin/content`
  - [ ] Create new content page
  - [ ] Edit existing content
  - [ ] Change status (draft/published/archived)
  - [ ] Delete content (soft delete)
  
- [ ] **No 500 Errors**
  - [ ] All core paths load without errors
  - [ ] API endpoints respond correctly
  - [ ] Error states display properly

### 4️⃣ Infrastructure & Operations

- [x] **Database Migrations**
  - ✅ 19 migration files documented
  - ✅ Migrations sequential and consistent
  - ✅ All migrations in `supabase/migrations/`
  - [ ] **Action Required:** Apply migrations to production
  
- [x] **RLS Active & Verified**
  - ✅ 19 RLS policies implemented
  - ✅ Patient data isolation enforced
  - ✅ Clinician access properly scoped
  - ✅ Helper functions created (is_clinician, get_my_patient_profile_id, log_rls_violation)
  - [ ] **Action Required:** Run RLS tests in production
  
- [x] **.env.example Complete**
  - ✅ All required variables documented
  - ✅ Optional variables clearly marked
  - ✅ Feature flags documented
  - ✅ Deployment notes included
  - ✅ Legacy variable names noted
  
- [x] **Error Visibility**
  - ✅ Logging framework in place (lib/logging/)
  - ✅ Client logger available
  - ✅ Server logger available
  - ✅ API wrapper with error tracking
  - [ ] **Action Required:** Configure Vercel error tracking

### 5️⃣ Build & Deployment

- [x] **Build Successful**
  - ✅ `npm run build` completes successfully
  - ✅ All TypeScript compilation passes
  - ✅ No critical build warnings
  - ✅ Version generation script works
  
- [x] **Version Updated**
  - ✅ package.json version: `0.4.0`
  - ✅ Version script generates correct info
  
- [ ] **Dependencies Secure**
  - ⚠️ 1 high severity vulnerability detected
  - [ ] **Action Required:** Run `npm audit fix` or review

---

## 🚀 Release Execution Steps

### Step 1: Final Testing
1. Run smoke tests (see section 3️⃣ above)
2. Verify all core user flows
3. Check error states and edge cases
4. Test on multiple browsers if possible

### Step 2: Prepare Release Branch
```bash
# Ensure we're on the correct branch
git checkout copilot/release-v04-closure-review

# Verify all changes are committed
git status

# Create a clean commit if needed
git add .
git commit -m "chore: finalize v0.4.0 release"

# Push to remote
git push origin copilot/release-v04-closure-review
```

### Step 3: Create Git Tag
```bash
# Create annotated tag with release notes
git tag -a v0.4.0 -m "Release v0.4.0 - Production-Ready

Major milestone release with complete consolidation and production readiness.

Key features:
- Data-driven funnel architecture (Epic B)
- Design token system (C1)
- Row Level Security (D4)
- Content Management System (F4)
- Comprehensive documentation

See RELEASE_NOTES_V0.4.0.md for full details."

# Push tag to remote
git push origin v0.4.0
```

### Step 4: Create GitHub Release
1. Go to GitHub repository
2. Navigate to "Releases" → "Draft a new release"
3. Select tag: `v0.4.0`
4. Release title: `v0.4.0 - Production-Ready Release`
5. Copy content from `RELEASE_NOTES_V0.4.0.md` into description
6. Mark as "Latest release"
7. Publish release

### Step 5: Merge to Main (if applicable)
```bash
# Create PR from release branch to main
# Or merge directly if authorized

git checkout main
git merge copilot/release-v04-closure-review
git push origin main
```

### Step 6: Deploy to Production
```bash
# If using Vercel CLI
vercel --prod

# Or push to main branch to trigger automatic deployment
git push origin main
```

### Step 7: Apply Production Migrations
1. Log into Supabase Dashboard
2. Navigate to SQL Editor
3. Execute migrations in order from `supabase/migrations/`
4. Verify migration success
5. Test RLS policies with test users

### Step 8: Post-Deployment Verification
1. Run smoke tests on production
2. Check error logs in Vercel dashboard
3. Verify database migrations applied correctly
4. Test authentication flows
5. Verify RLS enforcement

---

## 📊 Release Verification Checklist

After deployment, verify:

- [ ] Production site loads successfully
- [ ] Authentication works (login/logout)
- [ ] Patient flow completes end-to-end
- [ ] Clinician dashboard accessible
- [ ] Database queries return correct data
- [ ] RLS policies enforce correctly
- [ ] No console errors on core pages
- [ ] Mobile layout renders properly
- [ ] Theme switching works

---

## 🔄 Rollback Procedure (if needed)

If issues arise post-deployment:

### Quick Rollback (Vercel)
1. Go to Vercel Dashboard
2. Navigate to deployments
3. Find previous stable deployment
4. Click "Promote to Production"

### Database Rollback (if migrations cause issues)
```sql
-- Only if absolutely necessary
-- Review migration and create reverse migration
-- Test thoroughly in staging first
```

### Git Rollback
```bash
# Create revert commit
git revert v0.4.0

# Or reset to previous version
git reset --hard <previous-commit-hash>
git push origin main --force
```

---

## 📝 Post-Release Tasks

### Immediate (Day 1)
- [ ] Monitor error logs for issues
- [ ] Check user feedback channels
- [ ] Verify analytics data collection
- [ ] Update status page if applicable

### Short-term (Week 1)
- [ ] Review deployment metrics
- [ ] Collect user feedback
- [ ] Document any issues or improvements
- [ ] Plan hotfix if critical issues found

### Long-term (Month 1)
- [ ] Analyze usage patterns
- [ ] Prioritize v0.5 features
- [ ] Review and update documentation
- [ ] Plan next release cycle

---

## 🎯 Definition of Done

Version 0.4 is considered complete when:

- ✅ All code changes committed and tagged
- ✅ GitHub release published with release notes
- ✅ Production deployment successful
- ✅ Database migrations applied
- ✅ Smoke tests pass in production
- ✅ No critical errors in logs
- ✅ Documentation complete and accessible
- ✅ v0.5 planning can begin on clean foundation

---

## 📞 Release Contacts

**Technical Lead:** Review release process  
**QA Lead:** Sign off on testing  
**DevOps:** Manage deployment  
**Product Owner:** Final approval

---

## 📚 Reference Documents

- **CHANGES.md** - Complete German changelog
- **RELEASE_NOTES_V0.4.0.md** - English release notes
- **README.md** - Project overview
- **docs/** - Technical documentation
- **.env.example** - Environment configuration

---

**Status:** Ready for release execution  
**Last Updated:** December 14, 2025
