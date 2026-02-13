import {
  guardReasoningActivation,
  validateClinicalReasoningConfig,
} from '@/lib/cre/reasoning/config'

describe('clinical reasoning config validation', () => {
  it('accepts a valid config shape', () => {
    const result = validateClinicalReasoningConfig({
      differential_templates: [
        {
          label: 'Panic-like autonomic episode',
          trigger_terms: ['herzrasen', 'angst'],
          base_likelihood: 'medium',
        },
      ],
      risk_weighting: {
        red_flag_weight: 3,
        chronicity_weight: 2,
        anxiety_modifier: 1,
      },
      open_question_templates: [
        {
          condition_label: 'Panic-like autonomic episode',
          questions: [{ text: 'Wann treten die Beschwerden auf?', priority: 1 }],
        },
      ],
    })

    expect(result.ok).toBe(true)
  })

  it('rejects out-of-range risk weighting', () => {
    const result = validateClinicalReasoningConfig({
      differential_templates: [
        {
          label: 'Stress',
          trigger_terms: ['stress'],
          base_likelihood: 'low',
        },
      ],
      risk_weighting: {
        red_flag_weight: 999,
        chronicity_weight: 2,
        anxiety_modifier: 1,
      },
      open_question_templates: [
        {
          condition_label: 'Stress',
          questions: [{ text: 'Frage?', priority: 2 }],
        },
      ],
    })

    expect(result.ok).toBe(false)
  })

  it('blocks activation for empty question templates', () => {
    const result = guardReasoningActivation({
      differential_templates: [
        {
          label: 'Stress',
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
          condition_label: 'Stress',
          questions: [],
        },
      ],
    })

    expect(result.ok).toBe(false)
  })
})
