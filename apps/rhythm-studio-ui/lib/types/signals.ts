/**
 * Signal Types (Issue 8)
 * 
 * Signals are automated medical assistance indicators (NOT diagnoses)
 * that are displayed differently for clinicians and patients.
 */

/**
 * Raw signal data from database/API
 * Contains full technical details for clinician consumption
 */
export interface RawSignalData {
  /** Risk level from reports table */
  riskLevel?: string | null
  /** Safety score from reports (0-100) */
  safetyScore?: number | null
  /** Safety findings JSONB from reports */
  safetyFindings?: Record<string, unknown> | null
  /** Risk models JSONB from calculated_results */
  riskModels?: Record<string, unknown> | null
  /** Priority ranking data */
  priorityRanking?: Record<string, unknown> | null
  /** Red flags array (from triage_sessions or pre_screening_calls) */
  redFlags?: string[] | null
}

/**
 * Structured signal for clinician view
 * Full transparency with all technical details
 */
export interface ClinicianSignal {
  /** Risk Level / Risk Category */
  riskLevel?: string | null
  /** Numeric risk score if available */
  riskScore?: number | null
  /** Signal codes/labels (extracted from safety findings, risk models) */
  signalCodes: string[]
  /** Priority ranking data */
  priorityRanking?: {
    tier?: string
    rank?: number
    interventions?: unknown[]
  } | null
  /** Red flags with rationale */
  redFlags: {
    code: string
    description?: string
    severity?: string
  }[]
  /** Automatically generated timestamp */
  generatedAt?: string
  /** Algorithm version for traceability */
  algorithmVersion?: string
}

/**
 * Patient-friendly signal hint
 * Limited, non-diagnostic, simplified view
 */
export interface PatientSignalHint {
  /** Whether any red flags were detected (boolean only, no details) */
  hasRedFlags: boolean
  /** 1-3 hints on possible risk areas (non-diagnostic language) */
  riskAreaHints: string[]
  /** Recommended next steps (non-directive language) */
  recommendedNextSteps: string[]
  /** MUST be collapsed by default */
  isCollapsed: boolean
}

/**
 * Validation result for patient-facing signals
 * Ensures forbidden content is not displayed
 */
export interface SignalValidationResult {
  isValid: boolean
  violations: {
    type: 'NUMERIC_SCORE' | 'PERCENTAGE' | 'SIGNAL_CODE' | 'DIAGNOSTIC_TERM' | 'DIRECTIVE_LANGUAGE'
    content: string
    ruleName: string
  }[]
}

/**
 * Forbidden terms that must not appear in patient-facing signals
 * Issue 8: R-08.1
 */
export const FORBIDDEN_PATIENT_TERMS = [
  // Diagnostic terms
  'diagnose',
  'erkrankung festgestellt',
  'krankheit',
  'pathologie',
  
  // Directive/final language (without medical context)
  'kritisches risiko',
  'gefährlich',
  'sofortige behandlung',
  
  // Technical terms
  'score',
  'prozent',
  '%',
  'signal code',
  'tier',
  'ranking',
  'algorithmus',
] as const

/**
 * Allowed hint templates for patient view
 * Non-diagnostic, assistive language
 */
export const PATIENT_HINT_TEMPLATES = {
  noRedFlags: 'Es wurden keine Warnhinweise erkannt',
  hasRedFlags: 'Es gibt Hinweise, die ärztlich geprüft werden sollten',
  riskArea: (area: string) => `Bereich "${area}" könnte weitere Aufmerksamkeit benötigen`,
  nextStep: 'Weitere Abklärung sinnvoll',
  generalFollowUp: 'Rücksprache mit ärztlichem Team empfohlen',
} as const
