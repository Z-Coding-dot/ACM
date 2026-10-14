import { test, expect } from '@playwright/test';

test('real Laravel signup, persisted session, logout, login and password reset work with local mail', async ({ page, request }) => {
  const email = `auth-${Date.now()}@example.test`, password = 'TestPassword123!';
  await page.goto('/signup'); await page.getByLabel('Full name', { exact: true }).fill('Test Owner'); await page.getByLabel('Email address', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill(password); await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create an account', exact: true }).click(); await expect(page).toHaveURL(/\/verify-email$/); await expect(page.locator('h1')).toHaveText('Verify your email');
  await page.reload(); await expect(page.locator('h1')).toHaveText('Verify your email'); await expect(page.locator('main')).toContainText(email);
  const session = await page.request.get('/api/v1/me'); expect(session.status()).toBe(200); expect((await session.json()).businesses).toEqual([]);
  await expect.poll(async () => (await (await request.get(`http://127.0.0.1:8025/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json()).messages.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await expect(page).toHaveURL(/\/login$/); expect((await page.request.get('/api/v1/me')).status()).toBe(401);
  await page.getByLabel('Email address', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill(password); await page.getByRole('checkbox', { name: 'Remember me' }).check(); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await expect(page).toHaveURL(/\/verify-email$/);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await page.goto('/forgot-password'); await page.getByLabel('Email address', { exact: true }).fill(email); await page.getByRole('button', { name: 'Send reset link' }).click(); await expect(page.getByRole('status')).toContainText('If an account exists');
  let link = '';
  await expect.poll(async () => {
    const search = await (await request.get(`http://127.0.0.1:8025/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
    const message = search.messages.find((message: { Subject: string }) => message.Subject === 'Reset Password Notification');
    if (!message) return false;
    const detail = await (await request.get(`http://127.0.0.1:8025/api/v1/message/${message.ID}`)).json(); link = detail.Text.match(/http:\/\/127\.0\.0\.1:5174\/reset-password\?[^\s]+/)?.[0] || ''; return !!link;
  }).toBe(true);
  await page.goto(link); await page.getByLabel('Password', { exact: true }).fill('NewTestPassword123!'); await page.getByLabel('Confirm password', { exact: true }).fill('NewTestPassword123!'); await page.getByRole('button', { name: 'Reset password', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Your password has been reset');
  await page.goto('/login'); await page.getByLabel('Email address', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill('NewTestPassword123!'); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await expect(page).toHaveURL(/\/verify-email$/);
});

test('the real HTTP auth boundary rejects missing CSRF and Google reports missing provider configuration', async ({ page, request }) => {
  const rejected = await request.post('/api/v1/auth/signup', { data: { name: 'No CSRF', email: `csrf-${Date.now()}@example.test`, password: 'Password123!', password_confirmation: 'Password123!' } }); expect(rejected.status()).toBe(419);
  await page.goto('/signup'); await page.getByRole('button', { name: 'Continue with Google' }).click(); await expect(page).toHaveURL(/\/login\?oauth=unavailable$/); await expect(page.getByRole('alert')).toContainText('Google sign-in is not connected');
});
