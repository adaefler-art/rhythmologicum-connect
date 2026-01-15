/**
 * Tests for Dashboard-First Policy (E6.5.1)
 * 
 * Verifies:
 * - Dashboard visit tracking
 * - Route protection logic
 * - Dashboard-first enforcement
 */

import {
  hasDashboardVisit,
  markDashboardVisited,
  clearDashboardVisit,
  requiresDashboardFirst,
  enforceDashboardFirst,
} from '../dashboardFirstPolicy'
import { cookies } from 'next/headers'

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('dashboardFirstPolicy', () => {
  let mockCookieStore: {
    get: jest.Mock
    set: jest.Mock
    delete: jest.Mock
  }

  beforeEach(() => {
    // Reset mocks
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    }
    ;(cookies as jest.Mock).mockResolvedValue(mockCookieStore)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('hasDashboardVisit', () => {
    it('returns true when dashboard visit cookie is set to true', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'true' })

      const result = await hasDashboardVisit()

      expect(result).toBe(true)
      expect(mockCookieStore.get).toHaveBeenCalledWith('dashboard_visited')
    })

    it('returns false when dashboard visit cookie is not set', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await hasDashboardVisit()

      expect(result).toBe(false)
    })

    it('returns false when dashboard visit cookie is set to non-true value', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'false' })

      const result = await hasDashboardVisit()

      expect(result).toBe(false)
    })
  })

  describe('markDashboardVisited', () => {
    it('sets dashboard visit cookie with correct options', async () => {
      await markDashboardVisited()

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'dashboard_visited',
        'true',
        expect.objectContaining({
          maxAge: 3600, // 1 hour
          httpOnly: true,
          sameSite: 'lax',
          path: '/patient',
        })
      )
    })
  })

  describe('clearDashboardVisit', () => {
    it('deletes dashboard visit cookie', async () => {
      await clearDashboardVisit()

      expect(mockCookieStore.delete).toHaveBeenCalledWith('dashboard_visited')
    })
  })

  describe('requiresDashboardFirst', () => {
    it('returns false for dashboard route', () => {
      expect(requiresDashboardFirst('/patient/dashboard')).toBe(false)
    })

    it('returns false for onboarding routes', () => {
      expect(requiresDashboardFirst('/patient/onboarding/consent')).toBe(false)
      expect(requiresDashboardFirst('/patient/onboarding/profile')).toBe(false)
    })

    it('returns false for patient root route', () => {
      expect(requiresDashboardFirst('/patient')).toBe(false)
    })

    it('returns true for funnel routes', () => {
      expect(requiresDashboardFirst('/patient/funnel/stress-assessment')).toBe(true)
      expect(requiresDashboardFirst('/patient/funnels')).toBe(true)
    })

    it('returns true for history route', () => {
      expect(requiresDashboardFirst('/patient/history')).toBe(true)
    })

    it('returns true for support route', () => {
      expect(requiresDashboardFirst('/patient/support')).toBe(true)
    })

    it('returns true for escalation route', () => {
      expect(requiresDashboardFirst('/patient/escalation')).toBe(true)
    })

    it('returns true for assessment route', () => {
      expect(requiresDashboardFirst('/patient/assessment')).toBe(true)
    })
  })

  describe('enforceDashboardFirst', () => {
    it('returns null for exempt routes (dashboard)', async () => {
      const result = await enforceDashboardFirst('/patient/dashboard')
      expect(result).toBeNull()
    })

    it('returns null for exempt routes (onboarding)', async () => {
      const result = await enforceDashboardFirst('/patient/onboarding/consent')
      expect(result).toBeNull()
    })

    it('returns null for protected routes when dashboard has been visited', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'true' })

      const result = await enforceDashboardFirst('/patient/funnels')

      expect(result).toBeNull()
      expect(mockCookieStore.get).toHaveBeenCalledWith('dashboard_visited')
    })

    it('returns redirect URL for protected routes when dashboard has not been visited', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await enforceDashboardFirst('/patient/funnels')

      expect(result).toBe('/patient/dashboard?return=%2Fpatient%2Ffunnels')
    })

    it('returns redirect URL with encoded pathname', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await enforceDashboardFirst('/patient/funnel/stress-assessment')

      expect(result).toBe(
        '/patient/dashboard?return=%2Fpatient%2Ffunnel%2Fstress-assessment'
      )
    })

    it('returns redirect URL for history route when not visited', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await enforceDashboardFirst('/patient/history')

      expect(result).toBe('/patient/dashboard?return=%2Fpatient%2Fhistory')
    })
  })
})
