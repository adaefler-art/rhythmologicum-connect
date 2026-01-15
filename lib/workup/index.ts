/**
 * E6.4.5: Workup Orchestrator
 *
 * Main entry point for workup processing.
 * Coordinates data sufficiency checks, evidence hashing, and result storage.
 */

import type { EvidencePack, DataSufficiencyResult, WorkupStatus } from '@/lib/types/workup'
import { checkDataSufficiency, getRulesetForFunnel } from './dataSufficiency'
import { generateEvidencePackHash } from './evidenceHash'

/**
 * Perform a complete workup check on an assessment
 *
 * This is the main orchestrator function that:
 * 1. Validates the evidence pack
 * 2. Runs data sufficiency checks
 * 3. Generates follow-up questions if needed
 * 4. Returns results for storage
 *
 * @param evidencePack - The evidence pack to check
 * @returns Complete data sufficiency result
 */
export function performWorkupCheck(evidencePack: EvidencePack): DataSufficiencyResult {
  // Run data sufficiency check
  const result = checkDataSufficiency(evidencePack)

  return result
}

/**
 * Get workup status from evidence pack
 *
 * Convenience function for quick status determination.
 *
 * @param evidencePack - The evidence pack to check
 * @returns Workup status
 */
export function getWorkupStatus(evidencePack: EvidencePack): WorkupStatus {
  const result = checkDataSufficiency(evidencePack)
  return result.isSufficient ? 'ready_for_review' : 'needs_more_data'
}

/**
 * Get ruleset version for a funnel
 *
 * @param funnelSlug - The funnel slug
 * @returns Ruleset version, or null if no ruleset exists
 */
export function getRulesetVersion(funnelSlug: string): string | null {
  const ruleset = getRulesetForFunnel(funnelSlug)
  return ruleset?.version ?? null
}

// Re-export key functions for convenience
export { checkDataSufficiency, generateEvidencePackHash, getRulesetForFunnel }
