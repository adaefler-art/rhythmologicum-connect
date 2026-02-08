/**
 * DiagnosisSection Component
 * 
 * Displays diagnosis runs for a patient and allows clinicians to queue runs
 * and view latest artifacts.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card } from '@/lib/ui'
import { Brain, RefreshCcw } from 'lucide-react'
import { getDiagnosisRuns } from '@/lib/fetchClinician'
import { featureFlags } from '@/lib/featureFlags'

type DiagnosisRun = {
  id: string
  status: string
  created_at: string
  updated_at?: string
  inputs_hash: string
  started_at: string | null
  completed_at: string | null
  error_code: string | null
  error_message: string | null
  processing_time_ms?: number | null
  summary?: {
    risk_level?: string | null
    confidence_score?: number | null
    primary_findings?: string[] | null
    result_json?: Record<string, unknown> | null
  } | null
  is_optimistic?: boolean
}

type ArtifactState = {
  status: 'idle' | 'loading' | 'success' | 'empty' | 'error'
  data?: Record<string, unknown>
  message?: string
  meta?: {
    requestId?: string | null
    traceId?: string | null
    errorCode?: string | null
  }
}

type DiagnosisGateStatus = 'checking' | 'available' | 'unavailable' | 'forbidden' | 'disabled'

const DIAGNOSIS_HEALTH_ENDPOINT = '/api/studio/diagnosis/health'
const GATE_TIMEOUT_MS = 8000
const QUEUE_TIMEOUT_MS = 60000

export interface DiagnosisSectionProps {
  patientId: string
}

export function DiagnosisSection({ patientId }: DiagnosisSectionProps) {
  const router = useRouter()
  const [runs, setRuns] = useState<DiagnosisRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isQueueing, setIsQueueing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [artifactStates, setArtifactStates] = useState<Record<string, ArtifactState>>({})
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [debugHint, setDebugHint] = useState<string | null>(null)
  const [gateStatus, setGateStatus] = useState<DiagnosisGateStatus>('checking')
  const [gateMessage, setGateMessage] = useState<string | null>(null)
  const [isGateChecking, setIsGateChecking] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const pollAttemptsRef = useRef<Record<string, number>>({})

  const orderedRuns = useMemo(() => {
    return [...runs].sort((a, b) => {
      if (a.is_optimistic && !b.is_optimistic) return -1
      if (!a.is_optimistic && b.is_optimistic) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [runs])

  useEffect(() => {
    checkDiagnosisGate()
    fetchRuns()
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
        pollingRef.current = null
      }
      pollAttemptsRef.current = {}
    }
  }, [patientId])

  const logGateEvent = (payload: Record<string, unknown>) => {
    console.info('[DiagnosisGate]', payload)
  }

  const checkDiagnosisGate = async (): Promise<DiagnosisGateStatus> => {
    if (!featureFlags.DIAGNOSIS_V1_ENABLED) {
      const nextStatus: DiagnosisGateStatus = 'disabled'
      setGateStatus(nextStatus)
      setGateMessage('Diagnose-Funktion ist derzeit deaktiviert.')
      logGateEvent({
        endpoint: DIAGNOSIS_HEALTH_ENDPOINT,
        status: 'disabled',
        ts: new Date().toISOString(),
      })
      return nextStatus
    }

    setIsGateChecking(true)
    setGateStatus('checking')
    setGateMessage(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), GATE_TIMEOUT_MS)

    try {
      const response = await fetch('/api/studio/diagnosis/health', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      const payload = await response.json().catch(() => null)
      const errorCode = payload && typeof payload === 'object'
        ? (payload as { error?: { code?: string } }).error?.code
        : undefined

      const requestId = response.headers.get('x-request-id')

      if (response.ok) {
        setGateStatus('available')
        logGateEvent({
          endpoint: DIAGNOSIS_HEALTH_ENDPOINT,
          status: response.status,
          requestId,
          ts: new Date().toISOString(),
        })
        return 'available'
      }

      if (response.status === 401 || response.status === 403) {
        setGateStatus('forbidden')
        setGateMessage('Keine Berechtigung für Diagnose-Start.')
        logGateEvent({
          endpoint: DIAGNOSIS_HEALTH_ENDPOINT,
          status: response.status,
          requestId,
          ts: new Date().toISOString(),
        })
        return 'forbidden'
      }

      if (response.status === 503) {
        setGateStatus('unavailable')
        if (errorCode && ['MCP_NOT_CONFIGURED', 'MCP_UNREACHABLE', 'MCP_BAD_RESPONSE'].includes(errorCode)) {
          setGateMessage('MCP nicht erreichbar.')
        } else {
          setGateMessage('Diagnose-Service derzeit nicht verfuegbar.')
        }
        logGateEvent({
          endpoint: DIAGNOSIS_HEALTH_ENDPOINT,
          status: response.status,
          errorCode,
          requestId,
          ts: new Date().toISOString(),
        })
        return 'unavailable'
      }

      setGateStatus('unavailable')
      setGateMessage('Diagnose-Service derzeit nicht verfuegbar.')
      logGateEvent({
        endpoint: DIAGNOSIS_HEALTH_ENDPOINT,
        status: response.status,
        errorCode,
        requestId,
        ts: new Date().toISOString(),
      })
      return 'unavailable'
    } catch (err) {
      const status = err instanceof DOMException && err.name === 'AbortError'
        ? 'timeout'
        : 'network_error'
      setGateStatus('unavailable')
      setGateMessage('Diagnose-Service derzeit nicht verfuegbar.')
      logGateEvent({
        endpoint: DIAGNOSIS_HEALTH_ENDPOINT,
        status,
        ts: new Date().toISOString(),
      })
      return 'unavailable'
    } finally {
      clearTimeout(timeout)
      setIsGateChecking(false)
    }
  }

  const fetchRuns = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true)
      setError(null)
      setDebugHint(null)
    }

    try {
      const { data, error, debugHint } = await getDiagnosisRuns(patientId)

      if (!options?.silent) {
        setDebugHint(debugHint ?? null)
        if (error) {
          if (error.status === 403) {
            setError('Keine Berechtigung für diesen Patienten')
          } else if (error.status === 404) {
            setError('Patient nicht gefunden oder nicht zugewiesen')
          } else {
            setError(error.message || 'Fehler beim Laden der Diagnose-Runs')
          }
          return []
        }
      }

      if (data?.success) {
        const payload = data.data
        const resolvedRuns = Array.isArray(payload)
          ? payload
          : payload?.runs || []
        setRuns(resolvedRuns as DiagnosisRun[])
        return resolvedRuns as DiagnosisRun[]
      } else {
        if (!options?.silent) {
          setError('Fehler beim Laden der Diagnose-Runs')
        }
        return []
      }
    } catch (err) {
      if (!options?.silent) {
        console.error('[DiagnosisSection] Fetch error:', err)
        setError('Fehler beim Laden der Diagnose-Runs')
      }
      return []
    } finally {
      if (!options?.silent) {
        setIsLoading(false)
      }
    }
  }

  const pollRunStatus = async (runId: string) => {
    const attempts = pollAttemptsRef.current[runId] ?? 0
    if (attempts >= 12) {
      return
    }
    pollAttemptsRef.current[runId] = attempts + 1

    const latestRuns = await fetchRuns({ silent: true })
    const foundRun = latestRuns.find((run) => run.id === runId)
    const status = foundRun?.status?.toLowerCase()
    if (status === 'completed' || status === 'failed') {
      return
    }

    pollingRef.current = setTimeout(() => {
      pollRunStatus(runId)
    }, 5000)
  }

  const handleQueueRun = async () => {
    const gate = await checkDiagnosisGate()
    if (gate !== 'available') {
      return
    }

    setIsQueueing(true)
    setStatusMessage(null)
    setError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), QUEUE_TIMEOUT_MS)

    try {
      const response = await fetch('/api/studio/diagnosis/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ patient_id: patientId }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.success) {
        if (response.status === 401 || response.status === 403) {
          setError('Keine Berechtigung für diesen Patienten')
          setGateStatus('forbidden')
        } else if (response.status === 404 || response.status === 422) {
          setError('Patient nicht gefunden oder ungültige ID')
        } else if (response.status === 503) {
          const errorCode = result?.error?.code
          if (errorCode && ['MCP_NOT_CONFIGURED', 'MCP_UNREACHABLE', 'MCP_BAD_RESPONSE', 'MCP_ERROR'].includes(errorCode)) {
            setGateStatus('unavailable')
            setGateMessage('MCP nicht erreichbar.')
          } else if (errorCode === 'FEATURE_DISABLED') {
            setGateStatus('disabled')
            setGateMessage('Diagnose-Funktion ist derzeit deaktiviert.')
          } else if (errorCode === 'LLM_NOT_CONFIGURED') {
            setGateStatus('unavailable')
            setGateMessage('LLM nicht konfiguriert.')
          } else {
            setGateStatus('unavailable')
            setGateMessage('Diagnose-Service derzeit nicht verfuegbar.')
          }
        } else {
          setError(result.error?.message || 'Fehler beim Starten der Diagnose')
        }
        return
      }

      const runId = result.data?.run_id || result.data?.runId

      if (runId) {
        const optimisticRun: DiagnosisRun = {
          id: runId,
          status: 'running',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          inputs_hash: result.data?.inputs_hash || 'pending',
          started_at: new Date().toISOString(),
          completed_at: null,
          error_code: null,
          error_message: null,
          processing_time_ms: null,
          summary: null,
          is_optimistic: true,
        }
        setRuns((prev) => [optimisticRun, ...prev.filter((run) => run.id !== runId)])
      }

      if (result.data?.is_duplicate) {
        setStatusMessage('Diagnose bereits kürzlich gestartet (Duplikat erkannt)')
      } else {
        setStatusMessage('Diagnose gestartet')
      }

      router.refresh()
      await fetchRuns({ silent: true })

      if (runId && !result.data?.is_duplicate) {
        pollRunStatus(runId)
      }
    } catch (err) {
      console.error('[DiagnosisSection] Queue error:', err)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setGateStatus('unavailable')
        setGateMessage('MCP Timeout.')
        setError('Diagnose-Anfrage dauerte zu lange (Timeout)')
      } else {
        setError('Fehler beim Starten der Diagnose')
      }
    } finally {
      clearTimeout(timeout)
      setIsQueueing(false)
    }
  }

  const handleViewArtifact = async (runId: string) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null)
      return
    }

    setExpandedRunId(runId)
    setArtifactStates((prev) => ({
      ...prev,
      [runId]: { status: 'loading' },
    }))

    try {
      const response = await fetch(`/api/studio/diagnosis/runs/${runId}`)
      const requestId =
        response.headers.get('x-request-id') ||
        response.headers.get('x-correlation-id') ||
        response.headers.get('x-requestid')

      if (!response.ok) {
        const message =
          response.status === 403
            ? 'Keine Berechtigung'
            : response.status === 404
              ? `Run not found in API (runId: ${runId})`
              : 'Fehler beim Laden des Ergebnisses'
        setArtifactStates((prev) => ({
          ...prev,
          [runId]: {
            status: response.status === 404 ? 'error' : 'error',
            message,
            meta: {
              requestId,
            },
          },
        }))
        return
      }

      const result = await response.json()
      if (!result.success) {
        const errorCode =
          result && typeof result === 'object'
            ? (result as { error?: { code?: string } }).error?.code
            : undefined
        if (response.status === 404 && errorCode === 'RUN_NOT_FOUND') {
          setArtifactStates((prev) => ({
            ...prev,
            [runId]: {
              status: 'error',
              message: `Run not found in API (runId: ${runId})`,
              meta: {
                requestId,
              },
            },
          }))
          return
        }
        if (response.status === 404 && errorCode === 'ARTIFACT_NOT_FOUND') {
          setArtifactStates((prev) => ({
            ...prev,
            [runId]: {
              status: 'empty',
              message: 'Noch kein Artifact gespeichert.',
              meta: {
                requestId,
              },
            },
          }))
          return
        }
        setArtifactStates((prev) => ({
          ...prev,
          [runId]: {
            status: 'error',
            message: 'Fehler beim Laden des Ergebnisses',
            meta: {
              requestId,
            },
          },
        }))
        return
      }

      const detailData = result.data ?? null
      const artifact = detailData?.artifact ?? null
      const traceId =
        artifact?.artifact_data?.metadata?.trace_id ||
        artifact?.artifact_data?.metadata?.traceId ||
        null
      const errorCode = detailData?.run?.error_code ?? null
      const runStatus = detailData?.run?.status ?? null

      if (runStatus === 'failed') {
        setArtifactStates((prev) => ({
          ...prev,
          [runId]: {
            status: 'success',
            message: 'Diagnose fehlgeschlagen.',
            data: detailData ?? undefined,
            meta: {
              requestId,
              traceId,
              errorCode,
            },
          },
        }))
        return
      }

      if (!artifact) {
        setArtifactStates((prev) => ({
          ...prev,
          [runId]: {
            status: 'empty',
            message: `Noch kein Artifact gespeichert. Status: ${runStatus || 'unbekannt'}`,
            data: detailData ?? undefined,
            meta: {
              requestId,
              traceId,
              errorCode,
            },
          },
        }))
        return
      }

      setArtifactStates((prev) => ({
        ...prev,
        [runId]: {
          status: 'success',
          data: artifact?.artifact_data ?? detailData ?? undefined,
          meta: {
            requestId,
            traceId,
            errorCode,
          },
        },
      }))
    } catch (err) {
      console.error('[DiagnosisSection] Result error:', err)
      setArtifactStates((prev) => ({
        ...prev,
        [runId]: {
          status: 'error',
          message: 'Fehler beim Laden des Ergebnisses',
        },
      }))
    }
  }

  const formatDate = (isoString: string | null): string => {
    if (!isoString) return '—'
    try {
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoString))
    } catch {
      return 'Datum unbekannt'
    }
  }

  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'running':
        return 'info'
      case 'queued':
        return 'warning'
      case 'failed':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string): string => {
    if (status === 'completed') return 'succeeded'
    return status
  }

  const shortHash = (hash: string): string => {
    if (!hash) return '—'
    return hash.length > 12 ? `${hash.slice(0, 12)}…` : hash
  }

  return (
    <div className="space-y-6">
      <Card padding="lg" shadow="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Diagnose</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Diagnose-Runs für diese:n Patient:in verwalten und Ergebnisse einsehen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRuns()}
              icon={<RefreshCcw className="h-4 w-4" />}
            >
              Aktualisieren
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Brain className="h-4 w-4" />}
              onClick={handleQueueRun}
              disabled={isQueueing || isGateChecking || gateStatus !== 'available'}
            >
              {isQueueing ? 'Diagnose startet…' : 'Diagnose starten'}
            </Button>
          </div>
        </div>

        {gateStatus === 'checking' && (
          <div className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
            Diagnose-Status wird geprueft…
          </div>
        )}

        {gateStatus === 'disabled' && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Diagnose-Funktion ist derzeit deaktiviert.
          </div>
        )}

        {gateStatus === 'forbidden' && (
          <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Keine Berechtigung fuer Diagnose-Start.
          </div>
        )}

        {gateStatus === 'unavailable' && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>{gateMessage || 'Diagnose-Service derzeit nicht verfuegbar.'}</span>
            <Button variant="outline" size="sm" onClick={checkDiagnosisGate} disabled={isGateChecking}>
              Retry
            </Button>
          </div>
        )}

        {statusMessage && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            {debugHint && (
              <div className="mt-2 text-xs text-amber-600">{debugHint}</div>
            )}
          </div>
        )}
      </Card>

      <Card padding="lg" shadow="md">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">Runs</h3>

        {isLoading ? (
          <div className="py-6 text-sm text-slate-500">Lade Diagnose-Runs...</div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col gap-3 py-6 text-sm text-slate-500">
            <span>Keine Diagnose-Runs vorhanden.</span>
            <Button
              variant="outline"
              size="sm"
              icon={<Brain className="h-4 w-4" />}
              onClick={handleQueueRun}
              disabled={isQueueing || isGateChecking || gateStatus !== 'available'}
            >
              Diagnose starten
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orderedRuns.map((run) => {
              const artifactState = artifactStates[run.id] || { status: 'idle' }
              const isExpanded = expandedRunId === run.id
              const summary = run.summary
              const hasArtifact = Boolean(summary?.result_json)
              const isCompleted = run.status === 'completed'
              const isFailed = run.status === 'failed'
              const isQueued = run.status === 'queued'
              const isRunning = run.status === 'running'
              const isInconsistent = isCompleted && !hasArtifact
              const riskLevel = summary?.risk_level
              const findings = summary?.primary_findings || []
              const actionLabel = 'View Result'
              const actionDisabled = !hasArtifact

              return (
                <div key={run.id} className="rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusVariant(run.status)} size="sm">
                          {getStatusLabel(run.status)}
                        </Badge>
                        {isInconsistent && (
                          <Badge variant="warning" size="sm">
                            INCONSISTENT_STATE
                          </Badge>
                        )}
                        {run.is_optimistic && (
                          <span className="text-xs text-amber-600">Optimistisch</span>
                        )}
                        <span className="text-xs text-slate-500">Run ID: {run.id}</span>
                      </div>
                      {(isQueued || isRunning) && (
                        <div className="text-xs text-slate-500">
                          Diagnose wird erstellt...
                        </div>
                      )}
                      {isInconsistent && (
                        <div className="text-xs text-amber-700">
                          Server konnte Ergebnis nicht persistieren.
                        </div>
                      )}
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        Erstellt: {formatDate(run.created_at)}
                      </div>
                      {run.completed_at && (
                        <div className="text-xs text-slate-500">
                          Abgeschlossen: {formatDate(run.completed_at)}
                        </div>
                      )}
                      {typeof run.processing_time_ms === 'number' && (
                        <div className="text-xs text-slate-500">
                          Laufzeit: {Math.round(run.processing_time_ms / 1000)}s
                        </div>
                      )}
                      <div className="text-xs text-slate-500">Inputs Hash: {shortHash(run.inputs_hash)}</div>
                      {riskLevel && (
                        <div className="text-xs text-slate-600">
                          Risiko: {riskLevel}
                        </div>
                      )}
                      {findings.length > 0 && (
                        <div className="text-xs text-slate-600">
                          Findings: {findings.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 md:items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewArtifact(run.id)}
                        disabled={actionDisabled}
                      >
                        {isExpanded ? 'Ausblenden' : actionLabel}
                      </Button>
                      {run.error_code && (
                        <span className="text-xs text-red-600">{run.error_code}</span>
                      )}
                      {run.error_message && (
                        <span className="text-xs text-red-600">{run.error_message}</span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                      {artifactState.status === 'loading' && (
                        <div className="text-sm text-slate-500">Lade Ergebnis...</div>
                      )}
                      {artifactState.status === 'empty' && (
                        <div className="space-y-2 text-sm text-slate-500">
                          <div>{artifactState.message}</div>
                          {artifactState.meta?.requestId && (
                            <div className="text-xs text-slate-500">
                              requestId: {artifactState.meta.requestId}
                            </div>
                          )}
                          {artifactState.meta?.traceId && (
                            <div className="text-xs text-slate-500">
                              trace_id: {artifactState.meta.traceId}
                            </div>
                          )}
                          {artifactState.meta?.errorCode && (
                            <div className="text-xs text-slate-500">
                              error_code: {artifactState.meta.errorCode}
                            </div>
                          )}
                        </div>
                      )}
                      {artifactState.status === 'error' && (
                        <div className="text-sm text-red-600">{artifactState.message}</div>
                      )}
                      {artifactState.status === 'success' && artifactState.data && (
                        <div className="space-y-2">
                          {artifactState.message && (
                            <div className="text-sm text-slate-500">{artifactState.message}</div>
                          )}
                          {artifactState.meta?.requestId && (
                            <div className="text-xs text-slate-500">
                              requestId: {artifactState.meta.requestId}
                            </div>
                          )}
                          {artifactState.meta?.traceId && (
                            <div className="text-xs text-slate-500">
                              trace_id: {artifactState.meta.traceId}
                            </div>
                          )}
                          {artifactState.meta?.errorCode && (
                            <div className="text-xs text-slate-500">
                              error_code: {artifactState.meta.errorCode}
                            </div>
                          )}
                          <pre className="max-h-96 overflow-auto rounded bg-white dark:bg-slate-900 p-4 text-xs text-slate-800 dark:text-slate-200">
                            {JSON.stringify(artifactState.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
