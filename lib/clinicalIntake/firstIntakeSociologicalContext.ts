const FIRST_INTAKE_FUNNEL_SLUG = 'first-intake-sociological-anamnesis'

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => any
  }
}

type AssessmentAnswerRow = {
  question_id: string
  answer_data: unknown
  answer_value: number | null
}

type FirstIntakeContext = {
  assessmentId: string
  lines: string[]
  contextText: string
  psychosocialFactors: string[]
}

const QUESTION_LABELS: Record<string, string> = {
  'q1-household-size': 'Haushaltsgröße',
  'q2-living-situation': 'Wohnsituation',
  'q3-care-responsibilities': 'Pflege-/Betreuungsverantwortung',
  'q4-housing-stability': 'Stabilität der Wohnsituation',
  'q5-social-support': 'Soziale Unterstützung',
  'q6-contact-frequency': 'Kontaktfrequenz',
  'q7-loneliness': 'Einsamkeitsempfinden',
  'q8-support-sources': 'Unterstützungsquellen',
  'q9-employment-status': 'Berufliche Situation',
  'q10-financial-stress': 'Finanzielle Belastung',
  'q11-language-barriers': 'Sprachliche Hürden',
  'q12-primary-concern': 'Primäre soziale Belastung',
}

const VALUE_LABELS: Record<string, Record<string, string>> = {
  'q2-living-situation': {
    alone: 'Allein',
    partner: 'Mit Partner:in',
    family: 'Mit Familie/Kinder',
    shared: 'Wohngemeinschaft',
    other: 'Andere Situation',
  },
  'q3-care-responsibilities': {
    yes: 'Ja',
    no: 'Nein',
  },
  'q6-contact-frequency': {
    daily: 'Täglich',
    weekly: 'Mehrmals pro Woche',
    monthly: 'Mehrmals pro Monat',
    rarely: 'Selten',
  },
  'q8-support-sources': {
    family: 'Familie',
    friends: 'Freunde',
    neighbors: 'Nachbarschaft',
    professional: 'Professionelle Unterstützung',
    none: 'Keine Unterstützung',
  },
  'q9-employment-status': {
    full_time: 'Vollzeit beschäftigt',
    part_time: 'Teilzeit beschäftigt',
    self_employed: 'Selbstständig',
    unemployed: 'Nicht beschäftigt',
    retired: 'Rente/Pension',
    other: 'Andere Situation',
  },
  'q11-language-barriers': {
    yes: 'Ja',
    no: 'Nein',
  },
}

function normalizeValue(questionId: string, rawValue: unknown): string | null {
  if (rawValue === null || rawValue === undefined) return null

  if (Array.isArray(rawValue)) {
    const mapped = rawValue
      .map((entry) => normalizeValue(questionId, entry))
      .filter((entry): entry is string => Boolean(entry))
    return mapped.length > 0 ? mapped.join(', ') : null
  }

  if (typeof rawValue === 'number') return String(rawValue)
  if (typeof rawValue === 'boolean') return rawValue ? 'Ja' : 'Nein'

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim()
    if (!trimmed) return null
    const mapped = VALUE_LABELS[questionId]?.[trimmed]
    return mapped || trimmed
  }

  return null
}

function toNumeric(rawValue: unknown): number | null {
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) return rawValue
  if (typeof rawValue === 'string' && rawValue.trim()) {
    const parsed = Number(rawValue)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function buildPsychosocialFactors(answerMap: Map<string, unknown>): string[] {
  const factors: string[] = []

  const supportLevel = toNumeric(answerMap.get('q5-social-support'))
  if (supportLevel !== null && supportLevel <= 2) {
    factors.push(`Geringe soziale Unterstützung (${supportLevel}/5)`) 
  }

  const lonelinessLevel = toNumeric(answerMap.get('q7-loneliness'))
  if (lonelinessLevel !== null && lonelinessLevel >= 4) {
    factors.push(`Erhöhtes Einsamkeitsempfinden (${lonelinessLevel}/5)`)
  }

  const financialStress = toNumeric(answerMap.get('q10-financial-stress'))
  if (financialStress !== null && financialStress >= 4) {
    factors.push(`Hohe finanzielle Belastung (${financialStress}/5)`)
  }

  const languageBarriers = normalizeValue('q11-language-barriers', answerMap.get('q11-language-barriers'))
  if (languageBarriers === 'Ja') {
    factors.push('Sprachliche Hürden beim Zugang zu Gesundheitsangeboten')
  }

  const careResponsibilities = normalizeValue(
    'q3-care-responsibilities',
    answerMap.get('q3-care-responsibilities'),
  )
  if (careResponsibilities === 'Ja') {
    factors.push('Regelmäßige Pflege- oder Betreuungsverantwortung')
  }

  const primaryConcern = normalizeValue('q12-primary-concern', answerMap.get('q12-primary-concern'))
  if (primaryConcern) {
    factors.push(`Genannte Hauptbelastung: ${primaryConcern}`)
  }

  return factors
}

export async function getFirstIntakeSociologicalAssessmentContext(
  userId: string,
  supabase: SupabaseLike,
): Promise<FirstIntakeContext | null> {
  const { data: patientProfile, error: profileError } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (profileError || !patientProfile?.id) {
    return null
  }

  const { data: latestAssessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('id, created_at')
    .eq('funnel', FIRST_INTAKE_FUNNEL_SLUG)
    .eq('status', 'completed')
    .eq('patient_id', patientProfile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (assessmentError || !latestAssessment?.id) {
    return null
  }

  const { data: answers, error: answersError } = await supabase
    .from('assessment_answers')
    .select('question_id, answer_data, answer_value')
    .eq('assessment_id', latestAssessment.id)

  if (answersError || !answers || answers.length === 0) {
    return null
  }

  const answerRows = answers as AssessmentAnswerRow[]
  const answerMap = new Map<string, unknown>()
  const lines: string[] = []

  for (const row of answerRows) {
    const label = QUESTION_LABELS[row.question_id]
    if (!label) continue

    const rawValue = row.answer_data ?? row.answer_value
    answerMap.set(row.question_id, rawValue)

    const normalized = normalizeValue(row.question_id, rawValue)
    if (!normalized) continue

    lines.push(`${label}: ${normalized}`)
  }

  const psychosocialFactors = buildPsychosocialFactors(answerMap)

  if (lines.length === 0 && psychosocialFactors.length === 0) {
    return null
  }

  const contextBlocks = [
    'Erstaufnahme Soziologische Anamnese (vorliegende strukturierte Antworten):',
    ...lines.map((line) => `- ${line}`),
  ]

  if (psychosocialFactors.length > 0) {
    contextBlocks.push('Abgeleitete psychosoziale Faktoren:')
    contextBlocks.push(...psychosocialFactors.map((factor) => `- ${factor}`))
  }

  return {
    assessmentId: latestAssessment.id,
    lines,
    contextText: contextBlocks.join('\n'),
    psychosocialFactors,
  }
}

export function mergePsychosocialFactors(
  existingFactors: string[] | undefined,
  additionalFactors: string[],
): string[] {
  const merged = new Set<string>()
  for (const factor of existingFactors || []) {
    if (typeof factor === 'string' && factor.trim()) merged.add(factor.trim())
  }
  for (const factor of additionalFactors) {
    if (typeof factor === 'string' && factor.trim()) merged.add(factor.trim())
  }
  return Array.from(merged)
}
