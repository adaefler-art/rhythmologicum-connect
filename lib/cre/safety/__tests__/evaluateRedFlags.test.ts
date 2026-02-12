import { evaluateRedFlags } from '../redFlags'

describe('CRE safety evaluator', () => {
  it('flags prolonged chest pain as Level A', () => {
    const result = evaluateRedFlags({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Brustschmerz seit 30 Minuten',
        history_of_present_illness: {
          duration: '30 Minuten',
        },
      },
    })

    expect(result.escalation_level).toBe('A')
    expect(result.red_flags.some((flag) => flag.id === 'CHEST_PAIN_PROLONGED')).toBe(true)
    expect(result.rule_ids).toEqual(expect.arrayContaining(['SFTY-2.1-R-CHEST-PAIN-20M']))
    expect(result.red_flags.every((flag) => flag.policy_version === '2.1')).toBe(true)
  })

  it('flags palpitations with syncope as Level B', () => {
    const result = evaluateRedFlags({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Herzrasen und ich bin umgekippt',
      },
    })

    expect(result.escalation_level).toBe('B')
    const ids = result.red_flags.map((flag) => flag.id)
    expect(ids).toContain('SEVERE_PALPITATIONS')
    expect(ids).toContain('SYNCOPE')
    expect(result.rule_ids).toEqual(
      expect.arrayContaining(['SFTY-2.1-R-SEVERE-PALPITATIONS', 'SFTY-2.1-R-SYNCOPE']),
    )
    expect(result.red_flags.every((flag) => Boolean(flag.rule_id))).toBe(true)
  })

  it('flags suicidal ideation as Level A', () => {
    const result = evaluateRedFlags({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Ich habe Suizidgedanken',
      },
    })

    expect(result.escalation_level).toBe('A')
    expect(result.red_flags.some((flag) => flag.id === 'SUICIDAL_IDEATION')).toBe(true)
    expect(result.rule_ids).toEqual(expect.arrayContaining(['SFTY-2.1-R-SUICIDAL-IDEATION']))
    expect(
      result.red_flags.every(
        (flag) =>
          Array.isArray(flag.evidence_message_ids) || flag.evidence_message_ids === undefined,
      ),
    ).toBe(true)
  })
})
