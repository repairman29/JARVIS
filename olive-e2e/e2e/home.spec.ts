import { test, expect } from '@playwright/test'

test.describe('Home / Landing', () => {
  test('has Olive branding and main CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Olive').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /your kitchen companion/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /join the beta/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /continue with kroger/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /view cart/i })).toBeVisible()
  })

  test('Sign In nav goes to login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('Join the Beta goes to login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /join the beta/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('Continue with Kroger goes to login with then=connect', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /continue with kroger/i }).first().click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/then=connect/)
  })

  test('shows How it Works and FAQ', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/just tell her/i)).toBeVisible()
    await expect(page.getByText(/coupons clipped/i)).toBeVisible()
    await expect(page.getByText(/does olive place the order/i)).toBeVisible()
  })

  test('shows Kroger family stores', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/works with the kroger family/i)).toBeVisible()
    await expect(page.getByText(/king soopers/i)).toBeVisible()
  })
})
