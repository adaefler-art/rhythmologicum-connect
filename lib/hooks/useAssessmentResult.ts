import { useCallback, useEffect, useRef, useState } from 'react'

// =========================
// Types for Funnel Runtime Result
// =========================

export interface RuntimeResultResponse {
  success: boolean
  data?: {
    state?: string
    assessmentId?: string
    id: string
    funnel: string
    status: string
    completedAt?: string
    funnelTitle?: string
    workupStatus?: string
    result?: {
      kind?: string
      summaryTitle?: string
      summaryBullets?: string[]
      derived?: Record<string, unknown>
      answersEcho?: Record<string, unknown>
      scores?: {
        riskScore?: number | null
        [key: string]: unknown
      }
      riskModels?: {
        riskLevel?: string | null
        riskFactors?: unknown
        [key: string]: unknown
      }
      priorityRanking?: Record<string, unknown>
      algorithmVersion?: string
      computedAt?: string
    }
    nextActions?: unknown
    report?: {
      id: string | null
      status: string
    }
  }
  schemaVersion?: string
  error?: { code: string; message: string }
}

export interface UseAssessmentResultOptions {
  slug: string | null
  assessmentId: string | null
  /** Enable fetching (default: true) */
  enabled?: boolean
  /** Enable polling when result is not ready (STATE_CONFLICT with in_progress) */
  pollOnConflict?: boolean
  /** Polling interval in ms (default: 2000) */
  pollInterval?: number
  /** Max polling duration in ms (default: 30000) */
  pollTimeout?: number
}

export interface UseAssessmentResultReturn {
  data: RuntimeResultResponse['data'] | null
  isLoading: boolean
  error: string | null
  errorObj?: { code?: string; message?: string; details?: Record<string, unknown> } | null
  /** Is currently polling for result */
  isPolling: boolean
  /** Polling timed out without success */
  pollTimedOut: boolean
  refetch: () => void
  /** Stop polling and reset timeout state */
  stopPolling: () => void
}

/**
 * useAssessmentResult
 *
 * Loads assessment result from Funnel Runtime endpoint.
 * Supports optional polling when result is not ready (STATE_CONFLICT with in_progress).
 *
 * @param {Object} options
 * @param {string|null} options.slug - Funnel slug
 * @param {string|null} options.assessmentId - Assessment ID
 * @param {boolean} options.pollOnConflict - Enable polling when STATE_CONFLICT
 * @param {number} options.pollInterval - Polling interval in ms (default: 2000)
 * @param {number} options.pollTimeout - Max polling duration in ms (default: 30000)
 * @returns {Object} { data, isLoading, error, isPolling, pollTimedOut, refetch, stopPolling }
 */
export function useAssessmentResult({
  slug,
  assessmentId,
  enabled = true,
  pollOnConflict = false,
  pollInterval = 2000,
  pollTimeout = 30000,
}: UseAssessmentResultOptions): UseAssessmentResultReturn {
  const [data, setData] = useState<RuntimeResultResponse['data'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorObj, setErrorObj] = useState<{ code?: string; message?: string; details?: Record<string, unknown> } | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [pollTimedOut, setPollTimedOut] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const lastSuccessData = useRef<RuntimeResultResponse['data'] | null>(null)
  const pollStartTimeRef = useRef<number | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setIsPolling(false)
    pollStartTimeRef.current = null
  }, [])

  const fetchResult = useCallback(() => {
    if (!enabled || !slug || !assessmentId) {
      setData(null)
      setError(null)
      setErrorObj(null)
      setIsLoading(false)
      stopPolling()
      return
    }
    if (!isPolling) {
      setIsLoading(true)
    }
    setError(null)
    setErrorObj(null)
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    fetch(`/api/funnels/${slug}/assessments/${assessmentId}/result`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    })
      .then(async (res) => {
        let json: RuntimeResultResponse
        try {
          json = await res.json()
        } catch {
          throw new Error('Invalid server response')
        }
        if (!res.ok || json.success !== true) {
          const errorObjParsed = json?.error as { code?: string; message?: string; details?: Record<string, unknown> }
          const correlationId =
            (json as { requestId?: string })?.requestId || res.headers.get('x-correlation-id') || undefined
          if (correlationId) {
            errorObjParsed.details = {
              ...(errorObjParsed.details ?? {}),
              correlationId,
            }
          }
          const err = new Error(json?.error?.message || 'Fehler beim Laden des Ergebnisses') as Error & { errorObj?: { code?: string; message?: string; details?: Record<string, unknown> } }
          err.errorObj = errorObjParsed
          throw err
        }
        return json
      })
      .then((json) => {
        setData(json.data || null)
        lastSuccessData.current = json.data || null
        setIsLoading(false)
        stopPolling()
        setPollTimedOut(false)
      })
      .catch((err) => {
        const errObj = (err as { errorObj?: { code?: string; message?: string; details?: Record<string, unknown> } })?.errorObj || null
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
        setErrorObj(errObj)
        setIsLoading(false)
        // Keep last successful data to avoid flicker
        setData(lastSuccessData.current)

        // Handle polling for STATE_CONFLICT with in_progress
        // E73.4: Support both legacy (status field) and new SSOT (state field)
        if (
          pollOnConflict &&
          errObj?.code === 'STATE_CONFLICT' &&
          errObj.details &&
          ((errObj.details as { status?: string }).status === 'in_progress' ||
           (errObj.details as { state?: string }).state === 'in_progress' ||
           (errObj.details as { state?: string }).state === 'processing')
        ) {
          // Start polling if not already
          if (!pollStartTimeRef.current) {
            pollStartTimeRef.current = Date.now()
            setIsPolling(true)
            setPollTimedOut(false)
          }

          // Check timeout
          const elapsed = Date.now() - pollStartTimeRef.current
          if (elapsed >= pollTimeout) {
            stopPolling()
            setPollTimedOut(true)
            return
          }

          // Schedule next poll
          if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(() => {
              // This will trigger fetchResult again via refetch
            }, pollInterval)
          }
        } else {
          // Not a conflict we can poll for, stop polling
          stopPolling()
        }
      })
  }, [enabled, slug, assessmentId, pollOnConflict, pollInterval, pollTimeout, isPolling, stopPolling])

  // Handle polling interval
  useEffect(() => {
    if (isPolling && pollIntervalRef.current === null) {
      pollIntervalRef.current = setInterval(() => {
        fetchResult()
      }, pollInterval)
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [isPolling, pollInterval, fetchResult])

  useEffect(() => {
    if (!enabled) {
      return () => {
        if (abortRef.current) abortRef.current.abort()
        stopPolling()
      }
    }
    // Avoid direct setState in effect body (react-hooks/set-state-in-effect)
    queueMicrotask(fetchResult)
    return () => {
      if (abortRef.current) abortRef.current.abort()
      stopPolling()
    }
  }, [enabled, fetchResult, stopPolling])

  return {
    data,
    isLoading,
    error,
    errorObj,
    isPolling,
    pollTimedOut,
    refetch: fetchResult,
    stopPolling,
  }
}
