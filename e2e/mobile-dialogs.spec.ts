import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createBrowserFixture, login } from './helpers';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import fa from '../src/i18n/locales/fa-AF.json' with { type: 'json' };

async function route(page: Page, path: string) {
  await page.evaluate(path => { history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }, path);
  await expect(page.locator('main h1')).toBeVisible();
  if (path.startsWith('/app/')) await expect(page.locator('main')).toHaveAttribute('data-route', path);
}
async function fits(page: Page, dialog = page.getByRole('dialog')) {
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.dialog-heading .button')).toBeInViewport();
  const bounds = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  expect(await dialog.locator('.dialog-body').evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
}
async function reachable(button: Locator) {
  await expect(button).toBeInViewport();
  expect(await button.evaluate(node => {
    const bounds = node.getBoundingClientRect();
    return node.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
  })).toBe(true);
}

test('account menu keeps sign-out visible on phones, short screens and in RTL', async ({ page }) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page);
  for (const messages of [en, fa]) {
    if (messages === fa) { await page.locator('.language-trigger').click(); await page.getByRole('menuitemradio').last().click(); }
    for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 390, height: 300 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(size);
      const trigger = page.getByRole('button', { name: messages['account.menu'], exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await fits(page);
      if (size.width < 768) expect((await dialog.boundingBox())!.y).toBeLessThan(40);
      await reachable(dialog.getByRole('button', { name: messages['account.logout'], exact: true }));
      const scroll = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 500);
      expect(await page.evaluate(() => scrollY)).toBe(scroll);
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    }
  }
  await page.setViewportSize({ width: 390, height: 568 });
  await page.getByRole('button', { name: fa['account.menu'], exact: true }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'test-results/account-dialog-mobile-rtl.png' });
  await page.getByRole('dialog').getByRole('button', { name: fa['account.logout'], exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get('/api/v1/me')).status()).toBe(401);
});

for (const [locale, messages] of [['en', en], ['fa-AF', fa]] as const) {
  test(`business form and confirmation dialogs fit mobile screens in ${locale}`, async ({ page }) => {
    test.setTimeout(150000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await login(page);
    await page.setViewportSize({ width: 320, height: 568 });
    if (locale !== 'en') { await page.locator('.language-trigger').click(); await page.getByRole('menuitemradio').last().click(); }
    await route(page, '/app/services');
    await page.getByRole('button', { name: messages['service.new'], exact: true }).click();
    const dialog = page.getByRole('dialog');
    await fits(page);
    await reachable(dialog.getByRole('button', { name: messages['common.save'], exact: true }));
    const service = `Mobile service ${locale} ${Date.now()}`;
    await dialog.getByLabel(messages['service.name'], { exact: true }).fill(service);
    await dialog.getByLabel(messages['service.description'], { exact: true }).fill('Mobile form description');
    await dialog.getByRole('button', { name: messages['common.save'], exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(service, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: `${messages['common.edit']}: ${service}`, exact: true }).click();
    // Simulate a soft keyboard shrinking only the visual viewport, leaving layout height intact.
    await page.evaluate(() => {
      const viewport = window.visualViewport!;
      Object.defineProperty(viewport, 'height', { configurable: true, value: 300 });
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 40 });
      viewport.dispatchEvent(new Event('resize'));
    });
    await expect.poll(async () => (await dialog.boundingBox())!.y + (await dialog.boundingBox())!.height).toBeLessThanOrEqual(341);
    await reachable(dialog.getByRole('button', { name: messages['common.save'], exact: true }));
    await dialog.getByLabel(messages['service.duration'], { exact: true }).fill('45');
    await expect(dialog.getByLabel(messages['service.duration'], { exact: true })).toBeInViewport();
    await page.evaluate(() => {
      const viewport = window.visualViewport!;
      Reflect.deleteProperty(viewport, 'height'); Reflect.deleteProperty(viewport, 'offsetTop'); viewport.dispatchEvent(new Event('resize'));
    });
    await dialog.getByRole('button', { name: messages['common.save'], exact: true }).click();
    await expect(dialog).toHaveCount(0);

    await route(page, '/app/staff');
    await page.getByRole('button', { name: messages['staff.new'], exact: true }).click();
    await dialog.getByRole('button', { name: messages['hours.addBreak'], exact: true }).first().click();
    await fits(page);
    await reachable(dialog.getByRole('button', { name: messages['common.save'], exact: true }));
    await dialog.locator('.dialog-body').evaluate(node => { node.scrollTop = node.scrollHeight; });
    await expect(dialog.locator('.dialog-heading .button')).toBeInViewport();
    await reachable(dialog.getByRole('button', { name: messages['common.save'], exact: true }));
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `test-results/staff-dialog-mobile-${locale}.png` });
    await dialog.locator('.dialog-heading .button').click();
    await page.getByRole('button', { name: messages['staff.profile'], exact: true }).first().click();
    await fits(page);
    await dialog.locator('.dialog-body').evaluate(node => { node.scrollTop = node.scrollHeight; });
    await dialog.getByRole('button', { name: messages['common.edit'], exact: true }).click();
    await fits(page);
    await page.keyboard.press('Escape');

    await route(page, '/app/appointments/new');
    await page.getByRole('button', { name: messages['customer.new'], exact: true }).click();
    await fits(page);
    await reachable(dialog.getByRole('button', { name: messages['common.save'], exact: true }));
    await dialog.getByLabel(messages['customer.name'], { exact: true }).fill('Mobile Contact');
    await dialog.getByLabel(messages['customer.phone'], { exact: true }).fill('+93 700 888888');
    await dialog.getByRole('button', { name: messages['common.save'], exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await route(page, '/app/customers');
    await page.getByRole('textbox', { name: messages['customer.search'] }).fill('Sara');
    await page.getByRole('link', { name: 'Sara Ahmadi', exact: true }).click();
    await page.getByRole('button', { name: messages['common.edit'], exact: true }).click();
    await fits(page); await page.keyboard.press('Escape');
    await page.getByRole('button', { name: messages['common.archive'], exact: true }).click();
    await fits(page);
    await reachable(dialog.getByRole('button', { name: messages['common.archive'], exact: true }));
    await dialog.getByRole('button', { name: messages['common.cancel'], exact: true }).click();
    await route(page, '/app/appointments');
    await page.getByRole('button', { name: messages['common.filters'], exact: true }).click();
    await fits(page);
    await dialog.getByRole('button', { name: messages['common.close'], exact: true }).last().scrollIntoViewIfNeeded();
    await reachable(dialog.getByRole('button', { name: messages['common.close'], exact: true }).last());
    await page.keyboard.press('Escape');
  });
}

test('platform create dialogs keep actions reachable on a short mobile viewport', async ({ page }) => {
  test.setTimeout(90000);
  const fixture = createBrowserFixture(true);
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(fixture.email);
  await page.getByLabel('Password', { exact: true }).fill(fixture.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/platform$/);
  await page.setViewportSize({ width: 320, height: 400 });
  for (const kind of ['businesses', 'users'] as const) {
    await route(page, `/platform/${kind}`);
    await page.getByRole('button', { name: kind === 'businesses' ? 'Create business' : 'Create user', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await fits(page);
    await reachable(dialog.getByRole('button', { name: 'Save changes', exact: true }));
    await dialog.locator('.dialog-body').evaluate(node => { node.scrollTop = node.scrollHeight; });
    await reachable(dialog.getByRole('button', { name: 'Cancel', exact: true }));
    await dialog.locator('.dialog-heading .button').click();
  }
});
