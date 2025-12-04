# Manual Testing Guide for B2 Save-Logic

## Prerequisites

1. Ensure the database migration is applied:
   - Open Supabase Dashboard
   - Navigate to SQL Editor
   - Copy and execute the content of `supabase/migrations/20241204210000_create_patient_measures_table.sql`

2. Start the development server:
   ```bash
   npm run dev
   ```

## Test Scenarios

### Test 1: First-Time Save (Happy Path)

**Steps:**
1. Navigate to http://localhost:3000/patient/stress-check
2. Fill out all questionnaire fields
3. Click "Antworten speichern & weiter"
4. You'll be redirected to the result page

**Expected Results:**
- Console log: `Patient measure saved: { ... isNew: true }`
- Check Supabase `patient_measures` table: New entry exists for this assessment_id
- Result page displays without errors

**Verification Query:**
```sql
SELECT * FROM patient_measures 
ORDER BY created_at DESC 
LIMIT 1;
```

### Test 2: Idempotency - Page Reload

**Steps:**
1. On the result page from Test 1, press F5 to reload
2. Check the browser console

**Expected Results:**
- Console log: `Patient measure saved: { ... isNew: false }`
- The `patient_measures` table still has only ONE entry for this assessment_id
- Result page displays without errors

**Verification Query:**
```sql
-- Should return count = 1
SELECT assessment_id, COUNT(*) as count
FROM patient_measures
WHERE assessment_id = '<your-assessment-id>'
GROUP BY assessment_id;
```

### Test 3: Race Condition Handling

**Steps:**
1. On the result page, open browser DevTools Console
2. Get the current assessment ID:
   ```javascript
   const assessmentId = new URLSearchParams(window.location.search).get('assessmentId')
   console.log(assessmentId)
   ```
3. Send multiple parallel requests:
   ```javascript
   Promise.all([
     fetch('/api/patient-measures/save', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ assessmentId })
     }),
     fetch('/api/patient-measures/save', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ assessmentId })
     }),
     fetch('/api/patient-measures/save', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ assessmentId })
     })
   ]).then(responses => Promise.all(responses.map(r => r.json())))
     .then(results => {
       console.log('Results:', results)
       const newCount = results.filter(r => r.isNew).length
       const existingCount = results.filter(r => !r.isNew).length
       console.log(`New: ${newCount}, Existing: ${existingCount}`)
     })
   ```

**Expected Results:**
- All 3 requests return status 200
- One has `isNew: true`, two have `isNew: false` (or all have `isNew: false` if entry existed)
- Console output shows: "New: 0-1, Existing: 2-3"
- Database still has only ONE entry for this assessment_id

### Test 4: Error Handling - Invalid Assessment ID

**Steps:**
1. In browser console, execute:
   ```javascript
   fetch('/api/patient-measures/save', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ assessmentId: 'invalid-uuid-12345' })
   })
     .then(r => r.json())
     .then(console.log)
   ```

**Expected Results:**
- Status: 404
- Response body: `{ error: "Assessment nicht gefunden." }`
- No entry created in database

### Test 5: Error Handling - Missing Assessment ID

**Steps:**
1. In browser console, execute:
   ```javascript
   fetch('/api/patient-measures/save', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({})
   })
     .then(r => r.json())
     .then(console.log)
   ```

**Expected Results:**
- Status: 400
- Response body: `{ error: "assessmentId fehlt im Request-Body." }`
- No entry created in database

### Test 6: Verify No Duplicates Exist

**Steps:**
1. After completing all tests above, run this query in Supabase:
   ```sql
   SELECT assessment_id, COUNT(*) as count
   FROM patient_measures
   GROUP BY assessment_id
   HAVING COUNT(*) > 1;
   ```

**Expected Results:**
- Query returns 0 rows (no duplicates)

### Test 7: Verify Cascade Delete

**Steps:**
1. Create a test assessment and measurement
2. Get the assessment_id from the database
3. Delete the assessment:
   ```sql
   DELETE FROM assessments WHERE id = '<test-assessment-id>';
   ```
4. Check patient_measures:
   ```sql
   SELECT * FROM patient_measures WHERE assessment_id = '<test-assessment-id>';
   ```

**Expected Results:**
- The patient_measures entry is automatically deleted (CASCADE)
- Query returns 0 rows

## Database Verification Queries

### View all measurements with details
```sql
SELECT 
  pm.id,
  pm.assessment_id,
  pm.patient_id,
  pm.measurement_type,
  pm.status,
  pm.completed_at,
  a.funnel as assessment_funnel,
  a.created_at as assessment_created
FROM patient_measures pm
LEFT JOIN assessments a ON a.id = pm.assessment_id
ORDER BY pm.completed_at DESC;
```

### Check for duplicate assessments
```sql
SELECT assessment_id, COUNT(*) as count
FROM patient_measures
GROUP BY assessment_id
HAVING COUNT(*) > 1;
```

### Verify unique constraint exists
```sql
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'patient_measures'::regclass;
```

## Acceptance Criteria Verification

✅ **Eine abgeschlossene Messung wird genau einmal gespeichert**
- Verified by Test 1 and Test 6

✅ **Idempotente Logik: Wiederholtes Auslösen derselben Assessment-ID führt nicht zu Duplikaten**
- Verified by Test 2 and Test 3

✅ **Fehler beim Speichern werden geloggt und ans Frontend gemeldet**
- Verified by Test 4 and Test 5
- Check browser console for error logs
- Check server logs for detailed error information

## Clean Up

After testing, you can clean up test data:
```sql
-- Delete all test measurements
DELETE FROM patient_measures;

-- Or delete specific test assessment (which cascades to patient_measures)
DELETE FROM assessments WHERE id = '<test-assessment-id>';
```

---

**Note:** All tests assume the database migration has been applied and the server is running with proper Supabase credentials configured.
