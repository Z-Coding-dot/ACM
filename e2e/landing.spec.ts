import { test, expect } from '@playwright/test';
import { login } from './helpers';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import fa from '../src/i18n/locales/fa-AF.json' with { type: 'json' };

test('public homepage, account links and information routes work without authentication', async ({ page }) => {
  await page.goto('/'); await expect(page).toHaveURL(/\/$/); await expect(page.locator('h1')).toContainText(en['landing.heroTitle']);
  await expect(page.locator('.public-brand .acm-mark')).toHaveJSProperty('naturalWidth', 270);
  await expect(page.locator('.public-brand')).toHaveText('');
  await expect(page.locator('.public-footer-brand .brand')).toHaveText('');
  await expect(page.locator('.public-footer a[download]')).toHaveCount(0);
  const backTop = page.locator('.public-footer').getByRole('link', { name: en['landing.backTop'], exact: true });
  await expect(backTop).toHaveText(''); await backTop.click(); await expect(page.locator('#public-main')).toBeFocused();
  await page.goto('/');
  await expect(page).toHaveTitle(`${en['landing.metaTitle']} · ${en['app.name']}`); await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', en['landing.metaDescription']);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', en['landing.metaDescription']);
  await page.locator('.public-auth').getByRole('link', { name: 'Get started' }).click(); await expect(page).toHaveURL(/\/signup$/); await expect(page.locator('h1')).toHaveText('Create an account');
  await page.goto('/'); await page.locator('.landing-hero').getByRole('link', { name: 'Sign in', exact: true }).click(); await expect(page).toHaveURL(/\/login$/); await expect(page.locator('h1')).toHaveText('Welcome back');
  await page.goto('/'); await page.getByRole('link', { name: 'Product information', exact: true }).click(); await expect(page.locator('h1')).toHaveText(en['public.title']);
  await page.goto('/'); await page.getByRole('link', { name: en['landing.dataInfo'], exact: true }).click(); await expect(page).toHaveURL(/\/about#data$/); await expect(page.locator('#data')).toBeInViewport(); await expect(page.locator('#data')).toBeFocused();
  await page.goto('/'); await page.locator('.public-sections').getByRole('link', { name: 'Features', exact: true }).click(); await expect(page.locator('#features')).toBeInViewport(); await expect(page.locator('#features')).toBeFocused();
  await page.goto('/'); await expect(page.locator('h1')).toBeVisible(); await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused(); await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveCSS('outline-width', '2px'); await page.keyboard.press('Enter'); await expect(page.locator('#public-main')).toBeFocused();
});

test('signed-in visitors keep the homepage and can return to their dashboard', async ({ page }) => {
  await login(page); await expect(page.locator('main h1')).toHaveText('Your day, at a glance');
  await page.getByRole('button', { name: 'Account menu' }).click(); await page.getByRole('dialog').getByRole('link', { name: 'Back to homepage' }).click();
  await expect(page.locator('h1')).toContainText(en['landing.heroTitle']); await expect(page.locator('.public-auth').getByRole('link', { name: 'Open dashboard' })).toHaveAttribute('href', '/app/overview');
  await expect(page.locator('.public-auth')).toContainText('Zia Parsa'); await expect(page.locator('.public-auth').getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(0);
  await page.locator('.landing-hero').getByRole('link', { name: 'Open dashboard' }).click(); await expect(page.locator('main h1')).toHaveText('Your day, at a glance');
});

test('homepage and information page fit all required widths and pass axe in English and Dari', async ({ page }) => {
  test.setTimeout(240000); const results: { label: string; violations: unknown[] }[] = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [language, messages] of [['en', en], ['fa-AF', fa]] as const) {
    await page.goto('/');
    if (language === 'fa-AF') { await page.getByRole('button', { name: 'Change language' }).click(); await page.getByRole('menuitemradio', { name: 'دری' }).click(); await expect(page.getByRole('menu')).toHaveCount(0); await expect(page.getByRole('button', { name: fa['language.label'] })).toBeFocused(); }
    await expect(page.locator('html')).toHaveAttribute('lang', language); await expect(page.locator('html')).toHaveAttribute('dir', language === 'en' ? 'ltr' : 'rtl');
    await expect(page).toHaveTitle(`${messages['landing.metaTitle']} · ${messages['app.name']}`); await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', messages['landing.metaDescription']);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      for (const path of ['/', '/about']) {
        await page.locator('.public-brand').click();
        if (path === '/about') await page.getByRole('link', { name: messages['landing.productInfo'], exact: true }).click();
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        if (language === 'fa-AF') await expect(page.locator('h1')).toHaveCSS('font-family', /Vazirmatn/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), `${language} ${width} ${path}`).toBe(false);
        if (width <= 900) await expect(page.getByRole('button', { name: messages['landing.menu'], exact: true })).toBeVisible(); else await expect(page.locator('.public-auth a').last()).toBeVisible();
        const label = `${language} ${width} ${path}`; const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze(); results.push({ label, violations: audit.violations });
        await mkdir('docs/audits', { recursive: true }); await writeFile('docs/audits/landing-axe.json', JSON.stringify(results, null, 2)); expect(audit.violations, label).toEqual([]);
        if (path === '/') { await mkdir('docs/screenshots', { recursive: true }); await page.screenshot({ path: `docs/screenshots/landing-${language}-${width}.png`, fullPage: true }); }
      }
    }
  }
});

test('mobile menu handles focus, navigation, signed-in identity and reduced motion', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 320, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto'); const menu = page.getByRole('button', { name: 'Menu', exact: true }); await menu.click();
  const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible(); const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze(); expect(audit.violations).toEqual([]);
  await page.keyboard.press('Escape'); await expect(menu).toBeFocused(); await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click(); await dialog.getByRole('link', { name: en['landing.dataInfo'], exact: true }).click(); await expect(page.locator('#data')).toBeInViewport(); await expect(dialog).toHaveCount(0);
  await login(page); await expect(page.locator('main h1')).toHaveText('Your day, at a glance');
  await page.evaluate(() => { history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }); await expect(page.locator('.public-auth')).toContainText('Zia Parsa'); expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.getByRole('dialog').getByRole('link', { name: 'Open dashboard' }).click(); await expect(page.locator('main h1')).toHaveText('Your day, at a glance');
});

test('auth redesign validates controls, Google availability and all public widths in both languages', async ({ page }) => {
  test.setTimeout(240000); const results: { label: string; violations: unknown[] }[] = [];
  await page.goto('/login'); const password = page.getByLabel('Password', { exact: true }); await password.fill('Password123!'); await page.getByRole('button', { name: 'Show password' }).click(); await expect(password).toHaveAttribute('type', 'text'); await expect(password).toHaveValue('Password123!'); await page.getByRole('button', { name: 'Hide password' }).click(); await expect(password).toHaveAttribute('type', 'password'); await page.getByRole('checkbox', { name: 'Remember me' }).check(); await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();
  await page.goto('/signup'); await page.getByRole('button', { name: 'Continue with Google' }).click(); await expect(page.getByRole('alert')).toContainText('Google sign-in is not connected'); await expect(page).toHaveURL(/\/login\?oauth=unavailable$/);
  for (const [language, messages] of [['en', en], ['fa-AF', fa]] as const) for (const width of [320, 390, 768, 1440]) for (const path of ['/login', '/signup']) {
    await page.setViewportSize({ width, height: 960 }); await page.goto(path); await expect(page.locator('h1')).toBeVisible();
    if (language === 'fa-AF') { await page.getByRole('button', { name: 'Change language' }).click(); await page.getByRole('menuitemradio', { name: 'دری' }).click(); await expect(page.getByRole('menu')).toHaveCount(0); }
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('.auth-main > *')).toHaveCount(1); await expect(page.locator('.auth-main aside')).toHaveCount(0);
    await expect(page.locator('.auth-footer').getByRole('link', { name: messages['landing.backHome'] })).toHaveAttribute('href', '/');
    if (language === 'fa-AF') for (const selector of ['h1', '#auth-email', '.google-sign-in']) await expect(page.locator(selector)).toHaveCSS('font-family', /Vazirmatn/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), `${language} ${width} ${path}`).toBe(false);
    await expect(page.getByRole('button', { name: messages['auth.showPassword'] })).toBeVisible();
    const label = `${language} ${width} ${path}`; const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze(); results.push({ label, violations: audit.violations }); await mkdir('docs/audits', { recursive: true }); await writeFile('docs/audits/auth-design-axe.json', JSON.stringify(results, null, 2)); expect(audit.violations, label).toEqual([]);
    if ([390, 1440].includes(width)) await page.screenshot({ path: `docs/screenshots/auth-${path.slice(1)}-${language}-${width}.png`, fullPage: true });
  }
});
