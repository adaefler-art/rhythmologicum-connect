/**
 * Report Sections Contract Tests - V05-I05.4
 */

import {
  SECTION_KEY,
  ReportSectionSchema,
  ReportSectionsV1Schema,
  SectionCitationSchema,
  SectionInputsSchema,
  validateReportSections,
  getSectionByKey,
  hasSection,
  getSectionKeys,
  isSuccessResult,
  isErrorResult,
  type ReportSectionsV1,
  type ReportSection,
} from '@/lib/contracts/reportSections'

describe('Report Sections Contract', () => {
  describe('SectionCitationSchema', () => {
    it('should validate a valid citation', () => {
      const citation = {
        refType: 'risk_factor',
        refId: 'stress',
        refLabel: 'Stress Level',
      }
      expect(() => SectionCitationSchema.parse(citation)).not.toThrow()
    })

    it('should reject invalid refType', () => {
      const citation = {
        refType: 'external_url', // Invalid
        refId: 'https://example.com',
      }
      expect(() => SectionCitationSchema.parse(citation)).toThrow()
    })

    it('should allow missing refLabel', () => {
      const citation = {
        refType: 'intervention_topic',
        refId: 'breathing-exercises',
      }
      expect(() => SectionCitationSchema.parse(citation)).not.toThrow()
    })
  })

  describe('SectionInputsSchema', () => {
    it('should validate PHI-free inputs', () => {
      const inputs = {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        rankingId: '223e4567-e89b-12d3-a456-426614174000',
        programTier: 'tier-1-essential',
        signals: ['high_stress_score', 'critical_risk_level'],
        scores: { stress: 85, sleep: 42 },
      }
      expect(() => SectionInputsSchema.parse(inputs)).not.toThrow()
    })

    it('should reject non-UUID for IDs', () => {
      const inputs = {
        riskBundleId: 'not-a-uuid',
      }
      expect(() => SectionInputsSchema.parse(inputs)).toThrow()
    })

    it('should allow empty inputs', () => {
      const inputs = {}
      expect(() => SectionInputsSchema.parse(inputs)).not.toThrow()
    })
  })

  describe('ReportSectionSchema', () => {
    const validSection: ReportSection = {
      sectionKey: SECTION_KEY.OVERVIEW,
      inputs: {
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
      },
      draft: 'This is a generated overview section.',
      promptVersion: 'v1.0.0',
      generationMethod: 'template',
      generatedAt: '2026-01-03T21:00:00.000Z',
    }

    it('should validate a valid section', () => {
      expect(() => ReportSectionSchema.parse(validSection)).not.toThrow()
    })

    it('should reject invalid section key', () => {
      const invalid = { ...validSection, sectionKey: 'fantasy_section' }
      expect(() => ReportSectionSchema.parse(invalid)).toThrow()
    })

    it('should enforce max length on draft (10k chars)', () => {
      const invalid = { ...validSection, draft: 'x'.repeat(10001) }
      expect(() => ReportSectionSchema.parse(invalid)).toThrow()
    })

    it('should allow empty draft', () => {
      const valid = { ...validSection, draft: '' }
      expect(() => ReportSectionSchema.parse(valid)).not.toThrow()
    })

    it('should validate generation methods', () => {
      const llm = { ...validSection, generationMethod: 'llm' }
      const template = { ...validSection, generationMethod: 'template' }
      const hybrid = { ...validSection, generationMethod: 'hybrid' }

      expect(() => ReportSectionSchema.parse(llm)).not.toThrow()
      expect(() => ReportSectionSchema.parse(template)).not.toThrow()
      expect(() => ReportSectionSchema.parse(hybrid)).not.toThrow()
    })

    it('should reject invalid generation method', () => {
      const invalid = { ...validSection, generationMethod: 'magic' }
      expect(() => ReportSectionSchema.parse(invalid)).toThrow()
    })

    it('should allow citations', () => {
      const withCitations = {
        ...validSection,
        citations: [
          { refType: 'risk_factor', refId: 'stress', refLabel: 'Stress' },
          { refType: 'intervention_topic', refId: 'breathing-exercises' },
        ],
      }
      expect(() => ReportSectionSchema.parse(withCitations)).not.toThrow()
    })
  })

  describe('ReportSectionsV1Schema', () => {
    const validSections: ReportSectionsV1 = {
      sectionsVersion: 'v1',
      jobId: '323e4567-e89b-12d3-a456-426614174000',
      riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
      rankingId: '223e4567-e89b-12d3-a456-426614174000',
      programTier: 'tier-1-essential',
      sections: [
        {
          sectionKey: SECTION_KEY.OVERVIEW,
          inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
          draft: 'Overview text',
          promptVersion: 'v1.0.0',
          generationMethod: 'template',
          generatedAt: '2026-01-03T21:00:00.000Z',
        },
        {
          sectionKey: SECTION_KEY.FINDINGS,
          inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
          draft: 'Findings text',
          promptVersion: 'v1.0.0',
          generationMethod: 'llm',
          generatedAt: '2026-01-03T21:00:01.000Z',
        },
      ],
      generatedAt: '2026-01-03T21:00:02.000Z',
    }

    it('should validate complete report sections', () => {
      expect(() => ReportSectionsV1Schema.parse(validSections)).not.toThrow()
    })

    it('should enforce v1 version literal', () => {
      const invalid = { ...validSections, sectionsVersion: 'v2' }
      expect(() => ReportSectionsV1Schema.parse(invalid)).toThrow()
    })

    it('should require at least 1 section', () => {
      const invalid = { ...validSections, sections: [] }
      expect(() => ReportSectionsV1Schema.parse(invalid)).toThrow()
    })

    it('should enforce max 20 sections', () => {
      const tooMany = Array(21).fill(validSections.sections[0])
      const invalid = { ...validSections, sections: tooMany }
      expect(() => ReportSectionsV1Schema.parse(invalid)).toThrow()
    })

    it('should allow metadata', () => {
      const withMetadata = {
        ...validSections,
        metadata: {
          generationTimeMs: 1500,
          llmCallCount: 2,
          fallbackCount: 0,
          warnings: ['Low confidence on section X'],
        },
      }
      expect(() => ReportSectionsV1Schema.parse(withMetadata)).not.toThrow()
    })

    it('should allow optional fields to be missing', () => {
      const minimal = {
        sectionsVersion: 'v1',
        jobId: '323e4567-e89b-12d3-a456-426614174000',
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        sections: [validSections.sections[0]],
        generatedAt: '2026-01-03T21:00:00.000Z',
      }
      expect(() => ReportSectionsV1Schema.parse(minimal)).not.toThrow()
    })
  })

  describe('validateReportSections', () => {
    it('should return success for valid data', () => {
      const valid = {
        sectionsVersion: 'v1',
        jobId: '323e4567-e89b-12d3-a456-426614174000',
        riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
        sections: [
          {
            sectionKey: SECTION_KEY.OVERVIEW,
            inputs: {},
            draft: 'Test',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-03T21:00:00.000Z',
          },
        ],
        generatedAt: '2026-01-03T21:00:00.000Z',
      }

      const result = validateReportSections(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.jobId).toBe(valid.jobId)
      }
    })

    it('should return error for invalid data', () => {
      const invalid = {
        sectionsVersion: 'v1',
        jobId: 'not-a-uuid',
        sections: [],
      }

      const result = validateReportSections(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR')
      }
    })
  })

  describe('Helper Functions', () => {
    const sections: ReportSectionsV1 = {
      sectionsVersion: 'v1',
      jobId: '323e4567-e89b-12d3-a456-426614174000',
      riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
      sections: [
        {
          sectionKey: SECTION_KEY.OVERVIEW,
          inputs: {},
          draft: 'Overview',
          promptVersion: 'v1.0.0',
          generationMethod: 'template',
          generatedAt: '2026-01-03T21:00:00.000Z',
        },
        {
          sectionKey: SECTION_KEY.FINDINGS,
          inputs: {},
          draft: 'Findings',
          promptVersion: 'v1.0.0',
          generationMethod: 'template',
          generatedAt: '2026-01-03T21:00:00.000Z',
        },
      ],
      generatedAt: '2026-01-03T21:00:00.000Z',
    }

    describe('getSectionByKey', () => {
      it('should return section if exists', () => {
        const section = getSectionByKey(sections, SECTION_KEY.OVERVIEW)
        expect(section).toBeDefined()
        expect(section?.sectionKey).toBe(SECTION_KEY.OVERVIEW)
      })

      it('should return undefined if not exists', () => {
        const section = getSectionByKey(sections, SECTION_KEY.RECOMMENDATIONS)
        expect(section).toBeUndefined()
      })
    })

    describe('hasSection', () => {
      it('should return true if section exists', () => {
        expect(hasSection(sections, SECTION_KEY.OVERVIEW)).toBe(true)
      })

      it('should return false if section does not exist', () => {
        expect(hasSection(sections, SECTION_KEY.RECOMMENDATIONS)).toBe(false)
      })
    })

    describe('getSectionKeys', () => {
      it('should return array of section keys', () => {
        const keys = getSectionKeys(sections)
        expect(keys).toEqual([SECTION_KEY.OVERVIEW, SECTION_KEY.FINDINGS])
      })
    })

    describe('Type Guards', () => {
      it('should identify success result', () => {
        const result = validateReportSections(sections)
        expect(isSuccessResult(result)).toBe(true)
        expect(isErrorResult(result)).toBe(false)
      })

      it('should identify error result', () => {
        const result = validateReportSections({ invalid: 'data' })
        expect(isSuccessResult(result)).toBe(false)
        expect(isErrorResult(result)).toBe(true)
      })
    })
  })
})
