/**
 * E6.4.5: Workup Types
 *
 * Types for the workup data sufficiency check system.
 * NO DIAGNOSIS - this is purely for data completeness validation.
 */

/**
 * Workup status values
 * - needs_more_data: Missing required data, follow-up questions needed
 * - ready_for_review: All required data present, ready for clinician review
 */
export type WorkupStatus = 'needs_more_data' | 'ready_for_review'

/**
 * Follow-up question structure
 * These are generated deterministically based on missing data
 */
export type FollowUpQuestion = {
  /** Unique identifier for the follow-up question */
  id: string
  /** Key identifying the data field this question addresses */
  fieldKey: string
  /** Human-readable question text in German */
  questionText: string
  /** Input type for the question */
  inputType: 'text' | 'scale' | 'boolean' | 'select'
  /** Priority (higher = more important) */
  priority: number
  /** Optional: choices for select type */
  choices?: string[]
}

/**
 * Data sufficiency check result
 */
export type DataSufficiencyResult = {
  /** Whether data is sufficient for review */
  isSufficient: boolean
  /** List of missing data field keys */
  missingDataFields: string[]
  /** Generated follow-up questions */
  followUpQuestions: FollowUpQuestion[]
  /** Stable hash of evidence pack (inputs) */
  evidencePackHash: string
}

/**
 * Assessment answers structured for workup processing
 */
export type AssessmentAnswers = {
  /** Question ID to answer value map */
  [questionId: string]: number | string | boolean
}

/**
 * Evidence pack - all inputs to the workup check
 */
export type EvidencePack = {
  /** Assessment ID */
  assessmentId: string
  /** Funnel slug */
  funnelSlug: string
  /** All assessment answers */
  answers: AssessmentAnswers
  /** Optional: uploaded documents/wearable data flags */
  hasUploadedDocuments?: boolean
  hasWearableData?: boolean
}

/**
 * Data sufficiency rule
 * Deterministic rule for checking if specific data is present
 */
export type DataSufficiencyRule = {
  /** Unique rule ID */
  id: string
  /** Field key this rule checks */
  fieldKey: string
  /** Human-readable description */
  description: string
  /** Check function - returns true if data is sufficient */
  check: (evidencePack: EvidencePack) => boolean
  /** Follow-up question to ask if data is missing */
  followUpQuestion: FollowUpQuestion
}

/**
 * Ruleset for a specific funnel
 */
export type DataSufficiencyRuleset = {
  /** Funnel slug this ruleset applies to */
  funnelSlug: string
  /** Version of the ruleset (for tracking changes) */
  version: string
  /** List of rules to check */
  rules: DataSufficiencyRule[]
}

/**
 * Workup check request
 */
export type WorkupCheckRequest = {
  assessmentId: string
  funnelSlug: string
}

/**
 * Workup check response (API contract)
 */
export type WorkupCheckResponse = {
  success: boolean
  data?: {
    assessmentId: string
    workupStatus: WorkupStatus
    missingDataFields: string[]
    followUpQuestions: FollowUpQuestion[]
    evidencePackHash: string
    rulesetVersion: string
  }
  error?: {
    code: string
    message: string
  }
}
