import { expect, test } from '@playwright/test'

type BackendMode = 'mock' | 'live'

const backendModeRaw = process.env.E2E_BACKEND_MODE

if (backendModeRaw !== 'mock' && backendModeRaw !== 'live') {
  throw new Error(
    'E2E_BACKEND_MODE must be explicitly set to "mock" or "live" (no implicit default).',
  )
}

const backendMode: BackendMode = backendModeRaw

test.describe('patient start intake CTA @patient-start-intake', () => {
  test('renders first-intake CTA box on start page', async ({ page }) => {
    test.skip(backendMode !== 'mock', 'Test only runs in mock backend mode.')

    await page.route('**/api/patient/intake/latest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          intake: {
            version_number: 1,
            updated_at: '2026-02-16T12:00:00.000Z',
            structured_data: {
              followup: { next_questions: [] },
              safety: { effective_policy_result: { escalation_level: null } },
            },
            review_state: null,
          },
        }),
      })
    })

    await page.route('**/api/patient/review/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          review: null,
        }),
      })
    })

    await page.goto('/patient/start')

    await expect(page.getByText('Erstaufnahme: Soziologische Anamnese').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Erstaufnahme starten' }).first()).toBeVisible()
  })
})
