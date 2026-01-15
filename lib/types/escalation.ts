/**
 * E6.4.6: Escalation Types
 *
 * Types for red flag detection and escalation offer system.
 * NO SCHEDULING - this is a stub for emergency/high-risk routing.
 */

/**
 * Red flag severity levels
 */
export type RedFlagSeverity = 'high' | 'critical'

/**
 * Red flag source - where the flag was detected
 */
export type RedFlagSource = 'report_risk_level' | 'workup_check' | 'answer_pattern'

/**
 * Red flag detection result
 */
export type RedFlag = {
  /** Severity of the red flag */
  severity: RedFlagSeverity
  /** Source that triggered the flag */
  source: RedFlagSource
  /** Human-readable reason (German) */
  reason: string
  /** Technical field/question IDs for audit (no PHI) */
  triggeredBy?: string[]
}

/**
 * Escalation offer types
 */
export type EscalationOfferType = 'video_consultation' | 'doctor_appointment' | 'emergency_contact'

/**
 * Escalation check result
 */
export type EscalationCheckResult = {
  /** Whether escalation offer should be shown */
  shouldEscalate: boolean
  /** Detected red flags */
  redFlags: RedFlag[]
  /** Correlation ID for audit trail */
  correlationId: string
}

/**
 * Escalation event metadata for audit logging
 */
export type EscalationEventMetadata = {
  correlation_id: string
  assessment_id?: string
  report_id?: string
  red_flag_severity?: RedFlagSeverity
  red_flag_source?: RedFlagSource
  offer_type?: EscalationOfferType
}
