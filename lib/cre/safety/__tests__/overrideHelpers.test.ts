import { computeEffectivePolicy, validatePolicyOverride } from '../overrideHelpers'
import type { SafetyPolicyResult } from '@/lib/types/clinicalIntake'

describe('override helpers', () => {
  const basePolicyResult: SafetyPolicyResult = {
    policy_version: '2.1',
    escalation_level: 'B',
    chat_action: 'warn',
    studio_badge: 'B',
    patient_banner_text: 'warn',
  }

  it('uses override when provided', () => {
    const result = computeEffectivePolicy({
      policyResult: basePolicyResult,
      policyOverride: {
        override_level: 'A',
        override_action: 'hard_stop',
        reason: 'test',
        created_by: 'user-1',
        created_at: '2026-02-13T00:00:00Z',
      },
    })

    expect(result.effective_level).toBe('A')
    expect(result.effective_action).toBe('hard_stop')
  })

  it('uses policy result when override is null', () => {
    const result = computeEffectivePolicy({
      policyResult: basePolicyResult,
      policyOverride: null,
    })

    expect(result.effective_level).toBe('B')
    expect(result.effective_action).toBe('warn')
  })

  it('requires reason when override is set', () => {
    expect(
      validatePolicyOverride({ overrideLevel: 'A', overrideAction: null, reason: '' }).ok,
    ).toBe(false)
    expect(
      validatePolicyOverride({ overrideLevel: null, overrideAction: 'hard_stop', reason: null }).ok,
    ).toBe(false)
  })
})
