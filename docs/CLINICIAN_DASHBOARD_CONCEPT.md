# Clinician Dashboard - Design Concept

> **Document Type:** Design Specification  
> **Status:** Documented (Post-Implementation)  
> **Version:** 1.0  
> **Last Updated:** 2025-12-13  
> **Related Issue:** #213 (Design Clinician Dashboard Layout & KPIs)

## Overview

This document defines the design concept for the Clinician Dashboard—the primary landing page that clinicians see immediately after login. The dashboard serves as a command center for monitoring patient stress assessments, identifying high-risk cases, and accessing key management functions.

## Primary User Goals

When a clinician logs in, they need to answer these questions immediately:

1. **"Are there any urgent cases I need to address right now?"**
2. **"How many patients are currently active in the system?"**
3. **"What's the overall assessment activity today?"**
4. **"Which patients should I review first?"**

The dashboard design prioritizes rapid information scanning and immediate action on critical cases.

---

## Layout Structure

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  HEADER                                                 │
│  [Title + Description]              [Quick Actions]    │
├─────────────────────────────────────────────────────────┤
│  KPI CARDS GRID                                         │
│  [4 Key Metrics in Responsive Grid]                    │
├─────────────────────────────────────────────────────────┤
│  PATIENT ASSESSMENTS TABLE                              │
│  [Sortable list of recent assessments]                 │
└─────────────────────────────────────────────────────────┘
```

### Responsive Behavior

- **Desktop (>1024px):** 4-column KPI grid, inline action buttons
- **Tablet (640-1024px):** 2×2 KPI grid, inline action buttons
- **Mobile (<640px):** Single column stacked layout

---

## Section 1: Page Header

### Layout

- **Left:** Title and descriptive text
- **Right:** Quick action buttons

### Purpose

Provides context and immediate access to common administrative tasks without requiring navigation through multiple pages.

### Components

#### Title

- **Text:** "Dashboard"
- **Style:** Large, bold heading (text-3xl)
- **Purpose:** Clear page identification

#### Description

- **Text:** "Übersicht aller Patientinnen und Patienten mit aktuellen Assessments"
- **Translation:** "Overview of all patients with current assessments"
- **Purpose:** Explains what data is being displayed

#### Quick Actions (2 buttons)

1. **"Funnels verwalten" (Manage Funnels)**
   - **Icon:** Settings gear
   - **Action:** Navigate to `/clinician/funnels`
   - **Purpose:** Quick access to funnel configuration
   - **User Question:** "How do I configure assessment workflows?"

2. **"Exportieren" (Export)**
   - **Icon:** Download
   - **Action:** Trigger print dialog for data export
   - **Purpose:** Enable quick reporting and documentation
   - **User Question:** "How do I export this data for records?"

### Responsive Behavior

- Desktop: Buttons displayed inline to the right
- Mobile: Buttons stack vertically below title

---

## Section 2: KPI Cards Grid

### Layout

Four equally-sized cards in a responsive grid, displaying key performance indicators.

### Design Pattern

Each card follows a consistent structure:

- **Icon** (top-right): Visual category identifier with colored background
- **Label** (top-left): Metric name
- **Value** (center-left): Large, bold number
- **Badge** (bottom): Optional status indicator
- **Subtitle** (bottom): Optional descriptive text

### Visual Enhancement

- Hover effect: Shadow increases on hover for interactivity feedback
- Color coding: Each card has a unique color for quick visual scanning

---

### KPI Card 1: Active Patients

#### Display

- **Icon:** Users icon (blue background)
- **Label:** "Aktive Patienten" (Active Patients)
- **Value:** Count of unique patients with assessments
- **Subtitle:** "Patienten mit Assessments" (Patients with assessments)

#### Data Source

- Unique `patient_id` count from all `patient_measures`

#### User Question Answered

**"How many patients am I currently managing?"**

#### Purpose

- Provides overall caseload visibility
- Helps clinicians understand workload and resource needs
- Indicates system usage and engagement

#### Clinical Value

- **High count:** May indicate need for additional resources or triage
- **Low count:** May indicate need for patient outreach or onboarding
- **Trending:** Clinician can mentally track growth over time

---

### KPI Card 2: Open Funnels

#### Display

- **Icon:** ClipboardList icon (teal background)
- **Label:** "Offene Funnels" (Open Funnels)
- **Value:** Count of unique patients with active assessments
- **Badge (conditional):** Yellow warning badge showing count of moderate-risk pending assessments

#### Data Source

- Unique patient count with any assessment records
- Badge appears when `moderate` risk assessments exist

#### User Question Answered

**"How many active assessment workflows are in progress?"**

#### Purpose

- Shows current assessment activity across all patients
- Warning badge alerts to moderate-risk cases requiring attention
- Indicates workflow completion status

#### Clinical Value

- **Active funnels:** Indicates ongoing assessments that may need follow-up
- **Pending badge:** Highlights cases in moderate risk that need review
- **Workflow awareness:** Helps prioritize patient contact and follow-ups

#### Badge Logic

- Only appears when moderate-risk assessments exist
- Text: "{count} pending"
- Prompts clinician to review and act on moderate-risk cases

---

### KPI Card 3: Recent Assessments

#### Display

- **Icon:** FileCheck icon (purple background)
- **Label:** "Aktuelle Assessments" (Recent Assessments)
- **Value:** Count of assessments completed in the last 24 hours
- **Badge (conditional):** Blue info badge showing "Today"

#### Data Source

- All `patient_measures` where `created_at` is within the last 24 hours

#### User Question Answered

**"What assessment activity has happened recently?"**

#### Purpose

- Shows immediate system activity and patient engagement
- Indicates daily workflow volume
- Helps identify busy vs. quiet periods

#### Clinical Value

- **High count:** Active patient engagement, may need triage
- **Zero count:** May indicate technical issues or patient disengagement
- **Pattern recognition:** Clinicians can observe daily activity trends

#### Badge Logic

- Appears when count > 0
- Simple "Today" indicator emphasizing recency

---

### KPI Card 4: Red Flags (24h)

#### Display

- **Icon:** AlertTriangle icon (red background)
- **Label:** "Rote Flaggen (24h)" (Red Flags 24h)
- **Value:** Count of high-risk assessments in the last 24 hours
- **Badge (conditional):** Red danger badge showing "Urgent"

#### Data Source

- All `patient_measures` where `risk_level = 'high'` AND `created_at` within last 24 hours

#### User Question Answered

**"Are there any critical cases requiring immediate attention?"**

#### Purpose

- **Critical alert system** for high-risk patients
- Prioritizes clinical attention to most urgent cases
- Provides situational awareness for emergency protocols

#### Clinical Value

- **Zero count:** All clear, normal operations
- **Non-zero count:** Immediate action required
- **Badge "Urgent":** Visual reinforcement of priority
- **Time-bound (24h):** Focuses on recent critical events, not historical data

#### Badge Logic

- Only appears when count > 0
- Red color (danger variant) maximizes visual urgency
- Text: "Urgent" - clear action directive

---

### Why These 4 KPIs?

#### Design Rationale

1. **Balanced Information Architecture**
   - General → Specific (from total patients to critical alerts)
   - Context → Action (from overview to urgent priorities)

2. **Clinical Decision-Making Flow**
   - Start with context (Active Patients)
   - Understand activity (Open Funnels, Recent Assessments)
   - Identify priorities (Red Flags)

3. **Time-Based Filtering**
   - Two cards show current state (Active Patients, Open Funnels)
   - Two cards show 24-hour window (Recent Assessments, Red Flags)
   - Balances long-term and immediate information needs

4. **Risk-Level Coverage**
   - High risk explicitly shown (Red Flags)
   - Moderate risk indicated in badge (Open Funnels)
   - Low risk visible in table details

---

## Section 3: Patient Assessments Table

### Layout

Full-width sortable table below KPI cards.

### Purpose

Provides detailed patient-level information for review and drill-down into individual cases.

### Header

#### Title

- **Text:** "Recent Assessments"
- **Style:** Large heading (text-xl)

#### Subtitle

- **Text:** "Aktuelle Messungen und Risikobewertungen"
- **Translation:** "Current measurements and risk assessments"
- **Purpose:** Clarifies table content

### Table Columns

#### Column 1: Patient:in (Patient)

- **Data:** Patient's full name (or user ID if name unavailable)
- **Sortable:** Yes (alphabetical)
- **User Question:** "Which patient is this?"
- **Style:** Bold font for emphasis

#### Column 2: StressScore

- **Data:** Latest stress score (0-100 scale)
- **Sortable:** Yes (numeric)
- **User Question:** "How severe is the patient's stress level?"
- **Display:** Rounded integer, or "—" if no score available
- **Clinical Value:** Quantitative measure for comparison and tracking

#### Column 3: RiskLevel

- **Data:** Risk assessment category
- **Sortable:** Yes (by severity: high → moderate → low → pending)
- **User Question:** "What's the urgency level?"
- **Display:** Color-coded badge
  - 🔴 **Red (Danger):** High risk
  - 🟡 **Yellow (Warning):** Moderate risk
  - 🟢 **Green (Success):** Low risk
  - ⚪ **Gray (Secondary):** Pending/No assessment
- **Clinical Value:** Visual triage indicator for rapid scanning

#### Column 4: Letzte Messung (Last Measurement)

- **Data:** Timestamp of most recent assessment
- **Sortable:** Yes (chronological)
- **User Question:** "How current is this data?"
- **Format:** German datetime format (DD.MM.YYYY HH:MM)
- **Clinical Value:** Indicates data freshness and follow-up timing

#### Column 5: Messungen (Measurements)

- **Data:** Total count of assessments for this patient
- **Sortable:** No
- **User Question:** "How much historical data exists?"
- **Clinical Value:** Indicates patient engagement and longitudinal data availability

### Interaction

#### Row Click

- **Action:** Navigate to patient detail page (`/clinician/patient/{id}`)
- **Purpose:** Deep dive into individual patient history and assessment details
- **Visual Feedback:** Row background changes on hover

#### Sorting

- **Method:** Click column headers to sort
- **Behavior:** Toggle between ascending/descending order
- **Default:** Sorted by date (most recent first)

#### Empty State

- **Message:** "Noch keine Assessments vorhanden" (No assessments available yet)
- **Purpose:** Clear feedback when no data exists

---

## Design System Integration

### Color Palette

All colors follow the v0.4 design token system:

#### KPI Card Colors

- **Blue (Primary):** Trust, reliability, system-wide metrics
- **Teal:** Activity, process, workflow indicators
- **Purple:** Information, data, recent activity
- **Red:** Urgency, alerts, critical attention

#### Text Colors

- **Slate-900:** Primary headings
- **Slate-700:** Body text
- **Slate-600:** Secondary text
- **Slate-500:** Labels and metadata
- **Slate-400:** Placeholder/empty states

### Typography

- **Page Title:** text-3xl, font-bold
- **Section Headings:** text-xl, font-semibold
- **KPI Labels:** text-sm, font-medium
- **KPI Values:** text-3xl, font-bold
- **Table Text:** text-sm (default), font-medium (patient names)

### Spacing

- **Section Gaps:** mb-8 (between major sections)
- **Card Grid Gap:** gap-6
- **Button Group Gap:** gap-3
- **Internal Card Spacing:** Handled by Card component (padding="lg")

### Components Used

All components from `/lib/ui` design system:

- **Card:** KPI containers with shadow, padding, radius
- **Button:** Quick actions with variant and icon props
- **Badge:** Status indicators with variant-based colors
- **Table:** Data display with sorting and row interaction

---

## User Experience Considerations

### Information Scannability

1. **Color Coding:** Each section uses distinct colors for rapid identification
2. **Icon Usage:** Universal icons supplement text labels for quick comprehension
3. **Typography Hierarchy:** Size and weight guide eye through importance levels
4. **White Space:** Adequate spacing prevents cognitive overload

### Progressive Disclosure

1. **Overview First:** KPIs provide high-level summary
2. **Details on Demand:** Table shows patient-level data
3. **Deep Dive Available:** Click-through to individual patient pages

### Accessibility

- **Keyboard Navigation:** All interactive elements are keyboard-accessible
- **Color + Text:** Risk levels use both color AND text labels (not color alone)
- **Semantic HTML:** Proper heading hierarchy and ARIA attributes
- **High Contrast:** Text colors meet WCAG guidelines

---

## Clinical Workflow Integration

### Morning Briefing Scenario

1. **Login** → Dashboard appears
2. **Scan Red Flags** → Identify urgent cases
3. **Check Recent Activity** → Understand today's volume
4. **Review Table** → Prioritize patient contact list
5. **Click Patient** → Review detailed history
6. **Return to Dashboard** → Continue workflow

### Ongoing Monitoring Scenario

1. **Periodic Dashboard Check** → Quick status update
2. **Notice Moderate Risk Badge** → Open Funnels needs attention
3. **Sort by Risk** → Review moderate cases in table
4. **Contact Patients** → Follow-up communications
5. **Export Data** → Documentation for records

### Configuration Scenario

1. **Dashboard Loaded** → Need to adjust funnel settings
2. **Click "Funnels verwalten"** → Quick navigation to admin
3. **Make Changes** → Configure assessment workflow
4. **Return to Dashboard** → See impact on metrics

---

## Performance Characteristics

### Data Loading

- **Initial Load:** Single query fetches all `patient_measures` with joined `patient_profiles`
- **Client-Side Processing:** Data aggregation happens in browser (useMemo hooks)
- **Re-computation Trigger:** Only when raw data changes, not on every render

### Optimization Techniques

1. **Memoization:** KPI calculations cached with useMemo
2. **Sorted Data:** Table sorting computed once per sort change
3. **Minimal Re-renders:** Component structure prevents unnecessary updates

### Expected Performance

- **Data Fetch:** < 1 second for typical clinic (< 500 patients)
- **UI Render:** Immediate (< 100ms)
- **Sort Operation:** Instant (< 50ms)

---

## Future Enhancement Opportunities

### Phase 2 Features

1. **Filtering**
   - Quick filter buttons (High Risk Only, Recent Activity, etc.)
   - Date range selector
   - Search by patient name

2. **Additional KPIs**
   - Average stress score (trend indicator)
   - Week-over-week comparison
   - Completed vs. pending funnel ratio

3. **Data Visualization**
   - Mini sparkline charts in KPI cards
   - Risk distribution pie chart
   - Activity timeline graph

4. **Real-Time Updates**
   - WebSocket integration for live data
   - Push notifications for new high-risk assessments
   - Auto-refresh option

5. **Customization**
   - User-specific dashboard layouts
   - Saved filter presets
   - Widget reordering/hiding

### Non-Goals (Out of Scope)

- **Patient Editing:** Dashboard is read-only; editing happens on detail pages
- **Direct Messaging:** Communication happens through separate system
- **Appointment Scheduling:** External to assessment platform
- **Billing/Insurance:** Not within clinical workflow scope

---

## Success Metrics

### Quantitative

- **Time to Identify Critical Cases:** < 5 seconds after login
- **Dashboard Load Time:** < 2 seconds
- **Click-Through Rate:** >60% of users click into patient details within first minute

### Qualitative

- **Clinician Feedback:** "I can see what I need immediately"
- **Usability Testing:** 9/10 users find urgent cases without assistance
- **Error Rate:** <5% misclicks on dashboard actions

---

## Documentation References

### Implementation Docs

- **V0_4_E4_CLINICIAN_DASHBOARD_V2.md** - Detailed implementation notes
- **V0_4_E4_LAYOUT_DIAGRAM.md** - Visual layout specifications
- **V0_4_E4_SUMMARY.md** - Epic completion summary

### Design System

- **V0_4_DESIGN_SYSTEM.md** - Component library
- **V0_4_DESIGN_TOKENS.md** - Color, spacing, typography standards

### Related Features

- **PATIENT_FLOW_V2_STRUCTURE.md** - Patient assessment journey
- **EPIC_B_CONSOLIDATION.md** - Funnel system architecture

---

## Acceptance Criteria ✅

- [x] **Dashboard content plan is documented**
  - Complete layout structure defined
  - All sections and components specified
  - Responsive behavior documented

- [x] **Each widget has a clear purpose**
  - All 4 KPI cards have explicit purposes
  - User questions clearly identified for each widget
  - Clinical value articulated for each metric

- [x] **Target user questions answered**
  - Page Header: "How do I access common tasks?"
  - Active Patients: "How many patients am I managing?"
  - Open Funnels: "How many active workflows are in progress?"
  - Recent Assessments: "What activity happened today?"
  - Red Flags: "Are there critical cases requiring immediate attention?"
  - Patient Table: "Which patients should I review and in what order?"

---

## Conclusion

This dashboard design prioritizes rapid information access, clear visual hierarchy, and immediate identification of critical cases. Every widget serves a specific clinical need, answering questions that clinicians ask themselves when starting their workday or checking in throughout the day.

The design balances **situational awareness** (KPIs) with **actionable detail** (table), while providing **quick access to common tasks** (header actions). The result is a dashboard that reduces cognitive load, accelerates clinical decision-making, and ensures no urgent case goes unnoticed.

---

**Status:** Complete ✅  
**Implementation:** See `app/clinician/page.tsx`  
**Parent Epic:** #213
