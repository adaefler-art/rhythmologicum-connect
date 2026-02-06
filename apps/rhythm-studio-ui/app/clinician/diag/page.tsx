'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card } from '@/lib/ui'

const DIAG_ENDPOINTS = [
  '/api/_meta/ping',
  '/api/_meta/build',
  '/api/clinician/triage',
]

type ProbeResult = {
  url: string
  status: number
  contentType: string | null
  bodyPreview: string | null
  isHtml: boolean
  headers: Record<string, string | null>
  error?: string
}

const getBuildMeta = () => {
  if (typeof document === 'undefined') return {}
  const getMeta = (name: string) =>
    document.head?.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || null

  return {
    buildSha: getMeta('x-studio-build-sha'),
    buildTime: getMeta('x-studio-build-time'),
    appRoot: getMeta('x-studio-app-root'),
  }
}

const isHtmlResponse = (contentType: string | null, body: string | null) => {
  if (contentType?.includes('text/html')) return true
  if (!body) return false
  const trimmed = body.trimStart()
  return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')
}

export default function ClinicianDiagPage() {
  const [results, setResults] = useState<ProbeResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patientId = useMemo(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('patientId')
  }, [])

  const probeUrls = useMemo(() => {
    const urls = [...DIAG_ENDPOINTS]
    if (patientId) {
      urls.push(`/api/clinician/patient/${patientId}/results`)
    }
    return urls
  }, [patientId])

  const runProbe = useCallback(async (url: string): Promise<ProbeResult> => {
    try {
      const response = await fetch(url, { cache: 'no-store' })
      const contentType = response.headers.get('content-type')
      const headers = {
        server: response.headers.get('server'),
        'x-vercel-id': response.headers.get('x-vercel-id'),
        'x-studio-build-sha': response.headers.get('x-studio-build-sha'),
      }

      let bodyPreview: string | null = null
      if (response.status !== 204) {
        const text = await response.text().catch(() => '')
        bodyPreview = text ? text.slice(0, 120) : null
      }

      const htmlLike = isHtmlResponse(contentType, bodyPreview)

      return {
        url,
        status: response.status,
        contentType,
        bodyPreview,
        isHtml: htmlLike,
        headers,
      }
    } catch (err) {
      return {
        url,
        status: 0,
        contentType: null,
        bodyPreview: null,
        isHtml: false,
        headers: {
          server: null,
          'x-vercel-id': null,
          'x-studio-build-sha': null,
        },
        error: err instanceof Error ? err.message : 'Fetch failed',
      }
    }
  }, [])

  const runAll = useCallback(async () => {
    setIsRunning(true)
    setError(null)

    try {
      const settled = await Promise.all(probeUrls.map((url) => runProbe(url)))
      setResults(settled)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnostics failed')
    } finally {
      setIsRunning(false)
    }
  }, [probeUrls, runProbe])

  const handleCopy = async () => {
    const payload = {
      buildMeta: getBuildMeta(),
      patientId: patientId || null,
      results,
      timestamp: new Date().toISOString(),
    }

    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
  }

  useEffect(() => {
    runAll()
  }, [runAll])

  return (
    <div className="space-y-6">
      <Card padding="lg" shadow="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Deploy Diagnostics</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Probes runtime responses without relying on dashboard access.
            </p>
            {patientId ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Patient probe enabled for {patientId}.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Add ?patientId=... to probe patient results.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runAll} disabled={isRunning}>
              {isRunning ? 'Running…' : 'Run probes'}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCopy} disabled={results.length === 0}>
              Copy diagnostics as JSON
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card padding="md" shadow="sm">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result.url} padding="lg" shadow="sm">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {result.url}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Status: {result.status || 'error'} · Content-Type: {result.contentType || 'unknown'}
                </p>
              </div>

              {result.error && (
                <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
              )}

              {result.isHtml && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This looks like an HTML 404 page. This indicates rewrites or wrong project/artifact.
                </p>
              )}

              {result.bodyPreview && (
                <pre className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded p-3 overflow-x-auto">
                  {result.bodyPreview}
                </pre>
              )}

              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p>server: {result.headers.server || 'n/a'}</p>
                <p>x-vercel-id: {result.headers['x-vercel-id'] || 'n/a'}</p>
                <p>x-studio-build-sha: {result.headers['x-studio-build-sha'] || 'n/a'}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
