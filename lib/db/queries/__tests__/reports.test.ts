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

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(),
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

      mockSupabase.order.mockResolvedValue({
        data: mockReports,
        error: null,
      })

      const result = await getReportsForAssessment('assessment-1')

      expect(result.data).toEqual(mockReports)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('reports')
      expect(mockSupabase.eq).toHaveBeenCalledWith('assessment_id', 'assessment-1')
    })

    it('should return empty array when no reports exist', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getReportsForAssessment('assessment-1')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should handle database errors', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await getReportsForAssessment('assessment-1')

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('Database error')
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

      mockSupabase.order.mockResolvedValue({
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
      mockSupabase.order.mockResolvedValue({
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

      mockSupabase.order.mockResolvedValue({
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
  })
})
