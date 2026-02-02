import { test, expect } from '@playwright/test';

test.describe('JARVIS UI — Smoke', () => {
  test('loads and shows JARVIS header and composer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'JARVIS' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /message jarvis/i })).toBeVisible();
    await expect(page.getByText(/Enter to send/)).toBeVisible();
  });

  test('shows session dropdown and status', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Session:/ })).toBeVisible();
    await expect(page.getByText(/Checking|Reconnecting|Edge|Gateway|Disconnected/)).toBeVisible();
  });

  test('shows Settings and Skills buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('header-settings')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('header-skills')).toBeVisible();
  });

  test('empty state shows session hint', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Send a message to start/)).toBeVisible();
  });
});
