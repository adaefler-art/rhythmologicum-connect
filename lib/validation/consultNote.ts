/**
 * Issue 5: Consult Note v1 Validation
 * 
 * Validates the 12-section structure and enforces rules:
 * - All 12 sections must be present
 * - Handoff summary max 10 lines
 * - No diagnosis language allowed
 * - Problem list 3-7 items
 */

import type {
  ConsultNoteContent,
  ConsultNoteValidation,
  ValidationError,
  ValidationWarning,
} from '@/lib/types/consultNote'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_HANDOFF_LINES = 10
const MIN_PROBLEM_LIST_ITEMS = 3
const MAX_PROBLEM_LIST_ITEMS = 7
const MAX_CHIEF_COMPLAINT_SENTENCES = 2

// Forbidden diagnosis words (case-insensitive)
const DIAGNOSIS_FORBIDDEN_WORDS = [
  'you have',
  'diagnosis:',
  'diagnosed with',
  'definitive diagnosis',
  'confirmed',
  'definitively',
  'certainly is',
  'definitely',
  'it is clear that',
]

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validates complete consult note structure
 * Returns validation result with errors and warnings
 */
export function validateConsultNote(content: ConsultNoteContent): ConsultNoteValidation {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Validate all 12 sections exist
  validateSectionPresence(content, errors)

  // Validate header
  validateHeader(content, errors, warnings)

  // Validate chief complaint
  validateChiefComplaint(content, errors, warnings)

  // Validate HPI
  validateHPI(content, errors, warnings)

  // Validate red flags
  validateRedFlags(content, errors, warnings)

  // Validate problem list
  validateProblemList(content, errors, warnings)

  // Validate preliminary assessment
  validatePreliminaryAssessment(content, errors, warnings)

  // Validate handoff summary
  validateHandoffSummary(content, errors, warnings)

  // Check for diagnosis language across all text fields
  validateNoDiagnosisLanguage(content, errors)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// SECTION-SPECIFIC VALIDATORS
// ============================================================================

/**
 * R-CN-01: All 12 sections must be present
 */
function validateSectionPresence(content: ConsultNoteContent, errors: ValidationError[]): void {
  const requiredSections = [
    'header',
    'chiefComplaint',
    'hpi',
    'redFlagsScreening',
    'medicalHistory',
    'medications',
    'objectiveData',
    'problemList',
    'preliminaryAssessment',
    'missingData',
    'nextSteps',
    'handoffSummary',
  ] as const

  for (const section of requiredSections) {
    if (!content[section]) {
      errors.push({
        section,
        message: `Missing required section: ${section}`,
        code: 'MISSING_SECTION',
      })
    }
  }
}

/**
 * R-CN-02: Header must have all required fields
 */
function validateHeader(
  content: ConsultNoteContent,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!content.header) return

  const { timestamp, consultationType, source, uncertaintyProfile, assertiveness, audience } =
    content.header

  if (!timestamp) {
    errors.push({
      section: 'header',
      field: 'timestamp',
      message: 'Timestamp is required',
      code: 'MISSING_TIMESTAMP',
    })
  }

  if (!consultationType) {
    errors.push({
      section: 'header',
      field: 'consultationType',
      message: 'Consultation type is required',
      code: 'MISSING_CONSULTATION_TYPE',
    })
  }

  if (!source) {
    errors.push({
      section: 'header',
      field: 'source',
      message: 'Source is required',
      code: 'MISSING_SOURCE',
    })
  }

  if (!uncertaintyProfile) {
    errors.push({
      section: 'header',
      field: 'uncertaintyProfile',
      message: 'Uncertainty profile is required',
      code: 'MISSING_UNCERTAINTY_PROFILE',
    })
  }

  if (!assertiveness) {
    errors.push({
      section: 'header',
      field: 'assertiveness',
      message: 'Assertiveness level is required',
      code: 'MISSING_ASSERTIVENESS',
    })
  }

  if (!audience) {
    errors.push({
      section: 'header',
      field: 'audience',
      message: 'Audience is required',
      code: 'MISSING_AUDIENCE',
    })
  }

  // Warn if guideline version is missing
  if (!content.header.guidelineVersion) {
    warnings.push({
      section: 'header',
      field: 'guidelineVersion',
      message: 'Guideline version not specified',
      code: 'MISSING_GUIDELINE_VERSION',
    })
  }
}

/**
 * R-CN-03: Chief complaint should be 1-2 sentences
 */
function validateChiefComplaint(
  content: ConsultNoteContent,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!content.chiefComplaint?.text) {
    errors.push({
      section: 'chiefComplaint',
      field: 'text',
      message: 'Chief complaint text is required',
      code: 'MISSING_CHIEF_COMPLAINT_TEXT',
    })
    return
  }

  const sentenceCount = content.chiefComplaint.text.split(/[.!?]+/).filter((s) => s.trim()).length

  if (sentenceCount > MAX_CHIEF_COMPLAINT_SENTENCES) {
    warnings.push({
      section: 'chiefComplaint',
      field: 'text',
      message: `Chief complaint should be 1-2 sentences (found ${sentenceCount})`,
      code: 'CHIEF_COMPLAINT_TOO_LONG',
    })
  }
}

/**
 * R-CN-04: HPI should have structured fields
 */
function validateHPI(
  content: ConsultNoteContent,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!content.hpi) {
    return // Already caught by section presence check
  }

  const fieldCount = Object.keys(content.hpi).filter((key) => content.hpi[key as keyof typeof content.hpi]).length

  if (fieldCount === 0) {
    warnings.push({
      section: 'hpi',
      message: 'HPI has no structured data',
      code: 'HPI_EMPTY',
    })
  }
}

/**
 * R-CN-05: Red flags screening must indicate if performed
 */
function validateRedFlags(
  content: ConsultNoteContent,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!content.redFlagsScreening) {
    return // Already caught by section presence check
  }

  if (content.redFlagsScreening.screened === undefined) {
    errors.push({
      section: 'redFlagsScreening',
      field: 'screened',
      message: 'Red flags screening status must be specified',
      code: 'MISSING_RED_FLAGS_SCREENED',
    })
  }

  if (content.redFlagsScreening.screened && !content.redFlagsScreening.positive?.length && !content.redFlagsScreening.negative) {
    warnings.push({
      section: 'redFlagsScreening',
      message: 'Red flags screening was performed but no results documented',
      code: 'RED_FLAGS_NO_RESULTS',
    })
  }
}

/**
 * R-CN-06: Problem list must have 3-7 items
 */
function validateProblemList(
  content: ConsultNoteContent,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!content.problemList?.problems) {
    errors.push({
      section: 'problemList',
      field: 'problems',
      message: 'Problem list is required',
      code: 'MISSING_PROBLEM_LIST',
    })
    return
  }

  const count = content.problemList.problems.length

  if (count < MIN_PROBLEM_LIST_ITEMS) {
    warnings.push({
      section: 'problemList',
      field: 'problems',
      message: `Problem list should have ${MIN_PROBLEM_LIST_ITEMS}-${MAX_PROBLEM_LIST_ITEMS} items (found ${count})`,
      code: 'PROBLEM_LIST_TOO_SHORT',
    })
  }

  if (count > MAX_PROBLEM_LIST_ITEMS) {
    warnings.push({
      section: 'problemList',
      field: 'problems',
      message: `Problem list should have ${MIN_PROBLEM_LIST_ITEMS}-${MAX_PROBLEM_LIST_ITEMS} items (found ${count})`,
      code: 'PROBLEM_LIST_TOO_LONG',
    })
  }
}

/**
 * R-CN-07: Preliminary assessment must not make definitive diagnoses
 */
function validatePreliminaryAssessment(
  content: ConsultNoteContent,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!content.preliminaryAssessment?.hypotheses) {
    errors.push({
      section: 'preliminaryAssessment',
      field: 'hypotheses',
      message: 'Preliminary assessment hypotheses are required',
      code: 'MISSING_PRELIMINARY_ASSESSMENT',
    })
    return
  }

  if (content.preliminaryAssessment.hypotheses.length === 0) {
    warnings.push({
      section: 'preliminaryAssessment',
      field: 'hypotheses',
      message: 'Preliminary assessment has no hypotheses',
      code: 'PRELIMINARY_ASSESSMENT_EMPTY',
    })
  }
}

/**
 * R-CN-08: Handoff summary max 10 lines (STRICT)
 */
function validateHandoffSummary(
  content: ConsultNoteContent,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!content.handoffSummary?.summary) {
    errors.push({
      section: 'handoffSummary',
      field: 'summary',
      message: 'Handoff summary is required',
      code: 'MISSING_HANDOFF_SUMMARY',
    })
    return
  }

  const lineCount = content.handoffSummary.summary.length

  if (lineCount > MAX_HANDOFF_LINES) {
    errors.push({
      section: 'handoffSummary',
      field: 'summary',
      message: `Handoff summary must not exceed ${MAX_HANDOFF_LINES} lines (found ${lineCount})`,
      code: 'HANDOFF_TOO_LONG',
    })
  }

  if (lineCount === 0) {
    errors.push({
      section: 'handoffSummary',
      field: 'summary',
      message: 'Handoff summary cannot be empty',
      code: 'HANDOFF_EMPTY',
    })
  }
}

/**
 * R-CN-09: NO diagnosis language allowed (STRICT)
 */
function validateNoDiagnosisLanguage(content: ConsultNoteContent, errors: ValidationError[]): void {
  // Collect all text fields from content
  const textFields = collectAllTextFields(content)

  for (const { section, field, text } of textFields) {
    const lowerText = text.toLowerCase()

    for (const forbiddenWord of DIAGNOSIS_FORBIDDEN_WORDS) {
      if (lowerText.includes(forbiddenWord.toLowerCase())) {
        errors.push({
          section,
          field,
          message: `Forbidden diagnosis language detected: "${forbiddenWord}"`,
          code: 'DIAGNOSIS_LANGUAGE_DETECTED',
        })
      }
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Collects all text fields from consult note content for validation
 */
function collectAllTextFields(
  content: ConsultNoteContent
): Array<{ section: string; field?: string; text: string }> {
  const fields: Array<{ section: string; field?: string; text: string }> = []

  // Chief complaint
  if (content.chiefComplaint?.text) {
    fields.push({ section: 'chiefComplaint', field: 'text', text: content.chiefComplaint.text })
  }

  // HPI
  if (content.hpi) {
    Object.entries(content.hpi).forEach(([key, value]) => {
      if (typeof value === 'string') {
        fields.push({ section: 'hpi', field: key, text: value })
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'string') {
            fields.push({ section: 'hpi', field: key, text: item })
          }
        })
      }
    })
  }

  // Problem list
  if (content.problemList?.problems) {
    content.problemList.problems.forEach((problem, index) => {
      fields.push({ section: 'problemList', field: `problems[${index}]`, text: problem })
    })
  }

  // Preliminary assessment
  if (content.preliminaryAssessment?.hypotheses) {
    content.preliminaryAssessment.hypotheses.forEach((hypothesis, index) => {
      fields.push({ section: 'preliminaryAssessment', field: `hypotheses[${index}]`, text: hypothesis })
    })
  }

  if (content.preliminaryAssessment?.uncertaintyNote) {
    fields.push({
      section: 'preliminaryAssessment',
      field: 'uncertaintyNote',
      text: content.preliminaryAssessment.uncertaintyNote,
    })
  }

  // Handoff summary
  if (content.handoffSummary?.summary) {
    content.handoffSummary.summary.forEach((line, index) => {
      fields.push({ section: 'handoffSummary', field: `summary[${index}]`, text: line })
    })
  }

  return fields
}

/**
 * Quick check if handoff summary is within limits
 */
export function isHandoffSummaryValid(summary: string[]): boolean {
  return summary.length > 0 && summary.length <= MAX_HANDOFF_LINES
}

/**
 * Quick check if problem list is within recommended range
 */
export function isProblemListValid(problems: string[]): boolean {
  return problems.length >= MIN_PROBLEM_LIST_ITEMS && problems.length <= MAX_PROBLEM_LIST_ITEMS
}

/**
 * Count validation errors by severity
 */
export function countValidationIssues(validation: ConsultNoteValidation): {
  errors: number
  warnings: number
} {
  return {
    errors: validation.errors.length,
    warnings: validation.warnings.length,
  }
}
