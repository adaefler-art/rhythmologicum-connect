/**
 * Ranking Stage Processor - V05-I05.3
 * 
 * Processes the RANKING stage in the processing pipeline.
 * Takes a risk bundle and generates priority ranking.
 * 
 * @module lib/processing/rankingStageProcessor
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadRiskBundle } from '@/lib/risk/persistence'
import { rankInterventions } from '@/lib/ranking/ranker'
import { savePriorityRanking, loadPriorityRanking } from '@/lib/ranking/persistence'
import type { PriorityRankingInput } from '@/lib/contracts/priorityRanking'

// ============================================================
// Constants
// ============================================================

const DEFAULT_ALGORITHM_VERSION = 'v1.0.0'
const DEFAULT_TOP_N = 5

// ============================================================
// Ranking Stage Processor
// ============================================================

export interface RankingStageResult {
  success: boolean
  rankingId?: string
  isNewRanking?: boolean
  error?: string
  details?: any
}

/**
 * Process ranking stage for a job
 * 
 * Steps:
 * 1. Check if ranking already exists (idempotency)
 * 2. Load risk bundle
 * 3. Determine program tier (if available)
 * 4. Rank interventions
 * 5. Save ranking to database
 * 
 * @param supabase - Supabase admin client (service role)
 * @param jobId - Processing job ID
 * @param riskBundleId - Risk bundle ID
 * @param programTier - Optional program tier constraint
 * @param topN - Number of top interventions to return (default 5)
 */
export async function processRankingStage(
  supabase: SupabaseClient,
  jobId: string,
  riskBundleId?: string,
  programTier?: string,
  topN?: number
): Promise<RankingStageResult> {
  try {
    // Step 1: Check for existing ranking (idempotency)
    const existingCheck = await loadPriorityRanking(supabase, jobId)
    if (existingCheck.success && existingCheck.ranking) {
      console.log(`[RankingStage] Ranking already exists for job ${jobId}, returning existing`)
      return {
        success: true,
        rankingId: existingCheck.ranking.riskBundleId, // Using riskBundleId as proxy for ranking ID
        isNewRanking: false,
      }
    }

    // Step 2: Load risk bundle
    let riskBundleResult
    if (riskBundleId) {
      // Load by specific risk bundle ID
      const { data, error } = await supabase
        .from('risk_bundles')
        .select('id, bundle_data')
        .eq('id', riskBundleId)
        .single()

      if (error || !data) {
        return {
          success: false,
          error: `Risk bundle not found: ${riskBundleId}`,
        }
      }
      riskBundleResult = { success: true, bundle: data.bundle_data }
    } else {
      // Load by job ID
      riskBundleResult = await loadRiskBundle(supabase, jobId)
    }

    if (!riskBundleResult.success || !riskBundleResult.bundle) {
      return {
        success: false,
        error: riskBundleResult.error || 'Risk bundle not found for job',
      }
    }

    const riskBundle = riskBundleResult.bundle

    // Step 3: Prepare ranking input
    const rankingInput: PriorityRankingInput = {
      riskBundleId: riskBundle.assessmentId, // Using assessmentId as proxy
      jobId,
      riskBundle: {
        riskScore: riskBundle.riskScore,
      },
      programTier,
      algorithmVersion: DEFAULT_ALGORITHM_VERSION,
      topN: topN || DEFAULT_TOP_N,
    }

    // Step 4: Rank interventions
    const rankingResult = rankInterventions(rankingInput)

    if (!rankingResult.success) {
      return {
        success: false,
        error: rankingResult.error?.message || 'Ranking failed',
        details: rankingResult.error,
      }
    }

    const ranking = rankingResult.data

    // Step 5: Save ranking to database
    const saveResult = await savePriorityRanking(supabase, jobId, ranking)

    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error || 'Failed to save ranking',
      }
    }

    console.log(`[RankingStage] Successfully created ranking for job ${jobId}`)
    return {
      success: true,
      rankingId: saveResult.rankingId,
      isNewRanking: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[RankingStage] Unexpected error:', message)
    return {
      success: false,
      error: `Unexpected error during ranking: ${message}`,
    }
  }
}
