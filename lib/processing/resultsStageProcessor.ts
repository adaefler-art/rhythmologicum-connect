/**
 * Results Stage Processor - E73.3
 * 
 * Processes the RESULTS writing stage of the processing pipeline.
 * Aggregates outputs from previous stages (risk, ranking) into calculated_results.
 * 
 * This stage runs after:
 * - Risk stage: produces risk bundle with scores
 * - Ranking stage: produces priority ranking
 * 
 * @module lib/processing/resultsStageProcessor
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadRiskBundle } from '@/lib/risk/persistence'
import { loadPriorityRanking } from '@/lib/ranking/persistence'
import { writeCalculatedResults, type WriteCalculatedResultsInput } from '@/lib/results/writer'

// ============================================================
// Constants
// ============================================================

const DEFAULT_ALGORITHM_VERSION = 'v1.0.0'

const resolveMaybeSingle = async (query: any) => {
  if (query && typeof query.maybeSingle === 'function') {
    return query.maybeSingle()
  }
  return query.single()
}

// ============================================================
// Results Stage Processing Result
// ============================================================

export interface ResultsStageResult {
  success: boolean
  resultId?: string
  isNew?: boolean
  error?: string
  errorCode?: string
  reason?: string
}

// ============================================================
// Results Stage Processor
// ============================================================

/**
 * Process RESULTS writing stage for a job
 * 
 * Steps:
 * 1. Check if calculated_results already exists (idempotency)
 * 2. Load risk bundle (required)
 * 3. Load priority ranking (optional)
 * 4. Fetch assessment answers for inputs_hash
 * 5. Write calculated_results
 * 
 * @param supabase - Supabase admin client
 * @param jobId - Processing job ID
 * @param assessmentId - Assessment ID
 * @param algorithmVersion - Optional algorithm version (defaults to v1.0.0)
 * @returns Processing result
 */
export async function processResultsStage(
  supabase: SupabaseClient,
  jobId: string,
  assessmentId: string,
  algorithmVersion?: string,
): Promise<ResultsStageResult> {
  try {
    const version = algorithmVersion || DEFAULT_ALGORITHM_VERSION

    // Step 1: Load risk bundle (required)
    const riskResult = await loadRiskBundle(supabase, jobId)

    let riskBundle = riskResult.success ? riskResult.bundle : undefined
    if (!riskBundle) {
      const riskQuery = supabase
        .from('risk_bundles')
        .select('bundle_data')
        .eq('job_id', jobId)

      const fallbackResult = await resolveMaybeSingle(riskQuery)

      if (fallbackResult?.data?.bundle_data) {
        riskBundle = fallbackResult.data.bundle_data
      }
    }

    if (!riskBundle) {
      return {
        success: false,
        error: riskResult.error || 'Risk bundle not found for job',
        errorCode: 'RISK_BUNDLE_NOT_FOUND',
        reason: 'RISK_BUNDLE_NOT_FOUND',
      }
    }

    // Step 2: Load priority ranking (optional)
    const rankingResult = await loadPriorityRanking(supabase, jobId)
    const ranking = rankingResult.success ? rankingResult.ranking : undefined
    const rankingUrgencyLevel = (ranking as { urgencyLevel?: string })?.urgencyLevel

    // Step 3: Fetch assessment answers for inputs_hash
    const { data: answers, error: answersError } = await supabase
      .from('assessment_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      // Cannot compute reliable inputs_hash without answers
      return {
        success: false,
        error: `Failed to fetch answers: ${answersError.message}`,
        errorCode: 'FETCH_ANSWERS_FAILED',
        reason: 'FETCH_ANSWERS_FAILED',
      }
    }

    // Convert answers to map
    const answersMap: Record<string, any> = {}
    if (answers) {
      for (const answer of answers) {
        answersMap[answer.question_id] = answer.answer_value
      }
    }

    // Step 4: Fetch funnel version ID if available
    const assessmentQuery = supabase
      .from('assessments')
      .select('funnel_id')
      .eq('id', assessmentId)

    const { data: assessment, error: assessmentError } = await resolveMaybeSingle(
      assessmentQuery,
    )

    if (assessmentError) {
      console.warn('[resultsStage] Failed to fetch assessment for funnel_version_id:', assessmentError.message)
    }

    const funnelVersionId = assessment?.funnel_id

    const riskScoreValue =
      typeof riskBundle.riskScore === 'number'
        ? riskBundle.riskScore
        : riskBundle.riskScore?.overall

    const legacyRiskLevel = (riskBundle as { riskLevel?: string }).riskLevel
    const legacyRiskFactors = (riskBundle as { riskFactors?: any[] }).riskFactors

    const riskLevelValue =
      typeof riskBundle.riskScore === 'object' && riskBundle.riskScore?.riskLevel
        ? riskBundle.riskScore.riskLevel
        : legacyRiskLevel

    const riskFactorsValue =
      typeof riskBundle.riskScore === 'object' && riskBundle.riskScore?.factors
        ? riskBundle.riskScore.factors
        : legacyRiskFactors

    // Step 5: Prepare write input
    const writeInput: WriteCalculatedResultsInput = {
      assessmentId,
      algorithmVersion: version,
      funnelVersionId,
      scores: {
        riskScore: riskScoreValue,
        // Add more scores from risk bundle as needed
      },
      riskModels: {
        riskLevel: riskLevelValue,
        riskFactors: riskFactorsValue,
      },
      priorityRanking: ranking
        ? {
            topInterventions: ranking.rankedInterventions,
            urgencyLevel: rankingUrgencyLevel,
          }
        : undefined,
      inputsData: {
        answers: answersMap,
        algorithmVersion: version,
        assessmentId,
        funnelVersionId,
      },
    }

    // Step 6: Write calculated results
    const writeResult = await writeCalculatedResults(supabase, writeInput)

    if (!writeResult.success) {
      return {
        success: false,
        error: writeResult.error,
        errorCode: writeResult.errorCode,
        reason: writeResult.errorCode,
      }
    }

    console.log('[resultsStage] Successfully wrote calculated results', {
      resultId: writeResult.resultId,
      assessmentId,
      jobId,
      isNew: writeResult.isNew,
    })

    return {
      success: true,
      resultId: writeResult.resultId,
      isNew: writeResult.isNew,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[resultsStage] Unexpected error:', message)
    return {
      success: false,
      error: `Unexpected error in results stage: ${message}`,
      errorCode: 'UNEXPECTED_ERROR',
      reason: 'UNEXPECTED_ERROR',
    }
  }
}
