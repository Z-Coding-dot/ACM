import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { AuthProvider, useAuth } from './workspace';
import { SESSION_EXPIRED_EVENT } from '../services/http';
import { api } from '../services';
import type { Session } from '../types/domain';
vi.mock('../services', async () => { const { createMockApi } = await import('../test/adapter'); return { api: createMockApi(0), isDemo: true }; });
function Probe() { const auth = useAuth(); return <><span>{auth.session ? 'signed in' : 'signed out'}</span><button onClick={() => void auth.login('demo@acm.example', 'Demo1234!')}>Login</button><button onClick={() => void auth.switchBusiness('demo-clinic').catch(() => {})}>Switch</button><button onClick={() => void auth.logout()}>Logout</button><button onClick={() => void auth.refreshSession().catch(() => {})}>Refresh</button></>; }
describe('authenticated workspace lifecycle', () => {
  beforeEach(async () => { vi.restoreAllMocks(); await api.auth.logout(); });
  it.each(['Switch', 'Refresh'])('does not restore a private session from a late %s response after logout', async action => {
    const client = new QueryClient(); render(<QueryClientProvider client={client}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Login' })); await screen.findByText('signed in');
    const profile = await api.auth.session(); profile.activeBusinessId = 'demo-clinic';
    let release!: (session: Session) => void;
    const pending = new Promise<Session>(resolve => { release = resolve; });
    const spy = vi.spyOn(api.auth, action === 'Switch' ? 'selectBusiness' : 'session').mockReturnValueOnce(pending);
    await userEvent.click(screen.getByRole('button', { name: action })); expect(spy).toHaveBeenCalled();
    client.setQueryData(['private-contact'], { name: 'Private contact' });
    await userEvent.click(screen.getByRole('button', { name: 'Logout' })); await screen.findByText('signed out');
    await act(async () => { release(profile); await pending; });
    expect(screen.getByText('signed out')).toBeVisible(); expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
  it('removes private query data and protected session state after expiration', async () => {
    const client = new QueryClient(); render(<QueryClientProvider client={client}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Login' })); await screen.findByText('signed in'); client.setQueryData(['demo-salon', 'customers'], [{ name: 'Private test record' }]);
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)); await waitFor(() => expect(screen.getByText('signed out')).toBeVisible()); expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
});
