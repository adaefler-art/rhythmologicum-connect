export type TurnQualityLabel =
  | 'clinical_or_ambiguous'
  | 'boundary_test'
  | 'nonsense_noise'

export type TurnQualityAssessment = {
  label: TurnQualityLabel
  shouldRedirect: boolean
  reason: string
}

const BOUNDARY_TEST_PATTERNS = [
  /grenzen\s*testen/i,
  /ich\s*teste/i,
  /ignore|ignoriere/i,
  /system\s*prompt/i,
  /prompt\s*injection/i,
  /jailbreak/i,
  /rolle\s*wechseln|role\s*play/i,
  /anweisungen\s*umgehen|rules?\s*bypass/i,
  /du\s*bist\s*jetzt\s*kein\s*arzt/i,
]

const NO_CLINICAL_INTENT_PATTERNS = [
  /keine\s+echten\s+symptome/i,
  /keine\s+beschwerden/i,
  /nur\s+test/i,
  /nur\s+zum\s+testen/i,
  /nicht\s+medizinisch/i,
]

const CLINICAL_SIGNAL_PATTERNS = [
  /schmerz|schmerzen|druck/i,
  /atem|luftnot|dyspnoe/i,
  /herz|brust|palpitation|stolper/i,
  /schwindel|ohnmacht|synkope/i,
  /fieber|husten|uebelkeit|erbrechen|durchfall/i,
  /kopfschmerz|migr[aä]ne/i,
  /seit\s+\d+|stunden|tagen|wochen|monaten/i,
  /medik|allerg|vorerkrank|symptom|beschwerde/i,
]

const NOISE_PATTERNS = [
  /^(.)\1{7,}$/,
  /^(asdf|qwer|yxcv|lorem|bla){2,}$/i,
  /^[\W_\d]{8,}$/,
]

function normalizeInput(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function hasClinicalSignal(text: string) {
  return CLINICAL_SIGNAL_PATTERNS.some((pattern) => pattern.test(text))
}

function isLikelyNoise(text: string) {
  if (NOISE_PATTERNS.some((pattern) => pattern.test(text))) return true

  const letters = text.replace(/[^a-z]/gi, '')
  const ratio = text.length > 0 ? letters.length / text.length : 0
  return text.length >= 16 && ratio < 0.35
}

export function assessTurnQuality(message: string): TurnQualityAssessment {
  const normalized = normalizeInput(message)

  if (!normalized) {
    return {
      label: 'clinical_or_ambiguous',
      shouldRedirect: false,
      reason: 'empty_after_normalization',
    }
  }

  const clinicalSignal = hasClinicalSignal(normalized)
  const boundarySignal = BOUNDARY_TEST_PATTERNS.some((pattern) => pattern.test(normalized))
  const explicitNoClinicalIntent = NO_CLINICAL_INTENT_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  )

  if (boundarySignal && explicitNoClinicalIntent) {
    return {
      label: 'boundary_test',
      shouldRedirect: true,
      reason: 'boundary_signal_with_explicit_no_clinical_intent',
    }
  }

  if (!clinicalSignal && boundarySignal) {
    return {
      label: 'boundary_test',
      shouldRedirect: true,
      reason: 'boundary_signal_without_clinical_content',
    }
  }

  if (!clinicalSignal && isLikelyNoise(normalized)) {
    return {
      label: 'nonsense_noise',
      shouldRedirect: true,
      reason: 'nonsense_or_noise_without_clinical_content',
    }
  }

  return {
    label: 'clinical_or_ambiguous',
    shouldRedirect: false,
    reason: clinicalSignal ? 'clinical_signal_detected' : 'ambiguous_but_allowed',
  }
}

export function buildGuardRedirectReply(assessment: TurnQualityAssessment): string {
  if (assessment.label === 'boundary_test') {
    return 'Ich bleibe bei einer medizinisch sinnvollen, krankheitsbild-agnostischen Anamnese. Bitte nennen Sie Ihr Hauptsymptom und seit wann es besteht.'
  }

  if (assessment.label === 'nonsense_noise') {
    return 'Ich kann mit der letzten Nachricht medizinisch nicht sicher arbeiten. Bitte beschreiben Sie kurz Hauptsymptom, Beginn und Verlauf.'
  }

  return 'Bitte beschreiben Sie Ihr aktuelles Hauptsymptom und seit wann es besteht.'
}
