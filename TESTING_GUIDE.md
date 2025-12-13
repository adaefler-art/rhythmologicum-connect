# Testing Guide: Patient Funnel UI Fixes

This document provides guidance for testing the fixes implemented for broken tables and inconsistent dark mode in patient funnel content pages.

## Issues Fixed

### Issue 1: Broken Table Rendering
**Problem**: Tables in content pages were rendering with minimal width, making content unreadable.

**Fixed in**: `app/components/MarkdownRenderer.tsx`

### Issue 2: Inconsistent Dark Mode
**Problem**: Dark mode toggle behavior was inconsistent with OS/browser dark mode settings, causing visual inconsistencies.

**Fixed in**: 
- `lib/contexts/ThemeContext.tsx`
- `app/layout.tsx`

## Testing Checklist

### A) Table Rendering Tests

#### Desktop Testing
1. **Navigate to content pages**:
   - Go to `/patient/funnel/stress-assessment/content/intro-vorbereitung`
   - Any other content pages with tables

2. **Verify table appearance**:
   - [ ] Tables use full available width
   - [ ] Table headers have proper background color and styling
   - [ ] Table cells have proper padding (4 on all sides)
   - [ ] Borders are visible and consistent
   - [ ] Text is readable and properly aligned
   - [ ] No horizontal overflow without scroll

3. **Test horizontal overflow** (if table is very wide):
   - [ ] Horizontal scrollbar appears when needed
   - [ ] Scrolling works smoothly
   - [ ] Content is not cut off

#### Mobile Testing
1. **Navigate to same content pages on mobile**
2. **Verify responsive behavior**:
   - [ ] Tables display correctly within mobile viewport
   - [ ] Horizontal scroll works if table is too wide
   - [ ] Text remains readable at mobile sizes
   - [ ] No layout breaking

### B) Dark Mode Tests

#### Test 1: App Dark Mode Toggle
1. **Start in light mode** (clear localStorage if needed)
2. **Click the theme toggle button** in the app UI
3. **Verify**:
   - [ ] Theme changes immediately (no flash)
   - [ ] Background changes to dark
   - [ ] Text changes to light colors
   - [ ] Tables render correctly in dark mode (borders, backgrounds)
   - [ ] All UI elements have proper dark mode styling

#### Test 2: Browser/OS Dark Mode
1. **Clear localStorage**: `localStorage.removeItem('theme')`
2. **Set OS to dark mode** (System Preferences/Settings)
3. **Reload the page**
4. **Verify**:
   - [ ] Page loads in dark mode immediately (no flash)
   - [ ] No light mode flash during page load
   - [ ] Theme is consistent throughout the page

#### Test 3: System Dark Mode to Light Mode Switch
1. **Clear localStorage**: `localStorage.removeItem('theme')`
2. **Start with OS in dark mode**, load the page
3. **Switch OS to light mode** (without reloading)
4. **Verify**:
   - [ ] App theme changes to light automatically
   - [ ] Change is smooth and immediate

#### Test 4: User Preference Override
1. **Set OS to dark mode**
2. **Use app toggle to switch to light mode**
3. **Reload the page**
4. **Verify**:
   - [ ] Page loads in light mode (user preference overrides OS)
   - [ ] Theme persists across reloads

5. **Switch OS between light/dark**
6. **Verify**:
   - [ ] App stays in light mode (respects user preference)

#### Test 5: No Flash on Initial Load
1. **Clear all caches and localStorage**
2. **Set OS to dark mode**
3. **Load the page for the first time**
4. **Verify**:
   - [ ] No white flash before dark mode kicks in
   - [ ] Page renders directly in dark mode
   - [ ] Theme is applied before React hydration

### C) Regression Tests

Test that the fixes don't break existing functionality:

1. **Patient Assessment Flow**:
   - [ ] Assessment pages load correctly
   - [ ] Question navigation works
   - [ ] Answer submission works
   - [ ] Results page displays correctly

2. **Patient History**:
   - [ ] History page displays correctly in both themes
   - [ ] Cards and lists are properly styled
   - [ ] Dark mode works throughout

3. **Clinician Dashboard**:
   - [ ] Dashboard loads correctly
   - [ ] Tables in clinician views work properly
   - [ ] Dark mode works in clinician area

4. **Other Content Pages**:
   - [ ] All markdown content renders correctly
   - [ ] Images, lists, code blocks work
   - [ ] Links are visible and clickable in both themes

## Expected Visual Results

### Tables in Light Mode
- **Headers**: Light gray background (#f8fafc), dark text
- **Cells**: White background, slate text, light borders
- **Borders**: Visible but subtle (slate-200)
- **Full width**: Tables expand to container width

### Tables in Dark Mode
- **Headers**: Dark background (#1e293b), light text
- **Cells**: Dark background, light text, dark borders
- **Borders**: Visible dark borders (slate-700)
- **Full width**: Same as light mode

### Dark Mode Consistency
- Same visual appearance whether activated via:
  - App toggle button
  - OS/Browser dark mode setting
- No visual difference between the two methods
- Theme persists across page reloads

## Common Issues to Watch For

1. **Table too narrow**: If you still see narrow tables, check browser cache
2. **Flash on load**: If you see a light flash in dark mode, check that the inline script in layout.tsx is running
3. **Theme not persisting**: Check localStorage and ensure user preference is stored
4. **System preference not working**: Ensure no explicit theme is stored in localStorage

## Browser Testing

Test on these browsers:
- [ ] Chrome/Edge (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Safari (iOS/Mobile)
- [ ] Chrome (Android/Mobile)

## Performance Notes

The inline script in layout.tsx adds ~200 bytes to the initial HTML payload but is necessary to prevent theme flash. This is a standard pattern for theme management in SSR applications.

## Rollback Procedure

If issues are found:
1. Revert commit: `16c0261`
2. Tables will revert to previous behavior (potentially narrow)
3. Dark mode will revert to previous behavior (potential flash)
