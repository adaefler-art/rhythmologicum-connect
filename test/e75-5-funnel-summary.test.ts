/**
 * E75.5: Funnel Summary Generator Tests
 * 
 * Tests for creating system-generated anamnesis entries from assessments
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import {
  createFunnelSummary,
  extractKeyAnswers,
  extractResultsSummary,
} from '@/lib/anamnesis/summaryGenerator'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Test IDs (must match E75.1 test data)
const TEST_ORG_ID = '11111111-1111-1111-1111-111111111111'
const TEST_PATIENT_USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TEST_PATIENT_ID = 'a1111111-1111-1111-1111-111111111111'

describe('E75.5: Funnel Summary Generator', () => {
  let supabase: ReturnType<typeof createClient>
  let testAssessmentId: string
  let testJobId: string

  beforeAll(async () => {
    // Create admin client
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Create test assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        patient_id: TEST_PATIENT_ID,
        funnel: 'stress',
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (assessmentError || !assessment) {
      throw new Error(`Failed to create test assessment: ${assessmentError?.message}`)
    }

    testAssessmentId = assessment.id

    // Create test processing job
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        assessment_id: testAssessmentId,
        correlation_id: `test-${Date.now()}`,
        status: 'completed',
        stage: 'completed',
      })
      .select('id')
      .single()

    if (jobError || !job) {
      throw new Error(`Failed to create test job: ${jobError?.message}`)
    }

    testJobId = job.id
  })

  afterAll(async () => {
    // Clean up test data
    if (testAssessmentId) {
      await supabase.from('assessments').delete().eq('id', testAssessmentId)
    }
    if (testJobId) {
      await supabase.from('processing_jobs').delete().eq('id', testJobId)
    }
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
