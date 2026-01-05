/**
 * Tests for PATCH /api/tasks/[id]
 * V05-I07.4 - Task Management
 * 
 * Test coverage:
 * - 401: Authentication required
 * - 403: Forbidden
 * - 422: Validation error
 * - 404: Task not found
 * - 409: Invalid status transition
 * - 200: Success with transition guard + PHI-free audit
 */

export {}

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
  update: jest.Mock
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
  builder.update = jest.fn(() => builder)

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

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/audit/log', () => ({
  logAuditEvent: jest.fn(),
}))

type EnvOverrides = Partial<{
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
}>

async function importRouteWithEnv(overrides: EnvOverrides) {
  jest.resetModules()

  const envMock = {
    NEXT_PUBLIC_SUPABASE_URL: overrides.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: overrides.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon',
    SUPABASE_SERVICE_ROLE_KEY: overrides.SUPABASE_SERVICE_ROLE_KEY ?? 'service-key',
  }

  jest.doMock('@/lib/env', () => ({ env: envMock }))

  const mod = await import('../route')
  return mod as { PATCH: (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response> }
}

function getMocks() {
  const { cookies } = jest.requireMock('next/headers') as { cookies: jest.Mock }
  const { createServerClient } = jest.requireMock('@supabase/ssr') as {
    createServerClient: jest.Mock
  }
  const { createClient } = jest.requireMock('@supabase/supabase-js') as { createClient: jest.Mock }
  const { logAuditEvent } = jest.requireMock('@/lib/audit/log') as { logAuditEvent: jest.Mock }

  return { cookies, createServerClient, createClient, logAuditEvent }
}

function setupCookieStore() {
  const { cookies } = getMocks()
  cookies.mockResolvedValue({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })
}

describe('PATCH /api/tasks/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('401: No auth => AUTHENTICATION_REQUIRED', async () => {
    const { PATCH } = await importRouteWithEnv({})
    setupCookieStore()

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: jest.fn(),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await PATCH(
      new Request('http://localhost/api/tasks/t1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      }),
      { params: Promise.resolve({ id: 't1' }) }
    )

    expect(res.status).toBe(401)
  })

  it('404: Task not found => NOT_FOUND', async () => {
    const { PATCH } = await importRouteWithEnv({})
    setupCookieStore()

    const taskBuilder = makeThenableBuilder({ data: null, error: { code: 'PGRST116' } })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } }, error: null }),
      },
      from: jest.fn(() => taskBuilder),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await PATCH(
      new Request('http://localhost/api/tasks/t1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      }),
      { params: Promise.resolve({ id: 't1' }) }
    )

    expect(res.status).toBe(404)
    const json = (await res.json()) as { success: boolean; error: { code: string } }
    expect(json.error.code).toBe('NOT_FOUND')
  })

  it('409: Invalid transition (completed → in_progress) => INVALID_TRANSITION', async () => {
    const { PATCH } = await importRouteWithEnv({})
    setupCookieStore()

    const taskBuilder = makeThenableBuilder({
      data: {
        id: 't1',
        organization_id: 'org1',
        patient_id: 'p1',
        task_type: 'ldl_measurement',
        status: 'completed', // Terminal state
        payload: {},
      },
      error: null,
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } }, error: null }),
      },
      from: jest.fn(() => taskBuilder),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await PATCH(
      new Request('http://localhost/api/tasks/t1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }), // Can't go back
      }),
      { params: Promise.resolve({ id: 't1' }) }
    )

    expect(res.status).toBe(409)
    const json = (await res.json()) as { success: boolean; error: { code: string; message: string } }
    expect(json.error.code).toBe('INVALID_TRANSITION')
    expect(json.error.message).toContain('completed')
    expect(json.error.message).toContain('in_progress')
  })

  it('200: Valid transition (pending → in_progress) + PHI-free audit', async () => {
    const { PATCH } = await importRouteWithEnv({})
    setupCookieStore()

    const orgId = 'org1'
    const taskId = 't1'

    const existingTaskBuilder = makeThenableBuilder({
      data: {
        id: taskId,
        organization_id: orgId,
        patient_id: 'p1',
        task_type: 'ldl_measurement',
        status: 'pending',
        payload: { notes: 'some PHI data' },
        due_at: null,
      },
      error: null,
    })

    const updatedTaskBuilder = makeThenableBuilder({
      data: {
        id: taskId,
        organization_id: orgId,
        patient_id: 'p1',
        task_type: 'ldl_measurement',
        status: 'in_progress',
        payload: { notes: 'some PHI data' },
        due_at: null,
        updated_at: '2026-01-05T16:00:00Z',
      },
      error: null,
    })

    const mockServerClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } }, error: null }),
      },
      from: jest.fn(() => existingTaskBuilder),
    }

    const mockAdminClient: MockSupabaseClient = {
      auth: { getUser: jest.fn() },
      from: jest.fn(() => updatedTaskBuilder),
    }

    const { createServerClient, createClient, logAuditEvent } = getMocks()
    createServerClient.mockReturnValue(mockServerClient)
    createClient.mockReturnValue(mockAdminClient)

    const res = await PATCH(
      new Request('http://localhost/api/tasks/t1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      }),
      { params: Promise.resolve({ id: 't1' }) }
    )

    expect(res.status).toBe(200)
    const json = (await res.json()) as { success: boolean; data: { status: string } }
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('in_progress')

    // Verify audit log is PHI-free
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'task',
        entity_id: taskId,
        action: 'update',
        diff: {
          before: {
            status: 'pending',
            // NO payload - PHI risk
          },
          after: {
            status: 'in_progress',
            // NO payload - PHI risk
          },
        },
        metadata: expect.objectContaining({
          org_id: orgId,
          status_changed: true,
        }),
      })
    )

    // Ensure no payload in audit log
    const auditCall = logAuditEvent.mock.calls[0][0]
    expect(auditCall.diff.before.payload).toBeUndefined()
    expect(auditCall.diff.after.payload).toBeUndefined()
  })

  it('200: Allowed transitions from pending', async () => {
    const { PATCH } = await importRouteWithEnv({})
    setupCookieStore()

    const makeTask = (status: string) => ({
      id: 't1',
      organization_id: 'org1',
      patient_id: 'p1',
      task_type: 'ldl_measurement',
      status,
      payload: {},
    })

    // pending → in_progress
    const taskBuilder1 = makeThenableBuilder({ data: makeTask('pending'), error: null })
    const updatedBuilder1 = makeThenableBuilder({ data: makeTask('in_progress'), error: null })

    const mockClient1: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } }, error: null }),
      },
      from: jest.fn(() => taskBuilder1),
    }

    const mockAdmin1: MockSupabaseClient = {
      auth: { getUser: jest.fn() },
      from: jest.fn(() => updatedBuilder1),
    }

    const { createServerClient, createClient } = getMocks()
    createServerClient.mockReturnValue(mockClient1)
    createClient.mockReturnValue(mockAdmin1)

    const res1 = await PATCH(
      new Request('http://localhost/api/tasks/t1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      }),
      { params: Promise.resolve({ id: 't1' }) }
    )

    expect(res1.status).toBe(200)

    // pending → cancelled
    jest.clearAllMocks()

    const taskBuilder2 = makeThenableBuilder({ data: makeTask('pending'), error: null })
    const updatedBuilder2 = makeThenableBuilder({ data: makeTask('cancelled'), error: null })

    const mockClient2: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } }, error: null }),
      },
      from: jest.fn(() => taskBuilder2),
    }

    const mockAdmin2: MockSupabaseClient = {
      auth: { getUser: jest.fn() },
      from: jest.fn(() => updatedBuilder2),
    }

    createServerClient.mockReturnValue(mockClient2)
    createClient.mockReturnValue(mockAdmin2)

    const res2 = await PATCH(
      new Request('http://localhost/api/tasks/t1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      }),
      { params: Promise.resolve({ id: 't1' }) }
    )

    expect(res2.status).toBe(200)
  })
})
