/**
 * CRE Phase 2: Safety Red Flags & Escalation Matrix (rules-only)
 */

import {
  CLINICAL_RED_FLAG,
  type ClinicalRedFlag,
} from '@/lib/triage/redFlagCatalog'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'
import { evaluateSafetyRules } from '@/lib/cre/safety/rules/evaluate'
import { RED_FLAG_PATTERNS } from '@/lib/triage/redFlagCatalog'
import type { RuleDefaults, RuleLogicConfig } from '@/lib/cre/safety/ruleConfig'

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
  title: string
}

type QualifierGroup = {
  id: string
  patterns: string[]
}

type RuleTuning = {
  requires_any_of?: QualifierGroup[]
  requires_all_of?: QualifierGroup[]
  exclusions?: string[]
  exclusion_mode?: 'always' | 'only_if_unqualified'
  a_level_requires_any_of?: QualifierGroup[]
}

type RuleOverrideConfig = {
  logic: RuleLogicConfig
  defaults?: RuleDefaults
}

export type SafetyRuleOverrides = Record<string, RuleOverrideConfig>

const SAFETY_POLICY_VERSION = '2.1'

const RULES: Record<ClinicalRedFlag, RuleMeta> = {
  [CLINICAL_RED_FLAG.CHEST_PAIN]: {
    id: 'CHEST_PAIN',
    rule_id: 'SFTY-2.1-R-CHEST-PAIN',
    domain: 'cardio',
    level: 'B',
    rationale: 'Brustschmerz erfordert eine priorisierte Abklaerung.',
    title: 'Brustschmerz',
  },
  [CLINICAL_RED_FLAG.SYNCOPE]: {
    id: 'SYNCOPE',
    rule_id: 'SFTY-2.1-R-SYNCOPE',
    domain: 'cardio',
    level: 'B',
    rationale: 'Synkope oder Bewusstseinsverlust erfordert eine dringende Abklaerung.',
    title: 'Synkope / Bewusstseinsverlust',
  },
  [CLINICAL_RED_FLAG.SEVERE_DYSPNEA]: {
    id: 'SEVERE_DYSPNEA',
    rule_id: 'SFTY-2.1-R-SEVERE-DYSPNEA',
    domain: 'respiratory',
    level: 'A',
    rationale: 'Schwere Atemnot erfordert sofortige medizinische Abklaerung.',
    title: 'Schwere Atemnot',
  },
  [CLINICAL_RED_FLAG.SUICIDAL_IDEATION]: {
    id: 'SUICIDAL_IDEATION',
    rule_id: 'SFTY-2.1-R-SUICIDAL-IDEATION',
    domain: 'mental-health',
    level: 'A',
    rationale: 'Suizidale Gedanken erfordern sofortige Hilfe und Unterbrechung des digitalen Prozesses.',
    title: 'Suizidale Gedanken',
  },
  [CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS]: {
    id: 'ACUTE_PSYCHIATRIC_CRISIS',
    rule_id: 'SFTY-2.1-R-ACUTE-PSYCH',
    domain: 'mental-health',
    level: 'B',
    rationale: 'Akute psychische Krise erfordert priorisierte aerztliche Ruecksprache.',
    title: 'Akute psychische Krise',
  },
  [CLINICAL_RED_FLAG.SEVERE_PALPITATIONS]: {
    id: 'SEVERE_PALPITATIONS',
    rule_id: 'SFTY-2.1-R-SEVERE-PALPITATIONS',
    domain: 'cardio',
    level: 'B',
    rationale: 'Ausgepraegte Palpitationen erfordern priorisierte Abklaerung.',
    title: 'Starkes Herzrasen',
  },
  [CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL]: {
    id: 'ACUTE_NEUROLOGICAL',
    rule_id: 'SFTY-2.1-R-ACUTE-NEURO',
    domain: 'neurology',
    level: 'A',
    rationale: 'Akute neurologische Ausfaelle erfordern sofortige Abklaerung.',
    title: 'Akute neurologische Ausfaelle',
  },
  [CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS]: {
    id: 'SEVERE_UNCONTROLLED_SYMPTOMS',
    rule_id: 'SFTY-2.1-R-SEVERE-UNCONTROLLED',
    domain: 'general',
    level: 'A',
    rationale: 'Schwere unkontrollierbare Symptome erfordern eine sofortige Abklaerung.',
    title: 'Schwere unkontrollierbare Symptome',
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

const CHEST_PAIN_QUALIFIERS: QualifierGroup[] = [
  { id: 'acute', patterns: ['akut'] },
  { id: 'sudden', patterns: ['plötzlich'] },
  { id: 'new', patterns: ['neu'] },
  { id: 'exertion', patterns: ['belastung'] },
  { id: 'exertion_alt', patterns: ['anstrengung'] },
  { id: 'exertion_stairs', patterns: ['treppe'] },
  { id: 'dyspnea', patterns: ['atemnot'] },
  { id: 'dyspnea_alt', patterns: ['luftnot'] },
  { id: 'syncope', patterns: ['ohnmacht'] },
  { id: 'syncope_alt', patterns: ['synkope'] },
  { id: 'radiation_arm', patterns: ['ausstrahl', 'arm'] },
  { id: 'radiation_jaw', patterns: ['ausstrahl', 'kiefer'] },
  { id: 'radiation_back', patterns: ['ausstrahl', 'rucken'] },
  { id: 'rest_pain', patterns: ['in ruhe'] },
]

const PALPITATIONS_QUALIFIERS: QualifierGroup[] = [
  { id: 'syncope', patterns: ['synkope'] },
  { id: 'syncope_alt', patterns: ['ohnmacht'] },
  { id: 'syncope_alt2', patterns: ['umgekippt'] },
  { id: 'chest_pain', patterns: ['brustschmerz'] },
  { id: 'dyspnea', patterns: ['atemnot'] },
  { id: 'dyspnea_alt', patterns: ['luftnot'] },
  { id: 'persistent', patterns: ['anhaltend', 'stark'] },
  { id: 'persistent_alt', patterns: ['dauerhaft', 'stark'] },
]

const PALPITATIONS_EXCLUSIONS = ['panik', 'angst', 'nervos', 'stress', 'aufgeregt']

const SUICIDAL_A_QUALIFIERS: QualifierGroup[] = [
  { id: 'intent', patterns: ['ich will', 'umbringen'] },
  { id: 'intent_alt', patterns: ['ich will', 'sterben'] },
  { id: 'intent_alt2', patterns: ['ich bringe', 'um'] },
  { id: 'intent_alt3', patterns: ['ich werde', 'umbringen'] },
  { id: 'plan', patterns: ['plan', 'suizid'] },
  { id: 'prep', patterns: ['vorbereitung', 'suizid'] },
  { id: 'means', patterns: ['habe', 'tabletten'] },
  { id: 'means_alt', patterns: ['habe', 'pillen'] },
  { id: 'means_alt2', patterns: ['habe', 'messer'] },
]

const RULE_TUNING: Record<string, RuleTuning> = {
  'SFTY-2.1-R-CHEST-PAIN': {
    requires_any_of: CHEST_PAIN_QUALIFIERS,
    exclusions: CONTRADICTION_PATTERNS.CHEST_PAIN,
    exclusion_mode: 'always',
  },
  'SFTY-2.1-R-SEVERE-PALPITATIONS': {
    requires_any_of: PALPITATIONS_QUALIFIERS,
    exclusions: PALPITATIONS_EXCLUSIONS,
    exclusion_mode: 'only_if_unqualified',
  },
  'SFTY-2.1-R-SUICIDAL-IDEATION': {
    a_level_requires_any_of: SUICIDAL_A_QUALIFIERS,
  },
}

const normalizeText = (value: string) => value.toLowerCase().trim()

const clampExcerpt = (value: string, max = 220) =>
  value.length > max ? `${value.slice(0, max).trim()}…` : value

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

type SafetyEvidenceItem = {
  source: 'chat' | 'intake'
  source_id: string
  field_path?: string
}

export function verifyEvidence(
  item: SafetyEvidenceItem,
  context: {
    chatMap: Map<string, string>
    structuredData: StructuredIntakeData
    intakeId?: string
  },
): { ok: boolean; excerpt?: string } {
  if (item.source === 'chat') {
    const chatValue = context.chatMap.get(item.source_id)
    if (chatValue) {
      return { ok: true, excerpt: clampExcerpt(chatValue) }
    }
    return { ok: false }
  }

  if (!context.intakeId || context.intakeId !== item.source_id) {
    return { ok: false }
  }

  if (!item.field_path) {
    return { ok: false }
  }

  const fieldValue = getStructuredFieldValue(context.structuredData, item.field_path)
  if (typeof fieldValue === 'string' && fieldValue.trim()) {
    return { ok: true, excerpt: clampExcerpt(fieldValue.trim()) }
  }

  return { ok: false }
}

const getStructuredFieldValue = (structuredData: StructuredIntakeData, field: string): unknown => {
  if (field === 'chief_complaint') return structuredData.chief_complaint
  if (field === 'history_of_present_illness.onset') return structuredData.history_of_present_illness?.onset
  if (field === 'history_of_present_illness.duration') return structuredData.history_of_present_illness?.duration
  if (field === 'history_of_present_illness.course') return structuredData.history_of_present_illness?.course
  return undefined
}

const matchPatterns = (value: string, patterns: readonly string[]) =>
  patterns.some((pattern) => value.includes(pattern))

const dedupeEvidence = (items: Array<{ source: 'chat'; source_id: string; excerpt: string }>) => {
  const seen = new Set<string>()
  const result: Array<{ source: 'chat'; source_id: string; excerpt: string }> = []

  items.forEach((item) => {
    const key = `${item.source}:${item.source_id}`
    if (seen.has(key)) return
    seen.add(key)
    result.push(item)
  })

  return result
}

const evaluateRuleTuning = (params: {
  chatMap: Map<string, string>
  tuning?: RuleTuning
  buildEvidence: (messageId: string) => { ok: boolean; excerpt?: string }
}) => {
  const { chatMap, tuning, buildEvidence } = params
  if (!tuning) {
    return { qualified: true, aLevelQualified: true, evidence: [] as Array<{ source: 'chat'; source_id: string; excerpt: string }> }
  }

  const matchGroup = (content: string, group: QualifierGroup) =>
    group.patterns.every((pattern) => content.includes(pattern))

  const collectEvidenceForGroups = (groups: QualifierGroup[] | undefined) => {
    if (!groups || groups.length === 0) return { matched: false, evidence: [] as Array<{ source: 'chat'; source_id: string; excerpt: string }> }
    const evidence: Array<{ source: 'chat'; source_id: string; excerpt: string }> = []
    let matched = false

    chatMap.forEach((content, messageId) => {
      const normalized = normalizeText(content)
      groups.forEach((group) => {
        if (matchGroup(normalized, group)) {
          const verified = buildEvidence(messageId)
          if (verified.ok && verified.excerpt) {
            evidence.push({ source: 'chat', source_id: messageId, excerpt: verified.excerpt })
            matched = true
          }
        }
      })
    })

    return { matched, evidence: dedupeEvidence(evidence) }
  }

  const anyOf = collectEvidenceForGroups(tuning.requires_any_of)
  const allOfGroups = tuning.requires_all_of ?? []
  const allOf = allOfGroups.length > 0
    ? allOfGroups.every((group) => {
        let groupMatched = false
        chatMap.forEach((content, messageId) => {
          const normalized = normalizeText(content)
          if (group.patterns.every((pattern) => normalized.includes(pattern))) {
            const verified = buildEvidence(messageId)
            if (verified.ok && verified.excerpt) {
              groupMatched = true
            }
          }
        })
        return groupMatched
      })
    : true

  const aLevel = collectEvidenceForGroups(tuning.a_level_requires_any_of)

  const hasExclusion = tuning.exclusions?.some((pattern) => {
    let matched = false
    chatMap.forEach((content) => {
      if (normalizeText(content).includes(pattern)) {
        matched = true
      }
    })
    return matched
  }) ?? false

  let qualified = true
  if (tuning.requires_any_of && !anyOf.matched) qualified = false
  if (tuning.requires_all_of && !allOf) qualified = false

  if (hasExclusion) {
    if (tuning.exclusion_mode === 'only_if_unqualified') {
      if (!qualified) {
        qualified = false
      }
    } else {
      qualified = false
    }
  }

  return {
    qualified,
    aLevelQualified: tuning.a_level_requires_any_of ? aLevel.matched : qualified,
    evidence: dedupeEvidence([...anyOf.evidence, ...aLevel.evidence]),
  }
}

const deriveRuleTuning = (ruleId: string, override?: RuleLogicConfig): RuleTuning | undefined => {
  if (!override) return RULE_TUNING[ruleId]

  return {
    requires_any_of: override.qualifiers?.requires_any_of,
    requires_all_of: override.qualifiers?.requires_all_of,
    exclusions: override.exclusions,
    exclusion_mode: override.exclusion_mode,
    a_level_requires_any_of: override.a_level_requires_any_of,
  }
}

export function evaluateRedFlags(params: {
  structuredData: StructuredIntakeData
  verbatimChatMessages?: Array<{ id: string; content: string }>
  intakeId?: string
  ruleOverrides?: SafetyRuleOverrides
}): SafetyEvaluation {
  const { structuredData, verbatimChatMessages, intakeId, ruleOverrides } = params

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
  verbatimChatMessages?.forEach((message) => {
    if (typeof message.content === 'string' && message.content.trim()) {
      textParts.push(message.content.trim())
    }
  })

  const normalizedText = normalizeText(textParts.join(' '))

  const findings: RedFlagFinding[] = []
  const triggeredRules: SafetyEvaluation['triggered_rules'] = []
  let escalation: EscalationLevel | null = null

  const chatMap = new Map<string, string>()
  verbatimChatMessages?.forEach((message) => {
    if (message.id && message.content) {
      chatMap.set(message.id, message.content)
    }
  })

  const buildChatEvidence = (patterns: readonly string[]) => {
    const evidence: Array<{ source: 'chat'; source_id: string; excerpt: string }> = []
    let explicitMatch = false

    chatMap.forEach((content, messageId) => {
      const normalized = normalizeText(content)
      if (matchPatterns(normalized, patterns)) {
        const verified = verifyEvidence({ source: 'chat', source_id: messageId }, { chatMap, structuredData, intakeId })
        if (verified.ok && verified.excerpt) {
          evidence.push({ source: 'chat', source_id: messageId, excerpt: verified.excerpt })
          explicitMatch = true
        }
      }
    })

    return { evidence, explicitMatch }
  }

  const buildChatEvidenceForText = (texts: string[]) => {
    const evidence: Array<{ source: 'chat'; source_id: string; excerpt: string }> = []
    let explicitMatch = false

    chatMap.forEach((content, messageId) => {
      const normalized = normalizeText(content)
      const matched = texts.some((text) => text && normalized.includes(normalizeText(text)))
      if (matched) {
        const verified = verifyEvidence({ source: 'chat', source_id: messageId }, { chatMap, structuredData, intakeId })
        if (verified.ok && verified.excerpt) {
          evidence.push({ source: 'chat', source_id: messageId, excerpt: verified.excerpt })
          explicitMatch = true
        }
      }
    })

    return { evidence, explicitMatch }
  }

  const ruleMatches = new Map<ClinicalRedFlag, boolean>()
  const ruleEntries = Object.entries(RULES) as Array<[ClinicalRedFlag, RuleMeta]>

  ruleEntries.forEach(([flag, rule]) => {
    if (!rule) return
    const override = ruleOverrides?.[rule.rule_id]
    const patterns = override?.logic?.patterns?.length
      ? override.logic.patterns
      : (RED_FLAG_PATTERNS[flag] ?? [])
    const matched = patterns.length > 0 ? matchPatterns(normalizedText, patterns) : false
    ruleMatches.set(flag, matched)
    if (!matched) return
    const { evidence: baseEvidence, explicitMatch } = buildChatEvidence(patterns)
    const tuning = deriveRuleTuning(rule.rule_id, override?.logic)
    const tuningResult = evaluateRuleTuning({
      chatMap,
      tuning,
      buildEvidence: (messageId) =>
        verifyEvidence({ source: 'chat', source_id: messageId }, { chatMap, structuredData, intakeId }),
    })
    const evidence = dedupeEvidence([...baseEvidence, ...tuningResult.evidence])
    const verified = evidence.length > 0
    const ruleLevel = override?.defaults?.level_default ?? rule.level
    const allowA = ruleLevel !== 'A' || (verified && explicitMatch && tuningResult.aLevelQualified)
    const downgraded = ruleLevel === 'A' && !allowA
    const severity = downgraded ? 'B' : ruleLevel
    const unverified = !verified || !explicitMatch || !tuningResult.qualified
    const displayLevel = unverified ? 'needs_review' : severity

    triggeredRules?.push({
      rule_id: rule.rule_id,
      title: rule.title,
      level: displayLevel,
      short_reason: rule.rationale,
      evidence,
      verified: !unverified,
      unverified,
      severity,
      policy_version: SAFETY_POLICY_VERSION,
    })

    if (verified && explicitMatch && tuningResult.qualified) {
      findings.push({
        id: rule.id,
        rule_id: rule.rule_id,
        policy_version: SAFETY_POLICY_VERSION,
        domain: rule.domain,
        trigger: flag,
        level: severity,
        rationale: rule.rationale,
        evidence_message_ids: evidence.map((item) => item.source_id),
      })
      escalation = escalateLevel(escalation, severity)
    }
  })

  const durationText = (hpi && typeof hpi === 'object')
    ? (hpi as Record<string, unknown>).duration
    : undefined
  const durationMinutes = extractDurationMinutes(typeof durationText === 'string' ? durationText : undefined)

  const chestPainDetected = ruleMatches.get(CLINICAL_RED_FLAG.CHEST_PAIN) ?? false
  if (chestPainDetected && durationMinutes !== null && durationMinutes >= 20) {
    const durationEvidence = (() => {
      const evidence: Array<{ source: 'chat'; source_id: string; excerpt: string }> = []
      chatMap.forEach((content, messageId) => {
        const minutes = extractDurationMinutes(content)
        if (minutes !== null && minutes >= 20) {
          const verified = verifyEvidence({ source: 'chat', source_id: messageId }, { chatMap, structuredData, intakeId })
          if (verified.ok && verified.excerpt) {
            evidence.push({ source: 'chat', source_id: messageId, excerpt: verified.excerpt })
          }
        }
      })
      return evidence
    })()
    const verified = durationEvidence.length > 0
    const unverified = !verified
    const severity = verified ? 'A' : 'B'

    triggeredRules?.push({
      rule_id: 'SFTY-2.1-R-CHEST-PAIN-20M',
      title: 'Brustschmerz > 20 Minuten',
      level: unverified ? 'needs_review' : severity,
      short_reason: 'Brustschmerz seit >= 20 Minuten erfordert sofortige Abklaerung.',
      evidence: durationEvidence,
      verified,
      unverified,
      severity,
      policy_version: SAFETY_POLICY_VERSION,
    })

    if (verified) {
      findings.push({
        id: 'CHEST_PAIN_PROLONGED',
        rule_id: 'SFTY-2.1-R-CHEST-PAIN-20M',
        policy_version: SAFETY_POLICY_VERSION,
        domain: 'cardio',
        trigger: 'CHEST_PAIN_DURATION',
        level: severity,
        rationale: 'Brustschmerz seit >= 20 Minuten erfordert sofortige Abklaerung.',
        evidence_message_ids: durationEvidence.map((item) => item.source_id),
      })
      escalation = escalateLevel(escalation, severity)
    }
  }

  const uncertainties = (structuredData as { uncertainties?: unknown }).uncertainties
  if (Array.isArray(uncertainties) && uncertainties.length >= 2 && escalation === null) {
    const uncertaintyTexts = uncertainties.filter((entry): entry is string => typeof entry === 'string')
    const { evidence: uncertaintyEvidence } = buildChatEvidenceForText(uncertaintyTexts)
    const verified = uncertaintyEvidence.length > 0
    const unverified = !verified

    triggeredRules?.push({
      rule_id: 'SFTY-2.1-R-UNCERTAINTY-2PLUS',
      title: 'Mehrere Unsicherheiten',
      level: unverified ? 'needs_review' : 'C',
      short_reason: 'Mehrere Unsicherheiten erfordern gezielte Sicherheitsfragen.',
      evidence: uncertaintyEvidence,
      verified,
      unverified,
      severity: 'C',
      policy_version: SAFETY_POLICY_VERSION,
    })

    if (verified) {
      findings.push({
        id: 'UNCERTAINTY_HIGH',
        rule_id: 'SFTY-2.1-R-UNCERTAINTY-2PLUS',
        policy_version: SAFETY_POLICY_VERSION,
        domain: 'safety',
        trigger: 'UNCERTAINTY',
        level: 'C',
        rationale: 'Mehrere Unsicherheiten erfordern gezielte Sicherheitsfragen.',
        evidence_message_ids: uncertaintyEvidence.map((item) => item.source_id),
      })
      escalation = 'C'
    }
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
  const ruleEvaluation = evaluateSafetyRules({
    structuredData,
    verbatimChatMessages,
  })

  return {
    red_flag_present: redFlagPresent,
    escalation_level: escalation,
    red_flags: findings,
    triggered_rules: triggeredRules ?? undefined,
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
