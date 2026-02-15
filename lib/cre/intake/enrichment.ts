import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

type AnswerState = 'answered' | 'unanswered'

type MandatoryAnswer = {
  value: string | null
  state: AnswerState
}

const unanswered = (): MandatoryAnswer => ({ value: null, state: 'unanswered' })

const answered = (value: string): MandatoryAnswer => ({
  value,
  state: value.trim() ? 'answered' : 'unanswered',
})

const fromString = (value?: string | null): MandatoryAnswer => {
  if (!value || !value.trim()) return unanswered()
  return answered(value.trim())
}

const joinList = (values?: string[]) => {
  if (!values || values.length === 0) return null
  const normalized = values.map((entry) => entry.trim()).filter(Boolean)
  if (normalized.length === 0) return null
  return normalized.join('; ')
}

const parseIntensity = (values: Array<string | undefined>) => {
  const merged = values.filter(Boolean).join(' ').toLowerCase()
  const match = merged.match(/\b(10|[0-9])\s*\/\s*10\b/)
  if (!match) return null
  return `${match[1]}/10`
}

const extractNegativesFromText = (value?: string) => {
  if (!value) return []
  const normalized = value
    .split(/[\.!?\n]/)
    .map((part) => part.trim())
    .filter(Boolean)

  return normalized.filter((entry) => /\b(kein|keine|keinen|nicht)\b/i.test(entry))
}

const classifyPsychosocial = (factors: string[]) => {
  const familyHistory: string[] = []
  const socialHistory: string[] = []

  factors.forEach((factor) => {
    const normalized = factor.toLowerCase()
    if (
      normalized.includes('mutter') ||
      normalized.includes('vater') ||
      normalized.includes('famil') ||
      normalized.includes('geschwister')
    ) {
      familyHistory.push(factor)
    } else {
      socialHistory.push(factor)
    }
  })

  return { familyHistory, socialHistory }
}

export const enrichStructuredIntakeData = (structuredData: StructuredIntakeData): StructuredIntakeData => {
  const hpi = structuredData.history_of_present_illness
  const associated = hpi?.associated_symptoms ?? []
  const relieving = hpi?.relieving_factors ?? []
  const aggravating = hpi?.aggravating_factors ?? []

  const intensity = parseIntensity([
    structuredData.chief_complaint,
    hpi?.course,
    ...(associated ?? []),
  ])

  const combinedFactors = [
    joinList(aggravating) ? `Ausloeser/Verstaerker: ${joinList(aggravating)}` : null,
    joinList(relieving) ? `Lindernd: ${joinList(relieving)}` : null,
  ]
    .filter(Boolean)
    .join(' | ')

  const psychosocial = structuredData.psychosocial_factors ?? []
  const { familyHistory, socialHistory } = classifyPsychosocial(psychosocial)

  const explicitNegatives = [
    ...(structuredData.relevant_negatives ?? []),
    ...extractNegativesFromText(structuredData.chief_complaint),
    ...extractNegativesFromText(hpi?.course),
  ]

  const dedupedNegatives = Array.from(new Set(explicitNegatives.map((entry) => entry.trim()).filter(Boolean)))

  const tenW = {
    was: fromString(structuredData.chief_complaint),
    wo: fromString(joinList(associated?.filter((entry) => /brust|kopf|bauch|ruecken|arm|bein|hals|thorax/i.test(entry)))),
    wann: fromString(hpi?.onset),
    wie: fromString(hpi?.course),
    wie_stark: fromString(intensity),
    wohin: fromString(joinList(associated?.filter((entry) => /ausstrahl|arm|kiefer|ruecken/i.test(entry)))),
    wie_lange: fromString(hpi?.duration),
    wodurch: fromString(combinedFactors),
    welche: fromString(joinList(associated)),
    warum: fromString((structuredData.uncertainties ?? [])[0]),
  }

  const opqrst = {
    onset: fromString(hpi?.onset),
    provocation: fromString(joinList(aggravating)),
    palliation: fromString(joinList(relieving)),
    quality: fromString(hpi?.course),
    region_radiation: fromString(
      joinList([
        structuredData.chief_complaint ?? '',
        ...(associated?.filter((entry) => /ausstrahl|arm|kiefer|ruecken|thorax/i.test(entry)) ?? []),
      ].filter(Boolean)),
    ),
    severity: fromString(intensity),
    timing: fromString(joinList([hpi?.onset ?? '', hpi?.duration ?? '', hpi?.course ?? ''].filter(Boolean))),
  }

  const completenessTargets: Array<[string, boolean]> = [
    ['chief_complaint', tenW.was.state === 'answered'],
    ['hpi_onset', tenW.wann.state === 'answered'],
    ['hpi_duration', tenW.wie_lange.state === 'answered'],
    ['hpi_course', tenW.wie.state === 'answered'],
    ['associated_symptoms', tenW.welche.state === 'answered'],
    ['aggravating_or_relieving_factors', tenW.wodurch.state === 'answered'],
    ['relevant_negatives', dedupedNegatives.length > 0],
    ['past_medical_history', (structuredData.past_medical_history?.length ?? 0) > 0],
    ['medication', (structuredData.medication?.length ?? 0) > 0],
    ['psychosocial_factors', psychosocial.length > 0],
  ]

  const answeredFields = completenessTargets.filter(([, ok]) => ok).length
  const totalFields = completenessTargets.length
  const completenessScore = Number((answeredFields / totalFields).toFixed(2))

  const teachBackSummaryParts = [
    tenW.was.value ? `Leitsymptom: ${tenW.was.value}` : null,
    tenW.wann.value ? `Beginn: ${tenW.wann.value}` : null,
    tenW.wie_lange.value ? `Dauer: ${tenW.wie_lange.value}` : null,
    tenW.welche.value ? `Begleitend: ${tenW.welche.value}` : null,
  ].filter(Boolean)

  return {
    ...structuredData,
    relevant_negatives: dedupedNegatives,
    ten_w: tenW,
    opqrst,
    background_anamnesis: {
      past_medical_history: structuredData.past_medical_history ?? [],
      medications: structuredData.medication ?? [],
      allergies: [],
      family_history: familyHistory,
      social_history: socialHistory,
      review_of_systems: associated,
    },
    explicit_negatives: dedupedNegatives.map((text) => ({
      text,
      category: 'symptom' as const,
      source: 'llm' as const,
    })),
    teach_back: {
      summary:
        teachBackSummaryParts.length > 0
          ? teachBackSummaryParts.join(' | ')
          : 'Bitte bestaetigen Sie die zusammengefassten Angaben (Teach-Back).',
      confirmed: false,
      missing_points: completenessTargets
        .filter(([, ok]) => !ok)
        .map(([field]) => field),
    },
    completeness: {
      score: completenessScore,
      answered_fields: answeredFields,
      total_fields: totalFields,
      missing_fields: completenessTargets
        .filter(([, ok]) => !ok)
        .map(([field]) => field),
    },
  }
}
