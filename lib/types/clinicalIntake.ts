/**
 * Issue 10: Clinical Intake Synthesis Types
 * 
 * Types for structured clinical intake data generated from patient conversations.
 * Supports both machine-readable (STRUCTURED_INTAKE) and physician-readable (CLINICAL_SUMMARY) formats.
 */

// ============================================================================
// STRUCTURED_INTAKE Types
// ============================================================================

export type IntakeStatus = 'draft' | 'active' | 'superseded' | 'archived'

export type EscalationLevel = 'A' | 'B' | 'C'

export interface RedFlagFinding {
  id: string
  rule_id: string
  policy_version: string
  domain: string
  trigger: string
  level: EscalationLevel
  rationale: string
  evidence_message_ids?: string[]
}

export interface SafetyEvaluation {
  red_flag_present: boolean
  escalation_level: EscalationLevel | null
  red_flags: RedFlagFinding[]
  rule_ids?: string[]
  check_ids?: string[]
  contradictions_present?: boolean
  safety_questions?: string[]
  quality?: {
    confidence?: 'low' | 'medium' | 'high'
    notes?: string[]
  }
}

export type TriggerReason = 
  | 'new_medical_info' 
  | 'clarification' 
  | 'thematic_block_complete' 
  | 'time_based'
  | 'manual'

export interface HistoryOfPresentIllness {
  onset?: string
  duration?: string
  course?: string
  associated_symptoms?: string[]
  relieving_factors?: string[]
  aggravating_factors?: string[]
}

export interface StructuredIntakeData {
  status: 'draft'
  chief_complaint?: string
  history_of_present_illness?: HistoryOfPresentIllness
  relevant_negatives?: string[]
  past_medical_history?: string[]
  medication?: string[]
  psychosocial_factors?: string[]
  red_flags?: string[]
  uncertainties?: string[]
  last_updated_from_messages?: string[]
  safety?: SafetyEvaluation
}

// ============================================================================
// Database Record Type
// ============================================================================

export interface ClinicalIntake {
  id: string
  user_id: string
  patient_id: string | null
  organization_id: string | null
  chat_session_id: string | null
  
  status: IntakeStatus
  version_number: number
  
  // STRUCTURED_INTAKE (machine-readable)
  structured_data: StructuredIntakeData
  
  // CLINICAL_SUMMARY (physician-readable)
  clinical_summary: string | null
  
  // Trigger metadata
  trigger_reason: string | null
  last_updated_from_messages: string[] | null
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Audit
  created_by: string | null
  updated_by: string | null
  
  // Metadata
  metadata: Record<string, unknown>
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface GenerateIntakeRequest {
  /** Array of message IDs to process for intake generation */
  messageIds?: string[]
  /** Trigger reason for this generation */
  triggerReason?: TriggerReason
  /** Force regeneration even if recent intake exists */
  force?: boolean
}

export interface GenerateIntakeResponse {
  success: boolean
  data?: {
    intake: ClinicalIntake
    isNew: boolean
  }
  error?: {
    code: string
    message: string
  }
}

export interface GetIntakeResponse {
  success: boolean
  data?: {
    intake: ClinicalIntake | null
  }
  error?: {
    code: string
    message: string
  }
}

// ============================================================================
// LLM Prompt Types
// ============================================================================

export interface IntakeLLMOutput {
  STRUCTURED_INTAKE: StructuredIntakeData
  CLINICAL_SUMMARY: string
}

// ============================================================================
// Quality Check Types
// ============================================================================

export interface IntakeQualityCheck {
  rule: string
  passed: boolean
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface IntakeQualityReport {
  isValid: boolean
  checks: IntakeQualityCheck[]
  errors: IntakeQualityCheck[]
  warnings: IntakeQualityCheck[]
}
