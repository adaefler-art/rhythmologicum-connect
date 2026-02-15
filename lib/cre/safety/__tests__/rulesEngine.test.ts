import { evaluateSafetyRules } from '../rules/evaluate'

describe('Safety 2.1 rules engine', () => {
  it('emits rule ids for time-based escalation', () => {
    const result = evaluateSafetyRules({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Brustschmerz seit 30 Minuten',
        history_of_present_illness: {
          duration: '30 Minuten',
        },
      },
    })

    expect(result.ruleIds).toContain('SFTY-2.1-R-CHEST-PAIN-20M')
  })

  it('emits check ids when structured data is sparse', () => {
    const result = evaluateSafetyRules({
      structuredData: {
        status: 'draft',
      },
    })

    expect(result.checkIds).toContain('SFTY-2.1-C-CHIEF-OR-HPI')
    expect(result.checkIds).toContain('SFTY-2.2-C-10W-PRESENT')
    expect(result.checkIds).toContain('SFTY-2.2-C-OPQRST-PRESENT')
  })

  it('emits deterministic cardio+syncope domain rule', () => {
    const result = evaluateSafetyRules({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Starkes Herzrasen und Ohnmacht',
      },
      verbatimChatMessages: [
        { id: 'm-1', content: 'Ich hatte starkes Herzrasen und bin kurz ohnmaechtig geworden.' },
      ],
    })

    expect(result.ruleIds).toContain('SFTY-2.2-R-CARDIO-PALP-SYNCOPE')
  })

  it('emits deterministic contradiction rule for explicit negatives conflict', () => {
    const result = evaluateSafetyRules({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Brustschmerz',
        relevant_negatives: ['kein Brustschmerz'],
      },
      verbatimChatMessages: [
        { id: 'm-2', content: 'Ich habe Brustschmerz seit 20 Minuten.' },
      ],
    })

    expect(result.ruleIds).toContain('SFTY-2.2-R-CORE-CONTRADICTION')
  })

  it('does not emit contradiction rule when no contradiction exists', () => {
    const result = evaluateSafetyRules({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Brustschmerz',
        relevant_negatives: ['kein Fieber'],
      },
      verbatimChatMessages: [{ id: 'm-3', content: 'Brustschmerz bei Belastung.' }],
    })

    expect(result.ruleIds).not.toContain('SFTY-2.2-R-CORE-CONTRADICTION')
  })
})
