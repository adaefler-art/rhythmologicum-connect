/**
 * usePatientState Hook - I2.1
 * 
 * Client hook for managing patient state with:
 * - Stale-while-revalidate pattern
 * - Error handling with retry
 * - Refresh on demand
 * - Partial updates with deep merge
 * 
 * Follows the pattern of useDashboardData for consistency.
 * 
 * @module lib/hooks/usePatientState
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { PatientStateV01, PatientStateUpdate } from '@/lib/types/patient-state'

type FetchState = 'idle' | 'loading' | 'revalidating' | 'error'
type UpdateState = 'idle' | 'updating' | 'error'

interface UsePatientStateResult {
  // Data state
  data: PatientStateV01 | null
  state: FetchState
  error: string | null
  isStale: boolean
  
  // Update state
  updateState: UpdateState
  updateError: string | null
  
  // Actions
  refresh: () => Promise<void>
  retry: () => Promise<void>
  update: (payload: PatientStateUpdate) => Promise<boolean>
}

const PATIENT_STATE_API_ENDPOINT = '/api/patient/state'

/**
 * Hook for managing patient state with stale-while-revalidate strategy
 * 
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Patient state data and control functions
 * 
 * @example
 * ```tsx
 * const { data, state, error, update, refresh, retry } = usePatientState()
 * 
 * if (state === 'loading') return <LoadingSpinner />
 * if (error) return <ErrorState onRetry={retry} />
 * 
 * // Update state
 * await update({
 *   assessment: { status: 'completed', progress: 1.0 }
 * })
 * 
 * return <PatientDashboard state={data} />
 * ```
 */
export function usePatientState(autoFetch: boolean = true): UsePatientStateResult {
  const [data, setData] = useState<PatientStateV01 | null>(null)
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  
  const [updateState, setUpdateState] = useState<UpdateState>('idle')
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Track if a fetch is in progress to prevent race conditions
  const fetchInProgressRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Fetch patient state from server
   */
  const fetchPatientState = useCallback(
    async (options: { isRevalidation?: boolean } = {}) => {
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
        // If we have stale data, mark as revalidating; otherwise loading
        if (options.isRevalidation && data) {
          setState('revalidating')
          setIsStale(true)
        } else {
          setState('loading')
        }

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

        // Update data and clear stale flag
        setData(result.data)
        setState('idle')
        setIsStale(false)
        setError(null)
      } catch (err) {
        // Don't set error state if request was aborted
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        console.error('[usePatientState] Error loading data:', err)

        // Only clear data if we don't have stale data to show
        if (!data || !options.isRevalidation) {
          setData(null)
        }

        setState('error')
        setError(
          err instanceof Error ? err.message : 'Patient state konnte nicht geladen werden.',
        )
      } finally {
        fetchInProgressRef.current = false
        abortControllerRef.current = null
      }
    },
    [data],
  )

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && state === 'idle' && !data) {
      fetchPatientState()
    }
  }, [autoFetch, state, data, fetchPatientState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Refresh patient state
   * Uses stale-while-revalidate: shows old data while fetching new
   */
  const refresh = useCallback(async () => {
    await fetchPatientState({ isRevalidation: true })
  }, [fetchPatientState])

  /**
   * Retry after error
   * Clears error state and attempts fresh fetch
   */
  const retry = useCallback(async () => {
    await fetchPatientState({ isRevalidation: false })
  }, [fetchPatientState])

  /**
   * Update patient state with partial data
   * 
   * @param payload - Partial state update
   * @returns Promise<boolean> - true if update succeeded
   */
  const update = useCallback(
    async (payload: PatientStateUpdate): Promise<boolean> => {
      setUpdateState('updating')
      setUpdateError(null)

      try {
        const response = await fetch(PATIENT_STATE_API_ENDPOINT, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Failed to update patient state')
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to update patient state')
        }

        // Update local data with server response
        setData(result.data)
        setUpdateState('idle')
        setUpdateError(null)
        
        return true
      } catch (err) {
        console.error('[usePatientState] Error updating state:', err)
        setUpdateState('error')
        setUpdateError(
          err instanceof Error ? err.message : 'Patient state konnte nicht aktualisiert werden.',
        )
        return false
      }
    },
    [],
  )

  return {
    data,
    state,
    error,
    isStale,
    updateState,
    updateError,
    refresh,
    retry,
    update,
  }
}
