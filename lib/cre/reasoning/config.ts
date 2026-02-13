import { z } from 'zod'

export const RISK_WEIGHT_RANGES = {
  red_flag_weight: { min: 0, max: 10 },
  chronicity_weight: { min: 0, max: 10 },
  anxiety_modifier: { min: -5, max: 5 },
} as const

export const likelihoodSchema = z.enum(['low', 'medium', 'high'])

const differentialTemplateSchema = z.object({
  label: z.string().min(1),
  trigger_terms: z.array(z.string().min(1)).min(1),
  required_terms: z.array(z.string().min(1)).optional(),
  exclusions: z.array(z.string().min(1)).optional(),
  base_likelihood: likelihoodSchema,
})

const openQuestionSchema = z.object({
  text: z.string().min(1),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

const openQuestionTemplateSchema = z.object({
  condition_label: z.string().min(1),
  questions: z.array(openQuestionSchema).min(1),
})

export const clinicalReasoningConfigSchema = z.object({
  differential_templates: z.array(differentialTemplateSchema).min(1),
  risk_weighting: z.object({
    red_flag_weight: z
      .number()
      .min(RISK_WEIGHT_RANGES.red_flag_weight.min)
      .max(RISK_WEIGHT_RANGES.red_flag_weight.max),
    chronicity_weight: z
      .number()
      .min(RISK_WEIGHT_RANGES.chronicity_weight.min)
      .max(RISK_WEIGHT_RANGES.chronicity_weight.max),
    anxiety_modifier: z
      .number()
      .min(RISK_WEIGHT_RANGES.anxiety_modifier.min)
      .max(RISK_WEIGHT_RANGES.anxiety_modifier.max),
  }),
  open_question_templates: z.array(openQuestionTemplateSchema).min(1),
})

export type ClinicalReasoningConfig = z.infer<typeof clinicalReasoningConfigSchema>

export const defaultClinicalReasoningConfig: ClinicalReasoningConfig = {
  differential_templates: [
    {
      label: 'Panic-like autonomic episode',
      trigger_terms: ['herzrasen', 'panik', 'angst', 'schwindel'],
      required_terms: ['herzrasen'],
      exclusions: ['brustschmerz seit 30 minuten'],
      base_likelihood: 'medium',
    },
  ],
  risk_weighting: {
    red_flag_weight: 3,
    chronicity_weight: 2,
    anxiety_modifier: 1,
  },
  open_question_templates: [
    {
      condition_label: 'Panic-like autonomic episode',
      questions: [
        { text: 'Wann treten die Episoden auf und wie lange dauern sie?', priority: 1 },
        { text: 'Gibt es ausloesende Situationen oder Belastungen?', priority: 2 },
      ],
    },
  ],
}

export const validateClinicalReasoningConfig = (config: unknown) => {
  const parsed = clinicalReasoningConfigSchema.safeParse(config)
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.issues.map((issue) => issue.message),
    }
  }

  return {
    ok: true as const,
    errors: [] as string[],
    value: parsed.data,
  }
}

export const guardReasoningActivation = (config: unknown) => {
  const validation = validateClinicalReasoningConfig(config)
  if (!validation.ok) {
    return {
      ok: false as const,
      errors: validation.errors,
    }
  }

  const errors: string[] = []

  if (validation.value.differential_templates.some((template) => !template.label.trim())) {
    errors.push('Differential templates require a non-empty label.')
  }

  if (validation.value.open_question_templates.some((template) => template.questions.length === 0)) {
    errors.push('Open question templates must not be empty.')
  }

  return {
    ok: errors.length === 0,
    errors,
    value: validation.value,
  }
}
