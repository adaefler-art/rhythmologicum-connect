import { GET } from '../route'

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = require('@/lib/db/supabase.server')

describe('GET /api/patient/intake/latest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn(async () => ({
          data: { user: null },
          error: null,
        })),
      },
    }

    createServerSupabaseClient.mockResolvedValue(supabase)

    const response = await GET()
    expect(response.status).toBe(401)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error?.code).toBe('UNAUTHORIZED')
  })

  it('returns intake with visit_preparation summary fields', async () => {
    const intakeQueryBuilder = {
      select: jest.fn(function select() {
        return this
      }),
      eq: jest.fn(function eq() {
        return this
      }),
      order: jest.fn(function order() {
        return this
      }),
      limit: jest.fn(function limit() {
        return this
      }),
      maybeSingle: jest.fn(async () => ({
        data: {
          id: 'intake-1',
          status: 'active',
          version_number: 3,
          clinical_summary: 'Kurzbefund',
          structured_data: {
            status: 'draft',
            chief_complaint: 'Brustschmerz bei Belastung',
            history_of_present_illness: {
              onset: 'seit gestern',
              duration: '10 Minuten',
              course: 'zunehmend',
              trigger: 'Treppensteigen',
              frequency: '3x täglich',
            },
            red_flags: ['Brustschmerz'],
            medication_entries: [
              {
                name: 'Metoprolol',
                dosage: '50mg',
                intake_frequency: '1x täglich',
              },
            ],
          },
          trigger_reason: 'submitted',
          created_at: '2026-02-19T10:00:00.000Z',
          updated_at: '2026-02-19T10:00:00.000Z',
        },
        error: null,
      })),
    }

    const reviewQueryBuilder = {
      select: jest.fn(function select() {
        return this
      }),
      eq: jest.fn(function eq() {
        return this
      }),
      maybeSingle: jest.fn(async () => ({
        data: {
          status: 'approved',
          review_notes: 'Sieht gut aus',
          requested_items: ['allergien'],
          updated_at: '2026-02-19T11:00:00.000Z',
        },
        error: null,
      })),
    }

    const supabase = {
      auth: {
        getUser: jest.fn(async () => ({
          data: { user: { id: 'user-1' } },
          error: null,
        })),
      },
      from: jest.fn((table: string) => {
        if (table === 'clinical_intakes') {
          return intakeQueryBuilder
        }

        return reviewQueryBuilder
      }),
    }

    createServerSupabaseClient.mockResolvedValue(supabase)

    const response = await GET()
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.intake?.visit_preparation).toEqual({
      chiefComplaint: 'Brustschmerz bei Belastung',
      course: [
        'Beginn: seit gestern',
        'Dauer: 10 Minuten',
        'Verlauf: zunehmend',
        'Auslöser: Treppensteigen',
        'Häufigkeit: 3x täglich',
      ],
      redFlags: ['Brustschmerz'],
      medication: ['Metoprolol (50mg, 1x täglich)'],
    })
    expect(json.intake?.review_state?.status).toBe('approved')
  })

  it('returns 500 when intake query fails', async () => {
    const queryBuilder = {
      select: jest.fn(function select() {
        return this
      }),
      eq: jest.fn(function eq() {
        return this
      }),
      order: jest.fn(function order() {
        return this
      }),
      limit: jest.fn(function limit() {
        return this
      }),
      maybeSingle: jest.fn(async () => ({
        data: null,
        error: { message: 'db fail' },
      })),
    }

    const supabase = {
      auth: {
        getUser: jest.fn(async () => ({
          data: { user: { id: 'user-1' } },
          error: null,
        })),
      },
      from: jest.fn(() => queryBuilder),
    }

    createServerSupabaseClient.mockResolvedValue(supabase)

    const response = await GET()
    expect(response.status).toBe(500)

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error?.code).toBe('DATABASE_ERROR')
  })
})