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
      verbatimChatMessages: [
        {
          id: 'msg-1',
          content: 'Ich habe Brustschmerz seit 30 Minuten.',
        },
      ],
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
      verbatimChatMessages: [
        {
          id: 'msg-2',
          content: 'Herzrasen und ich bin umgekippt.',
        },
      ],
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
      verbatimChatMessages: [
        {
          id: 'msg-3',
          content: 'Ich habe Suizidgedanken.',
        },
      ],
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

  it('downgrades A-level rules when evidence is not verifiable', () => {
    const result = evaluateRedFlags({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Ich habe Suizidgedanken',
      },
    })

    const rule = result.triggered_rules?.find(
      (entry) => entry.rule_id === 'SFTY-2.1-R-SUICIDAL-IDEATION',
    )

    expect(result.escalation_level).not.toBe('A')
    expect(rule?.verified).toBe(false)
    expect(rule?.level).toBe('needs_review')
    expect(rule?.evidence.length).toBe(0)
  })

  it('keeps only verified chat evidence for mixed inputs', () => {
    const result = evaluateRedFlags({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Atemnot',
      },
      verbatimChatMessages: [
        {
          id: 'msg-good',
          content: 'Ich habe starke Atemnot und bekomme kaum Luft.',
        },
        {
          id: 'msg-nope',
          content: 'Alles gut.',
        },
      ],
    })

    const rule = result.triggered_rules?.find(
      (entry) => entry.rule_id === 'SFTY-2.1-R-SEVERE-DYSPNEA',
    )

    expect(result.escalation_level).toBe('A')
    expect(rule?.verified).toBe(true)
    expect(rule?.evidence.map((item) => item.source_id)).toEqual(['msg-good'])
  })

  it('never hard-stops without verified evidence', () => {
    const result = evaluateRedFlags({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Atemnot',
      },
    })

    const rule = result.triggered_rules?.find(
      (entry) => entry.rule_id === 'SFTY-2.1-R-SEVERE-DYSPNEA',
    )

    expect(result.escalation_level).toBeNull()
    expect(rule?.verified).toBe(false)
    expect(rule?.level).toBe('needs_review')
    expect(rule?.evidence.length).toBe(0)
  })

  it('only emits chat message ids as evidence source ids', () => {
    const chatIds = ['msg-10', 'msg-11']
    const result = evaluateRedFlags({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Atemnot',
      },
      verbatimChatMessages: [
        {
          id: chatIds[0],
          content: 'Ich habe starke Atemnot.',
        },
        {
          id: chatIds[1],
          content: 'Ich habe Herzrasen.',
        },
      ],
    })

    const evidenceIds = (result.triggered_rules ?? []).flatMap((rule) =>
      rule.evidence.map((item) => item.source_id),
    )

    evidenceIds.forEach((sourceId) => {
      expect(chatIds).toContain(sourceId)
      expect(sourceId.startsWith('intake:')).toBe(false)
    })
  })
})
