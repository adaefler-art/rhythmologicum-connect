/**
 * Type definitions for B4 Dynamic Validation Rules
 */

export type RuleOperator = 'eq' | 'neq' | 'in' | 'gte' | 'lte' | 'gt' | 'lt'

export type RuleLogic = 'AND' | 'OR'

export type RuleCondition = {
  question_key: string
  operator: RuleOperator
  value?: number
  values?: number[]
}

export type RulePayload = {
  type: 'conditional_required' | 'conditional_visible'
  logic?: RuleLogic // defaults to AND if multiple conditions
  conditions: RuleCondition[]
}

export type QuestionRule = {
  id: string
  question_id: string
  funnel_step_id: string
  rule_type: 'conditional_required' | 'conditional_visible'
  rule_payload: RulePayload
  priority: number
  is_active: boolean
}

/**
 * Extended validation result with reason information
 */
export type MissingQuestionReason = 'required' | 'conditional_required'

export type MissingQuestionWithReason = {
  questionId: string
  questionKey: string
  questionLabel: string
  orderIndex: number
  reason: MissingQuestionReason
  ruleId?: string
  ruleDescription?: string
}

export type ValidationResultExtended = {
  isValid: boolean
  missingQuestions: MissingQuestionWithReason[]
}
