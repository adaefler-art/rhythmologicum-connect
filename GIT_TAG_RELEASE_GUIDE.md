# Git Tag and GitHub Release Creation Guide

**For:** v0.4.0 Release  
**Date:** December 14, 2025

---

## Prerequisites

Before creating the tag and release:

- [x] All code changes committed and pushed
- [x] Version updated to 0.4.0 in package.json
- [x] CHANGES.md finalized with v0.4 summary
- [x] RELEASE_NOTES_V0.4.0.md created
- [x] Build passes successfully
- [x] Security vulnerabilities resolved
- [ ] Manual smoke tests completed (see RELEASE_CHECKLIST_V0.4.0.md)

---

## Step 1: Create Annotated Git Tag

### Why Annotated Tags?
Annotated tags in Git:
- Include tagger name, email, and date
- Can include a detailed message
- Are stored as full objects in Git database
- Show up in `git describe` output
- Are recommended for releases

### Command

```bash
# Navigate to repository
cd /home/runner/work/rhythmologicum-connect/rhythmologicum-connect

# Ensure you're on the correct branch
git checkout copilot/release-v04-closure-review

# Verify the latest commit
git log -1 --oneline

# Create annotated tag with release message
git tag -a v0.4.0 -m "Release v0.4.0 - Production-Ready

Major milestone release with complete consolidation and production readiness.

🎯 Key Features:
- Data-driven funnel architecture (Epic B1-B8)
- Design token system (C1)
- Row Level Security (D4) - 19 policies
- Content Management System (F4)
- Patient Flow V2 with mobile optimization
- Comprehensive documentation and QA artifacts

🔒 Security:
- Next.js updated to 16.0.10 (security fixes)
- Full RLS implementation
- GDPR/DSGVO compliant

📊 Metrics:
- ~22,000 lines of TypeScript
- 46 database tables
- 30+ API endpoints
- 19 database migrations
- 50+ UI components

See RELEASE_NOTES_V0.4.0.md for complete details."

# Verify tag was created
git tag -l -n9 v0.4.0

# Push tag to remote
git push origin v0.4.0
```

### Expected Output

```
To https://github.com/adaefler-art/rhythmologicum-connect
 * [new tag]         v0.4.0 -> v0.4.0
```

---

## Step 2: Verify Tag on GitHub

1. Go to: `https://github.com/adaefler-art/rhythmologicum-connect`
2. Click on "Tags" (near the branch dropdown)
3. Verify `v0.4.0` appears in the list
4. Click on the tag to see the commit it points to

---

## Step 3: Create GitHub Release

### Option A: Via GitHub Web UI (Recommended)

1. **Navigate to Releases**
   - Go to: `https://github.com/adaefler-art/rhythmologicum-connect/releases`
   - Click "Draft a new release" button

2. **Configure Release**
   - **Choose a tag:** Select `v0.4.0` from dropdown
   - **Release title:** `v0.4.0 - Production-Ready Release`
   - **Description:** Copy the entire content from `RELEASE_NOTES_V0.4.0.md`

3. **Release Options**
   - ✅ Set as the latest release (check this box)
   - ❌ Set as a pre-release (do NOT check)
   - ❌ Create a discussion (optional - can skip for now)

4. **Preview and Publish**
   - Click "Preview" tab to see how it will look
   - Review the release notes formatting
   - Click "Publish release" button

### Option B: Via GitHub CLI (Alternative)

If you have `gh` CLI installed:

```bash
# Authenticate if needed
gh auth status

# Create release from tag
gh release create v0.4.0 \
  --title "v0.4.0 - Production-Ready Release" \
  --notes-file RELEASE_NOTES_V0.4.0.md \
  --latest

# Verify release was created
gh release view v0.4.0
```

---

## Step 4: Verify GitHub Release

1. **Check Release Page**
   - Go to: `https://github.com/adaefler-art/rhythmologicum-connect/releases`
   - Verify v0.4.0 appears as "Latest"
   - Check that release notes are properly formatted

2. **Verify Tag Association**
   - Release should show correct commit hash
   - Tag should be properly linked

3. **Check Assets**
   - GitHub automatically creates source code archives (zip and tar.gz)
   - These should be available for download

---

## Step 5: Update Main Branch (Optional)

If you want to merge the release branch to main:

```bash
# Option A: Via Pull Request (Recommended)
# 1. Go to GitHub and create a PR from copilot/release-v04-closure-review to main
# 2. Add title: "Release v0.4.0"
# 3. Add description: Link to release notes
# 4. Request review if needed
# 5. Merge PR

# Option B: Direct merge (if authorized)
git checkout main
git merge copilot/release-v04-closure-review
git push origin main

# Tag main branch at the merged commit (optional)
git tag -a v0.4.0-main -m "v0.4.0 on main branch"
git push origin v0.4.0-main
```

---

## Step 6: Announce Release (Optional)

### Internal Announcement
- Send email to team with link to release notes
- Update project management tools
- Notify QA team for production verification

### External Announcement
- Update project website if applicable
- Social media announcement if applicable
- Update documentation site

---

## Verification Checklist

After creating tag and release:

- [ ] Tag `v0.4.0` exists in GitHub repository
- [ ] Tag points to correct commit (1d20d85 or later)
- [ ] GitHub release created and marked as "Latest"
- [ ] Release notes are complete and properly formatted
- [ ] Source code archives available for download
- [ ] Release visible in repository main page
- [ ] Links in release notes work correctly

---

## Common Issues and Solutions

### Issue: Tag already exists
```bash
# Delete local tag
git tag -d v0.4.0

# Delete remote tag
git push origin :refs/tags/v0.4.0

# Recreate tag
git tag -a v0.4.0 -m "Your message"
git push origin v0.4.0
```

### Issue: Wrong commit tagged
```bash
# Tag specific commit
git tag -a v0.4.0 <commit-hash> -m "Your message"
git push origin v0.4.0
```

### Issue: Need to update release notes
1. Go to GitHub release page
2. Click "Edit release"
3. Update description
4. Click "Update release"

### Issue: Need to move tag
```bash
# Force move tag to current HEAD
git tag -a v0.4.0 -f -m "Your message"

# Force push (use with caution!)
git push origin v0.4.0 --force
```

---

## Rollback Procedure

If you need to undo the release:

### Remove GitHub Release
```bash
# Via GitHub UI
# 1. Go to release page
# 2. Click "Delete this release"

# Via GitHub CLI
gh release delete v0.4.0
```

### Remove Tag
```bash
# Delete remote tag
git push origin :refs/tags/v0.4.0

# Delete local tag
git tag -d v0.4.0
```

---

## References

- **Git Tagging:** https://git-scm.com/book/en/v2/Git-Basics-Tagging
- **GitHub Releases:** https://docs.github.com/en/repositories/releasing-projects-on-github
- **GitHub CLI:** https://cli.github.com/manual/gh_release

---

## Next Steps After Release

1. Monitor deployment (see RELEASE_CHECKLIST_V0.4.0.md)
2. Verify production functionality
3. Update project status
4. Begin v0.5 planning
5. Archive v0.4 documentation

---

**Created:** December 14, 2025  
**For:** v0.4.0 Release  
**Status:** Ready for execution
