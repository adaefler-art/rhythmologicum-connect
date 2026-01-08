/**
 * V05-I10.3: KPI/Observability Tracking
 *
 * Tracks key performance indicators for observability and analytics:
 * - Assessment completion rate (completions vs starts)
 * - Assessment drop-off detection (where users abandon)
 * - Time-to-report (duration from assessment completion to report generation)
 *
 * Privacy: All tracking is PHI-free, using only IDs and timestamps
 * Storage: Leverages existing audit_log infrastructure for persistence
 */

import { logAuditEvent, type AuditMetadata } from '@/lib/audit/log'
import type { UserRole } from '@/lib/contracts/registry'

// ============================================================
// KPI Event Types
// ============================================================

/**
 * KPI event types for observability tracking
 */
export enum KPIEventType {
  ASSESSMENT_STARTED = 'assessment_started',
  ASSESSMENT_COMPLETED = 'assessment_completed',
  ASSESSMENT_DROPPED = 'assessment_dropped',
  REPORT_GENERATION_STARTED = 'report_generation_started',
  REPORT_GENERATION_COMPLETED = 'report_generation_completed',
  REPORT_GENERATION_FAILED = 'report_generation_failed',
}

/**
 * Drop-off reasons (where users abandon assessments)
 */
export enum DropOffReason {
  // User left during funnel
  ABANDONED_MID_FUNNEL = 'abandoned_mid_funnel',
  // Validation failed and user gave up
  VALIDATION_FAILURE = 'validation_failure',
  // Session expired
  SESSION_EXPIRED = 'session_expired',
  // Unknown/Other
  UNKNOWN = 'unknown',
}

// ============================================================
// KPI Tracking Functions
// ============================================================

/**
 * Track assessment start event
 * Records when a user begins an assessment
 */
export async function trackAssessmentStarted(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  assessment_id: string
  funnel_slug: string
  funnel_id?: string
}): Promise<void> {
  await logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'assessment',
    entity_id: params.assessment_id,
    action: 'create',
    metadata: {
      kpi_event: KPIEventType.ASSESSMENT_STARTED,
      funnel_slug: params.funnel_slug,
      funnel_id: params.funnel_id,
    } as AuditMetadata,
  })
}

/**
 * Track assessment completion event
 * Records when a user successfully completes an assessment
 */
export async function trackAssessmentCompleted(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  assessment_id: string
  funnel_slug: string
  funnel_id?: string
  started_at?: string
  completed_at?: string
  duration_seconds?: number
}): Promise<void> {
  const metadata: AuditMetadata = {
    kpi_event: KPIEventType.ASSESSMENT_COMPLETED,
    funnel_slug: params.funnel_slug,
    funnel_id: params.funnel_id,
  }

  // Add timing metrics if available
  if (params.duration_seconds !== undefined) {
    metadata.duration_seconds = params.duration_seconds
  }
  if (params.started_at) {
    metadata.started_at = params.started_at
  }
  if (params.completed_at) {
    metadata.completed_at = params.completed_at
  }

  await logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'assessment',
    entity_id: params.assessment_id,
    action: 'complete',
    metadata,
  })
}

/**
 * Track assessment drop-off event
 * Records when a user abandons an assessment without completing it
 */
export async function trackAssessmentDropOff(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  assessment_id: string
  funnel_slug: string
  funnel_id?: string
  current_step_id?: string
  step_order_index?: number
  drop_off_reason?: DropOffReason
  started_at?: string
  duration_before_drop_seconds?: number
}): Promise<void> {
  const metadata: AuditMetadata = {
    kpi_event: KPIEventType.ASSESSMENT_DROPPED,
    funnel_slug: params.funnel_slug,
    funnel_id: params.funnel_id,
    drop_off_reason: params.drop_off_reason || DropOffReason.UNKNOWN,
  }

  // Add drop-off location context
  if (params.current_step_id) {
    metadata.current_step_id = params.current_step_id
  }
  if (params.step_order_index !== undefined) {
    metadata.step_order_index = params.step_order_index
  }

  // Add timing metrics if available
  if (params.duration_before_drop_seconds !== undefined) {
    metadata.duration_before_drop_seconds = params.duration_before_drop_seconds
  }
  if (params.started_at) {
    metadata.started_at = params.started_at
  }

  await logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'system',
    entity_type: 'assessment',
    entity_id: params.assessment_id,
    action: 'update',
    metadata,
  })
}

/**
 * Track report generation start event
 * Records when report generation begins after assessment completion
 */
export async function trackReportGenerationStarted(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  report_id?: string
  assessment_id: string
  assessment_completed_at?: string
}): Promise<void> {
  const metadata: AuditMetadata = {
    kpi_event: KPIEventType.REPORT_GENERATION_STARTED,
    assessment_id: params.assessment_id,
  }

  if (params.assessment_completed_at) {
    metadata.assessment_completed_at = params.assessment_completed_at
  }

  await logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'report',
    entity_id: params.report_id || params.assessment_id,
    action: 'create',
    metadata,
  })
}

/**
 * Track report generation completion event
 * Records when report generation completes successfully
 * Includes time-to-report metric (assessment completion → report ready)
 */
export async function trackReportGenerationCompleted(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  report_id: string
  assessment_id: string
  assessment_completed_at?: string
  report_created_at?: string
  time_to_report_seconds?: number
  algorithm_version?: string
  prompt_version?: string
}): Promise<void> {
  const metadata: AuditMetadata = {
    kpi_event: KPIEventType.REPORT_GENERATION_COMPLETED,
    assessment_id: params.assessment_id,
  }

  // Add time-to-report metrics
  if (params.time_to_report_seconds !== undefined) {
    metadata.time_to_report_seconds = params.time_to_report_seconds
  }
  if (params.assessment_completed_at) {
    metadata.assessment_completed_at = params.assessment_completed_at
  }
  if (params.report_created_at) {
    metadata.report_created_at = params.report_created_at
  }

  // Add versioning info
  if (params.algorithm_version) {
    metadata.algorithm_version = params.algorithm_version
  }
  if (params.prompt_version) {
    metadata.prompt_version = params.prompt_version
  }

  await logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'report',
    entity_id: params.report_id,
    action: 'generate',
    metadata,
  })
}

/**
 * Track report generation failure event
 * Records when report generation fails
 */
export async function trackReportGenerationFailed(params: {
  org_id?: string
  actor_user_id?: string
  actor_role?: UserRole
  report_id?: string
  assessment_id: string
  error_type?: string
  assessment_completed_at?: string
}): Promise<void> {
  const metadata: AuditMetadata = {
    kpi_event: KPIEventType.REPORT_GENERATION_FAILED,
    assessment_id: params.assessment_id,
  }

  if (params.error_type) {
    metadata.error_type = params.error_type
  }
  if (params.assessment_completed_at) {
    metadata.assessment_completed_at = params.assessment_completed_at
  }

  await logAuditEvent({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    actor_role: params.actor_role,
    source: 'api',
    entity_type: 'report',
    entity_id: params.report_id || params.assessment_id,
    action: 'update',
    metadata,
  })
}

// ============================================================
// KPI Calculation Helpers
// ============================================================

/**
 * Calculate duration in seconds between two ISO timestamps
 * Returns 0 for invalid inputs or negative durations
 */
export function calculateDurationSeconds(startTime: string, endTime: string): number {
  try {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()

    // Validate that both timestamps are valid dates
    if (isNaN(start) || isNaN(end)) {
      console.warn('[kpi] Invalid timestamp provided', { startTime, endTime })
      return 0
    }

    // Calculate duration (protect against negative values)
    const durationMs = end - start
    if (durationMs < 0) {
      console.warn('[kpi] End time is before start time', { startTime, endTime })
      return 0
    }

    return Math.round(durationMs / 1000)
  } catch (error) {
    console.error('[kpi] Error calculating duration', error)
    return 0
  }
}

/**
 * Calculate time-to-report in seconds
 * Time from assessment completion to report creation
 */
export function calculateTimeToReport(
  assessmentCompletedAt: string,
  reportCreatedAt: string,
): number {
  return calculateDurationSeconds(assessmentCompletedAt, reportCreatedAt)
}
