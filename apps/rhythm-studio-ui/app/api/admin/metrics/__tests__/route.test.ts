import { GET } from '../route'
import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

jest.mock('@/lib/api/authHelpers', () => ({
  requireAdminOrClinicianRole: jest.fn(),
}))

jest.mock('@/lib/db/supabase.admin', () => ({
  createAdminSupabaseClient: jest.fn(),
}))

type QueryResult = { data: unknown[]; error: null | { message: string } }

const createBuilder = (result: QueryResult) => {
  const builder = {
    select: jest.fn(),
    gte: jest.fn(),
    order: jest.fn(),
  }

  builder.select.mockReturnValue(builder)
  builder.gte.mockReturnValue(builder)
  builder.order.mockResolvedValue(result)

  return builder
}

describe('GET /api/admin/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    ;(requireAdminOrClinicianRole as jest.Mock).mockResolvedValue({
      user: { id: 'clinician-1' },
      error: null,
    })
  })

  it('returns schema-conform metrics payload', async () => {
    const intakesBuilder = createBuilder({
      data: [{ created_at: '2026-02-10T10:00:00.000Z' }],
      error: null,
    })

    const reviewsBuilder = createBuilder({
      data: [{ created_at: '2026-02-10T11:00:00.000Z', status: 'approved' }],
      error: null,
    })

    const eventsBuilder = createBuilder({
      data: [
        { created_at: '2026-02-10T12:00:00.000Z', event_type: 'followup_question_shown' },
        { created_at: '2026-02-10T12:30:00.000Z', event_type: 'followup_answered' },
        { created_at: '2026-02-10T13:00:00.000Z', event_type: 'hard_stop_triggered' },
      ],
      error: null,
    })

    const fromMock = jest.fn((table: string) => {
      if (table === 'clinical_intakes') return intakesBuilder
      if (table === 'clinical_intake_reviews') return reviewsBuilder
      if (table === 'patient_events') return eventsBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    ;(createAdminSupabaseClient as jest.Mock).mockReturnValue({ from: fromMock })

    const response = await GET(new Request('http://localhost/api/admin/metrics?days=7'))
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.totals).toMatchObject({
      intakes_total: expect.any(Number),
      reviews_total: expect.any(Number),
      approved_rate: expect.any(Number),
      hard_stop_rate: expect.any(Number),
      override_rate: expect.any(Number),
      followup_yield: expect.any(Number),
      upload_completion_rate: expect.any(Number),
    })
    expect(Array.isArray(json.data.timeseries.by_day)).toBe(true)

    expect(json.data.timeseries.by_day[0]).toMatchObject({
      date: expect.any(String),
      intakes: expect.any(Number),
      reviews: expect.any(Number),
      hard_stops: expect.any(Number),
      overrides: expect.any(Number),
      followup_shown: expect.any(Number),
      followup_answered: expect.any(Number),
    })
  })
})
