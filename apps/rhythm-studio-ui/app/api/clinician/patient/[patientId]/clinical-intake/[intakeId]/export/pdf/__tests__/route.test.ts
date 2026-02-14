import { GET } from '../route'

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/db/supabase.admin', () => ({
  createAdminSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/patients/resolvePatientIds', () => ({
  resolvePatientIds: jest.fn(),
}))

jest.mock('@/lib/clinicalIntake/exportPayload', () => ({
  fetchIntakeAndReviewAudit: jest.fn(),
  buildClinicalIntakeExportPayload: jest.fn(),
}))

jest.mock('@/lib/clinicalIntake/exportPdf', () => ({
  renderClinicalIntakeSummaryPdf: jest.fn(),
}))

const { createServerSupabaseClient } = require('@/lib/db/supabase.server')
const { createAdminSupabaseClient } = require('@/lib/db/supabase.admin')
const { resolvePatientIds } = require('@/lib/patients/resolvePatientIds')
const { fetchIntakeAndReviewAudit, buildClinicalIntakeExportPayload } = require('@/lib/clinicalIntake/exportPayload')
const { renderClinicalIntakeSummaryPdf } = require('@/lib/clinicalIntake/exportPdf')

type AssignmentQueryChain = {
  select: jest.Mock<AssignmentQueryChain, []>
  eq: jest.Mock<AssignmentQueryChain, [string, string]>
  maybeSingle: jest.Mock<Promise<{ data: { id: string } | null; error: null }>, []>
}

const createAssignmentCapableSupabase = (user: Record<string, unknown>) => {
  const chain = {} as AssignmentQueryChain
  chain.select = jest.fn(() => chain)
  chain.eq = jest.fn(() => chain)
  chain.maybeSingle = jest.fn(async () => ({ data: { id: 'assignment-1' }, error: null }))

  return {
    auth: {
      getUser: jest.fn(async () => ({ data: { user }, error: null })),
    },
    from: jest.fn(() => chain),
  }
}

describe('GET /api/clinician/patient/[patientId]/clinical-intake/[intakeId]/export/pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createAdminSupabaseClient.mockReturnValue({})
    resolvePatientIds.mockResolvedValue({
      patientProfileId: 'profile-1',
      patientUserId: 'patient-user-1',
    })
  })

  it('returns 401 when unauthenticated', async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    })

    const response = await GET(new Request('http://localhost/api'), {
      params: Promise.resolve({ patientId: 'p1', intakeId: 'i1' }),
    })

    expect(response.status).toBe(401)
  })

  it('returns 403 when role is not clinician/admin', async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({
          data: { user: { id: 'u1', app_metadata: { role: 'patient' }, user_metadata: {} } },
          error: null,
        })),
      },
    })

    const response = await GET(new Request('http://localhost/api'), {
      params: Promise.resolve({ patientId: 'p1', intakeId: 'i1' }),
    })

    expect(response.status).toBe(403)
  })

  it('returns 200 and application/pdf for clinician export', async () => {
    createServerSupabaseClient.mockResolvedValue(
      createAssignmentCapableSupabase({
        id: 'clinician-1',
        app_metadata: { role: 'clinician' },
        user_metadata: {},
      }),
    )

    fetchIntakeAndReviewAudit.mockResolvedValue({
      intake: { id: 'i1', user_id: 'patient-user-1', patient_id: 'profile-1' },
      reviewAudit: [],
      error: null,
    })

    buildClinicalIntakeExportPayload.mockReturnValue({
      metadata: {
        patient_ref: 'PT-1234567890ab',
        intake_version: 1,
      },
    })

    renderClinicalIntakeSummaryPdf.mockResolvedValue(Buffer.from('%PDF-1.4\n', 'utf-8'))

    const response = await GET(new Request('http://localhost/api'), {
      params: Promise.resolve({ patientId: 'p1', intakeId: 'i1' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/pdf')
  })
})
