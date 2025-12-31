# Audit Logging Module

Comprehensive audit trail system for decision-relevant events in the Rhythmologicum Connect application.

## Overview

The audit logging module provides:
- **Type-safe** audit event logging with strict TypeScript types
- **Registry-based** entity types and actions (no magic strings)
- **PHI protection** by design (IDs only, no raw clinical data)
- **Multi-tenant** support with organization context
- **RLS-protected** access control for viewing audit logs

## Quick Start

```typescript
import { logReportGenerated } from '@/lib/audit'

// Log a report generation event
await logReportGenerated({
  report_id: reportId,
  assessment_id: assessmentId,
  algorithm_version: '1.0',
  prompt_version: '2.0',
  report_version: '1.0',
})
```

## Core Concepts

### Audit Event Structure

Every audit event contains:
- **Context**: `org_id`, `actor_user_id`, `actor_role`, `source`
- **Entity**: `entity_type`, `entity_id`, `action`
- **Details**: `diff` (before/after), `metadata` (versions, correlation IDs)

### Entity Types (Registry-Based)

```typescript
import { AUDIT_ENTITY_TYPE } from '@/lib/contracts/registry'

AUDIT_ENTITY_TYPE.REPORT
AUDIT_ENTITY_TYPE.TASK
AUDIT_ENTITY_TYPE.FUNNEL_VERSION
// ... and more
```

### Actions (Registry-Based)

```typescript
import { AUDIT_ACTION } from '@/lib/contracts/registry'

AUDIT_ACTION.GENERATE
AUDIT_ACTION.APPROVE
AUDIT_ACTION.REJECT
AUDIT_ACTION.CREATE
// ... and more
```

### Sources

```typescript
import { AUDIT_SOURCE } from '@/lib/contracts/registry'

AUDIT_SOURCE.API         // API route handler
AUDIT_SOURCE.JOB         // Background job
AUDIT_SOURCE.ADMIN_UI    // Admin interface
AUDIT_SOURCE.SYSTEM      // Automated system
```

## Helper Functions

### Report Lifecycle

```typescript
import { logReportGenerated, logReportFlagged, logReportReviewed } from '@/lib/audit'

// Report generated
await logReportGenerated({
  report_id: reportId,
  assessment_id: assessmentId,
  algorithm_version: '1.0',
  prompt_version: '2.0',
  report_version: '1.0',
})

// Report flagged for safety concerns
await logReportFlagged({
  report_id: reportId,
  safety_score: 45,
  finding_count: 3,
})

// Report approved by clinician
await logReportReviewed({
  actor_user_id: userId,
  actor_role: 'clinician',
  report_id: reportId,
  action: 'approve',
  reason: 'Reviewed and verified',
})
```

### Task Management

```typescript
import { logTaskEvent } from '@/lib/audit'

// Task created
await logTaskEvent({
  actor_user_id: userId,
  actor_role: 'clinician',
  task_id: taskId,
  action: 'create',
  assigned_to_role: 'nurse',
})

// Task status changed
await logTaskEvent({
  actor_user_id: userId,
  actor_role: 'nurse',
  task_id: taskId,
  action: 'update',
  status_from: 'pending',
  status_to: 'completed',
})
```

### Configuration Changes

```typescript
import { logFunnelConfigChange, logFunnelVersionRollout } from '@/lib/audit'

// Funnel activated
await logFunnelConfigChange({
  actor_user_id: userId,
  actor_role: 'admin',
  funnel_id: funnelId,
  action: 'activate',
  is_active: true,
})

// Version rollout changed
await logFunnelVersionRollout({
  actor_user_id: userId,
  actor_role: 'admin',
  version_id: versionId,
  rollout_percent_from: 25,
  rollout_percent_to: 100,
})
```

## Advanced Usage

### Custom Audit Events

For events not covered by helper functions:

```typescript
import { logAuditEvent } from '@/lib/audit'
import { AUDIT_ENTITY_TYPE, AUDIT_ACTION, AUDIT_SOURCE } from '@/lib/contracts/registry'

await logAuditEvent({
  org_id: organizationId,
  actor_user_id: userId,
  actor_role: 'admin',
  source: AUDIT_SOURCE.ADMIN_UI,
  entity_type: AUDIT_ENTITY_TYPE.CONFIG,
  entity_id: configId,
  action: AUDIT_ACTION.UPDATE,
  diff: {
    before: { setting: 'old_value' },
    after: { setting: 'new_value' },
  },
  metadata: {
    config_key: 'navigation.settings',
  },
})
```

## Error Handling

**Important**: Audit logging failures MUST NOT cause request failures. Always wrap in try-catch:

```typescript
try {
  await logReportGenerated({ /* ... */ })
} catch (auditError) {
  // Log error but continue
  console.error('[audit] Logging failed (non-blocking):', auditError)
}
```

## PHI Protection

### ✅ SAFE to log:
- Entity IDs (UUIDs)
- Status transitions
- Scores/metrics (numerical values)
- Versions
- Counts and summaries

### ❌ NEVER log:
- Raw assessment answers
- Free-text patient responses
- Clinical notes
- Personal identifiers (names, emails)

## Database Schema

```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  actor_user_id UUID REFERENCES auth.users(id),
  actor_role public.user_role,
  source TEXT CHECK (source IN ('api', 'job', 'admin-ui', 'system')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  diff JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Querying Audit Logs

```sql
-- By entity
SELECT * FROM audit_log
WHERE entity_type = 'report'
  AND entity_id = 'report-uuid'
ORDER BY created_at DESC;

-- By organization
SELECT * FROM audit_log
WHERE org_id = 'org-uuid'
ORDER BY created_at DESC
LIMIT 100;

-- By action type
SELECT * FROM audit_log
WHERE action IN ('approve', 'reject')
  AND entity_type = 'report'
ORDER BY created_at DESC;
```

## Access Control (RLS)

- **Admins**: View audit logs for their organization(s)
- **Clinicians/Nurses**: View audit logs for assigned patients (assessment/report/task entities)
- **Patients**: View audit logs for their own entities
- **Service Role**: Bypasses RLS for writing audit logs

## Documentation

For comprehensive documentation, see:
- [Audit Event Contract](../../docs/canon/CONTRACTS.md#audit-event-contract)
- [Database Migrations](../../docs/canon/DB_MIGRATIONS.md)

## Demo

Run the demonstration script to see example audit events:

```bash
node tools/demo-audit-logging.mjs
```
