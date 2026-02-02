import { test, expect } from '@playwright/test';

test.describe('JARVIS UI — Export', () => {
  test('Run and copy result sends request and shows Copied!', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write']);
    await page.goto('/');
    await page.route('**/api/chat', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      let body: { stream?: boolean };
      try {
        body = route.request().postDataJSON() ?? {};
      } catch {
        return route.fallback();
      }
      if (body?.stream === false) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content: 'run-and-copy-test-response' }),
        });
        return;
      }
      return route.fallback();
    });
    const composer = page.getByRole('textbox', { name: /message jarvis/i });
    await composer.fill('run and copy test');
    await page.getByTestId('run-and-copy').click();
    await expect(page.getByText('Copied!')).toBeVisible({ timeout: 10000 });
  });

  test('Copy thread and Save transcript appear after at least one message', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Copy thread' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Save transcript' })).not.toBeVisible();

    const composer = page.getByRole('textbox', { name: /message jarvis/i });
    const unique = 'msg-export-test';
    await composer.fill(unique);
    await composer.press('Enter');

    await expect(page.locator('.message').filter({ hasText: unique })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Copy thread' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Save transcript' })).toBeVisible();
  });
});
