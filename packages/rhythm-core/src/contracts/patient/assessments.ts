/**
 * Rhythm Core - Patient Assessment Contracts
 * Source of truth for patient assessment API contracts.
 */

import { z } from 'zod'

export const PATIENT_ASSESSMENT_SCHEMA_VERSION = 'v1' as const

export const ASSESSMENT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type AssessmentStatus = typeof ASSESSMENT_STATUS[keyof typeof ASSESSMENT_STATUS]

export const STEP_TYPE = {
  QUESTIONNAIRE: 'questionnaire',
  CONTENT: 'content',
  INTRO: 'intro',
  OUTRO: 'outro',
} as const

export type StepType = typeof STEP_TYPE[keyof typeof STEP_TYPE]

export const CurrentStepSchema = z.object({
  stepId: z.string(),
  title: z.string(),
  type: z.string(),
  stepIndex: z.number().int().nonnegative(),
  orderIndex: z.number().int().nonnegative(),
})

export type CurrentStep = z.infer<typeof CurrentStepSchema>

export const StartAssessmentRequestSchema = z.object({}).optional()
export type StartAssessmentRequest = z.infer<typeof StartAssessmentRequestSchema>

export const StartAssessmentResponseDataSchema = z.object({
  assessmentId: z.string().uuid(),
  status: z.enum([ASSESSMENT_STATUS.IN_PROGRESS, ASSESSMENT_STATUS.COMPLETED]),
  currentStep: CurrentStepSchema,
})

export type StartAssessmentResponseData = z.infer<typeof StartAssessmentResponseDataSchema>

export const StartAssessmentResponseSchema = z.object({
  success: z.literal(true),
  data: StartAssessmentResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type StartAssessmentResponse = z.infer<typeof StartAssessmentResponseSchema>

export const ResumeAssessmentResponseDataSchema = z.object({
  assessmentId: z.string().uuid(),
  status: z.enum([ASSESSMENT_STATUS.IN_PROGRESS, ASSESSMENT_STATUS.COMPLETED]),
  currentStep: CurrentStepSchema,
  completedSteps: z.number().int().nonnegative(),
  totalSteps: z.number().int().positive(),
})

export type ResumeAssessmentResponseData = z.infer<typeof ResumeAssessmentResponseDataSchema>

export const ResumeAssessmentResponseSchema = z.object({
  success: z.literal(true),
  data: ResumeAssessmentResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type ResumeAssessmentResponse = z.infer<typeof ResumeAssessmentResponseSchema>

export const AnswerValueSchema = z.union([z.number(), z.string(), z.boolean()])
export type AnswerValue = z.infer<typeof AnswerValueSchema>

export const SaveAnswerRequestSchema = z.object({
  stepId: z.string().min(1),
  questionId: z.string().min(1),
  answerValue: AnswerValueSchema,
})

export type SaveAnswerRequest = z.infer<typeof SaveAnswerRequestSchema>

export const SaveAnswerResponseDataSchema = z.object({
  id: z.string().uuid(),
  assessment_id: z.string().uuid(),
  question_id: z.string(),
  answer_value: z.number().int().nullable(),
  answer_data: AnswerValueSchema.nullable().optional(),
})

export type SaveAnswerResponseData = z.infer<typeof SaveAnswerResponseDataSchema>

export const SaveAnswerResponseSchema = z.object({
  success: z.literal(true),
  data: SaveAnswerResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type SaveAnswerResponse = z.infer<typeof SaveAnswerResponseSchema>

export const CompleteAssessmentRequestSchema = z.object({}).optional()
export type CompleteAssessmentRequest = z.infer<typeof CompleteAssessmentRequestSchema>

export const CompleteAssessmentResponseDataSchema = z.object({
  assessmentId: z.string().uuid(),
  status: z.literal(ASSESSMENT_STATUS.COMPLETED),
  message: z.string().optional(),
  // E73.2: Processing job information (idempotent job creation)
  processingJob: z
    .object({
      jobId: z.string().uuid(),
      status: z.enum(['queued', 'in_progress', 'completed', 'failed']),
    })
    .optional(),
})

export type CompleteAssessmentResponseData = z.infer<typeof CompleteAssessmentResponseDataSchema>

export const CompleteAssessmentResponseSchema = z.object({
  success: z.literal(true),
  data: CompleteAssessmentResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type CompleteAssessmentResponse = z.infer<typeof CompleteAssessmentResponseSchema>

export const GetResultResponseDataSchema = z.object({
  id: z.string().uuid(),
  funnel: z.string(),
  completedAt: z.string().datetime().nullable(),
  status: z.enum([ASSESSMENT_STATUS.IN_PROGRESS, ASSESSMENT_STATUS.COMPLETED]),
  funnelTitle: z.string().nullable(),
  workupStatus: z.enum(['needs_more_data', 'ready_for_review']).nullable(),
  missingDataFields: z.array(z.string()),
  result: z.object({
    kind: z.literal('poc'),
    summaryTitle: z.string(),
    summaryBullets: z.array(z.string()),
    derived: z
      .object({
        cardiovascularAgeYears: z.number().nullable().optional(),
        riskBand: z.enum(['low', 'medium', 'high', 'unknown']).optional(),
      })
      .optional(),
    answersEcho: z
      .array(
        z.object({
          questionId: z.string(),
          value: z.union([z.string(), z.number(), z.boolean()]),
        }),
      )
      .optional(),
  }),
  nextActions: z
    .array(
      z.object({
        kind: z.string(),
        label: z.string(),
        status: z.string().optional(),
      }),
    )
    .optional(),
  report: z
    .object({
      id: z.string().uuid().nullable().optional(),
      status: z.enum(['not_generated', 'generated']),
    })
    .optional(),
})

export type GetResultResponseData = z.infer<typeof GetResultResponseDataSchema>

export const GetResultResponseSchema = z.object({
  success: z.literal(true),
  data: GetResultResponseDataSchema,
  schemaVersion: z.literal(PATIENT_ASSESSMENT_SCHEMA_VERSION),
})

export type GetResultResponse = z.infer<typeof GetResultResponseSchema>

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

export function validateStartAssessmentResponse(data: unknown): StartAssessmentResponse {
  return StartAssessmentResponseSchema.parse(data)
}

export function safeValidateStartAssessmentResponse(data: unknown): StartAssessmentResponse | null {
  const result = StartAssessmentResponseSchema.safeParse(data)
  return result.success ? result.data : null
}

export function validateResumeAssessmentResponse(data: unknown): ResumeAssessmentResponse {
  return ResumeAssessmentResponseSchema.parse(data)
}

export function safeValidateResumeAssessmentResponse(data: unknown): ResumeAssessmentResponse | null {
  const result = ResumeAssessmentResponseSchema.safeParse(data)
  return result.success ? result.data : null
}

export function validateSaveAnswerRequest(data: unknown): SaveAnswerRequest {
  return SaveAnswerRequestSchema.parse(data)
}

export function validateCompleteAssessmentResponse(data: unknown): CompleteAssessmentResponse {
  return CompleteAssessmentResponseSchema.parse(data)
}
