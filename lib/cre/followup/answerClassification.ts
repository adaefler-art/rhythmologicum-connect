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

const levenshteinDistance = (left: string, right: string) => {
  if (left === right) return 0
  if (!left.length) return right.length
  if (!right.length) return left.length

  const dp = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0))

  for (let i = 0; i <= left.length; i += 1) dp[i][0] = i
  for (let j = 0; j <= right.length; j += 1) dp[0][j] = j

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + substitutionCost,
      )
    }
  }

  return dp[left.length][right.length]
}

const NEGATIVE_SHORT_FORMS = ['nein', 'no', 'none', 'nope', 'nee']

const isLikelyNegativeShortAnswer = (value: string) => {
  if (!value) return false
  if (NEGATIVE_SHORT_FORMS.includes(value)) return true
  if (!/^[a-z]{2,6}$/.test(value)) return false
  if (!value.startsWith('ne') && !value.startsWith('no')) return false

  return NEGATIVE_SHORT_FORMS.some((canonical) => levenshteinDistance(value, canonical) <= 1)
}

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
  isLikelyNegativeShortAnswer(answer) ||
  /keine medikamente|nehme nichts|none reported|no medication|nichts/.test(answer)

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
    if (isLikelyNegativeShortAnswer(normalizedShortAnswer)) return 'answered'
    if (YES_ONLY.test(normalizedShortAnswer)) return 'partial'
    if (hasMedicationSignal(answer) || hasNoneSignal(answer) || noneMapped || medicationMapped) {
      return 'answered'
    }
    if (answer.length >= 6) return 'partial'
    return 'unclear'
  }

  if (YES_ONLY.test(normalizedShortAnswer) || isLikelyNegativeShortAnswer(normalizedShortAnswer)) {
    return 'partial'
  }

  if (answer.length < 6) return 'partial'

  return 'answered'
}
