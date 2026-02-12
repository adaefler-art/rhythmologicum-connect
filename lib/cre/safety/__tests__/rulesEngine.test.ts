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
  })
})
