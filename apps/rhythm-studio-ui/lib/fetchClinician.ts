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

const logPatientApiMiss = (payload: {
  requestedUrl: string
  status: number
  buildSha: string
  responseJsonIfAny: unknown
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
  let responseJson: unknown = null

  if (response.status !== 204) {
    responseJson = await response.json().catch(() => null)
  }

  let debugHint: string | undefined
  if (response.status === 404 || response.status === 501) {
    const buildInfo = await getBuildInfo()
    const buildSha = buildInfo?.gitSha || 'unknown'

    logPatientApiMiss({
      requestedUrl: url,
      status: response.status,
      buildSha,
      responseJsonIfAny: responseJson,
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
  }
}
