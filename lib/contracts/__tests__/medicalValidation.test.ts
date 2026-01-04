/**
 * Medical Validation Contract Tests - V05-I05.5
 */

import {
  VALIDATION_SEVERITY,
  VALIDATION_FLAG_TYPE,
  VALIDATION_STATUS,
  ValidationFlagSchema,
  SectionValidationResultSchema,
  MedicalValidationResultV1Schema,
  validateMedicalValidationResult,
  getFlagsForSection,
  getFlagsBySeverity,
  hasCriticalFlags,
  hasAnyFlags,
  getSectionResult,
  isSuccessResult,
  isErrorResult,
  type ValidationFlag,
  type MedicalValidationResultV1,
} from '@/lib/contracts/medicalValidation'

describe('Medical Validation Contract', () => {
  describe('ValidationFlagSchema', () => {
    const validFlag: ValidationFlag = {
      flagId: '123e4567-e89b-12d3-a456-426614174000',
      ruleId: 'contraindication-stress-hypertension',
      ruleVersion: 'v1.0.0',
      flagType: VALIDATION_FLAG_TYPE.CONTRAINDICATION,
      severity: VALIDATION_SEVERITY.CRITICAL,
      sectionKey: 'recommendations',
      reason: 'Recommendation conflicts with high-risk hypertension signal',
      context: { riskLevel: 'high', recommendationType: 'exercise' },
      flaggedAt: '2026-01-04T06:00:00.000Z',
    }

    it('should validate a valid flag', () => {
      expect(() => ValidationFlagSchema.parse(validFlag)).not.toThrow()
    })

    it('should reject invalid flagId (not UUID)', () => {
      const invalid = { ...validFlag, flagId: 'not-a-uuid' }
      expect(() => ValidationFlagSchema.parse(invalid)).toThrow()
    })

    it('should reject invalid severity', () => {
      const invalid = { ...validFlag, severity: 'super-critical' }
      expect(() => ValidationFlagSchema.parse(invalid)).toThrow()
    })

    it('should reject invalid flag type', () => {
      const invalid = { ...validFlag, flagType: 'fantasy-type' }
      expect(() => ValidationFlagSchema.parse(invalid)).toThrow()
    })

    it('should allow missing sectionKey', () => {
      const { sectionKey, ...withoutSection } = validFlag
      expect(() => ValidationFlagSchema.parse(withoutSection)).not.toThrow()
    })

    it('should allow missing context', () => {
      const { context, ...withoutContext } = validFlag
      expect(() => ValidationFlagSchema.parse(withoutContext)).not.toThrow()
    })

    it('should reject unknown keys (strict mode)', () => {
      const invalid = { ...validFlag, unknownKey: 'value' }
      expect(() => ValidationFlagSchema.parse(invalid)).toThrow()
    })
  })

  describe('SectionValidationResultSchema', () => {
    const validSectionResult = {
      sectionKey: 'recommendations',
      passed: false,
      flags: [
        {
          flagId: '123e4567-e89b-12d3-a456-426614174000',
          ruleId: 'contraindication-stress-hypertension',
          ruleVersion: 'v1.0.0',
          flagType: VALIDATION_FLAG_TYPE.CONTRAINDICATION,
          severity: VALIDATION_SEVERITY.CRITICAL,
          sectionKey: 'recommendations',
          reason: 'Recommendation conflicts with risk signals',
          flaggedAt: '2026-01-04T06:00:00.000Z',
        },
      ],
      maxSeverity: VALIDATION_SEVERITY.CRITICAL,
    }

    it('should validate a valid section result', () => {
      expect(() => SectionValidationResultSchema.parse(validSectionResult)).not.toThrow()
    })

    it('should allow empty flags array', () => {
      const valid = {
        sectionKey: 'overview',
        passed: true,
        flags: [],
      }
      expect(() => SectionValidationResultSchema.parse(valid)).not.toThrow()
    })

    it('should allow missing maxSeverity', () => {
      const { maxSeverity, ...withoutMax } = validSectionResult
      expect(() => SectionValidationResultSchema.parse(withoutMax)).not.toThrow()
    })
  })

  describe('MedicalValidationResultV1Schema', () => {
    const validResult: MedicalValidationResultV1 = {
      validationVersion: 'v1',
      engineVersion: 'v1.0.0',
      rulesetHash: '12345678901234567890123456789012',
      jobId: '323e4567-e89b-12d3-a456-426614174000',
      sectionsId: '423e4567-e89b-12d3-a456-426614174000',
      overallStatus: VALIDATION_STATUS.FAIL,
      sectionResults: [
        {
          sectionKey: 'recommendations',
          passed: false,
          flags: [
            {
              flagId: '123e4567-e89b-12d3-a456-426614174000',
              ruleId: 'contraindication-stress-hypertension',
              ruleVersion: 'v1.0.0',
              flagType: VALIDATION_FLAG_TYPE.CONTRAINDICATION,
              severity: VALIDATION_SEVERITY.CRITICAL,
              sectionKey: 'recommendations',
              reason: 'Recommendation conflicts with risk signals',
              flaggedAt: '2026-01-04T06:00:00.000Z',
            },
          ],
          maxSeverity: VALIDATION_SEVERITY.CRITICAL,
        },
      ],
      flags: [
        {
          flagId: '123e4567-e89b-12d3-a456-426614174000',
          ruleId: 'contraindication-stress-hypertension',
          ruleVersion: 'v1.0.0',
          flagType: VALIDATION_FLAG_TYPE.CONTRAINDICATION,
          severity: VALIDATION_SEVERITY.CRITICAL,
          sectionKey: 'recommendations',
          reason: 'Recommendation conflicts with risk signals',
          flaggedAt: '2026-01-04T06:00:00.000Z',
        },
      ],
      overallPassed: false,
      metadata: {
        validationTimeMs: 150,
        rulesEvaluatedCount: 5,
        flagsRaisedCount: 1,
        criticalFlagsCount: 1,
        warningFlagsCount: 0,
        infoFlagsCount: 0,
      },
      validatedAt: '2026-01-04T06:00:00.000Z',
    }

    it('should validate a valid result', () => {
      expect(() => MedicalValidationResultV1Schema.parse(validResult)).not.toThrow()
    })

    it('should reject invalid version', () => {
      const invalid = { ...validResult, validationVersion: 'v2' }
      expect(() => MedicalValidationResultV1Schema.parse(invalid)).toThrow()
    })

    it('should reject invalid jobId', () => {
      const invalid = { ...validResult, jobId: 'not-a-uuid' }
      expect(() => MedicalValidationResultV1Schema.parse(invalid)).toThrow()
    })

    it('should allow missing sectionsId', () => {
      const { sectionsId, ...withoutSections } = validResult
      expect(() => MedicalValidationResultV1Schema.parse(withoutSections)).not.toThrow()
    })

    it('should enforce metadata structure', () => {
      const invalid = { ...validResult, metadata: { invalidKey: 'value' } }
      expect(() => MedicalValidationResultV1Schema.parse(invalid)).toThrow()
    })

    it('should reject negative validation time', () => {
      const invalid = {
        ...validResult,
        metadata: { ...validResult.metadata, validationTimeMs: -10 },
      }
      expect(() => MedicalValidationResultV1Schema.parse(invalid)).toThrow()
    })
  })

  describe('validateMedicalValidationResult', () => {
    const validData: MedicalValidationResultV1 = {
      validationVersion: 'v1',
      engineVersion: 'v1.0.0',
      rulesetHash: '12345678901234567890123456789012',
      jobId: '323e4567-e89b-12d3-a456-426614174000',
      overallStatus: VALIDATION_STATUS.PASS,
      sectionResults: [],
      flags: [],
      overallPassed: true,
      metadata: {
        validationTimeMs: 50,
        rulesEvaluatedCount: 3,
        flagsRaisedCount: 0,
        criticalFlagsCount: 0,
        warningFlagsCount: 0,
        infoFlagsCount: 0,
      },
      validatedAt: '2026-01-04T06:00:00.000Z',
    }

    it('should return success for valid data', () => {
      const result = validateMedicalValidationResult(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.jobId).toBe(validData.jobId)
      }
    })

    it('should return error for invalid data', () => {
      const invalid = { ...validData, jobId: 'not-a-uuid' }
      const result = validateMedicalValidationResult(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_SCHEMA_ERROR')
      }
    })
  })

  describe('Helper Functions', () => {
    const testResult: MedicalValidationResultV1 = {
      validationVersion: 'v1',
      engineVersion: 'v1.0.0',
      rulesetHash: '12345678901234567890123456789012',
      jobId: '323e4567-e89b-12d3-a456-426614174000',
      overallStatus: VALIDATION_STATUS.FLAG,
      sectionResults: [
        {
          sectionKey: 'recommendations',
          passed: false,
          flags: [],
          maxSeverity: VALIDATION_SEVERITY.CRITICAL,
        },
        {
          sectionKey: 'overview',
          passed: true,
          flags: [],
        },
      ],
      flags: [
        {
          flagId: '123e4567-e89b-12d3-a456-426614174001',
          ruleId: 'rule-1',
          ruleVersion: 'v1.0.0',
          flagType: VALIDATION_FLAG_TYPE.CONTRAINDICATION,
          severity: VALIDATION_SEVERITY.CRITICAL,
          sectionKey: 'recommendations',
          reason: 'Critical issue in recommendations',
          flaggedAt: '2026-01-04T06:00:00.000Z',
        },
        {
          flagId: '123e4567-e89b-12d3-a456-426614174002',
          ruleId: 'rule-2',
          ruleVersion: 'v1.0.0',
          flagType: VALIDATION_FLAG_TYPE.PLAUSIBILITY,
          severity: VALIDATION_SEVERITY.WARNING,
          sectionKey: 'recommendations',
          reason: 'Warning in recommendations',
          flaggedAt: '2026-01-04T06:00:00.000Z',
        },
        {
          flagId: '123e4567-e89b-12d3-a456-426614174003',
          ruleId: 'rule-3',
          ruleVersion: 'v1.0.0',
          flagType: VALIDATION_FLAG_TYPE.OUT_OF_BOUNDS,
          severity: VALIDATION_SEVERITY.INFO,
          sectionKey: 'overview',
          reason: 'Info in overview',
          flaggedAt: '2026-01-04T06:00:00.000Z',
        },
      ],
      overallPassed: false,
      metadata: {
        validationTimeMs: 150,
        rulesEvaluatedCount: 5,
        flagsRaisedCount: 3,
        criticalFlagsCount: 1,
        warningFlagsCount: 1,
        infoFlagsCount: 1,
      },
      validatedAt: '2026-01-04T06:00:00.000Z',
    }

    describe('getFlagsForSection', () => {
      it('should return flags for specific section', () => {
        const flags = getFlagsForSection(testResult, 'recommendations')
        expect(flags).toHaveLength(2)
        expect(flags[0].sectionKey).toBe('recommendations')
        expect(flags[1].sectionKey).toBe('recommendations')
      })

      it('should return empty array for section with no flags', () => {
        const flags = getFlagsForSection(testResult, 'nonexistent')
        expect(flags).toHaveLength(0)
      })
    })

    describe('getFlagsBySeverity', () => {
      it('should return critical flags', () => {
        const flags = getFlagsBySeverity(testResult, VALIDATION_SEVERITY.CRITICAL)
        expect(flags).toHaveLength(1)
        expect(flags[0].severity).toBe(VALIDATION_SEVERITY.CRITICAL)
      })

      it('should return warning flags', () => {
        const flags = getFlagsBySeverity(testResult, VALIDATION_SEVERITY.WARNING)
        expect(flags).toHaveLength(1)
        expect(flags[0].severity).toBe(VALIDATION_SEVERITY.WARNING)
      })

      it('should return info flags', () => {
        const flags = getFlagsBySeverity(testResult, VALIDATION_SEVERITY.INFO)
        expect(flags).toHaveLength(1)
        expect(flags[0].severity).toBe(VALIDATION_SEVERITY.INFO)
      })
    })

    describe('hasCriticalFlags', () => {
      it('should return true when critical flags exist', () => {
        expect(hasCriticalFlags(testResult)).toBe(true)
      })

      it('should return false when no critical flags', () => {
        const noCritical = {
          ...testResult,
          metadata: { ...testResult.metadata, criticalFlagsCount: 0 },
        }
        expect(hasCriticalFlags(noCritical)).toBe(false)
      })
    })

    describe('hasAnyFlags', () => {
      it('should return true when flags exist', () => {
        expect(hasAnyFlags(testResult)).toBe(true)
      })

      it('should return false when no flags', () => {
        const noFlags = {
          ...testResult,
          metadata: { ...testResult.metadata, flagsRaisedCount: 0 },
        }
        expect(hasAnyFlags(noFlags)).toBe(false)
      })
    })

    describe('getSectionResult', () => {
      it('should return section result by key', () => {
        const section = getSectionResult(testResult, 'recommendations')
        expect(section).toBeDefined()
        expect(section?.sectionKey).toBe('recommendations')
        expect(section?.passed).toBe(false)
      })

      it('should return undefined for nonexistent section', () => {
        const section = getSectionResult(testResult, 'nonexistent')
        expect(section).toBeUndefined()
      })
    })

    describe('Type Guards', () => {
      it('isSuccessResult should identify success', () => {
        const result = { success: true as const, data: testResult }
        expect(isSuccessResult(result)).toBe(true)
      })

      it('isSuccessResult should reject error', () => {
        const result = { success: false as const, error: { code: 'ERROR', message: 'Test' } }
        expect(isSuccessResult(result)).toBe(false)
      })

      it('isErrorResult should identify error', () => {
        const result = { success: false as const, error: { code: 'ERROR', message: 'Test' } }
        expect(isErrorResult(result)).toBe(true)
      })

      it('isErrorResult should reject success', () => {
        const result = { success: true as const, data: testResult }
        expect(isErrorResult(result)).toBe(false)
      })
    })
  })
})
