/**
 * useDashboardData Hook - E6.5.9
 *
 * Manages dashboard data fetching with:
 * - Stale-while-revalidate pattern
 * - Error handling with retry
 * - Refresh on demand
 *
 * E6.5.9 AC1: Dashboard reflects new status without hard reload
 * E6.5.9 AC2: Offline/failed fetch shows error state + retry (not blank)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { DashboardViewModelV1 } from '@/lib/api/contracts/patient/dashboard'

type FetchState = 'idle' | 'loading' | 'revalidating' | 'error'

interface UseDashboardDataResult {
  data: DashboardViewModelV1 | null
  state: FetchState
  error: string | null
  isStale: boolean
  refresh: () => Promise<void>
  retry: () => Promise<void>
}

const DASHBOARD_API_ENDPOINT = '/api/patient/dashboard'

/**
 * Hook for managing dashboard data with stale-while-revalidate strategy
 *
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Dashboard data state and control functions
 *
 * @example
 * ```tsx
 * const { data, state, error, refresh, retry } = useDashboardData()
 *
 * if (state === 'loading') return <LoadingSpinner />
 * if (error) return <ErrorState onRetry={retry} />
 * return <DashboardContent data={data} />
 * ```
 */
export function useDashboardData(autoFetch: boolean = true): UseDashboardDataResult {
  const [data, setData] = useState<DashboardViewModelV1 | null>(null)
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  // Track if a fetch is in progress to prevent race conditions
  const fetchInProgressRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchDashboard = useCallback(
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

        const response = await fetch(DASHBOARD_API_ENDPOINT, {
          credentials: 'include',
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load dashboard data')
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load dashboard')
        }

        // Update data and clear stale flag
        setData(result.data)
        setState('idle')
        setIsStale(false)
        setError(null)
      } catch (err) {
        // Don't set error state if request was aborted (component unmounted or new request started)
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        console.error('[useDashboardData] Error loading data:', err)

        // Only clear data if we don't have stale data to show
        if (!data || !options.isRevalidation) {
          setData(null)
        }

        setState('error')
        setError(
          err instanceof Error ? err.message : 'Dashboard konnte nicht geladen werden.',
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
      fetchDashboard()
    }
  }, [autoFetch, state, data, fetchDashboard])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Refresh dashboard data
   * Uses stale-while-revalidate: shows old data while fetching new
   */
  const refresh = useCallback(async () => {
    await fetchDashboard({ isRevalidation: true })
  }, [fetchDashboard])

  /**
   * Retry after error
   * Clears error state and attempts fresh fetch
   */
  const retry = useCallback(async () => {
    await fetchDashboard({ isRevalidation: false })
  }, [fetchDashboard])

  return {
    data,
    state,
    error,
    isStale,
    refresh,
    retry,
  }
}
