import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'
import { SAFETY_CHECKS } from './checks'
import { SAFETY_RULES, buildSafetyContext } from './rules'

export type SafetyRuleEvaluation = {
  ruleIds: string[]
  checkIds: string[]
}

export const evaluateSafetyRules = (params: {
  structuredData: StructuredIntakeData
  evidenceText?: string
}): SafetyRuleEvaluation => {
  const context = buildSafetyContext(params)

  const ruleIds = SAFETY_RULES.filter((rule) => rule.predicate(context)).map((rule) => rule.id)
  const checkIds = SAFETY_CHECKS.filter((check) => !check.predicate(context)).map((check) => check.id)

  return {
    ruleIds,
    checkIds,
  }
}
