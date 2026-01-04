/**
 * Review Queue Helper - V05-I05.7
 * 
 * Helper functions to add jobs to the review queue based on
 * validation/safety results and sampling configuration.
 * 
 * @module lib/review/queueHelper
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'
import { env } from '@/lib/env'
import {
  createReviewRecord,
  shouldSampleJob,
  type CreateReviewRecordInput,
} from './persistence'
import {
  QUEUE_REASON,
  type QueueReason,
  type SamplingConfig,
  type Result,
} from '@/lib/contracts/reviewRecord'

// ============================================================
// Types
// ============================================================

export type QueueEvaluationContext = {
  jobId: string
  validationResultId?: string
  validationStatus?: 'pass' | 'flag' | 'fail'
  safetyCheckId?: string
  safetyAction?: 'PASS' | 'FLAG' | 'BLOCK' | 'UNKNOWN'
  samplingConfig?: SamplingConfig
}

export type QueueEvaluationResult = {
  shouldQueue: boolean
  reasons: QueueReason[]
  isSampled: boolean
  samplingHash?: string
  samplingConfigVersion?: string
}

// ============================================================
// Queue Evaluation
// ============================================================

/**
 * Evaluate if a job should be added to review queue
 * 
 * Logic:
 * 1. BLOCK/UNKNOWN from safety check → always queue
 * 2. FAIL from validation → always queue
 * 3. FLAG from safety/validation → always queue
 * 4. Otherwise, check sampling (deterministic)
 */
export async function evaluateForQueue(
  supabase: SupabaseClient<Database>,
  context: QueueEvaluationContext
): Promise<Result<QueueEvaluationResult>> {
  try {
    const reasons: QueueReason[] = []
    let isSampled = false
    let samplingHash: string | undefined
    let samplingConfigVersion: string | undefined

    // Check validation status
    if (context.validationStatus === 'fail') {
      reasons.push(QUEUE_REASON.VALIDATION_FAIL)
    } else if (context.validationStatus === 'flag') {
      reasons.push(QUEUE_REASON.VALIDATION_FLAG)
    }

    // Check safety action
    if (context.safetyAction === 'BLOCK') {
      reasons.push(QUEUE_REASON.SAFETY_BLOCK)
    } else if (context.safetyAction === 'FLAG') {
      reasons.push(QUEUE_REASON.SAFETY_FLAG)
    } else if (context.safetyAction === 'UNKNOWN') {
      reasons.push(QUEUE_REASON.SAFETY_UNKNOWN)
    }

    // If no flagging reasons, check sampling
    if (reasons.length === 0 && context.samplingConfig) {
      const samplingResult = await shouldSampleJob(
        supabase,
        context.jobId,
        context.samplingConfig
      )

      if (!samplingResult.success) {
        // Sampling check failed - fail-safe: queue for review
        reasons.push(QUEUE_REASON.MANUAL_REVIEW)
      } else if (samplingResult.data.shouldSample) {
        reasons.push(QUEUE_REASON.SAMPLED)
        isSampled = true
        samplingHash = samplingResult.data.hash
        samplingConfigVersion = context.samplingConfig.version
      }
    }

    const shouldQueue = reasons.length > 0

    return {
      success: true,
      data: {
        shouldQueue,
        reasons,
        isSampled,
        samplingHash,
        samplingConfigVersion,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'EVALUATION_FAILED',
    }
  }
}

// ============================================================
// Add to Queue
// ============================================================

/**
 * Add a job to the review queue based on evaluation
 */
export async function addToQueueIfNeeded(
  supabase: SupabaseClient<Database>,
  context: QueueEvaluationContext
): Promise<Result<{ queued: boolean; reviewId?: string }>> {
  try {
    // Evaluate if job should be queued
    const evaluation = await evaluateForQueue(supabase, context)
    
    if (!evaluation.success) {
      return evaluation
    }

    if (!evaluation.data.shouldQueue) {
      return {
        success: true,
        data: { queued: false },
      }
    }

    // Create review record
    const input: CreateReviewRecordInput = {
      jobId: context.jobId,
      queueReasons: evaluation.data.reasons,
      isSampled: evaluation.data.isSampled,
      samplingHash: evaluation.data.samplingHash,
      samplingConfigVersion: evaluation.data.samplingConfigVersion,
      validationResultId: context.validationResultId,
      safetyCheckId: context.safetyCheckId,
      auditMetadata: {
        queuedAt: new Date().toISOString(),
        autoQueued: true,
      },
    }

    const result = await createReviewRecord(supabase, input)

    if (!result.success) {
      return {
        success: false,
        error: `Failed to create review record: ${result.error}`,
        errorCode: result.errorCode,
      }
    }

    return {
      success: true,
      data: {
        queued: true,
        reviewId: result.data.id,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'QUEUE_ADD_FAILED',
    }
  }
}

// ============================================================
// Default Sampling Config
// ============================================================

/**
 * Get default sampling configuration
 * Can be overridden via environment variables
 */
export function getDefaultSamplingConfig(): SamplingConfig {
  const parsedPercentage = env.REVIEW_SAMPLING_PERCENTAGE
    ? parseInt(env.REVIEW_SAMPLING_PERCENTAGE, 10)
    : 10

  const percentage = Number.isFinite(parsedPercentage) ? parsedPercentage : 10

  const salt = env.REVIEW_SAMPLING_SALT ?? 'v05-i05-7-default-salt'

  return {
    percentage: Math.max(0, Math.min(100, percentage)), // Clamp 0-100
    salt,
    version: 'v1.0.0',
  }
}
