import { test, expect } from '@playwright/test';
import fa from '../src/i18n/locales/fa-AF.json' with { type: 'json' };

test('real Laravel signup, persisted session, logout, login and password reset work with local mail', async ({ page, request }) => {
  const email = `auth-${Date.now()}@example.test`, password = 'TestPassword123!';
  await page.goto('/signup'); await page.getByLabel('Full name', { exact: true }).fill('Test Owner'); await page.getByLabel('Email address', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill(password); await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create an account', exact: true }).click(); await expect(page).toHaveURL(/\/verify-email$/); await expect(page.locator('h1')).toHaveText('Verify your email');
  await page.reload(); await expect(page.locator('h1')).toHaveText('Verify your email'); await expect(page.locator('main')).toContainText(email);
  const session = await page.request.get('/api/v1/me'); expect(session.status()).toBe(200); expect((await session.json()).businesses).toEqual([]);
  await expect.poll(async () => (await (await request.get(`http://127.0.0.1:8025/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json()).messages.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await expect(page).toHaveURL(/\/login$/); expect((await page.request.get('/api/v1/me')).status()).toBe(401);
  await page.getByLabel('Email address', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill(password); await page.getByRole('checkbox', { name: 'Remember me' }).check(); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await expect(page).toHaveURL(/\/verify-email$/);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await expect(page).toHaveURL(/\/login$/); expect((await page.request.get('/api/v1/me')).status()).toBe(401); await page.goto('/forgot-password'); await page.getByLabel('Email address', { exact: true }).fill(email); await page.getByRole('button', { name: 'Send reset link' }).click(); await expect(page.getByRole('status')).toContainText('If an account exists');
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

test('Dari email verification and onboarding persist a workspace and the intended protected destination', async ({ page, request }) => {
  test.setTimeout(90000);
  const email = `onboarding-${Date.now()}@example.test`;
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/app/customers/new'); await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('link', { name: 'New here? Create an account' }).click();
  await page.getByRole('button', { name: 'Change language' }).click(); await page.getByRole('menuitemradio', { name: fa['language.fa-AF'] }).click();
  await page.getByLabel(fa['customer.name'], { exact: true }).fill('Verified Owner'); await page.getByLabel(fa['customer.email'], { exact: true }).fill(email); await page.getByLabel(fa['auth.password'], { exact: true }).fill('TestPassword123!'); await page.getByLabel(fa['auth.confirmPassword']).fill('TestPassword123!');
  await page.getByRole('button', { name: fa['auth.signup'], exact: true }).click(); await expect(page).toHaveURL(/\/verify-email$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  let verification = '', html = '';
  await expect.poll(async () => {
    const search = await (await request.get(`http://127.0.0.1:8025/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
    if (!search.messages.length) return false;
    const message = await (await request.get(`http://127.0.0.1:8025/api/v1/message/${search.messages[0].ID}`)).json(); html = message.HTML;
    verification = message.Text.match(/http:\/\/127\.0\.0\.1:8001\/email\/verify\/[^\s]+/)?.[0] || ''; return !!verification;
  }).toBe(true);
  expect(html).toContain('lang="fa-AF"'); expect(html).toContain('dir="rtl"');
  await page.goto(verification); await expect(page).toHaveURL(/\/onboarding\?returnTo=/);
  await expect(page.locator('h1')).toHaveText(fa['onboarding.title']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  await page.getByLabel(fa['settings.businessName']).fill('Verified business'); await page.getByLabel(fa['settings.industry']).selectOption('education'); await page.getByLabel(fa['settings.timezone']).selectOption('Asia/Kabul'); await page.getByLabel(fa['settings.currency']).selectOption('USD');
  await page.getByRole('button', { name: fa['onboarding.createAction'] }).click(); await expect(page).toHaveURL(/\/app\/customers\/new$/);
  await page.reload(); await expect(page.locator('main h1')).toHaveText(fa['customer.new']);
  const session = await (await page.request.get('/api/v1/me')).json(); expect(session.user.emailVerified).toBe(true); expect(session.businesses).toHaveLength(1); expect(session.businesses[0]).toMatchObject({ name: 'Verified business', industry: 'education', locale: 'fa-AF', currency: 'USD', timeZone: 'Asia/Kabul', role: 'owner' });
});
