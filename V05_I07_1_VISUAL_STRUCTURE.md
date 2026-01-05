# Triage Page Visual Structure

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAVIGATION BAR (DesktopLayout)                                     │
│  Rhythmologicum Connect                                             │
│  Übersicht | Triage | Fragebögen | Inhalte           [User Menu]   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Triage / Übersicht                                          │   │
│  │  Aktive Patienten und Funnels mit aktuellem Bearbeitungsstatus  │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  KPI CARDS GRID (4 columns on desktop, 2 on tablet, 1 on mobile)   │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ 🕐 Clock      │ │ ⟳ Loader     │ │ ✓ Check      │ │ ⚠ Warning    │  │
│  │ Unvollständig │ │ In Bearbeitung│ │ Bericht bereit│ │ Markiert     │  │
│  │              │ │              │ │              │ │              │  │
│  │      12      │ │       8      │ │       5      │ │       2      │  │
│  │              │ │              │ │              │ │              │  │
│  │ Noch in      │ │ Bericht wird │ │ Bereit zur   │ │ [BADGE]      │  │
│  │ Bearbeitung  │ │ erstellt     │ │ Einsicht     │ │ Aufmerksamkeit│  │
│  │              │ │              │ │              │ │ erforderlich │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│   (Gray)          (Blue)           (Green)          (Red)           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  TABLE HEADER                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Alle Assessments                                            │   │
│  │  27 aktive Assessments insgesamt                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ASSESSMENTS TABLE                                                   │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Patient:in │ Funnel         │ Status        │ Gestartet │ Abg.│ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Max Müller │ Stress         │ [BADGE:       │ 05.01.26  │ —   │ │
│  │            │ Assessment     │  Markiert]    │ 14:30     │     │ │
│  │            │                │ High risk     │           │     │ │
│  │            │                │ detected      │           │     │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Anna       │ Resilience     │ [BADGE:       │ 05.01.26  │ 05.│ │
│  │ Schmidt    │ Check          │  In Bearbeitg]│ 12:15     │ 01. │ │
│  │            │                │               │           │ 14:30│ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Klaus      │ Stress         │ [BADGE:       │ 04.01.26  │ 04.│ │
│  │ Weber      │ Assessment     │  Bericht      │ 16:20     │ 01. │ │
│  │            │                │  bereit]      │           │ 16:45│ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Maria      │ Sleep          │ [BADGE:       │ 04.01.26  │ —   │ │
│  │ Fischer    │ Quality        │  Unvollständig│ 10:00     │     │ │
│  │            │                │               │           │     │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ [... more rows ...]                                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  (Clickable rows - navigate to patient detail page)                │
└─────────────────────────────────────────────────────────────────────┘
```

## Status Badge Colors & Meanings

### 🟦 Unvollständig (Incomplete)
- **Color**: Gray (secondary)
- **Icon**: Clock ⏰
- **Meaning**: Patient has not completed the assessment
- **Action**: Wait for patient to complete

### 🔵 In Bearbeitung (Processing)
- **Color**: Blue (info)
- **Icon**: Loader ⟳
- **Meaning**: Assessment completed, report generation in progress
- **Action**: No action needed, system is processing

### 🟢 Bericht bereit (Report Ready)
- **Color**: Green (success)
- **Icon**: FileCheck ✓
- **Meaning**: Report is ready for clinician review
- **Action**: Review the report

### 🔴 Markiert (Flagged)
- **Color**: Red (danger)
- **Icon**: AlertTriangle ⚠
- **Meaning**: High risk detected OR processing failed
- **Sub-text**: "High risk detected" or "Processing failed"
- **Action**: Immediate attention required

## Responsive Behavior

### Desktop (>1024px)
```
┌────────┬────────┬────────┬────────┐
│  Card  │  Card  │  Card  │  Card  │  (4 columns)
└────────┴────────┴────────┴────────┘
┌──────────────────────────────────┐
│         Full Width Table         │
└──────────────────────────────────┘
```

### Tablet (640px - 1024px)
```
┌────────┬────────┐
│  Card  │  Card  │  (2x2 grid)
├────────┼────────┤
│  Card  │  Card  │
└────────┴────────┘
┌────────────────┐
│ Full Width Tbl │
└────────────────┘
```

### Mobile (<640px)
```
┌────────┐
│  Card  │  (Stacked)
├────────┤
│  Card  │
├────────┤
│  Card  │
├────────┤
│  Card  │
└────────┘
┌────────┐
│ Scroll │
│ Table  │
└────────┘
```

## Data Flow Visualization

```
USER
  │
  ↓
Navigate to /clinician/triage
  │
  ↓
TriagePage Component Mounts
  │
  ↓
useEffect: loadTriageData()
  │
  ├─→ Query: assessments (limit 100)
  │    └─→ Join: patient_profiles
  │    └─→ Join: funnels
  │
  ├─→ Query: processing_jobs (filtered by assessment_ids)
  │
  └─→ Query: reports (filtered by assessment_ids)
  │
  ↓
Map data together
  │
  ├─→ Create processingMap (assessment_id → processing_job)
  ├─→ Create reportsMap (assessment_id → report)
  │
  ↓
For each assessment:
  │
  ├─→ Get processing job (if exists)
  ├─→ Get report (if exists)
  │
  ├─→ Determine triage_status:
  │    │
  │    ├─→ status = 'in_progress' → incomplete
  │    │
  │    ├─→ processing.status = 'failed' → flagged
  │    │
  │    ├─→ processing.status = 'completed' 
  │    │   AND delivery_status = 'DELIVERED'
  │    │   AND report.risk_level != 'high' → report_ready
  │    │
  │    ├─→ processing.status = 'completed' 
  │    │   AND report.risk_level = 'high' → flagged
  │    │
  │    ├─→ processing.status in ['queued', 'in_progress'] → processing
  │    │
  │    └─→ completed_at exists but no processing → processing
  │
  └─→ Create AssessmentTriage object
  │
  ↓
Set state: setAssessments(triageData)
  │
  ↓
useMemo: Calculate stats
  │
  ├─→ Count incomplete
  ├─→ Count processing
  ├─→ Count report_ready
  └─→ Count flagged
  │
  ↓
Render UI:
  │
  ├─→ KPI Cards (display stats)
  └─→ Table (display assessments)
  │
  ↓
USER INTERACTION
  │
  ├─→ Click row → Navigate to /clinician/patient/{patient_id}
  ├─→ Sort column → Re-sort table data
  └─→ Hover row → Show visual feedback
```

## Navigation Integration

```
Clinician Dashboard Layout
  │
  ├─→ Übersicht (/clinician)
  │    └─→ Shows patient_measures summary (old dashboard)
  │
  ├─→ Triage (/clinician/triage) ← NEW
  │    └─→ Shows assessments with processing status
  │
  ├─→ Fragebögen (/clinician/funnels)
  │    └─→ Funnel management
  │
  └─→ Inhalte (/admin/content)
       └─→ Content management
```

## Example Data States

### Example 1: High-Risk Flagged Assessment
```
Patient: Max Müller
Funnel: Stress Assessment
Status: [RED BADGE: Markiert]
        High risk detected
Started: 05.01.2026 14:30
Completed: 05.01.2026 14:45

Database State:
- assessments.status = 'completed'
- processing_jobs.status = 'completed'
- processing_jobs.delivery_status = 'DELIVERED'
- reports.risk_level = 'high'
→ Result: triage_status = 'flagged'
```

### Example 2: Processing Assessment
```
Patient: Anna Schmidt
Funnel: Resilience Check
Status: [BLUE BADGE: In Bearbeitung]
Started: 05.01.2026 12:15
Completed: 05.01.2026 14:30

Database State:
- assessments.status = 'completed'
- processing_jobs.status = 'in_progress'
- processing_jobs.stage = 'risk'
→ Result: triage_status = 'processing'
```

### Example 3: Report Ready
```
Patient: Klaus Weber
Funnel: Stress Assessment
Status: [GREEN BADGE: Bericht bereit]
Started: 04.01.2026 16:20
Completed: 04.01.2026 16:45

Database State:
- assessments.status = 'completed'
- processing_jobs.status = 'completed'
- processing_jobs.delivery_status = 'DELIVERED'
- reports.status = 'completed'
- reports.risk_level = 'low'
→ Result: triage_status = 'report_ready'
```

### Example 4: Incomplete Assessment
```
Patient: Maria Fischer
Funnel: Sleep Quality
Status: [GRAY BADGE: Unvollständig]
Started: 04.01.2026 10:00
Completed: —

Database State:
- assessments.status = 'in_progress'
- assessments.current_step_id = {some_step_id}
→ Result: triage_status = 'incomplete'
```
