/**
 * E75.5: Funnel Summary Generator Tests
 * 
 * Tests for creating system-generated anamnesis entries from assessments
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  createFunnelSummary,
  extractKeyAnswers,
  extractResultsSummary,
} from '@/lib/anamnesis/summaryGenerator'
import { getPatientProfileId, getPatientOrganizationId } from '@/lib/api/anamnesis/helpers'

jest.mock('@/lib/api/anamnesis/helpers', () => ({
  getPatientProfileId: jest.fn(),
  getPatientOrganizationId: jest.fn(),
}))

// Test IDs (must match E75.1 test data)
const TEST_ORG_ID = '11111111-1111-1111-1111-111111111111'
const TEST_PATIENT_USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TEST_PATIENT_ID = 'a1111111-1111-1111-1111-111111111111'

type MockRow = Record<string, any>

function createMockSupabase() {
  const tables: Record<string, MockRow[]> = {
    anamnesis_entries: [],
    assessment_answers: [],
    calculated_results: [],
  }
  let idCounter = 0

  const createQuery = (tableName: string) => {
    const filters: Array<{ key: string; value: any }> = []
    let mode: 'select' | 'delete' = 'select'

    const getRows = () => {
      const rows = tables[tableName] || []
      return rows.filter((row) => {
        return filters.every(({ key, value }) => {
          if (key === 'content->>assessment_id') {
            return row.content?.assessment_id === value
          }
          if (key === 'is_archived') {
            return (row.is_archived ?? false) === value
          }
          return row[key] === value
        })
      })
    }

    const runQuery = () => {
      if (mode === 'delete') {
        const rows = tables[tableName] || []
        const remaining = rows.filter((row) => !getRows().includes(row))
        tables[tableName] = remaining
        return { data: null, error: null }
      }

      return { data: getRows(), error: null }
    }

    const query: any = {
      select: () => query,
      eq: (key: string, value: any) => {
        filters.push({ key, value })
        return query
      },
      maybeSingle: async () => {
        const { data } = runQuery()
        const row = Array.isArray(data) ? data[0] ?? null : data
        return { data: row, error: null }
      },
      single: async () => {
        const { data } = runQuery()
        const row = Array.isArray(data) ? data[0] : data
        if (!row) {
          return { data: null, error: new Error('Not found') }
        }
        return { data: row, error: null }
      },
      delete: () => {
        mode = 'delete'
        return query
      },
      insert: (payload: MockRow | MockRow[]) => {
        const records = Array.isArray(payload) ? payload : [payload]
        const stored = records.map((record) => {
          const id = record.id ?? `mock-${tableName}-${(idCounter += 1)}`
          const row = { is_archived: false, ...record, id }
          tables[tableName] = [...(tables[tableName] || []), row]
          return row
        })

        const insertResult: any = {
          select: () => ({
            single: async () => ({ data: { id: stored[0]?.id }, error: null }),
          }),
          then: (resolve: any, reject: any) =>
            Promise.resolve({ data: stored, error: null }).then(resolve, reject),
        }

        return insertResult
      },
      then: (resolve: any, reject: any) => Promise.resolve(runQuery()).then(resolve, reject),
    }

    return query
  }

  return {
    from: (tableName: string) => createQuery(tableName),
  }
}

describe('E75.5: Funnel Summary Generator', () => {
  let supabase: ReturnType<typeof createMockSupabase>
  let testAssessmentId: string
  let testJobId: string

  beforeEach(() => {
    supabase = createMockSupabase()
    testAssessmentId = 'assessment-1'
    testJobId = 'job-1'
    ;(getPatientProfileId as jest.Mock).mockResolvedValue(TEST_PATIENT_ID)
    ;(getPatientOrganizationId as jest.Mock).mockResolvedValue(TEST_ORG_ID)
  })

  describe('createFunnelSummary', () => {
    it('should create a new funnel summary entry', async () => {
      const result = await createFunnelSummary(supabase, {
        assessmentId: testAssessmentId,
        funnelSlug: 'stress',
        funnelVersion: 'v1',
        userId: TEST_PATIENT_USER_ID,
        completedAt: new Date().toISOString(),
        processingJobId: testJobId,
      })

      expect(result.success).toBe(true)
      expect(result.entryId).toBeDefined()
      expect(result.isNew).toBe(true)
    })

    it('should be idempotent - not create duplicate on second call', async () => {
      // First call
      const result1 = await createFunnelSummary(supabase, {
        assessmentId: testAssessmentId,
        funnelSlug: 'stress',
        funnelVersion: 'v1',
        userId: TEST_PATIENT_USER_ID,
        completedAt: new Date().toISOString(),
        processingJobId: testJobId,
      })

      expect(result1.success).toBe(true)
      const firstEntryId = result1.entryId

      // Second call with same parameters
      const result2 = await createFunnelSummary(supabase, {
        assessmentId: testAssessmentId,
        funnelSlug: 'stress',
        funnelVersion: 'v1',
        userId: TEST_PATIENT_USER_ID,
        completedAt: new Date().toISOString(),
        processingJobId: testJobId,
      })

      expect(result2.success).toBe(true)
      expect(result2.entryId).toBe(firstEntryId) // Same entry ID
      expect(result2.isNew).toBe(false) // Not a new entry

      // Verify only one entry exists
      const { data: entries, error } = await supabase
        .from('anamnesis_entries')
        .select('id')
        .eq('patient_id', TEST_PATIENT_ID)
        .eq('entry_type', 'funnel_summary')
        .eq('content->>assessment_id', testAssessmentId)

      expect(error).toBeNull()
      expect(entries).toHaveLength(1)
    })

    it('should include funnel metadata in content', async () => {
      const completedAt = new Date().toISOString()
      
      const result = await createFunnelSummary(supabase, {
        assessmentId: testAssessmentId,
        funnelSlug: 'stress',
        funnelVersion: 'v1.2.3',
        userId: TEST_PATIENT_USER_ID,
        completedAt,
        processingJobId: testJobId,
        resultsSummary: {
          risk_level: 'medium',
          primary_scores: { stress: 75 },
          interventions: ['intervention-1'],
        },
      })

      expect(result.success).toBe(true)

      // Fetch created entry
      const { data: entry } = await supabase
        .from('anamnesis_entries')
        .select('content, title, tags, entry_type')
        .eq('id', result.entryId!)
        .single()

      expect(entry).toBeDefined()
      expect(entry!.entry_type).toBe('funnel_summary')
      expect(entry!.content).toMatchObject({
        funnel_slug: 'stress',
        funnel_version: 'v1.2.3',
        assessment_id: testAssessmentId,
        completed_at: completedAt,
        processing_job_id: testJobId,
        results_summary: {
          risk_level: 'medium',
          primary_scores: { stress: 75 },
          interventions: ['intervention-1'],
        },
        provenance: {
          created_by_system: true,
          generator_version: expect.any(String),
          generated_at: expect.any(String),
        },
      })

      expect(entry!.tags).toContain('system-generated')
      expect(entry!.tags).toContain('funnel-summary')
      expect(entry!.tags).toContain('stress')
      expect(entry!.title).toContain('Stress')
    })

    it('should handle missing patient profile', async () => {
      ;(getPatientProfileId as jest.Mock).mockResolvedValueOnce(null)
      const result = await createFunnelSummary(supabase, {
        assessmentId: testAssessmentId,
        funnelSlug: 'stress',
        funnelVersion: 'v1',
        userId: '00000000-0000-0000-0000-000000000000', // Non-existent user
        completedAt: new Date().toISOString(),
      })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('PATIENT_NOT_FOUND')
    })
  })

  describe('extractKeyAnswers', () => {
    it('should extract answers from assessment', async () => {
      // Create test answer
      await supabase.from('assessment_answers').insert({
        assessment_id: testAssessmentId,
        question_id: 'q1',
        answer_data: { value: 'test-answer' },
      })

      const keyAnswers = await extractKeyAnswers(supabase, testAssessmentId)

      expect(keyAnswers).toBeDefined()
      expect(keyAnswers.q1).toEqual({ value: 'test-answer' })

      // Clean up
      await supabase
        .from('assessment_answers')
        .delete()
        .eq('assessment_id', testAssessmentId)
    })

    it('should return empty object when no answers exist', async () => {
      const keyAnswers = await extractKeyAnswers(
        supabase,
        '00000000-0000-0000-0000-000000000000',
      )

      expect(keyAnswers).toEqual({})
    })
  })

  describe('extractResultsSummary', () => {
    it('should extract results from processing job', async () => {
      // Create test calculated_results
      await supabase.from('calculated_results').insert({
        job_id: testJobId,
        result_data: {
          risk_level: 'high',
          primary_scores: { anxiety: 85 },
          interventions: ['intervention-a', 'intervention-b'],
        },
      })

      const resultsSummary = await extractResultsSummary(supabase, testJobId)

      expect(resultsSummary).toBeDefined()
      expect(resultsSummary?.risk_level).toBe('high')
      expect(resultsSummary?.primary_scores).toEqual({ anxiety: 85 })
      expect(resultsSummary?.interventions).toEqual(['intervention-a', 'intervention-b'])

      // Clean up
      await supabase.from('calculated_results').delete().eq('job_id', testJobId)
    })

    it('should return undefined when no results exist', async () => {
      const resultsSummary = await extractResultsSummary(
        supabase,
        '00000000-0000-0000-0000-000000000000',
      )

      expect(resultsSummary).toBeUndefined()
    })
  })
})
