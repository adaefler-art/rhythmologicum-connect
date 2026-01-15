/**
 * Patient Assessment API Contracts - E6.2.3
 *
 * Versioned schemas for patient-facing assessment endpoints.
 * All request/response schemas include schemaVersion for iOS compatibility.
 *
 * @module lib/api/contracts/patient/assessments
 */

import { z } from 'zod'

// ============================================================
// Schema Version
// ============================================================

/**
 * Current schema version for patient assessment contracts
 * Increment when making breaking changes to request/response structure
 */
export const PATIENT_ASSESSMENT_SCHEMA_VERSION = 'v1' as const

// ============================================================
// Common Types
// ============================================================

/**
 * Assessment status
 */
export const ASSESSMENT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type AssessmentStatus = typeof ASSESSMENT_STATUS[keyof typeof ASSESSMENT_STATUS]

/**
 * Step type for questionnaire steps
 */
export const STEP_TYPE = {
  QUESTIONNAIRE: 'questionnaire',
  CONTENT: 'content',
  INTRO: 'intro',
  OUTRO: 'outro',
} as const

export type StepType = typeof STEP_TYPE[keyof typeof STEP_TYPE]

// ============================================================
// Current Step Schema
// ============================================================

/**
 * Current step information included in assessment responses
 */
export const CurrentStepSchema = z.object({
  stepId: z.string().uuid(),
  title: z.string(),
  type: z.string(),
  stepIndex: z.number().int().nonnegative(),
  orderIndex: z.number().int().nonnegative(),
})

export type CurrentStep = z.infer<typeof CurrentStepSchema>

// ============================================================
// Start Assessment Endpoint
// POST /api/funnels/{slug}/assessments
// ============================================================

/**
 * Request body schema (currently no body required)
 */
export const StartAssessmentRequestSchema = z.object({}).optional()

export type StartAssessmentRequest = z.infer<typeof StartAssessmentRequestSchema>

/**
 * Response data schema
 */
export const StartAssessmentResponseDataSchema = z.object({
  assessmentId: z.string().uuid(),
  status: z.enum([ASSESSMENT_STATUS.IN_PROGRESS, ASSESSMENT_STATUS.COMPLETED]),
  currentStep: CurrentStepSchema,
})

export type StartAssessmentResponseData = z.infer<typeof StartAssessmentResponseDataSchema>

/**
 * Complete response schema with version marker
 */
export const StartAssessmentResponseSchema = z.object({
  success: z.literal(true),
  data: StartAssessmentResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type StartAssessmentResponse = z.infer<typeof StartAssessmentResponseSchema>

// ============================================================
// Resume Assessment Endpoint
// GET /api/funnels/{slug}/assessments/{assessmentId}
// ============================================================

/**
 * Response data schema
 */
export const ResumeAssessmentResponseDataSchema = z.object({
  assessmentId: z.string().uuid(),
  status: z.enum([ASSESSMENT_STATUS.IN_PROGRESS, ASSESSMENT_STATUS.COMPLETED]),
  currentStep: CurrentStepSchema,
  completedSteps: z.number().int().nonnegative(),
  totalSteps: z.number().int().positive(),
})

export type ResumeAssessmentResponseData = z.infer<typeof ResumeAssessmentResponseDataSchema>

/**
 * Complete response schema with version marker
 */
export const ResumeAssessmentResponseSchema = z.object({
  success: z.literal(true),
  data: ResumeAssessmentResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type ResumeAssessmentResponse = z.infer<typeof ResumeAssessmentResponseSchema>

// ============================================================
// Save Answer Endpoint
// POST /api/funnels/{slug}/assessments/{assessmentId}/answers/save
// ============================================================

/**
 * Request body schema
 * Note: stepId validation is kept lenient (string instead of strict UUID)
 * to allow downstream validation to provide more specific error codes (404 vs 400)
 */
export const SaveAnswerRequestSchema = z.object({
  stepId: z.string().min(1),
  questionId: z.string().min(1),
  answerValue: z.number().int(),
})

export type SaveAnswerRequest = z.infer<typeof SaveAnswerRequestSchema>

/**
 * Response data schema
 */
export const SaveAnswerResponseDataSchema = z.object({
  id: z.string().uuid(),
  assessment_id: z.string().uuid(),
  question_id: z.string(),
  answer_value: z.number().int(),
})

export type SaveAnswerResponseData = z.infer<typeof SaveAnswerResponseDataSchema>

/**
 * Complete response schema with version marker
 */
export const SaveAnswerResponseSchema = z.object({
  success: z.literal(true),
  data: SaveAnswerResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type SaveAnswerResponse = z.infer<typeof SaveAnswerResponseSchema>

// ============================================================
// Complete Assessment Endpoint
// POST /api/funnels/{slug}/assessments/{assessmentId}/complete
// ============================================================

/**
 * Request body schema (currently no body required)
 */
export const CompleteAssessmentRequestSchema = z.object({}).optional()

export type CompleteAssessmentRequest = z.infer<typeof CompleteAssessmentRequestSchema>

/**
 * Response data schema
 */
export const CompleteAssessmentResponseDataSchema = z.object({
  assessmentId: z.string().uuid(),
  status: z.literal(ASSESSMENT_STATUS.COMPLETED),
  message: z.string().optional(),
})

export type CompleteAssessmentResponseData = z.infer<typeof CompleteAssessmentResponseDataSchema>

/**
 * Complete response schema with version marker
 */
export const CompleteAssessmentResponseSchema = z.object({
  success: z.literal(true),
  data: CompleteAssessmentResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type CompleteAssessmentResponse = z.infer<typeof CompleteAssessmentResponseSchema>

// ============================================================
// Get Result Endpoint
// GET /api/funnels/{slug}/assessments/{assessmentId}/result
// ============================================================

/**
 * Response data schema - E6.4.4: Added workupStatus and missingDataFields
 */
export const GetResultResponseDataSchema = z.object({
  id: z.string().uuid(),
  funnel: z.string(),
  completedAt: z.string().datetime().nullable(),
  status: z.enum([ASSESSMENT_STATUS.IN_PROGRESS, ASSESSMENT_STATUS.COMPLETED]),
  funnelTitle: z.string().nullable(),
  workupStatus: z.enum(['needs_more_data', 'ready_for_review']).nullable(),
  missingDataFields: z.array(z.string()),
})

export type GetResultResponseData = z.infer<typeof GetResultResponseDataSchema>

/**
 * Complete response schema with version marker
 */
export const GetResultResponseSchema = z.object({
  success: z.literal(true),
  data: GetResultResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type GetResultResponse = z.infer<typeof GetResultResponseSchema>

// ============================================================
// Error Response Schema
// ============================================================

/**
 * Standard error response schema
 * Matches the existing ApiError structure from lib/api/responseTypes.ts
 */
export const PatientAssessmentErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type PatientAssessmentError = z.infer<typeof PatientAssessmentErrorSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Validates start assessment response
 */
export function validateStartAssessmentResponse(
  data: unknown,
): StartAssessmentResponse {
  return StartAssessmentResponseSchema.parse(data)
}

/**
 * Safely validates start assessment response
 */
export function safeValidateStartAssessmentResponse(
  data: unknown,
): StartAssessmentResponse | null {
  const result = StartAssessmentResponseSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validates resume assessment response
 */
export function validateResumeAssessmentResponse(
  data: unknown,
): ResumeAssessmentResponse {
  return ResumeAssessmentResponseSchema.parse(data)
}

/**
 * Safely validates resume assessment response
 */
export function safeValidateResumeAssessmentResponse(
  data: unknown,
): ResumeAssessmentResponse | null {
  const result = ResumeAssessmentResponseSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validates save answer request
 */
export function validateSaveAnswerRequest(
  data: unknown,
): SaveAnswerRequest {
  return SaveAnswerRequestSchema.parse(data)
}

/**
 * Safely validates save answer request
 */
export function safeValidateSaveAnswerRequest(
  data: unknown,
): SaveAnswerRequest | null {
  const result = SaveAnswerRequestSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validates save answer response
 */
export function validateSaveAnswerResponse(
  data: unknown,
): SaveAnswerResponse {
  return SaveAnswerResponseSchema.parse(data)
}

/**
 * Safely validates save answer response
 */
export function safeValidateSaveAnswerResponse(
  data: unknown,
): SaveAnswerResponse | null {
  const result = SaveAnswerResponseSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validates complete assessment response
 */
export function validateCompleteAssessmentResponse(
  data: unknown,
): CompleteAssessmentResponse {
  return CompleteAssessmentResponseSchema.parse(data)
}

/**
 * Safely validates complete assessment response
 */
export function safeValidateCompleteAssessmentResponse(
  data: unknown,
): CompleteAssessmentResponse | null {
  const result = CompleteAssessmentResponseSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validates get result response
 */
export function validateGetResultResponse(
  data: unknown,
): GetResultResponse {
  return GetResultResponseSchema.parse(data)
}

/**
 * Safely validates get result response
 */
export function safeValidateGetResultResponse(
  data: unknown,
): GetResultResponse | null {
  const result = GetResultResponseSchema.safeParse(data)
  return result.success ? result.data : null
}
