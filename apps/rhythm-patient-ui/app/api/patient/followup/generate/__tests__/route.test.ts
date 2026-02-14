import { POST } from '../route'

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = require('@/lib/db/supabase.server')

describe('POST /api/patient/followup/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps hard-stop A block and returns no patient questions', async () => {
    let updatedStructuredData: Record<string, unknown> | null = null

    const queryBuilder = {
      _mode: 'select' as 'select' | 'update',
      select: jest.fn(function select() {
        this._mode = 'select'
        return this
      }),
      update: jest.fn(function update(payload: { structured_data?: Record<string, unknown> }) {
        this._mode = 'update'
        updatedStructuredData = payload.structured_data ?? null
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
      maybeSingle: jest.fn(async function maybeSingle() {
        if (this._mode === 'select') {
          return {
            data: {
              id: '11111111-1111-4111-8111-111111111111',
              user_id: '22222222-2222-4222-8222-222222222222',
              patient_id: '33333333-3333-4333-8333-333333333333',
              structured_data: {
                status: 'draft',
                safety: {
                  effective_level: 'A',
                  effective_action: 'hard_stop',
                },
                followup: {
                  next_questions: [
                    {
                      id: 'clinician-request:bitte-medikation-erganzen',
                      question: 'Bitte Medikation ergaenzen?',
                      why: 'Rueckfrage aus aerztlicher Pruefung',
                      priority: 1,
                      source: 'clinician_request',
                    },
                  ],
                  asked_question_ids: [],
                  last_generated_at: '2026-02-14T10:00:00.000Z',
                },
              },
            },
            error: null,
          }
        }

        return { data: null, error: null }
      }),
    }

    const supabase = {
      auth: {
        getUser: jest.fn(async () => ({
          data: { user: { id: '22222222-2222-4222-8222-222222222222' } },
          error: null,
        })),
      },
      from: jest.fn(() => queryBuilder),
    }

    createServerSupabaseClient.mockResolvedValue(supabase)

    const request = new Request('http://localhost/api/patient/followup/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        intakeId: '11111111-1111-4111-8111-111111111111',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json?.success).toBe(true)
    expect(json?.data?.blocked).toBe(true)
    expect(json?.data?.next_questions).toEqual([])

    expect(updatedStructuredData).toBeTruthy()
    const followup = (
      (updatedStructuredData ?? undefined) as { followup?: { next_questions?: unknown[] } } | undefined
    )?.followup
    expect(Array.isArray(followup?.next_questions)).toBe(true)
    expect(followup?.next_questions).toEqual([])
  })
})
