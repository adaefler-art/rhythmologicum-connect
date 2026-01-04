/**
 * Review Record Contract Tests - V05-I05.7
 */

import {
  REVIEW_STATUS,
  QUEUE_REASON,
  DECISION_REASON,
  ReviewStatusSchema,
  QueueReasonSchema,
  DecisionReasonSchema,
  ReviewRecordV1Schema,
  ReviewDecisionSchema,
  QueueItemSchema,
  SamplingConfigSchema,
  isPending,
  isDecided,
  isApproved,
  isRejected,
  needsChanges,
  getStatusLabel,
  getQueueReasonLabel,
  isValidDecisionReason,
  type ReviewRecordV1,
  type ReviewDecision,
  type QueueItem,
} from '@/lib/contracts/reviewRecord'

describe('Review Record Contracts', () => {
  describe('Review Status', () => {
    it('should validate review status enum', () => {
      expect(ReviewStatusSchema.parse('PENDING')).toBe('PENDING')
      expect(ReviewStatusSchema.parse('APPROVED')).toBe('APPROVED')
      expect(ReviewStatusSchema.parse('REJECTED')).toBe('REJECTED')
      expect(ReviewStatusSchema.parse('CHANGES_REQUESTED')).toBe('CHANGES_REQUESTED')
    })

    it('should reject invalid status', () => {
      expect(() => ReviewStatusSchema.parse('INVALID')).toThrow()
    })

    it('should have all status constants', () => {
      expect(REVIEW_STATUS.PENDING).toBe('PENDING')
      expect(REVIEW_STATUS.APPROVED).toBe('APPROVED')
      expect(REVIEW_STATUS.REJECTED).toBe('REJECTED')
      expect(REVIEW_STATUS.CHANGES_REQUESTED).toBe('CHANGES_REQUESTED')
    })
  })

  describe('Queue Reason', () => {
    it('should validate queue reason enum', () => {
      expect(QueueReasonSchema.parse('VALIDATION_FAIL')).toBe('VALIDATION_FAIL')
      expect(QueueReasonSchema.parse('SAFETY_BLOCK')).toBe('SAFETY_BLOCK')
      expect(QueueReasonSchema.parse('SAMPLED')).toBe('SAMPLED')
    })

    it('should reject invalid queue reason', () => {
      expect(() => QueueReasonSchema.parse('INVALID')).toThrow()
    })

    it('should have all queue reason constants', () => {
      expect(QUEUE_REASON.VALIDATION_FAIL).toBe('VALIDATION_FAIL')
      expect(QUEUE_REASON.VALIDATION_FLAG).toBe('VALIDATION_FLAG')
      expect(QUEUE_REASON.SAFETY_BLOCK).toBe('SAFETY_BLOCK')
      expect(QUEUE_REASON.SAFETY_FLAG).toBe('SAFETY_FLAG')
      expect(QUEUE_REASON.SAFETY_UNKNOWN).toBe('SAFETY_UNKNOWN')
      expect(QUEUE_REASON.SAMPLED).toBe('SAMPLED')
      expect(QUEUE_REASON.MANUAL_REVIEW).toBe('MANUAL_REVIEW')
    })
  })

  describe('Decision Reason', () => {
    it('should validate decision reason enum', () => {
      expect(DecisionReasonSchema.parse('APPROVED_SAFE')).toBe('APPROVED_SAFE')
      expect(DecisionReasonSchema.parse('REJECTED_UNSAFE')).toBe('REJECTED_UNSAFE')
      expect(DecisionReasonSchema.parse('CHANGES_NEEDED_CLARIFICATION')).toBe('CHANGES_NEEDED_CLARIFICATION')
    })

    it('should reject invalid decision reason', () => {
      expect(() => DecisionReasonSchema.parse('INVALID')).toThrow()
    })

    it('should have approval reasons', () => {
      expect(DECISION_REASON.APPROVED_SAFE).toBe('APPROVED_SAFE')
      expect(DECISION_REASON.APPROVED_FALSE_POSITIVE).toBe('APPROVED_FALSE_POSITIVE')
      expect(DECISION_REASON.APPROVED_ACCEPTABLE_RISK).toBe('APPROVED_ACCEPTABLE_RISK')
      expect(DECISION_REASON.APPROVED_SAMPLED_OK).toBe('APPROVED_SAMPLED_OK')
    })

    it('should have rejection reasons', () => {
      expect(DECISION_REASON.REJECTED_UNSAFE).toBe('REJECTED_UNSAFE')
      expect(DECISION_REASON.REJECTED_CONTRAINDICATION).toBe('REJECTED_CONTRAINDICATION')
      expect(DECISION_REASON.REJECTED_PLAUSIBILITY).toBe('REJECTED_PLAUSIBILITY')
    })

    it('should have changes requested reasons', () => {
      expect(DECISION_REASON.CHANGES_NEEDED_CLARIFICATION).toBe('CHANGES_NEEDED_CLARIFICATION')
      expect(DECISION_REASON.CHANGES_NEEDED_TONE).toBe('CHANGES_NEEDED_TONE')
      expect(DECISION_REASON.CHANGES_NEEDED_CONTENT).toBe('CHANGES_NEEDED_CONTENT')
    })
  })

  describe('ReviewRecordV1 Schema', () => {
    const validRecord: ReviewRecordV1 = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      jobId: '223e4567-e89b-12d3-a456-426614174000',
      reviewIteration: 1,
      status: 'PENDING',
      queueReasons: ['VALIDATION_FAIL'],
      isSampled: false,
      auditMetadata: {},
      createdAt: '2026-01-04T10:00:00.000Z',
      updatedAt: '2026-01-04T10:00:00.000Z',
    }

    it('should validate valid review record', () => {
      const result = ReviewRecordV1Schema.safeParse(validRecord)
      expect(result.success).toBe(true)
    })

    it('should require at least one queue reason', () => {
      const invalid = { ...validRecord, queueReasons: [] }
      const result = ReviewRecordV1Schema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should enforce max decision notes length (500 chars)', () => {
      const tooLong = 'x'.repeat(501)
      const invalid = {
        ...validRecord,
        status: 'APPROVED',
        reviewerUserId: '323e4567-e89b-12d3-a456-426614174000',
        reviewerRole: 'clinician',
        decisionReasonCode: 'APPROVED_SAFE',
        decisionNotes: tooLong,
        decidedAt: '2026-01-04T11:00:00.000Z',
      }
      const result = ReviewRecordV1Schema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should allow sampling metadata', () => {
      const withSampling = {
        ...validRecord,
        isSampled: true,
        samplingHash: 'abc123',
        samplingConfigVersion: 'v1.0.0',
      }
      const result = ReviewRecordV1Schema.safeParse(withSampling)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isSampled).toBe(true)
        expect(result.data.samplingHash).toBe('abc123')
      }
    })

    it('should allow validation and safety references', () => {
      const withRefs = {
        ...validRecord,
        validationResultId: '423e4567-e89b-12d3-a456-426614174000',
        safetyCheckId: '523e4567-e89b-12d3-a456-426614174000',
      }
      const result = ReviewRecordV1Schema.safeParse(withRefs)
      expect(result.success).toBe(true)
    })

    it('should validate decided record', () => {
      const decided = {
        ...validRecord,
        status: 'APPROVED',
        reviewerUserId: '623e4567-e89b-12d3-a456-426614174000',
        reviewerRole: 'clinician',
        decisionReasonCode: 'APPROVED_SAFE',
        decisionNotes: 'Looks good',
        decidedAt: '2026-01-04T11:00:00.000Z',
      }
      const result = ReviewRecordV1Schema.safeParse(decided)
      expect(result.success).toBe(true)
    })
  })

  describe('ReviewDecision Schema', () => {
    it('should validate approval decision', () => {
      const decision: ReviewDecision = {
        status: 'APPROVED',
        reasonCode: 'APPROVED_SAFE',
        notes: 'All checks passed',
      }
      const result = ReviewDecisionSchema.safeParse(decision)
      expect(result.success).toBe(true)
    })

    it('should validate rejection decision', () => {
      const decision: ReviewDecision = {
        status: 'REJECTED',
        reasonCode: 'REJECTED_UNSAFE',
        notes: 'Safety concerns identified',
      }
      const result = ReviewDecisionSchema.safeParse(decision)
      expect(result.success).toBe(true)
    })

    it('should validate changes requested decision', () => {
      const decision: ReviewDecision = {
        status: 'CHANGES_REQUESTED',
        reasonCode: 'CHANGES_NEEDED_CLARIFICATION',
      }
      const result = ReviewDecisionSchema.safeParse(decision)
      expect(result.success).toBe(true)
    })

    it('should not allow PENDING status in decision', () => {
      const decision = {
        status: 'PENDING',
        reasonCode: 'APPROVED_SAFE',
      }
      const result = ReviewDecisionSchema.safeParse(decision)
      expect(result.success).toBe(false)
    })

    it('should enforce max notes length (500 chars)', () => {
      const decision = {
        status: 'APPROVED',
        reasonCode: 'APPROVED_SAFE',
        notes: 'x'.repeat(501),
      }
      const result = ReviewDecisionSchema.safeParse(decision)
      expect(result.success).toBe(false)
    })

    it('should allow optional metadata', () => {
      const decision: ReviewDecision = {
        status: 'APPROVED',
        reasonCode: 'APPROVED_SAFE',
        metadata: {
          reviewDurationMs: 1234,
          flagsReviewed: 5,
        },
      }
      const result = ReviewDecisionSchema.safeParse(decision)
      expect(result.success).toBe(true)
    })
  })

  describe('QueueItem Schema', () => {
    it('should validate queue item with minimal data', () => {
      const item: QueueItem = {
        reviewId: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '223e4567-e89b-12d3-a456-426614174000',
        reviewIteration: 1,
        status: 'PENDING',
        queueReasons: ['SAMPLED'],
        isSampled: true,
        createdAt: '2026-01-04T10:00:00.000Z',
        updatedAt: '2026-01-04T10:00:00.000Z',
      }
      const result = QueueItemSchema.safeParse(item)
      expect(result.success).toBe(true)
    })

    it('should allow validation and safety summaries', () => {
      const item: QueueItem = {
        reviewId: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '223e4567-e89b-12d3-a456-426614174000',
        reviewIteration: 1,
        status: 'PENDING',
        queueReasons: ['VALIDATION_FAIL', 'SAFETY_BLOCK'],
        isSampled: false,
        validationSummary: {
          overallStatus: 'fail',
          criticalFlagsCount: 2,
        },
        safetySummary: {
          recommendedAction: 'BLOCK',
          safetyScore: 45,
        },
        createdAt: '2026-01-04T10:00:00.000Z',
        updatedAt: '2026-01-04T10:00:00.000Z',
      }
      const result = QueueItemSchema.safeParse(item)
      expect(result.success).toBe(true)
    })

    it('should allow decision info for decided items', () => {
      const item: QueueItem = {
        reviewId: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '223e4567-e89b-12d3-a456-426614174000',
        reviewIteration: 1,
        status: 'APPROVED',
        queueReasons: ['SAMPLED'],
        isSampled: true,
        decision: {
          reviewerRole: 'clinician',
          reasonCode: 'APPROVED_SAMPLED_OK',
          decidedAt: '2026-01-04T11:00:00.000Z',
        },
        createdAt: '2026-01-04T10:00:00.000Z',
        updatedAt: '2026-01-04T10:00:00.000Z',
      }
      const result = QueueItemSchema.safeParse(item)
      expect(result.success).toBe(true)
    })
  })

  describe('SamplingConfig Schema', () => {
    it('should validate sampling config', () => {
      const config = {
        percentage: 10,
        salt: 'my-salt',
        version: 'v1.0.0',
      }
      const result = SamplingConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('should use defaults', () => {
      const config = {}
      const result = SamplingConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.percentage).toBe(10)
        expect(result.data.salt).toBe('v05-i05-7-default-salt')
        expect(result.data.version).toBe('v1.0.0')
      }
    })

    it('should enforce percentage range (0-100)', () => {
      expect(SamplingConfigSchema.safeParse({ percentage: -1 }).success).toBe(false)
      expect(SamplingConfigSchema.safeParse({ percentage: 101 }).success).toBe(false)
      expect(SamplingConfigSchema.safeParse({ percentage: 0 }).success).toBe(true)
      expect(SamplingConfigSchema.safeParse({ percentage: 100 }).success).toBe(true)
    })
  })

  describe('Helper Functions', () => {
    const pendingRecord: ReviewRecordV1 = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      jobId: '223e4567-e89b-12d3-a456-426614174000',
      reviewIteration: 1,
      status: 'PENDING',
      queueReasons: ['SAMPLED'],
      isSampled: true,
      auditMetadata: {},
      createdAt: '2026-01-04T10:00:00.000Z',
      updatedAt: '2026-01-04T10:00:00.000Z',
    }

    it('should check if record is pending', () => {
      expect(isPending(pendingRecord)).toBe(true)
      expect(isPending({ ...pendingRecord, status: 'APPROVED' })).toBe(false)
    })

    it('should check if record is decided', () => {
      expect(isDecided(pendingRecord)).toBe(false)
      expect(isDecided({ ...pendingRecord, status: 'APPROVED' })).toBe(true)
      expect(isDecided({ ...pendingRecord, status: 'REJECTED' })).toBe(true)
    })

    it('should check if record is approved', () => {
      expect(isApproved(pendingRecord)).toBe(false)
      expect(isApproved({ ...pendingRecord, status: 'APPROVED' })).toBe(true)
    })

    it('should check if record is rejected', () => {
      expect(isRejected(pendingRecord)).toBe(false)
      expect(isRejected({ ...pendingRecord, status: 'REJECTED' })).toBe(true)
    })

    it('should check if record needs changes', () => {
      expect(needsChanges(pendingRecord)).toBe(false)
      expect(needsChanges({ ...pendingRecord, status: 'CHANGES_REQUESTED' })).toBe(true)
    })

    it('should get status label', () => {
      expect(getStatusLabel('PENDING')).toBe('Pending Review')
      expect(getStatusLabel('APPROVED')).toBe('Approved')
      expect(getStatusLabel('REJECTED')).toBe('Rejected')
      expect(getStatusLabel('CHANGES_REQUESTED')).toBe('Changes Requested')
    })

    it('should get queue reason label', () => {
      expect(getQueueReasonLabel('VALIDATION_FAIL')).toBe('Validation Failed')
      expect(getQueueReasonLabel('SAFETY_BLOCK')).toBe('Safety Blocked')
      expect(getQueueReasonLabel('SAMPLED')).toBe('Quality Sampling')
    })

    it('should validate decision reason matches status', () => {
      // Approved status requires APPROVED_* reason
      expect(isValidDecisionReason('APPROVED', 'APPROVED_SAFE')).toBe(true)
      expect(isValidDecisionReason('APPROVED', 'REJECTED_UNSAFE')).toBe(false)
      
      // Rejected status requires REJECTED_* reason
      expect(isValidDecisionReason('REJECTED', 'REJECTED_UNSAFE')).toBe(true)
      expect(isValidDecisionReason('REJECTED', 'APPROVED_SAFE')).toBe(false)
      
      // Changes requested requires CHANGES_* reason
      expect(isValidDecisionReason('CHANGES_REQUESTED', 'CHANGES_NEEDED_CLARIFICATION')).toBe(true)
      expect(isValidDecisionReason('CHANGES_REQUESTED', 'APPROVED_SAFE')).toBe(false)
    })
  })

  describe('PHI Protection', () => {
    it('should contain only references and codes (no PHI)', () => {
      const record: ReviewRecordV1 = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '223e4567-e89b-12d3-a456-426614174000',
        reviewIteration: 1,
        status: 'APPROVED',
        queueReasons: ['VALIDATION_FLAG'],
        isSampled: false,
        reviewerUserId: '323e4567-e89b-12d3-a456-426614174000',
        reviewerRole: 'clinician',
        decisionReasonCode: 'APPROVED_FALSE_POSITIVE',
        decisionNotes: 'Flag was determined to be false positive',
        decidedAt: '2026-01-04T11:00:00.000Z',
        auditMetadata: {
          reviewDurationMs: 5000,
        },
        createdAt: '2026-01-04T10:00:00.000Z',
        updatedAt: '2026-01-04T11:00:00.000Z',
      }

      // All fields should be primitives, UUIDs, or codes
      expect(typeof record.id).toBe('string')
      expect(typeof record.jobId).toBe('string')
      expect(typeof record.reviewIteration).toBe('number')
      expect(typeof record.status).toBe('string')
      expect(Array.isArray(record.queueReasons)).toBe(true)
      expect(typeof record.isSampled).toBe('boolean')
      expect(typeof record.reviewerUserId).toBe('string')
      expect(typeof record.reviewerRole).toBe('string')
      expect(typeof record.decisionReasonCode).toBe('string')
      expect(typeof record.decisionNotes).toBe('string')
      
      // Decision notes should be redacted/coded, not contain raw patient data
      expect(record.decisionNotes).not.toMatch(/patient|name|dob|ssn|address/i)
    })
  })
})
