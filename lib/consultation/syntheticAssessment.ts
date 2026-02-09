/**
 * Issue 7: Synthetic Assessment Creation
 * 
 * Creates assessments from consultation facts to feed into Risk/Results pipeline
 * Patient never sees "assessment" terminology - this is internal processing only
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExtractedFact, SyntheticAssessmentMetadata } from './types'
import { CONSULTATION_EXTRACTION_ERROR } from './types'
import { DEFAULT_CONSULTATION_FUNNEL, EXTRACTOR_VERSION } from './questionMapping'

/**
 * Creates a synthetic assessment from extracted facts
 * 
 * Rules enforced:
 * - R-I7-13: Assessment must be linked to patient_id
 * - R-I7-14: Assessment status must be 'completed' (ready for processing)
 * - R-I7-15: Assessment must reference consultation source in metadata
 * - R-I7-16: All facts must be saved as assessment_answers
 */
export async function createSyntheticAssessment(params: {
  supabase: SupabaseClient
  patientId: string
  consultNoteId: string
  extractedFacts: ExtractedFact[]
  funnelSlug?: string
}): Promise<{
  success: boolean
  assessmentId?: string
  errorCode?: string
  errorMessage?: string
}> {
  const { supabase, patientId, consultNoteId, extractedFacts, funnelSlug } = params

  // Validate inputs
  if (extractedFacts.length === 0) {
    return {
      success: false,
      errorCode: CONSULTATION_EXTRACTION_ERROR.NO_EXTRACTABLE_FACTS,
      errorMessage: 'No facts to create assessment from',
    }
  }

  const targetFunnel = funnelSlug || DEFAULT_CONSULTATION_FUNNEL

  try {
    // Step 1: Get funnel ID from slug
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id')
      .eq('slug', targetFunnel)
      .single()

    if (funnelError || !funnel) {
      return {
        success: false,
        errorCode: CONSULTATION_EXTRACTION_ERROR.MAPPING_CONFIG_MISSING,
        errorMessage: `Funnel not found: ${targetFunnel}`,
      }
    }

    // Step 2: Create assessment metadata
    const metadata: SyntheticAssessmentMetadata = {
      source: 'consultation_extraction',
      consultNoteId,
      extractorVersion: EXTRACTOR_VERSION,
      extractedAt: new Date().toISOString(),
      factCount: extractedFacts.length,
      averageConfidence:
        extractedFacts.reduce((sum, f) => sum + f.confidence, 0) / extractedFacts.length,
    }

    // Step 3: Create assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        patient_id: patientId,
        funnel: targetFunnel,
        funnel_id: funnel.id,
        status: 'completed', // Immediately completed since facts are extracted
        state: 'completed',
        completed_at: new Date().toISOString(),
        metadata: metadata as any, // Store extraction metadata
      })
      .select('id')
      .single()

    if (assessmentError || !assessment) {
      console.error('[Issue 7] Failed to create assessment:', assessmentError)
      return {
        success: false,
        errorCode: CONSULTATION_EXTRACTION_ERROR.ASSESSMENT_CREATION_FAILED,
        errorMessage: assessmentError?.message || 'Failed to create assessment',
      }
    }

    const assessmentId = assessment.id

    // Step 4: Save all extracted facts as assessment_answers
    const answers = extractedFacts.map((fact) => ({
      assessment_id: assessmentId,
      question_id: fact.questionId,
      answer_value: fact.answerValue,
      answer_data: {
        // Store extraction metadata in answer_data
        extractionSource: fact.source,
        confidence: fact.confidence,
        extractedAt: fact.extractedAt,
        extractorVersion: EXTRACTOR_VERSION,
      },
    }))

    const { error: answersError } = await supabase.from('assessment_answers').insert(answers)

    if (answersError) {
      console.error('[Issue 7] Failed to save assessment answers:', answersError)
      // Rollback: delete the assessment
      await supabase.from('assessments').delete().eq('id', assessmentId)

      return {
        success: false,
        errorCode: CONSULTATION_EXTRACTION_ERROR.ANSWER_SAVE_FAILED,
        errorMessage: answersError.message || 'Failed to save answers',
      }
    }

    return {
      success: true,
      assessmentId,
    }
  } catch (error) {
    console.error('[Issue 7] Unexpected error creating synthetic assessment:', error)
    return {
      success: false,
      errorCode: CONSULTATION_EXTRACTION_ERROR.ASSESSMENT_CREATION_FAILED,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Checks if synthetic assessment already exists for consultation note
 * 
 * Rules enforced:
 * - R-I7-17: Only one synthetic assessment per consultation note
 * - R-I7-18: Re-extraction updates existing assessment (idempotent)
 */
export async function findExistingSyntheticAssessment(
  supabase: SupabaseClient,
  consultNoteId: string,
): Promise<string | null> {
  try {
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('id')
      .eq('metadata->>consultNoteId', consultNoteId)
      .eq('metadata->>source', 'consultation_extraction')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !assessments || assessments.length === 0) {
      return null
    }

    return assessments[0].id
  } catch (error) {
    console.error('[Issue 7] Error checking for existing synthetic assessment:', error)
    return null
  }
}

/**
 * Updates existing synthetic assessment with new extracted facts
 * 
 * Rules enforced:
 * - R-I7-19: Delete old answers before inserting new ones
 * - R-I7-20: Update assessment metadata with new extraction data
 */
export async function updateSyntheticAssessment(params: {
  supabase: SupabaseClient
  assessmentId: string
  extractedFacts: ExtractedFact[]
  consultNoteId: string
}): Promise<{
  success: boolean
  errorCode?: string
  errorMessage?: string
}> {
  const { supabase, assessmentId, extractedFacts, consultNoteId } = params

  try {
    // Step 1: Delete existing answers
    const { error: deleteError } = await supabase
      .from('assessment_answers')
      .delete()
      .eq('assessment_id', assessmentId)

    if (deleteError) {
      console.error('[Issue 7] Failed to delete old answers:', deleteError)
      return {
        success: false,
        errorCode: CONSULTATION_EXTRACTION_ERROR.ANSWER_SAVE_FAILED,
        errorMessage: deleteError.message,
      }
    }

    // Step 2: Update assessment metadata
    const metadata: SyntheticAssessmentMetadata = {
      source: 'consultation_extraction',
      consultNoteId,
      extractorVersion: EXTRACTOR_VERSION,
      extractedAt: new Date().toISOString(),
      factCount: extractedFacts.length,
      averageConfidence:
        extractedFacts.reduce((sum, f) => sum + f.confidence, 0) / extractedFacts.length,
    }

    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        metadata: metadata as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assessmentId)

    if (updateError) {
      console.error('[Issue 7] Failed to update assessment metadata:', updateError)
    }

    // Step 3: Insert new answers
    const answers = extractedFacts.map((fact) => ({
      assessment_id: assessmentId,
      question_id: fact.questionId,
      answer_value: fact.answerValue,
      answer_data: {
        extractionSource: fact.source,
        confidence: fact.confidence,
        extractedAt: fact.extractedAt,
        extractorVersion: EXTRACTOR_VERSION,
      },
    }))

    const { error: insertError } = await supabase.from('assessment_answers').insert(answers)

    if (insertError) {
      console.error('[Issue 7] Failed to insert new answers:', insertError)
      return {
        success: false,
        errorCode: CONSULTATION_EXTRACTION_ERROR.ANSWER_SAVE_FAILED,
        errorMessage: insertError.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('[Issue 7] Unexpected error updating synthetic assessment:', error)
    return {
      success: false,
      errorCode: CONSULTATION_EXTRACTION_ERROR.ASSESSMENT_CREATION_FAILED,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}
