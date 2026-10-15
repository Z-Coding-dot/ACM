import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './landing-page';
import { ProductInfoPage } from './product-info-page';
import i18n from '../../i18n';
const auth = vi.hoisted(() => ({ session: null as object | null }));
vi.mock('../../app/workspace', () => ({ useAuth: () => auth }));
describe('public product pages', () => {
  beforeEach(async () => { auth.session = null; await i18n.changeLanguage('en'); });
  it('renders public content and genuine signup/login destinations without a session', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your business day.');
    expect(screen.getAllByRole('link', { name: 'Get started' }).every(link => link.getAttribute('href') === '/signup')).toBe(true);
    expect(screen.getAllByRole('link', { name: 'Sign in' }).every(link => link.getAttribute('href') === '/login')).toBe(true);
    expect(screen.getByText('Illustrative workspace · Sample appointments and contacts')).toBeVisible();
  });
  it('keeps public content and offers the dashboard for authenticated visitors', () => {
    auth.session = { user: { name: 'Zia Parsa' } }; render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your business day.');
    expect(screen.getAllByRole('link', { name: 'Open dashboard' }).every(link => link.getAttribute('href') === '/app/overview')).toBe(true);
    expect(screen.getAllByRole('link', { name: "Open Zia Parsa's dashboard" })).toHaveLength(2);
  });
  it('renders translated Dari content and account/data information', async () => {
    await i18n.changeLanguage('fa-AF'); render(<MemoryRouter><ProductInfoPage /></MemoryRouter>);
    expect(document.documentElement).toHaveAttribute('dir', 'rtl'); expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('دربارهٔ ACM');
    expect(screen.getByRole('heading', { name: 'معلومات کسب‌وکار' })).toBeVisible();
  });
});
