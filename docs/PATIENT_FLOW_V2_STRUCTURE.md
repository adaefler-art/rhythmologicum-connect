# Patient Flow V2 Structure – Screens & States

**Status:** ✅ Documented  
**Date:** 2025-12-11  
**Epic:** V0.4-E2 – Patient Flow V2  
**Parent Issue:** adaefler-art/rhythmologicum-connect#203

## Overview

This document defines the complete Stress & Resilience assessment journey from the patient perspective. The flow is designed mobile-first with clear screen purposes, logical transitions, and minimal cognitive load.

## Design Principles

### Mobile-First Approach
- **Single column layout** with max-width for readability
- **Short, clear text** - no desktop-only assumptions
- **Touch-friendly controls** - minimum 44px tap targets
- **Responsive typography** - scales from mobile to desktop
- **Progressive disclosure** - one concept at a time

### User Experience
- **Clear progress indicators** - always know where you are
- **Explicit navigation** - no ambiguous actions
- **Error prevention** - validation before progression
- **Session persistence** - never lose your work
- **Professional appearance** - builds trust

### Content Strategy
- **Conversational tone** - warm but professional
- **Plain language** - avoid medical jargon
- **Scannable layout** - headings and whitespace
- **Optional depth** - links to more information
- **Visual hierarchy** - guide the eye naturally

---

## Flow Architecture

The patient flow follows a **linear progression with optional branches**:

```
Login → [Intro] → Questions → Result → History
         ↓          ↓          ↓
      Content    Content    Content
```

### State Management
- **Assessment States:** `not_started`, `in_progress`, `completed`
- **Step States:** `not_visited`, `current`, `completed`
- **Answer States:** `unanswered`, `answered`, `validated`

### Navigation Rules
1. **Forward:** Only after current step validates successfully
2. **Backward:** Always allowed to previous completed steps
3. **Skip:** Not allowed (ensures data completeness)
4. **Resume:** Automatic detection of in-progress assessments

---

## Screen Descriptions

### 1. Welcome/Intro Screen

**Route:** `/patient/funnel/stress-assessment/intro`  
**Type:** Optional (if `intro` content page exists)  
**State:** Entry point before assessment

#### Purpose
- Explain what the assessment is about
- Set expectations (duration, confidentiality)
- Reduce anxiety and build trust
- Provide "start" call-to-action

#### Content Elements
- **Hero Section**
  - Title: "Stress & Resilienz Assessment"
  - Subtitle: Brief description (1-2 sentences)
  - Icon or subtle illustration (optional)

- **Key Information Cards**
  - ⏱️ Duration: "5-10 Minuten"
  - 🔒 Privacy: "Ihre Daten bleiben vertraulich"
  - 📊 Purpose: "Verstehen Sie Ihr Stressniveau besser"

- **Body Content**
  - What to expect during assessment
  - How results will help
  - Optional: Link to detailed information

- **Call to Action**
  - Primary button: "Assessment starten"
  - Secondary link: "Später fortsetzen" (back to patient home)

#### Mobile Behavior
- Stack cards vertically on small screens
- Button spans full width on mobile (<640px)
- Comfortable padding (p-6) for touch interactions
- Readable font size (text-base minimum)

#### Transitions
- **Next:** → Question Screen (Step 1)
- **Skip:** → Question Screen (if `?skipIntro=true` in URL)
- **Back:** → Patient Home (`/patient`)

---

### 2. Question Screens

**Route:** `/patient/funnel/stress-assessment`  
**Type:** Core assessment experience  
**State:** `in_progress`

#### Purpose
- Collect patient responses to validated questions
- Provide context and help when needed
- Show progress to encourage completion
- Validate answers before proceeding

#### Screen Anatomy

**Progress Bar**
- Visual indicator (colored bar)
- Percentage or "Step X of Y" text
- Always visible at top

**Question Header**
- Step title (from `funnel_steps.title`)
- Optional description/context
- Question number within step

**Question Block(s)**
- Question text (clear, specific)
- Optional help text (subtle, below question)
- Answer input (scale buttons, radio, etc.)
- Validation error message (if shown)

**Navigation Controls**
- "Zurück" button (secondary style)
- "Weiter" button (primary style, disabled until valid)
- Both buttons equal width on mobile

**Optional Content Links**
- Inline link: "Mehr über Stress erfahren →"
- Opens content page in flow context
- Breadcrumb to return to question

#### Question Types & Rendering

**Likert Scale (Primary)**
- 5-point scale: Nie → Selten → Manchmal → Oft → Sehr häufig
- Rendered as horizontal buttons
- Value: 0-4 (integer)
- Active state clearly visible
- Touch targets: minimum 90px wide on mobile

**Yes/No (Binary)**
- Two clear buttons: "Ja" / "Nein"
- Full-width on mobile, side-by-side on desktop

**Multiple Choice**
- Radio buttons with clear labels
- Vertical stack for readability
- Single selection only

#### Grouping Strategy

Questions are grouped into steps by theme:

1. **Stressoren** (Stressors)
   - Work-related stress
   - Personal stress
   - Environmental stress

2. **Körperliche Symptome** (Physical Symptoms)
   - Sleep quality
   - Physical tension
   - Energy levels

3. **Emotionale Belastung** (Emotional Burden)
   - Mood changes
   - Anxiety levels
   - Irritability

4. **Bewältigungsstrategien** (Coping Strategies)
   - Current coping methods
   - Support systems
   - Resilience factors

**Grouping Benefits:**
- Reduces cognitive load
- Provides natural breakpoints
- Makes progress tangible
- Enables thematic validation

#### Validation States

**Unanswered (Initial)**
- Questions appear neutral
- "Weiter" button disabled or shows helper text
- No error styling

**Invalid (After Attempt)**
- Red border on required unanswered questions
- Error message: "Bitte beantworten Sie diese Frage"
- Scrolls to first invalid question

**Valid**
- "Weiter" button enabled
- Green subtle checkmark (optional)
- Smooth transition available

#### Mobile Behavior
- Single column layout (max-w-3xl)
- Questions stack vertically
- Scale buttons wrap if needed (flex-wrap)
- Buttons fixed at bottom on very small screens
- Sufficient spacing between touch targets (gap-3)
- Typography scales up on larger screens

#### Transitions
- **Next:** → Next Question Step (after validation)
- **Next:** → Result Screen (if last step)
- **Back:** → Previous Question Step
- **Back:** → Intro Screen (if first step)
- **Content Link:** → Content Page (returns to same question)
- **Session Lost:** → Resume Banner on Reload

---

### 3. Optional Content Screens

**Route:** `/patient/funnel/stress-assessment/content/[pageSlug]`  
**Type:** Educational/explanatory  
**State:** Contextual (doesn't affect assessment progress)

#### Purpose
- Provide deeper explanation of concepts
- Educate about stress and resilience
- Answer common questions
- Build trust through transparency

#### Content Types

**Info Pages** (available during assessment)
- `info-was-ist-stress` - What is stress?
- `info-stressbewaeltigung` - Stress management techniques
- `info-resilienz` - Understanding resilience
- Access via inline links in questions

**Result-Related Pages** (shown after completion)
- `result-naechste-schritte` - What to do next
- `result-ressourcen` - Additional resources
- Linked from result screen

#### Screen Anatomy

**Header**
- Back link/button to return to flow
- Content title (H1)
- Optional subtitle

**Content Area**
- Markdown-rendered content
- Professional typography
- Images/diagrams if appropriate
- Comfortable line-height (1.6-1.8)

**Navigation**
- "Zurück zur Frage" (if from question)
- "Weiter" (if part of flow sequence)
- Clear breadcrumb context

#### Mobile Behavior
- Full-width content on mobile
- Max-width (max-w-3xl) for readability on desktop
- Images scale responsively
- Code blocks scroll horizontally if needed
- Touch-friendly link sizing

#### Transitions
- **Back:** → Originating screen (question or result)
- **Next:** → Next step in flow (if sequential)

---

### 4. Result Screen

**Route:** `/patient/funnel/stress-assessment/result?assessmentId={id}`  
**Type:** Assessment completion  
**State:** `completed`

#### Purpose
- Show assessment outcome clearly
- Provide AI-generated insights (AMY)
- Suggest concrete next steps
- Enable further exploration

#### Screen Anatomy

**Header**
- Completion icon/checkmark
- "Assessment abgeschlossen"
- Completion timestamp

**Summary Card (Top)**
- Overall stress score (if applicable)
- Visual representation (gauge, bar, color)
- Risk level indicator (low/medium/high)
- Brief interpretation (1-2 sentences)

**AMY Insights Section**
- "Ihre persönliche Auswertung"
- AI-generated summary (markdown)
- Highlights of key findings
- Personalized observations

**Detail Sections (Expandable/Tabbed)**
- Stress factors identified
- Resilience strengths
- Areas for attention
- Comparison to baseline (if repeat assessment)

**Next Steps Section**
- Concrete action recommendations
- Content page links for deeper exploration
- Option to schedule follow-up
- "Zu meiner Historie" button

**Actions**
- Primary: "Zur Historie" → `/patient/history`
- Secondary: "Neues Assessment starten" → restart flow
- Tertiary: Content links for learning

#### Dynamic Content Blocks

Result pages can include database-driven content blocks:
- Stored in `content_pages` with category `result-*`
- Rendered dynamically based on funnel slug
- Multiple blocks per result page
- Markdown support for rich formatting

**Example Blocks:**
- "Was bedeutet Ihr Ergebnis?"
- "Empfohlene Maßnahmen"
- "Ressourcen und Unterstützung"

#### Mobile Behavior
- Sections stack vertically
- Summary card full-width
- Expandable sections instead of tabs on mobile
- Buttons stack on small screens
- Comfortable reading width

#### Transitions
- **History:** → `/patient/history` (view past assessments)
- **Restart:** → `/patient/funnel/stress-assessment` (new assessment)
- **Content:** → Content pages for detailed topics
- **Home:** → `/patient` (patient portal home)

---

### 5. History Screen

**Route:** `/patient/history`  
**Type:** Overview of past assessments  
**State:** N/A (no active assessment)

#### Purpose
- Show assessment history over time
- Enable comparison of results
- Provide access to past reports
- Encourage regular check-ins

#### Screen Anatomy

**Header**
- Title: "Meine Assessments"
- Optional summary stats (total completed, last date)

**Assessment List**
- Cards or table rows
- Each shows:
  - Date completed
  - Funnel type (e.g., "Stress & Resilienz")
  - Key metric or status
  - "Details ansehen" link

**Empty State**
- Friendly message if no history
- Call to action to start first assessment

**Actions**
- "Neues Assessment" button
- Individual "Ansehen" links for each past assessment

#### Mobile Behavior
- Cards stack on mobile
- Table converts to card layout on small screens
- Easy-to-tap "Ansehen" buttons

#### Transitions
- **View Result:** → Result screen for selected assessment
- **New Assessment:** → `/patient/funnel/stress-assessment`

---

## State Transitions

### Assessment Lifecycle

```
┌─────────────────┐
│  Not Started    │
│                 │
└────────┬────────┘
         │ User clicks "Start"
         ↓
┌─────────────────┐
│  In Progress    │◄─────┐
│                 │      │
│ - Save answers  │      │ Resume after
│ - Navigate      │      │ page reload
│ - Validate      │      │
└────────┬────────┘      │
         │               │
         │ Complete      │
         │ all steps     │
         ↓               │
┌─────────────────┐      │
│   Completed     │      │
│                 │      │
│ - View result   │──────┘
│ - Read-only     │
└─────────────────┘
```

### Step Progression

```
Step 1 → Step 2 → Step 3 → ... → Step N → Result
  ↑        ↑        ↑              ↑
  └────────┴────────┴──────────────┘
        "Zurück" always available
```

### Session Recovery

```
User starts assessment
    ↓
Answers saved to DB (auto)
    ↓
[User closes tab/browser]
    ↓
User returns to app
    ↓
System detects in-progress assessment
    ↓
Shows recovery banner with answer count
    ↓
Restores to last completed step
    ↓
User continues from where they left off
```

---

## Mobile Behavior Specifications

### Viewport Breakpoints

Following Tailwind CSS defaults:
- **xs:** < 640px (mobile phones)
- **sm:** ≥ 640px (large phones, small tablets)
- **md:** ≥ 768px (tablets)
- **lg:** ≥ 1024px (laptops)
- **xl:** ≥ 1280px (desktops)

### Responsive Patterns

**Typography**
```tsx
// Mobile-first scaling
className="text-2xl md:text-3xl"        // Headings scale up
className="text-base md:text-lg"        // Body text slightly larger on desktop
```

**Spacing**
```tsx
// More breathing room on desktop
className="p-6 md:p-8"                  // Padding
className="gap-4 md:gap-6"              // Element spacing
```

**Layout**
```tsx
// Stack on mobile, side-by-side on desktop
className="flex flex-col md:flex-row"  

// Full width on mobile, constrained on desktop
className="w-full max-w-3xl mx-auto"   
```

**Buttons**
```tsx
// Touch-friendly on mobile, optimized on desktop
className="min-w-[90px] sm:min-w-[100px]"
className="w-full sm:w-auto"           // Full width mobile button
```

### Touch Interactions

- **Minimum tap target:** 44x44px (iOS HIG standard)
- **Button padding:** Generous (px-6 py-3 minimum)
- **Spacing between controls:** Minimum 8px (gap-2)
- **Active/focus states:** Clear visual feedback
- **Scroll behavior:** Smooth, no snap except where intentional

### Text Readability

- **Line length:** Max 70 characters (max-w-3xl enforces this)
- **Line height:** 1.6 for body text
- **Contrast ratio:** WCAG AA minimum (4.5:1)
- **Font size:** Minimum 16px to avoid zoom on iOS

### Performance

- **Initial load:** < 3s on 3G
- **Step transition:** < 150ms
- **Scroll to validation error:** Smooth scroll, not instant jump
- **Image loading:** Progressive, with placeholders

---

## Error States & Edge Cases

### Validation Errors

**Required Question Unanswered**
```
┌──────────────────────────────────┐
│ ⚠️  Bitte beantworten Sie alle  │
│     Pflichtfragen                │
└──────────────────────────────────┘
     ↓ (scrolls to first error)
┌──────────────────────────────────┐
│ Wie oft fühlen Sie sich...?      │
│ ❌ Bitte beantworten Sie diese  │
│    Frage                         │
│ ┌──────┬──────┬──────┬──────┐   │
│ │ Nie  │Selten│Manch.│ Oft │   │
└──────────────────────────────────┘
```

### Network Errors

**Auto-save Failed**
```
┌──────────────────────────────────┐
│ ⚠️  Verbindung unterbrochen      │
│    Ihre Antworten werden lokal   │
│    gespeichert und bei der       │
│    nächsten Verbindung           │
│    synchronisiert.               │
└──────────────────────────────────┘
```

**Assessment Load Failed**
```
┌──────────────────────────────────┐
│ ❌  Assessment konnte nicht      │
│     geladen werden               │
│                                  │
│ [Erneut versuchen]  [Zurück]    │
└──────────────────────────────────┘
```

### Session Edge Cases

**Completed Assessment Accessed**
- Redirect to result page immediately
- No editing allowed

**Invalid Assessment ID**
- Redirect to funnel start
- Show error message

**Assessment From Different Funnel**
- Redirect to correct funnel
- Maintain state if same patient

**Concurrent Assessments**
- Allow multiple in-progress assessments
- Clearly label which one is being resumed

---

## Next Steps & Extensibility

### Short-Term Enhancements
- Add visual illustrations to intro screen
- Implement expandable help text for complex questions
- Add "Save & Exit" explicit action
- Progress celebration for milestones (e.g., "Halfway done!")

### Medium-Term Features
- Offline support with Service Worker
- Multi-language support (i18n)
- Voice input for answers (accessibility)
- Dark mode support

### Long-Term Vision
- Adaptive questioning (skip based on previous answers)
- Integration with wearable data
- Longitudinal trend visualization
- Care team sharing options

---

## References

### Related Documentation
- [V0.4-E2 Implementation Summary](V0_4_E2_PATIENT_FLOW_V2.md) - Technical implementation
- [Design Mockup Briefing](DESIGN_MOCKUP_BRIEFING.md) - Visual design direction
- [V0.4 Design Tokens](V0_4_DESIGN_TOKENS.md) - Colors, typography, spacing
- [Epic B Consolidation](../docs/EPIC_B_CONSOLIDATION.md) - Funnel system architecture

### Technical Implementation
- Route: `/app/patient/funnel/[slug]/page.tsx`
- Client: `/app/patient/funnel/[slug]/client.tsx`
- Intro: `/app/patient/funnel/[slug]/intro/`
- Result: `/app/patient/funnel/[slug]/result/`
- Content: `/app/patient/funnel/[slug]/content/[pageSlug]/`

### API Endpoints
- `POST /api/funnels/{slug}/assessments` - Start assessment
- `GET /api/funnels/{slug}/assessments/{id}` - Get status
- `POST /api/funnels/{slug}/assessments/{id}/steps/{stepId}/validate` - Validate step
- `POST /api/assessment-answers/save` - Save answers
- `POST /api/funnels/{slug}/assessments/{id}/complete` - Complete assessment

---

## Acceptance Criteria Review

✅ **Flow description (screens + transitions) is documented in the repo.**
- Complete screen descriptions with purposes
- Clear state transitions and navigation rules
- Documented in `docs/PATIENT_FLOW_V2_STRUCTURE.md`

✅ **Each screen has a clear purpose and a clear "next step".**
- Every screen section includes purpose statement
- Transitions clearly documented for each screen
- Navigation controls explicitly defined

✅ **Mobile behavior is considered from the start (short text, no super-wide forms).**
- Mobile-first design principles stated
- Responsive patterns documented with code examples
- Touch interaction guidelines specified
- Text readability constraints defined
- Performance targets for mobile connections

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-11  
**Status:** Complete and ready for implementation
