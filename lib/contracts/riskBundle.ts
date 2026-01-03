/**
 * Risk Bundle Contract - V05-I05.2
 * 
 * Versioned schema for deterministic risk calculation from assessment answers.
 * This bundle is PHI-free, reproducible, and strictly validated.
 * 
 * Key guarantees:
 * - Deterministic: same input → same output (no LLM, no randomness)
 * - Versioned: tracks bundle version + input versions (funnel, registry)
 * - Fail-closed: unknown operators/rules/types → error (no partial output)
 * - PHI-free: no raw text answers, only derived/redacted values
 * 
 * @module lib/contracts/riskBundle
 */

import { z } from 'zod'

// ============================================================
// Risk Level Enum
// ============================================================

/**
 * Valid risk levels
 * Based on stress/resilience assessment scoring
 */
export const RISK_LEVEL = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export type RiskLevel = typeof RISK_LEVEL[keyof typeof RISK_LEVEL]

// ============================================================
// Risk Factor Schema
// ============================================================

/**
 * Individual risk factor calculated from assessment
 * PHI-free: contains only derived scores, not raw answers
 */
export const RiskFactorSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number(),
  weight: z.number().min(0).max(1),
  riskLevel: z.enum([
    RISK_LEVEL.LOW,
    RISK_LEVEL.MODERATE,
    RISK_LEVEL.HIGH,
    RISK_LEVEL.CRITICAL,
  ] as [RiskLevel, ...RiskLevel[]]),
})

export type RiskFactor = z.infer<typeof RiskFactorSchema>

// ============================================================
// Risk Score Schema
// ============================================================

/**
 * Overall risk score with breakdown
 */
export const RiskScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  riskLevel: z.enum([
    RISK_LEVEL.LOW,
    RISK_LEVEL.MODERATE,
    RISK_LEVEL.HIGH,
    RISK_LEVEL.CRITICAL,
  ] as [RiskLevel, ...RiskLevel[]]),
  factors: z.array(RiskFactorSchema),
})

export type RiskScore = z.infer<typeof RiskScoreSchema>

// ============================================================
// Risk Bundle V1 Schema
// ============================================================

/**
 * Complete risk bundle output
 * This is the canonical risk calculation result
 */
export const RiskBundleV1Schema = z.object({
  // Version tracking
  riskBundleVersion: z.literal('v1').default('v1'),
  algorithmVersion: z.string(), // e.g., "v1.0.0" from funnel manifest
  funnelVersion: z.string().optional(), // funnel version identifier
  calculatedAt: z.string().datetime(),
  
  // Input references (for reproducibility)
  assessmentId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  
  // Risk calculation results
  riskScore: RiskScoreSchema,
  
  // Metadata (PHI-free)
  metadata: z.record(z.string(), z.any()).optional(),
})

export type RiskBundleV1 = z.infer<typeof RiskBundleV1Schema>

// ============================================================
// Risk Bundle Input Schema
// ============================================================

/**
 * Input for risk bundle calculation
 * Maps assessment answers to scorable values
 */
export const RiskBundleInputSchema = z.object({
  assessmentId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  
  // Answer values (PHI-free numeric scores)
  // Map of question_id -> answer_value
  answers: z.record(z.string(), z.number()),
  
  // Algorithm/funnel version references
  algorithmVersion: z.string(),
  funnelVersion: z.string().optional(),
})

export type RiskBundleInput = z.infer<typeof RiskBundleInputSchema>

// ============================================================
// Risk Bundle Error Schema
// ============================================================

/**
 * Error information for risk calculation failures
 */
export const RiskBundleErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
})

export type RiskBundleError = z.infer<typeof RiskBundleErrorSchema>

// ============================================================
// Risk Bundle Result Schema (for API responses)
// ============================================================

/**
 * Result wrapper for risk bundle calculation
 * Can be success or error (fail-closed)
 */
export const RiskBundleResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: RiskBundleV1Schema,
  }),
  z.object({
    success: z.literal(false),
    error: RiskBundleErrorSchema,
  }),
])

export type RiskBundleResult = z.infer<typeof RiskBundleResultSchema>

// ============================================================
// Type Guards
// ============================================================

/**
 * Type guard to check if a value is a valid risk level
 */
export function isValidRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === 'string' && Object.values(RISK_LEVEL).includes(value as RiskLevel)
}

/**
 * Type guard to check if a result is successful
 */
export function isSuccessfulResult(result: RiskBundleResult): result is { success: true; data: RiskBundleV1 } {
  return result.success === true
}

/**
 * Type guard to check if a result is an error
 */
export function isErrorResult(result: RiskBundleResult): result is { success: false; error: RiskBundleError } {
  return result.success === false
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Determine risk level from overall score
 * Uses threshold-based classification
 */
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return RISK_LEVEL.CRITICAL
  if (score >= 50) return RISK_LEVEL.HIGH
  if (score >= 25) return RISK_LEVEL.MODERATE
  return RISK_LEVEL.LOW
}

/**
 * Create a successful risk bundle result
 */
export function successResult(bundle: RiskBundleV1): RiskBundleResult {
  return {
    success: true,
    data: bundle,
  }
}

/**
 * Create an error risk bundle result
 */
export function errorResult(code: string, message: string, details?: Record<string, any>): RiskBundleResult {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  }
}
