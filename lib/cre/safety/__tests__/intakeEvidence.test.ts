import { attachIntakeEvidenceAfterSave } from '../intakeEvidence'
import type { SafetyTriggeredRule } from '@/lib/types/clinicalIntake'

describe('attachIntakeEvidenceAfterSave', () => {
  it('attaches intake evidence with persisted intake id', () => {
    const intakeId = '11111111-1111-1111-1111-111111111111'
    const triggeredRules: SafetyTriggeredRule[] = [
      {
        rule_id: 'SFTY-2.1-R-CHEST-PAIN-20M',
        title: 'Brustschmerz > 20 Minuten',
        level: 'A',
        short_reason: 'test',
        evidence: [
          {
            source: 'chat',
            source_id: 'msg-1',
            excerpt: 'Ich habe Brustschmerz seit 30 Minuten.',
          },
        ],
        verified: true,
        unverified: false,
        severity: 'A',
        policy_version: '2.1',
      },
    ]

    const result = attachIntakeEvidenceAfterSave({
      intakeId,
      structuredData: {
        status: 'draft',
        history_of_present_illness: {
          duration: '30 Minuten',
        },
      },
      triggeredRules,
    })

    const evidence = result[0].evidence
    expect(evidence.some((item) => item.source === 'intake')).toBe(true)
    const intakeEvidence = evidence.find((item) => item.source === 'intake')
    expect(intakeEvidence).toBeDefined()
    expect(intakeEvidence?.source_id).toBe(intakeId)
    expect(intakeEvidence?.field_path).toBe('structured_data.history_of_present_illness.duration')
  })

  it('filters invalid intake evidence', () => {
    const intakeId = '22222222-2222-2222-2222-222222222222'
    const triggeredRules: SafetyTriggeredRule[] = [
      {
        rule_id: 'SFTY-2.1-R-UNCERTAINTY-2PLUS',
        title: 'Mehrere Unsicherheiten',
        level: 'C',
        short_reason: 'test',
        evidence: [
          {
            source: 'intake',
            source_id: '33333333-3333-3333-3333-333333333333',
            excerpt: 'unverified',
            field_path: 'structured_data.uncertainties',
          },
        ],
        verified: false,
        unverified: true,
        severity: 'C',
        policy_version: '2.1',
      },
    ]

    const result = attachIntakeEvidenceAfterSave({
      intakeId,
      structuredData: {
        status: 'draft',
        uncertainties: ['Unsicherheit A', 'Unsicherheit B'],
      },
      triggeredRules,
    })

    expect(result[0].evidence.every((item) => item.source_id === intakeId)).toBe(true)
  })
})
