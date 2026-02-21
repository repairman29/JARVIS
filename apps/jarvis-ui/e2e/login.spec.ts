import { test, expect } from '@playwright/test';

const E2E_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? '';

test.describe('JARVIS UI — Login', () => {
  test('login page loads and shows form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'JARVIS' })).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByText('Sign in to continue')).toBeVisible();
  });

  test('submit with empty password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter your password')).toBeVisible({ timeout: 3000 });
  });

  test('submit with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
      page.getByText(/Invalid password|Login failed|Request body required|Password required/, { exact: false })
    ).toBeVisible({ timeout: 8000 });
  });

  test('successful login redirects to home when E2E_LOGIN_PASSWORD is set', async ({ page }) => {
    test.skip(!E2E_PASSWORD, 'Set E2E_LOGIN_PASSWORD to run successful-login test');
    await page.goto('/login');
    await page.getByLabel('Password').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'JARVIS' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /message jarvis/i }).or(page.getByText(/Send a message to start/))).toBeVisible({ timeout: 5000 });
  });

  test('login with from param redirects back after success', async ({ page }) => {
    test.skip(!E2E_PASSWORD, 'Set E2E_LOGIN_PASSWORD to run redirect test');
    await page.goto('/login?from=%2Fdashboard');
    await page.getByLabel('Password').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});
