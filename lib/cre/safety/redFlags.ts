/**
 * CRE Phase 2: Safety Red Flags & Escalation Matrix (rules-only)
 */

import {
  CLINICAL_RED_FLAG,
  detectClinicalRedFlags,
  type ClinicalRedFlag,
} from '@/lib/triage/redFlagCatalog'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'
import { evaluateSafetyRules } from '@/lib/cre/safety/rules/evaluate'

export type EscalationLevel = 'A' | 'B' | 'C'

export type RedFlagFinding = {
  id: string
  rule_id: string
  policy_version: string
  domain: string
  trigger: string
  level: EscalationLevel
  rationale: string
  evidence_message_ids?: string[]
}

export type ChatAction = 'none' | 'warn' | 'require_confirm' | 'hard_stop'

export type SafetyEvaluation = {
  red_flag_present: boolean
  escalation_level: EscalationLevel | null
  red_flags: RedFlagFinding[]
  triggered_rules?: Array<{
    rule_id: string
    severity: EscalationLevel
    rationale: string
    evidence_message_ids?: string[]
    policy_version: string
  }>
  policy_result?: {
    policy_version: string
    escalation_level: EscalationLevel | null
    chat_action: ChatAction
    studio_badge: string
    patient_banner_text: string
  }
  override?: {
    level_override?: EscalationLevel | null
    chat_action_override?: ChatAction | null
    reason: string
    by_user_id: string
    at: string
  } | null
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

type RuleMeta = {
  id: string
  rule_id: string
  domain: string
  level: EscalationLevel
  rationale: string
}

const SAFETY_POLICY_VERSION = '2.1'

const RULES: Record<ClinicalRedFlag, RuleMeta> = {
  [CLINICAL_RED_FLAG.CHEST_PAIN]: {
    id: 'CHEST_PAIN',
    rule_id: 'SFTY-2.1-R-CHEST-PAIN',
    domain: 'cardio',
    level: 'B',
    rationale: 'Brustschmerz erfordert eine priorisierte Abklaerung.',
  },
  [CLINICAL_RED_FLAG.SYNCOPE]: {
    id: 'SYNCOPE',
    rule_id: 'SFTY-2.1-R-SYNCOPE',
    domain: 'cardio',
    level: 'B',
    rationale: 'Synkope oder Bewusstseinsverlust erfordert eine dringende Abklaerung.',
  },
  [CLINICAL_RED_FLAG.SEVERE_DYSPNEA]: {
    id: 'SEVERE_DYSPNEA',
    rule_id: 'SFTY-2.1-R-SEVERE-DYSPNEA',
    domain: 'respiratory',
    level: 'A',
    rationale: 'Schwere Atemnot erfordert sofortige medizinische Abklaerung.',
  },
  [CLINICAL_RED_FLAG.SUICIDAL_IDEATION]: {
    id: 'SUICIDAL_IDEATION',
    rule_id: 'SFTY-2.1-R-SUICIDAL-IDEATION',
    domain: 'mental-health',
    level: 'A',
    rationale: 'Suizidale Gedanken erfordern sofortige Hilfe und Unterbrechung des digitalen Prozesses.',
  },
  [CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS]: {
    id: 'ACUTE_PSYCHIATRIC_CRISIS',
    rule_id: 'SFTY-2.1-R-ACUTE-PSYCH',
    domain: 'mental-health',
    level: 'B',
    rationale: 'Akute psychische Krise erfordert priorisierte aerztliche Ruecksprache.',
  },
  [CLINICAL_RED_FLAG.SEVERE_PALPITATIONS]: {
    id: 'SEVERE_PALPITATIONS',
    rule_id: 'SFTY-2.1-R-SEVERE-PALPITATIONS',
    domain: 'cardio',
    level: 'B',
    rationale: 'Ausgepraegte Palpitationen erfordern priorisierte Abklaerung.',
  },
  [CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL]: {
    id: 'ACUTE_NEUROLOGICAL',
    rule_id: 'SFTY-2.1-R-ACUTE-NEURO',
    domain: 'neurology',
    level: 'A',
    rationale: 'Akute neurologische Ausfaelle erfordern sofortige Abklaerung.',
  },
  [CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS]: {
    id: 'SEVERE_UNCONTROLLED_SYMPTOMS',
    rule_id: 'SFTY-2.1-R-SEVERE-UNCONTROLLED',
    domain: 'general',
    level: 'A',
    rationale: 'Schwere unkontrollierbare Symptome erfordern eine sofortige Abklaerung.',
  },
}

const SAFETY_QUESTIONS_LEVEL_C = [
  'Haben Sie aktuell Brustschmerzen oder Druck in der Brust?',
  'Gab es Ohnmacht, starke Benommenheit oder Bewusstseinsverlust?',
  'Haben Sie Gedanken, sich selbst etwas anzutun?',
]

const CONTRADICTION_PATTERNS: Record<string, string[]> = {
  CHEST_PAIN: ['kein brustschmerz', 'keine brustschmerzen', 'no chest pain'],
  SYNCOPE: ['keine ohnmacht', 'keine synkope', 'no syncope', 'no fainting'],
  SEVERE_DYSPNEA: ['keine atemnot', 'keine luftnot', 'no shortness of breath'],
  SEVERE_PALPITATIONS: ['kein herzrasen', 'keine palpitationen', 'no palpitations'],
  SUICIDAL_IDEATION: ['kein suizid', 'keine suizidgedanken', 'no suicidal'],
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

const escalateLevel = (current: EscalationLevel | null, next: EscalationLevel): EscalationLevel => {
  if (!current) return next
  if (current === 'A' || next === 'A') return 'A'
  if (current === 'B' || next === 'B') return 'B'
  return 'C'
}

export function evaluateRedFlags(params: {
  structuredData: StructuredIntakeData
  evidenceText?: string
  evidenceMessageIds?: string[]
}): SafetyEvaluation {
  const { structuredData, evidenceText, evidenceMessageIds } = params

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

  pushText((structuredData as { chief_complaint?: unknown }).chief_complaint)
  const hpi = (structuredData as { history_of_present_illness?: unknown }).history_of_present_illness
  if (hpi && typeof hpi === 'object') {
    const record = hpi as Record<string, unknown>
    pushText(record.onset)
    pushText(record.duration)
    pushText(record.course)
    pushArray(record.associated_symptoms)
    pushArray(record.relieving_factors)
    pushArray(record.aggravating_factors)
  }
  pushArray((structuredData as { relevant_negatives?: unknown }).relevant_negatives)
  pushArray((structuredData as { past_medical_history?: unknown }).past_medical_history)
  pushArray((structuredData as { medication?: unknown }).medication)
  pushArray((structuredData as { psychosocial_factors?: unknown }).psychosocial_factors)
  pushArray((structuredData as { uncertainties?: unknown }).uncertainties)
  if (evidenceText) pushText(evidenceText)

  const normalizedText = normalizeText(textParts.join(' '))
  const detected = detectClinicalRedFlags(normalizedText)

  const findings: RedFlagFinding[] = []
  let escalation: EscalationLevel | null = null

  detected.forEach((flag) => {
    const rule = RULES[flag]
    if (!rule) return
    findings.push({
      id: rule.id,
      rule_id: rule.rule_id,
      policy_version: SAFETY_POLICY_VERSION,
      domain: rule.domain,
      trigger: flag,
      level: rule.level,
      rationale: rule.rationale,
      evidence_message_ids: evidenceMessageIds,
    })
    escalation = escalateLevel(escalation, rule.level)
  })

  const durationText = (hpi && typeof hpi === 'object')
    ? (hpi as Record<string, unknown>).duration
    : undefined
  const durationMinutes = extractDurationMinutes(typeof durationText === 'string' ? durationText : undefined)

  if (detected.includes(CLINICAL_RED_FLAG.CHEST_PAIN) && durationMinutes !== null && durationMinutes >= 20) {
    findings.push({
      id: 'CHEST_PAIN_PROLONGED',
      rule_id: 'SFTY-2.1-R-CHEST-PAIN-20M',
      policy_version: SAFETY_POLICY_VERSION,
      domain: 'cardio',
      trigger: 'CHEST_PAIN_DURATION',
      level: 'A',
      rationale: 'Brustschmerz seit >= 20 Minuten erfordert sofortige Abklaerung.',
      evidence_message_ids: evidenceMessageIds,
    })
    escalation = escalateLevel(escalation, 'A')
  }

  const uncertainties = (structuredData as { uncertainties?: unknown }).uncertainties
  if (Array.isArray(uncertainties) && uncertainties.length >= 2 && escalation === null) {
    findings.push({
      id: 'UNCERTAINTY_HIGH',
      rule_id: 'SFTY-2.1-R-UNCERTAINTY-2PLUS',
      policy_version: SAFETY_POLICY_VERSION,
      domain: 'safety',
      trigger: 'UNCERTAINTY',
      level: 'C',
      rationale: 'Mehrere Unsicherheiten erfordern gezielte Sicherheitsfragen.',
      evidence_message_ids: evidenceMessageIds,
    })
    escalation = 'C'
  }

  const relevantNegatives = (structuredData as { relevant_negatives?: unknown }).relevant_negatives
  const contradictions = Array.isArray(relevantNegatives)
    ? relevantNegatives.some((entry) => {
        if (typeof entry !== 'string') return false
        const normalized = normalizeText(entry)
        return findings.some((flag) =>
          CONTRADICTION_PATTERNS[flag.id]?.some((pattern) => normalized.includes(pattern))
        )
      })
    : false

  if (contradictions && escalation !== 'A') {
    escalation = 'B'
  }

  const redFlagPresent = findings.some((flag) => flag.level === 'A' || flag.level === 'B')
  const ruleEvaluation = evaluateSafetyRules({ structuredData, evidenceText })

  return {
    red_flag_present: redFlagPresent,
    escalation_level: escalation,
    red_flags: findings,
    rule_ids: ruleEvaluation.ruleIds,
    check_ids: ruleEvaluation.checkIds,
    contradictions_present: contradictions || undefined,
    safety_questions: escalation === 'C' ? SAFETY_QUESTIONS_LEVEL_C : undefined,
    quality: {
      confidence: Array.isArray(uncertainties) && uncertainties.length > 0 ? 'low' : 'medium',
    },
  }
}

export function formatSafetySummaryLine(result: SafetyEvaluation): string {
  const policyLevel = result.policy_result?.escalation_level ?? result.escalation_level
  const policyAction = result.policy_result?.chat_action
  if (!policyLevel) {
    return 'Safety: keine Red Flags.'
  }

  const labels = (result.triggered_rules ?? result.red_flags)
    .map((flag: { rule_id?: string; id?: string }) => flag.rule_id || flag.id)
    .filter(Boolean)
    .join(', ')
  const actionHint = policyAction ? ` Action ${policyAction}.` : ''
  const base = `Safety: Level ${policyLevel}${labels ? ` (${labels})` : ''}.${actionHint}`

  if (policyLevel === 'C' && result.safety_questions && result.safety_questions.length > 0) {
    return `${base} Offene Sicherheitsfragen: ${result.safety_questions.join(' ')}`
  }

  return base
}
