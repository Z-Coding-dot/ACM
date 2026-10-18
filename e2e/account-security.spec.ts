import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createBrowserFixture, login, makeBrowserFixtureGoogleOnly } from './helpers';

for (const platform of [false, true]) {
  test(`${platform ? 'platform' : 'business'} owner changes password and signs in again`, async ({ page, browser }) => {
    test.setTimeout(90000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const fixture = createBrowserFixture(platform);
    await page.goto('/login');
    await page.getByLabel('Email address', { exact: true }).fill(fixture.email);
    await page.getByLabel('Password', { exact: true }).fill(fixture.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(platform ? /\/platform$/ : /\/app\/overview$/);
    // A second real session must be invalidated when this device changes the password.
    const other = await browser.newContext({ baseURL: 'http://127.0.0.1:5174' });
    const otherPage = await other.newPage();
    await otherPage.goto('/login');
    await otherPage.getByLabel('Email address', { exact: true }).fill(fixture.email);
    await otherPage.getByLabel('Password', { exact: true }).fill(fixture.password);
    await otherPage.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(otherPage).toHaveURL(platform ? /\/platform$/ : /\/app\/overview$/);
    const path = platform ? '/platform/account' : '/app/settings#account';
    await page.goto(path);
    const form = page.locator('.password-settings');
    await form.getByLabel('Current password', { exact: true }).fill('WrongPassword123!');
    await form.getByLabel('New password', { exact: true }).fill('ChangedByOwner123!');
    await form.getByLabel('Confirm new password', { exact: true }).fill('Mismatch123!');
    await form.getByRole('button', { name: 'Change password', exact: true }).click();
    await expect(form.getByText('The passwords must match.')).toBeVisible();
    await form.getByLabel('Confirm new password', { exact: true }).fill('ChangedByOwner123!');
    await form.getByRole('button', { name: 'Change password', exact: true }).click();
    await expect(form.getByText('Your current password is incorrect.')).toBeVisible();
    await form.getByLabel('Current password', { exact: true }).fill(fixture.password);
    await form.getByRole('button', { name: 'Change password', exact: true }).click();
    await expect(form.getByRole('status')).toContainText('Password saved');
    expect((await page.request.get('/api/v1/me')).ok()).toBe(true);
    expect((await otherPage.request.get('/api/v1/me')).status()).toBe(401);
    await other.close();
    await page.reload();
    await expect(form.getByLabel('New password', { exact: true })).toHaveValue('');
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    // Mobile headers remain at the top on long pages, with a top-anchored navigation menu.
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      const menu = page.locator(platform ? '.platform-menu-button' : '.mobile-menu-button');
      if (platform && width === 768) continue;
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      await expect(menu).toBeInViewport();
      const header = await page.locator(platform ? '.platform-header' : '.app-header').boundingBox();
      expect(header!.y).toBeLessThanOrEqual(1);
      await menu.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('link', { name: platform ? 'Account settings' : 'Settings', exact: true })).toBeVisible();
      expect((await dialog.boundingBox())!.y).toBeLessThan(40);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(menu).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Change language' }).click();
    await page.getByRole('menuitemradio').last().click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.locator(platform ? '.platform-menu-button' : '.mobile-menu-button').click();
    expect((await page.getByRole('dialog').boundingBox())!.y).toBeLessThan(40);
    await page.keyboard.press('Escape');
    await page.screenshot({ path: `test-results/${platform ? 'platform' : 'business'}-password-mobile-rtl.png`, fullPage: true });
    await page.locator('.language-trigger').click();
    await page.getByRole('menuitemradio').first().click();
    await page.context().clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email address', { exact: true }).fill(fixture.email);
    await page.getByLabel('Password', { exact: true }).fill('ChangedByOwner123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(platform ? /\/platform$/ : /\/app\/overview$/);
  });
}

test('Google-only account sets its first password in settings and then signs in with that password', async ({ page }) => {
  test.setTimeout(90000);
  const fixture = await login(page);
  makeBrowserFixtureGoogleOnly(fixture);
  await page.goto('/app/settings#account');
  const form = page.locator('.password-settings');
  await expect(form.getByRole('heading', { name: 'Set password', exact: true })).toBeVisible();
  await expect(form.getByLabel('Current password', { exact: true })).toHaveCount(0);
  await form.getByLabel('New password', { exact: true }).fill('GoogleEmailPassword123!');
  await form.getByLabel('Confirm new password', { exact: true }).fill('GoogleEmailPassword123!');
  await form.getByRole('button', { name: 'Set password', exact: true }).click();
  await expect(form.getByRole('status')).toContainText('Password saved');
  await expect(form.getByRole('heading', { name: 'Change password', exact: true })).toBeVisible();
  await expect(form.getByLabel('Current password', { exact: true })).toBeVisible();
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(fixture.email);
  await page.getByLabel('Password', { exact: true }).fill('GoogleEmailPassword123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/overview$/);
});
