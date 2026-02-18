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

  test('Session hydrate: when GET /api/session returns messages, thread shows them on load', async ({ page }) => {
    const hydratedUser = 'E2E hydrate user';
    const hydratedAssistant = 'E2E hydrate assistant';
    await page.route('**/api/session*', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: hydratedUser },
            { role: 'assistant', content: hydratedAssistant },
          ],
        }),
      });
    });
    await page.goto('/');
    await expect(page.getByText(hydratedUser)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(hydratedAssistant)).toBeVisible({ timeout: 3000 });
  });
});
