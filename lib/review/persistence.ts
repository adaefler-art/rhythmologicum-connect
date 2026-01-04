/**
 * Review Records Persistence - V05-I05.7
 * 
 * Database operations for medical review records.
 * All operations are PHI-free and RBAC-enforced.
 * 
 * @module lib/review/persistence
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'
import {
  type ReviewRecordV1,
  type ReviewDecision,
  type QueueItem,
  type SamplingConfig,
  type Result,
  REVIEW_STATUS,
  QUEUE_REASON,
  ReviewRecordV1Schema,
} from '@/lib/contracts/reviewRecord'

type DbReviewRecord = Database['public']['Tables']['review_records']['Row']
type DbReviewRecordInsert = Database['public']['Tables']['review_records']['Insert']
type DbReviewRecordUpdate = Database['public']['Tables']['review_records']['Update']

// ============================================================
// Type Conversion Helpers
// ============================================================

/**
 * Convert database row to ReviewRecordV1
 */
function dbToReviewRecord(row: DbReviewRecord): ReviewRecordV1 {
  return {
    id: row.id,
    jobId: row.job_id,
    reviewIteration: row.review_iteration,
    status: row.status as ReviewRecordV1['status'],
    queueReasons: row.queue_reasons as ReviewRecordV1['queueReasons'],
    isSampled: row.is_sampled,
    samplingHash: row.sampling_hash ?? undefined,
    samplingConfigVersion: row.sampling_config_version ?? undefined,
    validationResultId: row.validation_result_id ?? undefined,
    safetyCheckId: row.safety_check_id ?? undefined,
    reviewerUserId: row.reviewer_user_id ?? undefined,
    reviewerRole: row.reviewer_role as ReviewRecordV1['reviewerRole'] | undefined,
    decisionReasonCode: row.decision_reason_code as ReviewRecordV1['decisionReasonCode'] | undefined,
    decisionNotes: row.decision_notes ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    auditMetadata: (row.audit_metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Convert ReviewRecordV1 to database insert
 */
function reviewRecordToDbInsert(record: Partial<ReviewRecordV1>): DbReviewRecordInsert {
  return {
    job_id: record.jobId!,
    review_iteration: record.reviewIteration ?? 1,
    status: record.status ?? REVIEW_STATUS.PENDING,
    queue_reasons: record.queueReasons ?? [],
    is_sampled: record.isSampled ?? false,
    sampling_hash: record.samplingHash ?? null,
    sampling_config_version: record.samplingConfigVersion ?? null,
    validation_result_id: record.validationResultId ?? null,
    safety_check_id: record.safetyCheckId ?? null,
    audit_metadata: record.auditMetadata ?? {},
  }
}

// ============================================================
// Create Review Record
// ============================================================

export type CreateReviewRecordInput = {
  jobId: string
  queueReasons: ReviewRecordV1['queueReasons']
  isSampled?: boolean
  samplingHash?: string
  samplingConfigVersion?: string
  validationResultId?: string
  safetyCheckId?: string
  auditMetadata?: Record<string, unknown>
  reviewIteration?: number
}

/**
 * Create a new review record
 * Idempotent: uses unique constraint on (job_id, review_iteration)
 */
export async function createReviewRecord(
  supabase: SupabaseClient<Database>,
  input: CreateReviewRecordInput
): Promise<Result<ReviewRecordV1>> {
  try {
    const insert = reviewRecordToDbInsert({
      jobId: input.jobId,
      reviewIteration: input.reviewIteration ?? 1,
      queueReasons: input.queueReasons,
      isSampled: input.isSampled ?? false,
      samplingHash: input.samplingHash,
      samplingConfigVersion: input.samplingConfigVersion,
      validationResultId: input.validationResultId,
      safetyCheckId: input.safetyCheckId,
      auditMetadata: input.auditMetadata,
    })

    const { data, error } = await supabase
      .from('review_records')
      .insert(insert)
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation (idempotent behavior)
      if (error.code === '23505') {
        // Already exists, fetch and return existing record
        const existing = await loadReviewRecord(supabase, input.jobId, input.reviewIteration)
        if (existing.success) {
          return existing
        }
      }
      
      return {
        success: false,
        error: `Failed to create review record: ${error.message}`,
        errorCode: 'DB_INSERT_FAILED',
      }
    }

    const record = dbToReviewRecord(data)
    
    // Validate against schema
    const parsed = ReviewRecordV1Schema.safeParse(record)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Invalid review record format',
        errorCode: 'SCHEMA_VALIDATION_FAILED',
      }
    }

    return {
      success: true,
      data: parsed.data,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

// ============================================================
// Load Review Record
// ============================================================

/**
 * Load review record by job ID and iteration
 */
export async function loadReviewRecord(
  supabase: SupabaseClient<Database>,
  jobId: string,
  reviewIteration: number = 1
): Promise<Result<ReviewRecordV1>> {
  try {
    const { data, error } = await supabase
      .from('review_records')
      .select('*')
      .eq('job_id', jobId)
      .eq('review_iteration', reviewIteration)
      .single()

    if (error || !data) {
      return {
        success: false,
        error: 'Review record not found',
        errorCode: 'NOT_FOUND',
      }
    }

    const record = dbToReviewRecord(data)
    return {
      success: true,
      data: record,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Load review record by review ID
 */
export async function loadReviewRecordById(
  supabase: SupabaseClient<Database>,
  reviewId: string
): Promise<Result<ReviewRecordV1>> {
  try {
    const { data, error } = await supabase
      .from('review_records')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (error || !data) {
      return {
        success: false,
        error: 'Review record not found',
        errorCode: 'NOT_FOUND',
      }
    }

    const record = dbToReviewRecord(data)
    return {
      success: true,
      data: record,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

// ============================================================
// Update Review Decision
// ============================================================

export type UpdateReviewDecisionInput = {
  reviewId: string
  decision: ReviewDecision
  reviewerUserId: string
  reviewerRole: 'clinician' | 'admin' | 'nurse'
}

/**
 * Update review record with decision
 * Idempotent: can be called multiple times with same decision
 */
export async function updateReviewDecision(
  supabase: SupabaseClient<Database>,
  input: UpdateReviewDecisionInput
): Promise<Result<ReviewRecordV1>> {
  try {
    // First, verify the record exists and is pending
    const existing = await loadReviewRecordById(supabase, input.reviewId)
    if (!existing.success) {
      return existing
    }

    // Allow idempotent updates (same decision can be applied multiple times)
    const update: DbReviewRecordUpdate = {
      status: input.decision.status,
      reviewer_user_id: input.reviewerUserId,
      reviewer_role: input.reviewerRole,
      decision_reason_code: input.decision.reasonCode,
      decision_notes: input.decision.notes ?? null,
      decided_at: new Date().toISOString(),
      audit_metadata: {
        ...existing.data.auditMetadata,
        ...input.decision.metadata,
      },
    }

    const { data, error } = await supabase
      .from('review_records')
      .update(update)
      .eq('id', input.reviewId)
      .select()
      .single()

    if (error || !data) {
      return {
        success: false,
        error: `Failed to update review decision: ${error?.message ?? 'Unknown error'}`,
        errorCode: 'DB_UPDATE_FAILED',
      }
    }

    const record = dbToReviewRecord(data)
    return {
      success: true,
      data: record,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

// ============================================================
// List Review Queue
// ============================================================

export type ListReviewQueueOptions = {
  status?: ReviewRecordV1['status']
  isSampled?: boolean
  limit?: number
  offset?: number
}

/**
 * List review queue items
 * Returns all pending reviews by default
 */
export async function listReviewQueue(
  supabase: SupabaseClient<Database>,
  options: ListReviewQueueOptions = {}
): Promise<Result<QueueItem[]>> {
  try {
    let query = supabase
      .from('review_records')
      .select(`
        *,
        processing_jobs!inner(assessment_id),
        medical_validation_results(overall_status, critical_flags_count),
        safety_check_results(overall_action, safety_score)
      `)
      .order('created_at', { ascending: false })

    // Filter by status (default: PENDING)
    if (options.status !== undefined) {
      query = query.eq('status', options.status)
    } else {
      query = query.eq('status', REVIEW_STATUS.PENDING)
    }

    // Filter by sampled
    if (options.isSampled !== undefined) {
      query = query.eq('is_sampled', options.isSampled)
    }

    // Pagination
    if (options.limit !== undefined) {
      query = query.limit(options.limit)
    }
    if (options.offset !== undefined) {
      query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: `Failed to list review queue: ${error.message}`,
        errorCode: 'DB_QUERY_FAILED',
      }
    }

    if (!data) {
      return {
        success: true,
        data: [],
      }
    }

    // Convert to QueueItem format (redacted)
    const items: QueueItem[] = data.map((row: any) => ({
      reviewId: row.id,
      jobId: row.job_id,
      assessmentId: row.processing_jobs?.assessment_id,
      reviewIteration: row.review_iteration,
      status: row.status,
      queueReasons: row.queue_reasons,
      isSampled: row.is_sampled,
      validationSummary: row.medical_validation_results ? {
        overallStatus: row.medical_validation_results.overall_status,
        criticalFlagsCount: row.medical_validation_results.critical_flags_count,
      } : undefined,
      safetySummary: row.safety_check_results ? {
        recommendedAction: row.safety_check_results.overall_action,
        safetyScore: row.safety_check_results.safety_score,
      } : undefined,
      decision: row.reviewer_user_id ? {
        reviewerRole: row.reviewer_role,
        reasonCode: row.decision_reason_code,
        decidedAt: row.decided_at,
      } : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return {
      success: true,
      data: items,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

// ============================================================
// Count Review Queue
// ============================================================

/**
 * Count review records by status
 */
export async function countReviewsByStatus(
  supabase: SupabaseClient<Database>
): Promise<Result<Record<string, number>>> {
  try {
    const { data, error } = await supabase
      .from('review_records')
      .select('status', { count: 'exact', head: false })

    if (error) {
      return {
        success: false,
        error: `Failed to count reviews: ${error.message}`,
        errorCode: 'DB_QUERY_FAILED',
      }
    }

    // Aggregate by status
    const counts: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CHANGES_REQUESTED: 0,
    }

    if (data) {
      for (const row of data) {
        const status = row.status as string
        counts[status] = (counts[status] ?? 0) + 1
      }
    }

    return {
      success: true,
      data: counts,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

// ============================================================
// Sampling Helpers
// ============================================================

/**
 * Check if a job should be sampled (deterministic)
 * Uses database function for consistency
 */
export async function shouldSampleJob(
  supabase: SupabaseClient<Database>,
  jobId: string,
  config: SamplingConfig
): Promise<Result<{ shouldSample: boolean; hash: string }>> {
  try {
    const { data, error } = await supabase.rpc('should_sample_job', {
      p_job_id: jobId,
      p_sampling_percentage: config.percentage,
      p_salt: config.salt,
    })

    if (error) {
      return {
        success: false,
        error: `Failed to check sampling: ${error.message}`,
        errorCode: 'DB_RPC_FAILED',
      }
    }

    // Also get the hash for storage
    const { data: hashData, error: hashError } = await supabase.rpc('compute_sampling_hash', {
      p_job_id: jobId,
      p_salt: config.salt,
    })

    if (hashError) {
      return {
        success: false,
        error: `Failed to compute hash: ${hashError.message}`,
        errorCode: 'DB_RPC_FAILED',
      }
    }

    return {
      success: true,
      data: {
        shouldSample: data ?? false,
        hash: hashData ?? '',
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

// ============================================================
// Delete Review Record
// ============================================================

/**
 * Delete review record (for cleanup/testing)
 */
export async function deleteReviewRecord(
  supabase: SupabaseClient<Database>,
  reviewId: string
): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('review_records')
      .delete()
      .eq('id', reviewId)

    if (error) {
      return {
        success: false,
        error: `Failed to delete review record: ${error.message}`,
        errorCode: 'DB_DELETE_FAILED',
      }
    }

    return {
      success: true,
      data: undefined,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}
