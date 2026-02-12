import type { SafetyEvaluation } from '@/lib/types/clinicalIntake'

export type SafetyUiState = {
  blockChat: boolean
  showClinicianReview: boolean
}

export const getSafetyUiState = (safety: SafetyEvaluation | null): SafetyUiState => {
  const level = safety?.escalation_level ?? null
  return {
    blockChat: level === 'A',
    showClinicianReview: level === 'B',
  }
}
