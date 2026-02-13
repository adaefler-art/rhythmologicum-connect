import { POST } from '../route'
import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { env } from '@/lib/env'

jest.mock('@/lib/api/authHelpers', () => ({
  requireAdminOrClinicianRole: jest.fn(),
}))

jest.mock('@/lib/db/supabase.admin', () => ({
  createAdminSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/cre/reasoning/configStore', () => ({
  getSeedClinicalReasoningConfig: jest.fn(() => ({ seed: true })),
}))

jest.mock('@/lib/env', () => ({
  env: {
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  },
}))

type QueryBuilder = {
  select: jest.Mock
  eq: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  maybeSingle: jest.Mock
  insert: jest.Mock
  single: jest.Mock
}

const createBuilder = (): QueryBuilder => {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn(),
    insert: jest.fn(),
    single: jest.fn(),
  } as QueryBuilder

  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)

  return builder
}

describe('POST /api/admin/reasoning-config/versions', () => {
  const originalServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'

    ;(requireAdminOrClinicianRole as jest.Mock).mockResolvedValue({
      user: {
        id: 'clinician-123',
        email: 'clinician@example.com',
      },
      error: null,
    })
  })

  afterAll(() => {
    env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey
  })

  it('returns 400 when change_reason is missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/reasoning-config/versions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ change_reason: '   ' }),
      }),
    )

    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('VALIDATION_ERROR')
    expect(json.message).toBe('change_reason is required.')
  })

  it('returns 500 SERVER_MISCONFIGURED when service role key is missing', async () => {
    env.SUPABASE_SERVICE_ROLE_KEY = ''

    const response = await POST(
      new Request('http://localhost/api/admin/reasoning-config/versions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ change_reason: 'test' }),
      }),
    )

    expect(response.status).toBe(500)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('SERVER_MISCONFIGURED')
  })

  it('returns success payload with versionId and version on happy path', async () => {
    const readBuilder = createBuilder()
    readBuilder.maybeSingle.mockResolvedValue({
      data: { version: 2, config_json: { foo: 'bar' } },
      error: null,
    })

    const insertBuilder = createBuilder()
    insertBuilder.single.mockResolvedValue({
      data: {
        id: 'draft-uuid',
        version: 3,
        status: 'draft',
      },
      error: null,
    })

    const fromMock = jest
      .fn()
      .mockImplementationOnce(() => readBuilder)
      .mockImplementationOnce(() => insertBuilder)

    ;(createAdminSupabaseClient as jest.Mock).mockReturnValue({ from: fromMock })

    const response = await POST(
      new Request('http://localhost/api/admin/reasoning-config/versions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ change_reason: 'test' }),
      }),
    )

    expect(response.status).toBe(201)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data).toEqual({
      versionId: 'draft-uuid',
      version: 3,
    })
  })

  it('returns 500 when insert returns no data', async () => {
    const readBuilder = createBuilder()
    readBuilder.maybeSingle.mockResolvedValue({
      data: { version: 2, config_json: { foo: 'bar' } },
      error: null,
    })

    const insertBuilder = createBuilder()
    insertBuilder.single.mockResolvedValue({
      data: null,
      error: null,
    })

    const fromMock = jest
      .fn()
      .mockImplementationOnce(() => readBuilder)
      .mockImplementationOnce(() => insertBuilder)

    ;(createAdminSupabaseClient as jest.Mock).mockReturnValue({ from: fromMock })

    const response = await POST(
      new Request('http://localhost/api/admin/reasoning-config/versions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ change_reason: 'test' }),
      }),
    )

    expect(response.status).toBe(500)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('DATABASE_ERROR')
    expect(json.message).toBe('Insert returned no data')
  })
})
