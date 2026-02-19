import { buildVisitPreparationSummary } from '../visitPreparation'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

describe('buildVisitPreparationSummary', () => {
  it('returns empty summary for missing structured data', () => {
    expect(buildVisitPreparationSummary(null)).toEqual({
      chiefComplaint: null,
      course: [],
      redFlags: [],
      medication: [],
    })
  })

  it('maps key UC1 fields into deterministic visit preparation summary', () => {
    const structuredData: StructuredIntakeData = {
      status: 'draft',
      chief_complaint: 'Brustschmerz bei Belastung',
      history_of_present_illness: {
        onset: 'seit gestern',
        duration: '10 Minuten',
        course: 'zunehmend',
        trigger: 'Treppensteigen',
        frequency: '3x täglich',
      },
      red_flags: ['Brustschmerz'],
      safety: {
        red_flag_present: true,
        escalation_level: 'A',
        red_flags: [],
        triggered_rules: [
          {
            rule_id: 'rf-1',
            title: 'Akute Warnzeichen',
            level: 'A',
            short_reason: 'akuter Druck auf der Brust',
            evidence: [],
            verified: true,
            policy_version: 'v1',
          },
        ],
      },
      medication_entries: [
        {
          name: 'Metoprolol',
          dosage: '50mg',
          intake_frequency: '1x täglich',
        },
      ],
    }

    const summary = buildVisitPreparationSummary(structuredData)

    expect(summary.chiefComplaint).toBe('Brustschmerz bei Belastung')
    expect(summary.course).toEqual([
      'Beginn: seit gestern',
      'Dauer: 10 Minuten',
      'Verlauf: zunehmend',
      'Auslöser: Treppensteigen',
      'Häufigkeit: 3x täglich',
    ])
    expect(summary.redFlags).toEqual(['Brustschmerz', 'akuter Druck auf der Brust'])
    expect(summary.medication).toEqual(['Metoprolol (50mg, 1x täglich)'])
  })

  it('filters none-reported medication values and falls back to plain medication list', () => {
    const structuredData: StructuredIntakeData = {
      status: 'draft',
      medication: ['none_reported', 'Ibuprofen bei Bedarf'],
    }

    const summary = buildVisitPreparationSummary(structuredData)

    expect(summary.medication).toEqual(['Ibuprofen bei Bedarf'])
  })
})