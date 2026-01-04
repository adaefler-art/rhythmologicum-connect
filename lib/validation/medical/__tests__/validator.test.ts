/**
 * Medical Validation Validator Tests - V05-I05.5
 */

import {
  validateReportSections,
  getCriticalFlags,
  isValidationPassing,
} from '@/lib/validation/medical/validator'
import type { ReportSectionsV1 } from '@/lib/contracts/reportSections'
import { VALIDATION_SEVERITY, VALIDATION_STATUS } from '@/lib/contracts/medicalValidation'

describe('Medical Validation Validator', () => {
  const createMockSections = (overrides?: Partial<ReportSectionsV1>): ReportSectionsV1 => ({
    sectionsVersion: 'v1',
    jobId: '323e4567-e89b-12d3-a456-426614174000',
    riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
    programTier: 'tier-1-essential',
    sections: [
      {
        sectionKey: 'overview',
        inputs: {
          riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
          signals: [],
          scores: { riskScore: 75 },
        },
        draft: 'Your risk score is 75 out of 100. This is an informational overview.',
        promptVersion: 'v1.0.0',
        generationMethod: 'template',
        generatedAt: '2026-01-04T06:00:00.000Z',
      },
    ],
    generatedAt: '2026-01-04T06:00:00.000Z',
    ...overrides,
  })

  describe('Basic Validation', () => {
    it('should validate sections with no violations', () => {
      const sections = createMockSections()
      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.overallPassed).toBe(true)
        expect(result.data.overallStatus).toBe(VALIDATION_STATUS.PASS)
        expect(result.data.flags.length).toBe(0)
      }
    })

    it('should include metadata', () => {
      const sections = createMockSections()
      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata.validationTimeMs).toBeGreaterThanOrEqual(0)
        expect(result.data.metadata.rulesEvaluatedCount).toBeGreaterThan(0)
        expect(result.data.metadata.flagsRaisedCount).toBe(0)
      }
    })

    it('should be deterministic (same input → same output)', () => {
      const sections = createMockSections()
      
      const result1 = validateReportSections({ sections })
      const result2 = validateReportSections({ sections })

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      
      if (result1.success && result2.success) {
        expect(result1.data.overallPassed).toBe(result2.data.overallPassed)
        expect(result1.data.flags.length).toBe(result2.data.flags.length)
      }
    })
  })

  describe('Plausibility Rules', () => {
    it('should flag contradictory risk level statements', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'overview',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'You have low risk of stress but also high risk of burnout.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.flags.length).toBeGreaterThan(0)
        const plausibilityFlags = result.data.flags.filter(
          f => f.ruleId === 'plausibility-contradictory-risk-level'
        )
        expect(plausibilityFlags.length).toBeGreaterThan(0)
        expect(plausibilityFlags[0].severity).toBe(VALIDATION_SEVERITY.CRITICAL)
      }
    })

    it('should flag unrealistic claims', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'recommendations',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'This program will guarantee 100% stress elimination.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        const unrealisticFlags = result.data.flags.filter(
          f => f.ruleId === 'plausibility-unrealistic-score-claims'
        )
        expect(unrealisticFlags.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Contraindication Rules', () => {
    it('should flag vigorous exercise for high stress patients', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'recommendations',
            inputs: {
              riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
              signals: ['high_stress', 'critical'],
            },
            draft: 'We recommend vigorous exercise and high-intensity training.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        const contraindicationFlags = result.data.flags.filter(
          f => f.ruleId === 'contraindication-high-stress-vigorous-exercise'
        )
        expect(contraindicationFlags.length).toBeGreaterThan(0)
        expect(contraindicationFlags[0].severity).toBe(VALIDATION_SEVERITY.WARNING)
      }
    })

    it('should not flag exercise without high stress signals', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'recommendations',
            inputs: {
              riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
              signals: ['low_stress'],
            },
            draft: 'We recommend vigorous exercise.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        const contraindicationFlags = result.data.flags.filter(
          f => f.ruleId === 'contraindication-high-stress-vigorous-exercise'
        )
        expect(contraindicationFlags.length).toBe(0)
      }
    })
  })

  describe('Safety Rules', () => {
    it('should flag diagnosis claims', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'overview',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'You have been diagnosed with severe stress disorder.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        const diagnosisFlags = result.data.flags.filter(
          f => f.ruleId === 'safety-no-diagnosis-claims'
        )
        expect(diagnosisFlags.length).toBeGreaterThan(0)
        expect(diagnosisFlags[0].severity).toBe(VALIDATION_SEVERITY.CRITICAL)
      }
    })

    it('should flag medication prescriptions', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'recommendations',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'We prescribe a dosage of 10mg medication.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        const medicationFlags = result.data.flags.filter(
          f => f.ruleId === 'safety-no-medication-prescription'
        )
        expect(medicationFlags.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Out-of-Bounds Rules', () => {
    it('should flag risk scores above 100', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'overview',
            inputs: {
              riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
              scores: { riskScore: 150 },
            },
            draft: 'Your risk score is high.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        const boundsFlags = result.data.flags.filter(
          f => f.ruleId === 'out-of-bounds-risk-score'
        )
        expect(boundsFlags.length).toBeGreaterThan(0)
      }
    })

    it('should flag risk scores below 0', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'overview',
            inputs: {
              riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
              scores: { riskScore: -10 },
            },
            draft: 'Your risk score is negative.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        const boundsFlags = result.data.flags.filter(
          f => f.ruleId === 'out-of-bounds-risk-score'
        )
        expect(boundsFlags.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Overall Status', () => {
    it('should set status to FAIL when critical flags present', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'overview',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'You have been diagnosed with stress.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.overallStatus).toBe(VALIDATION_STATUS.FAIL)
        expect(result.data.overallPassed).toBe(false)
      }
    })

    it('should set status to FLAG when only warnings present', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'recommendations',
            inputs: {
              riskBundleId: '123e4567-e89b-12d3-a456-426614174000',
              signals: ['high_stress'],
            },
            draft: 'Try vigorous exercise.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.overallStatus).toBe(VALIDATION_STATUS.FLAG)
        expect(result.data.overallPassed).toBe(true)
      }
    })
  })

  describe('Section Results', () => {
    it('should generate per-section results', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'overview',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'Safe content.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
          {
            sectionKey: 'recommendations',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'We prescribe medication.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sectionResults.length).toBe(2)
        
        const overviewResult = result.data.sectionResults.find(
          r => r.sectionKey === 'overview'
        )
        expect(overviewResult?.passed).toBe(true)
        
        const recResult = result.data.sectionResults.find(
          r => r.sectionKey === 'recommendations'
        )
        expect(recResult?.passed).toBe(false)
      }
    })
  })

  describe('Fail-Closed Behavior', () => {
    it('should fail when no rules are available', () => {
      const sections = createMockSections()
      const result = validateReportSections({ 
        sections, 
        ruleIds: ['nonexistent-rule'] 
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('NO_RULES_AVAILABLE')
      }
    })
  })

  describe('Convenience Functions', () => {
    it('getCriticalFlags should return only critical flags', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'overview',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'You have been diagnosed with stress.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const criticalFlags = getCriticalFlags({ sections })
      expect(criticalFlags.length).toBeGreaterThan(0)
      criticalFlags.forEach(flag => {
        expect(flag.severity).toBe(VALIDATION_SEVERITY.CRITICAL)
      })
    })

    it('isValidationPassing should return false for critical flags', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'overview',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'You have been diagnosed with stress.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      expect(isValidationPassing({ sections })).toBe(false)
    })

    it('isValidationPassing should return true for clean content', () => {
      const sections = createMockSections()
      expect(isValidationPassing({ sections })).toBe(true)
    })
  })

  describe('PHI-Free Flags', () => {
    it('should not include patient identifiers in flags', () => {
      const sections = createMockSections({
        sections: [
          {
            sectionKey: 'overview',
            inputs: { riskBundleId: '123e4567-e89b-12d3-a456-426614174000' },
            draft: 'Contradictory: low risk and high risk.',
            promptVersion: 'v1.0.0',
            generationMethod: 'template',
            generatedAt: '2026-01-04T06:00:00.000Z',
          },
        ],
      })

      const result = validateReportSections({ sections })

      expect(result.success).toBe(true)
      if (result.success && result.data.flags.length > 0) {
        const flag = result.data.flags[0]
        
        // Check for PHI-free structure
        expect(flag).toHaveProperty('flagId') // UUID only
        expect(flag).toHaveProperty('ruleId') // Rule reference only
        expect(flag).toHaveProperty('sectionKey') // Section key only
        
        // Should not have patient identifiers
        expect(JSON.stringify(flag)).not.toMatch(/patient.*id|user.*id|email|phone/i)
      }
    })
  })
})
