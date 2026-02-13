import { z } from 'zod'
import { ALLOWED_INTAKE_EVIDENCE_FIELDS } from '@/lib/cre/safety/intakeEvidence'

export type RuleQualifierGroup = {
  id: string
  patterns: string[]
}

export type RuleLogicConfig = {
  patterns: string[]
  qualifiers?: {
    requires_any_of?: RuleQualifierGroup[]
    requires_all_of?: RuleQualifierGroup[]
  }
  exclusions?: string[]
  exclusion_mode?: 'always' | 'only_if_unqualified'
  a_level_requires_any_of?: RuleQualifierGroup[]
  requires_verified_evidence?: boolean
  intake_evidence_fields?: string[]
}

export type RuleDefaults = {
  level_default?: 'A' | 'B' | 'C'
  action_default?: 'none' | 'warn' | 'require_confirm' | 'hard_stop'
}

const qualifierGroupSchema = z.object({
  id: z.string().min(1),
  patterns: z.array(z.string().min(1)).min(1),
})

const qualifiersSchema = z.object({
  requires_any_of: z.array(qualifierGroupSchema).optional(),
  requires_all_of: z.array(qualifierGroupSchema).optional(),
})

export const ruleLogicSchema = z.object({
  patterns: z.array(z.string().min(1)).min(1),
  qualifiers: qualifiersSchema.optional(),
  exclusions: z.array(z.string().min(1)).optional(),
  exclusion_mode: z.enum(['always', 'only_if_unqualified']).optional(),
  a_level_requires_any_of: z.array(qualifierGroupSchema).optional(),
  requires_verified_evidence: z.boolean().optional(),
  intake_evidence_fields: z.array(z.enum(ALLOWED_INTAKE_EVIDENCE_FIELDS)).optional(),
})

export const ruleDefaultsSchema = z.object({
  level_default: z.enum(['A', 'B', 'C']).optional(),
  action_default: z.enum(['none', 'warn', 'require_confirm', 'hard_stop']).optional(),
})

export const validateRuleConfig = (config: unknown) => {
  const parsed = ruleLogicSchema.safeParse(config)
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.issues.map((issue) => issue.message),
    }
  }

  return {
    ok: true as const,
    errors: [],
    value: parsed.data as RuleLogicConfig,
  }
}

export const validateHardStopSafety = (params: {
  ruleKey: string
  defaults?: RuleDefaults | null
  logic: RuleLogicConfig
}) => {
  const { ruleKey, defaults, logic } = params
  const errors: string[] = []

  const requiresVerified =
    defaults?.level_default === 'A' || defaults?.action_default === 'hard_stop'

  if (requiresVerified && logic.requires_verified_evidence !== true) {
    errors.push('A-level or hard-stop rules must require verified evidence.')
  }

  if (
    ruleKey === 'SFTY-2.1-R-SUICIDAL-IDEATION' &&
    defaults?.level_default === 'A' &&
    (!logic.a_level_requires_any_of || logic.a_level_requires_any_of.length === 0)
  ) {
    errors.push('Suicidal A-level requires intent/plan/means qualifiers.')
  }

  if (Array.isArray(logic.intake_evidence_fields)) {
    const allowed = new Set(ALLOWED_INTAKE_EVIDENCE_FIELDS)
    const invalid = logic.intake_evidence_fields.filter((field) => !allowed.has(field))
    if (invalid.length > 0) {
      errors.push('Intake evidence fields must be whitelisted.')
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

export const guardRuleActivation = (params: {
  ruleKey: string
  logic: unknown
  defaults?: unknown
}) => {
  const configResult = validateRuleConfig(params.logic)
  if (!configResult.ok) {
    return { ok: false, errors: configResult.errors }
  }

  const defaultsParsed = ruleDefaultsSchema.safeParse(params.defaults ?? {})
  if (!defaultsParsed.success) {
    return { ok: false, errors: defaultsParsed.error.issues.map((issue) => issue.message) }
  }

  const hardStopResult = validateHardStopSafety({
    ruleKey: params.ruleKey,
    defaults: defaultsParsed.data,
    logic: configResult.value,
  })

  if (!hardStopResult.ok) {
    return { ok: false, errors: hardStopResult.errors }
  }

  return { ok: true, errors: [], logic: configResult.value, defaults: defaultsParsed.data }
}
