import { z } from 'zod'

export const CONFIDENCE_LEVEL = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
} as const

export type ConfidenceLevel = typeof CONFIDENCE_LEVEL[keyof typeof CONFIDENCE_LEVEL]

export const URGENCY_LEVEL = {
  ROUTINE: 'routine',
  PROMPT: 'prompt',
  URGENT: 'urgent',
  EMERGENT: 'emergent',
} as const

export type UrgencyLevel = typeof URGENCY_LEVEL[keyof typeof URGENCY_LEVEL]

export const PatientContextUsedSchema = z.object({
  assessments_count: z.number().min(0),
  date_range: z.object({
    earliest: z.string().datetime(),
    latest: z.string().datetime(),
  }),
  data_sources: z.array(z.string()).min(1),
  completeness_score: z.number().min(0).max(1),
})

export type PatientContextUsed = z.infer<typeof PatientContextUsedSchema>

export const DifferentialDiagnosisSchema = z.object({
  condition: z.string().min(1).max(500),
  rationale: z.string().min(10).max(2000),
  confidence: z.enum([
    CONFIDENCE_LEVEL.VERY_LOW,
    CONFIDENCE_LEVEL.LOW,
    CONFIDENCE_LEVEL.MODERATE,
    CONFIDENCE_LEVEL.HIGH,
    CONFIDENCE_LEVEL.VERY_HIGH,
  ]),
  supporting_factors: z.array(z.string()).min(1),
  contradicting_factors: z.array(z.string()).optional(),
})

export type DifferentialDiagnosis = z.infer<typeof DifferentialDiagnosisSchema>

export const RecommendedNextStepSchema = z.object({
  step: z.string().min(1).max(500),
  rationale: z.string().min(10).max(1000),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  timeframe: z.string().max(200).optional(),
})

export type RecommendedNextStep = z.infer<typeof RecommendedNextStepSchema>

export const UrgentRedFlagSchema = z.object({
  flag: z.string().min(1).max(500),
  urgency: z.enum([
    URGENCY_LEVEL.ROUTINE,
    URGENCY_LEVEL.PROMPT,
    URGENCY_LEVEL.URGENT,
    URGENCY_LEVEL.EMERGENT,
  ]),
  rationale: z.string().min(10).max(1000),
  recommended_action: z.string().min(1).max(500),
})

export type UrgentRedFlag = z.infer<typeof UrgentRedFlagSchema>

export const DiagnosisPromptOutputV1Schema = z.object({
  summary: z.string().min(10).max(1000),
  patient_context_used: PatientContextUsedSchema,
  differential_diagnoses: z.array(DifferentialDiagnosisSchema).min(1).max(5),
  recommended_next_steps: z.array(RecommendedNextStepSchema).min(1).max(10),
  urgent_red_flags: z.array(UrgentRedFlagSchema),
  disclaimer: z.string().min(50).max(500),
  schema_version: z.literal('v1'),
})

export type DiagnosisPromptOutputV1 = z.infer<typeof DiagnosisPromptOutputV1Schema>

export const DIAGNOSIS_PROMPT_BUNDLE_VERSION = 'v1.0.0'
export const DIAGNOSIS_PROMPT_VERSION = 'v1.0.0'
export const DIAGNOSIS_SCHEMA_VERSION = 'v1'

export function validateDiagnosisPromptOutputV1(
  output: unknown,
): { success: true; data: DiagnosisPromptOutputV1 } | { success: false; error: z.ZodError } {
  const result = DiagnosisPromptOutputV1Schema.safeParse(output)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, error: result.error }
}

export function hasValidDisclaimer(output: DiagnosisPromptOutputV1): boolean {
  return (
    output.disclaimer.length >= 50 &&
    output.disclaimer.length <= 500 &&
    (output.disclaimer.toLowerCase().includes('not medical advice') ||
      output.disclaimer.toLowerCase().includes('clinician review') ||
      output.disclaimer.toLowerCase().includes('professional judgment'))
  )
}

export function hasEmergentRedFlags(output: DiagnosisPromptOutputV1): boolean {
  return output.urgent_red_flags.some((flag) => flag.urgency === URGENCY_LEVEL.EMERGENT)
}
