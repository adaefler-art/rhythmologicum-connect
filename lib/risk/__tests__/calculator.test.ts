/**
 * Tests for Risk Calculator (V05-I05.2)
 * 
 * Includes:
 * - Golden fixtures for determinism
 * - Fail-closed tests for unknown rules
 * - Boundary condition tests
 */

import { computeRiskBundle } from '../calculator'
import { SCORING_OPERATOR, type RiskCalculationConfig } from '../scoringRules'
import { RISK_LEVEL, type RiskBundleInput } from '@/lib/contracts/riskBundle'

describe('Risk Calculator', () => {
  // ============================================================
  // Golden Fixtures - Determinism Tests
  // ============================================================

  describe('Determinism - Golden Fixtures', () => {
    it('should produce identical output for identical input (SUM)', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'stress',
            label: 'Stress',
            operator: SCORING_OPERATOR.SUM,
            questionIds: ['q1', 'q2'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['stress'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 3, q2: 4 },
        algorithmVersion: 'v1.0.0',
      }

      // Calculate multiple times
      const result1 = computeRiskBundle(input, config)
      const result2 = computeRiskBundle(input, config)
      const result3 = computeRiskBundle(input, config)

      // All should succeed
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)

      // All should produce identical scores
      if (result1.success && result2.success && result3.success) {
        expect(result1.data.riskScore.overall).toBe(7)
        expect(result2.data.riskScore.overall).toBe(7)
        expect(result3.data.riskScore.overall).toBe(7)

        // Factors should match
        expect(result1.data.riskScore.factors[0].score).toBe(7)
        expect(result2.data.riskScore.factors[0].score).toBe(7)
        expect(result3.data.riskScore.factors[0].score).toBe(7)
      }
    })

    it('should produce identical output for weighted sum', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'factor1',
            label: 'Factor 1',
            operator: SCORING_OPERATOR.WEIGHTED_SUM,
            questionIds: ['q1', 'q2'],
            weights: [
              { questionId: 'q1', weight: 0.7 },
              { questionId: 'q2', weight: 0.3 },
            ],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['factor1'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 10, q2: 5 },
        algorithmVersion: 'v1.0.0',
      }

      const result1 = computeRiskBundle(input, config)
      const result2 = computeRiskBundle(input, config)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      if (result1.success && result2.success) {
        // 10 * 0.7 + 5 * 0.3 = 7 + 1.5 = 8.5
        expect(result1.data.riskScore.overall).toBe(8.5)
        expect(result2.data.riskScore.overall).toBe(8.5)
      }
    })

    it('should produce identical output for normalization', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'normalized',
            label: 'Normalized',
            operator: SCORING_OPERATOR.NORMALIZE,
            questionIds: ['q1'],
            minValue: 0,
            maxValue: 10,
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['normalized'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 5 },
        algorithmVersion: 'v1.0.0',
      }

      const result1 = computeRiskBundle(input, config)
      const result2 = computeRiskBundle(input, config)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      if (result1.success && result2.success) {
        // 5 normalized from 0-10 to 0-100 = 50
        expect(result1.data.riskScore.overall).toBe(50)
        expect(result2.data.riskScore.overall).toBe(50)
      }
    })
  })

  // ============================================================
  // Operator Tests
  // ============================================================

  describe('Scoring Operators', () => {
    it('should calculate SUM correctly', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'sum',
            label: 'Sum',
            operator: SCORING_OPERATOR.SUM,
            questionIds: ['q1', 'q2', 'q3'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['sum'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 10, q2: 20, q3: 15 },
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.riskScore.overall).toBe(45)
      }
    })

    it('should calculate AVERAGE correctly', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'avg',
            label: 'Average',
            operator: SCORING_OPERATOR.AVERAGE,
            questionIds: ['q1', 'q2', 'q3'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['avg'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 10, q2: 20, q3: 15 },
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.riskScore.overall).toBe(15) // (10+20+15)/3 = 15
      }
    })

    it('should calculate MAX correctly', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'max',
            label: 'Max',
            operator: SCORING_OPERATOR.MAX,
            questionIds: ['q1', 'q2', 'q3'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['max'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 10, q2: 30, q3: 15 },
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.riskScore.overall).toBe(30)
      }
    })

    it('should calculate MIN correctly', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'min',
            label: 'Min',
            operator: SCORING_OPERATOR.MIN,
            questionIds: ['q1', 'q2', 'q3'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['min'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 10, q2: 5, q3: 15 },
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.riskScore.overall).toBe(5)
      }
    })

    it('should calculate THRESHOLD correctly', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'threshold',
            label: 'Threshold',
            operator: SCORING_OPERATOR.THRESHOLD,
            questionIds: ['q1'],
            thresholds: [
              { value: 0, score: 0, riskLevel: 'low' },
              { value: 25, score: 25, riskLevel: 'moderate' },
              { value: 50, score: 50, riskLevel: 'high' },
              { value: 75, score: 75, riskLevel: 'critical' },
            ],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['threshold'],
        },
      }

      const input1: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 60 },
        algorithmVersion: 'v1.0.0',
      }

      const result1 = computeRiskBundle(input1, config)
      expect(result1.success).toBe(true)
      if (result1.success) {
        expect(result1.data.riskScore.overall).toBe(50) // Crosses 50 threshold
      }

      const input2: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 80 },
        algorithmVersion: 'v1.0.0',
      }

      const result2 = computeRiskBundle(input2, config)
      expect(result2.success).toBe(true)
      if (result2.success) {
        expect(result2.data.riskScore.overall).toBe(75) // Crosses 75 threshold
      }
    })
  })

  // ============================================================
  // Fail-Closed Tests
  // ============================================================

  describe('Fail-Closed Behavior', () => {
    it('should fail for missing answers', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'test',
            label: 'Test',
            operator: SCORING_OPERATOR.SUM,
            questionIds: ['q1', 'q2'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['test'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 5 }, // Missing q2
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Missing answer')
        expect(result.error.message).toContain('q2')
      }
    })

    it('should fail for weighted sum without weights', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'test',
            label: 'Test',
            operator: SCORING_OPERATOR.WEIGHTED_SUM,
            questionIds: ['q1'],
            // Missing weights
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['test'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 5 },
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('requires weights')
      }
    })

    it('should fail for threshold without thresholds', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'test',
            label: 'Test',
            operator: SCORING_OPERATOR.THRESHOLD,
            questionIds: ['q1'],
            // Missing thresholds
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['test'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 5 },
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('requires thresholds')
      }
    })

    it('should fail for normalize without bounds', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'test',
            label: 'Test',
            operator: SCORING_OPERATOR.NORMALIZE,
            questionIds: ['q1'],
            // Missing minValue/maxValue
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['test'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 5 },
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('requires minValue and maxValue')
      }
    })
  })

  // ============================================================
  // Boundary Conditions
  // ============================================================

  describe('Boundary Conditions', () => {
    it('should handle zero values', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'zeros',
            label: 'Zeros',
            operator: SCORING_OPERATOR.SUM,
            questionIds: ['q1', 'q2'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['zeros'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 0, q2: 0 },
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.riskScore.overall).toBe(0)
        expect(result.data.riskScore.riskLevel).toBe(RISK_LEVEL.LOW)
      }
    })

    it('should handle maximum values', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'max',
            label: 'Max',
            operator: SCORING_OPERATOR.SUM,
            questionIds: ['q1'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['max'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 100 },
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.riskScore.overall).toBe(100)
        expect(result.data.riskScore.riskLevel).toBe(RISK_LEVEL.CRITICAL)
      }
    })

    it('should clamp normalized values to 0-100', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'normalized',
            label: 'Normalized',
            operator: SCORING_OPERATOR.NORMALIZE,
            questionIds: ['q1'],
            minValue: 0,
            maxValue: 10,
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['normalized'],
        },
      }

      // Test over-max
      const input1: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: 20 }, // Over max of 10
        algorithmVersion: 'v1.0.0',
      }

      const result1 = computeRiskBundle(input1, config)
      expect(result1.success).toBe(true)
      if (result1.success) {
        expect(result1.data.riskScore.overall).toBe(100) // Clamped to 100
      }

      // Test under-min
      const input2: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: { q1: -5 }, // Under min of 0
        algorithmVersion: 'v1.0.0',
      }

      const result2 = computeRiskBundle(input2, config)
      expect(result2.success).toBe(true)
      if (result2.success) {
        expect(result2.data.riskScore.overall).toBe(0) // Clamped to 0
      }
    })

    it('should handle empty question arrays gracefully', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'empty',
            label: 'Empty',
            operator: SCORING_OPERATOR.AVERAGE,
            questionIds: [],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['empty'],
        },
      }

      const input: RiskBundleInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: {},
        algorithmVersion: 'v1.0.0',
      }

      const result = computeRiskBundle(input, config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.riskScore.overall).toBe(0)
      }
    })
  })

  // ============================================================
  // Risk Level Assignment
  // ============================================================

  describe('Risk Level Assignment', () => {
    it('should assign correct risk levels', () => {
      const config: RiskCalculationConfig = {
        version: 'v1.0.0',
        factorRules: [
          {
            key: 'test',
            label: 'Test',
            operator: SCORING_OPERATOR.SUM,
            questionIds: ['q1'],
          },
        ],
        overallRule: {
          key: 'overall',
          label: 'Overall',
          operator: SCORING_OPERATOR.SUM,
          questionIds: ['test'],
        },
      }

      // LOW
      const low = computeRiskBundle(
        {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          answers: { q1: 20 },
          algorithmVersion: 'v1.0.0',
        },
        config,
      )
      expect(low.success && low.data.riskScore.riskLevel).toBe(RISK_LEVEL.LOW)

      // MODERATE
      const moderate = computeRiskBundle(
        {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          answers: { q1: 40 },
          algorithmVersion: 'v1.0.0',
        },
        config,
      )
      expect(moderate.success && moderate.data.riskScore.riskLevel).toBe(RISK_LEVEL.MODERATE)

      // HIGH
      const high = computeRiskBundle(
        {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          answers: { q1: 60 },
          algorithmVersion: 'v1.0.0',
        },
        config,
      )
      expect(high.success && high.data.riskScore.riskLevel).toBe(RISK_LEVEL.HIGH)

      // CRITICAL
      const critical = computeRiskBundle(
        {
          assessmentId: '123e4567-e89b-12d3-a456-426614174000',
          answers: { q1: 80 },
          algorithmVersion: 'v1.0.0',
        },
        config,
      )
      expect(critical.success && critical.data.riskScore.riskLevel).toBe(RISK_LEVEL.CRITICAL)
    })
  })
})
