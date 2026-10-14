import { ApiError } from './errors';
export const SESSION_EXPIRED_EVENT = 'acm:session-expired';
export interface RequestOptions { method?: string; body?: unknown; businessId?: string }
export interface HttpClient { request<T>(path: string, options?: RequestOptions): Promise<T> }
export function createHttpClient(baseUrl: string, timeoutMs = 15000): HttpClient {
  const base = baseUrl.replace(/\/$/, '');
  return {
    async request<T>(path: string, { method = 'GET', body, businessId }: RequestOptions = {}): Promise<T> {
      if (!navigator.onLine) throw new ApiError('error.offline', 0);
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${base}${path}`, {
          method, credentials: 'include', signal: controller.signal,
          headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(businessId ? { 'X-Business-ID': businessId } : {}), ...csrfHeader() },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const keys: Record<number, string> = { 401: path === '/auth/login' ? 'error.loginCredentials' : 'error.unauthenticated', 403: 'error.forbidden', 404: 'error.notFound', 409: 'error.conflict', 419: 'error.sessionExpired', 422: 'error.validation', 429: 'error.rateLimit' };
          if ([401, 419].includes(response.status) && !['/auth/login', '/auth/signup', '/auth/forgot-password'].includes(path) && (path !== '/auth/session' || response.status === 419)) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
          throw new ApiError(keys[response.status] || 'error.generic', response.status, data?.errors && typeof data.errors === 'object' ? data.errors : {});
        }
        if (response.status === 204) return undefined as T;
        try { return await response.json() as T; } catch { throw new ApiError('error.invalidResponse', 502); }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(controller.signal.aborted ? 'error.timeout' : 'error.network', 0);
      } finally { clearTimeout(timeout); }
    },
  };
}
function csrfHeader(): Record<string, string> {
  const value = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.slice(11);
  try { return value ? { 'X-XSRF-TOKEN': decodeURIComponent(value) } : {}; } catch { return {}; }
}
export const http = createHttpClient(import.meta.env.VITE_API_BASE_URL || '/api/v1');
