import { test, expect } from '@playwright/test';

test.describe('JARVIS UI — Settings', () => {
  test('opens Settings modal and shows session ID and backend', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('header-settings')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('header-settings').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('settings-modal-content')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Session ID')).toBeVisible();
    await expect(page.getByText('Backend')).toBeVisible();
    const modal = page.getByTestId('settings-modal-content');
    await expect(modal.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Done' })).toBeVisible();
  });

  test('Done closes Settings modal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('header-settings')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('header-settings').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible({ timeout: 8000 });
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Escape closes Settings modal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('header-settings')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('header-settings').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible({ timeout: 8000 });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
