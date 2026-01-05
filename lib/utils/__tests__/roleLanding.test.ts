import { getLandingForRole } from '@/lib/utils/roleLanding'

describe('getLandingForRole', () => {
  it('routes patient to /patient', () => {
    expect(getLandingForRole('patient')).toBe('/patient')
  })
})
