/**
 * Unit Tests for Delivery Contracts (V05-I05.9)
 */

import {
  validateDeliveryStatusInput,
  validateTriggerDeliveryInput,
  validateCreateNotificationInput,
  validateListNotificationsInput,
  isDeliverySuccess,
  isDeliveryFailure,
  DeliveryStatus,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '../delivery'

describe('Delivery Contracts - Input Validation', () => {
  describe('validateDeliveryStatusInput', () => {
    it('should validate correct input', () => {
      const input = {
        jobId: '12345678-1234-1234-1234-123456789012',
      }
      const result = validateDeliveryStatusInput(input)
      expect(result.jobId).toBe(input.jobId)
    })

    it('should reject invalid UUID', () => {
      const input = {
        jobId: 'not-a-uuid',
      }
      expect(() => validateDeliveryStatusInput(input)).toThrow()
    })

    it('should reject missing jobId', () => {
      const input = {}
      expect(() => validateDeliveryStatusInput(input)).toThrow()
    })
  })

  describe('validateTriggerDeliveryInput', () => {
    it('should validate input with jobId only', () => {
      const input = {
        jobId: '12345678-1234-1234-1234-123456789012',
      }
      const result = validateTriggerDeliveryInput(input)
      expect(result.jobId).toBe(input.jobId)
      expect(result.force).toBeUndefined()
    })

    it('should validate input with force flag', () => {
      const input = {
        jobId: '12345678-1234-1234-1234-123456789012',
        force: true,
      }
      const result = validateTriggerDeliveryInput(input)
      expect(result.jobId).toBe(input.jobId)
      expect(result.force).toBe(true)
    })
  })

  describe('validateCreateNotificationInput', () => {
    it('should validate correct notification input', () => {
      const input = {
        userId: '12345678-1234-1234-1234-123456789012',
        jobId: '87654321-4321-4321-4321-210987654321',
        notificationType: NotificationType.REPORT_READY,
        channel: NotificationChannel.IN_APP,
        priority: NotificationPriority.MEDIUM,
        subject: 'Test Notification',
        message: 'This is a test notification',
      }
      const result = validateCreateNotificationInput(input)
      expect(result.userId).toBe(input.userId)
      expect(result.notificationType).toBe(NotificationType.REPORT_READY)
      expect(result.channel).toBe(NotificationChannel.IN_APP)
    })

    it('should reject subject longer than 200 chars', () => {
      const input = {
        userId: '12345678-1234-1234-1234-123456789012',
        notificationType: NotificationType.REPORT_READY,
        subject: 'a'.repeat(201),
        message: 'Test message',
      }
      expect(() => validateCreateNotificationInput(input)).toThrow()
    })

    it('should reject message longer than 2000 chars', () => {
      const input = {
        userId: '12345678-1234-1234-1234-123456789012',
        notificationType: NotificationType.REPORT_READY,
        subject: 'Test subject',
        message: 'a'.repeat(2001),
      }
      expect(() => validateCreateNotificationInput(input)).toThrow()
    })

    it('should apply default channel and priority', () => {
      const input = {
        userId: '12345678-1234-1234-1234-123456789012',
        notificationType: NotificationType.REPORT_READY,
        subject: 'Test subject',
        message: 'Test message',
      }
      const result = validateCreateNotificationInput(input)
      expect(result.channel).toBe('in_app')
      expect(result.priority).toBe('medium')
    })
  })

  describe('validateListNotificationsInput', () => {
    it('should validate with default values', () => {
      const input = {}
      const result = validateListNotificationsInput(input)
      expect(result.limit).toBe(50)
      expect(result.offset).toBe(0)
    })

    it('should cap limit at 100', () => {
      const input = {
        limit: 200,
      }
      const result = validateListNotificationsInput(input)
      expect(result.limit).toBe(100)
    })

    it('should validate filters', () => {
      const input = {
        userId: '12345678-1234-1234-1234-123456789012',
        status: 'READ',
        unreadOnly: true,
        limit: 25,
        offset: 10,
      }
      const result = validateListNotificationsInput(input)
      expect(result.userId).toBe(input.userId)
      expect(result.status).toBe('READ')
      expect(result.unreadOnly).toBe(true)
      expect(result.limit).toBe(25)
      expect(result.offset).toBe(10)
    })
  })
})

describe('Delivery Contracts - Type Guards', () => {
  describe('isDeliverySuccess', () => {
    it('should return true for success result', () => {
      const result = {
        success: true as const,
        jobId: '12345678-1234-1234-1234-123456789012',
        deliveryStatus: 'DELIVERED' as const,
        deliveryTimestamp: new Date().toISOString(),
        notificationIds: ['notification-1'],
      }
      expect(isDeliverySuccess(result)).toBe(true)
    })

    it('should return false for failure result', () => {
      const result = {
        success: false as const,
        error: 'Test error',
        code: 'TEST_ERROR',
        retryable: false,
      }
      expect(isDeliverySuccess(result)).toBe(false)
    })
  })

  describe('isDeliveryFailure', () => {
    it('should return true for failure result', () => {
      const result = {
        success: false as const,
        error: 'Test error',
        code: 'TEST_ERROR',
        retryable: false,
      }
      expect(isDeliveryFailure(result)).toBe(true)
    })

    it('should return false for success result', () => {
      const result = {
        success: true as const,
        jobId: '12345678-1234-1234-1234-123456789012',
        deliveryStatus: 'DELIVERED' as const,
        deliveryTimestamp: new Date().toISOString(),
        notificationIds: ['notification-1'],
      }
      expect(isDeliveryFailure(result)).toBe(false)
    })
  })
})

describe('Delivery Contracts - Strict Schema Validation', () => {
  it('should reject unknown keys in DeliveryMetadataSchema', () => {
    const invalid = {
      notificationIds: ['12345678-1234-1234-1234-123456789012'],
      unknownField: 'should be rejected',
    }
    expect(() => DeliveryMetadataSchema.parse(invalid)).toThrow()
  })

  it('should reject unknown keys in NotificationMetadataSchema', () => {
    const invalid = {
      downloadUrl: 'https://example.com/download',
      unknownField: 'should be rejected',
    }
    expect(() => NotificationMetadataSchema.parse(invalid)).toThrow()
  })

  it('should reject unknown keys in CreateNotificationInputSchema', () => {
    const invalid = {
      userId: '12345678-1234-1234-1234-123456789012',
      notificationType: 'REPORT_READY',
      subject: 'Test',
      message: 'Test message',
      unknownField: 'should be rejected',
    }
    expect(() => validateCreateNotificationInput(invalid)).toThrow()
  })

  it('should enforce max lengths in schemas', () => {
    const invalidSubject = {
      userId: '12345678-1234-1234-1234-123456789012',
      notificationType: 'REPORT_READY',
      subject: 'a'.repeat(201), // Exceeds 200 char limit
      message: 'Test message',
    }
    expect(() => validateCreateNotificationInput(invalidSubject)).toThrow()

    const invalidMessage = {
      userId: '12345678-1234-1234-1234-123456789012',
      notificationType: 'REPORT_READY',
      subject: 'Test',
      message: 'a'.repeat(2001), // Exceeds 2000 char limit
    }
    expect(() => validateCreateNotificationInput(invalidMessage)).toThrow()
  })

  it('should enforce bounded arrays in metadata', () => {
    const invalidMetadata = {
      errors: Array(11).fill({
        code: 'ERROR',
        message: 'Error message',
        timestamp: new Date().toISOString(),
      }), // Exceeds 10 item limit
    }
    expect(() => DeliveryMetadataSchema.parse(invalidMetadata)).toThrow()
  })
})
