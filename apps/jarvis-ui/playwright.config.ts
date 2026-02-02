import { defineConfig, devices } from '@playwright/test';

// E2E uses 3002 by default so tests run when dev server is on 3001. Override with PLAYWRIGHT_BASE_URL.
const defaultPort = 3002;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${defaultPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // When PLAYWRIGHT_BASE_URL is set, use that server (e.g. npm run dev on 3001); otherwise start next dev on defaultPort.
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: `npx next dev -p ${defaultPort}`,
          url: baseURL,
          reuseExistingServer: true,
          timeout: 60_000,
        },
      }),
});
