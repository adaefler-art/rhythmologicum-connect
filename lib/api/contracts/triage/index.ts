/**
 * Triage API Contracts - E6.6.2
 *
 * Versioned schemas for AI assistant triage endpoints.
 * Stable, testable, governance-ready contracts with strict validation.
 *
 * @module lib/api/contracts/triage
 */

import { z } from 'zod'

// ============================================================
// Schema Version
// ============================================================

/**
 * Current schema version for triage contracts
 */
export const TRIAGE_SCHEMA_VERSION = 'v1' as const

// ============================================================
// Constants & Enums
// ============================================================

/**
 * Triage tier levels
 */
export const TRIAGE_TIER = {
  INFO: 'INFO',
  ASSESSMENT: 'ASSESSMENT',
  ESCALATE: 'ESCALATE',
} as const

export type TriageTier = typeof TRIAGE_TIER[keyof typeof TRIAGE_TIER]

/**
 * Next action after triage
 */
export const TRIAGE_NEXT_ACTION = {
  SHOW_CONTENT: 'SHOW_CONTENT',
  START_FUNNEL_A: 'START_FUNNEL_A',
  START_FUNNEL_B: 'START_FUNNEL_B',
  RESUME_FUNNEL: 'RESUME_FUNNEL',
  SHOW_ESCALATION: 'SHOW_ESCALATION',
} as const

export type TriageNextAction = typeof TRIAGE_NEXT_ACTION[keyof typeof TRIAGE_NEXT_ACTION]

/**
 * PAT-v2 UC1 safety routing paths
 *
 * Deterministic output for Ultra-Rapid Triage (Ebene 1)
 */
export const UC1_SAFETY_ROUTE = {
  NOTRUF: 'NOTRUF',
  NOTAUFNAHME: 'NOTAUFNAHME',
  DRINGENDER_TERMIN: 'DRINGENDER_TERMIN',
  STANDARD_INTAKE: 'STANDARD_INTAKE',
} as const

export type Uc1SafetyRoute = typeof UC1_SAFETY_ROUTE[keyof typeof UC1_SAFETY_ROUTE]

/**
 * Red flag allowlist - only these values are permitted
 * Based on existing escalation types in lib/types/escalation.ts
 */
export const RED_FLAG_ALLOWLIST = [
  'report_risk_level',
  'workup_check',
  'answer_pattern',
] as const satisfies readonly string[]

export type RedFlagType = typeof RED_FLAG_ALLOWLIST[number]

/**
 * Age range buckets for patient context (no PHI)
 */
export const AGE_RANGE_BUCKET = {
  UNDER_18: 'UNDER_18',
  AGE_18_30: 'AGE_18_30',
  AGE_31_50: 'AGE_31_50',
  AGE_51_65: 'AGE_51_65',
  OVER_65: 'OVER_65',
} as const

export type AgeRangeBucket = typeof AGE_RANGE_BUCKET[keyof typeof AGE_RANGE_BUCKET]

// ============================================================
// Input Validation Constants
// ============================================================

export const TRIAGE_INPUT_MIN_LENGTH = 10
export const TRIAGE_INPUT_MAX_LENGTH = 800
export const TRIAGE_INPUT_VERY_LARGE_THRESHOLD = TRIAGE_INPUT_MAX_LENGTH * 2 // 1600 chars
export const TRIAGE_RATIONALE_MAX_LENGTH = 280
export const TRIAGE_RATIONALE_MAX_BULLETS = 3

// ============================================================
// Request Schema - TriageRequestV1
// ============================================================

/**
 * Optional patient context (anonymized, no PHI)
 */
export const PatientContextLiteSchema = z.object({
  ageRange: z.enum([
    AGE_RANGE_BUCKET.UNDER_18,
    AGE_RANGE_BUCKET.AGE_18_30,
    AGE_RANGE_BUCKET.AGE_31_50,
    AGE_RANGE_BUCKET.AGE_51_65,
    AGE_RANGE_BUCKET.OVER_65,
  ]).optional(),
}).optional()

export type PatientContextLite = z.infer<typeof PatientContextLiteSchema>

/**
 * Triage Request V1 Schema
 *
 * AC2: Input is bounded and validated
 */
export const TriageRequestV1Schema = z.object({
  inputText: z.string()
    .min(TRIAGE_INPUT_MIN_LENGTH, `Input must be at least ${TRIAGE_INPUT_MIN_LENGTH} characters`)
    .max(TRIAGE_INPUT_MAX_LENGTH, `Input must not exceed ${TRIAGE_INPUT_MAX_LENGTH} characters`),
  locale: z.string().optional(),
  patientContext: PatientContextLiteSchema,
})

export type TriageRequestV1 = z.infer<typeof TriageRequestV1Schema>

// ============================================================
// Response Schema - TriageResultV1
// ============================================================

/**
 * Confidence band (optional, for future AI transparency)
 */
export const ConfidenceBandSchema = z.object({
  value: z.number().min(0).max(1),
  label: z.enum(['low', 'medium', 'high']).optional(),
}).optional()

export type ConfidenceBand = z.infer<typeof ConfidenceBandSchema>

/**
 * Custom validation for rationale:
 * - Must be ≤280 characters OR
 * - Must be bullet list with max 3 items
 */
function validateRationale(rationale: string): boolean {
  // Check if it's a bullet list first
  const bulletPattern = /^[\s]*[-*•]\s+/
  const lines = rationale.split('\n').filter(line => line.trim().length > 0)
  const bulletLines = lines.filter(line => bulletPattern.test(line))
  
  if (bulletLines.length > 0) {
    // It's a bullet list - check max 3 bullets
    if (bulletLines.length > TRIAGE_RATIONALE_MAX_BULLETS) {
      return false
    }
    // Bullet list with ≤3 items is always valid regardless of length
    return true
  }

  // Not a bullet list - check simple length bound
  return rationale.length <= TRIAGE_RATIONALE_MAX_LENGTH
}

/**
 * Triage Result V1 Schema
 *
 * AC1: Strict schema validation with Zod
 * AC3: rationale hard-bounded, redFlags from allowlist only
 */
export const TriageResultV1Schema = z.object({
  tier: z.enum([
    TRIAGE_TIER.INFO,
    TRIAGE_TIER.ASSESSMENT,
    TRIAGE_TIER.ESCALATE,
  ]),
  nextAction: z.enum([
    TRIAGE_NEXT_ACTION.SHOW_CONTENT,
    TRIAGE_NEXT_ACTION.START_FUNNEL_A,
    TRIAGE_NEXT_ACTION.START_FUNNEL_B,
    TRIAGE_NEXT_ACTION.RESUME_FUNNEL,
    TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
  ]),
  redFlags: z.array(z.string()).refine(
    (flags) => flags.every(flag => RED_FLAG_ALLOWLIST.includes(flag as RedFlagType)),
    { message: 'All red flags must be from the allowlist' }
  ).default([]),
  rationale: z.string()
    .refine(validateRationale, {
      message: `Rationale must be ≤${TRIAGE_RATIONALE_MAX_LENGTH} chars or bullet list with max ${TRIAGE_RATIONALE_MAX_BULLETS} items`,
    }),
  confidenceBand: ConfidenceBandSchema,
  safetyRoute: z
    .enum([
      UC1_SAFETY_ROUTE.NOTRUF,
      UC1_SAFETY_ROUTE.NOTAUFNAHME,
      UC1_SAFETY_ROUTE.DRINGENDER_TERMIN,
      UC1_SAFETY_ROUTE.STANDARD_INTAKE,
    ])
    .optional(),
  version: z.literal(TRIAGE_SCHEMA_VERSION),
  correlationId: z.string().optional(),
})

export type TriageResultV1 = z.infer<typeof TriageResultV1Schema>

// ============================================================
// API Response Schemas
// ============================================================

/**
 * Success response
 */
export const TriageSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: TriageResultV1Schema,
})

export type TriageSuccessResponse = z.infer<typeof TriageSuccessResponseSchema>

/**
 * Error response
 */
export const TriageErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
})

export type TriageErrorResponse = z.infer<typeof TriageErrorResponseSchema>

/**
 * Combined response type
 */
export const TriageResponseSchema = z.union([
  TriageSuccessResponseSchema,
  TriageErrorResponseSchema,
])

export type TriageResponse = z.infer<typeof TriageResponseSchema>

// ============================================================
// Helper Functions
// ============================================================

/**
 * Validate triage request (throws on error)
 */
export function validateTriageRequest(data: unknown): TriageRequestV1 {
  return TriageRequestV1Schema.parse(data)
}

/**
 * Safely validate triage request (returns null on error)
 */
export function safeValidateTriageRequest(data: unknown): TriageRequestV1 | null {
  const result = TriageRequestV1Schema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validate triage result (throws on error)
 */
export function validateTriageResult(data: unknown): TriageResultV1 {
  return TriageResultV1Schema.parse(data)
}

/**
 * Safely validate triage result (returns null on error)
 */
export function safeValidateTriageResult(data: unknown): TriageResultV1 | null {
  const result = TriageResultV1Schema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Sanitize red flags to only allowlist values
 * AC3: Unknown redFlags are filtered out
 */
export function sanitizeRedFlags(redFlags: string[]): RedFlagType[] {
  return redFlags.filter((flag): flag is RedFlagType =>
    RED_FLAG_ALLOWLIST.includes(flag as RedFlagType)
  )
}

/**
 * Check if input size would trigger 413 or 400
 * AC2: Oversize returns 413 or 400
 */
export function getOversizeErrorStatus(inputText: string): 400 | 413 | null {
  if (inputText.length > TRIAGE_INPUT_MAX_LENGTH) {
    // Very large inputs get 413 (Request Entity Too Large)
    // Moderately over limit gets 400 (Bad Request)
    return inputText.length > TRIAGE_INPUT_VERY_LARGE_THRESHOLD ? 413 : 400
  }
  return null
}

/**
 * Create a bounded rationale (truncate or limit bullets)
 */
export function boundRationale(rationale: string): string {
  // Check if it's already valid
  if (validateRationale(rationale)) {
    return rationale
  }

  // Check if it's a bullet list
  const bulletPattern = /^[\s]*[-*•]\s+/
  const lines = rationale.split('\n')
  const bulletLines = lines.filter(line => bulletPattern.test(line))

  if (bulletLines.length > TRIAGE_RATIONALE_MAX_BULLETS) {
    // Take first N bullets and reconstruct with original line breaks preserved
    let bulletCount = 0
    const boundedLines: string[] = []
    
    for (const line of lines) {
      if (bulletPattern.test(line)) {
        if (bulletCount >= TRIAGE_RATIONALE_MAX_BULLETS) {
          break
        }
        bulletCount++
      }
      boundedLines.push(line)
    }
    
    return boundedLines.join('\n').trim()
  }

  // Simple truncation to max length
  if (rationale.length > TRIAGE_RATIONALE_MAX_LENGTH) {
    return rationale.slice(0, TRIAGE_RATIONALE_MAX_LENGTH - 3) + '...'
  }

  return rationale
}
