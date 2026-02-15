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

const YES_ONLY = /^(ja|yes|jap|yep|yeah)$/
const NO_ONLY = /^(nein|no|nope)$/

const PRIOR_CONTEXT_REFERENCE_PATTERNS = [
  /(bereits|schon)\s+(genannt|angegeben)/,
  /habe\s+ich\s+(bereits|schon)\s+(genannt|angegeben)/,
  /(du|sie|ihr)\s+kennst?\s+.*(bereits|schon)/,
  /(steht|siehe)\s+.*(daten|anamnese|oben)/,
  /already\s+(mentioned|provided|stated)/,
  /as\s+(mentioned|stated)/,
]

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

const hasPriorContextReference = (answer: string) =>
  PRIOR_CONTEXT_REFERENCE_PATTERNS.some((pattern) => pattern.test(answer))

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
  const normalizedShortAnswer = answer.replace(/[.!?,;:]+$/g, '').trim()

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

  if (params.askedQuestionIds.length > 0 && hasPriorContextReference(answer)) {
    return 'answered'
  }

  if (context === 'medication') {
    if (NO_ONLY.test(normalizedShortAnswer)) return 'answered'
    if (YES_ONLY.test(normalizedShortAnswer)) return 'partial'
    if (hasMedicationSignal(answer) || hasNoneSignal(answer) || noneMapped || medicationMapped) {
      return 'answered'
    }
    if (answer.length >= 6) return 'partial'
    return 'unclear'
  }

  if (YES_ONLY.test(normalizedShortAnswer) || NO_ONLY.test(normalizedShortAnswer)) return 'partial'

  if (answer.length < 6) return 'partial'

  return 'answered'
}
