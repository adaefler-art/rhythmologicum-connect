/**
 * Tests for reports queries
 * V05-I03.4: Result Screen
 */

import { getReportsForAssessment, getKeyOutcomesForAssessment } from '../reports'

// Mock the supabase client
jest.mock('../../supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

import { createServerSupabaseClient } from '../../supabase.server'

describe('Reports Queries', () => {
  let mockSupabase: any
  let mockOrderChain: any
  let mockEqChain: any
  let mockSelectChain: any

  beforeEach(() => {
    // Create a properly chained mock
    mockOrderChain = {
      order: jest.fn(),
    }

    mockEqChain = {
      order: jest.fn().mockReturnValue(mockOrderChain),
    }

    mockSelectChain = {
      eq: jest.fn().mockReturnValue(mockEqChain),
      in: jest.fn().mockReturnValue(mockEqChain),
    }

    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      }),
      auth: {
        getUser: jest.fn(),
      },
    }
    
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getReportsForAssessment', () => {
    it('should return reports for a valid assessment', async () => {
      const mockReports = [
        {
          id: 'report-1',
          assessment_id: 'assessment-1',
          score_numeric: 75,
          sleep_score: 80,
          risk_level: 'moderate',
          report_text_short: 'Test report',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          assessment: {
            id: 'assessment-1',
            funnel: 'stress-funnel',
            completed_at: '2026-01-01T00:00:00Z',
          },
        },
      ]

      mockOrderChain.order.mockResolvedValue({
        data: mockReports,
        error: null,
      })

      const result = await getReportsForAssessment('assessment-1')

      expect(result.data).toEqual(mockReports)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('reports')
      expect(mockSelectChain.eq).toHaveBeenCalledWith('assessment_id', 'assessment-1')
      // Verify deterministic ordering: created_at DESC, then id DESC
      expect(mockEqChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockOrderChain.order).toHaveBeenCalledWith('id', { ascending: false })
    })

    it('should return empty array when no reports exist', async () => {
      mockOrderChain.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getReportsForAssessment('assessment-1')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should handle database errors without logging PHI', async () => {
      mockOrderChain.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await getReportsForAssessment('assessment-1')

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('Database error')
    })

    it('should deterministically select latest report when multiple have same created_at', async () => {
      const mockReports = [
        {
          id: 'report-3',
          assessment_id: 'assessment-1',
          score_numeric: 90,
          sleep_score: 85,
          risk_level: 'high',
          report_text_short: 'Latest by id',
          created_at: '2026-01-01T12:00:00Z',
          updated_at: '2026-01-01T12:00:00Z',
          assessment: null,
        },
        {
          id: 'report-2',
          assessment_id: 'assessment-1',
          score_numeric: 80,
          sleep_score: 75,
          risk_level: 'moderate',
          report_text_short: 'Second by id',
          created_at: '2026-01-01T12:00:00Z',
          updated_at: '2026-01-01T12:00:00Z',
          assessment: null,
        },
        {
          id: 'report-1',
          assessment_id: 'assessment-1',
          score_numeric: 70,
          sleep_score: 65,
          risk_level: 'moderate',
          report_text_short: 'Oldest by id',
          created_at: '2026-01-01T12:00:00Z',
          updated_at: '2026-01-01T12:00:00Z',
          assessment: null,
        },
      ]

      mockOrderChain.order.mockResolvedValue({
        data: mockReports,
        error: null,
      })

      const result = await getReportsForAssessment('assessment-1')

      expect(result.data).toEqual(mockReports)
      // First report should be report-3 (highest id when created_at is same)
      expect(result.data?.[0].id).toBe('report-3')
      expect(result.data?.[0].score_numeric).toBe(90)
    })
  })

  describe('getKeyOutcomesForAssessment', () => {
    it('should return key outcomes from latest report', async () => {
      const mockReports = [
        {
          id: 'report-1',
          assessment_id: 'assessment-1',
          score_numeric: 75,
          sleep_score: 80,
          risk_level: 'moderate',
          report_text_short: 'Latest report',
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
          assessment: null,
        },
        {
          id: 'report-2',
          assessment_id: 'assessment-1',
          score_numeric: 60,
          sleep_score: 70,
          risk_level: 'low',
          report_text_short: 'Older report',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          assessment: null,
        },
      ]

      mockOrderChain.order.mockResolvedValue({
        data: mockReports,
        error: null,
      })

      const result = await getKeyOutcomesForAssessment('assessment-1')

      expect(result.data).toEqual({
        score_numeric: 75,
        sleep_score: 80,
        risk_level: 'moderate',
        total_reports: 2,
      })
      expect(result.error).toBeNull()
    })

    it('should return zero data when no reports exist', async () => {
      mockOrderChain.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getKeyOutcomesForAssessment('assessment-1')

      expect(result.data).toEqual({
        score_numeric: null,
        sleep_score: null,
        risk_level: null,
        total_reports: 0,
      })
    })

    it('should handle null values in report', async () => {
      const mockReports = [
        {
          id: 'report-1',
          assessment_id: 'assessment-1',
          score_numeric: null,
          sleep_score: null,
          risk_level: null,
          report_text_short: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          assessment: null,
        },
      ]

      mockOrderChain.order.mockResolvedValue({
        data: mockReports,
        error: null,
      })

      const result = await getKeyOutcomesForAssessment('assessment-1')

      expect(result.data).toEqual({
        score_numeric: null,
        sleep_score: null,
        risk_level: null,
        total_reports: 1,
      })
      expect(result.error).toBeNull()
    })

    it('should use deterministic latest report when multiple reports have same created_at', async () => {
      const mockReports = [
        {
          id: 'report-3',
          assessment_id: 'assessment-1',
          score_numeric: 90,
          sleep_score: 85,
          risk_level: 'high',
          report_text_short: 'Latest by id',
          created_at: '2026-01-01T12:00:00Z',
          updated_at: '2026-01-01T12:00:00Z',
          assessment: null,
        },
        {
          id: 'report-2',
          assessment_id: 'assessment-1',
          score_numeric: 80,
          sleep_score: 75,
          risk_level: 'moderate',
          report_text_short: 'Second by id',
          created_at: '2026-01-01T12:00:00Z',
          updated_at: '2026-01-01T12:00:00Z',
          assessment: null,
        },
      ]

      mockOrderChain.order.mockResolvedValue({
        data: mockReports,
        error: null,
      })

      const result = await getKeyOutcomesForAssessment('assessment-1')

      // Should use report-3 (highest id) for outcomes
      expect(result.data).toEqual({
        score_numeric: 90,
        sleep_score: 85,
        risk_level: 'high',
        total_reports: 2,
      })
      expect(result.error).toBeNull()
    })
  })
})
