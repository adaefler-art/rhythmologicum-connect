/**
 * Tests for Priority Ranking Contract (V05-I05.3)
 * 
 * Security hardening tests for:
 * - No free-text reasoning allowed
 * - Strict schema validation
 * - Bounded metadata
 */

import {
  SIGNAL_CODE,
  PriorityRankingV1Schema,
  PriorityRankingInputSchema,
  PriorityRankingResultSchema,
  StructuredSignalSchema,
  ImpactScoreSchema,
  FeasibilityScoreSchema,
  calculatePriorityScore,
  isValidSignalCode,
  isSuccessfulResult,
  isErrorResult,
  successResult,
  errorResult,
  PRIORITY_RANKING_SCHEMA_VERSION,
  PRIORITY_RANKER_VERSION,
} from '../priorityRanking'
import { PROGRAM_TIER } from '../registry'
import { PILLAR_KEY } from '../registry'

describe('Priority Ranking Contract', () => {
  describe('StructuredSignal Schema (No Free Text)', () => {
    it('should accept valid structured signal with code only', () => {
      const validSignal = {
        code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL,
      }
      const result = StructuredSignalSchema.safeParse(validSignal)
      expect(result.success).toBe(true)
    })

    it('should accept signal with weight and bounded meta', () => {
      const validSignal = {
        code: SIGNAL_CODE.MULTIPLE_RISK_FACTORS,
        weight: 1.2,
        meta: {
          count: 3,
          primary: true,
          factor: 'stress',
        },
      }
      const result = StructuredSignalSchema.safeParse(validSignal)
      expect(result.success).toBe(true)
    })

    it('should reject meta with > 10 keys', () => {
      const invalidSignal = {
        code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL,
        meta: {
          key1: 'value',
          key2: 'value',
          key3: 'value',
          key4: 'value',
          key5: 'value',
          key6: 'value',
          key7: 'value',
          key8: 'value',
          key9: 'value',
          key10: 'value',
          key11: 'value', // 11th key - should fail
        },
      }
      const result = StructuredSignalSchema.safeParse(invalidSignal)
      expect(result.success).toBe(false)
    })

    it('should reject meta with string values > 80 chars', () => {
      const longString = 'a'.repeat(81)
      const invalidSignal = {
        code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL,
        meta: {
          reason: longString,
        },
      }
      const result = StructuredSignalSchema.safeParse(invalidSignal)
      expect(result.success).toBe(false)
    })

    it('should reject meta with key > 50 chars', () => {
      const longKey = 'k'.repeat(51)
      const invalidSignal = {
        code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL,
        meta: {
          [longKey]: 'value',
        },
      }
      const result = StructuredSignalSchema.safeParse(invalidSignal)
      expect(result.success).toBe(false)
    })

    it('should reject unknown fields (strict mode)', () => {
      const invalidSignal = {
        code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL,
        unknownField: 'should not be here',
      }
      const result = StructuredSignalSchema.safeParse(invalidSignal)
      expect(result.success).toBe(false)
    })
  })

  describe('ImpactScore and FeasibilityScore (No Free Text Reasoning)', () => {
    it('should accept score with structured signals only', () => {
      const validScore = {
        score: 75,
        signals: [
          { code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL },
          { code: SIGNAL_CODE.MULTIPLE_RISK_FACTORS, meta: { count: 2 } },
        ],
      }
      const result = ImpactScoreSchema.safeParse(validScore)
      expect(result.success).toBe(true)
    })

    it('should reject score with reasoning field', () => {
      const invalidScore = {
        score: 75,
        signals: [{ code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL }],
        reasoning: 'This should not be allowed',
      }
      const result = ImpactScoreSchema.safeParse(invalidScore)
      expect(result.success).toBe(false)
    })

    it('should reject unknown fields in score object', () => {
      const invalidScore = {
        score: 75,
        signals: [{ code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL }],
        extraField: 'not allowed',
      }
      const result = ImpactScoreSchema.safeParse(invalidScore)
      expect(result.success).toBe(false)
    })
  })
  describe('Priority Score Calculation', () => {
    it('should calculate priority score correctly (Impact x Feasibility / 100)', () => {
      expect(calculatePriorityScore(100, 100)).toBe(100)
      expect(calculatePriorityScore(80, 90)).toBe(72)
      expect(calculatePriorityScore(50, 50)).toBe(25)
      expect(calculatePriorityScore(0, 100)).toBe(0)
      expect(calculatePriorityScore(100, 0)).toBe(0)
    })

    it('should round priority scores', () => {
      expect(calculatePriorityScore(75, 75)).toBe(56) // 56.25 → 56
      expect(calculatePriorityScore(33, 33)).toBe(11) // 10.89 → 11
    })
  })

  describe('Signal Code Validation', () => {
    it('should validate signal codes', () => {
      expect(isValidSignalCode(SIGNAL_CODE.HIGH_STRESS_SCORE)).toBe(true)
      expect(isValidSignalCode(SIGNAL_CODE.CRITICAL_RISK_LEVEL)).toBe(true)
      expect(isValidSignalCode(SIGNAL_CODE.EASY_TO_IMPLEMENT)).toBe(true)
      expect(isValidSignalCode('invalid-signal')).toBe(false)
      expect(isValidSignalCode(null)).toBe(false)
    })
  })

  describe('PriorityRankingV1Schema', () => {
    it('should validate a complete priority ranking', () => {
      const validRanking = {
        rankingVersion: 'v1',
        algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
        rankedAt: new Date().toISOString(),
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '223e4567-e89b-12d3-a456-426614174001',
        programTier: PROGRAM_TIER.TIER_1_ESSENTIAL,
        rankedInterventions: [
          {
            topic: {
              topicId: 'stress-breathing-exercises',
              topicLabel: 'Breathing Exercises',
              pillarKey: PILLAR_KEY.MENTAL_HEALTH,
            },
            impactScore: {
              score: 75,
              signals: [{ code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL }],
            },
            feasibilityScore: {
              score: 90,
              signals: [{ code: SIGNAL_CODE.EASY_TO_IMPLEMENT }],
            },
            priorityScore: 68,
            rank: 1,
          },
        ],
        topInterventions: [
          {
            topic: {
              topicId: 'stress-breathing-exercises',
              topicLabel: 'Breathing Exercises',
              pillarKey: PILLAR_KEY.MENTAL_HEALTH,
            },
            impactScore: {
              score: 75,
              signals: [{ code: SIGNAL_CODE.HIGH_IMPACT_POTENTIAL }],
            },
            feasibilityScore: {
              score: 90,
              signals: [{ code: SIGNAL_CODE.EASY_TO_IMPLEMENT }],
            },
            priorityScore: 68,
            rank: 1,
          },
        ],
      }

      const result = PriorityRankingV1Schema.safeParse(validRanking)
      expect(result.success).toBe(true)
    })

    it('should reject invalid version', () => {
      const invalidRanking = {
        rankingVersion: 'v2', // Invalid version
        algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
        rankedAt: new Date().toISOString(),
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        rankedInterventions: [],
        topInterventions: [],
      }

      const result = PriorityRankingV1Schema.safeParse(invalidRanking)
      expect(result.success).toBe(false)
    })

    it('should require riskBundleId', () => {
      const invalidRanking = {
        rankingVersion: 'v1',
        algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
        rankedAt: new Date().toISOString(),
        // Missing riskBundleId
        rankedInterventions: [],
        topInterventions: [],
      }

      const result = PriorityRankingV1Schema.safeParse(invalidRanking)
      expect(result.success).toBe(false)
    })

    it('should validate program tier enum', () => {
      const ranking = {
        rankingVersion: 'v1',
        algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
        rankedAt: new Date().toISOString(),
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        programTier: 'invalid-tier', // Invalid tier
        rankedInterventions: [],
        topInterventions: [],
      }

      const result = PriorityRankingV1Schema.safeParse(ranking)
      expect(result.success).toBe(false)
    })

    it('should limit top interventions to max 10', () => {
      const interventions = Array.from({ length: 15 }, (_, i) => ({
        topic: {
          topicId: `topic-${i}`,
          topicLabel: `Topic ${i}`,
        },
        impactScore: { score: 50, signals: [] },
        feasibilityScore: { score: 50, signals: [] },
        priorityScore: 25,
        rank: i + 1,
      }))

      const ranking = {
        rankingVersion: 'v1',
        algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
        rankedAt: new Date().toISOString(),
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        rankedInterventions: interventions,
        topInterventions: interventions, // Too many (15 > 10)
      }

      const result = PriorityRankingV1Schema.safeParse(ranking)
      expect(result.success).toBe(false)
    })
  })

  describe('PriorityRankingInputSchema', () => {
    it('should validate complete input', () => {
      const validInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '223e4567-e89b-12d3-a456-426614174001',
        riskBundle: {
          riskScore: {
            overall: 65,
            riskLevel: 'high',
            factors: [
              {
                key: 'stress',
                label: 'Stress Level',
                score: 70,
                weight: 0.8,
                riskLevel: 'high',
              },
            ],
          },
        },
        algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
        topN: 5,
      }

      const result = PriorityRankingInputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should default topN to 5', () => {
      const input = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 50,
            riskLevel: 'moderate',
            factors: [],
          },
        },
        algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
      }

      const result = PriorityRankingInputSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.topN).toBe(5)
      }
    })

    it('should enforce topN constraints (1-10)', () => {
      const input = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 50,
            riskLevel: 'moderate',
            factors: [],
          },
        },
        algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
        topN: 15, // Too high
      }

      const result = PriorityRankingInputSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('Result Helpers', () => {
    it('should create success result', () => {
      const ranking = {
        rankingVersion: 'v1' as const,
        algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
        rankedAt: new Date().toISOString(),
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        rankedInterventions: [],
        topInterventions: [],
      }

      const result = successResult(ranking)
      expect(result.success).toBe(true)
      expect(isSuccessfulResult(result)).toBe(true)
      expect(isErrorResult(result)).toBe(false)
    })

    it('should create error result', () => {
      const result = errorResult('TEST_ERROR', 'Test error message', { detail: 'value' })
      expect(result.success).toBe(false)
      expect(isSuccessfulResult(result)).toBe(false)
      expect(isErrorResult(result)).toBe(true)
      if (isErrorResult(result)) {
        expect(result.error.code).toBe('TEST_ERROR')
        expect(result.error.message).toBe('Test error message')
        expect(result.error.details).toEqual({ detail: 'value' })
      }
    })
  })

  describe('Type Guards', () => {
    it('should validate result schema', () => {
      const successRes = {
        success: true,
        data: {
          rankingVersion: 'v1' as const,
          algorithmVersion: '1.0.0',
        registryVersion: 'abc12345',
          rankedAt: new Date().toISOString(),
          riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
          rankedInterventions: [],
          topInterventions: [],
        },
      }

      const errorRes = {
        success: false,
        error: {
          code: 'ERROR',
          message: 'Error message',
        },
      }

      expect(PriorityRankingResultSchema.safeParse(successRes).success).toBe(true)
      expect(PriorityRankingResultSchema.safeParse(errorRes).success).toBe(true)
    })
  })
})
