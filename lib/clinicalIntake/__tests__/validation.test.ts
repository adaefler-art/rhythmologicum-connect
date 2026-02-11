/**
 * Issue 10: Clinical Intake Validation Tests
 */

import { validateIntakeQuality } from '../validation'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

describe('Clinical Intake Validation', () => {
  describe('validateIntakeQuality', () => {
    it('should pass validation for valid intake', () => {
      const structuredData: StructuredIntakeData = {
        status: 'draft',
        chief_complaint: 'Kopfschmerzen seit 2 Stunden',
        history_of_present_illness: {
          onset: 'Heute morgen',
          duration: '2 Stunden',
          course: 'Konstant',
          associated_symptoms: ['Lichtempfindlichkeit'],
          relieving_factors: ['Ruhe'],
          aggravating_factors: ['Licht', 'Lärm'],
        },
        relevant_negatives: ['Keine Übelkeit', 'Kein Erbrechen'],
        past_medical_history: ['Migräne in der Familie'],
        medication: ['Keine Dauermedikation'],
        psychosocial_factors: ['Beruflicher Stress'],
        red_flags: [],
        uncertainties: ['Genaue Ursache unklar'],
      }

      const clinicalSummary =
        'Patient mit akuten Kopfschmerzen frontal, Beginn heute morgen. Dauer bisher 2 Stunden, konstanter Verlauf. Begleitsymptome: Lichtempfindlichkeit. Besserung durch Ruhe, Verschlechterung durch Licht und Lärm. Keine Übelkeit oder Erbrechen. Familienanamnese positiv für Migräne. Beruflich aktuell unter Stress. Keine Hinweise auf akute Red Flags.'

      const report = validateIntakeQuality(structuredData, clinicalSummary)

      expect(report.isValid).toBe(true)
      expect(report.errors).toHaveLength(0)
    })

    it('should fail when clinical summary contains colloquial language (R-I10-1.1)', () => {
      const structuredData: StructuredIntakeData = {
        status: 'draft',
        chief_complaint: 'Kopfschmerzen',
      }

      const clinicalSummary = 'Patient hat super starke Kopfschmerzen, alles okay ansonsten'

      const report = validateIntakeQuality(structuredData, clinicalSummary)

      expect(report.isValid).toBe(false)
      expect(report.errors.some((e) => e.rule === 'R-I10-1.1')).toBe(true)
    })

    it('should fail when clinical summary is too short (R-I10-1.2)', () => {
      const structuredData: StructuredIntakeData = {
        status: 'draft',
        chief_complaint: 'Kopfschmerzen',
      }

      const clinicalSummary = 'Kurz'

      const report = validateIntakeQuality(structuredData, clinicalSummary)

      expect(report.isValid).toBe(false)
      expect(report.errors.some((e) => e.rule === 'R-I10-1.2')).toBe(true)
    })

    it('should fail when structured data is empty (R-I10-2.1)', () => {
      const structuredData: StructuredIntakeData = {
        status: 'draft',
      }

      const clinicalSummary = 'Dies ist ein ausreichend langer klinischer Summary für den Test'

      const report = validateIntakeQuality(structuredData, clinicalSummary)

      expect(report.isValid).toBe(false)
      expect(report.errors.some((e) => e.rule === 'R-I10-2.1')).toBe(true)
    })

    it('should fail when array fields contain invalid data (R-I10-2.2)', () => {
      const structuredData: StructuredIntakeData = {
        status: 'draft',
        chief_complaint: 'Kopfschmerzen',
        medication: ['Valid string', 123 as any], // Invalid: number in string array
      }

      const clinicalSummary = 'Dies ist ein ausreichend langer klinischer Summary für den Test'

      const report = validateIntakeQuality(structuredData, clinicalSummary)

      expect(report.isValid).toBe(false)
      expect(report.errors.some((e) => e.rule === 'R-I10-2.2')).toBe(true)
    })

    it('should warn when clinical summary contains chat-like language (R-I10-3.1)', () => {
      const structuredData: StructuredIntakeData = {
        status: 'draft',
        chief_complaint: 'Kopfschmerzen',
      }

      const clinicalSummary =
        'Patient sagt, dass er Kopfschmerzen hat seit gestern. Wie der Patient im Chat erwähnt, keine Übelkeit.'

      const report = validateIntakeQuality(structuredData, clinicalSummary)

      expect(report.warnings.some((w) => w.rule === 'R-I10-3.1')).toBe(true)
    })

    it('should validate red flags properly (R-I10-4.1)', () => {
      const structuredDataWithVagueFlags: StructuredIntakeData = {
        status: 'draft',
        chief_complaint: 'Brustschmerz',
        red_flags: ['Ja'], // Too short/vague
      }

      const clinicalSummary = 'Patient mit akutem Brustschmerz, weitere Abklärung notwendig.'

      const report = validateIntakeQuality(structuredDataWithVagueFlags, clinicalSummary)

      expect(report.warnings.some((w) => w.rule === 'R-I10-4.1')).toBe(true)
    })

    it('should document when no red flags are present (R-I10-4.1)', () => {
      const structuredData: StructuredIntakeData = {
        status: 'draft',
        chief_complaint: 'Kopfschmerzen',
        red_flags: [],
      }

      const clinicalSummary = 'Patient mit Kopfschmerzen, keine Red Flags identifiziert.'

      const report = validateIntakeQuality(structuredData, clinicalSummary)

      const redFlagCheck = report.checks.find((c) => c.rule === 'R-I10-4.1')
      expect(redFlagCheck?.passed).toBe(true)
    })

    it('should track uncertainties when present (R-I10-4.2)', () => {
      const structuredData: StructuredIntakeData = {
        status: 'draft',
        chief_complaint: 'Kopfschmerzen',
        uncertainties: ['Genaue Diagnose unklar', 'Trigger-Faktoren nicht identifiziert'],
      }

      const clinicalSummary = 'Patient mit Kopfschmerzen, Ursache noch unklar.'

      const report = validateIntakeQuality(structuredData, clinicalSummary)

      const uncertaintyCheck = report.checks.find((c) => c.rule === 'R-I10-4.2')
      expect(uncertaintyCheck?.passed).toBe(true)
      expect(uncertaintyCheck?.message).toContain('2 uncertainties')
    })
  })
})
