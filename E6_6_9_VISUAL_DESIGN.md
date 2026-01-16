# E6.6.9 — Dev Harness Visual Design

**Epic:** E6.6.9  
**Component:** AMYComposer Dev Harness  
**Status:** ✅ Implemented

## Visual Overview

The dev harness appears as a **purple-themed collapsible section** within the AMYComposer component on the patient dashboard. It provides quick-fill buttons for deterministic triage test inputs.

---

## Component Location

**Page:** `/patient/dashboard`  
**Component:** `AMYComposer.tsx`  
**Position:** Between the non-emergency disclaimer and the input form

---

## Visual Structure

### Collapsed State (Default)

```
┌─────────────────────────────────────────────────────────┐
│ [Purple dashed border - 2px]                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👨‍💻 Dev Harness - Test Inputs           [Show]      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Colors:**
- Border: `border-purple-300 dark:border-purple-700` (dashed, 2px)
- Background: `bg-purple-50 dark:bg-purple-950/20`
- Header text: `text-purple-900 dark:text-purple-300`
- Toggle button: `bg-purple-200 dark:bg-purple-800`

### Expanded State

```
┌─────────────────────────────────────────────────────────┐
│ [Purple dashed border - 2px]                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👨‍💻 Dev Harness - Test Inputs           [Hide]      │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Deterministic test inputs for all router paths      │ │
│ │ (INFO/ASSESSMENT/ESCALATE)                          │ │
│ │                                                      │ │
│ │ ┌──────────┐ ┌────────────────┐ ┌─────────────┐   │ │
│ │ │ 💬 Info  │ │ 📋 Assessment  │ │ 🚨 Escalate │   │ │
│ │ │ [Green]  │ │ [Amber]        │ │ [Red]       │   │ │
│ │ └──────────┘ └────────────────┘ └─────────────┘   │ │
│ │                                                      │ │
│ │ ⚠️ Dev-only feature. Hidden in production.          │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Quick-Fill Buttons

### Button 1: Info (Green)

**Label:** `💬 Info`  
**Colors:**
- Background: `bg-green-100 dark:bg-green-900/30`
- Text: `text-green-800 dark:text-green-300`
- Hover: `hover:bg-green-200 dark:hover:bg-green-900/50`

**Input Text:** 
```
Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?
```

**Expected Result:**
- Tier: INFO
- NextAction: SHOW_CONTENT
- Navigation: `/patient/dashboard?scrollTo=content`

### Button 2: Assessment (Amber)

**Label:** `📋 Assessment`  
**Colors:**
- Background: `bg-amber-100 dark:bg-amber-900/30`
- Text: `text-amber-800 dark:text-amber-300`
- Hover: `hover:bg-amber-200 dark:hover:bg-amber-900/50`

**Input Text:**
```
Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. 
Es fällt mir schwer, mich zu konzentrieren.
```

**Expected Result:**
- Tier: ASSESSMENT
- NextAction: START_FUNNEL_A
- Navigation: `/patient/funnel/stress-resilience?source=triage`

### Button 3: Escalate (Red)

**Label:** `🚨 Escalate`  
**Colors:**
- Background: `bg-red-100 dark:bg-red-900/30`
- Text: `text-red-800 dark:text-red-300`
- Hover: `hover:bg-red-200 dark:hover:bg-red-900/50`

**Input Text:**
```
Ich habe Suizidgedanken und weiß nicht mehr weiter. 
Alles fühlt sich hoffnungslos an.
```

**Expected Result:**
- Tier: ESCALATE
- NextAction: SHOW_ESCALATION
- Navigation: `/patient/support?source=triage&tier=ESCALATE`

---

## Typography

### Header
- Font: Semi-bold, small
- Color: `text-purple-900 dark:text-purple-300`
- Size: `text-sm`

### Description Text
- Font: Regular, extra-small
- Color: `text-purple-700 dark:text-purple-400`
- Size: `text-xs`

### Button Text
- Font: Medium, extra-small
- Size: `text-xs`

### Warning Text
- Font: Regular, extra-small
- Color: `text-purple-600 dark:text-purple-400`
- Size: `text-xs`

---

## Spacing

- **Container Padding:** `p-4` (1rem)
- **Header Margin Bottom:** `mb-3` (0.75rem)
- **Button Gap:** `gap-2` (0.5rem)
- **Description Margin:** `mb-2` (0.5rem)
- **Warning Margin Top:** `mt-2` (0.5rem)

---

## Interaction States

### Toggle Button

**Default:**
```css
text-xs px-2 py-1 rounded 
bg-purple-200 dark:bg-purple-800 
text-purple-900 dark:text-purple-300
```

**Hover:**
```css
hover:bg-purple-300 dark:hover:bg-purple-700
```

**Transition:** All states use `transition-colors`

### Quick-Fill Buttons

**Default:**
```css
px-3 py-2 text-xs font-medium rounded-md
[tier-specific background and text colors]
```

**Hover:**
```css
hover:[darker version of background]
```

**Disabled:**
```css
disabled:opacity-50 
disabled:cursor-not-allowed
```

**Transition:** All states use `transition-colors`

---

## Responsive Behavior

### Desktop (≥768px)
- Buttons displayed in horizontal row
- Full width toggle button
- Standard padding

### Mobile (<768px)
- Buttons wrap to multiple rows if needed
- Full width toggle button
- Maintains spacing and readability

---

## Dark Mode

The component fully supports dark mode with appropriate color adjustments:

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Border | `border-purple-300` | `border-purple-700` |
| Background | `bg-purple-50` | `bg-purple-950/20` |
| Header Text | `text-purple-900` | `text-purple-300` |
| Description | `text-purple-700` | `text-purple-400` |
| Toggle Button BG | `bg-purple-200` | `bg-purple-800` |
| Info Button BG | `bg-green-100` | `bg-green-900/30` |
| Assessment Button BG | `bg-amber-100` | `bg-amber-900/30` |
| Escalate Button BG | `bg-red-100` | `bg-red-900/30` |

---

## Accessibility

### Semantic HTML
- Uses `<button>` elements for all interactive components
- Proper heading hierarchy
- Descriptive labels

### ARIA Attributes
- Developer emoji has `role="img"` and `aria-label="Developer"`
- All buttons have visible text labels
- Toggle button state is visually clear

### Keyboard Navigation
- All buttons are keyboard accessible
- Tab order is logical
- Enter/Space to activate buttons

### Screen Readers
- Clear button labels announce purpose
- Warning text is announced
- Collapsed/expanded state is clear

---

## Environment-Specific Behavior

### Localhost (http://localhost:3000)
- ✅ Dev harness visible by default
- ✅ All features enabled

### Preview Deployments (*.preview.vercel.app)
- ✅ Dev harness visible by default
- ✅ All features enabled

### Production (production.domain.com)
- ❌ Dev harness hidden by default
- ✅ Can be enabled via localStorage:
  ```javascript
  localStorage.setItem('devHarnessEnabled', 'true')
  // Then reload page
  ```

---

## Integration with AMYComposer

The dev harness is positioned **after the disclaimer** and **before the suggested concerns chips**:

```
┌─────────────────────────────────────┐
│ 🤖 AMY - Ihr persönlicher Assistent│
│ Beschreiben Sie Ihr Anliegen        │
├─────────────────────────────────────┤
│ ℹ️ Non-Emergency Disclaimer         │
├─────────────────────────────────────┤
│ 👨‍💻 Dev Harness (if enabled)        │  ← NEW
├─────────────────────────────────────┤
│ 💤 😰 💓 😟 [Suggested chips]        │
│                                     │
│ [Textarea]                          │
│                                     │
│ [Character counter]                 │
│ [Submit button]                     │
└─────────────────────────────────────┘
```

---

## Usage Flow

1. **Initial State:** Dev harness appears collapsed
2. **User clicks "Show":** Section expands to show description and buttons
3. **User clicks quick-fill button:** 
   - Input text is filled into the textarea
   - Form state resets to idle
   - User can then submit normally
4. **User submits:** Normal triage flow proceeds
5. **Result:** Triage result displays with navigation options

---

## Code Location

**File:** `app/patient/dashboard/components/AMYComposer.tsx`

**Key Sections:**
- Lines 53-72: `DEV_QUICK_FILLS` constant (test input definitions)
- Lines 74-92: `isDevHarnessEnabled()` function (environment detection)
- Lines 105-114: `handleDevQuickFill()` handler (click handler)
- Lines 174-227: JSX markup (UI rendering)

---

## Testing the UI

### Local Testing
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/patient/dashboard`
3. Login as a patient user
4. Scroll to AMY Composer section
5. Dev harness should be visible by default

### Preview Testing
1. Deploy to preview environment
2. Navigate to dashboard
3. Dev harness should be visible on `*.preview.*` domains

### Production Testing
1. Deploy to production
2. Navigate to dashboard
3. Dev harness should be hidden by default
4. Open browser console:
   ```javascript
   localStorage.setItem('devHarnessEnabled', 'true')
   location.reload()
   ```
5. Dev harness should now be visible

---

## Design Principles

### Visual Hierarchy
- Purple theme clearly distinguishes dev tools from production features
- Dashed border indicates temporary/dev-only content
- Collapsible design minimizes visual clutter

### Color Coding
- Tier-specific colors match severity:
  - Green (Info) = low priority, informational
  - Amber (Assessment) = medium priority, needs attention
  - Red (Escalate) = high priority, urgent

### User Experience
- One-click to fill test input
- Clear labeling prevents confusion
- Warning text reinforces dev-only nature

### Developer Experience
- Quick access to common test cases
- No typing required for standard tests
- Easy to toggle visibility
- Works in both light and dark mode

---

## Future Visual Enhancements

### Potential Improvements
- **Tooltip hints:** Add tooltips showing expected tier/nextAction
- **Result preview:** Show what tier each button will trigger
- **Copy button:** Add ability to copy test input to clipboard
- **Keyboard shortcuts:** Add shortcuts like Ctrl+1/2/3 for quick-fills
- **Animation:** Add subtle expand/collapse animation

### Not Implemented (Out of Scope)
- ❌ Custom input builder
- ❌ Test result comparison
- ❌ Session recording
- ❌ Screenshot/video capture
- ❌ A/B testing UI

---

## Conclusion

The E6.6.9 dev harness provides a **visually distinct, production-safe, and user-friendly** interface for testing deterministic triage inputs. The purple theme, clear labeling, and environment-based gating ensure it serves developers without interfering with end-user experience.

**Visual Design Status:** ✅ Complete and Implemented
