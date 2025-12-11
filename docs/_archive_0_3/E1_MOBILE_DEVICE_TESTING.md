# E1 — Mobile Device Testing Guide

**Epic:** E (Testing & QA)  
**Version:** v0.3  
**Status:** Active Testing  
**Last Updated:** 2024-12-11

---

## 📱 Overview

This document provides a comprehensive testing guide for validating the Mobile Funnel UI on real iPhone and Android devices. The testing covers all critical flows including navigation, save-on-tap, content pages, and touch interactions.

**Estimated Testing Time:** 3-4 hours per device  
**Target Devices:** iPhone SE, current iPhone model, current Android phone (Samsung or comparable)

---

## 🎯 Objectives

1. **Validate Core Functionality** - Ensure all funnel features work on mobile devices
2. **Identify Device-Specific Issues** - Document bugs specific to iOS/Android
3. **Test Touch Interactions** - Verify swipe, tap, and touch gestures
4. **Assess Performance** - Measure load times and interaction responsiveness
5. **Check UI/UX Quality** - Ensure mobile-optimized design works correctly

---

## 📋 Test Matrix

### Devices to Test

| Device Type | Model | OS Version | Browser | Priority |
|-------------|-------|------------|---------|----------|
| **iPhone** | iPhone SE (2nd/3rd gen) | iOS 15+ | Safari | High |
| **iPhone** | iPhone 14/15 Pro | iOS 17+ | Safari | High |
| **Android** | Samsung Galaxy S22+ | Android 12+ | Chrome | High |
| **Android** | Google Pixel 7+ | Android 13+ | Chrome | Medium |
| **Tablet** | iPad (9th gen+) | iPadOS 15+ | Safari | Low |
| **Tablet** | Android Tablet | Android 11+ | Chrome | Low |

### Screen Sizes to Validate

- **Small Phone:** 320px - 375px width (iPhone SE)
- **Standard Phone:** 375px - 414px width (iPhone 14)
- **Large Phone:** 414px - 428px width (iPhone 14 Pro Max)
- **Tablet:** 768px - 1024px width (iPad)

### Network Conditions

Test under various network conditions:
- ✅ **WiFi** - Fast, stable connection
- ✅ **4G/LTE** - Good mobile network
- ✅ **3G** - Slower connection (optional)
- ✅ **Airplane Mode → Online** - Connection restoration

---

## 🧪 Test Flows

### Flow 1: Funnel Start & Question Display

**Goal:** Verify that users can start a funnel and questions display correctly on mobile.

#### Test Steps

1. **Open Application**
   - Navigate to production/staging URL on mobile device
   - Log in as patient user
   - Navigate to `/patient/stress-check`

2. **Verify Initial Display**
   - [ ] Funnel loads without errors
   - [ ] Mobile question card is rendered (not desktop layout)
   - [ ] Header shows funnel title correctly
   - [ ] Progress indicator is visible (question 1 of X)
   - [ ] Question text is readable (minimum 16px font)
   - [ ] Answer options are fully visible
   - [ ] No horizontal scrolling required

3. **Check Responsive Layout**
   - [ ] Question card fills viewport width appropriately
   - [ ] All text is within safe areas (not cut off)
   - [ ] Buttons are minimum 44px tall (thumb-friendly)
   - [ ] Adequate spacing between interactive elements

#### Expected Results

- ✅ Mobile-optimized card layout is active
- ✅ All content is readable without zooming
- ✅ No layout breaks or overlapping elements
- ✅ Page loads within 3 seconds on good connection

#### Screenshots

**Required Screenshots:**
- Initial question display (portrait)
- Progress indicator close-up
- Answer options layout

#### Device-Specific Notes

**iPhone:**
- [ ] Safe area insets respected (notch/Dynamic Island)
- [ ] No zoom on input focus (16px minimum font)
- [ ] Safari toolbar doesn't interfere

**Android:**
- [ ] Navigation bar doesn't cover content
- [ ] Chrome address bar auto-hide works correctly
- [ ] No back button conflicts

---

### Flow 2: Answer Selection & Save-on-Tap

**Goal:** Verify that answer selection and automatic saving work correctly.

#### Test Steps

1. **Select Answer (Scale Question)**
   - [ ] Tap on an answer option (e.g., value 3)
   - [ ] Visual feedback appears immediately (color change, scale effect)
   - [ ] Save indicator appears below answer buttons
   - [ ] "Speichert..." message shows briefly
   - [ ] "Gespeichert" confirmation appears after ~500ms
   - [ ] Confirmation auto-hides after 1.5 seconds

2. **Change Answer**
   - [ ] Tap different answer option (e.g., value 4)
   - [ ] Previous selection is deselected
   - [ ] New selection is highlighted
   - [ ] Save indicator appears again
   - [ ] Updated answer is saved (verify in database or after submission)

3. **Network Error Simulation** (Optional)
   - [ ] Enable airplane mode
   - [ ] Try to select answer
   - [ ] Error message appears: "Netzwerkfehler..."
   - [ ] "Erneut versuchen" button is visible
   - [ ] Disable airplane mode
   - [ ] Tap retry button
   - [ ] Answer saves successfully

4. **Rapid Tap Test**
   - [ ] Quickly tap same answer 3-4 times
   - [ ] Only one save operation occurs (no duplicates)
   - [ ] UI remains stable, no flickering

#### Expected Results

- ✅ Answer selection is immediate (<100ms visual feedback)
- ✅ Save operation completes within 500ms
- ✅ Error handling is graceful with clear messages
- ✅ No duplicate saves in database
- ✅ UI remains responsive during save

#### Screenshots

**Required Screenshots:**
- Answer selected with save indicator
- "Gespeichert" confirmation message
- Error state with retry button (if testable)

#### Device-Specific Notes

**iPhone:**
- [ ] Touch targets work correctly (no miss-taps)
- [ ] Haptic feedback on selection (if implemented)
- [ ] No iOS keyboard issues

**Android:**
- [ ] Touch events fire reliably
- [ ] No Android soft keyboard issues
- [ ] Save indicator doesn't conflict with system UI

---

### Flow 3: Navigation (Buttons & Swipe)

**Goal:** Verify all navigation methods work correctly on mobile.

#### Test Steps: Button Navigation

1. **Next Button**
   - [ ] "Weiter →" button is visible after answering
   - [ ] Button is disabled before answering
   - [ ] Button is enabled after answering
   - [ ] Tapping button navigates to next question
   - [ ] Smooth transition (no flash)
   - [ ] Progress indicator updates correctly

2. **Previous Button**
   - [ ] "Zurück" button appears on questions 2+
   - [ ] Tapping button returns to previous question
   - [ ] Previous answer is still selected
   - [ ] Progress indicator updates correctly
   - [ ] Smooth transition

3. **Last Question → Submit**
   - [ ] Navigate to last question
   - [ ] Button text changes to "✓ Abschließen"
   - [ ] Tapping button submits assessment
   - [ ] Loading state appears (spinner)
   - [ ] Redirect to results page occurs

#### Test Steps: Swipe Navigation

1. **Swipe Left (Next)**
   - [ ] Swipe left on answered question
   - [ ] Question slides out to the left
   - [ ] Next question slides in from right
   - [ ] Animation is smooth (60 FPS subjectively)
   - [ ] Progress updates correctly

2. **Swipe Right (Previous)**
   - [ ] Swipe right on question 2+
   - [ ] Question slides out to the right
   - [ ] Previous question slides in from left
   - [ ] Animation is smooth
   - [ ] Previous answer is retained

3. **Swipe Constraints**
   - [ ] Cannot swipe right on first question (visual resistance)
   - [ ] Cannot swipe left on unanswered question (snaps back)
   - [ ] Cannot swipe left on last question without answering (snaps back)

4. **Partial Swipe (Snap Back)**
   - [ ] Start swiping but release before threshold (~100px)
   - [ ] Question snaps back to center smoothly
   - [ ] No navigation occurs
   - [ ] UI remains stable

5. **Swipe During Save**
   - [ ] Select answer (save starts)
   - [ ] Immediately try to swipe
   - [ ] Swipe should work (save and swipe independent)
   - [ ] No errors or UI glitches

#### Expected Results

**Button Navigation:**
- ✅ All buttons respond within 100ms
- ✅ Transitions are smooth and consistent
- ✅ Button states (disabled/enabled) are clear
- ✅ No navigation bugs or stuck states

**Swipe Navigation:**
- ✅ Swipe threshold is comfortable (~100px or 500px/s velocity)
- ✅ Animations are 60 FPS on modern devices
- ✅ Constraints prevent invalid navigation
- ✅ Snap-back animation is smooth
- ✅ No conflicts between swipe and other gestures

#### Screenshots

**Required Screenshots:**
- "Weiter" button enabled state
- "Zurück" button on second question
- "Abschließen" button on last question
- Mid-swipe screenshot (if possible)

#### Device-Specific Notes

**iPhone:**
- [ ] Swipe doesn't conflict with Safari's swipe-to-go-back
- [ ] Edge swipe from left edge goes back in Safari (expected)
- [ ] Mid-screen swipe changes questions (expected)

**Android:**
- [ ] Swipe doesn't conflict with Chrome's navigation
- [ ] Back button behavior is appropriate
- [ ] Gesture navigation doesn't interfere (if enabled)

---

### Flow 4: Assessment Completion & Results

**Goal:** Verify that assessment can be completed and results display correctly.

#### Test Steps

1. **Complete All Questions**
   - [ ] Answer all questions in the funnel
   - [ ] Navigate through each question (mix of buttons and swipes)
   - [ ] Verify all answers are saved (check periodically)

2. **Submit Assessment**
   - [ ] On last question, tap "Abschließen"
   - [ ] Loading spinner appears
   - [ ] Wait for processing (up to 5 seconds)
   - [ ] Redirect to results page occurs

3. **Results Display**
   - [ ] Results page loads successfully
   - [ ] Stress score is displayed (e.g., "68/100")
   - [ ] Sleep score is displayed
   - [ ] Risk level is shown (niedrig/moderat/hoch)
   - [ ] Scores are plausible based on answers

4. **AMY Report** (if enabled)
   - [ ] Scroll down to AMY section
   - [ ] "Deine persönliche Einordnung von AMY" header is visible
   - [ ] Personalized AMY text is displayed
   - [ ] Text mentions stress/sleep (contextually relevant)
   - [ ] Text is readable on mobile (font size, line height)

5. **Content Blocks** (if present)
   - [ ] Scroll down to content blocks
   - [ ] Content pages are rendered correctly
   - [ ] Markdown formatting is preserved
   - [ ] Links work correctly
   - [ ] No layout breaks

#### Expected Results

- ✅ Assessment completes without errors
- ✅ Results page loads within 5 seconds
- ✅ All scores are displayed correctly
- ✅ AMY report is personalized and relevant (if enabled)
- ✅ Content blocks are properly formatted
- ✅ Page is fully scrollable without issues

#### Screenshots

**Required Screenshots:**
- Results page - scores section (top)
- AMY report section (if enabled)
- Content blocks section (if present)
- Full page scroll (multiple screenshots if needed)

#### Device-Specific Notes

**iPhone:**
- [ ] Safari's "Reader Mode" doesn't interfere
- [ ] Safe area respected at bottom
- [ ] Pull-to-refresh doesn't cause issues

**Android:**
- [ ] Chrome's translate prompt doesn't block content (if appears)
- [ ] Scrolling is smooth
- [ ] System bars don't hide content

---

### Flow 5: Content Pages Access

**Goal:** Verify that content pages can be accessed and displayed correctly on mobile.

#### Test Steps

1. **Access from Funnel**
   - [ ] Look for info icons or "Mehr erfahren" links during funnel
   - [ ] Tap link to content page
   - [ ] Content page loads in same tab or new tab (note which)

2. **Content Page Display**
   - [ ] Page header is visible
   - [ ] Markdown content is rendered correctly
   - [ ] Headings have clear hierarchy (H1 > H2 > H3)
   - [ ] Lists are formatted properly
   - [ ] Links are tappable (minimum 44px)
   - [ ] Code blocks are horizontally scrollable (if present)
   - [ ] Images fit within viewport (if present)

3. **Navigation from Content Page**
   - [ ] "Zurück" or back button is present
   - [ ] Tapping back returns to funnel or results page
   - [ ] Funnel state is preserved (if returning to funnel)

4. **Multiple Content Pages**
   - [ ] Access multiple content pages in sequence
   - [ ] Verify each loads correctly
   - [ ] Navigation history works correctly

#### Expected Results

- ✅ Content pages load within 2 seconds
- ✅ All markdown elements render correctly
- ✅ Page is readable without zooming
- ✅ Navigation back to funnel works
- ✅ No layout breaks or horizontal scrolling

#### Screenshots

**Required Screenshots:**
- Content page with heading and paragraph
- Content page with list (if present)
- Content page with link (if present)

#### Device-Specific Notes

**iPhone:**
- [ ] Long-press link shows preview (Safari feature)
- [ ] Text selection works if needed
- [ ] Scrolling is smooth

**Android:**
- [ ] Chrome's "Lite Mode" doesn't interfere (if enabled)
- [ ] Text selection works if needed
- [ ] Scrolling is smooth

---

### Flow 6: History & Patient Portal

**Goal:** Verify that patient can access their assessment history on mobile.

#### Test Steps

1. **Navigate to History**
   - [ ] From results page or main navigation
   - [ ] Navigate to `/patient/history`
   - [ ] Page loads successfully

2. **History Display**
   - [ ] List of assessments is displayed
   - [ ] Most recent assessment is at top (or as documented)
   - [ ] Each entry shows:
     - Date/timestamp
     - Stress score
     - Sleep score
     - Risk level
   - [ ] Entries are in card layout (mobile-optimized)
   - [ ] Cards are tappable (if detail view implemented)

3. **Empty History** (for new user)
   - [ ] Create new test user
   - [ ] Navigate to history
   - [ ] Friendly empty state message appears
   - [ ] No errors or "undefined" values
   - [ ] Prompt to start assessment is visible

4. **Export Functionality** (if implemented)
   - [ ] Look for "Exportieren" or "Als JSON exportieren" button
   - [ ] Tap export button
   - [ ] JSON file downloads
   - [ ] File can be opened and validated

#### Expected Results

- ✅ History page loads within 2 seconds
- ✅ All assessment entries are displayed correctly
- ✅ Mobile layout is clear and readable
- ✅ Empty state is user-friendly
- ✅ Export works (if implemented)

#### Screenshots

**Required Screenshots:**
- History page with assessment entries
- Empty history state (if testable)
- Export functionality (if implemented)

#### Device-Specific Notes

**iPhone:**
- [ ] Downloaded files go to Files app or Safari Downloads
- [ ] Dates are formatted correctly for locale

**Android:**
- [ ] Downloaded files go to Downloads folder
- [ ] Chrome download prompt works correctly

---

## 🐛 Bug Reporting Template

When you find an issue, document it using this template:

### Bug Report Template

```markdown
## Bug Title: [Short descriptive title]

**Severity:** [Critical / High / Medium / Low]
**Device:** [iPhone SE iOS 15 / Samsung Galaxy S22 Android 12 / etc.]
**Browser:** [Safari / Chrome Mobile]
**Screen Size:** [375x667 / etc.]

### Steps to Reproduce:
1. Step one
2. Step two
3. Step three

### Expected Behavior:
What should happen

### Actual Behavior:
What actually happened

### Screenshots/Video:
[Attach screenshots or screen recording]

### Console Errors (if any):
```
Error messages from browser console (if available)
```

### Workaround (if found):
Any temporary solution

### Additional Context:
- Network condition: WiFi / 4G / etc.
- Happened on: First try / Consistently / Intermittently
- Related issues: Link to similar issues if any
```

---

## 📸 Screenshot & Recording Guidelines

### Required Screenshots per Device

For each device type (iPhone, Android), capture:

1. **Initial Funnel View** - First question loaded
2. **Answer Selected** - With save indicator visible
3. **Mid-Swipe** (if possible) - Shows animation in progress
4. **Results Page** - Full results view (may need multiple screenshots)
5. **Content Page** - Example content page display
6. **History Page** - Assessment history list

### Screen Recording Guidelines

**Tools:**
- **iPhone:** Built-in Screen Recording (Control Center)
- **Android:** Built-in Screen Recording (Quick Settings)

**What to Record:**
- Complete funnel flow (start to finish)
- Swipe navigation demonstration
- Save-on-tap in action
- Any bugs or issues encountered

**Video Settings:**
- Duration: 30 seconds - 2 minutes per flow
- Quality: 1080p if possible
- Format: MP4 or native device format

### Organizing Screenshots

Create folder structure:
```
screenshots/
  iphone-se/
    01-initial-funnel.png
    02-answer-selected.png
    03-results-page.png
    ...
  iphone-14/
    01-initial-funnel.png
    ...
  samsung-s22/
    01-initial-funnel.png
    ...
  bugs/
    bug-001-layout-break.png
    bug-002-save-error.png
    ...
```

---

## ✅ Acceptance Criteria Verification

### Core Criteria (from issue)

- [ ] **All critical flows are playable on tested devices**
  - Funnel start ✅ / ⚠️ / ❌
  - Question answering ✅ / ⚠️ / ❌
  - Results viewing ✅ / ⚠️ / ❌
  - Content pages ✅ / ⚠️ / ❌

- [ ] **No UI-blocking unhandled errors**
  - No JavaScript errors that stop user progress
  - All error messages are user-friendly
  - Errors are recoverable (retry mechanisms work)

- [ ] **Found bugs are either fixed or documented**
  - All bugs have GitHub issues created
  - Critical bugs are fixed before release
  - Non-critical bugs are documented for future releases

### Additional Quality Criteria

- [ ] **Performance is acceptable**
  - Page loads < 3 seconds
  - Interactions < 100ms response time
  - Animations are smooth (subjectively 60 FPS)

- [ ] **Touch interactions work correctly**
  - All buttons are tappable (44px minimum)
  - Swipe gestures are reliable
  - No accidental mis-taps

- [ ] **Responsive design is correct**
  - No horizontal scrolling
  - All content fits viewport
  - Safe areas respected (notch, navigation bars)

---

## 📊 Testing Checklist Summary

### Quick Checklist (Essential Tests)

- [ ] **iPhone Safari:** Complete one full funnel flow
- [ ] **Android Chrome:** Complete one full funnel flow
- [ ] **iPhone Safari:** Test swipe navigation (5+ swipes)
- [ ] **Android Chrome:** Test swipe navigation (5+ swipes)
- [ ] **iPhone Safari:** Test save-on-tap (3+ answers)
- [ ] **Android Chrome:** Test save-on-tap (3+ answers)
- [ ] **iPhone Safari:** View results and content pages
- [ ] **Android Chrome:** View results and content pages
- [ ] **Both Devices:** Check for console errors
- [ ] **Both Devices:** Test under WiFi and 4G

### Comprehensive Checklist (All Tests)

**Flow 1: Funnel Start**
- [ ] iPhone SE - Portrait
- [ ] iPhone 14 - Portrait
- [ ] Samsung S22 - Portrait
- [ ] Tablet - Landscape (optional)

**Flow 2: Save-on-Tap**
- [ ] iPhone - Single answer save
- [ ] iPhone - Answer change
- [ ] iPhone - Rapid taps
- [ ] Android - Single answer save
- [ ] Android - Answer change
- [ ] Android - Rapid taps

**Flow 3: Navigation**
- [ ] iPhone - Button navigation
- [ ] iPhone - Swipe navigation
- [ ] iPhone - Swipe constraints
- [ ] Android - Button navigation
- [ ] Android - Swipe navigation
- [ ] Android - Swipe constraints

**Flow 4: Results**
- [ ] iPhone - Results display
- [ ] iPhone - AMY report
- [ ] iPhone - Content blocks
- [ ] Android - Results display
- [ ] Android - AMY report
- [ ] Android - Content blocks

**Flow 5: Content Pages**
- [ ] iPhone - Content page access
- [ ] iPhone - Markdown rendering
- [ ] iPhone - Navigation back
- [ ] Android - Content page access
- [ ] Android - Markdown rendering
- [ ] Android - Navigation back

**Flow 6: History**
- [ ] iPhone - History list
- [ ] iPhone - Empty state
- [ ] Android - History list
- [ ] Android - Empty state

---

## 🔍 Performance Monitoring

### Metrics to Collect

**Load Times:**
- Initial page load: ____ seconds
- Funnel start: ____ seconds
- Question transition: ____ ms
- Results page load: ____ seconds

**Interaction Times:**
- Answer tap to visual feedback: ____ ms
- Save operation: ____ ms
- Swipe animation: ____ ms
- Button tap to navigation: ____ ms

**Network Usage:**
- Initial bundle size: ____ KB
- API requests per question: ____ requests
- Total data for complete flow: ____ MB

### Performance Benchmarks

| Metric | Target | Good | Acceptable | Poor |
|--------|--------|------|------------|------|
| Initial Load | < 2s | < 3s | < 5s | > 5s |
| Question Transition | < 100ms | < 200ms | < 500ms | > 500ms |
| Save Operation | < 300ms | < 500ms | < 1s | > 1s |
| Swipe Animation | 60 FPS | 45-60 FPS | 30-45 FPS | < 30 FPS |

---

## 🚨 Critical Issues Checklist

Stop testing and escalate immediately if you encounter:

- [ ] **Complete app crash** - App becomes unresponsive
- [ ] **Data loss** - Answers are lost after submission
- [ ] **Infinite loading** - Process never completes
- [ ] **Security issue** - Exposed sensitive data
- [ ] **Login failure** - Cannot authenticate
- [ ] **Complete navigation failure** - Cannot proceed through funnel

---

## 📝 Test Report Template

After completing testing, use this template for the final report:

```markdown
# E1 Mobile Device Testing Report

## Test Summary
- **Date:** YYYY-MM-DD
- **Tester:** [Name]
- **Environment:** [Production / Staging URL]
- **Duration:** [X hours]

## Devices Tested
- [ ] iPhone SE (iOS X.X) - Safari
- [ ] iPhone 14 (iOS X.X) - Safari
- [ ] Samsung Galaxy S22 (Android X.X) - Chrome
- [ ] Other: ___________

## Overall Status
- [ ] ✅ All tests passed - Ready for production
- [ ] ⚠️ Minor issues found - Document for future fix
- [ ] ❌ Critical issues found - Requires immediate fix

## Test Results by Flow

### Flow 1: Funnel Start
- iPhone: ✅ Pass / ⚠️ Issues / ❌ Fail
- Android: ✅ Pass / ⚠️ Issues / ❌ Fail
- Notes: ___________

### Flow 2: Save-on-Tap
- iPhone: ✅ Pass / ⚠️ Issues / ❌ Fail
- Android: ✅ Pass / ⚠️ Issues / ❌ Fail
- Notes: ___________

[Continue for all flows...]

## Bugs Found

### Critical Bugs (must fix before release)
1. [Bug description with GitHub issue link]
2. [Bug description with GitHub issue link]

### High Priority Bugs (should fix soon)
1. [Bug description with GitHub issue link]
2. [Bug description with GitHub issue link]

### Medium/Low Priority Bugs (can defer)
1. [Bug description with GitHub issue link]
2. [Bug description with GitHub issue link]

## Performance Summary
- Average load time: ____ seconds
- Average interaction time: ____ ms
- Subjective smoothness: Excellent / Good / Fair / Poor

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Conclusion
[Overall assessment and recommendation for production readiness]

## Attachments
- Screenshots: [Link to folder]
- Screen recordings: [Link to folder]
- Console logs: [Link if captured]
```

---

## 🔗 Related Documentation

- **A1: Mobile Question Component** - `/docs/A1_MOBILE_QUESTION_COMPONENT.md`
- **A2: Swipe Navigation** - `/docs/A2_SWIPE_NAVIGATION.md`
- **Save-on-Tap Feature** - `/docs/SAVE_ON_TAP.md`
- **E4: Smoke Test** - `/docs/E4_SMOKE_TEST.md` (broader testing)
- **B6: Frontend Integration** - `/docs/B6_FRONTEND_INTEGRATION.md`
- **D1: Content Pages** - `/docs/D1_CONTENT_PAGES.md`

---

## 📞 Support & Questions

If you encounter issues during testing or have questions:

1. **Check existing documentation** - See related docs above
2. **Review GitHub issues** - Look for similar reported issues
3. **Create detailed bug report** - Use template above
4. **Contact development team** - For urgent/blocking issues

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-11 | Initial E1 mobile device testing guide created |

---

**Status:** Active Testing  
**Target Completion:** Before v0.3 production release  
**Assignee:** QA Team

---

*End of E1 Mobile Device Testing Guide*
