# V05-I07.2 Patient Detail Page Visual Structure

## Page Layout (After Changes)

```
┌──────────────────────────────────────────────────────────────┐
│ ← Zurück zur Übersicht                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Patient Overview Header (Existing)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  👤 Max Mustermann                                      │ │
│  │  📅 45 Jahre (Jahrgang 1978)  👤 Männlich  ⚡ ID: abc1..│ │
│  │  [High Risk] [Pending Assessment]                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Overview] [Assessments] [AMY Insights] [Actions]          │
│  ━━━━━━━━                                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  OVERVIEW TAB                                               │
│                                                              │
│  Summary Statistics (Existing)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │Total Assess │ │Latest Stress│ │Latest Sleep │          │
│  │     12      │ │     78      │ │     65      │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                              │
│  Charts (Existing, if enabled)                              │
│  ┌──────────────────────┐ ┌──────────────────────┐        │
│  │ 📊 Stress-Verlauf    │ │ 📊 Schlaf-Verlauf    │        │
│  │  [Line Chart]        │ │  [Line Chart]        │        │
│  └──────────────────────┘ └──────────────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     🆕 NEW SECTIONS                      ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                          ││
│  │  Key Labs & Medications (2-column grid)                 ││
│  │  ┌────────────────────────┐ ┌───────────────────────┐  ││
│  │  │ 🧪 Key Labs            │ │ 💊 Medikamente        │  ││
│  │  │                        │ │                       │  ││
│  │  │ 📈 Cholesterol         │ │ Aspirin [81mg]        │  ││
│  │  │    180 mg/dL           │ │ Häufigkeit: daily     │  ││
│  │  │    Ref: < 200          │ │ Route: oral           │  ││
│  │  │    📅 2026-01-01       │ │                       │  ││
│  │  │                        │ │ Metoprolol [50mg]     │  ││
│  │  │ 📈 Blood Glucose       │ │ Häufigkeit: twice     │  ││
│  │  │    95 mg/dL            │ │ Route: oral           │  ││
│  │  │    Ref: 70-100         │ │                       │  ││
│  │  └────────────────────────┘ └───────────────────────┘  ││
│  │                                                          ││
│  │  Findings & Scores                                      ││
│  │  ┌──────────────────────────────────────────────────┐  ││
│  │  │ 🛡️ Findings & Scores                             │  ││
│  │  │                                                    │  ││
│  │  │ Safety Score: 85 / 100 [Gut ✓]                    │  ││
│  │  │                                                    │  ││
│  │  │ Findings Übersicht:                               │  ││
│  │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │  ││
│  │  │ │Krit: 0│ │Hoch:1│ │Mitt:2│ │Nied:3│             │  ││
│  │  │ └──────┘ └──────┘ └──────┘ └──────┘             │  ││
│  │  │                                                    │  ││
│  │  │ Berechnete Scores:                                │  ││
│  │  │ • stress_score: 78                                │  ││
│  │  │ • resilience_score: 65                            │  ││
│  │  │                                                    │  ││
│  │  │ Risk Models: 2 Modell(e) verfügbar               │  ││
│  │  └──────────────────────────────────────────────────┘  ││
│  │                                                          ││
│  │  Empfohlene Interventionen                              ││
│  │  ┌──────────────────────────────────────────────────┐  ││
│  │  │ 🎯 Empfohlene Interventionen                      │  ││
│  │  │                                                    │  ││
│  │  │ ┌──────────────────────────────────────────────┐ │  ││
│  │  │ │ ① Atemübungen              [Sehr hoch 🔴]    │ │  ││
│  │  │ │ Säule: Stress Management                     │ │  ││
│  │  │ │ ┌────────┐ ┌────────┐ ┌────────┐            │ │  ││
│  │  │ │ │Prior:85│ │Impact:│ │Umset:90│            │ │  ││
│  │  │ │ └────────┘ └90─────┘ └────────┘            │ │  ││
│  │  │ │ [high_stress] [immediate_benefit]            │ │  ││
│  │  │ └──────────────────────────────────────────────┘ │  ││
│  │  │                                                    │  ││
│  │  │ ┌──────────────────────────────────────────────┐ │  ││
│  │  │ │ ② Schlafhygiene            [Hoch 🟡]        │ │  ││
│  │  │ │ Säule: Sleep                                 │ │  ││
│  │  │ │ ┌────────┐ ┌────────┐ ┌────────┐            │ │  ││
│  │  │ │ │Prior:72│ │Impact:│ │Umset:88│            │ │  ││
│  │  │ │ └────────┘ └80─────┘ └────────┘            │ │  ││
│  │  │ └──────────────────────────────────────────────┘ │  ││
│  │  │                                                    │  ││
│  │  │ ... [3 more interventions] ...                    │  ││
│  │  └──────────────────────────────────────────────────┘  ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Raw Data (Existing, collapsible)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Rohdaten (JSON)                    [Verbergen]          │ │
│  │ { ... }                                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Component Hierarchy (Updated)

```
PatientDetailPage
├── Back Button
├── PatientOverviewHeader (Existing)
├── Tabs
│   ├── TabsList
│   │   ├── TabTrigger "Overview"
│   │   ├── TabTrigger "Assessments"
│   │   ├── TabTrigger "AMY Insights"
│   │   └── TabTrigger "Actions"
│   ├── TabContent "overview"
│   │   ├── Summary Stats Cards (3) [Existing]
│   │   ├── Charts Section [Existing, optional]
│   │   │   ├── StressChart
│   │   │   └── SleepChart
│   │   ├── 🆕 Key Labs & Medications Grid (2-column)
│   │   │   ├── KeyLabsSection
│   │   │   │   ├── Card
│   │   │   │   ├── Header (icon + title)
│   │   │   │   └── Lab Value Items (max 5)
│   │   │   │       └── [test_name, value, unit, ref_range, date]
│   │   │   └── MedicationsSection
│   │   │       ├── Card
│   │   │       ├── Header (icon + title)
│   │   │       └── Medication Items
│   │   │           └── [name, dosage badge, frequency, route]
│   │   ├── 🆕 FindingsScoresSection
│   │   │   ├── Card
│   │   │   ├── Header (icon + title)
│   │   │   ├── Safety Score Card
│   │   │   │   └── [score, badge]
│   │   │   ├── Findings Breakdown Grid
│   │   │   │   └── [critical, high, medium, low counts]
│   │   │   ├── Calculated Scores List
│   │   │   │   └── [key-value pairs]
│   │   │   └── Risk Models Summary
│   │   ├── 🆕 InterventionsSection
│   │   │   ├── Card
│   │   │   ├── Header (icon + title)
│   │   │   └── Intervention Items (max 5)
│   │   │       └── [rank, topic, pillar, priority badge]
│   │   │           └── Scores Grid [priority, impact, feasibility]
│   │   │           └── Signals Tags
│   │   └── Raw Data Card [Existing]
│   ├── TabContent "assessments" [Existing]
│   ├── TabContent "insights" [Existing]
│   └── TabContent "actions" [Existing]
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Patient Detail Page                     │
│                                                              │
│  useEffect(() => {                                          │
│    // Existing queries                                      │
│    ├─→ Load patient_profiles                               │
│    ├─→ Load patient_measures                               │
│    │                                                         │
│    // 🆕 New queries for additional sections                │
│    ├─→ Load assessments (get assessment_ids)               │
│    │   │                                                    │
│    │   ├─→ Load documents                                  │
│    │   │   WHERE assessment_id IN (assessment_ids)         │
│    │   │   AND extracted_json IS NOT NULL                  │
│    │   │   ORDER BY created_at DESC                        │
│    │   │   LIMIT 10                                        │
│    │   │   └─→ setDocuments()                              │
│    │   │                                                    │
│    │   ├─→ Load reports (latest)                           │
│    │   │   WHERE assessment_id IN (assessment_ids)         │
│    │   │   SELECT safety_score, safety_findings            │
│    │   │   ORDER BY created_at DESC                        │
│    │   │   LIMIT 1                                         │
│    │   │   └─→ setLatestReport()                           │
│    │   │                                                    │
│    │   ├─→ Load calculated_results (latest)                │
│    │   │   WHERE assessment_id IN (assessment_ids)         │
│    │   │   SELECT scores, risk_models                      │
│    │   │   ORDER BY created_at DESC                        │
│    │   │   LIMIT 1                                         │
│    │   │   └─→ setLatestCalculated()                       │
│    │   │                                                    │
│    │   └─→ Load processing_jobs (get job_ids)              │
│    │       WHERE assessment_id IN (assessment_ids)         │
│    │       │                                                │
│    │       └─→ Load priority_rankings (latest)             │
│    │           WHERE job_id IN (job_ids)                   │
│    │           SELECT ranking_data                         │
│    │           ORDER BY created_at DESC                    │
│    │           LIMIT 1                                     │
│    │           └─→ setLatestRanking()                      │
│  }, [patientId])                                            │
│                                                              │
│  // Render                                                  │
│  ├─→ KeyLabsSection                                        │
│  │   labValues={documents.flatMap(lab_values)[0-4]}        │
│  │                                                          │
│  ├─→ MedicationsSection                                    │
│  │   medications={documents.flatMap(medications)}          │
│  │                                                          │
│  ├─→ FindingsScoresSection                                 │
│  │   safetyScore={latestReport?.safety_score}              │
│  │   safetyFindings={latestReport?.safety_findings}        │
│  │   calculatedScores={latestCalculated?.scores}           │
│  │   riskModels={latestCalculated?.risk_models}            │
│  │                                                          │
│  └─→ InterventionsSection                                  │
│      interventions={latestRanking?.ranking_data            │
│                     ?.topInterventions[0-4]}               │
└─────────────────────────────────────────────────────────────┘
```

## Color Palette (By Section)

### Key Labs Section
- **Primary:** Sky-600 (icon), Sky-400 (dark mode)
- **Values:** Sky-600 (dark: Sky-400)
- **Background:** Slate-50 (dark: Slate-800/50)
- **Border:** Slate-100 (dark: Slate-700)

### Medications Section
- **Primary:** Purple-600 (icon), Purple-400 (dark mode)
- **Dosage Badge:** Secondary variant
- **Background:** Slate-50 (dark: Slate-800/50)
- **Border:** Slate-100 (dark: Slate-700)

### Findings & Scores Section
- **Primary:** Emerald-600 (icon), Emerald-400 (dark mode)
- **Safety Score:** Emerald-600 (dark: Emerald-400)
- **Findings Colors:**
  - Critical: Red-50/900 bg, Red-600/400 text
  - High: Orange-50/900 bg, Orange-600/400 text
  - Medium: Amber-50/900 bg, Amber-600/400 text
  - Low: Blue-50/900 bg, Blue-600/400 text

### Interventions Section
- **Primary:** Amber-600 (icon), Amber-400 (dark mode)
- **Rank Badge:** Sky-100/900 bg, Sky-700/300 text
- **Priority Badges:**
  - Sehr hoch (≥80): Danger (Red)
  - Hoch (≥60): Warning (Amber)
  - Mittel (≥40): Info (Blue)
  - Niedrig (<40): Success (Green)

## Responsive Breakpoints

### Desktop (≥ 1024px)
- 2-column grid for Key Labs & Medications
- Full labels and spacing
- Generous padding

### Tablet (768px - 1024px)
- 2-column grid maintained
- Slightly reduced spacing
- Full labels visible

### Mobile (< 768px)
- Key Labs & Medications stack to 1 column
- Card layouts stack vertically
- Reduced padding
- Compact text sizes (text-sm instead of text-base)
- Findings grid adapts (2x2 instead of 4 columns)

## Empty States

All new sections have consistent empty states:
- Icon (8x8, slate-300/600)
- Message in German
- Proper spacing
- No action required (informational only)

Examples:
- "Keine Labordaten verfügbar"
- "Keine Medikamentendaten verfügbar"
- "Keine Findings oder Scores verfügbar"
- "Keine Interventionen verfügbar"
