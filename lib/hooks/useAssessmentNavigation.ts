import { useState, useCallback, useEffect, useRef } from 'react'
import { debouncedNavigationFetch, clearPendingRequest } from '@/lib/navigation/debouncedFetch'

/**
 * B3: Assessment Navigation Hook
 * 
 * Provides navigation state and functions for assessment funnel navigation.
 * Handles debouncing to prevent race conditions from rapid swipes.
 */

export type NavigationState = {
  currentStepId: string | null
  currentStepIndex: number
  nextStepId: string | null
  previousStepId: string | null
  canGoNext: boolean
  canGoPrevious: boolean
  isComplete: boolean
  totalSteps: number
  answeredQuestions: number
  totalQuestions: number
}

export type NavigationStatus = 'idle' | 'loading' | 'error'

export type UseAssessmentNavigationReturn = {
  navigation: NavigationState | null
  status: NavigationStatus
  error: string | null
  refresh: () => Promise<void>
  isNavigating: boolean
}

/**
 * Hook for managing assessment navigation state.
 * 
 * Features:
 * - Automatic navigation state loading
 * - Debounced requests to prevent race conditions
 * - Error handling and retry capability
 * - Performance monitoring
 * 
 * @param assessmentId - UUID of the assessment
 * @param autoLoad - Whether to automatically load navigation on mount (default: true)
 * @returns Navigation state and control functions
 */
export function useAssessmentNavigation(
  assessmentId: string | null,
  autoLoad: boolean = true,
): UseAssessmentNavigationReturn {
  const [navigation, setNavigation] = useState<NavigationState | null>(null)
  const [status, setStatus] = useState<NavigationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const mountedRef = useRef(true)

  const loadNavigation = useCallback(async () => {
    if (!assessmentId) {
      setStatus('idle')
      setNavigation(null)
      return
    }

    setStatus('loading')
    setIsNavigating(true)
    setError(null)

    try {
      const response = await debouncedNavigationFetch(
        `nav-${assessmentId}`,
        `/api/assessments/${assessmentId}/navigation`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        100, // 100ms debounce
      )

      if (!mountedRef.current) return

      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Fehler beim Laden der Navigation'
        setError(errorMessage)
        setStatus('error')
        setIsNavigating(false)
        return
      }

      // Log performance warning if slow
      if (result.performanceMs > 200) {
        console.warn(`Navigation request took ${result.performanceMs}ms`)
      }

      setNavigation(result.navigation)
      setStatus('idle')
      setIsNavigating(false)
    } catch (err) {
      if (!mountedRef.current) return

      // Ignore superseded requests
      if (err instanceof Error && err.message.includes('superseded')) {
        return
      }

      console.error('Error loading navigation:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Netzwerkfehler beim Laden der Navigation'
      setError(errorMessage)
      setStatus('error')
      setIsNavigating(false)
    }
  }, [assessmentId])

  // Auto-load on mount and when assessmentId changes
  useEffect(() => {
    if (autoLoad && assessmentId) {
      loadNavigation()
    }
  }, [autoLoad, assessmentId, loadNavigation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (assessmentId) {
        clearPendingRequest(`nav-${assessmentId}`)
      }
    }
  }, [assessmentId])

  return {
    navigation,
    status,
    error,
    refresh: loadNavigation,
    isNavigating,
  }
}

/**
 * Hook for resuming an assessment.
 * Provides all data needed to continue an interrupted assessment.
 */
export type ResumeData = {
  assessmentId: string
  funnelId: string
  currentStep: {
    stepId: string
    stepIndex: number
    orderIndex: number
    title: string
    type: string
    hasQuestions: boolean
    requiredQuestions: string[]
    answeredQuestions: string[]
  }
  navigation: NavigationState
  previousAnswers: Record<string, number>
}

export type UseAssessmentResumeReturn = {
  resumeData: ResumeData | null
  status: NavigationStatus
  error: string | null
  load: () => Promise<void>
}

export function useAssessmentResume(assessmentId: string | null): UseAssessmentResumeReturn {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [status, setStatus] = useState<NavigationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    if (!assessmentId) {
      setStatus('idle')
      setResumeData(null)
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const response = await fetch(`/api/assessments/${assessmentId}/resume`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!mountedRef.current) return

      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Fehler beim Laden der Resume-Daten'
        setError(errorMessage)
        setStatus('error')
        return
      }

      // Log performance warning if slow
      if (result.performanceMs > 200) {
        console.warn(`Resume request took ${result.performanceMs}ms`)
      }

      setResumeData(result.resume)
      setStatus('idle')
    } catch (err) {
      if (!mountedRef.current) return

      console.error('Error loading resume data:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Netzwerkfehler beim Laden der Resume-Daten'
      setError(errorMessage)
      setStatus('error')
    }
  }, [assessmentId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    resumeData,
    status,
    error,
    load,
  }
}
