/**
 * Validation Stage Processor - V05-I05.5
 * 
 * Processes the VALIDATION stage of the processing job pipeline.
 * Applies Medical Validation Layer 1 (rules-based checks) to report sections.
 * 
 * @module lib/processing/validationStageProcessor
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadReportSections } from '@/lib/sections/persistence'
import { validateReportSections } from '@/lib/validation/medical/validator'
import { saveMedicalValidation } from '@/lib/validation/medical/persistence'

// ============================================================
// Validation Stage Processing Result
// ============================================================

export interface ValidationStageResult {
  success: boolean
  error?: string
  errorCode?: string
  validationId?: string
  overallPassed?: boolean
  overallStatus?: string
  criticalFlagsCount?: number
}

// ============================================================
// Validation Stage Processor
// ============================================================

/**
 * Process VALIDATION stage for a job
 * 
 * Workflow:
 * 1. Load report sections from database
 * 2. Run medical validation (rules-based)
 * 3. Save validation results to database
 * 4. Return result with pass/fail status
 * 
 * @param supabase - Supabase admin client (service role)
 * @param jobId - Processing job ID
 * @returns Processing result with validation status
 */
export async function processValidationStage(
  supabase: SupabaseClient,
  jobId: string
): Promise<ValidationStageResult> {
  try {
    // Step 1: Load report sections
    const sectionsResult = await loadReportSections(supabase, jobId)
    
    if (!sectionsResult.success) {
      return {
        success: false,
        error: sectionsResult.error || 'Failed to load report sections',
        errorCode: 'LOAD_SECTIONS_FAILED',
      }
    }
    
    if (!sectionsResult.sections) {
      return {
        success: false,
        error: 'No report sections found for job',
        errorCode: 'NO_SECTIONS',
      }
    }
    
    // Step 2: Run medical validation
    const validationResult = validateReportSections({
      sections: sectionsResult.sections,
    })
    
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.message,
        errorCode: validationResult.error.code,
      }
    }
    
    // Step 3: Save validation results
    const saveResult = await saveMedicalValidation(
      supabase,
      jobId,
      validationResult.data
    )
    
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error,
        errorCode: 'SAVE_VALIDATION_FAILED',
      }
    }
    
    // Step 4: Return result
    return {
      success: true,
      validationId: saveResult.validationId,
      overallPassed: validationResult.data.overallPassed,
      overallStatus: validationResult.data.overallStatus,
      criticalFlagsCount: validationResult.data.metadata.criticalFlagsCount,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: `Unexpected error in validation stage processing: ${message}`,
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}
