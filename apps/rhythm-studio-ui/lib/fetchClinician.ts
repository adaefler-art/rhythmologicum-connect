import { env } from '@/lib/env'

type BuildInfo = {
  app?: string
  gitSha?: string
  buildTime?: string
  vercelEnv?: string
  vercelUrl?: string
}

type FetchClinicianResult<T> = {
  response: Response
  data: T | null
  debugHint?: string
  responseJson?: unknown
  responseTextPreview?: string | null
}

let buildInfoPromise: Promise<BuildInfo | null> | null = null
const loggedMisses = new Set<string>()

const shouldShowDebugHint = () => {
  if (typeof window === 'undefined') return false
  if (env.NODE_ENV !== 'production') return true
  const params = new URLSearchParams(window.location.search)
  return params.get('debug') === '1'
}

const getBuildInfo = async (): Promise<BuildInfo | null> => {
  if (!buildInfoPromise) {
    buildInfoPromise = fetch('/api/_meta/build', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
  }
  return buildInfoPromise
}

const getBuildStampSha = (): string | null => {
  if (typeof document === 'undefined') return null
  const meta = document.head?.querySelector('meta[name="x-studio-build-sha"]')
  return meta?.getAttribute('content') || null
}

const logPatientApiMiss = (payload: {
  requestedUrl: string
  status: number
  buildSha: string
  responseJsonIfAny: unknown
  responseTextPreview: string | null
}) => {
  if (loggedMisses.has(payload.requestedUrl)) return
  loggedMisses.add(payload.requestedUrl)
  console.warn('[patient-api-miss]', payload)
}

export const fetchClinicianJson = async <T>(
  url: string,
  options?: RequestInit,
): Promise<FetchClinicianResult<T>> => {
  const response = await fetch(url, options)
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json') || contentType.includes('+json')
  let responseJson: unknown = null
  let responseTextPreview: string | null = null

  if (response.status !== 204) {
    if (isJson) {
      responseJson = await response.json().catch(() => null)
    } else {
      const text = await response.text().catch(() => '')
      responseTextPreview = text ? text.slice(0, 120) : null
    }
  }

  let debugHint: string | undefined
  if (response.status === 404 || response.status === 501) {
    const buildInfo = await getBuildInfo()
    const buildSha = buildInfo?.gitSha || getBuildStampSha() || 'unknown'

    logPatientApiMiss({
      requestedUrl: url,
      status: response.status,
      buildSha,
      responseJsonIfAny: responseJson,
      responseTextPreview,
    })

    if (shouldShowDebugHint()) {
      debugHint = `Endpoint fehlt im Deploy. build=${buildSha}`
    }
  }

  return {
    response,
    data: (responseJson as T | null) ?? null,
    debugHint,
    responseJson,
    responseTextPreview,
  }
}
