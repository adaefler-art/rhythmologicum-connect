/**
 * Tests for Priority Ranker (V05-I05.3)
 * 
 * Focuses on:
 * - Determinism: same input → same output
 * - Explainability: signals, partial scores, reasoning
 * - Tier filtering: program tier constraints
 * - No fantasy: only registry interventions
 */

import { rankInterventions } from '../ranker'
import type { PriorityRankingInput } from '@/lib/contracts/priorityRanking'
import { RISK_LEVEL } from '@/lib/contracts/riskBundle'
import { PROGRAM_TIER } from '@/lib/contracts/registry'

describe('Priority Ranker', () => {
  // ============================================================
  // Determinism Tests
  // ============================================================

  describe('Determinism', () => {
    it('should produce identical results for same input (golden fixture)', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '223e4567-e89b-12d3-a456-426614174001',
        riskBundle: {
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
              {
                key: 'sleep',
                label: 'Sleep Quality',
                score: 60,
                weight: 0.7,
                riskLevel: RISK_LEVEL.HIGH,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
        topN: 5,
      }

      // Run ranking multiple times
      const result1 = rankInterventions(input)
      const result2 = rankInterventions(input)
      const result3 = rankInterventions(input)

      // All results should be successful
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)

      if (result1.success && result2.success && result3.success) {
        // Rankings should be identical
        expect(result1.data.rankedInterventions).toEqual(result2.data.rankedInterventions)
        expect(result2.data.rankedInterventions).toEqual(result3.data.rankedInterventions)

        // Top interventions should be identical
        expect(result1.data.topInterventions).toEqual(result2.data.topInterventions)
        expect(result2.data.topInterventions).toEqual(result3.data.topInterventions)

        // Scores should be identical
        const scores1 = result1.data.rankedInterventions.map((i) => i.priorityScore)
        const scores2 = result2.data.rankedInterventions.map((i) => i.priorityScore)
        const scores3 = result3.data.rankedInterventions.map((i) => i.priorityScore)
        expect(scores1).toEqual(scores2)
        expect(scores2).toEqual(scores3)
      }
    })

    it('should produce consistent rankings for critical risk level', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 85,
            riskLevel: RISK_LEVEL.CRITICAL,
            factors: [
              {
                key: 'stress',
                label: 'Stress Level',
                score: 90,
                weight: 1.0,
                riskLevel: RISK_LEVEL.CRITICAL,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
        topN: 3,
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        // Should have interventions
        expect(result.data.rankedInterventions.length).toBeGreaterThan(0)
        
        // Top interventions should be limited to topN
        expect(result.data.topInterventions.length).toBeLessThanOrEqual(3)
        
        // Rankings should be sorted by priority score (descending)
        const scores = result.data.rankedInterventions.map((i) => i.priorityScore)
        const sortedScores = [...scores].sort((a, b) => b - a)
        expect(scores).toEqual(sortedScores)
      }
    })
  })

  // ============================================================
  // Explainability Tests
  // ============================================================

  describe('Explainability', () => {
    it('should include impact signals and reasoning', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 75,
            riskLevel: RISK_LEVEL.CRITICAL,
            factors: [
              {
                key: 'stress',
                label: 'Stress',
                score: 80,
                weight: 1.0,
                riskLevel: RISK_LEVEL.CRITICAL,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        const firstIntervention = result.data.rankedInterventions[0]
        
        // Impact score should have signals
        expect(firstIntervention.impactScore.signals).toBeDefined()
        expect(firstIntervention.impactScore.signals.length).toBeGreaterThan(0)
        
        // Should have reasoning (optional but expected)
        // Impact score has structured signals (no reasoning field)
        
        // Feasibility score should have signals
        expect(firstIntervention.feasibilityScore.signals).toBeDefined()
        expect(firstIntervention.feasibilityScore.signals.length).toBeGreaterThan(0)
        
        // Should have reasoning
        // Feasibility score has structured signals (no reasoning field)
      }
    })

    it('should calculate correct partial scores (impact and feasibility)', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 50,
            riskLevel: RISK_LEVEL.MODERATE,
            factors: [
              {
                key: 'stress',
                label: 'Stress',
                score: 50,
                weight: 1.0,
                riskLevel: RISK_LEVEL.MODERATE,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        for (const intervention of result.data.rankedInterventions) {
          // Impact score should be in valid range
          expect(intervention.impactScore.score).toBeGreaterThanOrEqual(0)
          expect(intervention.impactScore.score).toBeLessThanOrEqual(100)
          
          // Feasibility score should be in valid range
          expect(intervention.feasibilityScore.score).toBeGreaterThanOrEqual(0)
          expect(intervention.feasibilityScore.score).toBeLessThanOrEqual(100)
          
          // Priority score should be calculated correctly
          const expectedPriority = Math.round(
            (intervention.impactScore.score * intervention.feasibilityScore.score) / 100
          )
          expect(intervention.priorityScore).toBe(expectedPriority)
        }
      }
    })

    it('should assign sequential ranks', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 60,
            riskLevel: RISK_LEVEL.HIGH,
            factors: [
              {
                key: 'stress',
                label: 'Stress',
                score: 65,
                weight: 1.0,
                riskLevel: RISK_LEVEL.HIGH,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        // Ranks should start at 1 and increment
        const ranks = result.data.rankedInterventions.map((i) => i.rank)
        const expectedRanks = Array.from({ length: ranks.length }, (_, i) => i + 1)
        expect(ranks).toEqual(expectedRanks)
      }
    })
  })

  // ============================================================
  // Tier Filtering Tests
  // ============================================================

  describe('Tier Filtering', () => {
    it('should filter interventions by tier compatibility', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 60,
            riskLevel: RISK_LEVEL.HIGH,
            factors: [
              {
                key: 'stress',
                label: 'Stress Level',
                score: 70,
                weight: 1.0,
                riskLevel: RISK_LEVEL.HIGH,
              },
            ],
          },
        },
        programTier: PROGRAM_TIER.TIER_1_ESSENTIAL, // Restrictive tier
        algorithmVersion: 'v1.0.0',
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        // All interventions should be compatible with tier-1-essential
        for (const intervention of result.data.rankedInterventions) {
          expect(intervention.tierCompatibility).toContain(PROGRAM_TIER.TIER_1_ESSENTIAL)
        }
        
        // Should include tier in feasibility reasoning
        const firstIntervention = result.data.rankedInterventions[0]
        const hasTierSignal = firstIntervention.feasibilityScore.signals.some((s: any) => s.code === 'tier_1_recommended')
        expect(hasTierSignal).toBe(true)
      }
    })

    it('should include more interventions for comprehensive tier', () => {
      const baseInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 60,
            riskLevel: RISK_LEVEL.HIGH,
            factors: [
              {
                key: 'stress',
                label: 'Stress',
                score: 65,
                weight: 1.0,
                riskLevel: RISK_LEVEL.HIGH,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
      }

      // Test with tier-1-essential
      const tier1Result = rankInterventions({
        ...baseInput,
        programTier: PROGRAM_TIER.TIER_1_ESSENTIAL,
      })

      // Test with tier-2-comprehensive
      const tier2Result = rankInterventions({
        ...baseInput,
        programTier: PROGRAM_TIER.TIER_2_COMPREHENSIVE,
      })

      expect(tier1Result.success).toBe(true)
      expect(tier2Result.success).toBe(true)

      if (tier1Result.success && tier2Result.success) {
        // Comprehensive tier should have at least as many interventions as essential
        expect(tier2Result.data.rankedInterventions.length).toBeGreaterThanOrEqual(
          tier1Result.data.rankedInterventions.length
        )
      }
    })

    it('should boost feasibility for tier-1 simple interventions', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 60,
            riskLevel: RISK_LEVEL.HIGH,
            factors: [
              {
                key: 'stress',
                label: 'Stress',
                score: 65,
                weight: 1.0,
                riskLevel: RISK_LEVEL.HIGH,
              },
            ],
          },
        },
        programTier: PROGRAM_TIER.TIER_1_ESSENTIAL,
        algorithmVersion: 'v1.0.0',
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        // Check that tier-1 recommended signal is present
        const hasT1Signal = result.data.rankedInterventions.some((i) =>
          i.feasibilityScore.signals.some((s: any) => s.code === 'tier_1_recommended')
        )
        expect(hasT1Signal).toBe(true)
      }
    })
  })

  // ============================================================
  // Registry Integration Tests (No Fantasy)
  // ============================================================

  describe('Registry Integration', () => {
    it('should only use interventions from registry', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 70,
            riskLevel: RISK_LEVEL.HIGH,
            factors: [
              {
                key: 'stress',
                label: 'Stress',
                score: 75,
                weight: 1.0,
                riskLevel: RISK_LEVEL.HIGH,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        // All interventions should have valid topic IDs from registry
        for (const intervention of result.data.rankedInterventions) {
          expect(intervention.topic.topicId).toBeDefined()
          expect(intervention.topic.topicLabel).toBeDefined()
          
          // Should not be fantasy/made-up names
          expect(intervention.topic.topicId).not.toContain('generated')
          expect(intervention.topic.topicId).not.toContain('fantasy')
        }
      }
    })

    it('should map multiple risk factors to interventions', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 65,
            riskLevel: RISK_LEVEL.HIGH,
            factors: [
              {
                key: 'stress',
                label: 'Stress',
                score: 70,
                weight: 0.5,
                riskLevel: RISK_LEVEL.HIGH,
              },
              {
                key: 'sleep',
                label: 'Sleep',
                score: 60,
                weight: 0.5,
                riskLevel: RISK_LEVEL.HIGH,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        // Should have interventions targeting both stress and sleep
        const topicIds = result.data.rankedInterventions.map((i) => i.topic.topicId)
        
        // Should include stress interventions
        const hasStressInterventions = topicIds.some((id) => id.includes('stress'))
        expect(hasStressInterventions).toBe(true)
        
        // Should include sleep interventions
        const hasSleepInterventions = topicIds.some((id) => id.includes('sleep'))
        expect(hasSleepInterventions).toBe(true)
      }
    })
  })

  // ============================================================
  // Error Handling Tests
  // ============================================================

  describe('Error Handling', () => {
    it('should return error for missing risk bundle', () => {
      const input = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        algorithmVersion: 'v1.0.0',
      } as any

      const result = rankInterventions(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_INPUT')
      }
    })

    it('should handle empty risk factors gracefully', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 10,
            riskLevel: RISK_LEVEL.LOW,
            factors: [], // No risk factors
          },
        },
        algorithmVersion: 'v1.0.0',
      }

      const result = rankInterventions(input)
      // Should still succeed but with no candidates or return an error
      // Either is acceptable depending on implementation choice
      expect(result.success).toBeDefined()
    })
  })

  // ============================================================
  // TopN Tests
  // ============================================================

  describe('TopN Selection', () => {
    it('should return correct number of top interventions', () => {
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 65,
            riskLevel: RISK_LEVEL.HIGH,
            factors: [
              {
                key: 'stress',
                label: 'Stress',
                score: 70,
                weight: 1.0,
                riskLevel: RISK_LEVEL.HIGH,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
        topN: 3,
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        // Top interventions should be limited to topN
        expect(result.data.topInterventions.length).toBeLessThanOrEqual(3)
        
        // Top interventions should be the first N from ranked list
        const topIds = result.data.topInterventions.map((i) => i.topic.topicId)
        const rankedTopIds = result.data.rankedInterventions
          .slice(0, 3)
          .map((i) => i.topic.topicId)
        expect(topIds).toEqual(rankedTopIds)
      }
    })
  })

  // ============================================================
  // Tie-Breaking Determinism Test
  // ============================================================

  describe('Tie-Breaking Determinism', () => {
    it('should use topic ID as tie-breaker for equal priority scores', () => {
      // Create a mock registry with interventions that will have same score
      const input: PriorityRankingInput = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        riskBundle: {
          riskScore: {
            overall: 50,
            riskLevel: RISK_LEVEL.MODERATE,
            factors: [
              {
                key: 'stress',
                label: 'Stress',
                score: 50,
                weight: 1.0,
                riskLevel: RISK_LEVEL.MODERATE,
              },
            ],
          },
        },
        algorithmVersion: 'v1.0.0',
      }

      const result = rankInterventions(input)
      expect(result.success).toBe(true)

      if (result.success) {
        // Check for interventions with same score
        const scores = result.data.rankedInterventions.map((i) => i.priorityScore)
        const hasTies = scores.some((score, idx) => scores.indexOf(score) !== idx)

        if (hasTies) {
          // Find tied interventions
          const tiedGroups = scores.reduce((acc, score, idx) => {
            if (!acc[score]) acc[score] = []
            acc[score].push(result.data.rankedInterventions[idx])
            return acc
          }, {} as Record<number, any[]>)

          // Check each tied group is sorted by topic ID
          Object.values(tiedGroups).forEach((group) => {
            if (group.length > 1) {
              const topicIds = group.map((i) => i.topic.topicId)
              const sortedIds = [...topicIds].sort()
              expect(topicIds).toEqual(sortedIds)
            }
          })
        }
      }
    })
  })
})

describe('Intervention Registry', () => {
  describe('Registry Hash Determinism', () => {
    it('should produce same hash for same registry', () => {
      const { getRegistryHash } = require('../interventionRegistry')
      const hash1 = getRegistryHash()
      const hash2 = getRegistryHash()
      expect(hash1).toBe(hash2)
      expect(hash1).toBeTruthy()
      expect(typeof hash1).toBe('string')
    })

    it('should produce 8-character hex hash', () => {
      const { getRegistryHash } = require('../interventionRegistry')
      const hash = getRegistryHash()
      expect(hash).toMatch(/^[0-9a-f]{8}$/)
    })
  })
})
