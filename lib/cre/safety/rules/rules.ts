import {
  CLINICAL_RED_FLAG,
  detectClinicalRedFlags,
  type ClinicalRedFlag,
} from '@/lib/triage/redFlagCatalog'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

export type SafetyRuleSeverity = 'A' | 'B' | 'C'

export type SafetyRuleContext = {
  structuredData: StructuredIntakeData
  evidenceText: string
  detectedFlags: Set<ClinicalRedFlag>
  durationMinutes: number | null
}

export type SafetyRuleDefinition = {
  id: string
  description: string
  severity: SafetyRuleSeverity
  predicate: (context: SafetyRuleContext) => boolean
}

const normalizeText = (value: string) => value.toLowerCase().trim()

const extractDurationMinutes = (value: string | undefined) => {
  if (!value) return null
  const normalized = normalizeText(value)
  const minuteMatch = normalized.match(/(\d{1,3})\s*(min|minute|minuten)/)
  if (minuteMatch) return Number(minuteMatch[1])
  const hourMatch = normalized.match(/(\d{1,2})\s*(h|stunde|stunden|hour|hours)/)
  if (hourMatch) return Number(hourMatch[1]) * 60
  if (normalized.includes('halb') && normalized.includes('stunde')) return 30
  return null
}

const buildEvidenceText = (
  structuredData: StructuredIntakeData,
  verbatimChatMessages?: Array<{ id: string; content: string }>,
) => {
  const textParts: string[] = []

  const pushText = (value?: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      textParts.push(value.trim())
    }
  }

  const pushArray = (value?: unknown) => {
    if (!Array.isArray(value)) return
    value.forEach((entry) => pushText(entry))
  }

  pushText(structuredData.chief_complaint)

  if (structuredData.history_of_present_illness) {
    const record = structuredData.history_of_present_illness
    pushText(record.onset)
    pushText(record.duration)
    pushText(record.course)
    pushArray(record.associated_symptoms)
    pushArray(record.relieving_factors)
    pushArray(record.aggravating_factors)
  }

  pushArray(structuredData.relevant_negatives)
  pushArray(structuredData.past_medical_history)
  pushArray(structuredData.medication)
  pushArray(structuredData.psychosocial_factors)
  pushArray(structuredData.uncertainties)

  verbatimChatMessages?.forEach((message) => {
    if (typeof message.content === 'string' && message.content.trim()) {
      textParts.push(message.content.trim())
    }
  })

  return normalizeText(textParts.join(' '))
}

export const buildSafetyContext = (params: {
  structuredData: StructuredIntakeData
  verbatimChatMessages?: Array<{ id: string; content: string }>
}): SafetyRuleContext => {
  const { structuredData, verbatimChatMessages } = params
  const normalizedText = buildEvidenceText(structuredData, verbatimChatMessages)
  const detected = detectClinicalRedFlags(normalizedText)
  const durationMinutes = extractDurationMinutes(structuredData.history_of_present_illness?.duration)

  return {
    structuredData,
    evidenceText: normalizedText,
    detectedFlags: new Set(detected),
    durationMinutes,
  }
}

const buildRedFlagRule = (flag: ClinicalRedFlag, params: Omit<SafetyRuleDefinition, 'predicate'>) => ({
  ...params,
  predicate: (context: SafetyRuleContext) => context.detectedFlags.has(flag),
})

const RED_FLAG_RULES: SafetyRuleDefinition[] = [
  buildRedFlagRule(CLINICAL_RED_FLAG.CHEST_PAIN, {
    id: 'SFTY-2.1-R-CHEST-PAIN',
    description: 'Chest pain detected in patient narrative.',
    severity: 'B',
  }),
  buildRedFlagRule(CLINICAL_RED_FLAG.SYNCOPE, {
    id: 'SFTY-2.1-R-SYNCOPE',
    description: 'Syncope or loss of consciousness mentioned.',
    severity: 'B',
  }),
  buildRedFlagRule(CLINICAL_RED_FLAG.SEVERE_DYSPNEA, {
    id: 'SFTY-2.1-R-SEVERE-DYSPNEA',
    description: 'Severe dyspnea indicators detected.',
    severity: 'A',
  }),
  buildRedFlagRule(CLINICAL_RED_FLAG.SUICIDAL_IDEATION, {
    id: 'SFTY-2.1-R-SUICIDAL-IDEATION',
    description: 'Suicidal ideation detected.',
    severity: 'A',
  }),
  buildRedFlagRule(CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS, {
    id: 'SFTY-2.1-R-ACUTE-PSYCH',
    description: 'Acute psychiatric crisis indicators detected.',
    severity: 'B',
  }),
  buildRedFlagRule(CLINICAL_RED_FLAG.SEVERE_PALPITATIONS, {
    id: 'SFTY-2.1-R-SEVERE-PALPITATIONS',
    description: 'Severe palpitations detected.',
    severity: 'B',
  }),
  buildRedFlagRule(CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL, {
    id: 'SFTY-2.1-R-ACUTE-NEURO',
    description: 'Acute neurologic deficit indicators detected.',
    severity: 'A',
  }),
  buildRedFlagRule(CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS, {
    id: 'SFTY-2.1-R-SEVERE-UNCONTROLLED',
    description: 'Severe, uncontrolled symptoms detected.',
    severity: 'A',
  }),
]

const TIME_DYNAMICS_RULES: SafetyRuleDefinition[] = [
  {
    id: 'SFTY-2.1-R-CHEST-PAIN-20M',
    description: 'Chest pain duration >= 20 minutes.',
    severity: 'A',
    predicate: (context) =>
      context.detectedFlags.has(CLINICAL_RED_FLAG.CHEST_PAIN) &&
      context.durationMinutes !== null &&
      context.durationMinutes >= 20,
  },
]

const UNCERTAINTY_RULES: SafetyRuleDefinition[] = [
  {
    id: 'SFTY-2.1-R-UNCERTAINTY-2PLUS',
    description: 'Multiple uncertainties require safety follow-up.',
    severity: 'C',
    predicate: (context) => (context.structuredData.uncertainties?.length ?? 0) >= 2,
  },
]

export const SAFETY_RULES: SafetyRuleDefinition[] = [
  ...RED_FLAG_RULES,
  ...TIME_DYNAMICS_RULES,
  ...UNCERTAINTY_RULES,
]
