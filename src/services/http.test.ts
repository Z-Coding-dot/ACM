import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpClient, SESSION_EXPIRED_EVENT } from './http';
import { appointmentService } from './appointments';
import { customerService } from './customers';
import { authService } from './auth';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('Laravel-ready HTTP boundary', () => {
  it('sends the remember preference to the server without storing credentials locally', async () => {
    const session = { user: { id: 'u1', name: 'Owner', email: 'owner@example.com', emailVerified: true }, businesses: [], activeBusinessId: null };
    const fetcher = vi.fn().mockImplementation(url => Promise.resolve(url === '/sanctum/csrf-cookie' ? new Response(null, { status: 204 }) : new Response(JSON.stringify(session)))); vi.stubGlobal('fetch', fetcher);
    const auth = authService(createHttpClient('/api')); await auth.login('owner@example.com', 'password123', true);
    expect(fetcher.mock.calls[0][0]).toBe('/sanctum/csrf-cookie'); expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ email: 'owner@example.com', password: 'password123', remember: true });
    await auth.login('owner@example.com', 'password123'); expect(JSON.parse(fetcher.mock.calls[3][1].body).remember).toBe(false);
    expect(localStorage.getItem('password')).toBeNull();
  });
  it('sends cookie credentials, tenant context, CSRF and typed JSON through one client', async () => {
    document.cookie = 'XSRF-TOKEN=csrf%20value'; const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: 'a' } }), { status: 200 })); vi.stubGlobal('fetch', fetcher);
    await appointmentService(createHttpClient('/api/v1/')).save('b', { customerId: 'c', serviceId: 's', staffId: null, startsAt: '2026-10-15T09:00:00Z', status: 'scheduled', notes: '' });
    expect(fetcher).toHaveBeenCalledWith('/api/v1/appointments', expect.objectContaining({ credentials: 'include', method: 'POST', headers: expect.objectContaining({ 'X-Business-ID': 'b', 'X-XSRF-TOKEN': 'csrf value' }) }));
    document.cookie = 'XSRF-TOKEN=; Max-Age=0';
  });
  it('retains validation fields and translates server failures without rendering backend copy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: { startsAt: ['Backend conflict message'] } }), { status: 422 })));
    await expect(createHttpClient('/api').request('/appointments')).rejects.toMatchObject({ key: 'error.validation', fields: { startsAt: ['Backend conflict message'] } });
  });
  it('invalidates authenticated sessions on 401/419 but does not expire failed logins', async () => {
    const expired = vi.fn(); window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 401 })); vi.stubGlobal('fetch', fetcher);
    await expect(createHttpClient('/api').request('/auth/login')).rejects.toMatchObject({ key: 'error.loginCredentials' }); expect(expired).not.toHaveBeenCalled();
    await expect(createHttpClient('/api').request('/customers', { businessId: 'b' })).rejects.toMatchObject({ status: 401 }); expect(expired).toHaveBeenCalledOnce();
    fetcher.mockResolvedValue(new Response('{}', { status: 419 })); await expect(createHttpClient('/api').request('/auth/account')).rejects.toMatchObject({ key: 'error.sessionExpired' }); expect(expired).toHaveBeenCalledTimes(2);
    window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
  });
  it('rejects offline, timed-out and malformed responses', async () => {
    const offline = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false); await expect(createHttpClient('/api').request('/customers')).rejects.toMatchObject({ key: 'error.offline' }); offline.mockRestore();
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')))))); await expect(createHttpClient('/api', 5).request('/customers')).rejects.toMatchObject({ key: 'error.timeout' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Wrong API base</html>', { status: 200 }))); await expect(createHttpClient('/api').request('/customers')).rejects.toMatchObject({ key: 'error.invalidResponse' });
  });
  it('consumes Laravel pagination and normalizes the directory metadata', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 'c1' }], meta: { current_page: 1, per_page: 1, total: 2, last_page: 2 } }))).mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 'c2' }], meta: { current_page: 2, per_page: 1, total: 2, last_page: 2 } }))); vi.stubGlobal('fetch', fetcher);
    const customers = customerService(createHttpClient('/api')); expect(await customers.list('b')).toEqual([{ id: 'c1' }, { id: 'c2' }]); expect(fetcher).toHaveBeenCalledTimes(2);
    fetcher.mockResolvedValue(new Response(JSON.stringify({ data: [], meta: { current_page: 1, per_page: 6, total: 0, last_page: 1 } }))); expect(await customers.search('b', 'no match', 1)).toEqual({ data: [], meta: { currentPage: 1, perPage: 6, total: 0, lastPage: 1 } });
  });
  it('rejects invalid pagination instead of looping indefinitely', async () => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [], meta: {} })))); await expect(customerService(createHttpClient('/api')).list('b')).rejects.toMatchObject({ key: 'error.invalidResponse' }); });
});
