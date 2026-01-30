import { test, expect } from '@playwright/test'

test.describe('App shell', { tag: '@app' }, () => {
  test('home has document title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/olive|Olive/i)
  })

  test('login page has document title', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/olive|Olive|login/i)
  })

  test('home has one main landmark', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('main')).toHaveCount(1)
  })

  test('login has one main landmark', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('main')).toHaveCount(1)
  })

  test('home nav shows Olive branding and Sign In link', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Olive').first()).toBeVisible()
    const signIn = page.getByRole('link', { name: /sign in/i })
    await expect(signIn).toBeVisible()
    await expect(signIn).toHaveAttribute('href', '/login')
  })

  test('home Sign In link goes to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })
})

test.describe('PWA manifest', { tag: '@app' }, () => {
  test('manifest is served and has Olive name', async ({ request }) => {
    const res = await request.get('/manifest.json')
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json.name).toMatch(/olive/i)
    expect(json.short_name).toMatch(/olive/i)
  })

  test('manifest has start_url and display', async ({ request }) => {
    const res = await request.get('/manifest.json')
    const json = await res.json()
    expect(json.start_url).toBeDefined()
    expect(json.display).toBeDefined()
  })
})

test.describe('Links and navigation', { tag: '@app' }, () => {
  test('home → login → back to home via Olive logo', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
    await page.getByRole('link', { name: /olive/i }).first().click()
    await expect(page).toHaveURL('/')
  })

  test('login Back to home when not configured', async ({ page }) => {
    await page.goto('/login')
    const backLink = page.getByRole('link', { name: /back to home/i })
    if (await backLink.isVisible()) {
      await backLink.click()
      await expect(page).toHaveURL('/')
    }
  })
})
