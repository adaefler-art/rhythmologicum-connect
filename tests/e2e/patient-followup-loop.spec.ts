import { expect, test, type Page } from '@playwright/test'

type BackendMode = 'mock' | 'live'

const backendModeRaw = process.env.E2E_BACKEND_MODE

if (backendModeRaw !== 'mock' && backendModeRaw !== 'live') {
  throw new Error(
    'E2E_BACKEND_MODE must be explicitly set to "mock" or "live" (no implicit default).',
  )
}

const backendMode: BackendMode = backendModeRaw

function hasValidUrl(value?: string): boolean {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

const requireLiveEnv = () => {
  const missing: string[] = []

  if (!hasValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL (valid URL required)')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (!process.env.PATIENT_E2E_EMAIL) {
    missing.push('PATIENT_E2E_EMAIL')
  }

  if (!process.env.PATIENT_E2E_PASSWORD) {
    missing.push('PATIENT_E2E_PASSWORD')
  }

  if (missing.length > 0) {
    throw new Error(
      `Live E2E backend mode selected, but required env vars are missing: ${missing.join(', ')}`,
    )
  }
}

const seedFollowupQuestions = [
  {
    id: 'reasoning:panic:when',
    question: 'Wann treten die Beschwerden typischerweise auf?',
    why: 'Zeitliche Einordnung der Episoden',
    priority: 1 as const,
    source: 'reasoning' as const,
  },
]

const createMockState = (params?: { blocked?: boolean }) => {
  const blocked = Boolean(params?.blocked)

  return {
    patientId: '11111111-1111-1111-1111-111111111111',
    intakeId: '22222222-2222-2222-2222-222222222222',
    askedQuestionIds: [] as string[],
    versionNumber: 1,
    followupGenerateCalls: 0,
    intakeGenerateCalls: 0,
    chatLogOnlyCalls: 0,
    blocked,
  }
}

const buildMockIntakePayload = (state: ReturnType<typeof createMockState>) => {
  const pending = state.blocked
    ? []
    : seedFollowupQuestions.filter((entry) => !state.askedQuestionIds.includes(entry.id)).slice(0, 3)

  return {
    id: state.intakeId,
    uuid: state.intakeId,
    status: 'draft',
    version_number: state.versionNumber,
    clinical_summary: 'Mock intake summary',
    structured_data: {
      status: 'draft',
      chief_complaint: 'Herzrasen',
      followup: {
        next_questions: pending,
        asked_question_ids: [...state.askedQuestionIds],
        last_generated_at: '2026-02-13T12:00:00.000Z',
      },
      safety: state.blocked
        ? {
            red_flag_present: true,
            escalation_level: 'A',
            red_flags: [],
            policy_result: {
              policy_version: 'v1',
              escalation_level: 'A',
              chat_action: 'hard_stop',
              studio_badge: 'A',
              patient_banner_text: 'Bitte suchen Sie umgehend direkte medizinische Hilfe.',
            },
            effective_policy_result: {
              policy_version: 'v1',
              escalation_level: 'A',
              chat_action: 'hard_stop',
              studio_badge: 'A',
              patient_banner_text: 'Bitte suchen Sie umgehend direkte medizinische Hilfe.',
            },
            effective_level: 'A',
            effective_action: 'hard_stop',
          }
        : {
            red_flag_present: false,
            escalation_level: null,
            red_flags: [],
            policy_result: {
              policy_version: 'v1',
              escalation_level: null,
              chat_action: 'none',
              studio_badge: 'OK',
              patient_banner_text: '',
            },
            effective_policy_result: {
              policy_version: 'v1',
              escalation_level: null,
              chat_action: 'none',
              studio_badge: 'OK',
              patient_banner_text: '',
            },
            effective_level: null,
            effective_action: 'none',
          },
    },
    created_at: '2026-02-13T12:00:00.000Z',
    updated_at: '2026-02-13T12:00:00.000Z',
  }
}

const setupMockBackend = async (page: Page, state: ReturnType<typeof createMockState>) => {
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method().toUpperCase()
    const pathname = url.pathname

    if (method === 'GET' && pathname === '/api/patient/intake/latest') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          intake: buildMockIntakePayload(state),
        }),
      })
    }

    const parseBody = () => {
      const raw = request.postData()
      if (!raw) return {} as Record<string, unknown>
      try {
        return JSON.parse(raw) as Record<string, unknown>
      } catch {
        return {} as Record<string, unknown>
      }
    }

    if (method === 'POST' && pathname === '/api/patient/followup/generate') {
      state.followupGenerateCalls += 1
      const body = parseBody()
      const askedId = typeof body?.asked_question_id === 'string' ? body.asked_question_id : null

      if (askedId && !state.askedQuestionIds.includes(askedId)) {
        state.askedQuestionIds.push(askedId)
      }

      const pending = state.blocked
        ? []
        : seedFollowupQuestions
            .filter((entry) => !state.askedQuestionIds.includes(entry.id))
            .slice(0, 3)

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            intake_id: state.intakeId,
            blocked: state.blocked,
            followup: {
              next_questions: pending,
              asked_question_ids: [...state.askedQuestionIds],
              last_generated_at: '2026-02-13T12:00:00.000Z',
            },
            next_questions: pending,
          },
        }),
      })
    }

    if (method === 'POST' && (pathname === '/api/amy/chat' || pathname === '/api/chat')) {
      const body = parseBody()
      if (body?.mode === 'log_only') {
        state.chatLogOnlyCalls += 1
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { reply: '', messageId: 'msg-log-only', logged: true },
          }),
        })
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { reply: 'Danke, ich habe das notiert.', messageId: 'msg-assistant' },
        }),
      })
    }

    if (method === 'POST' && pathname.startsWith('/api/clinical-intake/generate')) {
      state.intakeGenerateCalls += 1
      state.versionNumber += 1

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            intake: buildMockIntakePayload(state),
            isNew: false,
          },
        }),
      })
    }

    return route.continue()
  })
}

const bootstrapDialogIntake = async (page: Page) => {
  const manualTrigger = page.getByRole('button', { name: 'Generate Intake (Dev)' })
  if ((await manualTrigger.count()) > 0) {
    await manualTrigger.first().click()
  }
}

test.describe('patient followup loop @patient-followup', () => {
  test('runs deterministic followup loop in mock mode', async ({ page }) => {
    test.skip(backendMode !== 'mock', 'Test only runs in mock backend mode.')

    const state = createMockState({ blocked: false })
    await setupMockBackend(page, state)

    const observedClinicalGenerateCalls: string[] = []
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (
        request.method().toUpperCase() === 'POST' &&
        url.pathname.startsWith('/api/clinical-intake/generate')
      ) {
        observedClinicalGenerateCalls.push(request.url())
      }
    })

    await page.goto('/patient/dialog')
    await bootstrapDialogIntake(page)
    await expect(page.getByText(seedFollowupQuestions[0].question).first()).toBeVisible()

    await page
      .getByPlaceholder(/Ihre Nachricht an/i)
      .first()
      .fill('Die Beschwerden treten vor allem abends auf.')
    await page.getByRole('button', { name: 'Senden' }).first().click()

    await expect
      .poll(() => state.askedQuestionIds.length, { timeout: 10_000 })
      .toBeGreaterThan(0)
    await expect
      .poll(() => state.intakeGenerateCalls, { timeout: 10_000 })
      .toBeGreaterThan(0)
    await expect
      .poll(() => observedClinicalGenerateCalls.length, { timeout: 10_000 })
      .toBeGreaterThan(0)

    expect(state.askedQuestionIds).toContain(seedFollowupQuestions[0].id)
    expect(state.followupGenerateCalls).toBeGreaterThan(0)
    expect(state.chatLogOnlyCalls).toBeGreaterThan(0)

    const followupJson = await page.evaluate(async (intakeId) => {
      const response = await fetch('/api/patient/followup/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      })
      const json = await response.json()
      return { status: response.status, json }
    }, state.intakeId)

    expect(followupJson.status).toBe(200)
    expect(Array.isArray(followupJson.json?.data?.next_questions)).toBe(true)
    expect((followupJson.json?.data?.next_questions ?? []).length).toBeLessThanOrEqual(3)
  })

  test('shows blocked UI state when effective policy is A/hard_stop', async ({ page }) => {
    test.skip(backendMode !== 'mock', 'Test only runs in mock backend mode.')

    const state = createMockState({ blocked: true })
    await setupMockBackend(page, state)

    await page.goto('/patient/dialog')
    await bootstrapDialogIntake(page)
    await expect(page.getByText(/Sicherheits-Hinweis \(Level A\)/).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Senden' }).first()).toBeDisabled()

    const followupJson = await page.evaluate(async (intakeId) => {
      const response = await fetch('/api/patient/followup/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      })
      const json = await response.json()
      return { status: response.status, json }
    }, state.intakeId)

    expect(followupJson.status).toBe(200)
    expect(followupJson.json?.data?.blocked).toBe(true)
    expect((followupJson.json?.data?.next_questions ?? []).length).toBe(0)
  })

  test('remains deterministic across back/forward and reload', async ({ page }) => {
    test.skip(backendMode !== 'mock', 'Test only runs in mock backend mode.')

    const state = createMockState({ blocked: false })
    await setupMockBackend(page, state)

    await page.goto('/patient/start')
    await page.goto('/patient/dialog')
    await bootstrapDialogIntake(page)

    const followupQuestion = page.getByText(seedFollowupQuestions[0].question).first()
    await expect(followupQuestion).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(/\/patient\/start/)

    await page.goForward()
    await expect(page).toHaveURL(/\/patient\/dialog/)
    await expect(followupQuestion).toBeVisible()

    await page.reload()
    await expect(followupQuestion).toBeVisible()

    await page
      .getByPlaceholder(/Ihre Nachricht an/i)
      .first()
      .fill('Vor allem abends und unter Belastung.')
    await page.getByRole('button', { name: 'Senden' }).first().click()

    await expect
      .poll(() => state.askedQuestionIds.includes(seedFollowupQuestions[0].id), { timeout: 10_000 })
      .toBe(true)

    await page.reload()
    await expect
      .poll(async () => page.getByText(seedFollowupQuestions[0].question).count(), { timeout: 10_000 })
      .toBe(0)
  })

  test('runs live seeded flow when backend mode is live', async ({ page }) => {
    test.skip(backendMode !== 'live', 'Test only runs in live backend mode.')
    requireLiveEnv()

    const email = getRequiredEnv('PATIENT_E2E_EMAIL')
    const password = getRequiredEnv('PATIENT_E2E_PASSWORD')

    await page.goto('/')
    await page.getByLabel('E-Mail').fill(email)
    await page.getByLabel('Passwort').fill(password)
    await page.getByRole('button', { name: 'Einloggen' }).last().click()
    await page.waitForURL(/\/patient/, { timeout: 20_000 })

    const latestBeforeResponse = await page.request.get('/api/clinical-intake/latest')
    expect(latestBeforeResponse.status()).toBe(200)
    const latestBeforeJson = await latestBeforeResponse.json()
    expect(latestBeforeJson?.success).toBe(true)
  })
})
