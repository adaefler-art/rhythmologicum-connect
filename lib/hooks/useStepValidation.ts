import { useState } from 'react'

export type MissingQuestion = {
  questionId: string
  questionKey: string
  questionLabel: string
  orderIndex: number
}

export type ValidationState = 'idle' | 'validating' | 'success' | 'error'

export type UseStepValidationReturn = {
  validationState: ValidationState
  isValid: boolean | null
  missingQuestions: MissingQuestion[]
  error: string | null
  validateStep: (assessmentId: string, stepId: string) => Promise<boolean>
  reset: () => void
}

/**
 * Hook for validating required questions in a funnel step.
 *
 * Calls the validation API to check if all required questions for a step
 * have been answered.
 *
 * @example
 * ```tsx
 * const { validateStep, isValid, missingQuestions, validationState } = useStepValidation()
 *
 * const handleNext = async () => {
 *   const valid = await validateStep(assessmentId, currentStepId)
 *   if (valid) {
 *     // Navigate to next step
 *   } else {
 *     // Show error message
 *   }
 * }
 * ```
 */
export function useStepValidation(): UseStepValidationReturn {
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [missingQuestions, setMissingQuestions] = useState<MissingQuestion[]>([])
  const [error, setError] = useState<string | null>(null)

  const validateStep = async (assessmentId: string, stepId: string): Promise<boolean> => {
    setValidationState('validating')
    setError(null)

    try {
      const response = await fetch('/api/assessment-validation/validate-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentId, stepId }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setValidationState('error')
        setError(data.error || 'Validierung fehlgeschlagen')
        setIsValid(false)
        return false
      }

      setValidationState('success')
      setIsValid(data.isValid)
      setMissingQuestions(data.missingQuestions || [])

      return data.isValid
    } catch (err) {
      console.error('Step validation error:', err)
      setValidationState('error')
      setError('Netzwerkfehler bei der Validierung. Bitte versuchen Sie es erneut.')
      setIsValid(false)
      return false
    }
  }

  const reset = () => {
    setValidationState('idle')
    setIsValid(null)
    setMissingQuestions([])
    setError(null)
  }

  return {
    validationState,
    isValid,
    missingQuestions,
    error,
    validateStep,
    reset,
  }
}
