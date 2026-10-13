import type { Api } from './contracts';
import type { Customer, CustomerInput } from '../types/domain';
import type { HttpClient } from './http';
import { apiResource } from './resource';
export function customerService(client: HttpClient): Api['customers'] {
  return { ...apiResource<Customer, CustomerInput>(client, '/customers'),
    async search(businessId, search, page) { const r = await client.request<{ data: Customer[]; meta: { current_page: number; per_page: number; total: number; last_page: number } }>(`/customers?${new URLSearchParams({ search, page: String(page), per_page: '6' })}`, { businessId }); return { data: r.data, meta: { currentPage: r.meta.current_page, perPage: r.meta.per_page, total: r.meta.total, lastPage: r.meta.last_page } }; },
  };
}
