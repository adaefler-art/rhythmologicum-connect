/**
 * Rule Engine for B4 Dynamic Validation
 * Evaluates conditional validation rules based on assessment answers
 */

import type {
  RuleCondition,
  RulePayload,
  RuleOperator,
  RuleLogic,
} from './ruleTypes'

/**
 * Evaluates a single condition against an answer value
 */
export function evaluateCondition(
  condition: RuleCondition,
  answerValue: number | undefined,
): boolean {
  // If answer is undefined, condition cannot be satisfied
  if (answerValue === undefined) {
    return false
  }

  const { operator, value, values } = condition

  switch (operator) {
    case 'eq':
      return value !== undefined && answerValue === value

    case 'neq':
      return value !== undefined && answerValue !== value

    case 'gt':
      return value !== undefined && answerValue > value

    case 'gte':
      return value !== undefined && answerValue >= value

    case 'lt':
      return value !== undefined && answerValue < value

    case 'lte':
      return value !== undefined && answerValue <= value

    case 'in':
      return values !== undefined && values.includes(answerValue)

    default:
      console.warn(`Unknown operator: ${operator}`)
      return false
  }
}

/**
 * Evaluates all conditions in a rule with the specified logic (AND/OR)
 */
export function evaluateRule(
  rulePayload: RulePayload,
  answers: Record<string, number>,
): boolean {
  const { conditions, logic = 'AND' } = rulePayload

  if (!conditions || conditions.length === 0) {
    // No conditions means rule doesn't apply
    return false
  }

  const results = conditions.map((condition) => {
    const answerValue = answers[condition.question_key]
    return evaluateCondition(condition, answerValue)
  })

  // Apply logic (AND or OR)
  if (logic === 'OR') {
    // At least one condition must be true
    return results.some((result) => result === true)
  } else {
    // All conditions must be true (AND is default)
    return results.every((result) => result === true)
  }
}

/**
 * Generates a human-readable description of a rule for error messages
 */
export function describeRule(rulePayload: RulePayload): string {
  const { conditions, logic = 'AND' } = rulePayload

  if (!conditions || conditions.length === 0) {
    return 'No conditions defined'
  }

  if (conditions.length === 1) {
    return describeCondition(conditions[0])
  }

  const descriptions = conditions.map(describeCondition)
  const connector = logic === 'OR' ? ' ODER ' : ' UND '

  return descriptions.join(connector)
}

/**
 * Generates a human-readable description of a single condition
 */
function describeCondition(condition: RuleCondition): string {
  const { operator, value, values } = condition

  switch (operator) {
    case 'eq':
      return `Ihre Antwort war ${value}`

    case 'neq':
      return `Ihre Antwort war nicht ${value}`

    case 'gt':
      return `Ihre Antwort war größer als ${value}`

    case 'gte':
      return `Ihre Antwort war mindestens ${value}`

    case 'lt':
      return `Ihre Antwort war kleiner als ${value}`

    case 'lte':
      return `Ihre Antwort war höchstens ${value}`

    case 'in':
      if (values && values.length > 0) {
        if (values.length === 1) {
          return `Ihre Antwort war ${values[0]}`
        }
        return `Ihre Antwort war eine von: ${values.join(', ')}`
      }
      return 'Ihre Antwort erfüllte die Bedingung'

    default:
      return 'Bedingung erfüllt'
  }
}
