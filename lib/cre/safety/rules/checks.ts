import type { SafetyRuleContext } from './rules'

export type SafetyCheckDefinition = {
  id: string
  description: string
  predicate: (context: SafetyRuleContext) => boolean
}

export const SAFETY_CHECKS: SafetyCheckDefinition[] = [
  {
    id: 'SFTY-2.1-C-CHIEF-OR-HPI',
    description: 'Structured intake should include chief complaint or HPI context.',
    predicate: (context) =>
      Boolean(context.structuredData.chief_complaint?.trim()) ||
      Boolean(context.structuredData.history_of_present_illness),
  },
  {
    id: 'SFTY-2.1-C-UNCERTAINTY-ARRAY',
    description: 'Uncertainties field must be an array when present.',
    predicate: (context) =>
      context.structuredData.uncertainties === undefined ||
      Array.isArray(context.structuredData.uncertainties),
  },
]
