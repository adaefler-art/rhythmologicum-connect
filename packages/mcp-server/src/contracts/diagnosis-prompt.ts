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

export const DIAGNOSIS_TRIAGE_LEVEL = {
  ROUTINE: 'routine',
  SOON: 'soon',
  URGENT: 'urgent',
} as const

export type DiagnosisTriageLevel =
  typeof DIAGNOSIS_TRIAGE_LEVEL[keyof typeof DIAGNOSIS_TRIAGE_LEVEL]

export const DIAGNOSIS_LIKELIHOOD = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export type DiagnosisLikelihood =
  typeof DIAGNOSIS_LIKELIHOOD[keyof typeof DIAGNOSIS_LIKELIHOOD]

export const DIAGNOSIS_NEXT_STEP_CATEGORY = {
  DIAGNOSTICS: 'diagnostics',
  THERAPY: 'therapy',
  REFERRAL: 'referral',
  MONITORING: 'monitoring',
  LIFESTYLE: 'lifestyle',
  OTHER: 'other',
} as const

export type DiagnosisNextStepCategory =
  typeof DIAGNOSIS_NEXT_STEP_CATEGORY[keyof typeof DIAGNOSIS_NEXT_STEP_CATEGORY]

export const SupportingEvidenceSchema = z.object({
  data_point: z.string().min(2),
  interpretation: z.string().min(3),
  source: z.string().min(2).optional(),
})

export type SupportingEvidence = z.infer<typeof SupportingEvidenceSchema>

export const MissingInformationSchema = z.object({
  item: z.string().min(2),
  why_it_matters: z.string().min(5),
  how_to_obtain: z.string().min(5),
})

export type MissingInformation = z.infer<typeof MissingInformationSchema>

export const DifferentialDiagnosisV2Schema = z.object({
  name: z.string().min(2),
  rationale: z.string().min(10).max(2000),
  likelihood: z.enum([
    DIAGNOSIS_LIKELIHOOD.LOW,
    DIAGNOSIS_LIKELIHOOD.MEDIUM,
    DIAGNOSIS_LIKELIHOOD.HIGH,
  ]),
})

export type DifferentialDiagnosisV2 = z.infer<typeof DifferentialDiagnosisV2Schema>

export const RedFlagV2Schema = z.object({
  flag: z.string().min(2),
  evidence: z.string().min(3),
  recommended_action: z.string().min(3),
})

export type RedFlagV2 = z.infer<typeof RedFlagV2Schema>

export const RecommendedNextStepV2Schema = z.object({
  step: z.string().min(2),
  category: z.enum([
    DIAGNOSIS_NEXT_STEP_CATEGORY.DIAGNOSTICS,
    DIAGNOSIS_NEXT_STEP_CATEGORY.THERAPY,
    DIAGNOSIS_NEXT_STEP_CATEGORY.REFERRAL,
    DIAGNOSIS_NEXT_STEP_CATEGORY.MONITORING,
    DIAGNOSIS_NEXT_STEP_CATEGORY.LIFESTYLE,
    DIAGNOSIS_NEXT_STEP_CATEGORY.OTHER,
  ]),
  rationale: z.string().min(5).max(1000),
  priority: z.enum([
    DIAGNOSIS_TRIAGE_LEVEL.ROUTINE,
    DIAGNOSIS_TRIAGE_LEVEL.SOON,
    DIAGNOSIS_TRIAGE_LEVEL.URGENT,
  ]),
})

export type RecommendedNextStepV2 = z.infer<typeof RecommendedNextStepV2Schema>

export const DiagnosisPromptOutputV2Schema = z.object({
  summary_for_clinician: z.string().min(10).max(2000),
  triage: z.object({
    level: z.enum([
      DIAGNOSIS_TRIAGE_LEVEL.ROUTINE,
      DIAGNOSIS_TRIAGE_LEVEL.SOON,
      DIAGNOSIS_TRIAGE_LEVEL.URGENT,
    ]),
    rationale: z.string().min(10).max(1000),
  }),
  primary_impression: z.string().min(3).max(1000),
  differential_diagnoses: z.array(DifferentialDiagnosisV2Schema).min(1).max(8),
  red_flags: z.array(RedFlagV2Schema),
  supporting_evidence: z.array(SupportingEvidenceSchema).min(1).max(20),
  missing_information: z.array(MissingInformationSchema),
  recommended_next_steps: z.array(RecommendedNextStepV2Schema).min(1).max(12),
  contraindications_or_caveats: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  confidence_rationale: z.string().min(5).max(1000),
  patient_friendly_summary: z.string().min(10).max(2000).optional(),
  model_metadata: z.object({
    model: z.string().min(1),
    prompt_version: z.string().min(1),
    timestamp: z.string().datetime(),
  }),
  output_version: z.literal('v2'),
})

export type DiagnosisPromptOutputV2 = z.infer<typeof DiagnosisPromptOutputV2Schema>

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

export const DIAGNOSIS_PROMPT_BUNDLE_VERSION = 'v2.0.0'
export const DIAGNOSIS_PROMPT_VERSION = 'v2.0.0'
export const DIAGNOSIS_SCHEMA_VERSION = 'v2'

export function validateDiagnosisPromptOutputV1(
  output: unknown,
): { success: true; data: DiagnosisPromptOutputV1 } | { success: false; error: z.ZodError } {
  const result = DiagnosisPromptOutputV1Schema.safeParse(output)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, error: result.error }
}

export function validateDiagnosisPromptOutputV2(
  output: unknown,
): { success: true; data: DiagnosisPromptOutputV2 } | { success: false; error: z.ZodError } {
  const result = DiagnosisPromptOutputV2Schema.safeParse(output)

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
