/**
 * Safety Check Stage Processor - V05-I05.6
 * 
 * Processes the SAFETY_CHECK stage of the processing job pipeline.
 * Applies Medical Validation Layer 2 (AI-powered safety assessment) to report sections.
 * 
 * @module lib/processing/safetyStageProcessor
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadReportSections } from '@/lib/sections/persistence'
import { evaluateSafety } from '@/lib/safety/evaluator'
import { saveSafetyCheck, loadSafetyCheck } from '@/lib/safety/persistence'
import { SAFETY_ACTION } from '@/lib/contracts/safetyCheck'

// ============================================================
// Safety Check Stage Processing Result
// ============================================================

export interface SafetyStageResult {
  success: boolean
  error?: string
  errorCode?: string
  safetyCheckId?: string
  recommendedAction?: string
  safetyScore?: number
  requiresReview?: boolean
  isNewCheck?: boolean
}

// ============================================================
// Safety Check Stage Processor
// ============================================================

/**
 * Process SAFETY_CHECK stage for a job
 * 
 * Workflow:
 * 1. Check for existing safety check (idempotency)
 * 2. Load report sections from database
 * 3. Run AI-powered safety evaluation
 * 4. Save safety check results to database
 * 5. Return result with action and score
 * 
 * @param supabase - Supabase admin client (service role)
 * @param jobId - Processing job ID
 * @param options - Optional configuration
 * @returns Processing result with safety check status
 */
export async function processSafetyStage(
  supabase: SupabaseClient,
  jobId: string,
  options?: {
    promptVersion?: string
    forceRecheck?: boolean
  },
): Promise<SafetyStageResult> {
  try {
    // Step 1: Check for existing safety check (unless force recheck)
    if (!options?.forceRecheck) {
      const existingResult = await loadSafetyCheck(supabase, jobId)
      
      if (existingResult.success) {
        // Return existing check
        return {
          success: true,
          safetyCheckId: existingResult.data.jobId, // Using jobId as identifier
          recommendedAction: existingResult.data.recommendedAction,
          safetyScore: existingResult.data.safetyScore,
          requiresReview:
            existingResult.data.recommendedAction === SAFETY_ACTION.BLOCK ||
            existingResult.data.recommendedAction === SAFETY_ACTION.UNKNOWN,
          isNewCheck: false,
        }
      }
    }
    
    // Step 2: Load report sections
    const sectionsResult = await loadReportSections(supabase, jobId)
    
    if (!sectionsResult.success) {
      return {
        success: false,
        error: sectionsResult.error || 'Failed to load report sections',
        errorCode: 'LOAD_SECTIONS_FAILED',
      }
    }
    
    const sections = sectionsResult.sections!
    
    // Step 3: Run AI-powered safety evaluation
    const evaluationResult = await evaluateSafety({
      sections,
      promptVersion: options?.promptVersion,
    })
    
    if (!evaluationResult.success) {
      return {
        success: false,
        error: evaluationResult.error || 'Safety evaluation failed',
        errorCode: 'EVALUATION_FAILED',
      }
    }
    
    const safetyCheckData = evaluationResult.data
    
    // Step 4: Save safety check results to database
    const saveResult = await saveSafetyCheck(supabase, jobId, safetyCheckData)
    
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error || 'Failed to save safety check results',
        errorCode: 'SAVE_FAILED',
      }
    }
    
    // Step 5: Return result
    return {
      success: true,
      safetyCheckId: saveResult.id,
      recommendedAction: safetyCheckData.recommendedAction,
      safetyScore: safetyCheckData.safetyScore,
      requiresReview:
        safetyCheckData.recommendedAction === SAFETY_ACTION.BLOCK ||
        safetyCheckData.recommendedAction === SAFETY_ACTION.UNKNOWN,
      isNewCheck: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during safety check processing',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}
