/**
 * Unit Tests for Document Confirmation Server Actions (V05-I04.3)
 * 
 * Tests for auth-first pattern, ownership verification, payload validation,
 * and idempotent persistence
 */

import { saveDocumentConfirmation, getDocumentForConfirmation } from '../confirmations'
import { FIELD_STATUS } from '@/lib/types/extraction'

// Mock Supabase client
jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

// Mock audit logging
jest.mock('@/lib/audit', () => ({
  logAuditEvent: jest.fn(),
}))

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { logAuditEvent } from '@/lib/audit'

describe('Document Confirmation Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('saveDocumentConfirmation', () => {
    describe('Auth-first pattern', () => {
      it('should check authentication BEFORE validating payload', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: new Error('Not authenticated'),
            }),
          },
        }
        ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

        // Invalid payload (missing required fields)
        const result = await saveDocumentConfirmation({
          document_id: 'not-a-uuid', // Invalid UUID
          confirmed_data: {} as any,
        })

        // Should fail auth BEFORE validation
        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('AUTHENTICATION_REQUIRED')
        expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1)
      })

      it('should reject unauthenticated requests immediately', async () => {
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: null,
            }),
          },
        }
        ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

        const result = await saveDocumentConfirmation({
          document_id: '123e4567-e89b-12d3-a456-426614174000',
          confirmed_data: {
            field_confirmations: {},
          },
        })

        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('AUTHENTICATION_REQUIRED')
      })
    })

    describe('Payload validation', () => {
      it('should reject invalid document_id format', async () => {
        const mockUser = { id: 'user123' }
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
        }
        ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

        const result = await saveDocumentConfirmation({
          document_id: 'not-a-uuid',
          confirmed_data: {
            field_confirmations: {},
          },
        })

        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('VALIDATION_ERROR')
      })

      it('should reject missing confirmed_data', async () => {
        const mockUser = { id: 'user123' }
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
        }
        ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

        const result = await saveDocumentConfirmation({
          document_id: '123e4567-e89b-12d3-a456-426614174000',
        } as any)

        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('VALIDATION_ERROR')
      })
    })

    describe('Ownership verification', () => {
      it('should deny access to documents owned by other users', async () => {
        const mockUser = { id: 'user123' }
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'doc123',
                    assessment_id: 'assessment456',
                    assessments: {
                      id: 'assessment456',
                      patient_id: 'different-user', // Different owner
                    },
                  },
                  error: null,
                }),
              })),
            })),
          })),
        }
        ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

        const result = await saveDocumentConfirmation({
          document_id: '123e4567-e89b-12d3-a456-426614174000',
          confirmed_data: {
            field_confirmations: {},
          },
        })

        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('AUTHORIZATION_FAILED')
      })

      it('should deny access to non-existent documents', async () => {
        const mockUser = { id: 'user123' }
        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error('Not found'),
                }),
              })),
            })),
          })),
        }
        ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

        const result = await saveDocumentConfirmation({
          document_id: '123e4567-e89b-12d3-a456-426614174000',
          confirmed_data: {
            field_confirmations: {},
          },
        })

        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('AUTHORIZATION_FAILED')
      })
    })

    describe('Idempotent persistence', () => {
      it('should allow saving same confirmation multiple times', async () => {
        const mockUser = { id: 'user123' }
        const docId = '123e4567-e89b-12d3-a456-426614174000'
        const confirmedAt = new Date().toISOString()

        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
          from: jest.fn((table: string) => {
            if (table === 'documents') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({
                      data: {
                        id: docId,
                        assessment_id: 'assessment456',
                        assessments: {
                          id: 'assessment456',
                          patient_id: mockUser.id,
                        },
                      },
                      error: null,
                    }),
                  })),
                })),
                update: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    select: jest.fn(() => ({
                      single: jest.fn().mockResolvedValue({
                        data: {
                          id: docId,
                          confirmed_at: confirmedAt,
                        },
                        error: null,
                      }),
                    })),
                  })),
                })),
              }
            }
            return {}
          }),
        }
        ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

        const confirmationPayload = {
          document_id: docId,
          confirmed_data: {
            lab_values: [{ test_name: 'Glucose', value: 95 }],
            field_confirmations: {
              'lab_values[0]': {
                status: FIELD_STATUS.ACCEPTED,
                confirmed_at: confirmedAt,
              },
            },
          },
        }

        // First save
        const result1 = await saveDocumentConfirmation(confirmationPayload)
        expect(result1.success).toBe(true)

        // Second save (idempotent)
        const result2 = await saveDocumentConfirmation(confirmationPayload)
        expect(result2.success).toBe(true)

        // Should use UPDATE, not INSERT (idempotent)
        expect(mockSupabase.from).toHaveBeenCalledWith('documents')
      })
    })

    describe('PHI-safe logging', () => {
      it('should log only metadata, not extracted values', async () => {
        const mockUser = { id: 'user123' }
        const docId = '123e4567-e89b-12d3-a456-426614174000'

        const mockSupabase = {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
          from: jest.fn((table: string) => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: docId,
                    assessment_id: 'assessment456',
                    assessments: {
                      id: 'assessment456',
                      patient_id: mockUser.id,
                    },
                  },
                  error: null,
                }),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: docId,
                      confirmed_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        }
        ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

        await saveDocumentConfirmation({
          document_id: docId,
          confirmed_data: {
            lab_values: [{ test_name: 'Glucose', value: 95, unit: 'mg/dL' }],
            field_confirmations: {
              'lab_values[0]': {
                status: FIELD_STATUS.EDITED,
                original_value: { test_name: 'Glucose', value: 90 },
                confirmed_value: { test_name: 'Glucose', value: 95 },
                confirmed_at: new Date().toISOString(),
              },
            },
          },
        })

        expect(logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            entity_type: 'document',
            entity_id: docId,
            action: 'update',
            metadata: expect.objectContaining({
              operation: 'confirmation_saved',
              field_count: 1,
              has_edits: true,
              has_rejections: false,
            }),
          }),
        )

        // Verify NO PHI in metadata
        const auditCall = (logAuditEvent as jest.Mock).mock.calls[0][0]
        expect(JSON.stringify(auditCall.metadata)).not.toContain('Glucose')
        expect(JSON.stringify(auditCall.metadata)).not.toContain('95')
        expect(JSON.stringify(auditCall.metadata)).not.toContain('mg/dL')
      })
    })
  })

  describe('getDocumentForConfirmation', () => {
    it('should check authentication before fetching document', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      }
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const result = await getDocumentForConfirmation('123e4567-e89b-12d3-a456-426614174000')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('AUTHENTICATION_REQUIRED')
    })

    it('should deny access to documents owned by other users', async () => {
      const mockUser = { id: 'user123' }
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'doc123',
                  assessment_id: 'assessment456',
                  assessments: {
                    id: 'assessment456',
                    patient_id: 'different-user',
                  },
                },
                error: null,
              }),
            })),
          })),
        })),
      }
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const result = await getDocumentForConfirmation('123e4567-e89b-12d3-a456-426614174000')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('AUTHORIZATION_FAILED')
    })

    it('should handle missing extraction data gracefully', async () => {
      const mockUser = { id: 'user123' }
      const docId = '123e4567-e89b-12d3-a456-426614174000'

      // Create separate mocks for each call
      const mockSelectForOwnership = jest.fn().mockResolvedValue({
        data: {
          id: docId,
          assessment_id: 'assessment456',
          assessments: {
            id: 'assessment456',
            patient_id: mockUser.id,
          },
        },
        error: null,
      })

      const mockSelectForDocument = jest.fn().mockResolvedValue({
        data: {
          id: docId,
          extracted_json: null, // No extraction yet
          confidence_json: null,
          confirmed_data: null,
          confirmed_at: null,
        },
        error: null,
      })

      let callCount = 0
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn((table: string) => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: () => {
                callCount++
                return callCount === 1 ? mockSelectForOwnership() : mockSelectForDocument()
              },
            })),
          })),
        })),
      }
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

      const result = await getDocumentForConfirmation(docId)

      expect(result.success).toBe(true)
      expect(result.data?.extracted_data).toEqual({})
      expect(result.data?.confidence).toEqual({})
    })
  })
})
