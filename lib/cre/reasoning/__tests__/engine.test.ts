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
    expect(first.adapter?.domain).toBe('gp')
    expect(first.uncertainty_items).toBeDefined()
    expect(first.safety_alignment).toBeDefined()
  })

  it('forces reasoning risk to high when effective safety level is A', () => {
    const input = {
      status: 'draft' as const,
      chief_complaint: 'Unspezifische Beschwerden',
      history_of_present_illness: {
        duration: 'seit 2 Tagen',
      },
      safety: {
        red_flag_present: true,
        escalation_level: 'A' as const,
        effective_level: 'A' as const,
        red_flags: [],
        triggered_rules: [
          {
            rule_id: 'SFTY-2.1-R-SUICIDAL-IDEATION',
            title: 'Suizidale Gedanken',
            level: 'A' as const,
            short_reason: 'test',
            evidence: [{ source: 'chat' as const, source_id: 'm1', excerpt: 'ich will mich umbringen' }],
            verified: true,
            policy_version: 'v1',
          },
        ],
      },
    }

    const result = generateReasoningPack(input, config)
    expect(result.risk_estimation.level).toBe('high')
    expect(result.safety_alignment?.blocked_by_safety).toBe(true)
  })

  it('does not remain high without verified red flags and without hard markers', () => {
    const highWeightConfig: ClinicalReasoningConfig = {
      ...config,
      risk_weighting: {
        red_flag_weight: 10,
        chronicity_weight: 4,
        anxiety_modifier: 4,
      },
    }

    const input = {
      status: 'draft' as const,
      chief_complaint: 'Ich fuehle mich angespannt',
      history_of_present_illness: {
        duration: 'seit monaten',
      },
      safety: {
        red_flag_present: false,
        escalation_level: null,
        effective_level: null,
        red_flags: [],
        triggered_rules: [],
      },
    }

    const result = generateReasoningPack(input, highWeightConfig)
    expect(result.risk_estimation.level).toBe('medium')
  })

  it('keeps low risk for verified C-only safety findings', () => {
    const input = {
      status: 'draft' as const,
      chief_complaint: 'Unspezifisches Unwohlsein',
      safety: {
        red_flag_present: false,
        escalation_level: 'C' as const,
        effective_level: 'C' as const,
        red_flags: [],
        triggered_rules: [
          {
            rule_id: 'SFTY-2.1-R-UNCERTAINTY-2PLUS',
            title: 'Mehrere Unsicherheiten',
            level: 'C' as const,
            severity: 'C' as const,
            short_reason: 'test',
            evidence: [{ source: 'intake' as const, source_id: 'intake-1', excerpt: 'unklar' }],
            verified: true,
            policy_version: 'v1',
          },
        ],
      },
      uncertainties: ['Zeitlicher Zusammenhang unklar', 'Trigger unklar'],
    }

    const result = generateReasoningPack(input, config)
    expect(result.risk_estimation.level).toBe('low')
  })

  it('emits machine-readable conflicts when safety contradictions are present', () => {
    const input = {
      status: 'draft' as const,
      chief_complaint: 'Unspezifische Beschwerden',
      safety: {
        red_flag_present: false,
        escalation_level: 'C' as const,
        effective_level: 'C' as const,
        contradictions_present: true,
        red_flags: [],
        triggered_rules: [],
      },
      explicit_negatives: [{ text: 'kein Brustschmerz', category: 'symptom' as const, source: 'manual' as const }],
    }

    const result = generateReasoningPack(input, config)
    expect(result.conflicts?.some((entry) => entry.code === 'safety_contradictions_present')).toBe(
      true,
    )
  })
})
