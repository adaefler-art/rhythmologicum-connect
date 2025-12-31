#!/usr/bin/env node
/**
 * Audit Log Demonstration Script
 * 
 * This script demonstrates the audit logging functionality by showing
 * example audit events that would be logged in various scenarios.
 * 
 * Note: This is a demonstration only and does not connect to a database.
 */

// Audit constants (from lib/contracts/registry.ts)
const AUDIT_SOURCE = {
  API: 'api',
  JOB: 'job',
  ADMIN_UI: 'admin-ui',
  SYSTEM: 'system',
}

const AUDIT_ENTITY_TYPE = {
  ASSESSMENT: 'assessment',
  REPORT: 'report',
  TASK: 'task',
  FUNNEL_VERSION: 'funnel_version',
  FUNNEL_CATALOG: 'funnel_catalog',
  CONFIG: 'config',
  CONSENT: 'consent',
  ORGANIZATION: 'organization',
  USER_ORG_MEMBERSHIP: 'user_org_membership',
  CLINICIAN_ASSIGNMENT: 'clinician_assignment',
}

const AUDIT_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  GENERATE: 'generate',
  FLAG: 'flag',
  ASSIGN: 'assign',
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
  ROLLOUT: 'rollout',
  COMPLETE: 'complete',
}

console.log('='.repeat(80))
console.log('AUDIT LOG DEMONSTRATION - V05-I01.4')
console.log('='.repeat(80))
console.log()

// Example 1: Report Generated
console.log('Example 1: Report Generated')
console.log('-'.repeat(80))
const reportGeneratedEvent = {
  org_id: '550e8400-e29b-41d4-a716-446655440000',
  actor_user_id: null, // System-generated
  actor_role: null,
  source: AUDIT_SOURCE.API,
  entity_type: AUDIT_ENTITY_TYPE.REPORT,
  entity_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  action: AUDIT_ACTION.GENERATE,
  metadata: {
    assessment_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    algorithm_version: '1.0',
    prompt_version: '2.0',
    report_version: '1.0',
  },
}
console.log(JSON.stringify(reportGeneratedEvent, null, 2))
console.log()

// Example 2: Report Flagged
console.log('Example 2: Report Flagged (Safety Findings)')
console.log('-'.repeat(80))
const reportFlaggedEvent = {
  org_id: '550e8400-e29b-41d4-a716-446655440000',
  actor_user_id: null,
  actor_role: null,
  source: AUDIT_SOURCE.SYSTEM,
  entity_type: AUDIT_ENTITY_TYPE.REPORT,
  entity_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  action: AUDIT_ACTION.FLAG,
  metadata: {
    safety_score: 45,
    finding_count: 3,
  },
}
console.log(JSON.stringify(reportFlaggedEvent, null, 2))
console.log()

// Example 3: Report Approved by Clinician
console.log('Example 3: Report Approved by Clinician')
console.log('-'.repeat(80))
const reportApprovedEvent = {
  org_id: '550e8400-e29b-41d4-a716-446655440000',
  actor_user_id: '9f4a2b3c-1234-5678-9abc-def012345678',
  actor_role: 'clinician',
  source: AUDIT_SOURCE.API,
  entity_type: AUDIT_ENTITY_TYPE.REPORT,
  entity_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  action: AUDIT_ACTION.APPROVE,
  metadata: {
    reason: 'Reviewed and verified findings are accurate',
  },
}
console.log(JSON.stringify(reportApprovedEvent, null, 2))
console.log()

// Example 4: Task Created
console.log('Example 4: Task Created and Assigned to Nurse')
console.log('-'.repeat(80))
const taskCreatedEvent = {
  org_id: '550e8400-e29b-41d4-a716-446655440000',
  actor_user_id: '9f4a2b3c-1234-5678-9abc-def012345678',
  actor_role: 'clinician',
  source: AUDIT_SOURCE.API,
  entity_type: AUDIT_ENTITY_TYPE.TASK,
  entity_id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  action: AUDIT_ACTION.CREATE,
  metadata: {
    assigned_to_role: 'nurse',
  },
}
console.log(JSON.stringify(taskCreatedEvent, null, 2))
console.log()

// Example 5: Task Status Changed
console.log('Example 5: Task Status Changed (Pending → Completed)')
console.log('-'.repeat(80))
const taskCompletedEvent = {
  org_id: '550e8400-e29b-41d4-a716-446655440000',
  actor_user_id: '8a7b6c5d-4321-8765-dcba-876543210987',
  actor_role: 'nurse',
  source: AUDIT_SOURCE.API,
  entity_type: AUDIT_ENTITY_TYPE.TASK,
  entity_id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  action: AUDIT_ACTION.UPDATE,
  diff: {
    before: { status: 'pending' },
    after: { status: 'completed' },
  },
  metadata: {
    status_from: 'pending',
    status_to: 'completed',
  },
}
console.log(JSON.stringify(taskCompletedEvent, null, 2))
console.log()

// Example 6: Funnel Activated
console.log('Example 6: Funnel Activated by Admin')
console.log('-'.repeat(80))
const funnelActivatedEvent = {
  org_id: '550e8400-e29b-41d4-a716-446655440000',
  actor_user_id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  actor_role: 'admin',
  source: AUDIT_SOURCE.ADMIN_UI,
  entity_type: AUDIT_ENTITY_TYPE.FUNNEL_CATALOG,
  entity_id: 'f1e2d3c4-b5a6-9876-5432-10fedcba9876',
  action: AUDIT_ACTION.ACTIVATE,
  diff: {
    before: { is_active: false },
    after: { is_active: true },
  },
}
console.log(JSON.stringify(funnelActivatedEvent, null, 2))
console.log()

// Example 7: Funnel Version Rollout
console.log('Example 7: Funnel Version Rollout Changed')
console.log('-'.repeat(80))
const funnelRolloutEvent = {
  org_id: '550e8400-e29b-41d4-a716-446655440000',
  actor_user_id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  actor_role: 'admin',
  source: AUDIT_SOURCE.ADMIN_UI,
  entity_type: AUDIT_ENTITY_TYPE.FUNNEL_VERSION,
  entity_id: 'v1-2-3-4-5-6-7-8-9-0-a-b-c-d-e-f',
  action: AUDIT_ACTION.ROLLOUT,
  diff: {
    before: { rollout_percent: 25 },
    after: { rollout_percent: 100 },
  },
}
console.log(JSON.stringify(funnelRolloutEvent, null, 2))
console.log()

// Example 8: Consent Recorded
console.log('Example 8: Patient Consent Recorded')
console.log('-'.repeat(80))
const consentEvent = {
  org_id: '550e8400-e29b-41d4-a716-446655440000',
  actor_user_id: 'patient-uuid-1234567890abcdef',
  actor_role: 'patient',
  source: AUDIT_SOURCE.API,
  entity_type: AUDIT_ENTITY_TYPE.CONSENT,
  entity_id: 'consent-record-uuid-0987654321',
  action: AUDIT_ACTION.CREATE,
  metadata: {
    consent_type: 'data_processing',
    granted: true,
  },
}
console.log(JSON.stringify(consentEvent, null, 2))
console.log()

// Summary
console.log('='.repeat(80))
console.log('SUMMARY')
console.log('='.repeat(80))
console.log('These examples demonstrate the audit log structure for:')
console.log('- Report lifecycle (generate, flag, approve/reject)')
console.log('- Task management (create, assign, status changes)')
console.log('- Configuration changes (funnel activation, version rollouts)')
console.log('- Consent management (record creation)')
console.log()
console.log('Key Features:')
console.log('- ✅ Organization context (org_id) for multi-tenant isolation')
console.log('- ✅ Actor tracking (user_id + role) for accountability')
console.log('- ✅ Source tracking (api/job/admin-ui/system)')
console.log('- ✅ Entity type registry (no magic strings)')
console.log('- ✅ Action registry (standardized operations)')
console.log('- ✅ Metadata for versions, correlation IDs, etc.')
console.log('- ✅ Diff tracking for before/after changes')
console.log('- ✅ PHI protection (IDs only, no raw clinical data)')
console.log()
console.log('For actual database queries, see docs/canon/CONTRACTS.md')
console.log('='.repeat(80))

