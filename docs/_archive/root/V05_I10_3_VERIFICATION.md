# V05-I10.3 Verification Guide

## Quick Verification Checklist

This guide helps verify that KPI tracking is working correctly after deployment.

### 1. Code Quality Checks

✅ **ESLint:** All files pass ESLint validation  
✅ **Prettier:** All files formatted correctly  
✅ **TypeScript:** No type errors in modified files  
✅ **Code Review:** All feedback addressed  

### 2. Manual Testing Steps

#### Test Assessment Start Tracking

1. **Start a new assessment:**
   ```bash
   # Patient portal: Create new stress assessment
   # Navigate to /patient/funnel/stress-assessment
   ```

2. **Verify KPI event in database:**
   ```sql
   -- Check for recent assessment start events
   SELECT 
     entity_id as assessment_id,
     metadata->>'kpi_event' as event_type,
     metadata->>'funnel_slug' as funnel,
     created_at
   FROM audit_log
   WHERE metadata->>'kpi_event' = 'assessment_started'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

   **Expected Result:**
   - One row with your new assessment ID
   - `event_type` = 'assessment_started'
   - `funnel` = 'stress-assessment'
   - Timestamp matches creation time

#### Test Assessment Completion Tracking

1. **Complete an assessment:**
   ```bash
   # Complete all required questions in the funnel
   # Submit the final step
   ```

2. **Verify completion event:**
   ```sql
   -- Check for completion event with duration
   SELECT 
     entity_id as assessment_id,
     metadata->>'kpi_event' as event_type,
     metadata->>'duration_seconds' as duration,
     metadata->>'started_at' as started,
     metadata->>'completed_at' as completed,
     created_at
   FROM audit_log
   WHERE metadata->>'kpi_event' = 'assessment_completed'
   AND entity_id = 'YOUR-ASSESSMENT-ID'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   **Expected Result:**
   - `event_type` = 'assessment_completed'
   - `duration` is a positive number (seconds spent completing)
   - `started` and `completed` timestamps are present

#### Test Time-to-Report Tracking

1. **Generate a report:**
   ```bash
   # After completing assessment, generate report
   # Wait for report to be created
   ```

2. **Verify report generation event:**
   ```sql
   -- Check for report generation with time-to-report
   SELECT 
     entity_id as report_id,
     metadata->>'kpi_event' as event_type,
     metadata->>'assessment_id' as assessment,
     metadata->>'time_to_report_seconds' as time_to_report,
     metadata->>'algorithm_version' as algorithm,
     metadata->>'prompt_version' as prompt,
     created_at
   FROM audit_log
   WHERE metadata->>'kpi_event' = 'report_generation_completed'
   AND metadata->>'assessment_id' = 'YOUR-ASSESSMENT-ID'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   **Expected Result:**
   - `event_type` = 'report_generation_completed'
   - `time_to_report` is a small positive number (usually < 60 seconds)
   - `algorithm` and `prompt` versions are present

### 3. Analytics Queries

#### Completion Rate Analysis

```sql
-- Calculate completion rate for last 7 days
WITH stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE metadata->>'kpi_event' = 'assessment_started') as started,
    COUNT(*) FILTER (WHERE metadata->>'kpi_event' = 'assessment_completed') as completed
  FROM audit_log
  WHERE metadata->>'kpi_event' IN ('assessment_started', 'assessment_completed')
  AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  started,
  completed,
  ROUND(100.0 * completed / NULLIF(started, 0), 2) as completion_rate_percent,
  (started - completed) as dropped
FROM stats;
```

**Expected Result:**
- `completion_rate_percent` should be > 0 and <= 100
- `dropped` = (started - completed)

#### Time-to-Report Statistics

```sql
-- Time-to-report statistics for last 7 days
SELECT
  COUNT(*) as total_reports,
  ROUND(AVG((metadata->>'time_to_report_seconds')::numeric), 2) as avg_seconds,
  MIN((metadata->>'time_to_report_seconds')::numeric) as min_seconds,
  MAX((metadata->>'time_to_report_seconds')::numeric) as max_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (metadata->>'time_to_report_seconds')::numeric) as median_seconds,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'time_to_report_seconds')::numeric) as p95_seconds
FROM audit_log
WHERE metadata->>'kpi_event' = 'report_generation_completed'
AND metadata->>'time_to_report_seconds' IS NOT NULL
AND created_at >= NOW() - INTERVAL '7 days';
```

**Expected Result:**
- `avg_seconds` should be reasonable (typically 1-60 seconds)
- `p95_seconds` should show worst-case performance

#### Assessment Duration by Funnel

```sql
-- Average time users spend on each funnel
SELECT
  metadata->>'funnel_slug' as funnel,
  COUNT(*) as completions,
  ROUND(AVG((metadata->>'duration_seconds')::numeric), 2) as avg_seconds,
  ROUND(AVG((metadata->>'duration_seconds')::numeric) / 60.0, 2) as avg_minutes,
  MIN((metadata->>'duration_seconds')::numeric) as min_seconds,
  MAX((metadata->>'duration_seconds')::numeric) as max_seconds
FROM audit_log
WHERE metadata->>'kpi_event' = 'assessment_completed'
AND metadata->>'duration_seconds' IS NOT NULL
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY metadata->>'funnel_slug'
ORDER BY avg_seconds DESC;
```

**Expected Result:**
- Different funnels have different durations
- Durations are positive and reasonable

### 4. Error Handling Verification

#### Test Non-Blocking Behavior

1. **Simulate audit log unavailable:**
   ```sql
   -- Temporarily revoke permissions (DON'T DO IN PRODUCTION)
   -- This is just for testing that KPI failures don't break requests
   ```

2. **Verify operations still work:**
   - Assessments can still be created
   - Assessments can still be completed
   - Reports can still be generated
   - Check logs for KPI tracking errors

3. **Restore permissions and verify KPI tracking resumes**

#### Check Logs for Errors

```bash
# Look for KPI-related errors in application logs
grep -i "kpi" /path/to/logs | grep -i "error"

# Check for specific error patterns
grep -i "Failed to track KPI event" /path/to/logs
grep -i "Invalid timestamp provided" /path/to/logs
```

**Expected Result:**
- KPI failures logged but don't crash the application
- Operations continue normally even with tracking failures

### 5. Data Quality Checks

#### Validate Timestamp Consistency

```sql
-- Check for assessments with valid start/completion timestamps
SELECT 
  entity_id,
  metadata->>'started_at' as started,
  metadata->>'completed_at' as completed,
  (metadata->>'duration_seconds')::numeric as duration,
  EXTRACT(EPOCH FROM (
    (metadata->>'completed_at')::timestamptz - 
    (metadata->>'started_at')::timestamptz
  ))::integer as calculated_duration
FROM audit_log
WHERE metadata->>'kpi_event' = 'assessment_completed'
AND metadata->>'duration_seconds' IS NOT NULL
AND created_at >= NOW() - INTERVAL '7 days'
LIMIT 10;
```

**Expected Result:**
- `duration` matches `calculated_duration` (within rounding)
- All durations are positive
- No NULL values in critical fields

#### Check for Invalid Data

```sql
-- Look for potentially invalid KPI events
SELECT 
  metadata->>'kpi_event' as event_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE metadata->>'duration_seconds' = '0') as zero_duration,
  COUNT(*) FILTER (WHERE (metadata->>'duration_seconds')::numeric < 0) as negative_duration
FROM audit_log
WHERE metadata->>'kpi_event' IS NOT NULL
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY metadata->>'kpi_event';
```

**Expected Result:**
- `zero_duration` should be very low (edge cases only)
- `negative_duration` should be 0 (validation prevents this)

### 6. Performance Checks

#### Verify Non-Impact on Response Times

```sql
-- Compare response times before/after KPI tracking
-- Use your application performance monitoring tool
-- OR check audit_log creation timestamps

SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as events_logged,
  AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) as avg_interval
FROM audit_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

**Expected Result:**
- No significant slowdown in request processing
- KPI events logged quickly (< 100ms overhead)

### 7. PHI Protection Verification

#### Check Metadata for PHI Leakage

```sql
-- Verify no PHI in KPI event metadata
SELECT DISTINCT
  metadata->>'kpi_event' as event_type,
  jsonb_object_keys(metadata) as metadata_keys
FROM audit_log
WHERE metadata->>'kpi_event' IS NOT NULL
ORDER BY event_type, metadata_keys;
```

**Expected Result:**
- Only allowed keys present (see `ALLOWED_METADATA_KEYS` in `lib/audit/log.ts`)
- No keys containing PHI (name, email, phone, clinical_notes, etc.)

#### Validate Redaction

```sql
-- Check that PHI fields are redacted if accidentally included
SELECT 
  metadata
FROM audit_log
WHERE metadata->>'kpi_event' IS NOT NULL
AND (
  metadata ? 'email' OR
  metadata ? 'name' OR
  metadata ? 'phone' OR
  metadata ? 'notes' OR
  metadata ? 'content'
)
LIMIT 10;
```

**Expected Result:**
- No rows returned (PHI fields should be blocked)
- If any rows exist, values should be '[REDACTED]'

### 8. Deployment Verification

After deploying to production:

1. ✅ Monitor logs for first 24 hours
2. ✅ Run completion rate query daily for first week
3. ✅ Check time-to-report metrics are reasonable
4. ✅ Verify no increase in error rates
5. ✅ Confirm KPI tracking overhead is minimal
6. ✅ Review PHI protection is working

### 9. Success Criteria

The implementation is successful if:

- ✅ All KPI events are being logged to `audit_log`
- ✅ Completion rate can be calculated from the data
- ✅ Time-to-report metrics are accurate
- ✅ No PHI leakage in metadata
- ✅ KPI tracking failures don't break user operations
- ✅ Performance impact is negligible (< 50ms per request)
- ✅ Analytics queries run efficiently (< 1 second)

### 10. Troubleshooting

#### Issue: No KPI Events Logged

**Check:**
```sql
-- Verify audit_log is accessible
SELECT COUNT(*) FROM audit_log WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Check for any audit events (not just KPI)
SELECT entity_type, action, COUNT(*) 
FROM audit_log 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY entity_type, action;
```

**Solution:**
- Check Supabase service role key is configured
- Verify `logAuditEvent()` function is working
- Check RLS policies on `audit_log` table

#### Issue: Duration is Always 0

**Check:**
```sql
-- Check if started_at is being set on assessments
SELECT id, started_at, completed_at, status
FROM assessments
ORDER BY started_at DESC NULLS LAST
LIMIT 10;
```

**Solution:**
- Ensure `started_at` is set when assessment is created
- Verify `completed_at` is set when assessment completes
- Check `calculateDurationSeconds()` validation logic

#### Issue: Time-to-Report is Missing

**Check:**
```sql
-- Check if assessment completed_at exists when report is generated
SELECT 
  r.id as report_id,
  r.assessment_id,
  r.created_at as report_created,
  a.completed_at as assessment_completed
FROM reports r
JOIN assessments a ON a.id = r.assessment_id
WHERE r.created_at >= NOW() - INTERVAL '1 hour';
```

**Solution:**
- Ensure assessment is completed before generating report
- Check report generation flow includes KPI tracking
- Verify `calculateTimeToReport()` is called correctly

---

## Summary

This implementation provides comprehensive KPI tracking for:
- ✅ Assessment completion rate
- ✅ Assessment duration
- ✅ Time-to-report performance
- ✅ Report generation success/failure

All metrics are PHI-free, stored in the existing `audit_log` table, and queryable via SQL for analytics and monitoring.
