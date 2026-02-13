import { guardReasoningActivation } from '@/lib/cre/reasoning/config'

describe('reasoning activation guard', () => {
  it('rejects invalid configuration payload', () => {
    const result = guardReasoningActivation({
      differential_templates: [],
      risk_weighting: {
        red_flag_weight: 1,
        chronicity_weight: 1,
        anxiety_modifier: 1,
      },
      open_question_templates: [],
    })

    expect(result.ok).toBe(false)
  })

  it('accepts valid draft payload for activation', () => {
    const result = guardReasoningActivation({
      differential_templates: [
        {
          label: 'Stress reactivity',
          trigger_terms: ['stress'],
          base_likelihood: 'low',
        },
      ],
      risk_weighting: {
        red_flag_weight: 3,
        chronicity_weight: 2,
        anxiety_modifier: 1,
      },
      open_question_templates: [
        {
          condition_label: 'Stress reactivity',
          questions: [{ text: 'Welche Ausloeser bestehen?', priority: 2 }],
        },
      ],
    })

    expect(result.ok).toBe(true)
  })
})
