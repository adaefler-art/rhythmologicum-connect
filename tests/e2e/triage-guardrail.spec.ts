import { test, expect } from '@playwright/test'

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

test('triage does not spin forever or spam diagnosis logs', async ({ page }) => {
  const email = getRequiredEnv('STUDIO_E2E_EMAIL')
  const password = getRequiredEnv('STUDIO_E2E_PASSWORD')
  const diagnosisLogs: string[] = []

  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('[triage-diagnose]')) {
      diagnosisLogs.push(text)
    }
  })

  await page.goto('/')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Einloggen' }).last().click()

  await page.waitForURL(/\/clinician/, { timeout: 15_000 })
  await page.goto('/clinician/triage')

  const spinnerText = page.getByText('Triage-Übersicht wird geladen…')
  await expect(spinnerText).toHaveCount(0, { timeout: 10_000 })
  await expect(page.getByRole('heading', { name: 'Triage / Übersicht' })).toBeVisible()

  await page.waitForTimeout(1_000)
  expect(diagnosisLogs.length).toBeLessThanOrEqual(1)
})
