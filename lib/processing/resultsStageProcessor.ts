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

// ============================================================
// Results Stage Processing Result
// ============================================================

export interface ResultsStageResult {
  success: boolean
  resultId?: string
  isNew?: boolean
  error?: string
  errorCode?: string
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
    
    if (!riskResult.success || !riskResult.bundle) {
      return {
        success: false,
        error: riskResult.error || 'Risk bundle not found for job',
        errorCode: 'RISK_BUNDLE_NOT_FOUND',
      }
    }

    const riskBundle = riskResult.bundle

    // Step 2: Load priority ranking (optional)
    const rankingResult = await loadPriorityRanking(supabase, jobId)
    const ranking = rankingResult.success ? rankingResult.ranking : undefined

    // Step 3: Fetch assessment answers for inputs_hash
    const { data: answers, error: answersError } = await supabase
      .from('assessment_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      console.warn('[resultsStage] Failed to fetch answers for inputs_hash:', answersError.message)
    }

    // Convert answers to map
    const answersMap: Record<string, any> = {}
    if (answers) {
      for (const answer of answers) {
        answersMap[answer.question_id] = answer.answer_value
      }
    }

    // Step 4: Fetch funnel version ID if available
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('funnel_id')
      .eq('id', assessmentId)
      .single()

    const funnelVersionId = assessment?.funnel_id

    // Step 5: Prepare write input
    const writeInput: WriteCalculatedResultsInput = {
      assessmentId,
      algorithmVersion: version,
      funnelVersionId,
      scores: {
        riskScore: riskBundle.riskScore,
        // Add more scores from risk bundle as needed
      },
      riskModels: {
        riskLevel: riskBundle.riskLevel,
        riskFactors: riskBundle.riskFactors,
      },
      priorityRanking: ranking
        ? {
            topInterventions: ranking.rankedInterventions,
            urgencyLevel: ranking.urgencyLevel,
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
    }
  }
}
