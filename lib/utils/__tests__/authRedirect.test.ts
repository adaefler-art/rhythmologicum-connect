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
  })

  it('redirects clinician to /clinician', () => {
    expect(getPostLoginRedirect({ role: 'clinician' })).toBe('/clinician')
  })

  it('redirects patient to /patient', () => {
    expect(getPostLoginRedirect({ role: 'patient' })).toBe('/patient')
  })
})