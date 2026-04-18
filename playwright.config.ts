import { defineConfig, devices } from '@playwright/test';
import { config, ENV } from './config/env';

console.log(`Running tests against: ${ENV} (${config.baseUrl})`);

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : [['html']],
  use: {
    baseURL: config.baseUrl,
    trace: 'on-first-retry',
  },

  projects: [
    // API suite — no browser, runs once
    {
      name: 'api',
      testDir: './tests/api',
    },

    // UI auth suite — three browsers
    {
      name: 'chromium',
      testDir: './tests/auth',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/auth',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests/auth',
      use: { ...devices['Desktop Safari'] },
    },

    // End-to-end business scenarios — chromium only for speed
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },

    // Visual regression — chromium only (screenshots are browser-specific)
    {
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'] },
    },

    // Accessibility smoke — chromium only
    {
      name: 'a11y',
      testDir: './tests/a11y',
      use: { ...devices['Desktop Chrome'] },
    },

    // Health checks — chromium only
    {
      name: 'health',
      testDir: './tests/health',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
