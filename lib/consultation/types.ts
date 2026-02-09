/**
 * Issue 7: Consultation to Structured Facts Types
 * 
 * Type definitions for extracting structured facts from consultation notes
 * and mapping them to assessment question format for Risk/Results pipeline
 */

import { z } from 'zod'
import type { ConsultNoteContent } from '@/lib/types/consultNote'

/**
 * Extracted fact from consultation
 * Maps to an assessment answer (question_id + answer_value)
 */
export const ExtractedFactSchema = z.object({
  questionId: z.string(), // Maps to questions.key
  answerValue: z.number().int(), // Integer score for risk calculation
  confidence: z.number().min(0).max(1), // Extraction confidence
  source: z.string(), // Which section/field in consult note
  extractedAt: z.string(), // ISO timestamp
})

export type ExtractedFact = z.infer<typeof ExtractedFactSchema>

/**
 * Complete extraction result from consultation note
 */
export const ConsultationExtractionResultSchema = z.object({
  consultNoteId: z.string().uuid(),
  patientId: z.string().uuid(),
  extractedFacts: z.array(ExtractedFactSchema),
  extractorVersion: z.string(), // Version of extraction logic
  extractedAt: z.string(),
  metadata: z
    .object({
      consultationType: z.enum(['first', 'follow_up']),
      uncertaintyProfile: z.enum(['off', 'qualitative', 'mixed']),
      totalFactsExtracted: z.number().int(),
      averageConfidence: z.number().min(0).max(1),
    })
    .optional(),
})

export type ConsultationExtractionResult = z.infer<typeof ConsultationExtractionResultSchema>

/**
 * Mapping configuration: consultation field → question ID
 */
export interface ConsultationQuestionMapping {
  questionId: string // Target question.key in database
  questionLabel: string // Human-readable label
  extractionLogic: (content: ConsultNoteContent) => number | null // Extraction function
  confidenceEstimator?: (content: ConsultNoteContent) => number // Confidence score (0-1)
  description: string // What this mapping does
}

/**
 * Synthetic assessment metadata
 * Created from consultation facts
 */
export const SyntheticAssessmentMetadataSchema = z.object({
  source: z.literal('consultation_extraction'),
  consultNoteId: z.string().uuid(),
  extractorVersion: z.string(),
  extractedAt: z.string(),
  factCount: z.number().int(),
  averageConfidence: z.number().min(0).max(1),
})

export type SyntheticAssessmentMetadata = z.infer<typeof SyntheticAssessmentMetadataSchema>

/**
 * Error codes for extraction pipeline
 */
export const CONSULTATION_EXTRACTION_ERROR = {
  CONSULT_NOTE_NOT_FOUND: 'CONSULT_NOTE_NOT_FOUND',
  INVALID_CONTENT_STRUCTURE: 'INVALID_CONTENT_STRUCTURE',
  NO_EXTRACTABLE_FACTS: 'NO_EXTRACTABLE_FACTS',
  MAPPING_CONFIG_MISSING: 'MAPPING_CONFIG_MISSING',
  ASSESSMENT_CREATION_FAILED: 'ASSESSMENT_CREATION_FAILED',
  ANSWER_SAVE_FAILED: 'ANSWER_SAVE_FAILED',
} as const

export type ConsultationExtractionErrorCode =
  typeof CONSULTATION_EXTRACTION_ERROR[keyof typeof CONSULTATION_EXTRACTION_ERROR]

/**
 * Extraction pipeline options
 */
export interface ExtractionPipelineOptions {
  minConfidence?: number // Minimum confidence to include fact (default: 0.5)
  skipLowConfidence?: boolean // Skip facts below threshold (default: false)
  dryRun?: boolean // Extract but don't save to DB (default: false)
  funnelSlug?: string // Target funnel for assessment (default: from config)
}

/**
 * Extraction pipeline result
 */
export interface ExtractionPipelineResult {
  success: boolean
  assessmentId?: string
  factCount: number
  skippedFactCount: number
  errors?: string[]
  metadata?: SyntheticAssessmentMetadata
}
