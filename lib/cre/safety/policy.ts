import type { SafetyEvaluation } from '@/lib/types/clinicalIntake'
import { getEffectiveSafetyState } from '@/lib/cre/safety/policyEngine'

export type SafetyUiState = {
  blockChat: boolean
  showClinicianReview: boolean
}

export const getSafetyUiState = (safety: SafetyEvaluation | null): SafetyUiState => {
  const effective = getEffectiveSafetyState({
    policyResult: safety?.policy_result ?? null,
    override: safety?.override ?? null,
  })
  const level = effective.escalationLevel
  return {
    blockChat: effective.chatAction === 'hard_stop',
    showClinicianReview: level === 'B',
  }
}
