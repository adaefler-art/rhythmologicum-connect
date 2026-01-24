/**
 * usePatientState Hook - I2.1
 *
 * Manages canonical patient state v0.1 with:
 * - Lazy loading on first access
 * - Optimistic updates with rollback on error
 * - Partial update support
 * - Deterministic reload behavior
 *
 * I2.1 Acceptance Criteria:
 * - AC1: Reload/Navigation doesn't lose status (persistent)
 * - AC2: State is versioned with clean defaults
 * - AC3: No new UI tokens; UI consumes only state
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { PatientStateV01, PatientStateUpdateRequest } from '@/lib/api/contracts/patient/state'

type FetchState = 'idle' | 'loading' | 'updating' | 'error'

interface UsePatientStateResult {
  state: PatientStateV01 | null
  fetchState: FetchState
  error: string | null
  refresh: () => Promise<void>
  updateState: (update: PatientStateUpdateRequest) => Promise<void>
  retry: () => Promise<void>
}

const PATIENT_STATE_API_ENDPOINT = '/api/patient/state'

/**
 * Hook for managing canonical patient state v0.1
 *
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Patient state data and control functions
 *
 * @example
 * ```tsx
 * const { state, fetchState, error, updateState, retry } = usePatientState()
 *
 * // Update assessment progress
 * await updateState({
 *   assessment: {
 *     lastAssessmentId: 'uuid',
 *     status: 'in_progress',
 *     progress: 0.5
 *   }
 * })
 *
 * // Update activity
 * await updateState({
 *   activity: {
 *     recentActivity: [
 *       { type: 'assessment_completed', label: 'Stress Assessment', timestamp: new Date().toISOString() }
 *     ]
 *   }
 * })
 * ```
 */
export function usePatientState(autoFetch: boolean = true): UsePatientStateResult {
  const [state, setState] = useState<PatientStateV01 | null>(null)
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)

  // Track if a fetch is in progress to prevent race conditions
  const fetchInProgressRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Store previous state for rollback on update error
  const previousStateRef = useRef<PatientStateV01 | null>(null)

  const fetchPatientState = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      return
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    fetchInProgressRef.current = true
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setFetchState('loading')
      setError(null)

      const response = await fetch(PATIENT_STATE_API_ENDPOINT, {
        credentials: 'include',
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to load patient state')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load patient state')
      }

      // AC1: State loaded successfully, persists across reloads
      setState(result.data)
      setFetchState('idle')
      setError(null)
    } catch (err) {
      // Don't set error state if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      console.error('[usePatientState] Error loading state:', err)
      setFetchState('error')
      setError(err instanceof Error ? err.message : 'Patient state konnte nicht geladen werden.')
    } finally {
      fetchInProgressRef.current = false
      abortControllerRef.current = null
    }
  }, [])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && fetchState === 'idle' && !state) {
      fetchPatientState()
    }
  }, [autoFetch, fetchState, state, fetchPatientState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Refresh patient state from server
   */
  const refresh = useCallback(async () => {
    await fetchPatientState()
  }, [fetchPatientState])

  /**
   * Retry after error
   */
  const retry = useCallback(async () => {
    await fetchPatientState()
  }, [fetchPatientState])

  /**
   * Update patient state with partial updates
   * Uses optimistic update pattern with rollback on error
   */
  const updateState = useCallback(
    async (update: PatientStateUpdateRequest) => {
      if (!state) {
        console.error('[usePatientState] Cannot update: state not loaded')
        return
      }

      // Store previous state for rollback
      previousStateRef.current = state

      // AC3: Optimistically update UI state
      const optimisticState: PatientStateV01 = {
        ...state,
        assessment: update.assessment ? { ...state.assessment, ...update.assessment } : state.assessment,
        results: update.results ? { ...state.results, ...update.results } : state.results,
        dialog: update.dialog ? { ...state.dialog, ...update.dialog } : state.dialog,
        activity: update.activity ? { ...state.activity, ...update.activity } : state.activity,
        metrics: update.metrics ? { ...state.metrics, ...update.metrics } : state.metrics,
      }

      setState(optimisticState)
      setFetchState('updating')
      setError(null)

      try {
        const response = await fetch(PATIENT_STATE_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(update),
        })

        if (!response.ok) {
          throw new Error('Failed to update patient state')
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to update patient state')
        }

        // AC1: Update successful, state persisted
        setState(result.data)
        setFetchState('idle')
      } catch (err) {
        console.error('[usePatientState] Error updating state:', err)

        // Rollback to previous state on error
        setState(previousStateRef.current)
        setFetchState('error')
        setError(err instanceof Error ? err.message : 'Patient state konnte nicht aktualisiert werden.')
      }
    },
    [state],
  )

  return {
    state,
    fetchState,
    error,
    refresh,
    updateState,
    retry,
  }
}
