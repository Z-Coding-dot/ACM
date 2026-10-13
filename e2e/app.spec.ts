import { expect, test, type Page } from '@playwright/test';
async function login(page: Page) { await page.goto('/login'); await page.getByRole('button', { name: 'Explore demo workspace' }).click(); await expect(page.getByRole('heading', { name: 'Your day, at a glance' })).toBeVisible(); }
async function route(page: Page, path: string) { await page.evaluate(path => { history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }, path); if (path.startsWith('/app/')) await expect(page.locator('main')).toHaveAttribute('data-route', path); }
async function nextWorkingDate(page: Page) { return page.evaluate(() => { const now = new Date(); now.setUTCDate(now.getUTCDate() + 2); if (now.getUTCDay() === 5) now.setUTCDate(now.getUTCDate() + 1); return now.toISOString().slice(0, 10); }); }
test('authentication validates without fabricated email or signup success', async ({ page }) => {
  await page.goto('/login'); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await page.getByRole('link', { name: 'New here? Create an account' }).click(); await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
  await page.getByLabel('Full name').fill('Test User'); await page.getByLabel('Email address').fill('test@example.com'); await page.getByLabel('Password', { exact: true }).fill('Password123!'); await page.getByRole('button', { name: 'Create an account', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Account creation is unavailable');
  await page.goto('/forgot-password'); await page.getByLabel('Email address').fill('test@example.com'); await page.getByRole('button', { name: 'Send reset link' }).click(); await expect(page.getByRole('alert')).toContainText('Demo mode cannot send email');
});
test('booking validates, adds a contact, reviews, reschedules, and confirms cancellation', async ({ page }) => {
  await login(page); await page.getByRole('link', { name: 'Book appointment', exact: true }).click(); await page.getByRole('button', { name: 'Review appointment' }).click(); await expect(page.getByText('This field is required.').first()).toBeVisible();
  await page.getByRole('button', { name: 'Add contact', exact: true }).click(); const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Full name').fill('Booking Contact'); await dialog.getByLabel('Email address').fill('booking@example.com'); await dialog.getByLabel('Phone number').fill('+93 700 888888'); await dialog.getByRole('button', { name: 'Save changes' }).click(); await expect(dialog).not.toBeVisible();
  await page.getByLabel('Service', { exact: true }).selectOption({ index: 1 }); await page.getByLabel('Team member', { exact: true }).selectOption({ index: 1 }); await page.getByLabel('Date', { exact: true }).fill(await nextWorkingDate(page));
  await expect(page.getByLabel('Available time').locator('option')).not.toHaveCount(1); await page.getByLabel('Available time').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Review appointment' }).click(); await expect(page.getByText('Booking Contact', { exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.getByRole('heading', { name: 'Appointment details' })).toBeVisible(); await expect(page.getByRole('status')).toContainText('demo session');
  await page.getByRole('button', { name: 'Mark confirmed' }).click(); await expect(page.locator('.page-actions')).toContainText('Confirmed');
  await page.getByRole('link', { name: 'Reschedule' }).click(); await page.getByLabel('Available time').selectOption({ index: 2 }); await page.getByRole('button', { name: 'Review appointment' }).click(); await page.getByRole('button', { name: 'Confirm booking' }).click(); await expect(page.getByRole('heading', { name: 'Appointment details' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel appointment', exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(page.locator('.page-actions')).toContainText('Confirmed');
  await page.getByRole('button', { name: 'Cancel appointment', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Cancel appointment', exact: true }).click(); await expect(page.locator('.page-actions')).toContainText('Cancelled');
});
test('contacts search, pagination, editing, and empty states', async ({ page }) => {
  await login(page); await page.getByRole('link', { name: 'Customers', exact: true }).click(); await expect(page.getByText('Page 1 of 2')).toBeVisible(); await page.getByRole('button', { name: 'Next', exact: true }).click(); await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await page.getByRole('textbox', { name: 'Search name, email, or phone' }).fill('no matching person'); await expect(page.getByRole('heading', { name: 'No matching records' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search name, email, or phone' }).fill('Sara'); await page.getByRole('link', { name: 'Sara Ahmadi', exact: true }).click(); await page.getByRole('button', { name: 'Edit', exact: true }).click(); await page.getByLabel('Phone number', { exact: true }).fill('x'); await page.getByRole('button', { name: 'Save changes' }).click(); await expect(page.getByText('Enter a valid phone number.')).toBeVisible(); await page.getByLabel('Phone number', { exact: true }).fill('+93 700 888999'); await page.getByRole('button', { name: 'Save changes' }).click(); await expect(page.getByText('+93 700 888999', { exact: true })).toBeVisible();
});
test('navigation, tenant industries, services and staff are usable', async ({ page }) => {
  await login(page);
  for (const name of ['Calendar', 'Appointments', 'Customers', 'Services', 'Stylists', 'Settings']) {
    const link = page.locator('.sidebar nav').getByRole('link', { name, exact: true }); await link.click(); await expect(page.getByRole('heading', { name, exact: true })).toBeVisible(); await expect(link).toHaveAttribute('aria-current', 'page');
  }
  await page.getByLabel('Switch demo workspace').selectOption('demo-clinic'); await expect(page.locator('.sidebar nav').getByRole('link', { name: 'Patients', exact: true })).toBeVisible(); await expect(page.locator('.sidebar nav').getByRole('link', { name: 'Practitioners', exact: true })).toBeVisible();
  await page.getByLabel('Switch demo workspace').selectOption('demo-education'); await expect(page.locator('.sidebar nav').getByRole('link', { name: 'Students', exact: true })).toBeVisible();
  await route(page, '/app/services'); await page.getByRole('button', { name: 'Add service' }).click(); await page.getByLabel('Service name').fill('Extra session'); await page.getByLabel('Duration (minutes)').fill('45'); await page.getByLabel('Price (AFN)').fill('500'); await page.getByRole('button', { name: 'Save changes' }).click(); await expect(page.getByText('Extra session', { exact: true })).toBeVisible();
  await route(page, '/app/staff'); await page.getByRole('button', { name: 'Team profile' }).first().click(); await expect(page.getByRole('dialog').getByRole('heading', { name: 'Working hours' })).toBeVisible(); await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await route(page, '/app/appointments/missing'); await expect(page.getByRole('alert')).toContainText('could not be found');
  await route(page, '/unknown'); await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
test('calendar navigation, list alternative, and time-slot selection', async ({ page }) => {
  await login(page); await page.getByRole('link', { name: 'Calendar', exact: true }).first().click(); await page.getByRole('button', { name: 'Day', exact: true }).click(); const old = await page.locator('.calendar-period').textContent(); await page.getByRole('button', { name: 'Next period' }).click(); await expect(page.locator('.calendar-period')).not.toHaveText(old!);
  await page.getByRole('button', { name: 'List', exact: true }).click(); await expect(page.locator('.calendar-list')).toBeVisible(); await page.getByRole('button', { name: 'Day', exact: true }).click(); await page.getByLabel('Date', { exact: true }).fill(await nextWorkingDate(page)); const slot = page.locator('.calendar-slot a').first(); await expect(slot).toBeVisible(); await slot.click(); await expect(page.getByRole('heading', { name: 'Book appointment', level: 1 })).toBeVisible(); await expect(page).toHaveURL(/time=/);
});
test('offline blocks mutations and shows the fallback', async ({ page, context }) => {
  await login(page); await route(page, '/app/customers/new'); await context.setOffline(true); await page.getByLabel('Full name').fill('Offline Contact'); await page.getByLabel('Email address').fill('offline@example.com'); await page.getByLabel('Phone number').fill('+93 700 777777'); await page.getByRole('button', { name: 'Save changes' }).click(); await expect(page.getByRole('alert')).toContainText('You’re offline'); await page.locator('.offline-banner a').click(); await expect(page.getByRole('heading', { name: 'You’re offline' })).toBeVisible(); await context.setOffline(false);
});
test('all target widths and both directions fit the viewport', async ({ page }) => {
  test.setTimeout(180000); await login(page);
  for (const locale of ['en', 'fa-AF']) {
    if (locale === 'fa-AF') { await page.getByRole('button', { name: 'Change language' }).click(); await page.getByRole('menuitemradio', { name: 'دری' }).click(); }
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'en' ? 'ltr' : 'rtl');
    for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      for (const path of ['/app/overview', '/app/calendar', '/app/appointments', '/app/appointments/new', '/app/customers', '/app/customers/new', '/app/services', '/app/staff', '/app/settings']) {
        await route(page, path); await expect(page.locator('main h1')).toBeVisible(); await expect(page.locator('main .loading')).toHaveCount(0);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); expect(overflow, `${locale} ${width}px ${path}`).toBe(false);
        if ((width === 390 || width === 1440) && ['/app/overview', '/app/calendar', '/app/appointments/new', '/app/settings'].includes(path)) await page.screenshot({ path: `docs/screenshots/${locale}-${width}-${path.split('/').at(-1)}.png`, fullPage: true });
        if (width < 1024) await expect(page.locator('.mobile-navigation')).toBeVisible();
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.locator('.mobile-navigation').getByRole('button').click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('dialog').getByRole('link', { name: 'تنظیمات', exact: true }).click(); await expect(page.getByRole('heading', { name: 'تنظیمات', exact: true })).toBeVisible();
});
