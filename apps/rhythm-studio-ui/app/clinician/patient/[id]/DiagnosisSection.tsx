/**
 * DiagnosisSection Component
 * 
 * Displays diagnosis runs for a patient and allows clinicians to queue runs
 * and view latest artifacts.
 */

import { useEffect, useState } from 'react'
import { Badge, Button, Card } from '@/lib/ui'
import { Brain, RefreshCcw } from 'lucide-react'
import { getDiagnosisRuns } from '@/lib/fetchClinician'
import { featureFlags } from '@/lib/featureFlags'

type DiagnosisRun = {
  id: string
  status: string
  created_at: string
  inputs_hash: string
  started_at: string | null
  completed_at: string | null
  error_code: string | null
  error_message: string | null
}

type ArtifactState = {
  status: 'idle' | 'loading' | 'success' | 'empty' | 'error'
  data?: Record<string, unknown>
  message?: string
}

type DiagnosisGateStatus = 'checking' | 'available' | 'unavailable' | 'forbidden' | 'disabled'

const DIAGNOSIS_HEALTH_ENDPOINT = '/api/studio/diagnosis/health'
const GATE_TIMEOUT_MS = 8000

export interface DiagnosisSectionProps {
  patientId: string
}

export function DiagnosisSection({ patientId }: DiagnosisSectionProps) {
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

  useEffect(() => {
    checkDiagnosisGate()
    fetchRuns()
  }, [patientId])

  const logGateEvent = (payload: Record<string, unknown>) => {
    console.info('[DiagnosisGate]', payload)
  }

  const checkDiagnosisGate = async (): Promise<DiagnosisGateStatus> => {
    if (!featureFlags.DIAGNOSIS_ENABLED) {
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
      const response = await fetch(DIAGNOSIS_HEALTH_ENDPOINT, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

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
        setGateMessage('Diagnose-Service derzeit nicht verfuegbar.')
        logGateEvent({
          endpoint: DIAGNOSIS_HEALTH_ENDPOINT,
          status: response.status,
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

  const fetchRuns = async () => {
    setIsLoading(true)
    setError(null)
    setDebugHint(null)

    try {
      const { data, error, debugHint } = await getDiagnosisRuns(patientId)

      setDebugHint(debugHint ?? null)
      if (error) {
        if (error.status === 403) {
          setError('Keine Berechtigung für diesen Patienten')
        } else if (error.status === 404) {
          setError('Patient nicht gefunden oder nicht zugewiesen')
        } else {
          setError(error.message || 'Fehler beim Laden der Diagnose-Runs')
        }
        return
      }

      if (data?.success) {
        setRuns((data.data || []) as DiagnosisRun[])
      } else {
        setError('Fehler beim Laden der Diagnose-Runs')
      }
    } catch (err) {
      console.error('[DiagnosisSection] Fetch error:', err)
      setError('Fehler beim Laden der Diagnose-Runs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQueueRun = async () => {
    const gate = await checkDiagnosisGate()
    if (gate !== 'available') {
      return
    }

    setIsQueueing(true)
    setStatusMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/studio/diagnosis/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.success) {
        if (response.status === 401 || response.status === 403) {
          setError('Keine Berechtigung für diesen Patienten')
          setGateStatus('forbidden')
        } else if (response.status === 503) {
          setGateStatus('disabled')
          setGateMessage('Diagnose-Funktion ist derzeit deaktiviert.')
        } else {
          setError(result.error?.message || 'Fehler beim Starten der Diagnose')
        }
        return
      }

      if (result.data?.is_duplicate) {
        setStatusMessage('Diagnose bereits kürzlich gestartet (Duplikat erkannt)')
      } else {
        setStatusMessage('Diagnose gestartet')
      }

      await fetchRuns()
    } catch (err) {
      console.error('[DiagnosisSection] Queue error:', err)
      setError('Fehler beim Starten der Diagnose')
    } finally {
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
      const response = await fetch(`/api/studio/diagnosis/runs/${runId}/artifact`)

      if (response.status === 404) {
        setArtifactStates((prev) => ({
          ...prev,
          [runId]: {
            status: 'empty',
            message: 'Noch kein Ergebnis',
          },
        }))
        return
      }

      if (!response.ok) {
        setArtifactStates((prev) => ({
          ...prev,
          [runId]: {
            status: 'error',
            message: response.status === 403 ? 'Keine Berechtigung' : 'Fehler beim Laden des Ergebnisses',
          },
        }))
        return
      }

      const result = await response.json()
      if (!result.success) {
        setArtifactStates((prev) => ({
          ...prev,
          [runId]: {
            status: 'error',
            message: 'Fehler beim Laden des Ergebnisses',
          },
        }))
        return
      }

      setArtifactStates((prev) => ({
        ...prev,
        [runId]: {
          status: 'success',
          data: result.data,
        },
      }))
    } catch (err) {
      console.error('[DiagnosisSection] Artifact error:', err)
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
              onClick={fetchRuns}
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
          <div className="py-6 text-sm text-slate-500">Lade Diagnose-Runs…</div>
        ) : runs.length === 0 ? (
          <div className="py-6 text-sm text-slate-500">Keine Diagnose-Runs vorhanden.</div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => {
              const artifactState = artifactStates[run.id] || { status: 'idle' }
              const isExpanded = expandedRunId === run.id

              return (
                <div key={run.id} className="rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusVariant(run.status)} size="sm">
                          {run.status}
                        </Badge>
                        <span className="text-xs text-slate-500">Run ID: {run.id}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        Erstellt: {formatDate(run.created_at)}
                      </div>
                      <div className="text-xs text-slate-500">Inputs Hash: {shortHash(run.inputs_hash)}</div>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewArtifact(run.id)}
                      >
                        {isExpanded ? 'Ausblenden' : 'View Result'}
                      </Button>
                      {run.error_message && (
                        <span className="text-xs text-red-600">{run.error_message}</span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                      {artifactState.status === 'loading' && (
                        <div className="text-sm text-slate-500">Lade Ergebnis…</div>
                      )}
                      {artifactState.status === 'empty' && (
                        <div className="text-sm text-slate-500">{artifactState.message}</div>
                      )}
                      {artifactState.status === 'error' && (
                        <div className="text-sm text-red-600">{artifactState.message}</div>
                      )}
                      {artifactState.status === 'success' && artifactState.data && (
                        <pre className="max-h-96 overflow-auto rounded bg-white dark:bg-slate-900 p-4 text-xs text-slate-800 dark:text-slate-200">
                          {JSON.stringify(artifactState.data, null, 2)}
                        </pre>
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
