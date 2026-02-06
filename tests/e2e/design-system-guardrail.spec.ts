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

test.skip(shouldSkipE2E, 'Missing Studio E2E Supabase environment variables.')

test('design system cards keep semantic tokens', async ({ page }) => {
  const email = getRequiredEnv('STUDIO_E2E_EMAIL')
  const password = getRequiredEnv('STUDIO_E2E_PASSWORD')

  await page.goto('/')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(password)
  await page.getByRole('button', { name: 'Einloggen' }).last().click()

  await page.waitForURL(/\/clinician/, { timeout: 15_000 })
  await page.goto('/admin/design-system')

  const basicCardTitle = page.getByText('Basic Card')
  const basicCardContainer = basicCardTitle.locator(
    'xpath=ancestor::div[contains(@class, "bg-card")][1]'
  )

  await expect(basicCardContainer).toBeVisible()
  const cardClass = (await basicCardContainer.getAttribute('class')) || ''
  expect(cardClass).toContain('bg-card')
  expect(cardClass).toContain('border-border')
  expect(cardClass).not.toContain('bg-neutral')

  const table = page.getByRole('table')
  const tableContainer = table.locator('xpath=ancestor::div[contains(@class, "bg-card")][1]')
  const tableClass = (await tableContainer.getAttribute('class')) || ''
  expect(tableClass).toContain('bg-card')
  expect(tableClass).toContain('border-border')
  expect(tableClass).not.toContain('bg-neutral')

  const select = page.getByLabel('Select Dropdown')
  const selectClass = (await select.getAttribute('class')) || ''
  expect(selectClass).toContain('bg-card')
  expect(selectClass).toContain('border-border')
})
