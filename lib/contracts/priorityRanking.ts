/**
 * Priority Ranking Contract - V05-I05.3
 * 
 * Versioned schema for deterministic intervention priority ranking.
 * Ranks interventions based on Impact x Feasibility from risk bundles.
 * 
 * Key guarantees:
 * - Deterministic: same input → same output (no LLM, no randomness)
 * - Explainable: each decision includes input signals, partial scores, final score
 * - No fantasy: items reference existing registry IDs/slugs or generic placeholders
 * - Tier-aware: supports program tier constraints for filtering/weighting
 * - Versioned: tracks ranking version + input versions
 * 
 * @module lib/contracts/priorityRanking
 */

import { z } from 'zod'
import { PILLAR_KEY, type PillarKey, PROGRAM_TIER, type ProgramTier } from './registry'

// ============================================================
// Signal Codes (Structured Reasoning)
// ============================================================

/**
 * Valid signal codes for ranking decisions
 * These are structured codes, not free text
 */
export const SIGNAL_CODE = {
  // Risk signals
  HIGH_STRESS_SCORE: 'high_stress_score',
  CRITICAL_RISK_LEVEL: 'critical_risk_level',
  MULTIPLE_RISK_FACTORS: 'multiple_risk_factors',
  LOW_RESILIENCE: 'low_resilience',
  
  // Impact signals
  HIGH_IMPACT_POTENTIAL: 'high_impact_potential',
  IMMEDIATE_BENEFIT: 'immediate_benefit',
  LONG_TERM_BENEFIT: 'long_term_benefit',
  
  // Feasibility signals
  EASY_TO_IMPLEMENT: 'easy_to_implement',
  REQUIRES_MINIMAL_TIME: 'requires_minimal_time',
  LOW_BARRIER: 'low_barrier',
  HIGH_BARRIER: 'high_barrier',
  REQUIRES_SUPPORT: 'requires_support',
  
  // Tier signals
  TIER_1_RECOMMENDED: 'tier_1_recommended',
  TIER_2_5_RECOMMENDED: 'tier_2_5_recommended',
  TIER_2_RECOMMENDED: 'tier_2_recommended',
  TIER_EXCLUDED: 'tier_excluded',
} as const

export type SignalCode = typeof SIGNAL_CODE[keyof typeof SIGNAL_CODE]

// ============================================================
// Scoring Components
// ============================================================

/**
 * Structured signal with optional metadata
 * No free-text reasoning allowed - only structured codes and bounded metadata
 */
export const StructuredSignalSchema = z.object({
  code: z.string(),
  weight: z.number().optional(),
  meta: z.record(
    z.string().max(50), // Key max length
    z.union([
      z.string().max(80), // String values max 80 chars
      z.number(),
      z.boolean(),
    ])
  ).optional().refine(
    (meta) => !meta || Object.keys(meta).length <= 10,
    { message: 'Meta object cannot have more than 10 keys' }
  ),
}).strict() // Reject unknown fields

export type StructuredSignal = z.infer<typeof StructuredSignalSchema>

/**
 * Impact score with structured signals only
 * No free-text reasoning field allowed
 */
export const ImpactScoreSchema = z.object({
  score: z.number().min(0).max(100),
  signals: z.array(StructuredSignalSchema),
}).strict()

export type ImpactScore = z.infer<typeof ImpactScoreSchema>

/**
 * Feasibility score with structured signals only
 * No free-text reasoning field allowed
 */
export const FeasibilityScoreSchema = z.object({
  score: z.number().min(0).max(100),
  signals: z.array(StructuredSignalSchema),
}).strict()

export type FeasibilityScore = z.infer<typeof FeasibilityScoreSchema>

// ============================================================
// Intervention Topic (No Fantasy)
// ============================================================

/**
 * Intervention topic reference
 * Must reference existing content or use generic placeholder
 */
export const InterventionTopicSchema = z.object({
  // Reference to existing content (if available)
  contentKey: z.string().optional(), // e.g., "stress-management-breathing"
  contentSlug: z.string().optional(), // e.g., "breathing-exercises"
  pillarKey: z.enum([
    PILLAR_KEY.NUTRITION,
    PILLAR_KEY.MOVEMENT,
    PILLAR_KEY.SLEEP,
    PILLAR_KEY.MENTAL_HEALTH,
    PILLAR_KEY.SOCIAL,
    PILLAR_KEY.MEANING,
    PILLAR_KEY.PREVENTION,
  ] as [PillarKey, ...PillarKey[]]).optional(),
  
  // Generic placeholder (if no specific content exists)
  topicId: z.string(), // e.g., "stress-reduction", "sleep-hygiene"
  topicLabel: z.string(), // e.g., "Stress Reduction Techniques"
})

export type InterventionTopic = z.infer<typeof InterventionTopicSchema>

// ============================================================
// Ranked Intervention Item
// ============================================================

/**
 * Single ranked intervention with full explainability
 */
export const RankedInterventionSchema = z.object({
  // Topic reference
  topic: InterventionTopicSchema,
  
  // Ranking scores
  impactScore: ImpactScoreSchema,
  feasibilityScore: FeasibilityScoreSchema,
  priorityScore: z.number().min(0).max(10000), // Impact x Feasibility
  
  // Rank position
  rank: z.number().int().min(1),
  
  // Tier compatibility (optional)
  tierCompatibility: z.array(z.string()).optional(), // Program tiers this intervention is suitable for
})

export type RankedIntervention = z.infer<typeof RankedInterventionSchema>

// ============================================================
// Version Constants
// ============================================================

/**
 * Priority ranking schema version
 */
export const PRIORITY_RANKING_SCHEMA_VERSION = 'v1' as const

/**
 * Priority ranker algorithm version
 */
export const PRIORITY_RANKER_VERSION = '1.0.0' as const

// ============================================================
// Priority Ranking V1 Schema
// ============================================================

/**
 * Complete priority ranking output
 * This is the canonical ranking result from a risk bundle
 */
export const PriorityRankingV1Schema = z.object({
  // Version tracking
  rankingVersion: z.literal(PRIORITY_RANKING_SCHEMA_VERSION).default(PRIORITY_RANKING_SCHEMA_VERSION),
  algorithmVersion: z.string(), // e.g., "1.0.0"
  registryVersion: z.string().optional(), // Intervention registry version or hash
  rankedAt: z.string().datetime(),
  
  // Input references (for reproducibility)
  riskBundleId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  
  // Optional tier constraint
  programTier: z.enum([
    PROGRAM_TIER.TIER_1_ESSENTIAL,
    PROGRAM_TIER.TIER_2_5_ENHANCED,
    PROGRAM_TIER.TIER_2_COMPREHENSIVE,
  ] as [ProgramTier, ...ProgramTier[]]).optional(),
  
  // Ranked interventions (ordered by priority)
  rankedInterventions: z.array(RankedInterventionSchema),
  
  // Top N interventions (configurable, default 5)
  topInterventions: z.array(RankedInterventionSchema).max(10),
  
  // Metadata
  metadata: z.record(z.string(), z.any()).optional(),
})

export type PriorityRankingV1 = z.infer<typeof PriorityRankingV1Schema>

// ============================================================
// Priority Ranking Input Schema
// ============================================================

/**
 * Input for priority ranking calculation
 */
export const PriorityRankingInputSchema = z.object({
  riskBundleId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  
  // Risk bundle data (for ranking)
  riskBundle: z.object({
    riskScore: z.object({
      overall: z.number(),
      riskLevel: z.string(),
      factors: z.array(z.object({
        key: z.string(),
        label: z.string(),
        score: z.number(),
        weight: z.number(),
        riskLevel: z.string(),
      })),
    }),
  }),
  
  // Optional tier constraint
  programTier: z.string().optional(),
  
  // Algorithm version
  algorithmVersion: z.string(),
  
  // Optional configuration
  topN: z.number().int().min(1).max(10).default(5),
})

export type PriorityRankingInput = z.infer<typeof PriorityRankingInputSchema>

// ============================================================
// Priority Ranking Error Schema
// ============================================================

/**
 * Error information for ranking failures
 */
export const PriorityRankingErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
})

export type PriorityRankingError = z.infer<typeof PriorityRankingErrorSchema>

// ============================================================
// Priority Ranking Result Schema (for API responses)
// ============================================================

/**
 * Result wrapper for priority ranking
 * Can be success or error (fail-closed)
 */
export const PriorityRankingResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: PriorityRankingV1Schema,
  }),
  z.object({
    success: z.literal(false),
    error: PriorityRankingErrorSchema,
  }),
])

export type PriorityRankingResult = z.infer<typeof PriorityRankingResultSchema>

// ============================================================
// Type Guards
// ============================================================

/**
 * Type guard to check if a value is a valid signal code
 */
export function isValidSignalCode(value: unknown): value is SignalCode {
  return typeof value === 'string' && Object.values(SIGNAL_CODE).includes(value as SignalCode)
}

/**
 * Type guard to check if a result is successful
 */
export function isSuccessfulResult(result: PriorityRankingResult): result is { success: true; data: PriorityRankingV1 } {
  return result.success === true
}

/**
 * Type guard to check if a result is an error
 */
export function isErrorResult(result: PriorityRankingResult): result is { success: false; error: PriorityRankingError } {
  return result.success === false
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Create a successful priority ranking result
 */
export function successResult(ranking: PriorityRankingV1): PriorityRankingResult {
  return {
    success: true,
    data: ranking,
  }
}

/**
 * Create an error priority ranking result
 */
export function errorResult(code: string, message: string, details?: Record<string, any>): PriorityRankingResult {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  }
}

/**
 * Calculate priority score from impact and feasibility
 * Formula: (Impact x Feasibility) / 100
 * Result range: 0-100
 */
export function calculatePriorityScore(impact: number, feasibility: number): number {
  return Math.round((impact * feasibility) / 100)
}
