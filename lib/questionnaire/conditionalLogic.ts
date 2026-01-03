/**
 * Conditional Logic Evaluator for Adaptive Questionnaires (V05-I03.2)
 * 
 * Evaluates conditional logic rules based on user answers to determine step/question visibility.
 * All types come from registry and funnelManifest contracts - NO NEW TYPES.
 */

import type { ConditionalLogic } from '@/lib/contracts/funnelManifest'

/**
 * Answers map: questionId -> answer value
 */
export type AnswersMap = Record<string, string | number | boolean | string[]>

/**
 * Error thrown when an unknown operator is encountered
 */
export class UnknownOperatorError extends Error {
  constructor(
    public operator: string,
    public questionId: string,
  ) {
    super(`Unknown conditional operator: "${operator}" for question "${questionId}"`)
    this.name = 'UnknownOperatorError'
  }
}

/**
 * Error thrown when a referenced question ID doesn't exist in answers
 */
export class UnknownQuestionError extends Error {
  constructor(public questionId: string) {
    super(`Referenced question not found: "${questionId}"`)
    this.name = 'UnknownQuestionError'
  }
}

/**
 * Evaluates a single condition against provided answers
 * @throws {UnknownOperatorError} When operator is not recognized
 */
function evaluateCondition(
  condition: ConditionalLogic['conditions'][0],
  answers: AnswersMap,
): boolean {
  const { questionId, operator, value } = condition
  const answer = answers[questionId]

  // If question hasn't been answered, condition is false
  if (answer === undefined || answer === null) {
    return false
  }

  switch (operator) {
    case 'eq':
      return answer === value
    case 'neq':
      return answer !== value
    case 'gt':
      return typeof answer === 'number' && typeof value === 'number' && answer > value
    case 'gte':
      return typeof answer === 'number' && typeof value === 'number' && answer >= value
    case 'lt':
      return typeof answer === 'number' && typeof value === 'number' && answer < value
    case 'lte':
      return typeof answer === 'number' && typeof value === 'number' && answer <= value
    case 'in':
      if (Array.isArray(value)) {
        if (Array.isArray(answer)) {
          // Check if any answer value is in the condition values
          return answer.some((a) => value.includes(a))
        }
        return value.includes(answer as string)
      }
      return false
    case 'notIn':
      if (Array.isArray(value)) {
        if (Array.isArray(answer)) {
          // Check if no answer value is in the condition values
          return !answer.some((a) => value.includes(a))
        }
        return !value.includes(answer as string)
      }
      return false
    default:
      // Unknown operator - throw error for strict validation
      throw new UnknownOperatorError(operator, questionId)
  }
}

/**
 * Evaluates conditional logic against provided answers
 * 
 * @param logic - Conditional logic to evaluate
 * @param answers - Current answers map
 * @returns true if the condition is met, false otherwise
 */
export function evaluateConditionalLogic(
  logic: ConditionalLogic,
  answers: AnswersMap,
): boolean {
  const { conditions, logic: logicOp } = logic

  if (conditions.length === 0) {
    return true
  }

  const results = conditions.map((condition) => evaluateCondition(condition, answers))

  // Apply AND/OR logic
  if (logicOp === 'or') {
    return results.some((result) => result)
  }

  // Default to AND
  return results.every((result) => result)
}

/**
 * Determines if a step should be visible based on its conditional logic
 * 
 * @param stepLogic - Optional conditional logic for the step
 * @param answers - Current answers map
 * @returns true if step should be visible
 */
export function isStepVisible(
  stepLogic: ConditionalLogic | undefined,
  answers: AnswersMap,
): boolean {
  if (!stepLogic) {
    return true // No conditional logic means always visible
  }

  const conditionMet = evaluateConditionalLogic(stepLogic, answers)

  // Apply type-based logic
  switch (stepLogic.type) {
    case 'show':
      return conditionMet
    case 'hide':
      return !conditionMet
    case 'skip':
      return !conditionMet
    default:
      return true
  }
}

/**
 * Filters steps to only those that should be visible based on answers
 * 
 * @param steps - All steps in the questionnaire
 * @param answers - Current answers map
 * @returns Array of visible steps in order
 */
export function getVisibleSteps<T extends { id: string; conditionalLogic?: ConditionalLogic }>(
  steps: T[],
  answers: AnswersMap,
): T[] {
  return steps.filter((step) => isStepVisible(step.conditionalLogic, answers))
}
