import { test as setup } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

/**
 * One-time setup: open login, you log in with Google (e.g. jeffadkins1@gmail.com),
 * then this saves your session so e2e can run as you.
 *
 * Run once (with browser visible):
 *   npm run test:e2e:auth-setup
 *
 * For prod: PLAYWRIGHT_TEST_BASE_URL=https://shopolive.xyz npm run test:e2e:auth-setup
 *
 * Then run dashboard tests with saved login:
 *   npm run test:e2e:dashboard-authed
 */
const authDir = path.join(__dirname, '..', '.auth')
const authFile = path.join(authDir, 'user.json')

setup('save logged-in state', async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true })
  await page.goto('/login')
  // You have 2 minutes to sign in with Google (or email/password) in the browser
  await page.waitForURL(/\/dashboard/, { timeout: 120_000 })
  await page.context().storageState({ path: authFile })
})
