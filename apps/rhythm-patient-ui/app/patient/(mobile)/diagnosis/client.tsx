'use client'

/**
 * E76.6: Patient Diagnosis Runs List Client Component
 * 
 * Displays a list of diagnosis runs with status, timestamps, and navigation to detail view.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type DiagnosisRun = {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  error_code: string | null
  error_message: string | null
}

type LoadingState = 'loading' | 'success' | 'error' | 'empty'

export default function DiagnosisListClient() {
  const router = useRouter()
  const [runs, setRuns] = useState<DiagnosisRun[]>([])
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    async function fetchRuns() {
      try {
        setLoadingState('loading')
        
        const response = await fetch('/api/patient/diagnosis/runs')
        const result = await response.json()

        if (!response.ok || !result.success) {
          setLoadingState('error')
          setErrorMessage(result.error?.message || 'Failed to load diagnosis runs')
          return
        }

        if (result.data.length === 0) {
          setLoadingState('empty')
        } else {
          setRuns(result.data)
          setLoadingState('success')
        }
      } catch (error) {
        console.error('Error fetching diagnosis runs:', error)
        setLoadingState('error')
        setErrorMessage('An unexpected error occurred')
      }
    }

    fetchRuns()
  }, [])

  const getStatusColor = (status: DiagnosisRun['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'queued':
        return 'bg-gray-100 text-gray-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const handleRunClick = (runId: string) => {
    router.push(`/patient/diagnosis/${runId}`)
  }

  if (loadingState === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-gray-600">Diagnosis-Läufe werden geladen...</p>
      </div>
    )
  }

  if (loadingState === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">Fehler beim Laden</h2>
          <p className="mt-2 text-red-600">{errorMessage}</p>
        </div>
      </div>
    )
  }

  if (loadingState === 'empty') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-800">Keine Diagnose-Läufe</h2>
          <p className="mt-2 text-gray-600">
            Es wurden noch keine Diagnose-Analysen für Sie erstellt.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Diagnose-Analysen</h1>
        
        <div className="space-y-4">
          {runs.map((run) => (
            <div
              key={run.id}
              onClick={() => handleRunClick(run.id)}
              className="cursor-pointer rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(run.status)}`}
                    >
                      {run.status === 'completed' && 'Abgeschlossen'}
                      {run.status === 'running' && 'Läuft'}
                      {run.status === 'queued' && 'In Warteschlange'}
                      {run.status === 'failed' && 'Fehlgeschlagen'}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Erstellt: {formatDate(run.created_at)}</p>
                    {run.completed_at && (
                      <p>Abgeschlossen: {formatDate(run.completed_at)}</p>
                    )}
                  </div>

                  {run.error_message && (
                    <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
                      {run.error_message}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
