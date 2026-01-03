/**
 * Processing Job Contract - V05-I05.1
 * 
 * Versioned schema for processing orchestrator jobs.
 * Defines the structure for processing jobs that transform completed assessments
 * through deterministic stages (Risk → Ranking → Content → Validation → Review → PDF → Delivery).
 * 
 * @module lib/contracts/processingJob
 */

import { z } from 'zod'

// ============================================================
// Processing Stages (Deterministic Enum)
// ============================================================

/**
 * Valid processing stages
 * Jobs progress through these stages in order
 */
export const PROCESSING_STAGE = {
  PENDING: 'pending',
  RISK: 'risk',
  RANKING: 'ranking',
  CONTENT: 'content',
  VALIDATION: 'validation',
  REVIEW: 'review',
  PDF: 'pdf',
  DELIVERY: 'delivery',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type ProcessingStage = typeof PROCESSING_STAGE[keyof typeof PROCESSING_STAGE]

/**
 * Ordered stage progression
 * Used to enforce deterministic stage transitions
 */
export const STAGE_ORDER: ProcessingStage[] = [
  PROCESSING_STAGE.PENDING,
  PROCESSING_STAGE.RISK,
  PROCESSING_STAGE.RANKING,
  PROCESSING_STAGE.CONTENT,
  PROCESSING_STAGE.VALIDATION,
  PROCESSING_STAGE.REVIEW,
  PROCESSING_STAGE.PDF,
  PROCESSING_STAGE.DELIVERY,
  PROCESSING_STAGE.COMPLETED,
]

/**
 * Get the next stage in the progression
 * Returns null if already at terminal stage
 */
export function getNextStage(currentStage: ProcessingStage): ProcessingStage | null {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
    return null
  }
  return STAGE_ORDER[currentIndex + 1]
}

/**
 * Check if a stage is a terminal state
 */
export function isTerminalStage(stage: ProcessingStage): boolean {
  return stage === PROCESSING_STAGE.COMPLETED || stage === PROCESSING_STAGE.FAILED
}

// ============================================================
// Processing Status (Enum)
// ============================================================

/**
 * Valid processing statuses
 */
export const PROCESSING_STATUS = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type ProcessingStatus = typeof PROCESSING_STATUS[keyof typeof PROCESSING_STATUS]

// ============================================================
// Error Information (PHI-Free)
// ============================================================

/**
 * Redacted error information
 * Contains no PHI, only error codes and safe messages
 */
export const ProcessingErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  stage: z.string(),
  timestamp: z.string().datetime(),
  attempt: z.number().int().min(1),
})

export type ProcessingError = z.infer<typeof ProcessingErrorSchema>

// ============================================================
// Processing Job V1 Schema
// ============================================================

/**
 * Processing Job V1
 * Minimal, versioned schema for processing orchestrator
 */
export const ProcessingJobV1Schema = z.object({
  // Identifiers
  jobId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  correlationId: z.string().min(1).max(255),
  
  // Status & Stage
  status: z.enum([
    PROCESSING_STATUS.QUEUED,
    PROCESSING_STATUS.IN_PROGRESS,
    PROCESSING_STATUS.COMPLETED,
    PROCESSING_STATUS.FAILED,
  ]),
  stage: z.enum([
    PROCESSING_STAGE.PENDING,
    PROCESSING_STAGE.RISK,
    PROCESSING_STAGE.RANKING,
    PROCESSING_STAGE.CONTENT,
    PROCESSING_STAGE.VALIDATION,
    PROCESSING_STAGE.REVIEW,
    PROCESSING_STAGE.PDF,
    PROCESSING_STAGE.DELIVERY,
    PROCESSING_STAGE.COMPLETED,
    PROCESSING_STAGE.FAILED,
  ]),
  
  // Retry Tracking
  attempt: z.number().int().min(1).max(5).default(1),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  
  // Timestamps
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  
  // Errors (PHI-free, redacted)
  errors: z.array(ProcessingErrorSchema).default([]),
  
  // Version tracking
  schemaVersion: z.literal('v1').default('v1'),
})

export type ProcessingJobV1 = z.infer<typeof ProcessingJobV1Schema>

// ============================================================
// Processing Job Input (for creation)
// ============================================================

/**
 * Input for creating a new processing job
 */
export const CreateProcessingJobInputSchema = z.object({
  assessmentId: z.string().uuid(),
  correlationId: z.string().min(1).max(255).optional(),
})

export type CreateProcessingJobInput = z.infer<typeof CreateProcessingJobInputSchema>

// ============================================================
// Status Transition Input
// ============================================================

/**
 * Input for transitioning job to a new stage
 */
export const TransitionStageInputSchema = z.object({
  jobId: z.string().uuid(),
  toStage: z.string(),
  error: ProcessingErrorSchema.optional(),
})

export type TransitionStageInput = z.infer<typeof TransitionStageInputSchema>

// ============================================================
// Type Guards
// ============================================================

/**
 * Type guard to check if a value is a valid processing stage
 */
export function isValidProcessingStage(value: unknown): value is ProcessingStage {
  return typeof value === 'string' && Object.values(PROCESSING_STAGE).includes(value as ProcessingStage)
}

/**
 * Type guard to check if a value is a valid processing status
 */
export function isValidProcessingStatus(value: unknown): value is ProcessingStatus {
  return typeof value === 'string' && Object.values(PROCESSING_STATUS).includes(value as ProcessingStatus)
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Generate a correlation ID if not provided
 * Format: assessment-{assessmentId}-{timestamp}
 */
export function generateCorrelationId(assessmentId: string): string {
  const timestamp = Date.now()
  return `assessment-${assessmentId}-${timestamp}`
}

/**
 * Check if a job can be retried
 */
export function canRetry(job: ProcessingJobV1): boolean {
  return job.attempt < job.maxAttempts && !isTerminalStage(job.stage)
}

/**
 * Redact error message to remove potential PHI
 * Keeps error codes and generic messages only
 */
export function redactError(error: Error | unknown, stage: ProcessingStage, attempt: number): ProcessingError {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  
  // Remove any patterns that might contain PHI:
  // - UUIDs
  // - Email addresses
  // - Names (capitalized words in specific patterns)
  // - Dates of birth
  const redactedMessage = errorMessage
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[REDACTED-UUID]')
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[REDACTED-EMAIL]')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[REDACTED-DATE]')
  
  // Limit message length to prevent large error dumps
  const maxLength = 500
  const truncatedMessage = redactedMessage.length > maxLength 
    ? redactedMessage.substring(0, maxLength) + '...[truncated]'
    : redactedMessage
  
  return {
    code: error instanceof Error && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR',
    message: truncatedMessage,
    stage,
    timestamp: new Date().toISOString(),
    attempt,
  }
}
