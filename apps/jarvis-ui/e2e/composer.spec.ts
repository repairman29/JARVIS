import { test, expect } from '@playwright/test';

test.describe('JARVIS UI — Composer', () => {
  test('composer accepts input and shows slash hint', async ({ page }) => {
    await page.goto('/');
    const composer = page.getByRole('textbox', { name: /message jarvis/i });
    await composer.fill('hello');
    await expect(composer).toHaveValue('hello');
    await expect(page.getByText(/\/clear.*\/session.*\/tools/)).toBeVisible();
  });

  test('/clear clears thread without sending message', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const composer = page.getByRole('textbox', { name: /message jarvis/i });
    const unique = 'msg-clear-test';
    await composer.fill(unique);
    await composer.press('Enter');
    await expect(page.locator('.message').filter({ hasText: unique })).toBeVisible({ timeout: 8000 });
    await composer.fill('/clear');
    await composer.press('Enter');
    await expect(page.locator('.message').filter({ hasText: unique })).not.toBeVisible();
    await expect(page.getByText(/Send a message to start/)).toBeVisible();
  });

  test('/tools opens Skills panel', async ({ page }) => {
    await page.goto('/');
    const composer = page.getByRole('textbox', { name: /message jarvis/i });
    await expect(composer).toBeVisible({ timeout: 10000 });
    await composer.fill('/tools');
    await composer.press('Enter');
    await expect(page.getByTestId('skills-panel-title')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Web Search').first()).toBeVisible();
  });

  test('Escape clears composer', async ({ page }) => {
    await page.goto('/');
    const composer = page.getByRole('textbox', { name: /message jarvis/i });
    await composer.fill('escape-test-text');
    await composer.focus();
    await page.keyboard.press('Escape');
    await expect(composer).toHaveValue('');
  });
});
