# E1 — Mobile Device Testing Tips & Tricks

**Quick reference guide for efficient mobile device testing**

---

## 🎯 Before You Start

### Preparation Checklist

- [ ] Charge device to 80%+ battery
- [ ] Clear browser cache and cookies
- [ ] Close all other browser tabs
- [ ] Disable battery saver mode (affects performance)
- [ ] Connect to stable WiFi for initial tests
- [ ] Enable developer mode (optional, for console access)
- [ ] Have screenshot/recording tools ready
- [ ] Have note-taking app ready
- [ ] Review test plan (E1_MOBILE_DEVICE_TESTING.md)

### Test Accounts

Create these accounts before testing:

**Patient Account:**
```
Email: test-patient-mobile-[yourname]@pilotpraxis.de
Password: TestMobile123!
```

**Second Patient Account (for empty state testing):**
```
Email: test-patient-new-[yourname]@pilotpraxis.de
Password: TestMobile123!
```

---

## 📱 Device-Specific Tips

### iPhone Testing

#### Accessing Browser Console (Safari)
1. On Mac: Enable Developer menu in Safari (Preferences → Advanced)
2. Connect iPhone via USB
3. Open Safari on Mac → Develop → [Your iPhone] → [Website]
4. Console errors will appear in Mac Safari's Web Inspector

#### Screen Recording
1. Add Screen Recording to Control Center
2. Settings → Control Center → Add Screen Recording
3. Swipe down from top-right → Tap record button
4. Recording saved to Photos app

#### Common iOS Issues to Watch For
- Zoom on input focus (check 16px minimum font size)
- Safe area issues (notch, Dynamic Island)
- Safari's pull-to-refresh interfering
- Swipe-to-go-back gesture conflicts

#### iOS Simulator (Mac Only)
For quick testing without physical device:
```bash
# Install Xcode from App Store
# Then run:
open -a Simulator

# Select device: Hardware → Device → iPhone SE/14/etc.
# Open Safari in simulator, navigate to app
```

### Android Testing

#### Accessing Browser Console (Chrome)
1. Enable Developer Options on Android:
   - Settings → About Phone → Tap Build Number 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Connect Android via USB to computer
4. On computer, open Chrome → `chrome://inspect`
5. Select your device, click "Inspect"
6. Console errors appear in Chrome DevTools

#### Screen Recording
1. Swipe down from top → Find Screen Record tile
2. If not visible: Settings → Display → Screen Record → Add to Quick Settings
3. Tap to start recording
4. Recording saved to Gallery/Photos

#### Common Android Issues to Watch For
- Navigation bar covering content
- Chrome translate bar appearing
- Back button behavior
- Android gesture navigation conflicts
- Different behavior on Samsung vs. Pixel

#### Android Emulator (Any OS with Android Studio)
For quick testing without physical device:
```bash
# Install Android Studio
# Open AVD Manager (Virtual Device Manager)
# Create device: Pixel 7, API Level 33+
# Launch emulator
# Open Chrome, navigate to app
```

---

## 🐛 Debugging Tips

### Quick Checks for Common Issues

**Layout Problems:**
```javascript
// In browser console, check viewport:
console.log(window.innerWidth, window.innerHeight)

// Check if mobile layout is active:
console.log(window.innerWidth < 640) // Should be true for mobile
```

**Save-on-Tap Not Working:**
```javascript
// Check if assessment ID is set:
console.log(document.querySelector('[data-assessment-id]'))

// Check for network errors in Network tab
// Look for POST /api/assessment-answers/save
```

**Swipe Not Working:**
```javascript
// Check if Framer Motion is loaded:
console.log(typeof window.FramerMotion !== 'undefined')

// Check for touch event listeners:
console.log('Touch events supported:', 'ontouchstart' in window)
```

**Console Access Without USB:**
If you can't use USB debugging, add this to check errors:
```javascript
// Add to page temporarily during dev/staging:
window.onerror = (msg, url, line, col, error) => {
  alert(`Error: ${msg}\nLine: ${line}\nCol: ${col}`)
  return false
}
```

### Network Issues

**Test Slow Connection:**
- iOS: Settings → Developer → Network Link Conditioner → 3G
- Android: Chrome → DevTools → Network → Throttling → Slow 3G

**Test Offline/Online Transitions:**
1. Enable Airplane Mode while on a page
2. Try to interact (should show error)
3. Disable Airplane Mode
4. Tap retry (should work)

### Performance Monitoring

**Check Frame Rate (60 FPS target):**
- iOS: Settings → Developer → Frame Rate Meter
- Android: Settings → Developer Options → Show FPS

**Measure Load Time:**
```javascript
// In console after page loads:
performance.timing.loadEventEnd - performance.timing.navigationStart
// Result in milliseconds
```

---

## 📸 Screenshot Best Practices

### What to Capture

**Success States:**
- Initial clean state
- Answer selected
- Save confirmation
- Navigation in progress (if possible)
- Results displayed
- Content page rendered

**Error States:**
- Any error messages
- Loading states that hang
- Layout breaks
- Unexpected behavior
- Console errors

### Screenshot Composition

**Good Screenshot:**
- Shows entire viewport (full screen)
- Clear focus on issue/feature
- Includes relevant UI elements (header, buttons, etc.)
- No personal info visible (use test accounts)
- Timestamp visible (if relevant)

**Add Annotations (Optional):**
Use built-in markup tools:
- iOS: Open screenshot → Tap → Markup
- Android: Open screenshot → Edit → Draw

Mark issues with:
- Red arrow pointing to problem
- Red circle around affected area
- Text label describing issue

### Organizing Screenshots

**File Naming Convention:**
```
device-flow-state-issue.png

Examples:
iphone-se-flow1-initial.png
iphone-se-flow2-save-working.png
samsung-s22-flow3-swipe-bug.png
iphone-14-flow4-results-amy.png
```

**Create Folders:**
```
screenshots/
  device-name/
    success/
      01-flow1-initial.png
      02-flow2-answer-selected.png
      ...
    bugs/
      bug-001-layout-break.png
      bug-002-save-error.png
      ...
```

---

## 🎥 Screen Recording Best Practices

### When to Record

Record these scenarios:
- Complete flow (start to finish)
- Specific bug reproduction
- Swipe gestures demonstration
- Save-on-tap in action
- Performance issues (lag, jank)
- Any intermittent bugs

### Recording Tips

**Do:**
- Start recording before interaction
- Perform actions slowly and deliberately
- Pause briefly between steps
- End recording after final result visible
- Keep recordings under 2 minutes

**Don't:**
- Shake device while recording
- Record with low battery (may affect performance)
- Include personal information
- Record in poor lighting (if screen reflection visible)

### Editing Recordings (Optional)

**iOS (Photos app):**
- Open video → Edit → Trim
- Cut out unnecessary beginning/end

**Android:**
- Open video in Gallery → Edit → Trim
- Many Android devices have built-in video editor

**Computer (QuickTime/VLC):**
- Transfer video to computer
- Edit → Trim to remove excess

---

## ✅ Quick Validation Checklist

Run these quick checks at the start of each test session:

### 1-Minute Smoke Test

- [ ] Open app → Loads without error
- [ ] Login works
- [ ] Navigate to funnel
- [ ] First question displays correctly
- [ ] Tap answer → Visual feedback works
- [ ] Console has no errors

**If any fail:** Stop and investigate before proceeding.

### 5-Minute Core Flow Test

- [ ] Answer 3 questions
- [ ] Use mix of buttons and swipes
- [ ] Check save indicators
- [ ] Navigate backward once
- [ ] Check console for errors
- [ ] Verify answers persist

**If all pass:** Proceed with comprehensive testing.

---

## 🚦 Priority System

### Critical (Test First)

Must work perfectly:
- Login/authentication
- Answer selection
- Answer saving
- Funnel navigation (buttons)
- Results display
- No data loss

### High (Test Second)

Should work well:
- Swipe navigation
- Save-on-tap indicators
- Performance (load times)
- Responsive layout
- Content pages

### Medium (Test If Time)

Nice to have:
- Animations smoothness
- Edge case handling
- History display
- Empty states

### Low (Optional)

Good to verify:
- Specific browser features
- Accessibility features
- Export functionality
- Admin features on mobile

---

## 📊 Quick Performance Benchmarks

### Is Performance Acceptable?

**Load Times:**
- Initial page: < 3 seconds = ✅ Good
- Question transition: < 200ms = ✅ Good
- Save operation: < 500ms = ✅ Good
- Results load: < 5 seconds = ✅ Good

**Subjective Feel:**
- Animations smooth = ✅ Good
- No noticeable lag = ✅ Good
- Scrolling smooth = ✅ Good
- Touch responds instantly = ✅ Good

**If performance is poor:**
1. Note device model and OS version
2. Check network speed (WiFi vs 4G)
3. Test on another device (is it device-specific?)
4. Record video to show lag/jank
5. Document in bug report with performance notes

---

## 🔄 Testing Workflow

### Efficient Testing Order

**Session 1: Happy Path (30 min)**
1. Complete full flow start to finish
2. Use only buttons (no swipes yet)
3. Focus on functionality, not details
4. Note any obvious bugs
5. Capture key screenshots

**Session 2: Deep Dive (60 min)**
1. Test all flows from checklist
2. Try swipe navigation
3. Test edge cases
4. Try to break things intentionally
5. Document all issues found

**Session 3: Polish (30 min)**
1. Retest any bugs found
2. Verify fixes (if any deployed)
3. Test remaining edge cases
4. Organize screenshots/videos
5. Write up final report

### Multi-Device Strategy

**If testing multiple devices:**

1. **Quick test on Device A** (30 min)
   - Find any critical bugs
   - Fix before testing Device B

2. **Full test on Device A** (90 min)
   - Complete all flows
   - Document thoroughly

3. **Quick comparison on Device B** (30 min)
   - Run same critical flows
   - Look for device-specific issues
   - Note differences

4. **Deep dive only on differences** (30 min)
   - Focus on what's broken on Device B but works on A
   - Or vice versa

---

## 💡 Common Pitfalls to Avoid

### Testing Mistakes

**Don't:**
- ❌ Test with browser cache enabled (may hide bugs)
- ❌ Test only on WiFi (miss network issues)
- ❌ Rush through flows (miss subtle bugs)
- ❌ Forget to check console (miss JS errors)
- ❌ Test only happy path (miss edge cases)
- ❌ Skip documentation (bugs not fixed = bugs forgotten)

**Do:**
- ✅ Clear cache before each session
- ✅ Test on multiple networks
- ✅ Test both fast and deliberate interactions
- ✅ Always check console
- ✅ Try to break things
- ✅ Document everything immediately

### Documentation Mistakes

**Don't:**
- ❌ Say "it doesn't work" (not specific enough)
- ❌ Forget device/OS details (can't reproduce)
- ❌ Skip screenshots (can't visualize issue)
- ❌ Bundle multiple bugs in one report (confusing)

**Do:**
- ✅ Describe exact steps to reproduce
- ✅ Include all device information
- ✅ Attach screenshots/video
- ✅ Create separate reports for each bug
- ✅ Include severity assessment

---

## 🔗 Quick Links

### Documentation
- Full Testing Guide: `/docs/E1_MOBILE_DEVICE_TESTING.md`
- Quick Checklist: `/docs/E1_QUICK_TESTING_CHECKLIST.md`
- Bug Template: `/.github/ISSUE_TEMPLATE/mobile_device_bug.md`

### Related Features
- Mobile Components: `/docs/A1_MOBILE_QUESTION_COMPONENT.md`
- Swipe Navigation: `/docs/A2_SWIPE_NAVIGATION.md`
- Save-on-Tap: `/docs/SAVE_ON_TAP.md`
- Smoke Tests: `/docs/E4_SMOKE_TEST.md`

### Tools
- iOS Simulator: Xcode (Mac only)
- Android Emulator: Android Studio (all platforms)
- Chrome DevTools: `chrome://inspect`
- Safari Web Inspector: Safari → Develop menu

---

## 📞 Getting Help

**If you're stuck:**

1. **Check documentation** - Review related docs above
2. **Search existing issues** - Someone may have reported it
3. **Try another device** - Is it device-specific?
4. **Create detailed bug report** - Use the template
5. **Reach out to team** - For urgent/blocking issues

**Include in help request:**
- What you were testing
- What you expected
- What actually happened
- Device and OS details
- Screenshots/video if possible
- Console errors if available

---

## ✨ Pro Tips

### Speed Up Testing

**Use Browser Favorites:**
Save these as bookmarks on test device:
- Login page
- Stress check (funnel)
- Results page
- History page

**Quick Account Switch:**
Use browser's password manager to store test accounts.

**Reuse Test Sessions:**
Don't logout between tests (unless testing login flow).

**Use Airplane Mode Toggle:**
Quick Settings shortcut for network testing.

### Catch More Bugs

**Rotate Device:**
Test both portrait and landscape (if supported).

**Test Interruptions:**
- Receive phone call during funnel
- Switch to another app and back
- Lock screen and unlock

**Test Edge Cases:**
- Very long text in questions
- Network dropout mid-save
- Multiple rapid actions
- Browser back button

**Test Accessibility:**
- Increase font size (system settings)
- Try VoiceOver/TalkBack (if comfortable)
- Test with one hand only

---

**Last Updated:** 2024-12-11  
**For:** Rhythmologicum Connect v0.3  
**Epic:** E (Testing & QA)

---

*Happy Testing! 🧪*
