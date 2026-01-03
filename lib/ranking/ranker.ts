/**
 * Priority Ranker - V05-I05.3
 * 
 * Deterministic ranking algorithm for interventions based on Impact x Feasibility.
 * Maps risk bundle signals to candidate interventions and ranks them.
 * 
 * Key guarantees:
 * - Deterministic: same input → same output
 * - Explainable: each decision includes signals, partial scores, final score
 * - No fantasy: uses intervention registry only
 * - Tier-aware: filters/weights based on program tier
 * 
 * @module lib/ranking/ranker
 */

import type { RiskBundleV1, RiskFactor } from '@/lib/contracts/riskBundle'
import {
  type PriorityRankingV1,
  type PriorityRankingInput,
  type PriorityRankingResult,
  type RankedIntervention,
  type ImpactScore,
  type FeasibilityScore,
  calculatePriorityScore,
  successResult,
  errorResult,
  SIGNAL_CODE,
} from '@/lib/contracts/priorityRanking'
import {
  type InterventionTopicDefinition,
  getInterventionsForRiskFactor,
  getInterventionsForTier,
  getAllInterventionTopics,
} from './interventionRegistry'

// ============================================================
// Constants
// ============================================================

const ALGORITHM_VERSION = 'v1.0.0'

// Impact multipliers based on risk level
const IMPACT_MULTIPLIERS = {
  critical: 1.3,
  high: 1.15,
  moderate: 1.0,
  low: 0.85,
}

// Feasibility adjustments based on tier
const TIER_FEASIBILITY_BOOST = {
  'tier-1-essential': 10, // Simple interventions get boost in tier 1
  'tier-2-5-enhanced': 5,
  'tier-2-comprehensive': 0,
}

// ============================================================
// Core Ranking Function
// ============================================================

/**
 * Rank interventions based on risk bundle and optional tier constraint
 * Pure function - no side effects, no I/O
 */
export function rankInterventions(input: PriorityRankingInput): PriorityRankingResult {
  try {
    // Validate input
    if (!input.riskBundle || !input.riskBundle.riskScore) {
      return errorResult('INVALID_INPUT', 'Risk bundle is required')
    }

    const { riskBundle, programTier, topN = 5 } = input

    // Step 1: Identify candidate interventions from risk factors
    const candidates = identifyCandidates(riskBundle.riskScore.factors, programTier)

    if (candidates.length === 0) {
      return errorResult('NO_CANDIDATES', 'No suitable interventions found for risk factors')
    }

    // Step 2: Score each candidate (Impact x Feasibility)
    const scoredCandidates = candidates.map((candidate) =>
      scoreIntervention(candidate, riskBundle, programTier)
    )

    // Step 3: Sort by priority score (descending)
    const sorted = scoredCandidates.sort((a, b) => b.priorityScore - a.priorityScore)

    // Step 4: Assign ranks
    const ranked = sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }))

    // Step 5: Extract top N
    const topInterventions = ranked.slice(0, topN)

    // Build ranking bundle
    const ranking: PriorityRankingV1 = {
      rankingVersion: 'v1',
      algorithmVersion: ALGORITHM_VERSION,
      rankedAt: new Date().toISOString(),
      riskBundleId: input.riskBundleId,
      jobId: input.jobId,
      programTier: programTier as any,
      rankedInterventions: ranked,
      topInterventions,
    }

    return successResult(ranking)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResult('RANKING_ERROR', `Error during ranking: ${message}`)
  }
}

// ============================================================
// Candidate Identification
// ============================================================

/**
 * Identify candidate interventions based on risk factors and tier
 */
function identifyCandidates(
  riskFactors: Array<{ key: string; label: string; score: number; weight: number; riskLevel: string }>,
  programTier?: string
): InterventionTopicDefinition[] {
  const candidateMap = new Map<string, InterventionTopicDefinition>()

  // Collect interventions for each risk factor
  for (const factor of riskFactors) {
    const interventions = getInterventionsForRiskFactor(factor.key)
    for (const intervention of interventions) {
      // Apply tier filter if specified
      if (programTier && !intervention.compatibleTiers.includes(programTier)) {
        continue // Skip incompatible interventions
      }
      candidateMap.set(intervention.topicId, intervention)
    }
  }

  return Array.from(candidateMap.values())
}

// ============================================================
// Intervention Scoring
// ============================================================

/**
 * Score a single intervention based on risk bundle context
 */
function scoreIntervention(
  intervention: InterventionTopicDefinition,
  riskBundle: any, // RiskBundleV1 type
  programTier?: string
): RankedIntervention {
  const impactScore = calculateImpact(intervention, riskBundle)
  const feasibilityScore = calculateFeasibility(intervention, programTier)
  const priorityScore = calculatePriorityScore(impactScore.score, feasibilityScore.score)

  return {
    topic: {
      topicId: intervention.topicId,
      topicLabel: intervention.topicLabel,
      pillarKey: intervention.pillarKey,
      contentKey: intervention.contentKey,
    },
    impactScore,
    feasibilityScore,
    priorityScore,
    rank: 0, // Will be assigned later
    tierCompatibility: intervention.compatibleTiers,
  }
}

// ============================================================
// Impact Calculation
// ============================================================

/**
 * Calculate impact score for an intervention
 * Based on:
 * - Baseline impact from registry
 * - Risk level multiplier
 * - Number of matching risk factors
 */
function calculateImpact(
  intervention: InterventionTopicDefinition,
  riskBundle: any
): ImpactScore {
  const signals: string[] = []
  let score = intervention.baselineImpact

  // Get overall risk level
  const riskLevel = riskBundle.riskScore.riskLevel as string
  const multiplier = IMPACT_MULTIPLIERS[riskLevel as keyof typeof IMPACT_MULTIPLIERS] || 1.0

  // Apply risk level multiplier
  if (riskLevel === 'critical') {
    signals.push(SIGNAL_CODE.CRITICAL_RISK_LEVEL)
    signals.push(SIGNAL_CODE.HIGH_IMPACT_POTENTIAL)
  } else if (riskLevel === 'high') {
    signals.push(SIGNAL_CODE.HIGH_IMPACT_POTENTIAL)
  }

  // Count matching risk factors
  const matchingFactors = riskBundle.riskScore.factors.filter((f: any) =>
    intervention.targetRiskFactors.includes(f.key)
  )

  if (matchingFactors.length > 1) {
    signals.push(SIGNAL_CODE.MULTIPLE_RISK_FACTORS)
    score *= 1.1 // Small boost for multi-factor interventions
  }

  // Apply risk level multiplier
  score *= multiplier

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    score,
    signals,
    reasoning: `Impact based on ${matchingFactors.length} matching risk factor(s) with ${riskLevel} risk level`,
  }
}

// ============================================================
// Feasibility Calculation
// ============================================================

/**
 * Calculate feasibility score for an intervention
 * Based on:
 * - Baseline feasibility from registry
 * - Tier-specific adjustments
 */
function calculateFeasibility(
  intervention: InterventionTopicDefinition,
  programTier?: string
): FeasibilityScore {
  const signals: string[] = []
  let score = intervention.baselineFeasibility

  // Apply tier boost if applicable
  if (programTier) {
    const boost = TIER_FEASIBILITY_BOOST[programTier as keyof typeof TIER_FEASIBILITY_BOOST] || 0
    score += boost

    if (intervention.compatibleTiers.includes(programTier)) {
      if (programTier === 'tier-1-essential') {
        signals.push(SIGNAL_CODE.TIER_1_RECOMMENDED)
      } else if (programTier === 'tier-2-5-enhanced') {
        signals.push(SIGNAL_CODE.TIER_2_5_RECOMMENDED)
      } else if (programTier === 'tier-2-comprehensive') {
        signals.push(SIGNAL_CODE.TIER_2_RECOMMENDED)
      }
    }
  }

  // Baseline feasibility signals
  if (intervention.baselineFeasibility >= 80) {
    signals.push(SIGNAL_CODE.EASY_TO_IMPLEMENT)
    signals.push(SIGNAL_CODE.REQUIRES_MINIMAL_TIME)
    signals.push(SIGNAL_CODE.LOW_BARRIER)
  } else if (intervention.baselineFeasibility < 60) {
    signals.push(SIGNAL_CODE.HIGH_BARRIER)
    signals.push(SIGNAL_CODE.REQUIRES_SUPPORT)
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    score,
    signals,
    reasoning: `Feasibility based on baseline ${intervention.baselineFeasibility}${programTier ? ` for ${programTier}` : ''}`,
  }
}
