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

export type ChatAction = 'none' | 'warn' | 'require_confirm' | 'hard_stop'

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

export interface SafetyTriggeredRule {
  rule_id: string
  title: string
  level: EscalationLevel | 'needs_review'
  short_reason: string
  evidence: Array<{
    source: 'chat' | 'intake'
    source_id: string
    excerpt: string
    field_path?: string
  }>
  verified: boolean
  unverified?: boolean
  severity?: EscalationLevel
  policy_version: string
}

export interface SafetyPolicyResult {
  policy_version: string
  escalation_level: EscalationLevel | null
  chat_action: ChatAction
  studio_badge: string
  patient_banner_text: string
}

export interface SafetyOverride {
  level_override?: EscalationLevel | null
  chat_action_override?: ChatAction | null
  reason: string
  by_user_id: string
  at: string
}

export interface PolicyOverride {
  override_level: EscalationLevel | null
  override_action?: ChatAction | null
  reason: string
  created_by: string
  created_by_email?: string | null
  created_at: string
}

export interface SafetyEvaluation {
  red_flag_present: boolean
  escalation_level: EscalationLevel | null
  red_flags: RedFlagFinding[]
  triggered_rules?: SafetyTriggeredRule[]
  policy_result?: SafetyPolicyResult
  effective_policy_result?: SafetyPolicyResult
  override?: SafetyOverride | null
  effective_level?: EscalationLevel | null
  effective_action?: ChatAction
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

export type ReasoningLikelihood = 'low' | 'medium' | 'high'

export type ReasoningIssueSeverity = 'low' | 'medium' | 'high'

export interface ClinicalReasoningPack {
  risk_estimation: {
    score: number
    level: ReasoningLikelihood
    components: {
      verified_red_flags: number
      chronicity_signal: number
      anxiety_signal: number
    }
  }
  differentials: Array<{
    label: string
    likelihood: ReasoningLikelihood
    matched_triggers: string[]
    base_likelihood: ReasoningLikelihood
  }>
  open_questions: Array<{
    condition_label: string
    text: string
    priority: 1 | 2 | 3
  }>
  recommended_next_steps: string[]
  uncertainties: string[]
  uncertainty_items?: Array<{
    code: string
    message: string
    severity: ReasoningIssueSeverity
  }>
  conflicts?: Array<{
    code: string
    message: string
    severity: ReasoningIssueSeverity
    related_fields: string[]
  }>
  safety_alignment?: {
    blocked_by_safety: boolean
    effective_level: EscalationLevel | null
    rationale: string
  }
  adapter?: {
    domain: 'gp'
    version: string
    escalation_thresholds: {
      high: number
      medium: number
    }
    short_anamnesis_template: string[]
  }
}

export interface ClinicalFollowupQuestion {
  id: string
  question: string
  why: string
  priority: 1 | 2 | 3
  source: 'reasoning' | 'gap_rule' | 'clinician_request'
  objective_id?: string
}

export type ClinicalFollowupObjectiveStatus =
  | 'missing'
  | 'answered'
  | 'verified'
  | 'blocked_by_safety'

export interface ClinicalFollowupObjective {
  id: string
  label: string
  field_path: string
  status: ClinicalFollowupObjectiveStatus
  rationale: string
}

export interface ClinicalFollowup {
  next_questions: ClinicalFollowupQuestion[]
  queue?: ClinicalFollowupQuestion[]
  asked_question_ids: string[]
  last_generated_at: string
  objectives?: ClinicalFollowupObjective[]
  active_objective_ids?: string[]
  lifecycle?: {
    state: 'active' | 'needs_review' | 'completed'
    completed_question_ids: string[]
    skipped_question_ids: string[]
    resumed_at?: string | null
    completed_at?: string | null
  }
}

export type MandatoryIntakeAnswer = {
  value: string | null
  state: 'answered' | 'unanswered'
}

export interface TenWModule {
  was: MandatoryIntakeAnswer
  wo: MandatoryIntakeAnswer
  wann: MandatoryIntakeAnswer
  wie: MandatoryIntakeAnswer
  wie_stark: MandatoryIntakeAnswer
  wohin: MandatoryIntakeAnswer
  wie_lange: MandatoryIntakeAnswer
  wodurch: MandatoryIntakeAnswer
  welche: MandatoryIntakeAnswer
  warum: MandatoryIntakeAnswer
}

export interface OPQRSTModule {
  onset: MandatoryIntakeAnswer
  provocation: MandatoryIntakeAnswer
  palliation: MandatoryIntakeAnswer
  quality: MandatoryIntakeAnswer
  region_radiation: MandatoryIntakeAnswer
  severity: MandatoryIntakeAnswer
  timing: MandatoryIntakeAnswer
}

export interface BackgroundAnamnesis {
  past_medical_history: string[]
  medications: string[]
  allergies: string[]
  family_history: string[]
  social_history: string[]
  review_of_systems: string[]
}

export interface ExplicitNegative {
  text: string
  category: 'symptom' | 'safety' | 'other'
  source: 'llm' | 'teach_back' | 'manual'
}

export interface TeachBackBlock {
  summary: string
  confirmed: boolean
  missing_points?: string[]
}

export interface IntakeCompleteness {
  score: number
  answered_fields: number
  total_fields: number
  missing_fields: string[]
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
  reasoning?: ClinicalReasoningPack
  followup?: ClinicalFollowup
  ten_w?: TenWModule
  opqrst?: OPQRSTModule
  background_anamnesis?: BackgroundAnamnesis
  explicit_negatives?: ExplicitNegative[]
  teach_back?: TeachBackBlock
  completeness?: IntakeCompleteness
  language_normalization?: {
    version: string
    turns: Array<{
      turn_id: string
      source: 'patient'
      detected_language: 'de' | 'en' | 'mixed' | 'unknown'
      original_phrase: string
      mapped_entities: Array<{
        entity_type: 'symptom' | 'medication' | 'duration' | 'intensity' | 'other'
        canonical: string
        source_phrase: string
        confidence: number
      }>
      ambiguity_score: number
      clarification_required: boolean
      clarification_prompt?: string
      created_at: string
    }>
    pending_clarifications?: Array<{
      turn_id: string
      prompt: string
      ambiguity_score: number
      created_at: string
    }>
    last_updated_at: string
  }
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

  // Clinician policy override audit
  policy_override?: PolicyOverride | null
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
  requestId?: string
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
  requestId?: string
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
