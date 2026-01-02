# Patient Flow V2 – Visual Flow Diagram

**Companion to:** [PATIENT_FLOW_V2_STRUCTURE.md](PATIENT_FLOW_V2_STRUCTURE.md)  
**Date:** 2025-12-11

This document provides visual representations of the patient flow for quick reference.

---

## High-Level User Journey

```
┌──────────────────────────────────────────────────────────────────────┐
│                         PATIENT JOURNEY                              │
└──────────────────────────────────────────────────────────────────────┘

    LOGIN
      │
      ↓
┌─────────────┐
│   Patient   │ ← Landing after successful authentication
│    Home     │
└──────┬──────┘
       │
       │ Click "Fragebogen" or "Assessment starten"
       │
       ↓
┌─────────────┐     skipIntro=true
│   Intro     │────────────────┐
│   Screen    │                │
└──────┬──────┘                │
       │                       │
       │ "Assessment starten"  │
       │                       │
       ↓                       ↓
┌─────────────────────────────────┐
│      Question Flow              │
│                                 │
│  Step 1 → Step 2 → ... → Step N │
│    ↑                       ↑    │
│    └───── "Zurück" ────────┘    │
│                                 │
│  [Optional Content Pages]       │
│        accessed via links       │
└────────────┬────────────────────┘
             │
             │ Complete all steps
             │
             ↓
      ┌─────────────┐
      │   Result    │
      │   Screen    │
      └──────┬──────┘
             │
             ├──→ View History
             ├──→ New Assessment
             └──→ Content Pages
```

---

## Detailed Screen Flow with Routes

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE & SCREEN MAPPING                         │
└─────────────────────────────────────────────────────────────────────┘

/patient
    │
    ├─→ /patient/funnel/stress-assessment/intro
    │       │
    │       │ [Optional - only if intro page exists]
    │       │
    │       ↓
    │   ┌──────────────────────────────────┐
    │   │  Intro Screen                    │
    │   │  • Welcome message               │
    │   │  • Duration & privacy info       │
    │   │  • "Start Assessment" button     │
    │   └────────────┬─────────────────────┘
    │                │
    │                ↓
    │
    └─→ /patient/funnel/stress-assessment
            │
            │ [Main Assessment Entry Point]
            │
            ↓
        ┌────────────────────────────────────────┐
        │  Question Flow                         │
        │                                        │
        │  Current Step: {stepIndex}/{totalSteps}│
        │  ┌──────────────────────────────────┐ │
        │  │ Progress: ████████░░░░░░ 60%     │ │
        │  └──────────────────────────────────┘ │
        │                                        │
        │  Step Title: "Stressoren"              │
        │  ┌──────────────────────────────────┐ │
        │  │ Question 1:                      │ │
        │  │ "Wie oft fühlen Sie sich..."     │ │
        │  │                                  │ │
        │  │ [Nie] [Selten] [Manchmal]       │ │
        │  │       [Oft] [Sehr häufig]       │ │
        │  └──────────────────────────────────┘ │
        │                                        │
        │  ┌──────────────────────────────────┐ │
        │  │ Question 2: ...                  │ │
        │  └──────────────────────────────────┘ │
        │                                        │
        │  [Zurück]              [Weiter]        │
        └────────────┬───────────────────────────┘
                     │
                     │ Optional: Click content link
                     │
                     ├─→ /patient/funnel/stress-assessment/content/info-was-ist-stress
                     │       │
                     │       ↓
                     │   ┌──────────────────────────────┐
                     │   │  Content Page                │
                     │   │  • Educational content       │
                     │   │  • Markdown formatted        │
                     │   │  • "Zurück zur Frage" link   │
                     │   └────────────┬─────────────────┘
                     │                │
                     │                ↓
                     │           (returns to question)
                     │
                     │ After all steps complete
                     │
                     ↓
        /patient/funnel/stress-assessment/result?assessmentId={id}
                     │
                     ↓
        ┌────────────────────────────────────────┐
        │  Result Screen                         │
        │  ┌──────────────────────────────────┐ │
        │  │  ✅ Assessment abgeschlossen     │ │
        │  │                                  │ │
        │  │  Stress Level: MEDIUM            │ │
        │  │  ████████░░░░░░ 58/100          │ │
        │  └──────────────────────────────────┘ │
        │                                        │
        │  AMY Insights:                         │
        │  ┌──────────────────────────────────┐ │
        │  │ "Ihre Auswertung zeigt..."       │ │
        │  │ [AI-generated summary]           │ │
        │  └──────────────────────────────────┘ │
        │                                        │
        │  Nächste Schritte:                     │
        │  • Link to resources                   │
        │  • Recommended actions                 │
        │                                        │
        │  [Zur Historie] [Neues Assessment]     │
        └────────────┬───────────────────────────┘
                     │
                     └─→ /patient/history
                             │
                             ↓
                     ┌──────────────────────┐
                     │  History Screen      │
                     │  • List of past      │
                     │    assessments       │
                     │  • View results      │
                     │  • Start new         │
                     └──────────────────────┘
```

---

## State Machine: Assessment Lifecycle

```
┌──────────────────────────────────────────────────────────────────────┐
│                   ASSESSMENT STATE MACHINE                           │
└──────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   NOT_STARTED   │
                    │                 │
                    │ • No assessment │
                    │   in DB         │
                    └────────┬────────┘
                             │
                             │ POST /api/funnels/{slug}/assessments
                             │
                             ↓
                    ┌─────────────────┐
                    │  IN_PROGRESS    │◄──────────┐
                    │                 │           │
                    │ • assessmentId  │           │
                    │ • currentStep   │           │
                    │ • answers saved │           │
                    └────────┬────────┘           │
                             │                    │
                             │                    │
                Step         │                    │ Page reload /
                Progression: │                    │ Session recovery
                             │                    │
    ┌────────────────────────┼────────────────────┼─────────────┐
    │                        │                    │             │
    ↓                        ↓                    ↓             │
┌────────┐            ┌────────────┐       ┌──────────┐        │
│ Step 1 │ → validate │   Step 2   │  ...  │  Step N  │        │
│answered│            │  answered  │       │ answered │        │
└────────┘            └────────────┘       └─────┬────┘        │
                                                  │             │
                                                  │             │
                        GET /api/funnels/{slug}/  │             │
                        assessments/{id}          │             │
                        (restore state) ──────────┘             │
                                                                │
    Validate all steps completed                                │
                             │                                  │
                             │ POST /api/funnels/{slug}/        │
                             │ assessments/{id}/complete        │
                             │                                  │
                             ↓                                  │
                    ┌─────────────────┐                         │
                    │   COMPLETED     │                         │
                    │                 │                         │
                    │ • completed_at  │                         │
                    │ • read-only     │                         │
                    │ • show result   │                         │
                    └─────────────────┘                         │
                             │                                  │
                             │ View anytime                     │
                             │                                  │
                             ↓                                  │
                    /patient/history                            │
                             │                                  │
                             │ Start new assessment             │
                             └──────────────────────────────────┘
```

---

## Navigation Flow with User Actions

```
┌──────────────────────────────────────────────────────────────────────┐
│                     USER ACTION FLOW                                 │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Intro     │
│   Screen    │
└──────┬──────┘
       │
       │ Actions:
       │ • [Assessment starten] → Question Step 1
       │ • [Später fortsetzen]  → /patient (home)
       │
       ↓
┌────────────────────────────┐
│   Question Step 1          │
│   (e.g., "Stressoren")     │
└──────┬─────────────────────┘
       │
       │ Actions:
       │ • Answer question(s) → Enables "Weiter"
       │ • [Zurück]          → Previous step (or Intro if first)
       │ • [Weiter]          → Validates, then next step
       │ • Click info link   → Content page (returns here)
       │
       ↓
┌────────────────────────────┐
│   Question Step 2          │
│   (e.g., "Körperliche...")  │
└──────┬─────────────────────┘
       │
       │ Actions: (same as above)
       │ • Answer → [Weiter]
       │ • [Zurück] → Step 1
       │
       ↓
       ...
       ↓
┌────────────────────────────┐
│   Question Step N          │
│   (Final step)             │
└──────┬─────────────────────┘
       │
       │ Actions:
       │ • Answer → Enables "Weiter"
       │ • [Zurück] → Step N-1
       │ • [Weiter] → Complete assessment, redirect to Result
       │
       ↓
┌────────────────────────────┐
│   Result Screen            │
└──────┬─────────────────────┘
       │
       │ Actions:
       │ • [Zur Historie]           → /patient/history
       │ • [Neues Assessment]       → /patient/funnel/stress-assessment (new)
       │ • Click content links      → Content pages
       │ • [Zurück zur Übersicht]  → /patient (home)
       │
       ↓
┌────────────────────────────┐
│   History Screen           │
└──────┬─────────────────────┘
       │
       │ Actions:
       │ • Click past assessment   → Result screen (read-only)
       │ • [Neues Assessment]      → /patient/funnel/stress-assessment (new)
       │ • [Zurück]               → /patient (home)
       │
       └─→ (Loop: can start new assessments anytime)
```

---

## Mobile Responsive Behavior

```
┌──────────────────────────────────────────────────────────────────────┐
│                    RESPONSIVE LAYOUTS                                │
└──────────────────────────────────────────────────────────────────────┘

Mobile (< 640px)                     Desktop (≥ 768px)
─────────────────                    ──────────────────

┌──────────────────┐                ┌─────────────────────────────────┐
│  ████████░░░ 75% │                │     ████████████░░░░░░ 75%     │
├──────────────────┤                ├─────────────────────────────────┤
│                  │                │                                 │
│  Question Title  │                │       Question Title            │
│                  │                │                                 │
│  Question text   │                │  Question text with more space  │
│  continues here  │                │  for comfortable reading        │
│                  │                │                                 │
├──────────────────┤                ├─────────────────────────────────┤
│                  │                │                                 │
│  [   Nie   ]     │                │ [ Nie ]  [Selten]  [Manchmal]  │
│  [ Selten  ]     │                │         [ Oft ]  [Sehr häufig] │
│  [Manchmal ]     │                │                                 │
│  [  Oft    ]     │                ├─────────────────────────────────┤
│  [Sehr häufig]   │                │                                 │
│                  │                │  [Zurück]            [Weiter]  │
├──────────────────┤                │                                 │
│                  │                └─────────────────────────────────┘
│ [   Zurück   ]   │                          max-w-3xl centered
│ [   Weiter   ]   │
│                  │
└──────────────────┘
    full width


Key Differences:
────────────────
Mobile:
• Buttons stack vertically (full width)
• Scale options stack vertically
• Padding: p-6
• Text: text-2xl (headings)

Desktop:
• Buttons side-by-side (auto width)
• Scale options horizontal
• Padding: p-8
• Text: text-3xl (headings)
• Max width: max-w-3xl for readability
```

---

## Error & Edge Case Flows

```
┌──────────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                                  │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│ Question Step   │
└────────┬────────┘
         │
         │ User clicks "Weiter" without answering required question
         │
         ↓
┌──────────────────────────────────────────┐
│  ⚠️  Validation Error                    │
│  "Bitte beantworten Sie alle            │
│   Pflichtfragen"                         │
└────────┬─────────────────────────────────┘
         │
         │ Scroll to first unanswered question
         │
         ↓
┌──────────────────────────────────────────┐
│  Question X (unanswered)                 │
│  ┌────────────────────────────────────┐ │
│  │ ❌ Bitte beantworten Sie diese    │ │
│  │    Frage                           │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Scale buttons highlighted in red]     │
└──────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                  SESSION RECOVERY FLOW                               │
└──────────────────────────────────────────────────────────────────────┘

User starts assessment → Answers 5 questions → Closes browser
         │                       │
         │                       │ Auto-saved to DB
         │                       │
         └───────────────────────┘
                 │
                 │ User returns later
                 │
                 ↓
┌──────────────────────────────────────────┐
│  Question Flow Screen                    │
│  ┌────────────────────────────────────┐ │
│  │  ℹ️  Willkommen zurück!            │ │
│  │  Sie haben bereits 5 Fragen        │ │
│  │  beantwortet. Möchten Sie          │ │
│  │  fortfahren?                       │ │
│  │                                    │ │
│  │  [Von vorne] [Fortfahren]         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Step 2 of 4 (resumed position)          │
│  ████████░░░░ 50%                        │
└──────────────────────────────────────────┘
                 │
                 │ User clicks "Fortfahren"
                 │
                 ↓
         Continue from Step 2


┌──────────────────────────────────────────────────────────────────────┐
│                   NETWORK ERROR HANDLING                             │
└──────────────────────────────────────────────────────────────────────┘

User answers question → Click "Weiter" → Network error
         │                                       │
         │                                       │
         ↓                                       ↓
┌──────────────────────────────────────────┐
│  ⚠️  Verbindung unterbrochen             │
│                                          │
│  Ihre Antworten werden lokal gespeichert│
│  und bei der nächsten Verbindung        │
│  synchronisiert.                         │
│                                          │
│  [Erneut versuchen]  [Später]           │
└────────┬─────────────────────────────────┘
         │
         │ User clicks "Erneut versuchen"
         │ (with exponential backoff)
         │
         ↓
    Retry save → Success → Continue to next step
              → Fail → Show error again
```

---

## Content Integration Points

```
┌──────────────────────────────────────────────────────────────────────┐
│              CONTENT PAGE INTEGRATION FLOW                           │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Intro     │ ← Content: "intro-stress-assessment"
│   Screen    │   (Full intro page before starting)
└──────┬──────┘
       │
       ↓
┌─────────────────────────────┐
│   Question Step             │
│                             │
│   "Wie oft fühlen Sie..."   │
│                             │
│   ➡️ [Mehr über Stress     │ ← Link: "info-was-ist-stress"
│      erfahren]              │   (Opens content page, returns)
│                             │
└──────┬──────────────────────┘
       │
       ↓
       ... (complete assessment)
       │
       ↓
┌─────────────────────────────┐
│   Result Screen             │
│                             │
│   Your stress level: ...    │
│                             │
│   ┌───────────────────────┐ │
│   │ Was bedeutet das?     │ │ ← Content: "result-interpretation"
│   │ [Dynamic content]     │ │   (Loaded from DB)
│   └───────────────────────┘ │
│                             │
│   ┌───────────────────────┐ │
│   │ Nächste Schritte      │ │ ← Content: "result-next-steps"
│   │ [Dynamic content]     │ │   (Loaded from DB)
│   └───────────────────────┘ │
│                             │
│   ➡️ [Stressbewältigung    │ ← Link: "info-stress-management"
│      lernen]                │   (Separate content page)
│                             │
└─────────────────────────────┘


Content Categories by Flow Position:
─────────────────────────────────────
intro-*       → Before assessment starts
info-*        → Available during questions (links)
result-*      → Dynamic blocks on result page
education-*   → General resources (linked from various places)
```

---

## Quick Reference: Routes & Purposes

| Route                                       | Purpose                | Required Auth | State          |
| ------------------------------------------- | ---------------------- | ------------- | -------------- |
| `/patient`                                  | Patient home/dashboard | Yes (patient) | N/A            |
| `/patient/funnel/{slug}`                    | Main assessment flow   | Yes (patient) | in_progress    |
| `/patient/funnel/{slug}/intro`              | Welcome/explanation    | Yes (patient) | pre-assessment |
| `/patient/funnel/{slug}/content/{pageSlug}` | Educational content    | Yes (patient) | contextual     |
| `/patient/funnel/{slug}/result`             | Assessment results     | Yes (patient) | completed      |
| `/patient/history`                          | Past assessments       | Yes (patient) | N/A            |

---

## Performance & UX Metrics

```
┌──────────────────────────────────────────────────────────────────────┐
│                    TARGET METRICS                                    │
└──────────────────────────────────────────────────────────────────────┘

Page Load Times (Mobile 3G):
────────────────────────────
Intro Screen:      < 3 seconds
Question Screen:   < 2 seconds
Result Screen:     < 3 seconds

Interaction Times:
──────────────────
Answer selection:  < 50ms visual feedback
Step validation:   < 150ms response
Step transition:   < 200ms total
Scroll to error:   < 300ms smooth scroll

Auto-save:
──────────
Trigger:           On answer change (debounced 500ms)
Retry:             Exponential backoff (1s, 2s, 4s)
Timeout:           10 seconds max per attempt

Session Recovery:
─────────────────
Detection:         < 500ms on page load
Restoration:       < 1 second to show resumed state
```

---

## Accessibility Considerations

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ACCESSIBILITY FEATURES                            │
└──────────────────────────────────────────────────────────────────────┘

Keyboard Navigation:
────────────────────
• Tab through all interactive elements
• Space/Enter to activate buttons
• Arrow keys for scale selection (optional enhancement)
• Escape to dismiss modals/overlays

Screen Reader Support:
──────────────────────
• Semantic HTML (h1, h2, main, nav, etc.)
• ARIA labels for progress indicators
• Error announcements (aria-live)
• Question numbering announced
• Help text associated with inputs (aria-describedby)

Visual Accessibility:
─────────────────────
• Contrast ratio: 4.5:1 minimum (WCAG AA)
• Focus indicators: Visible on all interactive elements
• Color not sole indicator: Use icons + text for status
• Font size: Minimum 16px (1rem)
• Touch targets: Minimum 44x44px

Motion & Animation:
───────────────────
• Respect prefers-reduced-motion
• No auto-play videos
• Smooth scrolling with fallback to instant
• Optional: Skip smooth transitions if user prefers
```

---

**Last Updated:** 2025-12-11  
**Companion Document:** [PATIENT_FLOW_V2_STRUCTURE.md](PATIENT_FLOW_V2_STRUCTURE.md)
