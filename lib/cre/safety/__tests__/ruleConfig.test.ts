import { guardRuleActivation, validateRuleConfig } from '@/lib/cre/safety/ruleConfig'

describe('safety rule config validation', () => {
  it('accepts a valid rule config', () => {
    const result = validateRuleConfig({
      patterns: ['brustschmerz'],
      qualifiers: {
        requires_any_of: [{ id: 'acute', patterns: ['akut'] }],
      },
      exclusions: ['kein brustschmerz'],
      exclusion_mode: 'always',
    })

    expect(result.ok).toBe(true)
  })

  it('rejects rule config without patterns', () => {
    const result = validateRuleConfig({})

    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('blocks activation for A-level without verified evidence requirement', () => {
    const result = guardRuleActivation({
      ruleKey: 'SFTY-2.1-R-SEVERE-DYSPNEA',
      logic: { patterns: ['atemnot'] },
      defaults: { level_default: 'A' },
    })

    expect(result.ok).toBe(false)
  })

  it('blocks suicidal A-level without intent qualifiers', () => {
    const result = guardRuleActivation({
      ruleKey: 'SFTY-2.1-R-SUICIDAL-IDEATION',
      logic: { patterns: ['suizid'], requires_verified_evidence: true },
      defaults: { level_default: 'A' },
    })

    expect(result.ok).toBe(false)
  })

  it('allows activation when guardrails are satisfied', () => {
    const result = guardRuleActivation({
      ruleKey: 'SFTY-2.1-R-SUICIDAL-IDEATION',
      logic: {
        patterns: ['suizid'],
        requires_verified_evidence: true,
        a_level_requires_any_of: [{ id: 'intent', patterns: ['ich will', 'umbringen'] }],
      },
      defaults: { level_default: 'A' },
    })

    expect(result.ok).toBe(true)
  })
})
