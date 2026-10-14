import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 45000,
  testMatch: ['app.spec.ts', 'audit.spec.ts', 'landing.spec.ts'],
  outputDir: 'test-results/app',
  expect: { timeout: 10000 }, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5174', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run dev -- --port 5174 --strictPort`, url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI, timeout: 60000 },
});
