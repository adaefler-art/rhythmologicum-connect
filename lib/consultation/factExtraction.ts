/**
 * Issue 7: Fact Extraction from Consultation Notes
 * 
 * Extracts structured facts from consultation notes content
 * and maps them to assessment answer format
 */

import type { ConsultNoteContent } from '@/lib/types/consultNote'
import type { ExtractedFact, ConsultationExtractionResult } from './types'
import {
  CONSULTATION_QUESTION_MAPPINGS,
  EXTRACTOR_VERSION,
  MIN_CONFIDENCE_THRESHOLD,
} from './questionMapping'

/**
 * Extracts all facts from consultation note content
 * 
 * Rules enforced:
 * - R-I7-05: Only extract facts with confidence >= MIN_CONFIDENCE_THRESHOLD
 * - R-I7-06: Each fact must have source section reference
 * - R-I7-07: Answer values must be integers
 * - R-I7-08: Extraction must be deterministic (same input → same output)
 */
export function extractFactsFromConsultation(params: {
  consultNoteId: string
  patientId: string
  content: ConsultNoteContent
  consultationType: 'first' | 'follow_up'
  uncertaintyProfile: 'off' | 'qualitative' | 'mixed'
  minConfidence?: number
}): ConsultationExtractionResult {
  const {
    consultNoteId,
    patientId,
    content,
    consultationType,
    uncertaintyProfile,
    minConfidence = MIN_CONFIDENCE_THRESHOLD,
  } = params

  const extractedAt = new Date().toISOString()
  const extractedFacts: ExtractedFact[] = []

  // Apply each mapping to the content
  for (const mapping of CONSULTATION_QUESTION_MAPPINGS) {
    try {
      // Extract value using mapping logic
      const answerValue = mapping.extractionLogic(content)

      if (answerValue === null) {
        // Skip if extraction returns null (data not available)
        continue
      }

      // Validate answer value is integer
      if (!Number.isInteger(answerValue)) {
        console.warn(
          `[Issue 7] Non-integer value extracted for ${mapping.questionId}: ${answerValue}`,
        )
        continue
      }

      // Calculate confidence
      const confidence = mapping.confidenceEstimator
        ? mapping.confidenceEstimator(content)
        : 0.7 // Default confidence

      // Skip low-confidence facts if threshold set
      if (confidence < minConfidence) {
        continue
      }

      // Create extracted fact
      const fact: ExtractedFact = {
        questionId: mapping.questionId,
        answerValue,
        confidence,
        source: `consultation.${mapping.questionLabel}`,
        extractedAt,
      }

      extractedFacts.push(fact)
    } catch (error) {
      // Log extraction error but continue with other mappings
      console.error(
        `[Issue 7] Error extracting fact for ${mapping.questionId}:`,
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  // Calculate metadata
  const totalFactsExtracted = extractedFacts.length
  const averageConfidence =
    totalFactsExtracted > 0
      ? extractedFacts.reduce((sum, fact) => sum + fact.confidence, 0) / totalFactsExtracted
      : 0

  return {
    consultNoteId,
    patientId,
    extractedFacts,
    extractorVersion: EXTRACTOR_VERSION,
    extractedAt,
    metadata: {
      consultationType,
      uncertaintyProfile,
      totalFactsExtracted,
      averageConfidence,
    },
  }
}

/**
 * Validates extracted facts meet all requirements
 * 
 * Rules enforced:
 * - R-I7-09: All facts must have valid question IDs
 * - R-I7-10: All answer values must be integers
 * - R-I7-11: All confidence scores must be 0-1
 * - R-I7-12: All facts must have source attribution
 */
export function validateExtractedFacts(facts: ExtractedFact[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  facts.forEach((fact, index) => {
    // Validate question ID
    if (!fact.questionId || typeof fact.questionId !== 'string') {
      errors.push(`Fact ${index}: Invalid questionId`)
    }

    // Validate answer value is integer
    if (!Number.isInteger(fact.answerValue)) {
      errors.push(`Fact ${index}: answerValue must be integer, got ${fact.answerValue}`)
    }

    // Validate confidence range
    if (fact.confidence < 0 || fact.confidence > 1) {
      errors.push(`Fact ${index}: confidence must be 0-1, got ${fact.confidence}`)
    }

    // Validate source
    if (!fact.source || typeof fact.source !== 'string') {
      errors.push(`Fact ${index}: Missing source attribution`)
    }

    // Validate extractedAt timestamp
    if (!fact.extractedAt || isNaN(Date.parse(fact.extractedAt))) {
      errors.push(`Fact ${index}: Invalid extractedAt timestamp`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Filters facts by minimum confidence threshold
 */
export function filterLowConfidenceFacts(
  facts: ExtractedFact[],
  minConfidence: number,
): ExtractedFact[] {
  return facts.filter((fact) => fact.confidence >= minConfidence)
}

/**
 * Groups facts by confidence level for reporting
 */
export function groupFactsByConfidence(facts: ExtractedFact[]): {
  high: ExtractedFact[] // >= 0.8
  medium: ExtractedFact[] // 0.5 - 0.8
  low: ExtractedFact[] // < 0.5
} {
  return {
    high: facts.filter((f) => f.confidence >= 0.8),
    medium: facts.filter((f) => f.confidence >= 0.5 && f.confidence < 0.8),
    low: facts.filter((f) => f.confidence < 0.5),
  }
}
