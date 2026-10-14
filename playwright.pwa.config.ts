import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: 'pwa.spec.ts', workers: 1, timeout: 60000,
  outputDir: 'test-results/pwa', expect: { timeout: 15000 },
  reporter: 'list', use: { baseURL: 'http://127.0.0.1:4174', ...devices['Desktop Chrome'] },
  webServer: { command: `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run preview -- --port 4174 --strictPort`, url: 'http://127.0.0.1:4174', reuseExistingServer: !process.env.CI },
});
