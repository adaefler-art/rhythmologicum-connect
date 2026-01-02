/**
 * Program Tier Contracts - Central Export
 * 
 * This file exports all program tier configurations.
 * Use this to access tier contracts in the application.
 * 
 * **Usage**:
 * ```typescript
 * import { TIER_1_ESSENTIAL, ALL_TIER_CONTRACTS } from '@/lib/contracts/tiers'
 * import { getActivePillars, getAllowedFunnels } from '@/lib/contracts/programTier'
 * 
 * // Get active pillars for Tier 1
 * const pillars = getActivePillars(TIER_1_ESSENTIAL)
 * 
 * // Get all tier contracts
 * const allTiers = ALL_TIER_CONTRACTS
 * ```
 */

import { TIER_1_ESSENTIAL } from './tier1-essential'
import { TIER_2_5_ENHANCED } from './tier2-5-enhanced'
import { TIER_2_COMPREHENSIVE } from './tier2-comprehensive'
import type { ProgramTierContract } from '../programTier'
import { PROGRAM_TIER } from '../registry'

// ============================================================
// Re-export Individual Tier Contracts
// ============================================================

export { TIER_1_ESSENTIAL } from './tier1-essential'
export { TIER_2_5_ENHANCED } from './tier2-5-enhanced'
export { TIER_2_COMPREHENSIVE } from './tier2-comprehensive'

// ============================================================
// Tier Contract Collection
// ============================================================

/**
 * All tier contracts indexed by tier level
 */
export const ALL_TIER_CONTRACTS: Record<string, ProgramTierContract> = {
  [PROGRAM_TIER.TIER_1_ESSENTIAL]: TIER_1_ESSENTIAL,
  [PROGRAM_TIER.TIER_2_5_ENHANCED]: TIER_2_5_ENHANCED,
  [PROGRAM_TIER.TIER_2_COMPREHENSIVE]: TIER_2_COMPREHENSIVE,
}

/**
 * Array of all tier contracts (ordered by tier level)
 */
export const TIER_CONTRACTS_ARRAY: ProgramTierContract[] = [
  TIER_1_ESSENTIAL,
  TIER_2_5_ENHANCED,
  TIER_2_COMPREHENSIVE,
]

// ============================================================
// Lookup Functions
// ============================================================

/**
 * Get a tier contract by tier level
 * @param tier - The tier level to get
 * @returns The tier contract or undefined if not found
 */
export function getTierContract(tier: string): ProgramTierContract | undefined {
  return ALL_TIER_CONTRACTS[tier]
}

/**
 * Get the default tier contract (Tier 1 Essential)
 * @returns The default tier contract
 */
export function getDefaultTierContract(): ProgramTierContract {
  return TIER_1_ESSENTIAL
}
