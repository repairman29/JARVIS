import { test, expect } from '@playwright/test'

// ─── User stories (As a … I want … So that …) ─────────────────────────────
// Each describe maps to a user story; tests verify acceptance.

test.describe('As a visitor I want to understand what Olive does so that I can decide to try it', { tag: '@user-story' }, () => {
  test('landing shows value prop and main actions', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /taking the.*chore.*out of the grocery store/i })).toBeVisible()
    await expect(page.getByText(/tell olive what you need/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /join the beta/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /continue with kroger/i })).toBeVisible()
  })

  test('How it Works explains the flow', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/just tell her/i)).toBeVisible()
    await expect(page.getByText(/coupons clipped/i)).toBeVisible()
    await expect(page.getByText(/does olive place the order/i)).toBeVisible()
  })

  test('I can open Kroger cart link in a new tab', async ({ page, context }) => {
    await page.goto('/')
    const cartLink = page.getByRole('link', { name: /view kroger cart/i })
    await expect(cartLink).toHaveAttribute('href', /kroger\.com.*cart/)
    await expect(cartLink).toHaveAttribute('target', '_blank')
  })
})

test.describe('As a visitor I want to sign in or create an account so that I can use Olive', { tag: '@user-story' }, () => {
  test('Sign In from home goes to login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('Join the Beta goes to login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /join the beta/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page shows form and can toggle to create account', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder(/you@example|email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/••••/)).toBeVisible()
    await page.getByRole('button', { name: /new here.*create an account/i }).click()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('invalid credentials keep me on login with error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/you@example|email/i).fill('test@example.com')
    await page.getByPlaceholder(/••••/).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })
})

test.describe('As a visitor I want to start with Kroger so that I go straight to connecting my account after sign-in', { tag: '@user-story' }, () => {
  test('Continue with Kroger from home goes to login with then=connect', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /continue with kroger/i }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/then=connect/)
  })

  test('login with ?then=connect shows connect-first message', async ({ page }) => {
    await page.goto('/login?then=connect')
    await expect(page.getByText(/sign in, then we.*connect kroger/i)).toBeVisible()
  })

  test('Continue with Kroger link on login adds then=connect', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /continue with kroger/i }).click()
    await expect(page).toHaveURL(/then=connect/)
  })
})

test.describe('As an unauthenticated user I must not see the dashboard so that I sign in first', { tag: '@user-story' }, () => {
  test('visiting /dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('As a signed-in user I want to see my list and add/remove items so that I build my haul', { tag: '@user-story' }, () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run'
  )

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/you@example|email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByPlaceholder(/••••/).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('dashboard shows Olive message and list area', async ({ page }) => {
    await expect(page.getByText(/what's missing from the kitchen|list is empty/i)).toBeVisible()
    await expect(page.getByPlaceholder(/milk, eggs, bread/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^add$/i })).toBeVisible()
  })

  test('I can add an item and see it in Current Haul', async ({ page }) => {
    await page.getByPlaceholder(/milk, eggs, bread/i).fill('Milk')
    await page.getByRole('button', { name: /^add$/i }).click()
    await expect(page.getByText(/got it.*milk/i)).toBeVisible()
    await expect(page.getByText('Milk').first()).toBeVisible()
  })

  test('I can remove an item from the list', async ({ page }) => {
    await page.getByPlaceholder(/milk, eggs, bread/i).fill('Bread')
    await page.getByRole('button', { name: /^add$/i }).click()
    await expect(page.getByText('Bread').first()).toBeVisible()
    await page.getByRole('button', { name: /remove/i }).click()
    await expect(page.getByText('Bread')).not.toBeVisible()
  })

  test('quick add buttons add items to the list', async ({ page }) => {
    await page.getByRole('button', { name: /^milk$/i }).first().click()
    await expect(page.getByText(/added milk/i)).toBeVisible()
    await expect(page.getByText('Milk').first()).toBeVisible()
  })
})

test.describe('As a signed-in user I want to choose how Olive picks items (preferences vs deals)', { tag: '@user-story' }, () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run'
  )

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/you@example|email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByPlaceholder(/••••/).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('Budget vs Splurge options are visible and clickable', async ({ page }) => {
    await expect(page.getByText(/how should olive pick items/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /your preferences/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /best deals/i })).toBeVisible()
    await page.getByRole('button', { name: /best deals/i }).click()
    await expect(page.getByText(/lowest price from search/i)).toBeVisible()
  })
})

test.describe('As a signed-in user I want to sign out so that my session is secure', { tag: '@user-story' }, () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run'
  )

  test('Sign Out is visible and returns to home after sign out', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/you@example|email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByPlaceholder(/••••/).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('As a signed-in user without Kroger I want to connect Kroger so that I can add to cart', { tag: '@user-story' }, () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run'
  )

  test('Connect Kroger card is shown when not connected', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/you@example|email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByPlaceholder(/••••/).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    // If already connected this card may be hidden; if not, it should be there
    const connectCard = page.getByRole('button', { name: /connect/i })
    await expect(connectCard.or(page.getByText(/kroger connected/i))).toBeVisible()
  })
})
