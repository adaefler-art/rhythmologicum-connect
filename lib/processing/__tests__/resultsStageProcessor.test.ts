/**
 * Tests for Results Stage Processor - E73.3
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { processResultsStage } from '../resultsStageProcessor'

describe('processResultsStage', () => {
  // Mock Supabase client with complete mocking
  const createMockSupabase = (options: {
    riskBundle?: any
    ranking?: any
    answers?: any[]
    assessment?: any
    existingResult?: any
    upsertError?: any
  } = {}) => {
    const {
      riskBundle,
      ranking,
      answers = [],
      assessment = { funnel_id: 'funnel-123' },
      existingResult,
      upsertError,
    } = options

    return {
      from: (table: string) => {
        if (table === 'risk_bundles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: riskBundle ? { bundle_data: riskBundle } : null,
                  error: riskBundle ? null : { message: 'Not found' },
                }),
              }),
            }),
          }
        }

        if (table === 'priority_rankings') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: ranking ? { ranking_data: ranking } : null,
                  error: ranking ? null : { code: 'PGRST116' },
                }),
              }),
            }),
          }
        }

        if (table === 'assessment_answers') {
          return {
            select: () => ({
              eq: () => ({
                data: answers,
                error: null,
              }),
            }),
          }
        }

        if (table === 'assessments') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: assessment,
                  error: null,
                }),
              }),
            }),
          }
        }

        if (table === 'calculated_results') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: existingResult || null,
                    error: null,
                  }),
                }),
              }),
            }),
            upsert: () => ({
              select: () => ({
                single: async () => {
                  if (upsertError) {
                    return { data: null, error: upsertError }
                  }
                  return { data: { id: 'result-123' }, error: null }
                },
              }),
            }),
          }
        }

        return {} as any
      },
    } as any
  }

  it('should successfully write calculated results with risk bundle', async () => {
    const riskBundle = {
      assessmentId: 'assessment-1',
      riskScore: 75,
      riskLevel: 'moderate',
      riskFactors: ['stress', 'sleep'],
      algorithmVersion: 'v1.0.0',
      calculatedAt: '2026-01-28T00:00:00Z',
      riskBundleVersion: 'v1',
    }

    const answers = [
      { question_id: 'q1', answer_value: 5 },
      { question_id: 'q2', answer_value: 3 },
    ]

    const supabase = createMockSupabase({ riskBundle, answers })

    const result = await processResultsStage(supabase, 'job-123', 'assessment-1', 'v1.0.0')

    expect(result.success).toBe(true)
    expect(result.resultId).toBe('result-123')
  })

  it('should include priority ranking when available', async () => {
    const riskBundle = {
      assessmentId: 'assessment-1',
      riskScore: 75,
      riskLevel: 'moderate',
      riskFactors: [],
      algorithmVersion: 'v1.0.0',
      calculatedAt: '2026-01-28T00:00:00Z',
      riskBundleVersion: 'v1',
    }

    const ranking = {
      riskBundleId: 'bundle-1',
      rankedInterventions: [
        { id: 'i1', priority: 1 },
        { id: 'i2', priority: 2 },
      ],
      urgencyLevel: 'high',
      algorithmVersion: 'v1.0.0',
      rankingVersion: 'v1',
      rankedAt: '2026-01-28T00:00:00Z',
    }

    const supabase = createMockSupabase({ riskBundle, ranking })

    const result = await processResultsStage(supabase, 'job-123', 'assessment-1')

    expect(result.success).toBe(true)
  })

  it('should fail when risk bundle not found', async () => {
    const supabase = createMockSupabase({})

    const result = await processResultsStage(supabase, 'job-123', 'assessment-1')

    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('RISK_BUNDLE_NOT_FOUND')
  })

  it('should handle existing result (does not fail when result already exists)', async () => {
    const riskBundle = {
      assessmentId: 'assessment-1',
      riskScore: 75,
      riskLevel: 'moderate',
      riskFactors: [],
      algorithmVersion: 'v1.0.0',
      calculatedAt: '2026-01-28T00:00:00Z',
      riskBundleVersion: 'v1',
    }

    const answers = [
      { question_id: 'q1', answer_value: 5 },
      { question_id: 'q2', answer_value: 3 },
    ]

    const existingResult = {
      id: 'existing-result-123',
      inputs_hash: 'different-hash', // Different hash means update will happen
    }

    const supabase = createMockSupabase({ riskBundle, answers, existingResult })

    const result = await processResultsStage(supabase, 'job-123', 'assessment-1')

    expect(result.success).toBe(true)
    expect(result.resultId).toBeDefined()
  })

  it('should succeed with empty answers array', async () => {
    const riskBundle = {
      assessmentId: 'assessment-1',
      riskScore: 75,
      riskLevel: 'moderate',
      riskFactors: [],
      algorithmVersion: 'v1.0.0',
      calculatedAt: '2026-01-28T00:00:00Z',
      riskBundleVersion: 'v1',
    }

    const supabase = createMockSupabase({ riskBundle, answers: [] })

    const result = await processResultsStage(supabase, 'job-123', 'assessment-1')

    // Should succeed with empty answers (valid scenario for new assessments)
    expect(result.success).toBe(true)
  })
})
