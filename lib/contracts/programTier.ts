/**
 * Program Tier Contract (TV05_01D)
 * 
 * This file defines the "Program Tier" contract that maps Thomas' 3-Tier Journey
 * (Tier 1/2.5/2) to the platform's Pillar/Funnel architecture.
 * 
 * The tier contract is:
 * - Configurable: Each tier defines which pillars and funnels are active
 * - Versionable: Can be versioned independently of funnel versions
 * - Deterministic: Clear mapping from tier to patient experience
 * 
 * **NO MAGIC STRINGS**: All pillar keys and funnel slugs come from registry.
 * **NO PHI/PII**: This contract contains only configuration data.
 * 
 * Usage:
 * ```typescript
 * import { TIER_1_ESSENTIAL } from '@/lib/contracts/tiers'
 * import { validateProgramTierContract } from '@/lib/contracts/programTier'
 * 
 * const isValid = validateProgramTierContract(TIER_1_ESSENTIAL)
 * ```
 */

import { z } from 'zod'
import { PILLAR_KEY, FUNNEL_SLUG, type PillarKey, type FunnelSlug } from './registry'

// ============================================================
// Program Tier Levels
// ============================================================

/**
 * Valid program tier levels based on Thomas' journey model
 */
export const PROGRAM_TIER = {
  /**
   * Tier 1 (Essential): Basic stress/resilience assessment
   * Focus: Initial assessment, baseline data collection
   */
  TIER_1_ESSENTIAL: 'tier-1-essential',
  
  /**
   * Tier 2.5 (Enhanced): Extended monitoring with nurse touchpoints
   * Focus: Regular check-ins, progress tracking
   */
  TIER_2_5_ENHANCED: 'tier-2-5-enhanced',
  
  /**
   * Tier 2 (Comprehensive): Full program with intensive support
   * Focus: Comprehensive care, multiple pillars, frequent touchpoints
   */
  TIER_2_COMPREHENSIVE: 'tier-2-comprehensive',
} as const

export type ProgramTier = typeof PROGRAM_TIER[keyof typeof PROGRAM_TIER]

// ============================================================
// Funnel Version Constraint
// ============================================================

/**
 * Version constraint for a funnel
 * Supports semver-style constraints
 */
export const FunnelVersionConstraintSchema = z.object({
  /** Funnel slug from registry */
  slug: z.string(),
  
  /** Version constraint (e.g., "1.0.0", "^1.0.0", ">=1.0.0 <2.0.0") */
  version: z.string(),
  
  /** Whether this funnel is recommended (vs. just allowed) */
  recommended: z.boolean().default(false),
  
  /** Optional ordering/priority for display */
  priority: z.number().optional(),
})

export type FunnelVersionConstraint = z.infer<typeof FunnelVersionConstraintSchema>

// ============================================================
// Schedule Touchpoint Placeholder
// ============================================================

/**
 * Touchpoint types for schedule skeleton
 */
export const TOUCHPOINT_TYPE = {
  CALL: 'call',
  NURSE_VISIT: 'nurse_visit',
  SELF_ASSESSMENT: 'self_assessment',
  CLINICIAN_REVIEW: 'clinician_review',
} as const

export type TouchpointType = typeof TOUCHPOINT_TYPE[keyof typeof TOUCHPOINT_TYPE]

/**
 * Schedule touchpoint placeholder
 * This is a minimal placeholder for future V05 scheduling features
 */
export const ScheduleTouchpointSchema = z.object({
  /** Touchpoint type */
  type: z.enum([
    TOUCHPOINT_TYPE.CALL,
    TOUCHPOINT_TYPE.NURSE_VISIT,
    TOUCHPOINT_TYPE.SELF_ASSESSMENT,
    TOUCHPOINT_TYPE.CLINICIAN_REVIEW,
  ] as [TouchpointType, ...TouchpointType[]]),
  
  /** Human-readable label */
  label: z.string(),
  
  /** Offset from program start in days */
  dayOffset: z.number().int().min(0),
  
  /** Optional metadata for future use */
  metadata: z.record(z.string(), z.any()).optional(),
})

export type ScheduleTouchpoint = z.infer<typeof ScheduleTouchpointSchema>

// ============================================================
// Pillar Configuration
// ============================================================

/**
 * Pillar activation configuration for a tier
 */
export const PillarConfigSchema = z.object({
  /** Pillar key from registry */
  key: z.enum([
    PILLAR_KEY.NUTRITION,
    PILLAR_KEY.MOVEMENT,
    PILLAR_KEY.SLEEP,
    PILLAR_KEY.MENTAL_HEALTH,
    PILLAR_KEY.SOCIAL,
    PILLAR_KEY.MEANING,
    PILLAR_KEY.PREVENTION,
  ] as [PillarKey, ...PillarKey[]]),
  
  /** Whether this pillar is active in this tier */
  active: z.boolean(),
  
  /** Optional priority/ordering for display */
  priority: z.number().optional(),
  
  /** Optional metadata */
  metadata: z.record(z.string(), z.any()).optional(),
})

export type PillarConfig = z.infer<typeof PillarConfigSchema>

// ============================================================
// Program Tier Contract
// ============================================================

/**
 * Complete Program Tier Contract
 * Defines the patient experience for a specific tier level
 */
export const ProgramTierContractSchema = z.object({
  /** Tier identifier */
  tier: z.enum([
    PROGRAM_TIER.TIER_1_ESSENTIAL,
    PROGRAM_TIER.TIER_2_5_ENHANCED,
    PROGRAM_TIER.TIER_2_COMPREHENSIVE,
  ] as [ProgramTier, ...ProgramTier[]]),
  
  /** Contract version (for tracking changes over time) */
  version: z.string(),
  
  /** Human-readable tier name */
  name: z.string(),
  
  /** Tier description */
  description: z.string(),
  
  /** Pillar configurations */
  pillars: z.array(PillarConfigSchema),
  
  /** Allowed/recommended funnels with version constraints */
  funnels: z.array(FunnelVersionConstraintSchema),
  
  /** Optional schedule skeleton (placeholders for calls/touchpoints) */
  schedule: z.array(ScheduleTouchpointSchema).optional(),
  
  /** Optional metadata for future extensions */
  metadata: z.record(z.string(), z.any()).optional(),
})

export type ProgramTierContract = z.infer<typeof ProgramTierContractSchema>

// ============================================================
// Validation Functions
// ============================================================

/**
 * Validates a program tier contract
 * @param contract - The contract to validate
 * @returns True if valid, false otherwise
 */
export function validateProgramTierContract(contract: unknown): contract is ProgramTierContract {
  const result = ProgramTierContractSchema.safeParse(contract)
  return result.success
}

/**
 * Parses and validates a program tier contract
 * @param contract - The contract to parse
 * @returns Parsed contract
 * @throws ZodError if validation fails
 */
export function parseProgramTierContract(contract: unknown): ProgramTierContract {
  return ProgramTierContractSchema.parse(contract)
}

/**
 * Safely parses a program tier contract with error handling
 * @param contract - The contract to parse
 * @returns Parsed contract or null if invalid
 */
export function safeParseProgramTierContract(contract: unknown): ProgramTierContract | null {
  const result = ProgramTierContractSchema.safeParse(contract)
  return result.success ? result.data : null
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get active pillars from a tier contract
 * @param contract - The tier contract
 * @returns Array of active pillar keys
 */
export function getActivePillars(contract: ProgramTierContract): PillarKey[] {
  return contract.pillars
    .filter((p) => p.active)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
    .map((p) => p.key)
}

/**
 * Get recommended funnels from a tier contract
 * @param contract - The tier contract
 * @returns Array of recommended funnel slugs
 */
export function getRecommendedFunnels(contract: ProgramTierContract): string[] {
  return contract.funnels
    .filter((f) => f.recommended)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
    .map((f) => f.slug)
}

/**
 * Get all allowed funnels from a tier contract
 * @param contract - The tier contract
 * @returns Array of all allowed funnel slugs
 */
export function getAllowedFunnels(contract: ProgramTierContract): string[] {
  return contract.funnels
    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
    .map((f) => f.slug)
}

/**
 * Check if a funnel is allowed in a tier
 * @param contract - The tier contract
 * @param funnelSlug - The funnel slug to check
 * @returns True if the funnel is allowed in this tier
 */
export function isFunnelAllowedInTier(
  contract: ProgramTierContract,
  funnelSlug: string,
): boolean {
  return contract.funnels.some((f) => f.slug === funnelSlug)
}

/**
 * Check if a pillar is active in a tier
 * @param contract - The tier contract
 * @param pillarKey - The pillar key to check
 * @returns True if the pillar is active in this tier
 */
export function isPillarActiveInTier(
  contract: ProgramTierContract,
  pillarKey: PillarKey,
): boolean {
  const pillar = contract.pillars.find((p) => p.key === pillarKey)
  return pillar?.active ?? false
}
