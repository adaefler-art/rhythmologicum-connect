'use client'

import { useState } from 'react'

/**
 * E76.3: Diagnosis Runs Panel (Feature-Flagged)
 * 
 * Minimal wiring component that demonstrates calling all diagnosis runs API endpoints.
 * This is a feature-flagged component for testing the API implementation.
 * 
 * @param patientId - The patient ID to fetch/create runs for
 */
export function DiagnosisRunsPanel({ patientId }: { patientId: string }) {
  const [runs, setRuns] = useState<any[]>([])
  const [selectedRun, setSelectedRun] = useState<any>(null)
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // E76.3: POST /api/studio/patients/{patientId}/diagnosis-runs
  const createRun = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/studio/patients/${patientId}/diagnosis-runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_config: { test: 'sample config' },
        }),
      })
      const data = await response.json()
      if (data.success) {
        setRuns([data.data.run, ...runs])
        alert('Run created successfully')
      } else {
        setError(data.error?.message || 'Failed to create run')
      }
    } catch (err) {
      setError('Network error creating run')
    } finally {
      setLoading(false)
    }
  }

  // E76.3: GET /api/studio/patients/{patientId}/diagnosis-runs
  const fetchRuns = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/studio/patients/${patientId}/diagnosis-runs`)
      const data = await response.json()
      if (data.success) {
        setRuns(data.data.runs)
      } else {
        setError(data.error?.message || 'Failed to fetch runs')
      }
    } catch (err) {
      setError('Network error fetching runs')
    } finally {
      setLoading(false)
    }
  }

  // E76.3: GET /api/studio/diagnosis-runs/{runId}
  const fetchRun = async (runId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/studio/diagnosis-runs/${runId}`)
      const data = await response.json()
      if (data.success) {
        setSelectedRun(data.data.run)
      } else {
        setError(data.error?.message || 'Failed to fetch run')
      }
    } catch (err) {
      setError('Network error fetching run')
    } finally {
      setLoading(false)
    }
  }

  // E76.3: GET /api/studio/diagnosis-runs/{runId}/artifacts
  const fetchArtifacts = async (runId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/studio/diagnosis-runs/${runId}/artifacts`)
      const data = await response.json()
      if (data.success) {
        setArtifacts(data.data.artifacts)
      } else {
        setError(data.error?.message || 'Failed to fetch artifacts')
      }
    } catch (err) {
      setError('Network error fetching artifacts')
    } finally {
      setLoading(false)
    }
  }

  // E76.3: GET /api/studio/diagnosis-artifacts/{artifactId}
  const fetchArtifact = async (artifactId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/studio/diagnosis-artifacts/${artifactId}`)
      const data = await response.json()
      if (data.success) {
        setSelectedArtifact(data.data.artifact)
      } else {
        setError(data.error?.message || 'Failed to fetch artifact')
      }
    } catch (err) {
      setError('Network error fetching artifact')
    } finally {
      setLoading(false)
    }
  }

  // Feature flag check - only show if enabled
  if (typeof window !== 'undefined' && !window.location.search.includes('enableDiagnosisRuns')) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">
        Diagnosis Runs (E76.3 - Feature Flagged)
      </h3>
      
      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={createRun}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create Run
          </button>
          <button
            onClick={fetchRuns}
            disabled={loading}
            className="rounded bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Fetch Runs
          </button>
        </div>

        {/* Runs list */}
        {runs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Runs ({runs.length})</h4>
            {runs.map((run) => (
              <div key={run.id} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-gray-500">{run.id}</span>
                    <span className="ml-2 rounded bg-blue-100 px-2 py-1 text-xs">
                      {run.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchRun(run.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </button>
                    <button
                      onClick={() => fetchArtifacts(run.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Artifacts
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected run details */}
        {selectedRun && (
          <div className="rounded border border-blue-200 bg-blue-50 p-3">
            <h4 className="mb-2 font-medium">Selected Run</h4>
            <pre className="text-xs">{JSON.stringify(selectedRun, null, 2)}</pre>
          </div>
        )}

        {/* Artifacts list */}
        {artifacts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Artifacts ({artifacts.length})</h4>
            {artifacts.map((artifact) => (
              <div key={artifact.id} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-gray-500">{artifact.id}</span>
                    <span className="ml-2 text-sm">{artifact.artifact_name}</span>
                  </div>
                  <button
                    onClick={() => fetchArtifact(artifact.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected artifact details */}
        {selectedArtifact && (
          <div className="rounded border border-green-200 bg-green-50 p-3">
            <h4 className="mb-2 font-medium">Selected Artifact</h4>
            <pre className="text-xs">{JSON.stringify(selectedArtifact, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
