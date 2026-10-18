import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createBrowserFixture, login } from './helpers';

test('settings preserve edits between sections, save real data and upload a private business logo', async ({ page }) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page);
  for (const height of [600, 720, 900]) {
    await page.setViewportSize({ width: 1440, height });
    const collapse = page.getByRole('button', { name: 'Collapse sidebar' });
    await expect(collapse).toBeInViewport();
    await expect(page.locator('.sidebar .brand')).toHaveText('ACM');
    await expect.poll(async () => { const bounds = await collapse.boundingBox(); return bounds ? Math.ceil(bounds.y + bounds.height) : Infinity; }, { message: `Collapse button must leave bottom space at ${height}px height` }).toBeLessThanOrEqual(height - 16);
    await collapse.click();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeInViewport();
    await expect(page.locator('.workspace-switcher')).toBeHidden();
    await page.getByRole('button', { name: 'Expand sidebar' }).click();
  }
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/app/settings');
  const settingsNav = page.locator('.settings-navigation');
  await page.getByLabel('Business name', { exact: true }).fill('Updated browser workspace');
  await settingsNav.getByRole('link', { name: 'Working hours' }).click();
  await expect(page.locator('.hours-editor')).toBeVisible();
  await settingsNav.getByRole('link', { name: 'Business details' }).click();
  await expect(page.getByLabel('Business name', { exact: true })).toHaveValue('Updated browser workspace');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Changes saved');
  await page.reload();
  await expect(page.getByLabel('Business name', { exact: true })).toHaveValue('Updated browser workspace');
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  await page.getByLabel('Choose image').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: image });
  await page.getByRole('button', { name: 'Save logo' }).click();
  await expect(page.locator('.workspace-avatar img')).toBeVisible();
  await expect(page.locator('.branding-preview img')).toHaveAttribute('src', /\/api\/v1\/businesses\/.*\/logo/);
  await page.getByRole('button', { name: 'Remove logo' }).click();
  await expect(page.locator('.branding-preview img')).toHaveCount(0);
  await settingsNav.getByRole('link', { name: 'Account settings' }).click();
  await expect(page.getByLabel('Current password')).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'test-results/settings-account-desktop.png', fullPage: true });
  await settingsNav.getByRole('link', { name: 'Business details' }).click();
  await page.screenshot({ path: 'test-results/settings-business-desktop.png', fullPage: true });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await expect(page.locator('.settings-card')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), { message: `Settings must fit ${width}px` }).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/settings-business-mobile.png', fullPage: true });
  await page.goto('/platform');
  await expect(page.getByRole('alert')).toContainText('access');
});

test('platform admin can manage users and businesses, publish CMS text, and inspect real analytics', async ({ page }) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const fixture = createBrowserFixture(true);
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(fixture.email);
  await page.getByLabel('Password', { exact: true }).fill(fixture.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/platform$/);
  await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'test-results/platform-overview-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Users', exact: true }).first().click();
  await page.getByRole('button', { name: 'Create user', exact: true }).click();
  let dialog = page.getByRole('dialog');
  const stamp = Date.now(), managedName = `Platform managed ${stamp}`, businessName = `Platform business ${stamp}`;
  const email = `platform-created-${stamp}@example.test`;
  await dialog.getByLabel('Full name').fill(managedName);
  await dialog.getByLabel('Email address').fill(email);
  await dialog.getByLabel('Initial password').fill('BrowserTestPassword123!');
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(dialog).toHaveCount(0, { timeout: 30000 });
  const userRow = page.getByRole('row').filter({ hasText: email });
  await expect(userRow).toBeVisible();
  await userRow.getByRole('button', { name: `Edit ${managedName}` }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Disable this user account').check();
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(userRow).toContainText('Disabled');
  await page.getByRole('link', { name: 'Businesses', exact: true }).first().click();
  await page.getByRole('button', { name: 'Create business', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Business name').fill(businessName);
  await dialog.getByLabel('Owner account email').fill(fixture.email);
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: businessName })).toContainText('Active');
  await page.getByRole('link', { name: 'Public page CMS', exact: true }).click();
  await page.getByLabel('Search', { exact: true }).fill('landing.heroTitle');
  const editor = page.locator('.platform-content-editor').filter({ hasText: 'landing.heroTitle' });
  await editor.locator('textarea').fill('Published from platform browser test');
  await editor.getByRole('button', { name: 'Save draft' }).click();
  await expect(editor.locator('.platform-status')).toHaveText('Draft');
  const publicPage = await page.context().newPage();
  await publicPage.goto('/');
  await expect(publicPage.locator('h1')).not.toContainText('Published from platform browser test');
  await editor.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(editor.locator('.platform-status')).toHaveText('Published');
  await publicPage.reload();
  await expect(publicPage.locator('h1')).toContainText('Published from platform browser test');
  await editor.getByRole('button', { name: 'Restore default' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Restore default' }).click();
  await expect(editor.locator('.platform-status')).toHaveText('Default');
  await publicPage.close();
  await page.getByRole('link', { name: 'Page analytics' }).click();
  await expect(page.locator('.platform-metric').filter({ hasText: 'Page views' }).locator('strong')).not.toHaveText('0');
  await page.getByRole('link', { name: 'Activity log' }).click();
  await expect(page.locator('.platform-table')).toContainText('api/v1/platform/content/{key}');
  await page.goto('/platform');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await expect(page.locator('main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.getByRole('button', { name: 'Change language' }).click();
  await page.getByRole('menuitemradio').last().click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'test-results/platform-overview-dari.png', fullPage: true });
});

test('business owner creates receptionist and staff logins that verify email and enter the assigned business', async ({ page, browser, request }) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page);
  await page.goto('/app/settings#team');
  await expect(page.getByRole('button', { name: 'Create login account', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const created: { email: string; role: string }[] = [];
  for (const role of ['receptionist', 'staff']) {
    const email = `workspace-${role}-${Date.now()}@example.test`;
    await page.getByLabel('Full name', { exact: true }).fill(`New ${role}`);
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Initial password', { exact: true }).fill('WorkspaceInitial123!');
    await page.getByLabel('Workspace role', { exact: true }).selectOption(role);
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/memberships/accounts') && response.request().method() === 'POST'),
      page.getByRole('button', { name: 'Create account and add member' }).click(),
    ]);
    expect(response.status()).toBe(201);
    await expect(page.locator('.membership-row').filter({ hasText: email })).toContainText('Email pending');
    await expect(page.getByLabel('Initial password', { exact: true })).toHaveValue('');
    created.push({ email, role });
  }
  await page.screenshot({ path: 'test-results/settings-workspace-access.png', fullPage: true });
  await page.getByRole('button', { name: 'Add existing account', exact: true }).click();
  await expect(page.getByLabel('Initial password', { exact: true })).toHaveCount(0);
  for (const member of created) {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5174' });
    const memberPage = await context.newPage();
    await memberPage.goto('/login');
    await memberPage.getByLabel('Email address', { exact: true }).fill(member.email);
    await memberPage.getByLabel('Password', { exact: true }).fill('WorkspaceInitial123!');
    await memberPage.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(memberPage).toHaveURL(/\/verify-email$/);
    let verification = '';
    await expect.poll(async () => {
      const search = await (await request.get(`http://127.0.0.1:8025/api/v1/search?query=${encodeURIComponent(`to:${member.email}`)}`)).json();
      if (!search.messages.length) return false;
      const message = await (await request.get(`http://127.0.0.1:8025/api/v1/message/${search.messages[0].ID}`)).json();
      verification = message.Text.match(/http:\/\/127\.0\.0\.1:8001\/email\/verify\/[^\s]+/)?.[0] || '';
      return !!verification;
    }).toBe(true);
    await memberPage.goto(verification);
    await expect(memberPage).toHaveURL(/\/app\/overview$/);
    const session = await (await memberPage.request.get('/api/v1/me')).json();
    expect(session.businesses).toHaveLength(1);
    expect(session.businesses[0].role).toBe(member.role);
    expect(session.user.platformAdmin).toBe(false);
    await context.close();
  }
});
