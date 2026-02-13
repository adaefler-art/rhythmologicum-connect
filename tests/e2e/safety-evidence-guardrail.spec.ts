import { test, expect } from '@playwright/test'
import { ALLOWED_INTAKE_EVIDENCE_FIELDS } from '../../lib/cre/safety/intakeEvidence'

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

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const UUID_WALL_REGEX =
  /(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[\s,]+(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})){3,}/i
const LONG_HEX_REGEX = /[0-9a-f]{64,}/i

const isUuid = (value: string): boolean => UUID_REGEX.test(value)

const hasUuidWall = (value: string): boolean =>
  UUID_WALL_REGEX.test(value) || LONG_HEX_REGEX.test(value)

test.skip(shouldSkipE2E, 'Missing Studio E2E Supabase environment variables.')

test('Triggered Rules are readable and evidence is resolvable', async ({ page }) => {
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

  let patientId = process.env.STUDIO_E2E_PATIENT_ID_TRIGGERED_RULES
  if (!patientId) {
    patientId = cases[0]?.patient_id ?? cases[0]?.patientId
  }

  expect(patientId, 'Patient ID required for triggered rules E2E').toBeTruthy()

  const intakeResponsePromise = page.waitForResponse((response) =>
    response.url().includes(`/api/clinician/patient/${patientId}/clinical-intake/latest`),
  )

  await page.goto(`/clinician/patient/${patientId}`)

  const intakeResponse = await intakeResponsePromise
  expect(intakeResponse.status()).toBe(200)
  const intakeJson = await intakeResponse.json()
  const intake = intakeJson?.intake ?? intakeJson?.data?.intake
  const safety = intake?.structured_data?.safety
  const triggeredRules = safety?.triggered_rules ?? []

  if (!Array.isArray(triggeredRules) || triggeredRules.length === 0) {
    test.skip(true, 'No triggered rules available for UI guardrail check')
  }

  const triggeredSection = page.locator('div').filter({ hasText: 'Triggered Rules' }).first()
  await expect(triggeredSection).toBeVisible()

  const ruleCards = triggeredSection.locator('div').filter({ hasText: 'Level ' })
  expect(await ruleCards.count()).toBeGreaterThan(0)

  const pageText = (await page.textContent('body')) ?? ''
  expect(pageText).not.toContain('Evidence reference not resolvable')
  expect(hasUuidWall(pageText)).toBe(false)

  const evidenceRefsText = await page
    .locator('text=Evidence refs:')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent || '').join(' '))

  expect(evidenceRefsText).not.toContain('intake:')

  const cardCount = await ruleCards.count()
  for (let index = 0; index < cardCount; index += 1) {
    const card = ruleCards.nth(index)
    const text = (await card.innerText()).split('\n').map((line) => line.trim()).filter(Boolean)
    const titleLine = text[0] ?? ''
    const hasExcerpt = text.some((line) => line.startsWith('chat:') || line.startsWith('intake:'))
    const hasReason = text.some(
      (line) =>
        line !== titleLine &&
        line !== 'Show details' &&
        !line.startsWith('Evidence refs') &&
        !line.includes('· Level'),
    )

    expect(hasExcerpt || hasReason).toBe(true)
  }

  triggeredRules.forEach((rule: any) => {
    const evidenceItems = Array.isArray(rule.evidence) ? rule.evidence : []
    evidenceItems.forEach((item: any) => {
      expect(isUuid(item.source_id)).toBe(true)
      if (item.source === 'intake') {
        expect(item.source_id).toBe(intake?.id)
        if (item.field_path) {
          expect(ALLOWED_INTAKE_EVIDENCE_FIELDS).toContain(item.field_path)
        }
      }
    })
  })
})

test('Hard-stop is only allowed with verified evidence', async ({ page }) => {
  const email = getRequiredEnv('STUDIO_E2E_EMAIL')
  const password = getRequiredEnv('STUDIO_E2E_PASSWORD')

  await page.goto('/')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Einloggen' }).last().click()
  await page.waitForURL(/\/clinician/, { timeout: 15_000 })

  const hardStopPatientId = process.env.STUDIO_E2E_PATIENT_ID_HARDSTOP
  const downgradePatientId = process.env.STUDIO_E2E_PATIENT_ID_DOWNGRADED

  if (!hardStopPatientId || !downgradePatientId) {
    test.skip(true, 'Missing patient IDs for hard-stop guardrail E2E')
  }

  const hardStopResponse = await page.request.get(
    `/api/clinician/patient/${hardStopPatientId}/clinical-intake/latest`,
  )
  expect(hardStopResponse.status()).toBe(200)
  const hardStopJson = await hardStopResponse.json()
  const hardStopIntake = hardStopJson?.intake ?? hardStopJson?.data?.intake
  const hardStopSafety = hardStopIntake?.structured_data?.safety
  const hardStopRules = hardStopSafety?.triggered_rules ?? []
  const hardStopPolicyLevel = hardStopSafety?.policy_result?.escalation_level

  const hardStopRule = hardStopRules.find(
    (rule: any) => rule.level === 'A' || rule.severity === 'A',
  )

  expect(hardStopPolicyLevel).toBe('A')
  expect(hardStopRule?.verified).toBe(true)

  const downgradeResponse = await page.request.get(
    `/api/clinician/patient/${downgradePatientId}/clinical-intake/latest`,
  )
  expect(downgradeResponse.status()).toBe(200)
  const downgradeJson = await downgradeResponse.json()
  const downgradeIntake = downgradeJson?.intake ?? downgradeJson?.data?.intake
  const downgradeSafety = downgradeIntake?.structured_data?.safety
  const downgradeRules = downgradeSafety?.triggered_rules ?? []
  const downgradePolicyLevel = downgradeSafety?.policy_result?.escalation_level

  const downgradeARules = downgradeRules.filter(
    (rule: any) => rule.level === 'A' || rule.severity === 'A',
  )

  if (downgradePolicyLevel === 'A') {
    expect(downgradeARules.length).toBe(0)
  } else {
    expect(downgradePolicyLevel).not.toBe('A')
  }

  downgradeARules.forEach((rule: any) => {
    expect(rule.verified).toBe(true)
  })

  expect(downgradeRules.every((rule: any) => rule.verified || rule.level !== 'A')).toBe(true)
})

test('Policy override persists and effective policy is stable', async ({ page }) => {
  const email = getRequiredEnv('STUDIO_E2E_EMAIL')
  const password = getRequiredEnv('STUDIO_E2E_PASSWORD')
  const patientId = process.env.STUDIO_E2E_PATIENT_ID_OVERRIDE

  if (!patientId) {
    test.skip(true, 'Missing patient ID for policy override E2E')
  }

  await page.goto('/')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Einloggen' }).last().click()
  await page.waitForURL(/\/clinician/, { timeout: 15_000 })

  const latestResponsePromise = page.waitForResponse((response) =>
    response.url().includes(`/api/clinician/patient/${patientId}/clinical-intake/latest`),
  )

  await page.goto(`/clinician/patient/${patientId}`)

  const latestResponse = await latestResponsePromise
  expect(latestResponse.status()).toBe(200)
  const latestJson = await latestResponse.json()
  const latestIntake = latestJson?.intake ?? latestJson?.data?.intake
  const safety = latestIntake?.structured_data?.safety

  expect(safety?.policy_result).toBeTruthy()
  expect(safety?.effective_policy_result).toBeTruthy()

  const intakeId = latestIntake?.id
  expect(intakeId).toBeTruthy()

  const overrideButton = page.getByRole('button', { name: 'Override aendern' })
  if (await overrideButton.isVisible()) {
    await overrideButton.click()
  }

  await page.getByLabel('Level').selectOption('C')
  await page.getByLabel('Begruendung').fill('Test override')

  const overrideResponsePromise = page.waitForResponse((response) => {
    return (
      response.request().method() === 'POST' &&
      response.url().includes(`/api/clinician/patient/${patientId}/clinical-intake/${intakeId}/policy-override`)
    )
  })

  await page.getByRole('button', { name: 'Override speichern' }).click()
  const overrideResponse = await overrideResponsePromise
  expect(overrideResponse.status()).toBe(200)

  const refreshed = await page.request.get(
    `/api/clinician/patient/${patientId}/clinical-intake/latest`,
  )
  expect(refreshed.status()).toBe(200)
  const refreshedJson = await refreshed.json()
  const refreshedIntake = refreshedJson?.intake ?? refreshedJson?.data?.intake
  const refreshedSafety = refreshedIntake?.structured_data?.safety

  expect(refreshedIntake?.policy_override?.override_level).toBe('C')
  expect(refreshedIntake?.policy_override?.reason).toBeTruthy()
  expect(refreshedIntake?.policy_override?.created_by).toBeTruthy()
  expect(refreshedIntake?.policy_override?.created_at).toBeTruthy()
  expect(refreshedSafety?.effective_policy_result?.escalation_level).toBe('C')

  const effectiveCard = page.getByText('Effective Policy Result')
  await expect(effectiveCard).toBeVisible()
  await expect(page.getByText('Level: C')).toBeVisible()
  await expect(page.getByText('Override von')).toBeVisible()
  await expect(page.getByText('Test override')).toBeVisible()
})

test('Policy override requires reason', async ({ page }) => {
  const email = getRequiredEnv('STUDIO_E2E_EMAIL')
  const password = getRequiredEnv('STUDIO_E2E_PASSWORD')
  const patientId = process.env.STUDIO_E2E_PATIENT_ID_OVERRIDE

  if (!patientId) {
    test.skip(true, 'Missing patient ID for policy override E2E')
  }

  await page.goto('/')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Einloggen' }).last().click()
  await page.waitForURL(/\/clinician/, { timeout: 15_000 })

  const latestResponse = await page.request.get(
    `/api/clinician/patient/${patientId}/clinical-intake/latest`,
  )
  expect(latestResponse.status()).toBe(200)
  const latestJson = await latestResponse.json()
  const latestIntake = latestJson?.intake ?? latestJson?.data?.intake
  const intakeId = latestIntake?.id
  const previousOverride = latestIntake?.policy_override ?? null

  await page.goto(`/clinician/patient/${patientId}`)

  const overrideButton = page.getByRole('button', { name: 'Override aendern' })
  if (await overrideButton.isVisible()) {
    await overrideButton.click()
  }

  await page.getByLabel('Level').selectOption('B')
  await page.getByLabel('Begruendung').fill('')

  const overrideResponsePromise = page
    .waitForResponse((response) => {
      return (
        response.request().method() === 'POST' &&
        response.url().includes(`/api/clinician/patient/${patientId}/clinical-intake/${intakeId}/policy-override`)
      )
    }, { timeout: 5_000 })
    .catch(() => null)

  await page.getByRole('button', { name: 'Override speichern' }).click()

  const overrideResponse = await overrideResponsePromise
  if (overrideResponse) {
    expect(overrideResponse.status()).toBeGreaterThanOrEqual(400)
  } else {
    await expect(page.getByText('Bitte einen Grund fuer die Uebersteuerung angeben.')).toBeVisible()
  }

  const refreshed = await page.request.get(
    `/api/clinician/patient/${patientId}/clinical-intake/latest`,
  )
  expect(refreshed.status()).toBe(200)
  const refreshedJson = await refreshed.json()
  const refreshedIntake = refreshedJson?.intake ?? refreshedJson?.data?.intake

  expect(refreshedIntake?.policy_override ?? null).toEqual(previousOverride)
})
