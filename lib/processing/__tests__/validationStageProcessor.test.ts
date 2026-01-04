/**
 * Validation Stage Processor Tests - V05-I05.5
 */

import { processValidationStage } from '@/lib/processing/validationStageProcessor'
import type { ReportSectionsV1 } from '@/lib/contracts/reportSections'

// Mock dependencies
jest.mock('@/lib/sections/persistence')
jest.mock('@/lib/validation/medical/validator')
jest.mock('@/lib/validation/medical/persistence')

import { loadReportSections } from '@/lib/sections/persistence'
import { validateReportSections } from '@/lib/validation/medical/validator'
import { saveMedicalValidation } from '@/lib/validation/medical/persistence'
import { VALIDATION_STATUS } from '@/lib/contracts/medicalValidation'

const mockLoadReportSections = loadReportSections as jest.MockedFunction<typeof loadReportSections>
const mockValidateReportSections = validateReportSections as jest.MockedFunction<typeof validateReportSections>
const mockSaveMedicalValidation = saveMedicalValidation as jest.MockedFunction<typeof saveMedicalValidation>

describe('Validation Stage Processor', () => {
  const mockSupabase = {} as any
  const jobId = '323e4567-e89b-12d3-a456-426614174000'

  const mockSections: ReportSectionsV1 = {
    sectionsVersion: 'v1',
    jobId,
    riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
    sections: [
      {
        sectionKey: 'overview',
        inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
        draft: 'Clean content with no violations.',
        promptVersion: 'v1.0.0',
        generationMethod: 'template',
        generatedAt: '2026-01-04T06:00:00.000Z',
      },
    ],
    generatedAt: '2026-01-04T06:00:00.000Z',
  }

  const mockValidationResult = {
    validationVersion: 'v1' as const,
    engineVersion: 'v1.0.0',
    rulesetHash: '12345678901234567890123456789012',
    jobId,
    overallStatus: VALIDATION_STATUS.PASS,
    sectionResults: [],
    flags: [],
    overallPassed: true,
    metadata: {
      validationTimeMs: 100,
      rulesEvaluatedCount: 7,
      flagsRaisedCount: 0,
      criticalFlagsCount: 0,
      warningFlagsCount: 0,
      infoFlagsCount: 0,
    },
    validatedAt: '2026-01-04T06:00:00.000Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful Processing', () => {
    it('should process validation stage successfully', async () => {
      mockLoadReportSections.mockResolvedValue({
        success: true,
        sections: mockSections,
      })

      mockValidateReportSections.mockReturnValue({
        success: true,
        data: mockValidationResult,
      })

      mockSaveMedicalValidation.mockResolvedValue({
        success: true,
        validationId: '523e4567-e89b-12d3-a456-426614174000',
        isNewValidation: true,
      })

      const result = await processValidationStage(mockSupabase, jobId)

      expect(result.success).toBe(true)
      expect(result.validationId).toBeDefined()
      expect(result.overallPassed).toBe(true)
      expect(result.overallStatus).toBe(VALIDATION_STATUS.PASS)
      expect(result.criticalFlagsCount).toBe(0)
    })

    it('should call all dependencies in correct order', async () => {
      mockLoadReportSections.mockResolvedValue({
        success: true,
        sections: mockSections,
      })

      mockValidateReportSections.mockReturnValue({
        success: true,
        data: mockValidationResult,
      })

      mockSaveMedicalValidation.mockResolvedValue({
        success: true,
        validationId: '523e4567-e89b-12d3-a456-426614174000',
      })

      await processValidationStage(mockSupabase, jobId)

      expect(mockLoadReportSections).toHaveBeenCalledWith(mockSupabase, jobId)
      expect(mockValidateReportSections).toHaveBeenCalledWith({
        sections: mockSections,
      })
      expect(mockSaveMedicalValidation).toHaveBeenCalledWith(
        mockSupabase,
        jobId,
        mockValidationResult
      )
    })

    it('should handle validation with critical flags', async () => {
      const failedValidation = {
        ...mockValidationResult,
        overallStatus: VALIDATION_STATUS.FAIL,
        overallPassed: false,
        metadata: {
          ...mockValidationResult.metadata,
          flagsRaisedCount: 1,
          criticalFlagsCount: 1,
        },
      }

      mockLoadReportSections.mockResolvedValue({
        success: true,
        sections: mockSections,
      })

      mockValidateReportSections.mockReturnValue({
        success: true,
        data: failedValidation,
      })

      mockSaveMedicalValidation.mockResolvedValue({
        success: true,
        validationId: '523e4567-e89b-12d3-a456-426614174000',
      })

      const result = await processValidationStage(mockSupabase, jobId)

      expect(result.success).toBe(true)
      expect(result.overallPassed).toBe(false)
      expect(result.overallStatus).toBe(VALIDATION_STATUS.FAIL)
      expect(result.criticalFlagsCount).toBe(1)
    })
  })

  describe('Error Handling', () => {
    it('should fail when sections loading fails', async () => {
      mockLoadReportSections.mockResolvedValue({
        success: false,
        error: 'Failed to load sections',
      })

      const result = await processValidationStage(mockSupabase, jobId)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('LOAD_SECTIONS_FAILED')
      expect(result.error).toBeDefined()
    })

    it('should fail when no sections found', async () => {
      mockLoadReportSections.mockResolvedValue({
        success: true,
        sections: undefined,
      })

      const result = await processValidationStage(mockSupabase, jobId)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('NO_SECTIONS')
    })

    it('should fail when validation fails', async () => {
      mockLoadReportSections.mockResolvedValue({
        success: true,
        sections: mockSections,
      })

      mockValidateReportSections.mockReturnValue({
        success: false,
        error: {
          code: 'NO_RULES_AVAILABLE',
          message: 'No validation rules available',
        },
      })

      const result = await processValidationStage(mockSupabase, jobId)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('NO_RULES_AVAILABLE')
    })

    it('should fail when save fails', async () => {
      mockLoadReportSections.mockResolvedValue({
        success: true,
        sections: mockSections,
      })

      mockValidateReportSections.mockReturnValue({
        success: true,
        data: mockValidationResult,
      })

      mockSaveMedicalValidation.mockResolvedValue({
        success: false,
        error: 'Database error',
      })

      const result = await processValidationStage(mockSupabase, jobId)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('SAVE_VALIDATION_FAILED')
    })

    it('should handle unexpected errors', async () => {
      mockLoadReportSections.mockRejectedValue(new Error('Unexpected error'))

      const result = await processValidationStage(mockSupabase, jobId)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('UNEXPECTED_ERROR')
      expect(result.error).toContain('Unexpected error')
    })
  })

  describe('Idempotency', () => {
    it('should handle existing validation gracefully', async () => {
      mockLoadReportSections.mockResolvedValue({
        success: true,
        sections: mockSections,
      })

      mockValidateReportSections.mockReturnValue({
        success: true,
        data: mockValidationResult,
      })

      mockSaveMedicalValidation.mockResolvedValue({
        success: true,
        validationId: '523e4567-e89b-12d3-a456-426614174000',
        isNewValidation: false, // Existing validation
      })

      const result = await processValidationStage(mockSupabase, jobId)

      expect(result.success).toBe(true)
      expect(result.validationId).toBeDefined()
    })
  })
})
