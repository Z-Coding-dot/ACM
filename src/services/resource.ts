import type { HttpClient } from './http';
import { ApiError } from './errors';
import type { Resource } from './contracts';
export function apiResource<T, I>(client: HttpClient, path: string): Resource<T, I> {
  return {
    async list(businessId) {
      const data: T[] = [];
      // Consume Laravel pagination explicitly; don't silently truncate directories.
      for (let page = 1; ; page++) {
        const response = await client.request<{ data: T[]; meta: { last_page: number } }>(`${path}?page=${page}&per_page=100`, { businessId });
        if (!Array.isArray(response.data) || !Number.isInteger(response.meta?.last_page) || response.meta.last_page < 1) throw new ApiError('error.invalidResponse', 502);
        data.push(...response.data);
        if (page >= response.meta.last_page) return data;
        if (page >= 1000) throw new ApiError('error.invalidResponse', 502);
      }
    },
    async get(businessId, id) { return (await client.request<{ data: T }>(`${path}/${encodeURIComponent(id)}`, { businessId })).data; },
    async save(businessId, body, id) { await client.csrf(); return (await client.request<{ data: T }>(`${path}${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PATCH' : 'POST', body, businessId })).data; },
    async archive(businessId, id) { await client.csrf(); await client.request<void>(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE', businessId }); },
  };
}
