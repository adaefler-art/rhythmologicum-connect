import { getSafetyUiState } from '../policy'
import type { SafetyEvaluation } from '@/lib/types/clinicalIntake'

describe('Safety UI policy', () => {
  it('blocks chat for Level A', () => {
    const safety: SafetyEvaluation = {
      red_flag_present: true,
      escalation_level: 'A',
      red_flags: [],
    }

    const state = getSafetyUiState(safety)

    expect(state.blockChat).toBe(true)
    expect(state.showClinicianReview).toBe(false)
  })

  it('allows chat but shows clinician review for Level B', () => {
    const safety: SafetyEvaluation = {
      red_flag_present: true,
      escalation_level: 'B',
      red_flags: [],
    }

    const state = getSafetyUiState(safety)

    expect(state.blockChat).toBe(false)
    expect(state.showClinicianReview).toBe(true)
  })

  it('uses override chat action when provided', () => {
    const safety: SafetyEvaluation = {
      red_flag_present: true,
      escalation_level: 'A',
      red_flags: [],
      policy_result: {
        policy_version: 'v1',
        escalation_level: 'A',
        chat_action: 'hard_stop',
        studio_badge: 'Level A',
        patient_banner_text: 'stop',
      },
      override: {
        chat_action_override: 'warn',
        level_override: 'B',
        reason: 'Test',
        by_user_id: 'user',
        at: '2026-02-12T00:00:00Z',
      },
    }

    const state = getSafetyUiState(safety)

    expect(state.blockChat).toBe(false)
    expect(state.showClinicianReview).toBe(true)
  })
})
