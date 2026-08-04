import { defineConfig, devices } from '@playwright/test';

import { appConfig } from './src/core/config/app.config.js';

export default defineConfig({
  testDir: './tests/ui',

  fullyParallel: false,

  retries: process.env.CI ? 2 : 0,

  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  webServer: {
    command: 'npm run dev:api',
    url: `${appConfig.app.baseUrl}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  use: {
    baseURL: appConfig.app.baseUrl,
    headless: appConfig.browser.headless,

    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  outputDir: 'test-results',
});
