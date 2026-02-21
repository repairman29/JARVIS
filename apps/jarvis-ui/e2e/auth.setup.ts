import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * One-time setup: log in with E2E_LOGIN_PASSWORD and save session to e2e/.auth/user.json.
 * Run when auth is enabled and you want to run specs as an authenticated user:
 *   E2E_LOGIN_PASSWORD=yourpassword npm run test:e2e:auth-setup
 *   E2E_LOGIN_PASSWORD=yourpassword npm run test:e2e
 * (The "chromium-authed" project depends on this and uses the saved storage state.)
 */
const authDir = path.join(__dirname, '.auth');
const authFile = path.join(authDir, 'user.json');

const E2E_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? '';

setup('save logged-in state', async ({ page }) => {
  if (!E2E_PASSWORD) {
    setup.skip(true, 'E2E_LOGIN_PASSWORD not set');
    return;
  }
  fs.mkdirSync(authDir, { recursive: true });
  await page.goto('/login');
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 15_000 });
  await page.context().storageState({ path: authFile });
});
