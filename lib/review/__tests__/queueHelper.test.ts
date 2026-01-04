/**
 * Queue Helper Tests - V05-I05.7
 */

import {
  evaluateForQueue,
  getDefaultSamplingConfig,
  type QueueEvaluationContext,
} from '@/lib/review/queueHelper'
import { QUEUE_REASON } from '@/lib/contracts/reviewRecord'

// Mock Supabase client
const mockSupabase = {
  rpc: jest.fn(),
} as any

describe('Review Queue Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('evaluateForQueue', () => {
    it('should queue jobs with validation FAIL', async () => {
      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        validationStatus: 'fail',
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(true)
        expect(result.data.reasons).toContain(QUEUE_REASON.VALIDATION_FAIL)
        expect(result.data.isSampled).toBe(false)
      }
    })

    it('should queue jobs with validation FLAG', async () => {
      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        validationStatus: 'flag',
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(true)
        expect(result.data.reasons).toContain(QUEUE_REASON.VALIDATION_FLAG)
      }
    })

    it('should queue jobs with safety BLOCK', async () => {
      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        safetyAction: 'BLOCK',
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(true)
        expect(result.data.reasons).toContain(QUEUE_REASON.SAFETY_BLOCK)
      }
    })

    it('should queue jobs with safety FLAG', async () => {
      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        safetyAction: 'FLAG',
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(true)
        expect(result.data.reasons).toContain(QUEUE_REASON.SAFETY_FLAG)
      }
    })

    it('should queue jobs with safety UNKNOWN', async () => {
      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        safetyAction: 'UNKNOWN',
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(true)
        expect(result.data.reasons).toContain(QUEUE_REASON.SAFETY_UNKNOWN)
      }
    })

    it('should combine multiple queue reasons', async () => {
      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        validationStatus: 'flag',
        safetyAction: 'BLOCK',
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(true)
        expect(result.data.reasons).toContain(QUEUE_REASON.VALIDATION_FLAG)
        expect(result.data.reasons).toContain(QUEUE_REASON.SAFETY_BLOCK)
        expect(result.data.reasons.length).toBe(2)
      }
    })

    it('should check sampling if no flags', async () => {
      // Mock sampling check to return true
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: true, error: null }) // should_sample_job
        .mockResolvedValueOnce({ data: 'abc123hash', error: null }) // compute_sampling_hash

      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        validationStatus: 'pass',
        safetyAction: 'PASS',
        samplingConfig: {
          percentage: 10,
          salt: 'test-salt',
          version: 'v1.0.0',
        },
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(true)
        expect(result.data.reasons).toContain(QUEUE_REASON.SAMPLED)
        expect(result.data.isSampled).toBe(true)
        expect(result.data.samplingHash).toBe('abc123hash')
        expect(result.data.samplingConfigVersion).toBe('v1.0.0')
      }

      expect(mockSupabase.rpc).toHaveBeenCalledWith('should_sample_job', {
        p_job_id: '123e4567-e89b-12d3-a456-426614174000',
        p_sampling_percentage: 10,
        p_salt: 'test-salt',
      })
    })

    it('should not queue if no flags and sampling returns false', async () => {
      // Mock sampling check to return false
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: false, error: null }) // should_sample_job
        .mockResolvedValueOnce({ data: 'hash123', error: null }) // compute_sampling_hash

      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        validationStatus: 'pass',
        safetyAction: 'PASS',
        samplingConfig: {
          percentage: 10,
          salt: 'test-salt',
          version: 'v1.0.0',
        },
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(false)
        expect(result.data.reasons.length).toBe(0)
        expect(result.data.isSampled).toBe(false)
      }
    })

    it('should not check sampling if flags are present', async () => {
      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        validationStatus: 'fail',
        samplingConfig: {
          percentage: 10,
          salt: 'test-salt',
          version: 'v1.0.0',
        },
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(true)
        expect(result.data.reasons).toContain(QUEUE_REASON.VALIDATION_FAIL)
        expect(result.data.isSampled).toBe(false)
      }

      // Should not call sampling RPC if flags are present
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('should fail-safe to MANUAL_REVIEW if sampling check fails', async () => {
      // Mock sampling check to fail
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Sampling check failed' } 
      })

      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        validationStatus: 'pass',
        safetyAction: 'PASS',
        samplingConfig: {
          percentage: 10,
          salt: 'test-salt',
          version: 'v1.0.0',
        },
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(true)
        expect(result.data.reasons).toContain(QUEUE_REASON.MANUAL_REVIEW)
      }
    })

    it('should not queue if no flags and no sampling config', async () => {
      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        validationStatus: 'pass',
        safetyAction: 'PASS',
        // No sampling config
      }

      const result = await evaluateForQueue(mockSupabase, context)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shouldQueue).toBe(false)
        expect(result.data.reasons.length).toBe(0)
      }
    })
  })

  describe('getDefaultSamplingConfig', () => {
    const originalEnv = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should return default config', () => {
      const config = getDefaultSamplingConfig()

      expect(config.percentage).toBe(10)
      expect(config.salt).toBe('v05-i05-7-default-salt')
      expect(config.version).toBe('v1.0.0')
    })

    it('should use env var for percentage', () => {
      process.env.REVIEW_SAMPLING_PERCENTAGE = '25'

      const config = getDefaultSamplingConfig()

      expect(config.percentage).toBe(25)
    })

    it('should use env var for salt', () => {
      process.env.REVIEW_SAMPLING_SALT = 'custom-salt'

      const config = getDefaultSamplingConfig()

      expect(config.salt).toBe('custom-salt')
    })

    it('should clamp percentage to 0-100 range', () => {
      process.env.REVIEW_SAMPLING_PERCENTAGE = '-10'
      expect(getDefaultSamplingConfig().percentage).toBe(0)

      process.env.REVIEW_SAMPLING_PERCENTAGE = '150'
      expect(getDefaultSamplingConfig().percentage).toBe(100)

      process.env.REVIEW_SAMPLING_PERCENTAGE = '50'
      expect(getDefaultSamplingConfig().percentage).toBe(50)
    })
  })

  describe('Deterministic Sampling', () => {
    it('should use stable hash for sampling decision', async () => {
      // Mock consistent hash results
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: 'stable-hash-123', error: null })

      const context: QueueEvaluationContext = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        samplingConfig: {
          percentage: 10,
          salt: 'test-salt',
          version: 'v1.0.0',
        },
      }

      const result1 = await evaluateForQueue(mockSupabase, context)
      
      // Reset mocks and call again with same inputs
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: 'stable-hash-123', error: null })

      const result2 = await evaluateForQueue(mockSupabase, context)

      // Same inputs should give same result
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      
      if (result1.success && result2.success) {
        expect(result1.data.shouldQueue).toBe(result2.data.shouldQueue)
        expect(result1.data.isSampled).toBe(result2.data.isSampled)
        expect(result1.data.samplingHash).toBe(result2.data.samplingHash)
      }
    })
  })
})
