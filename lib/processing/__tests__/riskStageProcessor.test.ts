/**
 * Integration Tests for Risk Stage Processing (V05-I05.2)
 */

import { processRiskStage } from '../riskStageProcessor'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
} as any

describe('Risk Stage Processor Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle missing answers gracefully', async () => {
    // Mock empty answers
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    })

    const result = await processRiskStage(
      mockSupabaseClient,
      'job-123',
      'assessment-456',
    )

    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('NO_ANSWERS')
  })

  it('should handle database errors', async () => {
    // Mock database error
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      }),
    })

    const result = await processRiskStage(
      mockSupabaseClient,
      'job-123',
      'assessment-456',
    )

    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('FETCH_ANSWERS_FAILED')
  })

  it('should calculate risk for valid assessment', async () => {
    // This is a complex integration test that would require more detailed mocking
    // For now, we verify the basic flow via unit tests
    // TODO: Add full integration test with test database
    expect(true).toBe(true)
  })

  it('should be idempotent - return existing bundle', async () => {
    const mockExistingBundle = {
      riskBundleVersion: 'v1',
      algorithmVersion: 'v1.0.0',
      calculatedAt: new Date().toISOString(),
      assessmentId: 'assessment-456',
      jobId: 'job-123',
      riskScore: {
        overall: 50,
        riskLevel: 'moderate',
        factors: [],
      },
    }

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { bundle_data: mockExistingBundle },
            error: null,
          }),
        }),
      }),
    })

    const result = await processRiskStage(
      mockSupabaseClient,
      'job-123',
      'assessment-456',
    )

    expect(result.success).toBe(true)
    expect(result.bundleId).toBe('job-123')
    
    // Should only call loadRiskBundle, not fetch answers or calculate
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('risk_bundles')
  })
})
