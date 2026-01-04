/**
 * Safety Check Contract Tests - V05-I05.6
 */

import {
  SAFETY_ACTION,
  SAFETY_SEVERITY,
  SafetyActionSchema,
  SafetySeveritySchema,
  SafetyFindingSchema,
  SafetyCheckResultV1Schema,
  validateSafetyCheckResult,
  validateSafetyFinding,
  getFindingsForSection,
  getFindingsBySeverity,
  hasCriticalFindings,
  hasAnyFindings,
  getMaxSeverity,
  determineAction,
  calculateSafetyScore,
  isSuccessResult,
  isErrorResult,
  type SafetyFinding,
  type SafetyCheckResultV1,
} from '@/lib/contracts/safetyCheck'

describe('Safety Check Contract', () => {
  describe('SafetyActionSchema', () => {
    it('should validate valid actions', () => {
      expect(() => SafetyActionSchema.parse(SAFETY_ACTION.PASS)).not.toThrow()
      expect(() => SafetyActionSchema.parse(SAFETY_ACTION.FLAG)).not.toThrow()
      expect(() => SafetyActionSchema.parse(SAFETY_ACTION.BLOCK)).not.toThrow()
      expect(() => SafetyActionSchema.parse(SAFETY_ACTION.UNKNOWN)).not.toThrow()
    })

    it('should reject invalid actions', () => {
      expect(() => SafetyActionSchema.parse('INVALID')).toThrow()
      expect(() => SafetyActionSchema.parse('pass')).toThrow() // lowercase
    })
  })

  describe('SafetySeveritySchema', () => {
    it('should validate valid severities', () => {
      expect(() => SafetySeveritySchema.parse(SAFETY_SEVERITY.NONE)).not.toThrow()
      expect(() => SafetySeveritySchema.parse(SAFETY_SEVERITY.LOW)).not.toThrow()
      expect(() => SafetySeveritySchema.parse(SAFETY_SEVERITY.MEDIUM)).not.toThrow()
      expect(() => SafetySeveritySchema.parse(SAFETY_SEVERITY.HIGH)).not.toThrow()
      expect(() => SafetySeveritySchema.parse(SAFETY_SEVERITY.CRITICAL)).not.toThrow()
    })

    it('should reject invalid severities', () => {
      expect(() => SafetySeveritySchema.parse('INVALID')).toThrow()
      expect(() => SafetySeveritySchema.parse('Low')).toThrow() // wrong case
    })
  })

  describe('SafetyFindingSchema', () => {
    const validFinding: SafetyFinding = {
      findingId: '123e4567-e89b-12d3-a456-426614174000',
      category: 'medical_plausibility',
      severity: SAFETY_SEVERITY.MEDIUM,
      sectionKey: 'recommendations',
      reason: 'Recommendation may not be appropriate for stated risk level',
      suggestedAction: SAFETY_ACTION.FLAG,
      context: { riskLevel: 'high', recommendationType: 'lifestyle' },
      identifiedAt: '2026-01-04T08:00:00.000Z',
    }

    it('should validate a valid finding', () => {
      expect(() => SafetyFindingSchema.parse(validFinding)).not.toThrow()
    })

    it('should reject invalid findingId (not UUID)', () => {
      const invalid = { ...validFinding, findingId: 'not-a-uuid' }
      expect(() => SafetyFindingSchema.parse(invalid)).toThrow()
    })

    it('should reject invalid category', () => {
      const invalid = { ...validFinding, category: 'invalid_category' }
      expect(() => SafetyFindingSchema.parse(invalid)).toThrow()
    })

    it('should reject invalid severity', () => {
      const invalid = { ...validFinding, severity: 'super-critical' }
      expect(() => SafetyFindingSchema.parse(invalid)).toThrow()
    })

    it('should reject invalid suggested action', () => {
      const invalid = { ...validFinding, suggestedAction: 'MAYBE' }
      expect(() => SafetyFindingSchema.parse(invalid)).toThrow()
    })

    it('should allow missing sectionKey', () => {
      const { sectionKey, ...withoutSection } = validFinding
      expect(() => SafetyFindingSchema.parse(withoutSection)).not.toThrow()
    })

    it('should allow missing context', () => {
      const { context, ...withoutContext } = validFinding
      expect(() => SafetyFindingSchema.parse(withoutContext)).not.toThrow()
    })

    it('should reject unknown keys (strict mode)', () => {
      const invalid = { ...validFinding, unknownKey: 'value' }
      expect(() => SafetyFindingSchema.parse(invalid)).toThrow()
    })

    it('should validate all finding categories', () => {
      const categories = [
        'consistency',
        'medical_plausibility',
        'contraindication',
        'tone_appropriateness',
        'information_quality',
        'other',
      ]

      categories.forEach((category) => {
        const finding = { ...validFinding, category }
        expect(() => SafetyFindingSchema.parse(finding)).not.toThrow()
      })
    })
  })

  describe('SafetyCheckResultV1Schema', () => {
    const validResult: SafetyCheckResultV1 = {
      safetyVersion: 'v1',
      jobId: '323e4567-e89b-12d3-a456-426614174000',
      sectionsId: '423e4567-e89b-12d3-a456-426614174000',
      promptVersion: 'v1.0.0',
      modelConfig: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250929',
        temperature: 0.0,
        maxTokens: 4096,
      },
      safetyScore: 85,
      overallSeverity: SAFETY_SEVERITY.LOW,
      recommendedAction: SAFETY_ACTION.PASS,
      findings: [
        {
          findingId: '123e4567-e89b-12d3-a456-426614174000',
          category: 'tone_appropriateness',
          severity: SAFETY_SEVERITY.LOW,
          sectionKey: 'overview',
          reason: 'Tone could be more empathetic',
          suggestedAction: SAFETY_ACTION.PASS,
          identifiedAt: '2026-01-04T08:00:00.000Z',
        },
      ],
      summaryReasoning: 'Overall content is safe and appropriate with minor tone improvements suggested',
      evaluatedAt: '2026-01-04T08:00:05.000Z',
      metadata: {
        evaluationTimeMs: 1250,
        llmCallCount: 1,
        sectionsEvaluatedCount: 5,
        tokenUsage: {
          promptTokens: 1500,
          completionTokens: 300,
          totalTokens: 1800,
        },
        fallbackUsed: false,
        warnings: [],
      },
    }

    it('should validate a valid safety check result', () => {
      expect(() => SafetyCheckResultV1Schema.parse(validResult)).not.toThrow()
    })

    it('should reject invalid safetyVersion', () => {
      const invalid = { ...validResult, safetyVersion: 'v2' }
      expect(() => SafetyCheckResultV1Schema.parse(invalid)).toThrow()
    })

    it('should reject invalid jobId (not UUID)', () => {
      const invalid = { ...validResult, jobId: 'not-a-uuid' }
      expect(() => SafetyCheckResultV1Schema.parse(invalid)).toThrow()
    })

    it('should reject invalid sectionsId (not UUID)', () => {
      const invalid = { ...validResult, sectionsId: 'not-a-uuid' }
      expect(() => SafetyCheckResultV1Schema.parse(invalid)).toThrow()
    })

    it('should reject safety score out of range (> 100)', () => {
      const invalid = { ...validResult, safetyScore: 150 }
      expect(() => SafetyCheckResultV1Schema.parse(invalid)).toThrow()
    })

    it('should reject safety score out of range (< 0)', () => {
      const invalid = { ...validResult, safetyScore: -10 }
      expect(() => SafetyCheckResultV1Schema.parse(invalid)).toThrow()
    })

    it('should allow safety score of 0', () => {
      const valid = { ...validResult, safetyScore: 0 }
      expect(() => SafetyCheckResultV1Schema.parse(valid)).not.toThrow()
    })

    it('should allow safety score of 100', () => {
      const valid = { ...validResult, safetyScore: 100 }
      expect(() => SafetyCheckResultV1Schema.parse(valid)).not.toThrow()
    })

    it('should allow empty findings array', () => {
      const valid = { ...validResult, findings: [] }
      expect(() => SafetyCheckResultV1Schema.parse(valid)).not.toThrow()
    })

    it('should allow missing modelConfig', () => {
      const { modelConfig, ...withoutConfig } = validResult
      expect(() => SafetyCheckResultV1Schema.parse(withoutConfig)).not.toThrow()
    })

    it('should allow missing tokenUsage in metadata', () => {
      const valid = {
        ...validResult,
        metadata: {
          ...validResult.metadata,
          tokenUsage: undefined,
        },
      }
      expect(() => SafetyCheckResultV1Schema.parse(valid)).not.toThrow()
    })

    it('should allow missing warnings in metadata', () => {
      const valid = {
        ...validResult,
        metadata: {
          ...validResult.metadata,
          warnings: undefined,
        },
      }
      expect(() => SafetyCheckResultV1Schema.parse(valid)).not.toThrow()
    })

    it('should reject unknown keys (strict mode)', () => {
      const invalid = { ...validResult, unknownKey: 'value' }
      expect(() => SafetyCheckResultV1Schema.parse(invalid)).toThrow()
    })

    it('should validate different providers', () => {
      const providers = ['anthropic', 'openai', 'template'] as const
      
      providers.forEach((provider) => {
        const result = {
          ...validResult,
          modelConfig: { ...validResult.modelConfig!, provider },
        }
        expect(() => SafetyCheckResultV1Schema.parse(result)).not.toThrow()
      })
    })
  })

  describe('validateSafetyCheckResult', () => {
    it('should validate valid result', () => {
      const validResult: SafetyCheckResultV1 = {
        safetyVersion: 'v1',
        jobId: '323e4567-e89b-12d3-a456-426614174000',
        sectionsId: '423e4567-e89b-12d3-a456-426614174000',
        promptVersion: 'v1.0.0',
        safetyScore: 100,
        overallSeverity: SAFETY_SEVERITY.NONE,
        recommendedAction: SAFETY_ACTION.PASS,
        findings: [],
        summaryReasoning: 'No safety concerns identified',
        evaluatedAt: '2026-01-04T08:00:00.000Z',
        metadata: {
          evaluationTimeMs: 1000,
          llmCallCount: 1,
          sectionsEvaluatedCount: 5,
          fallbackUsed: false,
        },
      }

      const result = validateSafetyCheckResult(validResult)
      expect(result).toEqual(validResult)
    })

    it('should throw on invalid result', () => {
      const invalid = { safetyVersion: 'v2' }
      expect(() => validateSafetyCheckResult(invalid)).toThrow()
    })
  })

  describe('validateSafetyFinding', () => {
    it('should validate valid finding', () => {
      const validFinding: SafetyFinding = {
        findingId: '123e4567-e89b-12d3-a456-426614174000',
        category: 'consistency',
        severity: SAFETY_SEVERITY.MEDIUM,
        reason: 'Inconsistent tone across sections',
        suggestedAction: SAFETY_ACTION.FLAG,
        identifiedAt: '2026-01-04T08:00:00.000Z',
      }

      const result = validateSafetyFinding(validFinding)
      expect(result).toEqual(validFinding)
    })

    it('should throw on invalid finding', () => {
      const invalid = { category: 'invalid' }
      expect(() => validateSafetyFinding(invalid)).toThrow()
    })
  })

  describe('Helper Functions', () => {
    const mockResult: SafetyCheckResultV1 = {
      safetyVersion: 'v1',
      jobId: '323e4567-e89b-12d3-a456-426614174000',
      sectionsId: '423e4567-e89b-12d3-a456-426614174000',
      promptVersion: 'v1.0.0',
      safetyScore: 60,
      overallSeverity: SAFETY_SEVERITY.HIGH,
      recommendedAction: SAFETY_ACTION.BLOCK,
      findings: [
        {
          findingId: '123e4567-e89b-12d3-a456-426614174000',
          category: 'medical_plausibility',
          severity: SAFETY_SEVERITY.HIGH,
          sectionKey: 'recommendations',
          reason: 'Recommendation may conflict with risk level',
          suggestedAction: SAFETY_ACTION.BLOCK,
          identifiedAt: '2026-01-04T08:00:00.000Z',
        },
        {
          findingId: '223e4567-e89b-12d3-a456-426614174000',
          category: 'consistency',
          severity: SAFETY_SEVERITY.MEDIUM,
          sectionKey: 'overview',
          reason: 'Inconsistent terminology',
          suggestedAction: SAFETY_ACTION.FLAG,
          identifiedAt: '2026-01-04T08:00:01.000Z',
        },
        {
          findingId: '323e4567-e89b-12d3-a456-426614174000',
          category: 'tone_appropriateness',
          severity: SAFETY_SEVERITY.LOW,
          sectionKey: 'recommendations',
          reason: 'Could be more empathetic',
          suggestedAction: SAFETY_ACTION.PASS,
          identifiedAt: '2026-01-04T08:00:02.000Z',
        },
      ],
      summaryReasoning: 'Multiple concerns identified requiring review',
      evaluatedAt: '2026-01-04T08:00:05.000Z',
      metadata: {
        evaluationTimeMs: 1500,
        llmCallCount: 1,
        sectionsEvaluatedCount: 5,
        fallbackUsed: false,
      },
    }

    describe('getFindingsForSection', () => {
      it('should return findings for specific section', () => {
        const findings = getFindingsForSection(mockResult, 'recommendations')
        expect(findings).toHaveLength(2)
        expect(findings.every((f) => f.sectionKey === 'recommendations')).toBe(true)
      })

      it('should return empty array for section with no findings', () => {
        const findings = getFindingsForSection(mockResult, 'nonexistent')
        expect(findings).toHaveLength(0)
      })
    })

    describe('getFindingsBySeverity', () => {
      it('should return findings by severity', () => {
        const highFindings = getFindingsBySeverity(mockResult, SAFETY_SEVERITY.HIGH)
        expect(highFindings).toHaveLength(1)
        expect(highFindings[0].severity).toBe(SAFETY_SEVERITY.HIGH)

        const mediumFindings = getFindingsBySeverity(mockResult, SAFETY_SEVERITY.MEDIUM)
        expect(mediumFindings).toHaveLength(1)
        expect(mediumFindings[0].severity).toBe(SAFETY_SEVERITY.MEDIUM)

        const lowFindings = getFindingsBySeverity(mockResult, SAFETY_SEVERITY.LOW)
        expect(lowFindings).toHaveLength(1)
        expect(lowFindings[0].severity).toBe(SAFETY_SEVERITY.LOW)
      })

      it('should return empty array for severity with no findings', () => {
        const findings = getFindingsBySeverity(mockResult, SAFETY_SEVERITY.CRITICAL)
        expect(findings).toHaveLength(0)
      })
    })

    describe('hasCriticalFindings', () => {
      it('should return true if critical findings exist', () => {
        const resultWithCritical: SafetyCheckResultV1 = {
          ...mockResult,
          findings: [
            ...mockResult.findings,
            {
              findingId: '423e4567-e89b-12d3-a456-426614174000',
              category: 'contraindication',
              severity: SAFETY_SEVERITY.CRITICAL,
              reason: 'Critical contraindication detected',
              suggestedAction: SAFETY_ACTION.BLOCK,
              identifiedAt: '2026-01-04T08:00:03.000Z',
            },
          ],
        }

        expect(hasCriticalFindings(resultWithCritical)).toBe(true)
      })

      it('should return false if no critical findings', () => {
        expect(hasCriticalFindings(mockResult)).toBe(false)
      })
    })

    describe('hasAnyFindings', () => {
      it('should return true if findings exist', () => {
        expect(hasAnyFindings(mockResult)).toBe(true)
      })

      it('should return false if no findings', () => {
        const resultNoFindings = { ...mockResult, findings: [] }
        expect(hasAnyFindings(resultNoFindings)).toBe(false)
      })
    })

    describe('getMaxSeverity', () => {
      it('should return highest severity', () => {
        expect(getMaxSeverity(mockResult)).toBe(SAFETY_SEVERITY.HIGH)
      })

      it('should return NONE for no findings', () => {
        const resultNoFindings = { ...mockResult, findings: [] }
        expect(getMaxSeverity(resultNoFindings)).toBe(SAFETY_SEVERITY.NONE)
      })

      it('should return CRITICAL when critical findings exist', () => {
        const resultWithCritical: SafetyCheckResultV1 = {
          ...mockResult,
          findings: [
            ...mockResult.findings,
            {
              findingId: '423e4567-e89b-12d3-a456-426614174000',
              category: 'contraindication',
              severity: SAFETY_SEVERITY.CRITICAL,
              reason: 'Critical issue',
              suggestedAction: SAFETY_ACTION.BLOCK,
              identifiedAt: '2026-01-04T08:00:03.000Z',
            },
          ],
        }

        expect(getMaxSeverity(resultWithCritical)).toBe(SAFETY_SEVERITY.CRITICAL)
      })
    })

    describe('determineAction', () => {
      it('should return PASS for no findings', () => {
        expect(determineAction([])).toBe(SAFETY_ACTION.PASS)
      })

      it('should return BLOCK for critical findings', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'contraindication',
            severity: SAFETY_SEVERITY.CRITICAL,
            reason: 'Critical issue',
            suggestedAction: SAFETY_ACTION.BLOCK,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
        ]

        expect(determineAction(findings)).toBe(SAFETY_ACTION.BLOCK)
      })

      it('should return BLOCK for high severity findings', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'medical_plausibility',
            severity: SAFETY_SEVERITY.HIGH,
            reason: 'High severity issue',
            suggestedAction: SAFETY_ACTION.BLOCK,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
        ]

        expect(determineAction(findings)).toBe(SAFETY_ACTION.BLOCK)
      })

      it('should return FLAG for medium severity findings', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'consistency',
            severity: SAFETY_SEVERITY.MEDIUM,
            reason: 'Medium severity issue',
            suggestedAction: SAFETY_ACTION.FLAG,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
        ]

        expect(determineAction(findings)).toBe(SAFETY_ACTION.FLAG)
      })

      it('should return PASS for low severity findings', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'tone_appropriateness',
            severity: SAFETY_SEVERITY.LOW,
            reason: 'Low severity issue',
            suggestedAction: SAFETY_ACTION.PASS,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
        ]

        expect(determineAction(findings)).toBe(SAFETY_ACTION.PASS)
      })
    })

    describe('calculateSafetyScore', () => {
      it('should return 100 for no findings', () => {
        expect(calculateSafetyScore([])).toBe(100)
      })

      it('should deduct 40 points for critical findings', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'contraindication',
            severity: SAFETY_SEVERITY.CRITICAL,
            reason: 'Critical issue',
            suggestedAction: SAFETY_ACTION.BLOCK,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
        ]

        expect(calculateSafetyScore(findings)).toBe(60)
      })

      it('should deduct 25 points for high severity findings', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'medical_plausibility',
            severity: SAFETY_SEVERITY.HIGH,
            reason: 'High issue',
            suggestedAction: SAFETY_ACTION.BLOCK,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
        ]

        expect(calculateSafetyScore(findings)).toBe(75)
      })

      it('should deduct 15 points for medium severity findings', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'consistency',
            severity: SAFETY_SEVERITY.MEDIUM,
            reason: 'Medium issue',
            suggestedAction: SAFETY_ACTION.FLAG,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
        ]

        expect(calculateSafetyScore(findings)).toBe(85)
      })

      it('should deduct 5 points for low severity findings', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'tone_appropriateness',
            severity: SAFETY_SEVERITY.LOW,
            reason: 'Low issue',
            suggestedAction: SAFETY_ACTION.PASS,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
        ]

        expect(calculateSafetyScore(findings)).toBe(95)
      })

      it('should not go below 0', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'contraindication',
            severity: SAFETY_SEVERITY.CRITICAL,
            reason: 'Issue 1',
            suggestedAction: SAFETY_ACTION.BLOCK,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
          {
            findingId: '223e4567-e89b-12d3-a456-426614174000',
            category: 'medical_plausibility',
            severity: SAFETY_SEVERITY.CRITICAL,
            reason: 'Issue 2',
            suggestedAction: SAFETY_ACTION.BLOCK,
            identifiedAt: '2026-01-04T08:00:01.000Z',
          },
          {
            findingId: '323e4567-e89b-12d3-a456-426614174000',
            category: 'contraindication',
            severity: SAFETY_SEVERITY.CRITICAL,
            reason: 'Issue 3',
            suggestedAction: SAFETY_ACTION.BLOCK,
            identifiedAt: '2026-01-04T08:00:02.000Z',
          },
        ]

        expect(calculateSafetyScore(findings)).toBe(0)
      })

      it('should calculate correctly for mixed severity findings', () => {
        const findings: SafetyFinding[] = [
          {
            findingId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'medical_plausibility',
            severity: SAFETY_SEVERITY.HIGH,
            reason: 'High issue',
            suggestedAction: SAFETY_ACTION.BLOCK,
            identifiedAt: '2026-01-04T08:00:00.000Z',
          },
          {
            findingId: '223e4567-e89b-12d3-a456-426614174000',
            category: 'consistency',
            severity: SAFETY_SEVERITY.MEDIUM,
            reason: 'Medium issue',
            suggestedAction: SAFETY_ACTION.FLAG,
            identifiedAt: '2026-01-04T08:00:01.000Z',
          },
          {
            findingId: '323e4567-e89b-12d3-a456-426614174000',
            category: 'tone_appropriateness',
            severity: SAFETY_SEVERITY.LOW,
            reason: 'Low issue',
            suggestedAction: SAFETY_ACTION.PASS,
            identifiedAt: '2026-01-04T08:00:02.000Z',
          },
        ]

        // 100 - 25 (high) - 15 (medium) - 5 (low) = 55
        expect(calculateSafetyScore(findings)).toBe(55)
      })
    })
  })

  describe('Type Guards', () => {
    const successResult = {
      success: true,
      data: {
        safetyVersion: 'v1' as const,
        jobId: '323e4567-e89b-12d3-a456-426614174000',
        sectionsId: '423e4567-e89b-12d3-a456-426614174000',
        promptVersion: 'v1.0.0',
        safetyScore: 100,
        overallSeverity: SAFETY_SEVERITY.NONE,
        recommendedAction: SAFETY_ACTION.PASS,
        findings: [],
        summaryReasoning: 'All good',
        evaluatedAt: '2026-01-04T08:00:00.000Z',
        metadata: {
          evaluationTimeMs: 1000,
          llmCallCount: 1,
          sectionsEvaluatedCount: 5,
          fallbackUsed: false,
        },
      },
    }

    const errorResult = {
      success: false,
      error: 'Test error',
      code: 'TEST_ERROR',
    }

    describe('isSuccessResult', () => {
      it('should return true for success result', () => {
        expect(isSuccessResult(successResult)).toBe(true)
      })

      it('should return false for error result', () => {
        expect(isSuccessResult(errorResult)).toBe(false)
      })
    })

    describe('isErrorResult', () => {
      it('should return true for error result', () => {
        expect(isErrorResult(errorResult)).toBe(true)
      })

      it('should return false for success result', () => {
        expect(isErrorResult(successResult)).toBe(false)
      })
    })
  })
})
