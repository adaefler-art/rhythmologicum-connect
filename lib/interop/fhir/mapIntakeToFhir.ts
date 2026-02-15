import { createHash } from 'crypto'

type Primitive = string | number | boolean

export type FhirLikeResource = {
  resourceType: 'Patient' | 'Observation' | 'Condition' | 'ServiceRequest'
  id: string
  [key: string]: unknown
}

export type FhirLikeBundle = {
  resourceType: 'Bundle'
  type: 'collection'
  id: string
  timestamp: string
  meta: {
    profile: string[]
    source: string
  }
  entry: Array<{
    fullUrl: string
    resource: FhirLikeResource
  }>
}

export type IntakeForFhirMapping = {
  id: string
  user_id: string
  version_number: number
  clinical_summary: string | null
  structured_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

const toPrimitive = (value: unknown): Primitive | null => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  return null
}

const pseudonymizePatientRef = (patientUserId: string) => {
  const digest = createHash('sha256').update(patientUserId).digest('hex').slice(0, 12)
  return `PT-${digest}`
}

const deriveSymptoms = (structured: Record<string, unknown>): string[] => {
  const hpi = isRecord(structured.history_of_present_illness)
    ? structured.history_of_present_illness
    : {}

  const symptoms = [
    toText(structured.chief_complaint),
    ...toStringArray((hpi as Record<string, unknown>).associated_symptoms),
    ...toStringArray(structured.relevant_negatives),
    ...toStringArray(structured.red_flags),
  ].filter(Boolean)

  return Array.from(new Set(symptoms))
}

const deriveVitals = (structured: Record<string, unknown>) => {
  const vitalSigns = isRecord(structured.vital_signs) ? structured.vital_signs : {}

  const vitals: Array<{ key: string; value: Primitive; unit: string | null }> = []

  for (const [key, raw] of Object.entries(vitalSigns)) {
    if (isRecord(raw)) {
      const value = toPrimitive(raw.value)
      if (value === null) continue
      vitals.push({
        key,
        value,
        unit: toText(raw.unit) || null,
      })
      continue
    }

    const value = toPrimitive(raw)
    if (value === null) continue
    vitals.push({ key, value, unit: null })
  }

  return vitals
}

const deriveDifferentials = (structured: Record<string, unknown>) => {
  const reasoning = isRecord(structured.reasoning) ? structured.reasoning : {}
  const differentials = Array.isArray(reasoning.differentials) ? reasoning.differentials : []

  return differentials
    .filter((entry) => isRecord(entry))
    .map((entry) => {
      const record = entry as Record<string, unknown>
      return {
        label: toText(record.label),
        likelihood: toText(record.likelihood) || 'unknown',
      }
    })
    .filter((entry) => entry.label.length > 0)
    .slice(0, 3)
}

const deriveRecommendedNextSteps = (structured: Record<string, unknown>): string[] => {
  const reasoning = isRecord(structured.reasoning) ? structured.reasoning : {}
  const fromReasoning = toStringArray(reasoning.recommended_next_steps)

  if (fromReasoning.length > 0) {
    return fromReasoning.slice(0, 5)
  }

  return []
}

const deriveReasoningRiskObservation = (structured: Record<string, unknown>) => {
  const reasoning = isRecord(structured.reasoning) ? structured.reasoning : null
  if (!reasoning) return null

  const risk = isRecord(reasoning.risk_estimation) ? reasoning.risk_estimation : null
  if (!risk) return null

  const score = typeof risk.score === 'number' ? risk.score : null
  const level = toText(risk.level) || null

  if (score === null && !level) return null

  return {
    score,
    level,
  }
}

const deriveSafetyObservation = (structured: Record<string, unknown>) => {
  const safety = isRecord(structured.safety) ? structured.safety : null
  if (!safety) return null

  const effectiveLevel =
    toText((isRecord(safety.effective_policy_result) ? safety.effective_policy_result.escalation_level : null)) ||
    toText(safety.effective_level) ||
    toText(safety.escalation_level)

  const effectiveAction =
    toText((isRecord(safety.effective_policy_result) ? safety.effective_policy_result.chat_action : null)) ||
    toText(safety.effective_action)

  if (!effectiveLevel && !effectiveAction) return null

  return {
    effectiveLevel: effectiveLevel || null,
    effectiveAction: effectiveAction || null,
  }
}

const deriveFollowupQuestions = (structured: Record<string, unknown>) => {
  const followup = isRecord(structured.followup) ? structured.followup : null
  if (!followup) return [] as string[]

  const next = Array.isArray(followup.next_questions) ? followup.next_questions : []
  const queue = Array.isArray(followup.queue) ? followup.queue : []

  return [...next, ...queue]
    .filter((entry) => isRecord(entry))
    .map((entry) => toText(entry.question))
    .filter(Boolean)
    .slice(0, 6)
}

const deriveLanguageNormalizationSummary = (structured: Record<string, unknown>) => {
  const normalization = isRecord(structured.language_normalization)
    ? structured.language_normalization
    : null
  if (!normalization) return null

  const turns = Array.isArray(normalization.turns)
    ? normalization.turns.filter((entry) => isRecord(entry)).slice(-3)
    : []

  if (turns.length === 0) return null

  return turns
    .map((turn) => {
      const language = toText(turn.detected_language) || 'unknown'
      const phrase = toText(turn.original_phrase)
      const ambiguity = typeof turn.ambiguity_score === 'number' ? turn.ambiguity_score : null
      return `${language}: ${phrase}${ambiguity !== null ? ` (ambiguity ${ambiguity})` : ''}`
    })
    .join(' | ')
}

const baseUrl = 'urn:rhythmologicum:fhir-like'

export const mapIntakeToFhir = (params: {
  intake: IntakeForFhirMapping
  generatedAt?: string
}): FhirLikeBundle => {
  const { intake } = params
  const generatedAt = params.generatedAt ?? new Date().toISOString()
  const patientRef = pseudonymizePatientRef(intake.user_id)
  const structured = isRecord(intake.structured_data) ? intake.structured_data : {}

  const patientId = `patient-${patientRef.toLowerCase()}`
  const patient: FhirLikeResource = {
    resourceType: 'Patient',
    id: patientId,
    active: true,
    identifier: [
      {
        system: 'urn:rhythmologicum:pseudonym',
        value: patientRef,
      },
    ],
  }

  const symptomObservations: FhirLikeResource[] = deriveSymptoms(structured).map((symptom, index) => ({
    resourceType: 'Observation',
    id: `obs-symptom-${index + 1}`,
    status: 'final',
    category: [{ text: 'symptom' }],
    code: { text: 'Symptom' },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: generatedAt,
    valueString: symptom,
  }))

  const vitalObservations: FhirLikeResource[] = deriveVitals(structured).map((vital, index) => {
    const observation: FhirLikeResource = {
      resourceType: 'Observation',
      id: `obs-vital-${index + 1}`,
      status: 'final',
      category: [{ text: 'vital-signs' }],
      code: { text: vital.key },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: generatedAt,
    }

    if (typeof vital.value === 'number') {
      observation.valueQuantity = {
        value: vital.value,
        unit: vital.unit,
      }
    } else {
      observation.valueString = String(vital.value)
    }

    return observation
  })

  const conditions: FhirLikeResource[] = deriveDifferentials(structured).map((differential, index) => ({
    resourceType: 'Condition',
    id: `condition-${index + 1}`,
    clinicalStatus: { text: 'active' },
    verificationStatus: { text: 'suspected' },
    code: { text: differential.label },
    subject: { reference: `Patient/${patientId}` },
    note: [
      {
        text: `Likelihood: ${differential.likelihood}`,
      },
    ],
  }))

  const serviceRequests: FhirLikeResource[] = deriveRecommendedNextSteps(structured).map((step, index) => ({
    resourceType: 'ServiceRequest',
    id: `service-request-${index + 1}`,
    status: 'active',
    intent: 'plan',
    priority: index === 0 ? 'urgent' : 'routine',
    subject: { reference: `Patient/${patientId}` },
    authoredOn: generatedAt,
    code: {
      text: step,
    },
  }))

  const followupServiceRequests: FhirLikeResource[] = deriveFollowupQuestions(structured).map(
    (question, index) => ({
      resourceType: 'ServiceRequest',
      id: `service-request-followup-${index + 1}`,
      status: 'active',
      intent: 'proposal',
      priority: 'routine',
      subject: { reference: `Patient/${patientId}` },
      authoredOn: generatedAt,
      code: {
        text: `Follow-up question: ${question}`,
      },
    }),
  )

  const reasoningRisk = deriveReasoningRiskObservation(structured)
  const reasoningObservation: FhirLikeResource[] = reasoningRisk
    ? [
        {
          resourceType: 'Observation',
          id: 'obs-reasoning-risk',
          status: 'final',
          category: [{ text: 'clinical-reasoning' }],
          code: { text: 'Reasoning risk estimation' },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: generatedAt,
          valueString:
            reasoningRisk.score !== null
              ? `score=${reasoningRisk.score}; level=${reasoningRisk.level ?? 'n/a'}`
              : `level=${reasoningRisk.level ?? 'n/a'}`,
        },
      ]
    : []

  const safetyObservationData = deriveSafetyObservation(structured)
  const safetyObservations: FhirLikeResource[] = safetyObservationData
    ? [
        {
          resourceType: 'Observation',
          id: 'obs-safety-effective-state',
          status: 'final',
          category: [{ text: 'safety' }],
          code: { text: 'Effective safety state' },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: generatedAt,
          valueString: `level=${safetyObservationData.effectiveLevel ?? 'n/a'}; action=${safetyObservationData.effectiveAction ?? 'n/a'}`,
        },
      ]
    : []

  const normalizationSummary = deriveLanguageNormalizationSummary(structured)
  const normalizationObservations: FhirLikeResource[] = normalizationSummary
    ? [
        {
          resourceType: 'Observation',
          id: 'obs-language-normalization',
          status: 'final',
          category: [{ text: 'language-normalization' }],
          code: { text: 'Clinical language normalization summary' },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: generatedAt,
          valueString: normalizationSummary,
        },
      ]
    : []

  const allResources: FhirLikeResource[] = [
    patient,
    ...symptomObservations,
    ...vitalObservations,
    ...conditions,
    ...serviceRequests,
    ...followupServiceRequests,
    ...reasoningObservation,
    ...safetyObservations,
    ...normalizationObservations,
  ]

  return {
    resourceType: 'Bundle',
    type: 'collection',
    id: `bundle-intake-${intake.id}-v${intake.version_number}`,
    timestamp: generatedAt,
    meta: {
      profile: ['https://rhythmologicum.dev/fhir-like/intake-bundle/v1'],
      source: `clinical-intake/${intake.id}`,
    },
    entry: allResources.map((resource) => ({
      fullUrl: `${baseUrl}/${resource.resourceType}/${resource.id}`,
      resource,
    })),
  }
}
