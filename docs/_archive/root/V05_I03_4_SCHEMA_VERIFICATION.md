# V05-I03.4 Schema Verification & Evidence

**Date**: 2026-01-03  
**Issue**: Review feedback on V05-I03.4 - Verify DB schema, deterministic ordering, and security

## 1. Database Schema Verification

### Reports Table Definition

**Source**: `supabase/migrations/20241204120000_create_reports_table.sql`

```sql
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score_numeric INTEGER,
  sleep_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high')),
  report_text_short TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Confirmed Columns Used in Key Outcomes**:
- ✅ `score_numeric` - INTEGER (0-100) - Stress score
- ✅ `sleep_score` - INTEGER (0-100) - Sleep score  
- ✅ `risk_level` - TEXT with CHECK constraint ('low', 'moderate', 'high')
- ✅ `report_text_short` - TEXT - Short interpretation

**All fields used in queries exist in the database schema** - no fantasy columns.

### Indexes for Performance

```sql
CREATE INDEX IF NOT EXISTS idx_reports_assessment_id ON reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
```

## 2. Deterministic Ordering Fix

### Issue
Original implementation only ordered by `created_at DESC`, which could be non-deterministic when multiple reports have the same timestamp.

### Solution
Added secondary ordering by `id DESC` for tie-breaking:

```typescript
.order('created_at', { ascending: false })
.order('id', { ascending: false })
```

### Rationale
- `created_at` orders by time (most recent first)
- `id` (UUID) provides deterministic tie-breaking when timestamps are identical
- Ensures "latest report" is always the same result for same data

### Tests Added
1. Test for deterministic selection with same `created_at`
2. Verification that correct report is selected based on id DESC

## 3. Security & RLS

### Authentication Flow
All queries use `createServerSupabaseClient()` which:
- Uses cookie-based authentication (preserves user context)
- Enforces RLS policies based on authenticated user
- Never uses service role/admin client for patient data reads

**RLS Policies** (from schema):
```sql
-- Patients can view own reports
CREATE POLICY "Patients can view own reports" ON public.reports 
  FOR SELECT USING ((EXISTS (...)));

-- Clinicians can view all reports
CREATE POLICY "Clinicians can view all reports" ON public.reports 
  FOR SELECT USING (public.is_clinician());
```

### PHI Logging Protection

**Before** (logged full error objects):
```typescript
console.error('Error fetching reports:', error)  // Could log PHI
```

**After** (only logs metadata):
```typescript
console.error('Error fetching reports:', { assessmentId, errorMessage: error.message })
```

- Never logs full report data or error objects
- Only logs non-PHI identifiers (assessmentId, userId)
- Structured logging with minimal context

## 4. HTTP Semantics

### Empty States Return 200, Not 500

When no reports exist:
```typescript
return {
  data: { 
    score_numeric: null, 
    sleep_score: null, 
    risk_level: null, 
    total_reports: 0 
  },
  error: null  // ← not an error, just empty
}
```

- Missing data is **not** an error condition
- Returns 200 with null values
- UI shows appropriate empty states
- No silent defaults (no `|| 0` for medical scores)

## 5. Contract Validation

### TypeScript Types Match DB Schema

```typescript
export type ReportWithAssessment = {
  id: string                                    // UUID from DB
  assessment_id: string                         // UUID FK
  score_numeric: number | null                  // INTEGER (nullable)
  sleep_score: number | null                    // INTEGER (nullable) 
  risk_level: 'low' | 'moderate' | 'high' | null // TEXT with CHECK
  report_text_short: string | null              // TEXT (nullable)
  created_at: string                            // TIMESTAMPTZ
  updated_at: string                            // TIMESTAMPTZ
}
```

**No Zod schema needed** - values come directly from database columns, not JSONB extraction.

## 6. Test Coverage

### New Tests Added (9 total, up from 6)

**Deterministic Ordering**:
1. `should deterministically select latest report when multiple have same created_at`
2. `should use deterministic latest report when multiple reports have same created_at`

**Ordering Verification**:
3. Verifies both `.order('created_at')` and `.order('id')` are called

**PHI Protection**:
4. `should handle database errors without logging PHI`

**Existing Tests Updated**:
- All mocks updated to handle chained `.order()` calls
- Deterministic ordering validated in assertions

## 7. Verification Commands

### Run Tests
```bash
npm test -- lib/db/queries/__tests__/reports.test.ts
```

**Result**: All 9 tests passing ✅

### Build Check
```bash
npm run build
```

**Result**: TypeScript compiles cleanly (no new errors) ✅

## Summary

✅ **Schema Verified**: All columns exist in `reports` table  
✅ **Deterministic**: Added `id DESC` for tie-breaking  
✅ **No PHI Logging**: Only metadata logged, no report data  
✅ **RLS Enforced**: Uses server client with user context  
✅ **Empty States**: Returns 200 with nulls, not errors  
✅ **Tests Added**: 3 new tests for determinism and PHI protection  
✅ **Contract Match**: TypeScript types match DB schema exactly

**No fantasy columns, no service role bypass, no PHI leaks.**
