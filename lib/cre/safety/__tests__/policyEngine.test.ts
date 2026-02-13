import { applySafetyPolicy } from '../policyEngine'
import type { SafetyPolicyConfig } from '../policyEngine'
import type { SafetyTriggeredRule, EscalationLevel } from '@/lib/types/clinicalIntake'

describe('Safety policy engine', () => {
  const buildPolicy = (): SafetyPolicyConfig => ({
    version: 'v1',
    defaults: {
      escalationBySeverity: { A: 'A', B: 'B', C: 'C' },
      chatActionBySeverity: { A: 'hard_stop', B: 'warn', C: 'warn' },
      studioBadgeByLevel: { A: 'A', B: 'B', C: 'C', None: 'None' },
      patientBannerTextByAction: {
        none: '',
        warn: 'warn',
        require_confirm: 'confirm',
        hard_stop: 'stop',
      },
    },
    rules: {
      'SFTY-2.1-R-SEVERE-DYSPNEA': {
        chatAction: 'hard_stop',
        escalationLevel: 'A',
      },
      'SFTY-2.1-R-CHEST-PAIN': {
        chatAction: 'warn',
        escalationLevel: 'B',
      },
    },
  })

  const rule = (rule_id: string, severity: EscalationLevel): SafetyTriggeredRule => ({
    rule_id,
    title: 'Test rule',
    level: severity,
    short_reason: 'test',
    evidence: [],
    verified: true,
    unverified: false,
    severity,
    policy_version: '2.1',
  })

  it('applies defaults and selects highest severity', () => {
    const policy = buildPolicy()
    const result = applySafetyPolicy({
      triggeredRules: [rule('SFTY-2.1-R-CHEST-PAIN', 'B')],
      policy,
    })

    expect(result.escalation_level).toBe('B')
    expect(result.chat_action).toBe('warn')
    expect(result.studio_badge).toBe('B')
  })

  it('picks strongest action across multiple rules', () => {
    const policy = buildPolicy()
    const result = applySafetyPolicy({
      triggeredRules: [
        rule('SFTY-2.1-R-CHEST-PAIN', 'B'),
        rule('SFTY-2.1-R-SEVERE-DYSPNEA', 'A'),
      ],
      policy,
    })

    expect(result.escalation_level).toBe('A')
    expect(result.chat_action).toBe('hard_stop')
  })

  it('returns safe defaults when no rules are triggered', () => {
    const policy = buildPolicy()
    const result = applySafetyPolicy({ triggeredRules: [], policy })

    expect(result.escalation_level).toBeNull()
    expect(result.chat_action).toBe('none')
  })
})
