/**
 * Review Record Contract - V05-I05.7
 * 
 * Defines the schema for Medical Review Queue records.
 * Supports flagged jobs (from validation/safety) + deterministic sampling.
 * 
 * Key guarantees:
 * - PHI-free: No patient identifiers, only job/user references
 * - Auditable: Full decision trail with timestamps and reason codes
 * - RBAC: Role-based access control (clinician/admin)
 * - Idempotent: Unique constraint on (job_id, review_iteration)
 * - Deterministic sampling: Same job + config → same sampling decision
 * 
 * @module lib/contracts/reviewRecord
 */

import { z } from 'zod'

// ============================================================
// Review Status
// ============================================================

/**
 * Review decision status
 * - PENDING: Awaiting review
 * - APPROVED: Approved to proceed
 * - REJECTED: Rejected, cannot proceed
 * - CHANGES_REQUESTED: Needs changes before re-review
 */
export const REVIEW_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
} as const

export type ReviewStatus = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS]

export const ReviewStatusSchema = z.enum([
  REVIEW_STATUS.PENDING,
  REVIEW_STATUS.APPROVED,
  REVIEW_STATUS.REJECTED,
  REVIEW_STATUS.CHANGES_REQUESTED,
])

// ============================================================
// Queue Reason Codes
// ============================================================

/**
 * Why a job is in the review queue
 * These are coded reasons (no PHI)
 */
export const QUEUE_REASON = {
  // From medical validation (I05.5)
  VALIDATION_FAIL: 'VALIDATION_FAIL',
  VALIDATION_FLAG: 'VALIDATION_FLAG',
  
  // From safety check (I05.6)
  SAFETY_BLOCK: 'SAFETY_BLOCK',
  SAFETY_FLAG: 'SAFETY_FLAG',
  SAFETY_UNKNOWN: 'SAFETY_UNKNOWN',
  
  // From sampling
  SAMPLED: 'SAMPLED',
  
  // Manual
  MANUAL_REVIEW: 'MANUAL_REVIEW',
} as const

export type QueueReason = typeof QUEUE_REASON[keyof typeof QUEUE_REASON]

export const QueueReasonSchema = z.enum([
  QUEUE_REASON.VALIDATION_FAIL,
  QUEUE_REASON.VALIDATION_FLAG,
  QUEUE_REASON.SAFETY_BLOCK,
  QUEUE_REASON.SAFETY_FLAG,
  QUEUE_REASON.SAFETY_UNKNOWN,
  QUEUE_REASON.SAMPLED,
  QUEUE_REASON.MANUAL_REVIEW,
])

// ============================================================
// Decision Reason Codes
// ============================================================

/**
 * Coded reasons for approve/reject decisions (no PHI)
 */
export const DECISION_REASON = {
  // Approvals
  APPROVED_SAFE: 'APPROVED_SAFE',
  APPROVED_FALSE_POSITIVE: 'APPROVED_FALSE_POSITIVE',
  APPROVED_ACCEPTABLE_RISK: 'APPROVED_ACCEPTABLE_RISK',
  APPROVED_SAMPLED_OK: 'APPROVED_SAMPLED_OK',
  
  // Rejections
  REJECTED_UNSAFE: 'REJECTED_UNSAFE',
  REJECTED_CONTRAINDICATION: 'REJECTED_CONTRAINDICATION',
  REJECTED_PLAUSIBILITY: 'REJECTED_PLAUSIBILITY',
  REJECTED_QUALITY: 'REJECTED_QUALITY',
  REJECTED_POLICY: 'REJECTED_POLICY',
  
  // Changes requested
  CHANGES_NEEDED_CLARIFICATION: 'CHANGES_NEEDED_CLARIFICATION',
  CHANGES_NEEDED_TONE: 'CHANGES_NEEDED_TONE',
  CHANGES_NEEDED_CONTENT: 'CHANGES_NEEDED_CONTENT',
  
  // Other
  OTHER: 'OTHER',
} as const

export type DecisionReason = typeof DECISION_REASON[keyof typeof DECISION_REASON]

export const DecisionReasonSchema = z.enum([
  DECISION_REASON.APPROVED_SAFE,
  DECISION_REASON.APPROVED_FALSE_POSITIVE,
  DECISION_REASON.APPROVED_ACCEPTABLE_RISK,
  DECISION_REASON.APPROVED_SAMPLED_OK,
  DECISION_REASON.REJECTED_UNSAFE,
  DECISION_REASON.REJECTED_CONTRAINDICATION,
  DECISION_REASON.REJECTED_PLAUSIBILITY,
  DECISION_REASON.REJECTED_QUALITY,
  DECISION_REASON.REJECTED_POLICY,
  DECISION_REASON.CHANGES_NEEDED_CLARIFICATION,
  DECISION_REASON.CHANGES_NEEDED_TONE,
  DECISION_REASON.CHANGES_NEEDED_CONTENT,
  DECISION_REASON.OTHER,
])

// ============================================================
// Review Record Schema (V1)
// ============================================================

/**
 * Review record - stored in database
 * PHI-free: only references, codes, and primitives
 */
export const ReviewRecordV1Schema = z.object({
  /** Review record ID */
  id: z.string().uuid(),
  
  /** Processing job being reviewed */
  jobId: z.string().uuid(),
  
  /** Review iteration (allows re-review after changes) */
  reviewIteration: z.number().int().min(1).default(1),
  
  /** Review status */
  status: ReviewStatusSchema,
  
  /** Queue inclusion reasons (why this job is in queue) */
  queueReasons: z.array(QueueReasonSchema).min(1),
  
  /** Sampling metadata */
  isSampled: z.boolean().default(false),
  samplingHash: z.string().optional(),
  samplingConfigVersion: z.string().optional(),
  
  /** Validation/Safety references (optional) */
  validationResultId: z.string().uuid().optional(),
  safetyCheckId: z.string().uuid().optional(),
  
  /** Review decision (only if status != PENDING) */
  reviewerUserId: z.string().uuid().optional(),
  reviewerRole: z.enum(['clinician', 'admin', 'nurse']).optional(),
  decisionReasonCode: DecisionReasonSchema.optional(),
  decisionNotes: z.string().max(500).optional(),
  decidedAt: z.string().datetime().optional(),
  
  /** Audit metadata (PHI-free) */
  auditMetadata: z.record(z.string(), z.any()).default({}),
  
  /** Timestamps */
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ReviewRecordV1 = z.infer<typeof ReviewRecordV1Schema>

// ============================================================
// Review Decision Schema
// ============================================================

/**
 * Decision input for approve/reject operations
 */
export const ReviewDecisionSchema = z.object({
  /** Decision status */
  status: z.enum([
    REVIEW_STATUS.APPROVED,
    REVIEW_STATUS.REJECTED,
    REVIEW_STATUS.CHANGES_REQUESTED,
  ]),
  
  /** Coded reason for decision */
  reasonCode: DecisionReasonSchema,
  
  /** Optional redacted notes (max 500 chars, no PHI) */
  notes: z.string().max(500).optional(),
  
  /** Additional metadata (PHI-free) */
  metadata: z.record(z.string(), z.any()).optional(),
})

export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>

// ============================================================
// Queue Item Schema (for API responses)
// ============================================================

/**
 * Queue item - redacted for API responses
 * Contains only non-PHI information
 */
export const QueueItemSchema = z.object({
  /** Review record ID */
  reviewId: z.string().uuid(),
  
  /** Processing job ID */
  jobId: z.string().uuid(),
  
  /** Assessment ID (for context, no PHI) */
  assessmentId: z.string().uuid().optional(),
  
  /** Review iteration */
  reviewIteration: z.number().int(),
  
  /** Current status */
  status: ReviewStatusSchema,
  
  /** Queue reasons */
  queueReasons: z.array(QueueReasonSchema),
  
  /** Is sampled */
  isSampled: z.boolean(),
  
  /** Validation summary (redacted) */
  validationSummary: z.object({
    overallStatus: z.enum(['pass', 'flag', 'fail']).optional(),
    criticalFlagsCount: z.number().int().optional(),
  }).optional(),
  
  /** Safety summary (redacted) */
  safetySummary: z.object({
    recommendedAction: z.enum(['PASS', 'FLAG', 'BLOCK', 'UNKNOWN']).optional(),
    safetyScore: z.number().int().min(0).max(100).optional(),
  }).optional(),
  
  /** Review decision (if decided) */
  decision: z.object({
    reviewerRole: z.string().optional(),
    reasonCode: DecisionReasonSchema.optional(),
    decidedAt: z.string().datetime().optional(),
  }).optional(),
  
  /** Timestamps */
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type QueueItem = z.infer<typeof QueueItemSchema>

// ============================================================
// Sampling Configuration
// ============================================================

/**
 * Sampling configuration
 */
export const SamplingConfigSchema = z.object({
  /** Sampling percentage (0-100) */
  percentage: z.number().int().min(0).max(100).default(10),
  
  /** Salt for hash stability (version this when changing sampling rate) */
  salt: z.string().default('v05-i05-7-default-salt'),
  
  /** Config version */
  version: z.string().default('v1.0.0'),
})

export type SamplingConfig = z.infer<typeof SamplingConfigSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Check if review record is pending
 */
export function isPending(record: ReviewRecordV1): boolean {
  return record.status === REVIEW_STATUS.PENDING
}

/**
 * Check if review record is decided (not pending)
 */
export function isDecided(record: ReviewRecordV1): boolean {
  return record.status !== REVIEW_STATUS.PENDING
}

/**
 * Check if review was approved
 */
export function isApproved(record: ReviewRecordV1): boolean {
  return record.status === REVIEW_STATUS.APPROVED
}

/**
 * Check if review was rejected
 */
export function isRejected(record: ReviewRecordV1): boolean {
  return record.status === REVIEW_STATUS.REJECTED
}

/**
 * Check if changes are requested
 */
export function needsChanges(record: ReviewRecordV1): boolean {
  return record.status === REVIEW_STATUS.CHANGES_REQUESTED
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CHANGES_REQUESTED: 'Changes Requested',
  }
  return labels[status]
}

/**
 * Get queue reason label
 */
export function getQueueReasonLabel(reason: QueueReason): string {
  const labels: Record<QueueReason, string> = {
    VALIDATION_FAIL: 'Validation Failed',
    VALIDATION_FLAG: 'Validation Flagged',
    SAFETY_BLOCK: 'Safety Blocked',
    SAFETY_FLAG: 'Safety Flagged',
    SAFETY_UNKNOWN: 'Safety Check Failed',
    SAMPLED: 'Quality Sampling',
    MANUAL_REVIEW: 'Manual Review Requested',
  }
  return labels[reason]
}

/**
 * Validate decision matches status
 * - APPROVED requires APPROVED_* reason
 * - REJECTED requires REJECTED_* reason
 * - CHANGES_REQUESTED requires CHANGES_* reason
 */
export function isValidDecisionReason(
  status: ReviewStatus,
  reasonCode: DecisionReason
): boolean {
  if (status === REVIEW_STATUS.APPROVED) {
    return reasonCode.startsWith('APPROVED_')
  }
  if (status === REVIEW_STATUS.REJECTED) {
    return reasonCode.startsWith('REJECTED_')
  }
  if (status === REVIEW_STATUS.CHANGES_REQUESTED) {
    return reasonCode.startsWith('CHANGES_')
  }
  return false
}

// ============================================================
// Result Types (for operations)
// ============================================================

/**
 * Success result
 */
export type SuccessResult<T> = {
  success: true
  data: T
}

/**
 * Error result
 */
export type ErrorResult = {
  success: false
  error: string
  errorCode?: string
}

/**
 * Result type (success or error)
 */
export type Result<T> = SuccessResult<T> | ErrorResult

/**
 * Type guard: check if result is success
 */
export function isSuccessResult<T>(result: Result<T>): result is SuccessResult<T> {
  return result.success === true
}

/**
 * Type guard: check if result is error
 */
export function isErrorResult<T>(result: Result<T>): result is ErrorResult {
  return result.success === false
}
