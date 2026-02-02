import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.test' })

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001'
const isProd = baseURL.includes('shopolive.xyz') || baseURL.includes('vercel.app')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'chromium-authed',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      testMatch: /dashboard\.spec\.ts/,
      grep: /Dashboard \(authenticated\)/,
    },
  ],
  webServer: isProd
    ? undefined
    : {
        command: 'npm run dev -- --port 3001',
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 60_000,
      },
})
