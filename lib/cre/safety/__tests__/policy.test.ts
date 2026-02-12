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
})
