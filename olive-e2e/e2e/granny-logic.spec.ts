import { test, expect } from '@playwright/test'

test.describe('Granny Logic (authenticated)', () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run authenticated tests'
  )

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/you@example|email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByPlaceholder(/••••/).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Clear list to start fresh
    await page.evaluate(() => localStorage.removeItem('olive_haul_items'))
    await page.reload()
  })

  test('Quantity Strategy toggle exists and is clickable', async ({ page }) => {
    await expect(page.getByText(/how much should olive buy/i)).toBeVisible()
    const card = page.getByTestId('quantity-strategy-card')
    
    // Test Exact
    await card.getByRole('button', { name: /exact/i }).click()
    await expect(card.getByRole('button', { name: /exact/i })).toHaveClass(/bg-white/)
    
    // Test Overshoot (Grandma mode)
    await card.getByRole('button', { name: /grandma/i }).click()
    await expect(card.getByRole('button', { name: /grandma/i })).toHaveClass(/bg-white/)
  })

  test('quantity merging in list', async ({ page }) => {
    const input = page.getByTestId('manual-add-input')
    const button = page.getByTestId('manual-add-button')
    
    await input.fill('Milk')
    await button.click()
    await expect(page.getByText(/got it.*milk/i)).toBeVisible()
    
    await input.fill('Milk')
    await button.click()
    
    const haulCard = page.getByTestId('current-haul-card')
    // Should show "Milk ×2"
    await expect(haulCard.getByText(/Milk ×2/i)).toBeVisible()
  })

  test('smart paste with quantities merges correctly', async ({ page }) => {
    await page.getByRole('button', { name: /smart paste/i }).click()
    const modal = page.getByRole('heading', { name: /smart paste/i }).locator('..').locator('..')
    await modal.locator('textarea').fill('2x milk\n3x milk')
    await page.getByRole('button', { name: /sort my list/i }).click()
    
    // Wait for the results to appear in the modal
    await expect(page.getByText(/i found these items/i)).toBeVisible()
    
    await page.getByRole('button', { name: /add to list/i }).click()
    
    // Check for list content directly
    const haulCard = page.getByTestId('current-haul-card')
    const item = haulCard.locator('li', { hasText: /milk/i }).first()
    await expect(item).toContainText(/×5/i)
  })
})
