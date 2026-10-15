import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider, useAuth } from './workspace';
import { SESSION_EXPIRED_EVENT } from '../services/http';
vi.mock('../services', async () => { const { createMockApi } = await import('../test/adapter'); return { api: createMockApi(0), isDemo: true }; });
function Probe() { const auth = useAuth(); return <><span>{auth.session ? 'signed in' : 'signed out'}</span><button onClick={() => void auth.login('demo@acm.example', 'Demo1234!')}>Login</button></>; }
describe('authenticated workspace lifecycle', () => {
  it('removes private query data and protected session state after expiration', async () => {
    const client = new QueryClient(); render(<QueryClientProvider client={client}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Login' })); await screen.findByText('signed in'); client.setQueryData(['demo-salon', 'customers'], [{ name: 'Private test record' }]);
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)); await waitFor(() => expect(screen.getByText('signed out')).toBeVisible()); expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
});
