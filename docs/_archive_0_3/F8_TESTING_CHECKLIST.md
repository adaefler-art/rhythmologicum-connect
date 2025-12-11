# F8 Testing Checklist

## Pre-Deployment Verification

Use this checklist before deploying F8 to production.

### ✅ 1. Database Setup

- [ ] Migration `20251210210000_add_f8_result_content_blocks.sql` applied
- [ ] Verify result-category content exists:
  ```sql
  SELECT slug, title, category, status, priority
  FROM content_pages
  WHERE category = 'result'
  ORDER BY priority DESC;
  ```
  Expected: At least 2-3 rows with status='published'

- [ ] Verify sections are linked:
  ```sql
  SELECT cp.slug, cp.title, COUNT(cps.id) as section_count
  FROM content_pages cp
  LEFT JOIN content_page_sections cps ON cp.id = cps.content_page_id
  WHERE cp.category = 'result'
  GROUP BY cp.id, cp.slug, cp.title;
  ```
  Expected: 'result-ergebnis-verstehen' should have 3 sections

### ✅ 2. API Endpoint Verification

- [ ] Test content-resolver endpoint without category:
  ```bash
  curl "http://localhost:3000/api/content-resolver?funnel=stress-assessment"
  ```
  Should return: JSON array with all stress-assessment content

- [ ] Test with result category:
  ```bash
  curl "http://localhost:3000/api/content-resolver?funnel=stress-assessment&category=result"
  ```
  Should return: Only result-category pages

- [ ] Test error handling (missing funnel):
  ```bash
  curl "http://localhost:3000/api/content-resolver"
  ```
  Should return: 400 error with message about missing funnel parameter

### ✅ 3. Build & Type Checks

- [ ] TypeScript compilation:
  ```bash
  npx tsc --noEmit
  ```
  Expected: No errors

- [ ] ESLint passes:
  ```bash
  npx eslint app/patient/stress-check/result/StressResultClient.tsx app/api/content-resolver/route.ts
  ```
  Expected: No errors

- [ ] Production build succeeds:
  ```bash
  npm run build
  ```
  Expected: Build completes without errors

### ✅ 4. UI Functionality Testing

#### 4.1 Complete Assessment Flow
- [ ] Navigate to `/patient/stress-check`
- [ ] Complete the stress assessment questionnaire
- [ ] Submit and reach the result page
- [ ] Verify URL contains `?assessmentId=...`

#### 4.2 Result Page Display
- [ ] **Scores Section** appears at top:
  - Stress-Score card with numeric value
  - Schlaf-Score card with numeric value
  - Risiko-Einschätzung badge (low/moderate/high)
- [ ] **AMY Interpretation** section appears:
  - "Deine persönliche Einordnung" heading
  - AMY badge visible if report text exists
  - Text is readable and properly formatted
- [ ] **Dynamic Content Blocks** appear below AMY:
  - "Ihre Ergebnisse verstehen" block
  - "Selbstfürsorge-Empfehlungen" block
  - Content is properly styled (borders, padding, shadows)
- [ ] **Navigation Buttons** at bottom:
  - "Meinen Verlauf ansehen" button (blue, prominent)
  - "Neuen Fragebogen starten" link (smaller, underlined)

#### 4.3 Content Rendering
- [ ] **Markdown Formatting** is correct:
  - Headings (H1, H2, H3) properly sized and bold
  - Lists (bullet and numbered) properly indented
  - Bold text (`**text**`) renders bold
  - Links are blue and clickable
  - Blockquotes have left border
  - Line spacing is comfortable to read
- [ ] **Sections** (if applicable):
  - Sections appear in correct order (by order_index)
  - Each section has proper heading
  - Section content is properly formatted
- [ ] **Mobile Responsive**:
  - Content blocks stack vertically on mobile
  - Text is readable without horizontal scroll
  - Buttons are easily tappable

#### 4.4 Edge Cases
- [ ] **No Content Scenario**:
  - Temporarily set all result pages to draft status
  - Reload result page
  - Verify: No content blocks appear, but page doesn't crash
  - Revert: Set pages back to published

- [ ] **Empty Content**:
  - Create a result page with minimal/empty markdown
  - Verify: Page renders without errors, just shows empty box

- [ ] **Very Long Content**:
  - Create/edit a page with 10+ sections or very long text
  - Verify: Page is scrollable, no layout breaks

### ✅ 5. Performance Checks

- [ ] **Page Load Time**:
  - Open DevTools Network tab
  - Reload result page
  - Content-resolver request completes in < 500ms
  - Total page load < 2 seconds (on decent connection)

- [ ] **No Console Errors**:
  - Open browser console
  - Navigate through assessment to result page
  - Verify: No red error messages
  - Yellow warnings are acceptable

### ✅ 6. Content Management Testing

#### 6.1 Adding New Content
- [ ] Create a new result page via SQL or migration
- [ ] Set category='result', status='published'
- [ ] Reload result page
- [ ] Verify: New content appears in priority order

#### 6.2 Modifying Content
- [ ] Edit an existing result page's markdown
- [ ] Reload result page
- [ ] Verify: Changes appear immediately

#### 6.3 Priority Ordering
- [ ] Set different priority values (e.g., 90, 80, 70)
- [ ] Reload result page
- [ ] Verify: Content appears in descending priority order

### ✅ 7. Accessibility Checks

- [ ] **Keyboard Navigation**:
  - Tab through all interactive elements
  - Verify: Focus is visible on all buttons/links
  - Enter/Space activates buttons

- [ ] **Screen Reader** (if available):
  - Use NVDA/JAWS/VoiceOver
  - Verify: Headings are announced correctly
  - Content flows logically

- [ ] **Color Contrast**:
  - Text on white background is readable
  - Risk level badges have sufficient contrast

### ✅ 8. Integration Testing

- [ ] **With Other Features**:
  - Complete assessment, view result, then view history
  - Verify: Result page accessible from history
  - Navigate back to result from history
  - Verify: Content still loads correctly

- [ ] **Multiple Assessments**:
  - Complete 2-3 assessments in a row
  - View each result page
  - Verify: Content is consistent across all result pages

### ✅ 9. Security Checks

- [ ] **Authentication Required**:
  - Logout and try accessing result page directly
  - Should redirect to login or show auth error

- [ ] **No SQL Injection**:
  - Try malicious query params: `?funnel='; DROP TABLE content_pages; --`
  - Verify: No database error, request fails gracefully

- [ ] **XSS Protection**:
  - Add content with `<script>alert('XSS')</script>` in markdown
  - Verify: Script does not execute, appears as text

### ✅ 10. Documentation Review

- [ ] README.md mentions F8 feature
- [ ] F8_IMPLEMENTATION_SUMMARY.md is complete and accurate
- [ ] F8_QUICKSTART.md examples are tested and working
- [ ] Code comments are clear and helpful

## Sign-Off

**Tested by:** ________________________  
**Date:** ________________________  
**Environment:** [ ] Local [ ] Staging [ ] Production  
**Result:** [ ] Pass [ ] Fail (see notes)  

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

## Issues Found

| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| Example: Content not loading | High | Fixed | Added error handling |
| | | | |
| | | | |

## Deployment Checklist

After all tests pass:

- [ ] Merge PR to main branch
- [ ] Apply database migration to production
- [ ] Deploy application
- [ ] Smoke test in production:
  - Complete one assessment
  - Verify result page loads with content
  - Check browser console for errors
- [ ] Monitor for 24 hours:
  - Check error logs
  - Monitor page load times
  - Verify no user-reported issues

## Rollback Plan

If issues are found in production:

1. **Quick Fix** (if minor):
   - Set problematic content pages to status='draft'
   - Content will disappear but page still works

2. **Full Rollback** (if major):
   - Revert code changes
   - Redeploy previous version
   - Content in database remains (no data loss)
   - Can re-enable after fix

## Support Contacts

- **Technical Issues**: [Your team contact]
- **Content Issues**: [Content team contact]
- **Database Issues**: [DBA contact]
