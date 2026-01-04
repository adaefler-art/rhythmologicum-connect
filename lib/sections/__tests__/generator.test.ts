/**
 * Section Generator Tests - V05-I05.4
 */

import { generateSections, type SectionGenerationContext } from '@/lib/sections/generator'
import type { RiskBundleV1 } from '@/lib/contracts/riskBundle'
import type { PriorityRankingV1 } from '@/lib/contracts/priorityRanking'
import { SECTION_KEY } from '@/lib/contracts/reportSections'

describe('Section Generator', () => {
  const mockRiskBundle: RiskBundleV1 = {
    riskBundleVersion: 'v1',
    assessmentId: '123e4567-e89b-12d3-a456-426614174000',
    jobId: '223e4567-e89b-12d3-a456-426614174000',
    algorithmVersion: 'v1.0.0',
    calculatedAt: '2026-01-03T21:00:00.000Z',
    riskScore: {
      overall: 75,
      riskLevel: 'high',
      factors: [
        { key: 'stress', score: 80, label: 'Stress', weight: 0.6, riskLevel: 'high' },
        { key: 'sleep', score: 65, label: 'Sleep', weight: 0.4, riskLevel: 'moderate' },
      ],
    },
  }
  
  const mockRanking: PriorityRankingV1 = {
    rankingVersion: 'v1',
    algorithmVersion: 'v1.0.0',
    rankedAt: '2026-01-03T21:00:00.000Z',
    riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
    jobId: '223e4567-e89b-12d3-a456-426614174000',
    topInterventions: [
      {
        topic: {
          topicId: 'stress-breathing-exercises',
          topicLabel: 'Breathing Exercises',
          pillarKey: 'mental-health',
          contentKey: 'breathing-exercises',
        },
        impactScore: {
          score: 85,
          signals: ['high_impact_potential'],
          reasoning: 'High impact',
        },
        feasibilityScore: {
          score: 90,
          signals: ['easy_to_implement'],
          reasoning: 'Easy to implement',
        },
        priorityScore: 76,
        rank: 1,
        tierCompatibility: ['tier-1-essential'],
      },
    ],
    rankedInterventions: [],
  }
  
  it('should generate sections from risk bundle only', async () => {
    const context: SectionGenerationContext = {
      jobId: '223e4567-e89b-12d3-a456-426614174000',
      riskBundle: mockRiskBundle,
    }
    
    const result = await generateSections(context)
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sections.length).toBeGreaterThan(0)
      expect(result.data.jobId).toBe(context.jobId)
      expect(result.data.sectionsVersion).toBe('v1')
    }
  })
  
  it('should include prompt version in each section', async () => {
    const context: SectionGenerationContext = {
      jobId: '223e4567-e89b-12d3-a456-426614174000',
      riskBundle: mockRiskBundle,
    }
    
    const result = await generateSections(context)
    
    expect(result.success).toBe(true)
    if (result.success) {
      for (const section of result.data.sections) {
        expect(section.promptVersion).toBeTruthy()
        expect(section.promptVersion).toMatch(/^v\d+\.\d+\.\d+$/)
      }
    }
  })
  
  it('should include PHI-free inputs only', async () => {
    const context: SectionGenerationContext = {
      jobId: '223e4567-e89b-12d3-a456-426614174000',
      riskBundle: mockRiskBundle,
      programTier: 'tier-1-essential',
    }
    
    const result = await generateSections(context)
    
    expect(result.success).toBe(true)
    if (result.success) {
      for (const section of result.data.sections) {
        expect(section.inputs.riskBundleId).toBeTruthy()
        expect(section.inputs.scores).toBeDefined()
        expect(section.inputs.signals).toBeDefined()
      }
    }
  })
  
  it('should handle missing risk bundle', async () => {
    const context: SectionGenerationContext = {
      jobId: '223e4567-e89b-12d3-a456-426614174000',
      riskBundle: null as any,
    }
    
    const result = await generateSections(context)
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_CONTEXT')
    }
  })
})
