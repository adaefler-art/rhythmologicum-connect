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
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'

test.skip(shouldSkipE2E, 'Missing Studio E2E Supabase environment variables.')

test('clinician canonical endpoints are reachable', async ({ page }) => {
  const email = getRequiredEnv('STUDIO_E2E_EMAIL')
  const password = getRequiredEnv('STUDIO_E2E_PASSWORD')

  await page.goto('/')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Einloggen' }).last().click()

  await page.waitForURL(/\/clinician/, { timeout: 15_000 })

  const triageResponse = await page.request.get('/api/clinician/triage')
  expect(triageResponse.status()).toBe(200)

  const triageJson = await triageResponse.json()
  const cases = triageJson?.data?.cases ?? []
  const firstCase = cases[0] ?? {}
  const patientId = firstCase.patient_id ?? firstCase.patientId ?? EMPTY_UUID
  const assessmentId =
    firstCase.case_id ?? firstCase.assessment_id ?? firstCase.assessmentId ?? EMPTY_UUID

  const endpoints = [
    `/api/clinician/patient/${patientId}/results`,
    `/api/clinician/patient/${patientId}/anamnesis`,
    `/api/clinician/patient/${patientId}/diagnosis/runs`,
    `/api/clinician/patient/${patientId}/amy-insights`,
    `/api/clinician/assessments/${assessmentId}/details`,
  ]

  for (const endpoint of endpoints) {
    const response = await page.request.get(endpoint)
    expect([200, 204]).toContain(response.status())
  }
})
