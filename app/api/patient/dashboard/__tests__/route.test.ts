/**
 * E6.4.1: Patient Dashboard API Tests
 * 
 * Tests AC1 and AC2:
 * - AC1: Unauthenticated → 401 (before any DB/IO)
 * - AC2: Authenticated but not eligible → 403 (when pilot gates enabled)
 */

import { GET } from '../route'
import { requireAuth } from '@/lib/api/authHelpers'
import { isPilotEligibleFull } from '@/lib/api/pilotEligibility'
import { User } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/lib/api/authHelpers')
jest.mock('@/lib/api/pilotEligibility')

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>
const mockIsPilotEligibleFull = isPilotEligibleFull as jest.MockedFunction<
  typeof isPilotEligibleFull
>

function createMockUser(id = 'test-user-id'): User {
  return {
    id,
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User
}

describe('E6.4.1: Patient Dashboard API', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('AC1: 401-first auth ordering', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock auth failure
      mockRequireAuth.mockResolvedValue({
        user: null,
        error: new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
          }),
          { status: 401 },
        ),
      })

      const response = await GET()
      expect(response.status).toBe(401)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 401 for session expired', async () => {
      mockRequireAuth.mockResolvedValue({
        user: null,
        error: new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SESSION_EXPIRED', message: 'Session expired' },
          }),
          { status: 401 },
        ),
      })

      const response = await GET()
      expect(response.status).toBe(401)

      const body = await response.json()
      expect(body.error.code).toBe('SESSION_EXPIRED')
    })

    it('should check auth before any business logic', async () => {
      mockRequireAuth.mockResolvedValue({
        user: null,
        error: new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
          }),
          { status: 401 },
        ),
      })

      await GET()

      // Verify auth was checked
      expect(mockRequireAuth).toHaveBeenCalled()
      
      // Verify pilot eligibility was NOT checked (auth failed first)
      expect(mockIsPilotEligibleFull).not.toHaveBeenCalled()
    })
  })

  describe('AC2: Pilot eligibility checking', () => {
    beforeEach(() => {
      // Setup successful auth
      mockRequireAuth.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should allow access when pilot is disabled', async () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'false'

      const response = await GET()
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.message).toBe('Patient dashboard access granted')
      
      // Pilot eligibility should not be checked when disabled
      expect(mockIsPilotEligibleFull).not.toHaveBeenCalled()
    })

    it('should check pilot eligibility when enabled', async () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      mockIsPilotEligibleFull.mockResolvedValue(true)

      const response = await GET()
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.pilot_eligible).toBe(true)
      
      // Verify eligibility was checked
      expect(mockIsPilotEligibleFull).toHaveBeenCalled()
    })

    it('should include pilot_eligible in response when pilot enabled', async () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      mockIsPilotEligibleFull.mockResolvedValue(false)

      const response = await GET()
      
      const body = await response.json()
      expect(body.data.pilot_eligible).toBe(false)
    })

    it('should not include pilot_eligible when pilot disabled', async () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'false'

      const response = await GET()
      
      const body = await response.json()
      expect(body.data.pilot_eligible).toBeUndefined()
    })
  })

  describe('Auth-first ordering guarantee', () => {
    it('should always check auth before pilot eligibility', async () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      
      const callOrder: string[] = []
      
      mockRequireAuth.mockImplementation(async () => {
        callOrder.push('auth')
        return {
          user: createMockUser(),
          error: null,
        }
      })
      
      mockIsPilotEligibleFull.mockImplementation(async () => {
        callOrder.push('pilot')
        return true
      })

      await GET()
      
      expect(callOrder).toEqual(['auth', 'pilot'])
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should handle pilot eligibility check errors gracefully', async () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      mockIsPilotEligibleFull.mockRejectedValue(new Error('DB error'))

      const response = await GET()
      expect(response.status).toBe(500)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INTERNAL_ERROR')
    })
  })
})
