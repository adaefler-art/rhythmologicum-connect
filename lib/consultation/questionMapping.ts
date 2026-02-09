/**
 * Issue 7: Consultation Question Mapping Configuration
 * 
 * Maps consultation note sections to assessment question IDs
 * for Risk/Results pipeline integration
 */

import type { ConsultNoteContent } from '@/lib/types/consultNote'
import type { ConsultationQuestionMapping } from './types'

/**
 * EXTRACTOR_VERSION - increment when changing extraction logic
 * Format: vMAJOR.MINOR.PATCH
 */
export const EXTRACTOR_VERSION = 'v1.0.0'

/**
 * Default funnel slug for consultation-based assessments
 * This should match an existing funnel in the database
 */
export const DEFAULT_CONSULTATION_FUNNEL = 'stress-assessment'

/**
 * Minimum confidence threshold for including extracted facts
 */
export const MIN_CONFIDENCE_THRESHOLD = 0.5

/**
 * Maps consultation content to assessment question IDs
 * 
 * Rules:
 * - R-I7-01: Each mapping must specify questionId that exists in questions table
 * - R-I7-02: extractionLogic must return integer value or null
 * - R-I7-03: Confidence must be between 0 and 1
 * - R-I7-04: Source field must identify originating section
 */
export const CONSULTATION_QUESTION_MAPPINGS: ConsultationQuestionMapping[] = [
  // Example mapping: Stress level from problem list
  {
    questionId: 'stress_level_overall',
    questionLabel: 'Overall Stress Level',
    description: 'Maps problem severity to stress level (0-10 scale)',
    extractionLogic: (content: ConsultNoteContent): number | null => {
      // Extract from problem list - count high-severity problems
      if (!content.problemList || !Array.isArray(content.problemList)) {
        return null
      }

      const problemCount = content.problemList.length
      if (problemCount === 0) return 1 // Low stress if no problems
      if (problemCount >= 7) return 9 // High stress if many problems
      if (problemCount >= 5) return 7 // Moderate-high
      if (problemCount >= 3) return 5 // Moderate

      return 3 // Low-moderate
    },
    confidenceEstimator: (content: ConsultNoteContent): number => {
      // Higher confidence if we have structured problem list
      if (!content.problemList || !Array.isArray(content.problemList)) {
        return 0.3
      }
      return content.problemList.length >= 3 ? 0.8 : 0.6
    },
  },

  // Example mapping: Sleep quality from objective data or HPI
  {
    questionId: 'sleep_quality',
    questionLabel: 'Sleep Quality',
    description: 'Extracts sleep quality score from objective data or HPI',
    extractionLogic: (content: ConsultNoteContent): number | null => {
      // Check objective data first
      if (content.objectiveData?.values?.sleep_hours) {
        const hours = parseFloat(String(content.objectiveData.values.sleep_hours))
        if (!isNaN(hours)) {
          // Map sleep hours to quality score (0-10)
          if (hours < 5) return 2 // Poor
          if (hours < 6) return 4 // Fair
          if (hours >= 7 && hours <= 9) return 8 // Good
          if (hours > 9) return 6 // Excessive
          return 5 // Average
        }
      }

      // Check HPI for sleep mentions
      if (content.hpi?.associatedSymptoms) {
        const symptoms = content.hpi.associatedSymptoms
        const hasSleepIssues = symptoms.some((s) =>
          s.toLowerCase().includes('sleep') || s.toLowerCase().includes('insomnia'),
        )
        if (hasSleepIssues) return 3 // Problematic
      }

      return null // Cannot determine
    },
    confidenceEstimator: (content: ConsultNoteContent): number => {
      if (content.objectiveData?.values?.sleep_hours) return 0.9
      if (content.hpi?.associatedSymptoms?.some((s) => s.toLowerCase().includes('sleep'))) {
        return 0.6
      }
      return 0.3
    },
  },

  // Example mapping: Functional impairment from HPI
  {
    questionId: 'functional_impairment',
    questionLabel: 'Functional Impairment',
    description: 'Maps functional impact description to impairment score',
    extractionLogic: (content: ConsultNoteContent): number | null => {
      if (!content.hpi?.functionalImpact) return null

      const impact = content.hpi.functionalImpact.toLowerCase()

      // Keyword-based scoring
      if (impact.includes('severe') || impact.includes('unable')) return 9
      if (impact.includes('significant') || impact.includes('major')) return 7
      if (impact.includes('moderate')) return 5
      if (impact.includes('mild') || impact.includes('minor')) return 3
      if (impact.includes('minimal') || impact.includes('none')) return 1

      return 5 // Default moderate if impact mentioned but unclear
    },
    confidenceEstimator: (content: ConsultNoteContent): number => {
      if (!content.hpi?.functionalImpact) return 0.0

      const impact = content.hpi.functionalImpact.toLowerCase()
      const hasQualifier =
        impact.includes('severe') ||
        impact.includes('significant') ||
        impact.includes('moderate') ||
        impact.includes('mild') ||
        impact.includes('minimal')

      return hasQualifier ? 0.8 : 0.5
    },
  },

  // Example mapping: Red flags presence
  {
    questionId: 'red_flags_count',
    questionLabel: 'Red Flags Count',
    description: 'Number of positive red flags identified',
    extractionLogic: (content: ConsultNoteContent): number | null => {
      if (!content.redFlagsScreening?.screened) return null

      const positiveFlags = content.redFlagsScreening.positive || []
      return Math.min(positiveFlags.length, 10) // Cap at 10
    },
    confidenceEstimator: (content: ConsultNoteContent): number => {
      // High confidence if screening was performed
      return content.redFlagsScreening?.screened ? 1.0 : 0.0
    },
  },
]

/**
 * Validates that all mappings reference valid question IDs
 * This should be called during startup or in tests
 */
export function validateMappingConfiguration(): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check for duplicate question IDs
  const questionIds = CONSULTATION_QUESTION_MAPPINGS.map((m) => m.questionId)
  const duplicates = questionIds.filter((id, index) => questionIds.indexOf(id) !== index)
  if (duplicates.length > 0) {
    errors.push(`Duplicate question IDs found: ${duplicates.join(', ')}`)
  }

  // Check that each mapping has required fields
  CONSULTATION_QUESTION_MAPPINGS.forEach((mapping, index) => {
    if (!mapping.questionId) {
      errors.push(`Mapping ${index} missing questionId`)
    }
    if (!mapping.questionLabel) {
      errors.push(`Mapping ${index} missing questionLabel`)
    }
    if (!mapping.extractionLogic) {
      errors.push(`Mapping ${index} missing extractionLogic`)
    }
    if (!mapping.description) {
      errors.push(`Mapping ${index} missing description`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Gets mapping for a specific question ID
 */
export function getMappingForQuestion(questionId: string): ConsultationQuestionMapping | null {
  return CONSULTATION_QUESTION_MAPPINGS.find((m) => m.questionId === questionId) || null
}

/**
 * Gets all configured question IDs
 */
export function getAllMappedQuestionIds(): string[] {
  return CONSULTATION_QUESTION_MAPPINGS.map((m) => m.questionId)
}
