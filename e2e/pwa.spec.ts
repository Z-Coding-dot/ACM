import { test, expect } from '@playwright/test';
test('production PWA manifest and all raster icons are valid', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest'); expect(response.ok()).toBe(true);
  const manifest = await response.json(); expect(manifest.name).toBe('Appointment & Customer Manager'); expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable')).toBe(true);
  for (const icon of manifest.icons as { src: string; sizes: string }[]) { const response = await request.get(icon.src); expect(response.ok()).toBe(true); const buffer = await response.body(); expect(buffer.readUInt32BE(16)).toBe(Number(icon.sizes.split('x')[0])); expect(buffer.readUInt32BE(20)).toBe(Number(icon.sizes.split('x')[1])); }
});
test('service worker caches the shell, excludes API data, and supports offline startup', async ({ page, context }) => {
  await page.goto('/login'); await page.getByRole('button', { name: 'Explore demo workspace' }).click(); await expect(page.getByRole('heading', { name: 'Your day, at a glance' })).toBeVisible();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 30000 });
  const cached = await page.evaluate(async () => { const keys = await caches.keys(); const urls = []; for (const key of keys) { const cache = await caches.open(key); for (const request of await cache.keys()) urls.push(request.url); } return urls; });
  expect(cached.some(url => new URL(url).pathname === '/index.html')).toBe(true); expect(cached.some(url => /\/api\/|\/sanctum\//.test(new URL(url).pathname))).toBe(false);
  await context.setOffline(true); await page.reload(); await expect(page.getByRole('heading', { name: 'You’re offline' })).toBeVisible(); await page.getByRole('button', { name: 'Change language' }).click(); await page.getByRole('menuitemradio', { name: 'دری' }).click(); await expect(page.locator('html')).toHaveAttribute('dir', 'rtl'); await expect(page.getByRole('heading', { name: 'به اینترنت وصل نیستید' })).toBeVisible(); await context.setOffline(false);
});
