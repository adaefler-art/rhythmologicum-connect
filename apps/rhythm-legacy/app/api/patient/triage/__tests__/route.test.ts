/**
 * E6.6.4: POST /api/patient/triage Tests
 *
 * Tests for triage endpoint with full governance:
 * - AC1: Unauth→401 first
 * - AC2: Not eligible→403/404
 * - AC3: Request validated; oversize→413 or 400
 * - AC4: Result conforms to schema; rationale bounded; redFlags allowlist enforced
 */

import { POST } from '../route'
import { requirePilotEligibility } from '@/lib/api/authHelpers'
import { User } from '@supabase/supabase-js'
import { TRIAGE_TIER, TRIAGE_NEXT_ACTION, TRIAGE_SCHEMA_VERSION } from '@/lib/api/contracts/triage'

// Mock dependencies
jest.mock('@/lib/api/authHelpers')
jest.mock('@/lib/telemetry/correlationId', () => ({
  getCorrelationId: jest.fn(() => 'test-correlation-id'),
}))
jest.mock('@/lib/telemetry/events', () => ({
  emitTriageSubmitted: jest.fn(() => Promise.resolve()),
  emitTriageRouted: jest.fn(() => Promise.resolve()),
}))
jest.mock('@/lib/monitoring/usageTrackingWrapper', () => ({
  trackUsage: jest.fn(),
}))

const mockRequirePilotEligibility = requirePilotEligibility as jest.MockedFunction<
  typeof requirePilotEligibility
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

function createMockRequest(body: unknown): Request {
  return {
    json: async () => body,
    headers: new Headers(),
  } as Request
}

describe('E6.6.4: POST /api/patient/triage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('AC1: Unauthenticated → 401 first', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock auth failure
      mockRequirePilotEligibility.mockResolvedValue({
        user: null,
        error: new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          }),
          { status: 401 },
        ),
      })

      const req = createMockRequest({ inputText: 'I feel stressed' })
      const response = await POST(req)

      expect(response.status).toBe(401)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 401 for session expired', async () => {
      // Mock session expired error
      mockRequirePilotEligibility.mockResolvedValue({
        user: null,
        error: new Response(
          JSON.stringify({
            success: false,
            error: { code: 'SESSION_EXPIRED', message: 'Session expired' },
          }),
          { status: 401 },
        ),
      })

      const req = createMockRequest({ inputText: 'I feel stressed' })
      const response = await POST(req)

      expect(response.status).toBe(401)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('SESSION_EXPIRED')
    })
  })

  describe('AC2: Not eligible → 403', () => {
    it('should return 403 when user is not pilot eligible', async () => {
      // Mock pilot eligibility failure
      mockRequirePilotEligibility.mockResolvedValue({
        user: null,
        error: new Response(
          JSON.stringify({
            success: false,
            error: { code: 'PILOT_NOT_ELIGIBLE', message: 'Not eligible for pilot' },
          }),
          { status: 403 },
        ),
      })

      const req = createMockRequest({ inputText: 'I feel stressed' })
      const response = await POST(req)

      expect(response.status).toBe(403)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('PILOT_NOT_ELIGIBLE')
    })
  })

  describe('AC3: Request validation (oversize → 413 or 400)', () => {
    beforeEach(() => {
      // Mock successful auth for these tests
      mockRequirePilotEligibility.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should return 400 when inputText is missing', async () => {
      const req = createMockRequest({})
      const response = await POST(req)

      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_INPUT')
    })

    it('should return 400 when inputText is too short', async () => {
      const req = createMockRequest({ inputText: 'short' })
      const response = await POST(req)

      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_INPUT')
      expect(body.error.message).toContain('10-800 characters')
    })

    it('should return 400 for moderately oversized input (801-1600 chars)', async () => {
      const inputText = 'x'.repeat(900) // 900 chars (> 800, < 1600)
      const req = createMockRequest({ inputText })
      const response = await POST(req)

      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_INPUT')
      expect(body.error.message).toContain('800 characters')
    })

    it('should return 413 for very large input (>1600 chars)', async () => {
      const inputText = 'x'.repeat(1700) // 1700 chars (> 1600)
      const req = createMockRequest({ inputText })
      const response = await POST(req)

      expect(response.status).toBe(413)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('PAYLOAD_TOO_LARGE')
      expect(body.error.message).toContain('too large')
    })

    it('should return 400 for invalid JSON', async () => {
      const req = {
        json: async () => {
          throw new Error('Invalid JSON')
        },
        headers: new Headers(),
      } as Request

      const response = await POST(req)

      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_INPUT')
      expect(body.error.message).toContain('valid JSON')
    })
  })

  describe('AC4: Result conforms to schema', () => {
    beforeEach(() => {
      // Mock successful auth for these tests
      mockRequirePilotEligibility.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should return valid triage result for stress-related input', async () => {
      const req = createMockRequest({
        inputText: 'I feel stressed and cannot sleep well',
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data).toBeDefined()

      // AC4: Validate result conforms to schema
      const result = body.data
      expect(result.tier).toBe(TRIAGE_TIER.ASSESSMENT)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
      expect(result.version).toBe(TRIAGE_SCHEMA_VERSION)
      expect(result.rationale).toBeDefined()
      expect(typeof result.rationale).toBe('string')
      expect(result.redFlags).toBeDefined()
      expect(Array.isArray(result.redFlags)).toBe(true)
    })

    it('should return INFO tier for informational queries', async () => {
      const req = createMockRequest({
        inputText: 'Was ist Stress und wie funktioniert es?',
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)

      const result = body.data
      expect(result.tier).toBe(TRIAGE_TIER.INFO)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
    })

    it('should return ESCALATE tier for red flag keywords', async () => {
      const req = createMockRequest({
        inputText: 'Ich habe Suizidgedanken und kann nicht mehr',
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)

      const result = body.data
      expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
      expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
      expect(result.redFlags.length).toBeGreaterThan(0)
    })

    it('should handle optional fields (locale, patientContext)', async () => {
      const req = createMockRequest({
        inputText: 'I am experiencing stress and anxiety',
        locale: 'en-US',
        patientContext: {
          ageRange: 'AGE_31_50',
        },
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.tier).toBe(TRIAGE_TIER.ASSESSMENT)
    })

    it('should include correlationId in response', async () => {
      const req = createMockRequest({
        inputText: 'I feel stressed',
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.requestId).toBe('test-correlation-id')
      expect(body.data.correlationId).toBe('test-correlation-id')
    })

    it('should ensure rationale is bounded', async () => {
      const req = createMockRequest({
        inputText: 'I have stress and sleep problems',
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      const result = body.data

      // Rationale should be bounded (max 280 chars or 3 bullets)
      expect(result.rationale.length).toBeLessThanOrEqual(280)
    })

    it('should ensure redFlags are from allowlist', async () => {
      const req = createMockRequest({
        inputText: 'I have thoughts of suicide and self-harm',
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      const result = body.data

      // All red flags should be from allowlist
      const allowlist = ['report_risk_level', 'workup_check', 'answer_pattern']
      result.redFlags.forEach((flag: string) => {
        expect(allowlist).toContain(flag)
      })
    })
  })

  describe('Edge cases and error handling', () => {
    beforeEach(() => {
      // Mock successful auth for these tests
      mockRequirePilotEligibility.mockResolvedValue({
        user: createMockUser(),
        error: null,
      })
    })

    it('should handle Unicode characters in input', async () => {
      const req = createMockRequest({
        inputText: 'Ich fühle mich gestresst und ängstlich 😰',
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('should handle input at exactly minimum length (10 chars)', async () => {
      const req = createMockRequest({
        inputText: '1234567890', // exactly 10 chars
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('should handle input at exactly maximum length (800 chars)', async () => {
      const req = createMockRequest({
        inputText: 'x'.repeat(800), // exactly 800 chars
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
    })
  })
})
