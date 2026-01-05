/**
 * Tests for POST /api/tasks
 * V05-I07.4 - Task Management
 * 
 * Test coverage:
 * - 401: Authentication required
 * - 403: Forbidden (insufficient role or no org)
 * - 422: Validation error
 * - 201: Success with org_id set server-side
 * - Audit logs are PHI-free
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
  order: jest.Mock
  limit: jest.Mock
  insert: jest.Mock
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
  builder.order = jest.fn(() => builder)
  builder.limit = jest.fn(() => builder)
  builder.insert = jest.fn(() => builder)

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
  return mod as { POST: (request: Request) => Promise<Response>; GET: (request: Request) => Promise<Response> }
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

describe('POST /api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('401: No auth => AUTHENTICATION_REQUIRED', async () => {
    const { POST } = await importRouteWithEnv({})
    setupCookieStore()

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: jest.fn(),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await POST(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: 'p1',
          task_type: 'ldl_measurement',
          assigned_to_role: 'clinician',
        }),
      })
    )

    expect(res.status).toBe(401)
    const json = (await res.json()) as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('AUTHENTICATION_REQUIRED')
  })

  it('403: Patient role => FORBIDDEN', async () => {
    const { POST } = await importRouteWithEnv({})
    setupCookieStore()

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'patient' } } }, error: null }),
      },
      from: jest.fn(),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await POST(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: 'p1',
          task_type: 'ldl_measurement',
          assigned_to_role: 'clinician',
        }),
      })
    )

    expect(res.status).toBe(403)
    const json = (await res.json()) as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('422: Invalid task_type => VALIDATION_ERROR', async () => {
    const { POST } = await importRouteWithEnv({})
    setupCookieStore()

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } }, error: null }),
      },
      from: jest.fn(),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await POST(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: 'p1',
          task_type: 'invalid_type', // Invalid enum
          assigned_to_role: 'clinician',
        }),
      })
    )

    expect(res.status).toBe(422)
    const json = (await res.json()) as { success: boolean; error: { code: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('403: User not in org => FORBIDDEN', async () => {
    const { POST } = await importRouteWithEnv({})
    setupCookieStore()

    const orgBuilder = makeThenableBuilder({ data: null, error: { code: 'PGRST116' } })

    const mockServerClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } }, error: null }),
      },
      from: jest.fn(),
    }

    const mockAdminClient: MockSupabaseClient = {
      auth: { getUser: jest.fn() },
      from: jest.fn((table: string) => {
        if (table === 'user_org_membership') return orgBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const { createServerClient, createClient } = getMocks()
    createServerClient.mockReturnValue(mockServerClient)
    createClient.mockReturnValue(mockAdminClient)

    const res = await POST(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: 'p1',
          task_type: 'ldl_measurement',
          assigned_to_role: 'clinician',
        }),
      })
    )

    expect(res.status).toBe(403)
    const json = (await res.json()) as { success: boolean; error: { code: string; message: string } }
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FORBIDDEN')
    expect(json.error.message).toContain('organization')
  })

  it('201: Happy path => task created with org_id set server-side + PHI-free audit', async () => {
    const { POST } = await importRouteWithEnv({})
    setupCookieStore()

    const orgId = 'org1'
    const taskId = 'task1'
    const patientId = 'p1'

    const orgBuilder = makeThenableBuilder({ data: { organization_id: orgId }, error: null })
    const taskBuilder = makeThenableBuilder({
      data: {
        id: taskId,
        organization_id: orgId,
        patient_id: patientId,
        assessment_id: null,
        task_type: 'ldl_measurement',
        assigned_to_role: 'clinician',
        status: 'pending',
        payload: {},
        due_at: null,
        created_at: '2026-01-05T16:00:00Z',
        updated_at: null,
      },
      error: null,
    })

    const mockServerClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } }, error: null }),
      },
      from: jest.fn(),
    }

    const mockAdminClient: MockSupabaseClient = {
      auth: { getUser: jest.fn() },
      from: jest.fn((table: string) => {
        if (table === 'user_org_membership') return orgBuilder
        if (table === 'tasks') return taskBuilder
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const { createServerClient, createClient, logAuditEvent } = getMocks()
    createServerClient.mockReturnValue(mockServerClient)
    createClient.mockReturnValue(mockAdminClient)

    const res = await POST(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: patientId,
          task_type: 'ldl_measurement',
          assigned_to_role: 'clinician',
        }),
      })
    )

    expect(res.status).toBe(201)
    const json = (await res.json()) as { success: boolean; data: { id: string; organization_id: string } }
    expect(json.success).toBe(true)
    expect(json.data.id).toBe(taskId)
    expect(json.data.organization_id).toBe(orgId)

    // Verify org_id was set server-side
    expect(mockAdminClient.from).toHaveBeenCalledWith('tasks')
    const insertBuilder = mockAdminClient.from('tasks')
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: orgId, // Server-side set
      })
    )

    // Verify audit log is PHI-free
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'task',
        entity_id: taskId,
        action: 'create',
        diff: {
          before: {},
          after: {
            task_type: 'ldl_measurement',
            assigned_to_role: 'clinician',
            status: 'pending',
          },
        },
        metadata: expect.objectContaining({
          org_id: orgId,
          patient_id: patientId,
        }),
      })
    )

    // Ensure no payload in audit log
    const auditCall = logAuditEvent.mock.calls[0][0]
    expect(auditCall.diff.after.payload).toBeUndefined()
    expect(auditCall.metadata.payload).toBeUndefined()
  })
})

describe('GET /api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('401: No auth => AUTHENTICATION_REQUIRED', async () => {
    const { GET } = await importRouteWithEnv({})
    setupCookieStore()

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: jest.fn(),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(new Request('http://localhost/api/tasks'))

    expect(res.status).toBe(401)
  })

  it('403: Patient role => FORBIDDEN', async () => {
    const { GET } = await importRouteWithEnv({})
    setupCookieStore()

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'patient' } } }, error: null }),
      },
      from: jest.fn(),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(new Request('http://localhost/api/tasks'))

    expect(res.status).toBe(403)
  })

  it('200: Happy path => org-scoped tasks with deterministic ordering', async () => {
    const { GET } = await importRouteWithEnv({})
    setupCookieStore()

    const tasksBuilder = makeThenableBuilder({
      data: [
        {
          id: 't1',
          organization_id: 'org1',
          patient_id: 'p1',
          task_type: 'ldl_measurement',
          status: 'pending',
          created_at: '2026-01-05T16:00:00Z',
          patient_profiles: { id: 'p1', full_name: 'Test Patient', user_id: 'u2' },
        },
      ],
      error: null,
    })

    const mockClient: MockSupabaseClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'clinician' } } }, error: null }),
      },
      from: jest.fn(() => tasksBuilder),
    }

    const { createServerClient } = getMocks()
    createServerClient.mockReturnValue(mockClient)

    const res = await GET(new Request('http://localhost/api/tasks'))

    expect(res.status).toBe(200)
    const json = (await res.json()) as { success: boolean; data: unknown[] }
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)

    // Verify deterministic ordering
    expect(tasksBuilder.order).toHaveBeenCalledWith('status', { ascending: true })
    expect(tasksBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(tasksBuilder.order).toHaveBeenCalledWith('id', { ascending: true })
  })
})
