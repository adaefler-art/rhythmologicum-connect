/**
 * Risk Bundle Calculator - V05-I05.2
 * 
 * Pure, deterministic risk calculation engine.
 * Computes risk bundles from assessment answers + scoring rules.
 * 
 * Key guarantees:
 * - Deterministic: same input → same output (no randomness)
 * - Fail-closed: unknown operators/rules → error (no partial output)
 * - PHI-free: operates only on numeric scores, no text
 * 
 * @module lib/risk/calculator
 */

import {
  type RiskBundleV1,
  type RiskBundleInput,
  type RiskBundleResult,
  type RiskFactor,
  type RiskScore,
  getRiskLevelFromScore,
  successResult,
  errorResult,
  RISK_LEVEL,
} from '@/lib/contracts/riskBundle'
import {
  type ScoringRule,
  type RiskCalculationConfig,
  SCORING_OPERATOR,
  validateScoringRule,
  SCORING_ERROR_CODE,
} from './scoringRules'

// ============================================================
// Core Calculator Function
// ============================================================

/**
 * Compute risk bundle from assessment answers
 * Pure function - no side effects, no I/O
 * 
 * @param input - Assessment answers and metadata
 * @param config - Scoring rules configuration
 * @returns RiskBundleResult (success or fail-closed error)
 */
export function computeRiskBundle(
  input: RiskBundleInput,
  config: RiskCalculationConfig,
): RiskBundleResult {
  try {
    // Validate input
    const inputValidation = validateInput(input, config)
    if (!inputValidation.valid) {
      return errorResult(
        SCORING_ERROR_CODE.VALIDATION_FAILED,
        inputValidation.error || 'Input validation failed',
        { details: inputValidation.details },
      )
    }

    // Calculate individual risk factors
    const factors: RiskFactor[] = []
    for (const rule of config.factorRules) {
      const factorResult = calculateFactor(input.answers, rule)
      if (!factorResult.valid) {
        // Fail-closed: any factor calculation error fails the whole bundle
        return errorResult(
          factorResult.errorCode || SCORING_ERROR_CODE.VALIDATION_FAILED,
          factorResult.error || 'Factor calculation failed',
          { factorKey: rule.key, details: factorResult.details },
        )
      }
      factors.push(factorResult.factor!)
    }

    // Calculate overall risk score
    const overallResult = calculateOverallScore(factors, config.overallRule)
    if (!overallResult.valid) {
      return errorResult(
        overallResult.errorCode || SCORING_ERROR_CODE.VALIDATION_FAILED,
        overallResult.error || 'Overall score calculation failed',
        { details: overallResult.details },
      )
    }

    // Build risk score
    const riskScore: RiskScore = {
      overall: overallResult.score!,
      riskLevel: getRiskLevelFromScore(overallResult.score!),
      factors,
    }

    // Build risk bundle
    const bundle: RiskBundleV1 = {
      riskBundleVersion: 'v1',
      algorithmVersion: input.algorithmVersion,
      funnelVersion: input.funnelVersion,
      calculatedAt: new Date().toISOString(),
      assessmentId: input.assessmentId,
      jobId: input.jobId,
      riskScore,
    }

    return successResult(bundle)
  } catch (error) {
    // Unexpected errors also fail-closed
    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResult('UNEXPECTED_ERROR', `Unexpected error during calculation: ${message}`)
  }
}

// ============================================================
// Input Validation
// ============================================================

interface ValidationResult {
  valid: boolean
  error?: string
  details?: Record<string, any>
}

/**
 * Validate input before calculation
 */
function validateInput(input: RiskBundleInput, config: RiskCalculationConfig): ValidationResult {
  // Check all factor rules have valid structure
  for (const rule of config.factorRules) {
    const ruleValidation = validateScoringRule(rule)
    if (!ruleValidation.valid) {
      return {
        valid: false,
        error: `Invalid factor rule '${rule.key}': ${ruleValidation.error}`,
        details: { ruleKey: rule.key },
      }
    }

    // Check all required question IDs have answers
    for (const questionId of rule.questionIds) {
      if (!(questionId in input.answers)) {
        return {
          valid: false,
          error: `Missing answer for question '${questionId}' in rule '${rule.key}'`,
          details: { questionId, ruleKey: rule.key },
        }
      }
    }
  }

  // Validate overall rule
  const overallValidation = validateScoringRule(config.overallRule)
  if (!overallValidation.valid) {
    return {
      valid: false,
      error: `Invalid overall rule: ${overallValidation.error}`,
    }
  }

  return { valid: true }
}

// ============================================================
// Factor Calculation
// ============================================================

interface FactorResult {
  valid: boolean
  factor?: RiskFactor
  error?: string
  errorCode?: string
  details?: Record<string, any>
}

/**
 * Calculate a single risk factor from answers using a scoring rule
 */
function calculateFactor(
  answers: Record<string, number>,
  rule: ScoringRule,
): FactorResult {
  try {
    // Apply scoring operator
    const scoreResult = applyOperator(answers, rule)
    if (!scoreResult.valid) {
      return {
        valid: false,
        error: scoreResult.error,
        errorCode: scoreResult.errorCode,
        details: scoreResult.details,
      }
    }

    const score = scoreResult.score!

    // Determine risk level for this factor
    const riskLevel = getRiskLevelFromScore(score)

    // Default weight of 1.0 if not specified
    const weight = 1.0

    const factor: RiskFactor = {
      key: rule.key,
      label: rule.label,
      score,
      weight,
      riskLevel,
    }

    return { valid: true, factor }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      error: `Error calculating factor '${rule.key}': ${message}`,
      errorCode: 'CALCULATION_ERROR',
    }
  }
}

// ============================================================
// Overall Score Calculation
// ============================================================

interface ScoreResult {
  valid: boolean
  score?: number
  error?: string
  errorCode?: string
  details?: Record<string, any>
}

/**
 * Calculate overall score from factors
 */
function calculateOverallScore(
  factors: RiskFactor[],
  rule: ScoringRule,
): ScoreResult {
  try {
    // Convert factors to answer map for operator application
    const factorScores: Record<string, number> = {}
    for (const factor of factors) {
      factorScores[factor.key] = factor.score
    }

    return applyOperator(factorScores, rule)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      error: `Error calculating overall score: ${message}`,
      errorCode: 'CALCULATION_ERROR',
    }
  }
}

// ============================================================
// Operator Application (Deterministic)
// ============================================================

/**
 * Apply scoring operator to values
 * Fail-closed: unknown operator → error
 */
function applyOperator(
  values: Record<string, number>,
  rule: ScoringRule,
): ScoreResult {
  const questionValues = rule.questionIds.map((id) => values[id])

  switch (rule.operator) {
    case SCORING_OPERATOR.SUM:
      return { valid: true, score: sum(questionValues) }

    case SCORING_OPERATOR.WEIGHTED_SUM:
      if (!rule.weights) {
        return {
          valid: false,
          error: 'WEIGHTED_SUM requires weights',
          errorCode: SCORING_ERROR_CODE.MISSING_WEIGHTS,
        }
      }
      return { valid: true, score: weightedSum(values, rule.weights) }

    case SCORING_OPERATOR.AVERAGE:
      return { valid: true, score: average(questionValues) }

    case SCORING_OPERATOR.MAX:
      return { valid: true, score: max(questionValues) }

    case SCORING_OPERATOR.MIN:
      return { valid: true, score: min(questionValues) }

    case SCORING_OPERATOR.THRESHOLD:
      if (!rule.thresholds) {
        return {
          valid: false,
          error: 'THRESHOLD requires thresholds',
          errorCode: SCORING_ERROR_CODE.MISSING_THRESHOLDS,
        }
      }
      return { valid: true, score: threshold(sum(questionValues), rule.thresholds) }

    case SCORING_OPERATOR.NORMALIZE:
      if (rule.minValue === undefined || rule.maxValue === undefined) {
        return {
          valid: false,
          error: 'NORMALIZE requires minValue and maxValue',
          errorCode: SCORING_ERROR_CODE.MISSING_NORMALIZATION_BOUNDS,
        }
      }
      return {
        valid: true,
        score: normalize(sum(questionValues), rule.minValue, rule.maxValue),
      }

    default:
      // Fail-closed: unknown operator
      return {
        valid: false,
        error: `Unknown operator: ${rule.operator}`,
        errorCode: SCORING_ERROR_CODE.UNKNOWN_OPERATOR,
        details: { operator: rule.operator },
      }
  }
}

// ============================================================
// Mathematical Operations (Pure, Deterministic)
// ============================================================

function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0)
}

function weightedSum(
  values: Record<string, number>,
  weights: Array<{ questionId: string; weight: number }>,
): number {
  return weights.reduce((acc, w) => {
    const value = values[w.questionId] || 0
    return acc + value * w.weight
  }, 0)
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return sum(values) / values.length
}

function max(values: number[]): number {
  if (values.length === 0) return 0
  return Math.max(...values)
}

function min(values: number[]): number {
  if (values.length === 0) return 0
  return Math.min(...values)
}

function threshold(
  value: number,
  thresholds: Array<{ value: number; score: number; riskLevel: string }>,
): number {
  // Sort thresholds by value ascending
  const sorted = [...thresholds].sort((a, b) => a.value - b.value)

  // Find the highest threshold that value exceeds
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (value >= sorted[i].value) {
      return sorted[i].score
    }
  }

  // Below all thresholds
  return sorted[0]?.score || 0
}

function normalize(value: number, minValue: number, maxValue: number): number {
  if (maxValue === minValue) return 0
  const normalized = ((value - minValue) / (maxValue - minValue)) * 100
  // Clamp to 0-100
  return Math.max(0, Math.min(100, normalized))
}
