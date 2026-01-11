# Patient Detail Page Testing Guide

## New Sections Added

The patient detail page now includes four new sections in the Overview tab:

### 1. Key Labs Section
- Displays laboratory values extracted from uploaded documents
- Shows test name, value, unit, reference range, and date
- Limits display to 5 most recent lab values
- Empty state if no lab data available

### 2. Medications Section  
- Displays medications extracted from uploaded documents
- Shows medication name, dosage, frequency, and route
- Empty state if no medication data available

### 3. Findings & Scores Section
- Displays safety score (0-100) from reports
- Shows breakdown of findings by severity (critical, high, medium, low)
- Displays calculated scores from algorithm results
- Shows risk models summary
- Empty state if no data available

### 4. Interventions Section
- Displays top priority-ranked interventions
- Shows intervention topic, pillar, and scores (priority, impact, feasibility)
- Displays signal tags for reasoning
- Ranked by priority score
- Empty state if no interventions available

## Data Sources

| Section | Database Table | Fields |
|---------|---------------|--------|
| Key Labs | documents | extracted_json.lab_values |
| Medications | documents | extracted_json.medications |
| Findings/Scores | reports | safety_score, safety_findings |
| Findings/Scores | calculated_results | scores, risk_models |
| Interventions | priority_rankings | ranking_data.topInterventions |

## Testing Scenarios

### Scenario 1: Patient with Complete Data
1. Navigate to patient detail page for patient with:
   - Uploaded documents with extracted lab values and medications
   - Completed assessment with report (safety score, findings)
   - Calculated results with scores
   - Priority rankings with interventions
2. Verify all sections display correctly with data
3. Check responsive layout on mobile/tablet/desktop

### Scenario 2: Patient with Partial Data
1. Navigate to patient detail page for patient with only some data
2. Verify empty states show for missing data sections
3. Check that available data displays correctly

### Scenario 3: New Patient (No Data)
1. Navigate to patient detail page for new patient
2. Verify all new sections show empty states
3. Check that empty states have appropriate icons and messages

## Component Props

### KeyLabsSection
```typescript
{
  labValues: LabValue[]  // Array of lab values
  loading?: boolean      // Loading state
}
```

### MedicationsSection
```typescript
{
  medications: Medication[]  // Array of medications
  loading?: boolean          // Loading state
}
```

### FindingsScoresSection
```typescript
{
  safetyScore?: number | null                  // 0-100
  safetyFindings?: Record<string, unknown> | null
  calculatedScores?: Record<string, unknown> | null
  riskModels?: Record<string, unknown> | null
  loading?: boolean
}
```

### InterventionsSection
```typescript
{
  interventions: RankedIntervention[]  // Top 5 interventions
  loading?: boolean
}
```

## UI Verification Checklist

- [ ] Key Labs section shows lab values in cards with proper formatting
- [ ] Medications section shows medications with dosage badges
- [ ] Findings section shows safety score with color-coded badge
- [ ] Findings section shows severity breakdown grid
- [ ] Interventions section shows ranked list with priority badges
- [ ] All sections have proper empty states
- [ ] Layout is responsive (mobile, tablet, desktop)
- [ ] Colors follow design system (sky, purple, emerald, amber)
- [ ] Icons are appropriate (FlaskConical, Pill, Shield, Target)
- [ ] Text is properly sized and colored
- [ ] Spacing follows design system (gap-6, mb-4, etc.)

