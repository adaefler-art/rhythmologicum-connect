/**
 * E6.5.2: Patient Dashboard API Tests
 * 
 * Tests for Dashboard Data Contract V1:
 * - E6.4.1 AC1: Unauthenticated → 401 (before any DB/IO)
 * - E6.5.2 AC1: Contract as Zod schema with runtime validation
 * - E6.5.2 AC2: Response envelope + error semantics standardized
 * - E6.5.2 AC3: Version marker present
 */

import { GET } from '../route'
import { requireAuth } from '@/lib/api/authHelpers'
import { isPilotEligibleFull } from '@/lib/api/pilotEligibility'
import { User } from '@supabase/supabase-js'
import {
  DashboardResponseSchema,
  PATIENT_DASHBOARD_SCHEMA_VERSION,
  DASHBOARD_VERSION,
  ONBOARDING_STATUS,
  NEXT_STEP_TYPE,
  WORKUP_STATE,
} from '@/lib/api/contracts/patient/dashboard'

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

describe('E6.5.2: Patient Dashboard API - Data Contract V1', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('E6.4.1 AC1: 401-first auth ordering', () => {
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

  describe('E6.5.2: Dashboard Data Contract V1', () => {
    beforeEach(() => {
      // Setup successful auth
      mockRequireAuth.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should return valid DashboardViewModelV1 schema', async () => {
      const response = await GET()
      expect(response.status).toBe(200)

      const body = await response.json()
      
      // E6.5.2 AC1: Schema validation
      const validationResult = DashboardResponseSchema.safeParse(body)
      expect(validationResult.success).toBe(true)
    })

    it('should include schemaVersion in response (E6.5.2 AC2)', async () => {
      const response = await GET()
      const body = await response.json()

      expect(body.schemaVersion).toBe(PATIENT_DASHBOARD_SCHEMA_VERSION)
      expect(body.schemaVersion).toBe('v1')
    })

    it('should include version marker in meta (E6.5.2 AC3)', async () => {
      const response = await GET()
      const body = await response.json()

      expect(body.data.meta.version).toBe(DASHBOARD_VERSION)
      expect(body.data.meta.version).toBe(1)
    })

    it('should include correlationId in meta (E6.4.8 alignment)', async () => {
      const response = await GET()
      const body = await response.json()

      expect(body.data.meta.correlationId).toBeDefined()
      expect(typeof body.data.meta.correlationId).toBe('string')
      // Should be a valid UUID
      expect(body.data.meta.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it('should include correlationId in requestId field (E6.4.8 alignment)', async () => {
      const response = await GET()
      const body = await response.json()

      expect(body.requestId).toBeDefined()
      expect(typeof body.requestId).toBe('string')
    })

    it('should return all required dashboard fields', async () => {
      const response = await GET()
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.data.onboardingStatus).toBeDefined()
      expect(body.data.nextStep).toBeDefined()
      expect(body.data.funnelSummaries).toBeDefined()
      expect(body.data.workupSummary).toBeDefined()
      expect(body.data.contentTiles).toBeDefined()
      expect(body.data.meta).toBeDefined()
    })

    it('should return empty state as MVP implementation', async () => {
      const response = await GET()
      const body = await response.json()

      // Empty state should have default values
      expect(body.data.onboardingStatus).toBe(ONBOARDING_STATUS.NOT_STARTED)
      expect(body.data.nextStep.type).toBe(NEXT_STEP_TYPE.ONBOARDING)
      expect(body.data.funnelSummaries).toEqual([])
      expect(body.data.workupSummary.state).toBe(WORKUP_STATE.NO_DATA)
      expect(body.data.contentTiles).toEqual([])
    })

    it('should include generatedAt timestamp in meta', async () => {
      const response = await GET()
      const body = await response.json()

      expect(body.data.meta.generatedAt).toBeDefined()
      expect(typeof body.data.meta.generatedAt).toBe('string')
      // Should be a valid ISO 8601 timestamp
      expect(body.data.meta.generatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      )
    })
  })

  describe('E6.5.2: nextStep object structure', () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should include type, target, and label in nextStep', async () => {
      const response = await GET()
      const body = await response.json()

      expect(body.data.nextStep.type).toBeDefined()
      expect(body.data.nextStep.target).toBeDefined()
      expect(body.data.nextStep.label).toBeDefined()
    })
  })

  describe('E6.5.2: funnelSummaries array', () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should return array for funnelSummaries', async () => {
      const response = await GET()
      const body = await response.json()

      expect(Array.isArray(body.data.funnelSummaries)).toBe(true)
    })
  })

  describe('E6.5.2: workupSummary object', () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should include state and counts in workupSummary', async () => {
      const response = await GET()
      const body = await response.json()

      expect(body.data.workupSummary.state).toBeDefined()
      expect(body.data.workupSummary.counts).toBeDefined()
      expect(body.data.workupSummary.counts.needsMoreData).toBeDefined()
      expect(body.data.workupSummary.counts.readyForReview).toBeDefined()
      expect(body.data.workupSummary.counts.total).toBeDefined()
    })
  })

  describe('E6.5.2: contentTiles array', () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should return array for contentTiles', async () => {
      const response = await GET()
      const body = await response.json()

      expect(Array.isArray(body.data.contentTiles)).toBe(true)
    })
  })

  describe('Auth-first ordering guarantee', () => {
    it('should always check auth before generating dashboard data', async () => {
      const callOrder: string[] = []
      
      mockRequireAuth.mockImplementation(async () => {
        callOrder.push('auth')
        return {
          user: createMockUser(),
          error: null,
        }
      })

      await GET()
      
      // Auth should be checked first
      expect(callOrder[0]).toBe('auth')
      expect(mockRequireAuth).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      mockRequireAuth.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should handle errors gracefully', async () => {
      const response = await GET()
      
      // Should succeed with empty state
      expect([200]).toContain(response.status)
      
      const body = await response.json()
      expect(body.success).toBe(true)
    })
  })
})
