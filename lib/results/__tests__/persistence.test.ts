/**
 * Tests for Calculated Results Persistence - E73.3
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { computeInputsHash, saveCalculatedResults, loadCalculatedResults } from '../persistence'

describe('computeInputsHash', () => {
  it('should compute deterministic hash for same inputs', () => {
    const inputs1 = { a: 1, b: 2, c: 3 }
    const inputs2 = { a: 1, b: 2, c: 3 }

    const hash1 = computeInputsHash(inputs1)
    const hash2 = computeInputsHash(inputs2)

    expect(hash1).toBe(hash2)
    expect(hash1).toMatch(/^[a-f0-9]{64}$/) // SHA256 is 64 lowercase hex chars
  })

  it('should compute same hash regardless of key order', () => {
    const inputs1 = { a: 1, b: 2, c: 3 }
    const inputs2 = { c: 3, a: 1, b: 2 }

    const hash1 = computeInputsHash(inputs1)
    const hash2 = computeInputsHash(inputs2)

    expect(hash1).toBe(hash2)
  })

  it('should compute different hash for different inputs', () => {
    const inputs1 = { a: 1, b: 2, c: 3 }
    const inputs2 = { a: 1, b: 2, c: 4 }

    const hash1 = computeInputsHash(inputs1)
    const hash2 = computeInputsHash(inputs2)

    expect(hash1).not.toBe(hash2)
  })

  it('should handle nested objects with consistent hashing', () => {
    const inputs1 = { answers: { q1: 5, q2: 3 }, metadata: { version: '1.0' } }
    const inputs2 = { answers: { q1: 5, q2: 3 }, metadata: { version: '1.0' } }

    const hash1 = computeInputsHash(inputs1)
    const hash2 = computeInputsHash(inputs2)

    expect(hash1).toBe(hash2)
  })

  it('should handle nested objects with different key order consistently', () => {
    const inputs1 = { answers: { q1: 5, q2: 3 }, metadata: { version: '1.0', build: 'abc' } }
    const inputs2 = { answers: { q2: 3, q1: 5 }, metadata: { build: 'abc', version: '1.0' } }

    const hash1 = computeInputsHash(inputs1)
    const hash2 = computeInputsHash(inputs2)

    expect(hash1).toBe(hash2)
  })
})

describe('saveCalculatedResults', () => {
  // Mock Supabase client
  const createMockSupabase = (existingResult?: any, upsertError?: any) => {
    return {
      from: (table: string) => ({
        select: (columns: string) => ({
          eq: (field: string, value: any) => ({
            eq: (field2: string, value2: any) => ({
              maybeSingle: async () => {
                if (existingResult) {
                  return { data: existingResult, error: null }
                }
                return { data: null, error: null }
              },
            }),
          }),
        }),
        upsert: (data: any, options: any) => ({
          select: (columns: string) => ({
            single: async () => {
              if (upsertError) {
                return { data: null, error: upsertError }
              }
              return { data: { id: 'result-123', ...data }, error: null }
            },
          }),
        }),
      }),
    } as any
  }

  it('should save new calculated result', async () => {
    const supabase = createMockSupabase()
    
    const result = await saveCalculatedResults(supabase, {
      assessmentId: 'assessment-1',
      algorithmVersion: 'v1.0.0',
      scores: { riskScore: 75 },
      inputsData: { answers: { q1: 5 } },
    })

    expect(result.success).toBe(true)
    expect(result.resultId).toBe('result-123')
    expect(result.isNew).toBe(true)
  })

  it('should return existing result when inputs_hash matches', async () => {
    const inputsHash = computeInputsHash({ answers: { q1: 5 } })
    const existingResult = {
      id: 'existing-123',
      inputs_hash: inputsHash,
    }
    const supabase = createMockSupabase(existingResult)

    const result = await saveCalculatedResults(supabase, {
      assessmentId: 'assessment-1',
      algorithmVersion: 'v1.0.0',
      scores: { riskScore: 75 },
      inputsData: { answers: { q1: 5 } },
    })

    expect(result.success).toBe(true)
    expect(result.resultId).toBe('existing-123')
    expect(result.isNew).toBe(false)
  })

  it('should fail when scores is empty', async () => {
    const supabase = createMockSupabase()

    const result = await saveCalculatedResults(supabase, {
      assessmentId: 'assessment-1',
      algorithmVersion: 'v1.0.0',
      scores: {},
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('scores field is required')
  })

  it('should handle upsert errors', async () => {
    const supabase = createMockSupabase(null, { message: 'Database error' })

    const result = await saveCalculatedResults(supabase, {
      assessmentId: 'assessment-1',
      algorithmVersion: 'v1.0.0',
      scores: { riskScore: 75 },
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Database error')
  })
})

describe('loadCalculatedResults', () => {
  it('should load calculated result by assessment ID', async () => {
    const mockData = {
      id: 'result-123',
      assessment_id: 'assessment-1',
      algorithm_version: 'v1.0.0',
      scores: { riskScore: 75 },
      risk_models: { riskLevel: 'moderate' },
      priority_ranking: null,
      funnel_version_id: 'funnel-v1',
      computed_at: '2026-01-28T00:00:00Z',
      inputs_hash: 'abc123',
      created_at: '2026-01-28T00:00:00Z',
    }

    const supabase = {
      from: (table: string) => ({
        select: (columns: string) => ({
          eq: (field: string, value: any) => ({
            order: (field: string, options: any) => ({
              limit: (n: number) => ({
                maybeSingle: async () => ({ data: mockData, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as any

    const result = await loadCalculatedResults(supabase, 'assessment-1')

    expect(result.success).toBe(true)
    expect(result.result).toBeDefined()
    expect(result.result?.id).toBe('result-123')
    expect(result.result?.scores).toEqual({ riskScore: 75 })
  })

  it('should return undefined when not found', async () => {
    const supabase = {
      from: (table: string) => ({
        select: (columns: string) => ({
          eq: (field: string, value: any) => ({
            order: (field: string, options: any) => ({
              limit: (n: number) => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as any

    const result = await loadCalculatedResults(supabase, 'nonexistent')

    expect(result.success).toBe(true)
    expect(result.result).toBeUndefined()
  })
})
