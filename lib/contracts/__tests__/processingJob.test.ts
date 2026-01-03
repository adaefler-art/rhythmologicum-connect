/**
 * Tests for Processing Job Contract (V05-I05.1)
 */

import {
  PROCESSING_STAGE,
  PROCESSING_STATUS,
  ProcessingJobV1Schema,
  CreateProcessingJobInputSchema,
  getNextStage,
  isTerminalStage,
  generateCorrelationId,
  canRetry,
  redactError,
  isValidProcessingStage,
  isValidProcessingStatus,
} from '../processingJob'

describe('ProcessingJob Contract', () => {
  describe('Stage Progression', () => {
    it('should return correct next stage', () => {
      expect(getNextStage(PROCESSING_STAGE.PENDING)).toBe(PROCESSING_STAGE.RISK)
      expect(getNextStage(PROCESSING_STAGE.RISK)).toBe(PROCESSING_STAGE.RANKING)
      expect(getNextStage(PROCESSING_STAGE.DELIVERY)).toBe(PROCESSING_STAGE.COMPLETED)
      expect(getNextStage(PROCESSING_STAGE.COMPLETED)).toBeNull()
      expect(getNextStage(PROCESSING_STAGE.FAILED)).toBeNull()
    })

    it('should identify terminal stages', () => {
      expect(isTerminalStage(PROCESSING_STAGE.COMPLETED)).toBe(true)
      expect(isTerminalStage(PROCESSING_STAGE.FAILED)).toBe(true)
      expect(isTerminalStage(PROCESSING_STAGE.PENDING)).toBe(false)
      expect(isTerminalStage(PROCESSING_STAGE.RISK)).toBe(false)
    })
  })

  describe('ProcessingJobV1Schema', () => {
    it('should validate a valid job', () => {
      const validJob = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        assessmentId: '223e4567-e89b-12d3-a456-426614174001',
        correlationId: 'assessment-223e4567-e89b-12d3-a456-426614174001-1234567890',
        status: PROCESSING_STATUS.QUEUED,
        stage: PROCESSING_STAGE.PENDING,
        attempt: 1,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        errors: [],
        schemaVersion: 'v1',
      }

      const result = ProcessingJobV1Schema.safeParse(validJob)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const invalidJob = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        assessmentId: '223e4567-e89b-12d3-a456-426614174001',
        correlationId: 'test-correlation',
        status: 'invalid_status',
        stage: PROCESSING_STAGE.PENDING,
        attempt: 1,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        errors: [],
        schemaVersion: 'v1',
      }

      const result = ProcessingJobV1Schema.safeParse(invalidJob)
      expect(result.success).toBe(false)
    })

    it('should enforce attempt bounds', () => {
      const invalidJob = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        assessmentId: '223e4567-e89b-12d3-a456-426614174001',
        correlationId: 'test-correlation',
        status: PROCESSING_STATUS.QUEUED,
        stage: PROCESSING_STAGE.PENDING,
        attempt: 0, // Invalid: must be >= 1
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        errors: [],
        schemaVersion: 'v1',
      }

      const result = ProcessingJobV1Schema.safeParse(invalidJob)
      expect(result.success).toBe(false)
    })
  })

  describe('CreateProcessingJobInputSchema', () => {
    it('should validate valid input', () => {
      const validInput = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174001',
        correlationId: 'optional-correlation-id',
      }

      const result = CreateProcessingJobInputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should allow missing correlationId', () => {
      const validInput = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174001',
      }

      const result = CreateProcessingJobInputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidInput = {
        assessmentId: 'not-a-uuid',
      }

      const result = CreateProcessingJobInputSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('Helper Functions', () => {
    it('should generate correlation ID', () => {
      const assessmentId = '223e4567-e89b-12d3-a456-426614174001'
      const correlationId = generateCorrelationId(assessmentId)
      
      expect(correlationId).toContain(assessmentId)
      expect(correlationId).toMatch(/^assessment-/)
    })

    it('should check retry capability', () => {
      const retryableJob = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        assessmentId: '223e4567-e89b-12d3-a456-426614174001',
        correlationId: 'test',
        status: PROCESSING_STATUS.IN_PROGRESS,
        stage: PROCESSING_STAGE.RISK,
        attempt: 1,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        errors: [],
        schemaVersion: 'v1' as const,
      }

      expect(canRetry(retryableJob)).toBe(true)

      const exhaustedJob = { ...retryableJob, attempt: 3, maxAttempts: 3 }
      expect(canRetry(exhaustedJob)).toBe(false)

      const completedJob = { ...retryableJob, stage: PROCESSING_STAGE.COMPLETED }
      expect(canRetry(completedJob)).toBe(false)
    })

    it('should redact error messages', () => {
      const error = new Error(
        'Failed for user john.doe@example.com with UUID 123e4567-e89b-12d3-a456-426614174000 born 1990-05-15',
      )
      
      const redacted = redactError(error, PROCESSING_STAGE.RISK, 1)

      expect(redacted.message).not.toContain('john.doe@example.com')
      expect(redacted.message).not.toContain('123e4567-e89b-12d3-a456-426614174000')
      expect(redacted.message).not.toContain('1990-05-15')
      expect(redacted.message).toContain('[REDACTED-EMAIL]')
      expect(redacted.message).toContain('[REDACTED-UUID]')
      expect(redacted.message).toContain('[REDACTED-DATE]')
      expect(redacted.stage).toBe(PROCESSING_STAGE.RISK)
      expect(redacted.attempt).toBe(1)
    })

    it('should truncate long error messages', () => {
      const longMessage = 'x'.repeat(600)
      const error = new Error(longMessage)
      
      const redacted = redactError(error, PROCESSING_STAGE.CONTENT, 2)

      expect(redacted.message.length).toBeLessThan(600)
      expect(redacted.message).toContain('[truncated]')
    })
  })

  describe('Type Guards', () => {
    it('should validate processing stages', () => {
      expect(isValidProcessingStage(PROCESSING_STAGE.PENDING)).toBe(true)
      expect(isValidProcessingStage(PROCESSING_STAGE.COMPLETED)).toBe(true)
      expect(isValidProcessingStage('invalid_stage')).toBe(false)
      expect(isValidProcessingStage(null)).toBe(false)
      expect(isValidProcessingStage(undefined)).toBe(false)
    })

    it('should validate processing statuses', () => {
      expect(isValidProcessingStatus(PROCESSING_STATUS.QUEUED)).toBe(true)
      expect(isValidProcessingStatus(PROCESSING_STATUS.FAILED)).toBe(true)
      expect(isValidProcessingStatus('invalid_status')).toBe(false)
      expect(isValidProcessingStatus(123)).toBe(false)
    })
  })
})
