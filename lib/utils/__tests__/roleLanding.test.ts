import { getLandingForRole } from '@/lib/utils/roleLanding'

describe('getLandingForRole', () => {
  it('routes patient to /patient/start', () => {
    expect(getLandingForRole('patient')).toBe('/patient/start')
  })
})
