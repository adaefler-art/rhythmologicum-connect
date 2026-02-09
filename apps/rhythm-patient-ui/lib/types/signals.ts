/**
 * Signal Types (Issue 8)
 */

export interface RawSignalData {
  riskLevel?: string | null
  safetyScore?: number | null
  safetyFindings?: Record<string, unknown> | null
  riskModels?: Record<string, unknown> | null
  priorityRanking?: Record<string, unknown> | null
  redFlags?: string[] | null
}

export interface PatientSignalHint {
  hasRedFlags: boolean
  riskAreaHints: string[]
  recommendedNextSteps: string[]
  isCollapsed: boolean
}

export interface SignalValidationResult {
  isValid: boolean
  violations: {
    type: 'NUMERIC_SCORE' | 'PERCENTAGE' | 'DIAGNOSTIC_TERM'
    content: string
    ruleName: string
  }[]
}

export const FORBIDDEN_PATIENT_TERMS = [
  'diagnose',
  'erkrankung festgestellt',
  'krankheit',
  'pathologie',
  'kritisches risiko',
  'gefaehrlich',
  'sofortige behandlung',
  'score',
  'prozent',
  '%',
  'signal code',
  'tier',
  'ranking',
  'algorithmus',
] as const

export const PATIENT_HINT_TEMPLATES = {
  noRedFlags: 'Es wurden keine Warnhinweise erkannt',
  hasRedFlags: 'Es gibt Hinweise, die aerztlich geprueft werden sollten',
  riskArea: (area: string) => `Bereich "${area}" koennte weitere Aufmerksamkeit benoetigen`,
  nextStep: 'Weitere Abklaerung sinnvoll',
  generalFollowUp: 'Ruecksprache mit aerztlichem Team empfohlen',
} as const
