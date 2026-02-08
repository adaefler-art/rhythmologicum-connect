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

function isFlagEnabled(value?: string): boolean {
  if (!value) return false
  return /^(1|true|yes|on)$/i.test(value)
}

const shouldSkipE2E =
  !hasValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const shouldSkipDiagnosis =
  !isFlagEnabled(process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED) ||
  !hasValidUrl(process.env.MCP_SERVER_URL)

test.skip(shouldSkipE2E, 'Missing Studio E2E Supabase environment variables.')
test.skip(shouldSkipDiagnosis, 'Diagnosis feature flag or MCP server not configured.')

test('diagnosis pipeline persists results and returns detail', async ({ page }) => {
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
  const patientId = cases[0]?.patient_id ?? cases[0]?.patientId

  expect(patientId, 'Patient ID required for diagnosis E2E').toBeTruthy()

  const queueResponse = await page.request.post('/api/studio/diagnosis/queue', {
    data: { patient_id: patientId },
  })

  expect(queueResponse.status()).toBe(200)
  const queueJson = await queueResponse.json()
  expect(queueJson?.success).toBe(true)

  const runId = queueJson?.data?.run_id || queueJson?.data?.runId
  expect(runId, 'run_id missing from queue response').toBeTruthy()

  const detailEndpoint = `/api/studio/diagnosis/runs/${runId}`
  const initialDetail = await page.request.get(detailEndpoint)
  expect(initialDetail.status()).toBe(200)

  let finalDetail = await initialDetail.json()
  let attempts = 0

  while (attempts < 12) {
    const status = finalDetail?.data?.run?.status
    const result = finalDetail?.data?.result

    if (status === 'completed' && result) {
      break
    }

    if (status === 'failed') {
      throw new Error('Diagnosis run failed before result was persisted')
    }

    await page.waitForTimeout(5000)
    const next = await page.request.get(detailEndpoint)
    expect(next.status()).toBe(200)
    finalDetail = await next.json()
    attempts += 1
  }

  const finalStatus = finalDetail?.data?.run?.status
  const finalResult = finalDetail?.data?.result

  expect(finalStatus).toBe('completed')
  expect(finalResult?.primary_findings).toBeTruthy()
  expect(finalResult?.risk_level).toBeTruthy()
})
