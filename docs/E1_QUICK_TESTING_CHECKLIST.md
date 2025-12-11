# E1 — Quick Mobile Testing Checklist

**Print this page or view on tablet during device testing**

---

## 📱 Device Information

**Device:** ________________  
**OS Version:** ________________  
**Browser:** ________________  
**Screen Size:** ________________  
**Date:** ________________  
**Tester:** ________________

---

## ✅ Essential Flow Tests

### 1️⃣ Funnel Start (5 min)

- [ ] Navigate to `/patient/stress-check`
- [ ] Mobile card layout displays (not desktop)
- [ ] Question text is readable
- [ ] Progress indicator shows "1 of X"
- [ ] Answer buttons are tappable
- [ ] No horizontal scrolling

**Notes:**
```
_____________________________________________________
```

---

### 2️⃣ Answer Selection (5 min)

- [ ] Tap answer option → visual feedback instant
- [ ] "Speichert..." appears
- [ ] "Gespeichert" confirmation shows
- [ ] Change answer → saves new value
- [ ] Rapid tap test → no duplicates

**Notes:**
```
_____________________________________________________
```

---

### 3️⃣ Button Navigation (5 min)

- [ ] "Weiter" disabled until answered
- [ ] "Weiter" enabled after answer
- [ ] Navigate forward successfully
- [ ] "Zurück" appears on Q2+
- [ ] Navigate backward successfully
- [ ] Last Q shows "Abschließen"

**Notes:**
```
_____________________________________________________
```

---

### 4️⃣ Swipe Navigation (10 min)

- [ ] Swipe left → next question (when answered)
- [ ] Smooth animation (no jank)
- [ ] Swipe right → previous question
- [ ] Can't swipe right on Q1 (resistance)
- [ ] Can't swipe left when unanswered (snaps back)
- [ ] Partial swipe snaps back smoothly

**Notes:**
```
_____________________________________________________
```

---

### 5️⃣ Complete Assessment (10 min)

- [ ] Answer all questions
- [ ] Tap "Abschließen" on last Q
- [ ] Loading spinner appears
- [ ] Results page loads (< 5 sec)
- [ ] Stress score displayed
- [ ] Sleep score displayed
- [ ] Risk level shown
- [ ] AMY report visible (if enabled)

**Notes:**
```
_____________________________________________________
```

---

### 6️⃣ Content Pages (5 min)

- [ ] Access content page link
- [ ] Content loads correctly
- [ ] Markdown rendered properly
- [ ] Back navigation works
- [ ] No layout breaks

**Notes:**
```
_____________________________________________________
```

---

### 7️⃣ History (5 min)

- [ ] Navigate to history
- [ ] Assessment list displays
- [ ] Scores shown correctly
- [ ] Dates/times correct
- [ ] Empty state works (new user)

**Notes:**
```
_____________________________________________________
```

---

## 🐛 Issues Found

### Issue 1
**Severity:** ⬜ Critical ⬜ High ⬜ Medium ⬜ Low  
**Description:**
```
_____________________________________________________
_____________________________________________________
```

### Issue 2
**Severity:** ⬜ Critical ⬜ High ⬜ Medium ⬜ Low  
**Description:**
```
_____________________________________________________
_____________________________________________________
```

### Issue 3
**Severity:** ⬜ Critical ⬜ High ⬜ Medium ⬜ Low  
**Description:**
```
_____________________________________________________
_____________________________________________________
```

---

## 📊 Performance Notes

**Initial Load:** _____ seconds  
**Question Transition:** _____ ms (subjective: fast/ok/slow)  
**Swipe Smoothness:** ⬜ Excellent ⬜ Good ⬜ Fair ⬜ Poor  
**Overall Experience:** ⬜ Excellent ⬜ Good ⬜ Fair ⬜ Poor

---

## ✅ Final Status

- [ ] ✅ All essential tests passed
- [ ] ⚠️ Minor issues found (documented above)
- [ ] ❌ Critical issues found (stop testing, escalate)

**Overall Assessment:**
```
_____________________________________________________
_____________________________________________________
_____________________________________________________
```

**Screenshots Captured:** ⬜ Yes ⬜ No  
**Screen Recording:** ⬜ Yes ⬜ No

---

**Tested:** ⬜ Complete  
**Reviewed by:** ________________  
**Date:** ________________
