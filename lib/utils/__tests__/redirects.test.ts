import { buildRedirectUrl } from '../redirects'

describe('buildRedirectUrl', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('returns null and logs when baseUrl is missing', () => {
    const result = buildRedirectUrl({
      baseUrl: undefined,
      pathPrefix: 'patient',
      searchParams: { source: 'test' },
    })

    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)

    const logged = JSON.parse(consoleErrorSpy.mock.calls[0][0])
    expect(logged.message).toBe('Missing redirect base URL')
    expect(logged.context).toMatchObject({
      area: 'routing',
      missing: 'PATIENT_BASE_URL',
      pathPrefix: 'patient',
    })
  })

  it('returns null and logs when baseUrl is invalid', () => {
    const result = buildRedirectUrl({
      baseUrl: 'not a url',
      pathPrefix: 'clinician',
      searchParams: { source: 'test' },
    })

    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)

    const logged = JSON.parse(consoleErrorSpy.mock.calls[0][0])
    expect(logged.message).toBe('Invalid redirect base URL')
    expect(logged.context).toMatchObject({
      area: 'routing',
      missing: 'STUDIO_BASE_URL',
      pathPrefix: 'clinician',
    })
  })

  it('builds a redirect URL when baseUrl is valid', () => {
    const result = buildRedirectUrl({
      baseUrl: 'https://example.com/',
      pathPrefix: 'patient',
      pathSegments: ['foo', 'bar'],
      searchParams: { q: 'ok' },
    })

    expect(result).toBe('https://example.com/patient/foo/bar?q=ok')
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
