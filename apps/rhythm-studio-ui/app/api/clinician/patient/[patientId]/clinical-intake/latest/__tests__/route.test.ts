import { GET } from '../route'

declare const jest: any
declare const describe: any
declare const beforeEach: any
declare const it: any
declare const expect: any
declare function require(moduleName: string): any

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/db/supabase.admin', () => ({
  createAdminSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/patients/resolvePatientIds', () => ({
  resolvePatientIds: jest.fn(),
}))

jest.mock('@/lib/cre/safety/policyEngine', () => ({
  loadSafetyPolicy: jest.fn(() => ({ version: 'test-policy' })),
}))

jest.mock('@/lib/cre/safety/overrideHelpers', () => ({
  buildEffectiveSafety: jest.fn(({ structuredData }: { structuredData: Record<string, unknown> }) => ({
    safety: {
      ...(structuredData.safety as Record<string, unknown> | undefined),
      effective_level: 'C',
      effective_action: 'none',
    },
  })),
}))

jest.mock('@/lib/telemetry/correlationId', () => ({
  getCorrelationId: jest.fn(() => 'corr-test-1'),
}))

const { createServerSupabaseClient } = require('@/lib/db/supabase.server')
const { createAdminSupabaseClient } = require('@/lib/db/supabase.admin')
const { resolvePatientIds } = require('@/lib/patients/resolvePatientIds')

describe('GET /api/clinician/patient/[patientId]/clinical-intake/latest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns server-side case_checklist snapshot with normalized statuses', async () => {
    resolvePatientIds.mockResolvedValue({
      patientProfileId: 'profile-1',
      patientUserId: 'user-1',
    })

    createAdminSupabaseClient.mockReturnValue({})

    const makeClinicalIntakeBuilder = () => {
      let isCountQuery = false

      const builder = {
        select: jest.fn((_fields: string, options?: { head?: boolean }) => {
          isCountQuery = Boolean(options?.head)
          return builder
        }),
        eq: jest.fn(() => {
          if (isCountQuery) {
            return Promise.resolve({ count: 1 })
          }
          return builder
        }),
        order: jest.fn(() => {
          return builder
        }),
        limit: jest.fn(() => {
          return builder
        }),
        maybeSingle: jest.fn(async () => {
          return {
            data: {
              id: 'intake-1',
              status: 'active',
              version_number: 2,
              clinical_summary: 'Summary',
              structured_data: {
                status: 'draft',
                followup: {
                  objectives: [
                    { id: 'objective:onset', label: 'Beschwerdebeginn', status: 'missing' },
                    { id: 'objective:course', label: 'Beschwerdeverlauf', status: 'unclear' },
                    {
                      id: 'objective:prior-findings-upload',
                      label: 'Vorbefunde/Uploads',
                      status: 'blocked_by_safety',
                    },
                    {
                      id: 'objective:frequency',
                      label: 'Beschwerdefrequenz',
                      status: 'resolved',
                    },
                  ],
                },
              },
              policy_override: null,
              trigger_reason: 'submitted',
              last_updated_from_messages: [],
              created_at: '2026-02-19T08:00:00.000Z',
              updated_at: '2026-02-19T08:05:00.000Z',
              organization_id: 'org-1',
            },
            error: null,
          }
        }),
      }

      return builder
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn(async () => ({
          data: {
            user: {
              id: 'admin-1',
              app_metadata: { role: 'admin' },
              user_metadata: {},
            },
          },
          error: null,
        })),
      },
      from: jest.fn((table: string) => {
        if (table === 'clinical_intakes') {
          return makeClinicalIntakeBuilder()
        }

        const fallbackBuilder = {
          select: jest.fn(() => {
            return fallbackBuilder
          }),
          eq: jest.fn(() => {
            return fallbackBuilder
          }),
          maybeSingle: jest.fn(async () => ({ data: null, error: null })),
        }

        return {
          ...fallbackBuilder,
        }
      }),
    })

    const request = new Request(
      'http://localhost/api/clinician/patient/patient-1/clinical-intake/latest',
      { method: 'GET' },
    )

    const response = await GET(request, {
      params: Promise.resolve({ patientId: 'patient-1' }),
    })

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data?.intake?.case_checklist).toEqual({
      entries: [
        {
          id: 'objective:onset',
          label: 'Beschwerdebeginn',
          status: 'missing',
        },
        {
          id: 'objective:course',
          label: 'Beschwerdeverlauf',
          status: 'unclear',
        },
        {
          id: 'objective:prior-findings-upload',
          label: 'Vorbefunde/Uploads',
          status: 'delegated_to_physician',
        },
        {
          id: 'objective:frequency',
          label: 'Beschwerdefrequenz',
          status: 'captured',
        },
      ],
      open_loop_count: 3,
      status_counts: {
        captured: 1,
        missing: 1,
        unclear: 1,
        delegated_to_physician: 1,
      },
    })
  })
})
