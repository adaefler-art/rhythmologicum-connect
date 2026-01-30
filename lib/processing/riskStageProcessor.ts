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
import { SCORING_OPERATOR } from '@/lib/risk/scoringRules'
import { CURRENT_ALGORITHM_VERSION } from '@/lib/versioning/constants'
import { loadFunnelVersionWithClient } from '@/lib/funnels/loadFunnelVersion'
import { QUESTION_TYPE } from '@/lib/contracts/registry'
import type { FunnelPluginManifest, QuestionConfig } from '@/lib/contracts/funnelManifest'

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
      .select('funnel_id, funnel')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return {
        success: false,
        error: 'Failed to fetch assessment funnel',
        errorCode: 'FETCH_ASSESSMENT_FAILED',
      }
    }

    const isV05CatalogFunnel = !assessment.funnel_id
    let algorithmVersion = CURRENT_ALGORITHM_VERSION
    let funnelVersion: string | undefined = assessment.funnel_id || undefined

    // Convert answers to input format
    const answerMap: Record<string, number> = {}
    for (const answer of answers) {
      answerMap[answer.question_id] = answer.answer_value
    }

    let config = getDefaultScoringConfig()
    let scoringMetadata: Record<string, unknown> | undefined

    if (isV05CatalogFunnel) {
      if (!assessment.funnel) {
        return {
          success: false,
          error: 'Missing funnel slug for catalog assessment',
          errorCode: 'MISSING_FUNNEL_SLUG',
        }
      }

      try {
        const loaded = await loadFunnelVersionWithClient(supabase, assessment.funnel)
        algorithmVersion = loaded.manifest.algorithm_bundle_version
        funnelVersion = loaded.version

        const buildResult = buildScoringConfigFromManifest(loaded.manifest, answerMap)
        config = buildResult.config
        scoringMetadata = buildResult.metadata
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        config = buildEmptyScoringConfig(algorithmVersion)
        scoringMetadata = {
          scoringFallback: 'manifest_load_failed',
          error: message,
        }
      }
    }

    const input: RiskBundleInput = {
      assessmentId,
      jobId,
      answers: answerMap,
      algorithmVersion,
      funnelVersion,
    }

    // Calculate risk bundle
    const bundleResult = computeRiskBundle(input, config)

    if (!bundleResult.success) {
      return {
        success: false,
        error: bundleResult.error.message,
        errorCode: bundleResult.error.code,
      }
    }

    if (scoringMetadata) {
      bundleResult.data.metadata = {
        ...(bundleResult.data.metadata ?? {}),
        ...scoringMetadata,
      }
    }

    // Save risk bundle
    const saveResult = await saveRiskBundle(supabase, jobId, bundleResult.data)

    if (!saveResult.success) {
      console.error('[riskStage] Failed to save risk bundle', {
        jobId,
        assessmentId,
        stage: 'risk_stage',
        errorCode: 'SAVE_BUNDLE_FAILED',
        error: saveResult.error,
      })
      return {
        success: false,
        error: saveResult.error,
        errorCode: 'SAVE_BUNDLE_FAILED',
      }
    }

    console.log('[riskStage] Risk bundle saved', {
      jobId,
      assessmentId,
    })

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
    version: CURRENT_ALGORITHM_VERSION,
    factorRules: [
      {
        key: 'stress_level',
        label: 'Stress Level',
        operator: SCORING_OPERATOR.NORMALIZE,
        questionIds: ['stress_1', 'stress_2', 'stress_3', 'stress_4', 'stress_5'],
        minValue: 0,
        maxValue: 50, // 5 questions * max score 10
      },
    ],
    overallRule: {
      key: 'overall',
      label: 'Overall Risk',
      operator: SCORING_OPERATOR.SUM,
      questionIds: ['stress_level'],
    },
  }
}

function buildScoringConfigFromManifest(
  manifest: FunnelPluginManifest,
  answers: Record<string, number>,
): { config: RiskCalculationConfig; metadata?: Record<string, unknown> } {
  const questionMap = new Map<string, QuestionConfig>()

  for (const step of manifest.questionnaire_config.steps) {
    for (const question of step.questions) {
      questionMap.set(question.id, question)
    }
  }

  const factorRules = []
  let ignoredQuestions = 0

  for (const [questionId, question] of questionMap.entries()) {
    if (!(questionId in answers)) continue

    const isScorableType =
      question.type === QUESTION_TYPE.NUMBER ||
      question.type === QUESTION_TYPE.SCALE ||
      question.type === QUESTION_TYPE.SLIDER

    if (!isScorableType) {
      ignoredQuestions += 1
      continue
    }

    if (question.minValue === undefined || question.maxValue === undefined) {
      ignoredQuestions += 1
      continue
    }

    factorRules.push({
      key: `q_${questionId}`,
      label: question.label,
      operator: SCORING_OPERATOR.NORMALIZE,
      questionIds: [questionId],
      minValue: question.minValue,
      maxValue: question.maxValue,
    })
  }

  if (factorRules.length === 0) {
    return {
      config: buildEmptyScoringConfig(manifest.algorithm_bundle_version),
      metadata: {
        scoringFallback: 'no_scorable_questions',
        answeredCount: Object.keys(answers).length,
        ignoredQuestions,
      },
    }
  }

  return {
    config: {
      version: manifest.algorithm_bundle_version,
      factorRules,
      overallRule: {
        key: 'overall',
        label: 'Overall Risk',
        operator: SCORING_OPERATOR.AVERAGE,
        questionIds: factorRules.map((rule) => rule.key),
      },
      metadata: {
        scoringSource: 'manifest',
        scorableQuestionCount: factorRules.length,
        ignoredQuestions,
      },
    },
    metadata: {
      scoringSource: 'manifest',
      scorableQuestionCount: factorRules.length,
      ignoredQuestions,
    },
  }
}

function buildEmptyScoringConfig(version: string): RiskCalculationConfig {
  return {
    version,
    factorRules: [],
    overallRule: {
      key: 'overall',
      label: 'Overall Risk',
      operator: SCORING_OPERATOR.SUM,
      questionIds: [],
    },
    metadata: {
      scoringFallback: 'empty_config',
    },
  }
}
