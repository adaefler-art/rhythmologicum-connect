/**
 * Tests for Risk Bundle Contract (V05-I05.2)
 */

import {
  RISK_LEVEL,
  RiskBundleV1Schema,
  RiskBundleInputSchema,
  RiskBundleResultSchema,
  getRiskLevelFromScore,
  isValidRiskLevel,
  isSuccessfulResult,
  isErrorResult,
  successResult,
  errorResult,
} from '../riskBundle'

describe('Risk Bundle Contract', () => {
  describe('Risk Level Classification', () => {
    it('should classify scores correctly', () => {
      expect(getRiskLevelFromScore(0)).toBe(RISK_LEVEL.LOW)
      expect(getRiskLevelFromScore(24)).toBe(RISK_LEVEL.LOW)
      expect(getRiskLevelFromScore(25)).toBe(RISK_LEVEL.MODERATE)
      expect(getRiskLevelFromScore(49)).toBe(RISK_LEVEL.MODERATE)
      expect(getRiskLevelFromScore(50)).toBe(RISK_LEVEL.HIGH)
      expect(getRiskLevelFromScore(74)).toBe(RISK_LEVEL.HIGH)
      expect(getRiskLevelFromScore(75)).toBe(RISK_LEVEL.CRITICAL)
      expect(getRiskLevelFromScore(100)).toBe(RISK_LEVEL.CRITICAL)
    })

    it('should validate risk levels', () => {
      expect(isValidRiskLevel(RISK_LEVEL.LOW)).toBe(true)
      expect(isValidRiskLevel(RISK_LEVEL.CRITICAL)).toBe(true)
      expect(isValidRiskLevel('invalid')).toBe(false)
      expect(isValidRiskLevel(null)).toBe(false)
    })
  })

  describe('RiskBundleV1Schema', () => {
    it('should validate a complete risk bundle', () => {
      const validBundle = {
        riskBundleVersion: 'v1',
        algorithmVersion: 'v1.0.0',
        funnelVersion: 'stress-v1',
        calculatedAt: new Date().toISOString(),
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '223e4567-e89b-12d3-a456-426614174001',
        riskScore: {
          overall: 65,
          riskLevel: RISK_LEVEL.HIGH,
          factors: [
            {
              key: 'stress',
              label: 'Stress Level',
              score: 70,
              weight: 0.8,
              riskLevel: RISK_LEVEL.HIGH,
            },
          ],
        },
      }

      const result = RiskBundleV1Schema.safeParse(validBundle)
      expect(result.success).toBe(true)
    })

    it('should reject invalid version', () => {
      const invalidBundle = {
        riskBundleVersion: 'v2', // Invalid version
        algorithmVersion: 'v1.0.0',
        calculatedAt: new Date().toISOString(),
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        riskScore: {
          overall: 50,
          riskLevel: RISK_LEVEL.HIGH,
          factors: [],
        },
      }

      const result = RiskBundleV1Schema.safeParse(invalidBundle)
      expect(result.success).toBe(false)
    })

    it('should require assessmentId', () => {
      const invalidBundle = {
        riskBundleVersion: 'v1',
        algorithmVersion: 'v1.0.0',
        calculatedAt: new Date().toISOString(),
        // Missing assessmentId
        riskScore: {
          overall: 50,
          riskLevel: RISK_LEVEL.HIGH,
          factors: [],
        },
      }

      const result = RiskBundleV1Schema.safeParse(invalidBundle)
      expect(result.success).toBe(false)
    })
  })

  describe('RiskBundleInputSchema', () => {
    it('should validate valid input', () => {
      const validInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '223e4567-e89b-12d3-a456-426614174001',
        answers: {
          q1: 5,
          q2: 3,
          q3: 7,
        },
        algorithmVersion: 'v1.0.0',
        funnelVersion: 'stress-v1',
      }

      const result = RiskBundleInputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should allow missing jobId', () => {
      const validInput = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        answers: {},
        algorithmVersion: 'v1.0.0',
      }

      const result = RiskBundleInputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject invalid assessmentId', () => {
      const invalidInput = {
        assessmentId: 'not-a-uuid',
        answers: {},
        algorithmVersion: 'v1.0.0',
      }

      const result = RiskBundleInputSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('RiskBundleResultSchema', () => {
    it('should validate success result', () => {
      const bundle = {
        riskBundleVersion: 'v1',
        algorithmVersion: 'v1.0.0',
        calculatedAt: new Date().toISOString(),
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        riskScore: {
          overall: 50,
          riskLevel: RISK_LEVEL.HIGH,
          factors: [],
        },
      }

      const result = successResult(bundle as any)
      const validated = RiskBundleResultSchema.safeParse(result)
      expect(validated.success).toBe(true)
      expect(isSuccessfulResult(result)).toBe(true)
      expect(isErrorResult(result)).toBe(false)
    })

    it('should validate error result', () => {
      const result = errorResult('TEST_ERROR', 'Test error message', { detail: 'test' })
      const validated = RiskBundleResultSchema.safeParse(result)
      expect(validated.success).toBe(true)
      expect(isSuccessfulResult(result)).toBe(false)
      expect(isErrorResult(result)).toBe(true)
    })

    it('should require discriminated union', () => {
      const invalidResult = {
        success: 'maybe', // Not a boolean
        data: {},
      }

      const result = RiskBundleResultSchema.safeParse(invalidResult)
      expect(result.success).toBe(false)
    })
  })

  describe('Helper Functions', () => {
    it('should create success result', () => {
      const bundle = {
        riskBundleVersion: 'v1' as const,
        algorithmVersion: 'v1.0.0',
        calculatedAt: new Date().toISOString(),
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        riskScore: {
          overall: 30,
          riskLevel: RISK_LEVEL.MODERATE,
          factors: [],
        },
      }

      const result = successResult(bundle)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(bundle)
    })

    it('should create error result', () => {
      const result = errorResult('ERR_001', 'Something went wrong', { foo: 'bar' })
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('ERR_001')
      expect(result.error.message).toBe('Something went wrong')
      expect(result.error.details).toEqual({ foo: 'bar' })
    })
  })
})
