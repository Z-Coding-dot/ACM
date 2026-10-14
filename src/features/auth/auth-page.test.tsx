import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../app/workspace';
import { AuthPage } from './auth-page';
import i18n from '../../i18n';
import { ApiError } from '../../services/errors';
const authApi = vi.hoisted(() => ({ session: vi.fn(), login: vi.fn(), signup: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(), logout: vi.fn(), updateAccount: vi.fn(), selectBusiness: vi.fn() }));
vi.mock('../../services', () => ({ api: { auth: authApi } }));
function mount(mode: 'login' | 'signup' | 'forgot-password') { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AuthProvider><AuthPage mode={mode} /></AuthProvider></MemoryRouter></QueryClientProvider>); }
describe('authentication screens', () => {
  beforeEach(async () => { Object.values(authApi).forEach(mock => mock.mockReset()); authApi.session.mockRejectedValue(new ApiError('error.unauthenticated', 401)); await i18n.changeLanguage('en'); });
  it.each([['login', 'Welcome back'], ['signup', 'Create an account'], ['forgot-password', 'Reset your password']] as const)('renders %s', async (mode, title) => { mount(mode); expect(await screen.findByRole('heading', { name: title })).toBeVisible(); });
  it('connects translated errors to invalid form fields', async () => {
    const user = userEvent.setup(); mount('login'); await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeVisible(); expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-describedby', 'auth-email-error');
  });
  it('reports a failed reset request without claiming delivery', async () => {
    authApi.forgotPassword.mockRejectedValue(new ApiError('error.network', 0));
    const user = userEvent.setup(); mount('forgot-password'); await user.type(await screen.findByLabelText('Email address'), 'owner@example.test'); await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeVisible()); expect(screen.queryByText(/If an account exists/)).not.toBeInTheDocument(); expect(authApi.forgotPassword).toHaveBeenCalledWith('owner@example.test');
  });
  it('toggles password visibility and the remember preference without submitting', async () => {
    const user = userEvent.setup(); mount('login'); const password = await screen.findByLabelText('Password'); await user.type(password, 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Show password' })); expect(password).toHaveAttribute('type', 'text'); expect(password).toHaveValue('Password123!');
    await user.click(screen.getByRole('button', { name: 'Hide password' })); expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('checkbox', { name: 'Remember me' })); expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBeChecked(); expect(screen.getByText('Ask the server to keep you signed in on this device.')).toBeVisible();
  });
  it('shows an honest unavailable state for the unconnected Google provider', async () => {
    const user = userEvent.setup(); mount('signup'); await user.click(await screen.findByRole('button', { name: 'Continue with Google' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Google sign-in is not connected.'); expect(screen.getByRole('heading', { name: 'Create an account' })).toBeVisible();
  });
});
