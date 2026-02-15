import type {
  ClinicalFollowup,
  ClinicalFollowupObjective,
  ClinicalFollowupObjectiveStatus,
  ClinicalFollowupQuestion,
  StructuredIntakeData,
} from '@/lib/types/clinicalIntake'

type FollowupCandidate = ClinicalFollowupQuestion

const MAX_NEXT_QUESTIONS = 3
const CLINICIAN_REQUEST_WHY = 'Rueckfrage aus aerztlicher Pruefung'

type ObjectiveSlotDefinition = {
  id: string
  label: string
  fieldPath: string
  questionId: string
  question: string
  why: string
  priority: 1 | 2 | 3
  isFilled: (structuredData: StructuredIntakeData) => boolean
}

const SOURCE_PRIORITY: Record<ClinicalFollowupQuestion['source'], number> = {
  clinician_request: 0,
  reasoning: 1,
  gap_rule: 2,
}

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
const buildClinicianRequestQuestionId = (text: string) => `clinician-request:${normalizeText(text)}`

const getFollowupLifecycle = (structuredData: StructuredIntakeData) => {
  const lifecycle = structuredData.followup?.lifecycle
  return {
    state: lifecycle?.state ?? 'active',
    completed_question_ids: lifecycle?.completed_question_ids ?? [],
    skipped_question_ids: lifecycle?.skipped_question_ids ?? [],
    resumed_at: lifecycle?.resumed_at ?? null,
    completed_at: lifecycle?.completed_at ?? null,
  } as const
}

const getString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const getStringList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

const isFollowupBlockedBySafety = (structuredData: StructuredIntakeData) => {
  const safety = structuredData.safety
  if (!safety) return false

  const effectiveLevel =
    safety.effective_level ??
    safety.effective_policy_result?.escalation_level ??
    safety.policy_result?.escalation_level ??
    null

  const effectiveAction =
    safety.effective_action ??
    safety.effective_policy_result?.chat_action ??
    safety.policy_result?.chat_action ??
    'none'

  return effectiveLevel === 'A' || effectiveAction === 'hard_stop'
}

const OBJECTIVE_SLOTS: ObjectiveSlotDefinition[] = [
  {
    id: 'objective:chief-complaint',
    label: 'Leitsymptom',
    fieldPath: 'structured_data.chief_complaint',
    questionId: 'gap:chief-complaint',
    question: 'Was ist aktuell Ihr Hauptanliegen oder das wichtigste Symptom?',
    why: 'Leitsymptom für die Einordnung fehlt',
    priority: 1,
    isFilled: (structuredData) => getString(structuredData.chief_complaint).length > 0,
  },
  {
    id: 'objective:onset',
    label: 'Beschwerdebeginn',
    fieldPath: 'structured_data.history_of_present_illness.onset',
    questionId: 'gap:onset',
    question: 'Seit wann bestehen die Beschwerden?',
    why: 'Beginn der Beschwerden fehlt',
    priority: 1,
    isFilled: (structuredData) => getString(structuredData.history_of_present_illness?.onset).length > 0,
  },
  {
    id: 'objective:duration',
    label: 'Beschwerdedauer',
    fieldPath: 'structured_data.history_of_present_illness.duration',
    questionId: 'gap:duration',
    question: 'Wie lange halten die Beschwerden typischerweise an?',
    why: 'Dauer ist für Verlauf und Risiko relevant',
    priority: 2,
    isFilled: (structuredData) => getString(structuredData.history_of_present_illness?.duration).length > 0,
  },
  {
    id: 'objective:course',
    label: 'Beschwerdeverlauf',
    fieldPath: 'structured_data.history_of_present_illness.course',
    questionId: 'gap:course',
    question: 'Haben sich die Beschwerden zuletzt eher verbessert, verschlechtert oder sind sie unverändert?',
    why: 'Verlaufseinschätzung fehlt',
    priority: 2,
    isFilled: (structuredData) => getString(structuredData.history_of_present_illness?.course).length > 0,
  },
  {
    id: 'objective:medication',
    label: 'Medikationsangaben',
    fieldPath: 'structured_data.medication',
    questionId: 'gap:medication',
    question: 'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergänzungsmittel ein?',
    why: 'Medikationskontext fehlt',
    priority: 3,
    isFilled: (structuredData) => getStringList(structuredData.medication).length > 0,
  },
  {
    id: 'objective:psychosocial',
    label: 'Psychosoziale Einflussfaktoren',
    fieldPath: 'structured_data.psychosocial_factors',
    questionId: 'gap:psychosocial',
    question: 'Gibt es derzeit Belastungen im Alltag, Schlaf oder Stress, die die Beschwerden beeinflussen könnten?',
    why: 'Psychosoziale Einflussfaktoren fehlen',
    priority: 3,
    isFilled: (structuredData) => getStringList(structuredData.psychosocial_factors).length > 0,
  },
]

const deriveObjectiveStatus = (params: {
  slot: ObjectiveSlotDefinition
  structuredData: StructuredIntakeData
  blockedBySafety: boolean
}): ClinicalFollowupObjectiveStatus => {
  const filled = params.slot.isFilled(params.structuredData)

  if (filled) {
    return 'answered'
  }

  if (params.blockedBySafety) {
    return 'blocked_by_safety'
  }

  return 'missing'
}

const buildFollowupObjectives = (structuredData: StructuredIntakeData) => {
  const blockedBySafety = isFollowupBlockedBySafety(structuredData)

  const objectives: ClinicalFollowupObjective[] = OBJECTIVE_SLOTS.map((slot) => {
    const status = deriveObjectiveStatus({
      slot,
      structuredData,
      blockedBySafety,
    })

    const rationale =
      status === 'answered'
        ? 'Objective ist in den vorliegenden Anamnesedaten bereits befüllt.'
        : status === 'blocked_by_safety'
          ? 'Objective ist offen, aber durch aktiven Safety-Hard-Stop blockiert.'
          : slot.why

    return {
      id: slot.id,
      label: slot.label,
      field_path: slot.fieldPath,
      status,
      rationale,
    }
  })

  const activeObjectiveIds = objectives
    .filter((objective) => objective.status === 'missing')
    .map((objective) => objective.id)

  return {
    blockedBySafety,
    objectives,
    activeObjectiveIds,
  }
}

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
  const { objectives, blockedBySafety } = buildFollowupObjectives(structuredData)
  if (blockedBySafety) {
    return []
  }

  return OBJECTIVE_SLOTS.filter((slot) =>
    objectives.some((objective) => objective.id === slot.id && objective.status === 'missing'),
  ).map((slot) => ({
    id: slot.questionId,
    question: slot.question,
    why: slot.why,
    priority: slot.priority,
    source: 'gap_rule' as const,
    objective_id: slot.id,
  }))
}

const dedupeCandidates = (candidates: FollowupCandidate[]) => {
  const byId = new Map<string, FollowupCandidate>()
  const byQuestion = new Map<string, FollowupCandidate>()

  for (const candidate of candidates) {
    const questionText = candidate.question.trim()
    if (!questionText) continue

    const normalizedQuestion = normalizeText(questionText)

    const byQuestionExisting = byQuestion.get(normalizedQuestion)
    if (!byQuestionExisting) {
      byQuestion.set(normalizedQuestion, candidate)
    } else if (SOURCE_PRIORITY[candidate.source] < SOURCE_PRIORITY[byQuestionExisting.source]) {
      byQuestion.set(normalizedQuestion, candidate)
    }

    const existing = byId.get(candidate.id)
    if (!existing) {
      byId.set(candidate.id, candidate)
      continue
    }

    if (SOURCE_PRIORITY[candidate.source] < SOURCE_PRIORITY[existing.source]) {
      byId.set(candidate.id, candidate)
    }
  }

  return Array.from(byQuestion.values())
}

const mapRequestedItemsToClinicianQuestions = (requestedItems: string[]): FollowupCandidate[] => {
  const seen = new Set<string>()

  return requestedItems
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const question = item.endsWith('?') ? item : `${item}?`
      const id = buildClinicianRequestQuestionId(item)

      return {
        id,
        question,
        why: CLINICIAN_REQUEST_WHY,
        priority: 1 as const,
        source: 'clinician_request' as const,
      }
    })
    .filter((candidate) => {
      if (seen.has(candidate.id)) return false
      seen.add(candidate.id)
      return true
    })
}

export const mergeClinicianRequestedItemsIntoFollowup = (params: {
  structuredData: StructuredIntakeData
  requestedItems: string[]
  now?: Date
}): StructuredIntakeData => {
  const now = params.now ?? new Date()
  const existingFollowup = params.structuredData.followup
  const lifecycle = getFollowupLifecycle(params.structuredData)
  const objectiveSnapshot = buildFollowupObjectives(params.structuredData)
  const askedIds = new Set([
    ...(existingFollowup?.asked_question_ids ?? []),
    ...lifecycle.completed_question_ids,
    ...lifecycle.skipped_question_ids,
  ])

  const existingCandidates = [
    ...(existingFollowup?.next_questions ?? []),
    ...(existingFollowup?.queue ?? []),
  ]

  const clinicianCandidates = mapRequestedItemsToClinicianQuestions(params.requestedItems)

  const merged = dedupeCandidates([...clinicianCandidates, ...existingCandidates])
    .filter((candidate) => !askedIds.has(candidate.id))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      if (a.source !== b.source) return SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]
      return a.id.localeCompare(b.id)
    })

  return {
    ...params.structuredData,
    followup: {
      next_questions: merged.slice(0, MAX_NEXT_QUESTIONS),
      queue: merged.slice(MAX_NEXT_QUESTIONS),
      asked_question_ids: Array.from(askedIds),
      last_generated_at: now.toISOString(),
      objectives: objectiveSnapshot.objectives,
      active_objective_ids: objectiveSnapshot.activeObjectiveIds,
      lifecycle: {
        ...lifecycle,
        state: 'needs_review',
      },
    },
  }
}

export const generateFollowupQuestions = (params: {
  structuredData: StructuredIntakeData
  now?: Date
}): ClinicalFollowup => {
  const { structuredData } = params
  const now = params.now ?? new Date()

  const existingFollowup = structuredData.followup
  const lifecycle = getFollowupLifecycle(structuredData)
  const objectiveSnapshot = buildFollowupObjectives(structuredData)

  if (lifecycle.state === 'completed') {
    return {
      next_questions: [],
      queue: [],
      asked_question_ids: Array.from(
        new Set([
          ...(existingFollowup?.asked_question_ids ?? []),
          ...lifecycle.completed_question_ids,
          ...lifecycle.skipped_question_ids,
        ]),
      ),
      last_generated_at: now.toISOString(),
      objectives: objectiveSnapshot.objectives,
      active_objective_ids: objectiveSnapshot.activeObjectiveIds,
      lifecycle,
    }
  }

  if (objectiveSnapshot.blockedBySafety) {
    return {
      next_questions: [],
      queue: [],
      asked_question_ids: Array.from(
        new Set([
          ...(existingFollowup?.asked_question_ids ?? []),
          ...lifecycle.completed_question_ids,
          ...lifecycle.skipped_question_ids,
        ]),
      ),
      last_generated_at: now.toISOString(),
      objectives: objectiveSnapshot.objectives,
      active_objective_ids: objectiveSnapshot.activeObjectiveIds,
      lifecycle: {
        ...lifecycle,
        state: 'active',
      },
    }
  }

  const askedIds = new Set([
    ...(existingFollowup?.asked_question_ids ?? []),
    ...lifecycle.completed_question_ids,
    ...lifecycle.skipped_question_ids,
  ])
  const queuedClinicianCandidates = [
    ...(existingFollowup?.next_questions ?? []),
    ...(existingFollowup?.queue ?? []),
  ].filter((candidate) => candidate.source === 'clinician_request')

  const reasoningCandidates = buildReasoningCandidates(structuredData)
  const gapRuleCandidates = buildGapRuleCandidates(structuredData)

  const allCandidates = dedupeCandidates([
    ...queuedClinicianCandidates,
    ...reasoningCandidates,
    ...gapRuleCandidates,
  ])
    .filter((candidate) => !askedIds.has(candidate.id))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      if (a.source !== b.source) return SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]
      return a.id.localeCompare(b.id)
    })

  return {
    next_questions: allCandidates.slice(0, MAX_NEXT_QUESTIONS),
    queue: allCandidates.slice(MAX_NEXT_QUESTIONS),
    asked_question_ids: Array.from(askedIds),
    last_generated_at: now.toISOString(),
    objectives: objectiveSnapshot.objectives,
    active_objective_ids: objectiveSnapshot.activeObjectiveIds,
    lifecycle: {
      ...lifecycle,
      state: allCandidates.length === 0 ? 'completed' : 'active',
      completed_at: allCandidates.length === 0 ? now.toISOString() : lifecycle.completed_at,
    },
  }
}

export const appendAskedQuestionIds = (params: {
  structuredData: StructuredIntakeData
  askedQuestionIds: string[]
}): StructuredIntakeData => {
  const existingAsked = new Set(params.structuredData.followup?.asked_question_ids ?? [])
  const lifecycle = getFollowupLifecycle(params.structuredData)
  const objectiveSnapshot = buildFollowupObjectives(params.structuredData)

  for (const id of params.askedQuestionIds) {
    if (typeof id === 'string' && id.trim()) {
      existingAsked.add(id.trim())
    }
  }

  return {
    ...params.structuredData,
    followup: {
      next_questions: params.structuredData.followup?.next_questions ?? [],
      queue: params.structuredData.followup?.queue ?? [],
      asked_question_ids: Array.from(existingAsked),
      last_generated_at: params.structuredData.followup?.last_generated_at ?? new Date().toISOString(),
      objectives: objectiveSnapshot.objectives,
      active_objective_ids: objectiveSnapshot.activeObjectiveIds,
      lifecycle,
    },
  }
}

export const transitionFollowupLifecycle = (params: {
  structuredData: StructuredIntakeData
  action: 'resume' | 'skip' | 'complete'
  questionId?: string
  now?: Date
}): StructuredIntakeData => {
  const now = params.now ?? new Date()
  const existing = params.structuredData.followup
  const lifecycle = getFollowupLifecycle(params.structuredData)
  const objectiveSnapshot = buildFollowupObjectives(params.structuredData)
  const nextQuestions = [...(existing?.next_questions ?? [])]
  const queue = [...(existing?.queue ?? [])]
  const askedIds = new Set(existing?.asked_question_ids ?? [])
  const completedIds = new Set(lifecycle.completed_question_ids)
  const skippedIds = new Set(lifecycle.skipped_question_ids)

  if ((params.action === 'skip' || params.action === 'complete') && !params.questionId?.trim()) {
    return params.structuredData
  }

  const questionId = params.questionId?.trim()
  if (questionId) {
    askedIds.add(questionId)
    const filterById = (item: ClinicalFollowupQuestion) => item.id !== questionId
    const filteredNext = nextQuestions.filter(filterById)
    const filteredQueue = queue.filter(filterById)
    nextQuestions.length = 0
    queue.length = 0
    nextQuestions.push(...filteredNext)
    queue.push(...filteredQueue)
  }

  if (params.action === 'skip' && questionId) {
    skippedIds.add(questionId)
  }

  if (params.action === 'complete' && questionId) {
    completedIds.add(questionId)
  }

  const hasRemaining = nextQuestions.length + queue.length > 0
  const nextState =
    params.action === 'resume'
      ? 'active'
      : hasRemaining
        ? 'active'
        : 'completed'

  return {
    ...params.structuredData,
    followup: {
      next_questions: nextQuestions,
      queue,
      asked_question_ids: Array.from(askedIds),
      last_generated_at: now.toISOString(),
      objectives: objectiveSnapshot.objectives,
      active_objective_ids: objectiveSnapshot.activeObjectiveIds,
      lifecycle: {
        state: nextState,
        completed_question_ids: Array.from(completedIds),
        skipped_question_ids: Array.from(skippedIds),
        resumed_at: params.action === 'resume' ? now.toISOString() : lifecycle.resumed_at,
        completed_at: nextState === 'completed' ? now.toISOString() : null,
      },
    },
  }
}
