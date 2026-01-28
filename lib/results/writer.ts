/**
 * Calculated Results Writer - E73.3
 * 
 * Writes calculated_results after processing pipeline stages complete.
 * Aggregates outputs from risk, ranking stages into single SSOT record.
 * 
 * @module lib/results/writer
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { saveCalculatedResults, type SaveCalculatedResultsInput } from './persistence'

// ============================================================
// Types
// ============================================================

/**
 * Input for writing calculated results
 */
export interface WriteCalculatedResultsInput {
  assessmentId: string
  algorithmVersion: string
  funnelVersionId?: string
  // Scores (required)
  scores: {
    riskScore?: number
    stressScore?: number
    resilienceScore?: number
    [key: string]: any
  }
  // Risk models (optional)
  riskModels?: {
    riskLevel?: string
    riskFactors?: any[]
    [key: string]: any
  }
  // Priority ranking (optional)
  priorityRanking?: {
    topInterventions?: any[]
    urgencyLevel?: string
    [key: string]: any
  }
  // Input data for hash computation
  inputsData?: {
    answers?: Record<string, any>
    documents?: string[]
    confirmedData?: Record<string, any>
    [key: string]: any
  }
}

/**
 * Result of writing calculated results
 */
export interface WriteResultsResult {
  success: boolean
  resultId?: string
  isNew?: boolean
  error?: string
  errorCode?: string
}

// ============================================================
// Writer Function
// ============================================================

/**
 * Write calculated results to database
 * 
 * This is the main entry point for saving processing pipeline outputs.
 * It:
 * 1. Validates input (scores is required)
 * 2. Constructs inputs_hash from input data
 * 3. Upserts to calculated_results table
 * 4. Returns result ID and whether it was new
 * 
 * Idempotency:
 * - Same (assessment_id, algorithm_version, inputs_hash) → no-op
 * - Different inputs_hash → update
 * 
 * @param supabase - Supabase client (service role)
 * @param input - Processing results to write
 * @returns Write result with ID
 */
export async function writeCalculatedResults(
  supabase: SupabaseClient,
  input: WriteCalculatedResultsInput,
): Promise<WriteResultsResult> {
  try {
    const {
      assessmentId,
      algorithmVersion,
      funnelVersionId,
      scores,
      riskModels,
      priorityRanking,
      inputsData,
    } = input

    // Validate scores is present
    if (!scores || Object.keys(scores).length === 0) {
      return {
        success: false,
        error: 'scores field is required and cannot be empty',
        errorCode: 'SCORES_REQUIRED',
      }
    }

    // Prepare save input
    const saveInput: SaveCalculatedResultsInput = {
      assessmentId,
      algorithmVersion,
      scores,
      riskModels,
      priorityRanking,
      funnelVersionId,
      inputsData,
    }

    // Save to database (idempotent upsert)
    const result = await saveCalculatedResults(supabase, saveInput)

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        errorCode: 'SAVE_FAILED',
      }
    }

    console.log('[results/writer] Calculated results written successfully', {
      resultId: result.resultId,
      assessmentId,
      algorithmVersion,
      isNew: result.isNew,
    })

    return {
      success: true,
      resultId: result.resultId,
      isNew: result.isNew,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[results/writer] Unexpected error writing results:', message)
    return {
      success: false,
      error: `Unexpected error: ${message}`,
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}
