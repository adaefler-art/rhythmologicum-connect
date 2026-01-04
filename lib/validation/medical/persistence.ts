/**
 * Medical Validation Persistence - V05-I05.5
 * 
 * Persistence layer for medical validation results storage and retrieval.
 * Idempotent operations with fail-closed error handling.
 * 
 * @module lib/validation/medical/persistence
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { MedicalValidationResultV1 } from '@/lib/contracts/medicalValidation'

// ============================================================
// Result Types
// ============================================================

export interface SaveValidationResult {
  success: boolean
  validationId?: string
  isNewValidation?: boolean
  error?: string
}

export interface LoadValidationResult {
  success: boolean
  validation?: MedicalValidationResultV1
  error?: string
}

// ============================================================
// Save Medical Validation Result
// ============================================================

/**
 * Save medical validation result to database
 * Idempotent: Uses upsert based on job_id (unique constraint)
 * 
 * @param supabase - Supabase client (service role required)
 * @param jobId - Processing job ID
 * @param validation - Validation result data
 * @returns Save result with validation ID
 */
export async function saveMedicalValidation(
  supabase: SupabaseClient,
  jobId: string,
  validation: MedicalValidationResultV1
): Promise<SaveValidationResult> {
  try {
    // Ensure jobId matches validation data
    if (validation.jobId !== jobId) {
      return {
        success: false,
        error: 'Job ID mismatch between parameter and validation data',
      }
    }

    // Extract metadata for top-level columns
    const metadata = validation.metadata

    // Prepare row data
    const row = {
      job_id: jobId,
      sections_id: validation.sectionsId || null,
      validation_version: validation.validationVersion,
      engine_version: validation.engineVersion,
      overall_status: validation.overallStatus,
      overall_passed: validation.overallPassed,
      validation_data: validation, // Store complete structure
      flags_raised_count: metadata.flagsRaisedCount,
      critical_flags_count: metadata.criticalFlagsCount,
      warning_flags_count: metadata.warningFlagsCount,
      info_flags_count: metadata.infoFlagsCount,
      rules_evaluated_count: metadata.rulesEvaluatedCount,
      validation_time_ms: metadata.validationTimeMs,
      validated_at: validation.validatedAt,
    }

    // Check if validation already exists
    const { data: existing, error: checkError } = await supabase
      .from('medical_validation_results')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[MedicalValidationPersistence] Check error:', checkError.message)
      return {
        success: false,
        error: `Failed to check existing validation: ${checkError.message}`,
      }
    }

    const isNewValidation = !existing

    // Upsert validation result
    const { data, error: upsertError } = await supabase
      .from('medical_validation_results')
      .upsert(row, {
        onConflict: 'job_id',
        ignoreDuplicates: false,
      })
      .select('id')
      .single()

    if (upsertError) {
      console.error('[MedicalValidationPersistence] Upsert error:', upsertError.message)
      return {
        success: false,
        error: `Failed to save validation: ${upsertError.message}`,
      }
    }

    return {
      success: true,
      validationId: data.id,
      isNewValidation,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MedicalValidationPersistence] Save error:', error)
    return {
      success: false,
      error: `Unexpected error saving validation: ${message}`,
    }
  }
}

// ============================================================
// Load Medical Validation Result
// ============================================================

/**
 * Load medical validation result by job ID
 * 
 * @param supabase - Supabase client
 * @param jobId - Processing job ID
 * @returns Load result with validation data
 */
export async function loadMedicalValidation(
  supabase: SupabaseClient,
  jobId: string
): Promise<LoadValidationResult> {
  try {
    const { data, error } = await supabase
      .from('medical_validation_results')
      .select('validation_data')
      .eq('job_id', jobId)
      .maybeSingle()

    if (error) {
      console.error('[MedicalValidationPersistence] Load error:', error.message)
      return {
        success: false,
        error: `Failed to load validation: ${error.message}`,
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Validation not found',
      }
    }

    return {
      success: true,
      validation: data.validation_data as MedicalValidationResultV1,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MedicalValidationPersistence] Load error:', error)
    return {
      success: false,
      error: `Unexpected error loading validation: ${message}`,
    }
  }
}

// ============================================================
// Load by Sections ID
// ============================================================

/**
 * Load medical validation result by sections ID
 * Returns most recent validation for the given sections
 * 
 * @param supabase - Supabase client
 * @param sectionsId - Report sections ID
 * @returns Load result with validation data
 */
export async function loadMedicalValidationBySections(
  supabase: SupabaseClient,
  sectionsId: string
): Promise<LoadValidationResult> {
  try {
    const { data, error } = await supabase
      .from('medical_validation_results')
      .select('validation_data')
      .eq('sections_id', sectionsId)
      .order('validated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[MedicalValidationPersistence] Load by sections error:', error.message)
      return {
        success: false,
        error: `Failed to load validation by sections: ${error.message}`,
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Validation not found for sections',
      }
    }

    return {
      success: true,
      validation: data.validation_data as MedicalValidationResultV1,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MedicalValidationPersistence] Load by sections error:', error)
    return {
      success: false,
      error: `Unexpected error loading validation: ${message}`,
    }
  }
}

// ============================================================
// Delete Medical Validation
// ============================================================

/**
 * Delete medical validation result by job ID
 * Used for cleanup or re-validation scenarios
 * 
 * @param supabase - Supabase client (service role required)
 * @param jobId - Processing job ID
 * @returns Delete result
 */
export async function deleteMedicalValidation(
  supabase: SupabaseClient,
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('medical_validation_results')
      .delete()
      .eq('job_id', jobId)

    if (error) {
      console.error('[MedicalValidationPersistence] Delete error:', error.message)
      return {
        success: false,
        error: `Failed to delete validation: ${error.message}`,
      }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MedicalValidationPersistence] Delete error:', error)
    return {
      success: false,
      error: `Unexpected error deleting validation: ${message}`,
    }
  }
}

// ============================================================
// Query Functions
// ============================================================

/**
 * List failed validations (critical flags present)
 * Useful for monitoring and review queue
 * 
 * @param supabase - Supabase client
 * @param limit - Maximum number of results
 * @returns Array of job IDs with failed validations
 */
export async function listFailedValidations(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<{ success: boolean; jobIds?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('medical_validation_results')
      .select('job_id')
      .eq('overall_passed', false)
      .order('validated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[MedicalValidationPersistence] List failed error:', error.message)
      return {
        success: false,
        error: `Failed to list failed validations: ${error.message}`,
      }
    }

    return {
      success: true,
      jobIds: data.map((row) => row.job_id),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MedicalValidationPersistence] List failed error:', error)
    return {
      success: false,
      error: `Unexpected error listing failed validations: ${message}`,
    }
  }
}

/**
 * Count validations by status
 * 
 * @param supabase - Supabase client
 * @returns Counts by status
 */
export async function countValidationsByStatus(
  supabase: SupabaseClient
): Promise<{
  success: boolean
  counts?: { pass: number; flag: number; fail: number }
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('medical_validation_results')
      .select('overall_status')

    if (error) {
      console.error('[MedicalValidationPersistence] Count error:', error.message)
      return {
        success: false,
        error: `Failed to count validations: ${error.message}`,
      }
    }

    const counts = { pass: 0, flag: 0, fail: 0 }
    for (const row of data) {
      if (row.overall_status in counts) {
        counts[row.overall_status as keyof typeof counts]++
      }
    }

    return {
      success: true,
      counts,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MedicalValidationPersistence] Count error:', error)
    return {
      success: false,
      error: `Unexpected error counting validations: ${message}`,
    }
  }
}
