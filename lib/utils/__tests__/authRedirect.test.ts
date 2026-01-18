import { getPostLoginRedirect } from '../authRedirect'

describe('getPostLoginRedirect', () => {
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('redirects admin to /admin', () => {
    expect(getPostLoginRedirect({ role: 'admin' })).toBe('/admin')
    expect(consoleLogSpy).toHaveBeenCalledWith('[AUTH_LANDING] role=admin target=/admin')
  })

  it('redirects clinician to /clinician', () => {
    expect(getPostLoginRedirect({ role: 'clinician' })).toBe('/clinician')
    expect(consoleLogSpy).toHaveBeenCalledWith('[AUTH_LANDING] role=clinician target=/clinician')
  })

  it('redirects patient to /patient', () => {
    expect(getPostLoginRedirect({ role: 'patient' })).toBe('/patient')
    expect(consoleLogSpy).toHaveBeenCalledWith('[AUTH_LANDING] role=patient target=/patient')
  })
})