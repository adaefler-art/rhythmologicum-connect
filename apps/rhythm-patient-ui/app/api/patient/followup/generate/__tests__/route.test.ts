import { POST } from '../route'

jest.mock('@/lib/cre/language/normalization', () => ({
  normalizeClinicalLanguageTurn: jest.fn(),
}))

jest.mock('@/lib/telemetry/trackEvent.server', () => ({
  trackEvent: jest.fn(async () => null),
}))

jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = require('@/lib/db/supabase.server')
const { normalizeClinicalLanguageTurn } = require('@/lib/cre/language/normalization')
const { trackEvent } = require('@/lib/telemetry/trackEvent.server')

describe('POST /api/patient/followup/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    normalizeClinicalLanguageTurn.mockImplementation(
      ({ structuredData }: { structuredData: Record<string, unknown> }) => ({
        structuredData,
        turn: null,
        clarificationPrompt: null,
      }),
    )
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

  it('suppresses clarification prompt for answered followup context', async () => {
    let updatedStructuredData: Record<string, unknown> | null = null

    normalizeClinicalLanguageTurn.mockImplementation(
      ({ structuredData }: { structuredData: Record<string, unknown> }) => ({
        structuredData,
        turn: null,
        clarificationPrompt:
          'Ich moechte Ihre Angabe kurz praezisieren, damit die Anamnese korrekt bleibt.',
      }),
    )

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
                followup: {
                  next_questions: [
                    {
                      id: 'gap:medication',
                      question:
                        'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
                      why: 'Medikationskontext fehlt',
                      priority: 1,
                      source: 'gap_rule',
                    },
                  ],
                  queue: [],
                  asked_question_ids: [],
                  last_generated_at: '2026-02-15T10:00:00.000Z',
                },
                medication: [],
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
        asked_question_id: 'gap:medication',
        asked_question_text:
          'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
        asked_answer_text: 'Ich nehme Omega 3.',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json?.success).toBe(true)
    expect(Array.isArray(json?.data?.next_questions)).toBe(true)
    expect(json?.data?.answer_classification).toBe('answered')
    expect(json?.data?.clarification_suppressed).toBe(true)

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'followup_resolved',
        payload: expect.objectContaining({ answer_classification: 'answered' }),
      }),
    )

    const clarificationInResponse = (json?.data?.next_questions ?? []).some((entry: { id?: string }) =>
      String(entry.id ?? '').startsWith('csn:clarify:'),
    )
    expect(clarificationInResponse).toBe(false)

    const persistedNextQuestions = (
      ((updatedStructuredData ?? undefined) as { followup?: { next_questions?: Array<{ id?: string }> } } | undefined)
        ?.followup?.next_questions ?? []
    )
    const clarificationPersisted = persistedNextQuestions.some((entry) =>
      String(entry.id ?? '').startsWith('csn:clarify:'),
    )
    expect(clarificationPersisted).toBe(false)
  })

  it('adds targeted follow-up question for partial answers', async () => {
    const queryBuilder = {
      _mode: 'select' as 'select' | 'update',
      select: jest.fn(function select() {
        this._mode = 'select'
        return this
      }),
      update: jest.fn(function update() {
        this._mode = 'update'
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
                followup: {
                  next_questions: [
                    {
                      id: 'gap:medication',
                      question:
                        'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
                      why: 'Medikationskontext fehlt',
                      priority: 1,
                      source: 'gap_rule',
                    },
                  ],
                  queue: [],
                  asked_question_ids: [],
                  last_generated_at: '2026-02-15T10:00:00.000Z',
                },
                medication: [],
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
        asked_question_id: 'gap:medication',
        asked_question_text:
          'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
        asked_answer_text: 'Ja',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json?.success).toBe(true)
    expect(json?.data?.answer_classification).toBe('partial')
    expect(json?.data?.clarification_suppressed).toBe(false)

    const hasTargetedPartialQuestion = (json?.data?.next_questions ?? []).some(
      (entry: { id?: string; why?: string }) =>
        String(entry.id ?? '').startsWith('followup:partial:') &&
        String(entry.why ?? '').includes('Teilantwort erkannt'),
    )
    expect(hasTargetedPartialQuestion).toBe(true)
  })

  it('does not add partial medication detail question when answer is nein', async () => {
    const queryBuilder = {
      _mode: 'select' as 'select' | 'update',
      select: jest.fn(function select() {
        this._mode = 'select'
        return this
      }),
      update: jest.fn(function update() {
        this._mode = 'update'
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
                followup: {
                  next_questions: [
                    {
                      id: 'gap:medication',
                      question:
                        'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
                      why: 'Medikationskontext fehlt',
                      priority: 1,
                      source: 'gap_rule',
                    },
                  ],
                  queue: [],
                  asked_question_ids: [],
                  last_generated_at: '2026-02-15T10:00:00.000Z',
                },
                medication: [],
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
        asked_question_id: 'gap:medication',
        asked_question_text:
          'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
        asked_answer_text: 'nein',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json?.success).toBe(true)
    expect(json?.data?.answer_classification).toBe('answered')

    const hasTargetedPartialQuestion = (json?.data?.next_questions ?? []).some(
      (entry: { id?: string }) => String(entry.id ?? '').startsWith('followup:partial:'),
    )
    expect(hasTargetedPartialQuestion).toBe(false)
  })

  it('does not ask medication gap again after concrete medication list answer', async () => {
    const queryBuilder = {
      _mode: 'select' as 'select' | 'update',
      select: jest.fn(function select() {
        this._mode = 'select'
        return this
      }),
      update: jest.fn(function update() {
        this._mode = 'update'
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
                followup: {
                  next_questions: [
                    {
                      id: 'followup:partial:gap:medication',
                      question:
                        'Koennen Sie bitte die konkreten Mittel (Name und falls moeglich Dosierung) kurz angeben?',
                      why: 'Teilantwort erkannt; klinisches Detail fehlt',
                      priority: 1,
                      source: 'gap_rule',
                    },
                  ],
                  queue: [],
                  asked_question_ids: ['gap:medication'],
                  last_generated_at: '2026-02-15T10:00:00.000Z',
                },
                medication: [],
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
        asked_question_id: 'followup:partial:gap:medication',
        asked_question_text:
          'Koennen Sie bitte die konkreten Mittel (Name und falls moeglich Dosierung) kurz angeben?',
        asked_answer_text: 'Omega 3, B12, Magnesium',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json?.success).toBe(true)

    const hasMedicationGapQuestion = (json?.data?.next_questions ?? []).some(
      (entry: { id?: string }) => String(entry.id ?? '') === 'gap:medication',
    )
    expect(hasMedicationGapQuestion).toBe(false)
  })

  it('does not re-ask partial follow-up when user references already provided data', async () => {
    const queryBuilder = {
      _mode: 'select' as 'select' | 'update',
      select: jest.fn(function select() {
        this._mode = 'select'
        return this
      }),
      update: jest.fn(function update() {
        this._mode = 'update'
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
                followup: {
                  next_questions: [
                    {
                      id: 'gap:medication',
                      question:
                        'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
                      why: 'Medikationskontext fehlt',
                      priority: 1,
                      source: 'gap_rule',
                    },
                  ],
                  queue: [],
                  asked_question_ids: [],
                  last_generated_at: '2026-02-15T10:00:00.000Z',
                },
                medication: [],
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
        asked_question_id: 'gap:medication',
        asked_question_text:
          'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
        asked_answer_text: 'Bitte schaue in den Daten nach, ich habe das bereits genannt',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json?.success).toBe(true)
    expect(json?.data?.answer_classification).toBe('answered')

    const hasTargetedPartialQuestion = (json?.data?.next_questions ?? []).some(
      (entry: { id?: string }) => String(entry.id ?? '').startsWith('followup:partial:'),
    )
    expect(hasTargetedPartialQuestion).toBe(false)
  })

  it('keeps clarification for contradiction answers and does not suppress prompt', async () => {
    normalizeClinicalLanguageTurn.mockImplementation(
      ({ structuredData }: { structuredData: Record<string, unknown> }) => ({
        structuredData,
        turn: {
          mapped_entities: [
            { canonical: 'none_reported', entity_type: 'medication' },
            { canonical: 'omega_3', entity_type: 'medication' },
          ],
        },
        clarificationPrompt:
          'Ich moechte Ihre Angabe kurz praezisieren, damit die Anamnese korrekt bleibt.',
      }),
    )

    const queryBuilder = {
      _mode: 'select' as 'select' | 'update',
      select: jest.fn(function select() {
        this._mode = 'select'
        return this
      }),
      update: jest.fn(function update() {
        this._mode = 'update'
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
                followup: {
                  next_questions: [
                    {
                      id: 'gap:medication',
                      question:
                        'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
                      why: 'Medikationskontext fehlt',
                      priority: 1,
                      source: 'gap_rule',
                    },
                  ],
                  queue: [],
                  asked_question_ids: [],
                  last_generated_at: '2026-02-15T10:00:00.000Z',
                },
                medication: [],
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
        asked_question_id: 'gap:medication',
        asked_question_text:
          'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
        asked_answer_text: 'Keine Medikamente, nur Omega 3.',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json?.success).toBe(true)
    expect(json?.data?.answer_classification).toBe('contradiction')
    expect(json?.data?.clarification_suppressed).toBe(false)

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'followup_clarification_needed',
        payload: expect.objectContaining({ answer_classification: 'contradiction' }),
      }),
    )

    const hasClarificationQuestion = (json?.data?.next_questions ?? []).some((entry: { id?: string }) =>
      String(entry.id ?? '').startsWith('csn:clarify:'),
    )
    expect(hasClarificationQuestion).toBe(true)
  })

  it('keeps clarification active for unclear answers', async () => {
    normalizeClinicalLanguageTurn.mockImplementation(
      ({ structuredData }: { structuredData: Record<string, unknown> }) => ({
        structuredData,
        turn: null,
        clarificationPrompt:
          'Ich moechte Ihre Angabe kurz praezisieren, damit die Anamnese korrekt bleibt.',
      }),
    )

    const queryBuilder = {
      _mode: 'select' as 'select' | 'update',
      select: jest.fn(function select() {
        this._mode = 'select'
        return this
      }),
      update: jest.fn(function update() {
        this._mode = 'update'
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
                followup: {
                  next_questions: [
                    {
                      id: 'gap:onset',
                      question: 'Seit wann bestehen die Beschwerden?',
                      why: 'Beginn fehlt',
                      priority: 1,
                      source: 'gap_rule',
                    },
                  ],
                  queue: [],
                  asked_question_ids: [],
                  last_generated_at: '2026-02-15T10:00:00.000Z',
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
        asked_question_id: 'gap:onset',
        asked_question_text: 'Seit wann bestehen die Beschwerden?',
        asked_answer_text: 'weiß nicht',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json?.success).toBe(true)
    expect(json?.data?.answer_classification).toBe('unclear')
    expect(json?.data?.clarification_suppressed).toBe(false)

    const hasClarificationQuestion = (json?.data?.next_questions ?? []).some((entry: { id?: string }) =>
      String(entry.id ?? '').startsWith('csn:clarify:'),
    )
    expect(hasClarificationQuestion).toBe(true)

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'followup_clarification_needed',
        payload: expect.objectContaining({ answer_classification: 'unclear' }),
      }),
    )
  })
})
