import { POST } from '../route'

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/db/supabase.admin', () => ({
  createAdminSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/patients/resolvePatientIds', () => ({
  resolvePatientIds: jest.fn(),
}))

const { createServerSupabaseClient } = require('@/lib/db/supabase.server')

describe('POST /api/clinician/patient/[patientId]/clinical-intake/[intakeId]/review', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    })

    const request = new Request('http://localhost/api/clinician/patient/patient-1/clinical-intake/intake-1/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'in_review' }),
    })

    const response = await POST(request, {
      params: Promise.resolve({ patientId: 'patient-1', intakeId: 'intake-1' }),
    })

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.success).toBe(false)
  })

  it('returns 403 when authenticated user is not clinician/admin', async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({
          data: {
            user: {
              id: 'user-1',
              app_metadata: { role: 'patient' },
              user_metadata: {},
            },
          },
          error: null,
        })),
      },
    })

    const request = new Request('http://localhost/api/clinician/patient/patient-1/clinical-intake/intake-1/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'in_review' }),
    })

    const response = await POST(request, {
      params: Promise.resolve({ patientId: 'patient-1', intakeId: 'intake-1' }),
    })

    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.success).toBe(false)
  })
})
