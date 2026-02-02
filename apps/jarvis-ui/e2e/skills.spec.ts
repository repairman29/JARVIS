import { test, expect } from '@playwright/test';

test.describe('JARVIS UI — Skills', () => {
  test('opens Skills panel and shows skill list', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('header-skills')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('header-skills').click();
    await expect(page.getByTestId('skills-panel-title')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Web Search').first()).toBeVisible();
    await expect(page.getByText('Launcher').first()).toBeVisible();
    await expect(page.getByTestId('skills-panel-close')).toBeVisible();
  });

  test('Close button closes Skills panel', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('header-skills')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('header-skills').click();
    await expect(page.getByTestId('skills-panel-title')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('skills-panel-close').click();
    await expect(page.getByTestId('skills-panel-title')).not.toBeVisible();
  });

  test('Escape closes Skills panel', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('header-skills')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('header-skills').click();
    await expect(page.getByTestId('skills-panel-title')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('skills-panel-title')).not.toBeVisible();
  });
});
