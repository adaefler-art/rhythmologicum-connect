/**
 * Unit Tests for Confirmation Types and Helpers (V05-I04.3)
 * 
 * Tests confirmation schemas, field status tracking, and helper functions
 */

import {
  ConfirmationDataSchema,
  FieldConfirmationSchema,
  SaveConfirmationRequestSchema,
  FIELD_STATUS,
  isLowConfidence,
  getConfirmationSummary,
  type FieldConfirmation,
} from '@/lib/types/extraction'

describe('Confirmation Schemas', () => {
  describe('FieldConfirmationSchema', () => {
    it('should validate accepted field confirmation', () => {
      const validConfirmation = {
        status: 'accepted',
        original_value: 'test value',
        confirmed_value: 'test value',
        confirmed_at: new Date().toISOString(),
      }

      const result = FieldConfirmationSchema.safeParse(validConfirmation)
      expect(result.success).toBe(true)
    })

    it('should validate edited field confirmation', () => {
      const validConfirmation = {
        status: 'edited',
        original_value: 'old value',
        confirmed_value: 'new value',
        confirmed_at: new Date().toISOString(),
      }

      const result = FieldConfirmationSchema.safeParse(validConfirmation)
      expect(result.success).toBe(true)
    })

    it('should validate rejected field confirmation without confirmed_value', () => {
      const validConfirmation = {
        status: 'rejected',
        original_value: 'test value',
        confirmed_at: new Date().toISOString(),
      }

      const result = FieldConfirmationSchema.safeParse(validConfirmation)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const invalidConfirmation = {
        status: 'invalid_status',
        confirmed_at: new Date().toISOString(),
      }

      const result = FieldConfirmationSchema.safeParse(invalidConfirmation)
      expect(result.success).toBe(false)
    })

    it('should allow numeric and complex values', () => {
      const validConfirmation = {
        status: 'accepted',
        original_value: { test: 'complex', nested: { value: 123 } },
        confirmed_value: { test: 'complex', nested: { value: 123 } },
        confirmed_at: new Date().toISOString(),
      }

      const result = FieldConfirmationSchema.safeParse(validConfirmation)
      expect(result.success).toBe(true)
    })
  })

  describe('ConfirmationDataSchema', () => {
    it('should validate complete confirmation data with all fields', () => {
      const validData = {
        lab_values: [
          {
            test_name: 'Glucose',
            value: 95,
            unit: 'mg/dL',
            date: '2024-01-01',
          },
        ],
        medications: [
          {
            name: 'Aspirin',
            dosage: '81mg',
            frequency: 'daily',
          },
        ],
        vital_signs: {
          blood_pressure: '120/80',
          heart_rate: 72,
        },
        diagnoses: ['Hypertension'],
        notes: 'Patient is doing well',
        field_confirmations: {
          'lab_values[0]': {
            status: 'accepted',
            original_value: { test_name: 'Glucose', value: 95 },
            confirmed_value: { test_name: 'Glucose', value: 95 },
            confirmed_at: new Date().toISOString(),
          },
        },
      }

      const result = ConfirmationDataSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate partial confirmation data', () => {
      const validData = {
        lab_values: [
          {
            test_name: 'Glucose',
            value: 95,
          },
        ],
        field_confirmations: {
          'lab_values[0]': {
            status: 'accepted',
            confirmed_at: new Date().toISOString(),
          },
        },
      }

      const result = ConfirmationDataSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid field confirmations', () => {
      const invalidData = {
        lab_values: [],
        field_confirmations: {
          field1: {
            status: 'invalid_status',
            confirmed_at: new Date().toISOString(),
          },
        },
      }

      const result = ConfirmationDataSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('SaveConfirmationRequestSchema', () => {
    it('should validate save confirmation request', () => {
      const validRequest = {
        document_id: '123e4567-e89b-12d3-a456-426614174000',
        confirmed_data: {
          lab_values: [],
          field_confirmations: {},
        },
      }

      const result = SaveConfirmationRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject invalid document_id', () => {
      const invalidRequest = {
        document_id: 'not-a-uuid',
        confirmed_data: {
          field_confirmations: {},
        },
      }

      const result = SaveConfirmationRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidRequest = {
        document_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = SaveConfirmationRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })
})

describe('Confirmation Helper Functions', () => {
  describe('isLowConfidence', () => {
    it('should return true for confidence below default threshold (0.7)', () => {
      expect(isLowConfidence(0.5)).toBe(true)
      expect(isLowConfidence(0.69)).toBe(true)
      expect(isLowConfidence(0.0)).toBe(true)
    })

    it('should return false for confidence at or above default threshold', () => {
      expect(isLowConfidence(0.7)).toBe(false)
      expect(isLowConfidence(0.8)).toBe(false)
      expect(isLowConfidence(1.0)).toBe(false)
    })

    it('should respect custom threshold', () => {
      expect(isLowConfidence(0.75, 0.8)).toBe(true)
      expect(isLowConfidence(0.85, 0.8)).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isLowConfidence(0, 0.1)).toBe(true)
      expect(isLowConfidence(1, 0.9)).toBe(false)
    })
  })

  describe('getConfirmationSummary', () => {
    it('should count confirmations by status', () => {
      const confirmations: Record<string, FieldConfirmation> = {
        field1: {
          status: FIELD_STATUS.ACCEPTED,
          confirmed_at: new Date().toISOString(),
        },
        field2: {
          status: FIELD_STATUS.ACCEPTED,
          confirmed_at: new Date().toISOString(),
        },
        field3: {
          status: FIELD_STATUS.EDITED,
          original_value: 'old',
          confirmed_value: 'new',
          confirmed_at: new Date().toISOString(),
        },
        field4: {
          status: FIELD_STATUS.REJECTED,
          original_value: 'test',
          confirmed_at: new Date().toISOString(),
        },
      }

      const summary = getConfirmationSummary(confirmations)

      expect(summary.total).toBe(4)
      expect(summary.accepted).toBe(2)
      expect(summary.edited).toBe(1)
      expect(summary.rejected).toBe(1)
    })

    it('should handle empty confirmations', () => {
      const summary = getConfirmationSummary({})

      expect(summary.total).toBe(0)
      expect(summary.accepted).toBe(0)
      expect(summary.edited).toBe(0)
      expect(summary.rejected).toBe(0)
    })

    it('should handle all accepted confirmations', () => {
      const confirmations: Record<string, FieldConfirmation> = {
        field1: { status: FIELD_STATUS.ACCEPTED, confirmed_at: new Date().toISOString() },
        field2: { status: FIELD_STATUS.ACCEPTED, confirmed_at: new Date().toISOString() },
        field3: { status: FIELD_STATUS.ACCEPTED, confirmed_at: new Date().toISOString() },
      }

      const summary = getConfirmationSummary(confirmations)

      expect(summary.total).toBe(3)
      expect(summary.accepted).toBe(3)
      expect(summary.edited).toBe(0)
      expect(summary.rejected).toBe(0)
    })
  })
})

describe('Field Status Constants', () => {
  it('should have correct field status values', () => {
    expect(FIELD_STATUS.ACCEPTED).toBe('accepted')
    expect(FIELD_STATUS.EDITED).toBe('edited')
    expect(FIELD_STATUS.REJECTED).toBe('rejected')
  })

  it('should be usable in type guards', () => {
    const testStatus: string = 'accepted'
    const isValidStatus = Object.values(FIELD_STATUS).includes(testStatus as any)
    expect(isValidStatus).toBe(true)
  })
})
