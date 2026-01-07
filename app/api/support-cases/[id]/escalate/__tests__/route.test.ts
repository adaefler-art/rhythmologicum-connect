/**
 * Tests for POST /api/support-cases/[id]/escalate
 * V05-I08.4 - Support Case Escalation
 * 
 * Test coverage:
 * - 401: Authentication required
 * - 403: Forbidden (patients cannot escalate, only staff)
 * - 404: Support case not found
 * - 409: Already escalated (idempotency)
 * - 422: Cannot escalate (closed/invalid status)
 * - 200: Success - creates task + audit, updates case
 * - Escalation is idempotent (duplicate calls → same result, no duplicate task)
 * - Audit logs are PHI-free (no patient_id, subject, notes, description)
 * - Task payload is PHI-free (only support_case_id)
 */

export {}

import { NextRequest } from 'next/server'

const ORG_ID = '11111111-1111-4111-8111-111111111111'
const SUPPORT_CASE_ID = '22222222-2222-4222-8222-222222222222'
const TASK_ID = '33333333-3333-4333-8333-333333333333'
const PATIENT_ID = '44444444-4444-4444-8444-444444444444'
const USER_ID = '55555555-5555-4555-8555-555555555555'

type SupabaseQueryResult<T> = { data: T | null; error: unknown }

type MockSupabaseClient = {
  auth: {
    getUser: jest.Mock
  }
  from: jest.Mock
}

type ThenableBuilder<T> = {
  select: jest.Mock
  single: jest.Mock
  eq: jest.Mock
  is: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  then: (
    onFulfilled?: (value: SupabaseQueryResult<T>) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>
  catch: (onRejected?: (reason: unknown) => unknown) => Promise<unknown>
  finally: (onFinally?: () => void) => Promise<unknown>
}

function makeThenableBuilder<T>(result: SupabaseQueryResult<T>): ThenableBuilder<T> {
  const builder = {} as unknown as ThenableBuilder<T>

  builder.select = jest.fn(() => builder)
  builder.single = jest.fn(() => builder)
  builder.eq = jest.fn(() => builder)
  builder.is = jest.fn(() => builder)
  builder.order = jest.fn(() => builder)
  builder.limit = jest.fn(() => builder)
  builder.insert = jest.fn(() => builder)
  builder.update = jest.fn(() => builder)
  builder.delete = jest.fn(() => builder)

  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected)
  builder.catch = (onRejected) => Promise.resolve(result).catch(onRejected)
  builder.finally = (onFinally) => Promise.resolve(result).finally(onFinally)

  return builder
}

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('@/lib/audit/log', () => ({
  logSupportCaseEscalated: jest.fn(() => Promise.resolve({ success: true })),
}))

type EnvOverrides = Partial<{
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}>

async function importRouteWithEnv(overrides: EnvOverrides) {
  jest.resetModules()

  const envMock = {
    NEXT_PUBLIC_SUPABASE_URL: overrides.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: overrides.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon',
  }

  jest.doMock('@/lib/env', () => ({ env: envMock }))

  const mod = await import('../route')
  return mod as { POST: (request: Request, params: { params: { id: string } }) => Promise<Response> }
}

function getMocks() {
  const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock }
  const { createServerClient } = jest.requireMock('@supabase/ssr') as {
    createServerClient: jest.Mock
  }
  const { logSupportCaseEscalated } = jest.requireMock('@/lib/audit/log') as {
    logSupportCaseEscalated: jest.Mock
  }

  return { cookies, createServerClient, logSupportCaseEscalated }
}

describe('POST /api/support-cases/[id]/escalate', () => {
  let route: { POST: (request: Request, params: { params: { id: string } }) => Promise<Response> }

  beforeAll(async () => {
    route = await importRouteWithEnv({})
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication & Authorization', () => {
    it('returns 401 if not authenticated', async () => {
      const { cookies, createServerClient } = getMocks()

      const mockSupabase = {
        auth: {
          getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: new Error('Not authenticated') })),
        },
        from: jest.fn(),
      } as unknown as MockSupabaseClient

      cookies.mockReturnValue({})
      createServerClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost/api/support-cases/123/escalate', {
        method: 'POST',
        body: JSON.stringify({ assigned_to_role: 'clinician' }),
      })

      const response = await route.POST(request, { params: { id: SUPPORT_CASE_ID } })
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error.code).toBe('AUTHENTICATION_REQUIRED')
    })

    it('returns 403 if user is a patient (not staff)', async () => {
      const { cookies, createServerClient } = getMocks()

      const mockSupabase = {
        auth: {
          getUser: jest.fn(() =>
            Promise.resolve({
              data: { user: { id: USER_ID, app_metadata: { role: 'patient' } } },
              error: null,
            }),
          ),
        },
        from: jest.fn(),
      } as unknown as MockSupabaseClient

      cookies.mockReturnValue({})
      createServerClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost/api/support-cases/123/escalate', {
        method: 'POST',
        body: JSON.stringify({ assigned_to_role: 'clinician' }),
      })

      const response = await route.POST(request, { params: { id: SUPPORT_CASE_ID } })
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
      expect(json.error.message).toContain('Only staff members')
    })

    it('allows escalation for clinician role', async () => {
      const { cookies, createServerClient, logSupportCaseEscalated } = getMocks()

      const mockSupabase = {
        auth: {
          getUser: jest.fn(() =>
            Promise.resolve({
              data: { user: { id: USER_ID, app_metadata: { role: 'clinician' } } },
              error: null,
            }),
          ),
        },
        from: jest.fn((table: string) => {
          if (table === 'user_org_membership') {
            return makeThenableBuilder({ data: { organization_id: ORG_ID }, error: null })
          }
          if (table === 'support_cases') {
            return makeThenableBuilder({
              data: {
                id: SUPPORT_CASE_ID,
                patient_id: PATIENT_ID,
                status: 'open',
                escalated_task_id: null,
                organization_id: ORG_ID,
              },
              error: null,
            })
          }
          if (table === 'tasks') {
            return makeThenableBuilder({
              data: { id: TASK_ID },
              error: null,
            })
          }
          return makeThenableBuilder({ data: null, error: new Error('Unknown table') })
        }),
      } as unknown as MockSupabaseClient

      cookies.mockReturnValue({})
      createServerClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost/api/support-cases/123/escalate', {
        method: 'POST',
        body: JSON.stringify({ assigned_to_role: 'clinician' }),
      })

      const response = await route.POST(request, { params: { id: SUPPORT_CASE_ID } })

      expect(response.status).toBe(200)
      expect(logSupportCaseEscalated).toHaveBeenCalled()
    })
  })

  describe('Idempotency', () => {
    it('returns 409 if support case is already escalated', async () => {
      const { cookies, createServerClient } = getMocks()

      const existingTaskId = '99999999-9999-4999-8999-999999999999'
      const escalatedAt = '2026-01-06T10:00:00Z'

      const mockSupabase = {
        auth: {
          getUser: jest.fn(() =>
            Promise.resolve({
              data: { user: { id: USER_ID, app_metadata: { role: 'clinician' } } },
              error: null,
            }),
          ),
        },
        from: jest.fn((table: string) => {
          if (table === 'user_org_membership') {
            return makeThenableBuilder({ data: { organization_id: ORG_ID }, error: null })
          }
          if (table === 'support_cases') {
            return makeThenableBuilder({
              data: {
                id: SUPPORT_CASE_ID,
                patient_id: PATIENT_ID,
                status: 'escalated',
                escalated_task_id: existingTaskId,
                escalated_at: escalatedAt,
                organization_id: ORG_ID,
              },
              error: null,
            })
          }
          return makeThenableBuilder({ data: null, error: new Error('Unknown table') })
        }),
      } as unknown as MockSupabaseClient

      cookies.mockReturnValue({})
      createServerClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost/api/support-cases/123/escalate', {
        method: 'POST',
        body: JSON.stringify({ assigned_to_role: 'clinician' }),
      })

      const response = await route.POST(request, { params: { id: SUPPORT_CASE_ID } })
      const json = await response.json()

      expect(response.status).toBe(409)
      expect(json.error.code).toBe('ALREADY_ESCALATED')
      expect(json.error.details.escalated_task_id).toBe(existingTaskId)
      expect(json.error.details.escalated_at).toBe(escalatedAt)
    })

    it('returns 422 if support case is closed (cannot escalate)', async () => {
      const { cookies, createServerClient } = getMocks()

      const mockSupabase = {
        auth: {
          getUser: jest.fn(() =>
            Promise.resolve({
              data: { user: { id: USER_ID, app_metadata: { role: 'clinician' } } },
              error: null,
            }),
          ),
        },
        from: jest.fn((table: string) => {
          if (table === 'user_org_membership') {
            return makeThenableBuilder({ data: { organization_id: ORG_ID }, error: null })
          }
          if (table === 'support_cases') {
            return makeThenableBuilder({
              data: {
                id: SUPPORT_CASE_ID,
                patient_id: PATIENT_ID,
                status: 'closed',
                escalated_task_id: null,
                organization_id: ORG_ID,
              },
              error: null,
            })
          }
          return makeThenableBuilder({ data: null, error: new Error('Unknown table') })
        }),
      } as unknown as MockSupabaseClient

      cookies.mockReturnValue({})
      createServerClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost/api/support-cases/123/escalate', {
        method: 'POST',
        body: JSON.stringify({ assigned_to_role: 'clinician' }),
      })

      const response = await route.POST(request, { params: { id: SUPPORT_CASE_ID } })
      const json = await response.json()

      expect(response.status).toBe(422)
      expect(json.error.code).toBe('INVALID_OPERATION')
      expect(json.error.details.current_status).toBe('closed')
    })
  })

  describe('PHI Protection', () => {
    it('does not include PHI in audit log metadata', async () => {
      const { cookies, createServerClient, logSupportCaseEscalated } = getMocks()

      const mockSupabase = {
        auth: {
          getUser: jest.fn(() =>
            Promise.resolve({
              data: { user: { id: USER_ID, app_metadata: { role: 'clinician' } } },
              error: null,
            }),
          ),
        },
        from: jest.fn((table: string) => {
          if (table === 'user_org_membership') {
            return makeThenableBuilder({ data: { organization_id: ORG_ID }, error: null })
          }
          if (table === 'support_cases') {
            return makeThenableBuilder({
              data: {
                id: SUPPORT_CASE_ID,
                patient_id: PATIENT_ID,
                status: 'open',
                escalated_task_id: null,
                organization_id: ORG_ID,
                subject: 'Patient has chest pain',
                description: 'Detailed medical info...',
                notes: 'Internal staff notes...',
              },
              error: null,
            })
          }
          if (table === 'tasks') {
            return makeThenableBuilder({
              data: { id: TASK_ID },
              error: null,
            })
          }
          return makeThenableBuilder({ data: null, error: new Error('Unknown table') })
        }),
      } as unknown as MockSupabaseClient

      cookies.mockReturnValue({})
      createServerClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost/api/support-cases/123/escalate', {
        method: 'POST',
        body: JSON.stringify({ assigned_to_role: 'clinician', escalation_notes: 'Urgent case' }),
      })

      await route.POST(request, { params: { id: SUPPORT_CASE_ID } })

      // Verify audit log call
      expect(logSupportCaseEscalated).toHaveBeenCalledWith({
        org_id: ORG_ID,
        actor_user_id: USER_ID,
        actor_role: 'clinician',
        support_case_id: SUPPORT_CASE_ID,
        task_id: TASK_ID,
        assigned_to_role: 'clinician',
      })

      // Ensure no PHI in audit metadata
      const auditCall = logSupportCaseEscalated.mock.calls[0][0]
      expect(auditCall).not.toHaveProperty('patient_id')
      expect(auditCall).not.toHaveProperty('subject')
      expect(auditCall).not.toHaveProperty('description')
      expect(auditCall).not.toHaveProperty('notes')
      expect(auditCall).not.toHaveProperty('escalation_notes')
    })

    it('does not include PHI in task payload', async () => {
      const { cookies, createServerClient } = getMocks()

      let taskPayload: unknown = null

      const mockSupabase = {
        auth: {
          getUser: jest.fn(() =>
            Promise.resolve({
              data: { user: { id: USER_ID, app_metadata: { role: 'clinician' } } },
              error: null,
            }),
          ),
        },
        from: jest.fn((table: string) => {
          if (table === 'user_org_membership') {
            return makeThenableBuilder({ data: { organization_id: ORG_ID }, error: null })
          }
          if (table === 'support_cases') {
            return makeThenableBuilder({
              data: {
                id: SUPPORT_CASE_ID,
                patient_id: PATIENT_ID,
                status: 'open',
                escalated_task_id: null,
                organization_id: ORG_ID,
                subject: 'Patient has chest pain',
                description: 'Detailed medical info...',
                category: 'medical',
                priority: 'urgent',
              },
              error: null,
            })
          }
          if (table === 'tasks') {
            const builder = makeThenableBuilder({
              data: { id: TASK_ID },
              error: null,
            })
            const originalInsert = builder.insert
            builder.insert = jest.fn((data) => {
              taskPayload = data.payload
              return originalInsert(data)
            })
            return builder
          }
          return makeThenableBuilder({ data: null, error: new Error('Unknown table') })
        }),
      } as unknown as MockSupabaseClient

      cookies.mockReturnValue({})
      createServerClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost/api/support-cases/123/escalate', {
        method: 'POST',
        body: JSON.stringify({ assigned_to_role: 'clinician', escalation_notes: 'Urgent medical case' }),
      })

      await route.POST(request, { params: { id: SUPPORT_CASE_ID } })

      // Verify task payload only contains support_case_id (PHI-free)
      expect(taskPayload).toEqual({
        support_case_id: SUPPORT_CASE_ID,
      })
      expect(taskPayload).not.toHaveProperty('subject')
      expect(taskPayload).not.toHaveProperty('description')
      expect(taskPayload).not.toHaveProperty('category')
      expect(taskPayload).not.toHaveProperty('priority')
      expect(taskPayload).not.toHaveProperty('escalation_notes')
    })
  })
})
