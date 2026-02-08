/**
 * Issue 5: Consult Note v1 Types
 * 
 * Defines strict 12-section structure for medical consultation notes.
 * NO diagnoses allowed. Uncertainty profiles enforced.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ConsultationType = 'first' | 'follow_up'
export type UncertaintyProfile = 'off' | 'qualitative' | 'mixed'
export type AssertivenessLevel = 'conservative' | 'balanced' | 'direct'
export type AudienceType = 'patient' | 'clinician'

// ============================================================================
// SECTION STRUCTURES (12 Mandatory Sections)
// ============================================================================

/**
 * Section 1: Header
 * Metadata about the consultation
 */
export interface ConsultNoteHeader {
  timestamp: string // ISO 8601
  consultationType: ConsultationType
  source: string // e.g., "Patient self-report via PAT"
  guidelineVersion?: string
  uncertaintyProfile: UncertaintyProfile
  assertiveness: AssertivenessLevel
  audience: AudienceType
}

/**
 * Section 2: Chief Complaint
 * 1-2 sentences describing reason for consultation
 */
export interface ChiefComplaint {
  text: string // Max 2 sentences
}

/**
 * Section 3: History of Present Illness (HPI)
 * Structured bullet points about current symptoms
 */
export interface HistoryOfPresentIllness {
  onset?: string // When symptoms began
  course?: string // How symptoms evolved
  character?: string // Nature of symptoms
  severity?: string // Qualitative or scale
  triggers?: string // What makes it worse
  relief?: string // What makes it better
  associatedSymptoms?: string[] // Other symptoms
  functionalImpact?: string // Impact on daily life
  priorActions?: string // What patient has tried
}

/**
 * Section 4: Red Flags Screening
 * Critical warning signs assessment
 */
export interface RedFlagsScreening {
  screened: boolean // Was screening performed?
  positive: string[] // List of positive red flags (if any)
  negative?: string // Summary of negative screening
}

/**
 * Section 5: Relevant Medical History / Risks
 * Pre-existing conditions and risk factors
 */
export interface MedicalHistory {
  relevantConditions?: string[] // Pre-existing conditions
  riskFactors?: string[] // Risk factors
  familySocialFactors?: string[] // Family/social context
}

/**
 * Section 6: Medications / Allergies
 * Current medications and known allergies
 */
export interface MedicationsAllergies {
  medications?: string[] // Current medications
  allergies?: string[] // Known allergies/intolerances
}

/**
 * Section 7: Objective Data
 * Self-reported measurements
 */
export interface ObjectiveData {
  values?: Record<string, string | number> // e.g., { "BP": "120/80", "HR": 72 }
  note?: string // "No objective data reported" if empty
}

/**
 * Section 8: Problem List
 * 3-7 clinical problem formulations (NOT diagnoses)
 */
export interface ProblemList {
  problems: string[] // 3-7 bullet points, clinical formulations only
}

/**
 * Section 9: Preliminary Assessment
 * Working hypotheses as options (NO definitive diagnoses)
 */
export interface PreliminaryAssessment {
  hypotheses: string[] // Working hypotheses as options
  uncertaintyNote?: string // Controlled by uncertainty profile
}

/**
 * Section 10: Missing Data / Next Data Requests
 * What information is needed for better assessment
 */
export interface MissingData {
  high?: string[] // High priority missing data
  medium?: string[] // Medium priority
  optional?: string[] // Optional but helpful
}

/**
 * Section 11: Next Steps
 * Recommendations for patient and clinician
 */
export interface NextSteps {
  patientLevel?: string[] // Patient-facing recommendations
  clinicianLevel?: string[] // Clinician-facing options/actions
}

/**
 * Section 12: Handoff Summary
 * Max 10 lines, optimized for clinician handoff
 */
export interface HandoffSummary {
  summary: string[] // Max 10 lines
}

// ============================================================================
// COMPLETE CONSULT NOTE CONTENT
// ============================================================================

/**
 * Complete structured content for Consult Note v1
 * All 12 sections in strict order
 */
export interface ConsultNoteContent {
  // Section 1
  header: ConsultNoteHeader
  
  // Section 2
  chiefComplaint: ChiefComplaint
  
  // Section 3
  hpi: HistoryOfPresentIllness
  
  // Section 4
  redFlagsScreening: RedFlagsScreening
  
  // Section 5
  medicalHistory: MedicalHistory
  
  // Section 6
  medications: MedicationsAllergies
  
  // Section 7
  objectiveData: ObjectiveData
  
  // Section 8
  problemList: ProblemList
  
  // Section 9
  preliminaryAssessment: PreliminaryAssessment
  
  // Section 10
  missingData: MissingData
  
  // Section 11
  nextSteps: NextSteps
  
  // Section 12
  handoffSummary: HandoffSummary
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Consult Note database row
 */
export interface ConsultNote {
  id: string
  patient_id: string
  organization_id: string
  chat_session_id?: string | null
  
  // Header metadata
  consultation_type: ConsultationType
  source: string
  guideline_version?: string | null
  
  // Uncertainty config
  uncertainty_profile: UncertaintyProfile
  assertiveness: AssertivenessLevel
  audience: AudienceType
  
  // Content
  content: ConsultNoteContent
  rendered_markdown?: string | null
  
  // Versioning
  version_number: number
  
  // Status
  is_archived: boolean
  
  // Audit
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  
  // Metadata
  metadata?: Record<string, unknown>
}

/**
 * Consult Note version history
 */
export interface ConsultNoteVersion {
  id: string
  consult_note_id: string
  version_number: number
  content: ConsultNoteContent
  rendered_markdown?: string | null
  change_summary?: string | null
  diff?: Record<string, unknown> | null
  created_at: string
  created_by?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Insert payload for creating new consult note
 */
export interface CreateConsultNotePayload {
  patient_id: string
  organization_id: string
  chat_session_id?: string | null
  consultation_type?: ConsultationType
  source?: string
  guideline_version?: string | null
  uncertainty_profile?: UncertaintyProfile
  assertiveness?: AssertivenessLevel
  audience?: AudienceType
  content: ConsultNoteContent
  rendered_markdown?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Update payload (limited - prefer versioning via new creation)
 */
export interface UpdateConsultNotePayload {
  content?: ConsultNoteContent
  rendered_markdown?: string | null
  is_archived?: boolean
  metadata?: Record<string, unknown>
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result for consult note
 */
export interface ConsultNoteValidation {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  section: string
  field?: string
  message: string
  code: string // e.g., "MISSING_SECTION", "DIAGNOSIS_DETECTED"
}

export interface ValidationWarning {
  section: string
  field?: string
  message: string
  code: string // e.g., "HANDOFF_TOO_LONG", "PROBLEM_LIST_SHORT"
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ConsultNoteApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface CreateConsultNoteResponse {
  consultNote: ConsultNote
  validation: ConsultNoteValidation
}

export interface ListConsultNotesResponse {
  consultNotes: ConsultNote[]
  total: number
  page: number
  perPage: number
}
