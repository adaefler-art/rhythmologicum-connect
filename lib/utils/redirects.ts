export type RedirectSearchParams = Record<string, string | string[] | undefined>

type BuildRedirectUrlInput = {
  baseUrl: string | undefined
  pathPrefix: string
  pathSegments?: string[]
  searchParams?: RedirectSearchParams
}

import { logError } from '@/lib/logging/logger'

function getMissingBaseUrlKey(pathPrefix: string) {
  if (pathPrefix === 'patient') return 'PATIENT_BASE_URL'
  if (pathPrefix === 'admin' || pathPrefix === 'clinician') return 'STUDIO_BASE_URL'
  return 'REDIRECT_BASE_URL'
}

export function buildRedirectUrl({
  baseUrl,
  pathPrefix,
  pathSegments,
  searchParams,
}: BuildRedirectUrlInput): string | null {
  if (!baseUrl) {
    logError('Missing redirect base URL', {
      area: 'routing',
      missing: getMissingBaseUrlKey(pathPrefix),
      pathPrefix,
      action: pathPrefix === 'patient' ? 'not_found' : 'redirect_blocked',
    })
    return null
  }

  const segments = [pathPrefix, ...(pathSegments || [])].filter(Boolean)
  const path = segments.join('/')
  let url: URL
  try {
    const normalizedBase = baseUrl.replace(/\/+$/, '')
    url = new URL(`${normalizedBase}/${path}`)
  } catch (error) {
    logError('Invalid redirect base URL', {
      area: 'routing',
      missing: getMissingBaseUrlKey(pathPrefix),
      pathPrefix,
    }, error)
    return null
  }

  if (searchParams) {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry !== undefined) {
            params.append(key, entry)
          }
        })
        return
      }
      if (value !== undefined) {
        params.append(key, value)
      }
    })

    const query = params.toString()
    if (query) {
      url.search = query
    }
  }

  return url.toString()
}
