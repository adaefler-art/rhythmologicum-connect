import { generateReasoningPack } from '@/lib/cre/reasoning/engine'
import type { ClinicalReasoningConfig } from '@/lib/cre/reasoning/config'

const config: ClinicalReasoningConfig = {
  differential_templates: [
    {
      label: 'Panic-like autonomic episode',
      trigger_terms: ['herzrasen', 'angst'],
      required_terms: ['herzrasen'],
      base_likelihood: 'medium',
    },
    {
      label: 'Stress reactivity',
      trigger_terms: ['stress', 'angespannt'],
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
      condition_label: 'Panic-like autonomic episode',
      questions: [{ text: 'Wann tritt es auf?', priority: 1 }],
    },
  ],
}

describe('reasoning engine', () => {
  it('produces deterministic output for same input', () => {
    const input = {
      status: 'draft' as const,
      chief_complaint: 'Ich habe Herzrasen und Angst.',
      history_of_present_illness: {
        duration: 'seit 2 Tagen',
      },
      safety: {
        red_flag_present: true,
        escalation_level: 'B' as const,
        red_flags: [],
        triggered_rules: [
          {
            rule_id: 'SFTY-2.1-R-SEVERE-PALPITATIONS',
            title: 'Starkes Herzrasen',
            level: 'B' as const,
            short_reason: 'test',
            evidence: [],
            verified: true,
            policy_version: 'v1',
          },
        ],
      },
    }

    const first = generateReasoningPack(input, config)
    const second = generateReasoningPack(input, config)

    expect(second).toEqual(first)
    expect(first.differentials[0]?.label).toBe('Panic-like autonomic episode')
    expect(first.differentials[0]?.matched_triggers.length).toBeGreaterThan(0)
  })
})
