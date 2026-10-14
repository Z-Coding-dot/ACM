import { defineConfig, devices } from '@playwright/test';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
export default defineConfig({
  testDir: './e2e', testMatch: 'backend-auth.spec.ts', workers: 1, timeout: 60000,
  outputDir: 'test-results/backend', reporter: 'list', expect: { timeout: 10000 },
  use: { baseURL: 'http://127.0.0.1:5174', ...devices['Desktop Chrome'], trace: 'retain-on-failure' },
  webServer: [
    { command: 'php artisan serve --env=browser --host=127.0.0.1 --port=8001', cwd: './backend', url: 'http://127.0.0.1:8001/up', reuseExistingServer: false, timeout: 60000 },
    { command: `${npm} run dev -- --mode e2e --port 5174 --strictPort`, url: 'http://127.0.0.1:5174', reuseExistingServer: false, timeout: 60000 },
  ],
});
