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
  {
    id: 'SFTY-2.2-C-10W-PRESENT',
    description: '10-W module should be present and include state markers.',
    predicate: (context) => {
      const tenW = context.structuredData.ten_w
      if (!tenW) return false
      return Object.values(tenW).every((entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        (entry.state === 'answered' || entry.state === 'unanswered'),
      )
    },
  },
  {
    id: 'SFTY-2.2-C-OPQRST-PRESENT',
    description: 'OPQRST mapping should be present and include state markers.',
    predicate: (context) => {
      const opqrst = context.structuredData.opqrst
      if (!opqrst) return false
      return Object.values(opqrst).every((entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        (entry.state === 'answered' || entry.state === 'unanswered'),
      )
    },
  },
  {
    id: 'SFTY-2.2-C-SAFETY-OVERRIDE-BLOCKED',
    description: 'Reasoning must not provide safety overrides.',
    predicate: (context) => {
      const reasoning = context.structuredData.reasoning as
        | (Record<string, unknown> & { safety_override?: unknown })
        | undefined

      return !reasoning || reasoning.safety_override === undefined
    },
  },
]
