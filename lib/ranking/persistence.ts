/**
 * Priority Ranking Persistence - V05-I05.3
 * 
 * Database operations for priority rankings.
 * Stores rankings tied to processing jobs.
 * 
 * @module lib/ranking/persistence
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PriorityRankingV1 } from '@/lib/contracts/priorityRanking'

// ============================================================
// Save Priority Ranking
// ============================================================

/**
 * Save priority ranking to database
 * Idempotent - upserts based on job_id
 */
export async function savePriorityRanking(
  supabase: SupabaseClient,
  jobId: string,
  ranking: PriorityRankingV1
): Promise<{ success: boolean; rankingId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('priority_rankings')
      .upsert(
        {
          job_id: jobId,
          risk_bundle_id: ranking.riskBundleId,
          ranking_version: ranking.rankingVersion,
          algorithm_version: ranking.algorithmVersion,
          program_tier: ranking.programTier || null,
          ranked_at: ranking.rankedAt,
          ranking_data: ranking, // Store complete ranking as JSONB
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'job_id',
        }
      )
      .select('id')
      .single()

    if (error) {
      console.error('Error saving priority ranking:', error)
      return { success: false, error: error.message }
    }

    return { success: true, rankingId: data.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Unexpected error saving priority ranking:', message)
    return { success: false, error: message }
  }
}

// ============================================================
// Load Priority Ranking
// ============================================================

/**
 * Load priority ranking by job ID
 */
export async function loadPriorityRanking(
  supabase: SupabaseClient,
  jobId: string
): Promise<{ success: boolean; ranking?: PriorityRankingV1; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('priority_rankings')
      .select('ranking_data')
      .eq('job_id', jobId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return { success: false, error: 'Priority ranking not found' }
      }
      console.error('Error loading priority ranking:', error)
      return { success: false, error: error.message }
    }

    return { success: true, ranking: data.ranking_data as PriorityRankingV1 }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Unexpected error loading priority ranking:', message)
    return { success: false, error: message }
  }
}

// ============================================================
// Load Priority Ranking by Risk Bundle
// ============================================================

/**
 * Load most recent priority ranking for a risk bundle
 */
export async function loadPriorityRankingByRiskBundle(
  supabase: SupabaseClient,
  riskBundleId: string
): Promise<{ success: boolean; ranking?: PriorityRankingV1; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('priority_rankings')
      .select('ranking_data')
      .eq('risk_bundle_id', riskBundleId)
      .order('ranked_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return { success: false, error: 'Priority ranking not found' }
      }
      console.error('Error loading priority ranking by risk bundle:', error)
      return { success: false, error: error.message }
    }

    return { success: true, ranking: data.ranking_data as PriorityRankingV1 }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Unexpected error loading priority ranking by risk bundle:', message)
    return { success: false, error: message }
  }
}

// ============================================================
// Delete Priority Ranking
// ============================================================

/**
 * Delete priority ranking by job ID
 * Used for cleanup/testing
 */
export async function deletePriorityRanking(
  supabase: SupabaseClient,
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('priority_rankings').delete().eq('job_id', jobId)

    if (error) {
      console.error('Error deleting priority ranking:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Unexpected error deleting priority ranking:', message)
    return { success: false, error: message }
  }
}
