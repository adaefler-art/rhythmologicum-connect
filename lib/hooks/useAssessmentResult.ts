import { useCallback, useEffect, useRef, useState } from 'react'

// =========================
// Types for Funnel Runtime Result
// =========================

export interface RuntimeResultResponse {
  success: boolean
  data?: {
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
}

export interface UseAssessmentResultReturn {
  data: RuntimeResultResponse['data'] | null
  isLoading: boolean
  error: string | null
  errorObj?: { code?: string; message?: string; details?: Record<string, unknown> } | null
  refetch: () => void
}

/**
 * useAssessmentResult
 *
 * Loads assessment result from Funnel Runtime endpoint.
 *
 * @param {Object} options
 * @param {string|null} options.slug - Funnel slug
 * @param {string|null} options.assessmentId - Assessment ID
 * @returns {Object} { data, isLoading, error, refetch }
 *
 * Example:
 *   const { data, isLoading, error, refetch } = useAssessmentResult({ slug, assessmentId })
 */
export function useAssessmentResult({ slug, assessmentId }: UseAssessmentResultOptions): UseAssessmentResultReturn {
  const [data, setData] = useState<RuntimeResultResponse['data'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorObj, setErrorObj] = useState<{ code?: string; message?: string; details?: Record<string, unknown> } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastSuccessData = useRef<RuntimeResultResponse['data'] | null>(null)

  const fetchResult = useCallback(() => {
    if (!slug || !assessmentId) {
      setData(null)
      setError(null)
      setErrorObj(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
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
          const errorObj = json?.error as { code?: string; message?: string; details?: Record<string, unknown> }
          const err = new Error(json?.error?.message || 'Fehler beim Laden des Ergebnisses') as Error & { errorObj?: { code?: string; message?: string; details?: Record<string, unknown> } }
          err.errorObj = errorObj
          throw err
        }
        return json
      })
      .then((json) => {
        setData(json.data || null)
        lastSuccessData.current = json.data || null
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
        setErrorObj((err as { errorObj?: { code?: string; message?: string; details?: Record<string, unknown> } })?.errorObj || null)
        setIsLoading(false)
        // Keep last successful data to avoid flicker
        setData(lastSuccessData.current)
      })
  }, [slug, assessmentId])

  useEffect(() => {
    // Avoid direct setState in effect body (react-hooks/set-state-in-effect)
    queueMicrotask(fetchResult)
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [fetchResult])

  return {
    data,
    isLoading,
    error,
    errorObj,
    refetch: fetchResult,
  }
}
