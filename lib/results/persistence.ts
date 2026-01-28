/**
 * Calculated Results Persistence - E73.3
 * 
 * Handles saving and loading calculated_results from database.
 * Provides idempotent upsert operations based on (assessment_id, algorithm_version, inputs_hash).
 * 
 * @module lib/results/persistence
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ============================================================
// Types
// ============================================================

/**
 * Input for saving calculated results
 */
export interface SaveCalculatedResultsInput {
  assessmentId: string
  algorithmVersion: string
  scores: Record<string, any> // JSONB - required
  riskModels?: Record<string, any> // JSONB - optional
  priorityRanking?: Record<string, any> // JSONB - optional
  funnelVersionId?: string
  // Inputs for hash computation
  inputsData?: Record<string, any> // Used to compute inputs_hash
}

/**
 * Calculated results record (from DB)
 */
export interface CalculatedResultsRecord {
  id: string
  assessmentId: string
  algorithmVersion: string
  scores: Record<string, any>
  riskModels?: Record<string, any>
  priorityRanking?: Record<string, any>
  funnelVersionId?: string
  computedAt: string
  inputsHash?: string
  createdAt: string
}

// ============================================================
// Hash Computation
// ============================================================

/**
 * Compute SHA256 hash of normalized inputs
 * 
 * This hash is used for detecting equivalent runs:
 * - Same assessment_id
 * - Same algorithm_version
 * - Same input data (answers, documents, etc.)
 * 
 * @param inputs - Input data to hash
 * @returns SHA256 hash (hex string)
 */
export function computeInputsHash(inputs: Record<string, any>): string {
  // Sort keys to ensure consistent hash
  const sortedKeys = Object.keys(inputs).sort()
  const normalized: Record<string, any> = {}
  for (const key of sortedKeys) {
    normalized[key] = inputs[key]
  }
  
  const canonicalJson = JSON.stringify(normalized)
  const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex')
  return hash
}

// ============================================================
// Save Calculated Results (Upsert)
// ============================================================

/**
 * Save calculated results to database (idempotent upsert)
 * 
 * Upsert strategy:
 * - Unique constraint on (assessment_id, algorithm_version)
 * - If exists with same inputs_hash: no-op (already computed)
 * - If exists with different inputs_hash: update (re-computation)
 * - If not exists: insert (first computation)
 * 
 * @param supabase - Supabase client (service role)
 * @param input - Result data to save
 * @returns Success/error result with result ID
 */
export async function saveCalculatedResults(
  supabase: SupabaseClient,
  input: SaveCalculatedResultsInput,
): Promise<{ success: boolean; resultId?: string; isNew?: boolean; error?: string }> {
  try {
    const {
      assessmentId,
      algorithmVersion,
      scores,
      riskModels,
      priorityRanking,
      funnelVersionId,
      inputsData,
    } = input

    // Validate required fields
    if (!scores || Object.keys(scores).length === 0) {
      return { success: false, error: 'scores field is required and cannot be empty' }
    }

    // Compute inputs hash if inputs data provided
    let inputsHash: string | undefined
    if (inputsData) {
      inputsHash = computeInputsHash(inputsData)
    }

    // Check if a result already exists for this assessment + algorithm version
    const { data: existing, error: fetchError } = await supabase
      .from('calculated_results')
      .select('id, inputs_hash')
      .eq('assessment_id', assessmentId)
      .eq('algorithm_version', algorithmVersion)
      .maybeSingle()

    if (fetchError) {
      return {
        success: false,
        error: `Error checking existing result: ${fetchError.message}`,
      }
    }

    // If exists with same inputs_hash, skip (already computed)
    if (existing && inputsHash && existing.inputs_hash === inputsHash) {
      console.log('[results/persistence] Result already exists with same inputs_hash (idempotent)', {
        resultId: existing.id,
        assessmentId,
        algorithmVersion,
        inputsHash,
      })
      return {
        success: true,
        resultId: existing.id,
        isNew: false,
      }
    }

    const now = new Date().toISOString()

    // Upsert: insert or update based on unique constraint
    const { data: result, error: upsertError } = await supabase
      .from('calculated_results')
      .upsert(
        {
          assessment_id: assessmentId,
          algorithm_version: algorithmVersion,
          scores: scores,
          risk_models: riskModels || null,
          priority_ranking: priorityRanking || null,
          funnel_version_id: funnelVersionId || null,
          computed_at: now,
          inputs_hash: inputsHash || null,
          // created_at is set by DB default on insert
        },
        {
          onConflict: 'assessment_id,algorithm_version',
        },
      )
      .select('id')
      .single()

    if (upsertError) {
      return {
        success: false,
        error: `Error upserting calculated result: ${upsertError.message}`,
      }
    }

    const wasNew = !existing
    console.log('[results/persistence] Calculated result saved', {
      resultId: result.id,
      assessmentId,
      algorithmVersion,
      inputsHash,
      isNew: wasNew,
    })

    return {
      success: true,
      resultId: result.id,
      isNew: wasNew,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: `Unexpected error saving calculated result: ${message}`,
    }
  }
}

// ============================================================
// Load Calculated Results
// ============================================================

/**
 * Load calculated results from database by assessment ID
 * 
 * @param supabase - Supabase client
 * @param assessmentId - Assessment ID
 * @param algorithmVersion - Optional: filter by algorithm version
 * @returns Calculated results or null if not found
 */
export async function loadCalculatedResults(
  supabase: SupabaseClient,
  assessmentId: string,
  algorithmVersion?: string,
): Promise<{ success: boolean; result?: CalculatedResultsRecord; error?: string }> {
  try {
    let query = supabase
      .from('calculated_results')
      .select('*')
      .eq('assessment_id', assessmentId)

    if (algorithmVersion) {
      query = query.eq('algorithm_version', algorithmVersion)
    }

    // Order by computed_at DESC to get latest
    query = query.order('computed_at', { ascending: false }).limit(1)

    const { data, error } = await query.maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return { success: true, result: undefined }
      }
      return {
        success: false,
        error: `Error loading calculated result: ${error.message}`,
      }
    }

    if (!data) {
      return { success: true, result: undefined }
    }

    // Map database fields to TypeScript naming
    const result: CalculatedResultsRecord = {
      id: data.id,
      assessmentId: data.assessment_id,
      algorithmVersion: data.algorithm_version,
      scores: data.scores,
      riskModels: data.risk_models,
      priorityRanking: data.priority_ranking,
      funnelVersionId: data.funnel_version_id,
      computedAt: data.computed_at,
      inputsHash: data.inputs_hash,
      createdAt: data.created_at,
    }

    return { success: true, result }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: `Unexpected error loading calculated result: ${message}`,
    }
  }
}
