import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../app/workspace';
import { AuthPage } from './auth-page';
import i18n from '../../i18n';
vi.mock('../../services', async () => { const { createMockApi } = await import('../../services/mock/adapter'); return { isDemo: true, api: createMockApi(0) }; });
function mount(mode: 'login' | 'signup' | 'forgot-password') { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AuthProvider><AuthPage mode={mode} /></AuthProvider></MemoryRouter></QueryClientProvider>); }
describe('authentication screens', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });
  it.each([['login', 'Welcome back'], ['signup', 'Create an account'], ['forgot-password', 'Reset your password']] as const)('renders %s', async (mode, title) => { mount(mode); expect(await screen.findByRole('heading', { name: title })).toBeVisible(); });
  it('connects translated errors to invalid form fields', async () => {
    const user = userEvent.setup(); mount('login'); await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeVisible(); expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-describedby', 'auth-email-error');
  });
  it('reports the mock password reset limitation', async () => {
    const user = userEvent.setup(); mount('forgot-password'); await user.type(await screen.findByLabelText('Email address'), 'demo@acm.example'); await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Demo mode cannot send email'));
  });
});
