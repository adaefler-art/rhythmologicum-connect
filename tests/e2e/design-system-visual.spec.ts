import { test, expect } from '@playwright/test'

/**
 * Design System Visual Regression Tests
 * 
 * These tests ensure the design system components match the visual baseline
 * from docs/mobile reference.
 * 
 * Rules enforced: R-VIS-01, R-VIS-02
 * 
 * To update baselines after approved design changes:
 * npx playwright test design-system-visual --update-snapshots
 */

test.describe('Design System Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the design system showcase page
    await page.goto('/admin/design-system')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
  })

  test('R-VIS-01: Card components match reference', async ({ page }) => {
    // Find the Cards section
    const cardsSection = page.locator('section').filter({ has: page.getByText('Cards') }).first()
    
    // Wait for cards to be visible
    await expect(cardsSection).toBeVisible()
    
    // Take snapshot of the entire cards section
    await expect(cardsSection).toHaveScreenshot('cards-section.png', {
      // Allow for slight font rendering differences
      maxDiffPixelRatio: 0.02,
      // Ignore animations
      animations: 'disabled',
    })
    
    // Check individual card patterns if needed
    const basicCard = cardsSection.locator('[data-slot="card"]').first()
    if (await basicCard.isVisible()) {
      await expect(basicCard).toHaveScreenshot('basic-card.png', {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      })
    }
  })

  test('R-VIS-02: Input components match reference', async ({ page }) => {
    // Find the Form Components section
    const formSection = page.locator('section').filter({ has: page.getByText('Form Components') }).first()
    
    // Wait for form to be visible
    await expect(formSection).toBeVisible()
    
    // Take snapshot of the entire form components section
    await expect(formSection).toHaveScreenshot('form-components-section.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
    
    // Check individual input if data-slot is available
    const textInput = formSection.locator('[data-slot="input"]').first()
    if (await textInput.isVisible()) {
      await expect(textInput).toHaveScreenshot('text-input.png', {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      })
    }
  })

  test('R-VIS-03: Table components match reference', async ({ page }) => {
    // Find the Table section
    const tableSection = page.locator('section').filter({ has: page.getByText('Table') }).first()
    
    // Wait for table to be visible
    await expect(tableSection).toBeVisible()
    
    // Take snapshot of the table section
    await expect(tableSection).toHaveScreenshot('table-section.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })

  test('R-VIS-04: Button components match reference', async ({ page }) => {
    // Find the Buttons section
    const buttonsSection = page.locator('section').filter({ has: page.getByText('Buttons') }).first()
    
    // Wait for buttons to be visible
    await expect(buttonsSection).toBeVisible()
    
    // Take snapshot of the buttons section
    await expect(buttonsSection).toHaveScreenshot('buttons-section.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
      // Exclude loading button which may have animation
      mask: [page.locator('button:has-text("Loading")')],
    })
  })

  test('Color palette matches reference', async ({ page }) => {
    // Find the Color Palette section
    const colorSection = page.locator('section').filter({ has: page.getByText('Color Palette') }).first()
    
    // Wait for colors to be visible
    await expect(colorSection).toBeVisible()
    
    // Take snapshot of the color palette
    await expect(colorSection).toHaveScreenshot('color-palette-section.png', {
      maxDiffPixelRatio: 0.01, // Stricter threshold for colors
      animations: 'disabled',
    })
  })

  test('Typography matches reference', async ({ page }) => {
    // Find the Typography section
    const typographySection = page.locator('section').filter({ has: page.getByText('Typography') }).first()
    
    // Wait for typography to be visible
    await expect(typographySection).toBeVisible()
    
    // Take snapshot of the typography section
    await expect(typographySection).toHaveScreenshot('typography-section.png', {
      maxDiffPixelRatio: 0.03, // More lenient for font rendering
      animations: 'disabled',
    })
  })
})

test.describe('Design System Component Presence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/design-system')
    await page.waitForLoadState('networkidle')
  })

  test('All major sections are present', async ({ page }) => {
    // Verify all key sections exist
    await expect(page.getByText('Buttons')).toBeVisible()
    await expect(page.getByText('Cards')).toBeVisible()
    await expect(page.getByText('Form Components')).toBeVisible()
    await expect(page.getByText('Table')).toBeVisible()
    await expect(page.getByText('Alerts')).toBeVisible()
    await expect(page.getByText('Modal / Dialog')).toBeVisible()
    await expect(page.getByText('Color Palette')).toBeVisible()
    await expect(page.getByText('Typography')).toBeVisible()
    await expect(page.getByText('Spacing Scale')).toBeVisible()
  })

  test('Page header displays correctly', async ({ page }) => {
    await expect(page.getByText('Design System v0.4')).toBeVisible()
    await expect(page.getByText('Comprehensive showcase of UI components and design tokens')).toBeVisible()
  })
})
