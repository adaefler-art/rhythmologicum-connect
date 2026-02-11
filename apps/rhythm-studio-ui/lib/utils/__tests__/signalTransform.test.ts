/**
 * Signal Transformation Tests (Issue 8)
 * 
 * Tests for signal transformation and validation utilities
 */

import {
  transformToClinicianSignal,
  transformToPatientHints,
  validatePatientSignal,
  getRedFlagMessage,
  validateMaxBullets,
} from '../signalTransform'
import type { RawSignalData, PatientSignalHint } from '../../types/signals'

describe('Signal Transformation (Issue 8)', () => {
  describe('transformToClinicianSignal', () => {
    it('should transform raw data to clinician signal format', () => {
      const raw: RawSignalData = {
        riskLevel: 'high',
        safetyScore: 45,
        safetyFindings: {
          critical_findings_count: 2,
          high_findings_count: 3,
        },
        riskModels: {
          cardiovascular: 'elevated',
          metabolic: 'normal',
        },
        redFlags: ['report_risk_level', 'workup_check'],
      }

      const result = transformToClinicianSignal(raw)

      expect(result.riskLevel).toBe('high')
      expect(result.riskScore).toBe(45)
      expect(result.signalCodes).toContain('critical_findings_count')
      expect(result.signalCodes).toContain('cardiovascular')
      expect(result.redFlags).toHaveLength(2)
      expect(result.redFlags[0].code).toBe('report_risk_level')
      expect(result.generatedAt).toBeDefined()
    })

    it('should handle missing optional fields gracefully', () => {
      const raw: RawSignalData = {
        riskLevel: 'low',
      }

      const result = transformToClinicianSignal(raw)

      expect(result.riskLevel).toBe('low')
      expect(result.signalCodes).toEqual([])
      expect(result.redFlags).toEqual([])
      expect(result.priorityRanking).toBeNull()
    })
  })

  describe('transformToPatientHints', () => {
    it('should transform raw data to patient-safe hints', () => {
      const raw: RawSignalData = {
        riskLevel: 'moderate',
        safetyScore: 65,
        safetyFindings: { some_finding: true },
        redFlags: ['flag1'],
      }

      const result = transformToPatientHints(raw)

      expect(result.hasRedFlags).toBe(true)
      expect(result.isCollapsed).toBe(true)
      expect(result.riskAreaHints.length).toBeGreaterThan(0)
      expect(result.riskAreaHints.length).toBeLessThanOrEqual(3)
      expect(result.recommendedNextSteps.length).toBeLessThanOrEqual(2)
    })

    it('should use patient-friendly language', () => {
      const raw: RawSignalData = {
        riskLevel: 'high',
        redFlags: ['test_flag'],
      }

      const result = transformToPatientHints(raw)

      // Should not contain technical terms
      const allText = [...result.riskAreaHints, ...result.recommendedNextSteps].join(' ')
      expect(allText.toLowerCase()).not.toContain('score')
      expect(allText.toLowerCase()).not.toContain('tier')
      expect(allText.toLowerCase()).not.toContain('algorithmus')
    })

    it('should limit hints to max 3 risk areas', () => {
      const raw: RawSignalData = {
        riskLevel: 'high',
        safetyFindings: { finding1: true, finding2: true, finding3: true, finding4: true },
      }

      const result = transformToPatientHints(raw)

      expect(result.riskAreaHints.length).toBeLessThanOrEqual(3)
    })
  })

  describe('validatePatientSignal', () => {
    it('should pass validation for compliant hints', () => {
      const hint: PatientSignalHint = {
        hasRedFlags: false,
        riskAreaHints: ['Einige Bereiche könnten weitere Aufmerksamkeit benötigen'],
        recommendedNextSteps: ['Weitere Abklärung sinnvoll'],
        isCollapsed: true,
      }

      const result = validatePatientSignal(hint)

      expect(result.isValid).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should detect numeric scores', () => {
      const hint: PatientSignalHint = {
        hasRedFlags: false,
        riskAreaHints: ['Ihr Score ist 75'],
        recommendedNextSteps: [],
        isCollapsed: true,
      }

      const result = validatePatientSignal(hint)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'NUMERIC_SCORE',
          ruleName: 'R-08.4.1',
        })
      )
    })

    it('should detect percentages', () => {
      const hint: PatientSignalHint = {
        hasRedFlags: false,
        riskAreaHints: ['Risiko bei 50%'],
        recommendedNextSteps: [],
        isCollapsed: true,
      }

      const result = validatePatientSignal(hint)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'PERCENTAGE',
          ruleName: 'R-08.4.2',
        })
      )
    })

    it('should detect forbidden diagnostic terms', () => {
      const hint: PatientSignalHint = {
        hasRedFlags: false,
        riskAreaHints: ['Die Diagnose zeigt erhöhtes Risiko'],
        recommendedNextSteps: [],
        isCollapsed: true,
      }

      const result = validatePatientSignal(hint)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'DIAGNOSTIC_TERM',
          ruleName: 'R-08.4.3',
        })
      )
    })
  })

  describe('getRedFlagMessage', () => {
    it('should return no-flags message when hasRedFlags is false', () => {
      const message = getRedFlagMessage(false)
      expect(message).toBe('Es wurden keine Warnhinweise erkannt')
    })

    it('should return has-flags message when hasRedFlags is true', () => {
      const message = getRedFlagMessage(true)
      expect(message).toBe('Es gibt Hinweise, die ärztlich geprüft werden sollten')
    })
  })

  describe('validateMaxBullets', () => {
    it('should pass with 5 or fewer bullets', () => {
      const hint: PatientSignalHint = {
        hasRedFlags: true, // 1 bullet (red flag message)
        riskAreaHints: ['hint1', 'hint2'], // 2 bullets
        recommendedNextSteps: ['step1'], // 1 bullet
        isCollapsed: true,
      }

      const result = validateMaxBullets(hint)
      expect(result).toBe(true) // 1 + 2 + 1 = 4 bullets
    })

    it('should fail with more than 5 bullets', () => {
      const hint: PatientSignalHint = {
        hasRedFlags: true, // 1 bullet
        riskAreaHints: ['hint1', 'hint2', 'hint3'], // 3 bullets
        recommendedNextSteps: ['step1', 'step2'], // 2 bullets
        isCollapsed: true,
      }

      const result = validateMaxBullets(hint)
      expect(result).toBe(false) // 1 + 3 + 2 = 6 bullets
    })
  })
})
