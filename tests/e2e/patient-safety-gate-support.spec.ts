import { expect, test, type Page } from '@playwright/test'

type BackendMode = 'mock' | 'live'

const backendModeRaw = process.env.E2E_BACKEND_MODE

if (backendModeRaw !== 'mock' && backendModeRaw !== 'live') {
  throw new Error(
    'E2E_BACKEND_MODE must be explicitly set to "mock" or "live" (no implicit default).',
  )
}

const backendMode: BackendMode = backendModeRaw

const setupFunnelSafetyGateMocks = async (
  page: Page,
  params: {
    slug: string
    safetyRoute: 'NOTRUF' | 'NOTAUFNAHME' | 'DRINGENDER_TERMIN' | 'STANDARD_INTAKE'
    safetyMessage: string
    blocked?: boolean
    withSecondStep?: boolean
    onValidateRequest?: (routeFromBody: string | null) => void
  },
) => {
  const {
    slug,
    safetyRoute,
    safetyMessage,
    blocked = true,
    withSecondStep = false,
    onValidateRequest,
  } = params

  await page.route('**/api/funnels/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const pathname = url.pathname
    const method = request.method().toUpperCase()

    if (method === 'GET' && pathname === `/api/funnels/${slug}/definition`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Mock Stress Assessment',
          description: 'Mock description',
          steps: [
            {
              id: 'step-1',
              title: 'Erster Schritt',
              description: 'Bitte prüfen Sie die Sicherheitsweiterleitung.',
              questions: [
                {
                  id: 'q-1',
                  key: 'q1',
                  questionType: 'text',
                  label: 'Wie geht es Ihnen aktuell?',
                  isRequired: false,
                },
              ],
            },
            ...(withSecondStep
              ? [
                  {
                    id: 'step-2',
                    title: 'Zweiter Schritt',
                    description: 'Non-blocking Weiterleitung bleibt im Intake.',
                    questions: [
                      {
                        id: 'q-2',
                        key: 'q2',
                        questionType: 'text',
                        label: 'Zweite Frage',
                        isRequired: false,
                      },
                    ],
                  },
                ]
              : []),
          ],
        }),
      })
    }

    if (method === 'POST' && pathname === `/api/funnels/${slug}/assessments`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            assessmentId: 'assessment-1',
            status: 'in_progress',
            currentStep: {
              stepId: 'step-1',
              stepIndex: 0,
            },
          },
        }),
      })
    }

    if (
      method === 'POST' &&
      pathname === `/api/funnels/${slug}/assessments/assessment-1/steps/step-1`
    ) {
      const raw = request.postData()
      const parsed = raw ? (JSON.parse(raw) as { triageSafetyRoute?: string }) : {}
      onValidateRequest?.(parsed.triageSafetyRoute ?? null)

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            isValid: true,
            missingQuestions: [],
            nextStep: withSecondStep
              ? {
                  stepId: 'step-2',
                  title: 'Zweiter Schritt',
                  stepIndex: 1,
                }
              : null,
            safetyGate: {
              route: safetyRoute,
              blocked,
              nextAction: blocked ? 'SHOW_ESCALATION' : 'CONTINUE_INTAKE',
              message: safetyMessage,
            },
          },
        }),
      })
    }

    if (
      method === 'POST' &&
      pathname === `/api/funnels/${slug}/assessments/assessment-1/answers/save`
    ) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    }

    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'Unexpected mocked endpoint' }),
    })
  })
}

test.describe('patient safety gate support routing @patient-safety-gate-support', () => {
  test('redirects to support page with route and message after blocked safety gate (NOTRUF)', async ({ page }) => {
    test.skip(backendMode !== 'mock', 'Test only runs in mock backend mode.')

    const slug = 'stress-assessment'
    const safetyMessage = 'Mock-Notruf-Hinweis: bitte sofort 112 kontaktieren.'
    let capturedRouteFromValidateBody: string | null = null

    await setupFunnelSafetyGateMocks(page, {
      slug,
      safetyRoute: 'NOTRUF',
      safetyMessage,
      onValidateRequest: (routeValue) => {
        capturedRouteFromValidateBody = routeValue
      },
    })

    await page.goto(`/patient/assess/${slug}/flow-v3?triageSafetyRoute=NOTRUF`)

    await expect(page.getByRole('heading', { name: 'Mock Stress Assessment' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Weiter' })).toBeVisible()

    await page.getByRole('button', { name: 'Weiter' }).click()

    await expect(page).toHaveURL(/\/patient\/support\?/) 
    await expect(page).toHaveURL(/source=uc1_safety_gate/)
    await expect(page).toHaveURL(/route=NOTRUF/)
    await expect(page).toHaveURL(/message=/)

    await expect(page.getByRole('heading', { name: 'Unterstützung' })).toBeVisible()
    await expect(
      page.getByText('Akute Gefahr: Bitte sofort Notruf 112 kontaktieren'),
    ).toBeVisible()
    await expect(page.getByText(safetyMessage)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Notruf 112 anrufen' })).toHaveAttribute(
      'href',
      'tel:112',
    )

    expect(capturedRouteFromValidateBody).toBe('NOTRUF')
  })

  test('redirects to support page and shows emergency-room copy for NOTAUFNAHME', async ({ page }) => {
    test.skip(backendMode !== 'mock', 'Test only runs in mock backend mode.')

    const slug = 'stress-assessment'
    const safetyMessage = 'Mock-Notaufnahme-Hinweis: bitte jetzt in eine Notaufnahme gehen.'
    let capturedRouteFromValidateBody: string | null = null

    await setupFunnelSafetyGateMocks(page, {
      slug,
      safetyRoute: 'NOTAUFNAHME',
      safetyMessage,
      onValidateRequest: (routeValue) => {
        capturedRouteFromValidateBody = routeValue
      },
    })

    await page.goto(`/patient/assess/${slug}/flow-v3?triageSafetyRoute=NOTAUFNAHME`)

    await expect(page.getByRole('heading', { name: 'Mock Stress Assessment' })).toBeVisible()
    await page.getByRole('button', { name: 'Weiter' }).click()

    await expect(page).toHaveURL(/\/patient\/support\?/) 
    await expect(page).toHaveURL(/source=uc1_safety_gate/)
    await expect(page).toHaveURL(/route=NOTAUFNAHME/)
    await expect(page).toHaveURL(/message=/)

    await expect(page.getByRole('heading', { name: 'Unterstützung' })).toBeVisible()
    await expect(page.getByText('Bitte jetzt in eine Notaufnahme gehen')).toBeVisible()
    await expect(page.getByText(safetyMessage)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zur Übersicht' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zurück zum Dialog' })).toBeVisible()

    expect(capturedRouteFromValidateBody).toBe('NOTAUFNAHME')
  })

  test('keeps intake flow for DRINGENDER_TERMIN (non-blocking) and advances to next step', async ({ page }) => {
    test.skip(backendMode !== 'mock', 'Test only runs in mock backend mode.')

    const slug = 'stress-assessment'
    let capturedRouteFromValidateBody: string | null = null

    await setupFunnelSafetyGateMocks(page, {
      slug,
      safetyRoute: 'DRINGENDER_TERMIN',
      safetyMessage: 'Bitte zeitnah ärztlichen Termin planen.',
      blocked: false,
      withSecondStep: true,
      onValidateRequest: (routeValue) => {
        capturedRouteFromValidateBody = routeValue
      },
    })

    await page.goto(`/patient/assess/${slug}/flow-v3?triageSafetyRoute=DRINGENDER_TERMIN`)
    await expect(page.getByRole('heading', { name: 'Mock Stress Assessment' })).toBeVisible()

    await page.getByRole('button', { name: 'Weiter' }).click()

    await expect(page).toHaveURL(new RegExp(`/patient/assess/${slug}/flow-v3`))
    await expect(page).not.toHaveURL(/\/patient\/support\?/)
    await expect(page.getByText('Schritt 2 von 2')).toBeVisible()
    await expect(page.getByText('Zweiter Schritt')).toBeVisible()

    expect(capturedRouteFromValidateBody).toBe('DRINGENDER_TERMIN')
  })

  test('keeps intake flow for STANDARD_INTAKE (non-blocking) and advances to next step', async ({ page }) => {
    test.skip(backendMode !== 'mock', 'Test only runs in mock backend mode.')

    const slug = 'stress-assessment'
    let capturedRouteFromValidateBody: string | null = null

    await setupFunnelSafetyGateMocks(page, {
      slug,
      safetyRoute: 'STANDARD_INTAKE',
      safetyMessage: 'Standard-Intake kann fortgesetzt werden.',
      blocked: false,
      withSecondStep: true,
      onValidateRequest: (routeValue) => {
        capturedRouteFromValidateBody = routeValue
      },
    })

    await page.goto(`/patient/assess/${slug}/flow-v3?triageSafetyRoute=STANDARD_INTAKE`)
    await expect(page.getByRole('heading', { name: 'Mock Stress Assessment' })).toBeVisible()

    await page.getByRole('button', { name: 'Weiter' }).click()

    await expect(page).toHaveURL(new RegExp(`/patient/assess/${slug}/flow-v3`))
    await expect(page).not.toHaveURL(/\/patient\/support\?/)
    await expect(page.getByText('Schritt 2 von 2')).toBeVisible()
    await expect(page.getByText('Zweiter Schritt')).toBeVisible()

    expect(capturedRouteFromValidateBody).toBe('STANDARD_INTAKE')
  })
})