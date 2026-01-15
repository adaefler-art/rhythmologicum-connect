/**
 * E6.4.5: Workup Helpers
 *
 * Helper functions for loading assessment data and preparing evidence packs.
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { EvidencePack, AssessmentAnswers } from '@/lib/types/workup'

/**
 * Load assessment answers from database
 *
 * @param assessmentId - The assessment ID
 * @returns Map of question IDs to answer values
 */
export async function loadAssessmentAnswers(
  assessmentId: string,
): Promise<AssessmentAnswers> {
  const supabase = await createServerSupabaseClient()

  const { data: answers, error } = await supabase
    .from('assessment_answers')
    .select('question_id, answer_value')
    .eq('assessment_id', assessmentId)

  if (error) {
    console.error('[workup] Error loading assessment answers:', error)
    throw new Error('Failed to load assessment answers')
  }

  // Convert to map
  const answersMap: AssessmentAnswers = {}
  if (answers) {
    for (const answer of answers) {
      answersMap[answer.question_id] = answer.answer_value
    }
  }

  return answersMap
}

/**
 * Create an evidence pack from an assessment
 *
 * @param assessmentId - The assessment ID
 * @param funnelSlug - The funnel slug
 * @returns Complete evidence pack for workup processing
 */
export async function createEvidencePack(
  assessmentId: string,
  funnelSlug: string,
): Promise<EvidencePack> {
  // Load answers
  const answers = await loadAssessmentAnswers(assessmentId)

  // TODO: In future, check for uploaded documents and wearable data
  // For now, these are always false
  const hasUploadedDocuments = false
  const hasWearableData = false

  return {
    assessmentId,
    funnelSlug,
    answers,
    hasUploadedDocuments,
    hasWearableData,
  }
}
