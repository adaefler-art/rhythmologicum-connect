/**
 * Intervention Topic Registry - V05-I05.3
 * 
 * Canonical registry of intervention topics mapped to risk factors.
 * This prevents "fantasy names" - all topics are defined here with references
 * to existing content keys or explicit placeholders.
 * 
 * @module lib/ranking/interventionRegistry
 */

import { PILLAR_KEY, type PillarKey } from '@/lib/contracts/registry'
import type { InterventionTopic } from '@/lib/contracts/priorityRanking'

// ============================================================
// Intervention Topic Definition
// ============================================================

export interface InterventionTopicDefinition extends InterventionTopic {
  // Mapping to risk factors
  targetRiskFactors: string[] // Keys from RiskFactor
  
  // Impact estimation (baseline)
  baselineImpact: number // 0-100
  
  // Feasibility estimation (baseline)
  baselineFeasibility: number // 0-100
  
  // Tier compatibility
  compatibleTiers: string[]
}

// ============================================================
// Intervention Topic Registry
// ============================================================

/**
 * Registry of intervention topics
 * Each topic maps to specific risk factors and has baseline scores
 */
export const INTERVENTION_TOPICS: Record<string, InterventionTopicDefinition> = {
  // Stress Management Interventions
  'stress-breathing-exercises': {
    topicId: 'stress-breathing-exercises',
    topicLabel: 'Breathing Exercises for Stress Reduction',
    pillarKey: PILLAR_KEY.MENTAL_HEALTH,
    contentKey: 'breathing-exercises', // Placeholder for future content
    targetRiskFactors: ['stress', 'anxiety', 'mental-health'],
    baselineImpact: 75,
    baselineFeasibility: 90,
    compatibleTiers: ['tier-1-essential', 'tier-2-5-enhanced', 'tier-2-comprehensive'],
  },
  
  'stress-mindfulness': {
    topicId: 'stress-mindfulness',
    topicLabel: 'Mindfulness and Meditation',
    pillarKey: PILLAR_KEY.MENTAL_HEALTH,
    contentKey: 'mindfulness-meditation', // Placeholder
    targetRiskFactors: ['stress', 'anxiety', 'mental-health'],
    baselineImpact: 80,
    baselineFeasibility: 70,
    compatibleTiers: ['tier-1-essential', 'tier-2-5-enhanced', 'tier-2-comprehensive'],
  },
  
  'stress-physical-activity': {
    topicId: 'stress-physical-activity',
    topicLabel: 'Physical Activity for Stress Relief',
    pillarKey: PILLAR_KEY.MOVEMENT,
    contentKey: 'stress-relief-exercise', // Placeholder
    targetRiskFactors: ['stress', 'mental-health', 'movement'],
    baselineImpact: 85,
    baselineFeasibility: 75,
    compatibleTiers: ['tier-1-essential', 'tier-2-5-enhanced', 'tier-2-comprehensive'],
  },
  
  // Sleep Interventions
  'sleep-hygiene': {
    topicId: 'sleep-hygiene',
    topicLabel: 'Sleep Hygiene Practices',
    pillarKey: PILLAR_KEY.SLEEP,
    contentKey: 'sleep-hygiene', // Placeholder
    targetRiskFactors: ['sleep', 'stress', 'mental-health'],
    baselineImpact: 80,
    baselineFeasibility: 85,
    compatibleTiers: ['tier-1-essential', 'tier-2-5-enhanced', 'tier-2-comprehensive'],
  },
  
  'sleep-routine': {
    topicId: 'sleep-routine',
    topicLabel: 'Consistent Sleep Routine',
    pillarKey: PILLAR_KEY.SLEEP,
    contentKey: 'sleep-routine', // Placeholder
    targetRiskFactors: ['sleep', 'stress'],
    baselineImpact: 75,
    baselineFeasibility: 80,
    compatibleTiers: ['tier-1-essential', 'tier-2-5-enhanced', 'tier-2-comprehensive'],
  },
  
  // Social Connection Interventions
  'social-support': {
    topicId: 'social-support',
    topicLabel: 'Building Social Support Networks',
    pillarKey: PILLAR_KEY.SOCIAL,
    contentKey: 'social-connections', // Placeholder
    targetRiskFactors: ['social', 'stress', 'mental-health'],
    baselineImpact: 70,
    baselineFeasibility: 60,
    compatibleTiers: ['tier-2-5-enhanced', 'tier-2-comprehensive'],
  },
  
  // Nutrition Interventions
  'nutrition-stress': {
    topicId: 'nutrition-stress',
    topicLabel: 'Stress-Reducing Nutrition',
    pillarKey: PILLAR_KEY.NUTRITION,
    contentKey: 'stress-nutrition', // Placeholder
    targetRiskFactors: ['stress', 'nutrition', 'mental-health'],
    baselineImpact: 65,
    baselineFeasibility: 70,
    compatibleTiers: ['tier-1-essential', 'tier-2-5-enhanced', 'tier-2-comprehensive'],
  },
  
  // Meaning & Purpose Interventions
  'meaning-values': {
    topicId: 'meaning-values',
    topicLabel: 'Values Clarification and Purpose',
    pillarKey: PILLAR_KEY.MEANING,
    contentKey: 'values-purpose', // Placeholder
    targetRiskFactors: ['meaning', 'stress', 'mental-health'],
    baselineImpact: 75,
    baselineFeasibility: 50,
    compatibleTiers: ['tier-2-5-enhanced', 'tier-2-comprehensive'],
  },
  
  // Prevention Interventions
  'prevention-stress-monitoring': {
    topicId: 'prevention-stress-monitoring',
    topicLabel: 'Regular Stress Level Monitoring',
    pillarKey: PILLAR_KEY.PREVENTION,
    contentKey: 'stress-monitoring', // Placeholder
    targetRiskFactors: ['stress', 'prevention'],
    baselineImpact: 60,
    baselineFeasibility: 95,
    compatibleTiers: ['tier-1-essential', 'tier-2-5-enhanced', 'tier-2-comprehensive'],
  },
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get all intervention topics that target a specific risk factor
 */
export function getInterventionsForRiskFactor(riskFactorKey: string): InterventionTopicDefinition[] {
  return Object.values(INTERVENTION_TOPICS).filter(
    (topic) => topic.targetRiskFactors.includes(riskFactorKey)
  )
}

/**
 * Get interventions compatible with a specific program tier
 */
export function getInterventionsForTier(tier: string): InterventionTopicDefinition[] {
  return Object.values(INTERVENTION_TOPICS).filter(
    (topic) => topic.compatibleTiers.includes(tier)
  )
}

/**
 * Get intervention topic by ID
 */
export function getInterventionTopic(topicId: string): InterventionTopicDefinition | undefined {
  return INTERVENTION_TOPICS[topicId]
}

/**
 * Get all intervention topics
 */
export function getAllInterventionTopics(): InterventionTopicDefinition[] {
  return Object.values(INTERVENTION_TOPICS)
}

/**
 * Check if an intervention is compatible with a tier
 */
export function isCompatibleWithTier(topicId: string, tier: string): boolean {
  const topic = INTERVENTION_TOPICS[topicId]
  return topic ? topic.compatibleTiers.includes(tier) : false
}

// ============================================================
// Version & Hash
// ============================================================

/**
 * Intervention registry version
 */
export const INTERVENTION_REGISTRY_VERSION = '1.0.0' as const

/**
 * Compute deterministic hash of intervention registry
 * Uses canonical JSON stringification with stable key order
 */
export function getRegistryHash(): string {
  // Create a stable representation of the registry
  const stableRegistry = Object.keys(INTERVENTION_TOPICS)
    .sort()
    .reduce((acc, key) => {
      const topic = INTERVENTION_TOPICS[key]
      acc[key] = {
        topicId: topic.topicId,
        topicLabel: topic.topicLabel,
        pillarKey: topic.pillarKey || null,
        contentKey: topic.contentKey || null,
        targetRiskFactors: [...topic.targetRiskFactors].sort(),
        baselineImpact: topic.baselineImpact,
        baselineFeasibility: topic.baselineFeasibility,
        compatibleTiers: [...topic.compatibleTiers].sort(),
      }
      return acc
    }, {} as Record<string, any>)

  // Create deterministic JSON string
  const canonicalJson = JSON.stringify(stableRegistry)
  
  // Simple hash function (FNV-1a)
  let hash = 2166136261
  for (let i = 0; i < canonicalJson.length; i++) {
    hash ^= canonicalJson.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  
  // Convert to hex string
  return (hash >>> 0).toString(16).padStart(8, '0')
}
