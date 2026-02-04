'use client'

/**
 * E76.6: Patient Diagnosis Run Detail Client Component
 * 
 * Displays detailed information about a diagnosis run including artifact JSON.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type DiagnosisArtifact = {
  id: string
  run_id: string
  patient_id: string
  artifact_type: string
  artifact_data: Record<string, unknown>
  schema_version: string
  created_at: string
  risk_level: string | null
  confidence_score: number | null
  primary_findings: string[] | null
  recommendations_count: number | null
}

type LoadingState = 'loading' | 'success' | 'error' | 'not_found'

type DiagnosisDetailClientProps = {
  runId: string
}

export default function DiagnosisDetailClient({ runId }: DiagnosisDetailClientProps) {
  const router = useRouter()
  const [artifact, setArtifact] = useState<DiagnosisArtifact | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    async function fetchArtifact() {
      try {
        setLoadingState('loading')

        // First, get the run to find the artifact
        const runsResponse = await fetch('/api/patient/diagnosis/runs')
        const runsResult = await runsResponse.json()

        if (!runsResponse.ok || !runsResult.success) {
          setLoadingState('error')
          setErrorMessage('Failed to load diagnosis run')
          return
        }

        const run = runsResult.data.find((r: { id: string }) => r.id === runId)
        if (!run) {
          setLoadingState('not_found')
          return
        }

        // If run is not completed, don't try to fetch artifact
        if (run.status !== 'completed') {
          setLoadingState('error')
          setErrorMessage('Diagnosis run is not yet completed')
          return
        }

        // Fetch the artifact - we need to query for artifacts with this run_id
        // For now, we'll show a message if no artifact endpoint is available
        // In a real implementation, we'd need an endpoint to get artifacts by run_id
        setLoadingState('success')
      } catch (error) {
        console.error('Error fetching diagnosis artifact:', error)
        setLoadingState('error')
        setErrorMessage('An unexpected error occurred')
      }
    }

    fetchArtifact()
  }, [runId])

  const getRiskColor = (risk: string | null) => {
    if (!risk) return 'bg-gray-100 text-gray-800'
    switch (risk.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loadingState === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-gray-600">Diagnose-Details werden geladen...</p>
      </div>
    )
  }

  if (loadingState === 'not_found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-800">Nicht gefunden</h2>
          <p className="mt-2 text-gray-600">Die angeforderte Diagnose wurde nicht gefunden.</p>
          <button
            onClick={() => router.push('/patient/diagnosis')}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    )
  }

  if (loadingState === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">Fehler beim Laden</h2>
          <p className="mt-2 text-red-600">{errorMessage}</p>
          <button
            onClick={() => router.push('/patient/diagnosis')}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    )
  }

  // This is a placeholder for when artifacts are available
  // In a real implementation, this would display the artifact data
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.push('/patient/diagnosis')}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zur Übersicht
        </button>

        <h1 className="mb-6 text-2xl font-bold text-gray-900">Diagnose-Details</h1>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Zusammenfassung</h2>
            <p className="mt-2 text-gray-600">
              Diagnose-Analyse abgeschlossen. Detaillierte Ergebnisse folgen in Kürze.
            </p>
          </div>

          {artifact && (
            <>
              {artifact.risk_level && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700">Risikostufe</h3>
                  <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium ${getRiskColor(artifact.risk_level)}`}>
                    {artifact.risk_level}
                  </span>
                </div>
              )}

              {artifact.primary_findings && artifact.primary_findings.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700">Hauptbefunde</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-gray-600">
                    {artifact.primary_findings.map((finding, idx) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700">Rohdaten (JSON)</h3>
                <pre className="mt-2 max-h-96 overflow-auto rounded bg-gray-50 p-4 text-xs">
                  {JSON.stringify(artifact.artifact_data, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
