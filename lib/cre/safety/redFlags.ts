/**
 * CRE Phase 2: Safety Red Flags & Escalation Matrix (rules-only)
 */

import {
  CLINICAL_RED_FLAG,
  detectClinicalRedFlags,
  type ClinicalRedFlag,
} from '@/lib/triage/redFlagCatalog'

export type EscalationLevel = 'A' | 'B' | 'C'

export type RedFlagFinding = {
  id: string
  domain: string
  trigger: string
  level: EscalationLevel
  rationale: string
  evidence_refs?: string[]
}

export type SafetyEvaluation = {
  red_flag_present: boolean
  escalation_level: EscalationLevel | null
  red_flags: RedFlagFinding[]
  contradictions_present?: boolean
  safety_questions?: string[]
  quality?: {
    confidence?: 'low' | 'medium' | 'high'
    notes?: string[]
  }
}

type RuleMeta = {
  id: string
  domain: string
  level: EscalationLevel
  rationale: string
}

const RULES: Record<ClinicalRedFlag, RuleMeta> = {
  [CLINICAL_RED_FLAG.CHEST_PAIN]: {
    id: 'CHEST_PAIN',
    domain: 'cardio',
    level: 'B',
    rationale: 'Brustschmerz erfordert eine priorisierte Abklaerung.',
  },
  [CLINICAL_RED_FLAG.SYNCOPE]: {
    id: 'SYNCOPE',
    domain: 'cardio',
    level: 'B',
    rationale: 'Synkope oder Bewusstseinsverlust erfordert eine dringende Abklaerung.',
  },
  [CLINICAL_RED_FLAG.SEVERE_DYSPNEA]: {
    id: 'SEVERE_DYSPNEA',
    domain: 'respiratory',
    level: 'A',
    rationale: 'Schwere Atemnot erfordert sofortige medizinische Abklaerung.',
  },
  [CLINICAL_RED_FLAG.SUICIDAL_IDEATION]: {
    id: 'SUICIDAL_IDEATION',
    domain: 'mental-health',
    level: 'A',
    rationale: 'Suizidale Gedanken erfordern sofortige Hilfe und Unterbrechung des digitalen Prozesses.',
  },
  [CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS]: {
    id: 'ACUTE_PSYCHIATRIC_CRISIS',
    domain: 'mental-health',
    level: 'B',
    rationale: 'Akute psychische Krise erfordert priorisierte aerztliche Ruecksprache.',
  },
  [CLINICAL_RED_FLAG.SEVERE_PALPITATIONS]: {
    id: 'SEVERE_PALPITATIONS',
    domain: 'cardio',
    level: 'B',
    rationale: 'Ausgepraegte Palpitationen erfordern priorisierte Abklaerung.',
  },
  [CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL]: {
    id: 'ACUTE_NEUROLOGICAL',
    domain: 'neurology',
    level: 'A',
    rationale: 'Akute neurologische Ausfaelle erfordern sofortige Abklaerung.',
  },
  [CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS]: {
    id: 'SEVERE_UNCONTROLLED_SYMPTOMS',
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
  structuredData: Record<string, unknown>
  evidenceText?: string
  evidenceRefs?: string[]
}): SafetyEvaluation {
  const { structuredData, evidenceText, evidenceRefs } = params

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
      domain: rule.domain,
      trigger: flag,
      level: rule.level,
      rationale: rule.rationale,
      evidence_refs: evidenceRefs,
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
      domain: 'cardio',
      trigger: 'CHEST_PAIN_DURATION',
      level: 'A',
      rationale: 'Brustschmerz seit >= 20 Minuten erfordert sofortige Abklaerung.',
      evidence_refs: evidenceRefs,
    })
    escalation = escalateLevel(escalation, 'A')
  }

  const uncertainties = (structuredData as { uncertainties?: unknown }).uncertainties
  if (Array.isArray(uncertainties) && uncertainties.length >= 2 && escalation === null) {
    findings.push({
      id: 'UNCERTAINTY_HIGH',
      domain: 'safety',
      trigger: 'UNCERTAINTY',
      level: 'C',
      rationale: 'Mehrere Unsicherheiten erfordern gezielte Sicherheitsfragen.',
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

  return {
    red_flag_present: redFlagPresent,
    escalation_level: escalation,
    red_flags: findings,
    contradictions_present: contradictions || undefined,
    safety_questions: escalation === 'C' ? SAFETY_QUESTIONS_LEVEL_C : undefined,
    quality: {
      confidence: Array.isArray(uncertainties) && uncertainties.length > 0 ? 'low' : 'medium',
    },
  }
}

export function formatSafetySummaryLine(result: SafetyEvaluation): string {
  if (!result.escalation_level) {
    return 'Red Flags: keine.'
  }

  const level = result.escalation_level
  const labels = result.red_flags.map((flag) => flag.id).join(', ')
  const base = `Red Flags: Level ${level}${labels ? ` (${labels})` : ''}.`

  if (level === 'C' && result.safety_questions && result.safety_questions.length > 0) {
    return `${base} Offene Sicherheitsfragen: ${result.safety_questions.join(' ')}`
  }

  return base
}
