/**
 * Audit Logging Helper
 *
 * Provides type-safe audit logging functionality for decision-relevant events.
 * Ensures no PHI leakage and maintains comprehensive audit trails.
 *
 * @module lib/audit/log
 */

import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/types/supabase'
import {
  type AuditEntityType,
  type AuditAction,
  type AuditSource,
  type UserRole,
} from '@/lib/contracts/registry'
import { env } from '@/lib/env'

// ============================================================
// Types
// ============================================================

/**
 * Audit event metadata
 * Contains version information and correlation IDs
 * NO PHI should be stored here
 */
export type AuditMetadata = {
  request_id?: string
  algorithm_version?: string
  prompt_version?: string
  report_version?: string
  correlation_id?: string
  safety_score?: number
  status_from?: string
  status_to?: string
  [key: string]: string | number | boolean | undefined
}

/**
 * Audit diff payload
 * Contains before/after snapshots of changes
 * Should contain IDs and status transitions, NOT raw clinical text
 */
export type AuditDiff = {
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  changes?: Record<string, { from: unknown; to: unknown }>
}

/**
 * Complete audit event structure
 */
export type AuditEvent = {
  // Context
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  source: AuditSource

  // Entity
  entity_type: AuditEntityType
  entity_id: string
  action: AuditAction

  // Details
  diff?: AuditDiff
  metadata?: AuditMetadata
}

/**
 * Result of logging an audit event
 */
export type AuditLogResult = {
  success: boolean
  audit_id?: string
  error?: string
}

// ============================================================
// Supabase Client (Service Role)
// ============================================================

/**
 * Creates a Supabase client with service role key for audit logging
 * Bypasses RLS to ensure audit logs are always written
 */
function getAuditClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[audit/log] Missing Supabase credentials')
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}

// ============================================================
// PHI Protection & Redaction
// ============================================================

/**
 * List of allowed keys in metadata and diff objects
 * These are safe to store (IDs, versions, statuses, numeric values)
 */
const ALLOWED_METADATA_KEYS = [
  'request_id',
  'correlation_id',
  'algorithm_version',
  'prompt_version',
  'report_version',
  'version',
  'safety_score',
  'finding_count',
  'status_from',
  'status_to',
  'assigned_to_role',
  'reason',
  'consent_type',
  'granted',
  'rollout_percent',
  'rollout_percent_from',
  'rollout_percent_to',
  'is_active',
  'assessment_id',
  'report_id',
  'task_id',
  'funnel_id',
  'version_id',
  'consent_id',
  'config_key',
  'consent_version',
  'profile_updated',
  'review_id',
  'job_id',
  'decision_reason',
  'has_notes',
  // V05-I10.2: Account deletion/retention metadata
  'deletion_reason',
  'scheduled_for',
  'retention_period_days',
  'records_deleted',
  'records_anonymized',
  'executed_by',
  'anonymization_reason',
  // V05-I10.3: KPI/Observability tracking
  'kpi_event',
  'funnel_slug',
  'drop_off_reason',
  'current_step_id',
  'step_order_index',
  'duration_seconds',
  'duration_before_drop_seconds',
  'started_at',
  'completed_at',
  'time_to_report_seconds',
  'report_created_at',
  'error_type',
] as const

/**
 * List of keys that contain PHI and must be blocked
 */
const PHI_KEYS = [
  'content',
  'text',
  'notes',
  'answers',
  'answer',
  'response',
  'extracted_data',
  'clinical_notes',
  'patient_notes',
  'observation',
  'diagnosis',
  'medication',
  'name',
  'email',
  'phone',
  'address',
  'ssn',
  'dob',
  'date_of_birth',
] as const

/**
 * Redacts PHI from a data object
 * Only allows specific safe keys and removes PHI-containing fields
 *
 * @param data - Object to redact
 * @param maxSize - Maximum allowed size in characters (default: 5000)
 * @returns Redacted object with only safe fields
 */
export function redactPHI(
  data: Record<string, unknown> | undefined,
  maxSize = 5000,
): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const redacted: Record<string, unknown> = {}
  let totalSize = 0

  for (const [key, value] of Object.entries(data)) {
    // Block PHI keys explicitly
    const lowerKey = key.toLowerCase()
    if (PHI_KEYS.some((phiKey) => lowerKey.includes(phiKey))) {
      redacted[key] = '[REDACTED]'
      continue
    }

    // Check if key is in allowlist
    const isAllowed = ALLOWED_METADATA_KEYS.includes(key as (typeof ALLOWED_METADATA_KEYS)[number])

    // Allow numeric values, booleans, and safe strings
    if (typeof value === 'number' || typeof value === 'boolean') {
      redacted[key] = value
      totalSize += String(value).length
    } else if (typeof value === 'string') {
      // Only allow strings from allowlist or UUID-like patterns
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
      const isShortSafe = value.length <= 100 && !/[<>{}]/.test(value) // No HTML/JSON

      if (isAllowed || isUUID || (isShortSafe && lowerKey.includes('id'))) {
        redacted[key] = value
        totalSize += value.length
      } else {
        redacted[key] = '[REDACTED]'
      }
    } else if (value === null || value === undefined) {
      redacted[key] = value
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively redact nested objects
      redacted[key] = redactPHI(value as Record<string, unknown>, maxSize - totalSize)
      totalSize += JSON.stringify(redacted[key]).length
    } else {
      // Arrays and other types - redact to be safe
      redacted[key] = '[REDACTED]'
    }

    // Enforce size limit
    if (totalSize > maxSize) {
      console.warn('[audit/log] Metadata/diff size exceeded limit, truncating')
      break
    }
  }

  return redacted
}

// ============================================================
// Core Logging Function
// ============================================================

/**
 * Logs an audit event to the database
 *
 * This function:
 * - Validates event structure
 * - Ensures no PHI in diff/metadata
 * - Uses service role to bypass RLS
 * - Returns success/failure status
 *
 * @param event - The audit event to log
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * await logAuditEvent({
 *   org_id: '123e4567-e89b-12d3-a456-426614174000',
 *   actor_user_id: user.id,
 *   actor_role: 'clinician',
 *   source: 'api',
 *   entity_type: 'report',
 *   entity_id: reportId,
 *   action: 'generate',
 *   metadata: {
 *     algorithm_version: '1.0',
 *     prompt_version: '2.0',
 *     report_version: '1.0',
 *   },
 * })
 * ```
 */
export async function logAuditEvent(event: AuditEvent): Promise<AuditLogResult> {
  const startTime = Date.now()

  try {
    // Validate event
    if (!event.entity_type) {
      return { success: false, error: 'entity_type is required' }
    }
    if (!event.entity_id) {
      return { success: false, error: 'entity_id is required' }
    }
    if (!event.action) {
      return { success: false, error: 'action is required' }
    }
    if (!event.source) {
      return { success: false, error: 'source is required' }
    }

    // Get Supabase client
    const supabase = getAuditClient()
    if (!supabase) {
      console.error('[audit/log] Cannot create Supabase client')
      return { success: false, error: 'Supabase client unavailable' }
    }

    // Redact PHI from diff and metadata
    const safeMetadata = redactPHI(event.metadata || {})
    const safeDiff: Record<string, unknown> = {}

    if (event.diff?.before) {
      safeDiff.before = redactPHI(event.diff.before as Record<string, unknown>)
    }
    if (event.diff?.after) {
      safeDiff.after = redactPHI(event.diff.after as Record<string, unknown>)
    }
    if (event.diff?.changes) {
      safeDiff.changes = redactPHI(event.diff.changes as Record<string, unknown>)
    }

    // Prepare audit log entry
    const auditEntry: Database['public']['Tables']['audit_log']['Insert'] = {
      org_id: event.org_id || null,
      actor_user_id: event.actor_user_id || null,
      actor_role: event.actor_role || null,
      source: event.source,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      action: event.action,
      diff: (safeDiff as Json) || {},
      metadata: (safeMetadata as Json) || {},
    }

    // Insert audit log
    const { data, error } = await supabase
      .from('audit_log')
      .insert(auditEntry)
      .select('id')
      .single()

    if (error) {
      console.error('[audit/log] Failed to insert audit event', {
        error,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        action: event.action,
      })
      return { success: false, error: error.message }
    }

    const duration = Date.now() - startTime
    console.log('[audit/log] Audit event logged successfully', {
      audit_id: data.id,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      action: event.action,
      duration_ms: duration,
    })

    return { success: true, audit_id: data.id }
  } catch (err) {
    console.error('[audit/log] Unexpected error logging audit event', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// ============================================================
// Helper Functions for Common Audit Scenarios
// ============================================================

/**
 * Logs a report generation event
 */
export async function logReportGenerated(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  report_id: string
  assessment_id: string
  algorithm_version?: string
  prompt_version?: string
  report_version?: string
  safety_score?: number
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'report',
    entity_id: params.report_id,
    action: 'generate',
    metadata: {
      assessment_id: params.assessment_id,
      algorithm_version: params.algorithm_version,
      prompt_version: params.prompt_version,
      report_version: params.report_version,
      safety_score: params.safety_score,
    },
  })
}

/**
 * Logs a report flagged event (safety findings)
 */
export async function logReportFlagged(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  report_id: string
  safety_score?: number
  finding_count?: number
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'system',
    entity_type: 'report',
    entity_id: params.report_id,
    action: 'flag',
    metadata: {
      safety_score: params.safety_score,
      finding_count: params.finding_count,
    },
  })
}

/**
 * Logs a report approval/rejection event
 */
export async function logReportReviewed(params: {
  org_id?: string
  actor_user_id: string
  actor_role: UserRole
  report_id: string
  action: 'approve' | 'reject'
  reason?: string
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'report',
    entity_id: params.report_id,
    action: params.action,
    metadata: {
      reason: params.reason,
    },
  })
}

/**
 * Logs a task lifecycle event
 */
export async function logTaskEvent(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  task_id: string
  action: AuditAction
  status_from?: string
  status_to?: string
  assigned_to_role?: UserRole
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'task',
    entity_id: params.task_id,
    action: params.action,
    metadata: {
      status_from: params.status_from,
      status_to: params.status_to,
      assigned_to_role: params.assigned_to_role,
    },
  })
}

/**
 * Logs a funnel activation/deactivation event
 */
export async function logFunnelConfigChange(params: {
  org_id?: string
  actor_user_id: string
  actor_role: UserRole
  funnel_id: string
  action: 'activate' | 'deactivate'
  is_active: boolean
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'admin-ui',
    entity_type: 'funnel_catalog',
    entity_id: params.funnel_id,
    action: params.action,
    diff: {
      after: { is_active: params.is_active },
    },
  })
}

/**
 * Logs a funnel version rollout change
 */
export async function logFunnelVersionRollout(params: {
  org_id?: string
  actor_user_id: string
  actor_role: UserRole
  version_id: string
  rollout_percent_from?: number
  rollout_percent_to: number
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'admin-ui',
    entity_type: 'funnel_version',
    entity_id: params.version_id,
    action: 'rollout',
    diff: {
      before: { rollout_percent: params.rollout_percent_from },
      after: { rollout_percent: params.rollout_percent_to },
    },
  })
}

/**
 * Logs a consent record change
 */
export async function logConsentChange(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  consent_id: string
  action: AuditAction
  consent_type?: string
  granted?: boolean
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'consent',
    entity_id: params.consent_id,
    action: params.action,
    metadata: {
      consent_type: params.consent_type,
      granted: params.granted,
    },
  })
}

/**
 * Logs a support case creation event
 */
export async function logSupportCaseCreated(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  support_case_id: string
  category?: string
  priority?: string
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'support_case',
    entity_id: params.support_case_id,
    action: 'create',
    metadata: {
      // PHI-safe: NO patient_id, only category/priority metadata
      has_notes: false,
    },
  })
}

/**
 * Logs a support case escalation event
 * This creates both an audit log entry and updates the support case
 */
export async function logSupportCaseEscalated(params: {
  org_id?: string
  actor_user_id: string
  actor_role: UserRole
  support_case_id: string
  task_id: string
  assigned_to_role: UserRole
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'support_case',
    entity_id: params.support_case_id,
    action: 'escalate',
    metadata: {
      task_id: params.task_id,
      assigned_to_role: params.assigned_to_role,
    },
  })
}

/**
 * Logs a support case status update event
 */
export async function logSupportCaseStatusChanged(params: {
  org_id?: string
  actor_user_id: string
  actor_role: UserRole
  support_case_id: string
  status_from: string
  status_to: string
  has_notes?: boolean
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'support_case',
    entity_id: params.support_case_id,
    action: 'update',
    metadata: {
      status_from: params.status_from,
      status_to: params.status_to,
      has_notes: params.has_notes ?? false,
    },
  })
}

// ============================================================
// Account Lifecycle Events (V05-I10.2)
// ============================================================

/**
 * Logs an account deletion request event
 * User has requested to delete their account (GDPR Article 17)
 */
export async function logAccountDeletionRequest(params: {
  org_id?: string
  actor_user_id: string
  actor_role: UserRole
  account_id: string
  deletion_reason?: string
  scheduled_for?: string
  retention_period_days?: number
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'account',
    entity_id: params.account_id,
    action: 'deletion_request',
    metadata: {
      deletion_reason: params.deletion_reason,
      scheduled_for: params.scheduled_for,
      retention_period_days: params.retention_period_days,
    },
  })
}

/**
 * Logs an account deletion cancellation event
 * User cancelled their deletion request during retention period
 */
export async function logAccountDeletionCancel(params: {
  org_id?: string
  actor_user_id: string
  actor_role: UserRole
  account_id: string
  cancellation_reason?: string
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'account',
    entity_id: params.account_id,
    action: 'deletion_cancel',
    metadata: {
      reason: params.cancellation_reason,
    },
  })
}

/**
 * Logs an account deletion execution event
 * System or admin executed the account deletion
 */
export async function logAccountDeletionExecute(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  account_id: string
  records_deleted?: number
  records_anonymized?: number
  executed_by?: string
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: params.executed_by === 'system' ? 'system' : 'admin-ui',
    entity_type: 'account',
    entity_id: params.account_id,
    action: 'deletion_execute',
    metadata: {
      records_deleted: params.records_deleted,
      records_anonymized: params.records_anonymized,
      executed_by: params.executed_by,
    },
  })
}

/**
 * Logs an account anonymization event
 * Records were anonymized instead of deleted (retention requirements)
 */
export async function logAccountAnonymize(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  account_id: string
  records_anonymized: number
  anonymization_reason?: string
}): Promise<AuditLogResult> {
  return logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'system',
    entity_type: 'account',
    entity_id: params.account_id,
    action: 'anonymize',
    metadata: {
      records_anonymized: params.records_anonymized,
      reason: params.anonymization_reason,
    },
  })
}
