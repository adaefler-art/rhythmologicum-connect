/**
 * Scoring Rules Schema - V05-I05.2
 * 
 * Defines the schema for deterministic scoring rules used in risk calculation.
 * All rules are validated strictly - unknown operators/types cause fail-closed errors.
 * 
 * @module lib/risk/scoringRules
 */

import { z } from 'zod'

// ============================================================
// Scoring Operators
// ============================================================

/**
 * Valid scoring operators
 * These define how question answers are combined into scores
 */
export const SCORING_OPERATOR = {
  SUM: 'sum',                     // Sum of all answer values
  WEIGHTED_SUM: 'weighted_sum',   // Sum with weights per question
  AVERAGE: 'average',             // Mean of answer values
  MAX: 'max',                     // Maximum answer value
  MIN: 'min',                     // Minimum answer value
  THRESHOLD: 'threshold',         // Score based on threshold crossings
  NORMALIZE: 'normalize',         // Normalize to 0-100 scale
} as const

export type ScoringOperator = typeof SCORING_OPERATOR[keyof typeof SCORING_OPERATOR]

// ============================================================
// Scoring Rule Schema
// ============================================================

/**
 * Weight assignment for weighted operations
 */
export const QuestionWeightSchema = z.object({
  questionId: z.string(),
  weight: z.number().min(0).max(1),
})

export type QuestionWeight = z.infer<typeof QuestionWeightSchema>

/**
 * Threshold definition for threshold-based scoring
 */
export const ThresholdSchema = z.object({
  value: z.number(),
  score: z.number(),
  riskLevel: z.enum(['low', 'moderate', 'high', 'critical']),
})

export type Threshold = z.infer<typeof ThresholdSchema>

/**
 * Base scoring rule
 * Defines how to calculate a score from a set of questions
 */
export const ScoringRuleSchema = z.object({
  key: z.string(),
  label: z.string(),
  operator: z.enum([
    SCORING_OPERATOR.SUM,
    SCORING_OPERATOR.WEIGHTED_SUM,
    SCORING_OPERATOR.AVERAGE,
    SCORING_OPERATOR.MAX,
    SCORING_OPERATOR.MIN,
    SCORING_OPERATOR.THRESHOLD,
    SCORING_OPERATOR.NORMALIZE,
  ] as [ScoringOperator, ...ScoringOperator[]]),
  
  // Question IDs to include in calculation
  questionIds: z.array(z.string()),
  
  // Optional weights (required for WEIGHTED_SUM)
  weights: z.array(QuestionWeightSchema).optional(),
  
  // Optional thresholds (required for THRESHOLD)
  thresholds: z.array(ThresholdSchema).optional(),
  
  // Optional min/max for normalization
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
})

export type ScoringRule = z.infer<typeof ScoringRuleSchema>

// ============================================================
// Risk Calculation Config Schema
// ============================================================

/**
 * Complete risk calculation configuration
 * Defines all scoring rules and how to combine them into overall risk
 */
export const RiskCalculationConfigSchema = z.object({
  version: z.string(), // e.g., "v1.0.0"
  
  // Individual factor rules
  factorRules: z.array(ScoringRuleSchema),
  
  // Overall risk combination rule
  overallRule: ScoringRuleSchema,
  
  // Metadata
  metadata: z.record(z.string(), z.any()).optional(),
})

export type RiskCalculationConfig = z.infer<typeof RiskCalculationConfigSchema>

// ============================================================
// Type Guards
// ============================================================

/**
 * Type guard to check if a value is a valid scoring operator
 */
export function isValidScoringOperator(value: unknown): value is ScoringOperator {
  return typeof value === 'string' && Object.values(SCORING_OPERATOR).includes(value as ScoringOperator)
}

/**
 * Validate scoring rule has required fields for operator
 */
export function validateScoringRule(rule: ScoringRule): { valid: boolean; error?: string } {
  // Check operator-specific requirements
  switch (rule.operator) {
    case SCORING_OPERATOR.WEIGHTED_SUM:
      if (!rule.weights || rule.weights.length === 0) {
        return { valid: false, error: `WEIGHTED_SUM operator requires weights` }
      }
      // Verify all questionIds have weights
      const weightQuestionIds = new Set(rule.weights.map((w) => w.questionId))
      const missingWeights = rule.questionIds.filter((id) => !weightQuestionIds.has(id))
      if (missingWeights.length > 0) {
        return {
          valid: false,
          error: `Missing weights for questions: ${missingWeights.join(', ')}`,
        }
      }
      break

    case SCORING_OPERATOR.THRESHOLD:
      if (!rule.thresholds || rule.thresholds.length === 0) {
        return { valid: false, error: `THRESHOLD operator requires thresholds` }
      }
      break

    case SCORING_OPERATOR.NORMALIZE:
      if (rule.minValue === undefined || rule.maxValue === undefined) {
        return { valid: false, error: `NORMALIZE operator requires minValue and maxValue` }
      }
      if (rule.minValue >= rule.maxValue) {
        return { valid: false, error: `minValue must be less than maxValue` }
      }
      break

    default:
      // Other operators have no special requirements
      break
  }

  return { valid: true }
}

/**
 * Validate complete risk calculation config
 */
export function validateRiskCalculationConfig(
  config: RiskCalculationConfig,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate all factor rules
  for (const rule of config.factorRules) {
    const result = validateScoringRule(rule)
    if (!result.valid && result.error) {
      errors.push(`Factor rule '${rule.key}': ${result.error}`)
    }
  }

  // Validate overall rule
  const overallResult = validateScoringRule(config.overallRule)
  if (!overallResult.valid && overallResult.error) {
    errors.push(`Overall rule: ${overallResult.error}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================
// Error Codes
// ============================================================

/**
 * Error codes for scoring rule validation
 */
export const SCORING_ERROR_CODE = {
  UNKNOWN_OPERATOR: 'UNKNOWN_OPERATOR',
  MISSING_WEIGHTS: 'MISSING_WEIGHTS',
  MISSING_THRESHOLDS: 'MISSING_THRESHOLDS',
  MISSING_NORMALIZATION_BOUNDS: 'MISSING_NORMALIZATION_BOUNDS',
  INVALID_QUESTION_ID: 'INVALID_QUESTION_ID',
  MISSING_ANSWER: 'MISSING_ANSWER',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
} as const

export type ScoringErrorCode = typeof SCORING_ERROR_CODE[keyof typeof SCORING_ERROR_CODE]
