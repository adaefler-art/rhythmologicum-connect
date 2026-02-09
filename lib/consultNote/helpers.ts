/**
 * Issue 5: Consult Note v1 Helper Functions
 * 
 * Utilities for generating, rendering, and managing consult notes
 */

import type {
  ConsultNoteContent,
  ConsultNote,
  CreateConsultNotePayload,
  ConsultationType,
  UncertaintyProfile,
  AssertivenessLevel,
  AudienceType,
} from '@/lib/types/consultNote'

// ============================================================================
// MARKDOWN RENDERING
// ============================================================================

/**
 * Renders consult note content as Markdown for display
 */
export function renderConsultNoteMarkdown(content: ConsultNoteContent): string {
  const sections: string[] = []

  // Section 1: Header
  sections.push('# Consult Note')
  sections.push('')
  sections.push(`**Timestamp:** ${content.header.timestamp}`)
  sections.push(`**Consultation Type:** ${formatConsultationType(content.header.consultationType)}`)
  sections.push(`**Source:** ${content.header.source}`)
  if (content.header.guidelineVersion) {
    sections.push(`**Guideline Version:** ${content.header.guidelineVersion}`)
  }
  sections.push(
    `**Uncertainty Profile:** ${formatUncertaintyProfile(content.header.uncertaintyProfile)} | **Assertiveness:** ${formatAssertiveness(content.header.assertiveness)} | **Audience:** ${formatAudience(content.header.audience)}`
  )
  sections.push('')

  // Section 2: Chief Complaint
  sections.push('## Chief Complaint')
  sections.push(content.chiefComplaint.text)
  sections.push('')

  // Section 3: History of Present Illness
  sections.push('## History of Present Illness')
  if (content.hpi.onset) sections.push(`- **Onset:** ${content.hpi.onset}`)
  if (content.hpi.course) sections.push(`- **Course:** ${content.hpi.course}`)
  if (content.hpi.character) sections.push(`- **Character:** ${content.hpi.character}`)
  if (content.hpi.severity) sections.push(`- **Severity:** ${content.hpi.severity}`)
  if (content.hpi.triggers) sections.push(`- **Triggers:** ${content.hpi.triggers}`)
  if (content.hpi.relief) sections.push(`- **Relief:** ${content.hpi.relief}`)
  if (content.hpi.associatedSymptoms?.length) {
    sections.push(`- **Associated Symptoms:** ${content.hpi.associatedSymptoms.join(', ')}`)
  }
  if (content.hpi.functionalImpact) sections.push(`- **Functional Impact:** ${content.hpi.functionalImpact}`)
  if (content.hpi.priorActions) sections.push(`- **Prior Actions:** ${content.hpi.priorActions}`)
  sections.push('')

  // Section 4: Red Flags Screening
  sections.push('## Red Flags Screening')
  sections.push(`**Screened:** ${content.redFlagsScreening.screened ? 'Yes' : 'No'}`)
  if (content.redFlagsScreening.positive?.length) {
    sections.push('**Positive:**')
    content.redFlagsScreening.positive.forEach((flag) => {
      sections.push(`- ${flag}`)
    })
  }
  if (content.redFlagsScreening.negative) {
    sections.push(`**Negative:** ${content.redFlagsScreening.negative}`)
  }
  sections.push('')

  // Section 5: Relevant Medical History / Risks
  sections.push('## Relevant Medical History / Risks')
  if (content.medicalHistory.relevantConditions?.length) {
    sections.push('**Relevant Conditions:**')
    content.medicalHistory.relevantConditions.forEach((condition) => {
      sections.push(`- ${condition}`)
    })
  }
  if (content.medicalHistory.riskFactors?.length) {
    sections.push('**Risk Factors:**')
    content.medicalHistory.riskFactors.forEach((factor) => {
      sections.push(`- ${factor}`)
    })
  }
  if (content.medicalHistory.familySocialFactors?.length) {
    sections.push('**Family/Social Factors:**')
    content.medicalHistory.familySocialFactors.forEach((factor) => {
      sections.push(`- ${factor}`)
    })
  }
  if (
    !content.medicalHistory.relevantConditions?.length &&
    !content.medicalHistory.riskFactors?.length &&
    !content.medicalHistory.familySocialFactors?.length
  ) {
    sections.push('No significant medical history reported.')
  }
  sections.push('')

  // Section 6: Medications / Allergies
  sections.push('## Medications / Allergies')
  if (content.medications.medications?.length) {
    sections.push('**Medications:**')
    content.medications.medications.forEach((med) => {
      sections.push(`- ${med}`)
    })
  }
  if (content.medications.allergies?.length) {
    sections.push('**Allergies:**')
    content.medications.allergies.forEach((allergy) => {
      sections.push(`- ${allergy}`)
    })
  }
  if (!content.medications.medications?.length && !content.medications.allergies?.length) {
    sections.push('None reported.')
  }
  sections.push('')

  // Section 7: Objective Data
  sections.push('## Objective Data')
  if (content.objectiveData.values && Object.keys(content.objectiveData.values).length > 0) {
    Object.entries(content.objectiveData.values).forEach(([key, value]) => {
      sections.push(`- **${key}:** ${value}`)
    })
  } else {
    sections.push(content.objectiveData.note || 'No objective data reported.')
  }
  sections.push('')

  // Section 8: Problem List
  sections.push('## Problem List')
  content.problemList.problems.forEach((problem, index) => {
    sections.push(`${index + 1}. ${problem}`)
  })
  sections.push('')

  // Section 9: Preliminary Assessment
  sections.push('## Preliminary Assessment')
  content.preliminaryAssessment.hypotheses.forEach((hypothesis, index) => {
    sections.push(`${index + 1}. ${hypothesis}`)
  })
  if (content.preliminaryAssessment.uncertaintyNote) {
    sections.push('')
    sections.push(`*${content.preliminaryAssessment.uncertaintyNote}*`)
  }
  sections.push('')

  // Section 10: Missing Data / Next Data Requests
  sections.push('## Missing Data / Next Data Requests')
  if (content.missingData.high?.length) {
    sections.push('**High Priority:**')
    content.missingData.high.forEach((item) => {
      sections.push(`- ${item}`)
    })
  }
  if (content.missingData.medium?.length) {
    sections.push('**Medium Priority:**')
    content.missingData.medium.forEach((item) => {
      sections.push(`- ${item}`)
    })
  }
  if (content.missingData.optional?.length) {
    sections.push('**Optional:**')
    content.missingData.optional.forEach((item) => {
      sections.push(`- ${item}`)
    })
  }
  if (!content.missingData.high?.length && !content.missingData.medium?.length && !content.missingData.optional?.length) {
    sections.push('All essential data collected.')
  }
  sections.push('')

  // Section 11: Next Steps
  sections.push('## Next Steps')
  if (content.nextSteps.patientLevel?.length) {
    sections.push('**Patient Level:**')
    content.nextSteps.patientLevel.forEach((step) => {
      sections.push(`- ${step}`)
    })
  }
  if (content.nextSteps.clinicianLevel?.length) {
    sections.push('**Clinician Level:**')
    content.nextSteps.clinicianLevel.forEach((step) => {
      sections.push(`- ${step}`)
    })
  }
  sections.push('')

  // Section 12: Handoff Summary
  sections.push('## Handoff Summary')
  content.handoffSummary.summary.forEach((line) => {
    sections.push(line)
  })

  return sections.join('\n')
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function formatConsultationType(type: ConsultationType): string {
  return type === 'first' ? 'First Consultation' : 'Follow-up'
}

function formatUncertaintyProfile(profile: UncertaintyProfile): string {
  const map: Record<UncertaintyProfile, string> = {
    off: 'Off',
    qualitative: 'Qualitative',
    mixed: 'Mixed',
  }
  return map[profile]
}

function formatAssertiveness(level: AssertivenessLevel): string {
  const map: Record<AssertivenessLevel, string> = {
    conservative: 'Conservative',
    balanced: 'Balanced',
    direct: 'Direct',
  }
  return map[level]
}

function formatAudience(audience: AudienceType): string {
  return audience === 'patient' ? 'Patient' : 'Clinician'
}

// ============================================================================
// TIMESTAMP HELPERS
// ============================================================================

/**
 * Formats current timestamp in ISO 8601 for consult note header
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Formats timestamp for human-readable display
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================================
// PAYLOAD BUILDERS
// ============================================================================

/**
 * Creates a consult note payload with defaults
 */
export function createConsultNotePayload(
  patientId: string,
  organizationId: string,
  content: ConsultNoteContent,
  options?: {
    chatSessionId?: string
    consultationType?: ConsultationType
    guidelineVersion?: string
    uncertaintyProfile?: UncertaintyProfile
    assertiveness?: AssertivenessLevel
    audience?: AudienceType
  }
): CreateConsultNotePayload {
  const renderedMarkdown = renderConsultNoteMarkdown(content)

  return {
    patient_id: patientId,
    organization_id: organizationId,
    chat_session_id: options?.chatSessionId || null,
    consultation_type: options?.consultationType || 'first',
    source: 'Patient self-report via PAT',
    guideline_version: options?.guidelineVersion || null,
    uncertainty_profile: options?.uncertaintyProfile || 'qualitative',
    assertiveness: options?.assertiveness || 'conservative',
    audience: options?.audience || 'patient',
    content,
    rendered_markdown: renderedMarkdown,
    metadata: {
      created_via: 'consult_note_generator',
      prompt_version: 'v1',
      generated_at: getCurrentTimestamp(),
    },
  }
}

// ============================================================================
// SECTION HELPERS
// ============================================================================

/**
 * Creates empty/default consult note content structure
 */
export function createEmptyConsultNoteContent(
  uncertaintyProfile: UncertaintyProfile = 'qualitative',
  assertiveness: AssertivenessLevel = 'conservative',
  audience: AudienceType = 'patient'
): ConsultNoteContent {
  return {
    header: {
      timestamp: getCurrentTimestamp(),
      consultationType: 'first',
      source: 'Patient self-report via PAT',
      uncertaintyProfile,
      assertiveness,
      audience,
    },
    chiefComplaint: {
      text: '',
    },
    hpi: {},
    redFlagsScreening: {
      screened: false,
      positive: [],
    },
    medicalHistory: {},
    medications: {},
    objectiveData: {
      note: 'No objective data reported',
    },
    problemList: {
      problems: [],
    },
    preliminaryAssessment: {
      hypotheses: [],
    },
    missingData: {},
    nextSteps: {},
    handoffSummary: {
      summary: [],
    },
  }
}

/**
 * Counts number of sections with content
 */
export function countPopulatedSections(content: ConsultNoteContent): number {
  let count = 0

  if (content.chiefComplaint.text) count++
  if (Object.keys(content.hpi).length > 0) count++
  if (content.redFlagsScreening.screened) count++
  if (
    content.medicalHistory.relevantConditions?.length ||
    content.medicalHistory.riskFactors?.length ||
    content.medicalHistory.familySocialFactors?.length
  )
    count++
  if (content.medications.medications?.length || content.medications.allergies?.length) count++
  if (content.objectiveData.values || content.objectiveData.note) count++
  if (content.problemList.problems.length > 0) count++
  if (content.preliminaryAssessment.hypotheses.length > 0) count++
  if (
    content.missingData.high?.length ||
    content.missingData.medium?.length ||
    content.missingData.optional?.length
  )
    count++
  if (content.nextSteps.patientLevel?.length || content.nextSteps.clinicianLevel?.length) count++
  if (content.handoffSummary.summary.length > 0) count++

  return count
}
