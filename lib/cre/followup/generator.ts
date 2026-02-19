import type {
  ClinicalReadinessSnapshot,
  ClinicalUc2TriggerReason,
  ClinicalFollowup,
  ClinicalFollowupObjective,
  ClinicalFollowupObjectiveStatus,
  ClinicalFollowupQuestion,
  StructuredIntakeData,
} from '@/lib/types/clinicalIntake'

type FollowupCandidate = ClinicalFollowupQuestion
type ObjectiveStateOverride = 'missing' | 'unclear' | 'resolved'

const MAX_NEXT_QUESTIONS = 3
const CLINICIAN_REQUEST_WHY = 'Rueckfrage aus aerztlicher Pruefung'

const UC2_MIN_WEEKS = 12

type ObjectiveSlotDefinition = {
  id: string
  label: string
  fieldPath: string
  questionId: string
  question: string
  why: string
  priority: 1 | 2 | 3
  requiresUc2?: boolean
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
    savepoints: lifecycle?.savepoints ?? [],
    active_block_id: lifecycle?.active_block_id ?? null,
  } as const
}

const getString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const getStringList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

const getDocumentList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (item) => typeof item === 'object' && item !== null && !Array.isArray(item),
      )
    : []

const toComparable = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

const detectSymptomDurationWeeks = (structuredData: StructuredIntakeData): number | null => {
  const candidates = [
    getString(structuredData.history_of_present_illness?.duration),
    getString(structuredData.history_of_present_illness?.onset),
  ].filter(Boolean)

  const unitToWeeks = (unit: string) => {
    if (unit.startsWith('woche')) return 1
    if (unit.startsWith('monat')) return 4
    if (unit.startsWith('jahr')) return 52
    if (unit.startsWith('tag')) return 1 / 7
    return null
  }

  for (const raw of candidates) {
    const text = toComparable(raw)
    const rangeMatch = text.match(/(\d+)\s*(?:-|bis|to)\s*(\d+)\s*(tag(?:e|en)?|woche(?:n)?|monat(?:e|en)?|jahr(?:e|en)?)/)
    if (rangeMatch) {
      const [, leftRaw, rightRaw, unitRaw] = rangeMatch
      const left = Number.parseInt(leftRaw, 10)
      const right = Number.parseInt(rightRaw, 10)
      const factor = unitToWeeks(unitRaw)
      if (Number.isFinite(left) && Number.isFinite(right) && factor) {
        return Math.max(left, right) * factor
      }
    }

    const singleMatch = text.match(/(\d+)\s*(tag(?:e|en)?|woche(?:n)?|monat(?:e|en)?|jahr(?:e|en)?)/)
    if (singleMatch) {
      const [, countRaw, unitRaw] = singleMatch
      const count = Number.parseInt(countRaw, 10)
      const factor = unitToWeeks(unitRaw)
      if (Number.isFinite(count) && factor) {
        return count * factor
      }
    }

    if (/(mehr\s+als|ueber|uber|mindestens)\s+3\s+monat/.test(text)) return 12
    if (/(seit\s+monaten|monatelang)/.test(text)) return 12
    if (/(seit\s+jahren|jahrelang|chronisch)/.test(text)) return 52
  }

  return null
}

const CLUSTER_KEYWORDS: Record<string, string[]> = {
  cardio: ['herz', 'brust', 'palpitation', 'tachyk', 'druck'],
  respiratory: ['atem', 'dyspno', 'husten', 'luftnot'],
  neuro: ['kopf', 'schwindel', 'neurolog', 'kribbel', 'taub', 'migra'],
  gastrointestinal: ['bauch', 'magen', 'darm', 'uebel', 'erbrechen', 'durchfall'],
  musculoskeletal: ['ruecken', 'gelenk', 'muskel', 'nacken', 'wirbel'],
  psychosomatic: ['angst', 'stress', 'schlaf', 'depress', 'panik'],
}

const detectSymptomClusters = (structuredData: StructuredIntakeData) => {
  const symptomText = [
    getString(structuredData.chief_complaint),
    ...getStringList(structuredData.history_of_present_illness?.associated_symptoms),
    ...((structuredData.reasoning?.differentials ?? []).map((entry) => getString(entry.label)).filter(Boolean) as string[]),
  ]
    .join(' ')
    .trim()

  if (!symptomText) return [] as string[]

  const normalized = toComparable(symptomText)
  const clusters = new Set<string>()

  for (const [cluster, keywords] of Object.entries(CLUSTER_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      clusters.add(cluster)
    }
  }

  return Array.from(clusters)
}

const hasExplicitCrossClusterConnection = (structuredData: StructuredIntakeData) => {
  const context = [
    getString(structuredData.history_of_present_illness?.course),
    getString(structuredData.history_of_present_illness?.trigger),
  ]
    .join(' ')
    .trim()

  if (!context) return false

  const normalized = toComparable(context)
  return /zusammenhang|ausgeloest\s+durch|ausgeloest|im\s+rahmen\s+von|seit\s+dem/.test(normalized)
}

const hasChronicConditionSignal = (structuredData: StructuredIntakeData) => {
  const chronicPattern =
    /chron|diabet|copd|asthma|hyperton|bluthoch|koronar|herzinsuff|autoimmun|rheuma|schilddr|depress|angststoer|epilep|ms|niereninsuff|fibromyalg|migraen/

  return getStringList(structuredData.past_medical_history).some((entry) =>
    chronicPattern.test(toComparable(entry)),
  )
}

const hasExplicitClinicianRequirement = (structuredData: StructuredIntakeData) => {
  const candidates = [
    ...(structuredData.followup?.next_questions ?? []),
    ...(structuredData.followup?.queue ?? []),
  ]

  if (candidates.some((entry) => entry.source === 'clinician_request')) {
    return true
  }

  return (structuredData.followup?.asked_question_ids ?? []).some((entry) =>
    entry.startsWith('clinician-request:'),
  )
}

const evaluateUc2TriggerReasons = (structuredData: StructuredIntakeData): ClinicalUc2TriggerReason[] => {
  const reasons: ClinicalUc2TriggerReason[] = []

  const durationWeeks = detectSymptomDurationWeeks(structuredData)
  if (typeof durationWeeks === 'number' && durationWeeks >= UC2_MIN_WEEKS) {
    reasons.push('symptom_duration_gte_12_weeks')
  }

  const symptomClusters = detectSymptomClusters(structuredData)
  if (symptomClusters.length >= 2 && !hasExplicitCrossClusterConnection(structuredData)) {
    reasons.push('multiple_symptom_clusters')
  }

  if (hasChronicConditionSignal(structuredData)) {
    reasons.push('chronic_condition_signal')
  }

  if (hasExplicitClinicianRequirement(structuredData)) {
    reasons.push('explicit_clinician_requirement')
  }

  return reasons
}

const buildReadinessSnapshot = (params: {
  structuredData: StructuredIntakeData
  blockedBySafety: boolean
}): ClinicalReadinessSnapshot => {
  const uc2TriggerReasons = evaluateUc2TriggerReasons(params.structuredData)
  const uc2Triggered = uc2TriggerReasons.length > 0

  if (params.blockedBySafety) {
    return {
      state: 'SafetyReady',
      uc2_triggered: uc2Triggered,
      uc2_trigger_reasons: uc2TriggerReasons,
    }
  }

  return {
    state: uc2Triggered ? 'ProblemReady' : 'VisitReady',
    uc2_triggered: uc2Triggered,
    uc2_trigger_reasons: uc2TriggerReasons,
  }
}

const getObjectiveStateOverrides = (structuredData: StructuredIntakeData) => {
  const raw = structuredData.followup?.objective_state_overrides
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {} as Record<string, ObjectiveStateOverride>
  }

  const next: Record<string, ObjectiveStateOverride> = {}
  for (const [objectiveId, state] of Object.entries(raw)) {
    if (state === 'missing' || state === 'unclear' || state === 'resolved') {
      next[objectiveId] = state
    }
  }

  return next
}

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
    id: 'objective:trigger',
    label: 'Beschwerde-Trigger',
    fieldPath: 'structured_data.history_of_present_illness.trigger',
    questionId: 'gap:trigger',
    question: 'Gibt es erkennbare Ausloeser oder Trigger fuer die Beschwerden?',
    why: 'Ausloeser/Trigger fehlen',
    priority: 2,
    isFilled: (structuredData) => {
      const hpi = structuredData.history_of_present_illness
      if (!hpi) return false
      if (getString(hpi.trigger).length > 0) return true
      return getStringList(hpi.aggravating_factors).length > 0 || getStringList(hpi.relieving_factors).length > 0
    },
  },
  {
    id: 'objective:frequency',
    label: 'Beschwerdefrequenz',
    fieldPath: 'structured_data.history_of_present_illness.frequency',
    questionId: 'gap:frequency',
    question: 'Wie haeufig treten die Beschwerden auf?',
    why: 'Frequenz der Beschwerden fehlt',
    priority: 2,
    isFilled: (structuredData) => getString(structuredData.history_of_present_illness?.frequency).length > 0,
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
    id: 'objective:past-medical-history',
    label: 'Vorerkrankungen',
    fieldPath: 'structured_data.past_medical_history',
    questionId: 'gap:past-medical-history',
    question: 'Gibt es bekannte relevante Vorerkrankungen?',
    why: 'Vorerkrankungen fehlen',
    priority: 3,
    isFilled: (structuredData) => getStringList(structuredData.past_medical_history).length > 0,
  },
  {
    id: 'objective:prior-findings-upload',
    label: 'Vorbefunde/Uploads',
    fieldPath: 'structured_data.prior_findings_documents',
    questionId: 'gap:prior-findings-upload',
    question: 'Liegt ein Vorbefund oder Arztbrief vor, den Sie hochladen koennen?',
    why: 'Vorbefunde/Upload fehlen',
    priority: 3,
    isFilled: (structuredData) => getDocumentList(structuredData.prior_findings_documents).length > 0,
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
  {
    id: 'objective:associated-symptoms',
    label: 'Symptomcluster-Detail',
    fieldPath: 'structured_data.history_of_present_illness.associated_symptoms',
    questionId: 'gap:associated-symptoms',
    question: 'Welche weiteren Begleitsymptome bestehen aktuell?',
    why: 'Begleitsymptome für die Problemklärung fehlen',
    priority: 2,
    requiresUc2: true,
    isFilled: (structuredData) =>
      getStringList(structuredData.history_of_present_illness?.associated_symptoms).length > 0,
  },
  {
    id: 'objective:aggravating-relieving-factors',
    label: 'Verstärkende/Lindernde Faktoren',
    fieldPath: 'structured_data.history_of_present_illness.aggravating_factors|relieving_factors',
    questionId: 'gap:aggravating-relieving-factors',
    question: 'Was verschlechtert die Beschwerden und was lindert sie?',
    why: 'Verstärkende/Lindernde Faktoren sind noch unklar',
    priority: 2,
    requiresUc2: true,
    isFilled: (structuredData) => {
      const hpi = structuredData.history_of_present_illness
      if (!hpi) return false
      return (
        getStringList(hpi.aggravating_factors).length > 0 ||
        getStringList(hpi.relieving_factors).length > 0
      )
    },
  },
  {
    id: 'objective:relevant-negatives',
    label: 'Relevante Negativangaben',
    fieldPath: 'structured_data.relevant_negatives',
    questionId: 'gap:relevant-negatives',
    question: 'Welche wichtigen Symptome liegen explizit nicht vor?',
    why: 'Relevante Negativangaben fehlen für die strukturierte Klärung',
    priority: 3,
    requiresUc2: true,
    isFilled: (structuredData) => getStringList(structuredData.relevant_negatives).length > 0,
  },
]

const OBJECTIVE_BLOCK_ORDER = [
  'core_symptom_profile',
  'medical_context',
  'supporting_context',
  'program_specific',
] as const

const OBJECTIVE_BLOCK_BY_ID: Record<string, (typeof OBJECTIVE_BLOCK_ORDER)[number]> = {
  'objective:chief-complaint': 'core_symptom_profile',
  'objective:onset': 'core_symptom_profile',
  'objective:duration': 'core_symptom_profile',
  'objective:course': 'core_symptom_profile',
  'objective:trigger': 'core_symptom_profile',
  'objective:frequency': 'core_symptom_profile',
  'objective:associated-symptoms': 'core_symptom_profile',
  'objective:aggravating-relieving-factors': 'core_symptom_profile',
  'objective:relevant-negatives': 'core_symptom_profile',
  'objective:medication': 'medical_context',
  'objective:past-medical-history': 'medical_context',
  'objective:prior-findings-upload': 'medical_context',
  'objective:psychosocial': 'supporting_context',
}

const isObjectiveCompletedForPatient = (status: ClinicalFollowupObjectiveStatus) =>
  status === 'resolved' ||
  status === 'answered' ||
  status === 'verified' ||
  status === 'blocked_by_safety'

const areIdSetsEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false
  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return sortedLeft.every((entry, index) => entry === sortedRight[index])
}

const buildLifecycleSavepoints = (params: {
  objectives: ClinicalFollowupObjective[]
  now: Date
  previousSavepoints?: Array<{
    block_id: string
    status: 'in_progress' | 'completed'
    total_objective_ids: string[]
    completed_objective_ids: string[]
    updated_at: string
  }>
}) => {
  const previousByBlock = new Map(
    (params.previousSavepoints ?? []).map((entry) => [entry.block_id, entry]),
  )

  const bucket = new Map<
    string,
    {
      total: string[]
      completed: string[]
    }
  >()

  for (const objective of params.objectives) {
    const blockId = OBJECTIVE_BLOCK_BY_ID[objective.id] ?? 'program_specific'
    const current = bucket.get(blockId) ?? { total: [], completed: [] }
    current.total.push(objective.id)
    if (isObjectiveCompletedForPatient(objective.status)) {
      current.completed.push(objective.id)
    }
    bucket.set(blockId, current)
  }

  const savepoints = OBJECTIVE_BLOCK_ORDER
    .filter((blockId) => (bucket.get(blockId)?.total.length ?? 0) > 0)
    .map((blockId) => {
      const block = bucket.get(blockId) ?? { total: [], completed: [] }
      const status: 'in_progress' | 'completed' =
        block.total.length > 0 && block.completed.length === block.total.length
          ? 'completed'
          : 'in_progress'

      const previous = previousByBlock.get(blockId)
      const unchanged =
        previous &&
        previous.status === status &&
        areIdSetsEqual(previous.total_objective_ids, block.total) &&
        areIdSetsEqual(previous.completed_objective_ids, block.completed)

      return {
        block_id: blockId,
        status,
        total_objective_ids: block.total,
        completed_objective_ids: block.completed,
        updated_at: unchanged ? previous.updated_at : params.now.toISOString(),
      }
    })

  return {
    savepoints,
    active_block_id: savepoints.find((entry) => entry.status === 'in_progress')?.block_id ?? null,
  }
}

const finalizeReadinessSnapshot = (params: {
  readiness: ClinicalReadinessSnapshot
  lifecycleState: 'active' | 'needs_review' | 'completed'
  savepoints: Array<{ status: 'in_progress' | 'completed' }>
}) => {
  const allBlocksCompleted =
    params.savepoints.length > 0 && params.savepoints.every((entry) => entry.status === 'completed')

  if (
    params.lifecycleState === 'completed' &&
    params.readiness.state === 'VisitReady' &&
    !params.readiness.uc2_triggered &&
    allBlocksCompleted
  ) {
    return {
      ...params.readiness,
      state: 'ProgramReady' as const,
    }
  }

  return params.readiness
}

const getActiveObjectiveSlots = (structuredData: StructuredIntakeData) => {
  const uc2Active = evaluateUc2TriggerReasons(structuredData).length > 0
  return OBJECTIVE_SLOTS.filter((slot) => !slot.requiresUc2 || uc2Active)
}

const inferObjectiveIdFromText = (value: string): string | null => {
  const normalized = normalizeText(value)

  if (/chief|hauptanliegen|hauptsymptom|leitsymptom/.test(normalized)) {
    return 'objective:chief-complaint'
  }
  if (/onset|beginn|seit-wann/.test(normalized)) {
    return 'objective:onset'
  }
  if (/duration|dauer|wie-lange/.test(normalized)) {
    return 'objective:duration'
  }
  if (/course|verlauf|verbessert|verschlechtert/.test(normalized)) {
    return 'objective:course'
  }
  if (/medik|medication|nahrungserga|supplement/.test(normalized)) {
    return 'objective:medication'
  }
  if (/psycho|stress|alltag|schlaf|belastung/.test(normalized)) {
    return 'objective:psychosocial'
  }
  if (/begleit|associated|symptomcluster|symptome/.test(normalized)) {
    return 'objective:associated-symptoms'
  }
  if (/verstaerk|verschlechter|linder|ausloeser|aggravat|reliev/.test(normalized)) {
    return 'objective:aggravating-relieving-factors'
  }
  if (/negativ|nicht-vorhanden|nicht-vorliegend|relevant-negativ/.test(normalized)) {
    return 'objective:relevant-negatives'
  }

  return null
}

const deriveObjectiveStatus = (params: {
  slot: ObjectiveSlotDefinition
  structuredData: StructuredIntakeData
  blockedBySafety: boolean
  objectiveOverrides: Record<string, ObjectiveStateOverride>
}): ClinicalFollowupObjectiveStatus => {
  const filled = params.slot.isFilled(params.structuredData)

  if (filled) {
    return 'resolved'
  }

  if (params.blockedBySafety) {
    return 'blocked_by_safety'
  }

  const override = params.objectiveOverrides[params.slot.id]
  if (override === 'unclear') {
    return 'unclear'
  }

  return 'missing'
}

const buildFollowupObjectives = (structuredData: StructuredIntakeData) => {
  const blockedBySafety = isFollowupBlockedBySafety(structuredData)
  const objectiveOverrides = getObjectiveStateOverrides(structuredData)
  const activeSlots = getActiveObjectiveSlots(structuredData)

  const objectives: ClinicalFollowupObjective[] = activeSlots.map((slot) => {
    const status = deriveObjectiveStatus({
      slot,
      structuredData,
      blockedBySafety,
      objectiveOverrides,
    })

    const rationale =
      status === 'resolved' || status === 'answered' || status === 'verified'
        ? 'Objective ist in den vorliegenden Anamnesedaten bereits befüllt.'
        : status === 'unclear'
          ? 'Objective ist teilweise vorhanden, braucht aber noch Praezisierung.'
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
    .filter((objective) => objective.status === 'missing' || objective.status === 'unclear')
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

  return getActiveObjectiveSlots(structuredData).filter((slot) =>
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
        objective_id: inferObjectiveIdFromText(item) ?? undefined,
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
  const readinessBase = buildReadinessSnapshot({
    structuredData: params.structuredData,
    blockedBySafety: objectiveSnapshot.blockedBySafety,
  })
  const lifecycleState: 'active' | 'needs_review' | 'completed' = 'needs_review'
  const savepointSnapshot = buildLifecycleSavepoints({
    objectives: objectiveSnapshot.objectives,
    now,
    previousSavepoints: lifecycle.savepoints,
  })
  const readiness = finalizeReadinessSnapshot({
    readiness: readinessBase,
    lifecycleState,
    savepoints: savepointSnapshot.savepoints,
  })
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
    .filter((candidate) => {
      if (!candidate.objective_id) return true
      return objectiveSnapshot.activeObjectiveIds.includes(candidate.objective_id)
    })
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
      objective_state_overrides: getObjectiveStateOverrides(params.structuredData),
      readiness,
      lifecycle: {
        ...lifecycle,
        state: lifecycleState,
        savepoints: savepointSnapshot.savepoints,
        active_block_id: savepointSnapshot.active_block_id,
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
  const readinessBase = buildReadinessSnapshot({
    structuredData,
    blockedBySafety: objectiveSnapshot.blockedBySafety,
  })

  if (lifecycle.state === 'completed') {
    const savepointSnapshot = buildLifecycleSavepoints({
      objectives: objectiveSnapshot.objectives,
      now,
      previousSavepoints: lifecycle.savepoints,
    })
    const readiness = finalizeReadinessSnapshot({
      readiness: readinessBase,
      lifecycleState: 'completed',
      savepoints: savepointSnapshot.savepoints,
    })

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
      objective_state_overrides: getObjectiveStateOverrides(structuredData),
      readiness,
      lifecycle: {
        ...lifecycle,
        savepoints: savepointSnapshot.savepoints,
        active_block_id: savepointSnapshot.active_block_id,
      },
    }
  }

  if (objectiveSnapshot.blockedBySafety) {
    const savepointSnapshot = buildLifecycleSavepoints({
      objectives: objectiveSnapshot.objectives,
      now,
      previousSavepoints: lifecycle.savepoints,
    })
    const readiness = finalizeReadinessSnapshot({
      readiness: readinessBase,
      lifecycleState: 'active',
      savepoints: savepointSnapshot.savepoints,
    })

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
      objective_state_overrides: getObjectiveStateOverrides(structuredData),
      readiness,
      lifecycle: {
        ...lifecycle,
        state: 'active',
        savepoints: savepointSnapshot.savepoints,
        active_block_id: savepointSnapshot.active_block_id,
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
    .filter((candidate) => {
      if (!candidate.objective_id) return true
      return objectiveSnapshot.activeObjectiveIds.includes(candidate.objective_id)
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      if (a.source !== b.source) return SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]
      return a.id.localeCompare(b.id)
    })

  const lifecycleState: 'active' | 'needs_review' | 'completed' =
    allCandidates.length === 0
      ? readinessBase.uc2_triggered
        ? 'needs_review'
        : 'completed'
      : 'active'

  const savepointSnapshot = buildLifecycleSavepoints({
    objectives: objectiveSnapshot.objectives,
    now,
    previousSavepoints: lifecycle.savepoints,
  })

  const readiness = finalizeReadinessSnapshot({
    readiness: readinessBase,
    lifecycleState,
    savepoints: savepointSnapshot.savepoints,
  })

  return {
    next_questions: allCandidates.slice(0, MAX_NEXT_QUESTIONS),
    queue: allCandidates.slice(MAX_NEXT_QUESTIONS),
    asked_question_ids: Array.from(askedIds),
    last_generated_at: now.toISOString(),
    objectives: objectiveSnapshot.objectives,
    active_objective_ids: objectiveSnapshot.activeObjectiveIds,
    objective_state_overrides: getObjectiveStateOverrides(structuredData),
    readiness,
    lifecycle: {
      ...lifecycle,
      state: lifecycleState,
      completed_at:
        allCandidates.length === 0 && !readinessBase.uc2_triggered
          ? now.toISOString()
          : lifecycle.completed_at,
      savepoints: savepointSnapshot.savepoints,
      active_block_id: savepointSnapshot.active_block_id,
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
  const readinessBase = buildReadinessSnapshot({
    structuredData: params.structuredData,
    blockedBySafety: objectiveSnapshot.blockedBySafety,
  })
  const lifecycleState = lifecycle.state
  const now = new Date()
  const savepointSnapshot = buildLifecycleSavepoints({
    objectives: objectiveSnapshot.objectives,
    now,
    previousSavepoints: lifecycle.savepoints,
  })
  const readiness = finalizeReadinessSnapshot({
    readiness: readinessBase,
    lifecycleState,
    savepoints: savepointSnapshot.savepoints,
  })

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
      objective_state_overrides: getObjectiveStateOverrides(params.structuredData),
      readiness,
      lifecycle: {
        ...lifecycle,
        savepoints: savepointSnapshot.savepoints,
        active_block_id: savepointSnapshot.active_block_id,
      },
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
  const readinessBase = buildReadinessSnapshot({
    structuredData: params.structuredData,
    blockedBySafety: objectiveSnapshot.blockedBySafety,
  })
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

  const savepointSnapshot = buildLifecycleSavepoints({
    objectives: objectiveSnapshot.objectives,
    now,
    previousSavepoints: lifecycle.savepoints,
  })

  const readiness = finalizeReadinessSnapshot({
    readiness: readinessBase,
    lifecycleState: nextState,
    savepoints: savepointSnapshot.savepoints,
  })

  return {
    ...params.structuredData,
    followup: {
      next_questions: nextQuestions,
      queue,
      asked_question_ids: Array.from(askedIds),
      last_generated_at: now.toISOString(),
      objectives: objectiveSnapshot.objectives,
      active_objective_ids: objectiveSnapshot.activeObjectiveIds,
      objective_state_overrides: getObjectiveStateOverrides(params.structuredData),
      readiness,
      lifecycle: {
        state: nextState,
        completed_question_ids: Array.from(completedIds),
        skipped_question_ids: Array.from(skippedIds),
        resumed_at: params.action === 'resume' ? now.toISOString() : lifecycle.resumed_at,
        completed_at: nextState === 'completed' ? now.toISOString() : null,
        savepoints: savepointSnapshot.savepoints,
        active_block_id: savepointSnapshot.active_block_id,
      },
    },
  }
}
