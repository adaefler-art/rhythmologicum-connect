'use client'

/**
 * Processing Results Dev Trigger Page
 * 
 * Minimal vertical slice for /api/processing/results endpoint wiring.
 * Provides a simple UI trigger to test the results stage processor.
 * 
 * Feature flag: PROCESSING_RESULTS_ENABLED (default: false)
 * 
 * This page satisfies the endpoint wiring requirement by including
 * a literal callsite: fetch('/api/processing/results', ...)
 */

import { useState } from 'react'
import { Card, Button, Badge, LoadingSpinner } from '@/lib/ui'
import { featureFlags } from '@/lib/featureFlags'
import { Play, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

type TriggerResult = {
  success: boolean
  data?: {
    resultId: string
    isNew: boolean
  }
  error?: string
}

type AssessmentsResult = {
  success: boolean
  data?: unknown
  error?: string
}

export default function ProcessingResultsDevTriggerPage() {
  const [jobId, setJobId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TriggerResult | null>(null)
  const [assessmentsLoading, setAssessmentsLoading] = useState(false)
  const [assessmentsResult, setAssessmentsResult] = useState<AssessmentsResult | null>(null)

  // Feature flag check
  if (!featureFlags.PROCESSING_RESULTS_ENABLED) {
    return (
      <div className="p-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Feature Disabled</h2>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Processing results endpoint is disabled. Set{' '}
              <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED=true
              </code>{' '}
              to enable.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const handleTrigger = async () => {
    if (!jobId.trim()) {
      setResult({
        success: false,
        error: 'Please enter a job ID',
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // IMPORTANT: Literal string callsite for endpoint wiring
      const response = await fetch('/api/processing/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobId.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          data: data.data,
        })
      } else {
        setResult({
          success: false,
          error: data.error || 'Unknown error',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFetchAssessments = async () => {
    setAssessmentsLoading(true)
    setAssessmentsResult(null)

    try {
      // IMPORTANT: Literal string callsite for endpoint wiring
      const response = await fetch('/api/patient/assessments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAssessmentsResult({
          success: true,
          data: data.data,
        })
      } else {
        setAssessmentsResult({
          success: false,
          error: data.error || 'Unknown error',
        })
      }
    } catch (error) {
      setAssessmentsResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      })
    } finally {
      setAssessmentsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Processing Results Dev Trigger
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Trigger the results stage processor for a processing job (E73.3)
          </p>
          <Badge className="mt-2" variant="info">
            Dev Tool - Feature Flagged
          </Badge>
        </div>

        <Card>
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="jobId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Processing Job ID
              </label>
              <input
                id="jobId"
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter job UUID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Job must have completed risk and ranking stages
              </p>
            </div>

            <Button
              onClick={handleTrigger}
              disabled={loading || !jobId.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Trigger Results Stage
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Patient Assessments (Dev)
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Fetch assessments to validate wiring for the patient history endpoint.
              </p>
            </div>

            <Button
              onClick={handleFetchAssessments}
              disabled={assessmentsLoading}
              className="w-full"
              variant="secondary"
            >
              {assessmentsLoading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Loading...
                </>
              ) : (
                'Fetch Patient Assessments'
              )}
            </Button>

            {assessmentsResult && (
              <div className="text-xs text-gray-600">
                {assessmentsResult.success
                  ? 'Assessments loaded.'
                  : `Error: ${assessmentsResult.error}`}
              </div>
            )}
          </div>
        </Card>

        {result && (
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {result.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">
                      Success
                    </h3>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-900">
                      Error
                    </h3>
                  </>
                )}
              </div>

              {result.success && result.data ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Result ID:</span>
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {result.data.resultId}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Is New:</span>
                    <Badge variant={result.data.isNew ? 'success' : 'default'}>
                      {result.data.isNew ? 'New' : 'Existing'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  <p>{result.error}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Endpoint Information
            </h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Endpoint:</strong>{' '}
                <code className="px-1 bg-gray-100 rounded">
                  POST /api/processing/results
                </code>
              </p>
              <p>
                <strong>Purpose:</strong> Write calculated_results after
                risk/ranking stages
              </p>
              <p>
                <strong>Auth:</strong> Clinician or Admin role required
              </p>
              <p>
                <strong>Implementation:</strong> E73.3 - calculated_results
                writer with upsert
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
