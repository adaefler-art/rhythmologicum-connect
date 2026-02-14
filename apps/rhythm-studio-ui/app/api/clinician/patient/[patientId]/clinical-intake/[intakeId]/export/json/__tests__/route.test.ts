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

const { createServerSupabaseClient } = require('@/lib/db/supabase.server')
const { createAdminSupabaseClient } = require('@/lib/db/supabase.admin')
const { resolvePatientIds } = require('@/lib/patients/resolvePatientIds')

type AssignmentQueryChain = {
  select: jest.Mock<AssignmentQueryChain, []>
  eq: jest.Mock<AssignmentQueryChain, [string, string]>
  maybeSingle: jest.Mock<Promise<{ data: { id: string } | null; error: null }>, []>
}

type IntakeQueryChain = {
  select: jest.Mock<IntakeQueryChain, []>
  eq: jest.Mock<IntakeQueryChain, [string, string]>
  maybeSingle: jest.Mock<Promise<{ data: Record<string, unknown> | null; error: null }>, []>
}

type ReviewQueryChain = {
  select: jest.Mock<ReviewQueryChain, []>
  eq: jest.Mock<ReviewQueryChain, [string, string]>
  order: jest.Mock<ReviewQueryChain, [string, { ascending: boolean }]>
  limit: jest.Mock<Promise<{ data: Record<string, unknown>[]; error: null }>, [number]>
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

const createAdminQueryClient = () => {
  const intakeData = {
    id: 'i1',
    user_id: 'patient-user-1',
    patient_id: 'profile-1',
    version_number: 2,
    clinical_summary: 'Summary text',
    structured_data: {
      chief_complaint: 'Palpitationen',
      history_of_present_illness: { onset: 'seit 3 Tagen', duration: 'stundenweise', course: 'zunehmend' },
      past_medical_history: ['Hypertonie'],
      medication: ['Metoprolol'],
      psychosocial_factors: ['Beruflicher Stress'],
      relevant_negatives: ['kein Thoraxschmerz'],
      evidence_refs: ['msg-1'],
      safety: {
        effective_policy_result: {
          escalation_level: 'B',
          chat_action: 'warn',
          patient_banner_text: 'Hinweis',
        },
        triggered_rules: [
          {
            rule_id: 'R-1',
            title: 'Rule 1',
            level: 'B',
            short_reason: 'reason',
            evidence: [
              { source: 'chat', source_id: 'msg-1', excerpt: 'Auszug' },
            ],
          },
        ],
      },
    },
    policy_override: {
      override_level: 'C',
      override_action: 'warn',
      reason: 'Manual downgrade',
      created_by: 'clinician-1',
      created_at: '2026-02-14T10:00:00.000Z',
    },
    trigger_reason: 'clarification',
    last_updated_from_messages: ['msg-1'],
    created_at: '2026-02-14T09:00:00.000Z',
    updated_at: '2026-02-14T11:00:00.000Z',
  }

  const reviewData = [
    {
      id: 'r1',
      intake_id: 'i1',
      status: 'needs_more_info',
      review_notes: 'Bitte Details',
      requested_items: ['Medikation'],
      reviewed_by: 'clinician-1',
      is_current: true,
      created_at: '2026-02-14T11:10:00.000Z',
      updated_at: '2026-02-14T11:10:00.000Z',
    },
  ]

  const intakeChain = {} as IntakeQueryChain
  intakeChain.select = jest.fn(() => intakeChain)
  intakeChain.eq = jest.fn(() => intakeChain)
  intakeChain.maybeSingle = jest.fn(async () => ({ data: intakeData, error: null }))

  const reviewChain = {} as ReviewQueryChain
  reviewChain.select = jest.fn(() => reviewChain)
  reviewChain.eq = jest.fn(() => reviewChain)
  reviewChain.order = jest.fn(() => reviewChain)
  reviewChain.limit = jest.fn(async () => ({ data: reviewData, error: null }))

  return {
    from: jest.fn((table: string) => {
      if (table === 'clinical_intakes') return intakeChain
      if (table === 'clinical_intake_reviews') return reviewChain
      return intakeChain
    }),
  }
}

describe('GET /api/clinician/patient/[patientId]/clinical-intake/[intakeId]/export/json', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resolvePatientIds.mockResolvedValue({
      patientProfileId: 'profile-1',
      patientUserId: 'patient-user-1',
    })
  })

  it('returns 401 when unauthenticated', async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: jest.fn(async () => ({ data: { user: null }, error: null })) },
    })
    createAdminSupabaseClient.mockReturnValue(createAdminQueryClient())

    const response = await GET(new Request('http://localhost/api'), {
      params: Promise.resolve({ patientId: 'p1', intakeId: 'i1' }),
    })

    expect(response.status).toBe(401)
  })

  it('returns stable JSON schema for clinician export', async () => {
    createServerSupabaseClient.mockResolvedValue(
      createAssignmentCapableSupabase({
        id: 'clinician-1',
        app_metadata: { role: 'clinician' },
        user_metadata: {},
      }),
    )

    createAdminSupabaseClient.mockReturnValue(createAdminQueryClient())

    const response = await GET(new Request('http://localhost/api'), {
      params: Promise.resolve({ patientId: 'p1', intakeId: 'i1' }),
    })

    expect(response.status).toBe(200)
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.data).toMatchInlineSnapshot(
      {
        metadata: {
          generated_at: expect.any(String),
          patient_ref: expect.stringMatching(/^PT-/),
        },
      },
      `
{
  "attachments": {
    "evidence_refs": [
      "msg-1",
    ],
    "message_refs": [
      "msg-1",
    ],
  },
  "audit": {
    "intake_created_at": "2026-02-14T09:00:00.000Z",
    "intake_updated_at": "2026-02-14T11:00:00.000Z",
    "reviewer_identities": [
      "clinician-1",
    ],
  },
  "clinical_summary": "Summary text",
  "metadata": {
    "created_at": "2026-02-14T09:00:00.000Z",
    "generated_at": Any<String>,
    "intake_id": "i1",
    "intake_version": 2,
    "patient_ref": StringMatching /\\^PT-/,
    "trigger_reason": "clarification",
    "updated_at": "2026-02-14T11:00:00.000Z",
  },
  "review": {
    "audit": [
      {
        "created_at": "2026-02-14T11:10:00.000Z",
        "requested_items": [
          "Medikation",
        ],
        "review_notes": "Bitte Details",
        "reviewed_by": "clinician-1",
        "status": "needs_more_info",
        "updated_at": "2026-02-14T11:10:00.000Z",
      },
    ],
    "current": {
      "created_at": "2026-02-14T11:10:00.000Z",
      "requested_items": [
        "Medikation",
      ],
      "review_notes": "Bitte Details",
      "reviewed_by": "clinician-1",
      "status": "needs_more_info",
      "updated_at": "2026-02-14T11:10:00.000Z",
    },
  },
  "safety": {
    "effective_policy_result": {
      "chat_action": "warn",
      "escalation_level": "B",
      "patient_banner_text": "Hinweis",
    },
    "policy_override": {
      "created_at": "2026-02-14T10:00:00.000Z",
      "created_by": "clinician-1",
      "override_action": "warn",
      "override_level": "C",
      "reason": "Manual downgrade",
    },
    "policy_override_audit": [
      {
        "created_at": "2026-02-14T10:00:00.000Z",
        "created_by": "clinician-1",
        "override_action": "warn",
        "override_level": "C",
        "reason": "Manual downgrade",
      },
    ],
    "triggered_rules": [
      {
        "excerpts": [
          {
            "excerpt": "Auszug",
            "source": "chat",
            "source_id": "msg-1",
          },
        ],
        "level": "B",
        "rule_id": "R-1",
        "short_reason": "reason",
        "title": "Rule 1",
      },
    ],
  },
  "structured_highlights": {
    "chief_complaint": "Palpitationen",
    "history": [
      "Hypertonie",
    ],
    "medication": [
      "Metoprolol",
    ],
    "psychosocial_factors": [
      "Beruflicher Stress",
    ],
    "relevant_negatives": [
      "kein Thoraxschmerz",
    ],
    "timeline": [
      "seit 3 Tagen",
      "stundenweise",
      "zunehmend",
    ],
  },
}
`,
    )
  })
})
