export type FollowupAnswerClassification =
  | 'answered'
  | 'partial'
  | 'unclear'
  | 'contradiction'

type NormalizationTurnLike = {
  mapped_entities?: Array<{
    canonical?: string
    entity_type?: string
  }>
} | null

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

const UNCLEAR_PATTERNS = [
  /^\?+$/,
  /^ok+$/,
  /^hmm+$/,
  /^weiss nicht$/,
  /^weiß nicht$/,
  /^keine ahnung$/,
  /^unbekannt$/,
  /^kann ich nicht sagen$/,
]

const YES_NO_ONLY = /^(ja|nein|yes|no|jap|nope)$/

const inferContext = (askedQuestionIds: string[], askedQuestionText?: string) => {
  const text = normalize(`${askedQuestionIds.join(' ')} ${askedQuestionText ?? ''}`)

  if (/medik|medication|nahrungserga|supplement/.test(text)) return 'medication'
  if (/onset|beginn|seit wann/.test(text)) return 'onset'
  if (/duration|dauer|wie lange/.test(text)) return 'duration'
  if (/course|verlauf|verbessert|verschlechtert/.test(text)) return 'course'
  if (/psycho|stress|alltag|schlaf|belastung/.test(text)) return 'psychosocial'
  if (/chief|hauptanliegen|hauptsymptom|leitsymptom/.test(text)) return 'chief_complaint'

  return 'generic'
}

const hasMedicationSignal = (answer: string) =>
  /omega|ibuprofen|aspirin|metformin|medik|medication|vitamin|supplement|nahrungserga/.test(answer)

const hasNoneSignal = (answer: string) =>
  /keine medikamente|nehme nichts|none|no medication|nichts/.test(answer)

const mappedCanonicals = (normalizationTurn: NormalizationTurnLike) =>
  new Set(
    (normalizationTurn?.mapped_entities ?? [])
      .map((entry) => (typeof entry.canonical === 'string' ? entry.canonical : ''))
      .filter(Boolean),
  )

export const classifyFollowupAnswer = (params: {
  askedQuestionIds: string[]
  askedQuestionText?: string
  answerText?: string
  normalizationTurn?: NormalizationTurnLike
}): FollowupAnswerClassification => {
  const rawAnswer = params.answerText?.trim() ?? ''
  if (!rawAnswer) return 'unclear'

  const answer = normalize(rawAnswer)

  if (rawAnswer.length < 2 || UNCLEAR_PATTERNS.some((pattern) => pattern.test(answer))) {
    return 'unclear'
  }

  const context = inferContext(params.askedQuestionIds, params.askedQuestionText)
  const canonicals = mappedCanonicals(params.normalizationTurn ?? null)

  const noneMapped = canonicals.has('none_reported')
  const medicationMapped = Array.from(canonicals).some(
    (canonical) => canonical !== 'none_reported' && canonical.includes('_'),
  )

  if ((hasNoneSignal(answer) && hasMedicationSignal(answer)) || (noneMapped && medicationMapped)) {
    return 'contradiction'
  }

  if (context === 'medication') {
    if (YES_NO_ONLY.test(answer)) return 'partial'
    if (hasMedicationSignal(answer) || hasNoneSignal(answer) || noneMapped || medicationMapped) {
      return 'answered'
    }
    if (answer.length >= 6) return 'partial'
    return 'unclear'
  }

  if (YES_NO_ONLY.test(answer)) return 'partial'

  if (answer.length < 6) return 'partial'

  return 'answered'
}
