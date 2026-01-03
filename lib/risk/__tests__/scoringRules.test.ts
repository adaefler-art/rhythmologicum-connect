/**
 * Tests for Scoring Rules (V05-I05.2)
 */

import {
  SCORING_OPERATOR,
  ScoringRuleSchema,
  validateScoringRule,
  validateRiskCalculationConfig,
  isValidScoringOperator,
  SCORING_ERROR_CODE,
} from '../scoringRules'

describe('Scoring Rules', () => {
  describe('Operator Validation', () => {
    it('should validate scoring operators', () => {
      expect(isValidScoringOperator(SCORING_OPERATOR.SUM)).toBe(true)
      expect(isValidScoringOperator(SCORING_OPERATOR.WEIGHTED_SUM)).toBe(true)
      expect(isValidScoringOperator('invalid')).toBe(false)
      expect(isValidScoringOperator(null)).toBe(false)
    })
  })

  describe('ScoringRuleSchema', () => {
    it('should validate basic rule', () => {
      const rule = {
        key: 'test',
        label: 'Test Rule',
        operator: SCORING_OPERATOR.SUM,
        questionIds: ['q1', 'q2'],
      }

      const result = ScoringRuleSchema.safeParse(rule)
      expect(result.success).toBe(true)
    })

    it('should validate weighted rule', () => {
      const rule = {
        key: 'weighted',
        label: 'Weighted Rule',
        operator: SCORING_OPERATOR.WEIGHTED_SUM,
        questionIds: ['q1', 'q2'],
        weights: [
          { questionId: 'q1', weight: 0.6 },
          { questionId: 'q2', weight: 0.4 },
        ],
      }

      const result = ScoringRuleSchema.safeParse(rule)
      expect(result.success).toBe(true)
    })

    it('should reject unknown operator', () => {
      const rule = {
        key: 'test',
        label: 'Test',
        operator: 'unknown_operator',
        questionIds: ['q1'],
      }

      const result = ScoringRuleSchema.safeParse(rule)
      expect(result.success).toBe(false)
    })
  })

  describe('validateScoringRule', () => {
    it('should pass for SUM operator', () => {
      const rule = {
        key: 'sum',
        label: 'Sum',
        operator: SCORING_OPERATOR.SUM,
        questionIds: ['q1', 'q2'],
      }

      const result = validateScoringRule(rule)
      expect(result.valid).toBe(true)
    })

    it('should fail for WEIGHTED_SUM without weights', () => {
      const rule = {
        key: 'weighted',
        label: 'Weighted',
        operator: SCORING_OPERATOR.WEIGHTED_SUM,
        questionIds: ['q1', 'q2'],
      }

      const result = validateScoringRule(rule)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('requires weights')
    })

    it('should fail for WEIGHTED_SUM with missing weights', () => {
      const rule = {
        key: 'weighted',
        label: 'Weighted',
        operator: SCORING_OPERATOR.WEIGHTED_SUM,
        questionIds: ['q1', 'q2', 'q3'],
        weights: [
          { questionId: 'q1', weight: 0.5 },
          { questionId: 'q2', weight: 0.5 },
          // Missing q3
        ],
      }

      const result = validateScoringRule(rule)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Missing weights')
      expect(result.error).toContain('q3')
    })

    it('should fail for THRESHOLD without thresholds', () => {
      const rule = {
        key: 'threshold',
        label: 'Threshold',
        operator: SCORING_OPERATOR.THRESHOLD,
        questionIds: ['q1'],
      }

      const result = validateScoringRule(rule)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('requires thresholds')
    })

    it('should fail for NORMALIZE without bounds', () => {
      const rule = {
        key: 'normalize',
        label: 'Normalize',
        operator: SCORING_OPERATOR.NORMALIZE,
        questionIds: ['q1'],
      }

      const result = validateScoringRule(rule)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('requires minValue and maxValue')
    })

    it('should fail for NORMALIZE with invalid bounds', () => {
      const rule = {
        key: 'normalize',
        label: 'Normalize',
        operator: SCORING_OPERATOR.NORMALIZE,
        questionIds: ['q1'],
        minValue: 10,
        maxValue: 5, // Invalid: max < min
      }

      const result = validateScoringRule(rule)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('minValue must be less than maxValue')
    })
  })

  describe('validateRiskCalculationConfig', () => {
    it('should validate complete config', () => {
      const config = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'factor1',
            label: 'Factor 1',
            operator: SCORING_OPERATOR.SUM,
            questionIds: ['q1', 'q2'],
          },
          {
            key: 'factor2',
            label: 'Factor 2',
            operator: SCORING_OPERATOR.AVERAGE,
            questionIds: ['q3', 'q4'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.WEIGHTED_SUM,
          questionIds: ['factor1', 'factor2'],
          weights: [
            { questionId: 'factor1', weight: 0.7 },
            { questionId: 'factor2', weight: 0.3 },
          ],
        },
      }

      const result = validateRiskCalculationConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should collect multiple errors', () => {
      const config = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'bad1',
            label: 'Bad 1',
            operator: SCORING_OPERATOR.WEIGHTED_SUM,
            questionIds: ['q1'],
            // Missing weights
          },
          {
            key: 'bad2',
            label: 'Bad 2',
            operator: SCORING_OPERATOR.THRESHOLD,
            questionIds: ['q2'],
            // Missing thresholds
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.NORMALIZE,
          questionIds: ['factor1'],
          // Missing minValue/maxValue
        },
      }

      const result = validateRiskCalculationConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(3)
      expect(result.errors[0]).toContain('bad1')
      expect(result.errors[1]).toContain('bad2')
      expect(result.errors[2]).toContain('Overall rule')
    })
  })
})
