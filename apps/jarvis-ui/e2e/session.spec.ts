import { test, expect } from '@playwright/test';

test.describe('JARVIS UI — Session', () => {
  test('Session dropdown opens and shows New session', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Session:/ }).click();
    await expect(page.getByText('+ New session')).toBeVisible({ timeout: 5000 });
  });

  test('New session clears thread and updates session label', async ({ page }) => {
    await page.goto('/');
    const sessionButton = page.getByRole('button', { name: /Session:/ });
    await sessionButton.click();
    await page.getByText('+ New session').click();
    await expect(page.getByText(/Send a message to start/)).toBeVisible({ timeout: 3000 });
    await expect(sessionButton).toBeVisible();
  });
});
