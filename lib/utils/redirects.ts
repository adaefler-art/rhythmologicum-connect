export type RedirectSearchParams = Record<string, string | string[] | undefined>

type BuildRedirectUrlInput = {
  baseUrl: string | undefined
  pathPrefix: string
  pathSegments?: string[]
  searchParams?: RedirectSearchParams
}

export function buildRedirectUrl({
  baseUrl,
  pathPrefix,
  pathSegments,
  searchParams,
}: BuildRedirectUrlInput): string {
  if (!baseUrl) {
    throw new Error(`Missing redirect base URL for ${pathPrefix}`)
  }

  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const segments = [pathPrefix, ...(pathSegments || [])].filter(Boolean)
  const path = segments.join('/')
  const url = new URL(`${normalizedBase}/${path}`)

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
