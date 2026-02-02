import { test, expect } from '@playwright/test';

test.describe('JARVIS UI — Export', () => {
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
