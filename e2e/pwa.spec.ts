import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
test('production PWA manifest and all raster icons are valid', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest'); expect(response.ok()).toBe(true);
  const manifest = await response.json(); expect(manifest.name).toBe('Appointment & Customer Management'); expect(manifest.display).toBe('standalone'); expect(manifest.start_url).toBe('/');
  expect(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable')).toBe(true);
  for (const icon of manifest.icons as { src: string; sizes: string }[]) { const response = await request.get(icon.src); expect(response.ok()).toBe(true); const buffer = await response.body(); expect(buffer.readUInt32BE(16)).toBe(Number(icon.sizes.split('x')[0])); expect(buffer.readUInt32BE(20)).toBe(Number(icon.sizes.split('x')[1])); }
});
test('install event received before login remains usable and is consumed once', async ({ page }) => {
  await page.goto('/login'); await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.evaluate(() => {
    const event = Object.assign(new Event('beforeinstallprompt'), { prompt: async () => { document.documentElement.dataset.promptCalls = '1'; }, userChoice: Promise.resolve({ outcome: 'dismissed' }) }); window.dispatchEvent(event);
  });
  await expect(page.getByRole('button', { name: 'Install app' })).toBeVisible(); await page.getByRole('button', { name: 'Explore demo workspace' }).click(); await page.getByRole('button', { name: 'Install app' }).click(); await expect(page.locator('html')).toHaveAttribute('data-prompt-calls', '1'); await expect(page.getByRole('button', { name: 'Install app' })).not.toBeVisible();
});
test('an actual waiting service worker displays the update notification and reloads on request', async ({ page }) => {
  const original = await readFile('dist/sw.js', 'utf8');
  try {
    await page.goto('/login'); await page.getByRole('button', { name: 'Explore demo workspace' }).click(); await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await writeFile('dist/sw.js', `${original}\n// Frontend update audit ${Date.now()}\n`);
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration?.update(); });
    await expect(page.getByText('An app update is ready. Save your work before reloading.')).toBeVisible(); await page.getByRole('button', { name: 'Reload app' }).click(); await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  } finally { await writeFile('dist/sw.js', original); }
});
test('service worker caches the shell, excludes API data, and supports offline startup', async ({ page, context }) => {
  await page.goto('/login'); await page.getByRole('button', { name: 'Explore demo workspace' }).click(); await expect(page.getByRole('heading', { name: 'Your day, at a glance' })).toBeVisible();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 30000 });
  const cached = await page.evaluate(async () => { const keys = await caches.keys(); const urls = []; for (const key of keys) { const cache = await caches.open(key); for (const request of await cache.keys()) urls.push(request.url); } return urls; });
  expect(cached.some(url => new URL(url).pathname === '/index.html')).toBe(true); expect(cached.some(url => /\/api\/|\/sanctum\//.test(new URL(url).pathname))).toBe(false);
  await context.setOffline(true); await page.reload(); await expect(page.getByRole('heading', { name: 'You’re offline' })).toBeVisible(); await page.getByRole('button', { name: 'Change language' }).click(); await page.getByRole('menuitemradio', { name: 'دری' }).click(); await expect(page.locator('html')).toHaveAttribute('dir', 'rtl'); await expect(page.getByRole('heading', { name: 'به اینترنت وصل نیستید' })).toBeVisible(); await context.setOffline(false);
});
test('the public homepage and information route remain available from the offline shell', async ({ page, context }) => {
  await page.goto('/'); await expect(page.locator('h1')).toContainText('Your business day.'); await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true); await page.reload(); await expect(page.locator('h1')).toContainText('Your business day.');
  await page.getByRole('button', { name: 'Change language' }).click(); await page.getByRole('menuitemradio', { name: 'دری' }).click(); await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('.public-footer').getByRole('link', { name: 'معلومات محصول', exact: true }).click(); await expect(page.locator('h1')).toHaveText('درباره این پیش‌نمایش برنامه'); await context.setOffline(false);
});
