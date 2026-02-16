/**
 * Funnel Reachability Allowlist
 *
 * Defines which funnel slugs are patient-reachable (can be accessed directly).
 * Funnels not in this allowlist are "ADMIN-ONLY" and cannot be started by patients.
 *
 * Note: `is_active` in the database means the funnel definition is active,
 * NOT that patients can start it. This allowlist controls patient reachability.
 *
 * @module lib/config/funnelAllowlist
 */

/**
 * Patient-reachable funnel slugs
 *
 * Add slugs here to make them accessible to patients.
 * Remove or don't include slugs to restrict them to admin-only.
 */
export const PATIENT_REACHABLE_FUNNELS: readonly string[] = [
  'first-intake-sociological-anamnesis',
  'stress-assessment',
  'cardiovascular-age',
  // Add more slugs as they become patient-ready:
  // 'sleep-quality',
] as const

/**
 * Check if a funnel slug is patient-reachable
 *
 * @param slug - The funnel slug to check
 * @returns true if patients can access/start this funnel
 */
export function isFunnelPatientReachable(slug: string): boolean {
  return PATIENT_REACHABLE_FUNNELS.includes(slug)
}

/**
 * Default funnel slug for new patient assessments
 * Used by NextStep resolver when patient hasn't started any funnel
 */
export const DEFAULT_PATIENT_FUNNEL = 'first-intake-sociological-anamnesis' as const
