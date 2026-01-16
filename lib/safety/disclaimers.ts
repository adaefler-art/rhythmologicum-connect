/**
 * E6.6.8 — Safety Copy: Centralized Disclaimers & Emergency Guidance
 *
 * Single source of truth for all patient-facing disclaimers and emergency contact information.
 * Ensures consistent safety messaging across dashboard, triage, and escalation paths.
 *
 * Key Principles:
 * - Clear, concise language (German)
 * - Consistent emergency numbers across all contexts
 * - Non-emergency disclaimers prevent misuse
 * - Red flag escalations use stronger, more urgent language
 */

/**
 * Emergency contact numbers for Germany
 * These should be displayed consistently throughout the app
 */
export const EMERGENCY_CONTACTS = {
  /** Emergency services (ambulance, fire, police) */
  EMERGENCY: {
    number: '112',
    label: 'Notarzt / Rettungsdienst',
  },
  /** Medical on-call service (non-emergency) */
  ON_CALL_DOCTOR: {
    number: '116 117',
    label: 'Ärztlicher Bereitschaftsdienst',
  },
  /** Suicide prevention hotline (24/7) */
  SUICIDE_PREVENTION: {
    number: '0800 111 0 111',
    label: 'Telefonseelsorge (kostenfrei, 24/7)',
  },
} as const

/**
 * Non-emergency disclaimer for dashboard and general AMY interactions
 * Use this near AMY composer and general triage entry points
 */
export const NON_EMERGENCY_DISCLAIMER = {
  title: 'Hinweis',
  text: 'Dies ist kein Notfalldienst. Bei akuten medizinischen Notfällen wählen Sie bitte 112.',
} as const

/**
 * Standard emergency guidance (moderate urgency)
 * Use in AMY composer when ESCALATE tier is detected
 */
export const STANDARD_EMERGENCY_GUIDANCE = {
  title: 'Bei akuten Notfällen',
  text: 'Wählen Sie bitte sofort 112 oder wenden Sie sich an Ihren Arzt.',
} as const

/**
 * Strong emergency warning for red flag escalation paths
 * Use in EscalationOfferCard and high-risk result screens
 */
export const RED_FLAG_EMERGENCY_WARNING = {
  title: 'Bei akuter Gefahr',
  text: 'Wenden Sie sich bitte umgehend an:',
  urgentAction:
    'Wählen Sie bitte umgehend den Notruf 112 oder wenden Sie sich an die nächste Notaufnahme.',
} as const

/**
 * Escalation offer disclaimer
 * Use in EscalationOfferCard to explain the purpose of escalation
 */
export const ESCALATION_DISCLAIMER = {
  title: 'Bitte beachten Sie',
  intro: 'Basierend auf Ihren Antworten empfehlen wir eine persönliche Rücksprache.',
} as const

/**
 * Helper function to format emergency contacts as list items
 * Returns array of { number, label } for consistent rendering
 */
export function getEmergencyContactsList() {
  return Object.values(EMERGENCY_CONTACTS)
}

/**
 * Get full non-emergency disclaimer text
 * For accessibility and consistency
 */
export function getNonEmergencyDisclaimerText(): string {
  return `${NON_EMERGENCY_DISCLAIMER.title}: ${NON_EMERGENCY_DISCLAIMER.text}`
}

/**
 * Get red flag emergency warning text
 * For accessibility and consistency
 */
export function getRedFlagEmergencyWarningText(): string {
  return `${RED_FLAG_EMERGENCY_WARNING.title}: ${RED_FLAG_EMERGENCY_WARNING.urgentAction}`
}
