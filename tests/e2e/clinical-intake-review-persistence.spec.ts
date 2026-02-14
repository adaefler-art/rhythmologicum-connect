import { test, expect } from '@playwright/test'

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

const shouldSkipE2E =
  !hasValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  !process.env.STUDIO_E2E_EMAIL ||
  !process.env.STUDIO_E2E_PASSWORD

test.skip(shouldSkipE2E, 'Missing Studio E2E Supabase environment variables.')

test('clinical intake review state persists after reload', async ({ page }) => {
  const email = getRequiredEnv('STUDIO_E2E_EMAIL')
  const password = getRequiredEnv('STUDIO_E2E_PASSWORD')

  await page.goto('/')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Einloggen' }).last().click()
  await page.waitForURL(/\/clinician/, { timeout: 15_000 })

  let patientId = process.env.STUDIO_E2E_PATIENT_ID || null

  if (!patientId) {
    const triageResponse = await page.request.get('/api/clinician/triage')
    expect(triageResponse.status()).toBe(200)

    const triageJson = await triageResponse.json()
    const cases = triageJson?.data?.cases ?? []
    patientId = cases[0]?.patient_id ?? cases[0]?.patientId ?? null
  }

  if (!patientId) {
    test.skip(true, 'No patient available for review persistence check.')
    return
  }

  const resolvedPatientId = patientId

  const latestIntakeResponse = await page.request.get(
    `/api/clinician/patient/${resolvedPatientId}/clinical-intake/latest`,
  )

  if (latestIntakeResponse.status() !== 200) {
    test.skip(true, 'Could not load clinical intake latest for selected patient.')
    return
  }

  const latestIntakeJson = await latestIntakeResponse.json()
  const intake = latestIntakeJson?.intake ?? latestIntakeJson?.data?.intake ?? null
  const intakeId = intake?.id ?? intake?.uuid ?? null

  if (!intakeId) {
    test.skip(true, 'No intake available for selected patient.')
    return
  }

  const resolvedIntakeId = intakeId

  const postResponse = await page.request.post(
    `/api/clinician/patient/${resolvedPatientId}/clinical-intake/${resolvedIntakeId}/review`,
    {
      data: {
        status: 'in_review',
      },
    },
  )

  expect(postResponse.status()).toBe(200)
  const postJson = await postResponse.json()
  expect(postJson?.success).toBe(true)
  expect(postJson?.review_state?.status).toBe('in_review')

  await page.reload()

  const latestReviewResponse = await page.request.get(
    `/api/clinician/patient/${resolvedPatientId}/clinical-intake/review/latest?intakeId=${resolvedIntakeId}`,
  )

  expect(latestReviewResponse.status()).toBe(200)
  const latestReviewJson = await latestReviewResponse.json()
  expect(latestReviewJson?.success).toBe(true)
  expect(latestReviewJson?.review_state?.status).toBe('in_review')
})
