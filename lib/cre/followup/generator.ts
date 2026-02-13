import type {
  ClinicalFollowup,
  ClinicalFollowupQuestion,
  StructuredIntakeData,
} from '@/lib/types/clinicalIntake'

type FollowupCandidate = ClinicalFollowupQuestion

const MAX_NEXT_QUESTIONS = 3

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildReasoningQuestionId = (conditionLabel: string, text: string) => {
  const labelPart = normalizeText(conditionLabel || 'general')
  const textPart = normalizeText(text)
  return `reasoning:${labelPart}:${textPart}`
}

const buildGapRuleQuestionId = (ruleId: string) => `gap:${ruleId}`

const getString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const getStringList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

const buildReasoningCandidates = (structuredData: StructuredIntakeData): FollowupCandidate[] => {
  const openQuestions = structuredData.reasoning?.open_questions ?? []

  return openQuestions.map((entry) => ({
    id: buildReasoningQuestionId(entry.condition_label, entry.text),
    question: entry.text.trim(),
    why: entry.condition_label.trim() || 'Gezielte Verlaufsklärung',
    priority: entry.priority,
    source: 'reasoning' as const,
  }))
}

const buildGapRuleCandidates = (structuredData: StructuredIntakeData): FollowupCandidate[] => {
  const chiefComplaint = getString(structuredData.chief_complaint)
  const hpi = structuredData.history_of_present_illness
  const onset = getString(hpi?.onset)
  const duration = getString(hpi?.duration)
  const course = getString(hpi?.course)
  const medication = getStringList(structuredData.medication)
  const psychosocial = getStringList(structuredData.psychosocial_factors)

  const candidates: FollowupCandidate[] = []

  if (!chiefComplaint) {
    candidates.push({
      id: buildGapRuleQuestionId('chief-complaint'),
      question: 'Was ist aktuell Ihr Hauptanliegen oder das wichtigste Symptom?',
      why: 'Leitsymptom für die Einordnung fehlt',
      priority: 1,
      source: 'gap_rule',
    })
  }

  if (!onset) {
    candidates.push({
      id: buildGapRuleQuestionId('onset'),
      question: 'Seit wann bestehen die Beschwerden?',
      why: 'Beginn der Beschwerden fehlt',
      priority: 1,
      source: 'gap_rule',
    })
  }

  if (!duration) {
    candidates.push({
      id: buildGapRuleQuestionId('duration'),
      question: 'Wie lange halten die Beschwerden typischerweise an?',
      why: 'Dauer ist für Verlauf und Risiko relevant',
      priority: 2,
      source: 'gap_rule',
    })
  }

  if (!course) {
    candidates.push({
      id: buildGapRuleQuestionId('course'),
      question: 'Haben sich die Beschwerden zuletzt eher verbessert, verschlechtert oder sind sie unverändert?',
      why: 'Verlaufseinschätzung fehlt',
      priority: 2,
      source: 'gap_rule',
    })
  }

  if (medication.length === 0) {
    candidates.push({
      id: buildGapRuleQuestionId('medication'),
      question: 'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergänzungsmittel ein?',
      why: 'Medikationskontext fehlt',
      priority: 3,
      source: 'gap_rule',
    })
  }

  if (psychosocial.length === 0) {
    candidates.push({
      id: buildGapRuleQuestionId('psychosocial'),
      question: 'Gibt es derzeit Belastungen im Alltag, Schlaf oder Stress, die die Beschwerden beeinflussen könnten?',
      why: 'Psychosoziale Einflussfaktoren fehlen',
      priority: 3,
      source: 'gap_rule',
    })
  }

  return candidates
}

const dedupeCandidates = (candidates: FollowupCandidate[]) => {
  const byId = new Map<string, FollowupCandidate>()

  for (const candidate of candidates) {
    if (!candidate.question.trim()) continue
    if (!byId.has(candidate.id)) {
      byId.set(candidate.id, candidate)
    }
  }

  return Array.from(byId.values())
}

export const generateFollowupQuestions = (params: {
  structuredData: StructuredIntakeData
  now?: Date
}): ClinicalFollowup => {
  const { structuredData } = params
  const now = params.now ?? new Date()

  const existingFollowup = structuredData.followup
  const askedIds = new Set(existingFollowup?.asked_question_ids ?? [])

  const reasoningCandidates = buildReasoningCandidates(structuredData)
  const gapRuleCandidates = buildGapRuleCandidates(structuredData)

  const allCandidates = dedupeCandidates([...reasoningCandidates, ...gapRuleCandidates])
    .filter((candidate) => !askedIds.has(candidate.id))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      if (a.source !== b.source) return a.source === 'reasoning' ? -1 : 1
      return a.id.localeCompare(b.id)
    })

  return {
    next_questions: allCandidates.slice(0, MAX_NEXT_QUESTIONS),
    asked_question_ids: Array.from(askedIds),
    last_generated_at: now.toISOString(),
  }
}

export const appendAskedQuestionIds = (params: {
  structuredData: StructuredIntakeData
  askedQuestionIds: string[]
}): StructuredIntakeData => {
  const existingAsked = new Set(params.structuredData.followup?.asked_question_ids ?? [])

  for (const id of params.askedQuestionIds) {
    if (typeof id === 'string' && id.trim()) {
      existingAsked.add(id.trim())
    }
  }

  return {
    ...params.structuredData,
    followup: {
      next_questions: params.structuredData.followup?.next_questions ?? [],
      asked_question_ids: Array.from(existingAsked),
      last_generated_at: params.structuredData.followup?.last_generated_at ?? new Date().toISOString(),
    },
  }
}
