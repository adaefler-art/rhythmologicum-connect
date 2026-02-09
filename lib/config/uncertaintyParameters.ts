/**
 * Issue 6: Parametrizable Uncertainty & Probability Handling
 * 
 * Central configuration for how PAT expresses uncertainty, probability, and preliminary nature
 * in medical consultations. These parameters are product- and liability-relevant.
 * 
 * MUST requirements:
 * - Parameters are set via code/config (not UI)
 * - Parameters are static per consultation
 * - Parameters are documented in every consult note header
 * - Patient and clinician modes have different defaults
 * - No diagnoses allowed regardless of parameters
 * 
 * MUST NOT (Non-Goals):
 * - Admin UI for parameter changes
 * - Live changes during consultation
 * - Automatic parameter derivation
 * - Numerical probabilities in patient mode
 * - Diagnoses through parametrization
 */

import type {
  UncertaintyProfile,
  AssertivenessLevel,
  AudienceType,
} from '@/lib/types/consultNote'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Complete uncertainty parameter set for a consultation
 */
export interface UncertaintyParameters {
  /**
   * How uncertainty is expressed linguistically
   * - off: No explicit uncertainty expressions (except red flags)
   * - qualitative: Only language markers ("possible", "probable"), no numbers
   * - mixed: Qualitative + numbers allowed in clinician mode only
   */
  uncertaintyProfile: UncertaintyProfile

  /**
   * How assertively statements are made
   * - conservative: Emphasizes preliminary nature, frequent doctor check references
   * - balanced: Neutral, standard medical tone
   * - direct: Clear but without diagnosis claims
   */
  assertiveness: AssertivenessLevel

  /**
   * Target audience determines language and detail level
   * - patient: Simple language, no numbers, no diagnosis terms
   * - clinician: More detail allowed, technical terms acceptable
   */
  audience: AudienceType
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default parameters for PATIENT mode
 * 
 * Rule R-I6-01: Patient mode defaults
 * - uncertaintyProfile = qualitative (no numbers allowed)
 * - assertiveness = conservative (emphasize preliminary nature)
 * - audience = patient (simple language)
 */
export const PATIENT_MODE_DEFAULTS: UncertaintyParameters = {
  uncertaintyProfile: 'qualitative',
  assertiveness: 'conservative',
  audience: 'patient',
}

/**
 * Default parameters for CLINICIAN mode
 * 
 * Rule R-I6-02: Clinician mode defaults
 * - uncertaintyProfile = qualitative or mixed (more detail allowed)
 * - assertiveness = balanced (neutral tone)
 * - audience = clinician (technical terms acceptable)
 */
export const CLINICIAN_MODE_DEFAULTS: UncertaintyParameters = {
  uncertaintyProfile: 'qualitative',
  assertiveness: 'balanced',
  audience: 'clinician',
}

/**
 * System default (same as patient mode for safety)
 * 
 * Rule R-I6-03: Safe defaults
 * When in doubt, use patient-safe parameters
 */
export const DEFAULT_UNCERTAINTY_PARAMETERS: UncertaintyParameters = PATIENT_MODE_DEFAULTS

// ============================================================================
// PARAMETER EFFECTS & RULES
// ============================================================================

/**
 * Rule R-I6-04: UncertaintyProfile = 'off' effects
 * - No explicit uncertainty expressions
 * - Exception: Obligatory safety warnings (red flags, doctor check)
 */
export const UNCERTAINTY_OFF_RULES = {
  noExplicitUncertainty: true,
  allowRedFlagWarnings: true,
  allowDoctorCheckReferences: true,
} as const

/**
 * Rule R-I6-05: UncertaintyProfile = 'qualitative' effects
 * - Only qualitative markers allowed:
 *   - "möglich" (possible)
 *   - "wahrscheinlich" (probable)
 *   - "weniger wahrscheinlich" (less probable)
 *   - "denkbar" (conceivable)
 *   - "könnte" (could)
 * - NO numbers
 * - NO percentages
 */
export const QUALITATIVE_MARKERS = {
  german: [
    'möglich',
    'möglicherweise',
    'wahrscheinlich',
    'weniger wahrscheinlich',
    'unwahrscheinlich',
    'denkbar',
    'könnte',
    'kann',
    'in Betracht zu ziehen',
    'naheliegend',
  ],
  prohibited: [
    /\d+%/,  // percentages
    /\d+\s*prozent/i,  // "X Prozent"
    /\d+\s*von\s*\d+/,  // "X von Y"
  ],
} as const

/**
 * Rule R-I6-06: UncertaintyProfile = 'mixed' effects
 * - Qualitative language allowed
 * - Numbers/ranges ONLY in clinician mode
 * - NO numbers in patient mode
 */
export const MIXED_MODE_RULES = {
  allowQualitativeInAll: true,
  allowNumbersInClinicianOnly: true,
  forbidNumbersInPatient: true,
} as const

/**
 * Rule R-I6-07: Assertiveness = 'conservative' effects
 * - Emphasizes preliminary nature
 * - Frequent references to doctor verification
 * - Uses softer language
 */
export const CONSERVATIVE_MARKERS = {
  german: [
    'vorläufig',
    'bedarf ärztlicher Prüfung',
    'sollte von einem Arzt geprüft werden',
    'möglicherweise',
    'könnte',
    'unter Vorbehalt',
  ],
} as const

/**
 * Rule R-I6-08: Assertiveness = 'balanced' effects
 * - Neutral, standard medical tone
 * - Professional but not overly cautious
 */
export const BALANCED_MARKERS = {
  german: [
    'wahrscheinlich',
    'in Betracht zu ziehen',
    'bedarf weiterer Abklärung',
  ],
} as const

/**
 * Rule R-I6-09: Assertiveness = 'direct' effects
 * - Clear, concise statements
 * - Still no diagnosis claims
 * - More confident tone within bounds
 */
export const DIRECT_MARKERS = {
  german: [
    'wahrscheinlich',
    'naheliegend',
    'spricht für',
    'deutet hin auf',
  ],
} as const

// ============================================================================
// AUDIENCE-SPECIFIC RULES
// ============================================================================

/**
 * Rule R-I6-10: Audience = 'patient' restrictions
 * - Simple, clear language
 * - NO medical jargon
 * - NO diagnosis terms
 * - NO numerical probabilities (even in mixed mode)
 */
export const PATIENT_AUDIENCE_RULES = {
  simpleLanguage: true,
  noMedicalJargon: true,
  noDiagnosisTerms: true,
  noNumbers: true,  // Even in mixed mode!
  maxEducationLevel: 'layperson',
} as const

/**
 * Rule R-I6-11: Audience = 'clinician' allowances
 * - Medical terminology acceptable
 * - More detail and context
 * - Numbers allowed in mixed mode
 * - Still NO definitive diagnoses
 */
export const CLINICIAN_AUDIENCE_RULES = {
  medicalTerminologyAllowed: true,
  moreDetailAllowed: true,
  numbersAllowedInMixed: true,
  noDefinitiveDiagnosis: true,  // Still enforced!
} as const

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Rule R-I6-12: Valid parameter combinations
 * 
 * Validates that parameter combination is allowed
 */
export function validateParameterCombination(
  params: UncertaintyParameters
): { valid: boolean; reason?: string } {
  // Mixed mode with patient audience should NOT allow numbers
  if (params.uncertaintyProfile === 'mixed' && params.audience === 'patient') {
    // This is allowed, but numbers will be forbidden by audience rules
    // Just a warning, not an error
  }

  // All combinations are technically valid
  // Runtime validation will enforce the rules
  return { valid: true }
}

/**
 * Rule R-I6-13: Get parameters for audience
 * 
 * Returns appropriate default parameters for given audience
 */
export function getDefaultParametersForAudience(
  audience: AudienceType
): UncertaintyParameters {
  return audience === 'patient' ? PATIENT_MODE_DEFAULTS : CLINICIAN_MODE_DEFAULTS
}

/**
 * Rule R-I6-14: Check if numbers are allowed
 * 
 * Determines if numerical probabilities can be used
 */
export function areNumbersAllowed(params: UncertaintyParameters): boolean {
  // Numbers forbidden in patient mode (R-I6-10)
  if (params.audience === 'patient') {
    return false
  }

  // Numbers only allowed in clinician mode with mixed profile (R-I6-06)
  if (params.audience === 'clinician' && params.uncertaintyProfile === 'mixed') {
    return true
  }

  // Otherwise forbidden
  return false
}

/**
 * Rule R-I6-15: Get parameter description for header
 * 
 * Returns formatted string for consult note header documentation
 */
export function formatParametersForHeader(params: UncertaintyParameters): string {
  return `Uncertainty Profile: ${params.uncertaintyProfile}
Assertiveness: ${params.assertiveness}
Audience: ${params.audience}`
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  UncertaintyParameters,
}

export {
  PATIENT_MODE_DEFAULTS,
  CLINICIAN_MODE_DEFAULTS,
  DEFAULT_UNCERTAINTY_PARAMETERS,
  UNCERTAINTY_OFF_RULES,
  QUALITATIVE_MARKERS,
  MIXED_MODE_RULES,
  CONSERVATIVE_MARKERS,
  BALANCED_MARKERS,
  DIRECT_MARKERS,
  PATIENT_AUDIENCE_RULES,
  CLINICIAN_AUDIENCE_RULES,
  validateParameterCombination,
  getDefaultParametersForAudience,
  areNumbersAllowed,
  formatParametersForHeader,
}
