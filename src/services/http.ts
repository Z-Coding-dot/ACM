import { ApiError } from './errors';
export interface HttpClient { request<T>(path: string, options?: { method?: string; body?: unknown; businessId?: string }): Promise<T> }
const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
export const http: HttpClient = {
  async request<T>(path: string, options = {}): Promise<T> {
    const { method = 'GET', body, businessId } = options as { method?: string; body?: unknown; businessId?: string };
    if (!navigator.onLine) throw new ApiError('error.offline', 0);
    try {
      const response = await fetch(`${base}${path}`, {
        method, credentials: 'include', headers: {
          Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(businessId ? { 'X-Business-ID': businessId } : {}),
          ...csrfHeader(),
        }, body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const keys: Record<number, string> = { 401: 'error.unauthenticated', 403: 'error.forbidden', 404: 'error.notFound', 409: 'error.conflict', 419: 'error.sessionExpired', 422: 'error.validation', 429: 'error.rateLimit' };
        throw new ApiError(keys[response.status] || 'error.generic', response.status, data.errors || {});
      }
      if (response.status === 204) return undefined as T;
      return await response.json() as T;
    } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError('error.network', 0); }
  },
};
function csrfHeader(): Record<string, string> {
  const value = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.slice(11);
  return value ? { 'X-XSRF-TOKEN': decodeURIComponent(value) } : {};
}
