import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

type DetectedLanguage = 'de' | 'en' | 'mixed' | 'unknown'

type CanonicalEntityType = 'symptom' | 'medication' | 'duration' | 'intensity' | 'other'

type MappingCandidate = {
  entity_type: CanonicalEntityType
  canonical: string
  aliases: string[]
  confidence: number
}

type NormalizationTurn = NonNullable<StructuredIntakeData['language_normalization']>['turns'][number]

const NORMALIZATION_VERSION = 'csn-v1.0.0'
const CLARIFICATION_THRESHOLD = 0.55

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

const hasAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term))

const detectLanguage = (text: string): DetectedLanguage => {
  const normalized = normalize(text)
  const deMarkers = ['schmerz', 'atemnot', 'herzrasen', 'angst', 'seit', 'heute', 'gestern', 'kein']
  const enMarkers = ['pain', 'shortness of breath', 'palpitations', 'anxiety', 'since', 'today', 'yesterday', 'no']

  const deHit = hasAny(normalized, deMarkers)
  const enHit = hasAny(normalized, enMarkers)

  if (deHit && enHit) return 'mixed'
  if (deHit) return 'de'
  if (enHit) return 'en'
  return 'unknown'
}

const MAPPINGS: MappingCandidate[] = [
  {
    entity_type: 'symptom',
    canonical: 'chest_pain',
    aliases: ['brustschmerz', 'chest pain', 'druck auf der brust'],
    confidence: 0.92,
  },
  {
    entity_type: 'symptom',
    canonical: 'dyspnea',
    aliases: ['atemnot', 'luftnot', 'shortness of breath', 'cannot breathe'],
    confidence: 0.93,
  },
  {
    entity_type: 'symptom',
    canonical: 'palpitations',
    aliases: ['herzrasen', 'palpitations', 'racing heart'],
    confidence: 0.9,
  },
  {
    entity_type: 'symptom',
    canonical: 'dizziness',
    aliases: ['schwindel', 'dizziness', 'lightheaded'],
    confidence: 0.88,
  },
  {
    entity_type: 'medication',
    canonical: 'omega_3',
    aliases: ['omega 3', 'omega-3'],
    confidence: 0.95,
  },
  {
    entity_type: 'medication',
    canonical: 'none_reported',
    aliases: ['keine medikamente', 'none', 'nothing', 'nein ich nehme nichts'],
    confidence: 0.85,
  },
  {
    entity_type: 'duration',
    canonical: 'acute_hours',
    aliases: ['seit heute', 'heute begonnen', 'for hours'],
    confidence: 0.75,
  },
  {
    entity_type: 'duration',
    canonical: 'chronic_weeks_plus',
    aliases: ['seit wochen', 'seit monaten', 'for weeks', 'for months'],
    confidence: 0.84,
  },
  {
    entity_type: 'intensity',
    canonical: 'high_intensity',
    aliases: ['stark', 'sehr stark', '10/10', 'severe'],
    confidence: 0.8,
  },
]

const mapEntities = (phrase: string) => {
  const normalized = normalize(phrase)

  const matches = MAPPINGS.flatMap((candidate) => {
    const hit = candidate.aliases.find((alias) => normalized.includes(normalize(alias)))
    if (!hit) return []

    return [
      {
        entity_type: candidate.entity_type,
        canonical: candidate.canonical,
        source_phrase: hit,
        confidence: candidate.confidence,
      },
    ]
  })

  const deduped = matches.filter(
    (entry, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.entity_type === entry.entity_type &&
          candidate.canonical === entry.canonical &&
          candidate.source_phrase === entry.source_phrase,
      ) === index,
  )

  return deduped
}

const buildClarificationPrompt = (phrase: string) =>
  `Ich moechte Ihre Angabe kurz praezisieren, damit die Anamnese korrekt bleibt: "${phrase}". Meinen Sie eher ein koerperliches Symptom, eine Medikation oder den zeitlichen Verlauf?`

export const normalizeClinicalLanguageTurn = (params: {
  structuredData: StructuredIntakeData
  turnId: string
  phrase: string
  now?: Date
}) => {
  const nowIso = (params.now ?? new Date()).toISOString()
  const phrase = params.phrase.trim()

  if (!phrase) {
    return {
      structuredData: params.structuredData,
      turn: null as NormalizationTurn | null,
      clarificationPrompt: null as string | null,
    }
  }

  const mappedEntities = mapEntities(phrase)
  const detectedLanguage = detectLanguage(phrase)

  const confidenceValues = mappedEntities.map((entry) => entry.confidence)
  const avgConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : 0

  const ambiguityScore = Number((1 - avgConfidence).toFixed(2))
  const clarificationRequired = mappedEntities.length === 0 || ambiguityScore >= CLARIFICATION_THRESHOLD
  const clarificationPrompt = clarificationRequired ? buildClarificationPrompt(phrase) : null

  const turn: NormalizationTurn = {
    turn_id: params.turnId,
    source: 'patient',
    detected_language: detectedLanguage,
    original_phrase: phrase,
    mapped_entities: mappedEntities,
    ambiguity_score: ambiguityScore,
    clarification_required: clarificationRequired,
    clarification_prompt: clarificationPrompt ?? undefined,
    created_at: nowIso,
  }

  const existing = params.structuredData.language_normalization
  const turns = [...(existing?.turns ?? []), turn].slice(-50)
  const pendingClarifications = clarificationPrompt
    ? [
        ...(existing?.pending_clarifications ?? []),
        {
          turn_id: params.turnId,
          prompt: clarificationPrompt,
          ambiguity_score: ambiguityScore,
          created_at: nowIso,
        },
      ].slice(-20)
    : existing?.pending_clarifications ?? []

  return {
    structuredData: {
      ...params.structuredData,
      language_normalization: {
        version: NORMALIZATION_VERSION,
        turns,
        pending_clarifications: pendingClarifications,
        last_updated_at: nowIso,
      },
    },
    turn,
    clarificationPrompt,
  }
}
