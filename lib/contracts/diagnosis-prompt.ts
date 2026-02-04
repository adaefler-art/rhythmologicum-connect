/**
 * Diagnosis Prompt Contract - E76.5
 * 
 * Versioned schema for diagnosis prompt output artifacts.
 * Defines the structure for LLM-generated diagnosis responses.
 * 
 * IMPORTANT: This output is NOT medical advice. It is for clinician review only.
 * 
 * @module lib/contracts/diagnosis-prompt
 */

import { z } from 'zod'

// ============================================================
// Confidence Levels
// ============================================================

/**
 * Confidence levels for differential diagnoses
 */
export const CONFIDENCE_LEVEL = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
} as const

export type ConfidenceLevel = typeof CONFIDENCE_LEVEL[keyof typeof CONFIDENCE_LEVEL]

// ============================================================
// Urgency Levels
// ============================================================

/**
 * Urgency levels for red flags
 */
export const URGENCY_LEVEL = {
  ROUTINE: 'routine',
  PROMPT: 'prompt',
  URGENT: 'urgent',
  EMERGENT: 'emergent',
} as const

export type UrgencyLevel = typeof URGENCY_LEVEL[keyof typeof URGENCY_LEVEL]

// ============================================================
// Zod Schemas
// ============================================================

/**
 * Schema for patient context usage metadata
 */
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

/**
 * Schema for a single differential diagnosis
 */
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

/**
 * Schema for a single recommended next step
 */
export const RecommendedNextStepSchema = z.object({
  step: z.string().min(1).max(500),
  rationale: z.string().min(10).max(1000),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  timeframe: z.string().max(200).optional(),
})

export type RecommendedNextStep = z.infer<typeof RecommendedNextStepSchema>

/**
 * Schema for an urgent red flag
 */
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

/**
 * Schema for complete diagnosis prompt output (v1)
 * 
 * This is the expected structure from the LLM when using the diagnosis prompt.
 */
export const DiagnosisPromptOutputV1Schema = z.object({
  /**
   * Brief summary of the diagnosis analysis (max 1000 chars)
   */
  summary: z.string().min(10).max(1000),

  /**
   * Metadata about patient context used in analysis
   */
  patient_context_used: PatientContextUsedSchema,

  /**
   * Differential diagnoses (ordered by confidence, highest first)
   * Minimum 1, maximum 5 differential diagnoses
   */
  differential_diagnoses: z
    .array(DifferentialDiagnosisSchema)
    .min(1)
    .max(5),

  /**
   * Recommended next steps (ordered by priority, highest first)
   * Minimum 1, maximum 10 recommendations
   */
  recommended_next_steps: z
    .array(RecommendedNextStepSchema)
    .min(1)
    .max(10),

  /**
   * Urgent red flags requiring immediate attention
   * Empty array if no red flags identified
   */
  urgent_red_flags: z.array(UrgentRedFlagSchema),

  /**
   * Legal/medical disclaimer
   * Must be present and non-empty
   */
  disclaimer: z.string().min(50).max(500),

  /**
   * Schema version for this output
   */
  schema_version: z.literal('v1'),
})

export type DiagnosisPromptOutputV1 = z.infer<typeof DiagnosisPromptOutputV1Schema>

// ============================================================
// Prompt Bundle Metadata
// ============================================================

/**
 * Prompt bundle version for diagnosis prompt v1
 */
export const DIAGNOSIS_PROMPT_BUNDLE_VERSION = 'v1.0.0'

/**
 * Prompt version for diagnosis prompt v1
 */
export const DIAGNOSIS_PROMPT_VERSION = 'v1.0.0'

/**
 * Schema version for diagnosis prompt output v1
 */
export const DIAGNOSIS_SCHEMA_VERSION = 'v1'

// ============================================================
// Validation Helpers
// ============================================================

/**
 * Validate diagnosis prompt output against v1 schema
 * 
 * @param output - The output to validate
 * @returns Validation result with parsed data or error
 */
export function validateDiagnosisPromptOutputV1(
  output: unknown,
): { success: true; data: DiagnosisPromptOutputV1 } | { success: false; error: z.ZodError } {
  const result = DiagnosisPromptOutputV1Schema.safeParse(output)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error }
  }
}

/**
 * Check if output has the required disclaimer
 * 
 * @param output - The diagnosis output
 * @returns True if disclaimer is present and valid
 */
export function hasValidDisclaimer(output: DiagnosisPromptOutputV1): boolean {
  return (
    output.disclaimer.length >= 50 &&
    output.disclaimer.length <= 500 &&
    (output.disclaimer.toLowerCase().includes('not medical advice') ||
      output.disclaimer.toLowerCase().includes('clinician review') ||
      output.disclaimer.toLowerCase().includes('professional judgment'))
  )
}

/**
 * Check if output has any emergent red flags
 * 
 * @param output - The diagnosis output
 * @returns True if there are emergent red flags
 */
export function hasEmergentRedFlags(output: DiagnosisPromptOutputV1): boolean {
  return output.urgent_red_flags.some(
    (flag) => flag.urgency === URGENCY_LEVEL.EMERGENT,
  )
}

/**
 * Get highest priority recommendation
 * 
 * @param output - The diagnosis output
 * @returns The highest priority next step, or null if none
 */
export function getHighestPriorityRecommendation(
  output: DiagnosisPromptOutputV1,
): RecommendedNextStep | null {
  const priorityOrder = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }

  const sorted = [...output.recommended_next_steps].sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
  )

  return sorted[0] || null
}

/**
 * Get most confident differential diagnosis
 * 
 * @param output - The diagnosis output
 * @returns The most confident differential, or null if none
 */
export function getMostConfidentDifferential(
  output: DiagnosisPromptOutputV1,
): DifferentialDiagnosis | null {
  const confidenceOrder = {
    very_high: 5,
    high: 4,
    moderate: 3,
    low: 2,
    very_low: 1,
  }

  const sorted = [...output.differential_diagnoses].sort(
    (a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence],
  )

  return sorted[0] || null
}
