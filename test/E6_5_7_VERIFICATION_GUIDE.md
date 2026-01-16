# E6.5.7 Content Page Rendering - Verification Guide

## Overview

This guide provides step-by-step instructions for manually verifying the E6.5.7 implementation.

## Prerequisites

- Local Supabase instance running
- Application running in development mode
- Test user account created

## Test Data Setup

1. **Seed test content pages:**

```bash
# From the project root
supabase db reset  # Reset database
psql -h localhost -p 54322 -U postgres -d postgres -f test/e6-5-7-content-pages-seed.sql
```

Or manually insert via Supabase Studio:
- Navigate to http://localhost:54323
- Go to Table Editor > content_pages
- Use the provided SQL script

## Manual Test Cases

### AC1: Unknown slug → 404 (not 500)

**Test Case 1.1: Non-existent content page**
1. Navigate to: http://localhost:3000/patient/content/this-does-not-exist
2. **Expected**: 404 Not Found page
3. **Expected**: No 500 error or server crash
4. **Expected**: Console shows: `[CONTENT_PAGE] Content page not found`

**Test Case 1.2: Draft content page (not published)**
1. Navigate to: http://localhost:3000/patient/content/draft-page
2. **Expected**: 404 Not Found page (draft pages should not be accessible)

### AC2: No PHI, no user-specific data required

**Test Case 2.1: Content is user-agnostic**
1. Login as any test user
2. Navigate to: http://localhost:3000/patient/content/stress-verstehen
3. **Expected**: Content page renders successfully
4. **Expected**: No user-specific data displayed (name, email, etc.)
5. **Expected**: Same content shown to all users

**Test Case 2.2: Safe markdown rendering (XSS protection)**
1. Navigate to: http://localhost:3000/patient/content/stress-verstehen
2. **Expected**: Markdown is rendered as HTML (headings, lists, tables, etc.)
3. **Expected**: No raw markdown syntax visible
4. **Expected**: External links have `rel="noopener noreferrer"` and `target="_blank"`

Verify in browser DevTools:
```javascript
// Check external links have security attributes
document.querySelectorAll('a[href^="http"]').forEach(link => {
  console.log(link.getAttribute('rel')); // Should be "noopener noreferrer"
  console.log(link.getAttribute('target')); // Should be "_blank"
});
```

### AC3: Back navigation to dashboard

**Test Case 3.1: Back button navigation**
1. Navigate to: http://localhost:3000/patient/content/stress-verstehen
2. **Expected**: "Zurück zum Dashboard" button visible at top
3. Click the back button
4. **Expected**: Navigate to /patient/dashboard

**Test Case 3.2: Navigation flow**
1. Start at: http://localhost:3000/patient/dashboard
2. Click a content tile (if available)
3. **Expected**: Navigate to content page
4. Click back button
5. **Expected**: Return to dashboard

## Visual Verification

### Expected Layout

**Content Page Structure:**
```
┌─────────────────────────────────────┐
│  ← Zurück zum Dashboard             │
├─────────────────────────────────────┤
│  Title (h1, large, bold)            │
│  Excerpt (if available)             │
│                                      │
│  Markdown Content:                  │
│  • Headings (h1-h6)                 │
│  • Paragraphs                       │
│  • Lists (ordered/unordered)        │
│  • Tables (responsive)              │
│  • Links                            │
│  • Blockquotes                      │
│  • Code blocks                      │
└─────────────────────────────────────┘
```

### Styling Verification

Check that the following are properly styled:

- [ ] Page background: Light mode (slate-50) / Dark mode (slate-900)
- [ ] Content card: White background with rounded corners and shadow
- [ ] Typography: Prose styling applied (headings, paragraphs, etc.)
- [ ] Back button: Slate color with hover effect
- [ ] Tables: Responsive with horizontal scroll if needed
- [ ] Links: Styled appropriately (underlined, colored)

## Test Content Pages

### 1. Stress verstehen (stress-verstehen)
- **URL**: `/patient/content/stress-verstehen`
- **Features**: Headings, lists, tables, blockquotes, internal/external links
- **Category**: info
- **Should render**: ✅

### 2. Resilienztechniken (resilienztechniken)
- **URL**: `/patient/content/resilienztechniken`
- **Features**: Numbered lists, links, emphasis
- **Category**: action
- **Should render**: ✅

### 3. Schlafhygiene (schlafhygiene)
- **URL**: `/patient/content/schlafhygiene`
- **Features**: Tables, lists, emojis, links
- **Category**: info
- **Should render**: ✅

### 4. Draft Page (draft-page)
- **URL**: `/patient/content/draft-page`
- **Status**: draft
- **Should render**: ❌ (404)

## Browser Console Checks

### Successful Page Load
```
[CONTENT_PAGE] Content page loaded successfully {
  slug: 'stress-verstehen',
  title: 'Stress verstehen'
}
```

### 404 Not Found
```
[CONTENT_PAGE] Content page not found { slug: 'this-does-not-exist' }
```

### No Errors
- No JavaScript errors in console
- No React warnings
- No hydration mismatches

## Security Verification

### XSS Protection Test

**Manual Test:**
1. Insert malicious content via Supabase Studio:
```sql
UPDATE content_pages 
SET body_markdown = '<script>alert("XSS")</script>\n\nSafe content here.'
WHERE slug = 'stress-verstehen';
```

2. Navigate to: http://localhost:3000/patient/content/stress-verstehen
3. **Expected**: No alert popup
4. **Expected**: Script tags escaped or removed
5. **Expected**: "Safe content here." is visible

6. Restore original content:
```sql
-- Run the seed script again to restore
```

## Performance Checks

- [ ] Page loads in < 1 second (on localhost)
- [ ] No unnecessary re-renders
- [ ] No memory leaks on navigation

## Responsive Design

Test on different screen sizes:

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Expected**: Content is readable and properly laid out on all sizes

## Checklist

### Functionality
- [ ] Published content pages render correctly
- [ ] Draft content pages return 404
- [ ] Unknown slugs return 404 (not 500)
- [ ] Markdown is rendered as HTML
- [ ] External links have security attributes
- [ ] Back button navigates to dashboard
- [ ] No PHI displayed
- [ ] No user-specific data required

### Security
- [ ] HTML in markdown is escaped
- [ ] No XSS vulnerabilities
- [ ] Authentication required (unauthenticated users redirected)

### Performance
- [ ] Fast page load
- [ ] No console errors
- [ ] Smooth navigation

### Design
- [ ] Proper styling (light/dark mode)
- [ ] Responsive layout
- [ ] Readable typography
- [ ] Accessible (keyboard navigation, ARIA)

## Troubleshooting

### Page shows raw markdown
- Check that ReactMarkdown is imported correctly
- Verify `skipHtml: true` is set

### Back button doesn't work
- Check router is initialized
- Verify button click handler is bound

### 500 error instead of 404
- Check error handling in page.tsx
- Verify `notFound()` is called correctly

### Content not loading
- Verify test data is seeded
- Check database connection
- Verify content status is 'published'

## Conclusion

All test cases should pass for E6.5.7 to be considered complete.
