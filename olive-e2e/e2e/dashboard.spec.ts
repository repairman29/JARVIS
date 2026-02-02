import { test, expect } from '@playwright/test'

test.describe('Dashboard (unauthenticated)', () => {
  test.skip(
    ({ baseURL }) => !baseURL || baseURL.includes('localhost'),
    'Redirect test runs when baseURL is production (auth configured)'
  )
  test('redirects to login when not signed in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })
})

test.describe('Dashboard (authenticated)', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const hasAuth = process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD
    if (!hasAuth && testInfo.project.name !== 'chromium-authed') {
      test.skip(true, 'Use saved login (npm run test:e2e:auth-setup then --project=chromium-authed) or set TEST_USER_EMAIL and TEST_USER_PASSWORD')
      return
    }
    if (testInfo.project?.name === 'chromium-authed') {
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
      return
    }
    await page.goto('/login')
    await page.getByPlaceholder(/you@example|email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByPlaceholder(/••••/).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard/, {
      timeout: 20000,
      timeoutMessage: 'Login did not redirect to dashboard. Ensure TEST_USER_EMAIL and TEST_USER_PASSWORD are valid for this environment (e.g. for shopolive.xyz use a user from the same Supabase project).',
    })
  })

  test('shows Olive and main UI', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
    await expect(page.getByTestId('current-haul-card')).toBeVisible()
  })

  test('Budget vs Splurge toggle exists and is clickable', async ({ page }) => {
    await expect(page.getByText(/how should olive pick items/i)).toBeVisible()
    const toggle = page.getByRole('button', { name: /budget/i })
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.getByText(/sale items first, then best price per unit/i)).toBeVisible()
  })

  test('Quantity Strategy toggle exists and is clickable', async ({ page }) => {
    await expect(page.getByText(/how much should olive buy/i)).toBeVisible()
    const card = page.getByTestId('quantity-strategy-card')
    const toggle = card.getByRole('button', { name: /grandma/i })
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.getByText(/exact.*closest match|grandma.*extra/i)).toBeVisible()
  })

  test('quantity merging in list', async ({ page }) => {
    const input = page.getByTestId('manual-add-input')
    const button = page.getByTestId('manual-add-button')
    
    await input.fill('Milk')
    await button.click()
    await input.fill('Milk')
    await button.click()
    
    const haulCard = page.getByTestId('current-haul-card')
    await expect(haulCard.getByText(/Milk ×2/i)).toBeVisible()
  })

  test('quick add buttons add to list', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add milk\?/i }).first().click()
    await expect(page.getByText(/added milk/i)).toBeVisible()
    await expect(page.getByText('Milk').first()).toBeVisible()
  })

  test('add to Kroger cart: no 503, success or connect message', async ({ page }) => {
    await page.getByTestId('manual-add-input').fill('Milk')
    await page.getByTestId('manual-add-button').click()
    await expect(page.getByText(/got it.*milk/i)).toBeVisible()

    const addToCartBtn = page.getByRole('button', { name: /add \d+ item(s)? to kroger cart/i })
    if (!(await addToCartBtn.isVisible().catch(() => false))) {
      return
    }

    await addToCartBtn.click()
    await expect(page.getByText(/finding your items|adding to kroger/i)).toBeVisible({ timeout: 3000 })

    await expect(
      page.getByText(/all done!|please connect your kroger|item results|something went wrong|i couldn't reach kroger|added \d+ item/i)
    ).toBeVisible({ timeout: 15000 })

    await expect(page.getByText(/kroger product search unavailable|503/i)).not.toBeVisible()
  })

  test('add to cart: item results show Added or Couldn\'t add', async ({ page }) => {
    await page.getByTestId('manual-add-input').fill('Milk')
    await page.getByTestId('manual-add-button').click()
    await page.getByTestId('manual-add-input').fill('Bread')
    await page.getByTestId('manual-add-button').click()

    const addToCartBtn = page.getByRole('button', { name: /add \d+ item(s)? to kroger cart/i })
    if (!(await addToCartBtn.isVisible().catch(() => false))) {
      return
    }
    await addToCartBtn.click()

    await expect(
      page.getByText(/all done!|item results|please connect your kroger|added \d+ item/i)
    ).toBeVisible({ timeout: 20000 })

    const resultsSection = page.getByText('Item results').locator('..')
    await expect(resultsSection).toBeVisible()
    await expect(resultsSection.getByText(/Added|Not found|Couldn't add|Out of stock/i)).toBeVisible()
  })

  test('add to cart then open King Soopers cart and verify cart contents', async ({ page, context }) => {
    await page.getByTestId('manual-add-input').fill('Milk')
    await page.getByTestId('manual-add-button').click()

    const addToCartBtn = page.getByRole('button', { name: /add \d+ item(s)? to kroger cart/i })
    if (!(await addToCartBtn.isVisible().catch(() => false))) {
      return
    }

    await addToCartBtn.click()

    await expect(
      page.getByText(/all done!|item results|please connect your kroger|added \d+ item/i)
    ).toBeVisible({ timeout: 20000 })

    // Verify Olive's Item results show Added (or Couldn't add / Out of stock) for accuracy
    const resultsSection = page.getByText('Item results').locator('..')
    await expect(resultsSection).toBeVisible()
    await expect(resultsSection.getByText(/Milk/i)).toBeVisible()
    await expect(resultsSection.getByText(/Added|Couldn't add|Out of stock|Not found/i)).toBeVisible()

    const openCartBtn = page.getByRole('button', { name: /open cart/i })
    if (!(await openCartBtn.isVisible().catch(() => false))) {
      return
    }

    const newPagePromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null)
    await openCartBtn.click()
    const newPage = await newPagePromise
    if (!newPage) {
      return
    }
    await newPage.waitForLoadState('domcontentloaded', { timeout: 20000 })
    await expect(newPage).toHaveURL(/kroger\.com|kingsoopers\.com/)
    await expect(newPage.getByText(/cart|Cart|sign in|Sign in|items? in cart/i).first()).toBeVisible({ timeout: 15000 })
    // Accuracy: cart page should show the item we added (Milk) or an item count when logged in
    const hasMilk = await newPage.getByText(/milk/i).first().isVisible().catch(() => false)
    const hasItemCount = await newPage.getByText(/\d+\s*item|item.*cart/i).first().isVisible().catch(() => false)
    expect(hasMilk || hasItemCount, 'King Soopers cart should show Milk or item count').toBe(true)
    await newPage.close()
  })

  test('recipe modal shows paste link input', async ({ page }) => {
    await page.getByRole('button', { name: /shop for a recipe/i }).click()
    await expect(page.getByText(/paste recipe link/i)).toBeVisible()
    await expect(page.getByPlaceholder(/https:\/\/\.\.\./i)).toBeVisible()
    await page.getByRole('button', { name: /cancel/i }).click()
  })

  test('recipe paste link: Get recipe shows recipe name and Add ingredients to list or error', async ({ page }) => {
    await page.getByRole('button', { name: /shop for a recipe/i }).click()
    const urlInput = page.getByPlaceholder(/https:\/\/\.\.\./i)
    await urlInput.fill('https://www.allrecipes.com/recipe/12345/')
    await page.getByRole('button', { name: /get recipe/i }).click()
    // Either we get an extracted recipe (name + "Add ingredients to list") or an error message
    await expect(
      page.getByRole('button', { name: /add ingredients to list/i }).or(
        page.getByText(/could not extract|network error|recipe extract not configured|missing url/i)
      )
    ).toBeVisible({ timeout: 15000 })
    const addBtn = page.getByRole('button', { name: /add ingredients to list/i })
    if (await addBtn.isVisible().catch(() => false)) {
      await expect(page.getByText(/untitled recipe|[\w\s]+/).first()).toBeVisible()
    }
    await page.getByRole('button', { name: /cancel|back/i }).first().click()
  })

  test('recipe search: search input and results or no results; select recipe shows Add ingredients to list', async ({ page }) => {
    await page.getByRole('button', { name: /shop for a recipe/i }).click()
    await expect(page.getByText(/search more recipes|spoonacular/i)).toBeVisible()
    const searchInput = page.getByPlaceholder(/e\.g\. pasta|chicken stir fry/i)
    await searchInput.fill('pasta')
    await expect(
      page.getByText(/searching|from the web|no results|spoonacular not configured/i)
    ).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(3000)
    const fromTheWeb = page.getByText(/from the web/i)
    if (await fromTheWeb.isVisible().catch(() => false)) {
      const resultsContainer = page.getByText(/from the web/i).locator('..')
      const firstRecipeBtn = resultsContainer.getByRole('button').first()
      if (await firstRecipeBtn.isVisible().catch(() => false)) {
        await firstRecipeBtn.click()
        await expect(page.getByRole('button', { name: /add ingredients to list/i })).toBeVisible({ timeout: 8000 })
        await expect(page.getByText(/servings/i)).toBeVisible()
      }
    }
    await page.getByRole('button', { name: /cancel/i }).first().click()
  })

  test('add ingredients from recipe to list then verify haul', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('olive_haul_items'))
    await page.reload()
    await page.getByRole('button', { name: /shop for a recipe/i }).click()
    const searchInput = page.getByPlaceholder(/e\.g\. pasta|chicken stir fry/i)
    await searchInput.fill('pasta')
    await page.waitForTimeout(3500)
    const fromTheWeb = page.getByText(/from the web/i)
    if (!(await fromTheWeb.isVisible().catch(() => false))) {
      return
    }
    const firstRecipe = page.getByText(/from the web/i).locator('..').locator('..').getByRole('button').first()
    if (!(await firstRecipe.isVisible().catch(() => false))) {
      return
    }
    await firstRecipe.click()
    const addBtn = page.getByRole('button', { name: /add ingredients to list/i })
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      return
    }
    await addBtn.click()
    await expect(page.getByText(/added ingredients for/i)).toBeVisible({ timeout: 10000 })
    const haulCard = page.getByTestId('current-haul-card')
    await expect(haulCard.locator('li').first()).toBeVisible({ timeout: 5000 })
    const itemCount = await haulCard.locator('li').count()
    expect(itemCount).toBeGreaterThan(0)
  })

  test('feedback banner shows after 24h and accepts response', async ({ page }) => {
    await page.evaluate(() => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      localStorage.setItem('olive_cart_opened_at', yesterday)
      localStorage.removeItem('olive_feedback_response')
      localStorage.setItem('olive_cart_item_count', '8')
    })
    await page.reload()
    await expect(page.getByText(/tucked.*into your cart yesterday/i)).toBeVisible()
    await page.getByRole('button', { name: /nailed it/i }).click()
    await expect(page.getByText(/noted those as your favorites/i)).toBeVisible()
  })

  test('progress narrative appears when add-to-cart starts', async ({ page }) => {
    await page.getByTestId('manual-add-input').fill('Milk')
    await page.getByTestId('manual-add-button').click()
    const addToCartBtn = page.getByRole('button', { name: /add \d+ item(s)? to kroger cart/i })
    if (!(await addToCartBtn.isVisible().catch(() => false))) {
      return
    }
    await addToCartBtn.click()
    await expect(page.getByText(/searching for the best price/i)).toBeVisible({ timeout: 5000 })
  })

  test('smart paste parses a blob and adds items', async ({ page }) => {
    await page.getByRole('button', { name: /smart paste/i }).click()
    const modal = page.getByRole('heading', { name: /smart paste/i }).locator('..').locator('..')
    await modal.locator('textarea').fill('2x milk\navocados (soft)\ntrash bags')
    await page.getByRole('button', { name: /sort my list/i }).click()
    await expect(page.getByText(/i found these items/i)).toBeVisible()
    const parsedSection = page.getByText(/i found these items/i).locator('..')
    await expect(parsedSection.getByText(/milk/i)).toBeVisible()
    await expect(parsedSection.getByText(/avocados/i)).toBeVisible()
    await expect(parsedSection.getByText(/trash bags/i)).toBeVisible()
    await page.getByRole('button', { name: /add to list/i }).click()
    const haulCard = page.getByTestId('current-haul-card')
    await expect(haulCard.getByText(/milk/i)).toBeVisible()
    await expect(haulCard.getByText(/avocados/i)).toBeVisible()
    await expect(haulCard.getByText(/trash bags/i)).toBeVisible()
  })

  test('zen mode hides suggestions', async ({ page }) => {
    const focusCard = page.getByTestId('focus-staples-card')
    await focusCard.getByRole('button', { name: /on|off/i }).click()
    await expect(page.getByText(/quick add/i)).not.toBeVisible()
    await expect(page.getByRole('button', { name: /smart paste/i })).not.toBeVisible()
  })

  test('blacklist prevents adding staples', async ({ page }) => {
    // Open Staples card if not visible
    const focusCard = page.getByTestId('focus-staples-card')
    await focusCard.getByPlaceholder(/e.g. salt, flour/i).fill('Milk')
    await focusCard.getByRole('button', { name: /^add$/i }).click()
    
    // Try adding Milk
    await page.getByTestId('manual-add-input').fill('Milk')
    await page.getByTestId('manual-add-button').click()
    
    const haulCard = page.getByTestId('current-haul-card')
    // Wait a bit for potential add
    await page.waitForTimeout(1000)
    await expect(haulCard.locator('li', { hasText: /^milk$/i })).not.toBeVisible()
  })

  test('bulk edit removes selected items', async ({ page }) => {
    // Clear list first
    await page.evaluate(() => localStorage.removeItem('olive_haul_items'))
    await page.reload()

    await page.getByTestId('manual-add-input').fill('Milk')
    await page.getByTestId('manual-add-button').click()
    await page.getByTestId('manual-add-input').fill('Eggs')
    await page.getByTestId('manual-add-button').click()
    
    const haulCard = page.getByTestId('current-haul-card')
    await haulCard.getByRole('checkbox').nth(0).check()
    await haulCard.getByRole('checkbox').nth(1).check()
    await page.getByRole('button', { name: /remove selected/i }).click()
    
    await expect(haulCard.locator('li', { hasText: /milk/i })).not.toBeVisible()
    await expect(haulCard.locator('li', { hasText: /eggs/i })).not.toBeVisible()
  })

  test('offline list loads from local storage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('olive_haul_items', JSON.stringify(['Milk']))
    })
    await page.goto('/dashboard')
    const haulCard = page.getByTestId('current-haul-card')
    await expect(haulCard.getByText('Milk')).toBeVisible()
  })

  test('first run guide shows for new users', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('olive_first_run_done', 'false')
      localStorage.setItem('olive_first_run_step', '0')
    })
    await page.reload()
    await expect(page.getByText(/hi, i'm olive/i)).toBeVisible()
  })
})
