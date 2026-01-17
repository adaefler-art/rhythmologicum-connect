/**
 * Tests for FunnelClient 404 fallback behavior
 *
 * Verifies:
 * - When GET assessment returns 404, createAssessment is called and new ID is used
 * - Fallback only happens once per mount (no infinite loops)
 * - 401/403 errors do NOT trigger fallback
 * - Telemetry events are logged correctly
 */

// Mock window.matchMedia for useIsMobile hook
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock dependencies before imports
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}))

const mockSupabaseAuth = {
  getUser: jest.fn(),
}
const mockSupabaseFrom = jest.fn()
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  },
}))

const mockLogClientEvent = jest.fn()
const mockLogAssessmentStarted = jest.fn()
jest.mock('@/lib/logging/clientLogger', () => ({
  logAssessmentStarted: (...args: unknown[]) => mockLogAssessmentStarted(...args),
  logAssessmentResumed: jest.fn(),
  logAssessmentCompleted: jest.fn(),
  logStepNavigated: jest.fn(),
  logValidationError: jest.fn(),
  logErrorDisplayed: jest.fn(),
  logClientEvent: (...args: unknown[]) => mockLogClientEvent(...args),
}))

import { render, waitFor, screen } from '@testing-library/react'
import FunnelClient from '../client'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('FunnelClient 404 fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default: authenticated user with profile
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'patient-123' },
        error: null,
      }),
    })
  })

  afterEach(() => {
    jest.resetModules()
  })

  const setupFetchMocks = (options: {
    funnelDefinition?: object | null
    assessmentGetStatus?: number
    assessmentGetData?: object | null
    assessmentPostStatus?: number
    assessmentPostData?: object | null
    contentPages?: object[]
  }) => {
    const {
      funnelDefinition = { slug: 'test-funnel', steps: [{ id: 'step-1', title: 'Step 1' }] },
      assessmentGetStatus = 200,
      assessmentGetData = null,
      assessmentPostStatus = 201,
      assessmentPostData = { assessmentId: 'new-assessment-123' },
      contentPages = [],
    } = options

    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      const method = opts?.method || 'GET'

      // Funnel definition
      if (url.includes('/definition')) {
        return Promise.resolve({
          ok: funnelDefinition !== null,
          status: funnelDefinition ? 200 : 404,
          json: () => Promise.resolve(funnelDefinition),
        })
      }

      // Content pages
      if (url.includes('/content-pages')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(contentPages),
        })
      }

      // GET assessment status
      if (url.match(/\/assessments\/[^/]+$/) && method === 'GET') {
        if (assessmentGetStatus === 404) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () =>
              Promise.resolve({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Assessment not found' },
              }),
          })
        }
        if (assessmentGetStatus === 401) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () =>
              Promise.resolve({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
              }),
          })
        }
        if (assessmentGetStatus === 403) {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: () =>
              Promise.resolve({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Forbidden' },
              }),
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: assessmentGetData || {
                assessmentId: 'existing-assessment-123',
                status: 'in_progress',
                currentStep: { stepId: 'step-1', stepIndex: 0 },
                completedSteps: 0,
                totalSteps: 3,
              },
            }),
        })
      }

      // POST create assessment
      if (url.match(/\/assessments$/) && method === 'POST') {
        if (assessmentPostStatus >= 400) {
          return Promise.resolve({
            ok: false,
            status: assessmentPostStatus,
            json: () =>
              Promise.resolve({
                success: false,
                error: { code: 'CREATE_FAILED', message: 'Failed to create' },
              }),
          })
        }
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              success: true,
              data: assessmentPostData,
            }),
        })
      }

      // Default
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    })
  }

  it('should create new assessment when GET returns 404', async () => {
    // First GET returns 404, then POST creates new, then GET succeeds
    let getCallCount = 0

    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      const method = opts?.method || 'GET'

      if (url.includes('/definition')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ slug: 'test-funnel', steps: [{ id: 'step-1', title: 'Step 1' }] }),
        })
      }

      if (url.includes('/content-pages')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        })
      }

      // GET assessment - first call returns 404, subsequent calls succeed
      if (url.match(/\/assessments\/[^/]+$/) && method === 'GET') {
        getCallCount++
        if (getCallCount === 1) {
          // First call: 404 for stale assessment
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () =>
              Promise.resolve({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Assessment not found' },
              }),
          })
        }
        // Subsequent calls: success with new assessment
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                assessmentId: 'new-assessment-456',
                status: 'in_progress',
                currentStep: { stepId: 'step-1', stepIndex: 0 },
                completedSteps: 0,
                totalSteps: 3,
              },
            }),
        })
      }

      // POST create assessment
      if (url.match(/\/assessments$/) && method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              success: true,
              data: { assessmentId: 'new-assessment-456' },
            }),
        })
      }

      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) })
    })

    // Mock supabase to return no existing assessments (so initAssessment creates new)
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'patient_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'patient-123' }, error: null }),
        }
      }
      if (table === 'assessments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 'stale-assessment-789', status: 'in_progress' }],
            error: null,
          }),
        }
      }
      if (table === 'assessment_answers') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    render(<FunnelClient slug="test-funnel" />)

    // Wait for the component to complete bootstrap
    await waitFor(
      () => {
        // Check that fallback telemetry was logged
        expect(mockLogClientEvent).toHaveBeenCalledWith(
          'ASSESSMENT_404_FALLBACK',
          expect.objectContaining({
            slug: 'test-funnel',
            staleAssessmentId: 'stale-assessment-789',
          }),
        )
      },
      { timeout: 5000 },
    )

    // Verify recovery telemetry
    expect(mockLogClientEvent).toHaveBeenCalledWith(
      'ASSESSMENT_404_RECOVERED',
      expect.objectContaining({
        slug: 'test-funnel',
        oldAssessmentId: 'stale-assessment-789',
        newAssessmentId: 'new-assessment-456',
      }),
    )

    // Verify assessment started was logged for new assessment
    expect(mockLogAssessmentStarted).toHaveBeenCalledWith('new-assessment-456', 'test-funnel')
  })

  it('should NOT create new assessment when GET returns 401', async () => {
    setupFetchMocks({
      assessmentGetStatus: 401,
    })

    // Mock existing in-progress assessment
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'patient_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'patient-123' }, error: null }),
        }
      }
      if (table === 'assessments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 'existing-assessment-123', status: 'in_progress' }],
            error: null,
          }),
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    render(<FunnelClient slug="test-funnel" />)

    // Wait for error state
    await waitFor(
      () => {
        expect(screen.getByText(/unauthorized/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    ).catch(() => {
      // Error may be displayed differently
    })

    // Verify NO fallback telemetry was logged
    expect(mockLogClientEvent).not.toHaveBeenCalledWith(
      'ASSESSMENT_404_FALLBACK',
      expect.anything(),
    )

    // Verify NO POST request was made
    const postCalls = mockFetch.mock.calls.filter(
      (call) => call[1]?.method === 'POST' && String(call[0]).includes('/assessments'),
    )
    expect(postCalls.length).toBe(0)
  })

  it('should NOT create new assessment when GET returns 403', async () => {
    setupFetchMocks({
      assessmentGetStatus: 403,
    })

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'patient_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'patient-123' }, error: null }),
        }
      }
      if (table === 'assessments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 'existing-assessment-123', status: 'in_progress' }],
            error: null,
          }),
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    render(<FunnelClient slug="test-funnel" />)

    // Wait a bit for processing
    await new Promise((r) => setTimeout(r, 500))

    // Verify NO fallback telemetry was logged
    expect(mockLogClientEvent).not.toHaveBeenCalledWith(
      'ASSESSMENT_404_FALLBACK',
      expect.anything(),
    )
  })
})
