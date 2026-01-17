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
  extractFunnelSlug,
  isFunnelRoute,
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
    
    // Mock the cookies() function to return our mock store
    const cookiesMock = cookies as jest.Mock
    cookiesMock.mockResolvedValue(mockCookieStore)
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

    // Funnel reachability tests
    it('returns false for patient-reachable funnel (stress-assessment)', () => {
      expect(requiresDashboardFirst('/patient/funnel/stress-assessment')).toBe(false)
      expect(requiresDashboardFirst('/patient/funnel/stress-assessment/result')).toBe(false)
    })

    it('returns false for patient-reachable funnel (cardiovascular-age)', () => {
      expect(requiresDashboardFirst('/patient/funnel/cardiovascular-age')).toBe(false)
      expect(requiresDashboardFirst('/patient/funnel/cardiovascular-age/result')).toBe(false)
    })

    it('returns true for non-allowlisted funnel (sleep-quality)', () => {
      expect(requiresDashboardFirst('/patient/funnel/sleep-quality')).toBe(true)
      expect(requiresDashboardFirst('/patient/funnel/sleep-quality/result')).toBe(true)
    })

    it('returns true for funnels list route', () => {
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

    // Funnel reachability tests for enforceDashboardFirst
    it('returns null for allowlisted funnel (stress-assessment) even without dashboard visit', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await enforceDashboardFirst('/patient/funnel/stress-assessment')

      // Allowlisted funnel should be directly accessible
      expect(result).toBeNull()
    })

    it('returns null for allowlisted funnel (cardiovascular-age) even without dashboard visit', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await enforceDashboardFirst('/patient/funnel/cardiovascular-age')

      // Allowlisted funnel should be directly accessible
      expect(result).toBeNull()
    })

    it('returns redirect URL for non-allowlisted funnel (sleep-quality) without dashboard visit', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await enforceDashboardFirst('/patient/funnel/sleep-quality')

      expect(result).toBe(
        '/patient/dashboard?return=%2Fpatient%2Ffunnel%2Fsleep-quality'
      )
    })

    it('returns null for non-allowlisted funnel when dashboard has been visited', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'true' })

      const result = await enforceDashboardFirst('/patient/funnel/sleep-quality')

      expect(result).toBeNull()
    })

    it('returns redirect URL for history route when not visited', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await enforceDashboardFirst('/patient/history')

      expect(result).toBe('/patient/dashboard?return=%2Fpatient%2Fhistory')
    })
  })

  describe('extractFunnelSlug', () => {
    it('extracts slug from simple funnel route', () => {
      expect(extractFunnelSlug('/patient/funnel/stress-assessment')).toBe('stress-assessment')
    })

    it('extracts slug from nested funnel route', () => {
      expect(extractFunnelSlug('/patient/funnel/stress-assessment/result')).toBe('stress-assessment')
      expect(extractFunnelSlug('/patient/funnel/cardiovascular-age/intro')).toBe('cardiovascular-age')
    })

    it('returns null for non-funnel routes', () => {
      expect(extractFunnelSlug('/patient/dashboard')).toBeNull()
      expect(extractFunnelSlug('/patient/funnels')).toBeNull()
      expect(extractFunnelSlug('/clinician/funnels/stress-assessment')).toBeNull()
    })
  })

  describe('isFunnelRoute', () => {
    it('returns true for funnel routes', () => {
      expect(isFunnelRoute('/patient/funnel/stress-assessment')).toBe(true)
      expect(isFunnelRoute('/patient/funnel/cardiovascular-age/result')).toBe(true)
    })

    it('returns false for non-funnel routes', () => {
      expect(isFunnelRoute('/patient/funnels')).toBe(false)
      expect(isFunnelRoute('/patient/dashboard')).toBe(false)
      expect(isFunnelRoute('/clinician/funnels/stress-assessment')).toBe(false)
    })
  })
})
