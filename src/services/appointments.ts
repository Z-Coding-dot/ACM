import type { Api } from './contracts';
import type { Appointment, AppointmentInput } from '../types/domain';
import type { HttpClient } from './http';
import { ApiError } from './errors';
import { apiResource } from './resource';
export function appointmentService(client: HttpClient): Api['appointments'] {
  const resource = apiResource<Appointment, AppointmentInput>(client, '/appointments');
  return { ...resource,
    async search(bid, filters) {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, value!]));
      const data: Appointment[] = [];
      for (let page = 1; ; page++) {
        params.set('page', String(page));
        const response = await client.request<{ data: Appointment[]; meta: { last_page: number } }>(`/appointments?${params}`, { businessId: bid });
        if (!Array.isArray(response.data) || !Number.isInteger(response.meta?.last_page) || response.meta.last_page < 1 || page > 1000) throw new ApiError('error.invalidResponse', 502);
        data.push(...response.data);
        if (page >= response.meta.last_page) return data;
      }
    },
    async availability(businessId, serviceId, staffId, date, excludeId) { const params = new URLSearchParams({ serviceId, date, ...(staffId ? { staffId } : {}), ...(excludeId ? { excludeId } : {}) }); return (await client.request<{ data: string[] }>(`/availability?${params}`, { businessId })).data; },
    async setStatus(businessId, id, status) { return (await client.request<{ data: Appointment }>(`/appointments/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status }, businessId })).data; },
  };
}
