# V05-I07.1: Triage/Overview Implementation Summary

## Issue
**V05-I07.1** — Triage/Overview (Status: incomplete/processing/report ready/flagged)

**Acceptance Criteria:**
- Liste aktiver Patienten/Funnels + Status

## Implementation

### Overview
Created a new triage page at `/app/clinician/triage/page.tsx` that displays all active assessments with their current processing status. The page provides clinicians with a comprehensive overview of patient assessments categorized by their workflow state.

### Files Changed

#### 1. **New File: `app/clinician/triage/page.tsx`**
- **Purpose**: Main triage dashboard showing assessments with status indicators
- **Features**:
  - Displays assessments from the `assessments` table
  - Joins with `processing_jobs` to determine processing status
  - Joins with `reports` to determine report availability and risk level
  - Categorizes each assessment into one of four triage statuses

#### 2. **Modified: `lib/utils/roleBasedRouting.ts`**
- **Changes**: Added "Triage" navigation item to all clinician-facing navigation menus
- **Affected Functions**:
  - `getClinicianNavItems()` - Added triage link
  - `getAdminNavItems()` - Added triage link
  - `getNurseNavItems()` - Added triage link

### Triage Status Logic

The triage page implements a sophisticated status determination algorithm:

#### Status Categories

1. **Incomplete** (`incomplete`)
   - Assessment status is `'in_progress'`
   - Badge: Gray/Secondary
   - Icon: Clock
   - Meaning: Patient has not yet completed the assessment

2. **Processing** (`processing`)
   - Assessment is completed but processing job is `'queued'` or `'in_progress'`
   - OR assessment is completed but no processing job exists yet
   - Badge: Blue/Info
   - Icon: Loader
   - Meaning: Report generation is in progress

3. **Report Ready** (`report_ready`)
   - Processing job status is `'completed'`
   - Processing delivery_status is `'DELIVERED'`
   - No high-risk flag detected
   - Badge: Green/Success
   - Icon: FileCheck
   - Meaning: Report is ready for clinician review

4. **Flagged** (`flagged`)
   - Processing job status is `'failed'`
   - OR report risk_level is `'high'`
   - Badge: Red/Danger
   - Icon: AlertTriangle
   - Includes flagged_reason field (e.g., "Processing failed", "High risk detected")
   - Meaning: Requires immediate clinician attention

### User Interface Components

#### KPI Cards (4 cards)
1. **Unvollständig** (Incomplete)
   - Shows count of incomplete assessments
   - Gray background
   - Clock icon

2. **In Bearbeitung** (Processing)
   - Shows count of assessments being processed
   - Blue background
   - Loader icon

3. **Bericht bereit** (Report Ready)
   - Shows count of reports ready for review
   - Green background
   - FileCheck icon

4. **Markiert** (Flagged)
   - Shows count of flagged assessments
   - Red background
   - AlertTriangle icon
   - Shows "Aufmerksamkeit erforderlich" badge if count > 0

#### Data Table
Columns:
- **Patient:in**: Patient name (from patient_profiles)
- **Funnel**: Funnel title or slug
- **Status**: Triage status badge with optional flagged reason
- **Gestartet**: Start timestamp
- **Abgeschlossen**: Completion timestamp (if completed)

Features:
- Click on row to navigate to patient detail page
- Sortable columns
- Responsive design
- Shows up to 100 most recent assessments

### Data Flow

```
1. Load assessments from database
   ↓
2. Join with patient_profiles (for patient name)
   ↓
3. Join with funnels (for funnel title)
   ↓
4. Fetch processing_jobs (by assessment_ids)
   ↓
5. Fetch reports (by assessment_ids)
   ↓
6. Map data together
   ↓
7. Determine triage_status for each assessment
   ↓
8. Display in UI
```

### Database Tables Used

- **assessments**: Core assessment data
  - `id`, `patient_id`, `funnel`, `funnel_id`
  - `started_at`, `completed_at`, `status`, `state`

- **patient_profiles**: Patient information
  - `full_name`, `user_id`

- **funnels**: Funnel metadata
  - `slug`, `title`

- **processing_jobs**: Processing pipeline status
  - `assessment_id`, `status`, `stage`, `delivery_status`

- **reports**: Generated reports
  - `assessment_id`, `id`, `status`, `risk_level`

### Permissions & Security

- Page is protected by middleware (requires clinician/admin/nurse role)
- Uses client-side Supabase client with RLS policies
- Only displays assessments accessible to the current user based on RLS

### Design System Compliance

All components follow the v0.4 design system:

- **Components**: Badge, Button, Card, Table, LoadingSpinner, ErrorState from `@/lib/ui`
- **Icons**: lucide-react (Clock, Loader, FileCheck, AlertTriangle)
- **Colors**: Design token color palette (slate, blue, green, red)
- **Typography**: Consistent heading and text sizes
- **Spacing**: TailwindCSS spacing scale (gap-6, mb-8, etc.)
- **Responsive**: Grid layout adapts from 1 column (mobile) to 4 columns (desktop)

### Navigation Integration

The triage page is accessible via:
- Navigation menu: "Triage" link (second item after "Übersicht")
- Direct URL: `/clinician/triage`
- Available to: clinician, admin, nurse roles

### Error Handling

- Loading state: Shows spinner with "Triage-Übersicht wird geladen…"
- Error state: Shows ErrorState component with retry button
- Empty state: Shows table empty message "Noch keine Assessments vorhanden"
- Graceful degradation: If processing_jobs or reports queries fail, logs warning but continues

### Performance Considerations

1. **Data Fetching**:
   - Single query for assessments (limit 100)
   - Separate queries for processing_jobs and reports (filtered by assessment IDs)
   - Client-side joins using Map data structures (O(n) complexity)

2. **Memoization**:
   - Stats calculation memoized with `useMemo`
   - Callback functions memoized with `useCallback`
   - Table columns memoized

3. **Optimization Opportunities** (Future):
   - Server-side rendering with Next.js App Router
   - Database view combining assessments + processing + reports
   - Real-time updates with Supabase subscriptions

### Testing Recommendations

1. **Different Assessment States**:
   - In-progress assessment (incomplete)
   - Completed assessment with no processing job (processing)
   - Completed assessment with active processing job (processing)
   - Completed assessment with delivered report (report ready)
   - Completed assessment with failed processing (flagged)
   - Completed assessment with high risk report (flagged)

2. **Edge Cases**:
   - No assessments at all
   - Single assessment
   - 100+ assessments (pagination)
   - Missing patient_profiles data
   - Missing funnels data

3. **UI Interactions**:
   - Click on assessment row → navigates to patient detail
   - Sort table columns
   - Responsive breakpoints (mobile, tablet, desktop)

### Known Limitations

1. **Static Data**: No real-time updates (requires manual page refresh)
2. **Pagination**: Limited to 100 most recent assessments
3. **Filtering**: No filtering controls (future enhancement)
4. **Search**: No search functionality (future enhancement)

### Future Enhancements

Potential improvements for future iterations:

1. **Filtering & Search**:
   - Filter by triage status (e.g., show only flagged)
   - Search by patient name
   - Date range filtering

2. **Sorting**:
   - Default sort by status priority (flagged → processing → incomplete → ready)
   - Secondary sort by date

3. **Real-time Updates**:
   - WebSocket/subscription for live status changes
   - Auto-refresh option
   - Push notifications for new flagged assessments

4. **Bulk Actions**:
   - Select multiple assessments
   - Batch acknowledge/review
   - Export selected

5. **Additional Metadata**:
   - Show processing stage (risk, ranking, content, etc.)
   - Show report delivery timestamp
   - Show clinician assigned to case

6. **Performance**:
   - Server-side rendering
   - Infinite scroll or cursor-based pagination
   - Database view for optimized queries

## Acceptance Criteria Status

✅ **Liste aktiver Patienten/Funnels + Status**
- Displays all active assessments with patient names
- Shows funnel information (title/slug)
- Displays triage status (incomplete/processing/report ready/flagged)
- Organized in a sortable, navigable table
- Includes KPI summary cards

## Summary

The triage page successfully implements the acceptance criteria by providing clinicians with a comprehensive overview of all active patient assessments. The four-state status system (incomplete/processing/report ready/flagged) gives clear visibility into workflow progression and highlights cases requiring immediate attention. The implementation follows the v0.4 design system, integrates seamlessly with existing navigation, and provides a solid foundation for future enhancements.
