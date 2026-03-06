import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: 'https://business.rekovr.ai',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/, teardown: 'teardown' },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/business-admin.json',
        launchOptions: {
          args: ['--enable-webgl', '--use-gl=swiftshader'],
        },
      },
      dependencies: ['setup'],
    },
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
      use: { storageState: undefined },
    },
  ],
});
