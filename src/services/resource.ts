import type { HttpClient } from './http';
import type { Resource } from './contracts';
export function apiResource<T, I>(client: HttpClient, path: string): Resource<T, I> {
  return {
    async list(businessId) {
      const data: T[] = [];
      // Consume Laravel pagination explicitly; don't silently truncate directories.
      for (let page = 1; ; page++) {
        const response = await client.request<{ data: T[]; meta: { last_page: number } }>(`${path}?page=${page}&per_page=100`, { businessId });
        data.push(...response.data);
        if (page >= response.meta.last_page) return data;
        if (page >= 1000) throw new Error('Pagination limit exceeded');
      }
    },
    async get(businessId, id) { return (await client.request<{ data: T }>(`${path}/${encodeURIComponent(id)}`, { businessId })).data; },
    async save(businessId, body, id) { return (await client.request<{ data: T }>(`${path}${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PATCH' : 'POST', body, businessId })).data; },
  };
}
