import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'
import type { ClinicalReasoningConfig } from './config'
import type { ClinicalReasoningPack, ReasoningLikelihood } from '@/lib/types/clinicalIntake'

const likelihoodWeight: Record<ReasoningLikelihood, number> = {
  low: 1,
  medium: 2,
  high: 3,
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

const hasTerm = (text: string, term: string) => normalize(text).includes(normalize(term))

const GP_ADAPTER_V1 = {
  domain: 'gp' as const,
  version: 'gp-v1.0.0',
  hypothesisPriors: {
    [normalize('panic-like autonomic episode')]: 'medium' as const,
    [normalize('stress reactivity')]: 'low' as const,
    [normalize('musculoskeletal chest pain')]: 'medium' as const,
    [normalize('viral respiratory syndrome')]: 'low' as const,
  },
  escalationThresholds: {
    high: 7,
    medium: 3,
  },
  questionLibrary: [
    {
      condition_label: 'Panic-like autonomic episode',
      questions: [
        { text: 'Gab es in den letzten Tagen wiederkehrende Ausloeser im Alltag?', priority: 2 as const },
        { text: 'Welche Koerperzeichen treten waehrend der Episode zuerst auf?', priority: 2 as const },
      ],
    },
    {
      condition_label: 'Musculoskeletal chest pain',
      questions: [
        { text: 'Ist der Schmerz durch Bewegung, Druck oder Lagewechsel reproduzierbar?', priority: 1 as const },
        { text: 'Gab es ungewohnte koerperliche Belastungen vor Symptombeginn?', priority: 2 as const },
      ],
    },
  ],
  shortAnamnesisTemplate: [
    'Leitsymptom + Beginn',
    'Verlauf + Trigger/Linderung',
    'Red Flags + relevante Negativa',
    'Medikation + Vorerkrankungen',
    'Naechster diagnostischer Schritt',
  ],
}

const resolvePriorLikelihood = (params: {
  conditionLabel: string
  fallback: ReasoningLikelihood
}) => {
  const { conditionLabel, fallback } = params
  const normalizedLabel = normalize(conditionLabel)
  return GP_ADAPTER_V1.hypothesisPriors[normalizedLabel] ?? fallback
}

const escalateLikelihood = (base: ReasoningLikelihood, steps: number): ReasoningLikelihood => {
  const order: ReasoningLikelihood[] = ['low', 'medium', 'high']
  const current = order.indexOf(base)
  const next = Math.max(0, Math.min(order.length - 1, current + steps))
  return order[next]
}

const gatherTextContext = (structuredData: StructuredIntakeData) => {
  const parts: string[] = []

  if (structuredData.chief_complaint) parts.push(structuredData.chief_complaint)

  const hpi = structuredData.history_of_present_illness
  if (hpi) {
    if (hpi.onset) parts.push(hpi.onset)
    if (hpi.duration) parts.push(hpi.duration)
    if (hpi.course) parts.push(hpi.course)
    parts.push(...(hpi.associated_symptoms ?? []))
    parts.push(...(hpi.relieving_factors ?? []))
    parts.push(...(hpi.aggravating_factors ?? []))
  }

  parts.push(...(structuredData.relevant_negatives ?? []))
  parts.push(...(structuredData.past_medical_history ?? []))
  parts.push(...(structuredData.medication ?? []))
  parts.push(...(structuredData.psychosocial_factors ?? []))
  parts.push(...(structuredData.uncertainties ?? []))

  return parts.join(' | ')
}

const getVerifiedRedFlagCount = (structuredData: StructuredIntakeData) => {
  const triggered = structuredData.safety?.triggered_rules ?? []
  return triggered.filter((rule) => {
    if (rule.verified !== true) return false

    const severity = rule.severity ?? rule.level
    return severity === 'A' || severity === 'B'
  }).length
}

const estimateChronicitySignal = (structuredData: StructuredIntakeData) => {
  const duration = structuredData.history_of_present_illness?.duration
  if (!duration) return 0

  const normalized = normalize(duration)
  if (/jahr|monate|monat|wochen|woche/.test(normalized)) return 2
  if (/tage|tag/.test(normalized)) return 1
  return 0
}

const estimateAnxietySignal = (structuredData: StructuredIntakeData) => {
  const context = gatherTextContext(structuredData)
  const markers = ['angst', 'panik', 'nervos', 'anxiety', 'panic']
  return markers.some((marker) => hasTerm(context, marker)) ? 1 : 0
}

const getEffectiveSafetyLevel = (structuredData: StructuredIntakeData) => {
  const safety = structuredData.safety
  if (!safety) return null

  return (
    safety.effective_level ??
    safety.effective_policy_result?.escalation_level ??
    safety.policy_result?.escalation_level ??
    safety.escalation_level ??
    null
  )
}

const hasHardRiskMarkers = (evidenceText: string) => {
  const markers = [
    'brustschmerz seit 30',
    'ich will mich umbringen',
    'habe einen plan',
    'starke atemnot',
    'cannot breathe',
  ]

  return markers.some((marker) => hasTerm(evidenceText, marker))
}

export const generateReasoningPack = (
  intake: StructuredIntakeData,
  activeReasoningConfig: ClinicalReasoningConfig,
): ClinicalReasoningPack => {
  const adapter = GP_ADAPTER_V1
  const evidenceText = gatherTextContext(intake)
  const verifiedRedFlags = getVerifiedRedFlagCount(intake)
  const chronicitySignal = estimateChronicitySignal(intake)
  const anxietySignal = estimateAnxietySignal(intake)

  const rawRiskScore =
    verifiedRedFlags * activeReasoningConfig.risk_weighting.red_flag_weight +
    chronicitySignal * activeReasoningConfig.risk_weighting.chronicity_weight +
    anxietySignal * activeReasoningConfig.risk_weighting.anxiety_modifier

  const boundedRiskScore = Math.max(0, Number(rawRiskScore.toFixed(2)))
  let riskLevel: ReasoningLikelihood =
    boundedRiskScore >= adapter.escalationThresholds.high
      ? 'high'
      : boundedRiskScore >= adapter.escalationThresholds.medium
        ? 'medium'
        : 'low'

  const effectiveSafetyLevel = getEffectiveSafetyLevel(intake)
  if (effectiveSafetyLevel === 'A') {
    riskLevel = 'high'
  } else if (riskLevel === 'high' && verifiedRedFlags === 0 && !hasHardRiskMarkers(evidenceText)) {
    riskLevel = 'medium'
  }

  const differentials = activeReasoningConfig.differential_templates
    .map((template) => {
      const matchedTriggers = template.trigger_terms.filter((term) => hasTerm(evidenceText, term))
      if (matchedTriggers.length === 0) return null

      const missingRequired = (template.required_terms ?? []).some((term) => !hasTerm(evidenceText, term))
      if (missingRequired) return null

      const hasExclusion = (template.exclusions ?? []).some((term) => hasTerm(evidenceText, term))
      if (hasExclusion) return null

      const likelihoodStep = riskLevel === 'high' ? 1 : 0
      const priorLikelihood = resolvePriorLikelihood({ conditionLabel: template.label, fallback: template.base_likelihood })
      const likelihood = escalateLikelihood(priorLikelihood, likelihoodStep)

      return {
        label: template.label,
        likelihood,
        matched_triggers: matchedTriggers,
        base_likelihood: template.base_likelihood,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => {
      const likelihoodDelta = likelihoodWeight[b.likelihood] - likelihoodWeight[a.likelihood]
      if (likelihoodDelta !== 0) return likelihoodDelta
      return b.matched_triggers.length - a.matched_triggers.length
    })

  const differentialLabels = new Set(differentials.map((entry) => entry.label.toLowerCase()))

  const configOpenQuestions = activeReasoningConfig.open_question_templates
    .filter((template) => differentialLabels.has(template.condition_label.toLowerCase()))
    .flatMap((template) =>
      template.questions.map((question) => ({
        condition_label: template.condition_label,
        text: question.text,
        priority: question.priority,
      })),
    )
  const adapterOpenQuestions = adapter.questionLibrary
    .filter((template) => differentialLabels.has(template.condition_label.toLowerCase()))
    .flatMap((template) =>
      template.questions.map((question) => ({
        condition_label: template.condition_label,
        text: question.text,
        priority: question.priority,
      })),
    )

  const openQuestions = [...configOpenQuestions, ...adapterOpenQuestions]
    .filter((entry, index, array) =>
      array.findIndex(
        (candidate) =>
          candidate.condition_label === entry.condition_label &&
          candidate.text === entry.text &&
          candidate.priority === entry.priority,
      ) === index,
    )
    .sort((a, b) => a.priority - b.priority)

  const recommendedNextSteps: string[] = []
  if (riskLevel === 'high') {
    recommendedNextSteps.push('Zeitnahe klinische Priorisierung und unmittelbare Red-Flag-Abklaerung.')
  } else if (riskLevel === 'medium') {
    recommendedNextSteps.push('Gezielte zeitnahe Verlaufsklaerung und differenzialdiagnostische Vertiefung.')
  } else {
    recommendedNextSteps.push('Strukturierte ambulante Abklaerung und Symptomverlauf dokumentieren.')
  }

  if (verifiedRedFlags > 0) {
    recommendedNextSteps.push('Verifizierte Red Flags priorisiert erneut pruefen und dokumentieren.')
  }

  if (openQuestions.length > 0) {
    recommendedNextSteps.push('Priorisierte offene Fragen im naechsten Kontakt systematisch klaeren.')
  }

  const uncertainties = [...(intake.uncertainties ?? [])]
  if (differentials.length === 0) {
    uncertainties.push('Keine Differentialdiagnose konnte auf konfigurierte Trigger-Terms zurueckgefuehrt werden.')
  }

  const uncertaintyItems = uncertainties.map((message, index) => ({
    code: `uncertainty_${index + 1}`,
    message,
    severity: 'medium' as const,
  }))

  const conflicts: ClinicalReasoningPack['conflicts'] = []
  if (intake.safety?.contradictions_present) {
    conflicts.push({
      code: 'safety_contradictions_present',
      message: 'Safety-Modul meldet Widerspruch zwischen positiven Aussagen und expliziten Negativa.',
      severity: 'high',
      related_fields: ['safety.contradictions_present', 'explicit_negatives'],
    })
  }
  if (effectiveSafetyLevel === 'A' && riskLevel !== 'high') {
    conflicts.push({
      code: 'risk_below_safety_escalation',
      message: 'Reasoning-Risiko unterschreitet Safety-Level A und wurde technisch priorisiert.',
      severity: 'high',
      related_fields: ['reasoning.risk_estimation.level', 'safety.effective_level'],
    })
  }

  return {
    risk_estimation: {
      score: boundedRiskScore,
      level: riskLevel,
      components: {
        verified_red_flags: verifiedRedFlags,
        chronicity_signal: chronicitySignal,
        anxiety_signal: anxietySignal,
      },
    },
    differentials,
    open_questions: openQuestions,
    recommended_next_steps: recommendedNextSteps,
    uncertainties,
    uncertainty_items: uncertaintyItems,
    conflicts,
    safety_alignment: {
      blocked_by_safety: effectiveSafetyLevel === 'A',
      effective_level: effectiveSafetyLevel,
      rationale:
        effectiveSafetyLevel === 'A'
          ? 'Safety-Level A priorisiert klinische Eskalation vor differenzialdiagnostischer Gewichtung.'
          : 'Kein Safety-Blocking aktiv, Reasoning folgt domaenenspezifischen Priors/Schwellen.',
    },
    adapter: {
      domain: adapter.domain,
      version: adapter.version,
      escalation_thresholds: {
        high: adapter.escalationThresholds.high,
        medium: adapter.escalationThresholds.medium,
      },
      short_anamnesis_template: [...adapter.shortAnamnesisTemplate],
    },
  }
}
