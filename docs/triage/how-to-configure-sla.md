# How to Configure SLA — Administrator Guide

**Version:** 1.0  
**Last Updated:** 2026-02-07  
**Epic:** E78.9

## Table of Contents

1. [Overview](#overview)
2. [SLA Types](#sla-types)
3. [Configuration Methods](#configuration-methods)
4. [Environment Variables (v1)](#environment-variables-v1)
5. [Database Configuration (v1.1+)](#database-configuration-v11)
6. [Precedence Rules](#precedence-rules)
7. [Testing SLA Configuration](#testing-sla-configuration)
8. [Monitoring SLA Compliance](#monitoring-sla-compliance)
9. [Troubleshooting](#troubleshooting)

## Overview

Service Level Agreements (SLAs) define expected timeframes for completing assessments and reviews. The Triage Inbox system uses SLAs to:

- **Identify overdue cases** — Flag assessments exceeding deadlines
- **Prioritize work** — Higher priority for approaching deadlines
- **Track compliance** — Monitor team performance against targets

### Key Concepts

- **SLA Type** — Category of deadline (completion, review, critical review)
- **SLA Threshold** — Maximum allowed time before case is overdue
- **SLA Status** — Whether case is on_time, approaching, or breached
- **Configuration Source** — Where SLA values are defined (ENV, DB, hardcoded)

## SLA Types

### 1. Assessment Completion SLA

**Default:** 7 days

**Applies To:** Cases in `in_progress` or `needs_input` state

**Measured From:** `assessments.started_at`

**Deadline Formula:**
```sql
started_at + INTERVAL '{sla_days} days'
```

**Triggers:**
- `overdue` attention item when breached
- Priority boost as deadline approaches

---

### 2. Review Completion SLA

**Default:** 2 days

**Applies To:** Cases in `ready_for_review` state (non-critical)

**Measured From:** `assessments.completed_at`

**Deadline Formula:**
```sql
completed_at + INTERVAL '{review_sla_days} days'
```

**Triggers:**
- `overdue` attention item when breached
- Clinician notification (future)

**Note:** Not fully implemented in v1. Currently uses hardcoded 2-day threshold.

---

### 3. Critical Review SLA

**Default:** 4 hours

**Applies To:** Cases in `ready_for_review` state WITH `critical_flag`

**Measured From:** `assessments.completed_at`

**Deadline Formula:**
```sql
completed_at + INTERVAL '{critical_sla_hours} hours'
```

**Triggers:**
- Immediate `overdue` if not reviewed within hours
- Highest priority in queue
- Urgent notification (future)

**Note:** Not fully implemented in v1. Reserved for future enhancement.

---

## Configuration Methods

### v1 (Current — E78.6)

SLA configuration uses a **hybrid approach**:

1. **Environment Variables** — Global default for all funnels
2. **Database Table** — Per-funnel overrides (optional)
3. **Hardcoded Fallback** — 7 days if nothing else configured

### Future (v2+)

Planned enhancements:
- Per-organization SLA settings
- Different SLAs for different risk levels
- Time-of-day adjustments (business hours only)
- Holiday/weekend exclusions

## Environment Variables (v1)

### Setting Global Default

Add to your `.env` file or deployment configuration:

```bash
# Global default SLA for all funnels (in days)
TRIAGE_SLA_DAYS_DEFAULT=7

# Optional: Review SLA (not fully implemented)
TRIAGE_SLA_REVIEW_DAYS=2

# Optional: Critical review SLA in hours (not fully implemented)
TRIAGE_SLA_CRITICAL_HOURS=4
```

### Example Configurations

#### Conservative (longer deadlines)
```bash
TRIAGE_SLA_DAYS_DEFAULT=10
TRIAGE_SLA_REVIEW_DAYS=3
```

#### Aggressive (shorter deadlines)
```bash
TRIAGE_SLA_DAYS_DEFAULT=5
TRIAGE_SLA_REVIEW_DAYS=1
TRIAGE_SLA_CRITICAL_HOURS=2
```

#### Development (relaxed for testing)
```bash
TRIAGE_SLA_DAYS_DEFAULT=30
TRIAGE_SLA_REVIEW_DAYS=7
```

### Deployment

**Docker/Docker Compose:**
```yaml
# docker-compose.yml
services:
  app:
    environment:
      - TRIAGE_SLA_DAYS_DEFAULT=7
      - TRIAGE_SLA_REVIEW_DAYS=2
```

**Vercel/Netlify:**
Add environment variables in deployment dashboard.

**Kubernetes:**
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  TRIAGE_SLA_DAYS_DEFAULT: "7"
  TRIAGE_SLA_REVIEW_DAYS: "2"
```

---

## Database Configuration (v1.1+)

### Per-Funnel Override

**Table:** `funnel_triage_settings`

**Schema:**
```sql
CREATE TABLE funnel_triage_settings (
  funnel_id UUID PRIMARY KEY REFERENCES funnels_catalog(id),
  overdue_days INTEGER NOT NULL CHECK (overdue_days > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Setting Per-Funnel SLA

**Example:** Stress assessment should complete in 5 days, but resilience assessment can take 10 days.

```sql
-- Set stress funnel to 5 days
INSERT INTO funnel_triage_settings (funnel_id, overdue_days)
VALUES (
  (SELECT id FROM funnels_catalog WHERE slug = 'stress-assessment'),
  5
)
ON CONFLICT (funnel_id) DO UPDATE SET overdue_days = 5;

-- Set resilience funnel to 10 days
INSERT INTO funnel_triage_settings (funnel_id, overdue_days)
VALUES (
  (SELECT id FROM funnels_catalog WHERE slug = 'resilience-assessment'),
  10
)
ON CONFLICT (funnel_id) DO UPDATE SET overdue_days = 10;
```

### Viewing Current Settings

```sql
SELECT 
  fc.slug AS funnel_slug,
  fc.title AS funnel_title,
  COALESCE(fts.overdue_days, 7) AS effective_sla_days,
  CASE 
    WHEN fts.overdue_days IS NOT NULL THEN 'Database'
    ELSE 'Default'
  END AS source
FROM funnels_catalog fc
LEFT JOIN funnel_triage_settings fts ON fts.funnel_id = fc.id
ORDER BY fc.slug;
```

**Example Output:**
```
 funnel_slug           | funnel_title                | effective_sla_days | source
-----------------------|-----------------------------|--------------------|----------
 resilience-assessment | Resilience Assessment       | 10                 | Database
 stress-assessment     | Stress & Anxiety Assessment | 5                  | Database
 workup-check          | Clinical Workup             | 7                  | Default
```

### Updating Settings

```sql
-- Update existing setting
UPDATE funnel_triage_settings
SET overdue_days = 8
WHERE funnel_id = (SELECT id FROM funnels_catalog WHERE slug = 'stress-assessment');

-- Remove override (revert to default)
DELETE FROM funnel_triage_settings
WHERE funnel_id = (SELECT id FROM funnels_catalog WHERE slug = 'stress-assessment');
```

---

## Precedence Rules

When multiple SLA sources are configured, the system uses this precedence (highest to lowest):

1. **Database (`funnel_triage_settings.overdue_days`)** — Highest priority
2. **Environment Variable (`TRIAGE_SLA_DAYS_DEFAULT`)** 
3. **Hardcoded Default (7 days)** — Lowest priority

### Examples

#### Example 1: Database override wins
```
Database: stress-assessment → 5 days
ENV: TRIAGE_SLA_DAYS_DEFAULT=10
Result: stress-assessment uses 5 days (database wins)
```

#### Example 2: No database entry, uses ENV
```
Database: (no entry for resilience-assessment)
ENV: TRIAGE_SLA_DAYS_DEFAULT=10
Result: resilience-assessment uses 10 days (ENV)
```

#### Example 3: No database, no ENV
```
Database: (no entry)
ENV: (not set)
Result: All funnels use 7 days (hardcoded default)
```

### SQL Function

The view uses this helper function:

```sql
CREATE OR REPLACE FUNCTION get_triage_sla_days(p_funnel_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT overdue_days FROM funnel_triage_settings WHERE funnel_id = p_funnel_id),
    NULLIF(current_setting('app.triage_sla_days_default', true), '')::INTEGER,
    7
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## Testing SLA Configuration

### 1. Verify Environment Variable

```bash
# Check if variable is set
echo $TRIAGE_SLA_DAYS_DEFAULT

# Or in Node.js
node -e "console.log(process.env.TRIAGE_SLA_DAYS_DEFAULT)"
```

### 2. Verify Database Settings

```sql
-- Check what database has configured
SELECT * FROM funnel_triage_settings;

-- Check effective SLA for specific funnel
SELECT get_triage_sla_days(
  (SELECT id FROM funnels_catalog WHERE slug = 'stress-assessment')
);
```

### 3. Test SLA Computation in View

```sql
-- Check if overdue calculation is correct
SELECT 
  case_id,
  funnel_slug,
  started_at,
  NOW() AS current_time,
  started_at + INTERVAL '7 days' AS sla_deadline,
  CASE 
    WHEN NOW() > (started_at + INTERVAL '7 days') THEN 'OVERDUE'
    ELSE 'ON TIME'
  END AS sla_status,
  attention_items
FROM triage_cases_v1
WHERE case_state IN ('in_progress', 'needs_input')
ORDER BY started_at DESC
LIMIT 10;
```

### 4. Create Test Case

```sql
-- Create assessment that's overdue
INSERT INTO assessments (patient_id, funnel_id, status, started_at)
VALUES (
  '{patient_uuid}',
  (SELECT id FROM funnels_catalog WHERE slug = 'stress-assessment'),
  'in_progress',
  NOW() - INTERVAL '8 days'  -- 8 days ago, past 7-day SLA
);

-- Check if it shows as overdue
SELECT case_id, case_state, attention_items
FROM triage_cases_v1
WHERE patient_id = '{patient_uuid}'
AND 'overdue' = ANY(attention_items);  -- Should return the test case
```

---

## Monitoring SLA Compliance

### Dashboard Queries

#### SLA Breach Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE 'overdue' = ANY(attention_items)) AS overdue_count,
  COUNT(*) AS total_active,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE 'overdue' = ANY(attention_items)) / NULLIF(COUNT(*), 0),
    2
  ) AS breach_rate_pct
FROM triage_cases_v1
WHERE is_active = true;
```

#### Average Time to Review
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (review_decided_at - completed_at)) / 3600) AS avg_hours_to_review,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (review_decided_at - completed_at)) / 3600) AS median_hours_to_review
FROM triage_cases_v1
WHERE review_status IN ('APPROVED', 'REJECTED')
AND review_decided_at IS NOT NULL
AND completed_at IS NOT NULL;
```

#### Cases Approaching SLA
```sql
SELECT 
  case_id,
  patient_display,
  funnel_slug,
  started_at,
  ROUND(
    EXTRACT(EPOCH FROM (NOW() - started_at)) / 86400,
    1
  ) AS days_since_start,
  7 AS sla_days,  -- Or use get_triage_sla_days(funnel_id)
  priority_score
FROM triage_cases_v1
WHERE is_active = true
AND case_state IN ('in_progress', 'needs_input')
AND NOW() > (started_at + INTERVAL '5 days')  -- Within 2 days of SLA
AND NOW() < (started_at + INTERVAL '7 days')  -- Not yet overdue
ORDER BY priority_score DESC;
```

### Metrics to Track

1. **Breach Rate** — % of cases overdue
2. **Average Time to Complete** — Mean days from start to completion
3. **Average Time to Review** — Mean days from completion to review
4. **Cases at Risk** — Count within 80-100% of SLA window

---

## Troubleshooting

### SLA Not Working

**Symptom:** Cases are overdue but no `overdue` attention item

**Check:**
1. Verify view is computing `overdue` correctly
2. Check SLA threshold configuration
3. Confirm `started_at` timestamp is valid
4. Review view migration: `20260205152500_e78_2_create_triage_cases_v1.sql`

**Fix:**
```sql
-- Manual check
SELECT 
  id,
  status,
  started_at,
  NOW() - started_at AS age,
  (NOW() - started_at) > INTERVAL '7 days' AS should_be_overdue
FROM assessments
WHERE status = 'in_progress'
AND completed_at IS NULL;
```

---

### Different SLA Per Environment

**Symptom:** Want different SLA in dev vs prod

**Solution:**
Use environment-specific `.env` files:

```bash
# .env.development
TRIAGE_SLA_DAYS_DEFAULT=30

# .env.production
TRIAGE_SLA_DAYS_DEFAULT=7
```

Or deployment-specific config:
```bash
# Vercel
vercel env add TRIAGE_SLA_DAYS_DEFAULT production
> 7
vercel env add TRIAGE_SLA_DAYS_DEFAULT preview
> 30
```

---

### Override Not Working

**Symptom:** Database override not taking effect

**Check:**
1. Verify foreign key exists: `funnel_id` matches `funnels_catalog.id`
2. Confirm view is using `get_triage_sla_days()` function
3. Check for typos in funnel slug

**Fix:**
```sql
-- Verify funnel exists
SELECT id, slug FROM funnels_catalog WHERE slug = 'stress-assessment';

-- Verify override is inserted
SELECT * FROM funnel_triage_settings 
WHERE funnel_id = (SELECT id FROM funnels_catalog WHERE slug = 'stress-assessment');

-- Test function directly
SELECT get_triage_sla_days(
  (SELECT id FROM funnels_catalog WHERE slug = 'stress-assessment')
);
```

---

## Best Practices

### ✅ Do's
- **Document changes** — Log SLA adjustments in changelog
- **Test before production** — Verify in staging environment
- **Monitor compliance** — Track breach rates weekly
- **Adjust based on data** — Use actual completion times to set realistic SLAs
- **Communicate changes** — Inform team when SLAs change

### ❌ Don'ts
- **Don't set unrealistic SLAs** — 1-day SLA may not be achievable
- **Don't change frequently** — Stability helps planning
- **Don't ignore breaches** — Address root causes
- **Don't use negative values** — SLA must be positive integer

---

## See Also

- [How to Triage](./how-to-triage.md) — User guide
- [How to Interpret Statuses](./how-to-interpret-statuses.md) — Status definitions
- [Inbox Logic Spec](./inbox-v1.md) — Complete technical spec
- [E78.6 Implementation](../../E78.6-COMPLETE.md) — SLA configuration epic

---

**Last Updated:** 2026-02-07  
**Version:** 1.0  
**Related Epic:** E78.9
