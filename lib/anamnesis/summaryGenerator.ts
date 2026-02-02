/**
 * E75.5: Funnel Summary Generator
 * 
 * Creates system-generated anamnesis entries from completed assessments.
 * Summaries include funnel metadata, key answers, and processing results.
 * 
 * @module lib/anamnesis/summaryGenerator
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'
import { getPatientProfileId, getPatientOrganizationId } from '@/lib/api/anamnesis/helpers'

type SupabaseClientType = SupabaseClient<Database>

// =============================================================================
// Types
// =============================================================================

export interface FunnelSummaryMetadata {
  funnel_slug: string
  funnel_version: string
  assessment_id: string
  completed_at: string
  processing_job_id?: string
  key_answers?: Record<string, any>
  results_summary?: {
    risk_level?: string
    primary_scores?: Record<string, number>
    interventions?: string[]
  }
  provenance: {
    created_by_system: true
    generator_version: string
    generated_at: string
  }
}

export interface CreateFunnelSummaryInput {
  assessmentId: string
  funnelSlug: string
  funnelVersion?: string
  userId: string
  completedAt: string
  processingJobId?: string
  keyAnswers?: Record<string, any>
  resultsSummary?: {
    risk_level?: string
    primary_scores?: Record<string, number>
    interventions?: string[]
  }
}

export interface CreateFunnelSummaryResult {
  success: boolean
  entryId?: string
  isNew?: boolean
  error?: string
  errorCode?: string
}

// =============================================================================
// Constants
// =============================================================================

const GENERATOR_VERSION = 'v1.0.0'
const ENTRY_TYPE = 'funnel_summary'

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Creates or updates a funnel summary anamnesis entry
 * 
 * Idempotent: Checks if summary already exists for (patient, assessment)
 * If exists, returns existing entry without creating duplicate
 * 
 * @param supabase - Supabase client
 * @param input - Summary creation parameters
 * @returns Result with entry ID or error
 */
export async function createFunnelSummary(
  supabase: SupabaseClientType,
  input: CreateFunnelSummaryInput,
): Promise<CreateFunnelSummaryResult> {
  try {
    // Get patient profile ID from user ID
    const patientId = await getPatientProfileId(supabase, input.userId)
    
    if (!patientId) {
      return {
        success: false,
        error: 'Patient profile not found',
        errorCode: 'PATIENT_NOT_FOUND',
      }
    }

    // Get organization ID for patient
    const organizationId = await getPatientOrganizationId(supabase, patientId)
    
    if (!organizationId) {
      return {
        success: false,
        error: 'Patient organization not found',
        errorCode: 'ORGANIZATION_NOT_FOUND',
      }
    }

    // Check if summary already exists (idempotency)
    const existingSummary = await findExistingSummary(
      supabase,
      patientId,
      input.assessmentId,
    )

    if (existingSummary) {
      console.log('[funnel-summary] Summary already exists, returning existing entry', {
        entryId: existingSummary.id,
        assessmentId: input.assessmentId,
        patientId,
      })
      
      return {
        success: true,
        entryId: existingSummary.id,
        isNew: false,
      }
    }

    // Build summary content
    const content: FunnelSummaryMetadata = {
      funnel_slug: input.funnelSlug,
      funnel_version: input.funnelVersion || 'unknown',
      assessment_id: input.assessmentId,
      completed_at: input.completedAt,
      processing_job_id: input.processingJobId,
      key_answers: input.keyAnswers,
      results_summary: input.resultsSummary,
      provenance: {
        created_by_system: true,
        generator_version: GENERATOR_VERSION,
        generated_at: new Date().toISOString(),
      },
    }

    // Generate title from funnel slug
    const title = generateSummaryTitle(input.funnelSlug, input.completedAt)

    // Create anamnesis entry
    const { data: entry, error: createError } = await supabase
      .from('anamnesis_entries')
      .insert({
        patient_id: patientId,
        organization_id: organizationId,
        title,
        content,
        entry_type: ENTRY_TYPE,
        tags: [
          'system-generated',
          'funnel-summary',
          input.funnelSlug,
        ],
        created_by: input.userId,
        updated_by: input.userId,
      })
      .select('id')
      .single()

    if (createError) {
      console.error('[funnel-summary] Error creating summary entry:', createError)
      return {
        success: false,
        error: createError.message,
        errorCode: 'CREATE_FAILED',
      }
    }

    console.log('[funnel-summary] Summary entry created successfully', {
      entryId: entry.id,
      assessmentId: input.assessmentId,
      patientId,
      funnelSlug: input.funnelSlug,
    })

    return {
      success: true,
      entryId: entry.id,
      isNew: true,
    }
  } catch (error) {
    console.error('[funnel-summary] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Finds existing summary for patient + assessment
 * 
 * @param supabase - Supabase client
 * @param patientId - Patient profile ID
 * @param assessmentId - Assessment ID
 * @returns Existing entry or null
 */
async function findExistingSummary(
  supabase: SupabaseClientType,
  patientId: string,
  assessmentId: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('anamnesis_entries')
    .select('id')
    .eq('patient_id', patientId)
    .eq('entry_type', ENTRY_TYPE)
    .eq('is_archived', false)
    .eq('content->>assessment_id', assessmentId)
    .maybeSingle()

  if (error) {
    console.error('[funnel-summary] Error checking for existing summary:', error)
    return null
  }

  return data
}

/**
 * Generates a human-readable title for the summary
 * 
 * @param funnelSlug - Funnel slug
 * @param completedAt - Completion timestamp
 * @returns Title string
 */
function generateSummaryTitle(funnelSlug: string, completedAt: string): string {
  // Convert slug to readable name (e.g., "stress" → "Stress")
  const funnelName = funnelSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  // Format date (e.g., "2026-02-02" → "02.02.2026")
  const date = new Date(completedAt)
  const formattedDate = date.toLocaleDateString('de-DE')
  
  return `${funnelName} Assessment — ${formattedDate}`
}

/**
 * Extracts key answers from assessment for summary
 * 
 * This is a placeholder - implement based on specific funnel requirements
 * 
 * @param supabase - Supabase client
 * @param assessmentId - Assessment ID
 * @returns Key answers object
 */
export async function extractKeyAnswers(
  supabase: SupabaseClientType,
  assessmentId: string,
): Promise<Record<string, any>> {
  // TODO: Implement based on funnel-specific logic
  // For now, return empty object
  // Future: Extract specific high-value questions per funnel
  
  const { data: answers, error } = await supabase
    .from('assessment_answers')
    .select('question_id, answer_data')
    .eq('assessment_id', assessmentId)

  if (error || !answers) {
    console.warn('[funnel-summary] Could not load answers for key extraction:', error)
    return {}
  }

  // Return all answers for now (can be filtered later)
  const keyAnswers: Record<string, any> = {}
  for (const answer of answers) {
    keyAnswers[answer.question_id] = answer.answer_data
  }

  return keyAnswers
}

/**
 * Extracts results summary from processing job
 * 
 * @param supabase - Supabase client
 * @param processingJobId - Processing job ID
 * @returns Results summary object
 */
export async function extractResultsSummary(
  supabase: SupabaseClientType,
  processingJobId: string,
): Promise<{
  risk_level?: string
  primary_scores?: Record<string, number>
  interventions?: string[]
} | undefined> {
  try {
    // Load calculated_results for this job
    const { data: result, error } = await supabase
      .from('calculated_results')
      .select('result_data')
      .eq('job_id', processingJobId)
      .maybeSingle()

    if (error || !result?.result_data) {
      console.warn('[funnel-summary] No calculated results found:', error)
      return undefined
    }

    const resultData = result.result_data as any

    return {
      risk_level: resultData.risk_level,
      primary_scores: resultData.primary_scores,
      interventions: resultData.interventions,
    }
  } catch (error) {
    console.error('[funnel-summary] Error extracting results summary:', error)
    return undefined
  }
}
