/**
 * E6.4.5: Data Sufficiency Checker
 *
 * Deterministic, rule-based checker for assessment data completeness.
 * NO LLM, NO DIAGNOSIS - purely template-based data validation.
 */

import type {
  EvidencePack,
  DataSufficiencyRule,
  DataSufficiencyRuleset,
  DataSufficiencyResult,
} from '@/lib/types/workup'
import { generateEvidencePackHash } from './evidenceHash'

/**
 * Stress Assessment Ruleset (v1.0.0)
 *
 * Deterministic rules for the stress-assessment funnel.
 * Each rule checks if a specific data point is present and sufficient.
 */
export const STRESS_ASSESSMENT_RULESET_V1: DataSufficiencyRuleset = {
  funnelSlug: 'stress-assessment',
  version: '1.0.0',
  rules: [
    {
      id: 'sleep_quality_check',
      fieldKey: 'sleep_quality',
      description: 'Check if sleep quality questions are answered',
      check: (evidencePack: EvidencePack) => {
        // Check if sleep-related questions have been answered
        const sleepQuestions = ['sleep_q1', 'sleep_q2', 'sleep_q3', 'sleep_q4']
        return sleepQuestions.some((qKey) => evidencePack.answers[qKey] !== undefined)
      },
      followUpQuestion: {
        id: 'followup_sleep_quality',
        fieldKey: 'sleep_quality',
        questionText: 'Wie würden Sie Ihre Schlafqualität in den letzten 4 Wochen bewerten?',
        inputType: 'scale',
        priority: 10,
      },
    },
    {
      id: 'stress_frequency_check',
      fieldKey: 'stress_triggers',
      description: 'Check if stress frequency is documented',
      check: (evidencePack: EvidencePack) => {
        // Check if stress questions have been answered
        const stressQuestions = ['stress_q1', 'stress_q2', 'stress_q3', 'stress_q4']
        return stressQuestions.some((qKey) => evidencePack.answers[qKey] !== undefined)
      },
      followUpQuestion: {
        id: 'followup_stress_triggers',
        fieldKey: 'stress_triggers',
        questionText: 'Welche Situationen oder Faktoren lösen bei Ihnen am häufigsten Stress aus?',
        inputType: 'text',
        priority: 8,
      },
    },
  ],
}

/**
 * Get the appropriate ruleset for a funnel
 *
 * @param funnelSlug - The funnel slug
 * @returns The ruleset for the funnel, or null if no ruleset exists
 */
export function getRulesetForFunnel(funnelSlug: string): DataSufficiencyRuleset | null {
  // Normalize slug
  const normalizedSlug = funnelSlug.toLowerCase().trim()

  // Match against available rulesets
  if (normalizedSlug === 'stress-assessment' || normalizedSlug === 'stress') {
    return STRESS_ASSESSMENT_RULESET_V1
  }

  // No ruleset available for this funnel
  return null
}

/**
 * Check data sufficiency for an evidence pack
 *
 * This is the main workup function - it runs all applicable rules
 * and determines if more data is needed.
 *
 * @param evidencePack - The evidence pack to check
 * @returns Data sufficiency result with missing fields and follow-up questions
 */
export function checkDataSufficiency(evidencePack: EvidencePack): DataSufficiencyResult {
  // Get ruleset for this funnel
  const ruleset = getRulesetForFunnel(evidencePack.funnelSlug)

  // If no ruleset exists, consider data sufficient (no rules = no requirements)
  if (!ruleset) {
    return {
      isSufficient: true,
      missingDataFields: [],
      followUpQuestions: [],
      evidencePackHash: generateEvidencePackHash(evidencePack),
    }
  }

  // Run all rules and collect missing data fields
  const missingDataFields: string[] = []
  const failedRules: DataSufficiencyRule[] = []

  for (const rule of ruleset.rules) {
    const passed = rule.check(evidencePack)
    if (!passed) {
      missingDataFields.push(rule.fieldKey)
      failedRules.push(rule)
    }
  }

  // Generate follow-up questions from failed rules
  const followUpQuestions = failedRules
    .map((rule) => rule.followUpQuestion)
    // Sort by priority (highest first)
    .sort((a, b) => b.priority - a.priority)

  // Data is sufficient only if no rules failed
  const isSufficient = missingDataFields.length === 0

  return {
    isSufficient,
    missingDataFields,
    followUpQuestions,
    evidencePackHash: generateEvidencePackHash(evidencePack),
  }
}

/**
 * Run workup check and return status
 *
 * Convenience function that returns the workup status directly.
 *
 * @param evidencePack - The evidence pack to check
 * @returns 'ready_for_review' if sufficient, 'needs_more_data' if not
 */
export function determineWorkupStatus(
  evidencePack: EvidencePack,
): 'ready_for_review' | 'needs_more_data' {
  const result = checkDataSufficiency(evidencePack)
  return result.isSufficient ? 'ready_for_review' : 'needs_more_data'
}
