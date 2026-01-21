import { useState, useCallback, useRef } from 'react'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export type SaveAnswerOptions = {
  assessmentId: string
  questionId: string
  answerValue: number
  clientMutationId?: string
}

export type SaveAnswerResult = {
  success: boolean
  error?: string
  cached?: boolean
}

export type UseAssessmentAnswerReturn = {
  saveAnswer: (options: SaveAnswerOptions) => Promise<SaveAnswerResult>
  saveState: SaveState
  lastError: string | null
  retry: () => Promise<SaveAnswerResult | null>
}

/**
 * Custom Hook: useAssessmentAnswer
 * 
 * Provides save-on-tap functionality for assessment answers.
 * Automatically saves answers to the backend with proper error handling.
 * 
 * Features:
 * - Debounced saves to prevent excessive API calls
 * - Clear save states (idle, saving, saved, error)
 * - Retry mechanism for failed saves
 * - User-friendly error messages
 * - I71.4: Idempotent saves using clientMutationId (double-tap prevention)
 * 
 * @example
 * ```tsx
 * const { saveAnswer, saveState, lastError, retry } = useAssessmentAnswer()
 * 
 * const handleAnswer = async (value: number) => {
 *   const result = await saveAnswer({
 *     assessmentId: 'uuid',
 *     questionId: 'stress_level',
 *     answerValue: value
 *   })
 *   if (result.success) {
 *     console.log('Answer saved!')
 *   }
 * }
 * ```
 */
export function useAssessmentAnswer(): UseAssessmentAnswerReturn {
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const lastSaveOptions = useRef<SaveAnswerOptions | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performSave = useCallback(async (options: SaveAnswerOptions): Promise<SaveAnswerResult> => {
    setSaveState('saving')
    setLastError(null)
    lastSaveOptions.current = options

    try {
      // I71.4: Generate clientMutationId if not provided
      const mutationId = options.clientMutationId || generateMutationId()

      const response = await fetch('/api/assessment-answers/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          clientMutationId: mutationId,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Fehler beim Speichern der Antwort'
        setLastError(errorMessage)
        setSaveState('error')
        return { success: false, error: errorMessage }
      }

      // Success - show saved state briefly
      setSaveState('saved')
      
      // Reset to idle after a short delay
      setTimeout(() => {
        setSaveState('idle')
      }, 1500)

      return { 
        success: true,
        cached: response.headers.get('X-Idempotency-Cached') === 'true'
      }
    } catch (error) {
      console.error('Network error saving answer:', error)
      const errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      setLastError(errorMessage)
      setSaveState('error')
      return { success: false, error: errorMessage }
    }
  }, [])

  const saveAnswer = useCallback(
    (options: SaveAnswerOptions): Promise<SaveAnswerResult> => {
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Return a promise that resolves when the debounced save completes
      return new Promise((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          const result = await performSave(options)
          resolve(result)
        }, 300) // 300ms debounce delay
      })
    },
    [performSave],
  )

  const retry = useCallback(async (): Promise<SaveAnswerResult | null> => {
    if (!lastSaveOptions.current) {
      console.warn('No previous save to retry')
      return null
    }
    return performSave(lastSaveOptions.current)
  }, [performSave])

  return {
    saveAnswer,
    saveState,
    lastError,
    retry,
  }
}

/**
 * I71.4: Generate a unique mutation ID for idempotency
 * Uses browser crypto API if available, fallback to timestamp-based ID
 */
function generateMutationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
