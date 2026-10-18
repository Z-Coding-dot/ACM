import { expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { createFixtures } from '../src/test/fixtures';
export interface BrowserFixture { email: string; password: string; ids: Record<string, string> }
export function createBrowserFixture(platformAdmin = false): BrowserFixture {
  const email = `browser-${randomUUID()}@example.test`, password = `Test-${randomUUID()}!`;
  const directory = resolve('backend/storage/framework/testing'); mkdirSync(directory, { recursive: true });
  const file = resolve(directory, `browser-${randomUUID()}.json`);
  try {
    writeFileSync(file, JSON.stringify({ email, password, platformAdmin, fixtures: createFixtures() }), { mode: 0o600 });
    const output = execFileSync('php', [resolve('backend/tests/Support/browser-fixture.php'), file], { cwd: resolve('backend'), encoding: 'utf8', timeout: 30000 });
    return { email, password, ...JSON.parse(output) };
  } finally { unlinkSync(file); }
}
export async function login(page: Page, fixture = createBrowserFixture()) {
  await page.goto('/login');
  await signIn(page, fixture);
  return fixture;
}
export function makeBrowserFixtureGoogleOnly(fixture: BrowserFixture) {
  const file = resolve('backend/storage/framework/testing', `browser-${randomUUID()}.json`);
  try {
    writeFileSync(file, JSON.stringify({ action: 'google-only', email: fixture.email, password: fixture.password }), { mode: 0o600 });
    execFileSync('php', [resolve('backend/tests/Support/browser-fixture.php'), file], { cwd: resolve('backend'), encoding: 'utf8', timeout: 30000 });
  } finally { unlinkSync(file); }
}
export async function signIn(page: Page, fixture: BrowserFixture) {
  await page.getByLabel('Email address', { exact: true }).fill(fixture.email); await page.getByLabel('Password', { exact: true }).fill(fixture.password);
  const [response] = await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/auth/login' && response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Sign in', exact: true }).click(),
  ]);
  expect(response.status()).toBe(200);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page).toHaveURL(/\/app\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

// OneDrive/antivirus can briefly lock an existing report on Windows. Retry only
// artifact I/O; accessibility assertions and browser actions are never retried here.
export async function writeAuditReport(path: string, results: unknown) {
  await mkdir('docs/audits', { recursive: true });
  for (let attempt = 0; ; attempt++) {
    try { await writeFile(path, JSON.stringify(results, null, 2)); return; }
    catch (error) {
      if (attempt >= 4 || !['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
      await delay(100 * (attempt + 1));
    }
  }
}
