/**
 * Risk Stage Processor - V05-I05.2
 * 
 * Processes the RISK stage of the processing job pipeline.
 * Fetches assessment answers, applies scoring rules, calculates risk bundle,
 * and persists the result.
 * 
 * @module lib/processing/riskStageProcessor
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { computeRiskBundle } from '@/lib/risk/calculator'
import { saveRiskBundle, loadRiskBundle } from '@/lib/risk/persistence'
import type { RiskBundleInput } from '@/lib/contracts/riskBundle'
import type { RiskCalculationConfig } from '@/lib/risk/scoringRules'

// ============================================================
// Risk Stage Processing Result
// ============================================================

export interface RiskStageResult {
  success: boolean
  error?: string
  errorCode?: string
  bundleId?: string
}

// ============================================================
// Risk Stage Processor
// ============================================================

/**
 * Process RISK stage for a job
 * 
 * @param supabase - Supabase admin client
 * @param jobId - Processing job ID
 * @param assessmentId - Assessment ID
 * @returns Processing result
 */
export async function processRiskStage(
  supabase: SupabaseClient,
  jobId: string,
  assessmentId: string,
): Promise<RiskStageResult> {
  try {
    // Check if bundle already exists (idempotency)
    const existingBundle = await loadRiskBundle(supabase, jobId)
    if (existingBundle.success && existingBundle.bundle) {
      return {
        success: true,
        bundleId: jobId, // Using jobId as identifier
      }
    }

    // Fetch assessment answers
    const { data: answers, error: answersError } = await supabase
      .from('assessment_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      return {
        success: false,
        error: `Failed to fetch assessment answers: ${answersError.message}`,
        errorCode: 'FETCH_ANSWERS_FAILED',
      }
    }

    if (!answers || answers.length === 0) {
      return {
        success: false,
        error: 'No answers found for assessment',
        errorCode: 'NO_ANSWERS',
      }
    }

    // Fetch funnel version to get algorithm version
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('funnel_id')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return {
        success: false,
        error: 'Failed to fetch assessment funnel',
        errorCode: 'FETCH_ASSESSMENT_FAILED',
      }
    }

    // For now, use a default algorithm version
    // TODO: Fetch from funnel_versions table when available
    const algorithmVersion = 'v1.0.0'
    const funnelVersion = assessment.funnel_id || undefined

    // Convert answers to input format
    const answerMap: Record<string, number> = {}
    for (const answer of answers) {
      answerMap[answer.question_id] = answer.answer_value
    }

    const input: RiskBundleInput = {
      assessmentId,
      jobId,
      answers: answerMap,
      algorithmVersion,
      funnelVersion,
    }

    // Get scoring configuration
    // TODO: Load from funnel manifest/registry when available
    const config = getDefaultScoringConfig()

    // Calculate risk bundle
    const bundleResult = computeRiskBundle(input, config)

    if (!bundleResult.success) {
      return {
        success: false,
        error: bundleResult.error.message,
        errorCode: bundleResult.error.code,
      }
    }

    // Save risk bundle
    const saveResult = await saveRiskBundle(supabase, jobId, bundleResult.data)

    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error,
        errorCode: 'SAVE_BUNDLE_FAILED',
      }
    }

    return {
      success: true,
      bundleId: jobId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: `Unexpected error in risk stage processing: ${message}`,
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

// ============================================================
// Default Scoring Configuration
// ============================================================

/**
 * Get default scoring configuration
 * 
 * TODO: Replace with dynamic loading from funnel manifest
 * For now, provides a simple stress-based calculation
 */
function getDefaultScoringConfig(): RiskCalculationConfig {
  return {
    version: 'v1.0.0',
    factorRules: [
      {
        key: 'stress_level',
        label: 'Stress Level',
        operator: 'normalize' as const,
        questionIds: ['stress_1', 'stress_2', 'stress_3', 'stress_4', 'stress_5'],
        minValue: 0,
        maxValue: 50, // 5 questions * max score 10
      },
    ],
    overallRule: {
      key: 'overall',
      label: 'Overall Risk',
      operator: 'sum' as const,
      questionIds: ['stress_level'],
    },
  }
}
